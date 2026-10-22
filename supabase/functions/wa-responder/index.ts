// Edge: wa-responder — envio MANUAL de uma resposta na Central de Conversas.
//
// Contrato de resposta (browser): TODA resposta, de qualquer status, carrega os headers de CORS
// do domínio chamador. Antes, as respostas eram montadas sem a requisição e saíam sem
// Access-Control-Allow-Origin: o navegador bloqueava a leitura, o atendente via "erro" mesmo com
// a mensagem já enviada e reenviava (duas mensagens reais).
//
// Resultado estruturado quando a operação foi registrada:
//   { ok, operation_id, message_id, external_id, status, occurred_at, error? }
// status: pending | sent | failed | uncertain. "sent" = o WhatsApp confirmou o recebimento pelo
// servidor (1 check); entrega e leitura chegam depois, por webhook. Nunca declaramos "entregue"
// só porque a API aceitou. Rejeições ANTES do registro (permissão, conversa, saúde) usam 4xx com
// { ok:false, error, code } e nada é gravado nem enviado.
//
// Idempotência: operation_id (uuid do cliente) é a chave; repetir o mesmo id nunca reenvia.
// O envio sai SEMPRE pela instância vinculada à conversa — nunca pelo rodízio de campanhas.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json as jsonResponse } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import { isAssignedConversationAllowed } from "../_shared/whatsapp-policy.ts";
import { extractProviderMessageId } from "../_shared/whatsapp-delivery-engine.ts";
import { canDispatchWithInstance } from "../_shared/whatsapp-instance-health.ts";
import {
  checarSaudeChip,
  enviarTextoInstancia,
  inicializarCofreWa,
  instanciaDaOrgComToken,
  waBase,
} from "../_shared/wa.ts";

type EstadoEnvio = "pending" | "sent" | "failed" | "uncertain";

async function handleRequest(req: Request): Promise<Response> {
  // Toda resposta passa por aqui: CORS sempre presente (2xx, 4xx e 5xx).
  const json = (body: unknown, status = 200) => jsonResponse(body, status, req);
  const recusa = (error: string, status: number, code?: string) =>
    json({ ok: false, error, ...(code ? { code } : {}) }, status);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return recusa("Método não permitido.", 405);

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
    return recusa("Dados inválidos.", 422);
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
    return recusa(failure.message, failure.status);
  }

  const conversationId = String(body.conversa_id || "");
  const operationId = String(body.operation_id || "");
  const text = String(body.texto || "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(conversationId) || !uuid.test(operationId) || !text || text.length > 4096)
    return recusa("Conversa, operação e mensagem válidas são obrigatórias.", 422);

  /** Resultado estruturado de uma operação já registrada. */
  const resultado = (
    mensagem: {
      id: string;
      status: string;
      externo_id?: string | null;
      occurred_at?: string | null;
    },
    extras: { error?: string; duplicate?: boolean } = {},
  ) =>
    json({
      ok:
        mensagem.status === "sent" || mensagem.status === "delivered" || mensagem.status === "read",
      operation_id: operationId,
      message_id: mensagem.id,
      external_id: mensagem.externo_id ?? null,
      status: mensagem.status as EstadoEnvio,
      occurred_at: mensagem.occurred_at ?? new Date().toISOString(),
      ...(extras.duplicate ? { duplicate: true } : {}),
      ...(extras.error ? { error: extras.error } : {}),
    });

  // Consultas independentes juntas (antes: uma depois da outra). Todas as validações abaixo
  // seguem na mesma ordem de antes.
  const [{ data: conversation }, { data: jaRegistrada }] = await Promise.all([
    admin
      .from("wa_conversas")
      .select(
        "id,org_id,normalized_phone,remote_contact_id,lead_id,assigned_to,instancia_id,status",
      )
      .eq("id", conversationId)
      .eq("org_id", context.orgId)
      .maybeSingle(),
    // Repetição da MESMA operação (retry, duplo clique, resposta perdida no navegador): devolve o
    // estado registrado SEM reenviar e sem depender da saúde atual do chip.
    admin
      .from("wa_mensagens")
      .select("id,status,externo_id,provider_occurred_at")
      .eq("org_id", context.orgId)
      .eq("client_operation_id", operationId)
      .maybeSingle(),
    inicializarCofreWa(admin),
  ]);
  if (!conversation) return recusa("Conversa não encontrada.", 404);
  if (jaRegistrada) {
    return resultado(
      {
        id: jaRegistrada.id,
        status: jaRegistrada.status,
        externo_id: jaRegistrada.externo_id,
        occurred_at: jaRegistrada.provider_occurred_at,
      },
      { duplicate: true },
    );
  }
  if (conversation.status === "archived") {
    return recusa("Conversa arquivada não aceita novas mensagens.", 409, "conversa_arquivada");
  }

  if (
    !isAssignedConversationAllowed({
      role: context.role,
      userId: context.userId,
      assignedTo: conversation.assigned_to,
      leadId: conversation.lead_id,
    })
  ) {
    return recusa("Conversa não atribuída a este atendente.", 403);
  }

  if (!waBase()) return recusa("Integração WhatsApp indisponível.", 503);
  if (!conversation.normalized_phone) {
    return recusa("Este contato não possui número confirmado para resposta manual.", 409);
  }

  const carregarSaude = async () => {
    const { data } = await admin
      .from("wa_instancias")
      .select("provider_status,operational_health,last_provider_success_at,deleted_at")
      .eq("id", conversation.instancia_id)
      .eq("org_id", context.orgId)
      .maybeSingle();
    return data;
  };
  // Saúde e token da instância em paralelo (são independentes).
  const [saudeInicial, instance] = await Promise.all([
    carregarSaude(),
    instanciaDaOrgComToken(admin, context.orgId, conversation.instancia_id),
  ]);
  let health = saudeInicial;
  if (!health) return recusa("Número de atendimento indisponível.", 409);
  if (health.deleted_at) {
    // O número que atendia esta conversa foi removido. Nunca redirecionamos a conversa para outro
    // número por conta própria: o atendente escolhe, na própria conversa, por qual número continuar
    // (wa-conversations, ação trocar_numero), com auditoria e histórico preservado.
    return recusa(
      "O número que atendia esta conversa foi removido. Escolha por qual número continuar o atendimento na própria conversa.",
      409,
      "chip_arquivado",
    );
  }
  const podeEnviar = (value: typeof health) =>
    Boolean(
      value &&
      canDispatchWithInstance({
        providerState: value.provider_status,
        operationalHealth: value.operational_health,
        lastSuccessfulCheckAt: value.last_provider_success_at,
      }),
    );
  if (!podeEnviar(health)) {
    // A evidência de saúde vale 5 min (o monitor a renova a cada 2 min). Antes de recusar,
    // consulta o provedor AO VIVO.
    await checarSaudeChip(admin, context.orgId, conversation.instancia_id, "manual").catch(
      () => null,
    );
    health = await carregarSaude();
  }
  if (!podeEnviar(health)) {
    return recusa("Número de atendimento sem saúde confirmada.", 409, "saude_nao_confirmada");
  }

  if (!instance || instance.status !== "conectado") {
    return recusa("Número de atendimento indisponível.", 409);
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
    return recusa("Não foi possível registrar a tentativa de envio.", 409);
  }
  if (!reservation.should_send) {
    // Corrida entre duas requisições da mesma operação: a outra venceu a reserva.
    const { data: existing } = await admin
      .from("wa_mensagens")
      .select("id,status,externo_id,provider_occurred_at")
      .eq("id", reservation.message_id)
      .eq("org_id", context.orgId)
      .maybeSingle();
    return resultado(
      {
        id: reservation.message_id,
        status: existing?.status ?? "pending",
        externo_id: existing?.externo_id ?? null,
        occurred_at: existing?.provider_occurred_at ?? null,
      },
      { duplicate: true },
    );
  }

  const finalizar = async (
    status: "sent" | "failed" | "uncertain",
    externalId: string | null,
    error: string | null,
  ) => {
    const { error: finalizeError } = await admin.rpc("wa_finalize_outbound_message", {
      p_org: context.orgId,
      p_message: reservation.message_id,
      p_status: status,
      p_external_id: externalId,
      p_occurred_at: new Date().toISOString(),
      p_error: error,
    });
    return finalizeError;
  };

  let sent;
  try {
    sent = await enviarTextoInstancia(instance.token, conversation.normalized_phone, text);
  } catch (error) {
    // Sem resposta do provedor (rede/timeout): a mensagem PODE ter saído. Resultado incerto —
    // nunca "falhou" e nunca reenvio automático.
    await finalizar(
      "uncertain",
      null,
      error instanceof Error ? error.name : "provider_network_error",
    );
    return resultado(
      { id: reservation.message_id, status: "uncertain" },
      { error: "O provedor não confirmou o envio. Verifique o status antes de tentar novamente." },
    );
  }
  const providerMessageId = extractProviderMessageId(sent.data);
  const finalStatus: "sent" | "failed" | "uncertain" = sent.ok
    ? "sent"
    : sent.httpStatus === 429 || sent.httpStatus >= 500
      ? "uncertain"
      : "failed";
  const finalizeError = await finalizar(finalStatus, providerMessageId, sent.error ?? null);
  if (finalizeError) {
    console.error("wa-responder finalization failed", finalizeError.code);
    return resultado(
      { id: reservation.message_id, status: "uncertain", externo_id: providerMessageId },
      { error: "O envio ocorreu, mas a confirmação ainda está pendente." },
    );
  }
  return resultado(
    { id: reservation.message_id, status: finalStatus, externo_id: providerMessageId },
    finalStatus === "sent"
      ? {}
      : {
          error:
            finalStatus === "failed"
              ? "O WhatsApp recusou o envio desta mensagem."
              : "O provedor não confirmou o envio. Verifique o status antes de tentar novamente.",
        },
  );
}

Deno.serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error(
      "wa-responder unexpected failure",
      error instanceof Error ? error.name : "unknown",
    );
    return jsonResponse(
      {
        ok: false,
        error: "Não foi possível processar o envio. Consulte o status antes de tentar novamente.",
        code: "erro_interno",
      },
      500,
      req,
    );
  }
});
