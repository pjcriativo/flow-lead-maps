#!/usr/bin/env node
// Testa a busca de leads via edge search-leads diretamente (NDJSON streaming)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
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
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_SB, SERVICE, opts);

// Pegar um usuário com acesso liberado
const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 });
const targetUser = users?.users?.find(
  (u) =>
    u.email &&
    ["digitalads58@gmail.com", "gevieskiagency@gmail.com", "pjcriativoweb@gmail.com"].includes(
      u.email,
    ),
);
console.log(`Testando com usuário: ${targetUser?.email}`);

const { data: lk } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: targetUser.email,
});
const an = createClient(URL_SB, ANON, opts);
const { data: se } = await an.auth.verifyOtp({
  token_hash: lk.properties.hashed_token,
  type: "magiclink",
});
const jwt = se.session.access_token;

console.log("\n=== TESTANDO search-leads (fonte: apify) ===");
console.log("Enviando busca: nicho='barbearia', cidade='Curitiba', limite=3, fonte='apify'");

const res = await fetch(`${URL_SB}/functions/v1/search-leads`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
    apikey: ANON,
  },
  body: JSON.stringify({
    nicho: "barbearia",
    cidade: "Curitiba",
    uf: "PR",
    limite: 3,
    fonte: "apify",
    buscarEmails: false,
  }),
});

console.log(`Status HTTP: ${res.status}`);

// Ler NDJSON linha a linha
const text = await res.text();
const lines = text.split("\n").filter((l) => l.trim());
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.type === "error") {
      console.log(`❌ ERRO: ${obj.message}`);
    } else if (obj.type === "lead") {
      console.log(`✅ Lead: ${obj.lead?.business_name} | ${obj.lead?.city}`);
    } else if (obj.type === "done") {
      console.log(`✅ CONCLUÍDO: ${obj.inserted} inseridos de ${obj.total}`);
    } else {
      console.log(`[${obj.type}] ${obj.message ?? JSON.stringify(obj)}`);
    }
  } catch {
    console.log(`RAW: ${line}`);
  }
}
