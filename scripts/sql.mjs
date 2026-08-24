#!/usr/bin/env node
// Roda SQL no Postgres do Supabase via Management API (roda como `postgres`).
// Uso: node scripts/sql.mjs "SELECT ..." | node scripts/sql.mjs -f arquivo.sql
//      node scripts/sql.mjs --rollback -f migration.sql (valida sem persistir)
import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch {
    /* .env opcional */
  }
}
loadEnv();

const REF =
  process.env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_ID || "lyitsavnqwtsoouhcjie";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Falta SUPABASE_ACCESS_TOKEN no .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const rollback = args.includes("--rollback");
const effectiveArgs = args.filter((arg) => arg !== "--rollback");
let query;
if (effectiveArgs[0] === "-f") query = readFileSync(effectiveArgs[1], "utf8");
else query = effectiveArgs.join(" ");
if (!query) {
  console.error('Passe SQL: node scripts/sql.mjs "SELECT 1"');
  process.exit(1);
}
if (rollback) query = `begin;\n${query}\nrollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const body = await res.text();
if (!res.ok) {
  console.error("HTTP", res.status, body);
  process.exit(1);
}
try {
  console.log(JSON.stringify(JSON.parse(body), null, 2));
} catch {
  console.log(body);
}
