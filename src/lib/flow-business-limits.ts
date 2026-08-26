export type FlowBusinessLimit = number | null;

export function planLimitReached(used: number, limit: FlowBusinessLimit): boolean {
  return limit !== null && used >= limit;
}

export function planFeatureAvailable(limit: FlowBusinessLimit): boolean {
  return limit === null || limit > 0;
}

export function planLimitLabel(used: number, limit: FlowBusinessLimit): string {
  return limit === null ? `${used} · Ilimitado` : `${used}/${limit}`;
}

export function planLimitDetail(limit: FlowBusinessLimit): string {
  return limit === null ? "Acesso ilimitado" : `${limit} no plano`;
}

export function planLimitProgress(used: number, limit: FlowBusinessLimit): number {
  if (limit === null || limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}
