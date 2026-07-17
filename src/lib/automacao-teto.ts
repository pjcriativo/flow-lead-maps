// TETO DE GASTO da automação — funções PURAS (dá pra provar sem rede). O robô gasta dinheiro
// sozinho (Apify + Claude por site); sem teto, um bug vira fatura. Aqui está a barreira.
//
// Duas camadas:
//  (1) planejarRodada: ANTES de gastar, calcula quantos leads a rodada PODE processar, limitado
//      pelo menor entre: leads/rodada, teto leads/rodada, teto leads/mês restante, teto US$/mês
//      restante e teto US$/rodada — tudo dividido pelo custo estimado por lead. Se der 0, PARA.
//  (2) estourou: DURANTE a rodada, o gasto REAL (Apify + custo de IA medido a cada site) é
//      checado a cada lead; se bater o teto da rodada ou do mês, o robô para na hora.

export const CUSTO_SITE_ESTIMADO_USD = 0.08; // estimativa conservadora p/ o PLANEJAMENTO (o gasto
// real de IA vem do redesign-site e é vigiado a cada site na camada 2).

export type ReceitaTeto = {
  leads_por_rodada: number;
  max_leads_rodada: number;
  max_leads_mes: number;
  max_usd_rodada: number;
  max_usd_mes: number;
  custo_lead_usd: number; // Apify por lead
  leads_mes: number; // já consumido no mês
  gasto_mes_usd: number; // já gasto no mês
};

export type PlanoRodada = {
  podeRodar: boolean;
  leadsPermitidos: number;
  motivo?: string;
  restanteLeadsMes: number;
  restanteUsdMes: number;
};

/** Camada 1 — quantos leads esta rodada pode processar sem estourar nenhum teto. */
export function planejarRodada(
  r: ReceitaTeto,
  custoSiteEstimadoUsd: number = CUSTO_SITE_ESTIMADO_USD,
): PlanoRodada {
  const restanteLeadsMes = Math.max(0, r.max_leads_mes - r.leads_mes);
  const restanteUsdMes = Math.max(0, r.max_usd_mes - r.gasto_mes_usd);
  if (restanteLeadsMes <= 0)
    return {
      podeRodar: false,
      leadsPermitidos: 0,
      motivo: "teto mensal de leads atingido",
      restanteLeadsMes,
      restanteUsdMes,
    };
  if (restanteUsdMes <= 0)
    return {
      podeRodar: false,
      leadsPermitidos: 0,
      motivo: "teto mensal de gasto atingido",
      restanteLeadsMes,
      restanteUsdMes,
    };
  // Conservador: assume que TODO lead buscado vira site (Apify + IA).
  const custoPorLead = r.custo_lead_usd + custoSiteEstimadoUsd;
  const porUsdMes = Math.floor(restanteUsdMes / custoPorLead);
  const porUsdRodada = Math.floor(r.max_usd_rodada / custoPorLead);
  const leadsPermitidos = Math.max(
    0,
    Math.min(r.leads_por_rodada, r.max_leads_rodada, restanteLeadsMes, porUsdMes, porUsdRodada),
  );
  if (leadsPermitidos <= 0)
    return {
      podeRodar: false,
      leadsPermitidos: 0,
      motivo: "teto de gasto por rodada não cobre nem 1 lead",
      restanteLeadsMes,
      restanteUsdMes,
    };
  return { podeRodar: true, leadsPermitidos, restanteLeadsMes, restanteUsdMes };
}

/** Camada 2 — o gasto REAL desta rodada (+ o que já gastou no mês) estourou algum teto? */
export function estourou(
  gastoRodadaUsd: number,
  gastoMesAntes: number,
  r: { max_usd_rodada: number; max_usd_mes: number },
): boolean {
  return gastoRodadaUsd >= r.max_usd_rodada || gastoMesAntes + gastoRodadaUsd >= r.max_usd_mes;
}

/** Referência do mês (UTC) — 'YYYY-MM'. */
export function mesRefAtual(agora: Date): string {
  return `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** O mês virou desde a última rodada? (zera o rastreio mensal) */
export function precisaZerarMes(mesRef: string | null | undefined, agora: Date): boolean {
  return !mesRef || mesRef !== mesRefAtual(agora);
}
