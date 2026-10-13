export type CanalPlataforma =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "whatsapp"
  | "outros";

export interface ResultsKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  color: "orange" | "purple" | "emerald" | "teal" | "blue" | "rose" | "amber";
  barColor: "orange" | "purple" | "blue" | "emerald" | "amber" | "rose";
  bars: number[];
}

export interface RevenueInvestmentPoint {
  date: string; // "01/08", "05/08", ...
  receita: number;
  investimento: number;
}

export interface ChannelLeadDistribution {
  channel: CanalPlataforma;
  name: string;
  leads: number;
  percentage: number;
  color: string;
}

export interface ChannelPerformanceItem {
  channel: CanalPlataforma;
  name: string;
  leads: number;
  color: string;
}

export interface ConversionFunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: string;
  color: string;
  bgColor: string;
}

export interface TopCampaignItem {
  id: string;
  title: string;
  category: string;
  platform: CanalPlataforma;
  investment: string;
  leads: number;
  sales: number;
  revenue: string;
  roi: string;
  status: "ativa" | "pausada";
  imageUrl: string;
}

export interface AssistantActionItem {
  id: string;
  title: string;
  iconName: string;
  description: string;
}

export interface ResultsInsightItem {
  id: string;
  badgeLabel: string;
  badgeColor: "emerald" | "blue" | "purple" | "orange";
  description: string;
  iconName: string;
}

// 6 Indicadores Superiores Aprovados na Tela 5
export const RESULTS_KPIS: ResultsKpiItem[] = [
  {
    id: "investimento_total",
    label: "Investimento total",
    value: "R$ 4.850",
    change: "18%",
    color: "orange",
    barColor: "orange",
    bars: [25, 40, 55, 65, 75, 85, 95, 100],
  },
  {
    id: "receita_atribuida",
    label: "Receita atribuída",
    value: "R$ 24.580",
    change: "62%",
    color: "purple",
    barColor: "rose", // Barras rosa/magenta conforme mockup
    bars: [30, 45, 50, 60, 70, 80, 90, 100],
  },
  {
    id: "roi_geral",
    label: "ROI geral",
    value: "406%",
    change: "32%",
    color: "emerald",
    barColor: "blue", // Barras azuis conforme mockup
    bars: [35, 45, 60, 70, 80, 85, 95, 100],
  },
  {
    id: "leads_gerados",
    label: "Leads gerados",
    value: "486",
    change: "42%",
    color: "blue",
    barColor: "purple", // Barras roxas conforme mockup
    bars: [25, 35, 50, 65, 75, 80, 90, 95],
  },
  {
    id: "custo_por_lead",
    label: "Custo por lead",
    value: "R$ 9,98",
    change: "28%",
    color: "teal",
    barColor: "emerald", // Barras esmeralda conforme mockup
    bars: [30, 40, 55, 60, 70, 75, 85, 100],
  },
  {
    id: "vendas_realizadas",
    label: "Vendas realizadas",
    value: "18",
    change: "38%",
    color: "amber",
    barColor: "amber", // Barras âmbar/laranja conforme mockup
    bars: [35, 45, 55, 70, 80, 85, 95, 100],
  },
];

// 7 Abas Subnav Internas
export const RESULTS_SUBTABS = [
  { id: "visao_geral", label: "Visão geral" },
  { id: "desempenho_canal", label: "Desempenho por canal" },
  { id: "campanhas", label: "Campanhas" },
  { id: "produtos_servicos", label: "Produtos e serviços" },
  { id: "conteudos", label: "Conteúdos" },
  { id: "conversoes", label: "Conversões" },
  { id: "relatorios", label: "Relatórios" },
];

// Dados da Série Temporal "Receita vs Investimento"
export const REVENUE_INVESTMENT_DATA: RevenueInvestmentPoint[] = [
  { date: "01/08", receita: 6200, investimento: 1800 },
  { date: "05/08", receita: 9400, investimento: 2400 },
  { date: "10/08", receita: 8800, investimento: 2100 },
  { date: "15/08", receita: 14500, investimento: 3100 },
  { date: "20/08", receita: 13200, investimento: 2900 },
  { date: "25/08", receita: 21400, investimento: 4200 },
  { date: "31/08", receita: 24580, investimento: 4850 },
];

// Distribuição de Leads por Canal (Donut)
export const LEADS_BY_CHANNEL: ChannelLeadDistribution[] = [
  { channel: "instagram", name: "Instagram", leads: 182, percentage: 37, color: "#E1306C" },
  { channel: "facebook", name: "Facebook", leads: 124, percentage: 26, color: "#1877F2" },
  { channel: "youtube", name: "YouTube", leads: 58, percentage: 12, color: "#FF0000" },
  { channel: "tiktok", name: "TikTok", leads: 46, percentage: 9, color: "#00F2FE" },
  { channel: "linkedin", name: "LinkedIn", leads: 38, percentage: 8, color: "#0A66C2" },
  { channel: "whatsapp", name: "WhatsApp", leads: 28, percentage: 6, color: "#25D366" },
  { channel: "outros", name: "Outros", leads: 10, percentage: 2, color: "#6B7280" },
];

// Desempenho por Canal (Barras Verticais)
export const CHANNEL_PERFORMANCE_DATA: ChannelPerformanceItem[] = [
  { channel: "instagram", name: "Instagram", leads: 182, color: "#E1306C" },
  { channel: "facebook", name: "Facebook", leads: 124, color: "#1877F2" },
  { channel: "youtube", name: "YouTube", leads: 58, color: "#FF0000" },
  { channel: "tiktok", name: "TikTok", leads: 46, color: "#374151" },
  { channel: "linkedin", name: "LinkedIn", leads: 38, color: "#0A66C2" },
  { channel: "whatsapp", name: "WhatsApp", leads: 28, color: "#25D366" },
  { channel: "outros", name: "Outros", leads: 10, color: "#4B5563" },
];

// Funil de Conversão por Etapa
export const CONVERSION_FUNNEL_STAGES: ConversionFunnelStage[] = [
  {
    id: "visitantes",
    name: "Visitantes",
    count: 8420,
    percentage: "100%",
    color: "#3B82F6",
    bgColor: "bg-blue-500",
  },
  {
    id: "leads",
    name: "Leads",
    count: 486,
    percentage: "5,8%",
    color: "#8B5CF6",
    bgColor: "bg-purple-500",
  },
  {
    id: "propostas",
    name: "Propostas",
    count: 124,
    percentage: "1,5%",
    color: "#F97316",
    bgColor: "bg-orange-500",
  },
  {
    id: "vendas",
    name: "Vendas",
    count: 18,
    percentage: "0,2%",
    color: "#10B981",
    bgColor: "bg-emerald-500",
  },
];

// Melhores Campanhas (Tabela Inferior)
export const TOP_CAMPAIGNS: TopCampaignItem[] = [
  {
    id: "camp-1",
    title: "Experiência Gastronômica",
    category: "Lançamento",
    platform: "instagram",
    investment: "R$ 890",
    leads: 120,
    sales: 6,
    revenue: "R$ 7.980",
    roi: "620%",
    status: "ativa",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "camp-2",
    title: "Plano Fitness Premium",
    category: "Mensalidade",
    platform: "facebook",
    investment: "R$ 720",
    leads: 98,
    sales: 4,
    revenue: "R$ 4.980",
    roi: "591%",
    status: "ativa",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "camp-3",
    title: "Consultoria Imobiliária",
    category: "Captação de Leads",
    platform: "linkedin",
    investment: "R$ 650",
    leads: 84,
    sales: 3,
    revenue: "R$ 3.750",
    roi: "477%",
    status: "ativa",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "camp-4",
    title: "Curso de Marketing Digital",
    category: "Mentoria",
    platform: "youtube",
    investment: "R$ 480",
    leads: 62,
    sales: 3,
    revenue: "R$ 2.980",
    roi: "521%",
    status: "pausada",
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80",
  },
];

// 6 Ações do Assistente de Resultados com IA
export const ASSISTANT_RESULTS_ACTIONS: AssistantActionItem[] = [
  {
    id: "act-desempenho-geral",
    title: "Analisar desempenho geral",
    iconName: "BarChart3",
    description: "Visão consolidada de investimento, receita e retorno sobre investimento.",
  },
  {
    id: "act-oportunidades",
    title: "Identificar oportunidades",
    iconName: "Lightbulb",
    description: "Canais e produtos com maior potencial inexplorado no período.",
  },
  {
    id: "act-ajustes-campanhas",
    title: "Sugerir ajustes nas campanhas",
    iconName: "Sliders",
    description: "Otimizações de orçamento e lances com base em ROI em tempo real.",
  },
  {
    id: "act-comparar-canais",
    title: "Comparar desempenho por canal",
    iconName: "Share2",
    description: "Benchmarking entre Meta, Google, LinkedIn, TikTok e WhatsApp.",
  },
  {
    id: "act-relatorio-personalizado",
    title: "Criar relatório personalizado",
    iconName: "FileText",
    description: "Geração de resumo executivo pronto para apresentação e stakeholders.",
  },
  {
    id: "act-prever-resultados",
    title: "Prever resultados futuros",
    iconName: "TrendingUp",
    description: "Projeções preditivas de receita para o próximo trimestre com base histórica.",
  },
];

// 4 Insights da IA
export const RESULTS_INSIGHTS: ResultsInsightItem[] = [
  {
    id: "ins-1",
    badgeLabel: "Alto potencial de crescimento",
    badgeColor: "emerald",
    description: "Seus conteúdos no Instagram estão gerando 40% mais leads que a média dos outros canais.",
    iconName: "TrendingUp",
  },
  {
    id: "ins-2",
    badgeLabel: "Reduzir custo por lead",
    badgeColor: "blue",
    description: "Você pode reduzir em até 28% o custo por lead ajustando seus horários de publicação.",
    iconName: "Target",
  },
  {
    id: "ins-3",
    badgeLabel: "Produto em destaque",
    badgeColor: "purple",
    description: 'O produto "Experiência Gastronômica" tem o melhor ROI do período (620%).',
    iconName: "Award",
  },
  {
    id: "ins-4",
    badgeLabel: "Expandir para novos canais",
    badgeColor: "orange",
    description: "Seus conteúdos têm potencial para gerar resultados no Pinterest e Google Ads.",
    iconName: "Compass",
  },
];
