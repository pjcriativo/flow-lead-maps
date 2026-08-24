import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { leadBusinessIdentity } from "./lead-dedupe.ts";
import type { ProviderParams, RawPlace } from "./providers/types.ts";

type SearchIdentity = Pick<
  ProviderParams,
  "nicho" | "cidade" | "uf" | "lat" | "lng" | "raioKm" | "usarAreaMapa"
>;

export type LeadSearchEventReason =
  "catalog" | "cache" | "catalog_cache" | "recent_paid" | "source_exhausted" | "paid_expansion";

export type LeadSearchEconomyEvent = {
  queryKey: string;
  requested: number;
  catalogReturned: number;
  cacheReturned: number;
  providerReturned: number;
  returnedCandidates: number;
  duplicatesAvoided: number;
  paidRunStarted: boolean;
  reason: LeadSearchEventReason;
};

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseCatalogPlace(value: unknown): RawPlace | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.source_id !== "string" || typeof row.name !== "string") return null;
  return {
    source:
      row.source === "osm" ||
      row.source === "geoapify" ||
      row.source === "places" ||
      row.source === "apify"
        ? row.source
        : "apify",
    source_id: row.source_id,
    name: row.name,
    category: nullableString(row.category),
    address: nullableString(row.address),
    phone: nullableString(row.phone),
    website: nullableString(row.website),
    rating: nullableNumber(row.rating),
    review_count: nullableNumber(row.review_count),
    instagram: nullableString(row.instagram),
    facebook: nullableString(row.facebook),
    lat: nullableNumber(row.lat),
    lng: nullableNumber(row.lng),
  };
}

export function leadCatalogIdentity(place: RawPlace): string {
  return leadBusinessIdentity(place.name, place.address) ?? place.source_id;
}

export async function buscarCatalogoCompartilhado(
  admin: SupabaseClient,
  orgId: string,
  identity: SearchIdentity,
  limite: number,
): Promise<RawPlace[]> {
  if (limite <= 0) return [];
  const { data, error } = await admin.rpc("search_shared_lead_catalog", {
    p_org_id: orgId,
    p_niche: identity.nicho,
    p_city: identity.cidade,
    p_state: identity.uf,
    p_use_map: identity.usarAreaMapa,
    p_lat: identity.lat,
    p_lng: identity.lng,
    p_radius_km: identity.raioKm,
    p_limit: limite,
    p_max_age_days: 90,
  });
  if (error) throw new Error(`Catálogo compartilhado indisponível: ${error.message}`);
  if (!Array.isArray(data)) return [];
  return data.map(parseCatalogPlace).filter((place): place is RawPlace => place !== null);
}

export async function guardarCatalogoCompartilhado(
  admin: SupabaseClient,
  queryKey: string,
  identity: SearchIdentity,
  places: readonly RawPlace[],
): Promise<void> {
  if (places.length === 0) return;
  const { error } = await admin.rpc("store_shared_lead_catalog", {
    p_query_key: queryKey,
    p_niche: identity.nicho,
    p_area_kind: identity.usarAreaMapa ? "mapa" : "cidade",
    p_city: identity.cidade,
    p_state: identity.uf,
    p_center_lat: identity.lat,
    p_center_lng: identity.lng,
    p_radius_km: identity.raioKm,
    p_items: places,
  });
  if (error) throw new Error(`Falha ao atualizar catálogo compartilhado: ${error.message}`);
}

export async function registrarEventoEconomiaBusca(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  identity: SearchIdentity,
  event: LeadSearchEconomyEvent,
): Promise<void> {
  const { error } = await admin.from("lead_search_events").insert({
    org_id: orgId,
    user_id: userId,
    query_key: event.queryKey,
    niche: identity.nicho,
    city: identity.cidade || null,
    state: identity.uf || null,
    requested: event.requested,
    catalog_returned: event.catalogReturned,
    cache_returned: event.cacheReturned,
    provider_returned: event.providerReturned,
    returned_candidates: event.returnedCandidates,
    duplicates_avoided: event.duplicatesAvoided,
    paid_run_started: event.paidRunStarted,
    reason: event.reason,
  });
  if (error) throw new Error(`Falha ao registrar economia da busca: ${error.message}`);
}
