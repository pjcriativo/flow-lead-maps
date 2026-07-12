// Geocodificação client-side via Nominatim (OpenStreetMap) — grátis, sem chave.
// Usado para MOVER o mapa quando o usuário digita a cidade/UF.
// Política de uso justo: baixo volume + debounce no chamador.

export type GeoResult = {
  lat: number;
  lng: number;
  /** Raio (km) sugerido para cobrir a cidade, a partir da bounding box. */
  raioKmSugerido: number;
  /** Rótulo curto (ex.: "São Paulo, SP"). */
  rotulo: string;
};

const KM_POR_GRAU = 111;

export async function geocodeCidade(
  cidade: string,
  uf: string,
  signal?: AbortSignal,
): Promise<GeoResult | null> {
  const q = `${cidade}${uf ? ", " + uf : ""}, Brasil`;
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({ q, format: "jsonv2", limit: "1", countrycodes: "br" }).toString();

  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const arr = (await res.json()) as Array<{
    lat: string;
    lon: string;
    boundingbox?: string[];
    display_name?: string;
  }>;
  const r = arr?.[0];
  if (!r) return null;

  const lat = parseFloat(r.lat);
  const lng = parseFloat(r.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  // boundingbox = [south, north, west, east] → raio ~ metade da maior dimensão.
  let raioKmSugerido = 10;
  if (Array.isArray(r.boundingbox) && r.boundingbox.length === 4) {
    const [s, n, w, e] = r.boundingbox.map(Number);
    const dLat = Math.abs(n - s) * KM_POR_GRAU;
    const dLng = Math.abs(e - w) * KM_POR_GRAU * Math.cos((lat * Math.PI) / 180);
    raioKmSugerido = Math.min(50, Math.max(3, Math.round(Math.max(dLat, dLng) / 2)));
  }

  return { lat, lng, raioKmSugerido, rotulo: `${cidade}${uf ? ", " + uf : ""}` };
}
