// Screenshot da aba "Configurações básicas" (produção) para o relatório final — sem
// alterar nada (só navega e fotografa).
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = process.argv[2] ?? join(tmpdir(), "flow-prova-basicas-prints");
mkdirSync(OUT, { recursive: true });
const PROD = "https://flow-leads-dusky.vercel.app";
const DONO = "marcosg1.pereira@gmail.com";

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
  } catch {
    /* tenta o próximo */
  }
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
await ctx.addInitScript(
  ([k, v]) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* origem ainda sem storage */
    }
  },
  [`sb-${REF}-auth-token`, JSON.stringify(se.session)],
);
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
await page.goto(`${PROD}/admin`, { waitUntil: "domcontentloaded" });
await page.getByText("Configurações").first().waitFor({ timeout: 60000 });
await page.getByText("Configurações").first().click();
await page.getByText("Configurações básicas").first().click();
await page.getByText("Identidade").waitFor();
await page.screenshot({ path: join(OUT, "01-configuracoes-basicas.png"), fullPage: true });
console.log("print salvo em", OUT);
await browser.close();
