import {
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  FileCheck,
  FileText,
  Filter,
  FolderKanban,
  Globe,
  Handshake,
  Heart,
  Layers,
  Lightbulb,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRoundSearch,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperior {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface PontoDesempenho {
  data: string;
  leads: number;
  reunioes: number;
  vendas: number;
}

export interface MetaAgenteItem {
  rotulo: string;
  atual: number;
  meta: number;
  unidade?: string;
  porcentagem: number;
  corBarra: string;
  icon: LucideIcon;
  corIcone: string;
}

export interface AtividadePerfilItem {
  id: string;
  agente: string;
  avatarUrl: string;
  acao: string;
  detalhe: string;
  horario: string;
}

export interface PerfilAgenteCompleto {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  especialidade: string;
  descricao: string;
  avatarUrl: string;
  status: "Online" | "Trabalhando" | "Em execução" | "Pausado";
  tags: string[];
  indicadores: IndicadorSuperior[];
  personalidade: {
    analitico: number;
    estrategico: number;
    comunicativo: number;
    decisivo: number;
    inovador: number;
    tom: string;
  };
  metas: MetaAgenteItem[];
  permissoes: { id: string; label: string; ativo: boolean }[];
  limites: {
    orcamentoMensal: string;
    limiteTarefasDia: number;
    autonomiaOperacional: string;
    aprovacaoHumanaObrigatoria: boolean;
    restricoesFerramentas: string[];
  };
  atividadesRecentes: AtividadePerfilItem[];
  serieDesempenho: PontoDesempenho[];
  isCeo?: boolean;
}

export const PERFIS_CATALOGO: Record<string, PerfilAgenteCompleto> = {
  ceo: {
    id: "ceo",
    nome: "CEO de IA",
    cargo: "Orquestrador Geral da Operação Comercial",
    departamento: "Direção Executiva",
    especialidade: "Estratégia, Gestão e Crescimento",
    descricao:
      "Responsável por planejar, organizar, coordenar e supervisionar toda a estrutura comercial de IA. Define estratégias, cria planos de prospecção, acompanha metas e garante o cumprimento dos resultados.",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    status: "Online",
    isCeo: true,
    tags: [
      "Direção Executiva",
      "Estratégia",
      "Gestão Comercial",
      "Análise de Resultados",
    ],
    indicadores: [
      {
        id: "agentes",
        rotulo: "Agentes coordenados",
        valor: "6",
        sub: "+2 este mês",
        icon: Users,
        corIcone: "text-blue-400",
        corBg: "bg-blue-500/10 border-blue-500/20",
      },
      {
        id: "projetos",
        rotulo: "Projetos ativos",
        valor: "4",
        sub: "+1 este mês",
        icon: FolderKanban,
        corIcone: "text-emerald-400",
        corBg: "bg-emerald-500/10 border-emerald-500/20",
      },
      {
        id: "tarefas",
        rotulo: "Tarefas em execução",
        valor: "28",
        sub: "+12 hoje",
        icon: Briefcase,
        corIcone: "text-amber-400",
        corBg: "bg-amber-500/10 border-amber-500/20",
      },
      {
        id: "taxa",
        rotulo: "Taxa de metas",
        valor: "78%",
        sub: "+15%",
        icon: TrendingUp,
        corIcone: "text-emerald-400",
        corBg: "bg-emerald-500/10 border-emerald-500/20",
      },
      {
        id: "proxima-meta",
        rotulo: "Próxima meta",
        valor: "Aumentar leads em 30%",
        sub: "Semanal",
        icon: Target,
        corIcone: "text-rose-400",
        corBg: "bg-rose-500/10 border-rose-500/20",
      },
      {
        id: "proxima-tarefa",
        rotulo: "Próxima tarefa",
        valor: "Revisar plano de prospecção",
        sub: "Em 2 horas",
        icon: Clock,
        corIcone: "text-purple-400",
        corBg: "bg-purple-500/10 border-purple-500/20",
      },
      {
        id: "custo",
        rotulo: "Custo estimado (mês)",
        valor: "R$ 320,00",
        sub: "Dentro do orçamento",
        icon: DollarSign,
        corIcone: "text-emerald-400",
        corBg: "bg-emerald-500/10 border-emerald-500/20",
      },
    ],
    personalidade: {
      analitico: 80,
      estrategico: 95,
      comunicativo: 85,
      decisivo: 90,
      inovador: 75,
      tom: "Profissional e consultivo",
    },
    metas: [
      {
        rotulo: "Leads gerados",
        atual: 1248,
        meta: 2000,
        porcentagem: 62,
        corBarra: "bg-emerald-500",
        icon: Users,
        corIcone: "text-blue-400 bg-blue-500/10",
      },
      {
        rotulo: "Reuniões agendadas",
        atual: 86,
        meta: 120,
        porcentagem: 72,
        corBarra: "bg-emerald-400",
        icon: Calendar,
        corIcone: "text-emerald-400 bg-emerald-500/10",
      },
      {
        rotulo: "Propostas enviadas",
        atual: 37,
        meta: 60,
        porcentagem: 62,
        corBarra: "bg-purple-500",
        icon: FileText,
        corIcone: "text-purple-400 bg-purple-500/10",
      },
      {
        rotulo: "Vendas realizadas",
        atual: 24,
        meta: 40,
        porcentagem: 60,
        corBarra: "bg-orange-500",
        icon: CheckCircle2,
        corIcone: "text-orange-400 bg-orange-500/10",
      },
      {
        rotulo: "Faturamento estimado",
        atual: 64500,
        meta: 100000,
        unidade: "R$",
        porcentagem: 65,
        corBarra: "bg-rose-500",
        icon: DollarSign,
        corIcone: "text-rose-400 bg-rose-500/10",
      },
    ],
    permissoes: [
      { id: "delegar", label: "Criar e delegar tarefas para agentes", ativo: true },
      { id: "aprovar-leads", label: "Aprovar listas de leads", ativo: true },
      { id: "revisar-mensagens", label: "Revisar mensagens de abordagem", ativo: true },
      { id: "acessar-crm", label: "Acessar dados do CRM", ativo: true },
      { id: "ajustar-metas", label: "Definir e ajustar metas", ativo: true },
      { id: "ativar-automacoes", label: "Ativar automações", ativo: false },
      { id: "contratar-agentes", label: "Contratar novos agentes", ativo: false },
      { id: "aprovar-campanhas", label: "Aprovar campanhas", ativo: true },
    ],
    limites: {
      orcamentoMensal: "R$ 1.500,00",
      limiteTarefasDia: 50,
      autonomiaOperacional: "Copiloto com aprovação humana",
      aprovacaoHumanaObrigatoria: true,
      restricoesFerramentas: ["Google Maps", "WhatsApp", "CRM Interno"],
    },
    atividadesRecentes: [
      {
        id: "act-1",
        agente: "CEO de IA",
        avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
        acao: "revisou o plano de prospecção da semana",
        detalhe: "Plano aprovado e enviado para execução",
        horario: "10:42",
      },
      {
        id: "act-2",
        agente: "Estrategista",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
        acao: "apresentou análise de mercado",
        detalhe: "Oportunidades em clínicas odontológicas",
        horario: "09:18",
      },
      {
        id: "act-3",
        agente: "Prospecção",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
        acao: "gerou nova lista de 327 leads",
        detalhe: "Segmento: Clínicas · Curitiba PR",
        horario: "08:51",
      },
      {
        id: "act-4",
        agente: "SDR",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        acao: "qualificou 42 leads",
        detalhe: "28 em potencial para reunião",
        horario: "08:12",
      },
      {
        id: "act-5",
        agente: "Vendedor",
        avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
        acao: "preparou 5 propostas",
        detalhe: "Aguardando revisão e envio",
        horario: "Ontem 18:34",
      },
    ],
    serieDesempenho: [
      { data: "01/10", leads: 45, reunioes: 12, vendas: 5 },
      { data: "05/10", leads: 78, reunioes: 22, vendas: 8 },
      { data: "10/10", leads: 62, reunioes: 18, vendas: 7 },
      { data: "15/10", leads: 110, reunioes: 34, vendas: 14 },
      { data: "18/10", leads: 128, reunioes: 42, vendas: 18 },
      { data: "20/10", leads: 95, reunioes: 30, vendas: 12 },
      { data: "25/10", leads: 140, reunioes: 48, vendas: 21 },
      { data: "30/10", leads: 135, reunioes: 45, vendas: 20 },
    ],
  },
};
