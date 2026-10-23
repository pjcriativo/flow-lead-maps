// Fase 2 / Redesign Premium — Tela 04: Cobranças (Gestão → Financeiro → Cobranças)
// Fiel ao layout visual final aprovado com máxima fidelidade visual:
// Breadcrumbs, Seletor de Período, Seis KPIs, Três Gráficos Analíticos em SVG,
// Abas com contadores dinâmicos, Filtros rápidos e avançados, Tabela paginada,
// Painel lateral da cobrança selecionada com abas (Visão Geral, Parcelas, Histórico, Contrato),
// Cobranças Relacionadas, Sugestões de IA e Modais operacionais.

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
  Bell,
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
  Layers,
  LayoutGrid,
  List,
  Mail,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import {
  COBRANCAS_CATALOGO_INICIAL,
  type CobrancaItem,
  type StatusCobranca,
} from "./cobrancas-data";
import type { TelaFinanceiroId } from "./FinanceiroSidebarNav";

interface CobrancasViewProps {
  onMudarTela: (tela: TelaFinanceiroId) => void;
}

export function CobrancasView({ onMudarTela }: CobrancasViewProps) {
  // Lista de Cobranças
  const [cobrancas, setCobrancas] = useState<CobrancaItem[]>(COBRANCAS_CATALOGO_INICIAL);
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<CobrancaItem>(
    COBRANCAS_CATALOGO_INICIAL[0]
  );
  const [abaPainelLateral, setAbaPainelLateral] = useState<
    "visao_geral" | "parcelas" | "historico" | "contrato"
  >("visao_geral");

  // Filtros de cabeçalho
  const [periodoFiltro, setPeriodoFiltro] = useState("01/10/2026 - 31/10/2026");
  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);

  // Abas superiores de cobranças
  type AbaCobranca = "todas" | "pendentes" | "em_atraso" | "recebidas" | "negociacao" | "canceladas";
  const [abaAtiva, setAbaAtiva] = useState<AbaCobranca>("todas");

  // Filtros de busca
  const [busca, setBusca] = useState("");
  const [filtroCliente, setFiltroCliente] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [filtroOrigem, setFiltroOrigem] = useState<string>("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [visualizacao, setVisualizacao] = useState<"lista" | "cards">("lista");
  const [filtrosAvancadosAberto, setFiltrosAvancadosAberto] = useState(false);

  // Seleção múltipla
  const [itensSelecionados, setItensSelecionados] = useState<string[]>(["cob-1"]);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Modais
  const [modalNovaCobrancaAberto, setModalNovaCobrancaAberto] = useState(false);
  const [modalRegistrarRecebimentoAberto, setModalRegistrarRecebimentoAberto] = useState(false);
  const [modalLembreteAberto, setModalLembreteAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [iaSugestaoSelecionada, setIaSugestaoSelecionada] = useState<{
    titulo: string;
    subtitulo: string;
    detalhe: string;
  } | null>(null);

  // Formulário Nova Cobrança
  const [novaCliente, setNovaCliente] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaValor, setNovaValor] = useState("");
  const [novaVencimento, setNovaVencimento] = useState("");
  const [novaOrigem, setNovaOrigem] = useState<"Contrato" | "Proposta" | "Avulso">("Contrato");
  const [novaForma, setNovaForma] = useState<"PIX" | "Boleto" | "Cartão" | "Transferência">("PIX");
  const [novaContrato, setNovaContrato] = useState("");

  // Formulário Registrar Recebimento
  const [recValorPago, setRecValorPago] = useState("");
  const [recDataPagamento, setRecDataPagamento] = useState("23/10/2026");
  const [recForma, setRecForma] = useState("PIX");
  const [recConta, setRecConta] = useState("Banco Inter (Principal)");

  // Formulário Enviar Lembrete
  const [lembreteCanal, setLembreteCanal] = useState<"whatsapp" | "email">("whatsapp");
  const [lembreteTexto, setLembreteTexto] = useState(
    `Olá, informamos que sua fatura no valor de R$ 4.900,00 vence em 01/10/2026. Chave PIX: financeiro@flowgenius.com.br`
  );

  // Contadores dinâmicos para as abas
  const contadores = useMemo(() => {
    return {
      todas: cobrancas.length,
      pendentes: cobrancas.filter((c) => c.status === "pendente").length,
      em_atraso: cobrancas.filter((c) => c.status === "em_atraso").length,
      recebidas: cobrancas.filter((c) => c.status === "pago").length,
      negociacao: cobrancas.filter((c) => c.status === "negociacao").length,
      canceladas: cobrancas.filter((c) => c.status === "cancelado").length,
    };
  }, [cobrancas]);

  // Lista de clientes únicos para o dropdown
  const listaClientes = useMemo(() => {
    const set = new Set<string>();
    cobrancas.forEach((c) => set.add(c.cliente));
    return Array.from(set).sort();
  }, [cobrancas]);

  // Filtragem
  const cobrancasFiltradas = useMemo(() => {
    return cobrancas.filter((c) => {
      // Aba
      if (abaAtiva === "pendentes" && c.status !== "pendente") return false;
      if (abaAtiva === "em_atraso" && c.status !== "em_atraso") return false;
      if (abaAtiva === "recebidas" && c.status !== "pago") return false;
      if (abaAtiva === "negociacao" && c.status !== "negociacao") return false;
      if (abaAtiva === "canceladas" && c.status !== "cancelado") return false;

      // Busca texto
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const match =
          c.cliente.toLowerCase().includes(termo) ||
          c.descricao.toLowerCase().includes(termo) ||
          c.contrato.toLowerCase().includes(termo);
        if (!match) return false;
      }

      // Filtro Cliente
      if (filtroCliente !== "all" && c.cliente !== filtroCliente) return false;

      // Filtro Status
      if (filtroStatus !== "all" && c.status !== filtroStatus) return false;

      // Filtro Origem
      if (filtroOrigem !== "all" && c.origem !== filtroOrigem) return false;

      return true;
    });
  }, [cobrancas, abaAtiva, busca, filtroCliente, filtroStatus, filtroOrigem]);

  // Paginação
  const totalPaginas = Math.ceil(cobrancasFiltradas.length / itensPorPagina) || 1;
  const cobrancasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return cobrancasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [cobrancasFiltradas, paginaAtual, itensPorPagina]);

  const toggleSelecionarTudo = () => {
    if (itensSelecionados.length === cobrancasPaginadas.length) {
      setItensSelecionados([]);
    } else {
      setItensSelecionados(cobrancasPaginadas.map((c) => c.id));
    }
  };

  const toggleItem = (id: string) => {
    setItensSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selecionarCobranca = (cob: CobrancaItem) => {
    setCobrancaSelecionada(cob);
  };

  const handleSalvarNovaCobranca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCliente || !novaDescricao || !novaValor) {
      toast.error("Preencha cliente, descrição e valor.");
      return;
    }
    const val = parseFloat(novaValor.replace(/\./g, "").replace(",", ".")) || 1000;
    const novoItem: CobrancaItem = {
      id: `cob-${Date.now()}`,
      vencimento: novaVencimento || "30/10/2026",
      cliente: novaCliente,
      clienteSegmento: "Cliente Corporativo • Brasil",
      clienteLogoLetra: novaCliente.slice(0, 2).toUpperCase(),
      clienteLogoBg: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
      descricao: novaDescricao,
      subtituloContrato: `${novaContrato || "CT-2026-NOVO"} - Cobrança`,
      valor: val,
      valorOriginal: val,
      valorPendente: val,
      dataEmissao: "23/10/2026",
      status: "pendente",
      statusRotulo: "Pendente",
      dias: 7,
      diasTexto: `${novaVencimento || "30/10/2026"} (7 dias)`,
      origem: novaOrigem,
      contrato: novaContrato || "CT-2026-NOVO",
      formaPagamento: novaForma,
      categoria: "Serviços",
      responsavelNome: "Marcos Gonçalves",
      cobrancasRelacionadas: [],
      parcelas: [],
      historico: [
        {
          data: "23/10/2026",
          hora: "18:00",
          evento: "Cobrança cadastrada com sucesso",
          tipo: "criado",
        },
      ],
    };
    setCobrancas((prev) => [novoItem, ...prev]);
    setCobrancaSelecionada(novoItem);
    toast.success("Nova cobrança cadastrada com sucesso!");
    setModalNovaCobrancaAberto(false);
    setNovaCliente("");
    setNovaDescricao("");
    setNovaValor("");
    setNovaVencimento("");
  };

  const handleConfirmarRecebimento = (e: React.FormEvent) => {
    e.preventDefault();
    const valPago = parseFloat(recValorPago.replace(/\./g, "").replace(",", ".")) || cobrancaSelecionada.valor;
    setCobrancas((prev) =>
      prev.map((c) =>
        c.id === cobrancaSelecionada.id
          ? {
              ...c,
              status: "pago",
              statusRotulo: "Pago",
              valorPendente: Math.max(0, c.valorPendente - valPago),
              dias: 0,
              diasTexto: `Quitado em ${recDataPagamento}`,
              historico: [
                {
                  data: recDataPagamento,
                  hora: "10:30",
                  evento: `Pagamento de ${formatBRL(valPago)} recebido via ${recForma}`,
                  tipo: "pagamento",
                },
                ...c.historico,
              ],
            }
          : c
      )
    );
    setCobrancaSelecionada((prev) => ({
      ...prev,
      status: "pago",
      statusRotulo: "Pago",
      valorPendente: 0,
      dias: 0,
      diasTexto: `Quitado em ${recDataPagamento}`,
    }));
    toast.success(`Recebimento de ${formatBRL(valPago)} confirmado com sucesso!`);
    setModalRegistrarRecebimentoAberto(false);
  };

  const handleEnviarLembrete = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Lembrete preparado com sucesso para envio via ${lembreteCanal.toUpperCase()}!`);
    setModalLembreteAberto(false);
  };

  return (
    <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 flex flex-col gap-5 overflow-x-hidden">
      {/* =========================================================================
          1. CABEÇALHO & BREADCRUMB
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
              <Receipt className="size-3.5 text-orange-400" />
              Cobranças
            </span>
          </div>

          {/* Título e Subtítulo */}
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <Receipt className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Cobranças
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Acompanhe suas contas a receber, inadimplência e gerencie os recebimentos da sua empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Controles Superiores: Seletor de Período, Exportar & Nova Cobrança */}
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

          {/* Botão Exportar */}
          <button
            type="button"
            onClick={() => setModalExportarAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#0e121a] px-3.5 text-xs font-medium text-neutral-200 transition-all hover:border-white/20 hover:bg-[#141924]"
          >
            <Download className="size-4 text-neutral-400" />
            <span>Exportar</span>
          </button>

          {/* Botão + Nova cobrança */}
          <button
            type="button"
            onClick={() => setModalNovaCobrancaAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Nova cobrança</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. SEIS CARDS DE INDICADORES (KPIs)
         ========================================================================= */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Contas a Receber */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Contas a Receber</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]">
              <Wallet className="size-3.5" />
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

        {/* Card 2: Vencendo em 7 dias */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Vencendo em 7 dias</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#f59e0b]">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 8.400,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-400">
            <span>5 cobranças</span>
          </div>
        </div>

        {/* Card 3: Em Atraso */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Em Atraso</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-[#ef4444]">
              <Zap className="size-3.5" />
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

        {/* Card 4: Recebido no período */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Recebido no período</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              R$ 15.600,00
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-blue-400">
            <span>8 cobranças</span>
          </div>
        </div>

        {/* Card 5: Taxa de recebimento */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Taxa de recebimento</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-[#a855f7]">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              62,4%
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+18% este mês</span>
          </div>
        </div>

        {/* Card 6: Prazo médio de recebimento */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Prazo médio de recebimento</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[#06b6d4]">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
              12 dias
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span>+5 dias vs. mês anterior</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CORPO PRINCIPAL: 3 GRÁFICOS ANALÍTICOS, ABAS, TABELA + PAINEL DIREITO
         ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* =======================================================================
            COLUNA ESQUERDA (9 colunas no xl)
           ======================================================================= */}
        <div className="xl:col-span-9 flex flex-col gap-5 min-w-0">
          {/* 3 GRÁFICOS ANALÍTICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Gráfico 1: Evolução das Cobranças (5 colunas) */}
            <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Evolução das Cobranças</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Últimos 6 meses</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* SVG Combo Chart: Barras Verdes (Recebidas), Amarelas (Pendentes), Vermelhas (Em atraso) + Curva Azul (Taxa) */}
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

                  {/* Barras e dados */}
                  {[
                    { mes: "Abr", x: 65, rec: 32, pen: 16, atr: 8, taxaY: 96 },
                    { mes: "Mai", x: 105, rec: 45, pen: 20, atr: 10, taxaY: 88 },
                    { mes: "Jun", x: 145, rec: 58, pen: 24, atr: 12, taxaY: 78 },
                    { mes: "Jul", x: 185, rec: 52, pen: 22, atr: 11, taxaY: 82 },
                    { mes: "Ago", x: 225, rec: 66, pen: 28, atr: 13, taxaY: 72 },
                    { mes: "Set", x: 265, rec: 74, pen: 30, atr: 14, taxaY: 66 },
                    { mes: "Out", x: 305, rec: 85, pen: 35, atr: 16, taxaY: 58 },
                  ].map((b, i) => (
                    <g key={i}>
                      {/* Barra Recebidas (Verde) */}
                      <rect
                        x={b.x - 12}
                        y={120 - b.rec}
                        width="7"
                        height={b.rec}
                        rx="1.5"
                        fill="#10b981"
                        className="transition-all hover:opacity-80"
                      />
                      {/* Barra Pendentes (Amarela) */}
                      <rect
                        x={b.x - 4}
                        y={120 - b.pen}
                        width="7"
                        height={b.pen}
                        rx="1.5"
                        fill="#f59e0b"
                        className="transition-all hover:opacity-80"
                      />
                      {/* Barra Em Atraso (Vermelha) */}
                      <rect
                        x={b.x + 4}
                        y={120 - b.atr}
                        width="7"
                        height={b.atr}
                        rx="1.5"
                        fill="#ef4444"
                        className="transition-all hover:opacity-80"
                      />
                      {/* Rótulo do Eixo X */}
                      <text
                        x={b.x}
                        y="132"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                      >
                        {b.mes}
                      </text>
                    </g>
                  ))}

                  {/* Linha da Taxa de Recebimento (Azul) */}
                  <path
                    d="M 65 96 L 105 88 L 145 78 L 185 82 L 225 72 L 265 66 L 305 58"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Pontos na linha */}
                  {[
                    { cx: 65, cy: 96 },
                    { cx: 105, cy: 88 },
                    { cx: 145, cy: 78 },
                    { cx: 185, cy: 82 },
                    { cx: 225, cy: 72 },
                    { cx: 265, cy: 66 },
                    { cx: 305, cy: 58 },
                  ].map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.cx}
                      cy={pt.cy}
                      r="3.5"
                      fill="#3b82f6"
                      stroke="#0c1017"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
              </div>

              {/* Legenda do Gráfico */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-white/5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#10b981]" />
                  <span className="text-neutral-400">Recebidas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#f59e0b]" />
                  <span className="text-neutral-400">Pendentes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ef4444]" />
                  <span className="text-neutral-400">Em atraso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-neutral-400">Taxa de recebimento</span>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Status das Cobranças (3.5 colunas) */}
            <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Status das Cobranças</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Este mês</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* Donut SVG: 24 Total */}
              <div className="flex items-center justify-center py-2">
                <div className="relative size-32">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="14" />
                    {/* Recebidas 33% (8) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="14" strokeDasharray="78.8 238.7" strokeDashoffset="0" />
                    {/* Pendentes 25% (6) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="14" strokeDasharray="59.7 238.7" strokeDashoffset="-78.8" />
                    {/* Em atraso 21% (5) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="14" strokeDasharray="50.1 238.7" strokeDashoffset="-138.5" />
                    {/* Canceladas 8% (2) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ec4899" strokeWidth="14" strokeDasharray="19.1 238.7" strokeDashoffset="-188.6" />
                    {/* Negociação 8% (2) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="14" strokeDasharray="19.1 238.7" strokeDashoffset="-207.7" />
                    {/* Outros 5% (1) */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#64748b" strokeWidth="14" strokeDasharray="11.9 238.7" strokeDashoffset="-226.8" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-white font-mono">24</span>
                    <span className="text-[10px] text-neutral-400 font-medium">Total</span>
                  </div>
                </div>
              </div>

              {/* Legenda lateral/abaixo */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 border-t border-white/5 text-[10px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#10b981]" />
                    <span className="text-neutral-300">Recebidas</span>
                  </div>
                  <span className="font-mono text-neutral-400">8 &nbsp;33%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-neutral-300">Pendentes</span>
                  </div>
                  <span className="font-mono text-neutral-400">6 &nbsp;25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#ef4444]" />
                    <span className="text-neutral-300">Em atraso</span>
                  </div>
                  <span className="font-mono text-neutral-400">5 &nbsp;21%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#ec4899]" />
                    <span className="text-neutral-300">Canceladas</span>
                  </div>
                  <span className="font-mono text-neutral-400">2 &nbsp;8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#3b82f6]" />
                    <span className="text-neutral-300">Negociação</span>
                  </div>
                  <span className="font-mono text-neutral-400">2 &nbsp;8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#64748b]" />
                    <span className="text-neutral-300">Outros</span>
                  </div>
                  <span className="font-mono text-neutral-400">1 &nbsp;5%</span>
                </div>
              </div>
            </div>

            {/* Gráfico 3: Cobranças por Cliente (3.5 colunas) */}
            <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h3 className="text-xs font-bold text-white tracking-wide">Cobranças por Cliente</h3>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-[#121620] px-2 py-0.5 rounded-lg border border-white/5">
                  <span>Este mês</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* Donut SVG: R$ 24.5K Total */}
              <div className="flex items-center justify-center py-2">
                <div className="relative size-32">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="14" />
                    {/* Clínica Sorriso Mais 28% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06b6d4" strokeWidth="14" strokeDasharray="66.8 238.7" strokeDashoffset="0" />
                    {/* Studio Caiobá 18% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#a855f7" strokeWidth="14" strokeDasharray="43.0 238.7" strokeDashoffset="-66.8" />
                    {/* Meta Platforms 15% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="14" strokeDasharray="35.8 238.7" strokeDashoffset="-109.8" />
                    {/* Parelheiros Advocacia 12% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="14" strokeDasharray="28.6 238.7" strokeDashoffset="-145.6" />
                    {/* Dra. Julia Lins 10% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f43f5e" strokeWidth="14" strokeDasharray="23.9 238.7" strokeDashoffset="-174.2" />
                    {/* Outros 17% */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#64748b" strokeWidth="14" strokeDasharray="40.6 238.7" strokeDashoffset="-198.1" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-extrabold text-white font-mono">R$ 24.5K</span>
                    <span className="text-[10px] text-neutral-400 font-medium">Total</span>
                  </div>
                </div>
              </div>

              {/* Legenda lateral/abaixo */}
              <div className="flex flex-col gap-1 pt-2 border-t border-white/5 text-[10px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#06b6d4]" />
                    <span className="text-neutral-300 truncate max-w-[120px]">Clínica Sorriso Mais</span>
                  </div>
                  <span className="font-mono text-neutral-400">28%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#a855f7]" />
                    <span className="text-neutral-300 truncate max-w-[120px]">Studio Caiobá</span>
                  </div>
                  <span className="font-mono text-neutral-400">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#3b82f6]" />
                    <span className="text-neutral-300 truncate max-w-[120px]">Meta Platforms</span>
                  </div>
                  <span className="font-mono text-neutral-400">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#10b981]" />
                    <span className="text-neutral-300 truncate max-w-[120px]">Parelheiros Advocacia</span>
                  </div>
                  <span className="font-mono text-neutral-400">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#f43f5e]" />
                    <span className="text-neutral-300 truncate max-w-[120px]">Dra. Julia Lins</span>
                  </div>
                  <span className="font-mono text-neutral-400">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#64748b]" />
                    <span className="text-neutral-300">Outros</span>
                  </div>
                  <span className="font-mono text-neutral-400">17%</span>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              ABAS DE ACOMPANHAMENTO COM BADGES
             ===================================================================== */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Aba 1: Todas as Cobranças */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva("todas");
                setPaginaAtual(1);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                abaAtiva === "todas"
                  ? "bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-md shadow-orange-600/20"
                  : "bg-[#0c1017] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              )}
            >
              <Receipt className="size-3.5" />
              <span>Todas as Cobranças ({contadores.todas})</span>
            </button>

            {/* Aba 2: Pendentes */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva("pendentes");
                setPaginaAtual(1);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                abaAtiva === "pendentes"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-[#0c1017] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              )}
            >
              <Clock className="size-3.5 text-amber-400" />
              <span>Pendentes ({contadores.pendentes})</span>
            </button>

            {/* Aba 3: Em Atraso */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva("em_atraso");
                setPaginaAtual(1);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                abaAtiva === "em_atraso"
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-[#0c1017] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              )}
            >
              <AlertCircle className="size-3.5 text-red-400" />
              <span>Em Atraso ({contadores.em_atraso})</span>
            </button>

            {/* Aba 4: Recebidas */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva("recebidas");
                setPaginaAtual(1);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                abaAtiva === "recebidas"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-[#0c1017] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              )}
            >
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Recebidas ({contadores.recebidas})</span>
            </button>

            {/* Aba 5: Em Negociação */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva("negociacao");
                setPaginaAtual(1);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                abaAtiva === "negociacao"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : "bg-[#0c1017] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              )}
            >
              <MessageSquare className="size-3.5 text-blue-400" />
              <span>Em Negociação ({contadores.negociacao})</span>
            </button>

            {/* Aba 6: Canceladas */}
            <button
              type="button"
              onClick={() => {
                setAbaAtiva("canceladas");
                setPaginaAtual(1);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                abaAtiva === "canceladas"
                  ? "bg-neutral-800 text-neutral-300 border border-white/20"
                  : "bg-[#0c1017] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              )}
            >
              <X className="size-3.5 text-neutral-400" />
              <span>Canceladas ({contadores.canceladas})</span>
            </button>
          </div>

          {/* =====================================================================
              BARRA DE BUSCA E FILTROS RÁPIDOS
             ===================================================================== */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            {/* Input de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar por cliente, número ou descrição..."
                className="w-full h-10 rounded-xl border border-white/10 bg-[#0c1017] pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Select Cliente */}
            <select
              value={filtroCliente}
              onChange={(e) => {
                setFiltroCliente(e.target.value);
                setPaginaAtual(1);
              }}
              className="h-10 rounded-xl border border-white/10 bg-[#0c1017] px-3 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
            >
              <option value="all">Todos os clientes</option>
              {listaClientes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Select Status */}
            <select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setPaginaAtual(1);
              }}
              className="h-10 rounded-xl border border-white/10 bg-[#0c1017] px-3 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_atraso">Em atraso</option>
              <option value="pago">Pago</option>
              <option value="negociacao">Negociação</option>
              <option value="cancelado">Cancelada</option>
            </select>

            {/* Select Origem */}
            <select
              value={filtroOrigem}
              onChange={(e) => {
                setFiltroOrigem(e.target.value);
                setPaginaAtual(1);
              }}
              className="h-10 rounded-xl border border-white/10 bg-[#0c1017] px-3 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
            >
              <option value="all">Todas as origens</option>
              <option value="Contrato">Contrato</option>
              <option value="Proposta">Proposta</option>
              <option value="Avulso">Avulso</option>
            </select>

            {/* Intervalo de Datas */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Data inicial"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-10 w-28 rounded-xl border border-white/10 bg-[#0c1017] px-3 text-xs text-neutral-300 placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Data final"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-10 w-28 rounded-xl border border-white/10 bg-[#0c1017] px-3 text-xs text-neutral-300 placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Botão Filtros Avançados */}
            <button
              type="button"
              onClick={() => setFiltrosAvancadosAberto((prev) => !prev)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all",
                filtrosAvancadosAberto
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                  : "border-white/10 bg-[#0c1017] text-neutral-300 hover:border-white/20 hover:bg-[#121620]"
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Filtros</span>
            </button>

            {/* Alternância Tabela/Cards */}
            <div className="flex items-center rounded-xl border border-orange-500/40 bg-[#0c1017] p-0.5 text-orange-400">
              <button
                type="button"
                onClick={() => setVisualizacao("lista")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition-all",
                  visualizacao === "lista" ? "bg-orange-500/20 text-orange-400" : "text-neutral-500 hover:text-white"
                )}
                title="Visualização em Lista"
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setVisualizacao("cards")}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition-all",
                  visualizacao === "cards" ? "bg-orange-500/20 text-orange-400" : "text-neutral-500 hover:text-white"
                )}
                title="Visualização em Cards"
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          </div>

          {/* Gaveta de Filtros Avançados */}
          {filtrosAvancadosAberto && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl border border-white/10 bg-[#0c1017]">
              <div>
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Faixa de Valor
                </label>
                <select className="mt-1 w-full h-8 rounded-lg border border-white/10 bg-[#121620] px-2 text-xs text-neutral-200">
                  <option value="all">Todos os valores</option>
                  <option value="ate-2k">Até R$ 2.000</option>
                  <option value="2k-5k">R$ 2.000 a R$ 5.000</option>
                  <option value="5k-10k">R$ 5.000 a R$ 10.000</option>
                  <option value="acima-10k">Acima de R$ 10.000</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Forma de Pagamento
                </label>
                <select className="mt-1 w-full h-8 rounded-lg border border-white/10 bg-[#121620] px-2 text-xs text-neutral-200">
                  <option value="all">Todas as formas</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Cartão">Cartão de Crédito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Dias de Vencimento
                </label>
                <select className="mt-1 w-full h-8 rounded-lg border border-white/10 bg-[#121620] px-2 text-xs text-neutral-200">
                  <option value="all">Qualquer prazo</option>
                  <option value="vencidas">Já vencidas</option>
                  <option value="hoje">Vence hoje</option>
                  <option value="7dias">Próximos 7 dias</option>
                  <option value="15dias">Próximos 15 dias</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Responsável
                </label>
                <select className="mt-1 w-full h-8 rounded-lg border border-white/10 bg-[#121620] px-2 text-xs text-neutral-200">
                  <option value="all">Todos os responsáveis</option>
                  <option value="marcos">Marcos Gonçalves</option>
                  <option value="financeiro">Equipe Financeira</option>
                </select>
              </div>
            </div>
          )}

          {/* =====================================================================
              TABELA DE COBRANÇAS COM SELEÇÃO & DESTAQUE
             ===================================================================== */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0e121a]/60 text-[11px] font-semibold text-neutral-400">
                    <th className="py-3 px-3.5 w-8">
                      <input
                        type="checkbox"
                        checked={
                          itensSelecionados.length > 0 &&
                          itensSelecionados.length === cobrancasPaginadas.length
                        }
                        onChange={toggleSelecionarTudo}
                        className="rounded border-white/20 bg-transparent text-orange-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Vencimento</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Descrição</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Dias</th>
                    <th className="py-3 px-3">Origem</th>
                    <th className="py-3 px-3">Contrato</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cobrancasPaginadas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-neutral-500">
                        Nenhuma cobrança encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    cobrancasPaginadas.map((cob) => {
                      const isSelected = cobrancaSelecionada?.id === cob.id;
                      const isChecked = itensSelecionados.includes(cob.id);

                      return (
                        <tr
                          key={cob.id}
                          onClick={() => selecionarCobranca(cob)}
                          className={cn(
                            "cursor-pointer transition-colors group",
                            isSelected
                              ? "bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-transparent border-l-2 border-orange-500"
                              : "hover:bg-white/[0.02]"
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItem(cob.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleItem(cob.id)}
                              className="rounded border-white/20 bg-transparent text-orange-500 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Vencimento */}
                          <td className="py-3 px-3 font-mono text-neutral-300 whitespace-nowrap">
                            {cob.vencimento}
                          </td>

                          {/* Cliente */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                                  cob.clienteLogoBg
                                )}
                              >
                                {cob.clienteLogoLetra}
                              </div>
                              <span className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                                {cob.cliente}
                              </span>
                            </div>
                          </td>

                          {/* Descrição */}
                          <td className="py-3 px-3 text-neutral-300 max-w-[200px] truncate">
                            {cob.descricao}
                          </td>

                          {/* Valor */}
                          <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {formatBRL(cob.valor)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {cob.status === "pago" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="size-1.5 rounded-full bg-emerald-400" />
                                Pago
                              </span>
                            )}
                            {cob.status === "pendente" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="size-1.5 rounded-full bg-amber-400" />
                                Pendente
                              </span>
                            )}
                            {cob.status === "em_atraso" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <span className="size-1.5 rounded-full bg-red-400" />
                                Em atraso
                              </span>
                            )}
                            {cob.status === "negociacao" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <span className="size-1.5 rounded-full bg-blue-400" />
                                Negociação
                              </span>
                            )}
                            {cob.status === "cancelado" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                                <span className="size-1.5 rounded-full bg-neutral-400" />
                                Cancelada
                              </span>
                            )}
                          </td>

                          {/* Dias */}
                          <td className="py-3 px-3 font-mono text-neutral-400 whitespace-nowrap">
                            {cob.dias}
                          </td>

                          {/* Origem */}
                          <td className="py-3 px-3 text-neutral-300 whitespace-nowrap">
                            {cob.origem}
                          </td>

                          {/* Contrato */}
                          <td className="py-3 px-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                            {cob.contrato}
                          </td>

                          {/* Ações */}
                          <td
                            className="py-3 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCobrancaSelecionada(cob);
                                  setModalDetalhesAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
                                title="Visualizar Cobrança"
                              >
                                <Eye className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCobrancaSelecionada(cob);
                                  setModalLembreteAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-orange-400 transition-colors"
                                title="Enviar Lembrete"
                              >
                                <Send className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCobrancaSelecionada(cob);
                                  setModalRegistrarRecebimentoAberto(true);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-emerald-400 transition-colors"
                                title="Registrar Recebimento"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  toast.info(`Ações adicionais para ${cob.descricao}`);
                                }}
                                className="flex size-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
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

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-white/5 bg-[#0e121a]/40 text-xs text-neutral-400">
              {/* Botões de Página */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#0c1017] text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-3.5" />
                </button>

                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPaginaAtual(num)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                      paginaAtual === num
                        ? "bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-sm"
                        : "border border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white"
                    )}
                  >
                    {num}
                  </button>
                ))}

                <span className="text-neutral-600 px-1">...</span>

                <button
                  type="button"
                  onClick={() => setPaginaAtual(9)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                    paginaAtual === 9
                      ? "bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-sm"
                      : "border border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white"
                  )}
                >
                  9
                </button>

                <button
                  type="button"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#0c1017] text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>

              {/* Seletor por página e contador */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <select
                    defaultValue="10"
                    className="h-7 rounded-lg border border-white/10 bg-[#0c1017] px-2 text-xs text-neutral-300 focus:outline-none"
                  >
                    <option value="10">10 por página</option>
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                  </select>
                </div>

                <span className="text-xs text-neutral-400">
                  Mostrando 1 - {Math.min(itensPorPagina, cobrancasFiltradas.length)} de{" "}
                  {cobrancasFiltradas.length} cobranças
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA DIREITA (3 colunas no xl) — PAINEL DA COBRANÇA SELECIONADA
           ======================================================================= */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Card 1: Cobrança Selecionada */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col gap-4 shadow-sm">
            {/* Cabeçalho do Cliente */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-xs font-bold shrink-0",
                    cobrancaSelecionada.clienteLogoBg
                  )}
                >
                  {cobrancaSelecionada.clienteLogoLetra}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {cobrancaSelecionada.cliente}
                  </h4>
                  <p className="text-[11px] text-neutral-400">{cobrancaSelecionada.clienteSegmento}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="size-1 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>

            {/* Subtítulo da Fatura */}
            <div className="rounded-xl border border-white/5 bg-[#0e121a] p-2.5 flex flex-col gap-0.5">
              <span className="text-xs font-bold text-white">{cobrancaSelecionada.descricao}</span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {cobrancaSelecionada.subtituloContrato}
              </span>
            </div>

            {/* Abas do Painel */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-1 text-xs">
              <button
                type="button"
                onClick={() => setAbaPainelLateral("visao_geral")}
                className={cn(
                  "pb-1 font-semibold transition-colors relative",
                  abaPainelLateral === "visao_geral"
                    ? "text-orange-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-400"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Visão Geral
              </button>
              <button
                type="button"
                onClick={() => setAbaPainelLateral("parcelas")}
                className={cn(
                  "pb-1 font-semibold transition-colors relative",
                  abaPainelLateral === "parcelas"
                    ? "text-orange-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-400"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Parcelas ({cobrancaSelecionada.parcelas.length || 12})
              </button>
              <button
                type="button"
                onClick={() => setAbaPainelLateral("historico")}
                className={cn(
                  "pb-1 font-semibold transition-colors relative",
                  abaPainelLateral === "historico"
                    ? "text-orange-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-400"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setAbaPainelLateral("contrato")}
                className={cn(
                  "pb-1 font-semibold transition-colors relative",
                  abaPainelLateral === "contrato"
                    ? "text-orange-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-400"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Contrato
              </button>
            </div>

            {/* Conteúdo Aba Visão Geral */}
            {abaPainelLateral === "visao_geral" && (
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500">Valor da cobrança</span>
                  <p className="mt-0.5 font-mono text-sm font-bold text-white">
                    {formatBRL(cobrancaSelecionada.valor)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Valor original</span>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-neutral-300">
                    {formatBRL(cobrancaSelecionada.valorOriginal)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Data de emissão</span>
                  <p className="mt-0.5 text-neutral-300">{cobrancaSelecionada.dataEmissao}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Vencimento</span>
                  <p className="mt-0.5 font-medium text-red-400">{cobrancaSelecionada.diasTexto}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Status</span>
                  <div className="mt-0.5">
                    {cobrancaSelecionada.status === "pago" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="size-1 rounded-full bg-emerald-400" />
                        Pago
                      </span>
                    )}
                    {cobrancaSelecionada.status === "pendente" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="size-1 rounded-full bg-amber-400" />
                        Pendente
                      </span>
                    )}
                    {cobrancaSelecionada.status === "em_atraso" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <span className="size-1 rounded-full bg-red-400" />
                        Em atraso
                      </span>
                    )}
                    {cobrancaSelecionada.status === "negociacao" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span className="size-1 rounded-full bg-blue-400" />
                        Negociação
                      </span>
                    )}
                    {cobrancaSelecionada.status === "cancelado" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                        <span className="size-1 rounded-full bg-neutral-400" />
                        Cancelada
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Forma de pagamento</span>
                  <p className="mt-0.5 text-neutral-300 font-semibold">{cobrancaSelecionada.formaPagamento}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Categoria</span>
                  <p className="mt-0.5 text-neutral-300">{cobrancaSelecionada.categoria}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Responsável</span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <div className="size-4 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-[8px] font-bold text-white">
                      M
                    </div>
                    <span className="text-neutral-300 text-[11px] font-medium">
                      {cobrancaSelecionada.responsavelNome}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo Aba Parcelas */}
            {abaPainelLateral === "parcelas" && (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {cobrancaSelecionada.parcelas.length === 0 ? (
                  <p className="text-neutral-500 text-xs py-4 text-center">Nenhuma parcela adicional.</p>
                ) : (
                  cobrancaSelecionada.parcelas.map((parc) => (
                    <div
                      key={parc.numero}
                      className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-[#121620] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">
                          Parcela {parc.numero}/{parc.total}
                        </span>
                        <p className="text-[10px] text-neutral-500">{parc.vencimento}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white">{formatBRL(parc.valor)}</span>
                        <div>
                          {parc.status === "pago" ? (
                            <span className="text-[9px] text-emerald-400 font-semibold">Quitada</span>
                          ) : parc.status === "em_atraso" ? (
                            <span className="text-[9px] text-red-400 font-semibold">Em atraso</span>
                          ) : (
                            <span className="text-[9px] text-amber-400 font-semibold">Pendente</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Conteúdo Aba Histórico */}
            {abaPainelLateral === "historico" && (
              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                {cobrancaSelecionada.historico.length === 0 ? (
                  <p className="text-neutral-500 text-xs py-4 text-center">Sem histórico de eventos.</p>
                ) : (
                  cobrancaSelecionada.historico.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 border-l border-white/10 pl-2">
                      <div className="size-1.5 rounded-full bg-orange-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-neutral-200 text-[11px] leading-snug">{h.evento}</p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {h.data} às {h.hora}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Conteúdo Aba Contrato */}
            {abaPainelLateral === "contrato" && (
              <div className="flex flex-col gap-2 text-xs">
                <div className="rounded-xl border border-white/5 bg-[#121620] p-3">
                  <span className="text-[10px] text-neutral-500">Contrato Vinculado</span>
                  <p className="font-bold text-white mt-0.5">{cobrancaSelecionada.contrato}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Vigência: 12 meses • Renovação automática
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info(`Abrindo contrato ${cobrancaSelecionada.contrato}`)}
                  className="w-full py-2 rounded-xl border border-white/10 bg-[#0e121a] text-xs font-semibold text-neutral-200 hover:text-white hover:bg-white/5"
                >
                  Visualizar Contrato Completo
                </button>
              </div>
            )}

            {/* Botões de Ação do Painel */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              {/* Botão Registrar Recebimento */}
              <button
                type="button"
                onClick={() => setModalRegistrarRecebimentoAberto(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <DollarSign className="size-4 stroke-[2.5]" />
                <span>Registrar recebimento</span>
              </button>

              {/* Botões Secundários: Enviar Lembrete & Mais Ações */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalLembreteAberto(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#0e121a] py-2 text-xs font-semibold text-neutral-200 hover:bg-[#141924] hover:text-white transition-all"
                >
                  <Send className="size-3.5" />
                  <span>Enviar lembrete</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info("Mais opções de gerenciamento")}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0e121a] px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-[#141924] hover:text-white transition-all"
                >
                  <span>Mais ações</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Cobranças Relacionadas */}
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Cobranças relacionadas</h4>
              <button
                type="button"
                onClick={() => toast.info("Exibindo todas as cobranças vinculadas")}
                className="text-[10px] font-semibold text-orange-400 hover:underline"
              >
                Ver todas
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {cobrancaSelecionada.cobrancasRelacionadas.length > 0 ? (
                cobrancaSelecionada.cobrancasRelacionadas.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#0e121a] transition-all hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 font-bold text-[10px]">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">{rel.nome}</span>
                        <p className="text-[10px] font-mono text-neutral-400">{formatBRL(rel.valor)}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Recebido
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#0e121a]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 font-bold text-[10px]">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">Mensalidade setembro</span>
                        <p className="text-[10px] font-mono text-neutral-400">R$ 4.900,00</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Recebido
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#0e121a]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 font-bold text-[10px]">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">Mensalidade agosto</span>
                        <p className="text-[10px] font-mono text-neutral-400">R$ 4.900,00</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Recebido
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#0e121a]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 font-bold text-[10px]">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">Mensalidade julho</span>
                        <p className="text-[10px] font-mono text-neutral-400">R$ 4.900,00</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Recebido
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Sugestões de IA */}
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-[#0c1017] p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Sparkles className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white">Sugestões de IA</h4>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Visualizando todas as sugestões do Agente Financeiro")}
                className="text-[10px] font-semibold text-purple-400 hover:underline"
              >
                Ver todas
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {[
                {
                  titulo: "Enviar lembrete de pagamento",
                  subtitulo: "Cliente está vencendo em 3 dias.",
                  detalhe: "Notificação recomendada via WhatsApp oficial para evitar entrada em inadimplência.",
                  icon: Bell,
                },
                {
                  titulo: "Sugerir antecipação de recebimento",
                  subtitulo: "Ofereça desconto para pagamento imediato.",
                  detalhe: "Proposta de 3% de desconto para liquidação via PIX nas próximas 24 horas.",
                  icon: CircleDollarSign,
                },
                {
                  titulo: "Identificar risco de inadimplência",
                  subtitulo: "2 parcelas em atraso nos últimos 6 meses.",
                  detalhe: "Histórico indica tendência de atraso recorrente na primeira quinzena.",
                  icon: AlertTriangle,
                },
                {
                  titulo: "Propor upgrade de plano",
                  subtitulo: "Cliente com potencial de expansão.",
                  detalhe: "Consumo de suporte e integrações ultrapassou 85% da franquia contratada.",
                  icon: TrendingUp,
                },
              ].map((sug, i) => {
                const IconComponent = sug.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setIaSugestaoSelecionada(sug);
                      setModalIaAberto(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-purple-500/10 bg-[#121620]/80 text-left transition-all hover:border-purple-500/30 hover:bg-purple-950/20 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                        <IconComponent className="size-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {sug.titulo}
                        </span>
                        <p className="text-[10px] text-neutral-400">{sug.subtitulo}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-purple-300 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAIS OPERACIONAIS
         ========================================================================= */}

      {/* Modal 1: Nova Cobrança */}
      <Dialog open={modalNovaCobrancaAberto} onOpenChange={setModalNovaCobrancaAberto}>
        <DialogContent className="max-w-lg border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Receipt className="size-4 text-orange-400" />
              Cadastrar Nova Cobrança
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvarNovaCobranca} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-[11px] font-medium text-neutral-300">Cliente *</label>
              <input
                type="text"
                required
                value={novaCliente}
                onChange={(e) => setNovaCliente(e.target.value)}
                placeholder="Ex: Clínica Sorriso Mais"
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300">Descrição da Cobrança *</label>
              <input
                type="text"
                required
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Ex: Mensalidade outubro - Gestão de tráfego"
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-300">Valor (R$) *</label>
                <input
                  type="text"
                  required
                  value={novaValor}
                  onChange={(e) => setNovaValor(e.target.value)}
                  placeholder="Ex: 4.900,00"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 font-mono text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-300">Vencimento *</label>
                <input
                  type="text"
                  required
                  value={novaVencimento}
                  onChange={(e) => setNovaVencimento(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 font-mono text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-300">Origem</label>
                <select
                  value={novaOrigem}
                  onChange={(e) => setNovaOrigem(e.target.value as any)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-neutral-200 focus:border-orange-500/50 focus:outline-none"
                >
                  <option value="Contrato">Contrato</option>
                  <option value="Proposta">Proposta Comercial</option>
                  <option value="Avulso">Lançamento Avulso</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-300">Forma de Pagamento</label>
                <select
                  value={novaForma}
                  onChange={(e) => setNovaForma(e.target.value as any)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-neutral-200 focus:border-orange-500/50 focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Cartão">Cartão de Crédito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300">Contrato Vinculado (Opcional)</label>
              <input
                type="text"
                value={novaContrato}
                onChange={(e) => setNovaContrato(e.target.value)}
                placeholder="Ex: CT-2026-001"
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 font-mono text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <DialogFooter className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaCobrancaAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110"
              >
                Salvar Cobrança
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
            <div className="rounded-xl border border-white/5 bg-[#121620] p-3 flex flex-col gap-1">
              <span className="text-[10px] text-neutral-500">Cobrança Selecionada</span>
              <p className="font-bold text-white text-sm">{cobrancaSelecionada?.descricao}</p>
              <p className="text-[11px] text-neutral-400">{cobrancaSelecionada?.cliente}</p>
              <div className="mt-1 flex items-center justify-between text-xs pt-1 border-t border-white/5 font-mono">
                <span className="text-neutral-400">Valor em aberto:</span>
                <span className="text-orange-400 font-bold">{formatBRL(cobrancaSelecionada?.valorPendente || 0)}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300">Valor Recebido (R$) *</label>
              <input
                type="text"
                required
                defaultValue={cobrancaSelecionada?.valorPendente.toFixed(2).replace(".", ",")}
                onChange={(e) => setRecValorPago(e.target.value)}
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 font-mono text-xs text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-300">Data do Recebimento</label>
                <input
                  type="text"
                  value={recDataPagamento}
                  onChange={(e) => setRecDataPagamento(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 font-mono text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-300">Forma</label>
                <select
                  value={recForma}
                  onChange={(e) => setRecForma(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Cartão">Cartão de Crédito</option>
                  <option value="Transferência">TED / Transferência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300">Conta Bancária de Destino</label>
              <select
                value={recConta}
                onChange={(e) => setRecConta(e.target.value)}
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-neutral-200 focus:outline-none"
              >
                <option value="Banco Inter (Principal)">Banco Inter - Conta Principal PJ</option>
                <option value="Itaú Empresas">Itaú Unibanco - Operacional</option>
                <option value="Nubank PJ">Nubank PJ</option>
              </select>
            </div>

            <DialogFooter className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setModalRegistrarRecebimentoAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
              >
                Confirmar Recebimento
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Enviar Lembrete */}
      <Dialog open={modalLembreteAberto} onOpenChange={setModalLembreteAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Send className="size-4 text-orange-400" />
              Preparar Lembrete de Cobrança
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEnviarLembrete} className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-white/5 bg-[#121620] p-3 text-xs flex flex-col gap-1">
              <span className="text-[10px] text-neutral-500">Destinatário</span>
              <p className="font-bold text-white">{cobrancaSelecionada?.cliente}</p>
              <p className="text-[11px] text-neutral-400">
                Cobrança: {cobrancaSelecionada?.descricao} ({formatBRL(cobrancaSelecionada?.valor || 0)})
              </p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300">Canal de Envio</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLembreteCanal("whatsapp")}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                    lembreteCanal === "whatsapp"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-[#121620] text-neutral-400 hover:text-white"
                  )}
                >
                  <MessageSquare className="size-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLembreteCanal("email")}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                    lembreteCanal === "email"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-white/10 bg-[#121620] text-neutral-400 hover:text-white"
                  )}
                >
                  <Mail className="size-3.5" />
                  <span>E-mail</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-300">Mensagem</label>
              <textarea
                rows={4}
                value={lembreteTexto}
                onChange={(e) => setLembreteTexto(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#121620] p-3 text-xs text-white leading-relaxed focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="p-2.5 rounded-xl border border-white/5 bg-[#121620]/50 text-[11px] text-neutral-400 flex items-start gap-2">
              <Info className="size-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                Nenhum disparo automático é realizado sem sua confirmação explícita. O lembrete respeita consentimento e frequência controlada.
              </span>
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalLembreteAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:bg-orange-500"
              >
                Preparar Lembrete
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Visualizar Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Eye className="size-4 text-orange-400" />
              Detalhes da Cobrança
            </DialogTitle>
          </DialogHeader>

          {cobrancaSelecionada && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="rounded-xl border border-white/5 bg-[#121620] p-3">
                <span className="text-[10px] text-neutral-500">Descrição</span>
                <p className="font-bold text-white text-sm">{cobrancaSelecionada.descricao}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Cliente: <strong className="text-white">{cobrancaSelecionada.cliente}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-white/5 bg-[#121620]">
                <div>
                  <span className="text-[10px] text-neutral-500">Valor</span>
                  <p className="font-mono text-sm font-bold text-emerald-400">
                    {formatBRL(cobrancaSelecionada.valor)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Vencimento</span>
                  <p className="font-mono text-sm font-semibold text-white">
                    {cobrancaSelecionada.vencimento}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Status</span>
                  <p className="text-xs font-semibold capitalize text-orange-400 mt-0.5">
                    {cobrancaSelecionada.statusRotulo}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500">Forma</span>
                  <p className="text-xs text-white mt-0.5">{cobrancaSelecionada.formaPagamento}</p>
                </div>
              </div>

              <DialogFooter className="mt-2">
                <button
                  type="button"
                  onClick={() => setModalDetalhesAberto(false)}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
                >
                  Fechar
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 5: Exportar */}
      <Dialog open={modalExportarAberto} onOpenChange={setModalExportarAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Download className="size-4 text-orange-400" />
              Exportar Relatório de Cobranças
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-neutral-300 leading-relaxed">
              Deseja exportar as {cobrancasFiltradas.length} cobranças correspondentes ao período{" "}
              <strong className="text-white">{periodoFiltro}</strong>?
            </p>

            <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-[#121620]">
              <div className="flex items-center justify-between text-neutral-300">
                <span>Formato:</span>
                <span className="font-semibold text-white">Planilha Excel (.xlsx) / CSV</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Total de Registros:</span>
                <span className="font-mono font-bold text-orange-400">{cobrancasFiltradas.length}</span>
              </div>
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalExportarAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success("Relatório de cobranças exportado com sucesso!");
                  setModalExportarAberto(false);
                }}
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:bg-orange-500"
              >
                <Download className="size-3.5" />
                <span>Baixar Relatório</span>
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
                  Análise Financeira
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
                  O Agente Financeiro e o CEO de IA atuam sob supervisão e com aprovação expressa do administrador. Nenhuma cobrança ou movimentação é enviada sem sua autorização.
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
