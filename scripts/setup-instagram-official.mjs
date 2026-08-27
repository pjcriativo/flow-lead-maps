#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRef = "lyitsavnqwtsoouhcjie";
const root = fileURLToPath(new URL("../", import.meta.url));
const defaultAppUrl = "https://flow-leads-dusky.vercel.app";
const defaultRedirectUrl =
  "https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/flow-business-meta";

function parseEnv(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function loadEnvironment() {
  let fileValues = {};
  for (const name of [".env", ".env.local"]) {
    try {
      fileValues = { ...fileValues, ...parseEnv(readFileSync(new URL(`../${name}`, import.meta.url), "utf8")) };
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return { ...fileValues, ...process.env };
}

function required(environment, name) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Falta ${name}. Adicione-o ao .env ou .env.local e tente novamente.`);
  return value;
}

function httpsUrl(value, fallback, name) {
  const parsed = new URL(value?.trim() || fallback);
  if (parsed.protocol !== "https:") throw new Error(`${name} precisa usar HTTPS.`);
  return parsed.toString().replace(/\/$/, "");
}

function tokenKey(environment) {
  const value = required(environment, "FLOW_BUSINESS_TOKEN_KEY");
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32) {
    throw new Error("FLOW_BUSINESS_TOKEN_KEY precisa ser base64 de exatamente 32 bytes.");
  }
  return value;
}

function cliInvocation(secrets) {
  const environment = {
    ...process.env,
    FLOW_IG_APP_ID: secrets.appId,
    FLOW_IG_APP_SECRET: secrets.appSecret,
    FLOW_IG_REDIRECT: secrets.redirectUrl,
    FLOW_IG_TOKEN_KEY: secrets.tokenKey,
    FLOW_IG_WEBHOOK_TOKEN: secrets.webhookToken,
    FLOW_IG_GRAPH_VERSION: secrets.graphVersion,
    FLOW_IG_APP_URL: secrets.appUrl,
  };
  if (process.platform === "win32") {
    const systemRoot = process.env.SystemRoot || "C:\\Windows";
    return {
      command: `${systemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
      args: [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `& npx.cmd supabase secrets set ('META_INSTAGRAM_APP_ID=' + $env:FLOW_IG_APP_ID) ('META_INSTAGRAM_APP_SECRET=' + $env:FLOW_IG_APP_SECRET) ('FLOW_BUSINESS_META_REDIRECT_URL=' + $env:FLOW_IG_REDIRECT) ('FLOW_BUSINESS_TOKEN_KEY=' + $env:FLOW_IG_TOKEN_KEY) ('META_INSTAGRAM_WEBHOOK_VERIFY_TOKEN=' + $env:FLOW_IG_WEBHOOK_TOKEN) ('META_GRAPH_VERSION=' + $env:FLOW_IG_GRAPH_VERSION) ('FLOW_BUSINESS_APP_URL=' + $env:FLOW_IG_APP_URL) --project-ref '${projectRef}'; exit $LASTEXITCODE`,
      ],
      environment,
    };
  }
  return {
    command: "/bin/sh",
    args: [
      "-c",
      `exec npx supabase secrets set "META_INSTAGRAM_APP_ID=$FLOW_IG_APP_ID" "META_INSTAGRAM_APP_SECRET=$FLOW_IG_APP_SECRET" "FLOW_BUSINESS_META_REDIRECT_URL=$FLOW_IG_REDIRECT" "FLOW_BUSINESS_TOKEN_KEY=$FLOW_IG_TOKEN_KEY" "META_INSTAGRAM_WEBHOOK_VERIFY_TOKEN=$FLOW_IG_WEBHOOK_TOKEN" "META_GRAPH_VERSION=$FLOW_IG_GRAPH_VERSION" "FLOW_BUSINESS_APP_URL=$FLOW_IG_APP_URL" --project-ref '${projectRef}'`,
    ],
    environment,
  };
}

function main() {
  const environment = loadEnvironment();
  const secrets = {
    appId: required(environment, "META_INSTAGRAM_APP_ID"),
    appSecret: required(environment, "META_INSTAGRAM_APP_SECRET"),
    redirectUrl: httpsUrl(
      environment.FLOW_BUSINESS_META_REDIRECT_URL,
      defaultRedirectUrl,
      "FLOW_BUSINESS_META_REDIRECT_URL",
    ),
    tokenKey: tokenKey(environment),
    webhookToken: required(environment, "META_INSTAGRAM_WEBHOOK_VERIFY_TOKEN"),
    graphVersion: environment.META_GRAPH_VERSION?.trim() || "v23.0",
    appUrl: httpsUrl(environment.FLOW_BUSINESS_APP_URL, defaultAppUrl, "FLOW_BUSINESS_APP_URL"),
  };
  const invocation = cliInvocation(secrets);
  console.log("Enviando a configuração do Instagram ao ambiente seguro sem exibir os segredos...");
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: root,
    env: invocation.environment,
    encoding: "utf8",
    stdio: "pipe",
    windowsHide: true,
    timeout: 120_000,
  });
  if (result.status !== 0) {
    const details = `${result.stderr || result.stdout || ""}`
      .replaceAll(secrets.appId, "[oculto]")
      .replaceAll(secrets.appSecret, "[oculto]")
      .replaceAll(secrets.tokenKey, "[oculto]")
      .replaceAll(secrets.webhookToken, "[oculto]")
      .trim();
    throw new Error(`Não foi possível enviar a configuração.${details ? ` ${details}` : ""}`);
  }
  console.log("Configuração enviada. Agora conecte uma conta pelo botão Conectar Instagram.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`ERRO: ${error instanceof Error ? error.message : "falha desconhecida"}`);
    process.exitCode = 1;
  }
}
