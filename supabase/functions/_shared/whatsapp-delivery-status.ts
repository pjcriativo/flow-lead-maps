// Aplicação de status do provedor (entrega/leitura) às mensagens e às entregas de campanha.
// Extraído do wa-webhook para ser executável em teste: o runtime Deno não checa tipos e um erro
// de campo já derrubou o recebimento inteiro uma vez.
import {
  canTransitionDelivery,
  deliveryEventIdentity,
  type WhatsappDeliveryStatus,
} from "./whatsapp-delivery-engine.ts";
import { canAdvanceConversationMessageStatus } from "./whatsapp-conversation.ts";

// Cliente Supabase (service role) — tipado de forma estrutural para aceitar um banco simulado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export type StatusProvedor = "accepted" | "sent" | "delivered" | "read" | "failed";

/**
 * Aplica um status do provedor à mensagem da conversa E à entrega de campanha com aquele id
 * externo, sempre de forma MONOTÔNICA (um evento antigo nunca regride o status) e idempotente
 * (o evento de entrega tem chave única). Devolve "desconhecido" se nenhum registro tem o id.
 */
export async function aplicarStatusDoProvedor(
  admin: SupabaseLike,
  inst: { id: string; org_id: string },
  providerMessageId: string,
  providerStatus: StatusProvedor,
  occurredAt: string,
  evento: string,
): Promise<"aplicado" | "desconhecido" | "erro"> {
  const [{ data: delivery }, { data: conversationMessage }] = await Promise.all([
    admin
      .from("wa_envios")
      .select("id,status")
      .eq("org_id", inst.org_id)
      .eq("instancia_id", inst.id)
      .eq("provider_message_id", providerMessageId)
      .maybeSingle(),
    admin
      .from("wa_mensagens")
      .select("id,status,conversa_id")
      .eq("org_id", inst.org_id)
      .eq("instancia_id", inst.id)
      .eq("externo_id", providerMessageId)
      .maybeSingle(),
  ]);
  if (!delivery && !conversationMessage) return "desconhecido";

  const messageStatus = providerStatus === "accepted" ? "sent" : providerStatus;
  if (
    conversationMessage &&
    canAdvanceConversationMessageStatus(conversationMessage.status, messageStatus)
  ) {
    const { error } = await admin
      .from("wa_mensagens")
      .update({ status: messageStatus })
      .eq("id", conversationMessage.id)
      .eq("org_id", inst.org_id)
      .eq("status", conversationMessage.status);
    if (error) {
      console.error("wa-webhook message status persistence failed", error.code);
      return "erro";
    }
  }
  if (!delivery) return "aplicado";

  const eventKey = await deliveryEventIdentity({
    instanceId: inst.id,
    providerMessageId,
    status: providerStatus,
    occurredAt,
  });
  const { error: eventError } = await admin.from("wa_envio_eventos").insert({
    org_id: inst.org_id,
    envio_id: delivery.id,
    instancia_id: inst.id,
    event_key: eventKey,
    provider_message_id: providerMessageId,
    event_type: evento || "status",
    status: providerStatus,
    occurred_at: occurredAt,
    payload: { event: evento, status: providerStatus },
  });
  if (eventError && !String(eventError.code).includes("23505")) {
    console.error("wa-webhook delivery event persistence failed", eventError.code);
    return "erro";
  }
  if (
    canTransitionDelivery(
      delivery.status as WhatsappDeliveryStatus,
      providerStatus as WhatsappDeliveryStatus,
    )
  ) {
    const timestampColumn = {
      accepted: "accepted_at",
      sent: "sent_at",
      delivered: "delivered_at",
      read: "read_at",
      failed: "failed_at",
    }[providerStatus];
    const { error: deliveryUpdateError } = await admin
      .from("wa_envios")
      .update({
        status: providerStatus,
        [timestampColumn]: occurredAt ?? new Date().toISOString(),
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id)
      .eq("org_id", inst.org_id)
      .eq("status", delivery.status);
    if (deliveryUpdateError) {
      console.error("wa-webhook delivery update failed", deliveryUpdateError.code);
      return "erro";
    }
  }
  return "aplicado";
}
