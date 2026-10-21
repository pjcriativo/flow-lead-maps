export type WhatsappConversationMessageType =
  "text" | "image" | "document" | "audio" | "video" | "other";

export type NormalizedWhatsappContact = {
  remoteId: string;
  phone: string | null;
};

export type NormalizedInboundMessage = {
  externalId: string;
  remoteId: string;
  phone: string | null;
  contactName: string | null;
  type: WhatsappConversationMessageType;
  text: string | null;
  occurredAt: string;
};

function recordOf(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function pickWhatsappValue(value: unknown, paths: readonly string[]): unknown {
  for (const path of paths) {
    let current: unknown = value;
    let found = true;
    for (const segment of path.split(".")) {
      const record = recordOf(current);
      if (!record || !(segment in record)) {
        found = false;
        break;
      }
      current = record[segment];
    }
    if (found && current !== undefined && current !== null) return current;
  }
  return undefined;
}

function plausiblePhone(value: string): string | null {
  if (!/^\d{8,15}$/.test(value) || /^0+$/.test(value)) return null;
  return value;
}

export function normalizeWhatsappContact(value: unknown): NormalizedWhatsappContact | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  const match = /^([^@]+)@(s\.whatsapp\.net|lid)$/.exec(normalized);
  if (!match) return null;

  const localPart = match[1].split(":")[0].replace(/\s+/g, "");
  if (!localPart) return null;
  const remoteId = `${localPart}@${match[2]}`;
  const phone = match[2] === "s.whatsapp.net" ? plausiblePhone(localPart.replace(/\D/g, "")) : null;
  if (match[2] === "s.whatsapp.net" && !phone) return null;
  return { remoteId, phone };
}

export function normalizeWhatsappTimestamp(value: unknown, receivedAt = new Date()): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
    const parsed = new Date(milliseconds);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (/^\d+(\.\d+)?$/.test(value) && Number.isFinite(numeric)) {
      return normalizeWhatsappTimestamp(numeric, receivedAt);
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return receivedAt.toISOString();
}

function textOf(data: unknown): string | null {
  const value = pickWhatsappValue(data, [
    "Message.conversation",
    "Message.Conversation",
    "message.conversation",
    "Message.extendedTextMessage.text",
    "Message.ExtendedTextMessage.Text",
    "message.extendedTextMessage.text",
    "Message.imageMessage.caption",
    "message.imageMessage.caption",
    "Message.videoMessage.caption",
    "message.videoMessage.caption",
    "Message.documentMessage.caption",
    "message.documentMessage.caption",
    "body",
    "text",
  ]);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function messageTypeOf(data: unknown): WhatsappConversationMessageType {
  if (pickWhatsappValue(data, ["Message.imageMessage", "message.imageMessage"])) return "image";
  if (pickWhatsappValue(data, ["Message.documentMessage", "message.documentMessage"])) {
    return "document";
  }
  if (pickWhatsappValue(data, ["Message.audioMessage", "message.audioMessage"])) return "audio";
  if (pickWhatsappValue(data, ["Message.videoMessage", "message.videoMessage"])) return "video";
  if (textOf(data)) return "text";
  return "other";
}

export function normalizeInboundWhatsappMessage(
  body: unknown,
  receivedAt = new Date(),
): NormalizedInboundMessage | null {
  const root = recordOf(body);
  if (!root) return null;
  const data = pickWhatsappValue(root, ["data", "Data"]) ?? root;
  const info = pickWhatsappValue(data, ["Info", "info", "key"]) ?? data;
  const fromMe = pickWhatsappValue(info, ["IsFromMe", "isFromMe", "fromMe"]);
  if (fromMe === true || fromMe === 1 || String(fromMe).toLowerCase() === "true") return null;

  const rawContact =
    pickWhatsappValue(info, ["Chat", "chat", "RemoteJid", "remoteJid", "Sender", "sender"]) ??
    pickWhatsappValue(data, ["Chat", "remoteJid", "from"]);
  const contact = normalizeWhatsappContact(rawContact);
  if (!contact) return null;

  const externalValue =
    pickWhatsappValue(info, ["ID", "Id", "id"]) ?? pickWhatsappValue(data, ["id", "ID"]);
  const externalId = typeof externalValue === "string" ? externalValue.trim() : "";
  if (!externalId) return null;

  const contactNameValue =
    pickWhatsappValue(info, ["PushName", "pushName", "notifyName"]) ??
    pickWhatsappValue(data, ["PushName", "pushName", "notifyName"]);
  const contactName =
    typeof contactNameValue === "string" && contactNameValue.trim()
      ? contactNameValue.trim().slice(0, 160)
      : null;
  const occurredAt = normalizeWhatsappTimestamp(
    pickWhatsappValue(root, [
      "data.Info.Timestamp",
      "data.info.timestamp",
      "data.timestamp",
      "data.Timestamp",
      "timestamp",
      "date_time",
    ]),
    receivedAt,
  );

  return {
    externalId,
    remoteId: contact.remoteId,
    phone: contact.phone,
    contactName,
    type: messageTypeOf(data),
    text: textOf(data),
    occurredAt,
  };
}

/**
 * Parâmetros EXATOS de wa_ingest_inbound_message para uma mensagem normalizada. Mantidos aqui,
 * num módulo tipado e testado, porque um acesso a campo inexistente no webhook (inbound.contact)
 * derrubou todo recebimento individual com um 500 opaco — o runtime Deno não checa tipos.
 */
export function inboundIngestParams(
  orgId: string,
  instanceId: string,
  inbound: NormalizedInboundMessage,
) {
  return {
    p_org: orgId,
    p_instance: instanceId,
    p_remote_contact_id: inbound.remoteId,
    p_phone: inbound.phone,
    p_contact_name: inbound.contactName,
    p_external_id: inbound.externalId,
    p_message_type: inbound.type,
    p_text: inbound.text,
    p_occurred_at: inbound.occurredAt,
  };
}

export function shouldAdvanceConversationActivity(
  currentActivityAt: string | null,
  incomingActivityAt: string,
): boolean {
  const incoming = new Date(incomingActivityAt).getTime();
  if (!Number.isFinite(incoming)) return false;
  if (!currentActivityAt) return true;
  const current = new Date(currentActivityAt).getTime();
  return !Number.isFinite(current) || incoming >= current;
}

const MESSAGE_STATUS_RANK = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
} as const;

export function canAdvanceConversationMessageStatus(current: string, incoming: string): boolean {
  if (current === "failed" || current === "uncertain") return false;
  if (incoming === "failed") return current === "pending" || current === "sent";
  const currentRank = MESSAGE_STATUS_RANK[current as keyof typeof MESSAGE_STATUS_RANK];
  const incomingRank = MESSAGE_STATUS_RANK[incoming as keyof typeof MESSAGE_STATUS_RANK];
  return currentRank !== undefined && incomingRank !== undefined && incomingRank > currentRank;
}
