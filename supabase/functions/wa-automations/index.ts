import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import {
  automationRunKey,
  planAutomation,
  validateAutomationDefinition,
  type WaAutomationDefinition,
  type WaAutomationEvent,
} from "../_shared/whatsapp-automation.ts";
import { definitionFromRow } from "../_shared/whatsapp-automation-runtime.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function snapshotScript(
  admin: ReturnType<typeof createClient>,
  orgId: string,
  definition: WaAutomationDefinition,
) {
  const actions = structuredClone(definition.actions);
  for (const action of actions) {
    const scriptId = action.config.script_id;
    if (scriptId === undefined) continue;
    if (typeof scriptId !== "string" || !UUID.test(scriptId)) throw new Error("SCRIPT_INVALID");
    const { data: script } = await admin
      .from("wa_scripts")
      .select("id,nome,tipo,mensagem,media_url,criado_em")
      .eq("id", scriptId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!script) throw new Error("SCRIPT_NOT_FOUND");
    action.config = {
      ...action.config,
      script_snapshot: script.mensagem ?? "",
      script_snapshot_name: script.nome,
      script_snapshot_type: script.tipo,
      script_snapshot_created_at: script.criado_em,
    };
  }
  return { ...definition, actions };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, req);
  const authorization = req.headers.get("Authorization") ?? "";
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  );
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corpo inválido." }, 400, req);
  }
  const action = typeof body.acao === "string" ? body.acao : "snapshot";
  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission: "manage_automations",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status, req);
  }

  if (action === "snapshot") {
    const [automations, settings, platform, runs, scripts] = await Promise.all([
      admin
        .from("wa_automations")
        .select("*")
        .eq("org_id", context.orgId)
        .neq("status", "arquivada")
        .order("updated_at", { ascending: false }),
      admin
        .from("wa_automation_org_settings")
        .select("engine_enabled,timezone")
        .eq("org_id", context.orgId)
        .maybeSingle(),
      admin
        .from("wa_automation_platform_controls")
        .select("automation_execution_enabled")
        .eq("singleton", true)
        .maybeSingle(),
      admin
        .from("wa_automation_runs")
        .select(
          "id,automation_id,automation_version,mode,state,planned_actions,executed_actions,blockers,sanitized_error,started_at,finished_at",
        )
        .eq("org_id", context.orgId)
        .order("started_at", { ascending: false })
        .limit(100),
      admin
        .from("wa_scripts")
        .select("id,nome,tipo,mensagem,criado_em")
        .eq("org_id", context.orgId)
        .order("criado_em", { ascending: false }),
    ]);
    const failed = [automations, settings, platform, runs, scripts].find((result) => result.error);
    if (failed?.error) {
      console.error("wa-automations snapshot failed", failed.error.code);
      return json({ error: "Não foi possível carregar as automações." }, 503, req);
    }
    return json(
      {
        automations: automations.data ?? [],
        controls: {
          organization_enabled: settings.data?.engine_enabled === true,
          platform_enabled: platform.data?.automation_execution_enabled === true,
          dispatch_enabled: false,
          timezone: settings.data?.timezone ?? "America/Sao_Paulo",
        },
        runs: runs.data ?? [],
        scripts: scripts.data ?? [],
      },
      200,
      req,
    );
  }

  if (action === "save") {
    let definition = body.definition as WaAutomationDefinition;
    const errors = validateAutomationDefinition(definition);
    if (errors.length) return json({ error: "Definição inválida.", details: errors }, 422, req);
    try {
      definition = await snapshotScript(admin, context.orgId, definition);
    } catch (error) {
      return json(
        {
          error:
            error instanceof Error && error.message === "SCRIPT_NOT_FOUND"
              ? "Script não encontrado nesta organização."
              : "Script inválido.",
        },
        422,
        req,
      );
    }
    if (definition.id && !UUID.test(definition.id))
      return json({ error: "Automação inválida." }, 422, req);
    const result = await admin.rpc("wa_save_automation_definition", {
      p_org: context.orgId,
      p_actor: context.userId,
      p_definition: definition,
      p_automation: definition.id ?? null,
      p_expected_version: definition.id ? definition.version : null,
    });
    if (result.error || !result.data) {
      const stale = result.error?.code === "40001";
      return json(
        {
          error: stale
            ? "A automação foi alterada por outra pessoa. Atualize a tela."
            : "Não foi possível salvar a automação.",
        },
        409,
        req,
      );
    }
    return json({ automation: result.data }, 200, req);
  }

  const automationId = typeof body.automation_id === "string" ? body.automation_id : "";
  if (!UUID.test(automationId)) return json({ error: "Automação inválida." }, 422, req);
  const { data: current } = await admin
    .from("wa_automations")
    .select("*")
    .eq("id", automationId)
    .eq("org_id", context.orgId)
    .maybeSingle();
  if (!current) return json({ error: "Automação não encontrada." }, 404, req);

  if (action === "set_status") {
    const status = body.status;
    if (status !== "ativa" && status !== "pausada" && status !== "rascunho")
      return json({ error: "Status inválido." }, 422, req);
    const result = await admin.rpc("wa_save_automation_definition", {
      p_org: context.orgId,
      p_actor: context.userId,
      p_definition: { ...definitionFromRow(current), status },
      p_automation: automationId,
      p_expected_version: current.version,
    });
    return result.error || !result.data
      ? json({ error: "Não foi possível alterar o status." }, 409, req)
      : json({ automation: result.data, execution_enabled: false }, 200, req);
  }
  if (action === "archive") {
    const result = await admin.rpc("wa_save_automation_definition", {
      p_org: context.orgId,
      p_actor: context.userId,
      p_definition: { ...definitionFromRow(current), status: "arquivada" },
      p_automation: automationId,
      p_expected_version: current.version,
    });
    return result.error
      ? json({ error: "Não foi possível arquivar a automação." }, 409, req)
      : json({ ok: true }, 200, req);
  }
  if (action === "duplicate") {
    const original = definitionFromRow(current);
    const result = await admin.rpc("wa_save_automation_definition", {
      p_org: context.orgId,
      p_actor: context.userId,
      p_definition: {
        ...original,
        id: undefined,
        name: `${original.name} (Cópia)`,
        status: "rascunho",
        version: 1,
      },
      p_automation: null,
      p_expected_version: null,
    });
    return result.error || !result.data
      ? json({ error: "Não foi possível duplicar a automação." }, 409, req)
      : json({ automation: result.data }, 200, req);
  }
  if (action === "simulate") {
    const definition = definitionFromRow(current);
    const payload =
      body.event && typeof body.event === "object" && !Array.isArray(body.event)
        ? (body.event as Record<string, unknown>)
        : {};
    const event: WaAutomationEvent = {
      id: crypto.randomUUID(),
      orgId: context.orgId,
      source: "simulation",
      resource: "conversation",
      type: definition.trigger.type,
      occurredAt: new Date().toISOString(),
      conversationId:
        typeof payload.conversation_id === "string" ? payload.conversation_id : undefined,
      leadId: typeof payload.lead_id === "string" ? payload.lead_id : undefined,
      depth: 0,
      payload,
    };
    if (event.conversationId) {
      if (!UUID.test(event.conversationId)) return json({ error: "Conversa inválida." }, 422, req);
      const { data: conversation } = await admin
        .from("wa_conversas")
        .select("id")
        .eq("id", event.conversationId)
        .eq("org_id", context.orgId)
        .maybeSingle();
      if (!conversation) return json({ error: "Conversa não pertence à organização." }, 422, req);
    }
    if (event.leadId) {
      if (!UUID.test(event.leadId)) return json({ error: "Lead inválido." }, 422, req);
      const { data: lead } = await admin
        .from("leads")
        .select("id")
        .eq("id", event.leadId)
        .eq("org_id", context.orgId)
        .maybeSingle();
      if (!lead) return json({ error: "Lead não pertence à organização." }, 422, req);
    }
    const [{ data: orgSettings }, { data: platform }] = await Promise.all([
      admin
        .from("wa_automation_org_settings")
        .select("engine_enabled")
        .eq("org_id", context.orgId)
        .maybeSingle(),
      admin
        .from("wa_automation_platform_controls")
        .select("automation_execution_enabled")
        .eq("singleton", true)
        .maybeSingle(),
    ]);
    const plan = planAutomation({
      definition,
      event,
      controls: {
        ruleEnabled: definition.status === "ativa",
        organizationEnabled: orgSettings?.engine_enabled === true,
        platformEnabled: platform?.automation_execution_enabled === true,
        dispatchEnabled: false,
      },
    });
    const result = await admin.from("wa_automation_runs").insert({
      org_id: context.orgId,
      automation_id: automationId,
      automation_version: definition.version,
      run_key: `simulation:${automationRunKey(automationId, definition.version, event.id)}`,
      mode: "simulation",
      state: plan.blockers.length ? "blocked" : "planned",
      conversation_id: event.conversationId,
      lead_id: event.leadId,
      condition_results: plan.conditionResults,
      planned_actions: plan.plannedActions,
      blockers: plan.blockers,
      finished_at: new Date().toISOString(),
    });
    return result.error
      ? json({ error: "Não foi possível registrar a simulação." }, 503, req)
      : json({ simulation: plan }, 200, req);
  }
  return json({ error: "Ação não suportada." }, 422, req);
});
