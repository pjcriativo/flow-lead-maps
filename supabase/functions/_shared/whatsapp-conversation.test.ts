// Suite: WhatsApp conversation identity and inbound normalization.
// Invariant: a provider event becomes one tenant-safe conversation message without inventing media data.
// Boundary IN: pure Evolution GO payload normalization and ordering decisions.
// Boundary OUT: PostgreSQL idempotency/RLS and HTTP authentication, covered by contract suites.
import test from "node:test";
import assert from "node:assert/strict";
import {
  canAdvanceConversationMessageStatus,
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
