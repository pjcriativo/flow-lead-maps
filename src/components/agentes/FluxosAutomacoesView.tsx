// Tela 07 — Fluxos & Automações
// Construtor visual de processos comerciais com agentes de IA.
// Reproduz fielmente a imagem de referência aprovada com máxima fidelidade estética e interativa.
import React, { useState, useRef, useEffect } from "react";
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
  GitBranch,
  Headphones,
  HeartHandshake,
  History,
  Layers,
  LayoutGrid,
  Link2,
  Mail,
  Maximize2,
  MessageSquare,
  Minus,
  MoreVertical,
  Percent,
  Play,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_FLUXOS,
  MODELOS_FLUXOS_INICIAIS,
  BLOCOS_FLUXO_INICIAIS,
  CONEXOES_FLUXO_INICIAIS,
  FLUXOS_MAIS_UTILIZADOS,
  EXECUCOES_FLUXOS_GRAFICO,
  RESULTADOS_DO_FLUXO,
  type BlocoFluxo,
  type ModeloFluxoItem,
} from "./fluxos-data";
import { NovoFluxoModal } from "./NovoFluxoModal";
import { ModelosFluxoModal } from "./ModelosFluxoModal";
import { HistoricoExecucoesModal } from "./HistoricoExecucoesModal";

interface FluxosAutomacoesViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarTreinamento?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarPlanejamento?: () => void;
}

export function FluxosAutomacoesView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarTreinamento,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarEquipe,
  onNavegarPlanejamento,
}: FluxosAutomacoesViewProps) {
  // Estado dos Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalModelosAberto, setModalModelosAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);

  // Filtro de modelos na barra lateral
  const [categoriaModelos, setCategoriaModelos] = useState<"todos" | "prospeccao" | "vendas" | "pos_venda">("todos");
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string>("qualificacao_leads");

  // Estado do Canvas & Nós
  const [blocos, setBlocos] = useState<BlocoFluxo[]>(BLOCOS_FLUXO_INICIAIS);
  const [blocoSelecionadoId, setBlocoSelecionadoId] = useState<string>("node-analise");
  const [zoom, setZoom] = useState(100);
  const [testandoEstrutura, setTestandoEstrutura] = useState(false);
  const [etapaTesteAtiva, setEtapaTesteAtiva] = useState<number | null>(null);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  // Filtros dos cards inferiores
  const [periodoMaisUtilizados, setPeriodoMaisUtilizados] = useState("Últimos 30 dias");
  const [periodoGrafico, setPeriodoGrafico] = useState("Últimos 30 dias");
  const [periodoResultados, setPeriodoResultados] = useState("Últimos 30 dias");

  // Ponto selecionado no gráfico para tooltip
  const [pontoHover, setPontoHover] = useState<number | null>(null);

  // Arrastar nós no canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [offsetArrasto, setOffsetArrasto] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Bloco ativo para o formulário de propriedades
  const blocoAtivo = blocos.find((b) => b.id === blocoSelecionadoId) || blocos[0];

  // Formulário de propriedades editáveis do nó ativo
  const [formNome, setFormNome] = useState(blocoAtivo?.nome || "");
  const [formTipo, setFormTipo] = useState(blocoAtivo?.tipo || "acao_agente");
  const [formAgente, setFormAgente] = useState(blocoAtivo?.agenteResponsavel || "CEO de IA");
  const [formDescricao, setFormDescricao] = useState(blocoAtivo?.descricao || "");
  const [formCrm, setFormCrm] = useState(blocoAtivo?.usarCrm ?? true);
  const [formHistorico, setFormHistorico] = useState(blocoAtivo?.considerarHistorico ?? true);
  const [formCriterios, setFormCriterios] = useState(blocoAtivo?.aplicarCriterios ?? true);
  const [formProximo, setFormProximo] = useState(blocoAtivo?.proximoPasso || "Condição: Lead qualificado?");

  // Atualiza form sempre que muda o nó selecionado
  useEffect(() => {
    if (blocoAtivo) {
      setFormNome(blocoAtivo.nome);
      setFormTipo(blocoAtivo.tipo);
      setFormAgente(blocoAtivo.agenteResponsavel || "CEO de IA");
      setFormDescricao(blocoAtivo.descricao || "");
      setFormCrm(blocoAtivo.usarCrm ?? true);
      setFormHistorico(blocoAtivo.considerarHistorico ?? true);
      setFormCriterios(blocoAtivo.aplicarCriterios ?? true);
      setFormProximo(blocoAtivo.proximoPasso || "Condição: Lead qualificado?");
    }
  }, [blocoSelecionadoId]);

  // Salvar propriedades no nó selecionado
  const salvarPropriedades = () => {
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id !== blocoSelecionadoId) return b;
        return {
          ...b,
          nome: formNome,
          tipo: formTipo as any,
          agenteResponsavel: formAgente,
          descricao: formDescricao,
          usarCrm: formCrm,
          considerarHistorico: formHistorico,
          aplicarCriterios: formCriterios,
          proximoPasso: formProximo,
        };
      })
    );
    exibirToast("Propriedades do bloco atualizadas com sucesso!");
  };

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => {
      setToastMensagem(null);
    }, 4000);
  };

  // Simulação de Execução de Teste do Fluxo
  const executarTesteFluxo = () => {
    if (testandoEstrutura) return;
    setTestandoEstrutura(true);
    setEtapaTesteAtiva(0);

    const etapasIds = [
      "node-inicio",
      "node-analise",
      "node-condicao",
      "node-agendamento",
      "node-proposta",
      "node-acompanhamento",
    ];

    etapasIds.forEach((id, index) => {
      setTimeout(() => {
        setBlocoSelecionadoId(id);
        setEtapaTesteAtiva(index);
      }, (index + 1) * 600);
    });

    setTimeout(() => {
      setTestandoEstrutura(false);
      setEtapaTesteAtiva(null);
      exibirToast("Estrutura do fluxo validada com 100% de integridade (8 nós, 0 ciclos inválidos)!");
    }, (etapasIds.length + 1) * 600);
  };

  // Iniciar arrasto de bloco
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBlocoSelecionadoId(id);
    const bloco = blocos.find((b) => b.id === id);
    if (!bloco) return;
    setArrastandoId(id);
    setOffsetArrasto({
      x: e.clientX - bloco.x,
      y: e.clientY - bloco.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arrastandoId) return;
    const novoX = Math.max(10, Math.min(650, e.clientX - offsetArrasto.x));
    const novoY = Math.max(10, Math.min(800, e.clientY - offsetArrasto.y));
    setBlocos((prev) =>
      prev.map((b) => (b.id === arrarrastandoId ? { ...b, x: novoX, y: novoY } : b))
    );
  };

  const handleMouseUp = () => {
    setArrastandoId(null);
  };

  const arrarrastandoId = arrastandoId;

  // Carregar modelo selecionado
  const carregarModelo = (mod: ModeloFluxoItem) => {
    setModeloSelecionadoId(mod.id);
    exibirToast(`Modelo "${mod.nome}" carregado no construtor.`);
  };

  // Resetar zoom
  const resetZoom = () => setZoom(100);
  const zoomIn = () => setZoom((z) => Math.min(150, z + 10));
  const zoomOut = () => setZoom((z) => Math.max(60, z - 10));

  // Filtragem dos modelos
  const modelosFiltrados = MODELOS_FLUXOS_INICIAIS.filter(
    (m) => categoriaModelos === "todos" || m.categoria === categoriaModelos
  );

  return (
    <div
      className="mx-auto max-w-[1720px] px-4 pb-16 pt-5 sm:px-6 lg:px-8 space-y-5"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Toast Notificação Demonstrativa */}
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
            <span className="text-orange-400 font-semibold">Fluxos &amp; Automações</span>
          </nav>

          {/* Título & Subtítulo */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 text-orange-400 shadow-md">
              <GitBranch className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Fluxos &amp; Automações
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400">
                Construa e gerencie processos comerciais com seus agentes de IA.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalModelosAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 py-2 text-xs font-semibold text-neutral-200 shadow-sm transition-all hover:border-white/20 hover:bg-[#181d2c] hover:text-white"
          >
            <Layers className="size-3.5 text-neutral-400" />
            <span>Modelos de fluxo</span>
          </button>

          <button
            type="button"
            onClick={() => setModalHistoricoAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 py-2 text-xs font-semibold text-neutral-200 shadow-sm transition-all hover:border-white/20 hover:bg-[#181d2c] hover:text-white"
          >
            <History className="size-3.5 text-neutral-400" />
            <span>Ver histórico</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Novo fluxo</span>
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
                Coordena fluxos e automações entre os agentes, garantindo execução eficiente da estratégia comercial com autonomia e controle.
              </p>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Estratégia", "Automação", "Gestão de Equipe", "Resultados"].map((tag) => (
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
            {INDICADORES_SUPERIORES_FLUXOS.map((ind) => {
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
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-tight">
                        {ind.valor}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        {ind.sub}
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
                    <div className={cn("flex size-7 items-center justify-center rounded-lg border", ind.corBg, ind.corIcone)}>
                      <ind.icon className="size-3.5" />
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400">{ind.mudanca}</span>
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
          3. NAVEGAÇÃO DO PERFIL (ABAS)
         ========================================================================= */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/5">
        {[
          { label: "Visão Geral", id: "visao_geral", onClick: onNavegarPerfil },
          { label: "Configurações", id: "configuracoes", onClick: onNavegarPerfil },
          { label: "Treinamento", id: "treinamento", onClick: onNavegarTreinamento },
          { label: "Memória", id: "memoria", onClick: onNavegarMemoria },
          { label: "Skills", id: "skills", onClick: onNavegarSkills },
          { label: "Fluxos", id: "fluxos", ativo: true },
          { label: "Metas", id: "metas", onClick: onNavegarPlanejamento || onNavegarPerfil },
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
          4. CONSTRUTOR EM 3 COLUNAS: MODELOS | CANVAS | PROPRIEDADES
         ========================================================================= */}
      <section className="grid gap-5 lg:grid-cols-12 items-start">
        
        {/* ---------------------------------------------------------------------
            COLUNA 1: MODELOS DE FLUXOS (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-3.5 rounded-2xl border border-white/10 bg-[#0d1017] p-4 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Modelos de Fluxos</h3>
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus className="size-3" />
              <span>Novo modelo</span>
            </button>
          </div>

          {/* Filtros em Chips */}
          <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-[#141824] p-1 text-[11px]">
            {[
              { id: "todos", label: "Todos" },
              { id: "prospeccao", label: "Prospecção" },
              { id: "vendas", label: "Vendas" },
              { id: "pos_venda", label: "Pós-venda" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoriaModelos(f.id as any)}
                className={cn(
                  "flex-1 rounded-lg py-1 text-center font-medium transition-all",
                  categoriaModelos === f.id
                    ? "bg-[#FF5500] text-white shadow"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Modelos */}
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {modelosFiltrados.map((modelo) => {
              const Icon = modelo.icon;
              const isSelected = modeloSelecionadoId === modelo.id;
              return (
                <div
                  key={modelo.id}
                  onClick={() => carregarModelo(modelo)}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer",
                    isSelected
                      ? "border-orange-500/70 bg-gradient-to-r from-orange-500/15 via-[#161a26] to-[#121620] shadow-md shadow-orange-950/20"
                      : "border-white/5 bg-[#121620] hover:border-white/15 hover:bg-[#161c2a]"
                  )}
                >
                  {/* Ícone */}
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105",
                      modelo.corBg,
                      modelo.corIcone
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  {/* Informações */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={cn(
                          "text-xs font-bold truncate transition-colors",
                          isSelected ? "text-white" : "text-neutral-200 group-hover:text-white"
                        )}
                      >
                        {modelo.nome}
                      </h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalNovoAberto(true);
                        }}
                        className="text-neutral-500 hover:text-neutral-300 p-0.5"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-400 line-clamp-1">
                      {modelo.descricao}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUNA 2: CONSTRUTOR DE FLUXO (CANVAS INTERATIVO - 6 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-6 space-y-3 rounded-2xl border border-white/10 bg-[#0d1017] p-4 shadow-xl">
          {/* Barra Superior do Canvas */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Construtor de Fluxo</h3>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Salvo automaticamente Hoje às 14:32</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Desfazer */}
              <button
                type="button"
                onClick={() => {
                  setBlocos(BLOCOS_FLUXO_INICIAIS);
                  exibirToast("Estrutura do fluxo restaurada para o padrão inicial.");
                }}
                title="Restaurar fluxo inicial"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#141824] text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
              >
                <RotateCcw className="size-3.5" />
              </button>

              {/* Controles de Zoom */}
              <div className="flex items-center rounded-lg border border-white/10 bg-[#141824] px-1 text-xs text-neutral-300">
                <button
                  type="button"
                  onClick={zoomOut}
                  className="px-1.5 py-1 hover:text-white"
                  title="Diminuir zoom"
                >
                  <Minus className="size-3" />
                </button>
                <span
                  onClick={resetZoom}
                  className="px-1.5 text-[11px] font-semibold cursor-pointer hover:text-white"
                >
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  className="px-1.5 py-1 hover:text-white"
                  title="Aumentar zoom"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              {/* Executar Teste */}
              <button
                type="button"
                onClick={executarTesteFluxo}
                disabled={testandoEstrutura}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/60 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-400 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="size-3 fill-orange-400" />
                <span>{testandoEstrutura ? "Validando..." : "Executar teste"}</span>
              </button>
            </div>
          </div>

          {/* Área de Visualização do Canvas */}
          <div
            ref={canvasRef}
            className="relative h-[720px] w-full overflow-hidden rounded-xl border border-white/5 bg-[#090b10] select-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Camada SVG de Conexões e Setas */}
            <svg
              className="pointer-events-none absolute inset-0 size-full"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              <defs>
                {/* Marcador de seta padrão */}
                <marker
                  id="seta"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#4B5563" />
                </marker>
                {/* Marcador de seta verde */}
                <marker
                  id="seta-verde"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#10B981" />
                </marker>
                {/* Marcador de seta laranja */}
                <marker
                  id="seta-laranja"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#F59E0B" />
                </marker>
              </defs>

              {/* 1. Início -> Análise */}
              <line
                x1={360}
                y1={94}
                x2={360}
                y2={135}
                stroke="#4B5563"
                strokeWidth="2"
                markerEnd="url(#seta)"
              />

              {/* 2. Análise -> Condição */}
              <line
                x1={360}
                y1={209}
                x2={360}
                y2={255}
                stroke="#4B5563"
                strokeWidth="2"
                markerEnd="url(#seta)"
              />

              {/* 3. Condição -> Ramo NÃO (Esquerda) */}
              <path
                d="M 265 285 L 187 285 L 187 355"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                markerEnd="url(#seta)"
              />

              {/* 4. Nutrição -> Espera */}
              <line
                x1={187}
                y1={433}
                x2={187}
                y2={475}
                stroke="#4B5563"
                strokeWidth="2"
                markerEnd="url(#seta)"
              />

              {/* 5. Loopback Nutrição -> Análise de Perfil (Dashed Orange) */}
              <path
                d="M 80 394 C 30 394, 30 172, 240 172"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="5,4"
                markerEnd="url(#seta-laranja)"
              />

              {/* 6. Condição -> Ramo SIM (Direita) */}
              <path
                d="M 455 285 L 532 285 L 532 355"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                markerEnd="url(#seta-verde)"
              />

              {/* 7. Agendamento -> Proposta */}
              <line
                x1={532}
                y1={433}
                x2={532}
                y2={475}
                stroke="#4B5563"
                strokeWidth="2"
                markerEnd="url(#seta)"
              />

              {/* 8. Proposta -> Acompanhamento */}
              <line
                x1={532}
                y1={553}
                x2={532}
                y2={595}
                stroke="#4B5563"
                strokeWidth="2"
                markerEnd="url(#seta-verde)"
              />
            </svg>

            {/* Badges de Decisão (NÃO / SIM) */}
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: `215px`,
                top: `272px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            >
              <span className="rounded-md border border-rose-500/40 bg-[#1a0f12] px-2 py-0.5 text-[10px] font-bold text-rose-400 shadow">
                Não
              </span>
            </div>

            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: `480px`,
                top: `272px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
              }}
            >
              <span className="rounded-md border border-emerald-500/40 bg-[#0c1a14] px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow">
                Sim
              </span>
            </div>

            {/* Renderização Interativa dos Nós */}
            <div
              className="relative size-full"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {blocos.map((bloco) => {
                const Icon = bloco.icon;
                const isSelected = blocoSelecionadoId === bloco.id;
                const isCondicao = bloco.tipo === "condicao";

                if (isCondicao) {
                  return (
                    <div
                      key={bloco.id}
                      onMouseDown={(e) => handleMouseDown(e, bloco.id)}
                      onClick={() => setBlocoSelecionadoId(bloco.id)}
                      style={{
                        left: `${bloco.x}px`,
                        top: `${bloco.y}px`,
                        width: `${bloco.largura || 190}px`,
                        height: `${bloco.altura || 60}px`,
                      }}
                      className={cn(
                        "absolute z-20 flex cursor-pointer items-center justify-center rounded-xl border transition-all shadow-lg",
                        isSelected
                          ? "border-blue-500/90 bg-gradient-to-br from-blue-900/40 via-[#101726] to-[#0c121d] ring-2 ring-blue-500/40 shadow-blue-900/30"
                          : "border-blue-500/40 bg-[#0f1422] hover:border-blue-500/70"
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 text-center">
                        <GitBranch className="size-4 text-blue-400" />
                        <span className="text-xs font-bold text-white tracking-tight">
                          {bloco.nome}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Nós retangulares
                return (
                  <div
                    key={bloco.id}
                    onMouseDown={(e) => handleMouseDown(e, bloco.id)}
                    onClick={() => setBlocoSelecionadoId(bloco.id)}
                    style={{
                      left: `${bloco.x}px`,
                      top: `${bloco.y}px`,
                      width: `${bloco.largura || 220}px`,
                    }}
                    className={cn(
                      "absolute z-20 flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-all shadow-lg",
                      // Estilo de acordo com a cor do bloco
                      bloco.cor === "verde"
                        ? "border-emerald-500/50 bg-[#0c1814]"
                        : bloco.cor === "roxo"
                        ? "border-purple-500/60 bg-[#171328]"
                        : bloco.cor === "laranja"
                        ? "border-amber-500/60 bg-[#1c1611]"
                        : bloco.cor === "vermelho"
                        ? "border-rose-500/50 bg-[#1c1114]"
                        : "border-blue-500/50 bg-[#0e1626]",
                      // Seleção ativa
                      isSelected &&
                        "ring-2 ring-white/50 border-white shadow-xl scale-[1.02]"
                    )}
                  >
                    {/* Ícone */}
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-inner",
                        bloco.cor === "verde"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : bloco.cor === "roxo"
                          ? "border-purple-500/40 bg-purple-500/15 text-purple-400"
                          : bloco.cor === "laranja"
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                          : bloco.cor === "vermelho"
                          ? "border-rose-500/40 bg-rose-500/15 text-rose-400"
                          : "border-blue-500/40 bg-blue-500/15 text-blue-400"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    {/* Dados */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{bloco.nome}</h4>
                      {bloco.agenteResponsavel && (
                        <div className="text-[10px] font-semibold text-neutral-300">
                          {bloco.agenteResponsavel}
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-400 line-clamp-1">{bloco.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUNA 3: PROPRIEDADES DO BLOCO (3 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-4 rounded-2xl border border-white/10 bg-[#0d1017] p-4 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h3 className="text-sm font-bold text-white">Propriedades do Bloco</h3>
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <span>Página de início</span>
              <ChevronDown className="size-3" />
            </span>
          </div>

          {/* Card Resumo do Nó Selecionado */}
          {blocoAtivo && (
            <div className="flex items-start gap-3 rounded-xl border border-purple-500/30 bg-[#161426] p-3 shadow-md">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
                <blocoAtivo.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{blocoAtivo.nome}</h4>
                <p className="text-[10px] font-semibold text-purple-300">
                  {blocoAtivo.agenteResponsavel || "CEO de IA"}
                </p>
                <p className="mt-1 text-[10px] text-neutral-400 line-clamp-2">
                  {blocoAtivo.descricao || "Executa ações inteligentes no fluxo comercial."}
                </p>
              </div>
            </div>
          )}

          {/* Formulário de Configuração */}
          <div className="space-y-3 text-xs">
            {/* Tipo de Bloco */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Tipo de bloco
              </label>
              <select
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="acao_agente">Ação do Agente</option>
                <option value="inicio">Início do Fluxo</option>
                <option value="condicao">Condição Lógica</option>
                <option value="espera">Aguardar / Delay</option>
                <option value="conclusao">Finalização</option>
              </select>
            </div>

            {/* Agente Responsável */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Agente responsável
              </label>
              <div className="relative">
                <select
                  value={formAgente}
                  onChange={(e) => setFormAgente(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#141824] pl-9 pr-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
                >
                  <option value="CEO de IA">CEO de IA</option>
                  <option value="SDR">SDR (Qualificador)</option>
                  <option value="Vendedor">Vendedor (Consultor)</option>
                  <option value="Sistema / Flow Business">Sistema / Flow Business</option>
                </select>
                <div className="pointer-events-none absolute left-2.5 top-2.5 size-4 rounded-full overflow-hidden border border-white/20">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80"
                    alt="Agente"
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Descrição
              </label>
              <textarea
                rows={3}
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-[11px] text-white placeholder-neutral-500 focus:border-orange-500/60 focus:outline-none resize-none"
              />
            </div>

            {/* Configurações (Toggles) */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <span className="block text-[11px] font-semibold text-neutral-300">
                Configurações
              </span>

              {/* Toggle 1: CRM */}
              <div className="flex items-center justify-between rounded-lg bg-[#141824] p-2">
                <span className="text-[11px] text-neutral-300">Usar dados do CRM</span>
                <button
                  type="button"
                  onClick={() => setFormCrm(!formCrm)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    formCrm ? "bg-emerald-500" : "bg-neutral-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-3.5 transform rounded-full bg-white transition-transform",
                      formCrm ? "translate-x-4" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Toggle 2: Histórico */}
              <div className="flex items-center justify-between rounded-lg bg-[#141824] p-2">
                <span className="text-[11px] text-neutral-300">
                  Considerar histórico de interações
                </span>
                <button
                  type="button"
                  onClick={() => setFormHistorico(!formHistorico)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    formHistorico ? "bg-emerald-500" : "bg-neutral-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-3.5 transform rounded-full bg-white transition-transform",
                      formHistorico ? "translate-x-4" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Toggle 3: Critérios de qualificação */}
              <div className="flex items-center justify-between rounded-lg bg-[#141824] p-2">
                <span className="text-[11px] text-neutral-300">
                  Aplicar critérios de qualificação
                </span>
                <button
                  type="button"
                  onClick={() => setFormCriterios(!formCriterios)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    formCriterios ? "bg-emerald-500" : "bg-neutral-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-3.5 transform rounded-full bg-white transition-transform",
                      formCriterios ? "translate-x-4" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Próximo Passo */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <label className="block text-[11px] font-semibold text-neutral-300">
                Próximo passo
              </label>
              <select
                value={formProximo}
                onChange={(e) => setFormProximo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="Condição: Lead qualificado?">Condição: Lead qualificado?</option>
                <option value="Agendamento de Reunião">Agendamento de Reunião</option>
                <option value="Nutrição Automática">Nutrição Automática</option>
                <option value="Envio de Proposta">Envio de Proposta</option>
                <option value="Finalizar">Finalizar fluxo</option>
              </select>

              <button
                type="button"
                onClick={() => exibirToast("Seletor de condição dinâmica aberto.")}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/5 py-2 text-[11px] font-semibold text-neutral-300 hover:border-orange-500/50 hover:text-white transition-all"
              >
                <Plus className="size-3" />
                <span>Adicionar condição</span>
              </button>
            </div>

            {/* Salvar Alterações */}
            <div className="pt-2">
              <button
                type="button"
                onClick={salvarPropriedades}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-white/10 hover:border-orange-500/50 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95"
              >
                <Check className="size-3.5 text-orange-400" />
                <span>Salvar alterações</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. LINHA INFERIOR (3 CARDS): FLUXOS MAIS USADOS | EXECUÇÕES | RESULTADOS
         ========================================================================= */}
      <section className="grid gap-5 lg:grid-cols-12">
        
        {/* ---------------------------------------------------------------------
            CARD 1: FLUXOS MAIS UTILIZADOS (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Fluxos mais utilizados</h3>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
              <select
                value={periodoMaisUtilizados}
                onChange={(e) => setPeriodoMaisUtilizados(e.target.value)}
                className="bg-transparent text-[11px] text-neutral-400 focus:outline-none cursor-pointer"
              >
                <option value="Últimos 30 dias" className="bg-[#121620]">Últimos 30 dias</option>
                <option value="Últimos 7 dias" className="bg-[#121620]">Últimos 7 dias</option>
                <option value="Este mês" className="bg-[#121620]">Este mês</option>
              </select>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {FLUXOS_MAIS_UTILIZADOS.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-200">{item.nome}</span>
                  <span className="font-bold text-white">{item.execucoes}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 to-[#FF5500]"
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            CARD 2: EXECUÇÕES DE FLUXOS (GRÁFICO DE LINHAS) (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Execuções de Fluxos</h3>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
              <select
                value={periodoGrafico}
                onChange={(e) => setPeriodoGrafico(e.target.value)}
                className="bg-transparent text-[11px] text-neutral-400 focus:outline-none cursor-pointer"
              >
                <option value="Últimos 30 dias" className="bg-[#121620]">Últimos 30 dias</option>
                <option value="Últimos 7 dias" className="bg-[#121620]">Últimos 7 dias</option>
              </select>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>Sucesso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>Falha</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>Em andamento</span>
            </div>
          </div>

          {/* Gráfico SVG de Linhas com Suavização e Pontos */}
          <div className="relative h-44 w-full pt-2">
            <svg className="size-full overflow-visible" viewBox="0 0 320 120">
              {/* Linhas de Grade Horizontal */}
              <line x1="25" y1="20" x2="310" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
              <line x1="25" y1="50" x2="310" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
              <line x1="25" y1="80" x2="310" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
              <line x1="25" y1="110" x2="310" y2="110" stroke="rgba(255,255,255,0.1)" />

              {/* Rótulos do Eixo Y */}
              <text x="5" y="23" fill="#6B7280" fontSize="8">200</text>
              <text x="5" y="53" fill="#6B7280" fontSize="8">150</text>
              <text x="5" y="83" fill="#6B7280" fontSize="8">100</text>
              <text x="15" y="113" fill="#6B7280" fontSize="8">0</text>

              {/* Linha 1: Sucesso (Verde #10B981) */}
              <path
                d="M 30 75 Q 75 65, 120 58 T 165 42 T 215 15 T 260 50 T 305 32"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Linha 2: Em andamento (Laranja/Amarelo #F59E0B) */}
              <path
                d="M 30 92 Q 75 88, 120 84 T 165 76 T 215 65 T 260 78 T 305 70"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Linha 3: Falha (Vermelho #EF4444) */}
              <path
                d="M 30 102 Q 75 98, 120 105 T 165 96 T 215 101 T 260 97 T 305 102"
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Ponto de Destaque no Pico (20/10) */}
              <circle cx="215" cy="15" r="4.5" fill="#10B981" stroke="#0d1017" strokeWidth="2" />
              <line x1="215" y1="15" x2="215" y2="110" stroke="#10B981" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />

              {/* Rótulos do Eixo X */}
              {EXECUCOES_FLUXOS_GRAFICO.map((p, idx) => {
                const x = 30 + idx * 45;
                return (
                  <text
                    key={p.data}
                    x={x}
                    y="125"
                    fill="#6B7280"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {p.data}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            CARD 3: RESULTADOS DO FLUXO (6 MINI CARDS) (4 colunas no lg)
           --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#0d1017] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Resultados do Fluxo</h3>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
              <select
                value={periodoResultados}
                onChange={(e) => setPeriodoResultados(e.target.value)}
                className="bg-transparent text-[11px] text-neutral-400 focus:outline-none cursor-pointer"
              >
                <option value="Últimos 30 dias" className="bg-[#121620]">Últimos 30 dias</option>
                <option value="Últimos 7 dias" className="bg-[#121620]">Últimos 7 dias</option>
              </select>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
          </div>

          {/* 6 Mini Cards (Grid 2x3) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {RESULTADOS_DO_FLUXO.map((res) => {
              const Icon = res.icon;
              return (
                <div
                  key={res.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#121620] p-3 transition-colors hover:border-white/10"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                      res.corBg,
                      res.corIcone
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white tracking-tight block">
                      {res.valor}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {res.rotulo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. MODAIS INTERATIVOS
         ========================================================================= */}
      <NovoFluxoModal
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        onCriarFluxo={(dados) => {
          exibirToast(`Fluxo "${dados.nome}" criado no canvas com sucesso!`);
        }}
      />

      <ModelosFluxoModal
        aberto={modalModelosAberto}
        onFechar={() => setModalModelosAberto(false)}
        onSelecionarModelo={carregarModelo}
      />

      <HistoricoExecucoesModal
        aberto={modalHistoricoAberto}
        onFechar={() => setModalHistoricoAberto(false)}
      />
    </div>
  );
}
