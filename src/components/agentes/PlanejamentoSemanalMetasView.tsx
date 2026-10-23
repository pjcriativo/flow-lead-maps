// Tela 08 — Planejamento Semanal & Metas
// Central de planejamento comercial gerenciada pelo CEO de IA.
// Reproduz fielmente a imagem de referência aprovada com máxima fidelidade estética e interativa.
import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  Crown,
  Database,
  DollarSign,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  FolderKanban,
  GitBranch,
  Globe,
  HardDrive,
  Headphones,
  HeartHandshake,
  Layers,
  LayoutGrid,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  Minus,
  MoreVertical,
  Percent,
  Play,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_PLANEJAMENTO,
  DIAS_DA_SEMANA,
  HORARIOS_CALENDARIO,
  EVENTOS_CALENDARIO_INICIAIS,
  METAS_DA_SEMANA_INICIAIS,
  ORCAMENTO_TOTAL_SEMANAL,
  ORCAMENTO_CONSUMIDO_SEMANAL,
  CATEGORIAS_ORCAMENTO,
  CAMPANHAS_DA_SEMANA_INICIAIS,
  TAREFAS_DA_SEMANA_INICIAIS,
  DESEMPENHO_AGENTES_INICIAIS,
  type EventoCalendario,
  type MetaSemanaItem,
  type CampanhaSemanalItem,
  type TarefaSemanaItem,
  type CategoriaOrcamento,
} from "./planejamento-data";
import { AdicionarAtividadeModal } from "./AdicionarAtividadeModal";
import { ConfigurarMetasModal } from "./ConfigurarMetasModal";
import { AjustarOrcamentoModal } from "./AjustarOrcamentoModal";
import { NovaCampanhaSemanalModal } from "./NovaCampanhaSemanalModal";

interface PlanejamentoSemanalMetasViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarFluxos?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarAgenda?: () => void;
}

export function PlanejamentoSemanalMetasView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarFluxos,
  onNavegarEquipe,
  onNavegarAgenda,
}: PlanejamentoSemanalMetasViewProps) {
  // Modais
  const [modalAtividadeAberto, setModalAtividadeAberto] = useState(false);
  const [modalMetasAberto, setModalMetasAberto] = useState(false);
  const [modalOrcamentoAberto, setModalOrcamentoAberto] = useState(false);
  const [modalCampanhaAberto, setModalCampanhaAberto] = useState(false);

  // Estados de dados locais
  const [eventos, setEventos] = useState<EventoCalendario[]>(EVENTOS_CALENDARIO_INICIAIS);
  const [metas, setMetas] = useState<MetaSemanaItem[]>(METAS_DA_SEMANA_INICIAIS);
  const [campanhas, setCampanhas] = useState<CampanhaSemanalItem[]>(CAMPANHAS_DA_SEMANA_INICIAIS);
  const [tarefas, setTarefas] = useState<TarefaSemanaItem[]>(TAREFAS_DA_SEMANA_INICIAIS);
  const [orcamentoTotal, setOrcamentoTotal] = useState(ORCAMENTO_TOTAL_SEMANAL);
  const [categoriasOrcamento, setCategoriasOrcamento] = useState<CategoriaOrcamento[]>(CATEGORIAS_ORCAMENTO);

  // Navegação de Semanas
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [visualizacaoCalendario, setVisualizacaoCalendario] = useState<"semana" | "mes" | "lista">("semana");

  // Notificação Toast
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 4000);
  };

  // Texto descritivo da semana
  const getPeriodoSemanaTexto = () => {
    if (semanaOffset === 0) return "20 a 26 de Outubro de 2026";
    if (semanaOffset === -1) return "13 a 19 de Outubro de 2026";
    if (semanaOffset === 1) return "27 de Outubro a 02 de Novembro de 2026";
    return semanaOffset > 0
      ? `Semana +${semanaOffset} (Novembro 2026)`
      : `Semana ${semanaOffset} (Outubro 2026)`;
  };

  // Salvar Planejamento
  const handleSalvarPlanejamento = () => {
    exibirToast("Planejamento semanal salvo localmente como rascunho de demonstração.");
  };

  // Toggle de tarefa concluída
  const handleToggleTarefa = (id: string) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t))
    );
  };

  // Obter cor de estilo do evento no calendário
  const getCorEventoStyle = (cor: EventoCalendario["cor"]) => {
    switch (cor) {
      case "laranja":
        return "border-orange-500/70 bg-[#25150f] text-orange-200 shadow-orange-950/20";
      case "azul":
        return "border-blue-500/60 bg-[#0f1b2d] text-blue-200 shadow-blue-950/20";
      case "verde":
        return "border-emerald-500/60 bg-[#0d2118] text-emerald-200 shadow-emerald-950/20";
      case "roxo":
        return "border-purple-500/60 bg-[#1e132e] text-purple-200 shadow-purple-950/20";
      case "ambar":
        return "border-amber-500/60 bg-[#261d10] text-amber-200 shadow-amber-950/20";
      case "ciano":
        return "border-cyan-500/60 bg-[#0d2226] text-cyan-200 shadow-cyan-950/20";
      case "cinza":
      default:
        return "border-neutral-600/60 bg-[#171b23] text-neutral-300";
    }
  };

  return (
    <div className="mx-auto max-w-[1720px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 space-y-5">
      {/* Toast Notificação */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-[#0d141e] px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>{toastMensagem}</span>
        </div>
      )}

      {/* =========================================================================
          1. CABEÇALHO & BREADCRUMB
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
          >
            <button
              type="button"
              onClick={onVoltar}
              className="hover:text-neutral-200 transition-colors"
            >
              Agentes &amp; Automações
            </button>
            <ChevronRight className="size-3 text-neutral-500" />
            <button
              type="button"
              onClick={onNavegarPerfil}
              className="hover:text-neutral-200 transition-colors"
            >
              Perfil
            </button>
            <ChevronRight className="size-3 text-neutral-500" />
            <button
              type="button"
              onClick={onNavegarPerfil}
              className="hover:text-neutral-200 transition-colors"
            >
              CEO de IA
            </button>
            <ChevronRight className="size-3 text-neutral-500" />
            <span className="text-orange-400 font-semibold">Planejamento &amp; Metas</span>
          </nav>

          {/* Título & Subtítulo */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 text-orange-400 shadow-md">
              <Calendar className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Planejamento Semanal &amp; Metas
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400">
                Defina nichos, campanhas, agentes, tarefas, orçamento e metas comerciais.
              </p>
            </div>
          </div>
        </div>

        {/* Controles do Cabeçalho */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Semana com Navegação */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#121620] px-1 py-0.5 text-xs text-neutral-200 shadow-sm">
            <button
              type="button"
              onClick={() => setSemanaOffset((s) => s - 1)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-2 px-2.5 font-medium text-xs">
              <Calendar className="size-3.5 text-orange-400" />
              <span>{getPeriodoSemanaTexto()}</span>
            </div>

            <button
              type="button"
              onClick={() => setSemanaOffset((s) => s + 1)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Próxima semana"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Ver Mês */}
          <button
            type="button"
            onClick={() => setVisualizacaoCalendario("mes")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 py-2 text-xs font-semibold text-neutral-200 shadow-sm transition-all hover:border-white/20 hover:bg-[#181d2c] hover:text-white"
          >
            <span>Ver mês</span>
          </button>

          {/* Salvar Planejamento */}
          <button
            type="button"
            onClick={handleSalvarPlanejamento}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Salvar planejamento</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. CARD PRINCIPAL DO AGENTE (CEO DE IA) & INDICADORES SUPERIORES
         ========================================================================= */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl sm:p-6">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-80 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.55fr)]">
          {/* Perfil do CEO */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative shrink-0">
              <div className="relative size-32 overflow-hidden rounded-2xl border-2 border-orange-500/60 shadow-xl shadow-orange-500/20 sm:size-36">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"
                  alt="CEO de IA"
                  className="size-full object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              </div>

              <div className="absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-lg bg-amber-400 text-black shadow-md">
                <Crown className="size-4 fill-black" />
              </div>
            </div>

            {/* Informações Centrais */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>CEO de IA</span>
                  <Crown className="size-5 text-amber-400 fill-amber-400" />
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </span>
              </div>

              <p className="mt-1 text-xs font-semibold text-neutral-300">
                Orquestrador Geral da Operação Comercial
              </p>

              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Planeja, distribui e acompanha as ações da equipe comercial para garantir o atingimento das metas com máxima eficiência.
              </p>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Estratégia", "Metas", "Planejamento", "Resultados"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Grid dos 6 Indicadores Superiores */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {INDICADORES_SUPERIORES_PLANEJAMENTO.map((ind) => {
              if (ind.tipo === "progresso") {
                return (
                  <div
                    key={ind.id}
                    className="col-span-2 flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-neutral-400 truncate">
                        {ind.rotulo}
                      </span>
                      <div className={cn("flex size-6 items-center justify-center rounded-lg border", ind.corBg, ind.corIcone)}>
                        <ind.icon className="size-3.5" />
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-[#FF5500]"
                            style={{ width: `${ind.porcentagem}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white">{ind.valor}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400">{ind.sub}</p>
                    </div>
                  </div>
                );
              }

              if (ind.tipo === "status") {
                return (
                  <div
                    key={ind.id}
                    className="col-span-2 flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-neutral-400 truncate">
                        {ind.rotulo}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalMetasAberto(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#161a26] px-2 py-0.5 text-[10px] font-semibold text-neutral-300 hover:text-white hover:border-orange-500/50 transition-colors"
                      >
                        <Sliders className="size-3 text-orange-400" />
                        <span>Ajustar metas</span>
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-400 tracking-tight">
                        {ind.valor}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={ind.id}
                  className="flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn("flex size-7 items-center justify-center rounded-lg border", ind.corBg, ind.corIcone)}>
                      <ind.icon className="size-3.5" />
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400">{ind.sub}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] font-medium text-neutral-400 block truncate">
                      {ind.rotulo}
                    </span>
                    <span className="text-base font-bold text-white tracking-tight">
                      {ind.valor}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. NAVEGAÇÃO DO PERFIL (ABAS COM METAS ATIVA)
         ========================================================================= */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/5">
        {[
          { label: "Visão Geral", id: "visao_geral", onClick: onNavegarPerfil },
          { label: "Configurações", id: "configuracoes", onClick: onNavegarPerfil },
          { label: "Treinamento", id: "treinamento", onClick: onNavegarTreinamento },
          { label: "Memória", id: "memoria", onClick: onNavegarMemoria },
          { label: "Skills", id: "skills", onClick: onNavegarSkills },
          { label: "Fluxos", id: "fluxos", onClick: onNavegarFluxos },
          { label: "Metas", id: "metas", ativo: true },
          { label: "Autonomia", id: "autonomia", onClick: onNavegarPerfil },
          { label: "Histórico", id: "historico", onClick: onNavegarPerfil },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={tab.onClick}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all",
              tab.ativo
                ? "border border-[#FF5500] bg-[#FF5500]/15 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* =========================================================================
          4. CORPO PRINCIPAL: CALENDÁRIO SEMANAL & CARDS DE METAS / ORÇAMENTO
         ========================================================================= */}
      <section className="grid gap-5 lg:grid-cols-12 items-start">
        
        {/* ---------------------------------------------------------------------
            COLUNA ESQUERDA: CALENDÁRIO — PLANEJAMENTO DA SEMANA (8 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-8 space-y-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl">
          {/* Header do Calendário */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Planejamento da Semana</h3>
              <p className="text-[11px] text-neutral-400">
                Visualize e organize as principais ações da equipe comercial.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalAtividadeAberto(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-white/20 hover:text-white transition-colors"
              >
                <Plus className="size-3 text-orange-400" />
                <span>Adicionar atividade</span>
              </button>

              {/* Botões de Visualização: Semana | Mês | Lista */}
              <div className="flex items-center rounded-xl border border-white/5 bg-[#141824] p-1 text-xs">
                {(["semana", "mes", "lista"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setVisualizacaoCalendario(view)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-semibold capitalize transition-all",
                      visualizacaoCalendario === view
                        ? "bg-[#FF5500] text-white shadow"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendário Semanal Grid */}
          <div className="overflow-x-auto select-none">
            <div className="min-w-[700px]">
              
              {/* Cabeçalho dos 7 Dias */}
              <div className="grid grid-cols-7 gap-2 border-b border-white/5 pb-2 text-center text-xs">
                {DIAS_DA_SEMANA.map((dia) => (
                  <div
                    key={dia.diaSemana}
                    className={cn(
                      "flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors",
                      dia.hoje
                        ? "border border-orange-500/80 bg-orange-500/10 text-orange-400 font-bold"
                        : "text-neutral-400 hover:bg-white/5"
                    )}
                  >
                    <span className="text-[11px] font-medium">{dia.sigla}</span>
                    <span className={cn("text-xs", dia.hoje ? "text-white" : "text-neutral-200")}>
                      {dia.data}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grade de Horários e Eventos */}
              <div className="relative mt-3 space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {HORARIOS_CALENDARIO.map((hora) => {
                  return (
                    <div
                      key={hora}
                      className="grid grid-cols-7 gap-2 min-h-[52px] border-b border-white/[0.04] py-1 text-xs"
                    >
                      {/* 7 colunas para os 7 dias */}
                      {DIAS_DA_SEMANA.map((dia) => {
                        // Encontra eventos marcados para este dia e faixa de horário
                        const eventosNesteSlot = eventos.filter(
                          (ev) =>
                            ev.diaSemana === dia.diaSemana &&
                            ev.horaInicio.startsWith(hora.substring(0, 2))
                        );

                        return (
                          <div
                            key={dia.diaSemana}
                            onClick={() => {
                              if (eventosNesteSlot.length === 0) {
                                setModalAtividadeAberto(true);
                              }
                            }}
                            className={cn(
                              "relative rounded-lg p-1 transition-colors min-h-[48px]",
                              dia.hoje ? "bg-orange-500/[0.02]" : "hover:bg-white/[0.02]"
                            )}
                          >
                            {eventosNesteSlot.map((ev) => (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exibirToast(`Atividade: "${ev.titulo}" • Responsável: ${ev.agente} (${ev.horaInicio} às ${ev.horaFim})`);
                                }}
                                className={cn(
                                  "group flex flex-col justify-between rounded-lg border p-1.5 text-[10px] font-semibold transition-all shadow-md hover:scale-[1.02] cursor-pointer",
                                  getCorEventoStyle(ev.cor)
                                )}
                              >
                                <div className="truncate font-bold leading-tight">
                                  {ev.titulo}
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[9px] opacity-80">
                                  <span>{ev.agente}</span>
                                  <span>{ev.horaInicio} - {ev.horaFim}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUNA DIREITA: METAS DA SEMANA & ORÇAMENTO (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card: Metas da Semana */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Metas da Semana</h3>
              <button
                type="button"
                onClick={() => setModalMetasAberto(true)}
                className="text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Configurar
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              {metas.map((meta) => {
                const Icon = meta.icon;
                return (
                  <div key={meta.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("flex size-5 items-center justify-center rounded-md border", meta.corBg, meta.corIcone)}>
                          <Icon className="size-3" />
                        </div>
                        <span className="font-semibold text-neutral-200">{meta.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400">
                          {meta.atual} / {meta.meta}
                        </span>
                        <span className="text-xs font-bold text-white">{meta.porcentagem}%</span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn("h-full rounded-full transition-all", meta.corBarra)}
                        style={{ width: `${meta.porcentagem}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Orçamento da Semana */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Orçamento da Semana</h3>
              <button
                type="button"
                onClick={() => setModalOrcamentoAberto(true)}
                className="text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Ajustar
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-white">
                    R$ {ORCAMENTO_CONSUMIDO_SEMANAL.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-neutral-400">
                    / R$ {orcamentoTotal.toLocaleString("pt-BR")}
                  </span>
                </div>
                <span className="text-sm font-bold text-orange-400">63%</span>
              </div>

              {/* Barra de Progresso do Orçamento */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 to-[#FF5500]"
                  style={{ width: "63%" }}
                />
              </div>
            </div>

            {/* Categorias do Orçamento */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {categoriasOrcamento.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${cat.corPonto}`} />
                    <span className="text-neutral-300">{cat.nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">
                      R$ {cat.valor.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[11px] text-neutral-400 w-7 text-right">
                      {cat.percentual}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. LINHA INFERIOR (3 CARDS): CAMPANHAS | TAREFAS | DESEMPENHO
         ========================================================================= */}
      <section className="grid gap-5 lg:grid-cols-12">
        
        {/* ---------------------------------------------------------------------
            CARD 1: CAMPANHAS DA SEMANA (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Campanhas da Semana</h3>
            <button
              type="button"
              onClick={() => setModalCampanhaAberto(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus className="size-3" />
              <span>Nova campanha</span>
            </button>
          </div>

          <div className="overflow-x-auto select-none">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 uppercase tracking-wider">
                  <th className="pb-2 font-medium">Campanha</th>
                  <th className="pb-2 font-medium">Nicho</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {campanhas.map((camp) => {
                  const Icon = camp.icon;
                  return (
                    <tr key={camp.id} className="group hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg border", camp.corBg, camp.corIcone)}>
                            <Icon className="size-3" />
                          </div>
                          <span className="font-semibold text-white truncate max-w-[110px]">
                            {camp.nome}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-neutral-300 truncate max-w-[100px]">
                        {camp.nicho}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            camp.status === "ativa"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                          )}
                        >
                          <span className={cn("size-1 rounded-full", camp.status === "ativa" ? "bg-emerald-400" : "bg-neutral-500")} />
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-white">
                        {camp.leads}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-emerald-400">
                        {camp.conversao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            CARD 2: TAREFAS DA SEMANA (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Tarefas da Semana</h3>
            <button
              type="button"
              onClick={() => exibirToast("Visualização de todas as 18 tarefas aberta.")}
              className="text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-2.5">
            {tarefas.map((tar) => (
              <div
                key={tar.id}
                onClick={() => handleToggleTarefa(tar.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#121620] p-2.5 transition-colors hover:border-white/10 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Checkbox custom */}
                  <div
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      tar.concluida
                        ? "border-emerald-500 bg-emerald-500 text-black"
                        : "border-white/20 bg-white/5 hover:border-orange-500"
                    )}
                  >
                    {tar.concluida && <Check className="size-3 stroke-[3]" />}
                  </div>

                  {/* Ícone */}
                  <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg border", tar.corBg, tar.corIcone)}>
                    <tar.icon className="size-3" />
                  </div>

                  {/* Informações */}
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "text-xs font-semibold block truncate transition-all",
                        tar.concluida ? "line-through text-neutral-500" : "text-white"
                      )}
                    >
                      {tar.titulo}
                    </span>
                    <span className="text-[10px] text-neutral-400">{tar.agente}</span>
                  </div>
                </div>

                {/* Badge de Prazo & Avatar do Agente */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                      tar.corPrazo === "hoje"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : tar.corPrazo === "amanha"
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                    )}
                  >
                    {tar.prazo}
                  </span>

                  <div className="size-5 rounded-full overflow-hidden border border-white/20">
                    <img
                      src={tar.avatarAgente}
                      alt={tar.agente}
                      className="size-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            CARD 3: DESEMPENHO POR AGENTE (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Desempenho por Agente</h3>
            <button
              type="button"
              onClick={() => exibirToast("Painel detalhado de produtividade dos agentes aberto.")}
              className="text-[11px] font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Ver detalhes
            </button>
          </div>

          <div className="overflow-x-auto select-none">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 uppercase tracking-wider">
                  <th className="pb-2 font-medium">Agente</th>
                  <th className="pb-2 font-medium text-right">Leads</th>
                  <th className="pb-2 font-medium text-right">Reuniões</th>
                  <th className="pb-2 font-medium text-right">Propostas</th>
                  <th className="pb-2 font-medium text-right">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {DESEMPENHO_AGENTES_INICIAIS.map((ag) => (
                  <tr key={ag.id} className="group hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="relative size-6 shrink-0 rounded-full overflow-hidden border border-white/20">
                          <img
                            src={ag.avatarUrl}
                            alt={ag.nome}
                            className="size-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-white flex items-center gap-1 truncate max-w-[95px]">
                          <span>{ag.nome}</span>
                          {ag.isCeo && <Crown className="size-3 text-amber-400 fill-amber-400 shrink-0" />}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-bold text-white">
                      {ag.leads}
                    </td>
                    <td className="py-2.5 text-right font-medium text-neutral-300">
                      {ag.reunioes}
                    </td>
                    <td className="py-2.5 text-right font-medium text-neutral-300">
                      {ag.propostas}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-400">
                      <span className="inline-flex items-center gap-0.5">
                        <span>{ag.conversao}</span>
                        <TrendingUp className="size-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* =========================================================================
          6. MODAIS INTERATIVOS
         ========================================================================= */}
      <AdicionarAtividadeModal
        aberto={modalAtividadeAberto}
        onFechar={() => setModalAtividadeAberto(false)}
        onSalvarAtividade={(nova) => {
          setEventos((prev) => [
            ...prev,
            { ...nova, id: `ev-${Date.now()}` },
          ]);
          exibirToast(`Atividade "${nova.titulo}" agendada com sucesso!`);
        }}
      />

      <ConfigurarMetasModal
        aberto={modalMetasAberto}
        onFechar={() => setModalMetasAberto(false)}
        metas={metas}
        onSalvarMetas={(novas) => {
          setMetas(novas);
          exibirToast("Metas comerciais da semana atualizadas com sucesso!");
        }}
      />

      <AjustarOrcamentoModal
        aberto={modalOrcamentoAberto}
        onFechar={() => setModalOrcamentoAberto(false)}
        onSalvar={(novoTotal, novasCats) => {
          setOrcamentoTotal(novoTotal);
          setCategoriasOrcamento(novasCats);
          exibirToast("Teto e distribuição de orçamento ajustados com sucesso!");
        }}
      />

      <NovaCampanhaSemanalModal
        aberto={modalCampanhaAberto}
        onFechar={() => setModalCampanhaAberto(false)}
        onAdicionar={(novaCamp) => {
          setCampanhas((prev) => [novaCamp, ...prev]);
          exibirToast(`Campanha "${novaCamp.nome}" adicionada com sucesso!`);
        }}
      />
    </div>
  );
}
