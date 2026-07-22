// Provedor Geoapify Places API — grátis (3.000/dia). Chave em secret
// GEOAPIFY_API_KEY (Deno.env), nunca no front. Fluxo: geocodifica a cidade →
// busca lugares por categoria dentro de um raio → normaliza para RawPlace.
// Só devolve o que a API traz — o que não vier fica null.
import type { ProviderSearch, RawPlace } from "./types.ts";

const GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";
const PLACES_URL = "https://api.geoapify.com/v2/places";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nicho (pt-BR) → categorias do Geoapify. */
const NICHO_CATS: Array<{ re: RegExp; cats: string[] }> = [
  { re: /odontol|dentist/i, cats: ["healthcare.dentist"] },
  // "estética" antes de "clínica" — "clínica de estética" deve virar beleza.
  { re: /est[eé]tica|beleza/i, cats: ["service.beauty", "commercial.health_and_beauty"] },
  {
    re: /cl[ií]nica|m[eé]dic|consult[oó]rio|sa[uú]de/i,
    cats: ["healthcare.clinic_or_praxis", "healthcare.hospital"],
  },
  { re: /restaurante/i, cats: ["catering.restaurant"] },
  { re: /lanchonete|hamburgue|fast/i, cats: ["catering.fast_food"] },
  { re: /academia|fitness|crossfit/i, cats: ["sport.fitness.fitness_centre", "leisure.fitness"] },
  { re: /sal[aã]o|cabeleireir|barbe/i, cats: ["service.beauty.hairdresser"] },
  { re: /advocacia|advogad|jur[ií]dic/i, cats: ["service.financial", "office"] },
  { re: /contab|contador/i, cats: ["service.financial"] },
  {
    re: /imobili[aá]ria|corretor de im[oó]veis/i,
    cats: ["service.estate_agent", "commercial.real_estate"],
  },
  { re: /pet ?shop|veterin[aá]ri/i, cats: ["commercial.pet", "service.veterinary"] },
  { re: /oficina|mec[aâ]nica/i, cats: ["service.vehicle.repair"] },
  { re: /farm[aá]cia/i, cats: ["healthcare.pharmacy"] },
  { re: /padaria|confeitaria/i, cats: ["commercial.food_and_drink.bakery"] },
  { re: /hotel|pousada/i, cats: ["accommodation.hotel", "accommodation.guest_house"] },
];

// Normaliza (minúsculas, SEM acento) — o nicho pode chegar decomposto (NFD).
const semAcento = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function catsFor(nicho: string): string[] {
  const hit = NICHO_CATS.find((t) => t.re.test(semAcento(nicho)));
  return hit ? hit.cats : ["commercial"]; // fallback amplo
}

async function geocodeCidade(
  cidade: string,
  uf: string,
  key: string,
): Promise<{ lat: number; lon: number } | null> {
  const text = uf ? `${cidade}, ${uf}, Brasil` : `${cidade}, Brasil`;
  const params = new URLSearchParams({
    text,
    type: "city",
    lang: "pt",
    limit: "1",
    format: "json",
    apiKey: key,
  });
  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Geoapify geocode: ${data?.message ?? "HTTP " + res.status}`);
  const r = data.results?.[0];
  return r ? { lat: r.lat, lon: r.lon } : null;
}

// Só os campos que usamos do GeoJSON de Places da Geoapify.
type GeoFeature = {
  properties?: {
    name?: string;
    place_id?: string;
    lat?: number;
    lon?: number;
    categories?: string[];
    formatted?: string;
    address_line2?: string;
    website?: string;
    contact?: { phone?: string };
    datasource?: { raw?: Record<string, unknown> };
  };
};

function raw(feature: GeoFeature, ...keys: string[]): string | null {
  const r = feature?.properties?.datasource?.raw ?? {};
  for (const k of keys) {
    const v = r[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return null;
}

function mapFeature(f: GeoFeature): RawPlace | null {
  const p = f.properties ?? {};
  const name = p.name?.trim();
  if (!name) return null;
  const id = p.place_id ?? `${p.lon},${p.lat}`;
  const instagram = raw(f, "contact:instagram");
  return {
    source: "geoapify",
    source_id: `geoapify:${id}`,
    name,
    category: p.categories?.[0] ?? null,
    address: p.formatted ?? p.address_line2 ?? null,
    phone: p.contact?.phone ?? raw(f, "contact:phone", "phone"),
    website: p.website ?? raw(f, "website", "contact:website"),
    rating: null, // Geoapify (base OSM) não traz nota
    review_count: null,
    instagram: instagram
      ? instagram.startsWith("http")
        ? instagram
        : `https://instagram.com/${instagram}`
      : null,
    facebook: raw(f, "contact:facebook"),
    lat: p.lat ?? null,
    lng: p.lon ?? null,
  };
}

export const searchGeoapify: ProviderSearch = async ({
  nicho,
  cidade,
  uf,
  lat,
  lng,
  raioKm,
  alvo,
  seen,
  log,
}) => {
  const key = Deno.env.get("GEOAPIFY_API_KEY");
  if (!key) throw new Error("GEOAPIFY_API_KEY não configurada no secret da Edge Function.");

  let centro: { lat: number; lon: number } | null;
  if (lat != null && lng != null) {
    centro = { lat, lon: lng };
    log(`Geoapify: ponto do mapa (raio ${raioKm ?? 20}km)`);
  } else {
    log(`Geoapify: geocodificando ${cidade}${uf ? "/" + uf : ""}...`);
    centro = await geocodeCidade(cidade, uf, key);
  }
  if (!centro) {
    log("Geoapify: localização não resolvida");
    return [];
  }

  // Geoapify limita o raio do circle a 50km.
  const raioM = Math.min(Math.round((raioKm ?? 20) * 1000), 50000);
  const cats = catsFor(nicho);
  const found: RawPlace[] = [];
  const nomesEnderecos = new Set<string>();
  const limit = Math.min(Math.max(alvo * 2, 50), 200);

  for (const cat of cats) {
    if (found.length >= alvo) break;
    log(`Geoapify: categoria ${cat} (raio ${Math.round(raioM / 1000)}km)`);
    const params = new URLSearchParams({
      categories: cat,
      filter: `circle:${centro.lon},${centro.lat},${raioM}`,
      bias: `proximity:${centro.lon},${centro.lat}`,
      limit: String(limit),
      lang: "pt",
      apiKey: key,
    });
    const res = await fetch(`${PLACES_URL}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Geoapify places: ${data?.message ?? "HTTP " + res.status}`);
    for (const f of data.features ?? []) {
      const place = mapFeature(f);
      if (!place) continue;
      if (seen.has(place.source_id)) continue;
      const chave = (place.name + "|" + (place.address ?? "")).toLowerCase();
      if (nomesEnderecos.has(chave)) continue;
      nomesEnderecos.add(chave);
      seen.add(place.source_id);
      found.push(place);
      if (found.length >= alvo) break;
    }
    await sleep(500);
  }
  log(`Geoapify: ${found.length} lugares únicos coletados`);
  return found;
};
