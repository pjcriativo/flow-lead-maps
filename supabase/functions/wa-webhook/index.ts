// Edge: wa-webhook — RECEBE os eventos de mensagem da Evolution GO e grava em wa_mensagens.
// PÚBLICA (verify_jwt=false) porque quem chama é a Evolution, não um usuário. Anti-spoof: exige
// ?k=<WA_WEBHOOK_SECRET> na URL (só a Evolution, configurada por nós, conhece). A org é
// identificada pelo NOME da instância (única por org). Falhas transitórias de persistência
// respondem 503 para que o provedor possa repetir o evento idempotente com segurança.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  canTransitionDelivery,
  deliveryEventIdentity,
  extractProviderMessageId,
  type WhatsappDeliveryStatus,
} from "../_shared/whatsapp-delivery-engine.ts";
import {
  canAdvanceConversationMessageStatus,
  normalizeInboundWhatsappMessage,
  normalizeWhatsappTimestamp,
} from "../_shared/whatsapp-conversation.ts";

function pick(obj: unknown, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = obj;
    let ok = true;
    for (const seg of p.split(".")) {
      if (cur && typeof cur === "object" && seg in cur) {
        cur = (cur as Record<string, unknown>)[seg];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur;
  }
  return undefined;
}

function deliveryStatus(
  body: unknown,
  eventName: string,
): "accepted" | "sent" | "delivered" | "read" | "failed" | null {
  const status = String(
    pick(body, ["data.status", "data.Status", "data.update.status", "status", "Status"]) ??
      eventName,
  ).toLowerCase();
  if (/read|played/.test(status)) return "read";
  if (/deliver/.test(status)) return "delivered";
  if (/sent|server.?ack/.test(status)) return "sent";
  if (/accept|pending/.test(status)) return "accepted";
  if (/fail|error|reject/.test(status)) return "failed";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ ok: false }, 405);
  const url = new URL(req.url);
  const k = url.searchParams.get("k");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // anti-spoof: o secret vai na PRÓPRIA URL (?k=...) — é o que a Evolution guarda e chama de volta.
  // (Ela não manda header nenhum; header não serviria.) POST sem o ?k certo é rejeitado.
  if (!k || k !== Deno.env.get("WA_WEBHOOK_SECRET")) return json({ ok: false }, 401);

  const raw = await req.text().catch(() => "");
  if (!raw) return json({ ok: true, ignored: "no-body" });
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ ok: true, ignored: "nao-objeto" });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: true, ignored: "nao-json" });
  }

  const data = pick(body, ["data", "Data"]) ?? body;
  const info = pick(data, ["Info", "info", "key"]) ?? data;

  const evento = String(body.event ?? body.Event ?? body.type ?? "").toLowerCase();
  const nomeInstancia = String(
    pick(body, ["instance", "instanceName", "Instance", "name", "Name"]) ?? "",
  );
  if (!nomeInstancia) return json({ ok: true, ignored: "no-instance" });

  const { data: inst } = await admin
    .from("wa_instancias")
    .select("id, user_id, org_id")
    .eq("nome", nomeInstancia)
    .maybeSingle();
  if (!inst?.org_id) return json({ ok: true, ignored: "instancia-desconhecida" });

  const connectionEvent = /connection|instance.?status|status.?instance/.test(evento);
  if (connectionEvent) {
    const rawState = String(
      pick(body, [
        "data.state",
        "data.status",
        "data.connection",
        "state",
        "status",
        "connection",
      ]) ?? "",
    ).toLowerCase();
    const loggedInValue = pick(body, ["data.LoggedIn", "data.loggedIn", "LoggedIn", "loggedIn"]);
    const connectedValue = pick(body, [
      "data.Connected",
      "data.connected",
      "Connected",
      "connected",
    ]);
    const loggedIn =
      typeof loggedInValue === "boolean"
        ? loggedInValue
        : /open|logged.?in|connected/.test(rawState);
    const connected =
      typeof connectedValue === "boolean"
        ? connectedValue
        : loggedIn || /pair|connecting|qr/.test(rawState);
    const providerState = loggedIn
      ? "connected"
      : connected
        ? "pairing"
        : /close|disconnect|logout/.test(rawState)
          ? "disconnected"
          : "unknown";
    const occurredAt = normalizeWhatsappTimestamp(
      pick(body, ["data.timestamp", "timestamp", "date_time"]),
    );
    const { error: observationError } = await admin.rpc("wa_apply_instance_observation", {
      p_org: inst.org_id,
      p_instance: inst.id,
      p_source: "webhook",
      p_observed_at: occurredAt,
      p_provider_status: providerState,
      p_operational_health:
        providerState === "connected"
          ? "healthy"
          : providerState === "unknown"
            ? "unknown"
            : "unavailable",
      p_success: providerState !== "unknown",
      p_error_code: providerState === "unknown" ? "webhook_unknown_state" : null,
      p_number: null,
      p_actor: null,
    });
    if (observationError) {
      console.error("wa-webhook health persistence failed", observationError.code);
      return json({ ok: false, stored: false }, 503);
    }
    return json({ ok: true, stored: true, connection: providerState });
  }

  const providerMessageId = extractProviderMessageId(body);
  const providerStatus = deliveryStatus(body, evento);
  if (providerMessageId && providerStatus) {
    const { data: delivery } = await admin
      .from("wa_envios")
      .select("id,status")
      .eq("org_id", inst.org_id)
      .eq("instancia_id", inst.id)
      .eq("provider_message_id", providerMessageId)
      .maybeSingle();
    const messageStatus = providerStatus === "accepted" ? "sent" : providerStatus;
    const { data: conversationMessage } = await admin
      .from("wa_mensagens")
      .select("id,status,conversa_id")
      .eq("org_id", inst.org_id)
      .eq("instancia_id", inst.id)
      .eq("externo_id", providerMessageId)
      .maybeSingle();
    if (
      conversationMessage &&
      canAdvanceConversationMessageStatus(conversationMessage.status, messageStatus)
    ) {
      const { error: messageStatusError } = await admin
        .from("wa_mensagens")
        .update({ status: messageStatus })
        .eq("id", conversationMessage.id)
        .eq("org_id", inst.org_id)
        .eq("status", conversationMessage.status);
      if (messageStatusError) {
        console.error("wa-webhook message status persistence failed", messageStatusError.code);
        return json({ ok: false, stored: false }, 503);
      }
    }
    if (!delivery) {
      return conversationMessage
        ? json({ ok: true, stored: true, status: messageStatus })
        : json({ ok: true, ignored: "envio-desconhecido" });
    }

    const occurredAtRaw = pick(body, [
      "data.timestamp",
      "data.Timestamp",
      "timestamp",
      "date_time",
    ]);
    const occurredAt = normalizeWhatsappTimestamp(occurredAtRaw);
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
      return json({ ok: false, stored: false }, 503);
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
        return json({ ok: false, stored: false }, 503);
      }
    }
    return json({
      ok: true,
      stored: true,
      duplicate: Boolean(eventError),
      status: providerStatus,
    });
  }

  const inbound = normalizeInboundWhatsappMessage(body);
  if (!inbound) return json({ ok: true, ignored: "not-supported-inbound", evento });

  const { data: ingested, error: ingestError } = await admin.rpc("wa_ingest_inbound_message", {
    p_org: inst.org_id,
    p_instance: inst.id,
    p_remote_contact_id: inbound.contact.remoteId,
    p_phone: inbound.contact.phone,
    p_contact_name: inbound.contactName,
    p_external_id: inbound.externalId,
    p_message_type: inbound.type,
    p_text: inbound.text,
    p_occurred_at: inbound.occurredAt,
  });
  if (ingestError) {
    console.error("wa-webhook conversation persistence failed", ingestError.code);
    return json({ ok: false, stored: false }, 503);
  }

  const persisted = Array.isArray(ingested) ? ingested[0] : ingested;
  return json({ ok: true, stored: true, duplicate: !persisted?.inserted });
});
