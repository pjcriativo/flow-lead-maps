function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function planAllowsFlowExecution(plan: unknown): boolean {
  return (
    isRecord(plan) &&
    isRecord(plan.limits) &&
    typeof plan.limits.flows === "number" &&
    Number.isInteger(plan.limits.flows) &&
    plan.limits.flows > 0
  );
}

export function normalizeInstagramKeyword(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}_]+/gu, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function commentMatchesKeyword(comment: string, keyword: string): boolean {
  const normalizedKeyword = normalizeInstagramKeyword(keyword);
  return (
    normalizedKeyword.length > 0 &&
    ` ${normalizeInstagramKeyword(comment)} `.includes(` ${normalizedKeyword} `)
  );
}

export function messagingWindowIsOpen(expiresAt: string | null, nowMs = Date.now()): boolean {
  if (!expiresAt) return false;
  const expiration = new Date(expiresAt).getTime();
  return Number.isFinite(expiration) && expiration > nowMs;
}
