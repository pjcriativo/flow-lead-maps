// PROVA DE UI EM PRODUÇÃO — admin edita "Conteúdos do site", salva, e a landing PÚBLICA
// (sem login nenhum) mostra o texto novo. Restaura o conteúdo original ao final.
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = process.argv[2] ?? join(tmpdir(), "flow-prova-cms-prints");
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

const { data: original } = await admin
  .from("site_conteudo")
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

try {
  // 1) admin: abre Conteúdos do site, edita o hero, salva
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email: DONO });
  const an = createClient(URL_SB, ANON, { auth: { persistSession: false } });
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });

  const ctxDono = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1.5,
  });
  await ctxDono.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* origem ainda sem storage */
      }
    },
    [`sb-${REF}-auth-token`, JSON.stringify(se.session)],
  );
  const pageDono = await ctxDono.newPage();
  pageDono.setDefaultTimeout(45000);

  await pageDono.goto(`${PROD}/admin`, { waitUntil: "domcontentloaded" });
  await pageDono.getByText("Conteúdos do site").first().waitFor({ timeout: 60000 });
  await pageDono.getByText("Conteúdos do site").first().click();
  await pageDono.getByText("Hero (topo da página inicial)").waitFor();

  const inputBadge = pageDono.getByPlaceholder("usa o texto padrão do site").first();
  await inputBadge.fill("[TESTE PROVA UI] Selo editado pelo admin");
  await pageDono.getByRole("button", { name: "Salvar" }).click();
  await pageDono.getByText("Salvo.").waitFor({ timeout: 15000 });
  await pageDono.screenshot({ path: join(OUT, "01-admin-cms-salvo.png"), fullPage: true });
  await ctxDono.close();

  // 2) visitante ANÔNIMO: abre a landing pública sem NENHUMA sessão e vê o texto novo
  const ctxAnon = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const pageAnon = await ctxAnon.newPage();
  pageAnon.setDefaultTimeout(45000);
  await pageAnon.goto(PROD, { waitUntil: "domcontentloaded" });
  await pageAnon.getByText("[TESTE PROVA UI] Selo editado pelo admin").waitFor({ timeout: 20000 });
  await pageAnon.screenshot({ path: join(OUT, "02-landing-publica-com-cms.png"), fullPage: true });
  await ctxAnon.close();

  console.log("prints salvos em", OUT);
} finally {
  await browser.close();
  if (original) {
    await admin
      .from("site_conteudo")
      .update({
        hero_badge: original.hero_badge,
        hero_titulo: original.hero_titulo,
        hero_titulo_destaque: original.hero_titulo_destaque,
        hero_subtitulo: original.hero_subtitulo,
        hero_cta_primario: original.hero_cta_primario,
        hero_cta_secundario: original.hero_cta_secundario,
        hero_disclaimer: original.hero_disclaimer,
        features_titulo: original.features_titulo,
        features_subtitulo: original.features_subtitulo,
        cta_final_titulo: original.cta_final_titulo,
        cta_final_subtitulo: original.cta_final_subtitulo,
        cta_final_botao: original.cta_final_botao,
        planos_json: original.planos_json,
        footer_texto: original.footer_texto,
      })
      .eq("id", true);
  }
  console.log("cleanup: site_conteudo restaurado");
}
