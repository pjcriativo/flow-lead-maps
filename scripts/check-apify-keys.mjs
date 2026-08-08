#!/usr/bin/env node
// Verifica o status REAL de cada chave Apify no pool — crédito, uso, limite
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
const { build } = require("esbuild");
const { createClient } = require("@supabase/supabase-js");

for (const l of readFileSync(join(PROJ, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

const URL_SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });

// Build cofre.ts para decifrar as chaves localmente
const out = await build({
  entryPoints: [join(PROJ, "supabase/functions/_shared/cofre.ts")],
  bundle: true,
  format: "esm",
  write: false,
  platform: "neutral",
  define: { "Deno.env.get": "denoEnvGet" },
  banner: { js: `const denoEnvGet = (k) => process.env[k];` },
});
const tmp = mkdtempSync(join(tmpdir(), "cofre-check-"));
const modPath = join(tmp, "cofre.mjs");
writeFileSync(modPath, out.outputFiles[0].text);
const { decifrar } = await import(pathToFileURL(modPath).href);

// Buscar CHAVES_MASTER_KEY nos secrets do Supabase (Management API)
const REF = process.env.SUPABASE_PROJECT_REF || "lyitsavnqwtsoouhcjie";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const secretsRes = await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
// Os secrets vêm com hash, não o valor real — não podemos decifrar localmente
// Vamos usar a edge admin-acoes para testar cada chave diretamente

// Pegar a sessão do super admin
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const { data: lk } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: "marcosg1.pereira@gmail.com",
});
const an = createClient(URL_SB, ANON, opts);
const { data: se } = await an.auth.verifyOtp({
  token_hash: lk.properties.hashed_token,
  type: "magiclink",
});
const jwt = se.session.access_token;

const chamarJson = (body, fn = "admin-acoes") =>
  fetch(`${URL_SB}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  }).then((r) => r.json());

// Listar chaves
const pool = await chamarJson({ acao: "apify_pool_listar" });
console.log("\n=== POOL DE CHAVES APIFY ===");
for (const c of pool.chaves ?? []) {
  console.log(`\n[${c.ordem}] ${c.apelido} | status: ${c.status}`);

  // Testar cada chave ativa
  if (c.status === "ativa") {
    const teste = await chamarJson({ acao: "apify_chave_testar", id: c.id });
    if (teste.situacao === "ok") {
      console.log(`  ✅ Válida | Restante: US$ ${Number(teste.restante ?? 0).toFixed(4)} | Uso: US$ ${Number(teste.uso ?? 0).toFixed(4)} | Teto: US$ ${Number(teste.max ?? 0).toFixed(2)}`);
    } else {
      console.log(`  ❌ Situação: ${teste.situacao} | Detalhe: ${JSON.stringify(teste)}`);
    }
  } else {
    console.log(`  ⏸️ Pulada (status: ${c.status})`);
  }
}

// Verificar se a edge search-leads responde normalmente (verificar atores)
console.log("\n=== VERIFICANDO EDGE buscar-redes ===");
const verif = await chamarJson({ acao: "verificar" }, "buscar-redes");
console.log(JSON.stringify(verif, null, 2));
