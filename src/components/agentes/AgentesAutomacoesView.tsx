// Tela 01 — Agentes & Automações · Painel Geral
// Reprodução fiel e de altíssima precisão do layout executivo aprovado.
import React, { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  Database,
  FileCheck,
  FileText,
  Filter,
  Globe,
  Handshake,
  Heart,
  Layers,
  Lightbulb,
  MessageSquare,
  Mic,
  MoreVertical,
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
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CEO_AGENTE_DATA,
  EQUIPE_AGENTES_DATA,
  PLANO_SEMANAL_DATA,
  FLUXO_OPERACAO_DATA,
  METAS_RESULTADOS_DATA,
  ATIVIDADES_RECENTES_DATA,
  CAPACIDADES_DATA,
} from "./agentes-data";

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 backdrop-blur-sm shadow-xl";

const ICONES_CAPACIDADE: Record<string, { icon: LucideIcon; cor: string; bg: string }> = {
  memoria: { icon: Database, cor: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  skills: { icon: Wrench, cor: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  voz: { icon: Mic, cor: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  sentimento: { icon: Heart, cor: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

import { AgentesNavHeader, type TelaAgentesId } from "./AgentesNavHeader";
import { EquipeAgentesView } from "./EquipeAgentesView";
import { PerfilAgenteView } from "./PerfilAgenteView";
import { TreinamentoConhecimentoView } from "./TreinamentoConhecimentoView";

function getInitialTela(): TelaAgentesId {
  if (typeof window === "undefined") return "visao_geral";
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tela");
  if (t === "equipe") return "equipe";
  if (t === "perfil") return "perfil";
  if (t === "treinamento") return "treinamento";
  return "visao_geral";
}

function getInitialAgente(): string {
  if (typeof window === "undefined") return "ceo";
  const params = new URLSearchParams(window.location.search);
  return params.get("agente") || "ceo";
}

export function AgentesAutomacoesView({ onRevisar }: { onRevisar?: () => void }) {
  const [telaAtiva, setTelaAtiva] = useState<TelaAgentesId>(getInitialTela);
  const [agentePerfilId, setAgentePerfilId] = useState<string>(getInitialAgente);
  const [periodoMetas, setPeriodoMetas] = useState("Este mês");

  const mudarTela = (novaTela: TelaAgentesId, novoAgenteId?: string) => {
    setTelaAtiva(novaTela);
    if (novoAgenteId) {
      setAgentePerfilId(novoAgenteId);
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tela", novaTela);
      if (novoAgenteId) {
        params.set("agente", novoAgenteId);
      } else if (novaTela !== "perfil" && novaTela !== "treinamento") {
        params.delete("agente");
      }
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      {/* Barra de Navegação Superior Compartilhada das 12 Telas */}
      <AgentesNavHeader telaAtiva={telaAtiva} onSelecionarTela={(t) => mudarTela(t)} />

      {/* Renderização Condicional da Tela Ativa */}
      {telaAtiva === "equipe" ? (
        <EquipeAgentesView
          onVoltarPainel={() => mudarTela("visao_geral")}
          onVerPerfil={(id) => mudarTela("perfil", id)}
        />
      ) : telaAtiva === "perfil" ? (
        <PerfilAgenteView
          agenteId={agentePerfilId}
          onVoltar={() => mudarTela("equipe")}
          onNavegarEquipe={() => mudarTela("equipe")}
          onNavegarTreinamento={() => mudarTela("treinamento", agentePerfilId)}
        />
      ) : telaAtiva === "treinamento" ? (
        <TreinamentoConhecimentoView
          agenteId={agentePerfilId}
          onVoltar={() => mudarTela("perfil", agentePerfilId)}
          onNavegarPerfil={() => mudarTela("perfil", agentePerfilId)}
          onNavegarEquipe={() => mudarTela("equipe")}
        />
      ) : (
        <div className="mx-auto max-w-[1680px] px-4 pb-14 pt-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* =========================================================================
            1. CABEÇALHO PRINCIPAL DO MÓDULO
           ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f95d14] text-sm font-bold text-white shadow-lg shadow-orange-600/20">
              01
            </span>
            <div>
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
              >
                <ChevronRight className="size-3 text-neutral-500" />
                <span>Visão Geral</span>
              </nav>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Agentes &amp; Automações
              </h1>
              <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                O CEO de IA coordena toda a operação comercial com agentes autônomos, em modo copiloto.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => mudarTela("equipe")}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Users className="size-4 text-neutral-400" />
              <span>Montar equipe com CEO de IA</span>
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Settings2 className="size-4 text-neutral-400" />
              <span>Configurar metas</span>
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f95d14] px-4 text-xs font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#ff6c26] hover:shadow-orange-500/35"
            >
              <Plus className="size-4" />
              <span>Nova operação</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. CARD DO AGENTE CEO / ORQUESTRADOR
           ========================================================================= */}
        <section className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-[#0c1017] p-6 shadow-2xl shadow-orange-950/20">
          {/* Glowing backlight */}
          <div
            className="pointer-events-none absolute -left-20 -top-20 size-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,93,20,0.14),transparent_70%)]"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_minmax(320px,420px)]">
            {/* CEO Profile Info */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Avatar with glow and online badge */}
              <div className="relative shrink-0">
                <div className="relative size-32 overflow-hidden rounded-2xl border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20 sm:size-36">
                  <img
                    src={CEO_AGENTE_DATA.avatarUrl}
                    alt="CEO de IA"
                    className="size-full object-cover object-top"
                  />
                  {/* Subtle rim highlight */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                {/* Status Online Badge */}
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>

              {/* CEO Bio & Skills */}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  <Bot className="size-3 text-orange-400" />
                  <span>AGENTE ORQUESTRADOR</span>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    CEO de IA
                  </h2>
                  <Crown className="size-6 text-amber-400 fill-amber-400/30" />
                </div>

                <p className="mt-2 text-xs leading-relaxed text-neutral-300 sm:text-sm">
                  Planeja, coordena e impulsiona toda a operação comercial.
                  <br className="hidden sm:inline" />
                  Define estratégias, delega tarefas, acompanha metas e garante resultados.
                </p>

                {/* Pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: "Planejamento", icon: Target },
                    { label: "Delegação", icon: Users },
                    { label: "Análise de performance", icon: TrendingUp },
                    { label: "Tomada de decisão", icon: Settings },
                  ].map((p) => (
                    <span
                      key={p.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
                    >
                      <p.icon className="size-3 text-neutral-400" />
                      <span>{p.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Comando da Operação Box */}
            <div className="rounded-xl border border-white/10 bg-[#121620]/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-orange-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Comando da operação
                </h3>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Seu CEO de IA está ativo e coordenando 6 agentes.
              </p>

              {/* Status Banner */}
              <div className="mt-3.5 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-3 transition-colors hover:bg-emerald-950/35 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Radio className="size-4 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-400">Operação em andamento</p>
                    <p className="text-[11px] text-neutral-300">
                      Todos os agentes executando conforme o plano.
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-emerald-400/70" />
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => mudarTela("equipe")}
                  className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-neutral-200 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  Ver plano atual
                </button>
                <button
                  type="button"
                  onClick={() => mudarTela("perfil", "ceo")}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#f95d14] px-3 text-xs font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-[#ff6c26]"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Conversar com o CEO</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CARDS DE KPI (6 CARDS NA LINHA)
           ========================================================================= */}
        <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              icon: Users,
              iconColor: "text-blue-400",
              iconBg: "bg-blue-500/10 border-blue-500/20",
              valor: "1.248",
              badge: "+18%",
              rotulo: "Leads prospectados",
            },
            {
              icon: Filter,
              iconColor: "text-purple-400",
              iconBg: "bg-purple-500/10 border-purple-500/20",
              valor: "342",
              badge: "+24%",
              rotulo: "Leads qualificados",
            },
            {
              icon: Calendar,
              iconColor: "text-amber-400",
              iconBg: "bg-amber-500/10 border-amber-500/20",
              valor: "56",
              badge: "+12%",
              rotulo: "Reuniões agendadas",
            },
            {
              icon: FileText,
              iconColor: "text-cyan-400",
              iconBg: "bg-cyan-500/10 border-cyan-500/20",
              valor: "28",
              badge: "+33%",
              rotulo: "Propostas em andamento",
            },
            {
              icon: BarChart3,
              iconColor: "text-emerald-400",
              iconBg: "bg-emerald-500/10 border-emerald-500/20",
              valor: "18%",
              badge: "+6%",
              rotulo: "Conversão semanal",
            },
            {
              icon: Users,
              iconColor: "text-sky-400",
              iconBg: "bg-sky-500/10 border-sky-500/20",
              valor: "6",
              badge: "100%",
              rotulo: "Agentes ativos",
            },
          ].map((k) => (
            <div
              key={k.rotulo}
              className={cn(PANEL_CLASS, "flex items-center gap-3.5 p-4 transition-all hover:border-white/20")}
            >
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                  k.iconBg,
                  k.iconColor,
                )}
              >
                <k.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-white">{k.valor}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <TrendingUp className="size-2.5" />
                    <span>{k.badge}</span>
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-400">{k.rotulo}</p>
              </div>
            </div>
          ))}
        </section>

        {/* =========================================================================
            4. EQUIPE DE AGENTES + ENXAME DE AUTOMAÇÃO
           ========================================================================= */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1.05fr)]">
          {/* Equipe de Agentes */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <Users className="size-4" />
                </span>
                <h2 className="text-sm font-semibold tracking-wide text-white">Equipe de Agentes</h2>
              </div>
              <button
                type="button"
                onClick={() => mudarTela("equipe")}
                className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] transition-colors hover:text-[#ff7836]"
              >
                <span>Gerenciar equipe</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* 7 Agent Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {EQUIPE_AGENTES_DATA.map((agente) => {
                const isCeo = agente.id === "ceo";
                return (
                  <div
                    key={agente.id}
                    onClick={() => mudarTela("perfil", agente.id)}
                    className={cn(
                      "group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all cursor-pointer",
                      isCeo
                        ? "border-orange-500/70 bg-[#161a25] shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30"
                        : "border-[#1b2232] bg-[#0e131d]/90 hover:border-white/20 hover:bg-[#131926]",
                    )}
                  >
                    {/* Top right 3 dots */}
                    <button
                      type="button"
                      className="absolute right-2 top-2 text-neutral-500 transition-colors hover:text-white"
                      aria-label="Opções do agente"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>

                    {/* Circular Avatar */}
                    <div className="relative mt-1">
                      <div
                        className={cn(
                          "size-14 overflow-hidden rounded-full border-2",
                          isCeo ? "border-orange-500 shadow-md shadow-orange-500/20" : "border-white/15",
                        )}
                      >
                        <img
                          src={agente.avatarUrl}
                          alt={agente.nome}
                          className="size-full object-cover object-top"
                        />
                      </div>
                      {/* Status indicator dot */}
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#0e131d] bg-emerald-400" />
                    </div>

                    {/* Agent Name */}
                    <div className="mt-2.5 flex items-center gap-1">
                      <p className="truncate text-xs font-bold text-white">{agente.nome}</p>
                      {isCeo && <Crown className="size-3 text-amber-400 fill-amber-400" />}
                    </div>

                    {/* Role */}
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-400">
                      {agente.funcao}
                    </p>

                    {/* Online badge */}
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span>Online</span>
                    </div>

                    {/* Task count pill */}
                    <div className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 py-1 text-[10px] font-semibold text-orange-400">
                      <Briefcase className="size-2.5" />
                      <span>{agente.tarefasCount} tarefas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enxame de Automação */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-1 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <Layers className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    Enxame de Automação
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    O CEO coordena os agentes conforme o plano comercial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] transition-colors hover:text-[#ff7836]"
              >
                <span>Ver fluxo completo</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* Tree Structure */}
            <div className="mt-5 flex flex-col items-center">
              {/* Root Node: CEO */}
              <div className="group relative flex flex-col items-center rounded-xl border border-orange-500/50 bg-[#161a25] px-4 py-2.5 shadow-lg shadow-orange-500/15">
                <div className="relative size-11 overflow-hidden rounded-full border-2 border-orange-500 shadow-md">
                  <img
                    src={CEO_AGENTE_DATA.avatarUrl}
                    alt="CEO de IA"
                    className="size-full object-cover object-top"
                  />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs font-bold text-white">CEO de IA</span>
                  <Crown className="size-3 text-amber-400 fill-amber-400" />
                </div>
                <span className="text-[10px] text-neutral-400">Orquestra o enxame</span>
              </div>

              {/* Vertical connector down from CEO */}
              <div className="h-4 w-px bg-orange-500/60" />

              {/* Horizontal bar */}
              <div className="relative w-[92%] border-t border-orange-500/40">
                {/* 6 Drop pins */}
                <div className="grid grid-cols-6 w-full">
                  {EQUIPE_AGENTES_DATA.filter((a) => a.id !== "ceo").map((a) => (
                    <div key={a.id} className="flex flex-col items-center">
                      <div className="h-3 w-px bg-orange-500/40" />
                      <div className="flex flex-col items-center pt-1 text-center">
                        <div
                          className={cn(
                            "flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#111723] transition-transform hover:scale-110",
                            a.cor,
                          )}
                        >
                          <a.iconeEnxame className="size-4" />
                        </div>
                        <p className="mt-1.5 truncate text-[10px] font-bold text-white max-w-[64px]">
                          {a.nome}
                        </p>
                        <p className="text-[9px] text-neutral-400">{a.subtituloEnxame}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. PLANO SEMANAL + FLUXO OPERACIONAL + METAS E RESULTADOS
           ========================================================================= */}
        <section className="grid gap-6 xl:grid-cols-3">
          
          {/* 5.1 Plano semanal de prospecção */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <Calendar className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    Plano semanal de prospecção
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Atividades e canais que os agentes vão executar esta semana.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] transition-colors hover:text-[#ff7836]"
              >
                <span>Ver agenda completa</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1b2232] text-[10px] uppercase tracking-wider text-neutral-400">
                    <th className="pb-2.5 font-medium">Dia</th>
                    <th className="pb-2.5 font-medium">Nicho / Segmento</th>
                    <th className="pb-2.5 font-medium">Canais</th>
                    <th className="pb-2.5 font-medium">Meta de leads</th>
                    <th className="pb-2.5 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161c28]">
                  {PLANO_SEMANAL_DATA.map((row) => (
                    <tr key={row.dia} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-2.5 font-semibold text-neutral-200">{row.dia}</td>
                      <td className="py-2.5 text-neutral-300 font-medium">{row.nicho}</td>
                      <td className="py-2.5 text-neutral-400">{row.canais}</td>
                      <td className="py-2.5 font-medium text-neutral-200">{row.metaLeads}</td>
                      <td className="py-2.5 text-right">
                        {row.status === "concluido" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <Check className="size-3" />
                            <span>Concluído</span>
                          </span>
                        ) : row.status === "em_andamento" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                            <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span>Em andamento</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            <Clock className="size-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5.2 Fluxo de operação comercial */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-5 flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                <Filter className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-white">
                  Fluxo de operação comercial
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Do primeiro contato ao cliente fechado, com agentes especializados.
                </p>
              </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="flex items-center justify-between gap-1 pt-2">
              {FLUXO_OPERACAO_DATA.map((passo, idx) => (
                <React.Fragment key={passo.id}>
                  <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border transition-transform hover:scale-105",
                        passo.corBadge,
                      )}
                    >
                      <passo.icon className="size-5" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-white">{passo.titulo}</p>
                    <p className="text-[10px] text-neutral-300 font-medium">{passo.sub1}</p>
                    <p className="text-[9px] text-neutral-500">{passo.sub2}</p>
                  </div>

                  {idx < FLUXO_OPERACAO_DATA.length - 1 && (
                    <ChevronRight className="size-4 shrink-0 text-neutral-600 mb-6" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 5.3 Metas e resultados */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <Target className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    Metas e resultados
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Acompanhamento de desempenho da operação.
                  </p>
                </div>
              </div>

              {/* Period dropdown */}
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                <span>{periodoMetas}</span>
                <ChevronDown className="size-3 text-neutral-500" />
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4 pt-1">
              {METAS_RESULTADOS_DATA.map((m) => (
                <div key={m.rotulo}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <m.icon className="size-3.5 text-neutral-500" />
                      <span>{m.rotulo}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-neutral-200">
                        {m.atual.toLocaleString("pt-BR")} / {m.meta.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-neutral-400 text-[11px]">({m.porcentagem}%)</span>
                    </div>
                  </div>
                  {/* Progress bar line */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-[#f95d14] transition-all duration-500"
                      style={{ width: `${m.porcentagem}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. ATIVIDADES RECENTES + CAPACIDADES E INTEGRAÇÕES
           ========================================================================= */}
        <section className="grid gap-6 xl:grid-cols-2">
          
          {/* 6.1 Atividades recentes */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <Zap className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    Atividades recentes
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Últimas ações dos agentes na sua operação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] transition-colors hover:text-[#ff7836]"
              >
                <span>Ver todas</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* 2x2 Grid of Activities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ATIVIDADES_RECENTES_DATA.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-xl border border-[#1b2232] bg-[#0e131d]/90 p-3.5 transition-all hover:border-white/15"
                >
                  <div className="size-9 shrink-0 overflow-hidden rounded-full border border-white/10">
                    <img
                      src={act.avatarUrl}
                      alt={act.agente}
                      className="size-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-xs font-bold", act.corBadge)}>
                        {act.agente}
                      </span>
                      <span className="text-[10px] text-neutral-500">{act.tempo}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-300">
                      {act.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6.2 Capacidades e integrações (Copiloto) */}
          <div className={cn(PANEL_CLASS, "p-5")}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <Layers className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-wide text-white">
                    Capacidades e integrações (Copiloto)
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Os agentes utilizam IA avançada, memória e integrações para executar com autonomia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] transition-colors hover:text-[#ff7836]"
              >
                <span>Ver configurações</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAPACIDADES_DATA.map((cap) => {
                const conf = ICONES_CAPACIDADE[cap.iconId];
                const IconComponent = conf.icon;
                return (
                  <div
                    key={cap.id}
                    className="flex items-start gap-3 rounded-xl border border-[#1b2232] bg-[#0e131d]/90 p-3.5 transition-all hover:border-white/15"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                        conf.bg,
                        conf.cor,
                      )}
                    >
                      <IconComponent className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">{cap.titulo}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                        {cap.texto}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </div>
      )}
    </div>
  );
}
