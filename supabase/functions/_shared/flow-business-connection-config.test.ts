import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync(new URL("../../config.toml", import.meta.url), "utf8");
const connectionFunction = readFileSync(
  new URL("../flow-business-unipile/index.ts", import.meta.url),
  "utf8",
);
const webhookFunction = readFileSync(
  new URL("../flow-business-unipile-webhook/index.ts", import.meta.url),
  "utf8",
);

test("callback e webhook públicos estão declarados sem bloqueio de JWT", () => {
  assert.match(config, /\[functions\.flow-business-unipile\][\s\S]*?verify_jwt = false/);
  assert.match(config, /\[functions\.flow-business-unipile-webhook\][\s\S]*?verify_jwt = false/);
});

test("callback público exige state único, válido e não utilizado", () => {
  assert.match(connectionFunction, /\.eq\("state", state\)/);
  assert.match(connectionFunction, /\.is\("used_at", null\)/);
  assert.match(connectionFunction, /\.gt\("expires_at", now\)/);
});

test("webhook público valida assinatura e rejeita replay antigo", () => {
  assert.match(webhookFunction, /crypto\.subtle\.sign/);
  assert.match(webhookFunction, /unipile-signature/);
  assert.match(webhookFunction, /> 300/);
});

test("webhook mantém o estado da conta sincronizado em todo o ciclo de vida", () => {
  assert.match(webhookFunction, /account\.add/);
  assert.match(webhookFunction, /account\.reconnect/);
  assert.match(webhookFunction, /account\.status\.running/);
  assert.match(webhookFunction, /account\.status\.disconnected/);
  assert.match(webhookFunction, /account\.status\.errored/);
  assert.match(webhookFunction, /account\.remove/);
});
