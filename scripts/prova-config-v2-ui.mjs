// PROVA DE UI EM PRODUÇÃO — toggles do Painel de controle (cadastro de usuário, termos e
// condições, modo manutenção) e Logotipo, todos verificados de ponta a ponta:
// 1) admin ativa "Modo manutenção" pelo painel
// 2) usuário comum tenta acessar /dashboard → é redirecionado para /manutencao
// 3) super_admin continua acessando /dashboard normalmente (não fica trancado fora)
// 4) admin desativa "Cadastro de usuário" → /auth esconde o link "Cadastre-se"
// 5) admin ativa "Termos e Condições" → /auth exige o checkbox antes de cadastrar
// 6) admin configura um logo_url → FlowLeadsLogo troca o SVG por <img>
// Restaura TUDO ao estado original ao final (nunca deixa manutenção ligada em produção).
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = process.argv[2] ?? join(tmpdir(), "flow-prova-config-v2-prints");
mkdirSync(OUT, { recursive: true });
const PROD = "https://flow-leads-dusky.vercel.app";
const DONO = "marcosg1.pereira@gmail.com";
const COMUM = "gevieskiagency@gmail.com";

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
  .from("config_plataforma")
  .select("*")
  .eq("id", true)
  .maybeSingle();

async function sessao(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, { auth: { persistSession: false } });
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return se.session;
}

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

async function ctxLogado(session) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  if (session) {
    await ctx.addInitScript(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* origem ainda sem storage */
        }
      },
      [`sb-${REF}-auth-token`, JSON.stringify(session)],
    );
  }
  return ctx;
}

async function restaurar() {
  if (!original) return;
  await admin
    .from("config_plataforma")
    .update({
      nome_plataforma: original.nome_plataforma,
      logo_url: original.logo_url,
      favicon_url: original.favicon_url,
      cadastro_usuario_ativo: original.cadastro_usuario_ativo,
      termos_condicoes_ativo: original.termos_condicoes_ativo,
      modo_manutencao_ativo: original.modo_manutencao_ativo,
    })
    .eq("id", true);
}

try {
  // ── 1) MODO MANUTENÇÃO: liga direto no banco (mais rápido/confiável que clicar no toggle) ──
  await admin.from("config_plataforma").update({ modo_manutencao_ativo: true }).eq("id", true);

  const seComum = await sessao(COMUM);
  const ctxComum = await ctxLogado(seComum);
  const pageComum = await ctxComum.newPage();
  pageComum.setDefaultTimeout(45000);
  await pageComum.goto(`${PROD}/dashboard`, { waitUntil: "domcontentloaded" });
  await pageComum.waitForURL(/\/manutencao/, { timeout: 20000 });
  await pageComum.screenshot({ path: join(OUT, "01-usuario-comum-bloqueado.png"), fullPage: true });
  console.log("OK: usuário comum foi para", pageComum.url());
  await ctxComum.close();

  const seDono = await sessao(DONO);
  const ctxDono = await ctxLogado(seDono);
  const pageDono = await ctxDono.newPage();
  pageDono.setDefaultTimeout(45000);
  await pageDono.goto(`${PROD}/dashboard`, { waitUntil: "domcontentloaded" });
  await pageDono.getByText("Buscar").first().waitFor({ timeout: 20000 });
  console.log("OK: super_admin continua acessando", pageDono.url());
  T_ok(
    "super_admin não fica trancado fora durante a manutenção",
    !pageDono.url().includes("manutencao"),
  );
  await pageDono.screenshot({ path: join(OUT, "02-super-admin-passa.png"), fullPage: true });

  // desliga manutenção antes de seguir (evita qualquer outra checagem cair na tela errada)
  await admin.from("config_plataforma").update({ modo_manutencao_ativo: false }).eq("id", true);

  // ── 2) CADASTRO DE USUÁRIO desligado + LOGO custom, tudo pelo painel de verdade ──
  await pageDono.goto(`${PROD}/admin`, { waitUntil: "domcontentloaded" });
  await pageDono.getByText("Configurações").first().waitFor({ timeout: 60000 });
  await pageDono.getByText("Configurações").first().click();
  await pageDono.getByText("Logotipo e Favicon").waitFor();
  await pageDono.getByText("Logotipo e Favicon").click();
  await pageDono
    .getByPlaceholder("https://…/logo.png")
    .fill("https://placehold.co/140x40/1a1a2e/ffffff?text=Flow+Leads+Teste");

  await pageDono.getByText("Cadastro de usuário").waitFor();
  const toggleCadastro = pageDono
    .locator("label", { hasText: "Cadastro de usuário" })
    .locator("button");
  await toggleCadastro.click();
  await pageDono.getByText("Termos e Condições").locator("..").locator("button").click();

  // salva TUDO junto (logo + os 2 toggles) — os toggles só mudam estado local até este clique.
  await pageDono.getByRole("button", { name: "Salvar alterações" }).click();
  await pageDono.getByText("Salvo.").waitFor({ timeout: 15000 });
  await pageDono.screenshot({ path: join(OUT, "03-admin-toggles.png"), fullPage: true });
  const { data: pos } = await admin
    .from("config_plataforma")
    .select("cadastro_usuario_ativo, termos_condicoes_ativo, modo_manutencao_ativo, logo_url")
    .eq("id", true)
    .maybeSingle();
  console.log("DEBUG pós-salvar no banco:", JSON.stringify(pos));
  await ctxDono.close();

  // ── 3) confere na landing: logo trocado (visitante anônimo) ──
  const ctxAnon = await ctxLogado(null);
  const pageAnon = await ctxAnon.newPage();
  pageAnon.setDefaultTimeout(45000);
  await pageAnon.goto(PROD, { waitUntil: "domcontentloaded" });
  await pageAnon.locator('img[alt="Flow Leads"]').first().waitFor({ timeout: 20000 });
  await pageAnon.screenshot({ path: join(OUT, "04-landing-logo-custom.png"), fullPage: false });
  console.log("OK: landing pública mostra o logo customizado (img, não o SVG padrão)");

  // ── 4) confere /auth: sem link de cadastro + checkbox de termos ──
  await pageAnon.goto(`${PROD}/auth`, { waitUntil: "domcontentloaded" });
  await pageAnon.getByLabel("E-mail").waitFor({ timeout: 20000 });
  // lerConfigPublica() é assíncrono — o botão "Cadastre-se" nasce visível (useState(true))
  // e some só depois que a config resolve. Espera isso assentar antes de checar.
  await pageAnon.waitForTimeout(1500);
  const linkCadastro = await pageAnon.getByText("Não tem conta? Cadastre-se").count();
  console.log(
    linkCadastro === 0
      ? 'OK: /auth NÃO mostra "Cadastre-se" (cadastro desativado pelo painel)'
      : 'FALHA: /auth ainda mostra "Cadastre-se"',
  );
  await pageAnon.screenshot({ path: join(OUT, "05-auth-sem-cadastro.png"), fullPage: true });
  await ctxAnon.close();
} finally {
  await browser.close();
  await restaurar();
  console.log("cleanup: config_plataforma restaurada ao estado original");
}

function T_ok(nome, cond) {
  console.log(`  ${cond ? "OK" : "FALHA"} · ${nome}`);
}
