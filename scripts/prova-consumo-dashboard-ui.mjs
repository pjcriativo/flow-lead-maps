#!/usr/bin/env node
// Suite: painel administrativo de consumo de APIs em produção.
// Invariant: todos os perfis aparecem e totais por usuário/serviço fecham com o livro-caixa.
// Boundary IN: resposta real da Edge admin-acoes e renderização autenticada do painel.
// Boundary OUT: nenhuma busca paga, mutação de leads ou alteração do pool de chaves.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const project = process.cwd();
const outputDirectory = process.argv[2] ?? join(tmpdir(), "flow-prova-consumo-dashboard");
const productionUrl = "https://flow-leads-dusky.vercel.app";
const ownerEmail = "marcosg1.pereira@gmail.com";

for (const line of readFileSync(join(project, ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!match) continue;
  let value = match[2].trim();
  if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
  if (!(match[1] in process.env)) process.env[match[1]] = value;
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(supabaseUrl && anonKey && serviceRole, "Credenciais Supabase ausentes no .env.");

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("playwright-core");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(supabaseUrl, serviceRole, options);

const { data: link, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: ownerEmail,
});
assert.ifError(linkError);
const anonymous = createClient(supabaseUrl, anonKey, options);
const { data: login, error: loginError } = await anonymous.auth.verifyOtp({
  token_hash: link.properties.hashed_token,
  type: "magiclink",
});
assert.ifError(loginError);
assert(login.session, "Sessão administrativa não foi criada.");

const response = await fetch(`${supabaseUrl}/functions/v1/admin-acoes`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${login.session.access_token}`,
    apikey: anonKey,
  },
  body: JSON.stringify({ acao: "api_consumo_resumo", dias: 30 }),
});
const summary = await response.json();
assert.equal(response.status, 200, JSON.stringify(summary));
assert.equal(summary.ok, true, JSON.stringify(summary));

const [{ count: profileCount, error: profilesError }, { data: plans, error: plansError }] =
  await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("planos").select("nome, preco"),
  ]);
assert.ifError(profilesError);
assert.ifError(plansError);
assert.equal(summary.top_users.length, profileCount, "Nem todos os perfis chegaram ao painel.");

const near = (left, right, tolerance = 0.0001) =>
  Math.abs(Number(left) - Number(right)) <= tolerance;
const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field] ?? 0), 0);
assert(
  near(
    sum(summary.top_users, "total_cost_usd") + summary.unattributed_cost_usd,
    summary.total_cost_usd,
  ),
  "Custos dos usuários não fecham com o total.",
);
assert.equal(
  sum(summary.top_users, "requests_count") + Number(summary.unattributed_requests),
  Number(summary.total_requests),
  "Runs dos usuários não fecham com o total.",
);
assert.equal(
  sum(summary.top_users, "items_charged") + Number(summary.unattributed_items),
  Number(summary.total_leads_crawled),
  "Itens Apify dos usuários não fecham com o total.",
);

const planPrices = new Map(
  (plans ?? []).map((plan) => [String(plan.nome).toLowerCase(), Number(plan.preco)]),
);
for (const user of summary.top_users) {
  assert(Array.isArray(user.services), `Breakdown ausente para ${user.user_email}.`);
  assert(
    near(sum(user.services, "cost_usd"), user.total_cost_usd),
    `Custo por serviço diverge para ${user.user_email}.`,
  );
  assert.equal(sum(user.services, "requests_count"), Number(user.requests_count));
  assert.equal(
    Number(user.services.find((service) => service.service === "apify_maps")?.quantity ?? 0),
    Number(user.items_charged),
  );
  const currentPlanPrice = planPrices.get(String(user.plan).toLowerCase());
  if (currentPlanPrice !== undefined) {
    assert.equal(Number(user.monthly_revenue_brl), currentPlanPrice);
  }
}

const matheus = summary.top_users.find((user) =>
  String(user.user_email).toLowerCase().includes("gevieski"),
);
assert(matheus, "Conta do Matheus não apareceu no painel.");
assert(Number(matheus.leads_generated_period) > 0, "Leads do Matheus continuam zerados.");

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {
    // Tenta o próximo navegador instalado.
  }
}
assert(browser, "Edge/Chrome não encontrado para a prova visual.");
mkdirSync(outputDirectory, { recursive: true });
const reference = new URL(supabaseUrl).hostname.split(".")[0];
const context = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
await context.addInitScript(
  ([key, value]) => localStorage.setItem(key, value),
  [`sb-${reference}-auth-token`, JSON.stringify(login.session)],
);
const page = await context.newPage();
page.setDefaultTimeout(60_000);
await page.goto(`${productionUrl}/admin`, { waitUntil: "domcontentloaded" });
await page.getByText("Consumo de APIs").first().click();
await page.getByText("Relatório Detalhado por Cliente").waitFor();

const matheusRow = page.locator("tbody tr").filter({ hasText: matheus.user_email }).first();
await matheusRow.waitFor();
const matheusText = await matheusRow.innerText();
assert(
  matheusText.includes(Number(matheus.leads_generated_period).toLocaleString("pt-BR")),
  "A linha do Matheus não renderizou os leads do período.",
);

const detailedUser = summary.top_users.find((user) => user.services.length > 0);
assert(detailedUser, "Nenhum usuário com consumo atribuído para abrir o detalhamento.");
const detailedRow = page.locator("tbody tr").filter({ hasText: detailedUser.user_email }).first();
await detailedRow.click();
await page.getByText("Valores vindos dos lançamentos reais do livro-caixa").waitFor();
assert.equal(
  await page.getByText("enriqueclmentos").count(),
  0,
  "Rateio sintético antigo ainda visível.",
);

const screenshotPath = join(outputDirectory, "consumo-dashboard-producao.png");
await page.screenshot({ path: screenshotPath, fullPage: true });
await browser.close();

console.log(
  `OK: ${summary.top_users.length} usuários; Matheus ${matheus.leads_generated_period} leads/30d; ` +
    `${summary.total_requests} runs; ${summary.total_leads_crawled} itens; US$ ${Number(summary.total_cost_usd).toFixed(4)}.`,
);
console.log(`Print salvo em ${screenshotPath}`);
