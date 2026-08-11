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
const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });

async function check() {
  const DONO = "marcosg1.pereira@gmail.com";
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
  if (!browser) {
    console.error("Browser não encontrado");
    return;
  }

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await ctx.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
    [`sb-${REF}-auth-token`, JSON.stringify(se.session)],
  );
  const page = await ctx.newPage();
  await page.goto("https://flow-leads-dusky.vercel.app/admin", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  const res = await page.evaluate(() => {
    const aside = document.querySelector("aside");
    const main = document.querySelector("main");
    const container = aside ? aside.parentElement : null;
    return {
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 300),
      asideClass: aside ? aside.className : "NÃO ENCONTRADO",
      asideHeight: aside ? aside.getBoundingClientRect().height : 0,
      mainClass: main ? main.className : "NÃO ENCONTRADO",
      containerClass: container ? container.className : "NÃO ENCONTRADO",
      windowHeight: window.innerHeight,
    };
  });

  console.log("PROD DOM CHECK:", JSON.stringify(res, null, 2));
  await page.screenshot({ path: join(PROJ, "scratch", "prod-check-screenshot.png") });
  await browser.close();
}

check();
