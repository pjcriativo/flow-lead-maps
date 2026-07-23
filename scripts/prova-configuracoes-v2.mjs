#!/usr/bin/env node
// PROVA — Configurações v2 (campos novos): guard 403; roundtrip completo dos novos campos
// (nome_plataforma/logo_url/favicon_url/max_leads_busca/fonte_leads_padrao/modelo_ia/
// cadastro_usuario_ativo/termos_condicoes_ativo/modo_manutencao_ativo); e a PROVA-CHAVE:
// max_leads_busca realmente CAPA o limite pedido em search-leads (fonte OSM, grátis — sem
// gasto). Restaura o estado original ao final.
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
async function sessao(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return { token: se.session.access_token };
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
  console.log("\x1b[1mPROVA — Configurações v2 (campos novos)\x1b[0m\n");
  const dono = await sessao("marcosg1.pereira@gmail.com");
  const fora = await sessao("gevieskiagency@gmail.com");

  const { data: linhaOriginal } = await admin
    .from("config_plataforma")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  original = linhaOriginal;

  const rForaSalvar = await chamar(fora.token, { acao: "config_salvar", nome_plataforma: "x" });
  T(rForaSalvar.status === 403, "não-super-admin → 403 em config_salvar (campos novos)");

  const teste = {
    nome_plataforma: "[TESTE] Nome Teste",
    logo_url: "https://example.com/logo-teste.png",
    favicon_url: "https://example.com/favicon-teste.png",
    max_leads_busca: 3,
    fonte_leads_padrao: "geoapify",
    modelo_ia: "claude-teste-modelo",
    cadastro_usuario_ativo: false,
    termos_condicoes_ativo: true,
    modo_manutencao_ativo: false,
  };
  const rSalvar = await chamarJson(dono.token, { acao: "config_salvar", ...teste });
  T(rSalvar.ok === true, "admin salva os campos novos (config_salvar)", JSON.stringify(rSalvar));

  const rLer = await chamarJson(dono.token, { acao: "config_ler" });
  const c = rLer.config ?? {};
  T(
    c.nome_plataforma === teste.nome_plataforma &&
      c.logo_url === teste.logo_url &&
      c.favicon_url === teste.favicon_url &&
      c.max_leads_busca === teste.max_leads_busca &&
      c.fonte_leads_padrao === teste.fonte_leads_padrao &&
      c.modelo_ia === teste.modelo_ia &&
      c.cadastro_usuario_ativo === false &&
      c.termos_condicoes_ativo === true &&
      c.modo_manutencao_ativo === false,
    "config_ler devolve exatamente os 9 campos novos salvos",
    JSON.stringify(c),
  );

  // leitura PÚBLICA (anon puro, sem sessão) — a mesma que FlowLeadsLogo/auth.tsx usam
  const anonPuro = createClient(URL_SB, ANON, OPTS);
  const { data: leituraPublica, error: erroPublico } = await anonPuro
    .from("config_plataforma")
    .select(
      "nome_plataforma, logo_url, favicon_url, cadastro_usuario_ativo, termos_condicoes_ativo, modo_manutencao_ativo",
    )
    .eq("id", true)
    .maybeSingle();
  T(
    !erroPublico && leituraPublica?.nome_plataforma === teste.nome_plataforma,
    "visitante ANÔNIMO lê os campos de marca/toggle (mesma leitura de FlowLeadsLogo/auth.tsx)",
    erroPublico?.message,
  );

  // PROVA-CHAVE: max_leads_busca=3 realmente CAPA o limite pedido (50) em search-leads
  // (fonte OSM — grátis, sem gasto). Lê o evento "progress" do NDJSON e confere target.
  const rBusca = await fetch(`${URL_SB}/functions/v1/search-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${dono.token}`,
      apikey: ANON,
    },
    body: JSON.stringify({
      nicho: "restaurante",
      cidade: "São Paulo",
      uf: "SP",
      limite: 50,
      fonte: "osm",
      buscarEmails: false,
    }),
  });
  const texto = await rBusca.text();
  const linhas = texto
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const progresso = linhas.find((l) => l.type === "progress");
  T(
    progresso?.target === teste.max_leads_busca,
    "max_leads_busca=3 CAPA o limite=50 pedido (search-leads respeita o teto real)",
    progresso
      ? `target=${progresso.target} (esperado 3)`
      : `sem evento "progress" — eventos vistos: ${JSON.stringify(linhas.map((l) => l.type))}`,
  );
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
} finally {
  if (original) {
    await admin
      .from("config_plataforma")
      .update({
        nome_plataforma: original.nome_plataforma,
        logo_url: original.logo_url,
        favicon_url: original.favicon_url,
        max_leads_busca: original.max_leads_busca,
        fonte_leads_padrao: original.fonte_leads_padrao,
        modelo_ia: original.modelo_ia,
        cadastro_usuario_ativo: original.cadastro_usuario_ativo,
        termos_condicoes_ativo: original.termos_condicoes_ativo,
        modo_manutencao_ativo: original.modo_manutencao_ativo,
      })
      .eq("id", true);
  }
  const { data: restaurado } = await admin
    .from("config_plataforma")
    .select("nome_plataforma")
    .eq("id", true)
    .maybeSingle();
  T(
    restaurado?.nome_plataforma === (original?.nome_plataforma ?? null),
    "cleanup: config_plataforma restaurada ao estado original",
  );
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
