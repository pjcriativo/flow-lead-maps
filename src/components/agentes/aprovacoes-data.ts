// Catálogo e Tipagem da Tela 11 — Aprovações & Histórico
// Dados demonstrativos com máxima fidelidade visual ao layout aprovado (media_1792741493656.jpg).
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Database,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Globe,
  HardDrive,
  Headphones,
  History,
  Layers,
  LayoutGrid,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Percent,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wrench,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorAprovacao {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export type StatusAprovacao = "pendente" | "aprovado" | "rejeitado" | "em_execucao" | "aguardando_info";

export interface SolicitacaoAprovacaoItem {
  id: string;
  numero: string; // Ex: "#241"
  titulo: string;
  subtitulo: string;
  agenteNome: string;
  agenteCargo: string;
  agenteAvatar: string;
  tipo: "campanha" | "prospeccao" | "reunioes" | "propostas" | "integracao" | "treinamento" | "meta" | "equipe";
  tipoRotulo: string;
  corTipo: "roxo" | "azul" | "verde" | "indigo" | "laranja" | "rosa";
  valorOuImpacto: string;
  valorSub: string;
  status: StatusAprovacao;
  solicitadoEm: string;
  descricaoCompleta: string;
  orcamento?: string;
  periodo?: string;
  canais?: string[];
  publicoAlvo?: string;
  objetivo?: string;
  anexos?: {
    nome: string;
    tamanho: string;
    tipo: "pdf" | "xlsx" | "json";
  }[];
}

export interface AcaoHistoricoItem {
  id: string;
  data: string;
  agente: string;
  acao: string;
  tipo: string;
  resultado: "Sucesso" | "Pendente" | "Falha";
  responsavel: string;
}

export interface TopAgenteSolicitacao {
  id: string;
  nome: string;
  avatarUrl: string;
  solicitacoes: number;
  porcentagem: number;
}

// ---------------------------------------------------------------------------
// 1. INDICADORES DO HERO CARD (CEO DE IA)
// ---------------------------------------------------------------------------
export const INDICADORES_SUPERIORES_APROVACOES: IndicadorSuperiorAprovacao[] = [
  {
    id: "pendentes",
    rotulo: "Pendentes de aprovação",
    valor: "8",
    sub: "+3 hoje",
    icon: ShieldAlert,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "aprovadas",
    rotulo: "Aprovadas",
    valor: "156",
    sub: "+12% este mês",
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "rejeitadas",
    rotulo: "Rejeitadas",
    valor: "12",
    sub: "-25% este mês",
    icon: XCircle,
    corIcone: "text-rose-400",
    corBg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "em_execucao",
    rotulo: "Em execução",
    valor: "24",
    sub: "+18% este mês",
    icon: Play,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
];

// Histograma de ações dos últimos 30 dias (hero card)
export const HISTOGRAMA_ACOES_30_DIAS = [
  4, 6, 8, 5, 9, 12, 10, 8, 14, 16, 12, 15, 18, 14, 16, 20, 18, 22, 19, 21, 24, 20, 22, 25, 21, 23, 26, 24, 28, 30,
];

// ---------------------------------------------------------------------------
// 2. SOLICITAÇÕES DE APROVAÇÃO INICIAIS (TABELA CENTRAL)
// ---------------------------------------------------------------------------
export const SOLICITACOES_INICIAIS: SolicitacaoAprovacaoItem[] = [
  {
    id: "sol-241",
    numero: "#241",
    titulo: "Criar campanha no Meta Ads",
    subtitulo: "Campanha para clínicas odontológicas",
    agenteNome: "Estrategista",
    agenteCargo: "Planejamento e marketing",
    agenteAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    tipo: "campanha",
    tipoRotulo: "Campanha",
    corTipo: "roxo",
    valorOuImpacto: "R$ 2.000",
    valorSub: "Orçamento mensal",
    status: "pendente",
    solicitadoEm: "Hoje 14:32",
    descricaoCompleta:
      "Criação de campanha no Meta Ads para captação de leads de clínicas odontológicas em Curitiba, com orçamento inicial de R$ 2.000,00 e duração de 30 dias.",
    orcamento: "R$ 2.000,00",
    periodo: "30 dias (01/11/2026 - 30/11/2026)",
    canais: ["Facebook", "Instagram"],
    publicoAlvo: "Clínicas odontológicas • Curitiba - PR",
    objetivo: "Gerar leads qualificados para o time de vendas.",
    anexos: [
      { nome: "Briefing_Campanha.pdf", tamanho: "320 KB", tipo: "pdf" },
      { nome: "Publicos_Alvo.xlsx", tamanho: "145 KB", tipo: "xlsx" },
    ],
  },
  {
    id: "sol-240",
    numero: "#240",
    titulo: "Aprovar lista de 500 leads",
    subtitulo: "Nicho: Imobiliárias - Curitiba",
    agenteNome: "Prospecção",
    agenteCargo: "Captação ativa",
    agenteAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    tipo: "prospeccao",
    tipoRotulo: "Prospecção",
    corTipo: "azul",
    valorOuImpacto: "500 leads",
    valorSub: "Ação em massa",
    status: "pendente",
    solicitadoEm: "Hoje 11:20",
    descricaoCompleta:
      "Extração validada de 500 imobiliárias e corretores autônomos na região de Curitiba, com telefones WhatsApp verificados prontos para abordagem.",
    orcamento: "Consumo de 500 créditos",
    periodo: "Esta semana",
    canais: ["Google Maps", "WhatsApp"],
    publicoAlvo: "Imobiliárias e corretores credenciados",
    objetivo: "Alimentar a esteira do SDR com novos contatos quentes.",
  },
  {
    id: "sol-239",
    numero: "#239",
    titulo: "Agendar 20 reuniões",
    subtitulo: "Leads qualificados",
    agenteNome: "SDR",
    agenteCargo: "Qualificação comercial",
    agenteAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    tipo: "reunioes",
    tipoRotulo: "Reuniões",
    corTipo: "verde",
    valorOuImpacto: "20 reuniões",
    valorSub: "Esta semana",
    status: "pendente",
    solicitadoEm: "Hoje 09:15",
    descricaoCompleta:
      "Aprovação de alocação de horários nos calendários dos closers para 20 reuniões de demonstração já pré-qualificadas com score > 80.",
    orcamento: "Sem custo financeiro direto",
    periodo: "Semana corrente",
    canais: ["Agenda Inteligente", "WhatsApp"],
    publicoAlvo: "Leads B2B com faturamento > R$ 50k",
    objetivo: "Garantir taxa de comparecimento superior a 90%.",
  },
  {
    id: "sol-238",
    numero: "#238",
    titulo: "Enviar propostas comerciais",
    subtitulo: "Leads da semana",
    agenteNome: "Vendedor",
    agenteCargo: "Closer de vendas",
    agenteAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    tipo: "propostas",
    tipoRotulo: "Propostas",
    corTipo: "indigo",
    valorOuImpacto: "12 propostas",
    valorSub: "Pipeline ativo",
    status: "aprovado",
    solicitadoEm: "Ontem 16:40",
    descricaoCompleta:
      "Disparo de propostas comerciais customizadas com condições especiais para os leads atendidos na rodada de reuniões de ontem.",
    orcamento: "R$ 45.000 em pipeline",
    periodo: "Até sexta-feira",
    canais: ["E-mail", "WhatsApp"],
    publicoAlvo: "Decisores comerciais",
    objetivo: "Fechamento de contratos da meta semanal.",
  },
  {
    id: "sol-237",
    numero: "#237",
    titulo: "Acessar dados do Google Maps",
    subtitulo: "Busca em 5 cidades",
    agenteNome: "SEO Geral",
    agenteCargo: "Otimizador e dados",
    agenteAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    tipo: "integracao",
    tipoRotulo: "Integração",
    corTipo: "azul",
    valorOuImpacto: "5 cidades",
    valorSub: "Google Maps",
    status: "pendente",
    solicitadoEm: "Ontem 14:20",
    descricaoCompleta:
      "Solicitação de autorização para consumir a API do Google Maps para mapear academias e estúdios fitness em 5 cidades do Sul do Brasil.",
    orcamento: "Consumo de API",
    periodo: "Execução única",
    canais: ["Google Maps Places API"],
    publicoAlvo: "Academias, estúdios pilates e crossfit",
    objetivo: "Identificar oportunidades sem automação de agendamentos.",
  },
  {
    id: "sol-236",
    numero: "#236",
    titulo: "Treinamento de novos agentes",
    subtitulo: "Módulo de vendas",
    agenteNome: "CEO de IA",
    agenteCargo: "Orquestrador Geral",
    agenteAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    tipo: "treinamento",
    tipoRotulo: "Treinamento",
    corTipo: "laranja",
    valorOuImpacto: "2 agentes",
    valorSub: "Atualização RAG",
    status: "aprovado",
    solicitadoEm: "Ontem 10:30",
    descricaoCompleta:
      "Atualização da base de conhecimento dos agentes SDR e Closer com novos scripts de quebra de objeções e diretrizes de precificação.",
    orcamento: "Interno",
    periodo: "Imediato",
    canais: ["Base de Conhecimento", "Memória"],
    publicoAlvo: "Equipe comercial de IA",
    objetivo: "Elevar a taxa de conversão das demonstrações.",
  },
  {
    id: "sol-235",
    numero: "#235",
    titulo: "Ajustar meta de leads",
    subtitulo: "Aumento de 30%",
    agenteNome: "CEO de IA",
    agenteCargo: "Orquestrador Geral",
    agenteAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    tipo: "meta",
    tipoRotulo: "Meta",
    corTipo: "rosa",
    valorOuImpacto: "+30%",
    valorSub: "Meta trimestral",
    status: "em_execucao",
    solicitadoEm: "18/10 14:10",
    descricaoCompleta:
      "Ajuste operacional das metas semanais no módulo de Planejamento para acompanhar a meta estratégica do Plano de Vendas Q4.",
    orcamento: "R$ 750.000 projetados",
    periodo: "Q4 2026",
    canais: ["Planejamento & Metas"],
    publicoAlvo: "Toda a equipe de agentes",
    objetivo: "Alinhar o volume de prospecção à meta de receita.",
  },
  {
    id: "sol-234",
    numero: "#234",
    titulo: "Contratar agente adicional",
    subtitulo: "Analista de Dados",
    agenteNome: "Estrategista",
    agenteCargo: "Planejamento e marketing",
    agenteAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    tipo: "equipe",
    tipoRotulo: "Equipe",
    corTipo: "azul",
    valorOuImpacto: "1 agente",
    valorSub: "Novo membro",
    status: "rejeitado",
    solicitadoEm: "18/10 11:05",
    descricaoCompleta:
      "Solicitação de provisionamento de um novo agente digital focado exclusivamente em auditoria e relatórios de cohort.",
    orcamento: "Revisão orçamentária pendente",
    periodo: "Contratação permanente",
    canais: ["Equipe & Enxames"],
    publicoAlvo: "Operação comercial",
    objetivo: "Reduzir o tempo de análise manual dos fluxos.",
  },
];

// ---------------------------------------------------------------------------
// 3. CARDS INFERIORES: AÇÕES POR TIPO, HISTÓRICO E TOP AGENTES
// ---------------------------------------------------------------------------
export const ACOES_POR_TIPO = [
  { rotulo: "Campanhas", porcentagem: 28, cor: "#a855f7" }, // purple
  { rotulo: "Prospecção", porcentagem: 22, cor: "#3b82f6" }, // blue
  { rotulo: "Reuniões", porcentagem: 18, cor: "#10b981" }, // emerald
  { rotulo: "Propostas", porcentagem: 14, cor: "#6366f1" }, // indigo
  { rotulo: "Integrações", porcentagem: 10, cor: "#06b6d4" }, // cyan
  { rotulo: "Treinamentos", porcentagem: 6, cor: "#f97316" }, // orange
  { rotulo: "Outros", porcentagem: 2, cor: "#6b7280" }, // gray
];

export const PONTOS_HISTORICO_APROVACOES = [
  { data: "01/10", aprovadas: 18, rejeitadas: 2, pendentes: 4 },
  { data: "05/10", aprovadas: 22, rejeitadas: 1, pendentes: 6 },
  { data: "10/10", aprovadas: 26, rejeitadas: 3, pendentes: 5 },
  { data: "15/10", aprovadas: 20, rejeitadas: 2, pendentes: 8 },
  { data: "20/10", aprovadas: 25, rejeitadas: 4, pendentes: 7 },
  { data: "25/10", aprovadas: 28, rejeitadas: 2, pendentes: 6 },
  { data: "30/10", aprovadas: 32, rejeitadas: 1, pendentes: 8 },
];

export const TOP_AGENTES_SOLICITACOES: TopAgenteSolicitacao[] = [
  {
    id: "estrategista",
    nome: "Estrategista",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    solicitacoes: 48,
    porcentagem: 25,
  },
  {
    id: "sdr",
    nome: "SDR",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    solicitacoes: 42,
    porcentagem: 22,
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    solicitacoes: 38,
    porcentagem: 20,
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    solicitacoes: 32,
    porcentagem: 17,
  },
  {
    id: "ceo",
    nome: "CEO de IA",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    solicitacoes: 18,
    porcentagem: 9,
  },
];
