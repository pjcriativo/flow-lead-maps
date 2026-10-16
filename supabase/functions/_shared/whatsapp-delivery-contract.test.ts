// Suite: WhatsApp persistent delivery contract.
// Invariant: PostgreSQL owns idempotency, leasing, tenant integrity, and dispatch gating.
// Boundary IN: migration and Edge-function deployment contracts.
// Boundary OUT: an applied Supabase schema and real Evolution instance, reserved for homologation.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/202610160002_wa_delivery_engine.sql");
const control = read("supabase/functions/wa-campaign-control/index.ts");
const worker = read("supabase/functions/wa-send-worker/index.ts");
const webhook = read("supabase/functions/wa-webhook/index.ts");
const config = read("supabase/config.toml");
const campaignUi = read("src/components/whatsapp/WaCampanhas.tsx");
const whatsappService = read("src/services/whatsapp.ts");

test("reuses wa_envios as the durable queue with explicit lifecycle fields", () => {
  for (const field of [
    "status",
    "idempotency_key",
    "scheduled_at",
    "reserved_at",
    "lease_expires_at",
    "worker_id",
    "attempt_count",
    "provider_message_id",
    "last_error",
  ]) {
    assert.match(migration, new RegExp(`add column if not exists ${field}`));
  }
});

test("enforces logical idempotency and webhook event idempotency in PostgreSQL", () => {
  assert.match(migration, /unique[\s\S]*?org_id[\s\S]*?idempotency_key/i);
  assert.match(migration, /create table if not exists public\.wa_envio_eventos/i);
  assert.match(migration, /unique[\s\S]*?org_id[\s\S]*?event_key/i);
});

test("reserves batches atomically without holding a transaction over provider I/O", () => {
  assert.match(migration, /for update(?:\s+of\s+e)?\s+skip locked/i);
  assert.match(migration, /lease_expires_at/i);
  assert.match(worker, /rpc\("wa_reserve_delivery_batch"/);
  assert.match(worker, /enviarTextoInstancia/);
});

test("dispatch remains disabled by default and no active cron is installed", () => {
  assert.match(migration, /dispatch_enabled boolean not null default false/i);
  assert.doesNotMatch(migration, /cron\.schedule\s*\(/i);
});

test("campaign control uses JWT organization authorization for every mutation", () => {
  assert.match(control, /authorizeWhatsappRequest/);
  assert.match(control, /permission:[\s\S]*?"manage_campaigns"/);
  assert.match(control, /context\.orgId/);
});

test("worker requires a service secret rather than a browser JWT", () => {
  assert.match(worker, /WA_WORKER_SECRET/);
  assert.match(worker, /timingSafeEqual|constantTimeEqual/);
  assert.match(config, /\[functions\.wa-send-worker\][\s\S]*?verify_jwt\s*=\s*false/);
});

test("queue preparation requires explicit WhatsApp consent and rejects opt-out", () => {
  assert.match(migration, /whatsapp_opt_in/i);
  assert.match(migration, /whatsapp_consent_source/i);
  assert.match(migration, /whatsapp_opt_out/i);
  assert.match(migration, /not[\s\S]*?whatsapp_opt_out/i);
});

test("pause, resume, and cancellation preserve history and actor timestamps", () => {
  assert.match(control, /"pause"/);
  assert.match(control, /"resume"/);
  assert.match(control, /"cancel"/);
  assert.match(migration, /paused_by/i);
  assert.match(migration, /cancelled_by/i);
  assert.doesNotMatch(control, /\.delete\(\)/);
});

test("webhook persists deduplicated delivery events and blocks stale regressions", () => {
  assert.match(webhook, /wa_envio_eventos/);
  assert.match(webhook, /provider_message_id/);
  assert.match(webhook, /canTransitionDelivery/);
  assert.match(webhook, /deliveryEventIdentity/);
});

test("uncertain results are persisted without automatic retry", () => {
  assert.match(worker, /uncertain/);
  assert.match(worker, /requestDispatched/);
  assert.match(worker, /shouldRetryDelivery/);
});

test("the worker never logs or returns provider credentials", () => {
  assert.doesNotMatch(worker, /console\.(log|error)\([^\n]*(token|apikey)/i);
  assert.doesNotMatch(worker, /json\([^\n]*(token|apikey)/i);
});

test("creates the campaign and recipient snapshot in one database function", () => {
  assert.match(migration, /function public\.wa_create_campaign_draft/);
  assert.match(migration, /insert into public\.campanhas/);
  assert.match(migration, /insert into public\.campanha_leads/);
  assert.match(control, /rpc\("wa_create_campaign_draft"/);
});

test("two workers cannot claim the same queue row", () => {
  assert.match(migration, /for update(?:\s+of\s+e)?\s+skip locked/i);
  assert.match(migration, /where e\.id=c\.id/);
  assert.match(migration, /worker_id=p_worker/);
});

test("queue, event, and attempt records enforce organization integrity", () => {
  assert.match(migration, /foreign key\(envio_id, org_id\)/i);
  assert.match(migration, /foreign key\(instancia_id, org_id\)/i);
  assert.match(migration, /references public\.wa_envios\(id, org_id\)/i);
});

test("campaign preparation rejects an unauthorized or foreign campaign", () => {
  assert.match(migration, /wa_delivery_actor_allowed\(p_org, p_actor\)/);
  assert.match(migration, /where id = p_campaign and org_id = p_org and canal = 'whatsapp'/);
  assert.match(control, /requestedOrgId: body\.org_id/);
});

test("scheduling is persisted and validates the IANA timezone", () => {
  assert.match(migration, /pg_timezone_names/);
  assert.match(migration, /scheduled_at\s*=\s*v_effective_schedule/);
  assert.match(control, /Intl\.DateTimeFormat/);
  assert.match(campaignUi, /scheduledAt:/);
});

test("rescheduling changes only pending retryable work", () => {
  assert.match(migration, /function public\.wa_reschedule_campaign/);
  assert.match(migration, /status in \('scheduled','queued','failed'\)/);
  assert.match(whatsappService, /export async function reagendarCampanhaWa/);
});

test("paused campaigns cannot be reserved", () => {
  assert.match(migration, /c\.status='ativa'/);
  assert.match(migration, /set status='pausada'/);
});

test("resume revalidates opt-out without restarting completed deliveries", () => {
  assert.match(migration, /l\.whatsapp_opt_out/);
  assert.match(migration, /e\.status in \('queued','scheduled','failed'\)/);
  assert.doesNotMatch(migration, /e\.status in \([^)]*'accepted'[^)]*\)/);
});

test("cancellation only changes deliveries that were not confirmed", () => {
  assert.match(
    migration,
    /status in \('draft','pending_approval','scheduled','queued','failed','blocked'\)/,
  );
});

test("provider attempt limits are independent from harmless worker deferrals", () => {
  assert.match(migration, /provider_attempt_count/);
  assert.match(migration, /provider_attempt_count=provider_attempt_count\+1/);
  assert.match(worker, /delivery\.provider_attempt_count \+ 1/);
});

test("failure after provider dispatch is recovered as uncertain after restart", () => {
  assert.match(worker, /persistence_after_send/);
  assert.match(migration, /lease_expired_after_dispatch/);
  assert.match(migration, /provider_requested_at is null then 'queued' else 'uncertain'/);
});

test("disconnected instances are excluded both at reservation and immediately before send", () => {
  assert.match(migration, /i\.status='conectado'/);
  assert.match(worker, /instance\.status !== "conectado"/);
  assert.match(worker, /instancia_indisponivel/);
});

test("attempt history is append-only per logical attempt", () => {
  assert.match(migration, /create table if not exists public\.wa_envio_tentativas/);
  assert.match(migration, /unique\(envio_id, attempt_number\)/);
  assert.match(worker, /completeAttempt/);
  assert.doesNotMatch(worker, /from\("wa_envio_tentativas"\)\s*\.delete/);
});

test("repeated critical failures auto-pause instead of rotating instances", () => {
  assert.match(migration, /failure_pause_threshold/);
  assert.match(migration, /wa_register_campaign_health/);
  assert.match(worker, /critical: true/);
  assert.doesNotMatch(worker, /rotate|rotation|rod[ií]zio/i);
});

test("real metrics distinguish accepted, delivered, failed, uncertain, and responses", () => {
  for (const metric of ["sent", "delivered", "failed", "uncertain", "responses"]) {
    assert.match(control, new RegExp(`${metric}`));
  }
  assert.match(control, /chip_metrics/);
  assert.doesNotMatch(campaignUi, /CAMPANHAS_REFERENCIA|CHIPS_REFERENCIA|ATIVIDADES_REFERENCIA/);
});

test("inbound responses are attributed to an exact organization delivery", () => {
  assert.match(webhook, /\.eq\("org_id", inst\.org_id\)/);
  assert.match(webhook, /attributedDelivery/);
  assert.match(webhook, /campanha_id: attributedDelivery/);
});

test("prepared content is an immutable snapshot in the queue", () => {
  assert.match(migration, /immutable_message/);
  assert.match(migration, /'snapshot-v1'/);
  assert.match(migration, /idempotency_key/);
});

test("the browser never calls the provider or starts a timer-based worker", () => {
  assert.doesNotMatch(campaignUi, /enviarTextoInstancia|Evolution|setTimeout\s*\(/);
  assert.match(campaignUi, /criarRascunhoCampanhaWa/);
  assert.match(campaignUi, /prepararCampanhaWa/);
});

test("existing Evolution and authorization contracts are reused", () => {
  assert.match(worker, /from "\.\.\/_shared\/wa\.ts"/);
  assert.match(control, /whatsapp-authorization\.ts/);
  assert.match(config, /\[functions\.wa-webhook\]/);
});
