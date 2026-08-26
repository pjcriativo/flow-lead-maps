import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const worker = join(root, "workers", "instagram-connector");
const localSecretsFile = join(root, ".env.instagram-worker.local");

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i))
      .filter(Boolean)
      .map((match) => {
        let value = match[2];
        if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
        return [match[1], value];
      }),
  );
}

function loadFile(name) {
  const path = join(root, name);
  return existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
}

function run(command, args, options = {}) {
  const isCommandScript = process.platform === "win32" && command.toLowerCase().endsWith(".cmd");
  const executable = isCommandScript ? "powershell.exe" : command;
  const executableArgs = isCommandScript
    ? [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `& '${command.replaceAll("'", "''")}' ${args.map((arg) => `'${String(arg).replaceAll("'", "''")}'`).join(" ")}; exit $LASTEXITCODE`,
      ]
    : args;
  const result = spawnSync(executable, executableArgs, {
    cwd: options.cwd ?? root,
    env: options.env ?? process.env,
    input: options.input,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
    throw new Error(`${command} falhou${output ? `: ${output}` : ""}`);
  }
  return `${result.stdout || ""}\n${result.stderr || ""}`.trim();
}

function ensureLocalSecrets() {
  if (!existsSync(localSecretsFile)) {
    const shared = randomBytes(32).toString("hex");
    const encryption = randomBytes(32).toString("base64url") + "=";
    writeFileSync(
      localSecretsFile,
      `CONNECTOR_SHARED_SECRET=${shared}\nCONNECTOR_ENCRYPTION_KEY=${encryption}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  }
  return parseEnv(readFileSync(localSecretsFile, "utf8"));
}

function setVercelEnv(name, value, environment) {
  run("npx.cmd", ["vercel", "env", "add", name, environment, "--force"], {
    cwd: worker,
    input: `${value}\n`,
  });
}

function main() {
  const environment = { ...loadFile(".env"), ...loadFile(".env.local"), ...process.env };
  const local = ensureLocalSecrets();
  const projectRef = environment.SUPABASE_PROJECT_REF || "lyitsavnqwtsoouhcjie";
  const required = {
    SUPABASE_URL: environment.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: environment.SUPABASE_SERVICE_ROLE_KEY,
    CONNECTOR_SHARED_SECRET: local.CONNECTOR_SHARED_SECRET,
    CONNECTOR_ENCRYPTION_KEY: local.CONNECTOR_ENCRYPTION_KEY,
  };
  for (const [name, value] of Object.entries(required)) {
    if (!value) throw new Error(`Falta ${name} para publicar o conector.`);
  }

  console.log("1/8 Aplicando a estrutura segura de sessão...");
  run(
    "node",
    ["scripts/sql.mjs", "-f", "supabase/migrations/098_instagram_session_connector.sql"],
    {
      env: { ...process.env, ...environment },
    },
  );
  run(
    "node",
    ["scripts/sql.mjs", "-f", "supabase/migrations/099_instagram_session_automation.sql"],
    { env: { ...process.env, ...environment } },
  );
  run(
    "node",
    ["scripts/sql.mjs", "-f", "supabase/migrations/101_instagram_connector_pending_challenge.sql"],
    { env: { ...process.env, ...environment } },
  );
  run(
    "node",
    ["scripts/sql.mjs", "-f", "supabase/migrations/102_super_admin_unlimited_instagram.sql"],
    { env: { ...process.env, ...environment } },
  );
  run(
    "node",
    ["scripts/sql.mjs", "-f", "supabase/migrations/103_instagram_account_lifecycle.sql"],
    { env: { ...process.env, ...environment } },
  );

  console.log("2/8 Vinculando o worker isolado...");
  run("npx.cmd", ["vercel", "link", "--yes", "--project", "flow-business-instagram-connector"], {
    cwd: worker,
  });

  console.log("3/8 Sincronizando segredos sem exibi-los...");
  for (const [name, value] of Object.entries(required)) setVercelEnv(name, value, "production");

  console.log("4/8 Publicando o worker controlado...");
  const deployOutput = run("npx.cmd", ["vercel", "deploy", "--prod", "--yes"], { cwd: worker });
  const urls = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/g) ?? [];
  const workerUrl = urls.at(-1)?.replace(/\x1b\[[0-9;]*m/g, "");
  if (!workerUrl) throw new Error("O deploy terminou sem informar a URL do worker.");

  console.log("5/8 Configurando os gateways autenticados...");
  const cliEnv = {
    ...process.env,
    ...environment,
    FLOW_CONNECTOR_URL: workerUrl,
    FLOW_CONNECTOR_SECRET: required.CONNECTOR_SHARED_SECRET,
  };
  const command =
    "& npx.cmd supabase secrets set ('INSTAGRAM_CONNECTOR_URL=' + $env:FLOW_CONNECTOR_URL) ('INSTAGRAM_CONNECTOR_SECRET=' + $env:FLOW_CONNECTOR_SECRET) --project-ref '" +
    projectRef +
    "'; exit $LASTEXITCODE";
  run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { env: cliEnv });
  run("node", ["scripts/deploy-edge.mjs", "flow-business-session"], { env: cliEnv });
  run("node", ["scripts/deploy-edge.mjs", "flow-business-unipile"], { env: cliEnv });
  run("node", ["scripts/deploy-edge.mjs", "flow-business-webhook"], { env: cliEnv });
  run("node", ["scripts/deploy-edge.mjs", "instagram-discovery"], { env: cliEnv });
  run("node", ["scripts/deploy-edge.mjs", "instagram-session-automation-cron"], { env: cliEnv });

  console.log("6/8 Ativando o agendamento somente após os serviços estarem publicados...");
  run(
    "node",
    ["scripts/sql.mjs", "-f", "supabase/migrations/100_instagram_session_automation_schedule.sql"],
    { env: { ...process.env, ...environment } },
  );

  console.log("7/8 Validando saúde do worker...");
  const health = run("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    `$response=Invoke-RestMethod -Uri '${workerUrl}/v1/health'; if ($response.status -ne 'ok') { exit 1 }`,
  ]);
  void health;
  console.log("8/8 Validando autenticação sem conectar conta ou enviar mensagem...");
  run("node", ["scripts/smoke-instagram-worker.mjs"], { env: cliEnv });
  console.log(`OK: worker controlado, gateways e agendamento publicados em ${workerUrl}`);
}

try {
  main();
} catch (error) {
  const secrets = existsSync(localSecretsFile)
    ? Object.values(parseEnv(readFileSync(localSecretsFile, "utf8")))
    : [];
  let message = error instanceof Error ? error.message : "falha desconhecida";
  for (const secret of secrets) if (secret) message = message.replaceAll(secret, "[oculto]");
  console.error(`ERRO: ${message}`);
  process.exitCode = 1;
}
