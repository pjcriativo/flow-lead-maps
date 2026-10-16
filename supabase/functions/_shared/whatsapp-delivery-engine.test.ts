// Suite: WhatsApp delivery engine decisions.
// Invariant: eligibility, retry, and status decisions never duplicate or overstate delivery.
// Boundary IN: pure validation, transition, webhook, and retry decisions.
// Boundary OUT: PostgreSQL locking and Evolution HTTP, covered by the delivery contract suite.
import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionDelivery,
  classifyProviderFailure,
  deliveryEventIdentity,
  extractProviderMessageId,
  isEligibleWhatsappRecipient,
  isLeaseRecoverable,
  normalizeWhatsappNumber,
  shouldRetryDelivery,
} from "./whatsapp-delivery-engine.ts";

test("accepts a documented opt-in recipient with a valid international number", () => {
  assert.deepEqual(
    isEligibleWhatsappRecipient({
      phone: "+55 (11) 99999-0000",
      optedIn: true,
      optedOut: false,
      consentSource: "formulario_site",
      consentedAt: "2026-10-15T10:00:00.000Z",
      purpose: "proposta_comercial",
    }),
    { eligible: true, number: "5511999990000" },
  );
});

test("rejects a phone-only recipient because phone presence is not consent", () => {
  assert.deepEqual(
    isEligibleWhatsappRecipient({
      phone: "5511999990000",
      optedIn: false,
      optedOut: false,
      consentSource: null,
      consentedAt: null,
      purpose: "proposta_comercial",
    }),
    { eligible: false, reason: "consentimento_ausente" },
  );
});

test("opt-out overrides prior consent", () => {
  assert.deepEqual(
    isEligibleWhatsappRecipient({
      phone: "5511999990000",
      optedIn: true,
      optedOut: true,
      consentSource: "contrato",
      consentedAt: "2026-10-15T10:00:00.000Z",
      purpose: "relacionamento",
    }),
    { eligible: false, reason: "opt_out" },
  );
});

test("rejects malformed and implausible WhatsApp numbers", () => {
  for (const number of [null, "", "123", "abc", "00000000000", "5511999990000123456"]) {
    assert.equal(normalizeWhatsappNumber(number), null);
  }
});

test("delivery states advance but stale webhook events cannot regress them", () => {
  assert.equal(canTransitionDelivery("accepted", "delivered"), true);
  assert.equal(canTransitionDelivery("delivered", "sent"), false);
  assert.equal(canTransitionDelivery("read", "delivered"), false);
});

test("terminal blocked and cancelled states cannot become sent", () => {
  assert.equal(canTransitionDelivery("blocked", "sent"), false);
  assert.equal(canTransitionDelivery("cancelled", "accepted"), false);
});

test("a timeout after dispatch is uncertain and cannot be retried automatically", () => {
  const outcome = classifyProviderFailure({ kind: "timeout", requestDispatched: true });
  assert.deepEqual(outcome, { status: "uncertain", retryable: false, code: "provider_timeout" });
  assert.equal(shouldRetryDelivery(outcome.status, 0, 3, outcome.retryable), false);
});

test("a connection failure before dispatch is safely retryable within the attempt limit", () => {
  const outcome = classifyProviderFailure({ kind: "network", requestDispatched: false });
  assert.deepEqual(outcome, { status: "failed", retryable: true, code: "network_before_send" });
  assert.equal(shouldRetryDelivery(outcome.status, 1, 3, outcome.retryable), true);
  assert.equal(shouldRetryDelivery(outcome.status, 3, 3, outcome.retryable), false);
});

test("provider rejections are retryable only when explicitly classified as transient", () => {
  assert.equal(
    classifyProviderFailure({ kind: "provider", requestDispatched: true, httpStatus: 429 })
      .retryable,
    true,
  );
  assert.equal(
    classifyProviderFailure({ kind: "provider", requestDispatched: true, httpStatus: 400 })
      .retryable,
    false,
  );
});

test("an expired processing lease is recoverable but an uncertain item is not", () => {
  const now = new Date("2026-10-16T12:00:00.000Z");
  assert.equal(isLeaseRecoverable("processing", "2026-10-16T11:59:59.000Z", now), true);
  assert.equal(isLeaseRecoverable("processing", "2026-10-16T12:00:01.000Z", now), false);
  assert.equal(isLeaseRecoverable("uncertain", "2026-10-16T11:00:00.000Z", now), false);
});

test("extracts stable Evolution identifiers without accepting arbitrary payload text", () => {
  assert.equal(extractProviderMessageId({ data: { key: { id: "msg-123" } } }), "msg-123");
  assert.equal(extractProviderMessageId({ data: { Id: "msg-456" } }), "msg-456");
  assert.equal(extractProviderMessageId({ raw: "msg-should-not-count" }), null);
});

test("duplicate webhook payloads produce the same deterministic event identity", async () => {
  const event = {
    instanceId: "instance-a",
    providerMessageId: "msg-a",
    status: "delivered",
    occurredAt: "2026-10-16T12:00:00.000Z",
  } as const;
  assert.equal(await deliveryEventIdentity(event), await deliveryEventIdentity({ ...event }));
});
