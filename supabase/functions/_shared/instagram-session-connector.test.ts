import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/098_instagram_session_connector.sql", import.meta.url),
  "utf8",
);
const challengeMigration = readFileSync(
  new URL("../../migrations/101_instagram_connector_pending_challenge.sql", import.meta.url),
  "utf8",
);
const worker = readFileSync(
  new URL("../../../workers/instagram-connector/app.py", import.meta.url),
  "utf8",
);
const gateway = readFileSync(new URL("../flow-business-session/index.ts", import.meta.url), "utf8");
const accountUi = readFileSync(
  new URL("../../../src/components/instagram/accounts/FlowBusinessAccounts.tsx", import.meta.url),
  "utf8",
);

test("a senha não possui coluna e somente a sessão cifrada é persistida", () => {
  assert.match(migration, /encrypted_settings text not null/);
  assert.doesNotMatch(migration, /\b(?:password|senha)\s+(?:text|varchar)/i);
  assert.match(migration, /revoke all .* from anon, authenticated/);
});

test("o gateway assina a chamada ao worker e aplica o limite do plano", () => {
  assert.match(gateway, /crypto\.subtle\.sign\("HMAC"/);
  assert.match(gateway, /assertAccountCapacity/);
  assert.match(gateway, /provider: "session_worker"/);
});

test("a interface informa que a senha não é armazenada e trata 2FA", () => {
  assert.match(accountUi, /Sua senha é enviada diretamente ao Instagram e nunca é armazenada/);
  assert.match(accountUi, /needsTwoFactor/);
  assert.match(accountUi, /autoComplete="one-time-code"/);
});

test("o desafio preserva o mesmo dispositivo e vira um segundo passo na interface", () => {
  assert.match(challengeMigration, /last_verified_at drop not null/);
  assert.match(worker, /pendingChallenge/);
  assert.match(worker, /challenge_bloks_redirect_dismiss/);
  assert.match(gateway, /needsApproval/);
  assert.match(accountUi, /Já aprovei continuar/);
});

test("a conta possui ciclo de vida completo para reconectar, desconectar e excluir", () => {
  assert.match(gateway, /body\.action === "disconnect"/);
  assert.match(gateway, /body\.action === "delete"/);
  assert.match(gateway, /flow_business_disconnect_instagram_instance/);
  assert.match(gateway, /flow_business_delete_instagram_instance/);
  assert.match(accountUi, /Reconectar/);
  assert.match(accountUi, /Desconectar/);
  assert.match(accountUi, /Excluir/);
});

test("desafio nativo não reinicia o login e orienta a validação manual", () => {
  assert.match(worker, /"manual_verification"/);
  assert.match(worker, /"manual_only"/);
  assert.match(worker, /"manual_verification_required"/);
  assert.match(gateway, /needsManualVerification/);
  assert.match(accountUi, /Validação no Instagram necessária/);
  assert.match(accountUi, /Não clique em continuar novamente/);
  assert.match(worker, /@app\.post\("\/v1\/manual-verification"\)/);
  assert.match(gateway, /body\.action === "manual_verification"/);
  assert.match(accountUi, /Abrir verificação no Instagram/);
});
