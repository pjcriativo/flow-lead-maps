export type WhatsappDeliveryStatus =
  | "draft"
  | "pending_approval"
  | "scheduled"
  | "queued"
  | "processing"
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "uncertain"
  | "cancelled"
  | "blocked";

export type WhatsappRecipientInput = {
  phone: string | null;
  optedIn: boolean;
  optedOut: boolean;
  consentSource: string | null;
  consentedAt: string | null;
  purpose: string | null;
};

export type WhatsappEligibility =
  | { eligible: true; number: string }
  | {
      eligible: false;
      reason:
        | "telefone_invalido"
        | "consentimento_ausente"
        | "origem_consentimento_ausente"
        | "finalidade_ausente"
        | "opt_out";
    };

export function normalizeWhatsappNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15 || /^0+$/.test(digits)) return null;
  return digits;
}

export function isEligibleWhatsappRecipient(input: WhatsappRecipientInput): WhatsappEligibility {
  if (input.optedOut) return { eligible: false, reason: "opt_out" };
  if (!input.optedIn || !input.consentedAt) {
    return { eligible: false, reason: "consentimento_ausente" };
  }
  if (!input.consentSource?.trim()) {
    return { eligible: false, reason: "origem_consentimento_ausente" };
  }
  if (!input.purpose?.trim()) return { eligible: false, reason: "finalidade_ausente" };
  const number = normalizeWhatsappNumber(input.phone);
  return number ? { eligible: true, number } : { eligible: false, reason: "telefone_invalido" };
}

const STATUS_RANK: Partial<Record<WhatsappDeliveryStatus, number>> = {
  accepted: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

const TERMINAL_STATUSES = new Set<WhatsappDeliveryStatus>([
  "read",
  "cancelled",
  "blocked",
  "uncertain",
]);

export function canTransitionDelivery(
  current: WhatsappDeliveryStatus,
  next: WhatsappDeliveryStatus,
): boolean {
  if (current === next) return true;
  if (TERMINAL_STATUSES.has(current)) return false;
  const currentRank = STATUS_RANK[current];
  const nextRank = STATUS_RANK[next];
  if (currentRank !== undefined && nextRank !== undefined) return nextRank > currentRank;
  if (next === "failed") return current === "processing" || current === "accepted";
  if (next === "uncertain") return current === "processing";
  if (next === "cancelled") {
    return ["draft", "pending_approval", "scheduled", "queued", "failed"].includes(current);
  }
  const allowed: Partial<Record<WhatsappDeliveryStatus, WhatsappDeliveryStatus[]>> = {
    draft: ["pending_approval", "blocked", "cancelled"],
    pending_approval: ["scheduled", "queued", "blocked", "cancelled"],
    scheduled: ["queued", "processing", "blocked", "cancelled"],
    queued: ["processing", "blocked", "cancelled"],
    processing: ["accepted", "sent", "delivered", "read", "failed", "uncertain"],
    failed: ["queued", "processing", "blocked", "cancelled"],
  };
  return allowed[current]?.includes(next) ?? false;
}

export type ProviderFailureInput = {
  kind: "timeout" | "network" | "provider" | "persistence";
  requestDispatched: boolean;
  httpStatus?: number;
};

export type ProviderFailureDecision = {
  status: "failed" | "uncertain";
  retryable: boolean;
  code: string;
};

export function classifyProviderFailure(input: ProviderFailureInput): ProviderFailureDecision {
  if (input.kind === "persistence" || (input.requestDispatched && input.kind !== "provider")) {
    return {
      status: "uncertain",
      retryable: false,
      code: input.kind === "timeout" ? "provider_timeout" : `${input.kind}_after_send`,
    };
  }
  if (input.kind === "provider") {
    const retryable = input.httpStatus === 429 || (input.httpStatus ?? 0) >= 500;
    return { status: "failed", retryable, code: `provider_${input.httpStatus ?? "rejected"}` };
  }
  return { status: "failed", retryable: true, code: `${input.kind}_before_send` };
}

export function shouldRetryDelivery(
  status: WhatsappDeliveryStatus,
  attemptCount: number,
  maxAttempts: number,
  explicitlyRetryable: boolean,
): boolean {
  return status === "failed" && explicitlyRetryable && attemptCount < maxAttempts;
}

export function isLeaseRecoverable(
  status: WhatsappDeliveryStatus,
  leaseExpiresAt: string | null,
  now = new Date(),
): boolean {
  if (status !== "processing" || !leaseExpiresAt) return false;
  const expiry = Date.parse(leaseExpiresAt);
  return Number.isFinite(expiry) && expiry < now.getTime();
}

function stringAtPath(value: unknown, path: readonly string[]): string | null {
  let cursor: unknown = value;
  for (const segment of path) {
    if (!cursor || typeof cursor !== "object" || !(segment in cursor)) return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" && cursor.trim() ? cursor.trim() : null;
}

export function extractProviderMessageId(payload: unknown): string | null {
  const paths = [
    ["data", "key", "id"],
    ["data", "Key", "ID"],
    ["data", "Info", "ID"],
    ["data", "info", "id"],
    ["data", "Id"],
    ["data", "id"],
    ["key", "id"],
    ["Id"],
    ["id"],
  ] as const;
  for (const path of paths) {
    const value = stringAtPath(payload, path);
    if (value) return value;
  }
  return null;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function deliveryEventIdentity(input: {
  instanceId: string;
  providerMessageId: string;
  status: string;
  occurredAt: string | null;
}): Promise<string> {
  const canonical = [
    input.instanceId.trim(),
    input.providerMessageId.trim(),
    input.status.trim().toLowerCase(),
    input.occurredAt ?? "",
  ].join("|");
  return bytesToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical)));
}

export function sanitizeProviderError(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value ?? "provider_error");
  return message
    .replace(/apikey\s*[:=]\s*[^\s,;]+/gi, "apikey=[redacted]")
    .replace(/bearer\s+[a-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(0, 500);
}
