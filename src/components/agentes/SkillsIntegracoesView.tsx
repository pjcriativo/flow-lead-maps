// Tela 06 — Skills & Integrações
// Central de capacidades operacionais, ferramentas internas, APIs e MCP dos agentes de IA com fidelidade absoluta ao layout aprovado.
import React, { useState, useMemo } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  CreditCard,
  Crown,
  Database,
  DollarSign,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Globe,
  HardDrive,
  HelpCircle,
  Layers,
  LayoutGrid,
  Lightbulb,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Network,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  User,
  Users,
  Video,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_SKILLS,
  SKILLS_INICIAIS,
  INTEGRACOES_INTERNAS_INICIAIS,
  APIS_CONECTORES_INICIAIS,
  MCP_CONECTORES_INICIAIS,
  LOGS_INTEGRACOES_INICIAIS,
  USO_APIS_DONUT,
  SUGESTOES_INTEGRACOES_INICIAIS,
  type SkillItem,
  type IntegracaoInternaItem,
  type ApiConectorItem,
  type McpConectorItem,
  type LogIntegracaoItem,
  type SugestaoIntegracaoItem,
} from "./skills-data";
import { AdicionarSkillModal } from "./AdicionarSkillModal";
import { ConectarApiModal } from "./ConectarApiModal";
import { ConfigurarMcpModal } from "./ConfigurarMcpModal";
import { TestarIntegracoesModal } from "./TestarIntegracoesModal";

interface SkillsIntegracoesViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarFluxos?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

// Ícones dedicados das APIs e Conectores
function getApiIcone(id: string) {
  switch (id) {
    case "openai":
      return <Bot className="size-4 text-emerald-400" />;
    case "google":
      return <Globe className="size-4 text-blue-400" />;
    case "whatsapp":
      return <MessageSquare className="size-4 text-emerald-400" />;
    case "maps":
      return <Target className="size-4 text-purple-400" />;
    case "obsidian":
      return <Database className="size-4 text-purple-400" />;
    case "notion":
      return <BookOpen className="size-4 text-neutral-300" />;
    default:
      return <Code className="size-4 text-neutral-400" />;
  }
}

// Ícones dos Logs
function getLogIcone(id: string) {
  switch (id) {
    case "whatsapp":
      return <MessageSquare className="size-3.5 text-emerald-400" />;
    case "drive":
      return <HardDrive className="size-3.5 text-amber-400" />;
    case "openai":
      return <Sparkles className="size-3.5 text-purple-400" />;
    case "maps":
      return <Target className="size-3.5 text-blue-400" />;
    case "notion":
      return <BookOpen className="size-3.5 text-neutral-300" />;
    default:
      return <Activity className="size-3.5 text-neutral-400" />;
  }
}

// Ícones das Sugestões
function getSugestaoIcone(id: string) {
  switch (id) {
    case "slack":
      return <MessageSquare className="size-3.5 text-rose-400" />;
    case "meet":
      return <Video className="size-3.5 text-amber-400" />;
    case "calendly":
      return <Calendar className="size-3.5 text-blue-400" />;
    case "hubspot":
      return <Target className="size-3.5 text-orange-400" />;
    case "mailchimp":
      return <Mail className="size-3.5 text-yellow-400" />;
    default:
      return <Share2 className="size-3.5 text-neutral-400" />;
  }
}

export function SkillsIntegracoesView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarEquipe,
  onNavegarFluxos,
}: SkillsIntegracoesViewProps) {
  // Estados de dados locais
  const [skills, setSkills] = useState<SkillItem[]>(SKILLS_INICIAIS);
  const [integracoesInternas, setIntegracoesInternas] = useState<IntegracaoInternaItem[]>(INTEGRACOES_INTERNAS_INICIAIS);
  const [apis, setApis] = useState<ApiConectorItem[]>(APIS_CONECTORES_INICIAIS);
  const [logs, setLogs] = useState<LogIntegracaoItem[]>(LOGS_INTEGRACOES_INICIAIS);
  const [periodoDonut, setPeriodoDonut] = useState("Últimos 30 dias");

  // Modais
  const [modalSkillAberto, setModalSkillAberto] = useState(false);
  const [modalApiAberto, setModalApiAberto] = useState(false);
  const [apiSelecionada, setApiSelecionada] = useState<ApiConectorItem | null>(null);
  const [modalMcpAberto, setModalMcpAberto] = useState(false);
  const [modalTestesAberto, setModalTestesAberto] = useState(false);

  // Feedback demonstrativo em toast
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const dispararToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  const handleToggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ativo: !s.ativo } : s)),
    );
  };

  const handleToggleInterna = (id: string) => {
    setIntegracoesInternas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ativo: !i.ativo } : i)),
    );
  };

  const handleAdicionarNovaSkill = (nova: SkillItem) => {
    setSkills((prev) => [nova, ...prev]);
    dispararToast(`Skill "${nova.nome}" adicionada ao catálogo demonstrativo!`);
  };

  const handleAtualizarStatusApi = (
    id: string,
    novoStatus: "conectado" | "configurar" | "nao_conectado",
  ) => {
    setApis((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: novoStatus,
              statusRotulo:
                novoStatus === "conectado"
                  ? "Conectado"
                  : novoStatus === "configurar"
                  ? "Configurar"
                  : "Não conectado",
            }
          : a,
      ),
    );
    dispararToast("Status do conector atualizado localmente");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      <div className="mx-auto max-w-[1680px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 space-y-6">

        {/* =========================================================================
            1. CABEÇALHO DA TELA 06
           ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {onVoltar ? (
              <button
                type="button"
                onClick={onVoltar}
                title="Voltar ao Perfil"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#121620] text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f95d14] text-sm font-bold text-white shadow-lg shadow-orange-600/20">
                06
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
                  Perfil
                </button>
                <ChevronRight className="size-3 text-neutral-500" />
                <button
                  type="button"
                  onClick={onNavegarPerfil}
                  className="hover:text-white transition-colors"
                >
                  CEO de IA
                </button>
                <ChevronRight className="size-3 text-neutral-500" />
                <span className="text-neutral-200 font-semibold">Skills &amp; Integrações</span>
              </nav>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Skills &amp; Integrações
              </h1>
              <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                Habilidades, ferramentas, APIs e conectores do agente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {toastFeedback && (
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 animate-in fade-in">
                <Check className="size-3.5" />
                <span>{toastFeedback}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setModalTestesAberto(true)}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <ShieldCheck className="size-4 text-neutral-400" />
              <span>Testar integrações</span>
            </button>

            <button
              type="button"
              onClick={() => dispararToast("Manual e documentação de conectores exibidos")}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <BookOpen className="size-4 text-neutral-400" />
              <span>Ver documentação</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setApiSelecionada(apis[0]);
                setModalApiAberto(true);
              }}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f95d14] px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#ff6c26]"
            >
              <Plus className="size-4" />
              <span>Adicionar integração</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. HERO CARD — CARD PRINCIPAL DO AGENTE + 6 INDICADORES
           ========================================================================= */}
        <section className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-[#0c1017] p-6 shadow-2xl shadow-orange-950/20">
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
                  Utiliza habilidades e integrações para planejar, coordenar e executar toda a operação comercial com autonomia supervisionada e segurança.
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Estratégia", "Gestão Comercial", "Integrações", "Automação"].map((tag) => (
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
              {INDICADORES_SUPERIORES_SKILLS.map((ind) => {
                if (ind.tipo === "atualizacao") {
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
                      <div className="mt-2">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {ind.valor}
                        </span>
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
                        <span className="text-xs font-bold text-emerald-400">{ind.valor}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${ind.porcentagem}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400">{ind.sub}</p>
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
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">{ind.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* =========================================================================
            3. NAVEGAÇÃO DO PERFIL (Pill Tabs com Skills Ativa)
           ========================================================================= */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#1b2232] pb-3 scrollbar-none">
          {[
            { id: "visao_geral", label: "Visão Geral", action: onNavegarPerfil },
            { id: "configuracoes", label: "Configurações" },
            { id: "treinamento", label: "Treinamento", action: onNavegarTreinamento },
            { id: "memoria", label: "Memória", action: onNavegarMemoria },
            { id: "skills", label: "Skills", ativo: true },
            { id: "fluxos", label: "Fluxos", action: onNavegarFluxos },
            { id: "voz", label: "Voz" },
            { id: "metas", label: "Metas" },
            { id: "autonomia", label: "Autonomia" },
            { id: "historico", label: "Histórico" },
          ].map((tab) => {
            const isAtivo = tab.ativo;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.action) tab.action();
                }}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                  isAtivo
                    ? "bg-[#f95d14] text-white shadow-md shadow-orange-600/25 ring-1 ring-orange-500"
                    : "bg-[#121620] text-neutral-400 border border-white/5 hover:border-white/10 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            4. CORPO PRINCIPAL — DISTRIBUIÇÃO EM DUAS COLUNAS
           ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* =======================================================================
              4.1 COLUNA ESQUERDA (8 colunas / ~66%) — SKILLS E INTEGRAÇÕES INTERNAS
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-8">
            
            {/* Bloco 1: Skills do Agente */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Skills do Agente</h3>
                  <p className="text-[11px] text-neutral-400">
                    Habilidades e capacidades ativas do CEO de IA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalSkillAberto(true)}
                  className="flex items-center gap-1 self-start sm:self-auto rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="size-3" />
                  <span>Adicionar skill</span>
                </button>
              </div>

              {/* Grid 2x3 de Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/80 p-3.5 transition-all hover:border-white/15 hover:bg-[#181e2b]"
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-2">
                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", skill.corBg, skill.corIcone)}>
                        <skill.icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">
                          {skill.nome}
                        </p>
                        <p className="truncate text-[11px] text-neutral-400 mt-0.5">
                          {skill.descricao}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSkill(skill.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                        skill.ativo ? "bg-emerald-500" : "bg-neutral-800",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                          skill.ativo ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 2: Integrações Internas (Flow Business) */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white">Integrações Internas (Flow Business)</h3>
                <p className="text-[11px] text-neutral-400">
                  Acesso aos módulos e dados da plataforma.
                </p>
              </div>

              {/* Grid 2x3 de Módulos Internos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {integracoesInternas.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/80 p-3.5 transition-all hover:border-white/15 hover:bg-[#181e2b]"
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-2">
                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", item.corBg, item.corIcone)}>
                        <item.icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">
                          {item.nome}
                        </p>
                        <p className="truncate text-[11px] text-neutral-400 mt-0.5">
                          {item.descricao}
                        </p>
                        {item.statusRotulo && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-0.5">
                            <span className="size-1 rounded-full bg-emerald-400" />
                            <span>{item.statusRotulo}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleInterna(item.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                        item.ativo ? "bg-emerald-500" : "bg-neutral-800",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                          item.ativo ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* =======================================================================
              4.2 COLUNA DIREITA (4 colunas / ~34%) — APIS EXTERNAS E MCP
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-4">
            
            {/* Bloco APIs e Conectores */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">APIs e Conectores</h3>
                  <p className="text-[11px] text-neutral-400">
                    Integrações com ferramentas e serviços externos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setApiSelecionada(apis[0]);
                    setModalApiAberto(true);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="size-3" />
                  <span>Conectar</span>
                </button>
              </div>

              <div className="space-y-2">
                {apis.map((api) => {
                  const isConectado = api.status === "conectado";
                  const isConfigurar = api.status === "configurar";

                  return (
                    <div
                      key={api.id}
                      onClick={() => {
                        setApiSelecionada(api);
                        setModalApiAberto(true);
                      }}
                      className="group flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/80 p-2.5 transition-all hover:border-white/15 hover:bg-[#181e2b] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40">
                          {getApiIcone(api.iconId)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-neutral-200 group-hover:text-white">
                            {api.nome}
                          </p>
                          <p className="truncate text-[10px] text-neutral-400">
                            {api.descricao}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                            isConectado
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isConfigurar
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                              : "bg-neutral-800 text-neutral-400 border-neutral-700",
                          )}
                        >
                          {api.statusRotulo}
                        </span>
                        <MoreVertical className="size-3.5 text-neutral-500 group-hover:text-neutral-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bloco MCP (Model Context Protocol) */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">MCP (Model Context Protocol)</h3>
                  <p className="text-[11px] text-neutral-400">
                    Conectores avançados para acesso a dados e ferramentas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalMcpAberto(true)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  Configurar
                </button>
              </div>

              <div className="space-y-2">
                {MCP_CONECTORES_INICIAIS.map((mcp) => (
                  <div
                    key={mcp.id}
                    onClick={() => setModalMcpAberto(true)}
                    className="group flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/80 p-2.5 transition-all hover:border-white/15 hover:bg-[#181e2b] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40 text-neutral-400 group-hover:text-white">
                        <mcp.icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-neutral-200 group-hover:text-white">
                          {mcp.nome}
                        </p>
                        <p className="truncate text-[10px] text-neutral-400">
                          {mcp.descricao}
                        </p>
                      </div>
                    </div>

                    <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 shrink-0">
                      Em breve
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================================
            5. LINHA INFERIOR (3 CARDS): LOGS + USO DE APIS + SUGESTÕES
           ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* 5.1 Card Logs de Integrações (~40% / 5 colunas) */}
          <div className={cn(PANEL_CLASS, "p-5 lg:col-span-5")}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Logs de Integrações</h3>
                <p className="text-[11px] text-neutral-400">
                  Últimas atividades das integrações e APIs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispararToast("Histórico completo de logs carregado")}
                className="text-[11px] font-semibold text-[#f95d14] hover:text-[#ff7a38] transition-colors"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/60 p-2.5 text-xs transition-colors hover:border-white/10"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-[11px] font-mono text-neutral-400 shrink-0 whitespace-nowrap">
                      {log.horario}
                    </span>
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40">
                      {getLogIcone(log.iconId)}
                    </div>
                    <span className="truncate text-neutral-200">
                      {log.descricao}
                    </span>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5.2 Card Uso de APIs (Donut Chart ~30% / 4 colunas) */}
          <div className={cn(PANEL_CLASS, "p-5 lg:col-span-4")}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Uso de APIs</h3>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                <span>{periodoDonut}</span>
                <ChevronDown className="size-3 text-neutral-500" />
              </div>
            </div>

            <div className="grid items-center gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
              {/* Donut Chart SVG */}
              <div className="relative flex size-36 mx-auto items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#161c28" strokeWidth="15" />
                  {/* OpenAI 42% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06b6d4" strokeWidth="15" strokeDasharray="100.2 238.7" strokeDashoffset="0" />
                  {/* Google 24% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8b5cf6" strokeWidth="15" strokeDasharray="57.3 238.7" strokeDashoffset="-100.2" />
                  {/* WhatsApp 18% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="15" strokeDasharray="43.0 238.7" strokeDashoffset="-157.5" />
                  {/* Maps 10% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="23.8 238.7" strokeDashoffset="-200.5" />
                  {/* Outros 6% */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="15" strokeDasharray="14.4 238.7" strokeDashoffset="-224.3" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold tracking-tight text-white">1.284</span>
                  <span className="text-[9px] text-neutral-400">requisições</span>
                </div>
              </div>

              {/* Lista dos Provedores */}
              <div className="space-y-1 text-xs">
                {USO_APIS_DONUT.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded px-1.5 py-0.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.cor }} />
                      <span className="text-neutral-300 font-medium">{item.nome}</span>
                    </div>
                    <span className="font-mono text-neutral-400 text-[11px]">{item.porcentagem}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5.3 Card Sugestões de Integrações (~30% / 3 colunas) */}
          <div className={cn(PANEL_CLASS, "p-5 lg:col-span-3")}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Sugestões de Integrações</h3>
              <button
                type="button"
                onClick={() => dispararToast("Catálogo completo de sugestões aberto")}
                className="text-[11px] font-semibold text-[#f95d14] hover:text-[#ff7a38] transition-colors"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-2">
              {SUGESTOES_INTEGRACOES_INICIAIS.map((sug) => (
                <div
                  key={sug.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/60 p-2.5 transition-colors hover:border-white/10"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40">
                      {getSugestaoIcone(sug.iconId)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-neutral-200">
                        {sug.nome}
                      </p>
                      <p className="truncate text-[10px] text-neutral-400">
                        {sug.descricao}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setApiSelecionada({
                        id: sug.id,
                        nome: sug.nome,
                        descricao: sug.descricao,
                        status: "configurar",
                        statusRotulo: "Configurar",
                        iconId: "google",
                      });
                      setModalApiAberto(true);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-[#f95d14] hover:border-orange-500 hover:text-white transition-all shrink-0"
                  >
                    Conectar
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modais */}
      <AdicionarSkillModal
        aberto={modalSkillAberto}
        onFechar={() => setModalSkillAberto(false)}
        onAdicionar={handleAdicionarNovaSkill}
      />

      <ConectarApiModal
        aberto={modalApiAberto}
        conector={apiSelecionada}
        onFechar={() => setModalApiAberto(false)}
        onSalvarStatus={handleAtualizarStatusApi}
      />

      <ConfigurarMcpModal
        aberto={modalMcpAberto}
        onFechar={() => setModalMcpAberto(false)}
      />

      <TestarIntegracoesModal
        aberto={modalTestesAberto}
        onFechar={() => setModalTestesAberto(false)}
      />
    </div>
  );
}
