#!/usr/bin/env node
// Apaga uma Edge Function do servidor via Management API (padrão do probe descartável).
// Uso: node scripts/apagar-edge.mjs <slug>
import { readFileSync } from "node:fs";

for (const l of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}
const REF = process.env.SUPABASE_PROJECT_REF || "lyitsavnqwtsoouhcjie";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const slug = process.argv[2];
if (!TOKEN || !slug) {
  console.error("Uso: node scripts/apagar-edge.mjs <slug> (requer SUPABASE_ACCESS_TOKEN)");
  process.exit(1);
}
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions/${slug}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${TOKEN}` },
});
console.log(
  r.ok ? `OK: edge "${slug}" apagada do servidor` : `HTTP ${r.status}: ${await r.text()}`,
);
process.exit(r.ok ? 0 : 1);
