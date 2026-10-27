// Tela 11 — Aprovações & Histórico
// Central de governança, aprovações e auditoria de ações dos agentes coordenada pelo CEO de IA.
// Reproduz fielmente a imagem de referência aprovada (media_1792741493656.jpg) com máxima fidelidade estética e interativa.
import { AprovacoesRealPanel } from "./EquipeRealUi";
import { useEquipeReal } from "./useEquipeReal";
import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  Database,
  DollarSign,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Globe,
  HardDrive,
  Headphones,
  History,
  Info,
  Layers,
  LayoutGrid,
  Link2,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Percent,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wrench,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_APROVACOES,
  HISTOGRAMA_ACOES_30_DIAS,
  SOLICITACOES_INICIAIS,
  ACOES_POR_TIPO,
  PONTOS_HISTORICO_APROVACOES,
  TOP_AGENTES_SOLICITACOES,
  type SolicitacaoAprovacaoItem,
  type StatusAprovacao,
} from "./aprovacoes-data";
import { AprovarSolicitacaoModal } from "./AprovarSolicitacaoModal";
import { RejeitarSolicitacaoModal } from "./RejeitarSolicitacaoModal";
import { SolicitarMaisInformacoesModal } from "./SolicitarMaisInformacoesModal";
import { NovaAprovacaoModal } from "./NovaAprovacaoModal";
import { FiltrosAvancadosModal } from "./FiltrosAvancadosModal";

interface AprovacoesHistoricoViewProps {
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
  onNavegarRelatorios?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

type AbaAtiva =
  | "aprovacoes"
  | "historico"
  | "logs"
  | "decisoes"
  | "auditoria"
  | "alertas"
  | "configuracoes";

export function AprovacoesHistoricoView({
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
  onNavegarRelatorios,
}: AprovacoesHistoricoViewProps) {
  // Dados REAIS do runtime de agentes (o restante da tela é demonstrativo).
  const equipeReal = useEquipeReal();
  // Aba Ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("aprovacoes");

  // Modais
  const [modalAprovarItem, setModalAprovarItem] = useState<SolicitacaoAprovacaoItem | null>(null);
  const [modalRejeitarItem, setModalRejeitarItem] = useState<SolicitacaoAprovacaoItem | null>(null);
  const [modalInfoItem, setModalInfoItem] = useState<SolicitacaoAprovacaoItem | null>(null);
  const [modalNovaAprovacaoAberto, setModalNovaAprovacaoAberto] = useState(false);
  const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false);

  // Estados locais da tabela
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAprovacaoItem[]>(SOLICITACOES_INICIAIS);
  const [solicitacaoSelecionadaId, setSolicitacaoSelecionadaId] = useState<string>("sol-241");
  const [itensMarcados, setItensMarcados] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroAgente, setFiltroAgente] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("recentes");

  // Toast feedback
  const [mensagemToast, setMensagemToast] = useState<string | null>(null);

  const dispararToast = (msg: string) => {
    setMensagemToast(msg);
    setTimeout(() => setMensagemToast(null), 3500);
  };

  // Solicitação atualmente selecionada no painel direito
  const solicitacaoAtiva =
    solicitacoes.find((s) => s.id === solicitacaoSelecionadaId) || solicitacoes[0];

  // Aprovar solicitação localmente
  const handleConfirmarAprovacao = (id: string, justificativa: string) => {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "aprovado" as const } : s)),
    );
    setModalAprovarItem(null);
    dispararToast(`Solicitação aprovada! Decisão registrada com sucesso.`);
  };

  // Rejeitar solicitação localmente
  const handleConfirmarRejeicao = (id: string, motivo: string) => {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "rejeitado" as const } : s)),
    );
    setModalRejeitarItem(null);
    dispararToast(`Solicitação rejeitada com justificativa enviada ao agente.`);
  };

  // Devolver solicitação pedindo mais dados
  const handleConfirmarMaisInfo = (id: string, perguntas: string) => {
    setSolicitacoes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "aguardando_info" as const } : s)),
    );
    setModalInfoItem(null);
    dispararToast(`Solicitação devolvida com status "Aguardando informações".`);
  };

  // Criar nova solicitação
  const handleCriarSolicitacao = (
    nova: Omit<SolicitacaoAprovacaoItem, "id" | "numero" | "solicitadoEm">,
  ) => {
    const id = `sol-${Date.now()}`;
    const numero = `#${240 + solicitacoes.length + 1}`;
    const criado: SolicitacaoAprovacaoItem = {
      ...nova,
      id,
      numero,
      solicitadoEm: "Agora",
    };
    setSolicitacoes((prev) => [criado, ...prev]);
    setSolicitacaoSelecionadaId(id);
    setModalNovaAprovacaoAberto(false);
    dispararToast(`Solicitação ${numero} cadastrada na fila de governança.`);
  };

  // Seleção múltipla
  const handleToggleMarcarTodos = () => {
    if (itensMarcados.length === solicitacoes.length) {
      setItensMarcados([]);
    } else {
      setItensMarcados(solicitacoes.map((s) => s.id));
    }
  };

  const handleToggleItem = (id: string) => {
    setItensMarcados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Exportar dados demonstrativos
  const handleExportar = () => {
    const dados = solicitacoes.map((s) => ({
      numero: s.numero,
      titulo: s.titulo,
      agente: s.agenteNome,
      tipo: s.tipoRotulo,
      valor: s.valorOuImpacto,
      status: s.status,
      solicitadoEm: s.solicitadoEm,
    }));
    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aprovacoes-demonstrativas.json";
    a.click();
    URL.revokeObjectURL(url);
    dispararToast("Exportação demonstrativa de solicitações realizada.");
  };

  // Filtragem
  const solicitacoesFiltradas = solicitacoes.filter((s) => {
    if (
      termoBusca &&
      !s.titulo.toLowerCase().includes(termoBusca.toLowerCase()) &&
      !s.subtitulo.toLowerCase().includes(termoBusca.toLowerCase()) &&
      !s.numero.toLowerCase().includes(termoBusca.toLowerCase())
    ) {
      return false;
    }
    if (filtroTipo !== "todos" && s.tipo !== filtroTipo) return false;
    if (filtroAgente !== "todos" && !s.agenteNome.toLowerCase().includes(filtroAgente.toLowerCase())) {
      return false;
    }
    if (filtroStatus !== "todos" && s.status !== filtroStatus) return false;
    return true;
  });

  // Retorna classe e rótulo do status
  const getStatusBadge = (status: StatusAprovacao) => {
    switch (status) {
      case "pendente":
        return {
          classe: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          rotulo: "● Pendente",
        };
      case "aprovado":
        return {
          classe: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
          rotulo: "● Aprovado",
        };
      case "rejeitado":
        return {
          classe: "bg-rose-500/15 border-rose-500/30 text-rose-400",
          rotulo: "● Rejeitado",
        };
      case "em_execucao":
        return {
          classe: "bg-blue-500/15 border-blue-500/30 text-blue-400",
          rotulo: "● Em execução",
        };
      case "aguardando_info":
      default:
        return {
          classe: "bg-purple-500/15 border-purple-500/30 text-purple-400",
          rotulo: "● Aguardando info",
        };
    }
  };

  // Retorna classe do tipo
  const getTipoBadge = (tipo: SolicitacaoAprovacaoItem["corTipo"]) => {
    switch (tipo) {
      case "roxo":
        return "bg-purple-900/50 border-purple-500/30 text-purple-300";
      case "azul":
        return "bg-blue-900/50 border-blue-500/30 text-blue-300";
      case "verde":
        return "bg-emerald-900/50 border-emerald-500/30 text-emerald-300";
      case "indigo":
        return "bg-indigo-900/50 border-indigo-500/30 text-indigo-300";
      case "laranja":
        return "bg-orange-900/50 border-orange-500/30 text-orange-300";
      case "rosa":
      default:
        return "bg-rose-900/50 border-rose-500/30 text-rose-300";
    }
  };

  return (
    <div className="space-y-5 p-4 lg:p-7 max-w-[1600px] mx-auto text-neutral-100 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {mensagemToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{mensagemToast}</span>
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
            <span className="text-[#f95d14] font-medium">Aprovações & Histórico</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
                Aprovações & Histórico
              </h1>
              <p className="text-xs text-neutral-400">
                Revise, aprove e acompanhe todas as ações dos agentes.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtros avançados */}
          <button
            type="button"
            onClick={() => setModalFiltrosAberto(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-all shadow-sm"
          >
            <Sliders className="size-3.5 text-neutral-400" />
            <span>Filtros avançados</span>
          </button>

          {/* Exportar */}
          <button
            type="button"
            onClick={handleExportar}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-all shadow-sm"
          >
            <Download className="size-3.5 text-neutral-400" />
            <span>Exportar</span>
          </button>

          {/* Nova aprovação */}
          <button
            type="button"
            onClick={() => setModalNovaAprovacaoAberto(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f95d14] to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span>Nova aprovação</span>
          </button>
        </div>
      </div>

      <AprovacoesRealPanel eq={equipeReal} />

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
                Todas as ações importantes passam por sua revisão e aprovação, com total transparência e rastreabilidade.
              </p>

              {/* Tags de Governança */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Governança", "Segurança", "Transparência", "Auditoria"].map((tag) => (
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
            {INDICADORES_SUPERIORES_APROVACOES.map((ind) => {
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
                  <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
                    <span>{ind.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha Inferior do Hero: Tempo Médio & Histograma de Ações */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Clock className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Tempo médio de aprovação
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-base font-bold text-white">16 min</span>
                <span className="text-[11px] text-emerald-400 font-medium">-32% este mês</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Zap className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Ações dos agentes (últimos 30 dias)
                </span>
                <div className="text-base font-bold text-white leading-tight">192</div>
              </div>
            </div>

            {/* Histograma Mini SVG */}
            <div className="flex items-end gap-0.5 h-6 w-36 px-1">
              {HISTOGRAMA_ACOES_30_DIAS.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-xs bg-[#f95d14] opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${(val / 30) * 100}%` }}
                  title={`${val} ações`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ABAS DE NAVEGAÇÃO INTERNA DA GOVERNANÇA
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "aprovacoes", label: "Aprovações" },
          { id: "historico", label: "Histórico de Ações" },
          { id: "logs", label: "Logs de Execução" },
          { id: "decisoes", label: "Decisões do CEO" },
          { id: "auditoria", label: "Auditoria" },
          { id: "alertas", label: "Alertas" },
          { id: "configuracoes", label: "Configurações" },
        ].map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva(aba.id as AbaAtiva)}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap",
              abaAtiva === aba.id
                ? "bg-[#f95d14] text-white shadow-md shadow-orange-500/20"
                : "border border-white/5 bg-[#101622] text-neutral-400 hover:text-white hover:bg-[#161f30]",
            )}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          4. SEÇÃO PRINCIPAL: TABELA DE SOLICITAÇÕES & PAINEL DE DETALHES
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Lado Esquerdo: Tabela de Solicitações (8 Colunas no Desktop) */}
        <div className={cn(PANEL_CLASS, "lg:col-span-8 p-4 lg:p-5 space-y-4")}>
          {/* Topo da Tabela: Título & Subtítulo */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                Solicitações de Aprovação ({solicitacoesFiltradas.length})
              </h2>
              <p className="text-xs text-neutral-400">
                Revise e aprove as ações propostas pelos agentes.
              </p>
            </div>

            {itensMarcados.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-neutral-300 font-semibold">
                  {itensMarcados.length} selecionados
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSolicitacoes((prev) =>
                      prev.map((s) =>
                        itensMarcados.includes(s.id)
                          ? { ...s, status: "aprovado" as const }
                          : s,
                      ),
                    );
                    setItensMarcados([]);
                    dispararToast("Aprovações em lote registradas com sucesso.");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors"
                >
                  Aprovar em lote
                </button>
              </div>
            )}
          </div>

          {/* Linha de Filtros Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-4 relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar solicitações..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101622] pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101622] px-2.5 py-1.5 text-xs text-neutral-300 focus:border-[#f95d14] focus:outline-none"
              >
                <option value="todos">Todos os tipos</option>
                <option value="campanha">Campanha</option>
                <option value="prospeccao">Prospecção</option>
                <option value="reunioes">Reuniões</option>
                <option value="propostas">Propostas</option>
                <option value="integracao">Integração</option>
                <option value="treinamento">Treinamento</option>
                <option value="meta">Meta</option>
                <option value="equipe">Equipe</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroAgente}
                onChange={(e) => setFiltroAgente(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101622] px-2.5 py-1.5 text-xs text-neutral-300 focus:border-[#f95d14] focus:outline-none"
              >
                <option value="todos">Todos os agentes</option>
                <option value="Estrategista">Estrategista</option>
                <option value="SDR">SDR</option>
                <option value="Prospecção">Prospecção</option>
                <option value="Vendedor">Vendedor</option>
                <option value="SEO Geral">SEO Geral</option>
                <option value="CEO de IA">CEO de IA</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101622] px-2 py-1.5 text-xs text-neutral-300 focus:border-[#f95d14] focus:outline-none"
              >
                <option value="todos">Todos status</option>
                <option value="pendente">Pendentes</option>
                <option value="aprovado">Aprovadas</option>
                <option value="rejeitado">Rejeitadas</option>
                <option value="em_execucao">Em execução</option>
              </select>
            </div>
          </div>

          {/* Tabela de Solicitações */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-2.5 px-2 w-8">
                    <input
                      type="checkbox"
                      checked={
                        itensMarcados.length === solicitacoes.length &&
                        solicitacoes.length > 0
                      }
                      onChange={handleToggleMarcarTodos}
                      className="rounded border-neutral-700 bg-neutral-800 text-[#f95d14] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Solicitação</th>
                  <th className="py-2.5 px-2">Agente</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2">Valor / Impacto</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Solicitado em</th>
                  <th className="py-2.5 px-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {solicitacoesFiltradas.map((item) => {
                  const isSelected = item.id === solicitacaoSelecionadaId;
                  const isChecked = itensMarcados.includes(item.id);
                  const st = getStatusBadge(item.status);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSolicitacaoSelecionadaId(item.id)}
                      className={cn(
                        "transition-colors cursor-pointer group",
                        isSelected
                          ? "bg-[#f95d14]/10 border-l-2 border-l-[#f95d14]"
                          : "hover:bg-white/[0.03]",
                      )}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleItem(item.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-neutral-700 bg-neutral-800 text-[#f95d14] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Número */}
                      <td className="py-3 px-2 font-mono text-neutral-400 font-semibold">
                        {item.numero}
                      </td>

                      {/* Título e Subtítulo */}
                      <td className="py-3 px-2 min-w-[200px]">
                        <div className="font-bold text-white truncate group-hover:text-neutral-100">
                          {item.titulo}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {item.subtitulo}
                        </div>
                      </td>

                      {/* Agente Solicitante */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.agenteAvatar}
                            alt={item.agenteNome}
                            className="size-6 rounded-full object-cover border border-white/10"
                          />
                          <span className="font-semibold text-neutral-200">
                            {item.agenteNome}
                          </span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-semibold border",
                            getTipoBadge(item.corTipo),
                          )}
                        >
                          {item.tipoRotulo}
                        </span>
                      </td>

                      {/* Valor / Impacto */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <div className="font-bold text-neutral-100 leading-tight">
                          {item.valorOuImpacto}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {item.valorSub}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            st.classe,
                          )}
                        >
                          {st.rotulo}
                        </span>
                      </td>

                      {/* Solicitado em */}
                      <td className="py-3 px-2 whitespace-nowrap font-mono text-[10px] text-neutral-400">
                        {item.solicitadoEm}
                      </td>

                      {/* Ações */}
                      <td
                        className="py-3 px-2 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.status === "pendente" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Aprovar */}
                            <button
                              type="button"
                              onClick={() => setModalAprovarItem(item)}
                              className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                              title="Aprovar"
                            >
                              <Check className="size-3.5" />
                            </button>
                            {/* Rejeitar */}
                            <button
                              type="button"
                              onClick={() => setModalRejeitarItem(item)}
                              className="flex size-7 items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm"
                              title="Rejeitar"
                            >
                              <X className="size-3.5" />
                            </button>
                            {/* Mais opções */}
                            <button
                              type="button"
                              onClick={() => setModalInfoItem(item)}
                              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#161f30] hover:bg-[#202b40] text-neutral-300 transition-colors"
                              title="Solicitar informações"
                            >
                              <MoreVertical className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setSolicitacaoSelecionadaId(item.id)}
                              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-[#161f30] hover:bg-[#202b40] text-neutral-400 hover:text-white transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lado Direito: Painel de Detalhes da Solicitação (4 Colunas no Desktop) */}
        <div className={cn(PANEL_CLASS, "lg:col-span-4 p-5 space-y-4")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Detalhes da Solicitação
            </h3>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                getStatusBadge(solicitacaoAtiva.status).classe,
              )}
            >
              {getStatusBadge(solicitacaoAtiva.status).rotulo}
            </span>
          </div>

          {/* Título & Subtítulo */}
          <div className="space-y-1">
            <div className="text-sm font-bold text-white flex items-start gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                <Target className="size-3.5" />
              </div>
              <span>{solicitacaoAtiva.titulo}</span>
            </div>
            <p className="text-xs text-neutral-400 pl-8">
              {solicitacaoAtiva.subtitulo}
            </p>
          </div>

          {/* Agente Solicitante */}
          <div className="pt-2 border-t border-white/5 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-neutral-400">
              Agente solicitante
            </span>
            <div className="flex items-center gap-2.5 pt-1">
              <img
                src={solicitacaoAtiva.agenteAvatar}
                alt={solicitacaoAtiva.agenteNome}
                className="size-8 rounded-xl object-cover border border-white/10 shrink-0"
              />
              <div>
                <div className="text-xs font-bold text-white">
                  {solicitacaoAtiva.agenteNome}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {solicitacaoAtiva.agenteCargo}
                </div>
              </div>
            </div>
          </div>

          {/* Tipo de Ação */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase text-neutral-400">
              Tipo de ação
            </span>
            <div>
              <span
                className={cn(
                  "inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border mt-0.5",
                  getTipoBadge(solicitacaoAtiva.corTipo),
                )}
              >
                {solicitacaoAtiva.tipoRotulo}
              </span>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase text-neutral-400">
              Descrição
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed bg-[#101622] p-2.5 rounded-xl border border-white/5">
              {solicitacaoAtiva.descricaoCompleta}
            </p>
          </div>

          {/* Dados Chave */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
              <span className="text-neutral-400">Valor / Orçamento</span>
              <div className="text-right">
                <span className="font-bold text-white">
                  {solicitacaoAtiva.orcamento || solicitacaoAtiva.valorOuImpacto}
                </span>
                <div className="text-[9px] text-neutral-500">
                  {solicitacaoAtiva.valorSub}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
              <span className="text-neutral-400">Período</span>
              <span className="font-semibold text-white">
                {solicitacaoAtiva.periodo || "Esta semana"}
              </span>
            </div>

            {solicitacaoAtiva.canais && (
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-neutral-400">Canais</span>
                <div className="flex items-center gap-1.5">
                  {solicitacaoAtiva.canais.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-[#162030] border border-white/10 text-[10px] text-neutral-300 font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {solicitacaoAtiva.publicoAlvo && (
              <div className="flex items-start justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-neutral-400">Público-alvo</span>
                <span className="font-medium text-neutral-200 text-right max-w-[200px]">
                  {solicitacaoAtiva.publicoAlvo}
                </span>
              </div>
            )}

            {solicitacaoAtiva.objetivo && (
              <div className="flex items-start justify-between pb-1">
                <span className="text-neutral-400">Objetivo</span>
                <span className="font-medium text-neutral-200 text-right max-w-[200px]">
                  {solicitacaoAtiva.objetivo}
                </span>
              </div>
            )}
          </div>

          {/* Documentos Anexos */}
          {solicitacaoAtiva.anexos && solicitacaoAtiva.anexos.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[10px] font-semibold uppercase text-neutral-400">
                Documentos anexos ({solicitacaoAtiva.anexos.length})
              </span>
              <div className="space-y-1.5">
                {solicitacaoAtiva.anexos.map((arq) => (
                  <div
                    key={arq.nome}
                    onClick={() =>
                      dispararToast(
                        `Arquivo demonstrativo "${arq.nome}". Download disponível na fase de integração.`,
                      )
                    }
                    className="flex items-center justify-between p-2 rounded-xl bg-[#101622] border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {arq.tipo === "pdf" ? (
                        <FileText className="size-4 text-rose-400 shrink-0" />
                      ) : (
                        <FileSpreadsheet className="size-4 text-emerald-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {arq.nome}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {arq.tamanho}
                        </div>
                      </div>
                    </div>
                    <Download className="size-3.5 text-neutral-500 hover:text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação do Painel Direito */}
          {solicitacaoAtiva.status === "pendente" && (
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalAprovarItem(solicitacaoAtiva)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md shadow-emerald-500/20 transition-all active:scale-98"
                >
                  <Check className="size-4" />
                  <span>Aprovar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalRejeitarItem(solicitacaoAtiva)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white shadow-md shadow-rose-500/20 transition-all active:scale-98"
                >
                  <X className="size-4" />
                  <span>Rejeitar</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalInfoItem(solicitacaoAtiva)}
                className="w-full text-center text-xs font-semibold text-[#f95d14] hover:underline pt-1"
              >
                ⟳ Solicitar mais informações
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          5. CARDS INFERIORES: AÇÕES POR TIPO, HISTÓRICO & TOP AGENTES
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Ações por Tipo (últimos 30 dias) - 4 Colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-4 p-4 space-y-3")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">
              Ações por Tipo <span className="text-neutral-500 font-normal">(últimos 30 dias)</span>
            </h3>
            <span className="text-[11px] font-medium text-neutral-400">Últimos 30 dias</span>
          </div>

          <div className="flex items-center gap-4 pt-1">
            {/* Gráfico Rosca SVG */}
            <div className="relative size-32 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                {/* Círculo base */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#1c2438"
                  strokeWidth="3.8"
                />
                {/* Segmentos coloridos */}
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#a855f7"
                  strokeWidth="4"
                  strokeDasharray="28 72"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="4"
                  strokeDasharray="22 78"
                  strokeDashoffset="-28"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="18 82"
                  strokeDashoffset="-50"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#6366f1"
                  strokeWidth="4"
                  strokeDasharray="14 86"
                  strokeDashoffset="-68"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="4"
                  strokeDasharray="10 90"
                  strokeDashoffset="-82"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="transparent"
                  stroke="#f97316"
                  strokeWidth="4"
                  strokeDasharray="6 94"
                  strokeDashoffset="-92"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-white leading-none">192</span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">
                  Ações
                </span>
              </div>
            </div>

            {/* Legenda Lateral */}
            <div className="flex-1 space-y-1 text-xs">
              {ACOES_POR_TIPO.map((ac) => (
                <div key={ac.rotulo} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: ac.cor }}
                    />
                    <span className="text-neutral-300 text-[11px]">{ac.rotulo}</span>
                  </div>
                  <span className="font-mono text-neutral-400 text-[11px] font-semibold">
                    {ac.porcentagem}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Histórico de Aprovações - 5 Colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-5 p-4 space-y-3")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Histórico de Aprovações</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400" /> Aprovadas
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="size-2 rounded-full bg-rose-400" /> Rejeitadas
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="size-2 rounded-full bg-amber-400" /> Pendentes
              </span>
            </div>
          </div>

          {/* Gráfico de Linhas SVG */}
          <div className="pt-2">
            <svg viewBox="0 0 320 120" className="w-full h-32 overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="320" y2="20" stroke="#1c2438" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="320" y2="50" stroke="#1c2438" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="320" y2="80" stroke="#1c2438" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="320" y2="110" stroke="#1c2438" strokeDasharray="3 3" />

              {/* Linha Aprovadas (Emerald) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points="10,65 60,55 110,45 160,58 210,48 260,42 310,30"
              />
              {/* Pontos Aprovadas */}
              {[
                [10, 65],
                [60, 55],
                [110, 45],
                [160, 58],
                [210, 48],
                [260, 42],
                [310, 30],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="#10b981" />
              ))}

              {/* Linha Pendentes (Amber) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                points="10,95 60,90 110,92 160,86 210,88 260,90 310,86"
              />
              {[
                [10, 95],
                [60, 90],
                [110, 92],
                [160, 86],
                [210, 88],
                [260, 90],
                [310, 86],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="#f59e0b" />
              ))}

              {/* Linha Rejeitadas (Rose) */}
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                points="10,105 60,108 110,102 160,105 210,100 260,105 310,108"
              />
              {[
                [10, 105],
                [60, 108],
                [110, 102],
                [160, 105],
                [210, 100],
                [260, 105],
                [310, 108],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="#f43f5e" />
              ))}
            </svg>

            {/* Datas no eixo X */}
            <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mt-1 px-1">
              {PONTOS_HISTORICO_APROVACOES.map((p) => (
                <span key={p.data}>{p.data}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Top Agentes (solicitações) - 3 Colunas */}
        <div className={cn(PANEL_CLASS, "lg:col-span-3 p-4 space-y-2.5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Top Agentes</h3>
            <span className="text-[10px] text-neutral-500 font-mono">Últimos 30 dias</span>
          </div>

          <div className="space-y-2 pt-1">
            {TOP_AGENTES_SOLICITACOES.map((ag) => (
              <div key={ag.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={ag.avatarUrl}
                      alt={ag.nome}
                      className="size-5 rounded-full object-cover border border-white/10"
                    />
                    <span className="font-semibold text-neutral-200 text-[11px]">
                      {ag.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="font-bold text-white">{ag.solicitacoes}</span>
                    <span className="text-neutral-500">{ag.porcentagem}%</span>
                  </div>
                </div>

                {/* Barra de Progresso Laranja */}
                <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f95d14]"
                    style={{ width: `${ag.porcentagem * 3.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. MODAIS INTERATIVOS
          ========================================================================= */}
      <AprovarSolicitacaoModal
        solicitacao={modalAprovarItem}
        onFechar={() => setModalAprovarItem(null)}
        onConfirmar={handleConfirmarAprovacao}
      />

      <RejeitarSolicitacaoModal
        solicitacao={modalRejeitarItem}
        onFechar={() => setModalRejeitarItem(null)}
        onConfirmar={handleConfirmarRejeicao}
      />

      <SolicitarMaisInformacoesModal
        solicitacao={modalInfoItem}
        onFechar={() => setModalInfoItem(null)}
        onConfirmar={handleConfirmarMaisInfo}
      />

      <NovaAprovacaoModal
        aberto={modalNovaAprovacaoAberto}
        onFechar={() => setModalNovaAprovacaoAberto(false)}
        onCriar={handleCriarSolicitacao}
      />

      <FiltrosAvancadosModal
        aberto={modalFiltrosAberto}
        onFechar={() => setModalFiltrosAberto(false)}
        onAplicar={(f) => {
          setFiltroTipo(f.tipo);
          setFiltroAgente(f.agente);
          setFiltroStatus(f.status);
          dispararToast("Filtros avançados aplicados com sucesso.");
        }}
      />
    </div>
  );
}
