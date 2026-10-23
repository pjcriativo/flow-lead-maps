// Tela 12 — Relatórios & Resultados
// Módulo: Gestão → Agentes & Automações
// Painel Executivo de Business Intelligence comercial coordenado pelo CEO de IA
import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  Award,
  BarChart2,
  BarChart3,
  Bot,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  HelpCircle,
  Instagram,
  Layers,
  Linkedin,
  MapPin,
  MessageSquare,
  MoreVertical,
  Percent,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_EXECUTIVOS_PADRAO,
  DADOS_LINHA_TEMPORAL,
  DESEMPENHO_AGENTES_PADRAO,
  ORIGENS_LEADS_PADRAO,
  RECEITA_VS_INVESTIMENTO_PADRAO,
  FUNIL_VENDAS_PADRAO,
  DISTRIBUICAO_NICHOS_PADRAO,
  REGIOES_LEADS_PADRAO,
  CAMPANHAS_RESULTADOS_PADRAO,
  METAS_PERIODO_PADRAO,
  type IndicadorExecutivo,
  type CampanhaResultado,
  type MetaPeriodo,
} from "./relatorios-data";
import { ExportarRelatorioModal } from "./ExportarRelatorioModal";
import { EditarMetasPeriodoModal } from "./EditarMetasPeriodoModal";
import { MapaRegioesModal } from "./MapaRegioesModal";
import { DetalhesCampanhaModal } from "./DetalhesCampanhaModal";

interface RelatoriosResultadosViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarFluxos?: () => void;
  onNavegarPlanejamento?: () => void;
  onNavegarAgenda?: () => void;
  onNavegarCopiloto?: () => void;
  onNavegarAprovacoes?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

type AbaRelatorio =
  | "visao_geral"
  | "leads"
  | "reunioes"
  | "propostas"
  | "vendas"
  | "agentes"
  | "campanhas"
  | "canais"
  | "funis"
  | "geografico"
  | "comparativo"
  | "exportacoes";

const ABAS_RELATORIOS: { id: AbaRelatorio; rotulo: string }[] = [
  { id: "visao_geral", rotulo: "Visão Geral" },
  { id: "leads", rotulo: "Leads" },
  { id: "reunioes", rotulo: "Reuniões" },
  { id: "propostas", rotulo: "Propostas" },
  { id: "vendas", rotulo: "Vendas" },
  { id: "agentes", rotulo: "Agentes" },
  { id: "campanhas", rotulo: "Campanhas" },
  { id: "canais", rotulo: "Canais" },
  { id: "funis", rotulo: "Funis" },
  { id: "geografico", rotulo: "Geográfico" },
  { id: "comparativo", rotulo: "Comparativo" },
  { id: "exportacoes", rotulo: "Exportações" },
];

export function RelatoriosResultadosView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarEquipe,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarFluxos,
  onNavegarPlanejamento,
  onNavegarAgenda,
  onNavegarCopiloto,
  onNavegarAprovacoes,
}: RelatoriosResultadosViewProps) {
  // Controles de Período
  const [periodoSelecionado, setPeriodoSelecionado] = useState("Este mês");
  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
  const [dataInicioFim, setDataInicioFim] = useState(
    "01 de Outubro de 2026 a 31 de Outubro de 2026"
  );

  // Aba Ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaRelatorio>("visao_geral");

  // Filtros Gráficos
  const [frequenciaLinha, setFrequenciaLinha] = useState<"Diário" | "Semanal" | "Mensal">("Diário");
  const [menuFrequenciaAberto, setMenuFrequenciaAberto] = useState(false);

  const [metricaAgentes, setMetricaAgentes] = useState<
    "Leads" | "Reuniões" | "Propostas" | "Vendas" | "Conversão" | "Receita atribuída"
  >("Leads");
  const [menuMetricaAgenteAberto, setMenuMetricaAgenteAberto] = useState(false);

  const [frequenciaFinanceiro, setFrequenciaFinanceiro] = useState<"Semanal" | "Mensal">("Semanal");
  const [menuFinanceiroAberto, setMenuFinanceiroAberto] = useState(false);

  // Série Ativa no Gráfico de Linhas (Leads, Reuniões, Propostas, Vendas)
  const [seriesVisiveis, setSeriesVisiveis] = useState({
    leads: true,
    reunioes: true,
    propostas: true,
    vendas: true,
  });

  // Hover Tooltip no Gráfico de Linhas
  const [pontoLinhaHover, setPontoLinhaHover] = useState<number | null>(null);

  // Estado das Metas (editável pelo modal)
  const [metasPeriodo, setMetasPeriodo] = useState<MetaPeriodo[]>(METAS_PERIODO_PADRAO);

  // Tabela de Campanhas - Filtro e Busca
  const [buscaCampanha, setBuscaCampanha] = useState("");
  const [filtroStatusCampanha, setFiltroStatusCampanha] = useState<"Todos" | "Ativa" | "Pausada">(
    "Todos"
  );
  const [campanhaSelecionadaDetalhes, setCampanhaSelecionadaDetalhes] =
    useState<CampanhaResultado | null>(null);

  // Modais
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [modalEditarMetasAberto, setModalEditarMetasAberto] = useState(false);
  const [modalMapaAberto, setModalMapaAberto] = useState(false);
  const [avisoAcao, setAvisoAcao] = useState<string | null>(null);

  // Filtragem das Campanhas
  const campanhasFiltradas = useMemo(() => {
    return CAMPANHAS_RESULTADOS_PADRAO.filter((c) => {
      const matchBusca =
        c.nome.toLowerCase().includes(buscaCampanha.toLowerCase()) ||
        c.canal.toLowerCase().includes(buscaCampanha.toLowerCase()) ||
        c.nicho.toLowerCase().includes(buscaCampanha.toLowerCase());
      const matchStatus =
        filtroStatusCampanha === "Todos" ? true : c.status === filtroStatusCampanha;
      return matchBusca && matchStatus;
    });
  }, [buscaCampanha, filtroStatusCampanha]);

  // Ícones dinâmicos dos 8 KPIs
  const renderIconeKpi = (nome: IndicadorExecutivo["iconeNome"]) => {
    switch (nome) {
      case "Target":
        return <Target className="size-5" />;
      case "CalendarCheck":
        return <CalendarCheck className="size-5" />;
      case "FileText":
        return <FileText className="size-5" />;
      case "Award":
        return <Award className="size-5" />;
      case "DollarSign":
        return <DollarSign className="size-5" />;
      case "CreditCard":
        return <CreditCard className="size-5" />;
      case "TrendingUp":
        return <TrendingUp className="size-5" />;
      case "Percent":
        return <Percent className="size-5" />;
      default:
        return <BarChart3 className="size-5" />;
    }
  };

  // Ícone por canal de campanha
  const renderIconeCanal = (canal: CampanhaResultado["iconeCanal"]) => {
    switch (canal) {
      case "MapPin":
        return <MapPin className="size-4" />;
      case "Instagram":
        return <Instagram className="size-4" />;
      case "Linkedin":
        return <Linkedin className="size-4" />;
      case "Target":
        return <Target className="size-4" />;
      case "MessageSquare":
        return <MessageSquare className="size-4" />;
      default:
        return <Target className="size-4" />;
    }
  };

  return (
    <div className="mx-auto max-w-[1720px] px-3.5 pb-16 pt-5 sm:px-6 lg:px-8 space-y-6">
      {/* =========================================================================
          1. CABEÇALHO & BREADCRUMBS (Fiel ao layout aprovado)
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#121620] border border-white/10 text-neutral-300 shadow-md">
            <Users className="size-5 text-neutral-400" />
          </div>
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
            >
              <span>Agentes &amp; Automações</span>
              <ChevronRight className="size-3 text-neutral-600" />
              <span>Perfil</span>
              <ChevronRight className="size-3 text-neutral-600" />
              <span>CEO de IA</span>
              <ChevronRight className="size-3 text-neutral-600" />
              <span className="text-neutral-200">Relatórios &amp; Resultados</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mt-0.5">
              Relatórios &amp; Resultados
            </h1>
            <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
              Acompanhe o desempenho da sua operação comercial com IA.
            </p>
          </div>
        </div>

        {/* Controles de Período e Exportação */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Intervalo de Datas */}
          <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs text-neutral-200 shadow-sm">
            <Calendar className="size-4 text-neutral-400" />
            <span className="font-medium text-neutral-300">{dataInicioFim}</span>
          </div>

          {/* Dropdown de Período */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuPeriodoAberto(!menuPeriodoAberto)}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs font-semibold text-neutral-200 transition-colors hover:border-white/20 hover:bg-[#181e2b]"
            >
              <span>{periodoSelecionado}</span>
              <ChevronDown className="size-3.5 text-neutral-400" />
            </button>

            {menuPeriodoAberto && (
              <div className="absolute right-0 top-12 z-40 w-44 rounded-xl border border-white/10 bg-[#0c1017] p-1.5 shadow-2xl animate-in fade-in zoom-in-95">
                {[
                  "Hoje",
                  "Ontem",
                  "Últimos 7 dias",
                  "Últimos 30 dias",
                  "Este mês",
                  "Mês anterior",
                  "Personalizado",
                ].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriodoSelecionado(p);
                      setMenuPeriodoAberto(false);
                      if (p === "Hoje") {
                        setDataInicioFim("Hoje · 23 de Outubro de 2026");
                      } else if (p === "Últimos 7 dias") {
                        setDataInicioFim("16 de Outubro a 23 de Outubro de 2026");
                      } else if (p === "Mês anterior") {
                        setDataInicioFim("01 de Setembro a 30 de Setembro de 2026");
                      } else {
                        setDataInicioFim("01 de Outubro de 2026 a 31 de Outubro de 2026");
                      }
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left",
                      periodoSelecionado === p
                        ? "bg-orange-500/15 font-semibold text-[#f97316]"
                        : "text-neutral-300 hover:bg-white/5"
                    )}
                  >
                    <span>{p}</span>
                    {periodoSelecionado === p && <Check className="size-3.5 text-[#f97316]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão Exportar Relatório */}
          <button
            type="button"
            onClick={() => setModalExportarAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Download className="size-4" />
            <span>Exportar relatório</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. TOPO: CARD DO CEO DE IA + 8 INDICADORES EXECUTIVOS
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card do CEO de IA (4 colunas) */}
        <div
          className={cn(
            PANEL_CLASS,
            "lg:col-span-4 p-5 flex flex-col justify-between relative overflow-hidden group border-orange-500/20"
          )}
        >
          {/* Badge de Coroa Dourada no Canto Superior Esquerdo */}
          <div className="absolute top-4 left-4 z-10 flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="size-4" />
          </div>

          <div className="flex items-start gap-4 pt-2">
            {/* Foto do CEO */}
            <div className="relative size-20 shrink-0 rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-neutral-900">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"
                alt="CEO de IA"
                className="h-full w-full object-cover object-top"
              />
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">CEO de IA</h2>
                <Crown className="size-4 text-amber-400" />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-300 mt-0.5">
                Orquestrador Geral da Operação Comercial
              </p>
              <p className="text-[11px] text-neutral-400 leading-relaxed mt-2 line-clamp-3">
                Acompanha os resultados da operação, identifica oportunidades de crescimento e otimiza a
                performance da equipe de agentes.
              </p>
            </div>
          </div>

          {/* Tags de Especialidades */}
          <div className="flex flex-wrap items-center gap-1.5 pt-4 mt-3 border-t border-white/5">
            {["Estratégia", "Análise", "Crescimento", "Resultados"].map((esp) => (
              <span
                key={esp}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#121620] text-neutral-300 border border-white/5"
              >
                {esp}
              </span>
            ))}
          </div>
        </div>

        {/* 8 Cards de Indicadores Executivos (8 colunas: Grid de 4x2) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {INDICADORES_EXECUTIVOS_PADRAO.map((ind) => (
            <div
              key={ind.id}
              className={cn(
                PANEL_CLASS,
                "p-3.5 flex flex-col justify-between hover:border-white/20 transition-all group"
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl border ${ind.bgIcone} ${ind.bordaIcone} ${ind.cor}`}
                >
                  {renderIconeKpi(ind.iconeNome)}
                </div>
              </div>

              <div className="mt-2.5">
                <span className="text-[11px] font-medium text-neutral-400 block truncate">
                  {ind.nome}
                </span>
                <span className="text-xl font-bold tracking-tight text-white font-mono block mt-0.5">
                  {ind.valor}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-2 pt-2 border-t border-white/5">
                <TrendingUp className="size-3" />
                <span>{ind.variacao}</span>
                <span className="text-neutral-500 font-normal">{ind.comparacao}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. NAVEGAÇÃO INTERNA POR ABAS (12 Abas)
         ========================================================================= */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ABAS_RELATORIOS.map((tab) => {
          const ativa = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setAbaAtiva(tab.id);
                if (tab.id === "exportacoes") {
                  setModalExportarAberto(true);
                } else if (tab.id === "geografico") {
                  setModalMapaAberto(true);
                }
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                ativa
                  ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-md shadow-orange-600/20"
                  : "bg-[#0c1017] text-neutral-400 border border-white/5 hover:text-white hover:bg-[#121620]"
              )}
            >
              {tab.rotulo}
            </button>
          );
        })}
      </nav>

      {/* =========================================================================
          4. LINHA MÉDIA 1: LEADS E VENDAS | DESEMPENHO AGENTES | ORIGEM DOS LEADS
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gráfico 1: Leads e Vendas (Linhas) - 5 colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-5 p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Leads e Vendas</h3>
              {/* Legendas das Séries */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    setSeriesVisiveis((p) => ({ ...p, leads: !p.leads }))
                  }
                  className={cn(
                    "flex items-center gap-1.5 transition-opacity",
                    seriesVisiveis.leads ? "opacity-100" : "opacity-30 line-through"
                  )}
                >
                  <span className="size-2 rounded-full bg-[#06b6d4]" />
                  <span className="text-neutral-300">Leads</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSeriesVisiveis((p) => ({ ...p, reunioes: !p.reunioes }))
                  }
                  className={cn(
                    "flex items-center gap-1.5 transition-opacity",
                    seriesVisiveis.reunioes ? "opacity-100" : "opacity-30 line-through"
                  )}
                >
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-neutral-300">Reuniões</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSeriesVisiveis((p) => ({ ...p, propostas: !p.propostas }))
                  }
                  className={cn(
                    "flex items-center gap-1.5 transition-opacity",
                    seriesVisiveis.propostas ? "opacity-100" : "opacity-30 line-through"
                  )}
                >
                  <span className="size-2 rounded-full bg-[#a855f7]" />
                  <span className="text-neutral-300">Propostas</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSeriesVisiveis((p) => ({ ...p, vendas: !p.vendas }))
                  }
                  className={cn(
                    "flex items-center gap-1.5 transition-opacity",
                    seriesVisiveis.vendas ? "opacity-100" : "opacity-30 line-through"
                  )}
                >
                  <span className="size-2 rounded-full bg-[#f97316]" />
                  <span className="text-neutral-300">Vendas</span>
                </button>
              </div>
            </div>

            {/* Frequência Diário */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuFrequenciaAberto(!menuFrequenciaAberto)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121620] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
              >
                <span>{frequenciaLinha}</span>
                <ChevronDown className="size-3 text-neutral-400" />
              </button>
              {menuFrequenciaAberto && (
                <div className="absolute right-0 top-8 z-30 w-28 rounded-lg border border-white/10 bg-[#0c1017] p-1 shadow-xl">
                  {(["Diário", "Semanal", "Mensal"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFrequenciaLinha(f);
                        setMenuFrequenciaAberto(false);
                      }}
                      className={cn(
                        "w-full px-2 py-1 text-xs rounded text-left transition-colors",
                        frequenciaLinha === f
                          ? "bg-orange-500/20 text-[#f97316] font-semibold"
                          : "text-neutral-300 hover:bg-white/5"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Linhas SVG com Eixos e Curvas Suaves */}
          <div className="relative h-56 w-full pt-4">
            <svg
              viewBox="0 0 540 220"
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="glowLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="glowVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas de Grade Horizontais */}
              {[
                { y: 20, val: "1.000" },
                { y: 65, val: "750" },
                { y: 110, val: "500" },
                { y: 155, val: "250" },
                { y: 200, val: "0" },
              ].map((grid) => (
                <g key={grid.y}>
                  <line
                    x1="45"
                    y1={grid.y}
                    x2="530"
                    y2={grid.y}
                    stroke="#1e2638"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x="35"
                    y={grid.y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {grid.val}
                  </text>
                </g>
              ))}

              {/* Curva de Leads (Cyan) */}
              {seriesVisiveis.leads && (
                <>
                  <path
                    d="M 50 145 C 90 135, 130 110, 180 120 C 230 75, 270 90, 320 40 C 370 50, 420 55, 470 45 L 520 35"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 50 145 C 90 135, 130 110, 180 120 C 230 75, 270 90, 320 40 C 370 50, 420 55, 470 45 L 520 35 L 520 200 L 50 200 Z"
                    fill="url(#glowLeads)"
                  />
                </>
              )}

              {/* Curva de Reuniões (Blue) */}
              {seriesVisiveis.reunioes && (
                <path
                  d="M 50 175 C 90 165, 130 155, 180 150 C 230 130, 270 135, 320 120 C 370 125, 420 128, 470 122 L 520 115"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              )}

              {/* Curva de Propostas (Purple) */}
              {seriesVisiveis.propostas && (
                <path
                  d="M 50 185 C 90 180, 130 172, 180 168 C 230 155, 270 160, 320 148 C 370 152, 420 154, 470 150 L 520 142"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                />
              )}

              {/* Curva de Vendas (Orange) */}
              {seriesVisiveis.vendas && (
                <path
                  d="M 50 192 C 90 190, 130 185, 180 182 C 230 175, 270 178, 320 170 C 370 172, 420 174, 470 168 L 520 165"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
              )}

              {/* Pontos Interativos no Gráfico de Leads */}
              {DADOS_LINHA_TEMPORAL.map((p, idx) => {
                const cx = 50 + idx * 47;
                // altura relativa aproximada
                const cyLeads = 200 - (p.leads / 1000) * 180;
                return (
                  <g
                    key={p.data}
                    className="cursor-pointer"
                    onMouseEnter={() => setPontoLinhaHover(idx)}
                    onMouseLeave={() => setPontoLinhaHover(null)}
                  >
                    {seriesVisiveis.leads && (
                      <circle
                        cx={cx}
                        cy={cyLeads}
                        r={pontoLinhaHover === idx ? "5" : "3.5"}
                        fill="#06b6d4"
                        stroke="#0c1017"
                        strokeWidth="1.5"
                      />
                    )}
                    {/* Data no Eixo X */}
                    <text
                      x={cx}
                      y="215"
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {p.data}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip Dinâmico no Hover */}
            {pontoLinhaHover !== null && (
              <div
                className="absolute z-30 pointer-events-none rounded-lg border border-white/10 bg-[#0c1017]/95 p-2 text-[10px] shadow-xl"
                style={{
                  left: `${Math.min(75, 10 + pontoLinhaHover * 8)}%`,
                  top: "20px",
                }}
              >
                <div className="font-bold text-white border-b border-white/10 pb-1 mb-1">
                  Data: {DADOS_LINHA_TEMPORAL[pontoLinhaHover].data}/10
                </div>
                <div className="text-cyan-400 font-mono">
                  Leads: {DADOS_LINHA_TEMPORAL[pontoLinhaHover].leads}
                </div>
                <div className="text-blue-400 font-mono">
                  Reuniões: {DADOS_LINHA_TEMPORAL[pontoLinhaHover].reunioes}
                </div>
                <div className="text-purple-400 font-mono">
                  Propostas: {DADOS_LINHA_TEMPORAL[pontoLinhaHover].propostas}
                </div>
                <div className="text-orange-400 font-mono">
                  Vendas: {DADOS_LINHA_TEMPORAL[pontoLinhaHover].vendas}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Desempenho por Agente (Barras Verticais) - 4 colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-4 p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white">Desempenho por Agente</h3>
            {/* Dropdown de Métrica */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuMetricaAgenteAberto(!menuMetricaAgenteAberto)}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121620] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
              >
                <span>{metricaAgentes}</span>
                <ChevronDown className="size-3 text-neutral-400" />
              </button>
              {menuMetricaAgenteAberto && (
                <div className="absolute right-0 top-8 z-30 w-36 rounded-lg border border-white/10 bg-[#0c1017] p-1 shadow-xl">
                  {(
                    [
                      "Leads",
                      "Reuniões",
                      "Propostas",
                      "Vendas",
                      "Conversão",
                      "Receita atribuída",
                    ] as const
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMetricaAgentes(m);
                        setMenuMetricaAgenteAberto(false);
                      }}
                      className={cn(
                        "w-full px-2 py-1 text-xs rounded text-left transition-colors",
                        metricaAgentes === m
                          ? "bg-orange-500/20 text-[#f97316] font-semibold"
                          : "text-neutral-300 hover:bg-white/5"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Barras Verticais com Avatares Embaixo */}
          <div className="relative h-60 w-full pt-4 flex items-end justify-between px-2">
            {/* Eixo Y */}
            <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between text-[9px] font-mono text-neutral-500">
              <span>1.000</span>
              <span>750</span>
              <span>500</span>
              <span>250</span>
              <span>0</span>
            </div>

            {/* 6 Barras com Avatares */}
            <div className="ml-8 w-full flex items-end justify-around gap-2 h-full pb-8">
              {DESEMPENHO_AGENTES_PADRAO.map((ag) => {
                // Cálculo de altura da barra proporcional
                const valorAtual =
                  metricaAgentes === "Leads"
                    ? ag.leads
                    : metricaAgentes === "Reuniões"
                    ? ag.reunioes * 6
                    : metricaAgentes === "Propostas"
                    ? ag.propostas * 10
                    : metricaAgentes === "Vendas"
                    ? ag.vendas * 16
                    : ag.leads;
                const alturaPercent = Math.min(95, Math.max(15, (valorAtual / 1000) * 100));

                return (
                  <div key={ag.id} className="flex-1 flex flex-col items-center group relative">
                    {/* Valor em cima da barra */}
                    <span className="text-[10px] font-mono font-bold text-white mb-1.5 opacity-90 group-hover:scale-110 transition-transform">
                      {metricaAgentes === "Leads"
                        ? ag.leads
                        : metricaAgentes === "Reuniões"
                        ? ag.reunioes
                        : metricaAgentes === "Propostas"
                        ? ag.propostas
                        : metricaAgentes === "Vendas"
                        ? ag.vendas
                        : metricaAgentes === "Conversão"
                        ? ag.conversao
                        : ag.receitaAtribuida}
                    </span>

                    {/* Barra Vertical */}
                    <div className="w-full max-w-[32px] bg-white/5 rounded-t-lg overflow-hidden h-36 flex items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t group-hover:brightness-125",
                          ag.corBarra
                        )}
                        style={{ height: `${alturaPercent}%` }}
                      />
                    </div>

                    {/* Avatar do Agente */}
                    <div className="mt-2 relative size-7 rounded-full overflow-hidden border border-white/20 shadow-md">
                      <img
                        src={ag.avatarUrl}
                        alt={ag.nome}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Nome do Agente */}
                    <span className="text-[9px] font-medium text-neutral-400 mt-1 truncate max-w-[50px] text-center">
                      {ag.nome}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfico 3: Origem dos Leads (Rosca Donut) - 3 colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-3 p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white">Origem dos Leads</h3>
          </div>

          <div className="flex flex-col items-center justify-center my-auto">
            {/* Donut SVG */}
            <div className="relative size-40 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                {/* Google Maps: 28% -> strokeDasharray="28 72" strokeDashoffset="0" */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="12"
                  strokeDasharray="28 72"
                  strokeDashoffset="0"
                />
                {/* Instagram: 22% -> strokeDasharray="22 78" strokeDashoffset="-28" */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray="22 78"
                  strokeDashoffset="-28"
                />
                {/* LinkedIn: 18% -> strokeDasharray="18 82" strokeDashoffset="-50" */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray="18 82"
                  strokeDashoffset="-50"
                />
                {/* Meta Ads: 14% -> strokeDasharray="14 86" strokeDashoffset="-68" */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="12"
                  strokeDasharray="14 86"
                  strokeDashoffset="-68"
                />
                {/* WhatsApp: 10% -> strokeDasharray="10 90" strokeDashoffset="-82" */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#ec4899"
                  strokeWidth="12"
                  strokeDasharray="10 90"
                  strokeDashoffset="-82"
                />
                {/* Outros: 8% -> strokeDasharray="8 92" strokeDashoffset="-92" */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#64748b"
                  strokeWidth="12"
                  strokeDasharray="8 92"
                  strokeDashoffset="-92"
                />
              </svg>

              {/* Centro do Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-mono text-white tracking-tight">
                  4.280
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">Leads</span>
              </div>
            </div>

            {/* Legenda Lateral/Inferior */}
            <div className="w-full grid grid-cols-2 gap-x-3 gap-y-1 mt-4 text-[11px]">
              {ORIGENS_LEADS_PADRAO.map((ori) => (
                <div key={ori.fonte} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: ori.fillHex }}
                    />
                    <span className="text-neutral-300 truncate">{ori.fonte}</span>
                  </div>
                  <span className="text-white font-mono font-semibold">{ori.percentual}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. LINHA MÉDIA 2: RECEITA VS INVESTIMENTO | FUNIL | NICHOS | REGIÕES
         ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Receita vs. Investimento */}
        <div className={cn(PANEL_CLASS, "p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Receita vs. Investimento</h3>
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                <div className="flex items-center gap-1 text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span>Receita</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span>Investimento</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuFinanceiroAberto(!menuFinanceiroAberto)}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#121620] px-2 py-1 text-xs text-neutral-300"
              >
                <span>{frequenciaFinanceiro}</span>
                <ChevronDown className="size-3 text-neutral-400" />
              </button>
              {menuFinanceiroAberto && (
                <div className="absolute right-0 top-8 z-30 w-24 rounded-lg border border-white/10 bg-[#0c1017] p-1 shadow-xl">
                  {(["Semanal", "Mensal"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFrequenciaFinanceiro(f);
                        setMenuFinanceiroAberto(false);
                      }}
                      className={cn(
                        "w-full px-2 py-1 text-xs rounded text-left",
                        frequenciaFinanceiro === f
                          ? "bg-orange-500/20 text-[#f97316] font-semibold"
                          : "text-neutral-300 hover:bg-white/5"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Barras Comparativas */}
          <div className="relative h-48 w-full pt-3 flex items-end justify-between">
            {/* Eixo Y */}
            <div className="flex flex-col justify-between h-36 text-[9px] font-mono text-neutral-500 pr-2">
              <span>80K</span>
              <span>60K</span>
              <span>40K</span>
              <span>20K</span>
              <span>0</span>
            </div>

            {/* 5 Semanas */}
            <div className="flex-1 flex items-end justify-around h-36 border-b border-white/10 pb-1">
              {RECEITA_VS_INVESTIMENTO_PADRAO.map((item) => {
                const altReceita = (item.receita / 80000) * 100;
                const altInvest = (item.investimento / 80000) * 100;
                return (
                  <div key={item.semana} className="flex flex-col items-center gap-1 group">
                    <div className="flex items-end gap-1 h-32">
                      {/* Barra Receita (Verde) */}
                      <div
                        className="w-3 rounded-t bg-[#10b981] group-hover:brightness-125 transition-all"
                        style={{ height: `${altReceita}%` }}
                        title={`Receita: ${item.receitaFormatada}`}
                      />
                      {/* Barra Investimento (Laranja) */}
                      <div
                        className="w-3 rounded-t bg-[#f59e0b] group-hover:brightness-125 transition-all"
                        style={{ height: `${altInvest}%` }}
                        title={`Investimento: ${item.investimentoFormatado}`}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-neutral-400 mt-1">{item.semana}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Funil de Vendas */}
        <div className={cn(PANEL_CLASS, "p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white">Funil de Vendas</h3>
          </div>

          <div className="flex items-center gap-3 my-auto">
            {/* Visual em formato de Funil Invertido Trapezoidal */}
            <div className="w-28 flex flex-col items-center gap-1">
              {FUNIL_VENDAS_PADRAO.map((et) => (
                <div
                  key={et.id}
                  className="h-7 rounded-sm flex items-center justify-center transition-transform hover:scale-105"
                  style={{
                    width: `${et.larguraTopoPercent}%`,
                    backgroundColor: et.fillHex,
                  }}
                />
              ))}
            </div>

            {/* Detalhes das Etapas */}
            <div className="flex-1 space-y-1.5 text-xs">
              {FUNIL_VENDAS_PADRAO.map((et) => (
                <div key={et.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: et.fillHex }}
                    />
                    <span className="text-neutral-300 font-medium text-[11px]">{et.etapa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-[11px]">
                      {et.quantidade.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono w-7 text-right">
                      {et.percentualGeral}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Distribuição por Nicho */}
        <div className={cn(PANEL_CLASS, "p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white">Distribuição por Nicho</h3>
          </div>

          <div className="flex items-center gap-3 my-auto">
            {/* Donut Nichos */}
            <div className="relative size-28 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                {/* Clínicas 26% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0ea5e9"
                  strokeWidth="13"
                  strokeDasharray="26 74"
                  strokeDashoffset="0"
                />
                {/* Imobiliárias 20% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="13"
                  strokeDasharray="20 80"
                  strokeDashoffset="-26"
                />
                {/* Academias 16% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="13"
                  strokeDasharray="16 84"
                  strokeDashoffset="-46"
                />
                {/* Restaurantes 14% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="13"
                  strokeDasharray="14 86"
                  strokeDashoffset="-62"
                />
                {/* E-commerces 12% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="13"
                  strokeDasharray="12 88"
                  strokeDashoffset="-76"
                />
                {/* Outros 12% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#14b8a6"
                  strokeWidth="13"
                  strokeDasharray="12 88"
                  strokeDashoffset="-88"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold font-mono text-white">4.280</span>
                <span className="text-[9px] text-neutral-400">Leads</span>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex-1 space-y-1 text-[10px]">
              {DISTRIBUICAO_NICHOS_PADRAO.map((n) => (
                <div key={n.nicho} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: n.fillHex }}
                    />
                    <span className="text-neutral-300 truncate max-w-[90px]">{n.nicho}</span>
                  </div>
                  <span className="text-white font-mono font-semibold">{n.percentual}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Regiões com mais Leads */}
        <div className={cn(PANEL_CLASS, "p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white">Regiões com mais Leads</h3>
            <button
              type="button"
              onClick={() => setModalMapaAberto(true)}
              className="text-xs font-semibold text-[#f97316] hover:underline flex items-center gap-0.5"
            >
              <span>Ver mapa</span>
            </button>
          </div>

          <div className="space-y-2 mt-2">
            {REGIOES_LEADS_PADRAO.map((reg) => (
              <div key={reg.localizacao} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium text-[11px] truncate">
                    {reg.localizacao}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-[11px]">
                      {reg.quantidade.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono w-7 text-right">
                      {reg.percentual}%
                    </span>
                  </div>
                </div>
                {/* Barra de Progresso Laranja */}
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f97316]"
                    style={{ width: `${reg.larguraBarraPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. LINHA INFERIOR: TABELA DE CAMPANHAS & RESULTADOS + METAS DO PERÍODO
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tabela de Campanhas e Resultados - 9 colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-9 p-5 flex flex-col justify-between")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white">Campanhas e Resultados</h3>
              <p className="text-xs text-neutral-400">
                Performance por canal, nicho e conversão das campanhas ativas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setAvisoAcao(
                    "O criador de novas campanhas está disponível no módulo Campanhas. Esta tela é dedicada ao BI de resultados."
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:bg-[#181e2b] transition-colors"
              >
                <Plus className="size-3.5 text-neutral-400" />
                <span>+ Nova campanha</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBuscaCampanha("");
                  setFiltroStatusCampanha("Todos");
                }}
                className="text-xs font-semibold text-[#f97316] hover:underline px-2"
              >
                Ver todas
              </button>
            </div>
          </div>

          {/* Tabela Responsiva */}
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Campanha</th>
                  <th className="pb-2.5 font-medium">Canal</th>
                  <th className="pb-2.5 font-medium">Nicho</th>
                  <th className="pb-2.5 font-medium text-center">Status</th>
                  <th className="pb-2.5 font-medium text-right">Leads</th>
                  <th className="pb-2.5 font-medium text-right">Reuniões</th>
                  <th className="pb-2.5 font-medium text-right">Propostas</th>
                  <th className="pb-2.5 font-medium text-right">Vendas</th>
                  <th className="pb-2.5 font-medium text-right">Receita</th>
                  <th className="pb-2.5 font-medium text-right">ROI</th>
                  <th className="pb-2.5 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campanhasFiltradas.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => setCampanhaSelecionadaDetalhes(c)}
                  >
                    {/* Nome + Ícone */}
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex size-6 items-center justify-center rounded-lg ${c.bgCanal} ${c.corCanal}`}
                        >
                          {renderIconeCanal(c.iconeCanal)}
                        </div>
                        <span className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {c.nome}
                        </span>
                      </div>
                    </td>

                    {/* Canal */}
                    <td className="py-3 pr-2 text-neutral-300">{c.canal}</td>

                    {/* Nicho */}
                    <td className="py-3 pr-2 text-neutral-300">{c.nicho}</td>

                    {/* Status */}
                    <td className="py-3 pr-2 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          c.status === "Ativa"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            c.status === "Ativa" ? "bg-emerald-400" : "bg-rose-400"
                          )}
                        />
                        {c.status}
                      </span>
                    </td>

                    {/* Leads */}
                    <td className="py-3 pr-2 text-right font-mono text-neutral-200">
                      {c.leads.toLocaleString("pt-BR")}
                    </td>

                    {/* Reuniões */}
                    <td className="py-3 pr-2 text-right font-mono text-neutral-200">
                      {c.reunioes}
                    </td>

                    {/* Propostas */}
                    <td className="py-3 pr-2 text-right font-mono text-neutral-200">
                      {c.propostas}
                    </td>

                    {/* Vendas */}
                    <td className="py-3 pr-2 text-right font-mono text-white font-bold">
                      {c.vendas}
                    </td>

                    {/* Receita */}
                    <td className="py-3 pr-2 text-right font-mono text-neutral-200 font-semibold">
                      {c.receita}
                    </td>

                    {/* ROI */}
                    <td className="py-3 pr-2 text-right font-mono text-emerald-400 font-bold">
                      {c.roi}
                    </td>

                    {/* Ações */}
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCampanhaSelecionadaDetalhes(c);
                        }}
                        className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card de Metas do Período - 3 colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-3 p-5 flex flex-col justify-between")}>
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Metas do Período</h3>
            <button
              type="button"
              onClick={() => setModalEditarMetasAberto(true)}
              className="text-xs font-semibold text-[#f97316] hover:underline"
            >
              Editar
            </button>
          </div>

          <div className="space-y-4 my-auto pt-3">
            {metasPeriodo.map((meta) => (
              <div key={meta.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-7 items-center justify-center rounded-lg ${meta.bgIcone} ${meta.corIcone}`}
                    >
                      {meta.iconeNome === "Users" ? (
                        <Users className="size-3.5" />
                      ) : meta.iconeNome === "Video" ? (
                        <Video className="size-3.5" />
                      ) : meta.iconeNome === "Award" ? (
                        <Award className="size-3.5" />
                      ) : (
                        <DollarSign className="size-3.5" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-neutral-200">{meta.titulo}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {meta.realizadoTexto} / {meta.metaTexto}
                    </span>
                    <span className="text-xs font-mono font-bold text-white ml-2">
                      {meta.percentual}%
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", meta.corBarra)}
                    style={{ width: `${Math.min(100, meta.percentual)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. MODAIS AUXILIARES
         ========================================================================= */}
      {/* Modal de Exportação */}
      <ExportarRelatorioModal
        aberto={modalExportarAberto}
        onFechar={() => setModalExportarAberto(false)}
        periodoAtual={dataInicioFim}
      />

      {/* Modal de Editar Metas */}
      <EditarMetasPeriodoModal
        aberto={modalEditarMetasAberto}
        onFechar={() => setModalEditarMetasAberto(false)}
        metas={metasPeriodo}
        onSalvar={(novas) => setMetasPeriodo(novas)}
      />

      {/* Modal de Mapa Regional */}
      <MapaRegioesModal aberto={modalMapaAberto} onFechar={() => setModalMapaAberto(false)} />

      {/* Modal de Detalhes da Campanha */}
      <DetalhesCampanhaModal
        campanha={campanhaSelecionadaDetalhes}
        aberto={campanhaSelecionadaDetalhes !== null}
        onFechar={() => setCampanhaSelecionadaDetalhes(null)}
      />

      {/* Notificação Toast Demonstrativa */}
      {avisoAcao && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-orange-500/30 bg-[#0c1017] p-4 text-xs text-white shadow-2xl animate-in slide-in-from-bottom-5">
          <Sparkles className="size-4 text-[#f97316] shrink-0" />
          <span>{avisoAcao}</span>
          <button
            onClick={() => setAvisoAcao(null)}
            className="ml-2 rounded p-1 text-neutral-400 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
