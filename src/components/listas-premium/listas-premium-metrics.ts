export interface ListMetricsSource {
  leads_atuais: number;
  campanhas_count: number;
}

export interface ListasPremiumKpis {
  totalListas: number;
  totalLeads: number;
  listasComEstrategia: number | null;
  campanhasVinculadas: number;
  aguardandoAcao: number;
}

export interface ListResultMetricsSource {
  leads_atuais: number;
  com_contato_count: number;
  campanhas_count: number;
}

export interface ListResultMetrics {
  totalLeads: number;
  leadsComContatoDisponivel: number;
  campanhasVinculadas: number;
  contatosRealizados: number | null;
  respostas: number | null;
  conversoes: number | null;
  clientesGanhos: number | null;
}

export function calculateListKpis(lists: ListMetricsSource[]): ListasPremiumKpis {
  return {
    totalListas: lists.length,
    totalLeads: lists.reduce((total, list) => total + list.leads_atuais, 0),
    // Ainda não existe uma entidade persistida de estratégia por lista.
    listasComEstrategia: null,
    campanhasVinculadas: lists.reduce((total, list) => total + list.campanhas_count, 0),
    // Definição objetiva: lista com leads disponíveis e nenhuma campanha vinculada.
    aguardandoAcao: lists.filter((list) => list.leads_atuais > 0 && list.campanhas_count === 0)
      .length,
  };
}

export function calculateListResultMetrics(list: ListResultMetricsSource): ListResultMetrics {
  return {
    totalLeads: list.leads_atuais,
    leadsComContatoDisponivel: list.com_contato_count,
    campanhasVinculadas: list.campanhas_count,
    // O schema atual não consolida estes eventos por lista de forma verificável.
    contatosRealizados: null,
    respostas: null,
    conversoes: null,
    clientesGanhos: null,
  };
}
