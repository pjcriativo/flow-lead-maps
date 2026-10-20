// Suite: WhatsApp instance health decisions.
// Invariant: missing or stale evidence never becomes a usable connection.
// Boundary IN: Evolution GO payload parsing, freshness, backoff and transport eligibility.
// Boundary OUT: persistence/RLS and live Evolution HTTP, covered by contract tests and staging.
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOperationalHealth,
  canDispatchWithInstance,
  healthAlertKey,
  healthBackoffSeconds,
  isFresh,
  parseEvolutionGoStatus,
  providerFailure,
  shouldApplyObservation,
} from "./whatsapp-instance-health.ts";

const now = new Date("2026-10-16T12:00:00.000Z");

test("parses a connected Evolution GO instance", () => {
  const result = parseEvolutionGoStatus(
    {
      data: { Connected: true, LoggedIn: true, Name: "org-a", Jid: "5511999999999@s.whatsapp.net" },
    },
    now.toISOString(),
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.providerState, "connected");
});

test("normalizes the connected owner number and removes the device suffix", () => {
  const result = parseEvolutionGoStatus(
    {
      data: {
        Connected: true,
        LoggedIn: true,
        Name: "org-a",
        Owner: "554197844716:15@s.whatsapp.net",
      },
    },
    now.toISOString(),
  );
  assert.equal(result.ok && result.jid, "554197844716");
});

test("distinguishes disconnected from awaiting pairing", () => {
  const disconnected = parseEvolutionGoStatus({ data: { Connected: false, LoggedIn: false } });
  const pairing = parseEvolutionGoStatus({ data: { Connected: true, LoggedIn: false } });
  assert.equal(disconnected.ok && disconnected.providerState, "disconnected");
  assert.equal(pairing.ok && pairing.providerState, "pairing");
});

test("rejects an invalid provider response instead of inventing booleans", () => {
  assert.deepEqual(parseEvolutionGoStatus({ data: { Connected: "yes" } }, now.toISOString()), {
    ok: false,
    observedAt: now.toISOString(),
    failureKind: "invalid_response",
    errorCode: "provider_invalid_response",
    httpStatus: null,
  });
});

test("timeout remains unknown evidence, not a disconnection", () => {
  const result = providerFailure("timeout", now.toISOString());
  assert.equal(result.ok, false);
  assert.equal(result.ok ? "" : result.failureKind, "timeout");
});

test("recent connected evidence is healthy", () => {
  assert.equal(
    calculateOperationalHealth({
      providerState: "connected",
      lastSuccessfulCheckAt: now.toISOString(),
      lastCheckFailed: false,
      consecutiveFailures: 0,
      now,
    }),
    "healthy",
  );
});

test("stale connected evidence is unknown", () => {
  assert.equal(
    calculateOperationalHealth({
      providerState: "connected",
      lastSuccessfulCheckAt: "2026-10-16T11:54:59.000Z",
      lastCheckFailed: false,
      consecutiveFailures: 0,
      now,
    }),
    "unknown",
  );
});

test("a transient provider failure degrades recent prior evidence", () => {
  assert.equal(
    calculateOperationalHealth({
      providerState: "connected",
      lastSuccessfulCheckAt: "2026-10-16T11:59:00.000Z",
      lastCheckFailed: true,
      consecutiveFailures: 1,
      now,
    }),
    "degraded",
  );
});

test("repeated provider failures become unstable", () => {
  assert.equal(
    calculateOperationalHealth({
      providerState: "connected",
      lastSuccessfulCheckAt: "2026-10-16T11:59:00.000Z",
      lastCheckFailed: true,
      consecutiveFailures: 3,
      now,
    }),
    "unstable",
  );
});

test("explicit disconnected evidence is unavailable", () => {
  assert.equal(
    calculateOperationalHealth({
      providerState: "disconnected",
      lastSuccessfulCheckAt: now.toISOString(),
      lastCheckFailed: false,
      consecutiveFailures: 0,
      now,
    }),
    "unavailable",
  );
});

test("reconnection has an explicit operational state", () => {
  assert.equal(
    calculateOperationalHealth({
      providerState: "disconnected",
      lastSuccessfulCheckAt: now.toISOString(),
      lastCheckFailed: false,
      consecutiveFailures: 0,
      reconnecting: true,
      now,
    }),
    "reconnecting",
  );
});

test("transport requires fresh healthy connected evidence", () => {
  assert.equal(
    canDispatchWithInstance({
      providerState: "connected",
      operationalHealth: "healthy",
      lastSuccessfulCheckAt: now.toISOString(),
      now,
    }),
    true,
  );
  for (const operationalHealth of [
    "degraded",
    "unstable",
    "unavailable",
    "unknown",
    "reconnecting",
  ] as const) {
    assert.equal(
      canDispatchWithInstance({
        providerState: "connected",
        operationalHealth,
        lastSuccessfulCheckAt: now.toISOString(),
        now,
      }),
      false,
    );
  }
});

test("transport rejects stale healthy rows", () => {
  assert.equal(
    canDispatchWithInstance({
      providerState: "connected",
      operationalHealth: "healthy",
      lastSuccessfulCheckAt: "2026-10-16T11:50:00.000Z",
      now,
    }),
    false,
  );
});

test("out-of-order observations cannot replace newer evidence", () => {
  assert.equal(
    shouldApplyObservation("2026-10-16T12:00:00.000Z", "2026-10-16T11:59:59.000Z"),
    false,
  );
  assert.equal(
    shouldApplyObservation("2026-10-16T12:00:00.000Z", "2026-10-16T12:00:01.000Z"),
    true,
  );
});

test("freshness rejects invalid and future timestamps", () => {
  assert.equal(isFresh("invalid", now), false);
  assert.equal(isFresh("2026-10-16T12:00:01.000Z", now), false);
});

test("monitor backoff is bounded and alert keys are stable", () => {
  assert.equal(healthBackoffSeconds(0), 30);
  assert.equal(healthBackoffSeconds(20), 900);
  assert.equal(healthAlertKey("chip-a", "disconnected"), "instance:chip-a:disconnected");
});
