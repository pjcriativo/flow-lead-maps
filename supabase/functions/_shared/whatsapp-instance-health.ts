export const WA_HEALTH_FRESHNESS_MS = 5 * 60 * 1000;

export type WaProviderState = "connected" | "disconnected" | "pairing" | "unknown";
export type WaOperationalHealth =
  "healthy" | "degraded" | "unstable" | "unavailable" | "unknown" | "reconnecting";
export type WaHealthFailureKind =
  "timeout" | "network" | "authentication" | "provider" | "invalid_response";

export type WaProviderObservation =
  | {
      ok: true;
      observedAt: string;
      providerState: WaProviderState;
      connected: boolean;
      loggedIn: boolean;
      name: string;
      jid: string;
    }
  | {
      ok: false;
      observedAt: string;
      failureKind: WaHealthFailureKind;
      errorCode: string;
      httpStatus: number | null;
    };

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function normalizeWhatsappOwner(value: unknown): string {
  const raw = text(value).trim();
  if (!raw) return "";
  const account = raw.split("@")[0]?.split(":")[0] ?? "";
  return account.replace(/\D/g, "");
}

export function parseEvolutionGoStatus(
  payload: unknown,
  observedAt = new Date().toISOString(),
): WaProviderObservation {
  const root = record(payload);
  const data = record(root?.data);
  const connected = data?.Connected ?? data?.connected;
  const loggedIn = data?.LoggedIn ?? data?.loggedIn;
  if (!data || typeof connected !== "boolean" || typeof loggedIn !== "boolean") {
    return {
      ok: false,
      observedAt,
      failureKind: "invalid_response",
      errorCode: "provider_invalid_response",
      httpStatus: null,
    };
  }

  return {
    ok: true,
    observedAt,
    providerState: loggedIn ? "connected" : connected ? "pairing" : "disconnected",
    connected,
    loggedIn,
    name: text(data.Name ?? data.name),
    jid: normalizeWhatsappOwner(
      data.Jid ?? data.jid ?? data.MyJid ?? data.myJid ?? data.Owner ?? data.owner,
    ),
  };
}

export function providerFailure(
  failureKind: WaHealthFailureKind,
  observedAt = new Date().toISOString(),
  httpStatus: number | null = null,
): WaProviderObservation {
  return {
    ok: false,
    observedAt,
    failureKind,
    errorCode: `provider_${failureKind}`,
    httpStatus,
  };
}

export function isFresh(
  value: string | null | undefined,
  now = new Date(),
  maxAgeMs = WA_HEALTH_FRESHNESS_MS,
): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) &&
    timestamp <= now.getTime() &&
    now.getTime() - timestamp <= maxAgeMs
  );
}

export function calculateOperationalHealth(input: {
  providerState: WaProviderState;
  lastSuccessfulCheckAt: string | null;
  lastCheckFailed: boolean;
  consecutiveFailures: number;
  reconnecting?: boolean;
  now?: Date;
  maxAgeMs?: number;
}): WaOperationalHealth {
  if (input.reconnecting) return "reconnecting";
  if (!isFresh(input.lastSuccessfulCheckAt, input.now, input.maxAgeMs)) return "unknown";
  if (input.lastCheckFailed) return input.consecutiveFailures >= 3 ? "unstable" : "degraded";
  if (input.providerState === "connected") return "healthy";
  if (input.providerState === "disconnected" || input.providerState === "pairing") {
    return "unavailable";
  }
  return "unknown";
}

export function canDispatchWithInstance(input: {
  providerState: WaProviderState;
  operationalHealth: WaOperationalHealth;
  lastSuccessfulCheckAt: string | null;
  now?: Date;
  maxAgeMs?: number;
}): boolean {
  return (
    input.providerState === "connected" &&
    input.operationalHealth === "healthy" &&
    isFresh(input.lastSuccessfulCheckAt, input.now, input.maxAgeMs)
  );
}

export function shouldApplyObservation(
  currentObservedAt: string | null | undefined,
  incomingObservedAt: string,
): boolean {
  const incoming = Date.parse(incomingObservedAt);
  if (!Number.isFinite(incoming)) return false;
  if (!currentObservedAt) return true;
  const current = Date.parse(currentObservedAt);
  return !Number.isFinite(current) || incoming >= current;
}

export function healthBackoffSeconds(consecutiveFailures: number): number {
  const exponent = Math.max(0, Math.min(6, Math.trunc(consecutiveFailures)));
  return Math.min(15 * 60, 30 * 2 ** exponent);
}

export function healthAlertKey(instanceId: string, kind: string): string {
  return `instance:${instanceId}:${kind}`;
}
