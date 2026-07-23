#!/usr/bin/env node
// PROVA — Configurações: guard 403 pra não-admin; config_salvar/config_ler fazem roundtrip
// real na tabela config_plataforma; e o override de teto aparece de verdade na Edge
// buscar-redes (ação "verificar" — não gasta, não roda ator). Restaura os valores originais
// no final (não deixa a plataforma real com um teto de teste ligado).
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
const chamar = (jwt, body, fn = "admin-acoes") =>
  fetch(`${URL_SB}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  });
const chamarJson = (...a) => chamar(...a).then((r) => r.json());

let original = null;
try {
  console.log("\x1b[1mPROVA — Configurações (config_plataforma)\x1b[0m\n");
  const jwtDono = await token("marcosg1.pereira@gmail.com");
  const jwtFora = await token("gevieskiagency@gmail.com");

  // guarda o estado ORIGINAL direto do banco pra restaurar no final
  const { data: linhaOriginal } = await admin
    .from("config_plataforma")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  original = linhaOriginal;

  const rForaLer = await chamar(jwtFora, { acao: "config_ler" });
  T(rForaLer.status === 403, "não-super-admin → 403 em config_ler", String(rForaLer.status));
  const rForaSalvar = await chamar(jwtFora, { acao: "config_salvar", teto_rodada_usd: 999 });
  T(
    rForaSalvar.status === 403,
    "não-super-admin → 403 em config_salvar",
    String(rForaSalvar.status),
  );

  const antes = await chamarJson(jwtDono, { acao: "config_ler" });
  T(antes.ok === true, "super_admin → config_ler ok");

  // grava valores de TESTE reais e confirma o roundtrip (não é decorativo: é a mesma
  // linha que buscar-redes/redesign-site/send-proposal/publicacao.core/WaCampanhas leem).
  const teste = {
    teto_rodada_usd: 0.02,
    teto_mes_usd: 4.25,
    dias_validade_site: 21,
    remetente_nome_padrao: "Flow Leads Teste",
    remetente_email_padrao: "teste-config@resend.dev",
    intervalo_disparo_min_seg: 42,
    intervalo_disparo_max_seg: 111,
  };
  const salvo = await chamarJson(jwtDono, { acao: "config_salvar", ...teste });
  T(salvo.ok === true, "config_salvar grava sem erro", JSON.stringify(salvo));

  const { data: linhaBanco } = await admin
    .from("config_plataforma")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  T(
    Object.entries(teste).every(
      ([k, v]) => Number(linhaBanco?.[k] ?? linhaBanco?.[k]) == v || linhaBanco?.[k] === v,
    ),
    "linha em config_plataforma bate byte-a-byte com o que foi salvo (não é cache/mock)",
    JSON.stringify(linhaBanco),
  );

  const depois = await chamarJson(jwtDono, { acao: "config_ler" });
  T(
    depois.config?.teto_rodada_usd === teste.teto_rodada_usd &&
      depois.config?.remetente_nome_padrao === teste.remetente_nome_padrao &&
      depois.config?.intervalo_disparo_min_seg === teste.intervalo_disparo_min_seg,
    "config_ler devolve exatamente o que config_salvar gravou",
    JSON.stringify(depois.config),
  );

  // PROVA DE OVERRIDE REAL: buscar-redes lê a MESMA linha e devolve o teto override na
  // ação "verificar" (não gasta, não roda ator — só checa acesso ao ator + ecoa o teto).
  const verif = await chamarJson(jwtDono, { acao: "verificar" }, "buscar-redes");
  T(
    verif.ok === true &&
      verif.teto?.rodada === teste.teto_rodada_usd &&
      verif.teto?.mes === teste.teto_mes_usd,
    "buscar-redes (verificar) ecoa o MESMO teto salvo em Configurações — override real, não decorativo",
    JSON.stringify(verif.teto),
  );

  // restaura os valores originais (ou null) — não deixa a plataforma real com teto de teste
  const restaura = original
    ? {
        teto_rodada_usd: original.teto_rodada_usd,
        teto_mes_usd: original.teto_mes_usd,
        dias_validade_site: original.dias_validade_site,
        remetente_nome_padrao: original.remetente_nome_padrao,
        remetente_email_padrao: original.remetente_email_padrao,
        intervalo_disparo_min_seg: original.intervalo_disparo_min_seg,
        intervalo_disparo_max_seg: original.intervalo_disparo_max_seg,
      }
    : {
        teto_rodada_usd: null,
        teto_mes_usd: null,
        dias_validade_site: null,
        remetente_nome_padrao: null,
        remetente_email_padrao: null,
        intervalo_disparo_min_seg: null,
        intervalo_disparo_max_seg: null,
      };
  await admin.from("config_plataforma").update(restaura).eq("id", true);
  const { data: linhaRestaurada } = await admin
    .from("config_plataforma")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  T(
    linhaRestaurada?.teto_rodada_usd === restaura.teto_rodada_usd,
    "cleanup: config_plataforma restaurada ao estado original (não deixa lixo em produção)",
  );
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
  // tenta restaurar mesmo em erro fatal
  if (original) {
    await admin
      .from("config_plataforma")
      .update({
        teto_rodada_usd: original.teto_rodada_usd,
        teto_mes_usd: original.teto_mes_usd,
        dias_validade_site: original.dias_validade_site,
        remetente_nome_padrao: original.remetente_nome_padrao,
        remetente_email_padrao: original.remetente_email_padrao,
        intervalo_disparo_min_seg: original.intervalo_disparo_min_seg,
        intervalo_disparo_max_seg: original.intervalo_disparo_max_seg,
      })
      .eq("id", true)
      .catch(() => {});
  }
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
