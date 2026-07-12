// Cliente da Google Places API (New) — Text Search (v1).
// A chave vive em SECRET da Edge Function (Deno.env), NUNCA no front.
// Uma chamada de searchText já traz nome/telefone/site/nota/avaliações via
// FieldMask — não precisa de um Place Details separado.

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.types",
  "nextPageToken",
].join(",");

export type Place = {
  place_id: string;
  name: string;
  rating: number | null;
  user_ratings_total: number | null;
  formatted_address: string | null;
  phone: string | null;
  website: string | null;
  maps_uri: string | null;
  types: string[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gera variações de subnicho e sub-região para superar o limite por busca.
 * Ex.: "marketing" em Curitiba/PR →
 *   "marketing em Curitiba, PR", "marketing Curitiba centro", "... zona sul"...
 */
export function buildQueries(nicho: string, cidade: string, uf: string): string[] {
  const n = nicho.trim();
  const c = cidade.trim();
  const u = uf.trim().toUpperCase();
  const local = u ? `${c}, ${u}` : c;
  const zonas = ["centro", "zona sul", "zona norte", "zona leste", "zona oeste", "região metropolitana"];
  const queries = [
    `${n} em ${local}`,
    `${n} ${c}`,
    `melhor ${n} em ${c}`,
    `${n} particular em ${c}`,
    ...zonas.map((z) => `${n} em ${c} ${z}`),
  ];
  return [...new Set(queries)];
}

function mapPlace(p: any): Place {
  return {
    place_id: p.id,
    name: p.displayName?.text ?? "",
    rating: p.rating ?? null,
    user_ratings_total: p.userRatingCount ?? null,
    formatted_address: p.formattedAddress ?? null,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    maps_uri: p.googleMapsUri ?? null,
    types: p.types ?? [],
  };
}

async function searchTextPage(
  query: string,
  key: string,
  pageToken?: string,
): Promise<{ places: Place[]; next?: string }> {
  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: "pt-BR",
    regionCode: "BR",
    pageSize: 20,
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Places searchText: ${msg}`);
  }
  const places: Place[] = (data.places ?? []).map(mapPlace);
  return { places, next: data.nextPageToken };
}

/**
 * Executa uma query paginando (até 3 páginas / ~60 resultados).
 * `onFound` recebe cada place; retorne false para parar.
 */
export async function textSearchAll(
  query: string,
  key: string,
  onFound: (p: Place) => boolean,
): Promise<void> {
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    if (page > 0) await sleep(1500); // pageToken leva um instante para valer
    const { places, next } = await searchTextPage(query, key, pageToken);
    for (const p of places) {
      if (!p.place_id) continue;
      if (!onFound(p)) return;
    }
    if (!next) break;
    pageToken = next;
  }
}
