// Tela 04 — Assinaturas & Acordos (Gestão → Contratos → Assinaturas & Acordos)
// Fiel ao layout visual aprovado com máxima fidelidade:
// 1. Cabeçalho com breadcrumbs, título, subtítulo e 3 botões (Exportar relatório, Configurar assinatura eletrônica, Novo acordo)
// 2. Cinco KPIs superiores (Assinaturas pendentes, Acordos concluídos, Aguardando cliente, Documentos enviados, Taxa de conclusão)
// 3. Três gráficos analíticos (Evolução de Assinaturas, Status das Assinaturas tipo Donut e Acordos por Tipo em barras)
// 4. Abas de acompanhamento (Todos, Pendentes, Em assinatura, Assinados, Cancelados) com contadores
// 5. Linha de busca, filtros avançados (Tipo, Status, Responsável, Período) e visualização Grid/Lista
// 6. Tabela completa de 10 documentos com seleção, avatares, códigos, badges coloridos, datas e ações
// 7. Painel lateral direito com dados do cliente, 4 abas, informações contratuais, anexos PDF, botões de ação e Sugestões de IA
import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileEdit,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  HelpCircle,
  History,
  Layers,
  Layout,
  LayoutGrid,
  List,
  Loader2,
  Lock,
  Mail,
  Maximize2,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";

export interface DocumentoAssinaturaItem {
  id: string;
  empresa: string;
  segmento: string;
  localizacao?: string;
  avatarBg: string;
  codigoDocumento: string;
  tituloContrato: string;
  tipoDocumento: "Contrato" | "Acordo" | "Adendo" | "Outros";
  status: "pendente" | "em_assinatura" | "assinado" | "cancelado" | "aguardando";
  statusRotulo: string;
  dataEnvio: string;
  dataVencimento: string;
  responsavelNome: string;
  responsavelAvatar: string;
  valorTotal: number;
  valorMensal: number;
  anexos: { nome: string; tamanho: string; tipoCor: string }[];
}

export const DOCUMENTOS_ASSINATURAS_CATALOGO: DocumentoAssinaturaItem[] = [
  {
    id: "doc-1",
    empresa: "Clinica Sorriso Mais",
    segmento: "Odontologia",
    localizacao: "Curitiba - PR",
    avatarBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    codigoDocumento: "CT-2026-001",
    tituloContrato: "Contrato de Serviços Mensais",
    tipoDocumento: "Contrato",
    status: "pendente",
    statusRotulo: "Pendente",
    dataEnvio: "01/10/2026",
    dataVencimento: "01/10/2027",
    responsavelNome: "Marcos",
    responsavelAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    valorTotal: 58800,
    valorMensal: 4900,
    anexos: [
      { nome: "Contrato assinado.pdf", tamanho: "2,4 MB", tipoCor: "text-red-400 bg-red-500/10" },
      { nome: "Termos e Condições.pdf", tamanho: "1,1 MB", tipoCor: "text-purple-400 bg-purple-500/10" },
      { nome: "Proposta comercial.pdf", tamanho: "1,8 MB", tipoCor: "text-emerald-400 bg-emerald-500/10" },
    ],
  },
  {
    id: "doc-2",
    empresa: "Studio Caiobá",
    segmento: "Barbearia",
    localizacao: "Matinhos - PR",
    avatarBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    codigoDocumento: "AC-2026-002",
    tituloContrato: "Acordo de Parceria Comercial",
    tipoDocumento: "Acordo",
    status: "em_assinatura",
    statusRotulo: "Em assinatura",
    dataEnvio: "04/10/2026",
    dataVencimento: "04/10/2026",
    responsavelNome: "Ana",
    responsavelAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    valorTotal: 18000,
    valorMensal: 1500,
    anexos: [
      { nome: "Acordo de parceria.pdf", tamanho: "1,5 MB", tipoCor: "text-blue-400 bg-blue-500/10" },
    ],
  },
  {
    id: "doc-3",
    empresa: "Parelheiros Advocacia",
    segmento: "Escritório Jurídico",
    localizacao: "São Paulo - SP",
    avatarBg: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    codigoDocumento: "CT-2026-003",
    tituloContrato: "Contrato de Consultoria Estratégica",
    tipoDocumento: "Contrato",
    status: "assinado",
    statusRotulo: "Assinado",
    dataEnvio: "28/09/2026",
    dataVencimento: "28/09/2027",
    responsavelNome: "Carlos",
    responsavelAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    valorTotal: 42000,
    valorMensal: 3500,
    anexos: [
      { nome: "Contrato assinado digitalmente.pdf", tamanho: "3,2 MB", tipoCor: "text-red-400 bg-red-500/10" },
    ],
  },
  {
    id: "doc-4",
    empresa: "Costa Advocacia",
    segmento: "Advocacia",
    localizacao: "Curitiba - PR",
    avatarBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    codigoDocumento: "AD-2026-004",
    tituloContrato: "Termo Aditivo de Escopo",
    tipoDocumento: "Adendo",
    status: "pendente",
    statusRotulo: "Pendente",
    dataEnvio: "27/09/2026",
    dataVencimento: "27/09/2027",
    responsavelNome: "Juliana",
    responsavelAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    valorTotal: 12000,
    valorMensal: 1000,
    anexos: [
      { nome: "Adendo contratual.pdf", tamanho: "850 KB", tipoCor: "text-amber-400 bg-amber-500/10" },
    ],
  },
  {
    id: "doc-5",
    empresa: "Dra. Julia Lins",
    segmento: "Odontologia",
    localizacao: "Florianópolis - SC",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    codigoDocumento: "CT-2026-005",
    tituloContrato: "Contrato de Gestão de Tráfego",
    tipoDocumento: "Contrato",
    status: "assinado",
    statusRotulo: "Assinado",
    dataEnvio: "24/09/2026",
    dataVencimento: "24/09/2027",
    responsavelNome: "Marcos",
    responsavelAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    valorTotal: 30000,
    valorMensal: 2500,
    anexos: [
      { nome: "Contrato final.pdf", tamanho: "2,1 MB", tipoCor: "text-red-400 bg-red-500/10" },
    ],
  },
  {
    id: "doc-6",
    empresa: "Conrad Marcel",
    segmento: "Consultório Odontológico",
    localizacao: "Joinville - SC",
    avatarBg: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
    codigoDocumento: "CT-2026-006",
    tituloContrato: "Contrato de Desenvolvimento de Site",
    tipoDocumento: "Contrato",
    status: "cancelado",
    statusRotulo: "Cancelado",
    dataEnvio: "20/09/2026",
    dataVencimento: "20/09/2027",
    responsavelNome: "Ana",
    responsavelAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    valorTotal: 8500,
    valorMensal: 0,
    anexos: [
      { nome: "Distrato formal.pdf", tamanho: "920 KB", tipoCor: "text-slate-400 bg-slate-500/10" },
    ],
  },
  {
    id: "doc-7",
    empresa: "VK Odontologia",
    segmento: "Odontologia",
    localizacao: "Porto Alegre - RS",
    avatarBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    codigoDocumento: "AC-2026-007",
    tituloContrato: "Acordo de Nível de Serviço",
    tipoDocumento: "Acordo",
    status: "aguardando",
    statusRotulo: "Aguardando",
    dataEnvio: "18/09/2026",
    dataVencimento: "18/09/2026",
    responsavelNome: "Carlos",
    responsavelAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    valorTotal: 15600,
    valorMensal: 1300,
    anexos: [
      { nome: "SLA_assinado.pdf", tamanho: "1,3 MB", tipoCor: "text-blue-400 bg-blue-500/10" },
    ],
  },
  {
    id: "doc-8",
    empresa: "Heloisa Barbosa",
    segmento: "Consultório Odontológico",
    localizacao: "Maringá - PR",
    avatarBg: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
    codigoDocumento: "CT-2026-008",
    tituloContrato: "Contrato de Produção de Conteúdo",
    tipoDocumento: "Contrato",
    status: "em_assinatura",
    statusRotulo: "Em assinatura",
    dataEnvio: "15/09/2026",
    dataVencimento: "15/09/2027",
    responsavelNome: "Juliana",
    responsavelAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    valorTotal: 21600,
    valorMensal: 1800,
    anexos: [
      { nome: "Minuta contratual.pdf", tamanho: "1,7 MB", tipoCor: "text-red-400 bg-red-500/10" },
    ],
  },
  {
    id: "doc-9",
    empresa: "Clinica COST",
    segmento: "Odontologia",
    localizacao: "Londrina - PR",
    avatarBg: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    codigoDocumento: "CT-2026-009",
    tituloContrato: "Contrato de Suporte Técnico",
    tipoDocumento: "Contrato",
    status: "assinado",
    statusRotulo: "Assinado",
    dataEnvio: "10/09/2026",
    dataVencimento: "10/09/2027",
    responsavelNome: "Marcos",
    responsavelAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    valorTotal: 33600,
    valorMensal: 2800,
    anexos: [
      { nome: "Contrato assinado.pdf", tamanho: "2,0 MB", tipoCor: "text-red-400 bg-red-500/10" },
    ],
  },
  {
    id: "doc-10",
    empresa: "Dourados Odontologia",
    segmento: "Odontologia",
    localizacao: "Dourados - MS",
    avatarBg: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    codigoDocumento: "AD-2026-010",
    tituloContrato: "Termo de Aditivo de Valor",
    tipoDocumento: "Adendo",
    status: "pendente",
    statusRotulo: "Pendente",
    dataEnvio: "05/09/2026",
    dataVencimento: "05/09/2027",
    responsavelNome: "Ana",
    responsavelAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    valorTotal: 7200,
    valorMensal: 600,
    anexos: [
      { nome: "Adendo_reajuste.pdf", tamanho: "750 KB", tipoCor: "text-amber-400 bg-amber-500/10" },
    ],
  },
];

interface AssinaturasAcordosViewProps {
  onNovoAcordo?: () => void;
  onVoltarPainel?: () => void;
  onEditarContrato?: (docId: string) => void;
}

export function AssinaturasAcordosView({
  onNovoAcordo,
  onVoltarPainel,
  onEditarContrato,
}: AssinaturasAcordosViewProps) {
  // Aba ativa de filtro superior
  const [abaStatus, setAbaStatus] = useState<"todos" | "pendente" | "em_assinatura" | "assinado" | "cancelado">("todos");

  // Filtros de busca e tabela
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroStatusSelect, setFiltroStatusSelect] = useState("all");
  const [filtroResponsavel, setFiltroResponsavel] = useState("all");
  const [filtroPeriodo, setFiltroPeriodo] = useState("01/10/2026 - 31/10/2026");

  // Documento selecionado para o painel lateral direito
  const [documentoSelecionado, setDocumentoSelecionado] = useState<DocumentoAssinaturaItem>(
    DOCUMENTOS_ASSINATURAS_CATALOGO[0]
  );

  // Aba do painel lateral direito
  const [abaPainelLateral, setAbaPainelLateral] = useState<"visao_geral" | "servicos" | "faturamento" | "historico">("visao_geral");

  // Modais
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [modalConfigAssinaturaAberto, setModalConfigAssinaturaAberto] = useState(false);
  const [modalNovoAcordoAberto, setModalNovoAcordoAberto] = useState(false);
  const [modalVerDocumentoAberto, setModalVerDocumentoAberto] = useState(false);

  // Paginação da tabela
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Filtragem da tabela
  const documentosFiltrados = useMemo(() => {
    return DOCUMENTOS_ASSINATURAS_CATALOGO.filter((doc) => {
      // Aba de status
      const matchAba =
        abaStatus === "todos" ||
        (abaStatus === "pendente" && (doc.status === "pendente" || doc.status === "aguardando")) ||
        (abaStatus === "em_assinatura" && doc.status === "em_assinatura") ||
        (abaStatus === "assinado" && doc.status === "assinado") ||
        (abaStatus === "cancelado" && doc.status === "cancelado");

      // Busca por empresa, contato ou código
      const matchBusca =
        !busca ||
        doc.empresa.toLowerCase().includes(busca.toLowerCase()) ||
        doc.codigoDocumento.toLowerCase().includes(busca.toLowerCase()) ||
        doc.tituloContrato.toLowerCase().includes(busca.toLowerCase()) ||
        doc.segmento.toLowerCase().includes(busca.toLowerCase());

      // Tipo
      const matchTipo = filtroTipo === "all" || doc.tipoDocumento === filtroTipo;

      // Status Select
      const matchStatusSelect = filtroStatusSelect === "all" || doc.status === filtroStatusSelect;

      // Responsável
      const matchResp = filtroResponsavel === "all" || doc.responsavelNome === filtroResponsavel;

      return matchAba && matchBusca && matchTipo && matchStatusSelect && matchResp;
    });
  }, [abaStatus, busca, filtroTipo, filtroStatusSelect, filtroResponsavel]);

  // Contadores para as abas
  const contadoresAbas = {
    todos: DOCUMENTOS_ASSINATURAS_CATALOGO.length,
    pendentes: 12,
    emAssinatura: 7,
    assinados: 28,
    cancelados: 2,
  };

  return (
    <div className="space-y-4 text-neutral-100">
      {/* =========================================================================
          1. CABEÇALHO DA TELA 04 & BREADCRUMBS
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#1b2232] pb-4">
        <div>
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
          >
            {onVoltarPainel && (
              <button
                type="button"
                onClick={onVoltarPainel}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors mr-1"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="size-3" />
                <span>Voltar</span>
              </button>
            )}
            <span>Gestão</span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span
              onClick={onVoltarPainel}
              className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
            >
              Contratos
            </span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span className="flex items-center gap-1 text-orange-400 font-semibold">
              <span className="size-1.5 rounded-full bg-orange-500" />
              Assinaturas & Acordos
            </span>
          </nav>

          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <ScrollText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Assinaturas & Acordos
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Acompanhe assinaturas pendentes, acordos concluídos e todo o histórico.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Botões Superiores do Cabeçalho */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Exportar relatório */}
          <button
            type="button"
            onClick={() => setModalExportarAberto(true)}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs font-semibold text-neutral-200 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <Download className="size-3.5 text-neutral-400" />
            <span>Exportar relatório</span>
          </button>

          {/* 2. Configurar assinatura eletrônica (Roxo) */}
          <button
            type="button"
            onClick={() => setModalConfigAssinaturaAberto(true)}
            className="flex h-9 items-center gap-2 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Settings className="size-3.5 text-purple-200" />
            <span>Configurar assinatura eletrônica</span>
          </button>

          {/* 3. Novo acordo (Laranja) */}
          <button
            type="button"
            onClick={() => (onNovoAcordo ? onNovoAcordo() : setModalNovoAcordoAberto(true))}
            className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Novo acordo</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. CINCO CARDS DE INDICADORES SUPERIORES (KPIs)
         ========================================================================= */}
      <section aria-label="Indicadores de Assinaturas" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Assinaturas pendentes (Laranja) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-3.5 shadow-sm hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Assinaturas pendentes</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#f97316]">
              <Pencil className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">12</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-400">
            <span>-25% vs. mês anterior</span>
          </div>
        </div>

        {/* Card 2: Acordos concluídos (Verde) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-3.5 shadow-sm hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Acordos concluídos</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">28</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span>+40% vs. mês anterior</span>
          </div>
        </div>

        {/* Card 3: Aguardando cliente (Azul) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-3.5 shadow-sm hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Aguardando cliente</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">7</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-400">
            <span>-12% vs. mês anterior</span>
          </div>
        </div>

        {/* Card 4: Documentos enviados (Roxo) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-3.5 shadow-sm hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Documentos enviados</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">43</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span>+18% vs. mês anterior</span>
          </div>
        </div>

        {/* Card 5: Taxa de conclusão (Amarelo / Dourado) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-3.5 shadow-sm hover:border-white/10 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Taxa de conclusão</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">72,4%</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span>+12% vs. mês anterior</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. TRÊS GRÁFICOS ANALÍTICOS (EVOLUÇÃO, STATUS ROSCA E ACORDOS POR TIPO)
         ========================================================================= */}
      <section aria-label="Gráficos de Assinaturas" className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Gráfico 1: Evolução de Assinaturas (5 colunas) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white">Evolução de Assinaturas</h2>
            <select className="rounded-lg border border-white/10 bg-[#121620] px-2 py-0.5 text-[10px] text-neutral-300 focus:outline-none">
              <option>Últimos 30 dias</option>
              <option>Últimos 90 dias</option>
              <option>Este ano</option>
            </select>
          </div>

          {/* Gráfico de Linhas SVG de Alta Fidelidade */}
          <div className="relative h-44 w-full">
            <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
              {/* Linhas de Grade e Eixo Y */}
              <line x1="30" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="50" x2="390" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="80" x2="390" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="110" x2="390" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="135" x2="390" y2="135" stroke="rgba(255,255,255,0.1)" />

              {/* Rótulos do Eixo Y */}
              <text x="15" y="24" fill="#6b7280" fontSize="9" fontFamily="monospace">40</text>
              <text x="15" y="54" fill="#6b7280" fontSize="9" fontFamily="monospace">30</text>
              <text x="15" y="84" fill="#6b7280" fontSize="9" fontFamily="monospace">20</text>
              <text x="15" y="114" fill="#6b7280" fontSize="9" fontFamily="monospace">10</text>
              <text x="20" y="138" fill="#6b7280" fontSize="9" fontFamily="monospace">0</text>

              {/* Rótulos do Eixo X */}
              <text x="40" y="148" fill="#6b7280" fontSize="8">01/10</text>
              <text x="95" y="148" fill="#6b7280" fontSize="8">05/10</text>
              <text x="150" y="148" fill="#6b7280" fontSize="8">10/10</text>
              <text x="205" y="148" fill="#6b7280" fontSize="8">15/10</text>
              <text x="260" y="148" fill="#6b7280" fontSize="8">20/10</text>
              <text x="315" y="148" fill="#6b7280" fontSize="8">25/10</text>
              <text x="365" y="148" fill="#6b7280" fontSize="8">31/10</text>

              {/* Linha 1: Enviados (Azul) */}
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                points="45,95 100,80 155,75 210,65 265,58 320,45 375,32"
              />
              <circle cx="45" cy="95" r="2.5" fill="#38bdf8" />
              <circle cx="100" cy="80" r="2.5" fill="#38bdf8" />
              <circle cx="155" cy="75" r="2.5" fill="#38bdf8" />
              <circle cx="210" cy="65" r="2.5" fill="#38bdf8" />
              <circle cx="265" cy="58" r="2.5" fill="#38bdf8" />
              <circle cx="320" cy="45" r="2.5" fill="#38bdf8" />
              <circle cx="375" cy="32" r="3" fill="#38bdf8" />

              {/* Linha 2: Aguardando (Amarelo) */}
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.8"
                points="45,115 100,105 155,100 210,95 265,102 320,95 375,85"
              />
              <circle cx="45" cy="115" r="2.5" fill="#fbbf24" />
              <circle cx="100" cy="105" r="2.5" fill="#fbbf24" />
              <circle cx="155" cy="100" r="2.5" fill="#fbbf24" />
              <circle cx="210" cy="95" r="2.5" fill="#fbbf24" />
              <circle cx="265" cy="102" r="2.5" fill="#fbbf24" />
              <circle cx="320" cy="95" r="2.5" fill="#fbbf24" />
              <circle cx="375" cy="85" r="2.5" fill="#fbbf24" />

              {/* Linha 3: Assinados (Verde) */}
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="1.8"
                points="45,128 100,120 155,118 210,108 265,100 320,90 375,78"
              />
              <circle cx="45" cy="128" r="2.5" fill="#34d399" />
              <circle cx="100" cy="120" r="2.5" fill="#34d399" />
              <circle cx="155" cy="118" r="2.5" fill="#34d399" />
              <circle cx="210" cy="108" r="2.5" fill="#34d399" />
              <circle cx="265" cy="100" r="2.5" fill="#34d399" />
              <circle cx="320" cy="90" r="2.5" fill="#34d399" />
              <circle cx="375" cy="78" r="2.5" fill="#34d399" />

              {/* Linha 4: Cancelados (Vermelho) */}
              <polyline
                fill="none"
                stroke="#f87171"
                strokeWidth="1.5"
                points="45,133 100,132 155,130 210,131 265,129 320,130 375,128"
              />
              <circle cx="375" cy="128" r="2" fill="#f87171" />
            </svg>
          </div>

          {/* Legenda Horizontal */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#38bdf8]" />
              <span>Enviados</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#fbbf24]" />
              <span>Aguardando</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#34d399]" />
              <span>Assinados</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#f87171]" />
              <span>Cancelados</span>
            </span>
          </div>
        </div>

        {/* Gráfico 2: Status das Assinaturas tipo Donut (3 colunas) */}
        <div className="lg:col-span-3 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white">Status das Assinaturas</h2>
            <select className="rounded-lg border border-white/10 bg-[#121620] px-2 py-0.5 text-[10px] text-neutral-300 focus:outline-none">
              <option>Todos os status</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Donut SVG com Centro Informativo */}
            <div className="relative size-32 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                {/* Círculo Base */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                {/* 1. Assinado (52% Verde) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray="238.7"
                  strokeDashoffset="114.5"
                />
                {/* 2. Pendente (28% Amarelo) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="14"
                  strokeDasharray="238.7"
                  strokeDashoffset="171.8"
                  style={{ transform: "rotate(187deg)", transformOrigin: "50px 50px" }}
                />
                {/* 3. Em assinatura (16% Azul) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="14"
                  strokeDasharray="238.7"
                  strokeDashoffset="200.5"
                  style={{ transform: "rotate(288deg)", transformOrigin: "50px 50px" }}
                />
                {/* 4. Cancelado (4% Vermelho) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="14"
                  strokeDasharray="238.7"
                  strokeDashoffset="229.1"
                  style={{ transform: "rotate(345deg)", transformOrigin: "50px 50px" }}
                />
              </svg>
              {/* Texto Central */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-white font-mono leading-none">43</span>
                <span className="text-[9px] text-neutral-400 mt-0.5">Documentos</span>
              </div>
            </div>

            {/* Legenda Lateral com Percentuais */}
            <div className="space-y-2 text-[11px] flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="size-2 rounded-full bg-[#f59e0b]" />
                  <span>Pendente</span>
                </span>
                <span className="font-mono font-bold text-neutral-400">28%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="size-2 rounded-full bg-[#0ea5e9]" />
                  <span>Em assinatura</span>
                </span>
                <span className="font-mono font-bold text-neutral-400">16%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="size-2 rounded-full bg-[#10b981]" />
                  <span>Assinado</span>
                </span>
                <span className="font-mono font-bold text-neutral-400">52%</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="size-2 rounded-full bg-[#ef4444]" />
                  <span>Cancelado</span>
                </span>
                <span className="font-mono font-bold text-neutral-400">4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Acordos por Tipo (4 colunas) */}
        <div className="lg:col-span-4 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white">Acordos por Tipo</h2>
            <select className="rounded-lg border border-white/10 bg-[#121620] px-2 py-0.5 text-[10px] text-neutral-300 focus:outline-none">
              <option>Últimos 30 dias</option>
            </select>
          </div>

          {/* Gráfico de Barras Coloridas com Valores no Topo */}
          <div className="relative h-44 w-full flex items-end justify-between px-6 pt-4 pb-2">
            {/* Eixo horizontal */}
            <div className="absolute inset-x-4 bottom-7 h-px bg-white/10" />

            {/* Barra 1: Contrato (24 - Azul) */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-12">
              <span className="text-[10px] font-mono font-bold text-sky-400">24</span>
              <div className="w-9 h-28 rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400 shadow-sm shadow-sky-500/20" />
              <span className="text-[10px] text-neutral-400 mt-1">Contrato</span>
            </div>

            {/* Barra 2: Acordo (12 - Amarela) */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-12">
              <span className="text-[10px] font-mono font-bold text-amber-400">12</span>
              <div className="w-9 h-16 rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 shadow-sm shadow-amber-500/20" />
              <span className="text-[10px] text-neutral-400 mt-1">Acordo</span>
            </div>

            {/* Barra 3: Adendo (6 - Verde) */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-12">
              <span className="text-[10px] font-mono font-bold text-emerald-400">6</span>
              <div className="w-9 h-10 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/20" />
              <span className="text-[10px] text-neutral-400 mt-1">Adendo</span>
            </div>

            {/* Barra 4: Outros (3 - Roxa) */}
            <div className="flex flex-col items-center gap-1.5 z-10 w-12">
              <span className="text-[10px] font-mono font-bold text-purple-400">3</span>
              <div className="w-9 h-6 rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 shadow-sm shadow-purple-500/20" />
              <span className="text-[10px] text-neutral-400 mt-1">Outros</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ABAS DE ACOMPANHAMENTO (TODOS, PENDENTES, EM ASSINATURA, ASSINADOS, CANCELADOS)
         ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2">
        <button
          type="button"
          onClick={() => setAbaStatus("todos")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
            abaStatus === "todos"
              ? "bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold"
              : "border border-transparent bg-[#121620] text-neutral-400 hover:text-white"
          )}
        >
          <FileText className="size-3.5" />
          <span>Todos</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaStatus("pendente")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
            abaStatus === "pendente"
              ? "bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold"
              : "border border-transparent bg-[#121620] text-neutral-400 hover:text-white"
          )}
        >
          <Clock className="size-3.5 text-amber-400" />
          <span>Pendentes ({contadoresAbas.pendentes})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaStatus("em_assinatura")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
            abaStatus === "em_assinatura"
              ? "bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold"
              : "border border-transparent bg-[#121620] text-neutral-400 hover:text-white"
          )}
        >
          <Pencil className="size-3.5 text-sky-400" />
          <span>Em assinatura ({contadoresAbas.emAssinatura})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaStatus("assinado")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
            abaStatus === "assinado"
              ? "bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold"
              : "border border-transparent bg-[#121620] text-neutral-400 hover:text-white"
          )}
        >
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          <span>Assinados ({contadoresAbas.assinados})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaStatus("cancelado")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
            abaStatus === "cancelado"
              ? "bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold"
              : "border border-transparent bg-[#121620] text-neutral-400 hover:text-white"
          )}
        >
          <X className="size-3.5 text-rose-400" />
          <span>Cancelados ({contadoresAbas.cancelados})</span>
        </button>
      </div>

      {/* =========================================================================
          5. LINHA DE BUSCA E FILTROS AVANÇADOS
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por empresa, contato ou assunto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0c1017] pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0c1017] px-3 py-2 text-neutral-300 focus:outline-none"
          >
            <option value="all">Todos os tipos</option>
            <option value="Contrato">Contrato</option>
            <option value="Acordo">Acordo</option>
            <option value="Adendo">Adendo</option>
          </select>

          {/* Status */}
          <select
            value={filtroStatusSelect}
            onChange={(e) => setFiltroStatusSelect(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0c1017] px-3 py-2 text-neutral-300 focus:outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em_assinatura">Em assinatura</option>
            <option value="assinado">Assinado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Responsável */}
          <select
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0c1017] px-3 py-2 text-neutral-300 focus:outline-none"
          >
            <option value="all">Todos os responsáveis</option>
            <option value="Marcos">Marcos</option>
            <option value="Ana">Ana</option>
            <option value="Carlos">Carlos</option>
            <option value="Juliana">Juliana</option>
          </select>

          {/* Período */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0c1017] px-3 py-2 text-neutral-300">
            <Calendar className="size-3.5 text-neutral-500" />
            <span className="font-mono text-[11px]">{filtroPeriodo}</span>
          </div>

          {/* Botões Grid / Lista */}
          <div className="flex items-center gap-1 bg-[#0c1017] border border-white/10 rounded-xl p-1">
            <button className="p-1.5 rounded-lg bg-orange-500 text-white" title="Grade">
              <LayoutGrid className="size-3.5" />
            </button>
            <button className="p-1.5 rounded-lg text-neutral-400 hover:text-white" title="Lista">
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. ÁREA PRINCIPAL: TABELA DE DOCUMENTOS + PAINEL LATERAL DIREITO
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =======================================================================
            TABELA DE DOCUMENTOS (8 colunas no lg)
           ======================================================================= */}
        <section aria-label="Tabela de Documentos" className="lg:col-span-8 rounded-2xl border border-[#1b2232] bg-[#0c1017] shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#121620]/70 text-[10px] uppercase tracking-wider text-neutral-400">
                  <th className="py-3 px-3 w-8">
                    <input type="checkbox" className="size-3.5 rounded border-white/20 bg-[#0c1017]" />
                  </th>
                  <th className="py-3 px-3 font-semibold">Empresa / Cliente</th>
                  <th className="py-3 px-3 font-semibold">Documento</th>
                  <th className="py-3 px-3 font-semibold">Tipo</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Enviado em</th>
                  <th className="py-3 px-3 font-semibold">Vencimento</th>
                  <th className="py-3 px-3 font-semibold">Responsável</th>
                  <th className="py-3 px-3 font-semibold text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documentosFiltrados.map((doc) => {
                  const isSelected = documentoSelecionado.id === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setDocumentoSelecionado(doc)}
                      className={cn(
                        "group cursor-pointer transition-colors",
                        isSelected
                          ? "bg-orange-500/10 border-l-2 border-l-orange-500"
                          : "hover:bg-white/[0.03]"
                      )}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setDocumentoSelecionado(doc)}
                          className="size-3.5 rounded border-white/20 bg-[#0c1017] text-orange-500"
                        />
                      </td>

                      {/* Empresa / Cliente com Avatar */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-lg font-bold text-[10px]",
                              doc.avatarBg
                            )}
                          >
                            {doc.empresa.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate text-[11px] group-hover:text-orange-400 transition-colors">
                              {doc.empresa}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {doc.segmento}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Código do Documento */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-300">
                        {doc.codigoDocumento}
                      </td>

                      {/* Tipo de Documento */}
                      <td className="py-2.5 px-3 text-[11px] text-neutral-300">
                        {doc.tipoDocumento}
                      </td>

                      {/* Status com Badge Estilizado Fiel à Imagem */}
                      <td className="py-2.5 px-3">
                        {doc.status === "pendente" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-orange-500/40 bg-orange-500/15 text-orange-400 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Pendente
                          </span>
                        )}
                        {doc.status === "em_assinatura" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/15 text-sky-400 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-sky-500" />
                            Em assinatura
                          </span>
                        )}
                        {doc.status === "assinado" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Assinado
                          </span>
                        )}
                        {doc.status === "cancelado" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-400 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Cancelado
                          </span>
                        )}
                        {doc.status === "aguardando" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            Aguardando
                          </span>
                        )}
                      </td>

                      {/* Enviado em */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                        {doc.dataEnvio}
                      </td>

                      {/* Vencimento */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                        {doc.dataVencimento}
                      </td>

                      {/* Responsável com Avatar */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={doc.responsavelAvatar}
                            alt={doc.responsavelNome}
                            className="size-5 rounded-full object-cover border border-white/10"
                          />
                          <span className="text-[11px] text-neutral-300 font-medium">
                            {doc.responsavelNome}
                          </span>
                        </div>
                      </td>

                      {/* Ações (Visualizar, Baixar, 3-dots) */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDocumentoSelecionado(doc);
                              setModalVerDocumentoAberto(true);
                            }}
                            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Visualizar documento"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.info(`Baixando cópia oficial de ${doc.codigoDocumento}...`)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Baixar arquivo"
                          >
                            <Download className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.info(`Mais opções para ${doc.codigoDocumento}`)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Opções"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé da Tabela com Paginação Fiel */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/5 bg-[#121620]/40 text-xs">
            {/* Controles de Página */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                className="size-7 rounded-lg border border-white/10 bg-[#0c1017] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <button
                type="button"
                className="size-7 rounded-lg bg-orange-500 font-bold text-white text-[11px]"
              >
                1
              </button>

              <button
                type="button"
                className="size-7 rounded-lg border border-white/10 bg-[#0c1017] text-neutral-400 hover:text-white text-[11px]"
              >
                2
              </button>

              <button
                type="button"
                className="size-7 rounded-lg border border-white/10 bg-[#0c1017] text-neutral-400 hover:text-white text-[11px]"
              >
                3
              </button>

              <span className="px-1 text-neutral-500">...</span>

              <button
                type="button"
                className="size-7 rounded-lg border border-white/10 bg-[#0c1017] text-neutral-400 hover:text-white text-[11px]"
              >
                10
              </button>

              <button
                type="button"
                onClick={() => setPaginaAtual((p) => p + 1)}
                className="size-7 rounded-lg border border-white/10 bg-[#0c1017] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Seletor de Itens por Página & Contador */}
            <div className="flex items-center gap-4 text-neutral-400 text-[11px]">
              <select
                value={itensPorPagina}
                onChange={(e) => setItensPorPagina(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-[#0c1017] px-2 py-1 text-neutral-300 focus:outline-none"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>

              <span>Mostrando 1 - 10 de 100 documentos</span>
            </div>
          </div>
        </section>

        {/* =======================================================================
            PAINEL LATERAL DIREITO — DOCUMENTO SELECIONADO (4 colunas no lg)
           ======================================================================= */}
        <aside
          aria-label="Detalhes do Documento Selecionado"
          className="lg:col-span-4 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-4 shadow-md space-y-4 text-xs"
        >
          {/* Topo do Painel Direito */}
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl font-bold text-xs",
                  documentoSelecionado.avatarBg
                )}
              >
                {documentoSelecionado.empresa.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {documentoSelecionado.empresa}
                </h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  {documentoSelecionado.segmento} • {documentoSelecionado.localizacao}
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Ativo
            </span>
          </div>

          {/* Título do Contrato e Badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{documentoSelecionado.tituloContrato}</p>
              <p className="font-mono text-[10px] text-neutral-500 mt-0.5">
                #{documentoSelecionado.codigoDocumento}
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Assinado
            </span>
          </div>

          {/* Quatro Abas do Painel */}
          <div className="flex items-center gap-1 border-b border-white/5 pb-2">
            {[
              { id: "visao_geral", rotulo: "Visão Geral" },
              { id: "servicos", rotulo: "Serviços" },
              { id: "faturamento", rotulo: "Faturamento" },
              { id: "historico", rotulo: "Histórico" },
            ].map((aba) => {
              const ativa = abaPainelLateral === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAbaPainelLateral(aba.id as any)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all text-center",
                    ativa
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {aba.rotulo}
                </button>
              );
            })}
          </div>

          {/* Bloco: Informações do Contrato */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Informações do Contrato
            </h4>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div>
                <span className="text-[10px] text-neutral-500 block">Número do contrato</span>
                <span className="font-mono font-bold text-white">
                  {documentoSelecionado.codigoDocumento}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Valor total</span>
                <span className="font-mono font-bold text-white">
                  {formatBRL(documentoSelecionado.valorTotal)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Valor mensal</span>
                <span className="font-mono font-bold text-white">
                  {formatBRL(documentoSelecionado.valorMensal)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Tipo</span>
                <span className="font-medium text-white">Serviços mensais</span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Início</span>
                <span className="font-mono text-neutral-300">{documentoSelecionado.dataEnvio}</span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Vencimento</span>
                <span className="font-mono text-neutral-300">
                  {documentoSelecionado.dataVencimento}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Responsável</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <img
                    src={documentoSelecionado.responsavelAvatar}
                    alt={documentoSelecionado.responsavelNome}
                    className="size-4 rounded-full object-cover"
                  />
                  <span className="font-medium text-white">
                    {documentoSelecionado.responsavelNome} Gonçalves
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">Status</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Ativo
                </span>
              </div>
            </div>
          </div>

          {/* Bloco: Documentos e Anexos */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Documentos
            </h4>

            <div className="space-y-1.5">
              {documentoSelecionado.anexos.map((anexo, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-[#121620] hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg font-bold text-[9px]",
                        anexo.tipoCor
                      )}
                    >
                      PDF
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{anexo.nome}</p>
                      <p className="text-[9px] text-neutral-500 font-mono">{anexo.tamanho}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.success(`Download de ${anexo.nome} concluído!`)}
                    className="p-1 rounded text-neutral-400 hover:text-white"
                    title="Baixar PDF"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => toast.info("Selecione um arquivo PDF para anexar ao contrato.")}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-white/10 hover:border-orange-500/40 text-[10px] font-semibold text-neutral-400 hover:text-white transition-all"
              >
                <Plus className="size-3" />
                <span>Adicionar documento</span>
              </button>
            </div>
          </div>

          {/* Botões de Ação do Painel */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModalVerDocumentoAberto(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all active:scale-[0.98]"
              >
                <Eye className="size-3.5" />
                <span>Ver contrato</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onEditarContrato
                    ? onEditarContrato(documentoSelecionado.id)
                    : toast.info(`Editando ${documentoSelecionado.codigoDocumento}...`)
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-xs font-semibold text-neutral-200 transition-all"
              >
                <Pencil className="size-3.5" />
                <span>Editar</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => toast.success(`Contrato reenviado para ${documentoSelecionado.empresa}!`)}
                className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
              >
                <Send className="size-3" />
                <span>Enviar</span>
              </button>

              <button
                type="button"
                onClick={() => toast.success("Aditivo de renovação anual preparado!")}
                className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
              >
                <RefreshCw className="size-3" />
                <span>Renovar</span>
              </button>

              <button
                type="button"
                onClick={() => toast.info("Histórico de auditoria e logs de assinatura.")}
                className="flex items-center justify-center gap-1 py-1.5 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
              >
                <span>Mais ações</span>
                <ChevronDown className="size-3" />
              </button>
            </div>
          </div>

          {/* Bloco: Sugestões de IA (Roxo) */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-[#180f28] to-[#0c1017] p-3.5 space-y-2.5 shadow-md shadow-purple-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-purple-400" />
                <h4 className="text-xs font-bold text-white">Sugestões de IA</h4>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Central de automações de IA para Contratos.")}
                className="text-[10px] font-semibold text-purple-400 hover:text-purple-300"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-1.5">
              {/* Sugestão 1: Programar renovação */}
              <div
                onClick={() => toast.success("Alerta de renovação programado para 15 dias antes!")}
                className="flex items-center justify-between p-2 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                    <Calendar className="size-3" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white group-hover:text-purple-200">
                      Programar renovação antecipada
                    </p>
                    <p className="text-[9px] text-purple-300/70">Este contrato vence em 30 dias.</p>
                  </div>
                </div>
                <ChevronRight className="size-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Sugestão 2: Upgrade de plano */}
              <div
                onClick={() => toast.success("Proposta de upgrade de plano gerada pela IA!")}
                className="flex items-center justify-between p-2 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                    <TrendingUp className="size-3" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white group-hover:text-purple-200">
                      Sugerir upgrade de plano
                    </p>
                    <p className="text-[9px] text-purple-300/70">Baseado na utilização e crescimento.</p>
                  </div>
                </div>
                <ChevronRight className="size-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Sugestão 3: Preparar proposta de renovação */}
              <div
                onClick={() => toast.success("Minuta de renovação preparada com reajuste IPCA!")}
                className="flex items-center justify-between p-2 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                    <FileText className="size-3" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white group-hover:text-purple-200">
                      Preparar proposta de renovação
                    </p>
                    <p className="text-[9px] text-purple-300/70">Inclui mais dados de retorno sobre o investimento.</p>
                  </div>
                </div>
                <ChevronRight className="size-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          MODAIS AUXILIARES
         ========================================================================= */}
      {/* 1. Modal Exportar Relatório */}
      {modalExportarAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalExportarAberto(false)}>
          <DialogContent className="sm:max-w-md bg-[#0c1017] border border-[#1b2232] text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Download className="size-4 text-orange-500" />
                Exportar Relatório de Assinaturas
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-neutral-400 leading-relaxed">
                Escolha o formato desejado para exportar todos os dados de acordos, status de
                assinaturas e histórico de signatários filtrados.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalExportarAberto(false);
                    toast.success("Relatório CSV gerado e baixado com sucesso!");
                  }}
                  className="p-3 rounded-xl border border-white/10 bg-[#121620] hover:border-orange-500/50 text-left"
                >
                  <p className="font-bold text-white">Planilha CSV / Excel</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Todos os 100 registros</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalExportarAberto(false);
                    toast.success("Relatório executivo PDF gerado!");
                  }}
                  className="p-3 rounded-xl border border-white/10 bg-[#121620] hover:border-orange-500/50 text-left"
                >
                  <p className="font-bold text-white">Documento PDF</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Com gráficos e KPIs</p>
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalExportarAberto(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. Modal Configurar Assinatura Eletrônica */}
      {modalConfigAssinaturaAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalConfigAssinaturaAberto(false)}>
          <DialogContent className="sm:max-w-lg bg-[#0c1017] border border-purple-500/30 text-white p-5 rounded-2xl">
            <DialogHeader className="border-b border-purple-500/20 pb-3">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Settings className="size-4 text-purple-400" />
                Configurar Assinatura Eletrônica & Provedores
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Provedor de Assinatura
                </label>
                <select className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:outline-none">
                  <option>Clicksign (Recomendado BR)</option>
                  <option>D4Sign</option>
                  <option>DocuSign</option>
                  <option>Assinatura Gov.br / ICP-Brasil</option>
                  <option>Assinatura Interna Flow Business (Audit Trail)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    Prazo de Expiração
                  </label>
                  <select className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:outline-none">
                    <option>30 dias</option>
                    <option>15 dias</option>
                    <option>60 dias</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    Lembretes Automáticos
                  </label>
                  <select className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:outline-none">
                    <option>A cada 3 dias</option>
                    <option>Semanalmente</option>
                    <option>Desativado</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121620] p-3 space-y-1 text-neutral-400 text-[11px]">
                <p className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Validade Jurídica no Brasil (MP 2.200-2/2001)
                </p>
                <p>
                  As assinaturas eletrônicas avançadas geram trilha completa de auditoria (IP, hash
                  SHA-256, carimbo de tempo e e-mail autenticado).
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setModalConfigAssinaturaAberto(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalConfigAssinaturaAberto(false);
                  toast.success("Configurações de assinatura eletrônica salvas com sucesso!");
                }}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20"
              >
                Salvar Configurações
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 3. Modal Novo Acordo */}
      {modalNovoAcordoAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalNovoAcordoAberto(false)}>
          <DialogContent className="sm:max-w-md bg-[#0c1017] border border-[#1b2232] text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Plus className="size-4 text-orange-500" />
                Criar Novo Acordo Comercial
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-neutral-400 leading-relaxed">
                Você pode criar um novo acordo comercial utilizando o Criador Profissional com um
                template pré-formatado ou importar termos prontos.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalNovoAcordoAberto(false);
                    if (onNovoAcordo) onNovoAcordo();
                  }}
                  className="w-full p-3 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-left transition-all"
                >
                  <p className="font-bold text-white">Abrir no Criador Profissional</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Elabore o contrato A4 com cláusulas e valores completos.
                  </p>
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalNovoAcordoAberto(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. Modal Ver Documento / Contrato */}
      {modalVerDocumentoAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalVerDocumentoAberto(false)}>
          <DialogContent className="sm:max-w-2xl bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl max-h-[88vh] flex flex-col">
            <DialogHeader className="border-b border-white/10 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                <ScrollText className="size-5 text-orange-500" />
                {documentoSelecionado.tituloContrato} — {documentoSelecionado.codigoDocumento}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="rounded-xl bg-white text-slate-900 p-6 shadow-inner space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-sm">Flow Business</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    STATUS: {documentoSelecionado.statusRotulo.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-950 uppercase">CONTRATANTE: {documentoSelecionado.empresa}</p>
                  <p className="text-slate-600">Segmento: {documentoSelecionado.segmento}</p>
                  <p className="text-slate-600">Responsável: {documentoSelecionado.responsavelNome} Gonçalves</p>
                  <p className="text-slate-600">Vigência: {documentoSelecionado.dataEnvio} até {documentoSelecionado.dataVencimento}</p>
                  <p className="text-slate-600">Valor Mensal: {formatBRL(documentoSelecionado.valorMensal)}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <p className="font-bold text-slate-950">TRILHA DE ASSINATURA ELETRÔNICA:</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    ✓ Enviado para assinatura em {documentoSelecionado.dataEnvio} às 09:30
                    <br />
                    ✓ Notificado via E-mail e WhatsApp
                    <br />
                    {documentoSelecionado.status === "assinado" && "✓ Assinado digitalmente com IP autenticado"}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-3 flex justify-between sm:justify-between">
              <button
                type="button"
                onClick={() => toast.success(`Download de ${documentoSelecionado.codigoDocumento}.pdf iniciado!`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <Download className="size-4" />
                <span>Baixar Cópia Oficial</span>
              </button>
              <button
                type="button"
                onClick={() => setModalVerDocumentoAberto(false)}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
