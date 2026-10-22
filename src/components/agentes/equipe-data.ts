import {
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Filter,
  Globe,
  Handshake,
  Heart,
  Layers,
  Lightbulb,
  Megaphone,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRoundSearch,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AgenteDetalhado {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  departamentoId: string;
  especialidade: string;
  avatarUrl: string;
  status: "Online" | "Trabalhando" | "Pausado" | "Em configuração";
  tarefas: number;
  metas: string;
  descricao: string;
  taxaSucesso: string;
  nivelAutonomia: "Alto" | "Supervisionado" | "Manual";
  isCeo?: boolean;
}

export const AGENTES_INICIAIS: AgenteDetalhado[] = [
  {
    id: "ceo",
    nome: "CEO de IA",
    cargo: "Orquestrador Geral",
    departamento: "Direção Executiva",
    departamentoId: "direcao",
    especialidade: "Estratégia, Gestão e Crescimento",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefas: 12,
    metas: "Coordenar 6 agentes e atingir 100% do plano semanal",
    descricao: "Planeja, coordena e impulsiona toda a operação comercial. Define metas, supervisiona os enxames e garante os fechamentos.",
    taxaSucesso: "98%",
    nivelAutonomia: "Alto",
    isCeo: true,
  },
  {
    id: "estrategista",
    nome: "Estrategista",
    cargo: "Planejamento e Mercado",
    departamento: "Estratégia",
    departamentoId: "estrategia",
    especialidade: "Análise de Nichos e Posicionamento",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefas: 8,
    metas: "5 estudos de mercado e revisão de abordagens",
    descricao: "Mapeia novos nichos de alto valor, avalia canais de aquisição e calibra os discursos de prospecção.",
    taxaSucesso: "94%",
    nivelAutonomia: "Alto",
  },
  {
    id: "gerente",
    nome: "Gerente Comercial",
    cargo: "Metas e Performance",
    departamento: "Gestão Comercial",
    departamentoId: "gestao",
    especialidade: "Auditoria de Pipeline e Conversão",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefas: 7,
    metas: "Garantir 50 propostas no pipeline e SLA < 15min",
    descricao: "Supervisiona a cadência de follow-up, identifica gargalos entre qualificação e apresentação e otimiza conversões.",
    taxaSucesso: "91%",
    nivelAutonomia: "Supervisionado",
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    cargo: "Busca e Captação",
    departamento: "Prospecção",
    departamentoId: "prospeccao",
    especialidade: "Mineração de Leads e Deduplicação",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    status: "Trabalhando",
    tarefas: 11,
    metas: "1.500 novos leads validados por semana",
    descricao: "Extrai, enriquece e limpa dados no Google Maps, LinkedIn e bases públicas, alimentando os cadernos do SDR.",
    taxaSucesso: "96%",
    nivelAutonomia: "Alto",
  },
  {
    id: "sdr",
    nome: "SDR",
    cargo: "Qualificação e Agendamento",
    departamento: "Pré-vendas",
    departamentoId: "pre-vendas",
    especialidade: "Abordagem Consultiva e Agenda",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    status: "Trabalhando",
    tarefas: 18,
    metas: "50 reuniões qualificadas agendadas/mês",
    descricao: "Inicia contato personalizado via WhatsApp e e-mail, responde dúvidas rápidas, aplica score BANT e agenda no calendário.",
    taxaSucesso: "89%",
    nivelAutonomia: "Supervisionado",
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    cargo: "Negociação e Fechamento",
    departamento: "Vendas",
    departamentoId: "vendas",
    especialidade: "Condução Comercial e Propostas",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefas: 14,
    metas: "20 contratos fechados no mês",
    descricao: "Prepara propostas personalizadas, envia orçamentos em PDF com assinatura eletrônica e executa follow-ups assertivos.",
    taxaSucesso: "93%",
    nivelAutonomia: "Supervisionado",
  },
  {
    id: "seo",
    nome: "SEO Geral",
    cargo: "Conteúdo e Visibilidade",
    departamento: "SEO e Marketing",
    departamentoId: "seo-marketing",
    especialidade: "Autoridade e Tráfego Orgânico",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    tarefas: 9,
    metas: "Garantir presença local nos mapas e páginas orgânicas",
    descricao: "Audita perfis no Google Business Profile, gera palavras-chave de cauda longa e posiciona a marca nos buscadores.",
    taxaSucesso: "90%",
    nivelAutonomia: "Alto",
  },
];

export interface DepartamentoItem {
  id: string;
  nome: string;
  lider: string;
  liderCargo: string;
  avatarLider: string;
  descricao: string;
  agentesCount: number;
  tarefasAtivas: number;
  objetivoPrincipal: string;
  corBadge: string;
  icon: LucideIcon;
}

export const DEPARTAMENTOS_DATA: DepartamentoItem[] = [
  {
    id: "direcao",
    nome: "Direção",
    lider: "CEO de IA",
    liderCargo: "Orquestrador Geral",
    avatarLider: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
    descricao: "Coordenação estratégica central, alocação de orçamento e orquestração de enxames.",
    agentesCount: 1,
    tarefasAtivas: 12,
    objetivoPrincipal: "Bater metas globais e otimizar margem da operação",
    corBadge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: Crown,
  },
  {
    id: "estrategia",
    nome: "Estratégia",
    lider: "Estrategista",
    liderCargo: "Planejamento e Mercado",
    avatarLider: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    descricao: "Inteligência competitiva, personas, testes de ofertas e planejamento comercial.",
    agentesCount: 1,
    tarefasAtivas: 8,
    objetivoPrincipal: "Encontrar nichos com ticket médio elevado e baixa fricção",
    corBadge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    icon: Lightbulb,
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    lider: "Prospecção",
    liderCargo: "Busca e Captação",
    avatarLider: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    descricao: "Mineração de novos clientes nos canais aprovados e validação cadastral.",
    agentesCount: 1,
    tarefasAtivas: 11,
    objetivoPrincipal: "Manter o funil sempre abastecido com leads verificados",
    corBadge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    icon: Search,
  },
  {
    id: "pre-vendas",
    nome: "Pré-vendas",
    lider: "SDR",
    liderCargo: "Qualificação e Agendamento",
    avatarLider: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    descricao: "Primeiro contato consultivo, triagem por score e marcação de reuniões.",
    agentesCount: 1,
    tarefasAtivas: 18,
    objetivoPrincipal: "Gerar reuniões com tomadores de decisão reais",
    corBadge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Filter,
  },
  {
    id: "vendas",
    nome: "Vendas",
    lider: "Vendedor",
    liderCargo: "Negociação e Fechamento",
    avatarLider: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    descricao: "Apresentação comercial, quebra de objeções, propostas e fechamentos.",
    agentesCount: 1,
    tarefasAtivas: 14,
    objetivoPrincipal: "Aumentar a taxa de conversão de propostas em contratos",
    corBadge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Handshake,
  },
  {
    id: "gestao",
    nome: "Gestão Comercial",
    lider: "Gerente Comercial",
    liderCargo: "Metas e Performance",
    avatarLider: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    descricao: "Controle de qualidade, conformidade com regras copiloto e auditoria de SLAs.",
    agentesCount: 1,
    tarefasAtivas: 7,
    objetivoPrincipal: "Garantir velocidade e conformidade em todas as interações",
    corBadge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: Target,
  },
  {
    id: "seo-marketing",
    nome: "SEO e Marketing",
    lider: "SEO Geral",
    liderCargo: "Conteúdo e Visibilidade",
    avatarLider: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    descricao: "Atração orgânica, presença institucional nos mapas e reputação digital.",
    agentesCount: 1,
    tarefasAtivas: 9,
    objetivoPrincipal: "Posicionar a empresa no topo do Google para buscas locais",
    corBadge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Globe,
  },
];

export interface EnxameItem {
  id: string;
  nome: string;
  liderResponsavel: string;
  departamento: string;
  objetivo: string;
  agentesParticipantes: { nome: string; cargo: string; avatarUrl: string }[];
  metas: string;
  estado: "Ativo" | "Em execução" | "Pausado";
  tarefas: number;
}

export const ENXAMES_DATA: EnxameItem[] = [
  {
    id: "enxame-outbound",
    nome: "Enxame Outbound B2B",
    liderResponsavel: "CEO de IA",
    departamento: "Prospecção & Pré-vendas",
    objetivo: "Captar 500 decisores odontológicos e de saúde semanalmente via Google Maps e LinkedIn.",
    agentesParticipantes: [
      { nome: "Prospecção", cargo: "Busca de Leads", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80" },
      { nome: "SDR", cargo: "Abordagem & Agenda", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
      { nome: "Estrategista", cargo: "Calibração de Scripts", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80" },
    ],
    metas: "50 reuniões agendadas / mês",
    estado: "Ativo",
    tarefas: 29,
  },
  {
    id: "enxame-fechamento",
    nome: "Enxame Negociação & Fechamento",
    liderResponsavel: "Gerente Comercial",
    departamento: "Vendas & Gestão",
    objetivo: "Receber reuniões agendadas, gerar propostas automáticas e executar follow-up ativo.",
    agentesParticipantes: [
      { nome: "Vendedor", cargo: "Apresentação & Proposta", avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80" },
      { nome: "Gerente Comercial", cargo: "Auditoria de SLA", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80" },
      { nome: "CEO de IA", cargo: "Orquestrador", avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80" },
    ],
    metas: "20 propostas aceitas / mês",
    estado: "Em execução",
    tarefas: 21,
  },
  {
    id: "enxame-reputacao",
    nome: "Enxame Reputação & Presença Orgânica",
    liderResponsavel: "CEO de IA",
    departamento: "SEO & Marketing",
    objetivo: "Otimizar avaliações, presença nos mapas locais e palavras-chave de alta conversão.",
    agentesParticipantes: [
      { nome: "SEO Geral", cargo: "Otimização & Mapas", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80" },
      { nome: "Estrategista", cargo: "Análise de Concorrentes", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80" },
    ],
    metas: "Top 3 local nos mapas da região metropolitana",
    estado: "Ativo",
    tarefas: 18,
  },
];

export interface BibliotecaAgenteItem {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  especialidade: string;
  avatarUrl: string;
  descricao: string;
  tempoAtivacao: string;
  nivelAutonomia: "Alto" | "Supervisionado";
  disponivel: boolean;
}

export const BIBLIOTECA_AGENTES_DATA: BibliotecaAgenteItem[] = [
  {
    id: "copywriter-b2b",
    nome: "Copywriter Comercial",
    cargo: "Redator de Pitch",
    departamento: "Estratégia",
    especialidade: "Mensagens de WhatsApp e E-mails persuasivos",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    descricao: "Cria variações A/B de abordagens frias com alta taxa de abertura e resposta.",
    tempoAtivacao: "Imediato",
    nivelAutonomia: "Alto",
    disponivel: true,
  },
  {
    id: "reativador-leads",
    nome: "Reativador de Base",
    cargo: "Especialista em Win-Back",
    departamento: "Pré-vendas",
    especialidade: "Recuperação de contatos antigos sem resposta",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    descricao: "Dispara mensagens contextuais de novidade para leads que esfriaram no pipeline.",
    tempoAtivacao: "Imediato",
    nivelAutonomia: "Supervisionado",
    disponivel: true,
  },
  {
    id: "pesquisador-decisores",
    nome: "Pesquisador de Decisores",
    cargo: "Auditor de Contatos",
    departamento: "Prospecção",
    especialidade: "Enriquecimento de Telefones e E-mails Diretos",
    avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
    descricao: "Identifica o sócio ou diretor responsável pela compra na empresa prospectada.",
    tempoAtivacao: "Imediato",
    nivelAutonomia: "Alto",
    disponivel: true,
  },
  {
    id: "assistente-pos-venda",
    nome: "Guardião de Contratos",
    cargo: "Customer Success IA",
    departamento: "Vendas",
    especialidade: "Onboarding e Confirmação de Assinatura",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    descricao: "Acompanha o novo cliente durante os primeiros 30 dias após assinatura de contrato.",
    tempoAtivacao: "Em breve",
    nivelAutonomia: "Supervisionado",
    disponivel: false,
  },
];
