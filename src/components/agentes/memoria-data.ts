// Catálogo e Tipagem da Tela 05 — Memória & Segundo Cérebro
// Dados demonstrativos com máxima fidelidade visual ao layout aprovado.
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  FolderKanban,
  Github,
  HardDrive,
  HelpCircle,
  Layers,
  Lightbulb,
  Link2,
  Mail,
  MessageSquare,
  RefreshCw,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorMemoria {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  destaque?: string;
  tipo?: "padrao" | "sincronizacao" | "armazenamento";
  porcentagem?: number;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface FonteMemoriaItem {
  id: string;
  nome: string;
  descricao: string;
  status: "ativo" | "conectado" | "nao_conectado";
  statusRotulo: string;
  iconId: string;
}

export interface InsightMemoriaItem {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "tendencia" | "oportunidade" | "alerta";
  corBadge: string;
}

export interface CategoriaMemoriaDonut {
  id: string;
  nome: string;
  porcentagem: number;
  quantidade: number;
  cor: string;
}

export interface MemoriaRecenteItem {
  id: string;
  titulo: string;
  categoria: string;
  categoriaBadgeCor: string;
  data: string;
  fonte: string;
  fonteIcon: string;
  resumo: string;
  conteudoCompleto?: string;
  relacionamentos?: string[];
}

export interface ProximaAcaoMemoria {
  id: string;
  titulo: string;
  quantidadeDescricao: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

// 6 Indicadores Superiores
export const INDICADORES_SUPERIORES_MEMORIA: IndicadorSuperiorMemoria[] = [
  {
    id: "memorias_salvas",
    rotulo: "Memórias salvas",
    valor: "2.480",
    sub: "+18% este mês",
    destaque: "+18%",
    icon: Database,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "leads_historico",
    rotulo: "Leads com histórico",
    valor: "1.248",
    sub: "+24% este mês",
    destaque: "+24%",
    icon: Users,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "projetos_ativos",
    rotulo: "Projetos ativos",
    valor: "56",
    sub: "+12% este mês",
    destaque: "+12%",
    icon: FolderKanban,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "conexoes_externas",
    rotulo: "Conexões externas",
    valor: "4",
    sub: "+0 novas",
    destaque: "+0",
    icon: Link2,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "ultima_sincronizacao",
    rotulo: "Última sincronização",
    valor: "20/10/2026 14:32",
    sub: "Sincronizado",
    tipo: "sincronizacao",
    icon: RefreshCw,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "uso_memoria",
    rotulo: "Uso da memória",
    valor: "68%",
    sub: "6.8 GB / 10 GB",
    tipo: "armazenamento",
    porcentagem: 68,
    icon: Database,
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/10 border-orange-500/20",
  },
];

// 9 Fontes de Memória
export const FONTES_MEMORIA_INICIAIS: FonteMemoriaItem[] = [
  {
    id: "conversas_leads",
    nome: "Conversas com Leads",
    descricao: "Histórico de conversas e contatos",
    status: "ativo",
    statusRotulo: "Ativo",
    iconId: "whatsapp",
  },
  {
    id: "projetos_campanhas",
    nome: "Projetos e Campanhas",
    descricao: "Dados de campanhas e resultados",
    status: "ativo",
    statusRotulo: "Ativo",
    iconId: "campanhas",
  },
  {
    id: "documentos_internos",
    nome: "Documentos Internos",
    descricao: "Processos, estratégias e materiais",
    status: "ativo",
    statusRotulo: "Ativo",
    iconId: "documentos",
  },
  {
    id: "obsidian",
    nome: "Obsidian",
    descricao: "Base de conhecimento e notas",
    status: "conectado",
    statusRotulo: "Conectado",
    iconId: "obsidian",
  },
  {
    id: "google_drive",
    nome: "Google Drive",
    descricao: "Documentos e planilhas",
    status: "conectado",
    statusRotulo: "Conectado",
    iconId: "drive",
  },
  {
    id: "notion",
    nome: "Notion",
    descricao: "Projetos, tarefas e páginas",
    status: "nao_conectado",
    statusRotulo: "Não conectado",
    iconId: "notion",
  },
  {
    id: "github",
    nome: "GitHub",
    descricao: "Código, scripts e documentação",
    status: "nao_conectado",
    statusRotulo: "Não conectado",
    iconId: "github",
  },
  {
    id: "emails",
    nome: "E-mails",
    descricao: "Comunicações e propostas",
    status: "ativo",
    statusRotulo: "Ativo",
    iconId: "email",
  },
  {
    id: "reunioes",
    nome: "Reuniões",
    descricao: "Transcrições e resumos",
    status: "ativo",
    statusRotulo: "Ativo",
    iconId: "reunioes",
  },
];

// 3 Insights da Memória
export const INSIGHTS_MEMORIA_INICIAIS: InsightMemoriaItem[] = [
  {
    id: "ins-1",
    titulo: "Leads de clínicas odontológicas têm 32% mais conversão",
    descricao: "Baseado em 248 interações",
    tipo: "tendencia",
    corBadge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    id: "ins-2",
    titulo: "Melhor horário para contato é entre 9h e 11h",
    descricao: "Análise de 1.248 conversas",
    tipo: "oportunidade",
    corBadge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    id: "ins-3",
    titulo: "Objeções mais comuns são preço e tempo de implementação",
    descricao: "Identificadas em 186 negociações",
    tipo: "alerta",
    corBadge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
];

// Categorias para o Donut Chart
export const CATEGORIAS_MEMORIA_DONUT: CategoriaMemoriaDonut[] = [
  { id: "leads", nome: "Leads e Clientes", porcentagem: 32, quantidade: 794, cor: "#3b82f6" },
  { id: "estrategia", nome: "Estratégia Comercial", porcentagem: 18, quantidade: 446, cor: "#f97316" },
  { id: "produtos", nome: "Produtos e Serviços", porcentagem: 15, quantidade: 372, cor: "#8b5cf6" },
  { id: "processos", nome: "Processos e Procedimentos", porcentagem: 12, quantidade: 298, cor: "#06b6d4" },
  { id: "concorrencia", nome: "Concorrência e Mercado", porcentagem: 10, quantidade: 248, cor: "#10b981" },
  { id: "cases", nome: "Cases e Resultados", porcentagem: 8, quantidade: 198, cor: "#ec4899" },
  { id: "outros", nome: "Outros", porcentagem: 5, quantidade: 124, cor: "#f59e0b" },
];

// 10 Memórias Recentes da Tabela
export const MEMORIAS_RECENTES_INICIAIS: MemoriaRecenteItem[] = [
  {
    id: "mem-1",
    titulo: "Reunião com cliente - Clínica OdontoMais",
    categoria: "Reunião",
    categoriaBadgeCor: "bg-blue-500/10 text-blue-400 border-blue-500/25",
    data: "20/10/2026 14:32",
    fonte: "Meet",
    fonteIcon: "video",
    resumo: "Alinhamento de proposta de IA para atendimento e qualificação de pacientes via WhatsApp.",
    conteudoCompleto: "Reunião com Dr. Marcos (Diretor Clínico). O cliente demonstrou alto interesse em automação para confirmação de consultas e triagem prévia. Objeção levantada sobre facilidade de uso pela equipe recepção.",
    relacionamentos: ["Clínica OdontoMais", "Proposta Comercial Pro", "SDR de Prospecção"],
  },
  {
    id: "mem-2",
    titulo: "Leads qualificados - Curitiba PR",
    categoria: "Lead",
    categoriaBadgeCor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    data: "20/10/2026 11:15",
    fonte: "WhatsApp",
    fonteIcon: "whatsapp",
    resumo: "Lista de 42 empresas qualificadas pelo agente SDR no nicho de saúde e odontologia.",
    conteudoCompleto: "Filtro aplicado pelo SDR: Clínicas com mais de 3 cadeiras, faturamento estimado > R$ 50k/mês. 38 contatos com WhatsApp ativo validado.",
    relacionamentos: ["Campanha Curitiba Outubro", "Enxame SDR", "Planilha CRM"],
  },
  {
    id: "mem-3",
    titulo: "Estratégia de prospecção odontologia",
    categoria: "Estratégia",
    categoriaBadgeCor: "bg-orange-500/10 text-orange-400 border-orange-500/25",
    data: "19/10/2026 18:45",
    fonte: "Obsidian",
    fonteIcon: "obsidian",
    resumo: "Estrutura do playbook de abordagem focando em redução de no-show em consultas.",
    conteudoCompleto: "Playbook desenhado pelo CEO de IA: 1) Gancho de ausência de pacientes, 2) Caso de sucesso local com métricas, 3) Convite para demonstração ao vivo de 15 minutos.",
    relacionamentos: ["Playbook V2", "Campanha No-Show", "Agente Vendedor"],
  },
  {
    id: "mem-4",
    titulo: "Proposta enviada - Plano Pro",
    categoria: "Proposta",
    categoriaBadgeCor: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    data: "19/10/2026 16:20",
    fonte: "CRM",
    fonteIcon: "crm",
    resumo: "Envio de proposta comercial para grupo odontológico com 3 unidades em SC.",
    conteudoCompleto: "Valor contratado: R$ 3.800/mês + taxa de setup. Inclui CEO de IA, 2 SDRs e integração direta com WhatsApp comercial.",
    relacionamentos: ["Grupo Odonto Sul", "Contrato 2026-10", "Gerente Comercial"],
  },
  {
    id: "mem-5",
    titulo: "Análise de concorrentes - região sul",
    categoria: "Pesquisa",
    categoriaBadgeCor: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    data: "18/10/2026 10:12",
    fonte: "Web",
    fonteIcon: "web",
    resumo: "Mapeamento de 5 soluções concorrentes no mercado de automação clínica regional.",
    conteudoCompleto: "Pontos fracos dos concorrentes: falta de IA contextual, cobrança por mensagem disparada e suporte moroso. Nosso diferencial de CEO de IA com enxame é único.",
    relacionamentos: ["Matriz SWOT", "Benchmark Preços", "CEO de IA"],
  },
  {
    id: "mem-6",
    titulo: "Processo de onboarding de clientes",
    categoria: "Processo",
    categoriaBadgeCor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    data: "18/10/2026 09:30",
    fonte: "Notion",
    fonteIcon: "notion",
    resumo: "Passo a passo de implantação da equipe de agentes em até 48 horas.",
    conteudoCompleto: "Etapa 1: Conexão de WhatsApp via Evolution. Etapa 2: Treinamento com catálogo e FAQs. Etapa 3: Definição de autonomia e metas semanais.",
    relacionamentos: ["Checklist Onboarding", "Manual do Cliente", "Suporte VIP"],
  },
  {
    id: "mem-7",
    titulo: "Case de sucesso - Clínica Vitalis",
    categoria: "Case",
    categoriaBadgeCor: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    data: "17/10/2026 15:20",
    fonte: "Drive",
    fonteIcon: "drive",
    resumo: "Aumento de 44% no agendamento de primeiras consultas no primeiro mês de uso.",
    conteudoCompleto: "A Clínica Vitalis reduziu o tempo médio de resposta no WhatsApp de 2 horas para 18 segundos. No-show caiu de 22% para 7%.",
    relacionamentos: ["Clínica Vitalis", "Depoimento em Vídeo", "Marketing de Prova Social"],
  },
  {
    id: "mem-8",
    titulo: "Ideias de campanhas para novembro",
    categoria: "Ideia",
    categoriaBadgeCor: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    data: "17/10/2026 13:45",
    fonte: "Obsidian",
    fonteIcon: "obsidian",
    resumo: "Brainstorming gerado pelo CEO de IA para Black November em serviços B2B.",
    conteudoCompleto: "Oferta de implantação rápida sem fidelidade para os primeiros 20 clientes da lista de espera.",
    relacionamentos: ["Campanha Black Friday", "Estrategista de Vendas", "Metas Q4"],
  },
  {
    id: "mem-9",
    titulo: "Feedback de reunião - Dr. Carlos",
    categoria: "Feedback",
    categoriaBadgeCor: "bg-teal-500/10 text-teal-400 border-teal-500/25",
    data: "16/10/2026 17:18",
    fonte: "Meet",
    fonteIcon: "video",
    resumo: "Elogios à naturalidade da conversa do SDR de IA no primeiro contato.",
    conteudoCompleto: "Dr. Carlos comentou que achava se tratar de um humano da equipe de vendas até o agendamento da reunião de demonstração.",
    relacionamentos: ["Dr. Carlos Silva", "Avaliação de Tom de Voz", "Agente SDR"],
  },
  {
    id: "mem-10",
    titulo: "Scripts de abordagem atualizados",
    categoria: "Script",
    categoriaBadgeCor: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    data: "16/10/2026 11:22",
    fonte: "Docs",
    fonteIcon: "docs",
    resumo: "Novas variações de abertura com perguntas abertas testadas com taxa de abertura de 68%.",
    conteudoCompleto: "Alteração da frase de abertura para focar na 'dor de agenda vazia nas sextas-feiras'. Conversão de resposta subiu de 14% para 22%.",
    relacionamentos: ["Playbook SDR", "Variações de A/B", "CEO de IA"],
  },
];

// Exemplos de Perguntas para Busca Inteligente
export const EXEMPLOS_BUSCA_INTELIGENTE = [
  "O que o cliente Clínica OdontoMais já conversou comigo?",
  "Quais são as objeções mais comuns dos leads de Curitiba?",
  "Mostre todas as propostas enviadas este mês",
  "Qual foi a última estratégia definida para o nicho odontológico?",
];

// 4 Próximas Ações
export const PROXIMAS_ACOES_MEMORIA: ProximaAcaoMemoria[] = [
  {
    id: "act-1",
    titulo: "Sincronizar novas reuniões",
    quantidadeDescricao: "3 reuniões pendentes",
    icon: Video,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "act-2",
    titulo: "Processar 12 novos documentos",
    quantidadeDescricao: "Enviados esta semana",
    icon: FileText,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "act-3",
    titulo: "Revisar memórias duplicadas",
    quantidadeDescricao: "8 itens identificados",
    icon: RefreshCw,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "act-4",
    titulo: "Atualizar categorias",
    quantidadeDescricao: "5 sugestões disponíveis",
    icon: Layers,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

// Detalhamento de Armazenamento
export const DETALHAMENTO_ARMAZENAMENTO = [
  { rotulo: "Documentos", valor: "2.4 GB", cor: "bg-blue-400" },
  { rotulo: "Conversas", valor: "1.8 GB", cor: "bg-emerald-400" },
  { rotulo: "Transcrições", valor: "1.2 GB", cor: "bg-cyan-400" },
  { rotulo: "Outros", valor: "1.4 GB", cor: "bg-amber-400" },
];
