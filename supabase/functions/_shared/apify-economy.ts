export type ApifySearchIdentity = {
  nicho: string;
  cidade: string;
  uf: string;
  lat: number | null;
  lng: number | null;
  raioKm: number | null;
  usarAreaMapa?: boolean;
};

export type ApifyCollectionPlan = {
  limiteEfetivo: number;
  limiteApify: number;
  servidoDoCache: boolean;
};

export type ApifyIncrementalCachePlan = {
  servidoDoCache: boolean;
  profundidadeColeta: number;
};

export const APIFY_MAX_INCREMENTAL_DEPTH = 1_000;

export function calcularAlvoCandidatosApify(solicitado: number, alvo: number): number {
  const pedido = Math.max(0, Math.floor(solicitado));
  const reserva = Math.max(0, Math.ceil(alvo));
  return Math.min(APIFY_MAX_INCREMENTAL_DEPTH, Math.max(pedido, reserva));
}

/**
 * Prepara candidatos em paralelo, mas confirma cada resultado em ordem e para
 * exatamente na meta. Assim o enriquecimento lento não serializa a busca e a
 * persistência nunca ultrapassa a quantidade contratada pelo cliente.
 */
export async function processarCandidatosEmLotes<T, P>({
  candidatos,
  tamanhoLote,
  meta,
  preparar,
  consumir,
}: {
  candidatos: readonly T[];
  tamanhoLote: number;
  meta: number;
  preparar: (candidato: T) => Promise<P>;
  consumir: (preparado: P) => Promise<boolean>;
}): Promise<number> {
  const limite = Math.max(0, Math.floor(meta));
  if (limite === 0) return 0;

  const tamanho = Math.max(1, Math.floor(tamanhoLote));
  let aceitos = 0;
  for (let inicio = 0; inicio < candidatos.length && aceitos < limite; inicio += tamanho) {
    const lote = candidatos.slice(inicio, inicio + tamanho);
    const preparados = await Promise.all(lote.map(preparar));
    for (const preparado of preparados) {
      if (aceitos >= limite) break;
      if (await consumir(preparado)) aceitos += 1;
    }
  }
  return aceitos;
}

function normalizarTexto(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizarCoordenada(value: number | null): string {
  return value == null || !Number.isFinite(value) ? "" : value.toFixed(4);
}

export function criarChaveCacheApify(identity: ApifySearchIdentity): string {
  const area = identity.usarAreaMapa
    ? [
        "mapa",
        normalizarCoordenada(identity.lat),
        normalizarCoordenada(identity.lng),
        identity.raioKm == null ? "10.0" : identity.raioKm.toFixed(1),
      ]
    : ["cidade", normalizarTexto(identity.cidade), normalizarTexto(identity.uf)];

  return ["apify-google-maps-v1", normalizarTexto(identity.nicho), ...area].join("|");
}

export function selecionarIneditosApify<T>(
  items: readonly T[],
  solicitado: number,
  jaConhecido: (item: T) => boolean,
): T[] {
  const limite = Math.max(0, Math.floor(solicitado));
  if (limite === 0) return [];
  const ineditos: T[] = [];
  for (const item of items) {
    if (jaConhecido(item)) continue;
    ineditos.push(item);
    if (ineditos.length >= limite) break;
  }
  return ineditos;
}

/**
 * Decide entre servir a próxima fatia inédita do estoque compartilhado e ampliar
 * a profundidade paga. A ampliação inclui os itens já conhecidos porque o Actor
 * não oferece offset: para obter N novos depois de K conhecidos, pedimos K + N.
 */
export function planejarCacheIncrementalApify({
  solicitado,
  itensCache,
  ineditosCache,
  cacheEsgotado,
  buscaPagaRecente = false,
  profundidadeMaxima = APIFY_MAX_INCREMENTAL_DEPTH,
}: {
  solicitado: number;
  itensCache: number;
  ineditosCache: number;
  cacheEsgotado: boolean;
  buscaPagaRecente?: boolean;
  profundidadeMaxima?: number;
}): ApifyIncrementalCachePlan {
  const pedido = Math.max(0, Math.floor(solicitado));
  const total = Math.max(0, Math.floor(itensCache));
  const ineditos = Math.min(total, Math.max(0, Math.floor(ineditosCache)));
  if (pedido === 0 || ineditos >= pedido || cacheEsgotado || buscaPagaRecente) {
    return { servidoDoCache: true, profundidadeColeta: 0 };
  }

  const conhecidosNoCache = total - ineditos;
  const maximo = Math.max(0, Math.floor(profundidadeMaxima));
  const profundidadeColeta = Math.min(maximo, Math.max(total + 1, conhecidosNoCache + pedido));
  if (profundidadeColeta <= total) {
    return { servidoDoCache: true, profundidadeColeta: 0 };
  }
  return { servidoDoCache: false, profundidadeColeta };
}

export function planejarColetaApify({
  solicitado,
  restantePlano,
  profundidadeCache,
  cacheEsgotado = false,
}: {
  solicitado: number;
  restantePlano: number | null;
  profundidadeCache: number;
  cacheEsgotado?: boolean;
}): ApifyCollectionPlan {
  const pedido = Math.max(0, Math.floor(solicitado));
  const restante = restantePlano == null ? pedido : Math.max(0, Math.floor(restantePlano));
  const limiteEfetivo = Math.min(pedido, restante);
  const servidoDoCache =
    cacheEsgotado || Math.max(0, Math.floor(profundidadeCache)) >= limiteEfetivo;

  return {
    limiteEfetivo,
    limiteApify: servidoDoCache ? 0 : limiteEfetivo,
    servidoDoCache,
  };
}
