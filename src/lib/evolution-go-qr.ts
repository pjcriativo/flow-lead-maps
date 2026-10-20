export function normalizeEvolutionGoQr(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object" || !("Qrcode" in data)) return null;
  const qrcode = (data as { Qrcode?: unknown }).Qrcode;
  if (typeof qrcode !== "string") return null;

  const value = qrcode.trim();
  if (/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  if (/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    return `data:image/png;base64,${value}`;
  }
  return null;
}
