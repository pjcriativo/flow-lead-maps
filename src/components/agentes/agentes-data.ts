// Catálogo ESTÁTICO do módulo Agentes & Automações. Descreve a equipe PLANEJADA — não é dado de
// operação. Enquanto os agentes não têm backend, todos aparecem como "Em breve" (honestidade de UI).
import {
  BarChart3,
  Crown,
  Handshake,
  Lightbulb,
  Search,
  Target,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";

export type AgenteCatalogo = {
  id: string;
  nome: string;
  funcao: string;
  descricao: string;
  icon: LucideIcon;
  cor: string;
};

export const CEO_AGENTE: AgenteCatalogo = {
  id: "ceo",
  nome: "CEO de IA",
  funcao: "Orquestrador Geral",
  descricao:
    "Planeja, coordena e impulsiona toda a operação comercial. Define estratégias, delega tarefas, acompanha metas e garante resultados.",
  icon: Crown,
  cor: "text-home-orange",
};

export const EQUIPE_AGENTES: AgenteCatalogo[] = [
  CEO_AGENTE,
  {
    id: "estrategista",
    nome: "Estrategista",
    funcao: "Planejamento e Mercado",
    descricao: "Analisa nichos, planeja campanhas e recomenda ajustes.",
    icon: Lightbulb,
    cor: "text-home-purple",
  },
  {
    id: "sdr",
    nome: "SDR",
    funcao: "Qualificação de Leads",
    descricao: "Qualifica contatos, prepara abordagem e agenda reuniões.",
    icon: UserRoundSearch,
    cor: "text-home-blue",
  },
  {
    id: "vendedor",
    nome: "Vendedor",
    funcao: "Negociação",
    descricao: "Conduz conversas comerciais e prepara propostas.",
    icon: Handshake,
    cor: "text-home-amber",
  },
  {
    id: "prospeccao",
    nome: "Prospecção",
    funcao: "Busca e Lista de Leads",
    descricao: "Busca empresas, deduplica e entrega listas ao SDR.",
    icon: Search,
    cor: "text-home-cyan",
  },
  {
    id: "seo",
    nome: "SEO Geral",
    funcao: "Conteúdo e Visibilidade",
    descricao: "Coordena o setor de SEO e seus subagentes.",
    icon: BarChart3,
    cor: "text-home-green",
  },
  {
    id: "gerente",
    nome: "Gerente Comercial",
    funcao: "Metas e Performance",
    descricao: "Supervisiona o pipeline, as metas e a qualidade.",
    icon: Target,
    cor: "text-home-pink",
  },
];

export const FLUXO_OPERACIONAL = [
  { id: "prospeccao", titulo: "Prospecção", sub: "Busca de leads", disponivel: true },
  { id: "qualificacao", titulo: "Qualificação", sub: "SDR + filtros", disponivel: false },
  { id: "reuniao", titulo: "Reunião", sub: "Agendamento", disponivel: false },
  { id: "vendedor", titulo: "Vendedor", sub: "Apresentação", disponivel: false },
  { id: "fechamento", titulo: "Fechamento", sub: "Proposta e assinatura", disponivel: false },
] as const;

export const CAPACIDADES = [
  {
    id: "memoria",
    titulo: "Memória e RAG",
    texto: "Contexto do seu negócio, clientes e histórico.",
  },
  { id: "skills", titulo: "Skills e Ferramentas", texto: "Busca, análise, scraping e automações." },
  { id: "voz", titulo: "Voz e Linguagem", texto: "Atendimento e ligações automáticas." },
  {
    id: "sentimento",
    titulo: "Análise de Sentimento",
    texto: "Entende o interesse e qualifica melhor.",
  },
] as const;

export type AbaAgentes =
  | "painel"
  | "agentes"
  | "equipes"
  | "automacoes"
  | "agenda"
  | "metas"
  | "integracoes"
  | "memoria"
  | "relatorios";

export const ABAS_AGENTES: { id: AbaAgentes; label: string; disponivel: boolean }[] = [
  { id: "painel", label: "Painel", disponivel: true },
  { id: "agentes", label: "Agentes", disponivel: false },
  { id: "equipes", label: "Equipes", disponivel: false },
  { id: "automacoes", label: "Automações", disponivel: true },
  { id: "agenda", label: "Agenda", disponivel: false },
  { id: "metas", label: "Metas", disponivel: false },
  { id: "integracoes", label: "Integrações", disponivel: false },
  { id: "memoria", label: "Memória / RAG", disponivel: false },
  { id: "relatorios", label: "Relatórios", disponivel: false },
];
