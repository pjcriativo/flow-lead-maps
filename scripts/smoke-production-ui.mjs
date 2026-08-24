#!/usr/bin/env node
// Smoke visual seguro: navega apenas por paginas publicas/protegidas sem autenticar
// e falha em erro de JavaScript ou resposta 5xx. Nao aciona operacoes de negocio.
import { chromium } from "playwright-core";

const executablePath =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.PRODUCTION_URL || "https://flow-leads-dusky.vercel.app";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage();
const errors = [];
const serverErrors = [];
let currentRoute = "bootstrap";

page.on("pageerror", (error) => errors.push({ route: currentRoute, message: error.message }));
page.on("console", (message) => {
  if (message.type() === "error") errors.push({ route: currentRoute, message: message.text() });
});
page.on("response", (response) => {
  if (response.status() >= 500)
    serverErrors.push({ route: currentRoute, status: response.status(), url: response.url() });
});

const routes = ["/", "/entrar", "/pricing", "/dashboard", "/admin"];
const results = [];
for (const route of routes) {
  currentRoute = route;
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(800);
  results.push({
    route,
    status: response?.status() ?? null,
    finalUrl: page.url(),
    title: await page.title(),
    bodyVisible: await page.locator("body").isVisible(),
  });
}

await browser.close();
console.log(JSON.stringify({ results, errors, serverErrors }, null, 2));
if (errors.length || serverErrors.length || results.some((result) => result.status !== 200))
  process.exit(1);
