export interface ResultadosKpiItem {
  id: string;
  label: string;
  value: string;
  growth: string;
  context: string;
  accent: "orange" | "blue" | "emerald" | "amber" | "purple";
}

export interface ChartDataPoint {
  date: string;
  envios: number;
  aberturas: number;
  cliques: number;
  interessados: number;
}

export interface FunnelStageItem {
  id: string;
  label: string;
  value: number;
  percentage: string;
  color: string;
}

export interface ChannelItem {
  id: string;
  label: string;
  count: number;
  percentage: string;
  color: string;
}

export interface CampanhaPerformanceRow {
  id: string;
  name: string;
  period: string;
  channel: "email" | "whatsapp";
  leads: number;
  sites: number;
  enviados: number;
  aberturas?: { count: number; percentage: string };
  cliques?: { count: number; percentage: string };
  interessados: { count: number; percentage: string };
  status: "em_producao" | "concluida";
}

export interface ActivityItem {
  id: string;
  title: string;
  leadName: string;
  city: string;
  uf: string;
  time: string;
  type: "enviada" | "aberto" | "clique" | "interessado" | "publicado";
}

// 6 Cards Superiores de KPIs (100% fiéis à imagem aprovada)
export const RESULTADOS_KPIS: ResultadosKpiItem[] = [
  {
    id: "leads",
    label: "Leads da campanha",
    value: "250",
    growth: "↑ 12%",
    context: "Total da lista",
    accent: "orange",
  },
  {
    id: "sites",
    label: "Sites gerados",
    value: "180",
    growth: "↑ 8%",
    context: "72% da lista",
    accent: "blue",
  },
  {
    id: "propostas",
    label: "Propostas enviadas",
    value: "145",
    growth: "↑ 24%",
    context: "58% da lista",
    accent: "orange",
  },
  {
    id: "abertura",
    label: "Taxa de abertura",
    value: "62",
    growth: "↑ 18%",
    context: "42,8% dos envios",
    accent: "amber",
  },
  {
    id: "cliques",
    label: "Cliques no site",
    value: "28",
    growth: "↑ 27%",
    context: "19,3% dos abertos",
    accent: "amber",
  },
  {
    id: "interessados",
    label: "Leads interessados",
    value: "12",
    growth: "↑ 50%",
    context: "8,3% dos envios",
    accent: "orange",
  },
];

// Gráfico de Evolução (Agosto 2024)
export const EVOLUTION_CHART_DATA: ChartDataPoint[] = [
  { date: "01 Ago", envios: 15, aberturas: 6, cliques: 3, interessados: 1 },
  { date: "05 Ago", envios: 34, aberturas: 14, cliques: 6, interessados: 2 },
  { date: "10 Ago", envios: 48, aberturas: 20, cliques: 9, interessados: 3 },
  { date: "15 Ago", envios: 42, aberturas: 18, cliques: 8, interessados: 3 },
  { date: "20 Ago", envios: 58, aberturas: 26, cliques: 12, interessados: 5 },
  { date: "25 Ago", envios: 52, aberturas: 22, cliques: 10, interessados: 4 },
  { date: "31 Ago", envios: 68, aberturas: 32, cliques: 16, interessados: 7 },
];

// Funil de Conversão (6 Estágios)
export const FUNNEL_STAGES: FunnelStageItem[] = [
  {
    id: "leads",
    label: "Leads da campanha",
    value: 250,
    percentage: "100%",
    color: "#F97316", // Laranja Flow Business
  },
  {
    id: "sites",
    label: "Sites gerados",
    value: 180,
    percentage: "72%",
    color: "#0284C7", // Azul royal
  },
  {
    id: "enviadas",
    label: "Propostas enviadas",
    value: 145,
    percentage: "58%",
    color: "#10B981", // Verde esmeralda
  },
  {
    id: "aberturas",
    label: "Aberturas de e-mail",
    value: 62,
    percentage: "42,8%",
    color: "#A855F7", // Roxo
  },
  {
    id: "cliques",
    label: "Cliques no site",
    value: 28,
    percentage: "19,3%",
    color: "#F43F5E", // Rosa / Vermelho
  },
  {
    id: "interessados",
    label: "Leads interessados",
    value: 12,
    percentage: "8,3%",
    color: "#EAB308", // Dourado / Amarelo
  },
];

// Canais da Campanha (Donut Chart)
export const CHANNELS_DATA: ChannelItem[] = [
  { id: "email", label: "E-mail", count: 145, percentage: "100%", color: "#F97316" },
  { id: "whatsapp", label: "WhatsApp", count: 0, percentage: "0%", color: "#10B981" },
  { id: "instagram", label: "Instagram", count: 0, percentage: "0%", color: "#EC4899" },
  { id: "linkedin", label: "LinkedIn", count: 0, percentage: "0%", color: "#3B82F6" },
  { id: "outros", label: "Outros", count: 0, percentage: "0%", color: "#64748B" },
];

// Tabela de Desempenho de Campanhas
export const CAMPANHAS_PERFORMANCE_TABLE: CampanhaPerformanceRow[] = [
  {
    id: "camp-1",
    name: "Restaurante Premium SP",
    period: "01 - 31 Ago, 2024",
    channel: "email",
    leads: 250,
    sites: 180,
    enviados: 145,
    aberturas: { count: 62, percentage: "42,8%" },
    cliques: { count: 28, percentage: "19,3%" },
    interessados: { count: 12, percentage: "8,3%" },
    status: "em_producao",
  },
  {
    id: "camp-2",
    name: "Clínicas Odontológicas",
    period: "28 Jul - 28 Ago, 2024",
    channel: "email",
    leads: 180,
    sites: 132,
    enviados: 110,
    aberturas: { count: 48, percentage: "43,6%" },
    cliques: { count: 19, percentage: "17,3%" },
    interessados: { count: 8, percentage: "7,3%" },
    status: "em_producao",
  },
  {
    id: "camp-3",
    name: "Salões de Beleza SP",
    period: "15 - 30 Jul, 2024",
    channel: "whatsapp",
    leads: 200,
    sites: 150,
    enviados: 98,
    interessados: { count: 14, percentage: "14,3%" },
    status: "concluida",
  },
  {
    id: "camp-4",
    name: "Academias e CrossFit",
    period: "01 - 20 Jul, 2024",
    channel: "email",
    leads: 320,
    sites: 210,
    enviados: 160,
    aberturas: { count: 68, percentage: "42,5%" },
    cliques: { count: 31, percentage: "19,4%" },
    interessados: { count: 16, percentage: "10,0%" },
    status: "concluida",
  },
  {
    id: "camp-5",
    name: "Lojas de Materiais",
    period: "10 - 25 Jun, 2024",
    channel: "whatsapp",
    leads: 150,
    sites: 98,
    enviados: 85,
    interessados: { count: 7, percentage: "8,2%" },
    status: "concluida",
  },
];

// Últimas Atividades
export const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    title: "Proposta enviada",
    leadName: "Bistrô da Vila",
    city: "São Paulo",
    uf: "SP",
    time: "Hoje, 14:32",
    type: "enviada",
  },
  {
    id: "act-2",
    title: "E-mail aberto",
    leadName: "Trattoria Bella Vista",
    city: "São Paulo",
    uf: "SP",
    time: "Hoje, 11:18",
    type: "aberto",
  },
  {
    id: "act-3",
    title: "Clique no site",
    leadName: "Sabor & Arte",
    city: "São Paulo",
    uf: "SP",
    time: "Hoje, 10:45",
    type: "clique",
  },
  {
    id: "act-4",
    title: "Lead interessado",
    leadName: "Grill Master",
    city: "São Paulo",
    uf: "SP",
    time: "Ontem, 16:20",
    type: "interessado",
  },
  {
    id: "act-5",
    title: "Site publicado",
    leadName: "Cantina Italiana",
    city: "Guarulhos",
    uf: "SP",
    time: "Ontem, 12:10",
    type: "publicado",
  },
];
