// Provedor Google Places API (New) — requer billing no Google Cloud.
// Mantido plugado como fonte futura; hoje a UI o rotula "requer billing".
import type { ProviderSearch, RawPlace } from "./types.ts";
import { buildQueries, textSearchAll } from "../places.ts";

export const searchPlaces: ProviderSearch = async ({ nicho, cidade, uf, alvo, seen, log }) => {
  const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY não configurada no secret da Edge Function.");
  }

  const found: RawPlace[] = [];
  for (const q of buildQueries(nicho, cidade, uf)) {
    if (found.length >= alvo) break;
    log(`Google Places: buscando "${q}"`);
    let stop = false;
    await textSearchAll(q, key, (p) => {
      const source_id = `gplaces:${p.place_id}`;
      if (seen.has(source_id)) return true;
      seen.add(source_id);
      found.push({
        source: "places",
        source_id,
        name: p.name,
        category: p.types?.[0] ?? null,
        address: p.formatted_address,
        phone: p.phone,
        website: p.website,
        rating: p.rating,
        review_count: p.user_ratings_total,
        instagram: null,
        facebook: null,
        lat: null,
        lng: null,
      });
      if (found.length >= alvo) {
        stop = true;
        return false;
      }
      return true;
    });
    if (stop) break;
  }
  log(`Google Places: ${found.length} lugares únicos coletados`);
  return found;
};
