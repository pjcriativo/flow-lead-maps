import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getMetaOAuthPrerequisiteStatus,
  isMetaOAuthEnabled,
  META_OAUTH_REQUIRED_SECRETS,
} from "./meta-oauth-config.ts";

const migration = readFileSync(
  new URL("../../migrations/108_meta_instagram_oauth_activation.sql", import.meta.url),
  "utf8",
);
const metaGateway = readFileSync(
  new URL("../flow-business-meta/index.ts", import.meta.url),
  "utf8",
);
const adminGateway = readFileSync(new URL("../admin-acoes/index.ts", import.meta.url), "utf8");
const adminUi = readFileSync(
  new URL("../../../src/components/admin/AdminConfiguracoes.tsx", import.meta.url),
  "utf8",
);

test("a ativacao do OAuth Meta exige todos os secrets do fluxo oficial", () => {
  assert.deepEqual(META_OAUTH_REQUIRED_SECRETS, [
    "META_INSTAGRAM_APP_ID",
    "META_INSTAGRAM_APP_SECRET",
    "FLOW_BUSINESS_META_REDIRECT_URL",
    "FLOW_BUSINESS_TOKEN_KEY",
  ]);

  const status = getMetaOAuthPrerequisiteStatus((name) =>
    name === "META_INSTAGRAM_APP_SECRET" ? "configured" : "",
  );

  assert.equal(status.configured, false);
  assert.deepEqual(status.missing, [
    "META_INSTAGRAM_APP_ID",
    "FLOW_BUSINESS_META_REDIRECT_URL",
    "FLOW_BUSINESS_TOKEN_KEY",
  ]);
});

test("o OAuth Meta so fica disponivel quando todos os secrets existem", () => {
  const status = getMetaOAuthPrerequisiteStatus(() => "configured");
  assert.equal(status.configured, true);
  assert.deepEqual(status.missing, []);
});

test("a integracao Meta so e considerada ativa com flag explicitamente verdadeira", () => {
  assert.equal(isMetaOAuthEnabled({ instagram_oauth_ativo: true }), true);
  assert.equal(isMetaOAuthEnabled({ instagram_oauth_ativo: false }), false);
  assert.equal(isMetaOAuthEnabled({}), false);
  assert.equal(isMetaOAuthEnabled(null), false);
});

test("o controle Meta nasce desligado e e imposto no admin e no gateway OAuth", () => {
  assert.match(migration, /instagram_oauth_ativo boolean not null default false/);
  assert.match(adminGateway, /\.select\("is_super_admin"\)/);
  assert.match(adminGateway, /instagram_oauth_prerequisites_missing/);
  assert.match(metaGateway, /\.select\("instagram_oauth_ativo"\)/);
  assert.match(metaGateway, /await assertMetaOAuthEnabled\(admin\)/);
  assert.match(adminUi, /rotulo="Conexão oficial do Instagram"/);
});
