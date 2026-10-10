import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = "C:\\Users\\PlayHard\\.gemini\\antigravity-ide\\brain\\ddba641f-310d-4a2c-ad3b-952331e7412e";
mkdirSync(OUT, { recursive: true });

const require = createRequire(join(PROJ, "package.json"));
const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("playwright-core");

// Read .env
for (const l of readFileSync(join(PROJ, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

const URL_SB = process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REF = new URL(URL_SB).host.split(".")[0];
const DONO = "marcosg1.pereira@gmail.com";

const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });
const { data: lk, error: e1 } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: DONO,
});
if (e1) {
  console.error("generateLink error:", e1.message);
  process.exit(1);
}

const an = createClient(URL_SB, ANON, { auth: { persistSession: false } });
const { data: se, error: e2 } = await an.auth.verifyOtp({
  token_hash: lk.properties.hashed_token,
  type: "magiclink",
});
if (e2) {
  console.error("verifyOtp error:", e2.message);
  process.exit(1);
}

console.log("Logged in as:", se.user.email);

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}

const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

await ctx.addInitScript(
  ([k, v]) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  [`sb-${REF}-auth-token`, JSON.stringify(se.session)],
);

const page = await ctx.newPage();
page.setDefaultTimeout(30000);

const targetUrl = "https://business.flowgenius.com.br/dashboard?secao=instagram&instagram_view=competitors";
console.log("Navigating to:", targetUrl);

await page.goto(targetUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const shotPath = join(OUT, "inteligencia_screenshot.png");
await page.screenshot({ path: shotPath, fullPage: true });
console.log("Fullpage screenshot saved to:", shotPath);

await browser.close();
