// Fase 2 / Redesign Premium — Tela 01: Painel Financeiro (Gestão → Financeiro)
// Fiel ao layout visual final aprovado com máxima fidelidade visual, submenu lateral exclusivo,
// seis indicadores superiores, três gráficos analíticos (Receitas vs Despesas, Receita por Fonte,
// Despesas por Categoria), abas de transações, filtros combinados, tabela paginada com ações,
// painel lateral direito (Saldo em Conta, Cobranças em Aberto, Próximos Vencimentos, Sugestões de IA)
// e preservação completa das integrações reais existentes.

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Award,
  Banknote,
  BarChart2,
  BarChart3,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
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
  Landmark,
  Layers,
  LayoutDashboard,
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
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import type { RegistroFinanceiro, PagamentoStatus } from "@/types";
import { listarFinanceiro, marcarComoPago } from "@/services/financeiro";
import { FinanceiroSidebarNav, type TelaFinanceiroId } from "./FinanceiroSidebarNav";
import {
  TRANSACOES_INICIAIS,
  CONTAS_BANCARIAS_INICIAIS,
  COBRANCAS_RESUMO_INICIAIS,
  PROXIMOS_VENCIMENTOS_INICIAIS,
  type TransacaoFinanceiraItem,
  type ContaBancariaItem,
  type ProximoVencimentoItem,
} from "./financeiro-data";

function getInitialTela(): TelaFinanceiroId {
  if (typeof window === "undefined") return "painel";
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tela");
  if (t === "receitas") return "receitas";
  if (t === "despesas") return "despesas";
  if (t === "cobrancas") return "cobrancas";
  if (t === "relatorios") return "relatorios";
  if (t === "configuracoes") return "configuracoes";
  return "painel";
}

export function FinanceiroSection() {
  const [telaAtiva, setTelaAtiva] = useState<TelaFinanceiroId>(getInitialTela);

  // Estados de dados
  const [transacoes, setTransacoes] = useState<TransacaoFinanceiraItem[]>(TRANSACOES_INICIAIS);
  const [contasBancarias, setContasBancarias] = useState<ContaBancariaItem[]>(CONTAS_BANCARIAS_INICIAIS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abas de transações
  type AbaTransacao = "todas" | "receitas" | "despesas" | "receber" | "atraso" | "pagar";
  const [abaAtiva, setAbaAtiva] = useState<AbaTransacao>("todas");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [visualizacao, setVisualizacao] = useState<"lista" | "cards">("lista");
  const [periodoFiltro, setPeriodoFiltro] = useState("01/10/2026 - 31/10/2026");
  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);

  // Seleção e paginação
  const [selecionados, setSelecionados] = useState<string[]>(["tx-1"]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Modais
  const [modalNovaReceitaAberto, setModalNovaReceitaAberto] = useState(false);
  const [modalVerContasAberto, setModalVerContasAberto] = useState(false);
  const [modalCobrancasAberto, setModalCobrancasAberto] = useState(false);
  const [modalVencimentosAberto, setModalVencimentosAberto] = useState(false);
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<TransacaoFinanceiraItem | null>(null);
  const [iaSugestaoSelecionada, setIaSugestaoSelecionada] = useState<{
    titulo: string;
    subtitulo: string;
    detalhe: string;
  } | null>(null);

  // Formulário Nova Receita
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoCliente, setNovoCliente] = useState("");
  const [novaCategoria, setNovaCategoria] = useState<TransacaoFinanceiraItem["categoria"]>("Serviços");
  const [novoValor, setNovoValor] = useState("");
  const [novaData, setNovaData] = useState("2026-10-23");
  const [novoStatus, setNovoStatus] = useState<TransacaoFinanceiraItem["status"]>("recebido");
  const [novoDoc, setNovoDoc] = useState("");
  const [salvandoNova, setSalvandoNova] = useState(false);

  // Sincronizar parâmetros de URL
  const mudarTela = (id: TelaFinanceiroId) => {
    setTelaAtiva(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id === "painel") {
        url.searchParams.delete("tela");
      } else {
        url.searchParams.set("tela", id);
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  // Carregar dados reais existentes e fundir com catálogo
  const carregarDadosReais = async () => {
    setLoading(true);
    setError(null);
    try {
      const registros = await listarFinanceiro();
      if (registros && registros.length > 0) {
        // Converte registros reais para o formato da interface
        const convertidos: TransacaoFinanceiraItem[] = registros.map((r) => ({
          id: r.id,
          data: formatData(r.vencimento) || "23/10/2026",
          descricao: r.descricao,
          clienteFornecedor: r.lead_nome,
          categoria: "Serviços",
          categoriaBadgeCor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          tipo: "receita",
          valor: r.valor,
          status: r.status === "pago" ? "recebido" : r.status === "atrasado" ? "em_atraso" : "pendente",
          statusRotulo: r.status === "pago" ? "Recebido" : r.status === "atrasado" ? "Em atraso" : "Pendente",
          documentoCodigo: r.contrato_id ? `CT-${r.contrato_id.slice(-4).toUpperCase()}` : "FAT-2026",
        }));

        setTransacoes((prev) => {
          const idsExistentes = new Set(convertidos.map((c) => c.id));
          return [...convertidos, ...prev.filter((p) => !idsExistentes.has(p.id))];
        });
      }
    } catch (err) {
      console.warn("Aviso ao carregar registros do Supabase:", err);
      // Não quebra a interface, mantém registros padrão
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosReais();
  }, []);

  // Filtragem de transações
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      // Abas
      if (abaAtiva === "receitas" && t.tipo !== "receita") return false;
      if (abaAtiva === "despesas" && t.tipo !== "despesa") return false;
      if (abaAtiva === "receber" && !(t.tipo === "receita" && t.status === "pendente")) return false;
      if (abaAtiva === "atraso" && t.status !== "em_atraso") return false;
      if (abaAtiva === "pagar" && !(t.tipo === "despesa" && t.status === "pendente")) return false;

      // Tipo select
      if (filtroTipo !== "all" && t.tipo !== filtroTipo) return false;

      // Status select
      if (filtroStatus !== "all" && t.status !== filtroStatus) return false;

      // Categoria select
      if (filtroCategoria !== "all" && t.categoria !== filtroCategoria) return false;

      // Busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchDesc = t.descricao.toLowerCase().includes(termo);
        const matchCliente = t.clienteFornecedor.toLowerCase().includes(termo);
        const matchDoc = t.documentoCodigo.toLowerCase().includes(termo);
        if (!matchDesc && !matchCliente && !matchDoc) return false;
      }

      return true;
    });
  }, [transacoes, abaAtiva, filtroTipo, filtroStatus, filtroCategoria, busca]);

  // Contadores para as abas
  const contadoresAbas = useMemo(() => {
    return {
      todas: 128,
      receitas: 86,
      despesas: 32,
      receber: 18,
      atraso: 5,
      pagar: 12,
    };
  }, []);

  // Paginação
  const totalPaginas = Math.ceil(transacoesFiltradas.length / itensPorPagina) || 1;
  const transacoesPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return transacoesFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [transacoesFiltradas, paginaAtual, itensPorPagina]);

  // Selecionar todos / desmarcar todos
  const toggleSelecionarTodos = () => {
    if (selecionados.length === transacoesPaginadas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(transacoesPaginadas.map((t) => t.id));
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
      toast.error("Preencha a descrição e o valor da receita.");
      return;
    }

    setSalvandoNova(true);
    try {
      const valorNumerico = parseFloat(novoValor.replace(",", "."));
      const novoId = `tx-${Date.now()}`;
      const nova: TransacaoFinanceiraItem = {
        id: novoId,
        data: novaData.split("-").reverse().join("/"),
        descricao: novaDescricao.trim(),
        clienteFornecedor: novoCliente.trim() || "Cliente Direto",
        categoria: novaCategoria,
        categoriaBadgeCor:
          novaCategoria === "Marketing"
            ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
            : novaCategoria === "Implantação"
              ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
              : novaCategoria === "Consultoria"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : "bg-purple-500/20 text-purple-300 border-purple-500/30",
        tipo: "receita",
        valor: isNaN(valorNumerico) ? 0 : valorNumerico,
        status: novoStatus,
        statusRotulo: novoStatus === "recebido" ? "Recebido" : "Pendente",
        documentoCodigo: novoDoc.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      setTransacoes((prev) => [nova, ...prev]);
      toast.success(`Receita "${nova.descricao}" registrada com sucesso!`);
      setModalNovaReceitaAberto(false);
      setNovaDescricao("");
      setNovoCliente("");
      setNovoValor("");
      setNovoDoc("");
    } catch {
      toast.error("Não foi possível salvar a nova receita.");
    } finally {
      setSalvandoNova(false);
    }
  };

  // Marcar como pago / recebido
  const handleMarcarComoPago = async (item: TransacaoFinanceiraItem) => {
    try {
      if (item.id.startsWith("fin-")) {
        await marcarComoPago(item.id);
      }
      setTransacoes((prev) =>
        prev.map((t) =>
          t.id === item.id
            ? {
                ...t,
                status: t.tipo === "receita" ? "recebido" : "pago",
                statusRotulo: t.tipo === "receita" ? "Recebido" : "Pago",
              }
            : t
        )
      );
      toast.success(`Transação "${item.descricao}" atualizada com sucesso!`);
      if (transacaoSelecionada?.id === item.id) {
        setTransacaoSelecionada((prev) =>
          prev
            ? {
                ...prev,
                status: prev.tipo === "receita" ? "recebido" : "pago",
                statusRotulo: prev.tipo === "receita" ? "Recebido" : "Pago",
              }
            : null
        );
      }
    } catch {
      toast.error("Falha ao atualizar o status da transação.");
    }
  };

  // Se não for a tela 01, exibe o placeholder respeitando o submenu
  if (telaAtiva !== "painel") {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#07090e] text-neutral-100 antialiased">
        <FinanceiroSidebarNav telaAtiva={telaAtiva} onSelecionarTela={mudarTela} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-4 shadow-lg shadow-orange-500/10">
            <Receipt className="size-8 stroke-[1.8]" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 mb-3">
            Módulo em desenvolvimento
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Tela {telaAtiva.toUpperCase()} — Em Breve
          </h2>
          <p className="mt-2 text-sm text-neutral-400 max-w-md">
            Esta visualização está programada para a próxima etapa do redesign do módulo Financeiro.
            Acesse o Painel Executivo para acompanhar os KPIs, gráficos e transações.
          </p>
          <button
            type="button"
            onClick={() => mudarTela("painel")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-95"
          >
            <LayoutDashboard className="size-4" />
            <span>Voltar ao Painel Financeiro</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-orange-500/30">
      {/* 1. SUBMENU LATERAL EXCLUSIVO DO FINANCEIRO */}
      <FinanceiroSidebarNav telaAtiva={telaAtiva} onSelecionarTela={mudarTela} />

      {/* 2. ÁREA PRINCIPAL DE CONTEÚDO */}
      <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 flex flex-col gap-5 overflow-x-hidden">
        {/* =========================================================================
            CABEÇALHO & BREADCRUMB
           ========================================================================= */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="hover:text-neutral-300 cursor-pointer">Financeiro</span>
              <span className="text-neutral-600">›</span>
              <span className="flex items-center gap-1.5 font-medium text-orange-400">
                <FileText className="size-3.5 text-orange-400" />
                Painel Financeiro
              </span>
            </div>

            {/* Título e Subtítulo */}
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
                <FileText className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Painel Financeiro
                </h1>
                <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                  Acompanhe receitas, despesas, contratos, cobranças e o desempenho financeiro da sua empresa.
                </p>
              </div>
            </div>
          </div>

          {/* Controles Superiores: Seletor de Período & Nova Receita */}
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
            3. SEIS CARDS DE INDICADORES FINANCEIROS (KPIs)
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
              <span>+12% este mês</span>
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
              <span>+8% este mês</span>
            </div>
          </div>

          {/* Card 3: Despesas Total */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400">Despesas Total</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#f97316]">
                <Receipt className="size-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                R$ 18.200,00
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <TrendingDown className="size-3" />
              <span>-5% este mês</span>
            </div>
          </div>

          {/* Card 4: Lucro Líquido */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400">Lucro Líquido</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-[#a855f7]">
                <Clock className="size-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                R$ 50.300,00
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <TrendingUp className="size-3" />
              <span>+18% este mês</span>
            </div>
          </div>

          {/* Card 5: Contas a Receber */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400">Contas a Receber</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4]">
                <FileSpreadsheet className="size-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                R$ 24.500,00
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-cyan-400">
              <span>12 cobranças</span>
            </div>
          </div>

          {/* Card 6: Contas em Atraso */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400">Contas em Atraso</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-[#ef4444]">
                <AlertCircle className="size-3.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                R$ 8.900,00
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-red-400">
              <span>5 cobranças</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. CORPO PRINCIPAL: COLUNA ESQUERDA (GRÁFICOS, ABAS, TABELA) + COLUNA DIREITA
           ========================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* =======================================================================
              COLUNA ESQUERDA (8 ou 9 colunas no xl)
             ======================================================================= */}
          <div className="xl:col-span-9 flex flex-col gap-5 min-w-0">
            {/* 3 GRÁFICOS ANALÍTICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Gráfico 1: Receitas vs Despesas (5 colunas) */}
              <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <h3 className="text-xs font-bold text-white tracking-wide">Receitas vs Despesas</h3>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                    <span>Últimos 6 meses</span>
                    <ChevronDown className="size-3 text-neutral-500" />
                  </div>
                </div>

                {/* SVG Combo Chart: Barras Verdes (Receitas), Barras Vermelhas (Despesas), Linha Azul (Lucro) */}
                <div className="relative h-44 w-full pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 340 140">
                    {/* Linhas de Grade */}
                    <line x1="45" y1="15" x2="330" y2="15" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                    <line x1="45" y1="42" x2="330" y2="42" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                    <line x1="45" y1="70" x2="330" y2="70" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                    <line x1="45" y1="98" x2="330" y2="98" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" />
                    <line x1="45" y1="120" x2="330" y2="120" stroke="rgba(255,255,255,0.07)" />

                    {/* Rótulos do Eixo Y */}
                    <text x="5" y="18" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 100K</text>
                    <text x="10" y="45" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 75K</text>
                    <text x="10" y="73" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 50K</text>
                    <text x="10" y="101" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 25K</text>
                    <text x="22" y="123" fill="#64748b" fontSize="7.5" fontFamily="monospace">R$ 0</text>

                    {/* Barras Receitas (Verde) e Despesas (Vermelho) por mês */}
                    {[
                      { mes: "Abr", x: 60, r: 42, d: 18, l: 78 },
                      { mes: "Mai", x: 100, r: 54, d: 24, l: 68 },
                      { mes: "Jun", x: 140, r: 68, d: 28, l: 56 },
                      { mes: "Jul", x: 180, r: 60, d: 30, l: 64 },
                      { mes: "Ago", x: 220, r: 76, d: 35, l: 48 },
                      { mes: "Set", x: 260, r: 84, d: 38, l: 42 },
                      { mes: "Out", x: 300, r: 96, d: 42, l: 30 },
                    ].map((item, idx) => (
                      <g key={idx}>
                        {/* Barra Receita (Verde esmeralda) */}
                        <rect
                          x={item.x - 7}
                          y={120 - item.r}
                          width="6"
                          height={item.r}
                          rx="2"
                          fill="#10b981"
                          className="transition-all hover:opacity-80"
                        />
                        {/* Barra Despesa (Vermelho) */}
                        <rect
                          x={item.x + 1}
                          y={120 - item.d}
                          width="6"
                          height={item.d}
                          rx="2"
                          fill="#ef4444"
                          className="transition-all hover:opacity-80"
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

                    {/* Linha de Lucro (Azul conectando pontos) */}
                    <path
                      d="M 60 78 L 100 68 L 140 56 L 180 64 L 220 48 L 260 42 L 300 30"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />

                    {/* Pontos de Lucro */}
                    {[
                      { x: 60, y: 78 },
                      { x: 100, y: 68 },
                      { x: 140, y: 56 },
                      { x: 180, y: 64 },
                      { x: 220, y: 48 },
                      { x: 260, y: 42 },
                      { x: 300, y: 30 },
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
                    <span>Receitas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#ef4444]" />
                    <span>Despesas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#3b82f6]" />
                    <span>Lucro</span>
                  </div>
                </div>
              </div>

              {/* Gráfico 2: Receita por Fonte (3.5 colunas) */}
              <div className="lg:col-span-3.5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <h3 className="text-xs font-bold text-white tracking-wide">Receita por Fonte</h3>
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                    <span>Este mês</span>
                    <ChevronDown className="size-3 text-neutral-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 py-2">
                  {/* Donut Chart SVG */}
                  <div className="relative size-28 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                      {/* Círculo base cinza */}
                      <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="11" fill="none" />
                      {/* Contratos (42%) - Azul #3b82f6 */}
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
                      {/* Propostas (24%) - Roxo #a855f7 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#a855f7"
                        strokeWidth="11"
                        fill="none"
                        strokeDasharray="57.3 238.7"
                        strokeDashoffset="-100.2"
                      />
                      {/* Serviços avulsos (15%) - Ciano #06b6d4 */}
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
                      {/* Consultoria (10%) - Verde #10b981 */}
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
                      {/* Implantação (6%) - Laranja #f97316 */}
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
                        Contratos
                      </span>
                      <span className="font-mono text-neutral-400">42%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#a855f7]" />
                        Propostas
                      </span>
                      <span className="font-mono text-neutral-400">24%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#06b6d4]" />
                        Serviços avulsos
                      </span>
                      <span className="font-mono text-neutral-400">15%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#10b981]" />
                        Consultoria
                      </span>
                      <span className="font-mono text-neutral-400">10%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#f97316]" />
                        Implantação
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

              {/* Gráfico 3: Despesas por Categoria (3.5 colunas) */}
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
                      {/* Ferramentas (26%) - Azul */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#3b82f6"
                        strokeWidth="11"
                        fill="none"
                        strokeDasharray="62.0 238.7"
                        strokeDashoffset="0"
                      />
                      {/* Equipe (24%) - Roxo */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#a855f7"
                        strokeWidth="11"
                        fill="none"
                        strokeDasharray="57.3 238.7"
                        strokeDashoffset="-62.0"
                      />
                      {/* Marketing (18%) - Rosa #ec4899 */}
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
                      {/* Infraestrutura (15%) - Verde #10b981 */}
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
                      {/* Serviços terceiros (12%) - Laranja */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#f97316"
                        strokeWidth="11"
                        fill="none"
                        strokeDasharray="28.6 238.7"
                        strokeDashoffset="-198.1"
                      />
                      {/* Outros (5%) - Indigo #6366f1 */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#6366f1"
                        strokeWidth="11"
                        fill="none"
                        strokeDasharray="12.0 238.7"
                        strokeDashoffset="-226.7"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold font-mono text-white">R$ 18.2K</span>
                      <span className="text-[9px] text-neutral-400">Total</span>
                    </div>
                  </div>

                  {/* Legenda com percentuais */}
                  <div className="flex flex-col gap-1.5 text-[10px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#3b82f6]" />
                        Ferramentas
                      </span>
                      <span className="font-mono text-neutral-400">26%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#a855f7]" />
                        Equipe
                      </span>
                      <span className="font-mono text-neutral-400">24%</span>
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
                        <span className="size-2 rounded-full bg-[#f97316]" />
                        Serviços terceiros
                      </span>
                      <span className="font-mono text-neutral-400">12%</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <span className="size-2 rounded-full bg-[#6366f1]" />
                        Outros
                      </span>
                      <span className="font-mono text-neutral-400">5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ABAS DE TRANSAÇÕES */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "todas", label: `Todas as Transações (${contadoresAbas.todas})`, icon: FileText, color: "orange" },
                { id: "receitas", label: `Receitas (${contadoresAbas.receitas})`, icon: ArrowUpCircle, color: "emerald" },
                { id: "despesas", label: `Despesas (${contadoresAbas.despesas})`, icon: ArrowDownCircle, color: "red" },
                { id: "receber", label: `A Receber (${contadoresAbas.receber})`, icon: Clock, color: "amber" },
                { id: "atraso", label: `Em Atraso (${contadoresAbas.atraso})`, icon: AlertCircle, color: "red" },
                { id: "pagar", label: `A Pagar (${contadoresAbas.pagar})`, icon: CreditCard, color: "cyan" },
              ].map((tab) => {
                const ativa = abaAtiva === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setAbaAtiva(tab.id as AbaTransacao);
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
                            : tab.color === "red"
                              ? "text-red-400"
                              : tab.color === "amber"
                                ? "text-amber-400"
                                : "text-neutral-400"
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
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
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
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_atraso">Em atraso</option>
                </select>

                {/* Filtro Categoria */}
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
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Equipe">Equipe</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Ferramentas">Ferramentas</option>
                </select>

                {/* Data inicial */}
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

                {/* Data final */}
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

                {/* Botão Filtros */}
                <button
                  type="button"
                  onClick={() => {
                    toast.info("Filtros avançados ativos no painel.");
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-white/5 bg-[#121620] px-3 text-xs font-medium text-neutral-300 hover:text-white hover:border-white/10"
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filtros</span>
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
                  title="Visualização em Lista"
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
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>

            {/* TABELA DE TRANSAÇÕES */}
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0f141d] text-[11px] font-semibold text-neutral-400">
                      <th className="py-3 px-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={
                            transacoesPaginadas.length > 0 &&
                            selecionados.length === transacoesPaginadas.length
                          }
                          onChange={toggleSelecionarTodos}
                          className="size-4 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Descrição</th>
                      <th className="py-3 px-3">Cliente / Fornecedor</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Valor</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Documento</th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {transacoesPaginadas.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-neutral-500">
                          Nenhuma transação encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      transacoesPaginadas.map((item) => {
                        const isSelecionado = selecionados.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={cn(
                              "transition-colors hover:bg-white/[0.02]",
                              isSelecionado && "bg-orange-500/[0.04]"
                            )}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3.5">
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

                            {/* Cliente / Fornecedor */}
                            <td className="py-3 px-3 text-neutral-300 whitespace-nowrap">
                              {item.clienteFornecedor}
                            </td>

                            {/* Categoria */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border",
                                  item.categoriaBadgeCor
                                )}
                              >
                                {item.categoria}
                              </span>
                            </td>

                            {/* Tipo: Receita (Verde) / Despesa (Vermelho) */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {item.tipo === "receita" ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="size-1.5 rounded-full bg-emerald-400" />
                                  Receita
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                  <span className="size-1.5 rounded-full bg-red-400" />
                                  Despesa
                                </span>
                              )}
                            </td>

                            {/* Valor */}
                            <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                              {formatBRL(item.valor)}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {item.status === "recebido" || item.status === "pago" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  {item.statusRotulo}
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

                            {/* Documento */}
                            <td className="py-3 px-3 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                              {item.documentoCodigo}
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransacaoSelecionada(item);
                                    setModalDetalheAberto(true);
                                  }}
                                  className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                  title="Visualizar Detalhes"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarcarComoPago(item)}
                                  className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                  title="Marcar como Pago / Recebido"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransacaoSelecionada(item);
                                    setModalDetalheAberto(true);
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

                {/* Texto de resumo */}
                <div>
                  <span>Mostrando 1 - 10 de 128 transações</span>
                </div>
              </div>
            </div>
          </div>

          {/* =======================================================================
              COLUNA DIREITA (3 colunas no xl): SALDO, COBRANÇAS, VENCIMENTOS, IA
             ======================================================================= */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            {/* Card 1: Saldo em Conta */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4]">
                    <Landmark className="size-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-400">Saldo em Conta</span>
                    <h4 className="text-lg font-bold font-mono text-white">R$ 36.750,00</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalVerContasAberto(true)}
                  className="rounded-lg border border-white/5 bg-[#121620] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-white/10"
                >
                  Ver contas
                </button>
              </div>

              {/* Lista de Bancos */}
              <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
                {contasBancarias.map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-neutral-600" />
                      <span className="text-neutral-300">{conta.nome}</span>
                    </div>
                    <span className="font-mono font-semibold text-white">
                      {formatBRL(conta.saldo)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Cobranças em Aberto */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#f97316]">
                    <FileText className="size-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Cobranças em Aberto</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCobrancasAberto(true)}
                  className="rounded-lg border border-white/5 bg-[#121620] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-white/10"
                >
                  Ver todas
                </button>
              </div>

              {/* Níveis de Urgência */}
              <div className="flex flex-col gap-2.5 pt-1 border-t border-white/5">
                {COBRANCAS_RESUMO_INICIAIS.map((cob, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", cob.cor)} />
                      <span className="text-neutral-300">{cob.etapa}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-400 font-mono text-[11px]">{cob.quantidade}</span>
                      <span className="font-mono font-semibold text-white">
                        {formatBRL(cob.valorTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Próximos Vencimentos */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Próximos Vencimentos</h4>
                <button
                  type="button"
                  onClick={() => setModalVencimentosAberto(true)}
                  className="rounded-lg border border-white/5 bg-[#121620] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-white/10"
                >
                  Ver todos
                </button>
              </div>

              {/* Lista dos 4 Vencimentos */}
              <div className="flex flex-col gap-2.5 pt-1 border-t border-white/5">
                {PROXIMOS_VENCIMENTOS_INICIAIS.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#121620] border border-white/10 text-[10px] font-bold text-white uppercase">
                        {item.avatarLetra}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {item.clienteNome}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {item.contratoCodigo}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={cn(
                          "text-[10px] font-mono",
                          item.vencimento === "01/10/2026" || item.vencimento === "05/10/2026"
                            ? "text-red-400 font-semibold"
                            : "text-neutral-400"
                        )}
                      >
                        {item.vencimento}
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        {formatBRL(item.valor)}
                      </div>
                    </div>
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
                  onClick={() => {
                    toast.info(
                      "O CEO de IA e o Agente Financeiro estão analisando seus indicadores em tempo real."
                    );
                  }}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:text-white hover:bg-purple-500/20"
                >
                  Ver todas
                </button>
              </div>

              {/* 4 Sugestões Interativas */}
              <div className="flex flex-col gap-2 pt-1 border-t border-purple-500/10">
                {[
                  {
                    titulo: "Enviar lembrete de cobrança",
                    subtitulo: "5 cobranças estão em atraso.",
                    detalhe:
                      "Foram detectadas 5 cobranças vencidas totalizando R$ 8.900,00. O Agente Financeiro preparou lembretes gentis e notificações para envio via WhatsApp ou E-mail.",
                  },
                  {
                    titulo: "Identificar oportunidades",
                    subtitulo: "3 contratos podem ser expandidos.",
                    detalhe:
                      "Contratos de Clinica Sorriso Mais, Studio Caiobá e Dra. Julia Lins atingiram 85% do escopo previsto. Uma proposta de upgrade de plano pode gerar R$ 14.200 adicionais neste trimestre.",
                  },
                  {
                    titulo: "Otimizar despesas",
                    subtitulo: "2 despesas acima da média.",
                    detalhe:
                      "Os lançamentos de Meta Ads e ferramentas de software apresentaram oscilação de +15% vs mês anterior. Sugere-se renegociação de plano anual ou consolidação de licenças.",
                  },
                  {
                    titulo: "Prever fluxo de caixa",
                    subtitulo: "Baseado nos contratos e vencimentos.",
                    detalhe:
                      "A projeção financeira para os próximos 30 dias indica saldo positivo consolidado de R$ 74.800,00 caso a taxa de adimplência de 94% se mantenha estável.",
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
      </div>

      {/* =========================================================================
          MODAIS & DIÁLOGOS OPERACIONAIS
         ========================================================================= */}

      {/* Modal 1: Nova Receita */}
      <Dialog open={modalNovaReceitaAberto} onOpenChange={setModalNovaReceitaAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="size-4 text-orange-400" />
              Registrar Nova Receita
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarNovaReceita} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Descrição *</label>
              <input
                type="text"
                required
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Ex: Mensalidade, Consultoria, Projeto avulso..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Cliente / Origem</label>
                <input
                  type="text"
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
                <label className="text-neutral-400 font-medium">Categoria</label>
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value as TransacaoFinanceiraItem["categoria"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="Serviços">Serviços</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Implantação">Implantação</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Status de Pagamento</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as TransacaoFinanceiraItem["status"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="recebido">Recebido</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Data de Vencimento / Entrada</label>
                <input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-300 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Código do Documento</label>
                <input
                  type="text"
                  value={novoDoc}
                  onChange={(e) => setNovoDoc(e.target.value)}
                  placeholder="CT-2026-001 ou NF..."
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

      {/* Modal 2: Detalhes da Transação */}
      <Dialog open={modalDetalheAberto} onOpenChange={setModalDetalheAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <FileText className="size-4 text-orange-400" />
              Detalhes da Transação
            </DialogTitle>
          </DialogHeader>

          {transacaoSelecionada && (
            <div className="flex flex-col gap-3.5 py-2 text-xs">
              <div className="rounded-xl border border-white/5 bg-[#121620] p-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                    Valor da Operação
                  </span>
                  <div className="text-xl font-bold font-mono text-white">
                    {formatBRL(transacaoSelecionada.valor)}
                  </div>
                </div>
                <div>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                      transacaoSelecionada.tipo === "receita"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/15 text-red-400 border-red-500/30"
                    )}
                  >
                    {transacaoSelecionada.tipo === "receita" ? "Receita" : "Despesa"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/60">
                  <span className="text-neutral-500 text-[10px]">Descrição</span>
                  <div className="font-semibold text-white mt-0.5">{transacaoSelecionada.descricao}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/60">
                  <span className="text-neutral-500 text-[10px]">Cliente / Fornecedor</span>
                  <div className="font-semibold text-white mt-0.5">{transacaoSelecionada.clienteFornecedor}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/60">
                  <span className="text-neutral-500 text-[10px]">Categoria</span>
                  <div className="font-semibold text-white mt-0.5">{transacaoSelecionada.categoria}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/60">
                  <span className="text-neutral-500 text-[10px]">Data de Vencimento</span>
                  <div className="font-semibold font-mono text-white mt-0.5">{transacaoSelecionada.data}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/60">
                  <span className="text-neutral-500 text-[10px]">Status Atual</span>
                  <div className="font-semibold text-orange-400 mt-0.5">{transacaoSelecionada.statusRotulo}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/60">
                  <span className="text-neutral-500 text-[10px]">Documento / Contrato</span>
                  <div className="font-semibold font-mono text-white mt-0.5">{transacaoSelecionada.documentoCodigo}</div>
                </div>
              </div>

              <DialogFooter className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalDetalheAberto(false)}
                  className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  Fechar
                </button>
                {transacaoSelecionada.status !== "recebido" && transacaoSelecionada.status !== "pago" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMarcarComoPago(transacaoSelecionada);
                      setModalDetalheAberto(false);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Confirmar Pagamento</span>
                  </button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 3: Ver Contas Bancárias */}
      <Dialog open={modalVerContasAberto} onOpenChange={setModalVerContasAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Landmark className="size-4 text-cyan-400" />
              Contas Bancárias e Saldos
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-cyan-300 font-semibold uppercase">Saldo Consolidado</span>
                <div className="text-xl font-bold font-mono text-white">R$ 36.750,00</div>
              </div>
              <span className="text-[11px] text-neutral-400">3 contas ativas</span>
            </div>

            <div className="flex flex-col gap-2">
              {contasBancarias.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#121620]"
                >
                  <div>
                    <div className="font-semibold text-white">{c.nome}</div>
                    <div className="text-[10px] text-neutral-400 capitalize">{c.tipo}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white">{formatBRL(c.saldo)}</div>
                    <div className="text-[10px] text-emerald-400">Ativa</div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalVerContasAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Concluir
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Cobranças em Aberto */}
      <Dialog open={modalCobrancasAberto} onOpenChange={setModalCobrancasAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <FileText className="size-4 text-orange-400" />
              Cobranças em Aberto
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-orange-300 font-semibold uppercase">Total a Receber</span>
                <div className="text-xl font-bold font-mono text-white">R$ 29.400,00</div>
              </div>
              <span className="text-[11px] text-neutral-400">17 cobranças</span>
            </div>

            <div className="flex flex-col gap-2">
              {COBRANCAS_RESUMO_INICIAIS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#121620]"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", item.cor)} />
                    <span className="font-medium text-white">{item.etapa}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white">{formatBRL(item.valorTotal)}</div>
                    <div className="text-[10px] text-neutral-400">{item.quantidade} faturas</div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalCobrancasAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Próximos Vencimentos */}
      <Dialog open={modalVencimentosAberto} onOpenChange={setModalVencimentosAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Calendar className="size-4 text-orange-400" />
              Todos os Próximos Vencimentos
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 py-2 text-xs">
            {PROXIMOS_VENCIMENTOS_INICIAIS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#121620]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400">
                    {item.avatarLetra}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{item.clienteNome}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{item.contratoCodigo}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-white">{formatBRL(item.valor)}</div>
                  <div className="text-[10px] text-red-400 font-mono">{item.vencimento}</div>
                </div>
              </div>
            ))}

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalVencimentosAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 6: Sugestão de IA */}
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
                  Diagnóstico Financeiro
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
                  Nenhuma cobrança ou movimentação é realizada sem sua confirmação.
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
                    toast.success("Ação encaminhada para revisão do gestor financeiro.");
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
