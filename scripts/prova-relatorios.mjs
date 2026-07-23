#!/usr/bin/env node
// PROVA — rastreabilidade dos Relatórios: cada número da Edge relatorios_ler bate com uma
// query SQL direta contra o banco. Nada inventado. Também prova o guard (403 pra não-admin).
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
  }).then((r) => r.json());

try {
  console.log("\x1b[1mPROVA — rastreabilidade dos Relatórios\x1b[0m\n");
  const jwtDono = await token("marcosg1.pereira@gmail.com");
  const jwtFora = await token("gevieskiagency@gmail.com");

  const rFora = await fetch(`${URL_SB}/functions/v1/admin-acoes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtFora}`,
      apikey: ANON,
    },
    body: JSON.stringify({ acao: "relatorios_ler" }),
  });
  T(rFora.status === 403, "não-super-admin → 403 (guard server-side)", String(rFora.status));

  const r = await chamar(jwtDono, { acao: "relatorios_ler" });
  T(r.ok === true, "super_admin → relatorios_ler ok");

  // leadsPorFonte soma == count(*) total de leads
  const { data: totalLeads } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true });
  const somaFonte = (r.leadsPorFonte ?? []).reduce((s, f) => s + f.total, 0);
  const totalReal = (await admin.from("leads").select("id", { count: "exact", head: true })).count;
  T(
    somaFonte === totalReal,
    "leadsPorFonte soma == count(leads) real",
    `${somaFonte} vs ${totalReal}`,
  );

  // conferir 1 fonte específica (instagram) com count direto
  const { count: countIg } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("origem_fonte", "instagram");
  const igNoRelatorio = (r.leadsPorFonte ?? []).find((f) => f.fonte === "instagram")?.total ?? 0;
  T(
    igNoRelatorio === (countIg ?? 0),
    "leads por fonte 'instagram' bate com count direto",
    `${igNoRelatorio} vs ${countIg}`,
  );

  // funil.ganho == count(status='won')
  const { count: countWon } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "won");
  T(
    r.funil?.ganho === (countWon ?? 0),
    "funil.ganho bate com count(status='won')",
    `${r.funil?.ganho} vs ${countWon}`,
  );

  // funil.perdido == count(status in lost,nurture)
  const { count: countPerdido } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .in("status", ["lost", "nurture"]);
  T(
    r.funil?.perdido === (countPerdido ?? 0),
    "funil.perdido bate com count(lost/nurture)",
    `${r.funil?.perdido} vs ${countPerdido}`,
  );

  // consumoPorOrg tem as 3 orgs reais e o super_admin aparece ilimitado (limite null)
  const orgSuper = (r.consumoPorOrg ?? []).find((o) => o.org === "marcosg1.pereira");
  T(
    (r.consumoPorOrg ?? []).length === 3 && orgSuper?.leads.limite === null,
    "consumoPorOrg lista as 3 orgs reais; super_admin mostra limite null (ilimitado de verdade)",
    JSON.stringify(orgSuper),
  );

  // gastoPorMes soma bate com sum(redes_buscas.custo_usd) real
  const { data: gastoRows } = await admin.from("redes_buscas").select("custo_usd");
  const gastoRealTotal = (gastoRows ?? []).reduce((s, x) => s + Number(x.custo_usd ?? 0), 0);
  const gastoRelatorioTotal = (r.gastoPorMes ?? []).reduce((s, g) => s + g.total_usd, 0);
  T(
    Math.abs(gastoRealTotal - gastoRelatorioTotal) < 0.0001,
    "gastoPorMes soma bate com sum(redes_buscas.custo_usd) real",
    `${gastoRelatorioTotal} vs ${gastoRealTotal}`,
  );

  // filtro de período: desde=amanhã → nenhum lead (0 em tudo)
  const amanha = new Date(Date.now() + 86400000).toISOString();
  const rVazio = await chamar(jwtDono, { acao: "relatorios_ler", desde: amanha });
  const somaFonteVazio = (rVazio.leadsPorFonte ?? []).reduce((s, f) => s + f.total, 0);
  T(
    somaFonteVazio === 0,
    "filtro de período (desde=amanhã) → 0 leads (filtro real, não decorativo)",
  );
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
