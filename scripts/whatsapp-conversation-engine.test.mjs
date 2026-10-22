// Boundary: database/Edge integration contract for the Conversation Center.
// These assertions protect tenant, idempotency and operational-safety invariants without
// contacting Supabase or Evolution GO.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/202610160004_wa_conversations_crm.sql", "utf8");
const webhook = readFileSync("supabase/functions/wa-webhook/index.ts", "utf8");
const responder = readFileSync("supabase/functions/wa-responder/index.ts", "utf8");
const edge = readFileSync("supabase/functions/wa-conversations/index.ts", "utf8");
const config = readFileSync("supabase/config.toml", "utf8");

test("conversation identity includes tenant, instance and remote contact", () => {
  assert.match(migration, /unique \(org_id, instancia_id, remote_contact_id\)/);
  assert.doesNotMatch(webhook, /\.eq\("whatsapp", numero\)/);
});

test("inbound ingestion is idempotent and advances timestamps monotonically", () => {
  assert.match(migration, /wa_ingest_inbound_message/);
  assert.match(migration, /on conflict\(org_id,instancia_id,externo_id\)/);
  assert.match(migration, /p_occurred_at>=last_message_at/);
  assert.match(migration, /message_received','inbound:'/);
});

test("webhook derives organization only from the persisted instance", () => {
  assert.match(webhook, /\.eq\("nome", nomeInstancia\)/);
  assert.match(webhook, /p_org: inst\.org_id/);
  assert.doesNotMatch(webhook, /body\.org_id/);
});

test("manual reply reserves a unique operation before provider transport", () => {
  const reservation = responder.indexOf('rpc("wa_reserve_outbound_message"');
  const transport = responder.indexOf("enviarTextoInstancia(");
  assert.ok(reservation >= 0 && transport > reservation);
  assert.match(migration, /unique index[^;]+client_operation_id/is);
  // Falha de rede/timeout do provedor é registrada como resultado INCERTO (nunca como falha).
  assert.match(responder, /finalizar\(\s*"uncertain"/);
  assert.match(responder, /p_status: status/);
});

test("manual reply requires a recently healthy instance", () => {
  assert.match(responder, /canDispatchWithInstance/);
  assert.match(responder, /last_provider_success_at/);
  assert.match(responder, /normalized_phone/);
});

test("conversation mutations validate membership and create durable events", () => {
  assert.match(migration, /from public\.memberships m/);
  assert.match(migration, /conversation already assigned/);
  assert.match(migration, /insert into public\.wa_conversa_eventos/);
  assert.match(migration, /insert into public\.lead_atribuicoes/);
});

test("lead creation is explicit and uses the official CRM entity", () => {
  assert.match(migration, /p_action='create_lead'/);
  assert.match(migration, /insert into public\.leads/);
  assert.match(migration, /'whatsapp','conversation_center'/);
  assert.doesNotMatch(webhook, /insert\(\{[^}]*business_name/s);
});

test("backfill is defined but never executed by the migration", () => {
  assert.match(migration, /create or replace function public\.wa_backfill_conversations/);
  assert.doesNotMatch(migration, /select\s+public\.wa_backfill_conversations\s*\(/i);
  assert.doesNotMatch(migration, /cron\.schedule/i);
});

test("authenticated conversation API is explicitly JWT protected", () => {
  assert.match(config, /\[functions\.wa-conversations\][\s\S]*?verify_jwt = true/);
  assert.match(edge, /authorizeWhatsappRequest/);
  assert.match(edge, /selectedQuery = selectedQuery\.or/);
});

test("conversation snapshots are tenant-scoped and paginated", () => {
  assert.match(edge, /Math\.min\(requestedPageSize, 200\)/);
  assert.match(edge, /\.range\(page \* pageSize, page \* pageSize \+ pageSize - 1\)/);
  assert.match(edge, /has_more: \(page \+ 1\) \* pageSize < \(count \?\? 0\)/);
  assert.match(edge, /\.eq\("org_id", context\.orgId\)/);
});

test("the inbox exposes only official CRM leads and proposals", () => {
  assert.match(edge, /\.from\("leads"\)/);
  assert.match(edge, /\.from\("propostas"\)/);
  assert.match(edge, /\.eq\("lead_id", detail\.lead_id\)/);
  assert.doesNotMatch(
    migration,
    /create table(?: if not exists)? public\.(?:oportunidades|propostas)/i,
  );
});

test("the correction neither enables campaigns nor invokes real bulk dispatch", () => {
  for (const source of [migration, webhook, responder, edge]) {
    assert.doesNotMatch(source, /dispatch_enabled\s*=\s*true/);
    assert.doesNotMatch(source, /wa-send-worker/);
  }
});
