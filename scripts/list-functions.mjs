import { readFileSync } from "node:fs";
function loadEnv() {
  const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}
loadEnv();
const REF = process.env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_ID || "lyitsavnqwtsoouhcjie";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const list = await res.json();
if (!Array.isArray(list)) { console.log("HTTP", res.status, JSON.stringify(list)); process.exit(0); }
for (const f of list) {
  const d = new Date(f.updated_at).toISOString();
  console.log(`${f.slug.padEnd(20)} v${f.version}  status=${f.status}  updated=${d}`);
}
