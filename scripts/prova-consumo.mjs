#!/usr/bin/env node
// PROVA da MEDIÇÃO + APLICAÇÃO de uso por org (billing camada 2). Testa a função SQL atômica
// consumir_ou_bloquear direto (é o ponto de aplicação — fonte única) + o fluxo REAL do
// search-leads bloqueando quando o limite do plano estoura (forçando um limite baixo, como o
// teto de US$50 foi provado). Limpa tudo (contadores/limite do plano de teste) ao fim.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}
const URL_SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const OPTS = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_SB, SERVICE, OPTS);

let pass = 0,
  fail = 0;
const T = (c, n, e = "") => {
  if (c) {
    pass++;
    console.log(`  \x1b[32mOK\x1b[0m   · ${n}`);
  } else {
    fail++;
    console.log(`  \x1b[31mX\x1b[0m    · ${n}${e ? ` → ${e}` : ""}`);
  }
};
const rpc = (fn, args) => admin.rpc(fn, args).then((r) => r.data);
const mes = () => new Date().toISOString().slice(0, 7);

const limpeza = [];
try {
  console.log("\x1b[1mPROVA — medição + limite de uso por org\x1b[0m\n");

  // orgs reais: A (dono, super_admin, ilimitado) e B (gevieski, Starter)
  const { data: orgs } = await admin.from("orgs").select("id, nome, plano_id, dono_user_id");
  const orgA = orgs.find((o) => o.nome === "marcosg1.pereira");
  const orgB = orgs.find((o) => o.nome === "gevieskiagency");

  // zera o consumo do mês das duas para começar limpo (e restaura no fim)
  for (const o of [orgA, orgB]) {
    limpeza.push(() => admin.from("consumo_org").delete().eq("org_id", o.id).eq("mes_ref", mes()));
    await admin.from("consumo_org").delete().eq("org_id", o.id).eq("mes_ref", mes());
  }

  // ---------- 1) incremento conta no recurso certo ----------
  const r1 = await rpc("consumir_ou_bloquear", { p_org: orgB.id, p_recurso: "leads", p_n: 3 });
  T(r1.ok === true && r1.usado === 3, "consumir 3 leads → usado=3", JSON.stringify(r1));
  const { data: linha } = await admin
    .from("consumo_org")
    .select("leads, sites")
    .eq("org_id", orgB.id)
    .eq("mes_ref", mes())
    .single();
  T(
    linha.leads === 3 && linha.sites === 0,
    "gravou em 'leads', não em 'sites'",
    JSON.stringify(linha),
  );

  // ---------- 2) bloqueio ao bater o limite (forçando limite baixo) ----------
  // cria um plano de teste com limite 5 e aponta a org B pra ele
  const { data: planoT } = await admin
    .from("planos")
    .insert({ nome: "[TESTE] limite5", preco: 0, periodo: "mensal", limite_leads: 5 })
    .select("id")
    .single();
  // ordem de limpeza importa: restaurar o plano da org ANTES de apagar o plano de teste
  // (orgs.plano_id referencia planos — apagar o plano em uso viola a FK). A execução é
  // reversa (LIFO), então empurro PRIMEIRO o delete do plano e DEPOIS o restore da org.
  limpeza.push(() => admin.from("planos").delete().eq("id", planoT.id));
  limpeza.push(() => admin.from("orgs").update({ plano_id: orgB.plano_id }).eq("id", orgB.id));
  await admin.from("orgs").update({ plano_id: planoT.id }).eq("id", orgB.id);

  // já consumiu 3; pedir +2 cabe (total 5), pedir +1 depois estoura
  const r2 = await rpc("consumir_ou_bloquear", { p_org: orgB.id, p_recurso: "leads", p_n: 2 });
  T(
    r2.ok === true && r2.usado === 5 && r2.perto === true,
    "chega a 5/5 (perto=true)",
    JSON.stringify(r2),
  );
  const r3 = await rpc("consumir_ou_bloquear", { p_org: orgB.id, p_recurso: "leads", p_n: 1 });
  T(
    r3.ok === false && r3.reason === "limite_atingido" && r3.usado === 5,
    "além do limite → BLOQUEADO (usado continua 5, não incrementou)",
    JSON.stringify(r3),
  );

  // ---------- 3) orgs diferentes / limites diferentes ----------
  const limB = await rpc("estado_consumo", { p_org: orgB.id, p_recurso: "leads" });
  const limA = await rpc("estado_consumo", { p_org: orgA.id, p_recurso: "leads" });
  T(limB.limite === 5, "org B (plano teste) tem limite 5", JSON.stringify(limB));
  T(limA.limite === null, "org A (super_admin) é ILIMITADA (limite null)", JSON.stringify(limA));
  // super_admin nunca é bloqueada
  const rA = await rpc("consumir_ou_bloquear", { p_org: orgA.id, p_recurso: "leads", p_n: 9999 });
  T(rA.ok === true, "super_admin consome 9999 leads sem bloqueio");

  // ---------- 4) por-org: consumir em B não mexe no contador de A ----------
  const cA = (
    await admin
      .from("consumo_org")
      .select("leads")
      .eq("org_id", orgA.id)
      .eq("mes_ref", mes())
      .single()
  ).data;
  T(cA.leads === 9999, "contador de A independente do de B (por-org)", JSON.stringify(cA));

  // ---------- 5) reset mensal: mês diferente = contador zerado ----------
  // grava consumo num mês futuro fictício e confirma que o mês corrente não enxerga
  await admin.from("consumo_org").insert({ org_id: orgB.id, mes_ref: "2099-01", leads: 999 });
  limpeza.push(() =>
    admin.from("consumo_org").delete().eq("org_id", orgB.id).eq("mes_ref", "2099-01"),
  );
  const estadoAgora = await rpc("estado_consumo", { p_org: orgB.id, p_recurso: "leads" });
  T(
    estadoAgora.usado === 5,
    "mês corrente ignora consumo de outro mês (reset mensal)",
    JSON.stringify(estadoAgora),
  );

  // ---------- 6) fluxo REAL: search-leads bloqueia a org no limite ----------
  // org B já está em 5/5 no plano teste → uma busca real deve vir com erro de limite
  const { data: lk } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: "gevieskiagency@gmail.com",
  });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  const resp = await fetch(`${URL_SB}/functions/v1/search-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${se.session.access_token}`,
      apikey: ANON,
    },
    body: JSON.stringify({
      nicho: "restaurante",
      cidade: "Curitiba",
      uf: "PR",
      limite: 10,
      buscarEmails: false,
      fonte: "geoapify",
    }),
  });
  const txt = await resp.text();
  const bloqueou = /Limite de leads do seu plano atingido/.test(txt);
  T(bloqueou, "search-leads REAL bloqueia a org no limite do plano", txt.slice(0, 160));
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
} finally {
  for (const f of limpeza.reverse()) {
    try {
      await f();
    } catch {
      /* ok */
    }
  }
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
