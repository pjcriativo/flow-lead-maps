// Edge: wa-webhook — RECEBE os eventos de mensagem da Evolution GO e grava em wa_mensagens.
// PÚBLICA (verify_jwt=false) porque quem chama é a Evolution, não um usuário. Anti-spoof: exige
// ?k=<WA_WEBHOOK_SECRET> na URL (só a Evolution, configurada por nós, conhece). A org é
// identificada pelo NOME da instância (única por org). Sempre responde 200 (não provoca retry).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  canTransitionDelivery,
  deliveryEventIdentity,
  extractProviderMessageId,
  type WhatsappDeliveryStatus,
} from "../_shared/whatsapp-delivery-engine.ts";

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

function soDigitos(jidOuNumero: string): string {
  // "554199999@s.whatsapp.net" | "554199999:12@s.whatsapp.net" -> "554199999"
  return String(jidOuNumero || "")
    .split("@")[0]
    .split(":")[0]
    .replace(/\D/g, "");
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
  const fromMe = Boolean(
    pick(info, ["IsFromMe", "isFromMe", "fromMe"]) ??
    pick(data, ["IsFromMe", "fromMe"]) ??
    pick(body, ["fromMe"]),
  );

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
    const occurredAtRaw = pick(body, ["data.timestamp", "timestamp", "date_time"]);
    const occurredAtDate =
      typeof occurredAtRaw === "string" || typeof occurredAtRaw === "number"
        ? new Date(occurredAtRaw)
        : new Date();
    const occurredAt = Number.isNaN(occurredAtDate.getTime())
      ? new Date().toISOString()
      : occurredAtDate.toISOString();
    await admin.rpc("wa_apply_instance_observation", {
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
    if (!delivery) return json({ ok: true, ignored: "envio-desconhecido" });

    const occurredAtRaw = pick(body, [
      "data.timestamp",
      "data.Timestamp",
      "timestamp",
      "date_time",
    ]);
    const occurredAtValue =
      typeof occurredAtRaw === "string" || typeof occurredAtRaw === "number" ? occurredAtRaw : null;
    const parsedOccurredAt = occurredAtValue !== null ? new Date(occurredAtValue) : null;
    const occurredAt =
      parsedOccurredAt && !Number.isNaN(parsedOccurredAt.getTime())
        ? parsedOccurredAt.toISOString()
        : null;
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
      return json({ ok: true, stored: false });
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
      await admin
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
    }
    return json({ ok: true, stored: !eventError, status: providerStatus });
  }

  const chatJid = String(
    pick(info, ["Chat", "chat", "RemoteJid", "remoteJid", "Sender", "sender"]) ??
      pick(data, ["Chat", "remoteJid", "from"]) ??
      "",
  );
  const numero = soDigitos(chatJid);

  // SÓ conversas 1-a-1 com um número (@s.whatsapp.net). Grupos (@g.us), newsletters
  // (@newsletter), status/broadcast e listas ficam de fora — não são leads.
  const ehGrupo =
    Boolean(pick(info, ["IsGroup", "isGroup"])) ||
    /@g\.us|@broadcast|@newsletter|status@/i.test(chatJid) ||
    !/@s\.whatsapp\.net$/i.test(chatJid);
  if (ehGrupo) return json({ ok: true, ignored: "nao-individual" });

  const texto = String(
    pick(data, [
      "Message.conversation",
      "Message.Conversation",
      "message.conversation",
      "Message.extendedTextMessage.text",
      "Message.ExtendedTextMessage.Text",
      "message.extendedTextMessage.text",
      "body",
      "text",
    ]) ?? "",
  );
  const externoId =
    String(pick(info, ["ID", "Id", "id"]) ?? pick(data, ["id", "ID"]) ?? "") || null;
  const pushName = pick(info, ["PushName", "pushName", "notifyName"]) ?? null;

  // Só nos interessa MENSAGEM recebida (não a nossa própria, não evento de conexão).
  const ehMensagem = !evento || evento.includes("message") || evento.includes("msg") || !!texto;
  if (!ehMensagem || fromMe || !numero || !texto) {
    return json({ ok: true, ignored: "not-inbound-text", evento, fromMe, temTexto: !!texto });
  }

  // Org dona da instância (pelo NOME). O server vê todas; escopamos pela linha encontrada.
  // Casa o número com um lead da org (best-effort).
  const { data: lead } = await admin
    .from("leads")
    .select("id")
    .eq("org_id", inst.org_id)
    .eq("whatsapp", numero)
    .maybeSingle();

  const { data: attributedDelivery } = lead?.id
    ? await admin
        .from("wa_envios")
        .select("id,campanha_id")
        .eq("org_id", inst.org_id)
        .eq("instancia_id", inst.id)
        .eq("lead_id", lead.id)
        .in("status", ["accepted", "sent", "delivered", "read"])
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { error } = await admin.from("wa_mensagens").insert({
    user_id: inst.user_id,
    org_id: inst.org_id,
    instancia_id: inst.id,
    numero,
    lead_id: lead?.id ?? null,
    envio_id: attributedDelivery?.id ?? null,
    campanha_id: attributedDelivery?.campanha_id ?? null,
    nome_contato: pushName,
    direcao: "in",
    tipo: "texto",
    texto,
    externo_id: externoId,
    lida: false,
  });
  // externo_id duplicado (23505) = evento repetido → ok, ignora.
  if (error && !String(error.code).includes("23505")) {
    console.error("wa-webhook persistence failed", error.code);
    return json({ ok: true, stored: false });
  }

  if (lead?.id && /^\s*(sair|pare|cancelar|remover)\s*[.!]?\s*$/i.test(texto)) {
    const optedOutAt = new Date().toISOString();
    await admin
      .from("leads")
      .update({ whatsapp_opt_out: true, whatsapp_opt_out_at: optedOutAt })
      .eq("id", lead.id)
      .eq("org_id", inst.org_id);
    await admin
      .from("wa_envios")
      .update({
        status: "blocked",
        blocked_reason: "opt_out",
        retryable: false,
        updated_at: optedOutAt,
      })
      .eq("lead_id", lead.id)
      .eq("org_id", inst.org_id)
      .in("status", ["draft", "pending_approval", "scheduled", "queued", "failed"]);
  }

  return json({ ok: true, stored: true });
});
