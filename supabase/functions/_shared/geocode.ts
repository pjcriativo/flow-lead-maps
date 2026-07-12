// Geocodificação server-side via Nominatim (OSM) — grátis, sem chave.
// Respeita a UF (usa "cidade, UF, Brasil"), ao contrário da busca por nome de
// área no OSM. É o caminho padrão para transformar cidade+UF em centro+raio.

export type GeoCentro = { lat: number; lng: number; raioKm: number };

const KM_POR_GRAU = 111;

export async function geocodeCidade(cidade: string, uf: string): Promise<GeoCentro | null> {
  const q = `${cidade}${uf ? ", " + uf : ""}, Brasil`;
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({ q, format: "jsonv2", limit: "1", countrycodes: "br" }).toString();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FlowLeads/1.0 (prospeccao; contato@flowleads.com.br)" },
    });
    if (!res.ok) return null;
    const arr = await res.json();
    const r = arr?.[0];
    if (!r) return null;
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    let raioKm = 10;
    if (Array.isArray(r.boundingbox) && r.boundingbox.length === 4) {
      const [s, n, w, e] = r.boundingbox.map(Number);
      const dLat = Math.abs(n - s) * KM_POR_GRAU;
      const dLng = Math.abs(e - w) * KM_POR_GRAU * Math.cos((lat * Math.PI) / 180);
      raioKm = Math.min(50, Math.max(3, Math.round(Math.max(dLat, dLng) / 2)));
    }
    return { lat, lng, raioKm };
  } catch {
    return null;
  }
}
