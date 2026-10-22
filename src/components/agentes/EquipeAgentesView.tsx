// Tela 02 — Equipe de Agentes & Enxames
// Central de gestão da equipe comercial de IA do cliente com máxima fidelidade visual ao layout aprovado.
import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  Eye,
  Filter,
  Globe,
  Handshake,
  Layers,
  Lightbulb,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Settings,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRoundSearch,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AGENTES_INICIAIS,
  DEPARTAMENTOS_DATA,
  ENXAMES_DATA,
  BIBLIOTECA_AGENTES_DATA,
  type AgenteDetalhado,
} from "./equipe-data";
import { MontarEquipeModal } from "./MontarEquipeModal";
import { NovoAgenteModal } from "./NovoAgenteModal";

interface EquipeAgentesViewProps {
  onVoltarPainel?: () => void;
  onVerPerfil?: (agenteId: string) => void;
}

export function EquipeAgentesView({ onVoltarPainel, onVerPerfil }: EquipeAgentesViewProps) {
  const [abaAtiva, setAbaAtiva] = useState<"agentes" | "departamentos" | "enxames" | "biblioteca">("agentes");
  const [busca, setBusca] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [agentes, setAgentes] = useState<AgenteDetalhado[]>(AGENTES_INICIAIS);
  const [modalMontarAberto, setModalMontarAberto] = useState(false);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [agenteSelecionado, setAgenteSelecionado] = useState<AgenteDetalhado | null>(null);
  const [menuAcoesAberto, setMenuAcoesAberto] = useState<string | null>(null);

  // Filtragem dinâmica de agentes
  const agentesFiltrados = useMemo(() => {
    return agentes.filter((ag) => {
      const matchBusca =
        ag.nome.toLowerCase().includes(busca.toLowerCase()) ||
        ag.cargo.toLowerCase().includes(busca.toLowerCase()) ||
        ag.especialidade.toLowerCase().includes(busca.toLowerCase()) ||
        ag.departamento.toLowerCase().includes(busca.toLowerCase());

      const matchDept =
        filtroDepartamento === "todos" ||
        ag.departamentoId.toLowerCase() === filtroDepartamento.toLowerCase() ||
        ag.departamento.toLowerCase().includes(filtroDepartamento.toLowerCase());

      const matchStatus =
        filtroStatus === "todos" || ag.status.toLowerCase() === filtroStatus.toLowerCase();

      return matchBusca && matchDept && matchStatus;
    });
  }, [agentes, busca, filtroDepartamento, filtroStatus]);

  const handleCriarAgente = (novo: AgenteDetalhado) => {
    setAgentes((prev) => [novo, ...prev]);
  };

  const handleToggleStatusAgente = (id: string) => {
    setAgentes((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const novoStatus = a.status === "Pausado" ? "Online" : "Pausado";
          return { ...a, status: novoStatus };
        }
        return a;
      }),
    );
    setMenuAcoesAberto(null);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      <div className="mx-auto max-w-[1680px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 space-y-6">

        {/* =========================================================================
            1. CABEÇALHO DA TELA 02
           ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {onVoltarPainel ? (
              <button
                type="button"
                onClick={onVoltarPainel}
                title="Voltar ao Painel Geral"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#121620] text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f95d14] text-sm font-bold text-white shadow-lg shadow-orange-600/20">
                02
              </span>
            )}

            <div>
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
              >
                {onVoltarPainel && (
                  <button
                    type="button"
                    onClick={onVoltarPainel}
                    className="hover:text-white transition-colors"
                  >
                    Visão Geral
                  </button>
                )}
                {onVoltarPainel && <ChevronRight className="size-3 text-neutral-500" />}
                <span className="text-neutral-300 font-semibold">Equipe de Agentes</span>
              </nav>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Equipe de Agentes
              </h1>
              <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                Gerencie sua equipe de IA ou deixe o CEO montar sua operação comercial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Plus className="size-4 text-neutral-400" />
              <span>Novo Agente</span>
            </button>

            <button
              type="button"
              onClick={() => setModalMontarAberto(true)}
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-[#f95d14] px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:opacity-95 hover:shadow-orange-500/35"
            >
              <Zap className="size-4 fill-white" />
              <span>Montar minha equipe com CEO de IA</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. NAVEGAÇÃO INTERNA (ABAS)
           ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b2232] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "agentes", label: "Meus Agentes", icon: Users, count: agentes.length },
              { id: "departamentos", label: "Departamentos", icon: Building2, count: DEPARTAMENTOS_DATA.length },
              { id: "enxames", label: "Enxames", icon: Layers, count: ENXAMES_DATA.length },
              { id: "biblioteca", label: "Biblioteca de Agentes", icon: Sparkles, count: BIBLIOTECA_AGENTES_DATA.length },
            ].map((tab) => {
              const ativa = abaAtiva === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAbaAtiva(tab.id as typeof abaAtiva)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                    ativa
                      ? "bg-[#f95d14] text-white shadow-md shadow-orange-600/20"
                      : "bg-[#121620] text-neutral-400 border border-white/5 hover:border-white/10 hover:text-white hover:bg-[#181e2b]",
                  )}
                >
                  <IconComp className="size-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      ativa ? "bg-white/20 text-white" : "bg-white/5 text-neutral-400",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick info */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operação Comercial Supervisionada (Modo Copiloto)</span>
          </div>
        </div>

        {/* =========================================================================
            3. BARRA DE BUSCA E FILTROS (visível na aba Meus Agentes)
           ========================================================================= */}
        {abaAtiva === "agentes" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3 shadow-md">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar agentes por nome, cargo, departamento ou especialidade..."
                className="h-10 w-full rounded-xl border border-white/10 bg-[#121620] pl-10 pr-9 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-neutral-300">
                <Filter className="size-3.5 text-neutral-500" />
                <select
                  value={filtroDepartamento}
                  onChange={(e) => setFiltroDepartamento(e.target.value)}
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="todos" className="bg-[#121620]">Todos os departamentos</option>
                  <option value="direcao" className="bg-[#121620]">Direção</option>
                  <option value="estrategia" className="bg-[#121620]">Estratégia</option>
                  <option value="prospeccao" className="bg-[#121620]">Prospecção</option>
                  <option value="pre-vendas" className="bg-[#121620]">Pré-vendas</option>
                  <option value="vendas" className="bg-[#121620]">Vendas</option>
                  <option value="gestao" className="bg-[#121620]">Gestão Comercial</option>
                  <option value="seo-marketing" className="bg-[#121620]">SEO e Marketing</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-neutral-300">
                <Radio className="size-3.5 text-neutral-500" />
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="todos" className="bg-[#121620]">Status: Todos</option>
                  <option value="online" className="bg-[#121620]">Online</option>
                  <option value="trabalhando" className="bg-[#121620]">Trabalhando</option>
                  <option value="pausado" className="bg-[#121620]">Pausado</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. CONTEÚDO PRINCIPAL: ABA "MEUS AGENTES" (Grid de Cards da Referência)
           ========================================================================= */}
        {abaAtiva === "agentes" && (
          <div>
            {agentesFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1b2232] bg-[#0c1017]/50 p-12 text-center">
                <Bot className="size-12 text-neutral-600" />
                <h3 className="mt-3 text-sm font-bold text-white">Nenhum agente encontrado</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Tente alterar os termos da busca ou redefinir os filtros aplicados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setFiltroDepartamento("todos");
                    setFiltroStatus("todos");
                  }}
                  className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {agentesFiltrados.map((agente) => {
                  const isCeo = agente.isCeo;
                  const isTrabalhando = agente.status === "Trabalhando";
                  const isPausado = agente.status === "Pausado";

                  return (
                    <div
                      key={agente.id}
                      className={cn(
                        "group relative flex flex-col items-center rounded-2xl border p-6 text-center transition-all duration-200",
                        isCeo
                          ? "border-orange-500/50 bg-[#10141e] shadow-xl shadow-orange-950/20 ring-1 ring-orange-500/25"
                          : "border-[#1b2232] bg-[#0c1017] hover:border-white/20 hover:bg-[#101522] shadow-lg",
                      )}
                    >
                      {/* Top Left Crown for CEO */}
                      {isCeo && (
                        <div className="absolute left-4 top-4 flex size-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                          <Crown className="size-4 fill-amber-400/40" />
                        </div>
                      )}

                      {/* Top Right Actions Menu Button */}
                      <div className="absolute right-3.5 top-3.5">
                        <button
                          type="button"
                          onClick={() => setMenuAcoesAberto(menuAcoesAberto === agente.id ? null : agente.id)}
                          className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label="Ações do agente"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {menuAcoesAberto === agente.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-[#1b2232] bg-[#121620] p-1.5 shadow-2xl backdrop-blur-md">
                            <button
                              type="button"
                              onClick={() => {
                                setAgenteSelecionado(agente);
                                setMenuAcoesAberto(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-300 hover:bg-white/10 hover:text-white"
                            >
                              <Eye className="size-3.5" />
                              <span>Ver perfil completo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatusAgente(agente.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-300 hover:bg-white/10 hover:text-white"
                            >
                              {isPausado ? <Play className="size-3.5 text-emerald-400" /> : <Pause className="size-3.5 text-amber-400" />}
                              <span>{isPausado ? "Retomar agente" : "Pausar operações"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModalMontarAberto(true);
                                setMenuAcoesAberto(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-300 hover:bg-white/10 hover:text-white"
                            >
                              <Layers className="size-3.5" />
                              <span>Reatribuir enxame</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Circular Avatar with Glowing Ring */}
                      <div className="relative mt-2">
                        <div
                          className={cn(
                            "size-24 overflow-hidden rounded-full border-2 transition-transform duration-300 group-hover:scale-105",
                            isCeo
                              ? "border-orange-500 shadow-xl shadow-orange-500/25"
                              : "border-white/20 shadow-md",
                          )}
                        >
                          <img
                            src={agente.avatarUrl}
                            alt={agente.nome}
                            className="size-full object-cover object-top"
                          />
                        </div>
                        {/* Status Dot Badge */}
                        <span
                          className={cn(
                            "absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-[#0c1017]",
                            isPausado
                              ? "bg-neutral-500"
                              : isTrabalhando
                                ? "bg-blue-400 animate-pulse"
                                : "bg-emerald-400",
                          )}
                        />
                      </div>

                      {/* Agent Name */}
                      <h3 className="mt-4 text-base font-bold text-white flex items-center gap-1.5">
                        <span>{agente.nome}</span>
                        {isCeo && <Crown className="size-4 text-amber-400 fill-amber-400" />}
                      </h3>

                      {/* Role & Department */}
                      <p className="mt-0.5 text-xs text-neutral-400 font-medium">
                        {agente.cargo}
                      </p>

                      {/* Status indicator Pill */}
                      <div className="mt-2.5">
                        {isPausado ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-400">
                            <span className="size-1.5 rounded-full bg-neutral-500" />
                            <span>Pausado</span>
                          </span>
                        ) : isTrabalhando ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-semibold text-blue-400">
                            <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span>Trabalhando</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            <span>Online</span>
                          </span>
                        )}
                      </div>

                      {/* Metadata / Tasks details */}
                      <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#1b2232] pt-3.5 w-full text-[11px] text-neutral-400">
                        <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                          <Briefcase className="size-3" />
                          <span>{agente.tarefas} tarefas</span>
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[170px]" title={agente.especialidade}>
                          {agente.departamento}
                        </span>
                      </div>

                      {/* Bottom Link: "Ver perfil ➔" */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onVerPerfil) {
                            onVerPerfil(agente.id);
                          } else {
                            setAgenteSelecionado(agente);
                          }
                        }}
                        className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#f95d14] transition-all hover:text-[#ff7836] hover:translate-x-0.5"
                      >
                        <span>Ver perfil</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            5. CONTEÚDO: ABA "DEPARTAMENTOS"
           ========================================================================= */}
        {abaAtiva === "departamentos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Estrutura de Departamentos</h3>
                <p className="text-xs text-neutral-400">
                  Organização setorial da sua máquina comercial com líderes e objetivos claros.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEPARTAMENTOS_DATA.map((dept) => {
                const IconComp = dept.icon;
                return (
                  <div
                    key={dept.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#1b2232] bg-[#0c1017] p-5 shadow-lg transition-all hover:border-white/20"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("flex size-9 items-center justify-center rounded-xl border", dept.corBadge)}>
                            <IconComp className="size-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{dept.nome}</h4>
                            <span className="text-[10px] text-neutral-400">
                              {dept.agentesCount} agente ativo • {dept.tarefasAtivas} tarefas
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-neutral-300">
                        {dept.descricao}
                      </p>

                      <div className="mt-3.5 rounded-xl border border-white/5 bg-[#121620] p-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          Objetivo Setorial
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-white">{dept.objetivoPrincipal}</p>
                      </div>
                    </div>

                    {/* Leader Preview */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#1b2232] pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="size-7 overflow-hidden rounded-full border border-white/10">
                          <img src={dept.avatarLider} alt={dept.lider} className="size-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white leading-tight">{dept.lider}</p>
                          <p className="text-[10px] text-neutral-400">{dept.liderCargo}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFiltroDepartamento(dept.id);
                          setAbaAtiva("agentes");
                        }}
                        className="text-xs font-semibold text-[#f95d14] hover:text-[#ff7836]"
                      >
                        Ver agentes →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            6. CONTEÚDO: ABA "ENXAMES"
           ========================================================================= */}
        {abaAtiva === "enxames" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Enxames de Agentes em Execução</h3>
                <p className="text-xs text-neutral-400">
                  Grupos de agentes coordenados trabalhando sinergicamente em metas específicas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMontarAberto(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#181e2b]"
              >
                <Plus className="size-3.5 text-orange-400" />
                <span>Criar Novo Enxame</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {ENXAMES_DATA.map((enx) => (
                <div
                  key={enx.id}
                  className="flex flex-col justify-between rounded-2xl border border-orange-500/25 bg-[#0c1017] p-5 shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-orange-400 border border-orange-500/20">
                        {enx.departamento}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{enx.estado}</span>
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-bold text-white">{enx.nome}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-300">{enx.objetivo}</p>

                    <div className="mt-4 rounded-xl border border-white/5 bg-[#121620] p-3 text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Líder Responsável:</span>
                        <span className="font-semibold text-white">{enx.liderResponsavel}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between text-neutral-400">
                        <span>Metas do Enxame:</span>
                        <span className="font-semibold text-orange-400">{enx.metas}</span>
                      </div>
                      <div className="mt-1.5 flex justify-between text-neutral-400">
                        <span>Tarefas em andamento:</span>
                        <span className="font-semibold text-white">{enx.tarefas} tarefas</span>
                      </div>
                    </div>

                    {/* Participants Avatars */}
                    <div className="mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Agentes Participantes
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {enx.agentesParticipantes.map((p, i) => (
                          <div
                            key={i}
                            title={`${p.nome} (${p.cargo})`}
                            className="relative size-8 overflow-hidden rounded-full border border-orange-500/40 shadow-sm"
                          >
                            <img src={p.avatarUrl} alt={p.nome} className="size-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#1b2232] pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setModalMontarAberto(true)}
                      className="text-xs font-semibold text-[#f95d14] hover:text-[#ff7836] flex items-center gap-1"
                    >
                      <span>Ver organograma do enxame</span>
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            7. CONTEÚDO: ABA "BIBLIOTECA DE AGENTES"
           ========================================================================= */}
        {abaAtiva === "biblioteca" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Biblioteca de Agentes Especialistas</h3>
              <p className="text-xs text-neutral-400">
                Ative novos perfis certificados para expandir a capacidade de atendimento e vendas.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BIBLIOTECA_AGENTES_DATA.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#1b2232] bg-[#0c1017] p-5 shadow-lg transition-all hover:border-white/20"
                >
                  <div>
                    <div className="relative size-16 mx-auto overflow-hidden rounded-full border-2 border-white/15">
                      <img src={item.avatarUrl} alt={item.nome} className="size-full object-cover" />
                    </div>

                    <h4 className="mt-3 text-center text-sm font-bold text-white">{item.nome}</h4>
                    <p className="text-center text-xs text-neutral-400">{item.cargo}</p>

                    <p className="mt-2.5 text-xs text-neutral-300 leading-relaxed text-center line-clamp-2">
                      {item.descricao}
                    </p>

                    <div className="mt-3 space-y-1 rounded-xl bg-[#121620] p-2.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Departamento:</span>
                        <span className="font-semibold text-white">{item.departamento}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Ativação:</span>
                        <span className="font-semibold text-emerald-400">{item.tempoAtivacao}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const novo: AgenteDetalhado = {
                        id: `agente-${item.id}`,
                        nome: item.nome,
                        cargo: item.cargo,
                        departamento: item.departamento,
                        departamentoId: item.departamento.toLowerCase(),
                        especialidade: item.especialidade,
                        avatarUrl: item.avatarUrl,
                        status: "Online",
                        tarefas: 0,
                        metas: "Pronto para receber tarefas",
                        descricao: item.descricao,
                        taxaSucesso: "95%",
                        nivelAutonomia: item.nivelAutonomia,
                      };
                      handleCriarAgente(novo);
                      setAbaAtiva("agentes");
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f95d14] py-2 text-xs font-bold text-white transition-all hover:bg-[#ff6c26]"
                  >
                    <Plus className="size-3.5" />
                    <span>Adicionar à Minha Equipe</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          8. DRAWER DE PERFIL DETALHADO DO AGENTE
         ========================================================================= */}
      {agenteSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setAgenteSelecionado(null)}
          />

          <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#1b2232] bg-[#0c1017] p-6 text-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1b2232] pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Perfil do Agente
              </span>
              <button
                type="button"
                onClick={() => setAgenteSelecionado(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <div className="relative size-24 overflow-hidden rounded-full border-2 border-orange-500 shadow-xl">
                <img
                  src={agenteSelecionado.avatarUrl}
                  alt={agenteSelecionado.nome}
                  className="size-full object-cover"
                />
              </div>
              <h3 className="mt-3 text-lg font-bold text-white flex items-center gap-1.5">
                <span>{agenteSelecionado.nome}</span>
                {agenteSelecionado.isCeo && <Crown className="size-4 text-amber-400 fill-amber-400" />}
              </h3>
              <p className="text-xs text-neutral-400 font-medium">{agenteSelecionado.cargo}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-bold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>{agenteSelecionado.status}</span>
              </span>
            </div>

            <div className="mt-6 space-y-4 text-xs">
              <div className="rounded-xl border border-white/5 bg-[#121620] p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Departamento:</span>
                  <span className="font-semibold text-white">{agenteSelecionado.departamento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Especialidade:</span>
                  <span className="font-semibold text-white">{agenteSelecionado.especialidade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Autonomia:</span>
                  <span className="font-semibold text-orange-400">{agenteSelecionado.nivelAutonomia}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Taxa de Sucesso:</span>
                  <span className="font-semibold text-emerald-400">{agenteSelecionado.taxaSucesso}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-neutral-300">Missão &amp; Descrição</h5>
                <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                  {agenteSelecionado.descricao}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-neutral-300">Metas Atribuídas</h5>
                <p className="mt-1 text-xs text-neutral-300 leading-relaxed bg-[#121620] p-3 rounded-xl border border-white/5">
                  {agenteSelecionado.metas}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-[#1b2232] flex gap-2">
              <button
                type="button"
                onClick={() => handleToggleStatusAgente(agenteSelecionado.id)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-white/10"
              >
                {agenteSelecionado.status === "Pausado" ? "Ativar Agente" : "Pausar Operação"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgenteSelecionado(null);
                  setModalMontarAberto(true);
                }}
                className="flex-1 rounded-xl bg-[#f95d14] py-2.5 text-xs font-bold text-white hover:bg-[#ff6c26]"
              >
                Ajustar Metas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. MODAIS: MONTAR EQUIPE COM CEO & NOVO AGENTE
         ========================================================================= */}
      <MontarEquipeModal
        aberto={modalMontarAberto}
        onFechar={() => setModalMontarAberto(false)}
        onConcluir={() => setAbaAtiva("agentes")}
      />

      <NovoAgenteModal
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        onCriar={handleCriarAgente}
      />
    </div>
  );
}
