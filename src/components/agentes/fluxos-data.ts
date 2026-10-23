// Catálogo e Tipagem da Tela 07 — Fluxos & Automações
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
  GitBranch,
  Headphones,
  HeartHandshake,
  Layers,
  Link2,
  Mail,
  MessageSquare,
  Percent,
  Play,
  PlusCircle,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorFluxos {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  tipo?: "padrao" | "atualizacao" | "status";
  porcentagem?: number;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
  mudanca?: string;
  positivo?: boolean;
}

export interface ModeloFluxoItem {
  id: string;
  nome: string;
  descricao: string;
  categoria: "todos" | "prospeccao" | "vendas" | "pos_venda";
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
  execucoes: number;
  taxaSucesso: string;
  etapasCount: number;
  ativo: boolean;
}

export type TipoBlocoFluxo =
  | "inicio"
  | "acao_agente"
  | "condicao"
  | "espera"
  | "notificacao"
  | "ferramenta"
  | "conclusao";

export interface BlocoFluxo {
  id: string;
  tipo: TipoBlocoFluxo;
  nome: string;
  sub: string;
  descricao?: string;
  agenteResponsavel?: string;
  avatarAgente?: string;
  cor: "verde" | "roxo" | "azul" | "laranja" | "vermelho" | "cinza";
  icon: LucideIcon;
  x: number;
  y: number;
  largura?: number;
  altura?: number;
  // Configurações demonstrativas
  usarCrm?: boolean;
  considerarHistorico?: boolean;
  aplicarCriterios?: boolean;
  proximoPasso?: string;
  tempoEspera?: string;
}

export interface ConexaoFluxo {
  id: string;
  origemId: string;
  destinoId: string;
  rotulo?: string; // Ex: "Sim", "Não"
  tipoRotulo?: "sim" | "nao" | "padrao";
  dashed?: boolean;
  loopback?: boolean;
  cor?: string;
}

export interface FluxoMaisUtilizado {
  id: string;
  nome: string;
  execucoes: number;
  percentual: number;
}

export interface PontoGraficoExecucoes {
  data: string;
  sucesso: number;
  falha: number;
  emAndamento: number;
}

export interface ResultadoFluxoMetric {
  id: string;
  rotulo: string;
  valor: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
  destaque?: string;
}

// ---------------------------------------------------------------------------
// 1. INDICADORES DO HERO CARD (CEO DE IA)
// ---------------------------------------------------------------------------
export const INDICADORES_SUPERIORES_FLUXOS: IndicadorSuperiorFluxos[] = [
  {
    id: "fluxos_ativos",
    rotulo: "Fluxos ativos",
    valor: "12",
    sub: "+3 este mês",
    mudanca: "+3 este mês",
    positivo: true,
    icon: GitBranch,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
    tipo: "padrao",
  },
  {
    id: "execucoes",
    rotulo: "Execuções",
    valor: "2.840",
    sub: "+18% este mês",
    mudanca: "+18% este mês",
    positivo: true,
    icon: Link2,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
    tipo: "padrao",
  },
  {
    id: "taxa_sucesso",
    rotulo: "Taxa de sucesso",
    valor: "94%",
    sub: "+5% este mês",
    mudanca: "+5% este mês",
    positivo: true,
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
    tipo: "padrao",
  },
  {
    id: "tempo_medio",
    rotulo: "Tempo médio",
    valor: "2m 18s",
    sub: "-22% este mês",
    mudanca: "-22% este mês",
    positivo: true,
    icon: Clock,
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/10 border-orange-500/20",
    tipo: "padrao",
  },
  {
    id: "ultima_execucao",
    rotulo: "Última execução",
    valor: "20/10/2026 14:32",
    sub: "Sucesso",
    icon: RotateCcw,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
    tipo: "atualizacao",
  },
  {
    id: "status_automacoes",
    rotulo: "Status das automações",
    valor: "92%",
    sub: "10 fluxos em execução | 2 pausados",
    porcentagem: 92,
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
    tipo: "status",
  },
];

// ---------------------------------------------------------------------------
// 2. MODELOS DE FLUXOS (BIBLIOTECA LATERAL)
// ---------------------------------------------------------------------------
export const MODELOS_FLUXOS_INICIAIS: ModeloFluxoItem[] = [
  {
    id: "qualificacao_leads",
    nome: "Qualificação de Leads",
    descricao: "Do primeiro contato ao lead qualificado",
    categoria: "prospeccao",
    icon: Sparkles,
    corIcone: "text-teal-400",
    corBg: "bg-teal-500/15 border-teal-500/30",
    execucoes: 842,
    taxaSucesso: "96%",
    etapasCount: 6,
    ativo: true,
  },
  {
    id: "agendamento_reunioes",
    nome: "Agendamento de Reuniões",
    descricao: "Identifica interesse e agenda reunião",
    categoria: "vendas",
    icon: CalendarCheck,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/15 border-purple-500/30",
    execucoes: 620,
    taxaSucesso: "92%",
    etapasCount: 5,
    ativo: false,
  },
  {
    id: "followup_automatico",
    nome: "Follow-up Automático",
    descricao: "Acompanhamento de leads em aberto",
    categoria: "vendas",
    icon: MessageSquare,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/15 border-amber-500/30",
    execucoes: 418,
    taxaSucesso: "88%",
    etapasCount: 4,
    ativo: false,
  },
  {
    id: "proposta_comercial",
    nome: "Proposta Comercial",
    descricao: "Geração e envio de propostas",
    categoria: "vendas",
    icon: FileText,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/15 border-blue-500/30",
    execucoes: 286,
    taxaSucesso: "94%",
    etapasCount: 5,
    ativo: false,
  },
  {
    id: "onboarding_clientes",
    nome: "Onboarding de Clientes",
    descricao: "Integração e boas-vindas",
    categoria: "pos_venda",
    icon: UserCheck,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/15 border-emerald-500/30",
    execucoes: 194,
    taxaSucesso: "98%",
    etapasCount: 7,
    ativo: false,
  },
  {
    id: "recuperacao_leads",
    nome: "Recuperação de Leads",
    descricao: "Reativa leads inativos",
    categoria: "prospeccao",
    icon: Flame,
    corIcone: "text-rose-400",
    corBg: "bg-rose-500/15 border-rose-500/30",
    execucoes: 142,
    taxaSucesso: "79%",
    etapasCount: 4,
    ativo: false,
  },
  {
    id: "pos_venda_suporte",
    nome: "Pós-venda e Suporte",
    descricao: "Acompanhamento de clientes",
    categoria: "pos_venda",
    icon: Headphones,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/15 border-purple-500/30",
    execucoes: 110,
    taxaSucesso: "95%",
    etapasCount: 5,
    ativo: false,
  },
  {
    id: "fluxo_personalizado",
    nome: "Fluxo Personalizado",
    descricao: "Criar um fluxo do zero",
    categoria: "todos",
    icon: PlusCircle,
    corIcone: "text-neutral-400",
    corBg: "bg-neutral-800 border-neutral-700",
    execucoes: 0,
    taxaSucesso: "--",
    etapasCount: 1,
    ativo: false,
  },
];

// ---------------------------------------------------------------------------
// 3. NÓS DO FLUXO DEMONSTRATIVO INICIAL (CANVAS)
// ---------------------------------------------------------------------------
export const BLOCOS_FLUXO_INICIAIS: BlocoFluxo[] = [
  {
    id: "node-inicio",
    tipo: "inicio",
    nome: "Início do Fluxo",
    sub: "Novo lead recebido",
    descricao: "Gatilho automático ativado assim que um novo lead entra pelo formulário, WhatsApp ou prospecção.",
    agenteResponsavel: "Sistema / Flow Business",
    cor: "verde",
    icon: Play,
    x: 260,
    y: 30,
    largura: 200,
    altura: 64,
  },
  {
    id: "node-analise",
    tipo: "acao_agente",
    nome: "Análise de Perfil",
    sub: "Avalia e classifica o lead",
    agenteResponsavel: "CEO de IA",
    avatarAgente: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    descricao: "Analisa as informações do lead, identifica o potencial e classifica conforme o perfil ideal de cliente.",
    cor: "roxo",
    icon: Sparkles,
    x: 240,
    y: 135,
    largura: 240,
    altura: 74,
    usarCrm: true,
    considerarHistorico: true,
    aplicarCriterios: true,
    proximoPasso: "Condição: Lead qualificado?",
  },
  {
    id: "node-condicao",
    tipo: "condicao",
    nome: "Lead qualificado?",
    sub: "Avaliação do ICP e score",
    descricao: "Verifica se o score de qualificação calculado pelo CEO de IA é superior a 75/100.",
    agenteResponsavel: "CEO de IA",
    cor: "azul",
    icon: GitBranch,
    x: 265,
    y: 255,
    largura: 190,
    altura: 60,
  },
  {
    id: "node-nutricao",
    tipo: "acao_agente",
    nome: "Nutrição Automática",
    sub: "Envia materiais e continua acompanhamento",
    agenteResponsavel: "SDR",
    avatarAgente: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    descricao: "Dispara sequência de e-mails e mensagens de WhatsApp com estudos de caso do nicho para maturar o lead.",
    cor: "laranja",
    icon: FileText,
    x: 80,
    y: 355,
    largura: 215,
    altura: 78,
    usarCrm: true,
    considerarHistorico: true,
    aplicarCriterios: false,
    proximoPasso: "Aguardar Resposta",
  },
  {
    id: "node-espera",
    tipo: "espera",
    nome: "Aguardar Resposta",
    sub: "3 dias",
    descricao: "Aguarda janela de 3 dias úteis antes de disparar nova tentativa de reclassificação.",
    agenteResponsavel: "Automação",
    cor: "vermelho",
    icon: Calendar,
    x: 80,
    y: 475,
    largura: 215,
    altura: 64,
    tempoEspera: "3 dias",
  },
  {
    id: "node-agendamento",
    tipo: "acao_agente",
    nome: "Agendamento de Reunião",
    sub: "Verifica disponibilidade e agenda no calendário",
    agenteResponsavel: "SDR",
    avatarAgente: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    descricao: "Envia opções dinâmicas de horários e reserva a demonstração comercial diretamente na agenda do vendedor.",
    cor: "azul",
    icon: CalendarCheck,
    x: 420,
    y: 355,
    largura: 225,
    altura: 78,
    usarCrm: true,
    considerarHistorico: true,
    aplicarCriterios: true,
    proximoPasso: "Envio de Proposta",
  },
  {
    id: "node-proposta",
    tipo: "acao_agente",
    nome: "Envio de Proposta",
    sub: "Gera e envia proposta comercial",
    agenteResponsavel: "Vendedor",
    avatarAgente: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    descricao: "Estrutura contrato personalizado com termos alinhados na reunião e envia para assinatura eletrônica.",
    cor: "roxo",
    icon: Send,
    x: 420,
    y: 475,
    largura: 225,
    altura: 78,
    usarCrm: true,
    considerarHistorico: true,
    aplicarCriterios: true,
    proximoPasso: "Acompanhamento",
  },
  {
    id: "node-acompanhamento",
    tipo: "acao_agente",
    nome: "Acompanhamento",
    sub: "Monitora progresso e próximas ações",
    agenteResponsavel: "CEO de IA",
    avatarAgente: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
    descricao: "Supervisiona taxa de visualização da proposta e ativa follow-up caso o lead não assine em 48h.",
    cor: "verde",
    icon: CheckCircle2,
    x: 420,
    y: 595,
    largura: 225,
    altura: 78,
    usarCrm: true,
    considerarHistorico: true,
    aplicarCriterios: true,
  },
];

// Conexões direcionais
export const CONEXOES_FLUXO_INICIAIS: ConexaoFluxo[] = [
  {
    id: "c1",
    origemId: "node-inicio",
    destinoId: "node-analise",
  },
  {
    id: "c2",
    origemId: "node-analise",
    destinoId: "node-condicao",
  },
  {
    id: "c3-nao",
    origemId: "node-condicao",
    destinoId: "node-nutricao",
    rotulo: "Não",
    tipoRotulo: "nao",
  },
  {
    id: "c4-espera",
    origemId: "node-nutricao",
    destinoId: "node-espera",
  },
  {
    id: "c5-loopback",
    origemId: "node-nutricao",
    destinoId: "node-analise",
    dashed: true,
    loopback: true,
    cor: "#f59e0b",
  },
  {
    id: "c6-sim",
    origemId: "node-condicao",
    destinoId: "node-agendamento",
    rotulo: "Sim",
    tipoRotulo: "sim",
  },
  {
    id: "c7-proposta",
    origemId: "node-agendamento",
    destinoId: "node-proposta",
  },
  {
    id: "c8-acompanhamento",
    origemId: "node-proposta",
    destinoId: "node-acompanhamento",
  },
];

// ---------------------------------------------------------------------------
// 4. DADOS INFERIORES: FLUXOS MAIS UTILIZADOS
// ---------------------------------------------------------------------------
export const FLUXOS_MAIS_UTILIZADOS: FluxoMaisUtilizado[] = [
  {
    id: "1",
    nome: "Qualificação de Leads",
    execucoes: 842,
    percentual: 100,
  },
  {
    id: "2",
    nome: "Agendamento de Reuniões",
    execucoes: 620,
    percentual: 73.6,
  },
  {
    id: "3",
    nome: "Follow-up Automático",
    execucoes: 418,
    percentual: 49.6,
  },
  {
    id: "4",
    nome: "Proposta Comercial",
    execucoes: 286,
    percentual: 33.9,
  },
  {
    id: "5",
    nome: "Onboarding de Clientes",
    execucoes: 194,
    percentual: 23.0,
  },
];

// ---------------------------------------------------------------------------
// 5. DADOS INFERIORES: GRÁFICO DE EXECUÇÕES DE FLUXOS
// ---------------------------------------------------------------------------
export const EXECUCOES_FLUXOS_GRAFICO: PontoGraficoExecucoes[] = [
  { data: "01/10", sucesso: 65, falha: 14, emAndamento: 32 },
  { data: "05/10", sucesso: 82, falha: 18, emAndamento: 40 },
  { data: "10/10", sucesso: 95, falha: 10, emAndamento: 46 },
  { data: "15/10", sucesso: 120, falha: 22, emAndamento: 58 },
  { data: "20/10", sucesso: 185, falha: 15, emAndamento: 72 },
  { data: "25/10", sucesso: 130, falha: 20, emAndamento: 54 },
  { data: "30/10", sucesso: 160, falha: 16, emAndamento: 65 },
];

// ---------------------------------------------------------------------------
// 6. DADOS INFERIORES: RESULTADOS DO FLUXO (6 MINI CARDS)
// ---------------------------------------------------------------------------
export const RESULTADOS_DO_FLUXO: ResultadoFluxoMetric[] = [
  {
    id: "res_exec",
    rotulo: "Execuções",
    valor: "2.840",
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    id: "res_leads",
    rotulo: "Leads qualificados",
    valor: "2.124",
    icon: Users,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/15 border-blue-500/25",
  },
  {
    id: "res_reunioes",
    rotulo: "Reuniões agendadas",
    valor: "486",
    icon: Calendar,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/15 border-purple-500/25",
  },
  {
    id: "res_propostas",
    rotulo: "Propostas enviadas",
    valor: "312",
    icon: DollarSign,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/15 border-amber-500/25",
  },
  {
    id: "res_sucesso",
    rotulo: "Taxa de sucesso",
    valor: "94%",
    icon: Percent,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    id: "res_tempo",
    rotulo: "Tempo médio",
    valor: "2m 18s",
    icon: Clock,
    corIcone: "text-violet-400",
    corBg: "bg-violet-500/15 border-violet-500/25",
  },
];
