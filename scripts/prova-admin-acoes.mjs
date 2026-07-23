#!/usr/bin/env node
// PROVA das AÇÕES das telas de admin (etapa 4): cada ação GRAVA de verdade, e o guard
// super_admin server-side barra quem não é. Limpa tudo que criar.
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

const DONO = "marcosg1.pereira@gmail.com";
const FORA = "gevieskiagency@gmail.com";
const STAFF_NOVO = "staff.novo.teste@flowleads.local";

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
async function token(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return se.session.access_token;
}
const chamar = (jwt, body) =>
  fetch(`${URL_SB}/functions/v1/admin-acoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  });

const limpeza = [];
try {
  console.log("\x1b[1mPROVA — ações das telas de admin\x1b[0m\n");
  const jwtDono = await token(DONO);
  const jwtFora = await token(FORA);
  const { data: org } = await admin
    .from("orgs")
    .select("id, dono_user_id")
    .eq(
      "dono_user_id",
      (await admin.from("profiles").select("id").eq("email", DONO).single()).data.id,
    )
    .single();

  // guard: não-super-admin → 403
  const rFora = await chamar(jwtFora, { acao: "role_toggle", papel: "vendedor", ativo: false });
  T(rFora.status === 403, "não-super-admin → 403 (guard server-side)", String(rFora.status));

  // role_toggle grava de verdade em org_papeis
  await chamar(jwtDono, { acao: "role_toggle", papel: "suporte", ativo: false });
  const { data: rp1 } = await admin
    .from("org_papeis")
    .select("ativo")
    .eq("org_id", org.id)
    .eq("papel", "suporte")
    .single();
  T(rp1.ativo === false, "role_toggle desliga o papel no banco (org_papeis.ativo=false)");
  await chamar(jwtDono, { acao: "role_toggle", papel: "suporte", ativo: true });
  const { data: rp2 } = await admin
    .from("org_papeis")
    .select("ativo")
    .eq("org_id", org.id)
    .eq("papel", "suporte")
    .single();
  T(rp2.ativo === true, "role_toggle religa o papel (idempotente)");

  // staff_add cria membership REAL
  const rAdd = await chamar(jwtDono, { acao: "staff_add", email: STAFF_NOVO, papel: "vendedor" });
  const jAdd = await rAdd.json();
  T(rAdd.status === 200 && jAdd.ok === true, "staff_add → 200 ok", JSON.stringify(jAdd));
  const { data: mem } = await admin
    .from("memberships")
    .select("papel")
    .eq("org_id", org.id)
    .eq("user_id", jAdd.user_id)
    .maybeSingle();
  T(
    mem?.papel === "vendedor",
    "staff_add gravou a membership (papel vendedor)",
    JSON.stringify(mem),
  );
  limpeza.push(async () => {
    // remove membership E a conta auth de teste criada pelo staff_add
    await admin.from("memberships").delete().eq("user_id", jAdd.user_id);
    await admin.auth.admin.deleteUser(jAdd.user_id).catch(() => {});
  });

  // staff_add num papel DESATIVADO é recusado (respeita o toggle da tela Roles)
  await chamar(jwtDono, { acao: "role_toggle", papel: "sdr", ativo: false });
  const rDesativado = await chamar(jwtDono, {
    acao: "staff_add",
    email: "outro.sdr@flowleads.local",
    papel: "sdr",
  });
  const jDes = await rDesativado.json();
  T(
    jDes.ok === false && jDes.reason === "papel_desativado",
    "staff_add em papel desligado → negado",
  );
  await chamar(jwtDono, { acao: "role_toggle", papel: "sdr", ativo: true }); // restaura

  // ── PLANOS (etapa 5): CRUD grava de verdade ──
  const rNovo = await chamar(jwtDono, {
    acao: "plano_upsert",
    plano: { nome: "[TESTE] Plano X", preco: 7.5, periodo: "mensal", limite_leads: 10 },
  });
  const jNovo = await rNovo.json();
  T(jNovo.ok === true && !!jNovo.id, "plano_upsert cria plano no banco", JSON.stringify(jNovo));
  const planoId = jNovo.id;
  limpeza.push(() => admin.from("planos").delete().eq("id", planoId));
  const { data: p1 } = await admin
    .from("planos")
    .select("nome, preco, limite_leads, ativo")
    .eq("id", planoId)
    .single();
  T(
    p1.nome === "[TESTE] Plano X" && Number(p1.preco) === 7.5 && p1.limite_leads === 10,
    "plano gravado com os campos certos",
    JSON.stringify(p1),
  );
  await chamar(jwtDono, {
    acao: "plano_upsert",
    plano: { id: planoId, nome: "[TESTE] Plano X2", preco: 8, periodo: "mensal" },
  });
  const { data: p2 } = await admin.from("planos").select("nome").eq("id", planoId).single();
  T(p2.nome === "[TESTE] Plano X2", "plano_upsert com id EDITA (não duplica)");
  await chamar(jwtDono, { acao: "plano_toggle", id: planoId, ativo: false });
  const { data: p3 } = await admin.from("planos").select("ativo").eq("id", planoId).single();
  T(p3.ativo === false, "plano_toggle desativa o plano");
  const rDel = await chamar(jwtDono, { acao: "plano_delete", id: planoId });
  T((await rDel.json()).ok === true, "plano_delete remove plano sem org vinculada");
  // proteção: não apaga plano em uso (o Starter tem 3 orgs)
  const { data: starter } = await admin.from("planos").select("id").eq("nome", "Starter").single();
  const rProt = await chamar(jwtDono, { acao: "plano_delete", id: starter.id });
  const jProt = await rProt.json();
  T(jProt.ok === false && jProt.reason === "plano_em_uso", "não exclui plano EM USO por orgs");
  // guard: não-super-admin não mexe em planos
  const rForaPlano = await chamar(jwtFora, { acao: "plano_toggle", id: starter.id, ativo: false });
  T(rForaPlano.status === 403, "não-super-admin em planos → 403");
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
