// Catálogo e Tipagem da Tela 08 — Planejamento Semanal & Metas
// Dados demonstrativos com máxima fidelidade visual ao layout aprovado.
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  DollarSign,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  FolderKanban,
  GitBranch,
  Globe,
  HardDrive,
  Headphones,
  HeartHandshake,
  Layers,
  LayoutGrid,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  Percent,
  Play,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorPlanejamento {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  tipo?: "padrao" | "progresso" | "status";
  progressoAtual?: number;
  progressoTotal?: number;
  porcentagem?: number;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
  mudanca?: string;
  positivo?: boolean;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  agente: string;
  avatarAgente?: string;
  diaSemana: number; // 0 = Seg, 1 = Ter, 2 = Qua, 3 = Qui, 4 = Sex, 5 = Sab, 6 = Dom
  horaInicio: string; // Ex: "09:00"
  horaFim: string; // Ex: "10:00"
  categoria: "planejamento" | "prospeccao" | "reuniao" | "campanha" | "analise" | "followup" | "proposta" | "onboarding";
  cor: "laranja" | "azul" | "verde" | "roxo" | "cinza" | "ambar" | "ciano";
  descricao?: string;
}

export interface MetaSemanaItem {
  id: string;
  nome: string;
  atual: number | string;
  meta: number | string;
  porcentagem: number;
  unidade?: string;
  icon: LucideIcon;
  corBarra: string;
  corIcone: string;
  corBg: string;
}

export interface CategoriaOrcamento {
  id: string;
  nome: string;
  valor: number;
  percentual: number;
  corPonto: string;
}

export interface CampanhaSemanalItem {
  id: string;
  nome: string;
  canal: string;
  nicho: string;
  status: "ativa" | "pausada";
  leads: number;
  conversao: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface TarefaSemanaItem {
  id: string;
  titulo: string;
  agente: string;
  avatarAgente: string;
  prazo: string;
  corPrazo: "hoje" | "amanha" | "sexta" | "proxima";
  concluida: boolean;
  prioridade: "alta" | "media" | "baixa";
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface DesempenhoAgenteItem {
  id: string;
  nome: string;
  cargo: string;
  avatarUrl: string;
  isCeo?: boolean;
  leads: number;
  reunioes: number;
  propostas: number;
  conversao: string;
  crescimentoPositivo: boolean;
}

// ---------------------------------------------------------------------------
// 1. INDICADORES DO HERO CARD (CEO DE IA)
// ---------------------------------------------------------------------------
export const INDICADORES_SUPERIORES_PLANEJAMENTO: IndicadorSuperiorPlanejamento[] = [
  {
    id: "meta_leads",
    rotulo: "Meta de Leads",
    valor: "1.000",
    sub: "+25% vs. semana anterior",
    mudanca: "+25% vs. semana anterior",
    positivo: true,
    icon: Target,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
    tipo: "padrao",
  },
  {
    id: "reunioes_agendadas",
    rotulo: "Reuniões Agendadas",
    valor: "120",
    sub: "+18% vs. semana anterior",
    mudanca: "+18% vs. semana anterior",
    positivo: true,
    icon: Users,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
    tipo: "padrao",
  },
  {
    id: "propostas_enviadas",
    rotulo: "Propostas Enviadas",
    valor: "50",
    sub: "+32% vs. semana anterior",
    mudanca: "+32% vs. semana anterior",
    positivo: true,
    icon: FileText,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
    tipo: "padrao",
  },
  {
    id: "receita_prevista",
    rotulo: "Receita Prevista",
    valor: "R$ 250.000",
    sub: "+28% vs. semana anterior",
    mudanca: "+28% vs. semana anterior",
    positivo: true,
    icon: DollarSign,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
    tipo: "padrao",
  },
  {
    id: "progresso_semana",
    rotulo: "Progresso da Semana",
    valor: "68%",
    sub: "680 / 1.000 leads",
    progressoAtual: 680,
    progressoTotal: 1000,
    porcentagem: 68,
    icon: RotateCcw,
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/10 border-orange-500/20",
    tipo: "progresso",
  },
  {
    id: "status_planejamento",
    rotulo: "Status do Planejamento",
    valor: "Em andamento",
    sub: "Todas as metas no prazo",
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
    tipo: "status",
  },
];

// ---------------------------------------------------------------------------
// 2. DIAS DA SEMANA ATUAL (20 A 26 DE OUTUBRO DE 2026)
// ---------------------------------------------------------------------------
export const DIAS_DA_SEMANA = [
  { diaSemana: 0, sigla: "Seg", data: "20 Out", hoje: false },
  { diaSemana: 1, sigla: "Ter", data: "21 Out", hoje: false },
  { diaSemana: 2, sigla: "Qua", data: "22 Out", hoje: true }, // Dia atual destacado
  { diaSemana: 3, sigla: "Qui", data: "23 Out", hoje: false },
  { diaSemana: 4, sigla: "Sex", data: "24 Out", hoje: false },
  { diaSemana: 5, sigla: "Sáb", data: "25 Out", hoje: false },
  { diaSemana: 6, sigla: "Dom", data: "26 Out", hoje: false },
];

export const HORARIOS_CALENDARIO = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// ---------------------------------------------------------------------------
// 3. EVENTOS INICIAIS DO CALENDÁRIO SEMANAL
// ---------------------------------------------------------------------------
export const EVENTOS_CALENDARIO_INICIAIS: EventoCalendario[] = [
  // Segunda (20 Out)
  {
    id: "ev-1",
    titulo: "Planejamento semanal",
    agente: "CEO de IA",
    diaSemana: 0,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "planejamento",
    cor: "laranja",
    descricao: "Alinhamento das diretrizes comerciais e distribuição de metas da semana.",
  },
  {
    id: "ev-2",
    titulo: "Prospecção ativa",
    agente: "SDR",
    diaSemana: 0,
    horaInicio: "10:30",
    horaFim: "12:00",
    categoria: "prospeccao",
    cor: "azul",
    descricao: "Disparo e abordagem de novos leads frios no nicho odontológico.",
  },
  {
    id: "ev-3",
    titulo: "Análise de leads",
    agente: "CEO de IA",
    diaSemana: 0,
    horaInicio: "14:00",
    horaFim: "15:30",
    categoria: "analise",
    cor: "roxo",
    descricao: "Revisão de scores e enriquecimento de dados de empresas captadas.",
  },

  // Terça (21 Out)
  {
    id: "ev-4",
    titulo: "Reunião de alinhamento",
    agente: "Equipe",
    diaSemana: 1,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "reuniao",
    cor: "cinza",
    descricao: "Sincronização de atividades entre SDR, Vendedor e Estrategista.",
  },
  {
    id: "ev-5",
    titulo: "Campanha LinkedIn",
    agente: "Estrategista",
    diaSemana: 1,
    horaInicio: "10:30",
    horaFim: "12:00",
    categoria: "campanha",
    cor: "ciano",
    descricao: "Otimização de conexões e mensagens diretas via automação LinkedIn.",
  },
  {
    id: "ev-6",
    titulo: "Follow-up",
    agente: "Vendedor",
    diaSemana: 1,
    horaInicio: "14:00",
    horaFim: "16:00",
    categoria: "followup",
    cor: "ambar",
    descricao: "Cadência de mensagens e tentativas de contato com propostas abertas.",
  },
  {
    id: "ev-7",
    titulo: "Relatório diário",
    agente: "CEO de IA",
    diaSemana: 1,
    horaInicio: "17:00",
    horaFim: "18:00",
    categoria: "analise",
    cor: "azul",
    descricao: "Consolidação de números e envio do resumo de conversão.",
  },

  // Quarta (22 Out) - Hoje
  {
    id: "ev-8",
    titulo: "Prospecção",
    agente: "SDR",
    diaSemana: 2,
    horaInicio: "09:00",
    horaFim: "11:00",
    categoria: "prospeccao",
    cor: "azul",
    descricao: "Filtro e qualificação de leads no Google Maps e Apify.",
  },
  {
    id: "ev-9",
    titulo: "Reuniões",
    agente: "Vendedor",
    diaSemana: 2,
    horaInicio: "13:00",
    horaFim: "15:00",
    categoria: "reuniao",
    cor: "ambar",
    descricao: "Demonstrações comerciais ao vivo com tomadores de decisão.",
  },
  {
    id: "ev-10",
    titulo: "Propostas",
    agente: "Vendedor",
    diaSemana: 2,
    horaInicio: "15:30",
    horaFim: "17:00",
    categoria: "proposta",
    cor: "roxo",
    descricao: "Geração e envio de contratos sob medida para clientes qualificados.",
  },

  // Quinta (23 Out)
  {
    id: "ev-11",
    titulo: "Campanha WhatsApp",
    agente: "Estrategista",
    diaSemana: 3,
    horaInicio: "09:00",
    horaFim: "11:00",
    categoria: "campanha",
    cor: "verde",
    descricao: "Disparo segmentado de casos de sucesso via Evolution API.",
  },
  {
    id: "ev-12",
    titulo: "Reuniões",
    agente: "Vendedor",
    diaSemana: 3,
    horaInicio: "13:00",
    horaFim: "15:00",
    categoria: "reuniao",
    cor: "ambar",
    descricao: "Apresentação de propostas e fechamento de novos planos.",
  },
  {
    id: "ev-13",
    titulo: "Onboarding",
    agente: "SDR",
    diaSemana: 3,
    horaInicio: "15:30",
    horaFim: "17:00",
    categoria: "onboarding",
    cor: "azul",
    descricao: "Boas-vindas e configuração do ambiente dos novos clientes.",
  },

  // Sexta (24 Out)
  {
    id: "ev-14",
    titulo: "Análise de resultados",
    agente: "CEO de IA",
    diaSemana: 4,
    horaInicio: "09:00",
    horaFim: "10:30",
    categoria: "analise",
    cor: "roxo",
    descricao: "Revisão dos KPIs atingidos na semana e gargalos do funil.",
  },
  {
    id: "ev-15",
    titulo: "Prospecção",
    agente: "SDR",
    diaSemana: 4,
    horaInicio: "11:00",
    horaFim: "12:30",
    categoria: "prospeccao",
    cor: "azul",
    descricao: "Reforço de contatos antes do fim de semana.",
  },
  {
    id: "ev-16",
    titulo: "Follow-up",
    agente: "Vendedor",
    diaSemana: 4,
    horaInicio: "14:00",
    horaFim: "16:00",
    categoria: "followup",
    cor: "ambar",
    descricao: "Última tentativa de fechamento para bater a meta semanal.",
  },

  // Sábado (25 Out)
  {
    id: "ev-17",
    titulo: "Revisão de metas",
    agente: "CEO de IA",
    diaSemana: 5,
    horaInicio: "10:00",
    horaFim: "11:00",
    categoria: "planejamento",
    cor: "cinza",
    descricao: "Auditoria automática de números consolidados nos relatórios.",
  },

  // Domingo (26 Out)
  {
    id: "ev-18",
    titulo: "Planejamento próxima semana",
    agente: "CEO de IA",
    diaSemana: 6,
    horaInicio: "10:00",
    horaFim: "11:00",
    categoria: "planejamento",
    cor: "cinza",
    descricao: "Estruturação dos nichos e orçamentos para a próxima semana.",
  },
];

// ---------------------------------------------------------------------------
// 4. METAS DA SEMANA (CARD LATERAL DIREITO)
// ---------------------------------------------------------------------------
export const METAS_DA_SEMANA_INICIAIS: MetaSemanaItem[] = [
  {
    id: "leads_qualificados",
    nome: "Leads qualificados",
    atual: 680,
    meta: 1000,
    porcentagem: 68,
    icon: Filter,
    corBarra: "bg-blue-500",
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/15 border-blue-500/25",
  },
  {
    id: "reunioes_agendadas",
    nome: "Reuniões agendadas",
    atual: 85,
    meta: 120,
    porcentagem: 71,
    icon: CalendarCheck,
    corBarra: "bg-emerald-500",
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    id: "propostas_enviadas",
    nome: "Propostas enviadas",
    atual: 32,
    meta: 50,
    porcentagem: 64,
    icon: FileText,
    corBarra: "bg-purple-500",
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/15 border-purple-500/25",
  },
  {
    id: "taxa_conversao",
    nome: "Taxa de conversão",
    atual: "18%",
    meta: "25%",
    porcentagem: 72,
    icon: TrendingUp,
    corBarra: "bg-orange-500",
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/15 border-orange-500/25",
  },
  {
    id: "receita_prevista",
    nome: "Receita prevista",
    atual: "R$ 180.000",
    meta: "R$ 250.000",
    porcentagem: 72,
    icon: DollarSign,
    corBarra: "bg-amber-500",
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/15 border-amber-500/25",
  },
];

// ---------------------------------------------------------------------------
// 5. ORÇAMENTO DA SEMANA (CARD LATERAL DIREITO)
// ---------------------------------------------------------------------------
export const ORCAMENTO_TOTAL_SEMANAL = 20000;
export const ORCAMENTO_CONSUMIDO_SEMANAL = 12500;
export const ORCAMENTO_PERCENTUAL = 63;

export const CATEGORIAS_ORCAMENTO: CategoriaOrcamento[] = [
  { id: "1", nome: "Anúncios e Campanhas", valor: 6000, percentual: 48, corPonto: "bg-blue-500" },
  { id: "2", nome: "Ferramentas e APIs", valor: 3500, percentual: 28, corPonto: "bg-cyan-400" },
  { id: "3", nome: "Equipe e agentes", valor: 2000, percentual: 16, corPonto: "bg-purple-500" },
  { id: "4", nome: "Outros", valor: 1000, percentual: 8, corPonto: "bg-neutral-500" },
];

// ---------------------------------------------------------------------------
// 6. CAMPANHAS DA SEMANA (CARD INFERIOR ESQUERDO)
// ---------------------------------------------------------------------------
export const CAMPANHAS_DA_SEMANA_INICIAIS: CampanhaSemanalItem[] = [
  {
    id: "camp-1",
    nome: "Prospecção LinkedIn",
    canal: "LinkedIn",
    nicho: "Clínicas Odontológicas",
    status: "ativa",
    leads: 320,
    conversao: "18%",
    icon: Users,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/15 border-purple-500/25",
  },
  {
    id: "camp-2",
    nome: "WhatsApp Direto",
    canal: "WhatsApp",
    nicho: "Implantes Dentários",
    status: "ativa",
    leads: 280,
    conversao: "22%",
    icon: MessageSquare,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    id: "camp-3",
    nome: "Google Ads",
    canal: "Google",
    nicho: "Lentes de Contato",
    status: "pausada",
    leads: 0,
    conversao: "0%",
    icon: Globe,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/15 border-blue-500/25",
  },
  {
    id: "camp-4",
    nome: "E-mail Marketing",
    canal: "E-mail",
    nicho: "Ortodontia",
    status: "ativa",
    leads: 150,
    conversao: "16%",
    icon: Mail,
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/15 border-orange-500/25",
  },
];

// ---------------------------------------------------------------------------
// 7. TAREFAS DA SEMANA (CARD INFERIOR CENTRAL)
// ---------------------------------------------------------------------------
export const TAREFAS_DA_SEMANA_INICIAIS: TarefaSemanaItem[] = [
  {
    id: "tar-1",
    titulo: "Criar lista de 200 novos leads",
    agente: "SDR",
    avatarAgente: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    prazo: "Hoje",
    corPrazo: "hoje",
    concluida: false,
    prioridade: "alta",
    icon: Search,
    corIcone: "text-rose-400",
    corBg: "bg-rose-500/15 border-rose-500/25",
  },
  {
    id: "tar-2",
    titulo: "Analisar propostas pendentes",
    agente: "Vendedor",
    avatarAgente: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    prazo: "Hoje",
    corPrazo: "hoje",
    concluida: false,
    prioridade: "alta",
    icon: FileText,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/15 border-amber-500/25",
  },
  {
    id: "tar-3",
    titulo: "Reunião de alinhamento da equipe",
    agente: "CEO de IA",
    avatarAgente: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    prazo: "Amanhã",
    corPrazo: "amanha",
    concluida: false,
    prioridade: "media",
    icon: Users,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/15 border-purple-500/25",
  },
  {
    id: "tar-4",
    titulo: "Revisar campanha Google Ads",
    agente: "Estrategista",
    avatarAgente: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    prazo: "Amanhã",
    corPrazo: "amanha",
    concluida: false,
    prioridade: "media",
    icon: Megaphone,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    id: "tar-5",
    titulo: "Atualizar CRM com novos contatos",
    agente: "SDR",
    avatarAgente: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    prazo: "Sexta",
    corPrazo: "sexta",
    concluida: false,
    prioridade: "baixa",
    icon: Database,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/15 border-blue-500/25",
  },
];

// ---------------------------------------------------------------------------
// 8. DESEMPENHO POR AGENTE (CARD INFERIOR DIREITO)
// ---------------------------------------------------------------------------
export const DESEMPENHO_AGENTES_INICIAIS: DesempenhoAgenteItem[] = [
  {
    id: "ceo",
    nome: "CEO de IA",
    cargo: "Orquestrador",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    isCeo: true,
    leads: 160,
    reunioes: 32,
    propostas: 12,
    conversao: "20%",
    crescimentoPositivo: true,
  },
  {
    id: "estrategista",
    nome: "Estrategista",
    cargo: "Planejamento",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    leads: 220,
    reunioes: 28,
    propostas: 10,
    conversao: "14%",
    crescimentoPositivo: true,
  },
  {
    id: "sdr",
    nome: "SDR",
    cargo: "Qualificador",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    leads: 350,
    reunioes: 40,
    propostas: 18,
    conversao: "22%",
    crescimentoPositivo: true,
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    cargo: "Closer",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    leads: 240,
    reunioes: 35,
    propostas: 16,
    conversao: "18%",
    crescimentoPositivo: true,
  },
  {
    id: "seo",
    nome: "SEO Geral",
    cargo: "Otimizador",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    leads: 90,
    reunioes: 8,
    propostas: 4,
    conversao: "12%",
    crescimentoPositivo: true,
  },
];
