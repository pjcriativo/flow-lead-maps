// Catálogo e Tipagem da Tela 10 — Copiloto do CEO de IA
// Dados demonstrativos com máxima fidelidade visual ao layout aprovado (media_1792739962352.jpg).
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Database,
  DollarSign,
  Eye,
  FileCheck,
  FileCode,
  FileSpreadsheet,
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
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorCopiloto {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface ConversaRecenteItem {
  id: string;
  titulo: string;
  subtitulo: string;
  horario: string;
  selecionada?: boolean;
  categoria?: "estrategia" | "mercado" | "campanhas" | "treinamento" | "relatorios" | "metas" | "automacao";
}

export interface MensagemChat {
  id: string;
  remetente: "usuario" | "ceo";
  nome: string;
  avatar?: string;
  horario: string;
  conteudo: string;
  planoId?: string;
}

export interface PlanoVendasResumo {
  id: string;
  titulo: string;
  metaPrincipal: string;
  receitaProjetada: string;
  receitaVariacao: string;
  equipeDescricao: string;
  equipeAgentes: string;
  nichos: string[];
  nichoSelecionado: string;
  estrategias: string[];
  arquivos: {
    nome: string;
    subtitulo: string;
    tipo: "pdf" | "xlsx" | "json";
  }[];
}

export interface AcaoRapidaItem {
  id: string;
  rotulo: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
  destinoTela?: string;
}

export interface AgenteDisponivelCopiloto {
  id: string;
  nome: string;
  cargo: string;
  avatarUrl: string;
  online: boolean;
  especialidade: string;
}

export interface ContextoComercial {
  planoDeVendas: string;
  metaPrincipal: string;
  orcamentoMensal: string;
  nichosAtivos: string;
  campanhasEmAndamento: string;
  agentesOperacionais: string;
  ultimaAtualizacao: string;
}

// ---------------------------------------------------------------------------
// 1. INDICADORES DO HERO CARD (CEO DE IA)
// ---------------------------------------------------------------------------
export const INDICADORES_SUPERIORES_COPILOTO: IndicadorSuperiorCopiloto[] = [
  {
    id: "planos_criados",
    rotulo: "Planos criados",
    valor: "12",
    sub: "+3 este mês",
    icon: Sparkles,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "acoes_executadas",
    rotulo: "Ações executadas",
    valor: "248",
    sub: "+28% este mês",
    icon: Zap,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "taxa_aprovacao",
    rotulo: "Taxa de aprovação",
    valor: "94%",
    sub: "+6% este mês",
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "economia_tempo",
    rotulo: "Economia de tempo",
    valor: "32h",
    sub: "+42% este mês",
    icon: Clock,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
];

// ---------------------------------------------------------------------------
// 2. CONVERSAS RECENTES (COLUNA ESQUERDA)
// ---------------------------------------------------------------------------
export const CONVERSAS_RECENTES_INICIAIS: ConversaRecenteItem[] = [
  {
    id: "conv-1",
    titulo: "Plano de vendas Q4",
    subtitulo: "Estratégia e metas comerciais",
    horario: "14:32",
    selecionada: true,
    categoria: "estrategia",
  },
  {
    id: "conv-2",
    titulo: "Análise de concorrentes",
    subtitulo: "Estudo de mercado",
    horario: "10:15",
    categoria: "mercado",
  },
  {
    id: "conv-3",
    titulo: "Otimização de campanhas",
    subtitulo: "Meta Ads e Google Ads",
    horario: "Ontem",
    categoria: "campanhas",
  },
  {
    id: "conv-4",
    titulo: "Treinamento da equipe",
    subtitulo: "Novos agentes SDR",
    horario: "Ontem",
    categoria: "treinamento",
  },
  {
    id: "conv-5",
    titulo: "Relatório semanal",
    subtitulo: "Resultados da operação",
    horario: "18/10",
    categoria: "relatorios",
  },
  {
    id: "conv-6",
    titulo: "Estratégia de prospecção",
    subtitulo: "Nicho: Clínicas Odontológicas",
    horario: "17/10",
    categoria: "estrategia",
  },
  {
    id: "conv-7",
    titulo: "Revisão de metas",
    subtitulo: "Ajustes no planejamento",
    horario: "16/10",
    categoria: "metas",
  },
  {
    id: "conv-8",
    titulo: "Automação de follow-up",
    subtitulo: "Sequência de mensagens",
    horario: "15/10",
    categoria: "automacao",
  },
];

// ---------------------------------------------------------------------------
// 3. PLANO DE VENDAS EM DESTAQUE (CARD CENTRAL INTERATIVO)
// ---------------------------------------------------------------------------
export const PLANO_VENDAS_Q4: PlanoVendasResumo = {
  id: "plano-q4-2026",
  titulo: "Plano de Vendas — Q4 2026",
  metaPrincipal: "+30% em vendas no próximo trimestre",
  receitaProjetada: "R$ 750.000",
  receitaVariacao: "+ R$ 175.000",
  equipeDescricao: "5 agentes",
  equipeAgentes: "CEO, SDR, Vendedor, Estrategista, Analista de Dados",
  nichos: [
    "Clínicas Odontológicas",
    "Imobiliárias",
    "Academias",
    "Restaurantes",
    "E-commerces",
  ],
  nichoSelecionado: "Clínicas Odontológicas",
  estrategias: [
    "Prospecção ativa multicanal (Google Maps, Instagram, LinkedIn)",
    "Campanhas de anúncios segmentadas (Meta Ads e Google Ads)",
    "Follow-up automatizado com agentes SDR",
    "Agendamento inteligente de reuniões",
    "Propostas personalizadas com IA",
  ],
  arquivos: [
    {
      nome: "Plano_Completo_Q4.pdf",
      subtitulo: "12 páginas",
      tipo: "pdf",
    },
    {
      nome: "Metas_Semanais.xlsx",
      subtitulo: "Planilha de metas",
      tipo: "xlsx",
    },
    {
      nome: "Fluxos_Automatizados.json",
      subtitulo: "Configuração",
      tipo: "json",
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. MENSAGENS INICIAIS DO CHAT
// ---------------------------------------------------------------------------
export const MENSAGENS_CHAT_INICIAIS: MensagemChat[] = [
  {
    id: "msg-1",
    remetente: "usuario",
    nome: "Marcos Gonçalves",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    horario: "14:32",
    conteudo:
      "Quero aumentar as vendas em 30% no próximo trimestre. Monte um plano completo de ação com nichos, estratégias, agentes, campanhas e metas semanais.",
  },
  {
    id: "msg-2",
    remetente: "ceo",
    nome: "CEO de IA",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    horario: "14:33",
    conteudo:
      "Perfeito, Marcos! Vou criar um plano completo para aumentar as vendas em 30% no próximo trimestre. Aqui está a proposta estruturada com todos os detalhes:",
    planoId: "plano-q4-2026",
  },
];

// ---------------------------------------------------------------------------
// 5. AÇÕES RÁPIDAS (COLUNA DIREITA)
// ---------------------------------------------------------------------------
export const ACOES_RAPIDAS_COPILOTO: AcaoRapidaItem[] = [
  {
    id: "criar_plano",
    rotulo: "Criar plano de vendas",
    icon: Target,
    corIcone: "text-rose-400",
    corBg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "analisar_concorrentes",
    rotulo: "Analisar concorrentes",
    icon: BarChart3,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "otimizar_campanhas",
    rotulo: "Otimizar campanhas",
    icon: Megaphone,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "gerar_relatorios",
    rotulo: "Gerar relatórios",
    icon: FileText,
    corIcone: "text-sky-400",
    corBg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    id: "recrutar_agentes",
    rotulo: "Recrutar agentes",
    icon: UserPlus,
    corIcone: "text-cyan-400",
    corBg: "bg-cyan-500/10 border-cyan-500/20",
    destinoTela: "equipe",
  },
  {
    id: "configurar_automacoes",
    rotulo: "Configurar automações",
    icon: Settings,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
    destinoTela: "fluxos",
  },
  {
    id: "revisar_metas",
    rotulo: "Revisar metas",
    icon: Trophy,
    corIcone: "text-yellow-400",
    corBg: "bg-yellow-500/10 border-yellow-500/20",
    destinoTela: "planejamento",
  },
  {
    id: "analisar_mercado",
    rotulo: "Analisar mercado",
    icon: Search,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
];

// ---------------------------------------------------------------------------
// 6. AGENTES DISPONÍVEIS (COLUNA DIREITA)
// ---------------------------------------------------------------------------
export const AGENTES_DISPONIVEIS_COPILOTO: AgenteDisponivelCopiloto[] = [
  {
    id: "ceo",
    nome: "CEO de IA",
    cargo: "Estratégia e gestão",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    online: true,
    especialidade: "Orquestrador Geral",
  },
  {
    id: "estrategista",
    nome: "Estrategista",
    cargo: "Planejamento e marketing",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    online: true,
    especialidade: "Growth & Campanhas",
  },
  {
    id: "sdr",
    nome: "SDR",
    cargo: "Prospecção e qualificação",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    online: true,
    especialidade: "Qualificação de Leads",
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    cargo: "Reuniões e propostas",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    online: true,
    especialidade: "Fechamento Comercial",
  },
  {
    id: "analista",
    nome: "Analista de Dados",
    cargo: "Relatórios e insights",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    online: true,
    especialidade: "KPIs e Métricas",
  },
];

// ---------------------------------------------------------------------------
// 7. CONTEXTO ATUAL (COLUNA DIREITA)
// ---------------------------------------------------------------------------
export const CONTEXTO_ATUAL_INICIAL: ContextoComercial = {
  planoDeVendas: "Q4 2026",
  metaPrincipal: "+30% em vendas",
  orcamentoMensal: "R$ 20.000",
  nichosAtivos: "5 nichos",
  campanhasEmAndamento: "3 campanhas",
  agentesOperacionais: "5 agentes",
  ultimaAtualizacao: "Hoje às 14:33",
};

// ---------------------------------------------------------------------------
// 8. ATALHOS RÁPIDOS ABAIXO DO CHAT
// ---------------------------------------------------------------------------
export const ATALHOS_ABAIXO_CHAT = [
  { id: "resultado", rotulo: "Analisar resultado da semana" },
  { id: "ajustar_metas", rotulo: "Ajustar metas" },
  { id: "criar_campanha", rotulo: "Criar nova campanha" },
  { id: "revisar_equipe", rotulo: "Revisar equipe" },
  { id: "gerar_relatorio", rotulo: "Gerar relatório" },
];
