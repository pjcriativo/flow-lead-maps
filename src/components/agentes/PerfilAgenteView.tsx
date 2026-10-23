// Tela 03 — Perfil do Agente
// Reprodução fiel, de altíssima precisão e responsiva da referência aprovada.
import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  Globe,
  Handshake,
  Heart,
  Layers,
  Lightbulb,
  MessageSquare,
  MoreVertical,
  Play,
  Save,
  Search,
  Settings,
  Settings2,
  ShieldAlert,
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
import { PERFIS_CATALOGO, type PerfilAgenteCompleto } from "./perfil-data";
import { LimitesRestricoesModal } from "./LimitesRestricoesModal";

interface PerfilAgenteViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarFluxos?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

export function PerfilAgenteView({
  agenteId = "ceo",
  onVoltar,
  onNavegarEquipe,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarFluxos,
}: PerfilAgenteViewProps) {
  const [perfil, setPerfil] = useState<PerfilAgenteCompleto>(
    PERFIS_CATALOGO[agenteId] || PERFIS_CATALOGO.ceo,
  );
  const [abaAtiva, setAbaAtiva] = useState<string>("visao_geral");
  const [editandoIdentidade, setEditandoIdentidade] = useState(false);
  const [editandoMetas, setEditandoMetas] = useState(false);
  const [modalLimitesAberto, setModalLimitesAberto] = useState(false);
  const [mensagemSalvo, setMensagemSalvo] = useState(false);
  const [serieAtiva, setSerieAtiva] = useState<"todas" | "leads" | "reunioes" | "vendas">("todas");
  const [periodoGrafico, setPeriodoGrafico] = useState("30 dias");

  // Feedback demonstrativo ao salvar
  const handleSalvar = () => {
    setMensagemSalvo(true);
    setEditandoIdentidade(false);
    setEditandoMetas(false);
    setTimeout(() => setMensagemSalvo(false), 3000);
  };

  const handleTogglePermissao = (id: string) => {
    setPerfil((prev) => ({
      ...prev,
      permissoes: prev.permissoes.map((p) =>
        p.id === id ? { ...p, ativo: !p.ativo } : p,
      ),
    }));
  };

  const handleUpdateSlider = (campo: keyof typeof perfil.personalidade, valor: number) => {
    setPerfil((prev) => ({
      ...prev,
      personalidade: {
        ...prev.personalidade,
        [campo]: valor,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      <div className="mx-auto max-w-[1680px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 space-y-6">

        {/* =========================================================================
            1. CABEÇALHO DA TELA 03
           ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {onVoltar ? (
              <button
                type="button"
                onClick={onVoltar}
                title="Voltar à tela anterior"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#121620] text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f95d14] text-sm font-bold text-white shadow-lg shadow-orange-600/20">
                03
              </span>
            )}

            <div>
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
              >
                <span>Agentes &amp; Automações</span>
                <ChevronRight className="size-3 text-neutral-500" />
                <button
                  type="button"
                  onClick={onNavegarEquipe}
                  className="hover:text-white transition-colors"
                >
                  Perfis
                </button>
                <ChevronRight className="size-3 text-neutral-500" />
                <span className="text-neutral-200 font-semibold">{perfil.nome}</span>
              </nav>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Perfil do Agente
              </h1>
              <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                Identidade, configuração, autonomia, treinamento e desempenho.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {mensagemSalvo && (
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 animate-in fade-in">
                <Check className="size-3.5" />
                <span>Alterações salvas localmente</span>
              </span>
            )}

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Copy className="size-4 text-neutral-400" />
              <span>Duplicar agente</span>
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Play className="size-4 text-[#f95d14] fill-[#f95d14]" />
              <span>Testar agente</span>
            </button>

            <button
              type="button"
              onClick={handleSalvar}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f95d14] px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#ff6c26]"
            >
              <Save className="size-4" />
              <span>Salvar alterações</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. HERO CARD — IDENTIDADE SUPERIOR + 7 INDICADORES
           ========================================================================= */}
        <section className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-[#0c1017] p-6 shadow-2xl shadow-orange-950/20">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.5fr)]">
            
            {/* Lado Esquerdo: Perfil do CEO */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar com coroa e ícone de câmera */}
              <div className="relative shrink-0">
                <div className="relative size-32 overflow-hidden rounded-2xl border-2 border-orange-500/60 shadow-xl shadow-orange-500/20 sm:size-36">
                  <img
                    src={perfil.avatarUrl}
                    alt={perfil.nome}
                    className="size-full object-cover object-top"
                  />
                  {/* Overlay gradiente inferior */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>

                {/* Ícone de Coroa */}
                {perfil.isCeo && (
                  <div className="absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-lg bg-amber-400 text-black shadow-md">
                    <Crown className="size-4 fill-black" />
                  </div>
                )}

                {/* Câmera overlay para trocar avatar */}
                <button
                  type="button"
                  title="Alterar foto do agente"
                  className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-black/80 text-white backdrop-blur-md hover:bg-neutral-800"
                >
                  <Camera className="size-3.5" />
                </button>
              </div>

              {/* Informações Centrais */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>{perfil.nome}</span>
                    {perfil.isCeo && <Crown className="size-5 text-amber-400 fill-amber-400" />}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{perfil.status}</span>
                  </span>
                </div>

                <p className="mt-1 text-xs font-semibold text-neutral-300">
                  {perfil.cargo}
                </p>

                <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                  {perfil.descricao}
                </p>

                {/* Tags de especialidade */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {perfil.tags.map((tag) => (
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

            {/* Lado Direito: Grid de 7 Indicadores Superiores */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {perfil.indicadores.map((ind, idx) => {
                const isLarge = idx === 6; // Custo estimado
                return (
                  <div
                    key={ind.id}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md",
                      isLarge && "sm:col-span-2",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-neutral-400 truncate">
                        {ind.rotulo}
                      </span>
                      <div className={cn("flex size-6 items-center justify-center rounded-lg border", ind.corBg, ind.corIcone)}>
                        <ind.icon className="size-3.5" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-base font-bold text-white tracking-tight">
                        {ind.valor}
                      </span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{ind.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* =========================================================================
            3. NAVEGAÇÃO INTERNA DO PERFIL (Pill Tabs)
           ========================================================================= */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#1b2232] pb-3 scrollbar-none">
          {[
            { id: "visao_geral", label: "Visão Geral" },
            { id: "configuracoes", label: "Configurações" },
            { id: "treinamento", label: "Treinamento" },
            { id: "memoria", label: "Memória" },
            { id: "skills", label: "Skills" },
            { id: "fluxos", label: "Fluxos" },
            { id: "voz", label: "Voz" },
            { id: "metas", label: "Metas" },
            { id: "autonomia", label: "Autonomia" },
            { id: "historico", label: "Histórico" },
          ].map((tab) => {
            const ativa = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "treinamento" && onNavegarTreinamento) {
                    onNavegarTreinamento();
                  } else if (tab.id === "memoria" && onNavegarMemoria) {
                    onNavegarMemoria();
                  } else if (tab.id === "skills" && onNavegarSkills) {
                    onNavegarSkills();
                  } else if (tab.id === "fluxos" && onNavegarFluxos) {
                    onNavegarFluxos();
                  } else {
                    setAbaAtiva(tab.id);
                  }
                }}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                  ativa
                    ? "bg-[#f95d14] text-white shadow-md shadow-orange-600/25"
                    : "bg-[#121620] text-neutral-400 border border-white/5 hover:border-white/10 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            4. LAYOUT EM TRÊS COLUNAS (Fiel à Imagem Aprovada)
           ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* =======================================================================
              4.1 COLUNA ESQUERDA (3 colunas / ~26%)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* Card Identidade */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Identidade</h3>
                <button
                  type="button"
                  onClick={() => setEditandoIdentidade(!editandoIdentidade)}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  <Edit2 className="size-3" />
                  <span>{editandoIdentidade ? "Fechar" : "Editar"}</span>
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Nome do agente
                  </label>
                  {editandoIdentidade ? (
                    <input
                      type="text"
                      value={perfil.nome}
                      onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#1b2232] bg-[#111723] p-2 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-0.5 font-bold text-white">{perfil.nome}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Cargo
                  </label>
                  {editandoIdentidade ? (
                    <input
                      type="text"
                      value={perfil.cargo}
                      onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#1b2232] bg-[#111723] p-2 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-0.5 text-neutral-300">{perfil.cargo}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Departamento
                  </label>
                  {editandoIdentidade ? (
                    <input
                      type="text"
                      value={perfil.departamento}
                      onChange={(e) => setPerfil({ ...perfil, departamento: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#1b2232] bg-[#111723] p-2 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-0.5 text-neutral-300">{perfil.departamento}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Especialidade
                  </label>
                  {editandoIdentidade ? (
                    <input
                      type="text"
                      value={perfil.especialidade}
                      onChange={(e) => setPerfil({ ...perfil, especialidade: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#1b2232] bg-[#111723] p-2 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-0.5 text-neutral-300">{perfil.especialidade}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Descrição
                  </label>
                  {editandoIdentidade ? (
                    <textarea
                      rows={3}
                      value={perfil.descricao}
                      onChange={(e) => setPerfil({ ...perfil, descricao: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#1b2232] bg-[#111723] p-2 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-0.5 leading-relaxed text-neutral-400">{perfil.descricao}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card Personalidade */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <h3 className="mb-4 text-sm font-bold text-white">Personalidade</h3>

              <div className="space-y-3.5 text-xs">
                {[
                  { id: "analitico", label: "Analítico", val: perfil.personalidade.analitico },
                  { id: "estrategico", label: "Estratégico", val: perfil.personalidade.estrategico },
                  { id: "comunicativo", label: "Comunicativo", val: perfil.personalidade.comunicativo },
                  { id: "decisivo", label: "Decisivo", val: perfil.personalidade.decisivo },
                  { id: "inovador", label: "Inovador", val: perfil.personalidade.inovador },
                ].map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-neutral-300">{item.label}</span>
                      <span className="font-semibold text-neutral-200">{item.val}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[#f95d14] transition-all duration-300"
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Tom de comunicação
                  </label>
                  <select
                    value={perfil.personalidade.tom}
                    onChange={(e) =>
                      setPerfil({
                        ...perfil,
                        personalidade: { ...perfil.personalidade, tom: e.target.value },
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#121620] p-2.5 text-xs text-neutral-200 focus:border-[#f95d14] focus:outline-none"
                  >
                    <option value="Profissional e consultivo">Profissional e consultivo</option>
                    <option value="Executivo">Executivo</option>
                    <option value="Amigável">Amigável</option>
                    <option value="Persuasivo">Persuasivo</option>
                    <option value="Técnico">Técnico</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* =======================================================================
              4.2 COLUNA CENTRAL (6 colunas / ~48%)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-6">
            
            {/* Card Desempenho (Gráfico de Linhas) */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">Desempenho (últimos 30 dias)</h3>

                <div className="flex items-center gap-3">
                  {/* Legend Pills */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSerieAtiva("leads")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium transition-colors",
                        serieAtiva === "leads" || serieAtiva === "todas"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "text-neutral-500",
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-blue-400" />
                      <span>Leads</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSerieAtiva("reunioes")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium transition-colors",
                        serieAtiva === "reunioes" || serieAtiva === "todas"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-neutral-500",
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span>Reuniões</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSerieAtiva("vendas")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium transition-colors",
                        serieAtiva === "vendas" || serieAtiva === "todas"
                          ? "bg-[#f95d14]/15 text-[#f95d14] border border-[#f95d14]/30"
                          : "text-neutral-500",
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-[#f95d14]" />
                      <span>Vendas</span>
                    </button>
                  </div>

                  {/* Period Selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                    <span>{periodoGrafico}</span>
                    <ChevronDown className="size-3 text-neutral-500" />
                  </div>
                </div>
              </div>

              {/* Smooth Vector Line Chart */}
              <div className="relative mt-2 h-52 w-full">
                <svg
                  className="size-full overflow-visible"
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="gradReunioes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f95d14" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f95d14" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="30" x2="600" y2="30" stroke="#1b2232" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="600" y2="75" stroke="#1b2232" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="#1b2232" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="165" x2="600" y2="165" stroke="#1b2232" strokeWidth="1" />

                  {/* Series 1: Leads (Blue) */}
                  {(serieAtiva === "todas" || serieAtiva === "leads") && (
                    <>
                      <path
                        d="M 20,135 Q 100,85 180,105 T 340,65 T 460,40 T 580,50 L 580,165 L 20,165 Z"
                        fill="url(#gradLeads)"
                      />
                      <path
                        d="M 20,135 Q 100,85 180,105 T 340,65 T 460,40 T 580,50"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                      <circle cx="340" cy="65" r="4" fill="#38bdf8" />
                    </>
                  )}

                  {/* Series 2: Reuniões (Green) */}
                  {(serieAtiva === "todas" || serieAtiva === "reunioes") && (
                    <>
                      <path
                        d="M 20,150 Q 100,120 180,130 T 340,110 T 460,95 T 580,100"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                      />
                      <circle cx="340" cy="110" r="4" fill="#34d399" />
                    </>
                  )}

                  {/* Series 3: Vendas (Orange) */}
                  {(serieAtiva === "todas" || serieAtiva === "vendas") && (
                    <>
                      <path
                        d="M 20,160 Q 100,145 180,150 T 340,135 T 460,125 T 580,130"
                        fill="none"
                        stroke="#f95d14"
                        strokeWidth="2.5"
                      />
                      <circle cx="340" cy="135" r="4" fill="#f95d14" />
                    </>
                  )}

                  {/* Active Tooltip simulation on point 18/10 (x=340) */}
                  <line x1="340" y1="20" x2="340" y2="165" stroke="#f95d14" strokeWidth="1" strokeDasharray="2 2" />
                </svg>

                {/* Floating Tooltip Box matching image */}
                <div className="absolute left-[54%] top-[18%] -translate-x-1/2 rounded-xl border border-white/10 bg-[#121620]/95 p-2.5 text-[11px] shadow-2xl backdrop-blur-md">
                  <p className="font-semibold text-neutral-400 pb-1 border-b border-white/5">18/10</p>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between gap-3 text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-blue-400" /> Leads
                      </span>
                      <span className="font-bold text-white">128</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-400" /> Reuniões
                      </span>
                      <span className="font-bold text-white">42</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-[#f95d14]" /> Vendas
                      </span>
                      <span className="font-bold text-white">18</span>
                    </div>
                  </div>
                </div>

                {/* Axis Labels */}
                <div className="mt-2 flex justify-between text-[10px] text-neutral-500 font-medium">
                  <span>01/10</span>
                  <span>05/10</span>
                  <span>10/10</span>
                  <span>15/10</span>
                  <span className="text-[#f95d14] font-bold">18/10</span>
                  <span>20/10</span>
                  <span>25/10</span>
                  <span>30/10</span>
                </div>
              </div>
            </div>

            {/* Card Agentes Coordenados */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Agentes coordenados</h3>
                <button
                  type="button"
                  onClick={onNavegarEquipe}
                  className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] hover:text-[#ff7836]"
                >
                  <span>Ver equipe</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  {
                    nome: "Prospecção",
                    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
                    status: "Online",
                    tarefas: "127 tarefas",
                    corStatus: "text-emerald-400",
                  },
                  {
                    nome: "SDR",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
                    status: "Trabalhando",
                    tarefas: "93 tarefas",
                    corStatus: "text-blue-400",
                  },
                  {
                    nome: "Vendedor",
                    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
                    status: "Online",
                    tarefas: "57 tarefas",
                    corStatus: "text-emerald-400",
                  },
                  {
                    nome: "Estrategista",
                    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
                    status: "Online",
                    tarefas: "61 tarefas",
                    corStatus: "text-emerald-400",
                  },
                  {
                    nome: "SEO Geral",
                    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
                    status: "Em execução",
                    tarefas: "48 tarefas",
                    corStatus: "text-purple-400",
                  },
                  {
                    nome: "Gerente Comercial",
                    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
                    status: "Online",
                    tarefas: "36 tarefas",
                    corStatus: "text-emerald-400",
                  },
                ].map((ag) => (
                  <div
                    key={ag.nome}
                    className="flex flex-col items-center rounded-xl border border-white/5 bg-[#121620] p-3 text-center transition-all hover:border-white/20"
                  >
                    <div className="relative size-12 overflow-hidden rounded-full border border-white/10">
                      <img src={ag.avatar} alt={ag.nome} className="size-full object-cover object-top" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-white truncate max-w-full">{ag.nome}</p>
                    <span className={cn("mt-1 text-[10px] font-semibold flex items-center gap-1", ag.corStatus)}>
                      <span className="size-1 rounded-full bg-current" />
                      {ag.status}
                    </span>
                    <span className="mt-2 text-[10px] text-neutral-400">{ag.tarefas}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Atividades Recentes */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Atividades recentes</h3>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-[#f95d14] hover:text-[#ff7836]"
                >
                  <span>Ver todas</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="divide-y divide-[#161c28]">
                {perfil.atividadesRecentes.map((act) => (
                  <div key={act.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 shrink-0 overflow-hidden rounded-full border border-white/10">
                        <img src={act.avatarUrl} alt={act.agente} className="size-full object-cover object-top" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          <span className="font-bold text-[#f95d14]">{act.agente}</span> {act.acao}
                        </p>
                        <p className="truncate text-[11px] text-neutral-500">{act.detalhe}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">{act.horario}</span>
                      <button type="button" className="text-neutral-500 hover:text-white">
                        <MoreVertical className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* =======================================================================
              4.3 COLUNA DIREITA (3 colunas / ~26%)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* Card Metas do Agente */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Metas do agente</h3>
                <button
                  type="button"
                  onClick={() => setEditandoMetas(!editandoMetas)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10"
                >
                  {editandoMetas ? "Concluir" : "Editar metas"}
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {perfil.metas.map((m, idx) => (
                  <div key={m.rotulo}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <m.icon className="size-3.5 text-neutral-400" />
                        <span>{m.rotulo}</span>
                      </span>
                      <span className="font-semibold text-neutral-200">
                        {m.unidade ? `${m.unidade} ` : ""}
                        {m.atual.toLocaleString("pt-BR")} / {m.meta.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", m.corBarra)}
                          style={{ width: `${m.porcentagem}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400 w-8 text-right">
                        {m.porcentagem}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Autonomia e Permissões */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Autonomia e Permissões</h3>
                <button
                  type="button"
                  onClick={() => setModalLimitesAberto(true)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10"
                >
                  Configurar
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {perfil.permissoes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <span className="text-neutral-300 leading-tight">{p.label}</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePermissao(p.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        p.ativo ? "bg-emerald-500" : "bg-neutral-700",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          p.ativo ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Limites e Restrições */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-rose-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Limites e Restrições
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setModalLimitesAberto(true)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10"
                >
                  Configurar
                </button>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Defina limites de orçamento, aprovações obrigatórias e restrições de execução para este agente.
              </p>

              <div className="mt-3 space-y-1.5 border-t border-rose-500/20 pt-2.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Teto mensal:</span>
                  <span className="font-semibold text-white">{perfil.limites.orcamentoMensal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Tarefas/dia:</span>
                  <span className="font-semibold text-white">{perfil.limites.limiteTarefasDia} ações</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Modo:</span>
                  <span className="font-semibold text-orange-400">{perfil.limites.autonomiaOperacional}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modal de Limites e Restrições */}
      <LimitesRestricoesModal
        aberto={modalLimitesAberto}
        onFechar={() => setModalLimitesAberto(false)}
        limitesIniciais={perfil.limites}
        onSalvar={(novos) => setPerfil((prev) => ({ ...prev, limites: novos }))}
      />
    </div>
  );
}
