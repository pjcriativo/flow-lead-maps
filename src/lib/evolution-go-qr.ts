export function normalizeEvolutionGoQr(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  for (const candidate of [record.Qrcode, record.qrcode, record.Code, record.code]) {
    if (typeof candidate !== "string") continue;
    const value = candidate.trim();
    if (/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
    if (/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value)) {
      return `data:image/png;base64,${value}`;
    }
  }
  return null;
}
