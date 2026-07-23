#!/usr/bin/env node
// Gera a CHAVES_MASTER_KEY (256 bits, base64) e grava como secret das Edge Functions via
// Management API. Uso único — rodar de novo GERA UMA NOVA chave (invalida o cofre atual).
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

for (const l of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}
const REF = process.env.SUPABASE_PROJECT_REF || "lyitsavnqwtsoouhcjie";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Falta SUPABASE_ACCESS_TOKEN no .env");
  process.exit(1);
}

const chave = randomBytes(32).toString("base64");
const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify([{ name: "CHAVES_MASTER_KEY", value: chave }]),
});
const body = await res.text();
if (!res.ok) {
  console.error("HTTP", res.status, body);
  process.exit(1);
}
console.log("OK: CHAVES_MASTER_KEY setada (32 bytes, base64). Não é exibida por segurança.");
