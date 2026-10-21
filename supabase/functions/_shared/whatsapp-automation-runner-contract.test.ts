// Suite: contrato do executor de automações WhatsApp.
// Invariante: o runner nunca envia WhatsApp, só age pelo CRM existente, é idempotente por
// evento e respeita as três travas (regra, organização, plataforma).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runner = readFileSync("supabase/functions/wa-automation-runner/index.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/202610210006_wa_automation_executor.sql",
  "utf8",
);
const engine = readFileSync("supabase/migrations/202610160005_wa_automation_engine.sql", "utf8");
const config = readFileSync("supabase/config.toml", "utf8");

test("runner has no WhatsApp transport path", () => {
  assert.doesNotMatch(
    runner,
    /enviarTextoInstancia|wa_reserve_outbound_message|from\("wa_envios"\)|send\/text/,
  );
  assert.match(runner, /dispatchEnabled: false/);
});

test("runner is backend-only and authenticated by an internal secret", () => {
  assert.match(config, /\[functions\.wa-automation-runner\][\s\S]*?verify_jwt = false/);
  assert.match(runner, /CRON_SECRET/);
  assert.match(runner, /WA_WORKER_SECRET/);
  assert.match(runner, /constantTimeEqual/);
});

test("execution requires rule, organization and platform switches, and the platform stays locked", () => {
  assert.match(runner, /ruleEnabled: definition\.status === "ativa"/);
  assert.match(runner, /organizationEnabled: orgSettings\?\.engine_enabled === true/);
  assert.match(runner, /automation_execution_enabled/);
  assert.match(engine, /check \(automation_execution_enabled = false\)/);
  assert.doesNotMatch(migration, /automation_execution_enabled\s*=\s*true|drop constraint/i);
});

test("events are leased, finished and run at most once per automation version", () => {
  assert.match(runner, /wa_automation_claim_events/);
  assert.match(runner, /wa_automation_finish_event/);
  assert.match(runner, /automationRunKey\(/);
  assert.match(runner, /"23505"/);
  assert.match(migration, /for update skip locked/);
  assert.match(migration, /e\.attempts < 5/);
});

test("actions reuse the CRM conversation action and carry causal depth (anti-loop)", () => {
  assert.match(
    migration,
    /public\.wa_conversation_action\(p_org, p_conversation, p_actor, p_action, v_value\)/,
  );
  assert.match(
    migration,
    /p_action not in \('add_tag','remove_tag','add_note','transfer','set_status'\)/,
  );
  assert.match(migration, /set_config\('wa\.automation_depth'/);
  assert.match(migration, /current_setting\('wa\.automation_depth', true\)/);
  assert.match(migration, /least\(/);
});

test("every new executor function is restricted to service_role", () => {
  for (const fn of [
    "wa_automation_claim_events",
    "wa_automation_finish_event",
    "wa_automation_execute_action",
    "wa_automation_record_activity",
    "wa_automation_schedule_followup",
    "wa_automation_emit_due_followups",
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public,anon,authenticated`),
    );
    assert.match(
      migration,
      new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to service_role`),
    );
  }
});
