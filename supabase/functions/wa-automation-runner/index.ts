// Edge: wa-automation-runner — executor real das automações WhatsApp (backend-only).
//
// A cada execução: emite follow-ups vencidos como eventos, reserva eventos capturados das
// conversas (lease), avalia as automações ATIVAS da organização com o mesmo planner da simulação
// e executa as ações permitidas sobre o CRM existente (etiqueta, nota, status, responsável,
// atividade, follow-up). Nunca envia WhatsApp: ações de envio ficam bloqueadas pelo planner.
//
// Travas (todas precisam estar ligadas para executar): regra 'ativa', motor da organização
// (wa_automation_org_settings.engine_enabled) e chave da plataforma
// (wa_automation_platform_controls.automation_execution_enabled, travada em false por CHECK até a
// homologação). Com qualquer trava desligada, a execução é registrada como 'preparation'/'blocked'.
//
// Idempotência: um run por (automação, versão, evento) — unique(org_id, run_key).
// Anti-loop: profundidade causal propagada pelo banco; o planner bloqueia a partir de 5.
// Auth: x-cron-secret (CRON_SECRET) ou x-wa-worker-secret (WA_WORKER_SECRET).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";
import {
  automationRunKey,
  planAutomation,
  type WaAutomationEvent,
} from "../_shared/whatsapp-automation.ts";
import {
  comandosDaAcao,
  definitionFromRow,
  montarPayloadAutomacao,
  type ContextoConversa,
  type ContextoLead,
} from "../_shared/whatsapp-automation-runtime.ts";

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index++) {
    difference |= (a[index % Math.max(a.length, 1)] ?? 0) ^ (b[index % Math.max(b.length, 1)] ?? 0);
  }
  return difference === 0;
}

type EventRow = {
  id: string;
  org_id: string;
  source: WaAutomationEvent["source"];
  resource_type: WaAutomationEvent["resource"];
  event_type: WaAutomationEvent["type"];
  conversation_id: string | null;
  lead_id: string | null;
  causation_id: string | null;
  depth: number;
  occurred_at: string;
  payload: Record<string, unknown>;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const workerSecret = Deno.env.get("WA_WORKER_SECRET") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const suppliedWorker = request.headers.get("x-wa-worker-secret") ?? "";
  const suppliedCron = request.headers.get("x-cron-secret") ?? "";
  const authorized =
    (workerSecret !== "" &&
      suppliedWorker !== "" &&
      constantTimeEqual(workerSecret, suppliedWorker)) ||
    (cronSecret !== "" && suppliedCron !== "" && constantTimeEqual(cronSecret, suppliedCron));
  if (!authorized) return json({ error: "Não autorizado." }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  let limit = 25;
  try {
    const body = await request.json();
    if (typeof body?.limit === "number") limit = Math.min(Math.max(Math.trunc(body.limit), 1), 100);
  } catch {
    // Corpo opcional.
  }

  const summary = {
    followups_emitidos: 0,
    eventos: 0,
    execucoes: 0,
    bloqueadas: 0,
    duplicadas: 0,
    acoes_executadas: 0,
    acoes_falharam: 0,
  };

  const { data: emitted } = await admin.rpc("wa_automation_emit_due_followups", { p_limit: 50 });
  summary.followups_emitidos = Number(emitted ?? 0);

  const { data: platform } = await admin
    .from("wa_automation_platform_controls")
    .select("automation_execution_enabled")
    .eq("singleton", true)
    .maybeSingle();
  const platformEnabled = platform?.automation_execution_enabled === true;

  const { data: claimed, error: claimError } = await admin.rpc("wa_automation_claim_events", {
    p_limit: limit,
    p_lease_seconds: 120,
  });
  if (claimError) return json({ error: "Falha ao reservar eventos." }, 503);

  for (const row of (claimed ?? []) as EventRow[]) {
    summary.eventos++;
    const [{ data: automations }, { data: orgSettings }] = await Promise.all([
      admin
        .from("wa_automations")
        .select("*")
        .eq("org_id", row.org_id)
        .eq("status", "ativa")
        .eq("trigger->>type", row.event_type),
      admin
        .from("wa_automation_org_settings")
        .select("engine_enabled,timezone")
        .eq("org_id", row.org_id)
        .maybeSingle(),
    ]);

    let conversa: ContextoConversa | null = null;
    let lead: ContextoLead | null = null;
    if (row.conversation_id && (automations ?? []).length) {
      const [{ data: conv }, { data: tags }] = await Promise.all([
        admin
          .from("wa_conversas")
          .select("origin,instancia_id,status,assigned_to,contact_name,normalized_phone,lead_id")
          .eq("id", row.conversation_id)
          .eq("org_id", row.org_id)
          .maybeSingle(),
        admin
          .from("wa_conversa_etiquetas")
          .select("etiqueta_id")
          .eq("conversa_id", row.conversation_id)
          .eq("org_id", row.org_id),
      ]);
      if (conv) {
        conversa = {
          ...conv,
          tag_ids: (tags ?? []).map((tag: { etiqueta_id: string }) => tag.etiqueta_id),
        };
      }
      const leadId = row.lead_id ?? conv?.lead_id ?? null;
      if (leadId) {
        const { data: leadRow } = await admin
          .from("leads")
          .select("id,status,business_name,whatsapp_opt_in,whatsapp_opt_in_at,whatsapp_opt_out")
          .eq("id", leadId)
          .eq("org_id", row.org_id)
          .maybeSingle();
        lead = leadRow ?? null;
      }
    }

    for (const automationRow of automations ?? []) {
      const definition = definitionFromRow(automationRow);
      const payload = {
        ...montarPayloadAutomacao({
          conversa,
          lead,
          ocorridoEm: row.occurred_at,
          timezone: orgSettings?.timezone ?? "America/Sao_Paulo",
        }),
        event: {
          ...montarPayloadAutomacao({ conversa, lead, ocorridoEm: row.occurred_at }).event,
          ...((row.payload?.event as Record<string, unknown>) ?? {}),
        },
      };
      const event: WaAutomationEvent = {
        id: row.id,
        orgId: row.org_id,
        source: row.source,
        resource: row.resource_type,
        type: row.event_type,
        occurredAt: row.occurred_at,
        conversationId: row.conversation_id ?? undefined,
        leadId: lead?.id ?? row.lead_id ?? undefined,
        causationId: row.causation_id ?? undefined,
        depth: row.depth,
        payload,
      };
      const plan = planAutomation({
        definition,
        event,
        controls: {
          ruleEnabled: definition.status === "ativa",
          organizationEnabled: orgSettings?.engine_enabled === true,
          platformEnabled,
          dispatchEnabled: false,
        },
      });
      const executar = plan.blockers.length === 0 && Boolean(row.conversation_id);
      const runKey = automationRunKey(String(definition.id), definition.version, row.id);
      const { data: run, error: runError } = await admin
        .from("wa_automation_runs")
        .insert({
          org_id: row.org_id,
          automation_id: definition.id,
          automation_version: definition.version,
          event_id: row.id,
          run_key: runKey,
          mode: executar ? "execution" : "preparation",
          state: executar
            ? "planned"
            : plan.blockers.includes("causality_depth_limit")
              ? "cycle_blocked"
              : "blocked",
          conversation_id: row.conversation_id,
          lead_id: lead?.id ?? null,
          condition_results: plan.conditionResults,
          planned_actions: plan.plannedActions,
          blockers: plan.blockers,
          finished_at: executar ? null : new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();
      if (runError) {
        if (String(runError.code) === "23505") summary.duplicadas++;
        continue;
      }
      if (!executar || !run) {
        summary.bloqueadas++;
        continue;
      }

      summary.execucoes++;
      const executadas: Array<Record<string, unknown>> = [];
      let falhou = false;
      const actor = String(automationRow.updated_by);
      const variaveis = (payload.variables ?? {}) as Record<string, unknown>;
      for (const [indice, action] of plan.plannedActions.entries()) {
        if (action.blocked) {
          executadas.push({ type: action.type, status: "bloqueada", reason: action.reason });
          continue;
        }
        for (const comando of comandosDaAcao(action, variaveis)) {
          let resultado: { error: { code?: string; message?: string } | null } = { error: null };
          if (comando.tipo === "conversa") {
            resultado = await admin.rpc("wa_automation_execute_action", {
              p_org: row.org_id,
              p_conversation: row.conversation_id,
              p_actor: actor,
              p_action: comando.acao,
              p_value: comando.valor,
              p_event: row.id,
              p_depth: row.depth,
            });
          } else if (comando.tipo === "atividade") {
            resultado = await admin.rpc("wa_automation_record_activity", {
              p_org: row.org_id,
              p_conversation: row.conversation_id,
              p_actor: actor,
              p_details: { ...comando.detalhes, automation_id: definition.id, run_id: run.id },
            });
          } else if (comando.tipo === "follow_up") {
            resultado = await admin.rpc("wa_automation_schedule_followup", {
              p_org: row.org_id,
              p_automation: definition.id,
              p_version: definition.version,
              p_conversation: row.conversation_id,
              p_lead: lead?.id ?? null,
              p_due_at: new Date(Date.now() + comando.atrasoMinutos * 60_000).toISOString(),
              p_timezone: orgSettings?.timezone ?? "America/Sao_Paulo",
              p_key: `${runKey}:followup:${indice}`,
              p_depth: row.depth,
            });
          }
          if (comando.tipo === "bloqueado") {
            executadas.push({ type: action.type, status: "bloqueada", reason: comando.motivo });
          } else if (resultado.error) {
            falhou = true;
            summary.acoes_falharam++;
            executadas.push({
              type: action.type,
              status: "falhou",
              code: resultado.error.code ?? "erro",
            });
          } else {
            summary.acoes_executadas++;
            executadas.push({ type: action.type, status: "executada", comando: comando.tipo });
          }
        }
      }
      await admin
        .from("wa_automation_runs")
        .update({
          state: falhou ? "failed" : "completed",
          executed_actions: executadas,
          sanitized_error: falhou ? "Uma ou mais ações não puderam ser executadas." : null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .eq("org_id", row.org_id);
    }
    await admin.rpc("wa_automation_finish_event", { p_org: row.org_id, p_event: row.id });
  }

  return json({ ok: true, plataforma_ligada: platformEnabled, ...summary });
});
