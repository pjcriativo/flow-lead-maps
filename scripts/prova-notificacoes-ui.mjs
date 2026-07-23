// PROVA DE UI EM PRODUÇÃO — fotografa Notificações (admin, envia) + Assinantes (admin, CRUD)
// + Notificações (cliente, recebe e vê badge). Limpa os dados de teste ao final.
import { readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const OUT = process.argv[2] ?? join(tmpdir(), "flow-prova-notif-prints");
mkdirSync(OUT, { recursive: true });
const PROD = "https://flow-leads-dusky.vercel.app";
const DONO = "marcosg1.pereira@gmail.com";
const CLIENTE = "gevieskiagency@gmail.com";

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
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
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
    [`sb-${REF}-auth-token`, JSON.stringify(session)],
  );
  return ctx;
}

let notifId = null;
try {
  const seDono = await sessao(DONO);
  const ctxDono = await ctxLogado(seDono);
  const pageDono = await ctxDono.newPage();
  pageDono.setDefaultTimeout(45000);

  // 1) admin: tela Notificações, compõe e envia
  await pageDono.goto(`${PROD}/admin`, { waitUntil: "domcontentloaded" });
  await pageDono.getByText("Notificações").first().waitFor({ timeout: 60000 });
  await pageDono.getByText("Notificações").first().click();
  await pageDono.getByPlaceholder("Título do aviso").waitFor();
  await pageDono.getByPlaceholder("Título do aviso").fill("[TESTE PROVA UI] Aviso da plataforma");
  await pageDono.getByPlaceholder("Mensagem…").fill("Print de produção — Etapa 4.");
  await pageDono.getByRole("button", { name: "Enviar a todos" }).click();
  await pageDono.getByText(/leram/).first().waitFor({ timeout: 15000 });
  await pageDono.screenshot({
    path: join(OUT, "01-admin-notificacoes-enviada.png"),
    fullPage: true,
  });

  const { data: notif } = await admin
    .from("notificacoes")
    .select("id")
    .eq("titulo", "[TESTE PROVA UI] Aviso da plataforma")
    .maybeSingle();
  notifId = notif?.id ?? null;

  // 2) admin: tela Assinantes, cadastra um
  await pageDono.getByText("Usuários").first().click();
  await pageDono.getByText("Assinantes").first().click();
  await pageDono.getByRole("button", { name: "Adicionar" }).click();
  await pageDono.getByPlaceholder("email@exemplo.com").fill("teste-prova-ui@example.com");
  await pageDono.getByPlaceholder("Nome (opcional)").fill("Teste UI");
  await pageDono.getByRole("button", { name: "Salvar" }).click();
  await pageDono.getByText("teste-prova-ui@example.com").waitFor({ timeout: 15000 });
  await pageDono.screenshot({ path: join(OUT, "02-admin-assinantes.png"), fullPage: true });
  await ctxDono.close();

  // 3) cliente: vê a notificação no dashboard (badge + tela)
  const seCliente = await sessao(CLIENTE);
  const ctxCliente = await ctxLogado(seCliente);
  const pageCliente = await ctxCliente.newPage();
  pageCliente.setDefaultTimeout(45000);
  await pageCliente.goto(`${PROD}/dashboard`, { waitUntil: "domcontentloaded" });
  await pageCliente.getByText("Notificações").first().waitFor({ timeout: 60000 });
  await pageCliente.screenshot({
    path: join(OUT, "03-cliente-badge-nao-lida.png"),
    fullPage: true,
  });
  await pageCliente.getByText("Notificações").first().click();
  await pageCliente.getByText("[TESTE PROVA UI] Aviso da plataforma").waitFor({ timeout: 15000 });
  await pageCliente.screenshot({ path: join(OUT, "04-cliente-notificacoes.png"), fullPage: true });
  await ctxCliente.close();

  console.log("prints salvos em", OUT);
} finally {
  await browser.close();
  if (notifId) {
    await admin.from("notificacao_destinatarios").delete().eq("notificacao_id", notifId);
    await admin.from("notificacoes").delete().eq("id", notifId);
  }
  await admin.from("assinantes").delete().eq("email", "teste-prova-ui@example.com");
  console.log("cleanup: dados de teste removidos");
}
