import {
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Crown,
  FileCheck,
  FileText,
  Filter,
  Globe,
  Handshake,
  Heart,
  Layers,
  Lightbulb,
  Mic,
  MoreVertical,
  Radio,
  Search,
  ShieldCheck,
  Target,
  UserCheck,
  UserRoundSearch,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface AgenteOperacional {
  id: string;
  nome: string;
  funcao: string;
  descricao: string;
  avatarUrl: string;
  status: "Online" | "Ocupado" | "Offline";
  tarefasCount: number;
  icon: LucideIcon;
  cor: string;
  subtituloEnxame: string;
  iconeEnxame: LucideIcon;
}

export const CEO_AGENTE_DATA: AgenteOperacional = {
  id: "ceo",
  nome: "CEO de IA",
  funcao: "Orquestrador Geral",
  descricao:
    "Planeja, coordena e impulsiona toda a operação comercial. Define estratégias, delega tarefas, acompanha metas e garante resultados.",
  avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
  status: "Online",
  tarefasCount: 12,
  icon: Crown,
  cor: "text-home-orange",
  subtituloEnxame: "Orquestra o enxame",
  iconeEnxame: Crown,
};

export const EQUIPE_AGENTES_DATA: AgenteOperacional[] = [
  CEO_AGENTE_DATA,
  {
    id: "estrategista",
    nome: "Estrategista",
    funcao: "Planejamento e Mercado",
    descricao: "Analisa nichos, planeja campanhas e recomenda ajustes.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefasCount: 8,
    icon: Lightbulb,
    cor: "text-purple-400",
    subtituloEnxame: "Planeja",
    iconeEnxame: Lightbulb,
  },
  {
    id: "sdr",
    nome: "SDR",
    funcao: "Qualificação de Leads",
    descricao: "Qualifica contatos, prepara abordagem e agenda reuniões.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefasCount: 18,
    icon: UserRoundSearch,
    cor: "text-blue-400",
    subtituloEnxame: "Qualifica",
    iconeEnxame: UserRoundSearch,
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    funcao: "Negociação",
    descricao: "Conduz conversas comerciais e prepara propostas.",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefasCount: 14,
    icon: Handshake,
    cor: "text-amber-400",
    subtituloEnxame: "Conduz",
    iconeEnxame: Handshake,
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    funcao: "Busca e Lista de Leads",
    descricao: "Busca empresas, deduplica e entrega listas ao SDR.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefasCount: 11,
    icon: Search,
    cor: "text-sky-400",
    subtituloEnxame: "Busca leads",
    iconeEnxame: Search,
  },
  {
    id: "seo",
    nome: "SEO Geral",
    funcao: "Conteúdo e Visibilidade",
    descricao: "Coordena o setor de SEO e seus subagentes.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefasCount: 9,
    icon: BarChart3,
    cor: "text-emerald-400",
    subtituloEnxame: "Gera demanda",
    iconeEnxame: Globe,
  },
  {
    id: "gerente",
    nome: "Gerente Comercial",
    funcao: "Metas e Performance",
    descricao: "Supervisiona o pipeline, as metas e a qualidade.",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefasCount: 7,
    icon: Target,
    cor: "text-rose-400",
    subtituloEnxame: "Acompanha",
    iconeEnxame: ShieldCheck,
  },
];

export interface ItemPlanoSemanal {
  dia: string;
  nicho: string;
  canais: string;
  metaLeads: number;
  status: "concluido" | "em_andamento" | "pendente";
}

export const PLANO_SEMANAL_DATA: ItemPlanoSemanal[] = [
  {
    dia: "Seg",
    nicho: "Clínicas Odontológicas",
    canais: "LinkedIn + WhatsApp",
    metaLeads: 300,
    status: "concluido",
  },
  {
    dia: "Ter",
    nicho: "Imobiliárias",
    canais: "Google Maps + E-mail",
    metaLeads: 250,
    status: "em_andamento",
  },
  {
    dia: "Qua",
    nicho: "Academias e Fitness",
    canais: "Instagram + WhatsApp",
    metaLeads: 250,
    status: "pendente",
  },
  {
    dia: "Qui",
    nicho: "Escritórios de Advocacia",
    canais: "LinkedIn + E-mail",
    metaLeads: 300,
    status: "pendente",
  },
  {
    dia: "Sex",
    nicho: "Bares e Restaurantes",
    canais: "Google Maps + WhatsApp",
    metaLeads: 250,
    status: "pendente",
  },
];

export const FLUXO_OPERACAO_DATA = [
  {
    id: "prospeccao",
    titulo: "Prospecção",
    sub1: "Busca de leads",
    sub2: "(CEO + Prospecção)",
    icon: Search,
    corBadge: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  },
  {
    id: "qualificacao",
    titulo: "Qualificação",
    sub1: "SDR",
    sub2: "(IA + Filtros)",
    icon: Filter,
    corBadge: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  },
  {
    id: "reuniao",
    titulo: "Reunião",
    sub1: "Agendamento",
    sub2: "(IA + Agenda)",
    icon: CalendarCheck,
    corBadge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  },
  {
    id: "vendedor",
    titulo: "Vendedor",
    sub1: "Apresentação",
    sub2: "(IA + Scripts)",
    icon: Handshake,
    corBadge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  },
  {
    id: "fechamento",
    titulo: "Fechamento",
    sub1: "Proposta e Assinatura",
    sub2: "(IA + Follow-up)",
    icon: FileCheck,
    corBadge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  },
];

export const METAS_RESULTADOS_DATA = [
  {
    rotulo: "Leads prospectados",
    atual: 1248,
    meta: 2000,
    porcentagem: 62,
    icon: Users,
  },
  {
    rotulo: "Reuniões agendadas",
    atual: 56,
    meta: 100,
    porcentagem: 56,
    icon: Calendar,
  },
  {
    rotulo: "Propostas enviadas",
    atual: 28,
    meta: 80,
    porcentagem: 35,
    icon: FileText,
  },
  {
    rotulo: "Vendas fechadas",
    atual: 12,
    meta: 50,
    porcentagem: 24,
    icon: CheckCircle2,
  },
];

export const ATIVIDADES_RECENTES_DATA = [
  {
    id: "1",
    agente: "Prospecção",
    texto: "Criou 200 novos leads de clínicas odontológicas",
    tempo: "há 1 hora",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    corBadge: "text-sky-400",
  },
  {
    id: "2",
    agente: "Agendamento",
    texto: "Agendou 8 reuniões para esta semana",
    tempo: "há 1 hora",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    corBadge: "text-amber-400",
  },
  {
    id: "3",
    agente: "SDR",
    texto: "Qualificou 42 leads com score acima de 70",
    tempo: "há 2 horas",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    corBadge: "text-blue-400",
  },
  {
    id: "4",
    agente: "Vendedor",
    texto: "Enviou 5 propostas comerciais",
    tempo: "há 2 horas",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    corBadge: "text-emerald-400",
  },
];

export const CAPACIDADES_DATA = [
  {
    id: "memoria",
    titulo: "Memória e RAG",
    texto: "Contexto do seu negócio, clientes e histórico.",
    iconId: "memoria",
  },
  {
    id: "skills",
    titulo: "Skills e Ferramentas",
    texto: "Busca, análise, scraping e automações.",
    iconId: "skills",
  },
  {
    id: "voz",
    titulo: "Voz e Linguagem",
    texto: "Atendimento e ligações automáticas.",
    iconId: "voz",
  },
  {
    id: "sentimento",
    titulo: "Análise de Sentimento",
    texto: "Entende o interesse e qualifica melhor.",
    iconId: "sentimento",
  },
];

// Preserving legacy exports if anything imports them
export const CEO_AGENTE = CEO_AGENTE_DATA;
export const EQUIPE_AGENTES = EQUIPE_AGENTES_DATA;
export const FLUXO_OPERACIONAL = FLUXO_OPERACAO_DATA;
export const CAPACIDADES = CAPACIDADES_DATA;
