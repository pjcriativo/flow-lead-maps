#!/usr/bin/env node
// Deploy de UMA Edge Function via Management API (sem CLI/Docker — fluxo do projeto).
// Bundla o index.ts da função em um single-file (esbuild) e sobe via
// POST /v1/projects/{ref}/functions/deploy?slug=<slug>.
// Uso:  node scripts/deploy-edge.mjs <slug>            (ex.: redesign-site)
//       node scripts/deploy-edge.mjs <slug> --no-verify-jwt
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(join(process.cwd(), "package.json"));
const { build } = require("esbuild");

for (const l of readFileSync(join(process.cwd(), ".env"), "utf8").split(/\r?\n/)) {
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

const slug = process.argv[2];
if (!slug) {
  console.error("Uso: node scripts/deploy-edge.mjs <slug> [--no-verify-jwt]");
  process.exit(1);
}
const entry = join(process.cwd(), "supabase", "functions", slug, "index.ts");

// Bundle single-file: imports http(s) ficam EXTERNOS (o Deno da Edge resolve);
// imports relativos (../_shared, ../../../src/lib) são bundlados.
const httpExternal = {
  name: "http-external",
  setup(b) {
    b.onResolve({ filter: /^https?:\/\// }, (a) => ({ path: a.path, external: true }));
  },
};
const dir = mkdtempSync(join(tmpdir(), "edge-"));
const outfile = join(dir, "index.ts");
const res = await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "esnext",
  outfile,
  plugins: [httpExternal],
  logLevel: "silent",
  write: true,
});
if (res.errors?.length) {
  console.error("esbuild:", res.errors);
  process.exit(1);
}
const code = readFileSync(outfile, "utf8");
console.log(`bundle ${slug}: ${(code.length / 1024).toFixed(0)}KB`);

// verify_jwt: preserva o valor atual da função (se existir), a menos que a flag mude.
let verifyJwt = true;
try {
  const cur = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then((r) => r.json());
  const f = (Array.isArray(cur) ? cur : []).find((x) => x.slug === slug);
  if (f) verifyJwt = !!f.verify_jwt;
} catch {
  /* mantém default */
}
if (process.argv.includes("--no-verify-jwt")) verifyJwt = false;

const meta = { entrypoint_path: "index.ts", name: slug, verify_jwt: verifyJwt };
const form = new FormData();
form.append("metadata", JSON.stringify(meta));
form.append("file", new File([code], "index.ts", { type: "application/typescript" }));

const up = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/functions/deploy?slug=${encodeURIComponent(slug)}`,
  { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: form },
);
const body = await up.text();
if (!up.ok) {
  console.error("deploy HTTP", up.status, body.slice(0, 500));
  process.exit(1);
}
const j = JSON.parse(body);
console.log(`✔ deploy ok: ${j.slug ?? slug} · verify_jwt=${verifyJwt} · versão ${j.version ?? "?"}`);
