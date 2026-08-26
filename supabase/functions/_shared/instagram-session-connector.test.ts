import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/098_instagram_session_connector.sql", import.meta.url),
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
  assert.match(accountUi, /Sua senha é usada somente nesta tentativa de login e não é armazenada/);
  assert.match(accountUi, /needsTwoFactor/);
  assert.match(accountUi, /autoComplete="one-time-code"/);
});
