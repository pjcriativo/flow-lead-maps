// PROVA DE UI EM PRODUÇÃO — abre /admin logado como super_admin e fotografa a tela
// Configurações: carrega valores reais, salva um valor de teste, confirma na tela, restaura.
// Uso: node scripts/prova-configuracoes-ui.mjs [pasta-dos-prints]
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = process.argv[2] ?? join(tmpdir(), "flow-prova-config-prints");
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

// guarda o original pra restaurar depois
const { data: original } = await admin
  .from("config_plataforma")
  .select("*")
  .eq("id", true)
  .maybeSingle();

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
  viewport: { width: 1440, height: 1100 },
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

try {
  await page.goto(`${PROD}/admin`, { waitUntil: "domcontentloaded" });
  await page.getByText("Configurações").first().waitFor({ state: "visible", timeout: 60000 });
  if (page.url().includes("/auth")) {
    console.error("caiu no /auth — sessão não colou");
    process.exit(1);
  }
  await page.getByText("Configurações").first().click();
  await page.getByText("Teto de gasto de API").waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, "01-configuracoes-carregada.png"), fullPage: true });

  // preenche o teto por rodada com um valor de teste e salva
  const inputTeto = page.locator("input[type=number]").first();
  await inputTeto.fill("0.03");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.getByText("Salvo.").waitFor({ timeout: 15000 });
  await page.screenshot({ path: join(OUT, "02-configuracoes-salvo.png"), fullPage: true });
  console.log("prints salvos em", OUT);
} finally {
  await browser.close();
  // restaura o estado original em produção
  if (original) {
    await admin
      .from("config_plataforma")
      .update({
        teto_rodada_usd: original.teto_rodada_usd,
        teto_mes_usd: original.teto_mes_usd,
        dias_validade_site: original.dias_validade_site,
        remetente_nome_padrao: original.remetente_nome_padrao,
        remetente_email_padrao: original.remetente_email_padrao,
        intervalo_disparo_min_seg: original.intervalo_disparo_min_seg,
        intervalo_disparo_max_seg: original.intervalo_disparo_max_seg,
      })
      .eq("id", true);
  }
  console.log("cleanup: config_plataforma restaurada");
}
