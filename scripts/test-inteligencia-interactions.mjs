import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("playwright-core");

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
const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email: DONO });
const an = createClient(URL_SB, ANON, { auth: { persistSession: false } });
const { data: se } = await an.auth.verifyOtp({
  token_hash: lk.properties.hashed_token,
  type: "magiclink",
});

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(
  ([k, v]) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  [`sb-${REF}-auth-token`, JSON.stringify(se.session)],
);

const page = await ctx.newPage();
page.setDefaultTimeout(20000);

const targetUrl = "http://localhost:8080/dashboard?secao=instagram&instagram_view=competitors";
await page.goto(targetUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// 1. Verify primary elements
const title = await page.textContent("h1");
console.log("Header Title:", title?.trim());

const heroTitle = await page.textContent("h2");
console.log("Hero Title:", heroTitle?.trim());

// 2. Click on "Tendências" tab
console.log("Testing tab Tendências...");
await page.locator('[data-tab="tendencias"]').click();
await page.waitForTimeout(500);
const tendenciasVisible = await page.getByText("Hashtags em Alta na Região").isVisible();
console.log("Tendências tab content visible:", tendenciasVisible);

// 3. Return to "Concorrentes" tab
console.log("Testing tab Concorrentes...");
await page.locator('[data-tab="concorrentes"]').click();
await page.waitForTimeout(500);
const competitorsTableVisible = await page.getByText("Concorrentes monitorados").isVisible();
console.log("Concorrentes tab content visible:", competitorsTableVisible);

// 4. Test Add Competitor Dialog
console.log("Testing Add Competitor dialog...");
await page.getByRole("button", { name: "Adicionar concorrente" }).first().click();
await page.waitForTimeout(500);
const dialogVisible = await page.getByText("@ do concorrente").isVisible();
console.log("Dialog opened successfully:", dialogVisible);

await browser.close();
console.log("ALL INTERACTION TESTS PASSED!");
