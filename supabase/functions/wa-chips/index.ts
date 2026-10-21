import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsPreflightResponse, json as jsonResponse } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import type { WhatsappPermission } from "../_shared/whatsapp-policy.ts";
import {
  atualizarChip,
  checarSaudeChip,
  definirWebhookInstancia,
  excluirInstanciaDaOrg,
  graduarChipDoLead,
  inicializarCofreWa,
  instanciaDaOrgComToken,
  listarInstanciasDaOrg,
  logsPareamentoEvolution,
  obterOuCriarEObterQr,
  pairInstancia,
  qrInstancia,
  observarStatusInstancia,
  obterOuCriarInstanciaParaPareamento,
  verificarEvolutionGo,
  waBase,
  waGlobalKey,
  EvolutionGoPairingError,
  type WaInstanciaOrg,
} from "../_shared/wa.ts";

async function handleRequest(req: Request): Promise<Response> {
  const json = (body: unknown, status = 200) => jsonResponse(body, status, req);
  if (req.method === "OPTIONS") return corsPreflightResponse(req);
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 422);
  }
  const action = String(body.acao || "listar");
  const instanceId = String(body.instancia_id || "");
  const phone = String(body.phone || "").replace(/\D/g, "");
  const permission: WhatsappPermission = [
    "listar",
    "listar_alertas",
    "listar_contingencia",
  ].includes(action)
    ? "view_dashboard"
    : action === "graduar_lead"
      ? "reply_conversations"
      : "manage_numbers";

  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission,
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status);
  }
  const scope = { userId: context.userId, orgId: context.orgId };

  if (action === "listar") {
    return json({ chips: await listarInstanciasDaOrg(admin, context.orgId) });
  }
  if (action === "listar_alertas") {
    const { data, error } = await admin
      .from("wa_alertas")
      .select("id,tipo,mensagem,lido,criado_em,instancia_id,occurrences,last_seen_at,resolved_at")
      .eq("org_id", context.orgId)
      .is("resolved_at", null)
      .order("last_seen_at", { ascending: false });
    if (error) return json({ error: "Não foi possível carregar alertas." }, 503);
    return json({ alertas: data ?? [] });
  }
  if (action === "listar_contingencia") {
    const { data, error } = await admin
      .from("wa_contingencias")
      .select("id,backup_instance_id,status")
      .eq("org_id", context.orgId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (error) return json({ error: "Não foi possível carregar contingência." }, 503);
    return json({ contingencia: data ?? null });
  }
  if (action === "autorizar_contingencia") {
    const backupId = String(body.backup_instancia_id || "");
    const purpose = String(body.finalidade || "").trim();
    const reason = String(body.motivo || "").trim();
    if (!instanceId || !backupId || !purpose || !reason || instanceId === backupId) {
      return json({ error: "Origem, backup, finalidade e motivo válidos são obrigatórios." }, 422);
    }
    const freshness = new Date(Date.now() - 5 * 60_000).toISOString();
    const [{ data: source }, { data: backup }] = await Promise.all([
      admin
        .from("wa_instancias")
        .select("id,operational_health")
        .eq("id", instanceId)
        .eq("org_id", context.orgId)
        .maybeSingle(),
      admin
        .from("wa_instancias")
        .select("id,provider_status,operational_health,last_provider_success_at")
        .eq("id", backupId)
        .eq("org_id", context.orgId)
        .maybeSingle(),
    ]);
    if (!source || !backup) return json({ error: "Instância não encontrada na organização." }, 404);
    if (source.operational_health === "healthy")
      return json({ error: "A origem ainda está saudável." }, 409);
    if (
      backup.provider_status !== "connected" ||
      backup.operational_health !== "healthy" ||
      !backup.last_provider_success_at ||
      backup.last_provider_success_at < freshness
    ) {
      return json({ error: "O backup não possui evidência operacional recente." }, 409);
    }
    const { data, error } = await admin
      .from("wa_contingencias")
      .insert({
        org_id: context.orgId,
        source_instance_id: instanceId,
        backup_instance_id: backupId,
        purpose,
        reason,
        authorized_by: context.userId,
      })
      .select("id")
      .single();
    if (error) return json({ error: "Não foi possível autorizar a contingência." }, 409);
    await admin.rpc("wa_record_instance_event", {
      p_org: context.orgId,
      p_instance: instanceId,
      p_event_type: "contingency_authorized",
      p_source: "manual",
      p_actor: context.userId,
      p_occurred_at: new Date().toISOString(),
      p_event_key: `contingency:${data.id}`,
      p_details: { backup_instance_id: backupId, purpose },
    });
    const alertAt = new Date().toISOString();
    await admin.from("wa_alertas").insert({
      user_id: context.userId,
      org_id: context.orgId,
      instancia_id: instanceId,
      tipo: "contingencia_acionada",
      mensagem: "Contingência autorizada manualmente para continuidade de atendimento.",
      lido: false,
      dedup_key: `instance:${instanceId}:contingency`,
      first_seen_at: alertAt,
      last_seen_at: alertAt,
    });
    return json({ ok: true, id: data.id });
  }
  if (action === "encerrar_contingencia") {
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("wa_contingencias")
      .update({
        status: "ended",
        ended_by: context.userId,
        ended_at: now,
      })
      .eq("org_id", context.orgId)
      .eq("status", "active")
      .select("id");
    if (error) return json({ error: "Não foi possível encerrar a contingência." }, 409);
    await admin
      .from("wa_alertas")
      .update({ resolved_at: now, resolved_by: context.userId, lido: true })
      .eq("org_id", context.orgId)
      .eq("tipo", "contingencia_acionada")
      .is("resolved_at", null);
    return json({ ok: true, encerradas: data?.length ?? 0 });
  }
  await inicializarCofreWa(admin);
  if (!waBase()) return json({ error: "Integração WhatsApp indisponível." }, 503);
  if (action === "validar_integracao") {
    return json({ evolution: await verificarEvolutionGo() });
  }
  if (action === "criar") {
    const funcao = body.funcao === "conversa" ? "conversa" : "disparo";
    const instance = await obterOuCriarInstanciaParaPareamento(admin, scope, funcao);
    if (!instance) return json({ error: "Não foi possível criar o chip." }, 409);
    return json({
      id: instance.id,
      nome: instance.nome,
      status: instance.status,
      funcao: instance.funcao,
    });
  }
  if (action === "criar_e_qr") {
    // Operação atômica: cria/reutiliza instância + gera QR em um único passo com rollback automático.
    // O diagnóstico de "too many clients" e o rollback são feitos dentro de obterOuCriarEObterQr.
    const funcao = body.funcao === "conversa" ? "conversa" : "disparo";
    let result: { instance: WaInstanciaOrg; qr: string };
    try {
      result = await obterOuCriarEObterQr(admin, scope, funcao);
    } catch (error) {
      if (error instanceof EvolutionGoPairingError) {
        return json({ error: error.message }, error.status);
      }
      throw error;
    }
    const { instance, qr } = result;
    await admin.rpc("wa_record_instance_event", {
      p_org: context.orgId,
      p_instance: instance.id,
      p_event_type: "qr_requested",
      p_source: "manual",
      p_actor: context.userId,
      p_occurred_at: new Date().toISOString(),
      p_event_key: `qr:${instance.id}:${Date.now()}`,
      p_details: {},
    });
    return json({
      status: "qr",
      instancia_id: instance.id,
      qr,
      expires_in: 40,
      nome: instance.nome,
      funcao: instance.funcao,
    });
  }
  if (action === "parear") {
    if (phone.length < 12) return json({ error: "Número inválido (DDI+DDD)." }, 422);
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId, true);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    let code: string | null;
    try {
      code = await pairInstancia(instance.token, phone);
    } catch (error) {
      if (error instanceof EvolutionGoPairingError) {
        return json({ error: error.message }, error.status);
      }
      throw error;
    }
    if (!code) return json({ error: "Não foi possível gerar o código." }, 409);
    await admin.rpc("wa_record_instance_event", {
      p_org: context.orgId,
      p_instance: instance.id,
      p_event_type: "pairing_requested",
      p_source: "manual",
      p_actor: context.userId,
      p_occurred_at: new Date().toISOString(),
      p_event_key: `pair:${instance.id}:${Date.now()}`,
      p_details: {},
    });
    return json({ status: "code", instancia_id: instance.id, code });
  }
  if (action === "qr") {
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId, true);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    let qr: string | null;
    try {
      qr = await qrInstancia(instance.token);
    } catch (error) {
      if (error instanceof EvolutionGoPairingError) {
        const providerLogs = await logsPareamentoEvolution(instance.nome);
        console.error("wa QR pairing failed", error.message, providerLogs);
        const databaseOverloaded = providerLogs.some((log) =>
          log.includes("too many clients already"),
        );
        return json(
          {
            error: databaseOverloaded
              ? "O serviço do WhatsApp está temporariamente sobrecarregado. Tente novamente em alguns minutos."
              : error.message,
          },
          databaseOverloaded ? 503 : error.status,
        );
      }
      throw error;
    }
    if (qr) {
      await admin.rpc("wa_record_instance_event", {
        p_org: context.orgId,
        p_instance: instance.id,
        p_event_type: "qr_requested",
        p_source: "manual",
        p_actor: context.userId,
        p_occurred_at: new Date().toISOString(),
        p_event_key: `qr:${instance.id}:${Date.now()}`,
        p_details: {},
      });
    }
    return qr
      ? json({ status: "qr", instancia_id: instance.id, qr, expires_in: 40 })
      : json({ status: "aguardando", instancia_id: instance.id });
  }
  if (action === "reconectar") {
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    const observation = await observarStatusInstancia(instance.token);
    if (observation.ok && observation.loggedIn) {
      await checarSaudeChip(admin, context.orgId, instance.id);
      return json({ status: "conectado", instancia_id: instance.id, requires_pairing: false });
    }
    const now = new Date().toISOString();
    await admin
      .from("wa_instancias")
      .update({
        operational_health: "reconnecting",
        reconnect_started_at: now,
        reconnect_requested_by: context.userId,
        atualizado_em: now,
      })
      .eq("id", instance.id)
      .eq("org_id", context.orgId);
    await admin.rpc("wa_record_instance_event", {
      p_org: context.orgId,
      p_instance: instance.id,
      p_event_type: "reconnect_started",
      p_source: "manual",
      p_actor: context.userId,
      p_occurred_at: now,
      p_event_key: `reconnect:${instance.id}:${Date.now()}`,
      p_details: { provider_evidence: observation.ok ? observation.providerState : "unavailable" },
    });
    return json({ status: "aguardando", instancia_id: instance.id, requires_pairing: true });
  }
  if (action === "status") {
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    await checarSaudeChip(admin, context.orgId, instance.id);
    const chips = await listarInstanciasDaOrg(admin, context.orgId);
    const current = chips.find((chip) => chip.id === instance.id);
    return json({ ...current, instancia_id: instance.id });
  }
  if (action === "excluir") {
    const result = await excluirInstanciaDaOrg(admin, scope, instanceId, body.confirmar === true);
    return json(result, result.motivo === "nao_encontrado" ? 404 : result.ok ? 200 : 409);
  }
  if (action === "marcar") {
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    let priorityOk = true;
    if (typeof body.ordem === "number") {
      const { data, error } = await admin.rpc("wa_set_instance_priority", {
        p_org: context.orgId,
        p_instance: instanceId,
        p_actor: context.userId,
        p_priority: Math.max(0, Math.trunc(body.ordem)),
      });
      priorityOk = !error && data === true;
    }
    const ok = await atualizarChip(admin, context.orgId, instanceId, {
      funcao: typeof body.funcao === "string" ? body.funcao : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
    });
    return json({ ok: ok && priorityOk });
  }
  if (action === "checar") {
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    const result = await checarSaudeChip(admin, context.orgId, instanceId);
    return json(result);
  }
  if (action === "rotacionar") {
    return json(
      { error: "Rotação automática desativada. Autorize uma contingência explícita." },
      409,
    );
  }
  if (action === "ativar_recebimento") {
    const instance = await instanciaDaOrgComToken(admin, context.orgId, instanceId);
    if (!instance) return json({ error: "Chip não encontrado." }, 404);
    const secret = Deno.env.get("WA_WEBHOOK_SECRET") ?? "";
    if (!secret) return json({ error: "Webhook indisponível." }, 503);
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/wa-webhook?k=${secret}`;
    const events =
      Array.isArray(body.eventos) && body.eventos.length ? body.eventos.map(String) : ["MESSAGE"];
    const result = await definirWebhookInstancia(instance.token, url, events);
    return json({ ok: result.ok, status: result.status });
  }
  if (action === "graduar_lead") {
    const leadId = String(body.lead_id || "");
    if (!leadId) return json({ error: "Lead inválido." }, 422);
    const { data: lead } = await admin
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("org_id", context.orgId)
      .maybeSingle();
    if (!lead) return json({ error: "Lead não encontrado." }, 404);
    return json(await graduarChipDoLead(admin, scope, leadId));
  }
  return json({ error: "Ação desconhecida." }, 422);
}

Deno.serve((req) =>
  handleRequest(req).catch((error) => {
    console.error(
      "wa-chips unhandled request failure",
      error instanceof Error ? error.name : "error",
    );
    return jsonResponse({ error: "Erro interno." }, 500, req);
  }),
);
