import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import { isAssignedConversationAllowed } from "../_shared/whatsapp-policy.ts";
import { extractProviderMessageId } from "../_shared/whatsapp-delivery-engine.ts";
import { canDispatchWithInstance } from "../_shared/whatsapp-instance-health.ts";
import {
  enviarTextoInstancia,
  inicializarCofreWa,
  instanciaDaOrgComToken,
  waBase,
} from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 422);
  }

  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission: "reply_conversations",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status);
  }

  const conversationId = String(body.conversa_id || "");
  const operationId = String(body.operation_id || "");
  const text = String(body.texto || "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(conversationId) || !uuid.test(operationId) || !text || text.length > 4096)
    return json({ error: "Conversa, operação e mensagem válidas são obrigatórias." }, 422);

  const { data: conversation } = await admin
    .from("wa_conversas")
    .select("id,org_id,normalized_phone,remote_contact_id,lead_id,assigned_to,instancia_id,status")
    .eq("id", conversationId)
    .eq("org_id", context.orgId)
    .maybeSingle();
  if (!conversation) return json({ error: "Conversa não encontrada." }, 404);
  if (conversation.status === "archived") {
    return json({ error: "Conversa arquivada não aceita novas mensagens." }, 409);
  }

  if (
    !isAssignedConversationAllowed({
      role: context.role,
      userId: context.userId,
      assignedTo: conversation.assigned_to,
      leadId: conversation.lead_id,
    })
  ) {
    return json({ error: "Conversa não atribuída a este atendente." }, 403);
  }

  await inicializarCofreWa(admin);
  if (!waBase()) return json({ error: "Integração WhatsApp indisponível." }, 503);
  if (!conversation.normalized_phone) {
    return json({ error: "Este contato não possui número confirmado para resposta manual." }, 409);
  }
  const { data: health } = await admin
    .from("wa_instancias")
    .select("provider_status,operational_health,last_provider_success_at")
    .eq("id", conversation.instancia_id)
    .eq("org_id", context.orgId)
    .maybeSingle();
  if (
    !health ||
    !canDispatchWithInstance({
      providerState: health.provider_status,
      operationalHealth: health.operational_health,
      lastSuccessfulCheckAt: health.last_provider_success_at,
    })
  )
    return json({ error: "Número de atendimento sem saúde confirmada." }, 409);

  const instance = await instanciaDaOrgComToken(admin, context.orgId, conversation.instancia_id);
  if (!instance || instance.status !== "conectado") {
    return json({ error: "Número de atendimento indisponível." }, 409);
  }

  const { data: reserved, error: reserveError } = await admin.rpc("wa_reserve_outbound_message", {
    p_org: context.orgId,
    p_conversation: conversation.id,
    p_actor: context.userId,
    p_operation: operationId,
    p_text: text,
  });
  const reservation = Array.isArray(reserved) ? reserved[0] : reserved;
  if (reserveError || !reservation?.message_id) {
    console.error("wa-responder reservation failed", reserveError?.code);
    return json({ error: "Não foi possível registrar a tentativa de envio." }, 409);
  }
  if (!reservation.should_send) {
    const { data: existing } = await admin
      .from("wa_mensagens")
      .select("id,status,externo_id")
      .eq("id", reservation.message_id)
      .eq("org_id", context.orgId)
      .maybeSingle();
    return json({ ok: existing?.status === "sent", duplicate: true, message: existing });
  }

  let sent;
  try {
    sent = await enviarTextoInstancia(instance.token, conversation.normalized_phone, text);
  } catch (error) {
    await admin.rpc("wa_finalize_outbound_message", {
      p_org: context.orgId,
      p_message: reservation.message_id,
      p_status: "uncertain",
      p_external_id: null,
      p_occurred_at: new Date().toISOString(),
      p_error: error instanceof Error ? error.message : "provider_network_error",
    });
    return json({ error: "O provedor não confirmou o envio.", status: "uncertain" }, 502);
  }
  const providerMessageId = extractProviderMessageId(sent.data);
  const finalStatus = sent.ok
    ? "sent"
    : sent.httpStatus === 429 || sent.httpStatus >= 500
      ? "uncertain"
      : "failed";
  const { error: finalizeError } = await admin.rpc("wa_finalize_outbound_message", {
    p_org: context.orgId,
    p_message: reservation.message_id,
    p_status: finalStatus,
    p_external_id: providerMessageId,
    p_occurred_at: new Date().toISOString(),
    p_error: sent.error ?? null,
  });
  if (finalizeError) {
    console.error("wa-responder finalization failed", finalizeError.code);
    return json(
      { error: "O envio ocorreu, mas sua confirmação está pendente.", status: "uncertain" },
      502,
    );
  }
  if (!sent.ok) {
    return json({ error: "Não foi possível confirmar o envio.", status: finalStatus }, 409);
  }
  return json({ ok: true, status: "sent", message_id: reservation.message_id });
});
