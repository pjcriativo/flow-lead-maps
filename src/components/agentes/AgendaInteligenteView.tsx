// Tela 09 — Agenda Inteligente
// Central de agendamentos e disponibilidade da equipe comercial coordenada pelo CEO de IA.
// Reproduz fielmente a imagem de referência aprovada (media_1792738624853.jpg) com máxima fidelidade estética e interativa.
import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Brain,
  Calendar as CalendarIcon,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Layers,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Percent,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_AGENDA,
  DIAS_DA_SEMANA_AGENDA,
  HORARIOS_AGENDA,
  REUNIOES_CALENDARIO_INICIAIS,
  AGENTES_DISPONIBILIDADE_INICIAIS,
  PROXIMAS_REUNIOES_INICIAIS,
  TAREFAS_RELACIONADAS_INICIAIS,
  ESTATISTICAS_AGENDA_INICIAIS,
  type ReuniãoCalendario,
  type AgenteDisponibilidadeItem,
  type ProximaReuniaoItem,
  type TarefaRelacionadaItem,
  type EstatisticaAgendaItem,
} from "./agenda-data";
import { NovaReuniaoModal } from "./NovaReuniaoModal";
import { SincronizarCalendariosModal } from "./SincronizarCalendariosModal";
import { ConfigurarRegrasAgendaModal } from "./ConfigurarRegrasAgendaModal";
import { DetalhesReuniaoModal } from "./DetalhesReuniaoModal";

interface AgendaInteligenteViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarFluxos?: () => void;
  onNavegarPlanejamento?: () => void;
  onNavegarCopiloto?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

export function AgendaInteligenteView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarEquipe,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarFluxos,
  onNavegarPlanejamento,
  onNavegarCopiloto,
}: AgendaInteligenteViewProps) {
  // Modais
  const [modalNovaReuniaoAberto, setModalNovaReuniaoAberto] = useState(false);
  const [modalSincronizarAberto, setModalSincronizarAberto] = useState(false);
  const [modalRegrasAberto, setModalRegrasAberto] = useState(false);
  const [reuniaoSelecionada, setReuniaoSelecionada] = useState<ReuniãoCalendario | null>(null);

  // Estados de dados locais
  const [reunioes, setReunioes] = useState<ReuniãoCalendario[]>(REUNIOES_CALENDARIO_INICIAIS);
  const [agentesDisponibilidade, setAgentesDisponibilidade] = useState<AgenteDisponibilidadeItem[]>(
    AGENTES_DISPONIBILIDADE_INICIAIS,
  );
  const [proximasReunioes, setProximasReunioes] = useState<ProximaReuniaoItem[]>(
    PROXIMAS_REUNIOES_INICIAIS,
  );
  const [tarefas, setTarefas] = useState<TarefaRelacionadaItem[]>(TAREFAS_RELACIONADAS_INICIAIS);
  const [estatisticas, setEstatisticas] = useState<EstatisticaAgendaItem[]>(
    ESTATISTICAS_AGENDA_INICIAIS,
  );

  // Controles de Visualização e Filtro
  const [visualizacao, setVisualizacao] = useState<"semana" | "dia" | "mes" | "agenda">("semana");
  const [agenteFiltro, setAgenteFiltro] = useState<string>("todos");
  const [dropdownFiltroAberto, setDropdownFiltroAberto] = useState(false);
  const [periodoOffset, setPeriodoOffset] = useState(0); // 0 = 20-26 Out 2026
  const [diaSelecionadoCompacto, setDiaSelecionadoCompacto] = useState<number>(22); // 22 de Outubro
  const [periodoEstatisticas, setPeriodoEstatisticas] = useState("Últimos 7 dias");

  // Alerta de feedback
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const dispararMensagem = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  // Criação local de reunião
  const handleSalvarNovaReuniao = (nova: Omit<ReuniãoCalendario, "id">) => {
    const id = `reu-${Date.now()}`;
    const reuniaoCriada: ReuniãoCalendario = {
      ...nova,
      id,
    };
    setReunioes((prev) => [reuniaoCriada, ...prev]);
    dispararMensagem(`Reunião "${reuniaoCriada.titulo}" agendada com sucesso!`);
  };

  // Cancelar reunião localmente
  const handleCancelarReuniao = (id: string) => {
    setReunioes((prev) => prev.filter((r) => r.id !== id));
    setProximasReunioes((prev) => prev.filter((r) => r.id !== id));
    setReuniaoSelecionada(null);
    dispararMensagem("Reunião cancelada localmente com sucesso.");
  };

  // Reagendar reunião localmente
  const handleReagendarReuniao = (id: string) => {
    setReunioes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "confirmada" as const } : r)),
    );
    dispararMensagem("Horário confirmado no calendário do Closer e SDR.");
  };

  // Alternar checkbox de tarefa
  const handleToggleTarefa = (id: string) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)),
    );
  };

  // Reuniões filtradas
  const reunioesFiltradas = reunioes.filter((r) => {
    if (agenteFiltro === "todos") return true;
    if (agenteFiltro === "ceo") return r.responsavel.toLowerCase().includes("ceo");
    if (agenteFiltro === "estrategista") return r.responsavel.toLowerCase().includes("estrategista");
    if (agenteFiltro === "sdr") return r.responsavel.toLowerCase().includes("sdr");
    if (agenteFiltro === "vendedor") return r.responsavel.toLowerCase().includes("vendedor");
    if (agenteFiltro === "gerente") return r.responsavel.toLowerCase().includes("gerente");
    return true;
  });

  // Função para retornar estilo do card de reunião
  const getCardStyle = (cor: ReuniãoCalendario["cor"]) => {
    switch (cor) {
      case "roxo":
        return "bg-purple-900/60 hover:bg-purple-900/80 border-purple-500/40 text-purple-100 shadow-purple-950/30";
      case "azul":
        return "bg-blue-900/60 hover:bg-blue-900/80 border-blue-500/40 text-blue-100 shadow-blue-950/30";
      case "verde":
        return "bg-emerald-900/60 hover:bg-emerald-900/80 border-emerald-500/40 text-emerald-100 shadow-emerald-950/30";
      case "laranja":
      case "ambar":
        return "bg-amber-900/60 hover:bg-amber-900/80 border-orange-500/40 text-orange-100 shadow-orange-950/30";
      case "vermelho":
        return "bg-rose-900/60 hover:bg-rose-900/80 border-rose-500/40 text-rose-100 shadow-rose-950/30";
      case "cinza":
      default:
        return "bg-[#182030] hover:bg-[#202a3d] border-white/10 text-neutral-200 shadow-black/40";
    }
  };

  return (
    <div className="space-y-5 p-4 lg:p-7 max-w-[1600px] mx-auto text-neutral-100 animate-in fade-in duration-300">
      {/* Toast de Feedback */}
      {mensagemSucesso && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* =========================================================================
          1. CABEÇALHO DA TELA & BREADCRUMB
          ========================================================================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* Breadcrumb fiel ao layout */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <span
              onClick={onVoltar}
              className="cursor-pointer hover:text-white transition-colors"
            >
              Agentes & Automações
            </span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span
              onClick={onNavegarPerfil}
              className="cursor-pointer hover:text-white transition-colors"
            >
              Perfil
            </span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span
              onClick={onNavegarPerfil}
              className="cursor-pointer hover:text-white transition-colors"
            >
              CEO de IA
            </span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span className="text-[#f95d14] font-medium">Agenda Inteligente</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
              <CalendarCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
                Agenda Inteligente
              </h1>
              <p className="text-xs text-neutral-400">
                Organize e gerencie reuniões, disponibilidade e agendamentos da equipe.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sincronizar calendários */}
          <button
            type="button"
            onClick={() => setModalSincronizarAberto(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-all shadow-sm"
          >
            <CalendarIcon className="size-3.5 text-neutral-400" />
            <span>Sincronizar calendários</span>
          </button>

          {/* Configurar regras */}
          <button
            type="button"
            onClick={() => setModalRegrasAberto(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-all shadow-sm"
          >
            <Sliders className="size-3.5 text-neutral-400" />
            <span>Configurar regras</span>
          </button>

          {/* Nova reunião */}
          <button
            type="button"
            onClick={() => setModalNovaReuniaoAberto(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f95d14] to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span>Nova reunião</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CARD SUPERIOR DO CEO DE IA & INDICADORES
          ========================================================================= */}
      <div className={cn(PANEL_CLASS, "p-5 lg:p-6")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Identidade do CEO */}
          <div className="lg:col-span-5 flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="relative size-20 lg:size-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-gradient-to-br from-[#1c2438] to-[#0e131d]">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=240&auto=format&fit=crop&q=80"
                  alt="CEO de IA"
                  className="size-full object-cover object-top"
                />
              </div>
              <div className="absolute -top-2 -left-2 size-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <Crown className="size-3.5" />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-1.5">
                  CEO de IA
                  <Crown className="size-3.5 text-amber-400 inline" />
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>

              <p className="text-xs text-neutral-400 font-medium">
                Orquestrador Geral da Operação Comercial
              </p>

              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                Gerencia a agenda da equipe, coordena reuniões e garante o melhor aproveitamento do tempo comercial.
              </p>

              {/* Tags de Especialidades */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Agendamento", "Otimização", "Disponibilidade", "Reuniões"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-white/5 bg-[#141b27] px-2 py-0.5 text-[10px] font-medium text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Indicadores Superiores (4 Cards) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INDICADORES_SUPERIORES_AGENDA.map((ind) => {
              const Icone = ind.icon;
              return (
                <div
                  key={ind.id}
                  className="rounded-xl border border-white/5 bg-[#101622] p-3.5 space-y-1.5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-400 truncate">
                      {ind.rotulo}
                    </span>
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg border",
                        ind.corBg,
                      )}
                    >
                      <Icone className={cn("size-3", ind.corIcone)} />
                    </div>
                  </div>
                  <div className="text-lg font-bold text-white tracking-tight">
                    {ind.valor}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                    <span className={ind.positivo ? "text-emerald-400" : "text-rose-400"}>
                      {ind.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha Inferior do Hero: Próxima Reunião & Calendários Conectados */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Clock className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Próxima reunião
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-white">09:00 - 09:30</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 font-medium">
                  Apresentação Comercial
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">Clínica Sorriso Saúde</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Calendários conectados
            </span>
            <div className="flex items-center -space-x-1.5">
              <div
                title="Google Calendar"
                className="flex size-7 items-center justify-center rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 shadow-sm"
              >
                <CalendarIcon className="size-3.5" />
              </div>
              <div
                title="Microsoft Outlook"
                className="flex size-7 items-center justify-center rounded-full bg-sky-950/80 border border-sky-500/40 text-sky-400 shadow-sm"
              >
                <Mail className="size-3.5" />
              </div>
              <div
                title="Google Meet"
                className="flex size-7 items-center justify-center rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-400 shadow-sm"
              >
                <Video className="size-3.5" />
              </div>
              <div className="flex size-7 items-center justify-center rounded-full bg-[#182030] border border-white/10 text-[10px] font-bold text-neutral-300 shadow-sm">
                +3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BARRA DE NAVEGAÇÃO & CONTROLES DO CALENDÁRIO
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navegação de Semana / Mês */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-white/10 bg-[#101622] p-0.5">
            <button
              type="button"
              onClick={() => setPeriodoOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Período anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPeriodoOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Próximo período"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPeriodoOffset(0)}
            className="rounded-xl border border-white/10 bg-[#101622] px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-colors"
          >
            Hoje
          </button>

          <span className="text-sm font-bold text-white ml-2">
            20 - 26 de Outubro de 2026
          </span>
        </div>

        {/* Alternância de Visualização & Filtro de Agentes */}
        <div className="flex items-center gap-2.5">
          {/* Pills de Visualização */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#101622] p-1">
            {(["semana", "dia", "mes", "agenda"] as const).map((modo) => (
              <button
                key={modo}
                type="button"
                onClick={() => setVisualizacao(modo)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all",
                  visualizacao === modo
                    ? "bg-[#f95d14] text-white shadow-md shadow-orange-500/20"
                    : "text-neutral-400 hover:text-white",
                )}
              >
                {modo === "mes" ? "Mês" : modo}
              </button>
            ))}
          </div>

          {/* Filtro por Agente Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownFiltroAberto(!dropdownFiltroAberto)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#101622] px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-[#182030] transition-colors"
            >
              <Filter className="size-3.5 text-neutral-400" />
              <span>
                {agenteFiltro === "todos"
                  ? "Todos os agentes"
                  : agenteFiltro === "ceo"
                  ? "CEO de IA"
                  : agenteFiltro === "sdr"
                  ? "SDR"
                  : agenteFiltro === "vendedor"
                  ? "Vendedor"
                  : "Filtrado"}
              </span>
              <ChevronDown className="size-3 text-neutral-400" />
            </button>

            {dropdownFiltroAberto && (
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-white/10 bg-[#0e131d] p-1 shadow-2xl z-20 space-y-0.5">
                {[
                  { id: "todos", label: "Todos os agentes" },
                  { id: "ceo", label: "CEO de IA" },
                  { id: "sdr", label: "SDR" },
                  { id: "vendedor", label: "Vendedor" },
                  { id: "estrategista", label: "Estrategista" },
                  { id: "gerente", label: "Gerente Comercial" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAgenteFiltro(item.id);
                      setDropdownFiltroAberto(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors",
                      agenteFiltro === item.id
                        ? "bg-[#f95d14]/20 text-[#f95d14] font-semibold"
                        : "text-neutral-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. CALENDÁRIO PRINCIPAL & COLUNA DIREITA
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Grade do Calendário Semanal (9 Colunas no Desktop) */}
        <div className={cn(PANEL_CLASS, "lg:col-span-9 p-4 overflow-hidden flex flex-col")}>
          {/* Cabeçalho dos 7 Dias da Semana */}
          <div className="grid grid-cols-8 gap-2 border-b border-white/10 pb-3 mb-2 text-center">
            {/* Coluna de Horário vazia */}
            <div className="text-[10px] font-semibold uppercase text-neutral-500 flex items-center justify-center">
              Horário
            </div>
            {DIAS_DA_SEMANA_AGENDA.map((dia) => (
              <div
                key={dia.diaSemana}
                className={cn(
                  "p-2 rounded-xl border transition-all",
                  dia.hoje
                    ? "bg-[#f95d14]/15 border-[#f95d14]/40 text-white font-bold shadow-md shadow-orange-500/10"
                    : "border-transparent text-neutral-400 hover:text-neutral-200",
                )}
              >
                <div className="text-[11px] uppercase tracking-wider">{dia.sigla}</div>
                <div
                  className={cn(
                    "text-xs font-semibold mt-0.5",
                    dia.hoje ? "text-[#f95d14] font-bold" : "text-neutral-200",
                  )}
                >
                  {dia.data}
                </div>
              </div>
            ))}
          </div>

          {/* Linhas de Horário e Eventos */}
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {HORARIOS_AGENDA.map((hora) => (
              <div key={hora} className="grid grid-cols-8 gap-2 items-start min-h-[54px] py-1 border-b border-white/[0.04]">
                {/* Indicador de Horário */}
                <div className="text-[11px] font-semibold text-neutral-500 text-center pt-1">
                  {hora}
                </div>

                {/* 7 Colunas de Dias da Semana */}
                {DIAS_DA_SEMANA_AGENDA.map((dia) => {
                  const reuniaoNoHorario = reunioesFiltradas.find(
                    (r) => r.diaSemana === dia.diaSemana && r.horaInicio === hora,
                  );

                  return (
                    <div
                      key={dia.diaSemana}
                      className={cn(
                        "relative h-full min-h-[50px] rounded-lg transition-colors group",
                        dia.hoje ? "bg-orange-500/[0.03]" : "",
                      )}
                    >
                      {reuniaoNoHorario ? (
                        <div
                          onClick={() => setReuniaoSelecionada(reuniaoNoHorario)}
                          className={cn(
                            "cursor-pointer rounded-xl border p-2 text-left transition-all hover:scale-[1.02] shadow-sm",
                            getCardStyle(reuniaoNoHorario.cor),
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {reuniaoNoHorario.titulo}
                            </span>
                            {reuniaoNoHorario.isOnline && (
                              <Video className="size-3 shrink-0 opacity-80" />
                            )}
                          </div>
                          <div className="text-[10px] opacity-80 truncate">
                            {reuniaoNoHorario.empresaOuLead}
                          </div>
                          <div className="flex items-center justify-between text-[9px] opacity-70 mt-1 font-mono">
                            <span>
                              {reuniaoNoHorario.horaInicio} - {reuniaoNoHorario.horaFim}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          {/* Botão sutil de adicionar em slots vazios */}
                          <button
                            type="button"
                            onClick={() => setModalNovaReuniaoAberto(true)}
                            className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-6 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-opacity"
                            title="Agendar neste horário"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita (3 Colunas no Desktop): Calendário Compacto & Agentes */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card 1: Calendário Mensal Compacto */}
          <div className={cn(PANEL_CLASS, "p-4 space-y-3.5")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Calendário</span>
              <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
                <ChevronLeft className="size-3.5 cursor-pointer text-neutral-400 hover:text-white" />
                <span>Outubro 2026</span>
                <ChevronRight className="size-3.5 cursor-pointer text-neutral-400 hover:text-white" />
              </div>
            </div>

            {/* Cabeçalho dos Dias (D S T Q Q S S) */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-500">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            {/* Grade de Dias do Mês */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
              {/* Espaços vazios do início do mês (Quinta-feira = 1 de Outubro) */}
              <div className="text-neutral-700">28</div>
              <div className="text-neutral-700">29</div>
              <div className="text-neutral-700">30</div>
              <div className="text-neutral-700">1</div>
              <div className="text-neutral-300 hover:bg-white/5 rounded-md p-1 cursor-pointer">2</div>
              <div className="text-neutral-300 hover:bg-white/5 rounded-md p-1 cursor-pointer">3</div>
              <div className="text-neutral-300 hover:bg-white/5 rounded-md p-1 cursor-pointer">4</div>

              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((d) => (
                <div
                  key={d}
                  onClick={() => setDiaSelecionadoCompacto(d)}
                  className="text-neutral-300 hover:bg-white/5 rounded-md p-1 cursor-pointer transition-colors"
                >
                  {d}
                </div>
              ))}

              {/* Dia 22 Destaque Laranja Fiel ao Layout */}
              <div
                onClick={() => setDiaSelecionadoCompacto(22)}
                className="relative flex items-center justify-center font-bold text-white bg-[#f95d14] rounded-full size-7 mx-auto shadow-md shadow-orange-500/40 cursor-pointer"
              >
                22
              </div>

              {[23, 24, 25, 26, 27, 28, 29, 30, 31].map((d) => (
                <div
                  key={d}
                  onClick={() => setDiaSelecionadoCompacto(d)}
                  className="text-neutral-300 hover:bg-white/5 rounded-md p-1 cursor-pointer transition-colors"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Legenda de Cores do Calendário */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-400" />
                <span>Reuniões</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-400" />
                <span>Tarefas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>Campanhas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple-400" />
                <span>Pessoal</span>
              </div>
            </div>
          </div>

          {/* Card 2: Agentes da Equipe */}
          <div className={cn(PANEL_CLASS, "p-4 space-y-3.5")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Agentes da Equipe</span>
              <button
                type="button"
                onClick={onNavegarEquipe}
                className="text-[11px] font-semibold text-[#f95d14] hover:text-orange-400 transition-colors"
              >
                Gerenciar
              </button>
            </div>

            <div className="space-y-2.5">
              {agentesDisponibilidade.map((agente) => (
                <div
                  key={agente.id}
                  onClick={() =>
                    setAgenteFiltro(agenteFiltro === agente.id ? "todos" : agente.id)
                  }
                  className={cn(
                    "flex items-center justify-between p-2 rounded-xl border border-transparent transition-all cursor-pointer hover:bg-white/5",
                    agenteFiltro === agente.id
                      ? "bg-[#f95d14]/10 border-[#f95d14]/30"
                      : "bg-[#101622]/60",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={agente.avatarUrl}
                      alt={agente.nome}
                      className="size-8 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {agente.nome}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        {agente.status === "disponivel" ? (
                          <>
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            <span className="text-emerald-400 font-medium">Disponível</span>
                          </>
                        ) : (
                          <>
                            <span className="size-1.5 rounded-full bg-purple-400" />
                            <span className="text-neutral-400">{agente.statusTexto}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {agente.status === "disponivel" ? (
                      <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Check className="size-3.5" />
                      </div>
                    ) : (
                      <div className="flex size-6 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                        <CalendarIcon className="size-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. CARDS INFERIORES: PRÓXIMAS REUNIÕES, TAREFAS & ESTATÍSTICAS
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Próximas Reuniões */}
        <div className={cn(PANEL_CLASS, "p-4 space-y-3.5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Próximas Reuniões</h3>
            <span className="text-[11px] font-semibold text-[#f95d14] cursor-pointer hover:underline">
              Ver todas
            </span>
          </div>

          <div className="space-y-2">
            {proximasReunioes.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#101622] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="font-mono text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-800 text-neutral-200 border border-neutral-700">
                    {item.horario}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {item.titulo}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {item.empresa}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src={item.avatarResponsavel}
                    alt="Agente"
                    className="size-6 rounded-full object-cover border border-white/10"
                  />
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      item.badgeTipo === "agora"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-neutral-800 text-neutral-300 border-neutral-700",
                    )}
                  >
                    {item.tempoRestante}
                  </span>
                  <button
                    type="button"
                    className="text-neutral-500 hover:text-white p-0.5 rounded"
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Tarefas Relacionadas */}
        <div className={cn(PANEL_CLASS, "p-4 space-y-3.5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Tarefas Relacionadas</h3>
            <span className="text-[11px] font-semibold text-[#f95d14] cursor-pointer hover:underline">
              Ver todas
            </span>
          </div>

          <div className="space-y-2">
            {tarefas.map((tar) => (
              <div
                key={tar.id}
                onClick={() => handleToggleTarefa(tar.id)}
                className="flex items-center justify-between p-2 rounded-xl bg-[#101622] border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "size-4 rounded-md border flex items-center justify-center transition-all",
                      tar.concluida
                        ? "bg-emerald-500 border-emerald-500 text-black font-bold"
                        : "border-neutral-600 bg-neutral-800/60",
                    )}
                  >
                    {tar.concluida && <Check className="size-3" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs truncate font-medium",
                      tar.concluida
                        ? "line-through text-neutral-500"
                        : "text-neutral-200",
                    )}
                  >
                    {tar.titulo}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {tar.prazoHora}
                  </span>
                  <img
                    src={tar.avatarResponsavel}
                    alt="Agente"
                    className="size-5 rounded-full object-cover border border-white/10"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Estatísticas da Agenda */}
        <div className={cn(PANEL_CLASS, "p-4 space-y-3.5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Estatísticas da Agenda</h3>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white"
            >
              <span>{periodoEstatisticas}</span>
              <ChevronDown className="size-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {estatisticas.map((est) => {
              const Icone = est.icon;
              return (
                <div
                  key={est.id}
                  className="rounded-xl border border-white/5 bg-[#101622] p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg border",
                        est.corBg,
                      )}
                    >
                      <Icone className={cn("size-3", est.corIcone)} />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                        est.positivo
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                      )}
                    >
                      {est.mudanca}
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-bold text-white tracking-tight">
                      {est.valor}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {est.rotulo}
                    </div>
                  </div>

                  {/* Micro Sparkline */}
                  <div className="h-4 w-full flex items-end gap-1 pt-1 opacity-70">
                    {est.sparkline.map((val, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex-1 rounded-sm",
                          est.positivo ? "bg-emerald-500" : "bg-purple-500",
                        )}
                        style={{
                          height: `${Math.max(20, (val / Math.max(...est.sparkline)) * 100)}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. MODAIS INTERATIVOS
          ========================================================================= */}
      <NovaReuniaoModal
        aberto={modalNovaReuniaoAberto}
        onFechar={() => setModalNovaReuniaoAberto(false)}
        onSalvar={(reuniao) => {
          handleSalvarNovaReuniao(reuniao);
          setModalNovaReuniaoAberto(false);
        }}
      />

      <SincronizarCalendariosModal
        aberto={modalSincronizarAberto}
        onFechar={() => setModalSincronizarAberto(false)}
        onSincronizar={(prov) => {
          setModalSincronizarAberto(false);
          dispararMensagem(`Conexão com ${prov} configurada com sucesso.`);
        }}
      />

      <ConfigurarRegrasAgendaModal
        aberto={modalRegrasAberto}
        onFechar={() => setModalRegrasAberto(false)}
        onSalvar={() => {
          setModalRegrasAberto(false);
          dispararMensagem("Regras de buffer e confirmação atualizadas.");
        }}
      />

      <DetalhesReuniaoModal
        reuniao={reuniaoSelecionada}
        onFechar={() => setReuniaoSelecionada(null)}
        onCancelar={(id) => handleCancelarReuniao(id)}
        onReagendar={(id) => handleReagendarReuniao(id)}
      />
    </div>
  );
}
