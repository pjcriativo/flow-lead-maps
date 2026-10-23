// Tela 05 — Memória & Segundo Cérebro
// Centro de conhecimento contextual dos agentes de IA com fidelidade absoluta ao layout aprovado.
import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Database,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  FolderKanban,
  Github,
  Globe,
  HardDrive,
  HelpCircle,
  Layers,
  Lightbulb,
  Link2,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Settings2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_MEMORIA,
  FONTES_MEMORIA_INICIAIS,
  INSIGHTS_MEMORIA_INICIAIS,
  CATEGORIAS_MEMORIA_DONUT,
  MEMORIAS_RECENTES_INICIAIS,
  EXEMPLOS_BUSCA_INTELIGENTE,
  PROXIMAS_ACOES_MEMORIA,
  DETALHAMENTO_ARMAZENAMENTO,
  type FonteMemoriaItem,
  type MemoriaRecenteItem,
} from "./memoria-data";
import { ConectarFonteModal } from "./ConectarFonteModal";
import { DetalhesMemoriaModal } from "./DetalhesMemoriaModal";
import { GerenciarArmazenamentoModal } from "./GerenciarArmazenamentoModal";

interface MemoriaSegundoCerebroViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarEquipe?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

// Ícones dedicados das fontes
function getFonteIcone(id: string) {
  switch (id) {
    case "whatsapp":
      return <MessageSquare className="size-3.5 text-emerald-400" />;
    case "campanhas":
      return <FolderKanban className="size-3.5 text-orange-400" />;
    case "documentos":
      return <FileText className="size-3.5 text-blue-400" />;
    case "obsidian":
      return <Database className="size-3.5 text-purple-400" />;
    case "drive":
      return <HardDrive className="size-3.5 text-amber-400" />;
    case "notion":
      return <BookOpen className="size-3.5 text-neutral-300" />;
    case "github":
      return <Github className="size-3.5 text-neutral-300" />;
    case "email":
      return <Mail className="size-3.5 text-blue-400" />;
    case "reunioes":
      return <Video className="size-3.5 text-rose-400" />;
    default:
      return <Database className="size-3.5 text-neutral-400" />;
  }
}

// Ícones das fontes na tabela
function getTabelaFonteIcone(fonte: string) {
  switch (fonte.toLowerCase()) {
    case "meet":
      return <Video className="size-3 text-cyan-400" />;
    case "whatsapp":
      return <MessageSquare className="size-3 text-emerald-400" />;
    case "obsidian":
      return <Database className="size-3 text-purple-400" />;
    case "crm":
      return <Target className="size-3 text-blue-400" />;
    case "web":
      return <Globe className="size-3 text-amber-400" />;
    case "notion":
      return <BookOpen className="size-3 text-neutral-300" />;
    case "drive":
      return <HardDrive className="size-3 text-emerald-400" />;
    case "docs":
      return <FileText className="size-3 text-blue-400" />;
    default:
      return <Database className="size-3 text-neutral-400" />;
  }
}

export function MemoriaSegundoCerebroView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarEquipe,
}: MemoriaSegundoCerebroViewProps) {
  // Estados de dados locais
  const [fontes, setFontes] = useState<FonteMemoriaItem[]>(FONTES_MEMORIA_INICIAIS);
  const [memorias, setMemorias] = useState<MemoriaRecenteItem[]>(MEMORIAS_RECENTES_INICIAIS);
  const [buscaTabela, setBuscaTabela] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [periodoDonut, setPeriodoDonut] = useState("Últimos 30 dias");

  // Modais
  const [fonteSelecionada, setFonteSelecionada] = useState<FonteMemoriaItem | null>(null);
  const [modalFonteAberto, setModalFonteAberto] = useState(false);
  const [memoriaSelecionada, setMemoriaSelecionada] = useState<MemoriaRecenteItem | null>(null);
  const [modalMemoriaAberto, setModalMemoriaAberto] = useState(false);
  const [modalArmazenamentoAberto, setModalArmazenamentoAberto] = useState(false);

  // Busca Inteligente
  const [perguntaBusca, setPerguntaBusca] = useState("");
  const [respostaBusca, setRespostaBusca] = useState<string | null>(null);

  // 5 Switches de Organização da Memória
  const [switchesOrg, setSwitchesOrg] = useState({
    organizar: true,
    resumos: true,
    insights: true,
    conectar: true,
    limpar: false,
  });

  // Feedback demonstrativo ao salvar ou sincronizar
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const dispararToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  const handleSincronizar = () => {
    dispararToast("Sincronização com o Segundo Cérebro concluída (Demonstração)");
  };

  const handleSalvarAlteracoes = () => {
    dispararToast("Alterações de memória salvas com sucesso localmente!");
  };

  const handleAtualizarStatusFonte = (
    id: string,
    novoStatus: "ativo" | "conectado" | "nao_conectado",
  ) => {
    setFontes((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status: novoStatus,
              statusRotulo:
                novoStatus === "conectado"
                  ? "Conectado"
                  : novoStatus === "ativo"
                  ? "Ativo"
                  : "Não conectado",
            }
          : f,
      ),
    );
    dispararToast(`Fonte de memória atualizada localmente`);
  };

  const handleExecutarPergunta = (pergunta: string) => {
    setPerguntaBusca(pergunta);
    if (pergunta.includes("Clínica OdontoMais")) {
      setRespostaBusca(
        "Última reunião realizada em 20/10 com Dr. Marcos. Foi apresentada proposta Pro (R$ 3.800/mês). Principal interesse: redução de no-show.",
      );
    } else if (pergunta.includes("objeções mais comuns")) {
      setRespostaBusca(
        "As objeções mais recorrentes são 'preço do setup' (42%) e 'tempo de adaptação da equipe' (28%). O agente possui script validado para contorno.",
      );
    } else if (pergunta.includes("propostas")) {
      setRespostaBusca(
        "Foram geradas 28 propostas no mês corrente, totalizando R$ 86.400 em pipeline ativo. A taxa de conversão está em 18%.",
      );
    } else {
      setRespostaBusca(
        "A estratégia atual foca no nicho de saúde odontológica em Curitiba e SC, com taxa de resposta de 22% pelo WhatsApp.",
      );
    }
  };

  // Filtragem da tabela de memórias
  const memoriasFiltradas = useMemo(() => {
    return memorias.filter((mem) => {
      const matchBusca =
        mem.titulo.toLowerCase().includes(buscaTabela.toLowerCase()) ||
        mem.resumo.toLowerCase().includes(buscaTabela.toLowerCase()) ||
        mem.categoria.toLowerCase().includes(buscaTabela.toLowerCase());
      const matchTipo =
        filtroTipo === "todos" || mem.categoria.toLowerCase() === filtroTipo.toLowerCase();
      return matchBusca && matchTipo;
    });
  }, [memorias, buscaTabela, filtroTipo]);

  const handleRemoverMemoria = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMemorias((prev) => prev.filter((m) => m.id !== id));
    dispararToast("Memória removida da lista demonstrativa");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      <div className="mx-auto max-w-[1680px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 space-y-6">

        {/* =========================================================================
            1. CABEÇALHO DA TELA 05
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
                05
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
                <span className="text-neutral-200 font-semibold">Memória &amp; Segundo Cérebro</span>
              </nav>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Memória &amp; Segundo Cérebro
              </h1>
              <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                Memória por lead, projeto e integração com Obsidian.
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
              onClick={handleSincronizar}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <RefreshCw className="size-4 text-neutral-400" />
              <span>Sincronizar agora</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const orgCard = document.getElementById("card-organizacao-memoria");
                if (orgCard) orgCard.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Sliders className="size-4 text-neutral-400" />
              <span>Configurar memória</span>
            </button>

            <button
              type="button"
              onClick={handleSalvarAlteracoes}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f95d14] px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#ff6c26]"
            >
              <span>Salvar alterações</span>
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

                {/* Ícone de Coroa */}
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
                  Memória e contexto contínuo para decisões mais inteligentes. O segundo cérebro do agente armazena, organiza e conecta todas as informações relevantes da operação comercial.
                </p>

                {/* Tags de especialidade */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Direção Executiva", "Estratégia", "Gestão Comercial", "Análise de Dados"].map((tag) => (
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
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {INDICADORES_SUPERIORES_MEMORIA.map((ind) => {
                if (ind.tipo === "sincronizacao") {
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
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white tracking-tight">
                            {ind.valor}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          {ind.sub}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (ind.tipo === "armazenamento") {
                  return (
                    <div
                      key={ind.id}
                      className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-neutral-400 truncate">
                          {ind.rotulo}
                        </span>
                        <span className="text-xs font-bold text-white">{ind.valor}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#f95d14]"
                            style={{ width: `${ind.porcentagem}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-400">
                          <span>{ind.sub}</span>
                        </div>
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
            3. NAVEGAÇÃO DO PERFIL (Pill Tabs com Memória Ativa)
           ========================================================================= */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#1b2232] pb-3 scrollbar-none">
          {[
            { id: "visao_geral", label: "Visão Geral", action: onNavegarPerfil },
            { id: "configuracoes", label: "Configurações" },
            { id: "treinamento", label: "Treinamento", action: onNavegarTreinamento },
            { id: "memoria", label: "Memória", ativo: true },
            { id: "skills", label: "Skills", action: onNavegarSkills },
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
            4. LAYOUT EM TRÊS COLUNAS DA REFERÊNCIA VISUAL APROVADA
           ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* =======================================================================
              4.1 COLUNA ESQUERDA (3 colunas / ~25%)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* Card Fontes de Memória */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Fontes de Memória</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFonteSelecionada(fontes[0]);
                    setModalFonteAberto(true);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  <Plus className="size-3" />
                  <span>Conectar fonte</span>
                </button>
              </div>

              {/* Lista das 9 fontes */}
              <div className="space-y-1.5">
                {fontes.map((f) => {
                  const statusCor =
                    f.status === "ativo"
                      ? "text-emerald-400"
                      : f.status === "conectado"
                      ? "text-teal-400"
                      : "text-neutral-500";
                  const statusBg =
                    f.status === "ativo" || f.status === "conectado"
                      ? "bg-emerald-400"
                      : "bg-neutral-600";

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setFonteSelecionada(f);
                        setModalFonteAberto(true);
                      }}
                      className="group flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/80 p-2.5 transition-all hover:border-white/15 hover:bg-[#181e2b] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40">
                          {getFonteIcone(f.iconId)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-neutral-200 group-hover:text-white">
                            {f.nome}
                          </p>
                          <p className="truncate text-[10px] text-neutral-400">
                            {f.descricao}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className={cn("size-1.5 rounded-full", statusBg)} />
                        <span className={cn("text-[10px] font-medium", statusCor)}>
                          {f.statusRotulo}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card Insights da Memória */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Insights da Memória</h3>
                <button
                  type="button"
                  onClick={() => dispararToast("Carregando histórico completo de insights...")}
                  className="text-[11px] font-semibold text-[#f95d14] hover:text-[#ff7a38] transition-colors"
                >
                  Ver todos
                </button>
              </div>

              <div className="space-y-3">
                {INSIGHTS_MEMORIA_INICIAIS.map((ins, idx) => (
                  <div
                    key={ins.id}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#121620]/60 p-3 transition-colors hover:border-white/10"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-[#f95d14]">
                      {idx === 0 ? (
                        <TrendingUp className="size-3.5" />
                      ) : idx === 1 ? (
                        <Lightbulb className="size-3.5" />
                      ) : (
                        <ShieldAlert className="size-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-200 leading-snug">
                        {ins.titulo}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-400">{ins.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* =======================================================================
              4.2 COLUNA CENTRAL (6 colunas / ~50%)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-6">
            
            {/* Card Memória por Categoria (Gráfico Donut e Tabela de Porcentagens) */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Memória por categoria</h3>
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                  <span>{periodoDonut}</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              <div className="grid items-center gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
                {/* Donut Chart SVG */}
                <div className="relative flex size-44 mx-auto items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#161c28"
                      strokeWidth="15"
                    />
                    {/* SVG Slices calculados para as proporções da imagem: 32%, 18%, 15%, 12%, 10%, 8%, 5% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="15"
                      strokeDasharray="76.4 238.7"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f97316"
                      strokeWidth="15"
                      strokeDasharray="43.0 238.7"
                      strokeDashoffset="-76.4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="15"
                      strokeDasharray="35.8 238.7"
                      strokeDashoffset="-119.4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#06b6d4"
                      strokeWidth="15"
                      strokeDasharray="28.6 238.7"
                      strokeDashoffset="-155.2"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="15"
                      strokeDasharray="23.8 238.7"
                      strokeDashoffset="-183.8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#ec4899"
                      strokeWidth="15"
                      strokeDasharray="19.1 238.7"
                      strokeDashoffset="-207.6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="15"
                      strokeDasharray="12.0 238.7"
                      strokeDashoffset="-226.7"
                    />
                  </svg>
                  {/* Centro do Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold tracking-tight text-white">2.480</span>
                    <span className="text-[10px] text-neutral-400">memórias</span>
                  </div>
                </div>

                {/* Lista de Categorias com porcentagens e quantidades */}
                <div className="space-y-1.5 text-xs">
                  {CATEGORIAS_MEMORIA_DONUT.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.cor }}
                        />
                        <span className="truncate text-neutral-300 font-medium">
                          {cat.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-neutral-400 font-mono text-[11px]">
                          {cat.porcentagem}%
                        </span>
                        <span className="font-semibold text-white min-w-[32px] text-right">
                          {cat.quantidade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Memórias Recentes (Tabela Completa da Imagem) */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white">Memórias recentes</h3>

                {/* Filtros da tabela */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Buscar memórias..."
                      value={buscaTabela}
                      onChange={(e) => setBuscaTabela(e.target.value)}
                      className="h-8 rounded-lg border border-[#1e2638] bg-[#121620] pl-8 pr-3 text-[11px] text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none w-36 sm:w-44"
                    />
                  </div>

                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="h-8 rounded-lg border border-[#1e2638] bg-[#121620] px-2.5 text-[11px] text-neutral-300 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="todos">Todos os tipos</option>
                    <option value="reunião">Reunião</option>
                    <option value="lead">Lead</option>
                    <option value="estratégia">Estratégia</option>
                    <option value="proposta">Proposta</option>
                    <option value="pesquisa">Pesquisa</option>
                    <option value="processo">Processo</option>
                    <option value="case">Case</option>
                    <option value="ideia">Ideia</option>
                  </select>

                  <select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    className="h-8 rounded-lg border border-[#1e2638] bg-[#121620] px-2.5 text-[11px] text-neutral-300 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="antigas">Mais antigas</option>
                  </select>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-[#161c28]">
                    {memoriasFiltradas.map((mem) => (
                      <tr
                        key={mem.id}
                        onClick={() => {
                          setMemoriaSelecionada(mem);
                          setModalMemoriaAberto(true);
                        }}
                        className="group transition-colors hover:bg-white/[0.03] cursor-pointer"
                      >
                        {/* Ícone e Título */}
                        <td className="py-2.5 pl-1 pr-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40">
                              {getTabelaFonteIcone(mem.fonte)}
                            </div>
                            <span className="truncate font-medium text-neutral-200 group-hover:text-white max-w-[200px] sm:max-w-[260px]">
                              {mem.titulo}
                            </span>
                          </div>
                        </td>

                        {/* Categoria Badge */}
                        <td className="py-2.5 px-2">
                          <span
                            className={cn(
                              "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border",
                              mem.categoriaBadgeCor,
                            )}
                          >
                            {mem.categoria}
                          </span>
                        </td>

                        {/* Data */}
                        <td className="py-2.5 px-2 text-[11px] text-neutral-400 whitespace-nowrap">
                          {mem.data}
                        </td>

                        {/* Fonte */}
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5 text-neutral-300 text-[11px]">
                            {getTabelaFonteIcone(mem.fonte)}
                            <span>{mem.fonte}</span>
                          </div>
                        </td>

                        {/* Ações (3 dots) */}
                        <td className="py-2.5 pr-1 text-right">
                          <button
                            type="button"
                            onClick={(e) => handleRemoverMemoria(mem.id, e)}
                            title="Remover da lista demonstrativa"
                            className="rounded-lg p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* =======================================================================
              4.3 COLUNA DIREITA (3 colunas / ~25%)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* Card Busca Inteligente */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <h3 className="text-sm font-bold text-white mb-2">Busca Inteligente</h3>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Pergunte algo sobre seus leads, projetos ou documentos..."
                  value={perguntaBusca}
                  onChange={(e) => setPerguntaBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && perguntaBusca.trim()) {
                      handleExecutarPergunta(perguntaBusca);
                    }
                  }}
                  className="w-full rounded-xl border border-[#1e2638] bg-[#121620] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Resposta demonstrativa da busca */}
              {respostaBusca && (
                <div className="mb-3 rounded-xl border border-orange-500/30 bg-orange-950/20 p-3 text-xs leading-relaxed text-neutral-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-orange-400 flex items-center gap-1 text-[11px]">
                      <Sparkles className="size-3" />
                      Resposta do Segundo Cérebro:
                    </span>
                    <button
                      type="button"
                      onClick={() => setRespostaBusca(null)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <p>{respostaBusca}</p>
                </div>
              )}

              {/* Exemplos de perguntas */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-neutral-400">
                  Exemplos de perguntas:
                </p>
                {EXEMPLOS_BUSCA_INTELIGENTE.map((exemplo) => (
                  <button
                    key={exemplo}
                    type="button"
                    onClick={() => handleExecutarPergunta(exemplo)}
                    className="group flex w-full items-start justify-between rounded-xl border border-white/5 bg-[#121620]/60 p-2 text-left text-[11px] text-neutral-300 hover:border-white/10 hover:bg-[#181e2b] hover:text-white transition-all"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <HelpCircle className="size-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{exemplo}</span>
                    </div>
                    <ArrowRight className="size-3 text-neutral-500 group-hover:text-[#f95d14] shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Card Organização da Memória */}
            <div id="card-organizacao-memoria" className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Organização da Memória</h3>
                <button
                  type="button"
                  onClick={() => dispararToast("Configurações avançadas de retenção abertas")}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  Configurar
                </button>
              </div>

              {/* 5 Switches */}
              <div className="space-y-3 text-xs">
                {[
                  {
                    key: "organizar" as const,
                    titulo: "Organizar memórias automaticamente",
                    sub: "Classifica e categoriza o conteúdo",
                    icone: Database,
                    cor: "text-purple-400",
                  },
                  {
                    key: "resumos" as const,
                    titulo: "Criar resumos automáticos",
                    sub: "Gera resumos de reuniões e documentos",
                    icone: FileText,
                    cor: "text-rose-400",
                  },
                  {
                    key: "insights" as const,
                    titulo: "Identificar insights e padrões",
                    sub: "Encontra oportunidades e tendências",
                    icone: TrendingUp,
                    cor: "text-emerald-400",
                  },
                  {
                    key: "conectar" as const,
                    titulo: "Conectar informações relacionadas",
                    sub: "Cria links entre memórias relevantes",
                    icone: Link2,
                    cor: "text-blue-400",
                  },
                  {
                    key: "limpar" as const,
                    titulo: "Limpar memórias antigas",
                    sub: "Remove informações desatualizadas",
                    icone: Trash2,
                    cor: "text-rose-400",
                  },
                ].map((item) => {
                  const checked = switchesOrg[item.key];
                  const Icon = item.icone;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620]/60 p-2.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 pr-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-black/40">
                          <Icon className={cn("size-3.5", item.cor)} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-200">
                            {item.titulo}
                          </p>
                          <p className="truncate text-[10px] text-neutral-400">
                            {item.sub}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSwitchesOrg((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                          checked ? "bg-emerald-500" : "bg-neutral-800",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
                            checked ? "translate-x-4" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card Armazenamento e Limites */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Armazenamento e Limites</h3>
                <button
                  type="button"
                  onClick={() => setModalArmazenamentoAberto(true)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10 hover:text-white"
                >
                  Gerenciar
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">6.8 GB / 10 GB</span>
                  <span className="font-semibold text-neutral-400">68%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#f95d14]"
                    style={{ width: "68%" }}
                  />
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  {DETALHAMENTO_ARMAZENAMENTO.map((item) => (
                    <div
                      key={item.rotulo}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", item.cor)} />
                        <span className="text-neutral-400">{item.rotulo}</span>
                      </div>
                      <span className="font-semibold text-neutral-200">{item.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Próximas Ações */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Próximas ações</h3>
                <button
                  type="button"
                  onClick={() => dispararToast("Fila de ações inteligentes atualizada")}
                  className="text-[11px] font-semibold text-[#f95d14] hover:text-[#ff7a38] transition-colors"
                >
                  Ver todas
                </button>
              </div>

              <div className="space-y-2">
                {PROXIMAS_ACOES_MEMORIA.map((acao) => (
                  <div
                    key={acao.id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#121620]/60 p-2.5 transition-colors hover:border-white/10"
                  >
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                        acao.corBg,
                        acao.corIcone,
                      )}
                    >
                      <acao.icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-neutral-200">
                        {acao.titulo}
                      </p>
                      <p className="truncate text-[10px] text-neutral-400">
                        {acao.quantidadeDescricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Modais */}
      <ConectarFonteModal
        aberto={modalFonteAberto}
        fonte={fonteSelecionada}
        onFechar={() => setModalFonteAberto(false)}
        onSalvarStatus={handleAtualizarStatusFonte}
      />

      <DetalhesMemoriaModal
        aberto={modalMemoriaAberto}
        memoria={memoriaSelecionada}
        onFechar={() => setModalMemoriaAberto(false)}
      />

      <GerenciarArmazenamentoModal
        aberto={modalArmazenamentoAberto}
        onFechar={() => setModalArmazenamentoAberto(false)}
      />
    </div>
  );
}
