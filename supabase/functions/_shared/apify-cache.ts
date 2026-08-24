import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import {
  APIFY_MAX_INCREMENTAL_DEPTH,
  criarChaveCacheApify,
  planejarCacheIncrementalApify,
  selecionarIneditosApify,
} from "./apify-economy.ts";
import { leadBusinessIdentity, type SeenLeadIdentities } from "./lead-dedupe.ts";
import { searchApify } from "./providers/apify.ts";
import type { ProviderParams, RawPlace } from "./providers/types.ts";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_WAIT_MS = 120_000;
const CACHE_POLL_MS = 2_000;

type CacheRow = {
  items: unknown;
  searched_depth: number;
  requested_depth: number;
  exhausted: boolean;
  refreshed_at: string | null;
  refreshing_until: string | null;
};

type Claim = {
  decision: "cache" | "refresh" | "wait";
  items?: unknown;
  searched_depth?: number;
  exhausted?: boolean;
};

export type ApifyCachedSearchParams = Omit<ProviderParams, "seen"> & {
  admin: SupabaseClient;
  orgId: string;
  seen: SeenLeadIdentities;
};

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseRawPlace(value: unknown): RawPlace | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { [key: string]: unknown };
  if (row.source !== "apify" || typeof row.source_id !== "string" || typeof row.name !== "string") {
    return null;
  }
  return {
    source: "apify",
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

function parsePlaces(value: unknown): RawPlace[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseRawPlace).filter((place): place is RawPlace => place !== null);
}

function lugarJaConhecido(place: RawPlace, seen: SeenLeadIdentities): boolean {
  if (seen.placeIds.has(place.source_id)) return true;
  const businessKey = leadBusinessIdentity(place.name, place.address);
  return businessKey !== null && seen.businessKeys.has(businessKey);
}

function selecionarIneditos(
  places: readonly RawPlace[],
  solicitado: number,
  seen: SeenLeadIdentities,
): RawPlace[] {
  return selecionarIneditosApify(places, solicitado, (place) => lugarJaConhecido(place, seen));
}

function contarIneditos(places: readonly RawPlace[], seen: SeenLeadIdentities): number {
  return places.reduce((total, place) => total + (lugarJaConhecido(place, seen) ? 0 : 1), 0);
}

function cacheFresco(row: CacheRow | null): boolean {
  if (!row?.refreshed_at) return false;
  const refreshedAt = new Date(row.refreshed_at).getTime();
  return Number.isFinite(refreshedAt) && refreshedAt >= Date.now() - CACHE_TTL_MS;
}

async function organizacaoJaPagouConsulta(
  admin: SupabaseClient,
  orgId: string,
  queryKey: string,
): Promise<boolean> {
  const desde = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data, error } = await admin
    .from("api_consumption_logs")
    .select("id")
    .eq("org_id", orgId)
    .eq("service", "apify_maps")
    .eq("metadata->>query_key", queryKey)
    .gte("created_at", desde)
    .limit(1);
  if (error) throw new Error(`Histórico de buscas Apify indisponível: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

async function lerCache(admin: SupabaseClient, queryKey: string): Promise<CacheRow | null> {
  const { data, error } = await admin
    .from("apify_search_cache")
    .select("items, searched_depth, requested_depth, exhausted, refreshed_at, refreshing_until")
    .eq("query_key", queryKey)
    .maybeSingle();
  if (error) throw new Error(`Cache Apify indisponível: ${error.message}`);
  return data as CacheRow | null;
}

async function reivindicarCache(
  admin: SupabaseClient,
  queryKey: string,
  targetDepth: number,
): Promise<Claim> {
  const { data, error } = await admin.rpc("claim_apify_search_cache_v3", {
    p_query_key: queryKey,
    p_target_depth: targetDepth,
    p_ttl_hours: 30 * 24,
  });
  if (error) throw new Error(`Falha ao reservar busca Apify: ${error.message}`);
  const claim = data as Claim | null;
  if (!claim || !["cache", "refresh", "wait"].includes(claim.decision)) {
    throw new Error("Resposta inválida ao reservar cache da Apify");
  }
  return claim;
}

async function aguardarCache(
  admin: SupabaseClient,
  queryKey: string,
  targetDepth: number,
  solicitado: number,
  seen: SeenLeadIdentities,
  log: (message: string) => void,
): Promise<RawPlace[] | null> {
  const deadline = Date.now() + CACHE_WAIT_MS;
  log("Apify: uma consulta idêntica já está em andamento; aguardando o resultado compartilhado...");
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, CACHE_POLL_MS));
    const row = await lerCache(admin, queryKey);
    if (row && cacheFresco(row) && (row.searched_depth >= targetDepth || row.exhausted)) {
      return selecionarIneditos(parsePlaces(row.items), solicitado, seen);
    }
    const lockExpired =
      !row?.refreshing_until || new Date(row.refreshing_until).getTime() <= Date.now();
    if (lockExpired) return null;
  }
  throw new Error(
    "A consulta idêntica ainda está processando. Aguarde alguns instantes e tente novamente.",
  );
}

async function liberarReserva(
  admin: SupabaseClient,
  queryKey: string,
  log: (message: string) => void,
): Promise<void> {
  const { error } = await admin.rpc("release_apify_search_cache", { p_query_key: queryKey });
  if (error) log(`Apify: aviso — não foi possível liberar a reserva do cache: ${error.message}`);
}

export async function searchApifyComCache({
  admin,
  orgId,
  seen,
  ...params
}: ApifyCachedSearchParams): Promise<RawPlace[]> {
  const queryKey = criarChaveCacheApify(params);
  const existing = await lerCache(admin, queryKey);
  const existingPlaces = parsePlaces(existing?.items);
  const existingFresh = cacheFresco(existing);
  const ineditosCache = contarIneditos(existingPlaces, seen);
  const buscaPagaRecente = await organizacaoJaPagouConsulta(admin, orgId, queryKey);
  const existingPlan = planejarCacheIncrementalApify({
    solicitado: params.limite,
    itensCache: existingPlaces.length,
    ineditosCache: existingFresh ? ineditosCache : 0,
    cacheEsgotado: existingFresh && Boolean(existing?.exhausted),
    buscaPagaRecente,
  });
  if (existingPlan.servidoDoCache) {
    const ineditos = selecionarIneditos(existingPlaces, params.limite, seen);
    params.log(
      ineditos.length > 0
        ? `Apify: economia ativada — entregando ${ineditos.length} lugares inéditos do estoque compartilhado sem nova cobrança.`
        : "Apify: esta busca já foi esgotada para sua conta; nenhum lead repetido será devolvido e nenhuma cobrança foi iniciada.",
    );
    return ineditos;
  }

  const conhecidosNoCache = Math.max(0, existingPlaces.length - ineditosCache);
  const targetDepth = existingFresh
    ? existingPlan.profundidadeColeta
    : Math.min(APIFY_MAX_INCREMENTAL_DEPTH, conhecidosNoCache + params.limite);
  if (targetDepth <= 0) return [];
  if (existingPlaces.length > 0) {
    params.log(
      `Apify: o estoque atual tem ${ineditosCache} lugar(es) inédito(s); ampliando a coleta de ${existingPlaces.length} para ${targetDepth} para buscar novos leads.`,
    );
  }

  let claim = await reivindicarCache(admin, queryKey, targetDepth);
  if (claim.decision === "cache") {
    params.log("Apify: resultado compartilhado encontrado; nenhuma nova cobrança foi iniciada.");
    return selecionarIneditos(parsePlaces(claim.items), params.limite, seen);
  }
  if (claim.decision === "wait") {
    const waited = await aguardarCache(
      admin,
      queryKey,
      targetDepth,
      params.limite,
      seen,
      params.log,
    );
    if (waited) return waited;
    claim = await reivindicarCache(admin, queryKey, targetDepth);
    if (claim.decision === "cache") {
      return selecionarIneditos(parsePlaces(claim.items), params.limite, seen);
    }
    if (claim.decision === "wait") {
      throw new Error(
        "Não foi possível assumir a consulta Apify após o término da reserva anterior.",
      );
    }
  }

  try {
    const reportUsage = (usage: Parameters<typeof params.reportUsage>[0]) =>
      params.reportUsage({
        ...usage,
        metadata: {
          ...usage.metadata,
          query_key: queryKey,
          requested_new_leads: params.limite,
          collection_depth: targetDepth,
        },
      });
    const places = await searchApify({
      ...params,
      limite: targetDepth,
      alvo: Math.max(params.alvo, targetDepth),
      seen: new Set<string>(),
      reportUsage,
    });
    const { error } = await admin.rpc("store_apify_search_cache_v3", {
      p_query_key: queryKey,
      p_requested_depth: targetDepth,
      p_items: places,
    });
    if (error) {
      params.log(`Apify: aviso — resultado entregue, mas o cache não foi salvo: ${error.message}`);
      await liberarReserva(admin, queryKey, params.log);
    } else {
      params.log(`Apify: ${places.length} lugares guardados para evitar cobranças repetidas.`);
    }
    return selecionarIneditos(places, params.limite, seen);
  } catch (error) {
    await liberarReserva(admin, queryKey, params.log);
    throw error;
  }
}
