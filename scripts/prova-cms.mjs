#!/usr/bin/env node
// PROVA — ETAPA 5 (CMS da landing): guard 403 pra não-admin; cms_salvar/cms_ler fazem
// roundtrip real em site_conteudo; a leitura é PÚBLICA (anon, sem sessão nenhuma) — como a
// landing de verdade lê. Restaura o estado original ao final.
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
  });
const chamarJson = (...a) => chamar(...a).then((r) => r.json());

let original = null;
try {
  console.log("\x1b[1mPROVA — Conteúdos do site (CMS da landing)\x1b[0m\n");
  const jwtDono = await token("marcosg1.pereira@gmail.com");
  const jwtFora = await token("gevieskiagency@gmail.com");

  const { data: linhaOriginal } = await admin
    .from("site_conteudo")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  original = linhaOriginal;

  const rForaLer = await chamar(jwtFora, { acao: "cms_ler" });
  T(rForaLer.status === 403, "não-super-admin → 403 em cms_ler (leitura via edge é só admin)");
  const rForaSalvar = await chamar(jwtFora, { acao: "cms_salvar", hero_titulo: "x" });
  T(rForaSalvar.status === 403, "não-super-admin → 403 em cms_salvar");

  const teste = {
    hero_badge: "[TESTE PROVA] selo de teste",
    hero_titulo: "Título de teste com {destaque} no meio.",
    hero_titulo_destaque: "PALAVRA-TESTE",
    cta_final_botao: "Botão de Teste",
    planos_json: [
      {
        name: "Plano Teste",
        monthly: 7,
        yearly: 70,
        yearlyMonthly: "5,83",
        blurb: "x",
        cta: "Ir",
        features: ["a", "b"],
      },
    ],
  };
  const rSalvar = await chamarJson(jwtDono, { acao: "cms_salvar", ...teste });
  T(rSalvar.ok === true, "admin salva conteúdo (cms_salvar)", JSON.stringify(rSalvar));

  const rLer = await chamarJson(jwtDono, { acao: "cms_ler" });
  T(
    rLer.conteudo?.hero_titulo === teste.hero_titulo &&
      rLer.conteudo?.hero_titulo_destaque === teste.hero_titulo_destaque,
    "cms_ler devolve exatamente o que cms_salvar gravou",
    JSON.stringify(rLer.conteudo),
  );

  // PROVA-CHAVE: a landing PÚBLICA lê direto por RLS, SEM NENHUMA sessão (anon puro) — é
  // exatamente como um visitante não-logado carrega "/".
  const anonPuro = createClient(URL_SB, ANON, OPTS);
  const { data: leituraPublica, error: erroPublico } = await anonPuro
    .from("site_conteudo")
    .select("hero_badge, hero_titulo, hero_titulo_destaque, cta_final_botao, planos_json")
    .eq("id", true)
    .maybeSingle();
  T(
    !erroPublico && leituraPublica?.hero_badge === teste.hero_badge,
    "visitante ANÔNIMO (sem login) lê o conteúdo salvo — mesma leitura que a landing real usa",
    erroPublico?.message ?? JSON.stringify(leituraPublica),
  );
  T(
    Array.isArray(leituraPublica?.planos_json) &&
      leituraPublica.planos_json[0]?.name === "Plano Teste",
    "planos_json chega intacto pro visitante anônimo (planos exibidos em /pricing)",
  );

  // escrita direta (sem edge, cliente anônimo) deve ser NEGADA — só o service role grava
  const { error: erroEscritaDireta } = await anonPuro
    .from("site_conteudo")
    .update({ hero_badge: "hackeado" })
    .eq("id", true);
  const { data: aindaTeste } = await admin
    .from("site_conteudo")
    .select("hero_badge")
    .eq("id", true)
    .maybeSingle();
  T(
    aindaTeste?.hero_badge === teste.hero_badge,
    "escrita direta (sem edge/service role) NÃO altera o conteúdo — só admin-acoes grava",
    erroEscritaDireta?.message,
  );
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
} finally {
  if (original) {
    await admin
      .from("site_conteudo")
      .update({
        hero_badge: original.hero_badge,
        hero_titulo: original.hero_titulo,
        hero_titulo_destaque: original.hero_titulo_destaque,
        hero_subtitulo: original.hero_subtitulo,
        hero_cta_primario: original.hero_cta_primario,
        hero_cta_secundario: original.hero_cta_secundario,
        hero_disclaimer: original.hero_disclaimer,
        features_titulo: original.features_titulo,
        features_subtitulo: original.features_subtitulo,
        cta_final_titulo: original.cta_final_titulo,
        cta_final_subtitulo: original.cta_final_subtitulo,
        cta_final_botao: original.cta_final_botao,
        planos_json: original.planos_json,
        footer_texto: original.footer_texto,
      })
      .eq("id", true);
  }
  const { data: restaurado } = await admin
    .from("site_conteudo")
    .select("hero_badge")
    .eq("id", true)
    .maybeSingle();
  T(
    restaurado?.hero_badge === (original?.hero_badge ?? null),
    "cleanup: site_conteudo restaurado ao estado original (produção não fica com texto de teste)",
  );
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
