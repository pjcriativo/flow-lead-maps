#!/usr/bin/env node
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const projectRef = "lyitsavnqwtsoouhcjie";
const defaultAppUrl = "https://flow-leads-dusky.vercel.app";
const defaultRedirectUrl =
  "https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/flow-business-unipile";
const defaultWebhookUrl =
  "https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/flow-business-unipile-webhook";
export const triggerEvents = [
  "account.add",
  "account.reconnect",
  "account.remove",
  "account.status.running",
  "account.status.disconnected",
  "account.status.errored",
  "message.new",
];

export function parseEnv(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function loadEnvironment() {
  let fileValues = {};
  for (const name of [".env", ".env.local"]) {
    try {
      fileValues = {
        ...fileValues,
        ...parseEnv(readFileSync(new URL(`../${name}`, import.meta.url), "utf8")),
      };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return { ...fileValues, ...process.env };
}

function requireSecret(environment, name) {
  const value = environment[name]?.trim();
  if (!value)
    throw new Error(
      `Falta ${name}. Adicione ${name}=sua_chave no .env ou .env.local e tente novamente.`,
    );
  return value;
}

export function safeUrl(value, fallback, name) {
  const parsed = new URL(value?.trim() || fallback);
  if (parsed.protocol !== "https:") throw new Error(`${name} precisa usar HTTPS.`);
  return parsed.toString().replace(/\/$/, "");
}

async function apiRequest(url, apiKey, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`A configuração externa respondeu HTTP ${response.status}.`);
  return payload;
}

async function ensureWebhook(apiBase, apiKey, webhookUrl) {
  const endpointBase = `${apiBase}/v2/webhooks/endpoints`;
  const listed = await apiRequest(`${endpointBase}/?limit=100`, apiKey);
  const endpoints = Array.isArray(listed?.data) ? listed.data : [];
  const matches = endpoints.filter((endpoint) => endpoint?.url === webhookUrl);
  if (matches.length > 1)
    console.warn(
      "Aviso: há mais de um webhook para a mesma URL; nenhum foi removido automaticamente.",
    );

  const body = JSON.stringify({
    url: webhookUrl,
    description: "Flow Business Instagram — produção",
    trigger_events: triggerEvents,
  });
  const endpoint = matches[0]
    ? await apiRequest(`${endpointBase}/${encodeURIComponent(matches[0].id)}`, apiKey, {
        method: "PATCH",
        body: JSON.stringify({
          url: webhookUrl,
          description: "Flow Business Instagram — produção",
          trigger_events: triggerEvents,
          enabled: true,
        }),
      })
    : await apiRequest(`${endpointBase}/`, apiKey, { method: "POST", body });
  const secret = endpoint?.secret || matches[0]?.secret;
  if (typeof secret !== "string" || !secret.trim())
    throw new Error("O endpoint foi configurado, mas a resposta não trouxe o segredo do webhook.");
  return { id: endpoint?.id || matches[0]?.id, secret: secret.trim() };
}

export function buildSupabaseCliInvocation(secrets, platform = process.platform) {
  const secretEnvironment = {
    ...process.env,
    FLOW_SETUP_API_KEY: secrets.UNIPILE_API_KEY,
    FLOW_SETUP_API_URL: secrets.UNIPILE_API_URL,
    FLOW_SETUP_WEBHOOK_SECRET: secrets.UNIPILE_WEBHOOK_SECRET,
    FLOW_SETUP_APP_URL: secrets.FLOW_BUSINESS_APP_URL,
    FLOW_SETUP_REDIRECT_URL: secrets.FLOW_BUSINESS_UNIPILE_REDIRECT_URL,
  };
  if (platform === "win32") {
    const systemRoot = process.env.SystemRoot || "C:\\Windows";
    return {
      command: `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `& npx.cmd supabase secrets set ('UNIPILE_API_KEY=' + $env:FLOW_SETUP_API_KEY) ('UNIPILE_API_URL=' + $env:FLOW_SETUP_API_URL) ('UNIPILE_WEBHOOK_SECRET=' + $env:FLOW_SETUP_WEBHOOK_SECRET) ('FLOW_BUSINESS_APP_URL=' + $env:FLOW_SETUP_APP_URL) ('FLOW_BUSINESS_UNIPILE_REDIRECT_URL=' + $env:FLOW_SETUP_REDIRECT_URL) --project-ref '${projectRef}'; exit $LASTEXITCODE`,
      ],
      environment: secretEnvironment,
    };
  }
  return {
    command: "/bin/sh",
    args: [
      "-c",
      `exec npx supabase secrets set "UNIPILE_API_KEY=$FLOW_SETUP_API_KEY" "UNIPILE_API_URL=$FLOW_SETUP_API_URL" "UNIPILE_WEBHOOK_SECRET=$FLOW_SETUP_WEBHOOK_SECRET" "FLOW_BUSINESS_APP_URL=$FLOW_SETUP_APP_URL" "FLOW_BUSINESS_UNIPILE_REDIRECT_URL=$FLOW_SETUP_REDIRECT_URL" --project-ref '${projectRef}'`,
    ],
    environment: secretEnvironment,
  };
}

function syncSupabaseSecrets(secrets) {
  const invocation = buildSupabaseCliInvocation(secrets);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: root,
    encoding: "utf8",
    env: invocation.environment,
    stdio: "pipe",
    timeout: 120_000,
    windowsHide: true,
  });
  if (result.status !== 0) {
    const details = `${result.stderr || result.stdout || ""}`
      .replaceAll(secrets.UNIPILE_API_KEY, "[oculto]")
      .replaceAll(secrets.UNIPILE_WEBHOOK_SECRET, "[oculto]")
      .trim();
    throw new Error(
      `Não foi possível sincronizar os segredos no Supabase.${details ? ` ${details}` : ""}`,
    );
  }
}

async function verifySignedWebhook(webhookUrl, webhookSecret) {
  const body = JSON.stringify({
    id: `evt_setup_${Date.now()}`,
    created_at: new Date().toISOString(),
    account_id: "acc_setup_validation",
    account_provider: "MOCK",
    account_name: "Setup validation",
    type: "account.status.running",
    payload: {},
  });
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "unipile-signature": `t=${timestamp},v0=${signature}`,
      },
      body,
    });
    if (response.ok) return;
    if (attempt === 6)
      throw new Error(
        `O webhook publicado não aceitou o teste assinado (HTTP ${response.status}).`,
      );
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }
}

async function main() {
  const environment = loadEnvironment();
  const apiKey = requireSecret(environment, "UNIPILE_API_KEY");
  const apiBase = safeUrl(
    environment.UNIPILE_API_URL,
    "https://api.unipile.com",
    "UNIPILE_API_URL",
  );
  const appUrl = safeUrl(environment.FLOW_BUSINESS_APP_URL, defaultAppUrl, "FLOW_BUSINESS_APP_URL");
  const redirectUrl = safeUrl(
    environment.FLOW_BUSINESS_UNIPILE_REDIRECT_URL,
    defaultRedirectUrl,
    "FLOW_BUSINESS_UNIPILE_REDIRECT_URL",
  );
  const webhookUrl = safeUrl(
    environment.FLOW_BUSINESS_UNIPILE_WEBHOOK_URL,
    defaultWebhookUrl,
    "FLOW_BUSINESS_UNIPILE_WEBHOOK_URL",
  );

  console.log("1/4 Validando a chave e preparando o webhook...");
  const webhook = await ensureWebhook(apiBase, apiKey, webhookUrl);
  console.log(`2/4 Webhook ${webhook.id || "configurado"} pronto.`);
  console.log("3/4 Sincronizando segredos no Supabase sem exibi-los...");
  syncSupabaseSecrets({
    UNIPILE_API_KEY: apiKey,
    UNIPILE_API_URL: apiBase,
    UNIPILE_WEBHOOK_SECRET: webhook.secret,
    FLOW_BUSINESS_APP_URL: appUrl,
    FLOW_BUSINESS_UNIPILE_REDIRECT_URL: redirectUrl,
  });
  console.log("4/4 Validando assinatura no endpoint de produção...");
  await verifySignedWebhook(webhookUrl, webhook.secret);
  console.log("OK: conexão do Instagram configurada e webhook validado em produção.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`ERRO: ${error instanceof Error ? error.message : "falha desconhecida"}`);
    process.exitCode = 1;
  });
}
