import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildSupabaseCliInvocation,
  parseEnv,
  safeUrl,
  triggerEvents,
} from "./setup-instagram-connection.mjs";

test("lê a chave do env sem preservar aspas", () => {
  assert.deepEqual(parseEnv('UNIPILE_API_KEY="segredo-local"\nVAZIO=\n'), {
    UNIPILE_API_KEY: "segredo-local",
    VAZIO: "",
  });
});

test("aceita somente URLs HTTPS na configuração de produção", () => {
  assert.equal(
    safeUrl("https://example.com/", "https://fallback.test", "URL"),
    "https://example.com",
  );
  assert.throws(() => safeUrl("http://example.com", "https://fallback.test", "URL"), /HTTPS/);
});

test("configura somente os eventos tratados pelo webhook", () => {
  assert.deepEqual(triggerEvents, [
    "account.add",
    "account.reconnect",
    "account.remove",
    "account.status.running",
    "account.status.disconnected",
    "account.status.errored",
    "message.new",
  ]);
});

test("o setup não imprime valores secretos", () => {
  const source = readFileSync(new URL("./setup-instagram-connection.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /console\.(?:log|error)\([^)]*(?:apiKey|webhook\.secret)/s);
});

test("a chamada ao CLI mantém os segredos fora da linha de comando", () => {
  const secret = "segredo-que-nao-pode-vazar";
  const invocation = buildSupabaseCliInvocation(
    {
      UNIPILE_API_KEY: secret,
      UNIPILE_API_URL: "https://api.unipile.com",
      UNIPILE_WEBHOOK_SECRET: secret,
      FLOW_BUSINESS_APP_URL: "https://app.example.com",
      FLOW_BUSINESS_UNIPILE_REDIRECT_URL: "https://api.example.com/callback",
    },
    "win32",
  );
  assert.doesNotMatch(JSON.stringify(invocation.args), new RegExp(secret));
  assert.equal(invocation.environment.FLOW_SETUP_API_KEY, secret);
  assert.match(invocation.command, /powershell\.exe$/i);
});
