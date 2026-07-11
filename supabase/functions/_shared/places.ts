// Cliente da Google Places API (Text Search + Place Details).
// A chave vive em SECRET da Edge Function (Deno.env), NUNCA no front.

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export type PlaceLite = {
  place_id: string;
  name: string;
  rating: number | null;
  user_ratings_total: number | null;
  formatted_address: string | null;
};

export type PlaceDetails = {
  place_id: string;
  name: string;
  rating: number | null;
  user_ratings_total: number | null;
  formatted_address: string | null;
  formatted_phone_number: string | null;
  international_phone_number: string | null;
  website: string | null;
  url: string | null; // link do Google Maps
  types: string[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gera variações de subnicho e sub-região para superar o limite de ~60/busca.
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
  // dedupe preservando ordem
  return [...new Set(queries)];
}

async function textSearchPage(
  query: string,
  key: string,
  pagetoken?: string,
): Promise<{ results: PlaceLite[]; next?: string }> {
  const params = new URLSearchParams({ language: "pt-BR", region: "br", key });
  if (pagetoken) params.set("pagetoken", pagetoken);
  else params.set("query", query);

  const res = await fetch(`${PLACES_BASE}/textsearch/json?${params.toString()}`);
  const data = await res.json();
  if (data.status && !["OK", "ZERO_RESULTS"].includes(data.status)) {
    throw new Error(
      `Places TextSearch: ${data.status}${data.error_message ? " — " + data.error_message : ""}`,
    );
  }
  const results: PlaceLite[] = (data.results ?? []).map((r: any) => ({
    place_id: r.place_id,
    name: r.name,
    rating: r.rating ?? null,
    user_ratings_total: r.user_ratings_total ?? null,
    formatted_address: r.formatted_address ?? null,
  }));
  return { results, next: data.next_page_token };
}

/**
 * Executa uma query paginando (até 3 páginas / ~60 resultados).
 * `onFound` recebe cada place novo (dedupe é do chamador).
 */
export async function textSearchAll(
  query: string,
  key: string,
  onFound: (p: PlaceLite) => boolean, // retorna false para parar
): Promise<void> {
  let pagetoken: string | undefined;
  for (let page = 0; page < 3; page++) {
    if (page > 0) await sleep(2100); // next_page_token demora a valer
    const { results, next } = await textSearchPage(query, key, pagetoken);
    for (const p of results) {
      if (!p.place_id) continue;
      const keepGoing = onFound(p);
      if (!keepGoing) return;
    }
    if (!next) break;
    pagetoken = next;
  }
}

export async function placeDetails(
  placeId: string,
  key: string,
): Promise<PlaceDetails | null> {
  const fields = [
    "place_id", "name", "rating", "user_ratings_total", "formatted_address",
    "formatted_phone_number", "international_phone_number", "website", "url", "types",
  ].join(",");
  const params = new URLSearchParams({ place_id: placeId, fields, language: "pt-BR", key });
  const res = await fetch(`${PLACES_BASE}/details/json?${params.toString()}`);
  const data = await res.json();
  if (data.status !== "OK" || !data.result) return null;
  const r = data.result;
  return {
    place_id: r.place_id ?? placeId,
    name: r.name ?? "",
    rating: r.rating ?? null,
    user_ratings_total: r.user_ratings_total ?? null,
    formatted_address: r.formatted_address ?? null,
    formatted_phone_number: r.formatted_phone_number ?? null,
    international_phone_number: r.international_phone_number ?? null,
    website: r.website ?? null,
    url: r.url ?? null,
    types: r.types ?? [],
  };
}
