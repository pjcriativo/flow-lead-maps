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
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const OPTS = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_SB, SERVICE, OPTS);

const chamar = (jwt, body, fn = "admin-acoes") =>
  fetch(`${URL_SB}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  });
const chamarJson = (...a) => chamar(...a).then((r) => r.json());

async function sessao(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return se.session.access_token;
}

async function run() {
  const jwt = await sessao("teste@teste.com"); // any super admin email
  
  // Or just call the apify_pool_listar endpoint directly as a super admin
  console.log("Calling apify_pool_listar...");
  
  // Actually, we need a real super admin email from the database
  const { data: admins } = await admin.from("profiles").select("email").eq("is_super_admin", true).limit(1);
  if (!admins || admins.length === 0) {
    console.log("No super admin found!");
    return;
  }
  const realJwt = await sessao(admins[0].email);
  const resp = await chamarJson(realJwt, { acao: "apify_pool_listar" });
  console.log(JSON.stringify(resp, null, 2));
}

run().catch(console.error);
