// Tela 02: Receitas (Gestão → Financeiro → Receitas)
// Fiel ao layout aprovado com máxima fidelidade visual, indicadores superiores,
// gráficos analíticos (Evolução das Receitas, Receita por Tipo, Receita por Cliente),
// abas de receitas, filtros combinados, tabela de lançamentos paginada e painel lateral
// da receita selecionada com abas (Visão Geral, Parcelas, Histórico, Contrato),
// recebimentos registrados e sugestões de IA.

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
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  History,
  Info,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
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
  RECEITAS_CATALOGO_INICIAL,
  type ReceitaItem,
  type RecebimentoHistoricoItem,
} from "./receitas-data";

interface ReceitasViewProps {
  onMudarTela: (tela: "painel" | "receitas") => void;
}

export function ReceitasView({ onMudarTela }: ReceitasViewProps) {
  // Dados e Estado
  const [receitas, setReceitas] = useState<ReceitaItem[]>(RECEITAS_CATALOGO_INICIAL);
  const [receitaSelecionadaId, setReceitaSelecionadaId] = useState<string>("rec-1");

  // Abas de Receitas
  type AbaReceita = "todas" | "recebidas" | "pendentes" | "recorrentes" | "novos";
  const [abaAtiva, setAbaAtiva] = useState<AbaReceita>("todas");

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

  // Seleção e Paginação
  const [selecionados, setSelecionados] = useState<string[]>(["rec-1"]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Aba do Painel Direito (Visão Geral, Parcelas, Histórico, Contrato)
  const [abaPainelDireito, setAbaPainelDireito] = useState<"geral" | "parcelas" | "historico" | "contrato">("geral");

  // Modais
  const [modalNovaReceitaAberto, setModalNovaReceitaAberto] = useState(false);
  const [modalRegistrarRecebimentoAberto, setModalRegistrarRecebimentoAberto] = useState(false);
  const [modalVerDocumentoAberto, setModalVerDocumentoAberto] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [iaSugestaoSelecionada, setIaSugestaoSelecionada] = useState<{
    titulo: string;
    subtitulo: string;
    detalhe: string;
  } | null>(null);

  // Formulário Nova Receita
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoCliente, setNovoCliente] = useState("");
  const [novaCategoria, setNovaCategoria] = useState<ReceitaItem["categoria"]>("Serviços");
  const [novoTipo, setNovoTipo] = useState<ReceitaItem["tipo"]>("recorrente");
  const [novoValor, setNovoValor] = useState("");
  const [novaEmissao, setNovaEmissao] = useState("2026-10-01");
  const [novoVencimento, setNovoVencimento] = useState("2026-10-01");
  const [novoStatus, setNovoStatus] = useState<ReceitaItem["status"]>("recebido");
  const [novoContrato, setNovoContrato] = useState("CT-2026-010");
  const [salvandoNova, setSalvandoNova] = useState(false);

  // Formulário Registrar Recebimento
  const [recValorRecebido, setRecValorRecebido] = useState("4900,00");
  const [recDataRecebimento, setRecDataRecebimento] = useState("2026-10-23");
  const [recFormaPagamento, setRecFormaPagamento] = useState<"PIX" | "Boleto" | "Cartão" | "Transferência">("PIX");
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false);

  // Receita Selecionada Ativa
  const receitaAtiva = useMemo(() => {
    return receitas.find((r) => r.id === receitaSelecionadaId) || receitas[0];
  }, [receitas, receitaSelecionadaId]);

  // Filtragem
  const receitasFiltradas = useMemo(() => {
    return receitas.filter((r) => {
      // Abas
      if (abaAtiva === "recebidas" && r.status !== "recebido") return false;
      if (abaAtiva === "pendentes" && r.status !== "pendente") return false;
      if (abaAtiva === "recorrentes" && r.tipo !== "recorrente") return false;
      if (abaAtiva === "novos" && r.id !== "rec-3" && r.id !== "rec-6" && r.id !== "rec-7") return false;

      // Tipo select
      if (filtroTipo !== "all" && r.tipo !== filtroTipo) return false;

      // Categoria select
      if (filtroCategoria !== "all" && r.categoria !== filtroCategoria) return false;

      // Status select
      if (filtroStatus !== "all" && r.status !== filtroStatus) return false;

      // Busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchDesc = r.descricao.toLowerCase().includes(termo);
        const matchCliente = r.cliente.toLowerCase().includes(termo);
        const matchDoc = r.contratoCodigo.toLowerCase().includes(termo);
        if (!matchDesc && !matchCliente && !matchDoc) return false;
      }

      return true;
    });
  }, [receitas, abaAtiva, filtroTipo, filtroCategoria, filtroStatus, busca]);

  // Contadores das Abas
  const contadoresAbas = useMemo(() => {
    return {
      todas: 86,
      recebidas: 62,
      pendentes: 18,
      recorrentes: 24,
      novos: 12,
    };
  }, []);

  // Paginação
  const totalPaginas = Math.ceil(receitasFiltradas.length / itensPorPagina) || 1;
  const receitasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return receitasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [receitasFiltradas, paginaAtual, itensPorPagina]);

  // Seleção
  const toggleSelecionarTodos = () => {
    if (selecionados.length === receitasPaginadas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(receitasPaginadas.map((r) => r.id));
    }
  };

  const toggleSelecionarItem = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Salvar Nova Receita
  const handleCriarNovaReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDescricao.trim() || !novoValor) {
      toast.error("Preencha a descrição e o valor.");
      return;
    }

    setSalvandoNova(true);
    try {
      const valorNum = parseFloat(novoValor.replace(",", "."));
      const novoId = `rec-${Date.now()}`;
      const item: ReceitaItem = {
        id: novoId,
        data: novaEmissao.split("-").reverse().join("/"),
        descricao: novaDescricao.trim(),
        cliente: novoCliente.trim() || "Cliente Direto",
        clienteSegmento: "Comércio & Serviços",
        clienteLogoLetra: (novoCliente.trim()[0] || "C").toUpperCase(),
        clienteLogoBg: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        categoria: novaCategoria,
        categoriaBadge:
          novaCategoria === "Marketing"
            ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
            : novaCategoria === "Implantação"
              ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
              : novaCategoria === "Consultoria"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : "bg-purple-500/20 text-purple-300 border-purple-500/30",
        tipo: novoTipo,
        tipoRotulo: novoTipo === "recorrente" ? "Recorrente" : "Único",
        tipoBadge:
          novoTipo === "recorrente"
            ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
            : "bg-amber-500/15 text-amber-400 border-amber-500/30",
        valor: isNaN(valorNum) ? 0 : valorNum,
        status: novoStatus,
        statusRotulo: novoStatus === "recebido" ? "Recebido" : "Pendente",
        emissao: novaEmissao.split("-").reverse().join("/"),
        vencimento: novoVencimento.split("-").reverse().join("/"),
        contratoCodigo: novoContrato.trim() || "-",
        responsavel: "Marcos Gonçalves",
        recebimentos:
          novoStatus === "recebido"
            ? [
                {
                  id: `rc-${Date.now()}`,
                  data: novaEmissao.split("-").reverse().join("/"),
                  valor: isNaN(valorNum) ? 0 : valorNum,
                  formaPagamento: "PIX",
                  status: "confirmado",
                },
              ]
            : [],
        parcelas: [
          {
            numero: "01/01",
            vencimento: novoVencimento.split("-").reverse().join("/"),
            valor: isNaN(valorNum) ? 0 : valorNum,
            status: novoStatus,
          },
        ],
      };

      setReceitas((prev) => [item, ...prev]);
      setReceitaSelecionadaId(novoId);
      toast.success(`Receita "${item.descricao}" cadastrada com sucesso!`);
      setModalNovaReceitaAberto(false);
      setNovaDescricao("");
      setNovoCliente("");
      setNovoValor("");
    } catch {
      toast.error("Erro ao salvar receita.");
    } finally {
      setSalvandoNova(false);
    }
  };

  // Confirmar Recebimento
  const handleConfirmarRecebimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receitaAtiva) return;

    setSalvandoRecebimento(true);
    try {
      const valorNum = parseFloat(recValorRecebido.replace(",", ".")) || receitaAtiva.valor;
      const novoRecebimento: RecebimentoHistoricoItem = {
        id: `rc-${Date.now()}`,
        data: recDataRecebimento.split("-").reverse().join("/"),
        valor: valorNum,
        formaPagamento: recFormaPagamento,
        status: "confirmado",
      };

      setReceitas((prev) =>
        prev.map((r) =>
          r.id === receitaAtiva.id
            ? {
                ...r,
                status: "recebido",
                statusRotulo: "Recebido",
                recebimentos: [novoRecebimento, ...r.recebimentos],
              }
            : r
        )
      );

      toast.success(`Recebimento de ${formatBRL(valorNum)} confirmado via ${recFormaPagamento}!`);
      setModalRegistrarRecebimentoAberto(false);
    } catch {
      toast.error("Não foi possível confirmar o recebimento.");
    } finally {
      setSalvandoRecebimento(false);
    }
  };

  // Exportar CSV
  const handleExportarCsv = () => {
    const cabecalho = "Data,Descricao,Cliente,Categoria,Tipo,Valor,Status,Vencimento,Contrato,Responsavel\n";
    const linhas = receitasFiltradas
      .map(
        (r) =>
          `"${r.data}","${r.descricao}","${r.cliente}","${r.categoria}","${r.tipoRotulo}","${r.valor}","${r.statusRotulo}","${r.vencimento}","${r.contratoCodigo}","${r.responsavel}"`
      )
      .join("\n");
    const blob = new Blob([cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receitas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório de receitas exportado com sucesso em CSV!");
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
              Receitas
            </span>
          </div>

          {/* Título e Subtítulo */}
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Receitas
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Gerencie seus recebimentos, receitas recorrentes e acompanhe o faturamento da sua empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Controles: Seletor de Período, Exportar, + Nova receita */}
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

          {/* Botão + Nova receita */}
          <button
            type="button"
            onClick={() => setModalNovaReceitaAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Nova receita</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          SEIS INDICADORES SUPERIORES
         ========================================================================= */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Receita Total */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Receita Total</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]">
              <Layers className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 68.500,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+18% este mês</span>
          </div>
        </div>

        {/* Card 2: Receita Recorrente (MRR) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Receita Recorrente (MRR)</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
              <Zap className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 42.800,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+12% este mês</span>
          </div>
        </div>

        {/* Card 3: Receitas Recebidas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Receitas Recebidas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-[#a855f7]">
              <Wallet className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 56.200,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span>82% do total</span>
          </div>
        </div>

        {/* Card 4: Receitas Pendentes */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Receitas Pendentes</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#f97316]">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 12.300,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-orange-400">
            <span>18% do total</span>
          </div>
        </div>

        {/* Card 5: Novos Clientes */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Novos Clientes</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4]">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              12
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+33% este mês</span>
          </div>
        </div>

        {/* Card 6: Receita Média por Cliente */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Receita Média por Cliente</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-[#ef4444]">
              <DollarSign className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 5.708,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+12% este mês</span>
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
          {/* TRÊS GRÁFICOS ANALÍTICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Gráfico 1: Evolução das Receitas (5 colunas) */}
            <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Evolução das Receitas</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Últimos 6 meses</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* SVG Combo Chart: Barras Verdes (Recebidas), Barras Laranjas (Pendentes), Curva Azul (Recorrente) */}
              <div className="relative h-44 w-full pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 340 140">
                  {/* Linhas de Grade */}
                  <line x1="45" y1="15" x2="330" y2="15" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="42" x2="330" y2="42" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="70" x2="330" y2="70" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="98" x2="330" y2="98" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                  <line x1="45" y1="120" x2="330" y2="120" stroke="rgba(255,255,255,0.07)" />

                  {/* Y-axis */}
                  <text x="5" y="18" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 100K</text>
                  <text x="10" y="45" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 75K</text>
                  <text x="10" y="73" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 50K</text>
                  <text x="10" y="101" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 25K</text>
                  <text x="22" y="123" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 0</text>

                  {/* Barras e Meses */}
                  {[
                    { mes: "Abr", x: 60, r: 40, p: 14, rec: 90 },
                    { mes: "Mai", x: 100, r: 52, p: 18, rec: 82 },
                    { mes: "Jun", x: 140, r: 66, p: 20, rec: 74 },
                    { mes: "Jul", x: 180, r: 58, p: 22, rec: 65 },
                    { mes: "Ago", x: 220, r: 74, p: 24, rec: 56 },
                    { mes: "Set", x: 260, r: 82, p: 28, rec: 46 },
                    { mes: "Out", x: 300, r: 94, p: 26, rec: 36 },
                  ].map((item, idx) => (
                    <g key={idx}>
                      {/* Barra Receita Recebida (Verde) */}
                      <rect
                        x={item.x - 7}
                        y={120 - item.r}
                        width="6"
                        height={item.r}
                        rx="2"
                        fill="#10b981"
                      />
                      {/* Barra Receita Pendente (Laranja) */}
                      <rect
                        x={item.x + 1}
                        y={120 - item.p}
                        width="6"
                        height={item.p}
                        rx="2"
                        fill="#f97316"
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

                  {/* Linha Receita Recorrente (Azul) */}
                  <path
                    d="M 60 90 L 100 82 L 140 74 L 180 65 L 220 56 L 260 46 L 300 36"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Pontos da Linha */}
                  {[
                    { x: 60, y: 90 },
                    { x: 100, y: 82 },
                    { x: 140, y: 74 },
                    { x: 180, y: 65 },
                    { x: 220, y: 56 },
                    { x: 260, y: 46 },
                    { x: 300, y: 36 },
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
                  <span className="size-2 rounded-full bg-[#10b981]" />
                  <span>Receitas recebidas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#f97316]" />
                  <span>Receitas pendentes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span>Receita recorrente</span>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Receita por Tipo (3.5 colunas) */}
            <div className="lg:col-span-3.5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Receita por Tipo</h3>
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
                    {/* Serviços mensais (42%) - Azul #3b82f6 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#3b82f6"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="100.2 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Implantação (24%) - Azul claro #60a5fa */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#60a5fa"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="57.3 238.7"
                      strokeDashoffset="-100.2"
                    />
                    {/* Consultoria (15%) - Ciano #06b6d4 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#06b6d4"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-157.5"
                    />
                    {/* Suporte (10%) - Verde #10b981 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="23.8 238.7"
                      strokeDashoffset="-193.3"
                    />
                    {/* Treinamento (6%) - Laranja #f97316 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f97316"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="14.3 238.7"
                      strokeDashoffset="-217.1"
                    />
                    {/* Outros (3%) - Vermelho #f43f5e */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f43f5e"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="7.2 238.7"
                      strokeDashoffset="-231.4"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold font-mono text-white">R$ 68.5K</span>
                    <span className="text-[9px] text-neutral-400">Total</span>
                  </div>
                </div>

                {/* Legenda com percentuais */}
                <div className="flex flex-col gap-1.5 text-[10px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#3b82f6]" />
                      Serviços mensais
                    </span>
                    <span className="font-mono text-neutral-400">42%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#60a5fa]" />
                      Implantação
                    </span>
                    <span className="font-mono text-neutral-400">24%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#06b6d4]" />
                      Consultoria
                    </span>
                    <span className="font-mono text-neutral-400">15%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      Suporte
                    </span>
                    <span className="font-mono text-neutral-400">10%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#f97316]" />
                      Treinamento
                    </span>
                    <span className="font-mono text-neutral-400">6%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#f43f5e]" />
                      Outros
                    </span>
                    <span className="font-mono text-neutral-400">3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico 3: Receita por Cliente (3.5 colunas) */}
            <div className="lg:col-span-3.5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Receita por Cliente</h3>
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
                    {/* Clinica Sorriso Mais (28%) - Azul */}
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
                    {/* Studio Caiobá (18%) - Roxo */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#a855f7"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="43.0 238.7"
                      strokeDashoffset="-66.8"
                    />
                    {/* Parelheiros Advocacia (15%) - Azul Claro */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#38bdf8"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-109.8"
                    />
                    {/* Dra. Julia Lins (12%) - Rosa */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#ec4899"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="28.6 238.7"
                      strokeDashoffset="-145.6"
                    />
                    {/* Meta Platforms (10%) - Verde */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="23.8 238.7"
                      strokeDashoffset="-174.2"
                    />
                    {/* Outros (17%) - Cinza/Indigo */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#64748b"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray="40.7 238.7"
                      strokeDashoffset="-198.0"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold font-mono text-white">R$ 68.5K</span>
                    <span className="text-[9px] text-neutral-400">Total</span>
                  </div>
                </div>

                {/* Legenda com percentuais */}
                <div className="flex flex-col gap-1.5 text-[10px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#3b82f6]" />
                      Clinica Sorriso Mais
                    </span>
                    <span className="font-mono text-neutral-400">28%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#a855f7]" />
                      Studio Caiobá
                    </span>
                    <span className="font-mono text-neutral-400">18%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#38bdf8]" />
                      Parelheiros Advocacia
                    </span>
                    <span className="font-mono text-neutral-400">15%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#ec4899]" />
                      Dra. Julia Lins
                    </span>
                    <span className="font-mono text-neutral-400">12%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      Meta Platforms
                    </span>
                    <span className="font-mono text-neutral-400">10%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <span className="size-2 rounded-full bg-[#64748b]" />
                      Outros
                    </span>
                    <span className="font-mono text-neutral-400">17%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ABAS DE RECEITAS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "todas", label: `Todas as Receitas (${contadoresAbas.todas})`, icon: FileText, color: "orange" },
              { id: "recebidas", label: `Receitas Recebidas (${contadoresAbas.recebidas})`, icon: ArrowUpCircle, color: "emerald" },
              { id: "pendentes", label: `Receitas Pendentes (${contadoresAbas.pendentes})`, icon: Clock, color: "amber" },
              { id: "recorrentes", label: `Receitas Recorrentes (${contadoresAbas.recorrentes})`, icon: Zap, color: "blue" },
              { id: "novos", label: `Novos Clientes (${contadoresAbas.novos})`, icon: Users, color: "cyan" },
            ].map((tab) => {
              const ativa = abaAtiva === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAbaAtiva(tab.id as AbaReceita);
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
                            : tab.color === "blue"
                              ? "text-blue-400"
                              : "text-cyan-400"
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
                  placeholder="Buscar por descrição, cliente ou documento..."
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
                <option value="unico">Único</option>
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
                <option value="Serviços">Serviços</option>
                <option value="Marketing">Marketing</option>
                <option value="Implantação">Implantação</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Suporte">Suporte</option>
                <option value="Treinamento">Treinamento</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
                <option value="Ferramentas">Ferramentas</option>
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
                <option value="recebido">Recebido</option>
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
                onClick={() => toast.info("Painel com filtros avançados ativo no topo.")}
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

          {/* TABELA DE RECEITAS */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f141d] text-[11px] font-semibold text-neutral-400">
                    <th className="py-3 px-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          receitasPaginadas.length > 0 &&
                          selecionados.length === receitasPaginadas.length
                        }
                        onChange={toggleSelecionarTodos}
                        className="size-4 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Descrição</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Status / Emissão</th>
                    <th className="py-3 px-3">Vencimento</th>
                    <th className="py-3 px-3">Contrato</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {receitasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-neutral-500">
                        Nenhuma receita encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    receitasPaginadas.map((item) => {
                      const isLinhaAtiva = receitaSelecionadaId === item.id;
                      const isSelecionado = selecionados.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setReceitaSelecionadaId(item.id)}
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

                          {/* Cliente com Logo/Avatar */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold uppercase",
                                  item.clienteLogoBg
                                )}
                              >
                                {item.clienteLogoLetra}
                              </div>
                              <span className="text-neutral-200">{item.cliente}</span>
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

                          {/* Tipo: Recorrente (Azul) / Único (Âmbar) */}
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
                                  item.tipo === "recorrente" ? "bg-sky-400" : "bg-amber-400"
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
                            {item.status === "recebido" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Recebido
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

                          {/* Status / Emissão */}
                          <td className="py-3 px-3 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                            {item.emissao}
                          </td>

                          {/* Vencimento */}
                          <td className="py-3 px-3 font-mono text-neutral-300 text-[11px] whitespace-nowrap">
                            {item.vencimento}
                          </td>

                          {/* Contrato */}
                          <td className="py-3 px-3 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                            {item.contratoCodigo}
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
                                  setReceitaSelecionadaId(item.id);
                                  setModalVerDocumentoAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                title="Visualizar"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReceitaSelecionadaId(item.id);
                                  setRecValorRecebido(item.valor.toFixed(2).replace(".", ","));
                                  setModalRegistrarRecebimentoAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                title="Registrar Recebimento"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReceitaSelecionadaId(item.id);
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
                  onClick={() => setPaginaAtual(9)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                    paginaAtual === 9
                      ? "bg-orange-500 text-white"
                      : "border border-white/5 bg-[#121620] text-neutral-400 hover:text-white"
                  )}
                >
                  9
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

              {/* Resumo */}
              <div>
                <span>Mostrando 1 - 10 de 86 receitas</span>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA DIREITA (3 colunas no xl): DETALHES DA RECEITA, RECEBIMENTOS, IA
           ======================================================================= */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Card 1: Detalhes da Receita Selecionada */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3.5">
            {/* Header do Cliente */}
            <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl font-bold uppercase text-xs shadow-sm",
                    receitaAtiva.clienteLogoBg
                  )}
                >
                  {receitaAtiva.clienteLogoLetra}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{receitaAtiva.cliente}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{receitaAtiva.clienteSegmento}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 shrink-0">
                <span className="size-1 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>

            {/* Descrição & Subcódigo */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{receitaAtiva.descricao}</h3>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                {receitaAtiva.contratoCodigo} • {receitaAtiva.tipoRotulo}
              </p>
            </div>

            {/* Abas Internas (Visão Geral, Parcelas, Histórico, Contrato) */}
            <div className="flex items-center gap-1 border-b border-white/5 pb-1">
              {[
                { id: "geral", rotulo: "Visão Geral" },
                { id: "parcelas", rotulo: "Parcelas" },
                { id: "historico", rotulo: "Histórico" },
                { id: "contrato", rotulo: "Contrato" },
              ].map((subtab) => (
                <button
                  key={subtab.id}
                  type="button"
                  onClick={() => setAbaPainelDireito(subtab.id as typeof abaPainelDireito)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                    abaPainelDireito === subtab.id
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  {subtab.rotulo}
                </button>
              ))}
            </div>

            {/* Conteúdo da Aba */}
            {abaPainelDireito === "geral" && (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500">Valor da receita</span>
                  <div className="font-mono font-bold text-white text-sm mt-0.5">
                    {formatBRL(receitaAtiva.valor)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Tipo</span>
                  <div className="font-medium text-neutral-200 mt-0.5">
                    {receitaAtiva.tipo === "recorrente" ? "Serviços mensais" : "Projeto pontual"}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Categoria</span>
                  <div className="font-medium text-neutral-200 mt-0.5">{receitaAtiva.categoria}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Data de emissão</span>
                  <div className="font-mono text-neutral-200 mt-0.5">{receitaAtiva.emissao}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Vencimento</span>
                  <div className="font-mono text-neutral-200 mt-0.5">{receitaAtiva.vencimento}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Status</span>
                  <div className="mt-0.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        receitaAtiva.status === "recebido"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : receitaAtiva.status === "em_atraso"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      )}
                    >
                      {receitaAtiva.statusRotulo}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Cliente</span>
                  <div className="font-medium text-white mt-0.5 truncate">{receitaAtiva.cliente}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Responsável</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex size-4 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-[8px] font-bold">
                      MG
                    </div>
                    <span className="text-white truncate">{receitaAtiva.responsavel}</span>
                  </div>
                </div>
              </div>
            )}

            {abaPainelDireito === "parcelas" && (
              <div className="flex flex-col gap-2 text-xs">
                {receitaAtiva.parcelas.map((parc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-[#121620]"
                  >
                    <div>
                      <span className="font-bold text-white">Parcela {parc.numero}</span>
                      <div className="text-[10px] text-neutral-400 font-mono">{parc.vencimento}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">{formatBRL(parc.valor)}</div>
                      <span
                        className={cn(
                          "text-[9px] uppercase font-bold",
                          parc.status === "recebido" ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {parc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaPainelDireito === "historico" && (
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2 rounded-xl border border-white/5 bg-[#121620]">
                  <span className="text-neutral-500 text-[10px]">Emissão registrada</span>
                  <div className="text-white mt-0.5">{receitaAtiva.emissao} às 09:15</div>
                </div>
                {receitaAtiva.recebimentos.map((r, i) => (
                  <div key={i} className="p-2 rounded-xl border border-white/5 bg-[#121620]">
                    <span className="text-emerald-400 text-[10px] font-bold">Pagamento confirmado</span>
                    <div className="text-white mt-0.5">
                      {formatBRL(r.valor)} via {r.formaPagamento} em {r.data}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaPainelDireito === "contrato" && (
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-3 rounded-xl border border-white/5 bg-[#121620] flex justify-between items-center">
                  <div>
                    <span className="text-neutral-500 text-[10px]">Código do Contrato</span>
                    <div className="font-mono font-bold text-white text-sm">
                      {receitaAtiva.contratoCodigo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalVerDocumentoAberto(true)}
                    className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-[10px] font-semibold text-white hover:bg-white/10"
                  >
                    Abrir Contrato
                  </button>
                </div>
              </div>
            )}

            {/* Ações Primárias */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setModalVerDocumentoAberto(true)}
                className="w-full flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110"
              >
                <span>Ver documento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecValorRecebido(receitaAtiva.valor.toFixed(2).replace(".", ","));
                  setModalRegistrarRecebimentoAberto(true);
                }}
                className="w-full flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:text-white hover:border-white/20"
              >
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Registrar recebimento</span>
              </button>
            </div>

            {/* Sub-Ações (Editar, Duplicar, Mais ações) */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setNovaDescricao(receitaAtiva.descricao);
                  setNovoCliente(receitaAtiva.cliente);
                  setNovoValor(receitaAtiva.valor.toString());
                  setModalNovaReceitaAberto(true);
                }}
                className="flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-[#121620] py-1.5 text-neutral-300 hover:text-white"
              >
                <Pencil className="size-3" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const duplicado: ReceitaItem = {
                    ...receitaAtiva,
                    id: `rec-${Date.now()}`,
                    descricao: `${receitaAtiva.descricao} (Cópia)`,
                  };
                  setReceitas((prev) => [duplicado, ...prev]);
                  toast.success(`Receita duplicada com sucesso!`);
                }}
                className="flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-[#121620] py-1.5 text-neutral-300 hover:text-white"
              >
                <Copy className="size-3" />
                <span>Duplicar</span>
              </button>

              <button
                type="button"
                onClick={() => toast.info("Mais opções comerciais disponíveis em breve.")}
                className="flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-[#121620] py-1.5 text-neutral-300 hover:text-white"
              >
                <span>Mais ações</span>
                <ChevronDown className="size-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Recebimentos */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Recebimentos</h4>
              <span className="text-[10px] text-neutral-400 font-mono">
                {receitaAtiva.recebimentos.length} de {receitaAtiva.recebimentos.length || 1}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-white/5 text-xs">
              {receitaAtiva.recebimentos.length === 0 ? (
                <div className="py-4 text-center text-neutral-500 text-[11px]">
                  Nenhum recebimento confirmado para esta receita.
                </div>
              ) : (
                receitaAtiva.recebimentos.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-[#121620]"
                  >
                    <div>
                      <div className="font-mono font-medium text-white">{r.data}</div>
                      <div className="text-[10px] text-neutral-400">{r.formaPagamento}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">{formatBRL(r.valor)}</div>
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
                        <Check className="size-2.5" />
                        Confirmado
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Sugestões de IA */}
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
                onClick={() => toast.info("O Agente Financeiro está monitorando o ciclo de faturamento.")}
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                Ver todas
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-purple-500/10">
              {[
                {
                  titulo: "Programar próxima cobrança",
                  subtitulo: "A próxima cobrança vence em 01/11.",
                  detalhe:
                    "A recorrência mensal deste contrato possui vencimento agendado para 01/11. É recomendado programar o envio do lembrete automático 3 dias antes.",
                },
                {
                  titulo: "Sugerir upgrade de plano",
                  subtitulo: "Cliente com potencial de expansão.",
                  detalhe:
                    "O cliente completou 6 meses de adimplência pontual com volume crescente de solicitações. O Agente Vendedor pode propor a adição de suporte dedicado.",
                },
                {
                  titulo: "Identificar oportunidades",
                  subtitulo: "Propor serviços complementares.",
                  detalhe:
                    "Empresas do mesmo porte no segmento adotaram recentemente módulo de consultoria estratégica com ROI médio de +22%.",
                },
                {
                  titulo: "Prever risco de atraso",
                  subtitulo: "Cliente com histórico de atraso.",
                  detalhe:
                    "Oscilações no histórico de pagamento sugerem envio de canal alternativo de cobrança via WhatsApp para garantir pontualidade.",
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

      {/* Modal 1: Nova Receita */}
      <Dialog open={modalNovaReceitaAberto} onOpenChange={setModalNovaReceitaAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="size-4 text-orange-400" />
              Cadastrar Nova Receita
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarNovaReceita} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Descrição da Receita *</label>
              <input
                type="text"
                required
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Ex: Mensalidade, Implantação, Consultoria..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Cliente *</label>
                <input
                  type="text"
                  required
                  value={novoCliente}
                  onChange={(e) => setNovoCliente(e.target.value)}
                  placeholder="Nome do cliente"
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
                  placeholder="4900,00"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Tipo</label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as ReceitaItem["tipo"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="recorrente">Recorrente</option>
                  <option value="unico">Único</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Categoria</label>
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value as ReceitaItem["categoria"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="Serviços">Serviços</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Implantação">Implantação</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Treinamento">Treinamento</option>
                  <option value="Desenvolvimento">Desenvolvimento</option>
                  <option value="Ferramentas">Ferramentas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Data de Emissão</label>
                <input
                  type="date"
                  value={novaEmissao}
                  onChange={(e) => setNovaEmissao(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Data de Vencimento</label>
                <input
                  type="date"
                  value={novoVencimento}
                  onChange={(e) => setNovoVencimento(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Status</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as ReceitaItem["status"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="recebido">Recebido</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Código do Contrato</label>
                <input
                  type="text"
                  value={novoContrato}
                  onChange={(e) => setNovoContrato(e.target.value)}
                  placeholder="CT-2026-001"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaReceitaAberto(false)}
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
                <span>Salvar Receita</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Registrar Recebimento */}
      <Dialog open={modalRegistrarRecebimentoAberto} onOpenChange={setModalRegistrarRecebimentoAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Registrar Recebimento
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConfirmarRecebimento} className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-white/5 bg-[#121620] p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-400 font-medium">Cliente & Receita</span>
                <div className="font-bold text-white mt-0.5">{receitaAtiva.descricao}</div>
                <div className="text-[11px] text-neutral-400">{receitaAtiva.cliente}</div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {formatBRL(receitaAtiva.valor)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Valor Recebido (R$) *</label>
                <input
                  type="text"
                  required
                  value={recValorRecebido}
                  onChange={(e) => setRecValorRecebido(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Data do Pagamento</label>
                <input
                  type="date"
                  value={recDataRecebimento}
                  onChange={(e) => setRecDataRecebimento(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Forma de Pagamento</label>
              <select
                value={recFormaPagamento}
                onChange={(e) => setRecFormaPagamento(e.target.value as typeof recFormaPagamento)}
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                <option value="PIX">PIX (Instantâneo)</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Cartão">Cartão de Crédito</option>
                <option value="Transferência">Transferência Bancária</option>
              </select>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModalRegistrarRecebimentoAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoRecebimento}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 disabled:opacity-50"
              >
                {salvandoRecebimento && <Loader2 className="size-3.5 animate-spin" />}
                <span>Confirmar Recebimento</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Ver Documento / Contrato */}
      <Dialog open={modalVerDocumentoAberto} onOpenChange={setModalVerDocumentoAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <FileText className="size-4 text-orange-400" />
              Documento da Receita: {receitaAtiva.contratoCodigo}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-white/5 bg-[#121620] p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">Cliente Vinculado</span>
                <div className="font-bold text-white text-sm">{receitaAtiva.cliente}</div>
                <div className="text-[11px] text-neutral-400">{receitaAtiva.clienteSegmento}</div>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-white text-base">
                  {formatBRL(receitaAtiva.valor)}
                </span>
                <div className="text-[10px] text-emerald-400 font-semibold">{receitaAtiva.statusRotulo}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/5 bg-[#121620]/60 flex flex-col gap-1.5 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-500">Descrição:</span>
                <span className="font-semibold text-white">{receitaAtiva.descricao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Contrato:</span>
                <span className="font-mono text-white">{receitaAtiva.contratoCodigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Data de Emissão:</span>
                <span className="font-mono text-white">{receitaAtiva.emissao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Vencimento:</span>
                <span className="font-mono text-white">{receitaAtiva.vencimento}</span>
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
              Exportar Relatório de Receitas
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-neutral-400">
              Selecione o formato para exportar as {receitasFiltradas.length} receitas filtradas:
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

      {/* Modal 5: Sugestão de IA */}
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
                  Análise de Receita & Cobrança
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
                  O CEO de IA e o Agente Financeiro atuam exclusivamente com aprovação expressa do administrador.
                  Nenhuma cobrança ou alteração contratual é efetuada sem sua confirmação.
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
                    toast.success("Ação programada para acompanhamento da equipe financeira.");
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
