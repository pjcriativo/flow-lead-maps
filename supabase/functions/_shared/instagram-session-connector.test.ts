import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../migrations/098_instagram_session_connector.sql", import.meta.url),
  "utf8",
);
const lifecycleMigration = readFileSync(
  new URL("../../migrations/107_instagram_official_connection_hardening.sql", import.meta.url),
  "utf8",
);
const worker = readFileSync(
  new URL("../../../workers/instagram-connector/app.py", import.meta.url),
  "utf8",
);
const sessionGateway = readFileSync(new URL("../flow-business-session/index.ts", import.meta.url), "utf8");
const officialGateway = readFileSync(new URL("../flow-business-meta/index.ts", import.meta.url), "utf8");
const accountUi = readFileSync(
  new URL("../../../src/components/instagram/accounts/FlowBusinessAccounts.tsx", import.meta.url),
  "utf8",
);

test("a sessao legada nao possui coluna de senha e fica cifrada", () => {
  assert.match(migration, /encrypted_settings text not null/);
  assert.doesNotMatch(migration, /\b(?:password|senha)\s+(?:text|varchar)/i);
  assert.match(migration, /revoke all .* from anon, authenticated/);
});

test("o gateway legado assina a chamada ao worker", () => {
  assert.match(sessionGateway, /crypto\.subtle\.sign\("HMAC"/);
  assert.match(sessionGateway, /assertAccountCapacity/);
  assert.match(sessionGateway, /provider: "session_worker"/);
});

test("a interface inicia a autorizacao sem receber senha ou codigo", () => {
  assert.match(accountUi, /startOfficialInstagramConnection/);
  assert.match(accountUi, /window\.location\.assign\(authorizationUrl\)/);
  assert.match(accountUi, /Sua senha não é solicitada pelo/);
  assert.doesNotMatch(accountUi, /\bconnectInstagramSession\s*\(/);
  assert.doesNotMatch(accountUi, /autoComplete="one-time-code"/);
});

test("o conector oficial reserva a vaga e consome o state uma unica vez", () => {
  assert.match(officialGateway, /flow_business_reserve_instagram_oauth_state/);
  assert.match(officialGateway, /async function consumeState/);
  assert.match(officialGateway, /\.is\("used_at", null\)/);
  assert.match(lifecycleMigration, /for update/);
  assert.match(lifecycleMigration, /flow_business_limit:accounts/);
});

test("a conta pode ser desconectada ou excluida depois de uma tentativa", () => {
  assert.match(sessionGateway, /body\.action === "disconnect"/);
  assert.match(sessionGateway, /body\.action === "delete"/);
  assert.match(accountUi, /Desconectar/);
  assert.match(accountUi, /Excluir/);
  assert.match(lifecycleMigration, /delete from public\.ig_instancia_tokens/);
  assert.doesNotMatch(lifecycleMigration, /v_provider <> 'session_worker'/);
});

test("o desafio legado nao volta a ser oferecido na interface", () => {
  assert.match(worker, /"manual_verification"/);
  assert.match(sessionGateway, /body\.action === "manual_verification"/);
  assert.doesNotMatch(accountUi, /manual_verification/);
  assert.doesNotMatch(accountUi, /Aprovar e continuar/);
  assert.doesNotMatch(accountUi, /Abrir verificação no Instagram/);
});
