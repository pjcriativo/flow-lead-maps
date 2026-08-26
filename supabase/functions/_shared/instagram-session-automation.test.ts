// Suite: Motor seguro de comentários do Instagram
// Invariant: um comentário externo gera no máximo um job e uma tentativa de Direct.
// Boundary IN: migrations, worker e gateway versionados neste repositório.
// Boundary OUT: PostgreSQL, agendador e Instagram; validados separadamente em smoke sem envio real.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../../", import.meta.url);
const migration = readFileSync(
  new URL("supabase/migrations/099_instagram_session_automation.sql", root),
  "utf8",
);
const schedule = readFileSync(
  new URL("supabase/migrations/100_instagram_session_automation_schedule.sql", root),
  "utf8",
);
const worker = readFileSync(new URL("workers/instagram-connector/app.py", root), "utf8");
const cron = readFileSync(
  new URL("supabase/functions/instagram-session-automation-cron/index.ts", root),
  "utf8",
);

test("impõe idempotência no evento e no trabalho antes de qualquer envio", () => {
  assert.match(migration, /unique \(instance_id, external_comment_id\)/i);
  assert.match(migration, /idempotency_key text not null unique/i);
  assert.match(migration, /unique \(event_id\)/i);
  assert.match(migration, /on conflict \(instance_id, external_comment_id\) do nothing/i);
  assert.match(migration, /previous\.external_commenter_id/);
  assert.match(migration, /interval '30 days'/);
  assert.match(migration, /contact_cooldown/);
});

test("não repete uma entrega cujo resultado ficou desconhecido", () => {
  assert.match(migration, /status = 'review', error_code = 'delivery_unknown'/i);
  assert.match(worker, /"p_error_code": "delivery_unknown"/);
  assert.doesNotMatch(worker, /for\s+attempt\s+in/i);
});

test("reserva limites por organização e restringe execução ao service role", () => {
  assert.match(migration, /instagram_automation_limit:/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /limite_flow_business_dms_mes/);
  assert.match(migration, /limite_flow_business_dms_dia/);
  assert.match(migration, /interval '30 minutes'/);
  assert.match(migration, /interval '10 minutes'/);
  assert.match(migration, /auth\.role\(\) <> 'service_role'/);
  assert.match(migration, /provider = 'session_worker'/);
});

test("agenda por segredo e assina a chamada interna ao worker", () => {
  assert.match(schedule, /followup_cron_secret/);
  assert.match(schedule, /instagram-session-automation-cron/);
  assert.match(cron, /x-cron-secret/);
  assert.match(cron, /INSTAGRAM_CONNECTOR_SECRET/);
  assert.match(cron, /X-Flow-Signature/);
  assert.match(worker, /verify_signature\(raw,/);
});
