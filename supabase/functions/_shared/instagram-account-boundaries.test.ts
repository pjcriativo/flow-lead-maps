// Suite: limites de dados das contas do Instagram
// Invariant: clientes recebem somente dados operacionais do próprio workspace; diagnóstico é exclusivo do Super Admin.
// Boundary IN: snapshot SQL, autorização das Edge Functions e contratos visuais cliente/admin.
// Boundary OUT: respostas da Meta e conteúdo de tokens, cobertos pelos testes dos respectivos provedores.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canManageInstagramAccounts } from "./instagram-account-access.ts";
import {
  customerAccountLabel,
  customerAccountType,
  customerConnectionStatus,
} from "../../../src/lib/instagram-account-presentation.ts";

const migration = readFileSync(
  new URL("../../migrations/109_instagram_account_data_boundaries.sql", import.meta.url),
  "utf8",
);
const clientUi = readFileSync(
  new URL("../../../src/components/instagram/accounts/FlowBusinessAccounts.tsx", import.meta.url),
  "utf8",
);
const clientService = readFileSync(
  new URL("../../../src/services/flow-business.ts", import.meta.url),
  "utf8",
);
const adminGateway = readFileSync(new URL("../admin-acoes/index.ts", import.meta.url), "utf8");
const adminUi = readFileSync(
  new URL("../../../src/components/admin/AdminConfiguracoes.tsx", import.meta.url),
  "utf8",
);
const metaGateway = readFileSync(
  new URL("../flow-business-meta/index.ts", import.meta.url),
  "utf8",
);
const sessionGateway = readFileSync(
  new URL("../flow-business-session/index.ts", import.meta.url),
  "utf8",
);

test("o snapshot do cliente limita contas ao workspace e remove diagnóstico técnico", () => {
  const accountProjection =
    migration.match(/'accounts', coalesce\(\([\s\S]*?\), '\[\]'::jsonb\),\s*'flows'/)?.[0] ?? "";

  assert.match(migration, /v_org uuid := public\.org_do_usuario\(auth\.uid\(\)\)/);
  assert.match(accountProjection, /where i\.org_id = v_org/);
  assert.match(accountProjection, /'displayName'/);
  assert.match(accountProjection, /'connectedAt'/);
  assert.doesNotMatch(
    accountProjection,
    /'permissions'|'lastWebhookAt'|'errorMessage'|'pendingChallengeMode'/,
  );
  assert.doesNotMatch(
    accountProjection,
    /meta_ig_user_id|external_account_id|access_token_ciphertext/,
  );
});

test("o cliente apresenta informações compreensíveis sem scopes, webhook ou erro interno", () => {
  assert.equal(
    customerAccountLabel({ displayName: null, username: "marcosgflow" }),
    "@marcosgflow",
  );
  assert.equal(customerAccountType("BUSINESS"), "Conta comercial");
  assert.equal(customerAccountType("CREATOR"), "Criador de conteúdo");
  assert.deepEqual(customerConnectionStatus("conectado"), {
    label: "Conectada",
    tone: "success",
  });
  assert.deepEqual(customerConnectionStatus("expirada"), {
    label: "Conexão expirada",
    tone: "warning",
  });
  assert.deepEqual(customerConnectionStatus("desconectado"), {
    label: "Desconectada",
    tone: "danger",
  });
  assert.doesNotMatch(clientUi, /Último webhook|instagram_business_manage_messages/);
  assert.doesNotMatch(
    clientUi,
    /account\.permissions|account\.errorMessage|account\.lastWebhookAt/,
  );
  assert.doesNotMatch(
    clientService,
    /permissions: z\.array|lastWebhookAt: z\.string|errorMessage: z\.string/,
  );
});

test("somente administradores do workspace podem gerenciar conexões", () => {
  assert.match(migration, /'manageAccounts'/);
  assert.match(migration, /papel_do_usuario\(v_org\) in \('admin', 'gerente'\)/);
  assert.match(migration, /create policy ig_instancias_manage_insert/);
  assert.match(migration, /create policy ig_instancias_manage_update/);
  assert.match(migration, /create policy ig_instancias_manage_delete/);
  assert.match(
    migration,
    /revoke all on function public\.flow_business_disconnect_instagram_instance\(uuid, uuid\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /revoke all on function public\.flow_business_delete_instagram_instance\(uuid, uuid\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(metaGateway, /assertCanManageInstagramAccounts/);
  assert.match(sessionGateway, /assertCanManageInstagramAccounts/);
  assert.equal(canManageInstagramAccounts({ role: "admin", isSuperAdmin: false }), true);
  assert.equal(canManageInstagramAccounts({ role: "gerente", isSuperAdmin: false }), true);
  assert.equal(canManageInstagramAccounts({ role: "vendedor", isSuperAdmin: false }), false);
  assert.equal(canManageInstagramAccounts({ role: "suporte", isSuperAdmin: false }), false);
  assert.equal(canManageInstagramAccounts({ role: null, isSuperAdmin: true }), true);
});

test("o diagnóstico técnico permanece em uma ação exclusiva do Super Admin", () => {
  assert.match(adminGateway, /acao === "instagram_integracoes_listar"/);
  assert.match(adminGateway, /meta_ig_user_id/);
  assert.match(adminGateway, /last_webhook_at/);
  assert.match(adminGateway, /permissions/);
  assert.doesNotMatch(adminGateway, /access_token_ciphertext.*instagram_integracoes_listar/);
  assert.match(adminUi, /Diagnóstico técnico do Instagram/);
  assert.match(adminUi, /instagram_integracoes_listar/);
});
