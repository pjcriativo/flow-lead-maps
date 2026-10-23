// Tela 03: Despesas (Gestão → Financeiro → Despesas)
// Fiel ao layout visual final aprovado com máxima fidelidade, seis indicadores superiores,
// três gráficos analíticos (Evolução das Despesas, Despesas por Categoria, Despesas por Fornecedor),
// abas com contadores, busca e filtros combinados, tabela de despesas paginada e painel lateral
// do fornecedor selecionado com abas (Visão Geral, Faturas, Histórico, Anexos), Última Despesa,
// Despesas Recorrentes e Sugestões de IA.

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Grid,
  History,
  Info,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Server,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import {
  DESPESAS_CATALOGO_INICIAL,
  type DespesaItem,
  type RecorrenciaFornecedorItem,
} from "./despesas-data";

interface DespesasViewProps {
  onMudarTela: (tela: "painel" | "receitas" | "despesas") => void;
}

export function DespesasView({ onMudarTela }: DespesasViewProps) {
  // Dados e Seleção
  const [despesas, setDespesas] = useState<DespesaItem[]>(DESPESAS_CATALOGO_INICIAL);
  const [despesaSelecionadaId, setDespesaSelecionadaId] = useState<string>("desp-1");

  // Abas
  type AbaDespesa = "todas" | "pagas" | "pendentes" | "atraso" | "recorrentes";
  const [abaAtiva, setAbaAtiva] = useState<AbaDespesa>("todas");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("01/10/2026 - 31/10/2026");
  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
  const [visualizacao, setVisualizacao] = useState<"lista" | "cards">("lista");

  // Paginação e Seleção
  const [selecionados, setSelecionados] = useState<string[]>(["desp-1"]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Aba do Painel do Fornecedor
  const [abaFornecedor, setAbaFornecedor] = useState<"geral" | "faturas" | "historico" | "anexos">("geral");

  // Modais
  const [modalNovaDespesaAberto, setModalNovaDespesaAberto] = useState(false);
  const [modalRegistrarPagamentoAberto, setModalRegistrarPagamentoAberto] = useState(false);
  const [modalVerDocumentoAberto, setModalVerDocumentoAberto] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [iaSugestaoSelecionada, setIaSugestaoSelecionada] = useState<{
    titulo: string;
    subtitulo: string;
    detalhe: string;
  } | null>(null);

  // Formulário Nova Despesa
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoFornecedor, setNovoFornecedor] = useState("");
  const [novaCategoria, setNovaCategoria] = useState<DespesaItem["categoria"]>("Infraestrutura");
  const [novoTipo, setNovoTipo] = useState<DespesaItem["tipo"]>("recorrente");
  const [novoValor, setNovoValor] = useState("");
  const [novoVencimento, setNovoVencimento] = useState("2026-10-01");
  const [novoStatus, setNovoStatus] = useState<DespesaItem["status"]>("pago");
  const [novoDoc, setNovoDoc] = useState("");
  const [salvandoNova, setSalvandoNova] = useState(false);

  // Formulário Registrar Pagamento
  const [pagValor, setPagValor] = useState("249,90");
  const [pagData, setPagData] = useState("2026-10-23");
  const [pagForma, setPagForma] = useState<string>("Boleto");
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  // Despesa Ativa
  const despesaAtiva = useMemo(() => {
    return despesas.find((d) => d.id === despesaSelecionadaId) || despesas[0];
  }, [despesas, despesaSelecionadaId]);

  // Filtragem
  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      // Abas
      if (abaAtiva === "pagas" && d.status !== "pago") return false;
      if (abaAtiva === "pendentes" && d.status !== "pendente") return false;
      if (abaAtiva === "atraso" && d.status !== "em_atraso") return false;
      if (abaAtiva === "recorrentes" && d.tipo !== "recorrente") return false;

      // Select Tipo
      if (filtroTipo !== "all" && d.tipo !== filtroTipo) return false;

      // Select Categoria
      if (filtroCategoria !== "all" && d.categoria !== filtroCategoria) return false;

      // Select Status
      if (filtroStatus !== "all" && d.status !== filtroStatus) return false;

      // Busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchDesc = d.descricao.toLowerCase().includes(termo);
        const matchForn = d.fornecedor.toLowerCase().includes(termo);
        const matchDoc = d.documentoCodigo.toLowerCase().includes(termo);
        if (!matchDesc && !matchForn && !matchDoc) return false;
      }

      return true;
    });
  }, [despesas, abaAtiva, filtroTipo, filtroCategoria, filtroStatus, busca]);

  // Contadores das Abas
  const contadoresAbas = useMemo(() => {
    return {
      todas: 128,
      pagas: 86,
      pendentes: 32,
      atraso: 10,
      recorrentes: 28,
    };
  }, []);

  // Paginação
  const totalPaginas = Math.ceil(despesasFiltradas.length / itensPorPagina) || 1;
  const despesasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return despesasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [despesasFiltradas, paginaAtual, itensPorPagina]);

  // Seleção
  const toggleSelecionarTodos = () => {
    if (selecionados.length === despesasPaginadas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(despesasPaginadas.map((d) => d.id));
    }
  };

  const toggleSelecionarItem = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Salvar Nova Despesa
  const handleCriarNovaDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDescricao.trim() || !novoValor) {
      toast.error("Preencha a descrição e o valor.");
      return;
    }

    setSalvandoNova(true);
    try {
      const valorNum = parseFloat(novoValor.replace(",", "."));
      const novoId = `desp-${Date.now()}`;
      const item: DespesaItem = {
        id: novoId,
        data: novoVencimento.split("-").reverse().join("/"),
        descricao: novaDescricao.trim(),
        fornecedor: novoFornecedor.trim() || "Fornecedor Geral",
        fornecedorLogoLetra: (novoFornecedor.trim()[0] || "F").toUpperCase(),
        fornecedorLogoBg: "bg-blue-600 text-white font-bold",
        fornecedorSub: "Serviços Operacionais",
        categoria: novaCategoria,
        categoriaBadge:
          novaCategoria === "Marketing"
            ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
            : novaCategoria === "Ferramentas"
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
              : novaCategoria === "Equipe"
                ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                : "bg-purple-500/20 text-purple-300 border-purple-500/30",
        tipo: novoTipo,
        tipoRotulo:
          novoTipo === "recorrente"
            ? "Recorrente"
            : novoTipo === "fixo"
              ? "Fixo"
              : "Variável",
        tipoBadge:
          novoTipo === "recorrente"
            ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
            : "bg-blue-900/30 text-blue-300 border-blue-500/30",
        valor: isNaN(valorNum) ? 0 : valorNum,
        status: novoStatus,
        statusRotulo: novoStatus === "pago" ? "Pago" : "Pendente",
        vencimento: novoVencimento.split("-").reverse().join("/"),
        documentoCodigo: novoDoc.trim() || `NF-${Math.floor(10000 + Math.random() * 90000)}`,
        contratoCodigo: "-",
        detalhesFornecedor: {
          cnpj: "00.000.000/0001-00",
          contatoFinanceiro: "financeiro@fornecedor.com",
          telefone: "+55 11 4000-0000",
          categoria: novaCategoria,
          condicoes: "Boleto",
          prazo: "10 dias",
        },
        recorrenciasFornecedor: [],
        faturas: [],
      };

      setDespesas((prev) => [item, ...prev]);
      setDespesaSelecionadaId(novoId);
      toast.success(`Despesa "${item.descricao}" registrada com sucesso!`);
      setModalNovaDespesaAberto(false);
      setNovaDescricao("");
      setNovoFornecedor("");
      setNovoValor("");
    } catch {
      toast.error("Erro ao cadastrar despesa.");
    } finally {
      setSalvandoNova(false);
    }
  };

  // Confirmar Pagamento
  const handleConfirmarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despesaAtiva) return;

    setSalvandoPagamento(true);
    try {
      const valorNum = parseFloat(pagValor.replace(",", ".")) || despesaAtiva.valor;

      setDespesas((prev) =>
        prev.map((d) =>
          d.id === despesaAtiva.id
            ? {
                ...d,
                status: "pago",
                statusRotulo: "Pago",
                faturas: [
                  {
                    id: `fat-${Date.now()}`,
                    data: pagData.split("-").reverse().join("/"),
                    valor: valorNum,
                    status: "pago",
                    doc: d.documentoCodigo || "NF-RECIBO",
                  },
                  ...d.faturas,
                ],
              }
            : d
        )
      );

      toast.success(`Pagamento de ${formatBRL(valorNum)} confirmado para ${despesaAtiva.fornecedor}!`);
      setModalRegistrarPagamentoAberto(false);
    } catch {
      toast.error("Não foi possível confirmar o pagamento.");
    } finally {
      setSalvandoPagamento(false);
    }
  };

  // Exportar CSV
  const handleExportarCsv = () => {
    const cabecalho = "Data,Descricao,Fornecedor,Categoria,Tipo,Valor,Status,Vencimento,Documento\n";
    const linhas = despesasFiltradas
      .map(
        (d) =>
          `"${d.data}","${d.descricao}","${d.fornecedor}","${d.categoria}","${d.tipoRotulo}","${d.valor}","${d.statusRotulo}","${d.vencimento}","${d.documentoCodigo}"`
      )
      .join("\n");
    const blob = new Blob([cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `despesas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório de despesas exportado em CSV!");
    setModalExportarAberto(false);
  };

  return (
    <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 flex flex-col gap-5 overflow-x-hidden text-neutral-100">
      {/* =========================================================================
          CABEÇALHO & BREADCRUMB
         ========================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span
              onClick={() => onMudarTela("painel")}
              className="hover:text-neutral-300 cursor-pointer"
            >
              Gestão
            </span>
            <span className="text-neutral-600">›</span>
            <span
              onClick={() => onMudarTela("painel")}
              className="hover:text-neutral-300 cursor-pointer"
            >
              Financeiro
            </span>
            <span className="text-neutral-600">›</span>
            <span className="flex items-center gap-1.5 font-medium text-orange-400">
              <FileText className="size-3.5 text-orange-400" />
              Despesas
            </span>
          </div>

          {/* Título e Subtítulo */}
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Despesas
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Controle seus gastos, contas a pagar e acompanhe os custos operacionais da sua empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Controles: Seletor de Período, Exportar, + Nova despesa */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuPeriodoAberto((prev) => !prev)}
              className="flex h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-[#0e121a] px-3.5 text-xs font-medium text-neutral-200 transition-all hover:border-white/20 hover:bg-[#141924]"
            >
              <Calendar className="size-4 text-neutral-400" />
              <span>{periodoFiltro}</span>
              <ChevronDown className="size-3.5 text-neutral-500" />
            </button>

            {menuPeriodoAberto && (
              <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-white/10 bg-[#0c1017] p-1.5 shadow-2xl backdrop-blur-md">
                {[
                  "Hoje",
                  "Últimos 7 dias",
                  "Últimos 30 dias",
                  "01/10/2026 - 31/10/2026",
                  "Mês anterior",
                  "Personalizado",
                ].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriodoFiltro(p === "01/10/2026 - 31/10/2026" ? p : `${p} (Out/26)`);
                      setMenuPeriodoAberto(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between",
                      periodoFiltro.includes(p)
                        ? "bg-orange-500/15 text-orange-400 font-semibold"
                        : "text-neutral-300 hover:bg-white/5"
                    )}
                  >
                    <span>{p}</span>
                    {periodoFiltro.includes(p) && <Check className="size-3 text-orange-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exportar */}
          <button
            type="button"
            onClick={() => setModalExportarAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#0e121a] px-3.5 text-xs font-medium text-neutral-200 transition-all hover:border-white/20 hover:bg-[#141924]"
          >
            <Download className="size-4 text-neutral-400" />
            <span>Exportar</span>
          </button>

          {/* + Nova despesa */}
          <button
            type="button"
            onClick={() => setModalNovaDespesaAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Nova despesa</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          SEIS INDICADORES SUPERIORES (KPIs)
         ========================================================================= */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Despesas Total */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Despesas Total</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-[#ef4444]">
              <Receipt className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 18.200,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-red-400">
            <TrendingDown className="size-3" />
            <span>*-8% este mês</span>
          </div>
        </div>

        {/* Card 2: Despesas Pagas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Despesas Pagas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 12.400,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+15% este mês</span>
          </div>
        </div>

        {/* Card 3: Despesas Pendentes */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Despesas Pendentes</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#f59e0b]">
              <Wallet className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 5.800,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingDown className="size-3" />
            <span>-12% este mês</span>
          </div>
        </div>

        {/* Card 4: Despesas em Atraso */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Despesas em Atraso</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-[#ef4444]">
              <AlertCircle className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 2.300,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-red-400">
            <TrendingUp className="size-3" />
            <span>+28% este mês</span>
          </div>
        </div>

        {/* Card 5: Fornecedores Ativos */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Fornecedores Ativos</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4]">
              <Building className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              18
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span>+2 novos este mês</span>
          </div>
        </div>

        {/* Card 6: Despesa Média Mensal */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Despesa Média Mensal</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-[#a855f7]">
              <DollarSign className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 6.750,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingDown className="size-3" />
            <span>-5% este mês</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CORPO PRINCIPAL: COLUNA ESQUERDA (GRÁFICOS, ABAS, TABELA) + PAINEL DIREITO
         ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* =======================================================================
            COLUNA ESQUERDA (9 colunas no xl)
           ======================================================================= */}
        <div className="xl:col-span-9 flex flex-col gap-5 min-w-0">
          {/* TRÊS GRÁFICOS ANALÍTICOS SUPERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Gráfico 1: Evolução das Despesas (5 colunas) */}
            <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Evolução das Despesas</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Últimos 6 meses</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* SVG Combo Chart: Barras Vermelhas (Pagas), Barras Amarelas (Pendentes), Curva Azul (Média) */}
              <div className="relative h-44 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 340 140">
                  {/* Linhas de Grade Horizontais */}
                  <line x1="45" y1="15" x2="330" y2="15" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="42" x2="330" y2="42" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="70" x2="330" y2="70" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="98" x2="330" y2="98" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="120" x2="330" y2="120" stroke="rgba(255,255,255,0.07)" />

                  {/* Y-axis */}
                  <text x="8" y="18" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 40K</text>
                  <text x="8" y="45" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 30K</text>
                  <text x="8" y="73" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 20K</text>
                  <text x="8" y="101" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 10K</text>
                  <text x="22" y="123" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 0</text>

                  {/* Barras e Meses */}
                  {[
                    { mes: "Abr", x: 60, pagas: 38, pend: 16, med: 82 },
                    { mes: "Mai", x: 100, pagas: 48, pend: 20, med: 75 },
                    { mes: "Jun", x: 140, pagas: 55, pend: 22, med: 68 },
                    { mes: "Jul", x: 180, pagas: 62, pend: 25, med: 72 },
                    { mes: "Ago", x: 220, pagas: 58, pend: 24, med: 65 },
                    { mes: "Set", x: 260, pagas: 74, pend: 26, med: 58 },
                    { mes: "Out", x: 300, pagas: 84, pend: 30, med: 52 },
                  ].map((item, idx) => (
                    <g key={idx}>
                      {/* Barra Despesas Pagas (Vermelho/Coral) */}
                      <rect
                        x={item.x - 7}
                        y={120 - item.pagas}
                        width="6"
                        height={item.pagas}
                        rx="2"
                        fill="#ef4444"
                      />
                      {/* Barra Despesas Pendentes (Amarelo/Âmbar) */}
                      <rect
                        x={item.x + 1}
                        y={120 - item.pend}
                        width="6"
                        height={item.pend}
                        rx="2"
                        fill="#f59e0b"
                      />
                      {/* Rótulo do Mês */}
                      <text
                        x={item.x}
                        y="133"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                        fontFamily="sans-serif"
                      >
                        {item.mes}
                      </text>
                    </g>
                  ))}

                  {/* Curva Azul: Média mensal */}
                  <path
                    d="M 60 82 L 100 75 L 140 68 L 180 72 L 220 65 L 260 58 L 300 52"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Pontos da Linha */}
                  {[
                    { x: 60, y: 82 },
                    { x: 100, y: 75 },
                    { x: 140, y: 68 },
                    { x: 180, y: 72 },
                    { x: 220, y: 65 },
                    { x: 260, y: 58 },
                    { x: 300, y: 52 },
                  ].map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill="#0c1017"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>

              {/* Legenda inferior */}
              <div className="flex items-center justify-center gap-4 pt-1 border-t border-white/5 text-[10px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ef4444]" />
                  <span>Despesas pagas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#f59e0b]" />
                  <span>Despesas pendentes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span>Média mensal</span>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Despesas por Categoria (3.5 colunas) */}
            <div className="lg:col-span-3.5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Despesas por Categoria</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Este mês</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 py-2">
                {/* Donut Chart SVG */}
                <div className="relative size-28 shrink-0 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="11" fill="none" />
                    {/* Ferramentas (28%) - Azul */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#3b82f6"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="66.8 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Equipe (22%) - Roxo */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#a855f7"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="52.5 238.7"
                      strokeDashoffset="-66.8"
                    />
                    {/* Marketing (18%) - Rosa */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#ec4899"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="43.0 238.7"
                      strokeDashoffset="-119.3"
                    />
                    {/* Infraestrutura (15%) - Verde */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-162.3"
                    />
                    {/* Serviços (10%) - Azul Escuro */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0284c7"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="23.8 238.7"
                      strokeDashoffset="-198.1"
                    />
                    {/* Administrativo (5%) - Âmbar */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f59e0b"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="12.0 238.7"
                      strokeDashoffset="-221.9"
                    />
                    {/* Outros (2%) - Cinza */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#64748b"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="4.8 238.7"
                      strokeDashoffset="-233.9"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold font-mono text-white">R$ 18.2K</span>
                    <span className="text-[9px] text-neutral-400">Total</span>
                  </div>
                </div>

                {/* Legenda com percentuais */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#3b82f6]" />
                      Ferramentas
                    </span>
                    <span className="font-mono text-neutral-400">28%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#a855f7]" />
                      Equipe
                    </span>
                    <span className="font-mono text-neutral-400">22%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#ec4899]" />
                      Marketing
                    </span>
                    <span className="font-mono text-neutral-400">18%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      Infraestrutura
                    </span>
                    <span className="font-mono text-neutral-400">15%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#0284c7]" />
                      Serviços
                    </span>
                    <span className="font-mono text-neutral-400">10%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#f59e0b]" />
                      Administrativo
                    </span>
                    <span className="font-mono text-neutral-400">5%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#64748b]" />
                      Outros
                    </span>
                    <span className="font-mono text-neutral-400">2%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico 3: Despesas por Fornecedor (3.5 colunas) */}
            <div className="lg:col-span-3.5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Despesas por Fornecedor</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Este mês</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 py-2">
                {/* Donut Chart SVG */}
                <div className="relative size-28 shrink-0 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="11" fill="none" />
                    {/* Hostinger (24%) - Azul */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#3b82f6"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="57.3 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Meta Ads (18%) - Roxo */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#a855f7"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="43.0 238.7"
                      strokeDashoffset="-57.3"
                    />
                    {/* Google (15%) - Ciano */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#06b6d4"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-100.3"
                    />
                    {/* OpenAI (12%) - Verde */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="28.6 238.7"
                      strokeDashoffset="-136.1"
                    />
                    {/* Apify (10%) - Rosa */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#ec4899"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="23.8 238.7"
                      strokeDashoffset="-164.7"
                    />
                    {/* Equipe (8%) - Laranja */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f97316"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="19.1 238.7"
                      strokeDashoffset="-188.5"
                    />
                    {/* Outros (13%) - Cinza */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#64748b"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="31.1 238.7"
                      strokeDashoffset="-207.6"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold font-mono text-white">R$ 18.2K</span>
                    <span className="text-[9px] text-neutral-400">Total</span>
                  </div>
                </div>

                {/* Legenda com percentuais */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#3b82f6]" />
                      Hostinger
                    </span>
                    <span className="font-mono text-neutral-400">24%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#a855f7]" />
                      Meta Ads
                    </span>
                    <span className="font-mono text-neutral-400">18%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#06b6d4]" />
                      Google
                    </span>
                    <span className="font-mono text-neutral-400">15%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      OpenAI
                    </span>
                    <span className="font-mono text-neutral-400">12%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#ec4899]" />
                      Apify
                    </span>
                    <span className="font-mono text-neutral-400">10%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#f97316]" />
                      Equipe
                    </span>
                    <span className="font-mono text-neutral-400">8%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#64748b]" />
                      Outros
                    </span>
                    <span className="font-mono text-neutral-400">13%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ABAS DE DESPESAS COM CONTADORES */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "todas", label: `Todas as Despesas (${contadoresAbas.todas})`, icon: FileText, color: "orange" },
              { id: "pagas", label: `Despesas Pagas (${contadoresAbas.pagas})`, icon: CheckCircle2, color: "emerald" },
              { id: "pendentes", label: `Despesas Pendentes (${contadoresAbas.pendentes})`, icon: Clock, color: "amber" },
              { id: "atraso", label: `Em Atraso (${contadoresAbas.atraso})`, icon: AlertCircle, color: "red" },
              { id: "recorrentes", label: `Recorrentes (${contadoresAbas.recorrentes})`, icon: Zap, color: "blue" },
            ].map((tab) => {
              const ativa = abaAtiva === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAbaAtiva(tab.id as AbaDespesa);
                    setPaginaAtual(1);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                    ativa
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-sm"
                      : "bg-[#0c1017] border-white/5 text-neutral-400 hover:text-white hover:border-white/10"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "size-3.5",
                      ativa
                        ? "text-orange-400"
                        : tab.color === "emerald"
                          ? "text-emerald-400"
                          : tab.color === "amber"
                            ? "text-amber-400"
                            : tab.color === "red"
                              ? "text-red-400"
                              : "text-blue-400"
                    )}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* BARRA DE BUSCA E FILTROS */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#0c1017] p-3 shadow-sm">
            <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
              {/* Input de Busca */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  placeholder="Buscar por descrição, fornecedor ou documento..."
                  className="w-full h-9 rounded-xl border border-white/5 bg-[#121620] pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value);
                  setPaginaAtual(1);
                }}
                className="h-9 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os tipos</option>
                <option value="recorrente">Recorrente</option>
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
              </select>

              {/* Filtro Categorias */}
              <select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value);
                  setPaginaAtual(1);
                }}
                className="h-9 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as categorias</option>
                <option value="Infraestrutura">Infraestrutura</option>
                <option value="Marketing">Marketing</option>
                <option value="Ferramentas">Ferramentas</option>
                <option value="Equipe">Equipe</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Serviços">Serviços</option>
              </select>

              {/* Filtro Status */}
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPaginaAtual(1);
                }}
                className="h-9 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="em_atraso">Em atraso</option>
              </select>

              {/* Data Inicial */}
              <div className="relative">
                <input
                  type="text"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  placeholder="Data inicial"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                  }}
                  className="h-9 w-28 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs text-neutral-300 placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
              </div>

              {/* Data Final */}
              <div className="relative">
                <input
                  type="text"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  placeholder="Data final"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                  }}
                  className="h-9 w-28 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs text-neutral-300 placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" />
              </div>

              {/* Filtros Avançados */}
              <button
                type="button"
                onClick={() => toast.info("Filtros avançados ativos no painel.")}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs font-medium text-neutral-300 hover:text-white hover:border-white/10"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Filtros avançados</span>
              </button>
            </div>

            {/* Alternância Lista / Cards */}
            <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setVisualizacao("lista")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-all",
                  visualizacao === "lista"
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-neutral-500 hover:text-white"
                )}
                title="Lista"
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setVisualizacao("cards")}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg transition-all",
                  visualizacao === "cards"
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-neutral-500 hover:text-white"
                )}
                title="Cards"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>

          {/* TABELA DE DESPESAS */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f141d] text-[11px] font-semibold text-neutral-400">
                    <th className="py-3 px-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          despesasPaginadas.length > 0 &&
                          selecionados.length === despesasPaginadas.length
                        }
                        onChange={toggleSelecionarTodos}
                        className="size-4 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Descrição</th>
                    <th className="py-3 px-3">Fornecedor</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Vencimento</th>
                    <th className="py-3 px-3">Documento</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {despesasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-neutral-500">
                        Nenhuma despesa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    despesasPaginadas.map((item) => {
                      const isLinhaAtiva = despesaSelecionadaId === item.id;
                      const isSelecionado = selecionados.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setDespesaSelecionadaId(item.id)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-white/[0.02]",
                            isLinhaAtiva && "bg-orange-500/[0.04] ring-1 ring-inset ring-orange-500/30"
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelecionarItem(item.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelecionado}
                              onChange={() => toggleSelecionarItem(item.id)}
                              className="size-4 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>

                          {/* Data */}
                          <td className="py-3 px-3 font-mono text-neutral-300 whitespace-nowrap">
                            {item.data}
                          </td>

                          {/* Descrição */}
                          <td className="py-3 px-3 font-medium text-white whitespace-nowrap">
                            {item.descricao}
                          </td>

                          {/* Fornecedor com Avatar/Logo */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] uppercase",
                                  item.fornecedorLogoBg
                                )}
                              >
                                {item.fornecedorLogoLetra}
                              </div>
                              <span className="text-neutral-200">{item.fornecedor}</span>
                            </div>
                          </td>

                          {/* Categoria */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border",
                                item.categoriaBadge
                              )}
                            >
                              {item.categoria}
                            </span>
                          </td>

                          {/* Tipo: Recorrente (Azul) / Fixo (Escuro) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                                item.tipoBadge
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  item.tipo === "recorrente" ? "bg-sky-400" : "bg-blue-400"
                                )}
                              />
                              {item.tipoRotulo}
                            </span>
                          </td>

                          {/* Valor */}
                          <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {formatBRL(item.valor)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {item.status === "pago" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Pago
                              </span>
                            ) : item.status === "em_atraso" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                                Em atraso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Pendente
                              </span>
                            )}
                          </td>

                          {/* Vencimento */}
                          <td className="py-3 px-3 font-mono text-neutral-300 text-[11px] whitespace-nowrap">
                            {item.vencimento}
                          </td>

                          {/* Documento */}
                          <td className="py-3 px-3 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                            {item.documentoCodigo}
                          </td>

                          {/* Ações */}
                          <td
                            className="py-3 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setDespesaSelecionadaId(item.id);
                                  setModalVerDocumentoAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                title="Visualizar Detalhes"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDespesaSelecionadaId(item.id);
                                  setPagValor(item.valor.toFixed(2).replace(".", ","));
                                  setModalRegistrarPagamentoAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                title="Registrar Pagamento"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDespesaSelecionadaId(item.id);
                                  setModalVerDocumentoAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                title="Mais Opções"
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-xs text-neutral-400 bg-[#0c1017]">
              {/* Controles numéricos */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  className="flex size-7 items-center justify-center rounded-lg border border-white/5 bg-[#121620] text-neutral-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" />
                </button>

                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaAtual(num)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                      paginaAtual === num
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                        : "border border-white/5 bg-[#121620] text-neutral-400 hover:text-white"
                    )}
                  >
                    {num}
                  </button>
                ))}

                <span className="px-1 text-neutral-600">...</span>

                <button
                  type="button"
                  onClick={() => setPaginaAtual(13)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                    paginaAtual === 13
                      ? "bg-orange-500 text-white"
                      : "border border-white/5 bg-[#121620] text-neutral-400 hover:text-white"
                  )}
                >
                  13
                </button>

                <button
                  type="button"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  className="flex size-7 items-center justify-center rounded-lg border border-white/5 bg-[#121620] text-neutral-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>

              {/* Itens por página */}
              <div className="flex items-center gap-2">
                <select
                  value={itensPorPagina}
                  onChange={(e) => {
                    setItensPorPagina(Number(e.target.value));
                    setPaginaAtual(1);
                  }}
                  className="h-7 rounded-lg border border-white/5 bg-[#121620] px-2 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>

              {/* Resumo e Botão Atualizar */}
              <div className="flex items-center gap-2">
                <span>Mostrando 1 - 10 de 128 despesas</span>
                <button
                  type="button"
                  onClick={() => toast.success("Lista de despesas atualizada com sucesso.")}
                  className="flex size-6 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Atualizar"
                >
                  <RefreshCw className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA DIREITA (3 colunas no xl): FORNECEDOR, ÚLTIMA DESPESA, RECORRÊNCIAS, IA
           ======================================================================= */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Card 1: Fornecedor Selecionado (Hostinger) */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3.5">
            {/* Header do Fornecedor */}
            <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl font-bold uppercase text-xs shadow-sm",
                    despesaAtiva.fornecedorLogoBg
                  )}
                >
                  {despesaAtiva.fornecedorLogoLetra}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{despesaAtiva.fornecedor}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{despesaAtiva.fornecedorSub}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 shrink-0">
                <span className="size-1 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>

            {/* Abas Internas (Visão Geral, Faturas, Histórico, Anexos) */}
            <div className="flex items-center gap-1 border-b border-white/5 pb-1">
              {[
                { id: "geral", rotulo: "Visão Geral" },
                { id: "faturas", rotulo: `Faturas (${despesaAtiva.faturas.length || 6})` },
                { id: "historico", rotulo: "Histórico" },
                { id: "anexos", rotulo: "Anexos" },
              ].map((subtab) => (
                <button
                  key={subtab.id}
                  type="button"
                  onClick={() => setAbaFornecedor(subtab.id as typeof abaFornecedor)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap",
                    abaFornecedor === subtab.id
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  {subtab.rotulo}
                </button>
              ))}
            </div>

            {/* Grid de Informações Cadastrais */}
            {abaFornecedor === "geral" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500">CNPJ</span>
                  <div className="font-mono text-white text-[11px] mt-0.5">
                    {despesaAtiva.detalhesFornecedor.cnpj}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Contato financeiro</span>
                  <div className="text-white text-[11px] mt-0.5 truncate">
                    {despesaAtiva.detalhesFornecedor.contatoFinanceiro}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Telefone</span>
                  <div className="font-mono text-white text-[11px] mt-0.5">
                    {despesaAtiva.detalhesFornecedor.telefone}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Categoria</span>
                  <div className="text-white text-[11px] mt-0.5">
                    {despesaAtiva.detalhesFornecedor.categoria}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Condições de pagamento</span>
                  <div className="text-white text-[11px] mt-0.5">
                    {despesaAtiva.detalhesFornecedor.condicoes}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Prazo de pagamento</span>
                  <div className="text-white text-[11px] mt-0.5">
                    {despesaAtiva.detalhesFornecedor.prazo}
                  </div>
                </div>
              </div>
            )}

            {abaFornecedor === "faturas" && (
              <div className="flex flex-col gap-1.5 text-xs">
                {despesaAtiva.faturas.map((f, i) => (
                  <div key={i} className="flex justify-between p-2 rounded-xl bg-[#121620] border border-white/5">
                    <div>
                      <div className="font-bold text-white">{f.doc}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{f.data}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">{formatBRL(f.valor)}</div>
                      <span className="text-[9px] uppercase font-bold text-emerald-400">{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaFornecedor === "historico" && (
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="p-2 rounded-xl bg-[#121620] border border-white/5">
                  <span className="text-[10px] text-neutral-400">Primeira contratação</span>
                  <div className="text-white mt-0.5 font-medium">10/01/2026</div>
                </div>
                <div className="p-2 rounded-xl bg-[#121620] border border-white/5">
                  <span className="text-[10px] text-neutral-400">Total liquidado (YTD)</span>
                  <div className="text-emerald-400 font-mono font-bold mt-0.5">R$ 2.499,00</div>
                </div>
              </div>
            )}

            {abaFornecedor === "anexos" && (
              <div className="flex flex-col gap-1.5 text-xs text-neutral-400 text-center py-3">
                <Paperclip className="size-5 mx-auto text-neutral-600 mb-1" />
                <span>Nenhum anexo adicional vinculado.</span>
              </div>
            )}

            {/* Link inferior */}
            <div className="pt-2 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => setModalVerDocumentoAberto(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white"
              >
                <span>Ver todos os documentos</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Última Despesa */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3">
            <span className="text-[11px] font-semibold text-neutral-400">Última despesa</span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate">{despesaAtiva.descricao}</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {despesaAtiva.categoria}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
              <div>
                <span className="text-[10px] text-neutral-500">Valor</span>
                <div className="font-mono font-bold text-white mt-0.5">
                  {formatBRL(despesaAtiva.valor)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500">Data</span>
                <div className="font-mono text-neutral-200 mt-0.5">{despesaAtiva.data}</div>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500">Status</span>
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Check className="size-2.5" />
                    {despesaAtiva.statusRotulo}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500">Documento</span>
                <div className="font-mono text-neutral-300 text-[11px] mt-0.5">
                  {despesaAtiva.documentoCodigo}
                </div>
              </div>
            </div>

            {/* Botões do Card Última Despesa */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => setModalVerDocumentoAberto(true)}
                className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110"
              >
                <span>Ver documento</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNovaDescricao(despesaAtiva.descricao);
                  setNovoFornecedor(despesaAtiva.fornecedor);
                  setNovoValor(despesaAtiva.valor.toString());
                  setModalNovaDespesaAberto(true);
                }}
                className="flex h-9 items-center justify-center gap-1.5 px-4 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <Pencil className="size-3" />
                <span>Editar</span>
              </button>
            </div>
          </div>

          {/* Card 3: Despesas Recorrentes */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Despesas recorrentes</h4>
              <span className="text-[10px] text-neutral-400 font-mono">
                {despesaAtiva.recorrenciasFornecedor.length} registros
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-white/5 text-xs">
              {despesaAtiva.recorrenciasFornecedor.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-[#121620]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-white/5 text-neutral-300">
                      {rec.tipoIcone === "server" ? (
                        <Server className="size-3.5" />
                      ) : rec.tipoIcone === "globe" ? (
                        <Globe className="size-3.5" />
                      ) : rec.tipoIcone === "mail" ? (
                        <Mail className="size-3.5" />
                      ) : (
                        <FileText className="size-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-[11px]">{rec.nome}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{rec.valorTexto}</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                    <span className="size-1 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Sugestões de IA */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-[#140f24] to-[#0c1017] p-4 shadow-lg shadow-purple-950/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <Sparkles className="size-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Sugestões de IA</h4>
              </div>
              <button
                type="button"
                onClick={() => toast.info("O Agente Financeiro está analisando seus custos operacionais.")}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                Ver todas
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-purple-500/10">
              {[
                {
                  titulo: "Negociar melhor plano com a Hostinger",
                  subtitulo: "Economia estimada de até 20%.",
                  detalhe:
                    "A Hostinger oferece desconto para pagamento anual antecipado nos planos VPS KVM 2, reduzindo o custo operacional de R$ 249,90 para R$ 199,90 ao mês.",
                },
                {
                  titulo: "Revisar ferramentas pouco utilizadas",
                  subtitulo: "3 assinaturas com baixo uso.",
                  detalhe:
                    "Identificamos que as ferramentas Adobe e Apify registraram menos de 2 acessos nos últimos 20 dias. Avalie pausar ou rebaixar os planos ativos.",
                },
                {
                  titulo: "Alertar vencimentos próximos",
                  subtitulo: "5 contas vencem nos próximos 7 dias.",
                  detalhe:
                    "As contas de serviços contábeis, energia elétrica e licenças totalizam R$ 1.879,00 a serem liquidadas nesta semana para evitar juros.",
                },
                {
                  titulo: "Sugerir alternativas mais econômicas",
                  subtitulo: "2 ferramentas com opção mais barata.",
                  detalhe:
                    "Existem serviços equivalentes de hospedagem e automação com custo até 30% menor e mesma taxa de disponibilidade.",
                },
              ].map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIaSugestaoSelecionada(sug);
                    setModalIaAberto(true);
                  }}
                  className="flex items-center justify-between p-2 rounded-xl border border-purple-500/10 bg-[#121620]/60 hover:bg-purple-950/20 hover:border-purple-500/30 transition-all text-left group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {sug.titulo}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {sug.subtitulo}
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAIS OPERACIONAIS
         ========================================================================= */}

      {/* Modal 1: Nova Despesa */}
      <Dialog open={modalNovaDespesaAberto} onOpenChange={setModalNovaDespesaAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="size-4 text-orange-400" />
              Cadastrar Nova Despesa
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarNovaDespesa} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Descrição da Despesa *</label>
              <input
                type="text"
                required
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Ex: Servidor VPS, Licenças de Software, Energia..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Fornecedor *</label>
                <input
                  type="text"
                  required
                  value={novoFornecedor}
                  onChange={(e) => setNovoFornecedor(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Valor (R$) *</label>
                <input
                  type="text"
                  required
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  placeholder="249,90"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Tipo</label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as DespesaItem["tipo"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="recorrente">Recorrente</option>
                  <option value="fixo">Fixo</option>
                  <option value="variavel">Variável</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Categoria</label>
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value as DespesaItem["categoria"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Equipe">Equipe</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Serviços">Serviços</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Data de Vencimento</label>
                <input
                  type="date"
                  value={novoVencimento}
                  onChange={(e) => setNovoVencimento(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Status Inicial</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as DespesaItem["status"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Documento / Nota Fiscal</label>
              <input
                type="text"
                value={novoDoc}
                onChange={(e) => setNovoDoc(e.target.value)}
                placeholder="NF-45823"
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono"
              />
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaDespesaAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoNova}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 disabled:opacity-50"
              >
                {salvandoNova && <Loader2 className="size-3.5 animate-spin" />}
                <span>Salvar Despesa</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Registrar Pagamento */}
      <Dialog open={modalRegistrarPagamentoAberto} onOpenChange={setModalRegistrarPagamentoAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Confirmar Pagamento de Despesa
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConfirmarPagamento} className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-white/5 bg-[#121620] p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-400 font-medium">Fornecedor</span>
                <div className="font-bold text-white mt-0.5">{despesaAtiva.fornecedor}</div>
                <div className="text-[11px] text-neutral-400">{despesaAtiva.descricao}</div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {formatBRL(despesaAtiva.valor)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Valor Pago (R$) *</label>
                <input
                  type="text"
                  required
                  value={pagValor}
                  onChange={(e) => setPagValor(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Data da Liquidação</label>
                <input
                  type="date"
                  value={pagData}
                  onChange={(e) => setPagData(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Forma de Pagamento</label>
              <select
                value={pagForma}
                onChange={(e) => setPagForma(e.target.value)}
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                <option value="Boleto">Boleto Bancário</option>
                <option value="PIX">PIX</option>
                <option value="Cartão">Cartão de Crédito Corporativo</option>
                <option value="Débito Automático">Débito Automático</option>
              </select>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModalRegistrarPagamentoAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoPagamento}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 disabled:opacity-50"
              >
                {salvandoPagamento && <Loader2 className="size-3.5 animate-spin" />}
                <span>Confirmar Pagamento</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Ver Documento */}
      <Dialog open={modalVerDocumentoAberto} onOpenChange={setModalVerDocumentoAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <FileText className="size-4 text-orange-400" />
              Documento da Despesa: {despesaAtiva.documentoCodigo}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-white/5 bg-[#121620] p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Fornecedor</span>
                <div className="font-bold text-white text-sm">{despesaAtiva.fornecedor}</div>
                <div className="text-[11px] text-neutral-400">{despesaAtiva.fornecedorSub}</div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-white text-base">
                  {formatBRL(despesaAtiva.valor)}
                </span>
                <div className="text-[10px] text-emerald-400 font-semibold">{despesaAtiva.statusRotulo}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-[#121620]/60 flex flex-col gap-1.5 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">Descrição:</span>
                <span className="font-semibold text-white">{despesaAtiva.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Categoria:</span>
                <span className="text-white">{despesaAtiva.categoria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Vencimento:</span>
                <span className="font-mono text-white">{despesaAtiva.vencimento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">CNPJ:</span>
                <span className="font-mono text-white">{despesaAtiva.detalhesFornecedor.cnpj}</span>
              </div>
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalVerDocumentoAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Exportar */}
      <Dialog open={modalExportarAberto} onOpenChange={setModalExportarAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Download className="size-4 text-orange-400" />
              Exportar Relatório de Despesas
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-neutral-400">
              Selecione o formato para exportar as {despesasFiltradas.length} despesas filtradas:
            </p>

            <button
              type="button"
              onClick={handleExportarCsv}
              className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#121620] hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-left"
            >
              <div>
                <div className="font-bold text-white">Planilha CSV (.csv)</div>
                <div className="text-[11px] text-neutral-400">Compatível com Excel, Google Planilhas e ERPs</div>
              </div>
              <FileSpreadsheet className="size-5 text-emerald-400" />
            </button>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalExportarAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Sugestões de IA */}
      <Dialog open={modalIaAberto} onOpenChange={setModalIaAberto}>
        <DialogContent className="max-w-md border-purple-500/20 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-purple-400">
              <Sparkles className="size-4" />
              {iaSugestaoSelecionada?.titulo || "Sugestão Inteligente"}
            </DialogTitle>
          </DialogHeader>

          {iaSugestaoSelecionada && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wide">
                  Otimização de Custos Operacionais
                </span>
                <p className="mt-1 text-sm font-semibold text-white">
                  {iaSugestaoSelecionada.subtitulo}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121620] p-3 text-neutral-300 leading-relaxed">
                {iaSugestaoSelecionada.detalhe}
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-[#121620]/40 text-[11px] text-neutral-400 flex items-start gap-2">
                <Info className="size-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  O Agente Financeiro e o CEO de IA atuam sob supervisão.
                  Nenhuma alteração em planos, contratos ou cancelamento é executada sem sua aprovação.
                </span>
              </div>

              <DialogFooter className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalIaAberto(false)}
                  className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Sugestão de otimização registrada para revisão.");
                    setModalIaAberto(false);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500"
                >
                  <Sparkles className="size-3.5" />
                  <span>Aprovar Sugestão</span>
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
