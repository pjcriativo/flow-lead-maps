// Catálogo e Tipagem da Tela 06 — Skills & Integrações
// Dados demonstrativos com máxima fidelidade visual ao layout aprovado.
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  Filter,
  Globe,
  HardDrive,
  Layers,
  LayoutGrid,
  Lightbulb,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  Network,
  RefreshCw,
  Server,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface IndicadorSuperiorSkills {
  id: string;
  rotulo: string;
  valor: string;
  sub: string;
  tipo?: "padrao" | "atualizacao" | "status";
  porcentagem?: number;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface SkillItem {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  categoria: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface IntegracaoInternaItem {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  statusRotulo?: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export interface ApiConectorItem {
  id: string;
  nome: string;
  descricao: string;
  status: "conectado" | "configurar" | "nao_conectado";
  statusRotulo: string;
  iconId: "openai" | "google" | "whatsapp" | "maps" | "obsidian" | "notion";
}

export interface McpConectorItem {
  id: string;
  nome: string;
  descricao: string;
  status: "em_breve" | "ativo";
  icon: LucideIcon;
}

export interface LogIntegracaoItem {
  id: string;
  horario: string;
  ferramenta: string;
  iconId: "whatsapp" | "drive" | "openai" | "maps" | "notion";
  descricao: string;
  status: "Sucesso" | "Pendente" | "Falha";
}

export interface UsoApiDonutItem {
  id: string;
  nome: string;
  porcentagem: number;
  requisicoes: number;
  cor: string;
}

export interface SugestaoIntegracaoItem {
  id: string;
  nome: string;
  descricao: string;
  iconId: "slack" | "meet" | "calendly" | "hubspot" | "mailchimp";
}

// 6 Indicadores Superiores
export const INDICADORES_SUPERIORES_SKILLS: IndicadorSuperiorSkills[] = [
  {
    id: "skills_ativas",
    rotulo: "Skills ativas",
    valor: "24",
    sub: "+6 este mês",
    icon: Wrench,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "integracoes",
    rotulo: "Integrações",
    valor: "12",
    sub: "+3 este mês",
    icon: Link2,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "apis_conectadas",
    rotulo: "APIs conectadas",
    valor: "8",
    sub: "+2 este mês",
    icon: Code,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "automacoes_ativas",
    rotulo: "Automações ativas",
    valor: "18",
    sub: "+5 este mês",
    icon: Zap,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "ultima_atualizacao",
    rotulo: "Última atualização",
    valor: "20/10/2026 14:32",
    sub: "Atualizado",
    tipo: "atualizacao",
    icon: RefreshCw,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "status_integracoes",
    rotulo: "Status das integrações",
    valor: "92%",
    sub: "Todas as integrações estão operacionais",
    tipo: "status",
    porcentagem: 92,
    icon: CheckCircle2,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

// 6 Skills Iniciais do CEO
export const SKILLS_INICIAIS: SkillItem[] = [
  {
    id: "planejamento_estrategico",
    nome: "Planejamento Estratégico",
    descricao: "Cria planos e define metas",
    ativo: true,
    categoria: "Estratégia",
    icon: Target,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "analise_dados",
    nome: "Análise de Dados",
    descricao: "Analisa métricas e resultados",
    ativo: true,
    categoria: "Dados",
    icon: BarChart3,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "gestao_equipe",
    nome: "Gestão de Equipe",
    descricao: "Coordena agentes e tarefas",
    ativo: true,
    categoria: "Gestão",
    icon: Users,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "tomada_decisao",
    nome: "Tomada de Decisão",
    descricao: "Avalia cenários e decide",
    ativo: true,
    categoria: "Estratégia",
    icon: Lightbulb,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "comunicacao_executiva",
    nome: "Comunicação Executiva",
    descricao: "Redige mensagens e relatórios",
    ativo: true,
    categoria: "Comunicação",
    icon: FileText,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "automacao_processos",
    nome: "Automação de Processos",
    descricao: "Cria e gerencia fluxos",
    ativo: true,
    categoria: "Automação",
    icon: Settings,
    corIcone: "text-orange-400",
    corBg: "bg-orange-500/10 border-orange-500/20",
  },
];

// 6 Integrações Internas do Flow Business
export const INTEGRACOES_INTERNAS_INICIAIS: IntegracaoInternaItem[] = [
  {
    id: "crm",
    nome: "CRM",
    descricao: "Leads, clientes e negócios...",
    ativo: true,
    statusRotulo: "Conectado",
    icon: Users,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "campanhas",
    nome: "Campanhas",
    descricao: "Criação e monitoramento",
    ativo: true,
    statusRotulo: "Conectado",
    icon: Megaphone,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "pipeline",
    nome: "Pipeline",
    descricao: "Oportunidades e vendas",
    ativo: true,
    statusRotulo: "Conectado",
    icon: Filter,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "conversas",
    nome: "Conversas",
    descricao: "Histórico e interações",
    ativo: true,
    statusRotulo: "Conectado",
    icon: MessageSquare,
    corIcone: "text-emerald-400",
    corBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "contratos",
    nome: "Contratos",
    descricao: "Documentos e assinaturas",
    ativo: true,
    statusRotulo: "Conectado",
    icon: FileText,
    corIcone: "text-rose-400",
    corBg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Receitas, custos e metas",
    ativo: true,
    statusRotulo: "Conectado",
    icon: DollarSign,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
];

// 6 APIs e Conectores Externos
export const APIS_CONECTORES_INICIAIS: ApiConectorItem[] = [
  {
    id: "openai",
    nome: "OpenAI",
    descricao: "Modelos de IA (GPT-4, DALL-E)",
    status: "conectado",
    statusRotulo: "Conectado",
    iconId: "openai",
  },
  {
    id: "gworkspace",
    nome: "Google Workspace",
    descricao: "Gmail, Drive, Docs, Calendar",
    status: "conectado",
    statusRotulo: "Conectado",
    iconId: "google",
  },
  {
    id: "whatsapp",
    nome: "WhatsApp Business",
    descricao: "Envio e recebimento de mensagens",
    status: "conectado",
    statusRotulo: "Conectado",
    iconId: "whatsapp",
  },
  {
    id: "maps_apify",
    nome: "Google Maps / Apify",
    descricao: "Busca de empresas e extração de dados",
    status: "conectado",
    statusRotulo: "Conectado",
    iconId: "maps",
  },
  {
    id: "obsidian",
    nome: "Obsidian",
    descricao: "Base de conhecimento e notas",
    status: "configurar",
    statusRotulo: "Configurar",
    iconId: "obsidian",
  },
  {
    id: "notion",
    nome: "Notion",
    descricao: "Documentação e processos",
    status: "nao_conectado",
    statusRotulo: "Não conectado",
    iconId: "notion",
  },
];

// 3 Conectores MCP (Model Context Protocol)
export const MCP_CONECTORES_INICIAIS: McpConectorItem[] = [
  {
    id: "mcp_db",
    nome: "MCP - Banco de Dados",
    descricao: "Acesso a dados estruturados",
    status: "em_breve",
    icon: Database,
  },
  {
    id: "mcp_sistemas",
    nome: "MCP - Sistemas Externos",
    descricao: "Integração com ERPs e CRMs",
    status: "em_breve",
    icon: Server,
  },
  {
    id: "mcp_tools",
    nome: "MCP - Ferramentas Personalizadas",
    descricao: "Execução de ações via API",
    status: "em_breve",
    icon: Terminal,
  },
];

// 5 Logs de Integrações
export const LOGS_INTEGRACOES_INICIAIS: LogIntegracaoItem[] = [
  {
    id: "log-1",
    horario: "20/10 14:32",
    ferramenta: "WhatsApp",
    iconId: "whatsapp",
    descricao: "Mensagem enviada via WhatsApp",
    status: "Sucesso",
  },
  {
    id: "log-2",
    horario: "20/10 14:28",
    ferramenta: "Google Drive",
    iconId: "drive",
    descricao: "Dados sincronizados do Google Drive",
    status: "Sucesso",
  },
  {
    id: "log-3",
    horario: "20/10 14:15",
    ferramenta: "OpenAI",
    iconId: "openai",
    descricao: "Processamento de análise concluído",
    status: "Sucesso",
  },
  {
    id: "log-4",
    horario: "20/10 13:42",
    ferramenta: "Google Maps",
    iconId: "maps",
    descricao: "Busca de empresas no Google Maps",
    status: "Sucesso",
  },
  {
    id: "log-5",
    horario: "20/10 12:18",
    ferramenta: "Notion",
    iconId: "notion",
    descricao: "Página atualizada no Notion",
    status: "Sucesso",
  },
];

// Uso de APIs Donut Chart (Total: 1.284 requisições)
export const USO_APIS_DONUT: UsoApiDonutItem[] = [
  { id: "openai", nome: "OpenAI", porcentagem: 42, requisicoes: 539, cor: "#06b6d4" },
  { id: "google", nome: "Google", porcentagem: 24, requisicoes: 308, cor: "#8b5cf6" },
  { id: "whatsapp", nome: "WhatsApp", porcentagem: 18, requisicoes: 231, cor: "#10b981" },
  { id: "maps", nome: "Maps/Apify", porcentagem: 10, requisicoes: 128, cor: "#3b82f6" },
  { id: "outros", nome: "Outros", porcentagem: 6, requisicoes: 78, cor: "#f59e0b" },
];

// 5 Sugestões de Integrações
export const SUGESTOES_INTEGRACOES_INICIAIS: SugestaoIntegracaoItem[] = [
  {
    id: "slack",
    nome: "Slack",
    descricao: "Comunicação da equipe",
    iconId: "slack",
  },
  {
    id: "meet",
    nome: "Google Meet",
    descricao: "Reuniões e videoconferência",
    iconId: "meet",
  },
  {
    id: "calendly",
    nome: "Calendly",
    descricao: "Agendamento de reuniões",
    iconId: "calendly",
  },
  {
    id: "hubspot",
    nome: "HubSpot",
    descricao: "CRM e automação de marketing",
    iconId: "hubspot",
  },
  {
    id: "mailchimp",
    nome: "Mailchimp",
    descricao: "E-mail marketing",
    iconId: "mailchimp",
  },
];
