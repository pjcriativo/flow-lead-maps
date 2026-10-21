// Suite: WhatsApp conversation identity and inbound normalization.
// Invariant: a provider event becomes one tenant-safe conversation message without inventing media data.
// Boundary IN: pure Evolution GO payload normalization and ordering decisions.
// Boundary OUT: PostgreSQL idempotency/RLS and HTTP authentication, covered by contract suites.
import test from "node:test";
import assert from "node:assert/strict";
import {
  canAdvanceConversationMessageStatus,
  inboundIngestParams,
  normalizeInboundWhatsappMessage,
  normalizeWhatsappContact,
  shouldAdvanceConversationActivity,
} from "./whatsapp-conversation.ts";

test("normalizes an individual Evolution GO contact without merging device suffixes", () => {
  assert.deepEqual(normalizeWhatsappContact("5511999990000:17@s.whatsapp.net"), {
    remoteId: "5511999990000@s.whatsapp.net",
    phone: "5511999990000",
  });
});

test("preserves a remote LID even when no trustworthy phone is available", () => {
  assert.deepEqual(normalizeWhatsappContact("123456789012345@lid"), {
    remoteId: "123456789012345@lid",
    phone: null,
  });
});

test("rejects groups, broadcasts, newsletters and malformed phone identities", () => {
  for (const value of [
    "120363000000000@g.us",
    "status@broadcast",
    "channel@newsletter",
    "123@s.whatsapp.net",
  ]) {
    assert.equal(normalizeWhatsappContact(value), null);
  }
});

test("normalizes inbound text with stable external identity and provider timestamp", () => {
  const message = normalizeInboundWhatsappMessage(
    {
      data: {
        key: {
          remoteJid: "5511999990000@s.whatsapp.net",
          fromMe: false,
          id: "message-1",
        },
        pushName: "Contato Real",
        message: { conversation: "Olá" },
        timestamp: 1_797_500_000,
      },
    },
    new Date("2026-12-31T00:00:00.000Z"),
  );

  assert.deepEqual(message, {
    externalId: "message-1",
    remoteId: "5511999990000@s.whatsapp.net",
    phone: "5511999990000",
    contactName: "Contato Real",
    type: "text",
    text: "Olá",
    // SUT_IS_CORRECT_BECAUSE: 1797500000 is Unix seconds and independently converts to
    // 2026-12-17T09:33:20.000Z; the previous fixture expectation was arithmetically wrong.
    occurredAt: "2026-12-17T09:33:20.000Z",
  });
});

test("classifies supported media without persisting an untrusted temporary URL", () => {
  const message = normalizeInboundWhatsappMessage({
    data: {
      key: { remoteJid: "5511999990000@s.whatsapp.net", fromMe: false, id: "image-1" },
      message: { imageMessage: { url: "https://temporary.invalid/file", caption: "Foto" } },
    },
  });
  assert.equal(message?.type, "image");
  assert.equal(message?.text, "Foto");
  assert.equal("mediaUrl" in (message ?? {}), false);
});

test("rejects outbound echoes and events without a stable provider message id", () => {
  assert.equal(
    normalizeInboundWhatsappMessage({
      data: {
        key: { remoteJid: "5511999990000@s.whatsapp.net", fromMe: true, id: "mine" },
        message: { conversation: "eco" },
      },
    }),
    null,
  );
  assert.equal(
    normalizeInboundWhatsappMessage({
      data: {
        key: { remoteJid: "5511999990000@s.whatsapp.net", fromMe: false },
        message: { conversation: "sem id" },
      },
    }),
    null,
  );
  assert.equal(
    normalizeInboundWhatsappMessage({
      data: {
        key: { remoteJid: "5511999990000@s.whatsapp.net", fromMe: "true", id: "mine-string" },
        message: { conversation: "eco" },
      },
    }),
    null,
  );
});

test("an older event cannot replace the current conversation activity", () => {
  assert.equal(
    shouldAdvanceConversationActivity("2026-10-16T12:00:00.000Z", "2026-10-16T11:59:59.000Z"),
    false,
  );
  assert.equal(
    shouldAdvanceConversationActivity("2026-10-16T12:00:00.000Z", "2026-10-16T12:00:01.000Z"),
    true,
  );
});

test("delivery status advances monotonically and never rewrites uncertain outcomes", () => {
  assert.equal(canAdvanceConversationMessageStatus("sent", "delivered"), true);
  assert.equal(canAdvanceConversationMessageStatus("delivered", "read"), true);
  assert.equal(canAdvanceConversationMessageStatus("read", "delivered"), false);
  assert.equal(canAdvanceConversationMessageStatus("uncertain", "sent"), false);
  assert.equal(canAdvanceConversationMessageStatus("sent", "failed"), true);
  assert.equal(canAdvanceConversationMessageStatus("delivered", "failed"), false);
});

// Payload REAL da Evolution GO 0.7.2 (events.Message serializado em data), já com a troca
// LID -> s.whatsapp.net que a própria Evolution aplica antes de despachar o webhook.
function evolutionGoMessage(overrides: {
  chat?: string;
  sender?: string;
  senderAlt?: string;
  isFromMe?: boolean;
  isGroup?: boolean;
  message?: Record<string, unknown>;
  id?: string;
}) {
  return {
    event: "Message",
    instanceId: "00000000-0000-4000-8000-000000000001",
    instanceName: "org-aaaaaaaa-0001",
    instanceToken: "token-da-instancia",
    data: {
      Info: {
        Chat: overrides.chat ?? "5541999990001@s.whatsapp.net",
        Sender: overrides.sender ?? "5541999990001@s.whatsapp.net",
        IsFromMe: overrides.isFromMe ?? false,
        IsGroup: overrides.isGroup ?? false,
        AddressingMode: "lid",
        SenderAlt: overrides.senderAlt ?? "53000000000042@lid",
        RecipientAlt: "",
        BroadcastListOwner: "",
        BroadcastRecipients: null,
        ID: overrides.id ?? "A5B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5",
        ServerID: 0,
        Type: "text",
        PushName: "Maria da Padaria",
        Timestamp: "2026-10-21T19:22:17-03:00",
        Category: "",
        Multicast: false,
        MediaType: "",
        Edit: "",
        VerifiedName: null,
        DeviceSentMeta: null,
      },
      Message: overrides.message ?? { conversation: "Oi, tudo bem?" },
      IsEphemeral: false,
      IsViewOnce: false,
    },
  };
}

test("accepts a real Evolution GO 1:1 text message and keeps the provider timestamp", () => {
  const message = normalizeInboundWhatsappMessage(
    evolutionGoMessage({}),
    new Date("2026-10-21T23:00:00.000Z"),
  );
  assert.deepEqual(message, {
    externalId: "A5B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5",
    remoteId: "5541999990001@s.whatsapp.net",
    phone: "5541999990001",
    contactName: "Maria da Padaria",
    type: "text",
    text: "Oi, tudo bem?",
    occurredAt: "2026-10-21T22:22:17.000Z",
  });
});

test("reads text from extendedTextMessage and ignores message-context noise", () => {
  const message = normalizeInboundWhatsappMessage(
    evolutionGoMessage({
      message: {
        extendedTextMessage: { text: "Resposta com link", contextInfo: { stanzaID: "X" } },
        messageContextInfo: { deviceListMetadata: {} },
      },
    }),
  );
  assert.equal(message?.text, "Resposta com link");
  assert.equal(message?.type, "text");
});

test("a message from a linked device of the contact keeps a single conversation identity", () => {
  const message = normalizeInboundWhatsappMessage(
    evolutionGoMessage({
      chat: "5541999990001:12@s.whatsapp.net",
      sender: "5541999990001:12@s.whatsapp.net",
    }),
  );
  assert.equal(message?.remoteId, "5541999990001@s.whatsapp.net");
  assert.equal(message?.phone, "5541999990001");
});

test("a contact that only has a LID is kept without inventing a phone number", () => {
  const message = normalizeInboundWhatsappMessage(
    evolutionGoMessage({ chat: "53000000000042@lid", sender: "53000000000042@lid" }),
  );
  assert.equal(message?.remoteId, "53000000000042@lid");
  assert.equal(message?.phone, null);
});

test("messages sent by the connected number, groups and status updates are not inbound", () => {
  assert.equal(normalizeInboundWhatsappMessage(evolutionGoMessage({ isFromMe: true })), null);
  assert.equal(
    normalizeInboundWhatsappMessage(
      evolutionGoMessage({ chat: "120363000000000000@g.us", isGroup: true }),
    ),
    null,
  );
  assert.equal(
    normalizeInboundWhatsappMessage(evolutionGoMessage({ chat: "status@broadcast" })),
    null,
  );
});

test("a message without a provider id is rejected instead of being stored twice", () => {
  const payload = evolutionGoMessage({});
  (payload.data.Info as Record<string, unknown>).ID = "";
  assert.equal(normalizeInboundWhatsappMessage(payload), null);
});

test("a real Evolution GO message produces the exact RPC parameters the database expects", () => {
  const inbound = normalizeInboundWhatsappMessage(
    evolutionGoMessage({}),
    new Date("2026-10-21T23:00:00.000Z"),
  );
  assert.ok(inbound);
  assert.deepEqual(inboundIngestParams("org-1", "instancia-1", inbound), {
    p_org: "org-1",
    p_instance: "instancia-1",
    p_remote_contact_id: "5541999990001@s.whatsapp.net",
    p_phone: "5541999990001",
    p_contact_name: "Maria da Padaria",
    p_external_id: "A5B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5",
    p_message_type: "text",
    p_text: "Oi, tudo bem?",
    p_occurred_at: "2026-10-21T22:22:17.000Z",
  });
  // Nenhum parâmetro pode ficar indefinido: o PostgREST descartaria o argumento em silêncio.
  for (const value of Object.values(inboundIngestParams("o", "i", inbound))) {
    assert.notEqual(value, undefined);
  }
});
