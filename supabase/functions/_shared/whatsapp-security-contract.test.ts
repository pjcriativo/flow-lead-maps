// Suite: WhatsApp multi-tenant security contract.
// Invariant: every browser and Edge path is explicitly scoped to the validated active organization.
// Boundary IN: source-level route, query, RLS, and secret-exposure contracts.
// Boundary OUT: deployed PostgreSQL and Evolution GO, which require a controlled staging environment.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const authorization = read("supabase/functions/_shared/whatsapp-authorization.ts");
const wa = read("supabase/functions/_shared/wa.ts");
const chips = read("supabase/functions/wa-chips/index.ts");
const connect = read("supabase/functions/wa-connect/index.ts");
const responder = read("supabase/functions/wa-responder/index.ts");
const campaign = read("supabase/functions/send-proposal-wa/index.ts");
const webhook = read("supabase/functions/wa-webhook/index.ts");
const service = read("src/services/whatsapp.ts");
const migration = read("supabase/migrations/202610160001_wa_security_multitenant.sql");

test("JWT, organization, membership, active role, and permission are validated centrally", () => {
  for (const required of ["auth.getUser", "memberships", "org_papeis", "canUseWhatsapp"]) {
    assert.match(authorization, new RegExp(required.replace(".", "\\.")));
  }
});

test("a user with two organizations must send the selected organization explicitly", () => {
  assert.match(authorization, /normalizeOrganizationId\(input\.requestedOrgId\)/);
  assert.doesNotMatch(authorization, /order\([^)]*criada_em[^)]*\).*limit\(1\)/s);
});

test("chip reads are scoped by org_id instead of user_id", () => {
  assert.match(wa, /listarInstanciasDaOrg[\s\S]*?\.eq\("org_id", orgId\)/);
  assert.doesNotMatch(wa, /\.eq\("user_id", userId\)/);
});

test("foreign chip QR and pairing requests resolve the instance inside the authorized organization", () => {
  assert.match(chips, /instanciaDaOrgComToken\(admin, context\.orgId, instanceId\)/);
  assert.doesNotMatch(chips, /recriarInstanciaPorId/);
});

test("foreign chip deletion is scoped and archives without deleting history", () => {
  assert.match(wa, /excluirInstanciaDaOrg[\s\S]*?\.eq\("org_id", scope\.orgId\)/);
  assert.match(wa, /deleted_at: new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(
    wa,
    /\.from\("wa_instancias"\)[\s\S]{0,80}\.delete\(\)[\s\S]{0,80}scope\.orgId/,
  );
});

test("chip management requires the manage_numbers backend permission", () => {
  assert.match(chips, /"manage_numbers"/);
  assert.match(connect, /permission: "manage_numbers"/);
});

test("manual replies resolve the destination from a persisted conversation id", () => {
  assert.match(responder, /body\.conversa_id/);
  // SUT_IS_CORRECT_BECAUSE: conversa_id now identifies wa_conversas, while wa_mensagens contains
  // timeline items. The canonical row owns the persisted instance and normalized destination.
  assert.match(responder, /\.from\("wa_conversas"\)[\s\S]*?\.eq\("id", conversationId\)/);
  assert.match(
    responder,
    /enviarTextoInstancia\(instance\.token, conversation\.normalized_phone, text\)/,
  );
  assert.doesNotMatch(responder, /body\.numero/);
});

test("operational users can answer only assigned conversations", () => {
  assert.match(responder, /isAssignedConversationAllowed/);
  assert.match(responder, /assigned_to/);
});

test("direct campaign sending remains blocked on the server", () => {
  assert.match(campaign, /DISPARO_EM_MASSA_BLOQUEADO/);
  assert.doesNotMatch(campaign, /enviarTextoInstancia|\/send\/text/);
});

test("client queries and Edge invocations carry the active org_id", () => {
  assert.match(service, /getActiveOrganizationContext/);
  assert.match(service, /body: \{ \.\.\.body, org_id: context\.orgId \}/);
  assert.match(service, /\.eq\("org_id", context\.orgId\)/);
});

test("conversation cleanup is confirmed and limited to the active organization", () => {
  assert.match(service, /limparConversas\(confirmar = false\)/);
  assert.match(service, /Confirmação explícita obrigatória/);
  assert.match(
    service,
    /\.from\("wa_mensagens"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("org_id", context\.orgId\)/,
  );
});

test("webhook derives the tenant from the persisted instance and never from the payload", () => {
  assert.match(webhook, /select\("id, user_id, org_id"\)/);
  assert.match(webhook, /org_id: inst\.org_id/);
  assert.doesNotMatch(webhook, /body\.org_id/);
});

test("RLS removes old permissive policies and applies role-specific WhatsApp policies", () => {
  assert.match(migration, /from pg_policies/);
  assert.match(migration, /wa_role_allowed/);
  assert.match(migration, /array\['admin','gerente'\]/);
  assert.match(migration, /l\.assigned_to = auth\.uid\(\)/);
});

test("migration preserves unrelated policies and scopes shared tables to WhatsApp records", () => {
  const policyCleanup = migration.slice(
    migration.indexOf("Remove somente policies PERMISSIVE"),
    migration.indexOf("-- Instâncias:"),
  );
  assert.doesNotMatch(
    policyCleanup,
    /campanhas|campanha_leads|automacao_receitas|automacao_rodadas|sdr_sugestoes/,
  );
  assert.match(policyCleanup, /permissive = 'PERMISSIVE'/);
  assert.match(migration, /create policy wa_campanhas_select_restrito[\s\S]*?as restrictive/);
  assert.match(migration, /canal <> 'whatsapp'/);
  assert.match(migration, /new\.canal = 'whatsapp'/);
});

test("instance tokens remain inaccessible to authenticated browser clients", () => {
  assert.match(
    migration,
    /revoke all on table public\.wa_instancia_tokens from anon, authenticated/,
  );
  assert.doesNotMatch(chips, /json\([^)]*token/);
});
