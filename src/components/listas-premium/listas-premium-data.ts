import type { Database } from "@/integrations/supabase/types";
import type { LeadListComStats } from "@/lib/lists-api";
import type { Lead } from "@/lib/leads-api";
import type { Campanha } from "@/types";

export type CampanhaComCanal = Campanha & {
  canal?: string;
};

export type LeadListRow = Database["public"]["Tables"]["lead_lists"]["Row"];

export type ListStatus = "ativa" | "em_estrategia" | "pausada" | "rascunho";

export interface LeadListWithFullStats extends LeadListComStats {
  com_contato_count: number;
  taxa_contato: number;
  status: ListStatus;
  thumbnail_url: string;
  has_strategy: boolean;
  campanhas_count: number;
  last_activity_text: string;
}

export interface StrategyConfig {
  oferta_principal: {
    titulo: string;
    descricao: string;
  };
  publico_contexto: {
    titulo: string;
    descricao: string;
  };
  abordagem: string[];
  canais_sugeridos: {
    email: boolean;
    whatsapp: boolean;
    instagram: boolean;
    linkedin: boolean;
  };
  sequencia: Array<{
    ordem: number;
    etapa: string;
    prazo: string;
    objetivo: string;
  }>;
  rascunho_mensagens: {
    email: {
      assunto: string;
      corpo: string;
    };
    whatsapp: string;
    instagram: string;
  };
}

export interface OfferConfig {
  produto_servico: string;
  nome_oferta: string;
  descricao: string;
  publico_alvo: string;
  beneficios: string;
  proposta_valor: string;
  preco?: string;
  objetivo: string;
}

export interface QuickResultsMetrics {
  leads_contatados: number;
  taxa_contatados_delta: string;
  respostas: number;
  taxa_respostas_delta: string;
  reunioes_agendadas: number;
  taxa_reunioes_delta: string;
  clientes_fechados: number;
  taxa_clientes_delta: string;
}

/**
 * Mapeamento temático inteligente de miniaturas por nicho/categoria com imagens profissionais em alta definição.
 * Mantém coerência com as categorias da referência aprovada.
 */
export function getNicheThumbnail(niche: string = "", name: string = ""): string {
  const text = `${niche} ${name}`.toLowerCase();

  if (text.includes("odonto") || text.includes("dent") || text.includes("saúde") || text.includes("médic") || text.includes("clínica")) {
    return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop&q=80"; // Consultório odontológico / clínico moderno
  }
  if (text.includes("restauran") || text.includes("comida") || text.includes("gastronom") || text.includes("aliment") || text.includes("bar") || text.includes("café")) {
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80"; // Restaurante moderno e elegante
  }
  if (text.includes("imob") || text.includes("corretor") || text.includes("imóve") || text.includes("construt")) {
    return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80"; // Edifício corporativo imobiliário moderno
  }
  if (text.includes("academ") || text.includes("fitness") || text.includes("treino") || text.includes("esport")) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80"; // Academia equipada
  }
  if (text.includes("estétic") || text.includes("belez") || text.includes("salão") || text.includes("barbear")) {
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=80"; // Clínica de estética e bem-estar
  }
  if (text.includes("contab") || text.includes("advoc") || text.includes("jurídic") || text.includes("b2b") || text.includes("escritór")) {
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop&q=80"; // Escritório corporativo / contábil
  }
  if (text.includes("agro") || text.includes("fazenda") || text.includes("rural") || text.includes("pecuár")) {
    return "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&auto=format&fit=crop&q=80"; // Agropecuária moderna
  }
  if (text.includes("mecan") || text.includes("oficina") || text.includes("auto") || text.includes("carro")) {
    return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80"; // Oficina automotiva
  }
  if (text.includes("farmác") || text.includes("manipula")) {
    return "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80"; // Farmácia de manipulação
  }

  // Default moderno para listas corporativas
  return "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&auto=format&fit=crop&q=80";
}

/**
 * Derivação do status real da lista com base nas regras operacionais do sistema.
 */
export function deriveListStatus(
  list: LeadListComStats,
  campanhasCount: number,
): ListStatus {
  if (campanhasCount > 0) {
    return "ativa";
  }
  if (list.follow_up_ativo || list.gold_count > 0) {
    return "em_estrategia";
  }
  if (list.leads_atuais === 0) {
    return "rascunho";
  }
  return "ativa";
}

/**
 * Formatação humanizada de data/tempo relativo
 */
export function formatTimeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 5) return "agora há pouco";
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    if (diffHours === 1) return "há 1 hora";
    if (diffHours < 24) return `há ${diffHours} horas`;
    if (diffDays === 1) return "há 1 dia";
    return `há ${diffDays} dias`;
  } catch {
    return "recentemente";
  }
}

/**
 * Deriva uma proposta de estratégia comercial de abordagem baseada no nicho e região reais da lista.
 * Utilizado para preencher o rascunho de trabalho no painel de detalhes.
 */
export function deriveDefaultStrategy(
  niche: string,
  city: string,
  uf?: string | null,
): StrategyConfig {
  const localizacao = [city.trim(), uf?.trim()].filter(Boolean).join(" - ") || "sua região";
  const nichoFormatado = niche.trim() || "Empresas e Negócios";

  return {
    oferta_principal: {
      titulo: `Avaliação Comercial & Diagnóstico — ${nichoFormatado}`,
      descricao: `Diagnóstico consultivo inicial e plano de aceleração sob medida para empresas de ${nichoFormatado.toLowerCase()} em ${localizacao}.`,
    },
    publico_contexto: {
      titulo: `${nichoFormatado} em ${localizacao}`,
      descricao: `Empresas ativas e qualificadas, localizadas em ${localizacao}, com foco em expansão de clientes e atendimento de alto padrão.`,
    },
    abordagem: [
      "Tom consultivo e profissional",
      "Foco em dor, eficiência e solução",
      "Apresentação de prova social e resultados",
      "Linguagem simples, objetiva e sem rodeios",
    ],
    canais_sugeridos: {
      email: true,
      whatsapp: true,
      instagram: true,
      linkedin: false,
    },
    sequencia: [
      {
        ordem: 1,
        etapa: "Apresentação (Dia 1)",
        prazo: "Dia 1",
        objetivo: "Apresentar a proposta de valor e despertar interesse imediato.",
      },
      {
        ordem: 2,
        etapa: "Follow-up (Dia 3)",
        prazo: "Dia 3",
        objetivo: "Reforçar benefícios comprovados e apresentar cases do mesmo segmento.",
      },
      {
        ordem: 3,
        etapa: "CTA Final (Dia 7)",
        prazo: "Dia 7",
        objetivo: "Convidar para uma breve conversa ou demonstração sem compromisso.",
      },
    ],
    rascunho_mensagens: {
      whatsapp: `Olá, {{nome}}!\n\nVi que a {{empresa}} é referência no segmento de ${nichoFormatado.toLowerCase()} em ${localizacao}. Podemos agendar uma conversa rápida de 10 minutos para apresentar uma estratégia prática que já ajudou empresas similares a aumentarem sua captação de clientes?\n\nFico no aguardo! 😊`,
      email: {
        assunto: `Oportunidade de crescimento para {{empresa}} em ${localizacao}`,
        corpo: `Olá, {{nome}},\n\nAcompanhamos o trabalho da {{empresa}} em ${localizacao} e identificamos um potencial relevante para expansão comercial.\n\nPreparamos uma breve análise diagnóstica focada no seu mercado de atuação. Teria disponibilidade nesta semana para alinharmos em 10 minutos?\n\nAtenciosamente,\nEquipe Comercial`,
      },
      instagram: `Olá, equipe da {{empresa}}! Acompanho o perfil de vocês aqui em ${localizacao} e achei o posicionamento excelente. Preparei um diagnóstico rápido sobre oportunidades comerciais no setor de ${nichoFormatado.toLowerCase()}. Posso te enviar por aqui?`,
    },
  };
}

/**
 * Deriva estrutura de oferta planejada
 */
export function deriveDefaultOffer(niche: string, city: string): OfferConfig {
  const nichoFormatado = niche.trim() || "Serviços Especializados";
  return {
    produto_servico: `Soluções Comerciais para ${nichoFormatado}`,
    nome_oferta: `Programa de Aquisição de Clientes — ${city || "Regional"}`,
    descricao: `Estruturação de funil comercial, qualificação de leads e automação de abordagem para empresas de ${nichoFormatado}.`,
    publico_alvo: `Diretores, sócios e gestores comerciais de ${nichoFormatado}.`,
    beneficios: `Mais reuniões qualificadas, redução no ciclo de vendas e prospecção consistente.`,
    proposta_valor: `Geração previsível de novas oportunidades sem depender apenas de indicações.`,
    preco: "Sob consulta",
    objetivo: "Acelerar conversão em vendas e abertura de novas contas.",
  };
}

/**
 * Helper para exportação CSV de leads de uma lista
 */
export function exportLeadsCsv(leads: Lead[], listName: string): void {
  if (!leads.length) return;
  const headers = [
    "Score",
    "Empresa",
    "Categoria",
    "Cidade",
    "UF",
    "Telefone",
    "WhatsApp",
    "E-mail",
    "Site",
    "Instagram",
    "Status",
  ];
  const rows = leads.map((l) => [
    l.score ?? 0,
    `"${(l.business_name || "").replace(/"/g, '""')}"`,
    `"${(l.category || "").replace(/"/g, '""')}"`,
    `"${(l.city || "").replace(/"/g, '""')}"`,
    `"${(l.state || "").replace(/"/g, '""')}"`,
    `"${(l.phone || "").replace(/"/g, '""')}"`,
    `"${(l.whatsapp || "").replace(/"/g, '""')}"`,
    `"${(l.email || "").replace(/"/g, '""')}"`,
    `"${(l.website || "").replace(/"/g, '""')}"`,
    `"${(l.instagram_url || "").replace(/"/g, '""')}"`,
    `"${(l.status || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${listName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
