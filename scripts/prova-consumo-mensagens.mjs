#!/usr/bin/env node
// PROVA — fecha os 2 contadores que faltavam (mensagens + campanhas). Mesmo padrão das provas
// anteriores: 2 orgs reais, limite forçado, super_admin ilimitado, e um fluxo REAL (send-proposal)
// bloqueado sem gastar (nenhum e-mail sai — o bloqueio acontece ANTES da chamada ao Resend).
// Restaura tudo (contadores, plano da org, linhas de teste) ao final, byte a byte.
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
const mes = () => new Date().toISOString().slice(0, 7);

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
async function token(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return { client: an, token: se.session.access_token, uid: se.user.id };
}

const limpeza = [];
try {
  console.log(
    "\x1b[1mPROVA — mensagens + campanhas (billing camada 2, os 2 contadores que faltavam)\x1b[0m\n",
  );

  const { data: orgs } = await admin.from("orgs").select("id, nome, plano_id, dono_user_id");
  const orgA = orgs.find((o) => o.nome === "marcosg1.pereira"); // super_admin, ilimitada
  const orgB = orgs.find((o) => o.nome === "gevieskiagency"); // Starter, vai levar o limite forçado

  // snapshot EXATO do consumo do mês das 2 orgs — restaura byte a byte no finally (delete+reinsert
  // ou delete se não existia linha), independente de quantos incrementos o teste fizer.
  const snapshot = async (orgId) =>
    (
      await admin
        .from("consumo_org")
        .select("*")
        .eq("org_id", orgId)
        .eq("mes_ref", mes())
        .maybeSingle()
    ).data;
  const snapA = await snapshot(orgA.id);
  const snapB = await snapshot(orgB.id);
  const restaurar = async (orgId, linha) => {
    await admin.from("consumo_org").delete().eq("org_id", orgId).eq("mes_ref", mes());
    if (linha) await admin.from("consumo_org").insert(linha);
  };
  limpeza.push(() => restaurar(orgA.id, snapA));
  limpeza.push(() => restaurar(orgB.id, snapB));
  // começa limpo (facilita os asserts de valor absoluto)
  await admin.from("consumo_org").delete().eq("org_id", orgB.id).eq("mes_ref", mes());

  // ---------- 1) mensagens: incrementa o recurso certo ----------
  const r1 = await rpc("consumir_ou_bloquear", { p_org: orgB.id, p_recurso: "mensagens", p_n: 4 });
  T(r1.ok === true && r1.usado === 4, "consumir 4 mensagens → usado=4", JSON.stringify(r1));
  const linha1 = (
    await admin
      .from("consumo_org")
      .select("mensagens, leads, sites, campanhas")
      .eq("org_id", orgB.id)
      .eq("mes_ref", mes())
      .single()
  ).data;
  T(
    linha1.mensagens === 4 && linha1.leads === 0 && linha1.sites === 0 && linha1.campanhas === 0,
    "gravou em 'mensagens' — leads/sites/campanhas continuam 0",
    JSON.stringify(linha1),
  );

  // ---------- 2) bloqueio ao bater o limite de MENSAGENS (forçando um plano com limite baixo) ----------
  const { data: planoMsg } = await admin
    .from("planos")
    .insert({
      nome: "[TESTE] msg4",
      preco: 0,
      periodo: "mensal",
      limite_mensagens: 4,
      limite_campanhas: 2,
    })
    .select("id")
    .single();
  limpeza.push(() => admin.from("planos").delete().eq("id", planoMsg.id));
  limpeza.push(() => admin.from("orgs").update({ plano_id: orgB.plano_id }).eq("id", orgB.id));
  await admin.from("orgs").update({ plano_id: planoMsg.id }).eq("id", orgB.id);

  const r2 = await rpc("consumir_ou_bloquear", { p_org: orgB.id, p_recurso: "mensagens", p_n: 1 });
  T(
    r2.ok === false && r2.reason === "limite_atingido" && r2.usado === 4,
    "5ª mensagem além do limite (4) → BLOQUEADA (usado continua 4)",
    JSON.stringify(r2),
  );

  // ---------- 3) fluxo REAL: send-proposal (e-mail) bloqueado sem chamar o Resend ----------
  // org B já está em 4/4 mensagens → uma proposta aprovada real deve vir com reason=limite_plano,
  // SEM sair e-mail nenhum (o bloqueio acontece antes da chamada ao Resend) e SEM marcar enviada.
  const donoB = orgB.dono_user_id;
  const { data: leadTeste } = await admin
    .from("leads")
    .insert({
      user_id: donoB,
      org_id: orgB.id,
      business_name: "[TESTE PROVA] Lead mensagens",
      email: "teste-prova-mensagens@example.com",
      status: "new",
      place_id: "teste-prova-msg:" + Date.now(),
    })
    .select("id")
    .single();
  limpeza.push(() => admin.from("leads").delete().eq("id", leadTeste.id));
  const { data: propTeste } = await admin
    .from("propostas")
    .insert({
      user_id: donoB,
      org_id: orgB.id,
      lead_id: leadTeste.id,
      assunto: "[TESTE PROVA]",
      corpo: "[TESTE PROVA] corpo",
      status: "aprovada",
    })
    .select("id, status")
    .single();
  limpeza.push(() => admin.from("propostas").delete().eq("id", propTeste.id));

  const sessaoB = await token("gevieskiagency@gmail.com");
  const respEmail = await fetch(`${URL_SB}/functions/v1/send-proposal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessaoB.token}`,
      apikey: ANON,
    },
    body: JSON.stringify({ proposta_id: propTeste.id }),
  });
  const jEmail = await respEmail.json();
  T(
    jEmail.ok === false &&
      jEmail.reason === "limite_plano" &&
      /Limite de mensagens/.test(jEmail.error ?? ""),
    "send-proposal REAL bloqueia por limite de mensagens (sem chamar o Resend)",
    JSON.stringify(jEmail),
  );
  const { data: propDepois } = await admin
    .from("propostas")
    .select("status, enviada_em")
    .eq("id", propTeste.id)
    .single();
  T(
    propDepois.status === "aprovada" && propDepois.enviada_em === null,
    "proposta NÃO foi marcada como enviada (continua 'aprovada', enviada_em null)",
    JSON.stringify(propDepois),
  );

  // ---------- 4) campanhas: bloqueio no INSERT real (trigger de banco) ----------
  // o plano de teste também tem limite_campanhas=2; zera o contador de campanhas do mês pra
  // testar com valor absoluto e crWave 2 campanhas de teste (cabem), a 3ª deve ser recusada.
  await admin
    .from("consumo_org")
    .update({ campanhas: 0 })
    .eq("org_id", orgB.id)
    .eq("mes_ref", mes());
  const criarCampTeste = (nome) =>
    sessaoB.client
      .from("campanhas")
      .insert({ user_id: donoB, nome, status: "ativa" })
      .select("id")
      .single();

  const c1 = await criarCampTeste("[TESTE PROVA] camp 1");
  T(!c1.error && !!c1.data, "1ª campanha (dentro do limite 2) → criada", JSON.stringify(c1.error));
  if (c1.data) limpeza.push(() => admin.from("campanhas").delete().eq("id", c1.data.id));

  const c2 = await criarCampTeste("[TESTE PROVA] camp 2");
  T(!c2.error && !!c2.data, "2ª campanha (no limite 2) → criada", JSON.stringify(c2.error));
  if (c2.data) limpeza.push(() => admin.from("campanhas").delete().eq("id", c2.data.id));

  const c3 = await criarCampTeste("[TESTE PROVA] camp 3 (deve falhar)");
  T(
    !!c3.error && /Limite de campanhas do plano atingido/.test(c3.error.message ?? ""),
    "3ª campanha ALÉM do limite (2) → BLOQUEADA pelo trigger",
    JSON.stringify(c3.error),
  );
  const { count: nomeTerceira } = await admin
    .from("campanhas")
    .select("id", { count: "exact", head: true })
    .eq("nome", "[TESTE PROVA] camp 3 (deve falhar)");
  T((nomeTerceira ?? 0) === 0, "a 3ª campanha NÃO existe no banco (o trigger impediu o insert)");

  // ---------- 5) por-org: nada disso mexeu no contador de A ----------
  const linhaA = await snapshot(orgA.id);
  const mensagensA = linhaA?.mensagens ?? 0;
  const campanhasA = linhaA?.campanhas ?? 0;
  T(
    mensagensA === (snapA?.mensagens ?? 0) && campanhasA === (snapA?.campanhas ?? 0),
    "org A (independente) não mudou em nenhum contador",
    JSON.stringify({ antes: snapA, depois: linhaA }),
  );

  // ---------- 6) super_admin ilimitado (mensagens E campanhas) ----------
  const rSupMsg = await rpc("consumir_ou_bloquear", {
    p_org: orgA.id,
    p_recurso: "mensagens",
    p_n: 9999,
  });
  T(rSupMsg.ok === true, "super_admin consome 9999 mensagens sem bloqueio");
  const rSupCamp = await rpc("consumir_ou_bloquear", {
    p_org: orgA.id,
    p_recurso: "campanhas",
    p_n: 9999,
  });
  T(rSupCamp.ok === true, "super_admin consome 9999 campanhas sem bloqueio");
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
