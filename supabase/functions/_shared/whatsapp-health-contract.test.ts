// Suite: WhatsApp health, reconnection and contingency contracts.
// Invariant: only recent tenant-scoped evidence can authorize transport or operational UI state.
// Boundary IN: migration, Edge, worker, webhook and browser source contracts.
// Boundary OUT: deployed PostgreSQL and live Evolution GO, intentionally not exercised locally.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");
const migration = read("supabase/migrations/202610160003_wa_instance_health.sql");
const monitor = read("supabase/functions/wa-health-monitor/index.ts");
const chips = read("supabase/functions/wa-chips/index.ts");
const worker = read("supabase/functions/wa-send-worker/index.ts");
const webhook = read("supabase/functions/wa-webhook/index.ts");
const service = read("src/services/whatsapp.ts");
const numbersUi = read("src/components/whatsapp/WaNumeros.tsx");
const config = read("supabase/config.toml");

test("monitoring requires an internal secret and has bounded concurrency", () => {
  assert.match(monitor, /WA_WORKER_SECRET/);
  assert.match(monitor, /constantTimeEqual/);
  assert.match(monitor, /mapWithConcurrency\([^,]+, 4,/);
});

test("monitoring is tenant-filterable and never receives browser credentials", () => {
  assert.match(monitor, /requestedOrg/);
  assert.match(monitor, /query = query\.eq\("org_id", requestedOrg\)/);
  assert.doesNotMatch(monitor, /auth\.getUser/);
});

test("monitoring has a controlled provider timeout and persisted backoff", () => {
  assert.match(monitor, /observarStatusInstancia\(tokenRow\.token, 8_000\)/);
  assert.match(migration, /next_health_check_at/);
  assert.match(migration, /least\(900,30\*power/);
});

test("the migration stores provider and operational state separately", () => {
  assert.match(migration, /provider_status text not null default 'unknown'/);
  assert.match(migration, /operational_health text not null default 'unknown'/);
  assert.match(migration, /last_provider_success_at timestamptz/);
});

test("out-of-order observations are rejected under a row lock", () => {
  assert.match(migration, /for update/);
  assert.match(migration, /p_observed_at < coalesce\(v_old\.last_provider_event_at/);
  assert.match(migration, /return false/);
});

test("alerts are deduplicated, grouped, acknowledged and resolved", () => {
  assert.match(migration, /wa_alertas_open_dedup_idx/);
  assert.match(migration, /occurrences=public\.wa_alertas\.occurrences\+1/);
  assert.match(migration, /acknowledged_at/);
  assert.match(migration, /resolved_at=p_observed_at/);
});

test("incident history is tenant-scoped and idempotent", () => {
  assert.match(migration, /create table if not exists public\.wa_instancia_incidentes/);
  assert.match(migration, /unique\(org_id, event_key\)/);
  assert.match(migration, /wa_role_allowed\(org_id/);
});

test("manual reconnection validates ownership and does not recreate or replace a token", () => {
  const reconnect = chips.slice(
    chips.indexOf('action === "reconectar"'),
    chips.indexOf('action === "status"'),
  );
  assert.match(reconnect, /instanciaDaOrgComToken\(admin, context\.orgId, instanceId\)/);
  assert.doesNotMatch(reconnect, /recriar|delete|wa_instancia_tokens/);
});

test("QR and pairing use the existing tenant instance and QR is not persisted", () => {
  assert.doesNotMatch(chips, /recriarInstanciaPorId/);
  assert.doesNotMatch(chips, /\.insert\([^)]*qr|console\.log\([^)]*qr/is);
  assert.doesNotMatch(numbersUi, /api\.qrserver\.com/);
});

test("priority is serialized, tenant-scoped and audited", () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /where id=p_instance and org_id=p_org/);
  assert.match(migration, /'priority_changed'/);
});

test("contingency requires explicit persisted authorization and distinct instances", () => {
  assert.match(migration, /create table if not exists public\.wa_contingencias/);
  assert.match(migration, /authorized_by uuid not null/);
  assert.match(migration, /check \(source_instance_id <> backup_instance_id\)/);
  assert.doesNotMatch(worker, /backup_instance_id/);
});

test("worker defers unavailable or stale instances without sending", () => {
  const healthGate = worker.slice(
    worker.indexOf("const healthIsFresh"),
    worker.indexOf("const sentToday"),
  );
  assert.match(healthGate, /operational_health !== "healthy"/);
  assert.match(healthGate, /wa_defer_delivery_for_instance_health/);
  assert.doesNotMatch(healthGate, /enviarTextoInstancia/);
});

test("deferred health failures preserve the queue and uncertain items remain protected", () => {
  assert.match(migration, /set status='queued',next_attempt_at=now\(\)\+interval '5 minutes'/);
  assert.match(worker, /wa_mark_delivery_dispatched/);
  assert.match(worker, /requestDispatched = true/);
});

test("dispatch remains opt-in and no health cron is created", () => {
  assert.match(worker, /campaign\.dispatch_enabled/);
  assert.match(migration, /Nenhum pg_cron é criado/);
  assert.doesNotMatch(migration, /cron\.schedule\s*\(/);
  assert.match(config, /\[functions\.wa-health-monitor\][\s\S]*verify_jwt = false/);
});

test("webhook derives organization from the stored instance and service never exposes tokens", () => {
  assert.match(webhook, /\.eq\("nome", nomeInstancia\)/);
  assert.match(webhook, /p_org: inst\.org_id/);
  assert.doesNotMatch(service, /wa_instancia_tokens|select\([^)]*token/);
});

test("webhook configuration reports provider network failure without throwing", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  globalThis.fetch = async () => {
    throw new TypeError("provider unavailable");
  };
  try {
    const { definirWebhookInstancia } = await import("./wa.ts");
    assert.deepEqual(await definirWebhookInstancia("instance-token", "https://webhook.invalid"), {
      ok: false,
      status: 503,
    });
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});
