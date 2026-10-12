export interface AgentItem {
  id: string;
  name: string;
  description: string;
  iconName: "Megaphone" | "PenSquare" | "Users" | "ScanSearch";
  colorTheme: "orange" | "purple" | "blue" | "teal";
  status: "ativo" | "beta" | "pausado";
  checklist: string[];
  actionLabel: string;
}

export interface StrategyItem {
  id: string;
  title: string;
  productName: string;
  categoryTag: string;
  categoryColor: "purple" | "pink" | "blue" | "indigo";
  timeAgo: string;
  imageUrl: string;
  recommendedActions: number;
  impactPotential: "Alto" | "Médio" | "Baixo";
}

export interface StrategicKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  color: "orange" | "purple" | "blue" | "teal" | "amber" | "rose";
  bars: number[];
}

export interface StrategicInsightItem {
  id: string;
  badgeLabel: string;
  badgeColor: "green" | "blue" | "purple";
  description: string;
}

// 6 Indicadores Estratégicos Aprovados na Tela 2
export const AGENTES_KPIS: StrategicKpiItem[] = [
  {
    id: "produtos_analisados",
    label: "Produtos analisados",
    value: "6",
    change: "200%",
    color: "orange",
    bars: [25, 40, 55, 65, 75, 85, 95, 100],
  },
  {
    id: "estrategias_geradas",
    label: "Estratégias geradas",
    value: "12",
    change: "50%",
    color: "purple",
    bars: [30, 45, 50, 60, 70, 80, 90, 100],
  },
  {
    id: "oportunidades_encontradas",
    label: "Oportunidades encontradas",
    value: "28",
    change: "75%",
    color: "blue",
    bars: [35, 45, 60, 70, 80, 85, 95, 100],
  },
  {
    id: "concorrentes_analisados",
    label: "Concorrentes analisados",
    value: "14",
    change: "40%",
    color: "teal",
    bars: [25, 35, 50, 65, 75, 80, 90, 95],
  },
  {
    id: "canais_recomendados",
    label: "Canais recomendados",
    value: "5",
    change: "25%",
    color: "amber",
    bars: [30, 40, 55, 60, 70, 75, 85, 100],
  },
  {
    id: "potencial_receita",
    label: "Potencial de receita",
    value: "R$ 128.500",
    change: "62%",
    color: "rose",
    bars: [35, 45, 55, 70, 80, 85, 95, 100],
  },
];

// 4 Agentes de IA Aprovados na Tela 2
export const AGENTES_ITEMS: AgentItem[] = [
  {
    id: "agente-marketing",
    name: "Agente de Marketing",
    description: "Cria estratégias completas de marketing para seus produtos e serviços.",
    iconName: "Megaphone",
    colorTheme: "orange",
    status: "ativo",
    checklist: [
      "Análise de público-alvo",
      "Estratégias de canais",
      "Sugestões de campanhas",
      "Otimização de conteúdo",
    ],
    actionLabel: "Configurar",
  },
  {
    id: "agente-conteudo",
    name: "Agente de Conteúdo",
    description: "Gera textos, imagens e conteúdos para redes sociais e campanhas.",
    iconName: "PenSquare",
    colorTheme: "purple",
    status: "ativo",
    checklist: [
      "Criação de copies",
      "Geração de imagens",
      "Conteúdo para redes sociais",
      "Variações de anúncios",
    ],
    actionLabel: "Configurar",
  },
  {
    id: "agente-publico",
    name: "Agente de Público",
    description: "Analisa e identifica o público ideal para cada produto ou serviço.",
    iconName: "Users",
    colorTheme: "blue",
    status: "ativo",
    checklist: [
      "Segmentação de audiência",
      "Análise de comportamento",
      "Identificação de nichos",
      "Personas detalhadas",
    ],
    actionLabel: "Configurar",
  },
  {
    id: "agente-concorrencia",
    name: "Agente de Concorrência",
    description: "Analisa concorrentes e identifica oportunidades de mercado.",
    iconName: "ScanSearch",
    colorTheme: "teal",
    status: "beta",
    checklist: [
      "Análise de concorrentes",
      "Comparativo de ofertas",
      "Oportunidades de diferenciação",
      "Posicionamento estratégico",
    ],
    actionLabel: "Ativar agente",
  },
];

// 4 Estratégias Recentes Aprovadas na Tela 2
export const RECENT_STRATEGIES: StrategyItem[] = [
  {
    id: "strat-1",
    title: "Estratégia de Lançamento",
    productName: "Curso de Marketing Digital",
    categoryTag: "Marketing Digital",
    categoryColor: "purple",
    timeAgo: "Há 2 horas",
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80",
    recommendedActions: 12,
    impactPotential: "Alto",
  },
  {
    id: "strat-2",
    title: "Crescimento no Instagram",
    productName: "Consultoria Empresarial",
    categoryTag: "Redes Sociais",
    categoryColor: "pink",
    timeAgo: "Há 1 dia",
    imageUrl:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80",
    recommendedActions: 8,
    impactPotential: "Médio",
  },
  {
    id: "strat-3",
    title: "Campanha de Aquisição",
    productName: "Plano Fitness Premium",
    categoryTag: "Google Ads",
    categoryColor: "blue",
    timeAgo: "Há 2 dias",
    imageUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
    recommendedActions: 10,
    impactPotential: "Alto",
  },
  {
    id: "strat-4",
    title: "Diferenciação de Mercado",
    productName: "Hospedagem Boutique",
    categoryTag: "Posicionamento",
    categoryColor: "indigo",
    timeAgo: "Há 3 dias",
    imageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80",
    recommendedActions: 6,
    impactPotential: "Médio",
  },
];

// 3 Insights Estratégicos Aprovados na Tela 2
export const STRATEGIC_INSIGHTS: StrategicInsightItem[] = [
  {
    id: "ins-strat-1",
    badgeLabel: "Oportunidade de mercado",
    badgeColor: "green",
    description:
      "Seu produto 'Experiência Gastronômica' tem grande potencial no Instagram.",
  },
  {
    id: "ins-strat-2",
    badgeLabel: "Canal recomendado",
    badgeColor: "blue",
    description:
      "Considere investir em Google Ads para o produto 'Plano Fitness'.",
  },
  {
    id: "ins-strat-3",
    badgeLabel: "Diferencial competitivo",
    badgeColor: "purple",
    description:
      "Seu serviço de 'Consultoria Empresarial' pode se destacar com foco em resultados rápidos.",
  },
];
