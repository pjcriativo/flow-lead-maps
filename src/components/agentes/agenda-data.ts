// Catálogo e Tipagem da Tela 09 — Agenda Inteligente
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
  Phone,
  Play,
  PlusCircle,
  RotateCcw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorAgenda {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  mudanca?: string;
  positivo?: boolean;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface ReuniãoCalendario {
  id: string;
  titulo: string;
  empresaOuLead: string;
  responsavel: string;
  avatarResponsavel?: string;
  diaSemana: number; // 0 = Seg, 1 = Ter, 2 = Qua, 3 = Qui, 4 = Sex, 5 = Sab, 6 = Dom
  horaInicio: string; // Ex: "09:00"
  horaFim: string; // Ex: "09:30"
  categoria: "comercial" | "estrategia" | "demo" | "followup" | "onboarding" | "prospeccao" | "planejamento";
  cor: "azul" | "roxo" | "verde" | "laranja" | "vermelho" | "ambar" | "ciano" | "cinza";
  isOnline?: boolean;
  linkReuniao?: string;
  status: "confirmada" | "pendente" | "concluida" | "cancelada";
  leadNome?: string;
  leadTelefone?: string;
  leadEmail?: string;
  resumoQualificacao?: string;
}

export interface AgenteDisponibilidadeItem {
  id: string;
  nome: string;
  cargo: string;
  avatarUrl: string;
  isCeo?: boolean;
  status: "disponivel" | "em_reuniao" | "ocupado" | "ausente";
  statusTexto: string;
}

export interface ProximaReuniaoItem {
  id: string;
  horario: string;
  titulo: string;
  empresa: string;
  avatarResponsavel: string;
  tempoRestante: string;
  badgeTipo: "agora" | "proxima" | "hoje";
  corBadgeHora: string;
  corIcone: string;
  corBg: string;
}

export interface TarefaRelacionadaItem {
  id: string;
  titulo: string;
  prazoHora: string;
  avatarResponsavel: string;
  concluida: boolean;
}

export interface EstatisticaAgendaItem {
  id: string;
  rotulo: string;
  valor: string;
  mudanca: string;
  positivo: boolean;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
  sparkline: number[];
}

// ---------------------------------------------------------------------------
// 1. INDICADORES DO HERO CARD (CEO DE IA)
// ---------------------------------------------------------------------------
export const INDICADORES_SUPERIORES_AGENDA: IndicadorSuperiorAgenda[] = [
  {
    id: "reunioes_hoje",
    rotulo: "Reuniões hoje",
    valor: "12",
    sub: "+33% vs. ontem",
    mudanca: "+33% vs. ontem",
    positivo: true,
    icon: Calendar,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "taxa_comparecimento",
    rotulo: "Taxa de comparecimento",
    valor: "94%",
    sub: "+8% vs. semana anterior",
    mudanca: "+8% vs. semana anterior",
    positivo: true,
    icon: Percent,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "reunioes_confirmadas",
    rotulo: "Reuniões confirmadas",
    valor: "28",
    sub: "+47% vs. semana anterior",
    mudanca: "+47% vs. semana anterior",
    positivo: true,
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "tempo_medio",
    rotulo: "Tempo médio",
    valor: "32 min",
    sub: "-10% vs. semana anterior",
    mudanca: "-10% vs. semana anterior",
    positivo: true,
    icon: Clock,
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/10 border-orange-500/20",
  },
];

// ---------------------------------------------------------------------------
// 2. DIAS DA SEMANA ATUAL (20 A 26 DE OUTUBRO DE 2026)
// ---------------------------------------------------------------------------
export const DIAS_DA_SEMANA_AGENDA = [
  { diaSemana: 0, sigla: "Seg", data: "20 Out", hoje: false },
  { diaSemana: 1, sigla: "Ter", data: "21 Out", hoje: false },
  { diaSemana: 2, sigla: "Qua", data: "22 Out", hoje: true }, // Dia atual destacado
  { diaSemana: 3, sigla: "Qui", data: "23 Out", hoje: false },
  { diaSemana: 4, sigla: "Sex", data: "24 Out", hoje: false },
  { diaSemana: 5, sigla: "Sáb", data: "25 Out", hoje: false },
  { diaSemana: 6, sigla: "Dom", data: "26 Out", hoje: false },
];

export const HORARIOS_AGENDA = [
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
// 3. REUNIÕES INICIAIS DO CALENDÁRIO PRINCIPAL
// ---------------------------------------------------------------------------
export const REUNIOES_CALENDARIO_INICIAIS: ReuniãoCalendario[] = [
  // Segunda (20 Out)
  {
    id: "reu-1",
    titulo: "Reunião Estratégica",
    empresaOuLead: "CEO de IA",
    responsavel: "CEO de IA",
    diaSemana: 0,
    horaInicio: "08:00",
    horaFim: "09:00",
    categoria: "estrategia",
    cor: "roxo",
    isOnline: true,
    status: "confirmada",
    resumoQualificacao: "Alinhamento das diretrizes comerciais da semana e KPIs de captação.",
  },
  {
    id: "reu-2",
    titulo: "Apresentação Comercial",
    empresaOuLead: "Clínica Vida Mais",
    responsavel: "Vendedor",
    diaSemana: 0,
    horaInicio: "09:30",
    horaFim: "10:30",
    categoria: "comercial",
    cor: "azul",
    isOnline: false,
    status: "confirmada",
    leadNome: "Dr. Roberto Silva",
    resumoQualificacao: "Lead qualificado pelo SDR. Interesse em automação de agendamentos via WhatsApp.",
  },
  {
    id: "reu-3",
    titulo: "Prospecção Ativa",
    empresaOuLead: "SDR",
    responsavel: "SDR",
    diaSemana: 0,
    horaInicio: "11:00",
    horaFim: "12:00",
    categoria: "prospeccao",
    cor: "azul",
    isOnline: true,
    status: "confirmada",
  },
  {
    id: "reu-4",
    titulo: "Alinhamento Equipe",
    empresaOuLead: "Gerente Comercial",
    responsavel: "Gerente Comercial",
    diaSemana: 0,
    horaInicio: "14:00",
    horaFim: "15:00",
    categoria: "estrategia",
    cor: "roxo",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-5",
    titulo: "Revisão de Metas",
    empresaOuLead: "CEO de IA",
    responsavel: "CEO de IA",
    diaSemana: 0,
    horaInicio: "16:00",
    horaFim: "17:00",
    categoria: "estrategia",
    cor: "roxo",
    isOnline: false,
    status: "confirmada",
  },

  // Terça (21 Out)
  {
    id: "reu-6",
    titulo: "Follow-up",
    empresaOuLead: "Vendedor",
    responsavel: "Vendedor",
    diaSemana: 1,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "followup",
    cor: "ambar",
    isOnline: true,
    status: "confirmada",
  },
  {
    id: "reu-7",
    titulo: "Demonstração",
    empresaOuLead: "Academia Fit Pro",
    responsavel: "Vendedor",
    diaSemana: 1,
    horaInicio: "10:30",
    horaFim: "11:30",
    categoria: "demo",
    cor: "verde",
    isOnline: false,
    status: "confirmada",
    leadNome: "Marcos Vinicius",
    resumoQualificacao: "Interesse em plano Enterprise com integração direta ao CRM.",
  },
  {
    id: "reu-8",
    titulo: "Reunião Interna",
    empresaOuLead: "Estrategista",
    responsavel: "Estrategista",
    diaSemana: 1,
    horaInicio: "13:00",
    horaFim: "14:00",
    categoria: "estrategia",
    cor: "cinza",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-9",
    titulo: "Proposta Comercial",
    empresaOuLead: "Construtora Alfa",
    responsavel: "Vendedor",
    diaSemana: 1,
    horaInicio: "15:00",
    horaFim: "16:00",
    categoria: "comercial",
    cor: "vermelho",
    isOnline: false,
    status: "confirmada",
    leadNome: "Eng. Paulo Guedes",
    resumoQualificacao: "Apresentação da proposta com desconto para pagamento semestral.",
  },

  // Quarta (22 Out - Hoje)
  {
    id: "reu-10",
    titulo: "Apresentação Comercial",
    empresaOuLead: "Clínica Sorriso Saúde",
    responsavel: "SDR",
    diaSemana: 2,
    horaInicio: "09:00",
    horaFim: "09:30",
    categoria: "comercial",
    cor: "laranja",
    isOnline: true,
    status: "confirmada",
    leadNome: "Dra. Camila Rocha",
    resumoQualificacao: "Lead quente com 3 consultórios. Deseja iniciar testes nesta semana.",
  },
  {
    id: "reu-11",
    titulo: "Reunião com Parceiro",
    empresaOuLead: "Agência Criativa",
    responsavel: "SDR",
    diaSemana: 2,
    horaInicio: "10:00",
    horaFim: "11:00",
    categoria: "estrategia",
    cor: "roxo",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-12",
    titulo: "Análise de Leads",
    empresaOuLead: "SDR",
    responsavel: "SDR",
    diaSemana: 2,
    horaInicio: "13:30",
    horaFim: "14:30",
    categoria: "prospeccao",
    cor: "roxo",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-13",
    titulo: "Onboarding Cliente",
    empresaOuLead: "Ecommerce Plus",
    responsavel: "SDR",
    diaSemana: 2,
    horaInicio: "15:00",
    horaFim: "16:00",
    categoria: "onboarding",
    cor: "verde",
    isOnline: false,
    status: "confirmada",
    leadNome: "Juliana Duarte",
    resumoQualificacao: "Contrato assinado. Configuração inicial do número WhatsApp da loja.",
  },

  // Quinta (23 Out)
  {
    id: "reu-14",
    titulo: "Prospecção LinkedIn",
    empresaOuLead: "SDR",
    responsavel: "SDR",
    diaSemana: 3,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "prospeccao",
    cor: "azul",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-15",
    titulo: "Reunião de Alinhamento",
    empresaOuLead: "Estrategista",
    responsavel: "Estrategista",
    diaSemana: 3,
    horaInicio: "11:00",
    horaFim: "12:00",
    categoria: "estrategia",
    cor: "verde",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-16",
    titulo: "Propostas Pendentes",
    empresaOuLead: "Vendedor",
    responsavel: "Vendedor",
    diaSemana: 3,
    horaInicio: "14:00",
    horaFim: "15:00",
    categoria: "comercial",
    cor: "vermelho",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-17",
    titulo: "Planejamento Próxima",
    empresaOuLead: "CEO de IA",
    responsavel: "CEO de IA",
    diaSemana: 3,
    horaInicio: "16:00",
    horaFim: "17:00",
    categoria: "planejamento",
    cor: "cinza",
    isOnline: false,
    status: "confirmada",
  },

  // Sexta (24 Out)
  {
    id: "reu-18",
    titulo: "Demo Produto",
    empresaOuLead: "Tech Solutions",
    responsavel: "Vendedor",
    diaSemana: 4,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "demo",
    cor: "verde",
    isOnline: false,
    status: "confirmada",
    leadNome: "Lucas Ferrari",
    resumoQualificacao: "Demonstração técnica do agente de prospecção e mapa de leads.",
  },
  {
    id: "reu-19",
    titulo: "Acompanhamento",
    empresaOuLead: "Vendedor",
    responsavel: "Vendedor",
    diaSemana: 4,
    horaInicio: "10:30",
    horaFim: "11:30",
    categoria: "followup",
    cor: "vermelho",
    isOnline: false,
    status: "confirmada",
  },
  {
    id: "reu-20",
    titulo: "Reunião Comercial",
    empresaOuLead: "Imobiliária Ideal",
    responsavel: "Vendedor",
    diaSemana: 4,
    horaInicio: "13:00",
    horaFim: "14:00",
    categoria: "comercial",
    cor: "azul",
    isOnline: false,
    status: "confirmada",
    leadNome: "Rodrigo Antunes",
    resumoQualificacao: "Mapeamento de 2.000 proprietários de imóveis na região Sul.",
  },
  {
    id: "reu-21",
    titulo: "Análise de Resultados",
    empresaOuLead: "CEO de IA",
    responsavel: "CEO de IA",
    diaSemana: 4,
    horaInicio: "15:30",
    horaFim: "16:30",
    categoria: "estrategia",
    cor: "roxo",
    isOnline: false,
    status: "confirmada",
  },

  // Sábado (25 Out)
  {
    id: "reu-22",
    titulo: "Prospecção",
    empresaOuLead: "SDR",
    responsavel: "SDR",
    diaSemana: 5,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "prospeccao",
    cor: "roxo",
    isOnline: true,
    status: "confirmada",
  },

  // Domingo (26 Out)
  {
    id: "reu-23",
    titulo: "Planejamento",
    empresaOuLead: "CEO de IA",
    responsavel: "CEO de IA",
    diaSemana: 6,
    horaInicio: "09:00",
    horaFim: "10:00",
    categoria: "planejamento",
    cor: "cinza",
    isOnline: false,
    status: "confirmada",
  },
];

// ---------------------------------------------------------------------------
// 4. AGENTES DA EQUIPE (DISPONIBILIDADE)
// ---------------------------------------------------------------------------
export const AGENTES_DISPONIBILIDADE_INICIAIS: AgenteDisponibilidadeItem[] = [
  {
    id: "ceo",
    nome: "CEO de IA",
    cargo: "Orquestrador",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    isCeo: true,
    status: "disponivel",
    statusTexto: "Disponível",
  },
  {
    id: "estrategista",
    nome: "Estrategista",
    cargo: "Planejamento",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    status: "em_reuniao",
    statusTexto: "Em reunião até 11:00",
  },
  {
    id: "sdr",
    nome: "SDR",
    cargo: "Qualificador",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    status: "disponivel",
    statusTexto: "Disponível",
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    cargo: "Closer",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    status: "em_reuniao",
    statusTexto: "Em reunião até 15:00",
  },
  {
    id: "seo",
    nome: "SEO Geral",
    cargo: "Otimizador",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    status: "disponivel",
    statusTexto: "Disponível",
  },
  {
    id: "gerente",
    nome: "Gerente Comercial",
    cargo: "Supervisor",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    status: "em_reuniao",
    statusTexto: "Em reunião até 14:00",
  },
];

// ---------------------------------------------------------------------------
// 5. PRÓXIMAS REUNIÕES (CARD INFERIOR ESQUERDO)
// ---------------------------------------------------------------------------
export const PROXIMAS_REUNIOES_INICIAIS: ProximaReuniaoItem[] = [
  {
    id: "prox-1",
    horario: "09:00",
    titulo: "Apresentação Comercial",
    empresa: "Clínica Sorriso Saúde",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    tempoRestante: "Agora",
    badgeTipo: "agora",
    corBadgeHora: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    id: "prox-2",
    horario: "10:00",
    titulo: "Reunião com Parceiro",
    empresa: "Agência Criativa",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    tempoRestante: "Em 38 min",
    badgeTipo: "proxima",
    corBadgeHora: "bg-neutral-800 text-neutral-300 border-neutral-700",
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "prox-3",
    horario: "11:00",
    titulo: "Prospecção LinkedIn",
    empresa: "SDR",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    tempoRestante: "Em 1h 38min",
    badgeTipo: "hoje",
    corBadgeHora: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "prox-4",
    horario: "13:30",
    titulo: "Análise de Leads",
    empresa: "SDR",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    tempoRestante: "Em 4h 8min",
    badgeTipo: "hoje",
    corBadgeHora: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "prox-5",
    horario: "15:00",
    titulo: "Onboarding Cliente",
    empresa: "Ecommerce Plus",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    tempoRestante: "Em 5h 38min",
    badgeTipo: "hoje",
    corBadgeHora: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

// ---------------------------------------------------------------------------
// 6. TAREFAS RELACIONADAS (CARD INFERIOR CENTRAL)
// ---------------------------------------------------------------------------
export const TAREFAS_RELACIONADAS_INICIAIS: TarefaRelacionadaItem[] = [
  {
    id: "tar-1",
    titulo: "Preparar apresentação da Clínica Sorriso",
    prazoHora: "Hoje 08:30",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    concluida: true,
  },
  {
    id: "tar-2",
    titulo: "Analisar perfil do lead",
    prazoHora: "Hoje 10:00",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    concluida: false,
  },
  {
    id: "tar-3",
    titulo: "Enviar proposta comercial",
    prazoHora: "Hoje 14:00",
    avatarResponsavel: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    concluida: false,
  },
  {
    id: "tar-4",
    titulo: "Atualizar CRM com novo contato",
    prazoHora: "Hoje 16:00",
    avatarResponsavel: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    concluida: false,
  },
  {
    id: "tar-5",
    titulo: "Revisar materiais da próxima reunião",
    prazoHora: "Hoje 17:00",
    avatarResponsavel: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    concluida: false,
  },
];

// ---------------------------------------------------------------------------
// 7. ESTATÍSTICAS DA AGENDA (CARD INFERIOR DIREITO)
// ---------------------------------------------------------------------------
export const ESTATISTICAS_AGENDA_INICIAIS: EstatisticaAgendaItem[] = [
  {
    id: "est-1",
    rotulo: "Reuniões realizadas",
    valor: "56",
    mudanca: "+24%",
    positivo: true,
    icon: CalendarCheck,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
    sparkline: [30, 42, 38, 48, 52, 49, 56],
  },
  {
    id: "est-2",
    rotulo: "Taxa de comparecimento",
    valor: "94%",
    mudanca: "+8%",
    positivo: true,
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
    sparkline: [88, 89, 91, 90, 93, 92, 94],
  },
  {
    id: "est-3",
    rotulo: "Tempo total em reuniões",
    valor: "12h 30min",
    mudanca: "-12%",
    positivo: false,
    icon: Clock,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
    sparkline: [16, 15, 14, 13, 14, 13, 12.5],
  },
  {
    id: "est-4",
    rotulo: "Avaliação média",
    valor: "4.8",
    mudanca: "+12%",
    positivo: true,
    icon: Star,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
    sparkline: [4.2, 4.4, 4.5, 4.6, 4.7, 4.7, 4.8],
  },
];
