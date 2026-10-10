import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(join(process.cwd(), "package.json"));
const { chromium } = require("playwright-core");
const { createClient } = require("@supabase/supabase-js");

for (const l of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: lk } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: "marcosg1.pereira@gmail.com",
});
const an = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const { data: se } = await an.auth.verifyOtp({
  token_hash: lk.properties.hashed_token,
  type: "magiclink",
});
const ref = new URL(process.env.SUPABASE_URL).host.split(".")[0];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.addInitScript(
  ([k, v]) => localStorage.setItem(k, v),
  ["sb-" + ref + "-auth-token", JSON.stringify(se.session)],
);
const page = await ctx.newPage();

console.log("Navigating to https://business.flowgenius.com.br/dashboard?secao=inteligencia");
await page.goto("https://business.flowgenius.com.br/dashboard?secao=inteligencia", {
  waitUntil: "networkidle",
});
console.log("Current URL:", page.url());
await page.screenshot({ path: "C:\\Users\\PlayHard\\.gemini\\antigravity-ide\\brain\\ddba641f-310d-4a2c-ad3b-952331e7412e\\verify_live.png", fullPage: true });
console.log("Screenshot saved.");

await browser.close();
