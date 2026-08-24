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
