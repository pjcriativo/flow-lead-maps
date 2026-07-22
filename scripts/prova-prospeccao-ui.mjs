// PROVA DE UI EM PRODUÇÃO — abre o app logado como o dono (sessão mintada) e fotografa a tela
// Buscar: as 3 fontes de prospecção, as estratégias de IG/LinkedIn e uma busca real do Maps.
// Uso:  node scripts/prova-prospeccao-ui.mjs [pasta-dos-prints]
// Requisitos: .env com SUPABASE_URL + ANON + SERVICE_ROLE; Edge/Chrome instalado;
//             npm i -D playwright-core (não baixa browser nenhum — usa o do sistema).
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = process.argv[2] ?? join(tmpdir(), "flow-prova-prints");
mkdirSync(OUT, { recursive: true });
const PROD = "https://flow-leads-dusky.vercel.app";
const DONO = "marcosg1.pereira@gmail.com";

const require = createRequire(join(PROJ, "package.json"));
const { createClient } = require("@supabase/supabase-js");
let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.error("Falta playwright-core:  npm i -D playwright-core");
  process.exit(1);
}

// ---------- env ----------
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
if (!URL_SB || !ANON || !SERVICE) {
  console.error("Faltam SUPABASE_URL / ANON / SERVICE_ROLE_KEY no .env");
  process.exit(1);
}
const REF = new URL(URL_SB).host.split(".")[0];

// ---------- sessão real do dono (mesmo padrão da bateria.mjs) ----------
const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });
const { data: lk, error: e1 } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: DONO,
});
if (e1) {
  console.error("generateLink:", e1.message);
  process.exit(1);
}
const an = createClient(URL_SB, ANON, { auth: { persistSession: false } });
const { data: se, error: e2 } = await an.auth.verifyOtp({
  token_hash: lk.properties.hashed_token,
  type: "magiclink",
});
if (e2) {
  console.error("verifyOtp:", e2.message);
  process.exit(1);
}
console.log("sessão ok:", se.user.email);

// ---------- browser do sistema (sem download) ----------
let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {
    /* tenta o próximo */
  }
}
if (!browser) {
  console.error("Nem Edge nem Chrome encontrados no sistema");
  process.exit(1);
}
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1.5,
});
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

const fatos = {};
const shot = (n) => page.screenshot({ path: join(OUT, n), fullPage: true });
const tab = (nome) => page.getByRole("tab", { name: nome });
const estr = (id) => page.locator(`[data-estrategia="${id}"]`);

await page.goto(`${PROD}/dashboard`, { waitUntil: "domcontentloaded" });
await tab("Google Maps").waitFor({ state: "visible", timeout: 60000 });
if (page.url().includes("/auth")) {
  console.error("caiu no /auth — sessão não colou");
  process.exit(1);
}

// 1. Google Maps (default, intacto)
await page.waitForTimeout(2500);
fatos.mapsSelecionadoPorPadrao =
  (await tab("Google Maps").getAttribute("aria-selected")) === "true";
fatos.mapsTemForm = (await page.locator("#nicho").count()) === 1;
await shot("01-maps-default.png");

// 2. Instagram: 10 estratégias + botão travado numa "em breve"
await tab("Instagram").click();
await estr("IG-1").waitFor();
fatos.igEstrategias = await page.locator("[data-estrategia]").count();
await shot("02-instagram-estrategias.png");
await estr("IG-3").click();
await page.waitForTimeout(300);
const emBreve = page.getByRole("button", { name: /em breve/i });
fatos.ig3BotaoTravado = (await emBreve.count()) === 1 && (await emBreve.isDisabled());
await shot("03-ig3-botao-travado.png");

// 3. LinkedIn: 10 estratégias
await tab("LinkedIn").click();
await estr("LI-1").waitFor();
fatos.liEstrategias = await page.locator("[data-estrategia]").count();
await shot("04-linkedin-estrategias.png");

// 4. Volta ao Maps e busca real pequena (Geoapify — não depende do Overpass público)
await tab("Google Maps").click();
await page.locator("#nicho").waitFor();
await page.fill("#nicho", "restaurante");
await page.fill("#cidade", "Curitiba");
await page.locator("#uf").click();
await page.getByRole("option", { name: "PR", exact: true }).click();
await page.locator("#fonte").click();
await page.getByRole("option", { name: /Geoapify/ }).click();
const thumb = page.locator('[role="slider"]').first();
await thumb.click();
await thumb.press("Home"); // quantidade = mínimo (10)
await page.waitForTimeout(1500); // debounce do geocode move o pino
await page.getByRole("button", { name: "Buscar leads" }).click();
await page.locator("text=/Concluído — \\d+ leads gravados/").waitFor({ timeout: 300000 });
fatos.buscaMaps = (
  await page.locator("text=/Concluído — \\d+ leads gravados/").first().textContent()
)?.trim();
fatos.linhasNaTabela = await page.locator("tbody tr").count();
await shot("05-maps-busca-concluida.png");

console.log("prints em:", OUT);
console.log("FATOS " + JSON.stringify(fatos, null, 1));
await browser.close();
// PRONTO objetivo: 3 fontes, 10+10 estratégias, botão travado, busca do Maps viva.
const ok =
  fatos.mapsSelecionadoPorPadrao &&
  fatos.mapsTemForm &&
  fatos.igEstrategias === 10 &&
  fatos.ig3BotaoTravado &&
  fatos.liEstrategias === 10 &&
  /\d+ leads gravados/.test(fatos.buscaMaps ?? "");
process.exit(ok ? 0 : 1);
