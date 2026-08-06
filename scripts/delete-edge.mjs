#!/usr/bin/env node
// Remove UMA Edge Function obsoleta pelo slug via Management API.
// Uso: node scripts/delete-edge.mjs <slug>
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!match) continue;
  let value = match[2].trim();
  if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
  if (!(match[1] in process.env)) process.env[match[1]] = value;
}

const projectRef = process.env.SUPABASE_PROJECT_REF || "lyitsavnqwtsoouhcjie";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const slug = process.argv[2];
if (!accessToken || !slug) {
  console.error("Uso: node scripts/delete-edge.mjs <slug> (SUPABASE_ACCESS_TOKEN obrigatório)");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${accessToken}` };
const listResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
  headers,
});
if (!listResponse.ok) {
  console.error(`Falha ao listar Edge Functions: HTTP ${listResponse.status}`);
  process.exit(1);
}
const functions = await listResponse.json();
const exists = Array.isArray(functions) && functions.some((item) => item?.slug === slug);
if (!exists) {
  console.log(`Edge Function ${slug} já não existe em produção.`);
  process.exit(0);
}

const deleteResponse = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/functions/${encodeURIComponent(slug)}`,
  { method: "DELETE", headers },
);
if (!deleteResponse.ok) {
  console.error(`Falha ao remover ${slug}: HTTP ${deleteResponse.status}`);
  process.exit(1);
}
console.log(`Edge Function ${slug} removida de produção.`);
