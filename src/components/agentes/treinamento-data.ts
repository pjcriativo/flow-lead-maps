import {
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe,
  Handshake,
  HelpCircle,
  Layers,
  Lightbulb,
  Link2,
  Megaphone,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface CategoriaConhecimento {
  id: string;
  nome: string;
  count: number;
  icon: LucideIcon;
  cor: string;
}

export interface DocumentoConhecimento {
  id: string;
  nome: string;
  tipo: "PDF" | "Markdown" | "Texto" | "DOCX" | "CSV" | "Link" | "FAQ" | "Vídeo";
  categoria: string;
  atualizadoEm: string;
  status: "Ativo" | "Pendente" | "Processando" | "Erro" | "Desativado";
  tamanho?: string;
  descricao?: string;
}

export interface ConexaoExternaItem {
  id: string;
  nome: string;
  descricao: string;
  status: "Conectado" | "Não conectado" | "Em configuração";
  iconeNome: string;
}

export interface SugestaoMelhoriaItem {
  id: string;
  titulo: string;
  descricao: string;
  acaoTexto: "Adicionar" | "Revisar" | "Atualizar";
  categoriaAlvo: string;
  icon: LucideIcon;
  corIcone: string;
  corBg: string;
}

export const CATEGORIAS_INICIAIS: CategoriaConhecimento[] = [
  { id: "todos", nome: "Todos os conteúdos", count: 124, icon: Layers, cor: "text-[#f95d14]" },
  { id: "estrategia", nome: "Estratégia Comercial", count: 18, icon: Target, cor: "text-emerald-400" },
  { id: "produtos", nome: "Produtos e Serviços", count: 12, icon: Briefcase, cor: "text-emerald-400" },
  { id: "processos", nome: "Processos e Procedimentos", count: 15, icon: FileText, cor: "text-blue-400" },
  { id: "scripts", nome: "Scripts e Abordagens", count: 14, icon: Sparkles, cor: "text-blue-400" },
  { id: "objecoes", nome: "Objeções e Respostas", count: 9, icon: ShieldAlert, cor: "text-rose-400" },
  { id: "mercado", nome: "Análise de Mercado", count: 11, icon: BarChart3, cor: "text-rose-400" },
  { id: "concorrencia", nome: "Concorrência", count: 8, icon: Globe, cor: "text-amber-400" },
  { id: "cases", nome: "Cases de Sucesso", count: 6, icon: Trophy, cor: "text-amber-400" },
  { id: "politicas", nome: "Políticas e Diretrizes", count: 7, icon: ShieldCheck, cor: "text-blue-400" },
  { id: "links", nome: "Links e Referências", count: 36, icon: Link2, cor: "text-cyan-400" },
  { id: "faqs", nome: "FAQs", count: 48, icon: HelpCircle, cor: "text-purple-400" },
  { id: "videos", nome: "Treinamentos em Vídeo", count: 4, icon: Video, cor: "text-purple-400" },
  { id: "marketing", nome: "Materiais de Marketing", count: 5, icon: Megaphone, cor: "text-pink-400" },
];

export const DOCUMENTOS_INICIAIS: DocumentoConhecimento[] = [
  {
    id: "doc-1",
    nome: "Apresentação da empresa.pdf",
    tipo: "PDF",
    categoria: "Estratégia Comercial",
    atualizadoEm: "20/10/2026",
    status: "Ativo",
    tamanho: "4.2 MB",
    descricao: "Deck institucional com proposta de valor, nichos atendidos e cases.",
  },
  {
    id: "doc-2",
    nome: "Catálogo de serviços.pdf",
    tipo: "PDF",
    categoria: "Produtos e Serviços",
    atualizadoEm: "19/10/2026",
    status: "Ativo",
    tamanho: "3.1 MB",
    descricao: "Tabela de planos, escopos de entrega, prazos e regras de garantia.",
  },
  {
    id: "doc-3",
    nome: "Processo de vendas.md",
    tipo: "Markdown",
    categoria: "Processos",
    atualizadoEm: "18/10/2026",
    status: "Ativo",
    tamanho: "45 KB",
    descricao: "Etapas do funil, critérios de passagem BANT e SLA de contato.",
  },
  {
    id: "doc-4",
    nome: "Scripts de abordagem.md",
    tipo: "Markdown",
    categoria: "Scripts e Abordagens",
    atualizadoEm: "18/10/2026",
    status: "Ativo",
    tamanho: "28 KB",
    descricao: "Templates de primeiro contato no WhatsApp e LinkedIn com gatilhos mentais.",
  },
  {
    id: "doc-5",
    nome: "Objeções e respostas.pdf",
    tipo: "PDF",
    categoria: "Objeções",
    atualizadoEm: "17/10/2026",
    status: "Ativo",
    tamanho: "1.8 MB",
    descricao: "Guia para contornar objeções de preço, momento, concorrência e autoridade.",
  },
  {
    id: "doc-6",
    nome: "Análise de concorrentes.pdf",
    tipo: "PDF",
    categoria: "Concorrência",
    atualizadoEm: "16/10/2026",
    status: "Ativo",
    tamanho: "2.4 MB",
    descricao: "Matriz comparativa de diferenciais, preços e pontos fracos do mercado.",
  },
  {
    id: "doc-7",
    nome: "Case de sucesso - Cliente A.pdf",
    tipo: "PDF",
    categoria: "Cases de Sucesso",
    atualizadoEm: "15/10/2026",
    status: "Ativo",
    tamanho: "1.2 MB",
    descricao: "Estudo de caso detalhando aumento de 320% em reuniões qualificadas.",
  },
  {
    id: "doc-8",
    nome: "Política comercial.pdf",
    tipo: "PDF",
    categoria: "Diretrizes",
    atualizadoEm: "14/10/2026",
    status: "Ativo",
    tamanho: "950 KB",
    descricao: "Condições de pagamento, descontos autorizados e termos contratuais.",
  },
  {
    id: "doc-9",
    nome: "Links úteis.txt",
    tipo: "Texto",
    categoria: "Links e Referências",
    atualizadoEm: "14/10/2026",
    status: "Ativo",
    tamanho: "12 KB",
    descricao: "Páginas oficiais, links de agendamento e calculadoras de ROI.",
  },
  {
    id: "doc-10",
    nome: "FAQs - Vendas.md",
    tipo: "Markdown",
    categoria: "FAQs",
    atualizadoEm: "13/10/2026",
    status: "Ativo",
    tamanho: "64 KB",
    descricao: "As 48 perguntas mais frequentes de decisores durante o primeiro contato.",
  },
];

export const CONEXOES_EXTERNAS_INICIAIS: ConexaoExternaItem[] = [
  {
    id: "obsidian",
    nome: "Obsidian",
    descricao: "Sincronização de notas e base de conhecimento",
    status: "Conectado",
    iconeNome: "obsidian",
  },
  {
    id: "gdrive",
    nome: "Google Drive",
    descricao: "Documentos e planilhas",
    status: "Não conectado",
    iconeNome: "gdrive",
  },
  {
    id: "notion",
    nome: "Notion",
    descricao: "Base de conhecimento",
    status: "Não conectado",
    iconeNome: "notion",
  },
  {
    id: "github",
    nome: "GitHub",
    descricao: "Repositórios e documentação",
    status: "Não conectado",
    iconeNome: "github",
  },
  {
    id: "dropbox",
    nome: "Dropbox",
    descricao: "Arquivos e materiais",
    status: "Não conectado",
    iconeNome: "dropbox",
  },
];

export const TOPICOS_MAIS_UTILIZADOS = [
  { topico: "Estratégia comercial", consultas: 124 },
  { topico: "Scripts de abordagem", consultas: 98 },
  { topico: "Objeções e respostas", consultas: 76 },
  { topico: "Produtos e serviços", consultas: 64 },
  { topico: "Concorrência", consultas: 52 },
];

export const DESEMPENHO_CONHECIMENTO_SERIE = [
  { data: "01/10", consultas: 48, respostas: 38, aprendizado: 22 },
  { data: "05/10", consultas: 75, respostas: 62, aprendizado: 34 },
  { data: "10/10", consultas: 68, respostas: 55, aprendizado: 30 },
  { data: "15/10", consultas: 115, respostas: 94, aprendizado: 52 },
  { data: "20/10", consultas: 142, respostas: 118, aprendizado: 64 },
  { data: "25/10", consultas: 128, respostas: 105, aprendizado: 58 },
  { data: "30/10", consultas: 155, respostas: 130, aprendizado: 72 },
];

export const SUGESTOES_MELHORIA_INICIAIS: SugestaoMelhoriaItem[] = [
  {
    id: "sug-1",
    titulo: "Adicionar mais casos de sucesso",
    descricao: "Inclua exemplos de clientes do seu nicho",
    acaoTexto: "Adicionar",
    categoriaAlvo: "cases",
    icon: Trophy,
    corIcone: "text-amber-400",
    corBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "sug-2",
    titulo: "Expandir seção de objeções",
    descricao: "Novas objeções detectadas nas conversas",
    acaoTexto: "Revisar",
    categoriaAlvo: "objecoes",
    icon: ShieldAlert,
    corIcone: "text-rose-400",
    corBg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    id: "sug-3",
    titulo: "Atualizar catálogo de serviços",
    descricao: "Última atualização há mais de 30 dias",
    acaoTexto: "Atualizar",
    categoriaAlvo: "produtos",
    icon: RefreshCw,
    corIcone: "text-blue-400",
    corBg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "sug-4",
    titulo: "Adicionar treinamentos em vídeo",
    descricao: "Vídeos curtos melhoram a retenção",
    acaoTexto: "Adicionar",
    categoriaAlvo: "videos",
    icon: Video,
    corIcone: "text-purple-400",
    corBg: "bg-purple-500/10 border-purple-500/20",
  },
];

import { BarChart3 as BarIcon, RefreshCw } from "lucide-react";
const BarChart3 = BarIcon;
