// Catálogo e Estruturas de Dados Demonstrativas da Tela 12 — Relatórios & Resultados
// Módulo: Gestão → Agentes & Automações
// Fiel aos números, gráficos, tabelas e proporções da referência aprovada.

export interface IndicadorExecutivo {
  id: string;
  nome: string;
  valor: string;
  valorNumerico: number;
  unidade?: string;
  variacao: string;
  tipoVariacao: "positivo" | "negativo";
  comparacao: string;
  cor: string;
  bgIcone: string;
  bordaIcone: string;
  iconeNome:
    | "Target"
    | "CalendarCheck"
    | "FileText"
    | "Award"
    | "DollarSign"
    | "CreditCard"
    | "TrendingUp"
    | "Percent";
}

export const INDICADORES_EXECUTIVOS_PADRAO: IndicadorExecutivo[] = [
  {
    id: "leads_captados",
    nome: "Leads Captados",
    valor: "4.280",
    valorNumerico: 4280,
    variacao: "+32%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-purple-400",
    bgIcone: "bg-purple-500/15",
    bordaIcone: "border-purple-500/30",
    iconeNome: "Target",
  },
  {
    id: "reunioes_agendadas",
    nome: "Reuniões Agendadas",
    valor: "520",
    valorNumerico: 520,
    variacao: "+28%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-blue-400",
    bgIcone: "bg-blue-500/15",
    bordaIcone: "border-blue-500/30",
    iconeNome: "CalendarCheck",
  },
  {
    id: "propostas_enviadas",
    nome: "Propostas Enviadas",
    valor: "310",
    valorNumerico: 310,
    variacao: "+24%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-emerald-400",
    bgIcone: "bg-emerald-500/15",
    bordaIcone: "border-emerald-500/30",
    iconeNome: "FileText",
  },
  {
    id: "vendas_realizadas",
    nome: "Vendas Realizadas",
    valor: "182",
    valorNumerico: 182,
    variacao: "+41%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-amber-400",
    bgIcone: "bg-amber-500/15",
    bordaIcone: "border-amber-500/30",
    iconeNome: "Award",
  },
  {
    id: "receita_gerada",
    nome: "Receita Gerada",
    valor: "R$ 189.750",
    valorNumerico: 189750,
    variacao: "+36%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-amber-400",
    bgIcone: "bg-amber-500/15",
    bordaIcone: "border-amber-500/30",
    iconeNome: "DollarSign",
  },
  {
    id: "custo_total",
    nome: "Custo Total",
    valor: "R$ 32.400",
    valorNumerico: 32400,
    variacao: "-18%",
    tipoVariacao: "positivo", // Redução de custo é positiva
    comparacao: "vs. mês anterior",
    cor: "text-sky-400",
    bgIcone: "bg-sky-500/15",
    bordaIcone: "border-sky-500/30",
    iconeNome: "CreditCard",
  },
  {
    id: "roi",
    nome: "ROI",
    valor: "485%",
    valorNumerico: 485,
    variacao: "+22%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-emerald-400",
    bgIcone: "bg-emerald-500/15",
    bordaIcone: "border-emerald-500/30",
    iconeNome: "TrendingUp",
  },
  {
    id: "taxa_conversao",
    nome: "Taxa de Conversão",
    valor: "16,9%",
    valorNumerico: 16.9,
    variacao: "+3,4%",
    tipoVariacao: "positivo",
    comparacao: "vs. mês anterior",
    cor: "text-purple-400",
    bgIcone: "bg-purple-500/15",
    bordaIcone: "border-purple-500/30",
    iconeNome: "Percent",
  },
];

// Pontos da Linha Temporal de Leads e Vendas
export interface PontoLinhaTemporal {
  data: string; // Ex: '01/10'
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
}

export const DADOS_LINHA_TEMPORAL: PontoLinhaTemporal[] = [
  { data: "01/10", leads: 320, reunioes: 60, propostas: 35, vendas: 18 },
  { data: "04/10", leads: 380, reunioes: 75, propostas: 42, vendas: 22 },
  { data: "07/10", leads: 520, reunioes: 85, propostas: 50, vendas: 28 },
  { data: "10/10", leads: 480, reunioes: 92, propostas: 58, vendas: 30 },
  { data: "13/10", leads: 690, reunioes: 110, propostas: 65, vendas: 36 },
  { data: "16/10", leads: 620, reunioes: 105, propostas: 60, vendas: 32 },
  { data: "19/10", leads: 850, reunioes: 125, propostas: 74, vendas: 40 },
  { data: "22/10", leads: 820, reunioes: 118, propostas: 70, vendas: 38 },
  { data: "25/10", leads: 790, reunioes: 112, propostas: 68, vendas: 35 },
  { data: "28/10", leads: 840, reunioes: 122, propostas: 72, vendas: 42 },
  { data: "31/10", leads: 890, reunioes: 130, propostas: 80, vendas: 45 },
];

// Desempenho por Agente
export interface DesempenhoAgente {
  id: string;
  nome: string;
  papel: string;
  avatarUrl: string;
  corBarra: string;
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  conversao: string;
  receitaAtribuida: string;
}

export const DESEMPENHO_AGENTES_PADRAO: DesempenhoAgente[] = [
  {
    id: "ceo",
    nome: "CEO de IA",
    papel: "Orquestrador Geral",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    corBarra: "from-[#06b6d4] to-[#0ea5e9]",
    leads: 920,
    reunioes: 145,
    propostas: 88,
    vendas: 55,
    conversao: "19,8%",
    receitaAtribuida: "R$ 68.400",
  },
  {
    id: "estrategista",
    nome: "Estrategista",
    papel: "Planejamento e Mercado",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    corBarra: "from-[#10b981] to-[#059669]",
    leads: 780,
    reunioes: 120,
    propostas: 72,
    vendas: 42,
    conversao: "18,2%",
    receitaAtribuida: "R$ 44.200",
  },
  {
    id: "sdr",
    nome: "SDR",
    papel: "Qualificação de Leads",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    corBarra: "from-[#2563eb] to-[#1d4ed8]",
    leads: 650,
    reunioes: 105,
    propostas: 60,
    vendas: 34,
    conversao: "16,5%",
    receitaAtribuida: "R$ 35.800",
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    papel: "Negociação",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    corBarra: "from-[#8b5cf6] to-[#7c3aed]",
    leads: 540,
    reunioes: 85,
    propostas: 52,
    vendas: 30,
    conversao: "17,1%",
    receitaAtribuida: "R$ 31.500",
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    papel: "Busca e Listas",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    corBarra: "from-[#64748b] to-[#475569]",
    leads: 430,
    reunioes: 55,
    propostas: 30,
    vendas: 16,
    conversao: "14,8%",
    receitaAtribuida: "R$ 16.400",
  },
  {
    id: "seo",
    nome: "SEO Geral",
    papel: "Conteúdo e Demanda",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    corBarra: "from-[#f59e0b] to-[#d97706]",
    leads: 310,
    reunioes: 40,
    propostas: 22,
    vendas: 12,
    conversao: "15,2%",
    receitaAtribuida: "R$ 12.800",
  },
];

// Origem dos Leads (Donut)
export interface OrigemLead {
  fonte: string;
  percentual: number;
  quantidade: number;
  cor: string;
  fillHex: string;
}

export const ORIGENS_LEADS_PADRAO: OrigemLead[] = [
  { fonte: "Google Maps", percentual: 28, quantidade: 1200, cor: "text-cyan-400", fillHex: "#06b6d4" },
  { fonte: "Instagram", percentual: 22, quantidade: 940, cor: "text-emerald-400", fillHex: "#10b981" },
  { fonte: "LinkedIn", percentual: 18, quantidade: 780, cor: "text-blue-400", fillHex: "#3b82f6" },
  { fonte: "Meta Ads", percentual: 14, quantidade: 620, cor: "text-purple-400", fillHex: "#8b5cf6" },
  { fonte: "WhatsApp", percentual: 10, quantidade: 428, cor: "text-pink-400", fillHex: "#ec4899" },
  { fonte: "Outros", percentual: 8, quantidade: 312, cor: "text-slate-400", fillHex: "#64748b" },
];

// Receita vs Investimento Semanal
export interface ReceitaInvestimentoSemana {
  semana: string;
  receita: number;
  investimento: number;
  receitaFormatada: string;
  investimentoFormatado: string;
}

export const RECEITA_VS_INVESTIMENTO_PADRAO: ReceitaInvestimentoSemana[] = [
  {
    semana: "Sem 1",
    receita: 34000,
    investimento: 5800,
    receitaFormatada: "R$ 34.000",
    investimentoFormatado: "R$ 5.800",
  },
  {
    semana: "Sem 2",
    receita: 42500,
    investimento: 6400,
    receitaFormatada: "R$ 42.500",
    investimentoFormatado: "R$ 6.400",
  },
  {
    semana: "Sem 3",
    receita: 52000,
    investimento: 7200,
    receitaFormatada: "R$ 52.000",
    investimentoFormatado: "R$ 7.200",
  },
  {
    semana: "Sem 4",
    receita: 74250,
    investimento: 8600,
    receitaFormatada: "R$ 74.250",
    investimentoFormatado: "R$ 8.600",
  },
  {
    semana: "Sem 5",
    receita: 58000,
    investimento: 6900,
    receitaFormatada: "R$ 58.000",
    investimentoFormatado: "R$ 6.900",
  },
];

// Funil de Vendas Comercial
export interface EtapaFunil {
  id: string;
  etapa: string;
  quantidade: number;
  percentualGeral: number; // % do topo
  percentualEtapa: number; // % da etapa anterior
  cor: string;
  fillHex: string;
  larguraTopoPercent: number;
  larguraBasePercent: number;
}

export const FUNIL_VENDAS_PADRAO: EtapaFunil[] = [
  {
    id: "leads",
    etapa: "Leads",
    quantidade: 4280,
    percentualGeral: 100,
    percentualEtapa: 100,
    cor: "text-purple-400",
    fillHex: "#9333ea",
    larguraTopoPercent: 100,
    larguraBasePercent: 82,
  },
  {
    id: "qualificados",
    etapa: "Qualificados",
    quantidade: 2860,
    percentualGeral: 67,
    percentualEtapa: 67,
    cor: "text-blue-400",
    fillHex: "#3b82f6",
    larguraTopoPercent: 82,
    larguraBasePercent: 62,
  },
  {
    id: "reunioes",
    etapa: "Reuniões",
    quantidade: 520,
    percentualGeral: 12,
    percentualEtapa: 18,
    cor: "text-cyan-400",
    fillHex: "#06b6d4",
    larguraTopoPercent: 62,
    larguraBasePercent: 44,
  },
  {
    id: "propostas",
    etapa: "Propostas",
    quantidade: 310,
    percentualGeral: 7,
    percentualEtapa: 17, // Exibido na imagem como 17%
    cor: "text-orange-400",
    fillHex: "#f97316",
    larguraTopoPercent: 44,
    larguraBasePercent: 26,
  },
  {
    id: "vendas",
    etapa: "Vendas",
    quantidade: 182,
    percentualGeral: 4,
    percentualEtapa: 59,
    cor: "text-amber-400",
    fillHex: "#eab308",
    larguraTopoPercent: 26,
    larguraBasePercent: 14,
  },
];

// Distribuição por Nicho
export interface DistribuicaoNicho {
  nicho: string;
  percentual: number;
  quantidade: number;
  cor: string;
  fillHex: string;
}

export const DISTRIBUICAO_NICHOS_PADRAO: DistribuicaoNicho[] = [
  { nicho: "Clínicas Odontológicas", percentual: 26, quantidade: 1113, cor: "text-sky-400", fillHex: "#0ea5e9" },
  { nicho: "Imobiliárias", percentual: 20, quantidade: 856, cor: "text-blue-400", fillHex: "#3b82f6" },
  { nicho: "Academias", percentual: 16, quantidade: 685, cor: "text-purple-400", fillHex: "#8b5cf6" },
  { nicho: "Restaurantes", percentual: 14, quantidade: 599, cor: "text-rose-400", fillHex: "#f43f5e" },
  { nicho: "E-commerces", percentual: 12, quantidade: 514, cor: "text-amber-400", fillHex: "#f59e0b" },
  { nicho: "Outros", percentual: 12, quantidade: 513, cor: "text-teal-400", fillHex: "#14b8a6" },
];

// Regiões com mais Leads
export interface RegiaoLead {
  localizacao: string;
  quantidade: number;
  percentual: number;
  larguraBarraPercent: number;
}

export const REGIOES_LEADS_PADRAO: RegiaoLead[] = [
  { localizacao: "Curitiba - PR", quantidade: 1120, percentual: 26, larguraBarraPercent: 100 },
  { localizacao: "São Paulo - SP", quantidade: 980, percentual: 23, larguraBarraPercent: 88 },
  { localizacao: "Rio de Janeiro - RJ", quantidade: 540, percentual: 13, larguraBarraPercent: 48 },
  { localizacao: "Belo Horizonte - MG", quantidade: 420, percentual: 10, larguraBarraPercent: 38 },
  { localizacao: "Brasília - DF", quantidade: 380, percentual: 9, larguraBarraPercent: 34 },
  { localizacao: "Outras regiões", quantidade: 840, percentual: 19, larguraBarraPercent: 75 },
];

// Campanhas e Resultados
export interface CampanhaResultado {
  id: string;
  nome: string;
  canal: string;
  nicho: string;
  status: "Ativa" | "Pausada" | "Concluída";
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  receita: string;
  receitaNumerica: number;
  roi: string;
  corCanal: string;
  bgCanal: string;
  iconeCanal: "MapPin" | "Instagram" | "Linkedin" | "Target" | "MessageSquare";
}

export const CAMPANHAS_RESULTADOS_PADRAO: CampanhaResultado[] = [
  {
    id: "camp_1",
    nome: "Prospecção Google Maps",
    canal: "Google Maps",
    nicho: "Clínicas Odontológicas",
    status: "Ativa",
    leads: 1200,
    reunioes: 160,
    propostas: 90,
    vendas: 52,
    receita: "R$ 54.600",
    receitaNumerica: 54600,
    roi: "520%",
    corCanal: "text-purple-400",
    bgCanal: "bg-purple-500/20",
    iconeCanal: "MapPin",
  },
  {
    id: "camp_2",
    nome: "Instagram Leads",
    canal: "Instagram",
    nicho: "Academias",
    status: "Ativa",
    leads: 940,
    reunioes: 120,
    propostas: 70,
    vendas: 38,
    receita: "R$ 38.400",
    receitaNumerica: 38400,
    roi: "480%",
    corCanal: "text-emerald-400",
    bgCanal: "bg-emerald-500/20",
    iconeCanal: "Instagram",
  },
  {
    id: "camp_3",
    nome: "LinkedIn B2B",
    canal: "LinkedIn",
    nicho: "Imobiliárias",
    status: "Ativa",
    leads: 780,
    reunioes: 105,
    propostas: 62,
    vendas: 35,
    receita: "R$ 35.200",
    receitaNumerica: 35200,
    roi: "460%",
    corCanal: "text-blue-400",
    bgCanal: "bg-blue-500/20",
    iconeCanal: "Linkedin",
  },
  {
    id: "camp_4",
    nome: "Meta Ads Conversão",
    canal: "Meta Ads",
    nicho: "E-commerces",
    status: "Pausada",
    leads: 620,
    reunioes: 80,
    propostas: 40,
    vendas: 22,
    receita: "R$ 22.300",
    receitaNumerica: 22300,
    roi: "320%",
    corCanal: "text-rose-400",
    bgCanal: "bg-rose-500/20",
    iconeCanal: "Target",
  },
  {
    id: "camp_5",
    nome: "WhatsApp Direto",
    canal: "WhatsApp",
    nicho: "Restaurantes",
    status: "Ativa",
    leads: 520,
    reunioes: 55,
    propostas: 32,
    vendas: 18,
    receita: "R$ 18.250",
    receitaNumerica: 18250,
    roi: "310%",
    corCanal: "text-teal-400",
    bgCanal: "bg-teal-500/20",
    iconeCanal: "MessageSquare",
  },
];

// Metas do Período
export interface MetaPeriodo {
  id: string;
  titulo: string;
  realizadoTexto: string;
  metaTexto: string;
  realizado: number;
  meta: number;
  percentual: number;
  corBarra: string;
  corIcone: string;
  bgIcone: string;
  iconeNome: "Users" | "Video" | "Award" | "DollarSign";
}

export const METAS_PERIODO_PADRAO: MetaPeriodo[] = [
  {
    id: "meta_leads",
    titulo: "Leads captados",
    realizadoTexto: "4.280",
    metaTexto: "5.000",
    realizado: 4280,
    meta: 5000,
    percentual: 86,
    corBarra: "bg-[#3b82f6]",
    corIcone: "text-blue-400",
    bgIcone: "bg-blue-500/15 border border-blue-500/30",
    iconeNome: "Users",
  },
  {
    id: "meta_reunioes",
    titulo: "Reuniões agendadas",
    realizadoTexto: "520",
    metaTexto: "600",
    realizado: 520,
    meta: 600,
    percentual: 87,
    corBarra: "bg-[#10b981]",
    corIcone: "text-emerald-400",
    bgIcone: "bg-emerald-500/15 border border-emerald-500/30",
    iconeNome: "Video",
  },
  {
    id: "meta_vendas",
    titulo: "Vendas realizadas",
    realizadoTexto: "182",
    metaTexto: "200",
    realizado: 182,
    meta: 200,
    percentual: 91,
    corBarra: "bg-[#8b5cf6]",
    corIcone: "text-purple-400",
    bgIcone: "bg-purple-500/15 border border-purple-500/30",
    iconeNome: "Award",
  },
  {
    id: "meta_receita",
    titulo: "Receita gerada",
    realizadoTexto: "R$ 189.750",
    metaTexto: "R$ 200.000",
    realizado: 189750,
    meta: 200000,
    percentual: 95,
    corBarra: "bg-[#f59e0b]",
    corIcone: "text-amber-400",
    bgIcone: "bg-amber-500/15 border border-amber-500/30",
    iconeNome: "DollarSign",
  },
];

// Fórmulas Utilitárias Reutilizáveis
export function calcularRoi(receita: number, custo: number): number {
  if (custo <= 0) return 0;
  return Math.round(((receita - custo) / custo) * 100);
}

export function calcularTaxaConversao(vendas: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((vendas / total) * 100).toFixed(1));
}

export function calcularCustoPorLead(custo: number, leads: number): string {
  if (leads <= 0) return "N/D";
  return `R$ ${(custo / leads).toFixed(2).replace(".", ",")}`;
}

export function calcularCustoPorVenda(custo: number, vendas: number): string {
  if (vendas <= 0) return "N/D";
  return `R$ ${(custo / vendas).toFixed(2).replace(".", ",")}`;
}
