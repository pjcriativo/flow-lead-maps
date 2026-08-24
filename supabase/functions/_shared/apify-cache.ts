import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import {
  APIFY_MAX_INCREMENTAL_DEPTH,
  criarChaveCacheApify,
  planejarCacheIncrementalApify,
  selecionarIneditosApify,
} from "./apify-economy.ts";
import { leadBusinessIdentity, type SeenLeadIdentities } from "./lead-dedupe.ts";
import { combinarFontesIneditas, planejarComplementoBaseFirst } from "./lead-catalog-policy.ts";
import {
  buscarCatalogoCompartilhado,
  guardarCatalogoCompartilhado,
  leadCatalogIdentity,
  registrarEventoEconomiaBusca,
  type LeadSearchEventReason,
} from "./lead-catalog.ts";
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
  userId: string;
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

function incluirNoHistorico(
  seen: SeenLeadIdentities,
  places: readonly RawPlace[],
): SeenLeadIdentities {
  const expanded: SeenLeadIdentities = {
    placeIds: new Set(seen.placeIds),
    businessKeys: new Set(seen.businessKeys),
  };
  for (const place of places) {
    expanded.placeIds.add(place.source_id);
    const businessKey = leadBusinessIdentity(place.name, place.address);
    if (businessKey) expanded.businessKeys.add(businessKey);
  }
  return expanded;
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
  log: (message: string) => void,
): Promise<RawPlace[] | null> {
  const deadline = Date.now() + CACHE_WAIT_MS;
  log("Apify: uma consulta idêntica já está em andamento; aguardando o resultado compartilhado...");
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, CACHE_POLL_MS));
    const row = await lerCache(admin, queryKey);
    if (row && cacheFresco(row) && (row.searched_depth >= targetDepth || row.exhausted)) {
      return parsePlaces(row.items);
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
  userId,
  seen,
  ...params
}: ApifyCachedSearchParams): Promise<RawPlace[]> {
  const queryKey = criarChaveCacheApify(params);
  const registrarEvento = async ({
    catalogReturned,
    cacheReturned,
    providerReturned,
    returnedCandidates,
    duplicatesAvoided,
    paidRunStarted,
    reason,
  }: {
    catalogReturned: number;
    cacheReturned: number;
    providerReturned: number;
    returnedCandidates: number;
    duplicatesAvoided: number;
    paidRunStarted: boolean;
    reason: LeadSearchEventReason;
  }) => {
    try {
      await registrarEventoEconomiaBusca(admin, orgId, userId, params, {
        queryKey,
        requested: params.limite,
        catalogReturned,
        cacheReturned,
        providerReturned,
        returnedCandidates,
        duplicatesAvoided,
        paidRunStarted,
        reason,
      });
    } catch (error) {
      params.log(
        `Economia: aviso — não foi possível registrar a telemetria: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const catalogPlaces = await buscarCatalogoCompartilhado(admin, orgId, params, params.limite);
  const seenComCatalogo = incluirNoHistorico(seen, catalogPlaces);
  const existing = await lerCache(admin, queryKey);
  const existingPlaces = parsePlaces(existing?.items);
  const existingFresh = cacheFresco(existing);
  const cachePlaces = existingFresh
    ? selecionarIneditos(existingPlaces, params.limite, seenComCatalogo)
    : [];
  const local = combinarFontesIneditas({
    solicitado: params.limite,
    catalogo: catalogPlaces,
    cache: cachePlaces,
    identidade: leadCatalogIdentity,
  });
  const buscaPagaRecente = await organizacaoJaPagouConsulta(admin, orgId, queryKey);
  const cacheEsgotado = existingFresh && Boolean(existing?.exhausted);
  const basePlan = planejarComplementoBaseFirst({
    solicitado: params.limite,
    catalogoDisponivel: local.doCatalogo,
    cacheDisponivel: local.doCache,
    pagamentoBloqueado: buscaPagaRecente || cacheEsgotado,
    motivoBloqueio: cacheEsgotado ? "fonte_esgotada" : "busca_recente",
  });

  if (!basePlan.podeIniciarPagamento) {
    const reason: LeadSearchEventReason =
      basePlan.motivo === "busca_recente"
        ? "recent_paid"
        : basePlan.motivo === "fonte_esgotada"
          ? "source_exhausted"
          : local.doCatalogo > 0 && local.doCache > 0
            ? "catalog_cache"
            : local.doCatalogo > 0
              ? "catalog"
              : "cache";
    params.log(
      local.items.length > 0
        ? `Economia: ${local.items.length} lead(s) inéditos recuperados da base própria/cache; nenhuma cobrança foi iniciada.`
        : "Economia: esta busca já foi esgotada para sua conta; nenhum lead repetido será devolvido e nenhuma cobrança foi iniciada.",
    );
    await registrarEvento({
      catalogReturned: local.doCatalogo,
      cacheReturned: local.doCache,
      providerReturned: 0,
      returnedCandidates: local.items.length,
      duplicatesAvoided: local.duplicadosDescartados,
      paidRunStarted: false,
      reason,
    });
    return local.items;
  }

  const ineditosCache = contarIneditos(existingPlaces, seenComCatalogo);
  const desejadoDoCacheOuProvider = Math.max(0, params.limite - local.doCatalogo);
  const existingPlan = planejarCacheIncrementalApify({
    solicitado: desejadoDoCacheOuProvider,
    itensCache: existingPlaces.length,
    ineditosCache: existingFresh ? ineditosCache : 0,
    cacheEsgotado: false,
    buscaPagaRecente: false,
  });

  const conhecidosNoCache = Math.max(0, existingPlaces.length - ineditosCache);
  const existingIdentities = new Set(existingPlaces.map(leadCatalogIdentity));
  const catalogoForaDoCache = catalogPlaces.reduce(
    (total, place) => total + (existingIdentities.has(leadCatalogIdentity(place)) ? 0 : 1),
    0,
  );
  const baseTargetDepth = existingFresh
    ? existingPlan.profundidadeColeta
    : conhecidosNoCache + desejadoDoCacheOuProvider;
  const targetDepth = Math.min(APIFY_MAX_INCREMENTAL_DEPTH, baseTargetDepth + catalogoForaDoCache);
  if (targetDepth <= 0) return [];
  if (local.items.length > 0 || existingPlaces.length > 0) {
    params.log(
      `Economia: a base entregou ${local.items.length}; ampliando a coleta de ${existingPlaces.length} para ${targetDepth} somente para tentar completar os ${basePlan.faltantes} faltantes.`,
    );
  }

  const finalizarComCache = async (places: readonly RawPlace[], exhausted: boolean) => {
    const filteredCache = selecionarIneditos(places, params.limite, seenComCatalogo);
    const combined = combinarFontesIneditas({
      solicitado: params.limite,
      catalogo: catalogPlaces,
      cache: filteredCache,
      identidade: leadCatalogIdentity,
    });
    await registrarEvento({
      catalogReturned: combined.doCatalogo,
      cacheReturned: combined.doCache,
      providerReturned: 0,
      returnedCandidates: combined.items.length,
      duplicatesAvoided: combined.duplicadosDescartados,
      paidRunStarted: false,
      reason: exhausted
        ? "source_exhausted"
        : combined.doCatalogo > 0 && combined.doCache > 0
          ? "catalog_cache"
          : combined.doCatalogo > 0
            ? "catalog"
            : "cache",
    });
    return combined.items;
  };

  let claim = await reivindicarCache(admin, queryKey, targetDepth);
  if (claim.decision === "cache") {
    params.log("Apify: resultado compartilhado encontrado; nenhuma nova cobrança foi iniciada.");
    return await finalizarComCache(parsePlaces(claim.items), Boolean(claim.exhausted));
  }
  if (claim.decision === "wait") {
    const waited = await aguardarCache(admin, queryKey, targetDepth, params.log);
    if (waited) return await finalizarComCache(waited, waited.length < targetDepth);
    claim = await reivindicarCache(admin, queryKey, targetDepth);
    if (claim.decision === "cache") {
      return await finalizarComCache(parsePlaces(claim.items), Boolean(claim.exhausted));
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
          requested_new_leads: basePlan.faltantes,
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
    try {
      await guardarCatalogoCompartilhado(admin, queryKey, params, places);
    } catch (error) {
      params.log(
        `Economia: aviso — o cache exato foi salvo, mas o catálogo semelhante não foi atualizado: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const seenComLocal = incluirNoHistorico(seen, local.items);
    const providerPlaces = selecionarIneditos(
      places,
      Math.max(0, params.limite - local.items.length),
      seenComLocal,
    );
    const result = [...local.items, ...providerPlaces];
    await registrarEvento({
      catalogReturned: local.doCatalogo,
      cacheReturned: local.doCache,
      providerReturned: providerPlaces.length,
      returnedCandidates: result.length,
      duplicatesAvoided:
        local.duplicadosDescartados + Math.max(0, places.length - providerPlaces.length),
      paidRunStarted: true,
      reason: "paid_expansion",
    });
    return result;
  } catch (error) {
    await liberarReserva(admin, queryKey, params.log);
    throw error;
  }
}
