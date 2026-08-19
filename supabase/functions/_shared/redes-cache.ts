import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const CACHE_TTL_HOURS = 7 * 24;
const CACHE_WAIT_MS = 120_000;
const CACHE_POLL_MS = 2_000;

type CacheRow = {
  items: unknown;
  searched_depth: number;
  refreshed_at: string | null;
  refreshing_until: string | null;
};

type Claim = {
  decision: "cache" | "refresh" | "wait";
  items?: unknown;
};

export type EstadoCacheRedes<T> = { cacheHit: true; items: T[] } | { cacheHit: false; items: [] };

function itensDoCache<T>(valor: unknown, limite: number): T[] {
  return Array.isArray(valor) ? (valor as T[]).slice(0, limite) : [];
}

function cacheFresco(row: CacheRow | null, limite: number): boolean {
  if (!row?.refreshed_at || row.searched_depth < limite) return false;
  const atualizado = new Date(row.refreshed_at).getTime();
  return Number.isFinite(atualizado) && atualizado >= Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000;
}

async function lerCache(admin: SupabaseClient, chave: string): Promise<CacheRow | null> {
  const { data, error } = await admin
    .from("apify_search_cache")
    .select("items, searched_depth, refreshed_at, refreshing_until")
    .eq("query_key", chave)
    .maybeSingle();
  if (error) throw new Error(`Cache social indisponível: ${error.message}`);
  return data as CacheRow | null;
}

async function reivindicar(admin: SupabaseClient, chave: string, limite: number): Promise<Claim> {
  const { data, error } = await admin.rpc("claim_apify_search_cache_v2", {
    p_query_key: chave,
    p_target_depth: limite,
    p_ttl_hours: CACHE_TTL_HOURS,
  });
  if (error) throw new Error(`Falha ao reservar cache social: ${error.message}`);
  const claim = data as Claim | null;
  if (!claim || !["cache", "refresh", "wait"].includes(claim.decision)) {
    throw new Error("Resposta inválida ao reservar cache social");
  }
  return claim;
}

export async function liberarCacheRedes(
  admin: SupabaseClient,
  chave: string,
  log: (mensagem: string) => void,
): Promise<void> {
  const { error } = await admin.rpc("release_apify_search_cache", { p_query_key: chave });
  if (error) log(`Cache social: falha ao liberar reserva (${error.message}).`);
}

async function aguardar(
  admin: SupabaseClient,
  chave: string,
  limite: number,
): Promise<unknown[] | null> {
  const deadline = Date.now() + CACHE_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, CACHE_POLL_MS));
    const row = await lerCache(admin, chave);
    if (cacheFresco(row, limite)) return itensDoCache<unknown>(row?.items, limite);
    const reservaExpirou =
      !row?.refreshing_until || new Date(row.refreshing_until).getTime() <= Date.now();
    if (reservaExpirou) return null;
  }
  throw new Error(
    "Uma busca social idêntica ainda está processando. Tente novamente em instantes.",
  );
}

/** Entrega cache recente ou reserva atomicamente o direito de fazer o único run pago. */
export async function prepararCacheRedes<T>(
  admin: SupabaseClient,
  chave: string,
  limite: number,
): Promise<EstadoCacheRedes<T>> {
  const existente = await lerCache(admin, chave);
  if (cacheFresco(existente, limite)) {
    return { cacheHit: true, items: itensDoCache<T>(existente?.items, limite) };
  }

  let claim = await reivindicar(admin, chave, limite);
  if (claim.decision === "cache") {
    return { cacheHit: true, items: itensDoCache<T>(claim.items, limite) };
  }
  if (claim.decision === "wait") {
    const concluido = await aguardar(admin, chave, limite);
    if (concluido) return { cacheHit: true, items: itensDoCache<T>(concluido, limite) };
    claim = await reivindicar(admin, chave, limite);
    if (claim.decision === "cache") {
      return { cacheHit: true, items: itensDoCache<T>(claim.items, limite) };
    }
    if (claim.decision === "wait") {
      throw new Error("Não foi possível assumir a busca social após a reserva anterior.");
    }
  }
  return { cacheHit: false, items: [] };
}

export async function salvarCacheRedes(
  admin: SupabaseClient,
  chave: string,
  limite: number,
  items: unknown[],
  log: (mensagem: string) => void,
): Promise<void> {
  const { error } = await admin.rpc("store_apify_search_cache", {
    p_query_key: chave,
    p_searched_depth: limite,
    p_items: items,
  });
  if (!error) return;
  log(`Cache social: resultado entregue, mas não foi salvo (${error.message}).`);
  await liberarCacheRedes(admin, chave, log);
}
