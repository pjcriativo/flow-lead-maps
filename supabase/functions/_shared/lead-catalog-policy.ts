export type BaseFirstReason =
  "estoque_suficiente" | "complemento_pago" | "busca_recente" | "fonte_esgotada";

export type BaseFirstPlan = {
  retornoLocal: number;
  faltantes: number;
  podeIniciarPagamento: boolean;
  motivo: BaseFirstReason;
};

export function combinarFontesIneditas<T>({
  solicitado,
  catalogo,
  cache,
  identidade,
}: {
  solicitado: number;
  catalogo: readonly T[];
  cache: readonly T[];
  identidade: (item: T) => string;
}): {
  items: T[];
  doCatalogo: number;
  doCache: number;
  duplicadosDescartados: number;
} {
  const limite = Math.max(0, Math.floor(solicitado));
  const ids = new Set<string>();
  const items: T[] = [];
  let doCatalogo = 0;
  let doCache = 0;
  let duplicadosDescartados = 0;

  const adicionar = (fonte: readonly T[], tipo: "catalogo" | "cache") => {
    for (const item of fonte) {
      const id = identidade(item);
      if (ids.has(id)) {
        duplicadosDescartados += 1;
        continue;
      }
      ids.add(id);
      if (items.length >= limite) continue;
      items.push(item);
      if (tipo === "catalogo") doCatalogo += 1;
      else doCache += 1;
    }
  };

  adicionar(catalogo, "catalogo");
  adicionar(cache, "cache");
  return { items, doCatalogo, doCache, duplicadosDescartados };
}

export function planejarComplementoBaseFirst({
  solicitado,
  catalogoDisponivel,
  cacheDisponivel,
  pagamentoBloqueado,
  motivoBloqueio = "busca_recente",
}: {
  solicitado: number;
  catalogoDisponivel: number;
  cacheDisponivel: number;
  pagamentoBloqueado: boolean;
  motivoBloqueio?: Extract<BaseFirstReason, "busca_recente" | "fonte_esgotada">;
}): BaseFirstPlan {
  const pedido = Math.max(0, Math.floor(solicitado));
  const retornoLocal = Math.min(
    pedido,
    Math.max(0, Math.floor(catalogoDisponivel)) + Math.max(0, Math.floor(cacheDisponivel)),
  );
  const faltantes = Math.max(0, pedido - retornoLocal);
  if (faltantes === 0) {
    return {
      retornoLocal,
      faltantes,
      podeIniciarPagamento: false,
      motivo: "estoque_suficiente",
    };
  }
  if (pagamentoBloqueado) {
    return { retornoLocal, faltantes, podeIniciarPagamento: false, motivo: motivoBloqueio };
  }
  return { retornoLocal, faltantes, podeIniciarPagamento: true, motivo: "complemento_pago" };
}
