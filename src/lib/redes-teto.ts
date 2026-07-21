// TETO DE GASTO da coleta em redes sociais (Apify). Lógica PURA — testada sem gastar nada.
//
// A regra do projeto: coleta paga NÃO liga sem teto. São duas camadas, iguais às da automação:
//   1) ANTES de rodar  → o teto do mês já estourou? quantos itens cabem no teto da rodada?
//   2) DEPOIS de rodar → o custo REAL do run (lido da Apify) é somado e registrado; se estourou,
//      a próxima rodada é bloqueada. Nunca "descobrimos" o gasto no fim do mês.

export const TETO_RODADA_USD = 5;
export const TETO_MES_USD = 50;

/** Custo médio por item coletado, usado só para PLANEJAR quantos itens cabem no teto.
 *  O gasto que vale é sempre o real, lido do run. Conservador de propósito. */
export const CUSTO_ITEM_ESTIMADO_USD = 0.01;

export type PlanoColeta = {
  podeRodar: boolean;
  /** quantos itens no máximo pedir à Apify para não furar o teto da rodada */
  maxItens: number;
  motivo?: string;
  restanteMesUsd: number;
};

export function planejarColeta(
  gastoMesUsd: number,
  limitePedido: number,
  tetoRodada: number = TETO_RODADA_USD,
  tetoMes: number = TETO_MES_USD,
  custoItem: number = CUSTO_ITEM_ESTIMADO_USD,
): PlanoColeta {
  const restanteMesUsd = Math.max(0, tetoMes - gastoMesUsd);
  if (restanteMesUsd <= 0)
    return {
      podeRodar: false,
      maxItens: 0,
      motivo: `teto mensal de US$ ${tetoMes} atingido (gasto: US$ ${gastoMesUsd.toFixed(2)})`,
      restanteMesUsd,
    };

  // a rodada não pode gastar mais que o teto dela NEM mais que o que sobrou no mês
  const orcamentoRodada = Math.min(tetoRodada, restanteMesUsd);
  const cabeNoOrcamento = Math.floor(orcamentoRodada / custoItem);
  const maxItens = Math.max(0, Math.min(limitePedido, cabeNoOrcamento));

  if (maxItens <= 0)
    return {
      podeRodar: false,
      maxItens: 0,
      motivo: `o que sobrou do teto (US$ ${orcamentoRodada.toFixed(2)}) não cobre nem 1 item`,
      restanteMesUsd,
    };

  return { podeRodar: true, maxItens, restanteMesUsd };
}

/** O run já custou mais do que podia? (checado com o custo REAL, depois de rodar) */
export function estourouColeta(
  custoRunUsd: number,
  gastoMesAntes: number,
  tetoRodada: number = TETO_RODADA_USD,
  tetoMes: number = TETO_MES_USD,
): boolean {
  return custoRunUsd >= tetoRodada || gastoMesAntes + custoRunUsd >= tetoMes;
}

// O mês de referência é o MESMO conceito da automação — reusa `mesRefAtual` de
// automacao-teto.ts em vez de manter duas versões que podem divergir.
