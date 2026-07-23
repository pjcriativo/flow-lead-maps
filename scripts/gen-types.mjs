#!/usr/bin/env node
// Regenera src/integrations/supabase/types.ts via Management API.
// Uso: node scripts/gen-types.mjs
import { readFileSync, writeFileSync } from "node:fs";

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

const res = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/types/typescript?included_schemas=public`,
  { headers: { Authorization: `Bearer ${TOKEN}` } },
);
const body = await res.text();
if (!res.ok) {
  console.error("HTTP", res.status, body);
  process.exit(1);
}
const { types } = JSON.parse(body);
const outPath = new URL("../src/integrations/supabase/types.ts", import.meta.url);
writeFileSync(outPath, types, "utf8");
console.log("OK: types.ts regenerado (" + types.length + " bytes)");
