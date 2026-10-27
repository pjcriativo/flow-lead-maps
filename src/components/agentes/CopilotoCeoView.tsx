// Tela 10 — Copiloto do CEO de IA
// Central de comunicação e comando do executivo digital para planejar, montar e coordenar a operação comercial.
// Reproduz fielmente a imagem de referência aprovada (media_1792739962352.jpg) com máxima precisão estética e interativa.
import React, { useState } from "react";
import { CEO_IA_REAL_HABILITADO, perguntarAoCeo } from "@/services/agente-ceo";
import { copilotoRealPronto } from "@/lib/ceo-config";
import { CeoCopilotoBanner, CeoEstadoPill } from "./CeoRealUi";
import { useCeoReal } from "./useCeoReal";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  CornerDownLeft,
  Crown,
  Database,
  DollarSign,
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
  HeartHandshake,
  History,
  Layers,
  LayoutGrid,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  Mic,
  Paperclip,
  Percent,
  Play,
  Plus,
  PlusCircle,
  Radio,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES_SUPERIORES_COPILOTO,
  CONVERSAS_RECENTES_INICIAIS,
  PLANO_VENDAS_Q4,
  MENSAGENS_CHAT_INICIAIS,
  ACOES_RAPIDAS_COPILOTO,
  AGENTES_DISPONIVEIS_COPILOTO,
  CONTEXTO_ATUAL_INICIAL,
  ATALHOS_ABAIXO_CHAT,
  type ConversaRecenteItem,
  type MensagemChat,
  type PlanoVendasResumo,
  type ContextoComercial,
} from "./copiloto-data";
import { NovoPlanoVendasModal } from "./NovoPlanoVendasModal";
import { VisualizarPlanoModal } from "./VisualizarPlanoModal";
import { EditarContextoModal } from "./EditarContextoModal";
import { ArquivoExemploModal } from "./ArquivoExemploModal";

interface CopilotoCeoViewProps {
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
  onNavegarAprovacoes?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

export function CopilotoCeoView({
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
  onNavegarAprovacoes,
}: CopilotoCeoViewProps) {
  // Modais
  const [modalNovoPlanoAberto, setModalNovoPlanoAberto] = useState(false);
  const [modalVisualizarPlanoAberto, setModalVisualizarPlanoAberto] = useState(false);
  const [modalEditarContextoAberto, setModalEditarContextoAberto] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<{
    nome: string;
    subtitulo: string;
    tipo: "pdf" | "xlsx" | "json";
  } | null>(null);

  // Estados de dados locais
  const [conversas, setConversas] = useState<ConversaRecenteItem[]>(
    CONVERSAS_RECENTES_INICIAIS,
  );
  const [conversaAtivaId, setConversaAtivaId] = useState<string>("conv-1");
  const [mensagens, setMensagens] = useState<MensagemChat[]>(MENSAGENS_CHAT_INICIAIS);
  const [textoMensagem, setTextoMensagem] = useState("");
  const [ceoRespondendo, setCeoRespondendo] = useState(false);
  // Estado REAL do CEO (só consultado quando o Copiloto real está habilitado neste ambiente).
  const ceoReal = useCeoReal(CEO_IA_REAL_HABILITADO);
  const copilotoPronto = copilotoRealPronto(CEO_IA_REAL_HABILITADO, ceoReal.estado);
  const bloqueadoPorEstado = CEO_IA_REAL_HABILITADO && !copilotoPronto;
  const [planoVendas, setPlanoVendas] = useState<PlanoVendasResumo>(PLANO_VENDAS_Q4);
  const [nichoAtivo, setNichoAtivo] = useState("Clínicas Odontológicas");
  const [contexto, setContexto] = useState<ContextoComercial>(CONTEXTO_ATUAL_INICIAL);
  const [termoBuscaConversa, setTermoBuscaConversa] = useState("");

  // Feedback Toast
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  const dispararToast = (msg: string) => {
    setMensagemFeedback(msg);
    setTimeout(() => setMensagemFeedback(null), 3500);
  };

  // Enviar mensagem. Com VITE_CEO_IA_REAL desligada (padrão) o chat segue demonstrativo; ligada,
  // o CEO de IA responde com dados reais via Edge `agent-ceo` (somente leitura).
  const handleEnviarMensagem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textoMensagem.trim() || ceoRespondendo || bloqueadoPorEstado) return;

    const novaMsgUsuario: MensagemChat = {
      id: `msg-${Date.now()}`,
      remetente: "usuario",
      nome: "Marcos Gonçalves",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      conteudo: textoMensagem.trim(),
    };
    const montarRespostaCeo = (conteudo: string): MensagemChat => ({
      id: `msg-ceo-${Date.now() + 1}`,
      remetente: "ceo",
      nome: "CEO de IA",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
      horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      conteudo,
    });

    if (!CEO_IA_REAL_HABILITADO) {
      setMensagens((prev) => [
        ...prev,
        novaMsgUsuario,
        montarRespostaCeo(
          "Mensagem registrada nesta demonstração frontend. O CEO de IA será conectado ao motor de inteligência artificial na etapa de integração.",
        ),
      ]);
      setTextoMensagem("");
      return;
    }

    const historico = mensagens.slice(-10).map((m) => ({
      role: m.remetente === "usuario" ? ("user" as const) : ("assistant" as const),
      content: m.conteudo,
    }));
    setMensagens((prev) => [...prev, novaMsgUsuario]);
    setTextoMensagem("");
    setCeoRespondendo(true);
    try {
      const r = await perguntarAoCeo({
        mensagem: novaMsgUsuario.conteudo,
        clientMessageId: crypto.randomUUID(),
        historico,
      });
      setMensagens((prev) => [...prev, montarRespostaCeo(r.ok ? r.resposta : r.mensagem)]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        montarRespostaCeo("Não foi possível consultar o CEO de IA agora."),
      ]);
    } finally {
      setCeoRespondendo(false);
    }
  };

  // Criar nova conversa local
  const handleNovaConversa = () => {
    const id = `conv-${Date.now()}`;
    const nova: ConversaRecenteItem = {
      id,
      titulo: `Nova Estratégia Comercial #${conversas.length + 1}`,
      subtitulo: "Planejamento e coordenação",
      horario: "Agora",
      selecionada: true,
      categoria: "estrategia",
    };
    setConversas((prev) => [nova, ...prev.map((c) => ({ ...c, selecionada: false }))]);
    setConversaAtivaId(id);
    dispararToast("Nova sessão do Copiloto iniciada.");
  };

  // Salvar novo plano do modal
  const handleSalvarPlano = (novo: {
    empresa: string;
    segmento: string;
    ticketMedio: string;
    metaFaturamento: string;
    orcamentoMensal: string;
    nichos: string;
    prazo: string;
  }) => {
    setModalNovoPlanoAberto(false);
    setContexto((prev) => ({
      ...prev,
      metaPrincipal: novo.metaFaturamento,
      orcamentoMensal: novo.orcamentoMensal,
      planoDeVendas: novo.prazo,
      ultimaAtualizacao: "Agora",
    }));
    dispararToast(`Plano para ${novo.empresa} estruturado com sucesso!`);
  };

  // Filtragem de conversas na busca
  const conversasFiltradas = conversas.filter((c) =>
    c.titulo.toLowerCase().includes(termoBuscaConversa.toLowerCase()) ||
    c.subtitulo.toLowerCase().includes(termoBuscaConversa.toLowerCase()),
  );

  return (
    <div className="space-y-5 p-4 lg:p-7 max-w-[1600px] mx-auto text-neutral-100 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {mensagemFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{mensagemFeedback}</span>
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
            <span className="text-[#f95d14] font-medium">Copiloto de IA</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
                Copiloto do CEO de IA
              </h1>
              <p className="text-xs text-neutral-400">
                Converse, planeje e coordene toda a operação comercial.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nova sessão */}
          <button
            type="button"
            onClick={handleNovaConversa}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-all shadow-sm"
          >
            <Plus className="size-3.5 text-neutral-400" />
            <span>Nova sessão</span>
          </button>

          {/* Histórico de conversas */}
          <button
            type="button"
            onClick={() => dispararToast("Histórico de sessões do Copiloto sincronizado.")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121722] px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-all shadow-sm"
          >
            <History className="size-3.5 text-neutral-400" />
            <span>Histórico de conversas</span>
          </button>

          {/* Novo plano de vendas */}
          <button
            type="button"
            onClick={() => setModalNovoPlanoAberto(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f95d14] to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span>Novo plano de vendas</span>
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
                {CEO_IA_REAL_HABILITADO ? (
                  <CeoEstadoPill estado={ceoReal.estado} />
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    Demonstração
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-400 font-medium">
                Orquestrador Geral da Operação Comercial
              </p>

              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                Seu copiloto estratégico para planejamento, tomada de decisão e execução da operação comercial com agentes de IA.
              </p>

              {/* Tags de Especialidades */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Estratégia", "Planejamento", "Gestão de Equipe", "Resultados"].map((tag) => (
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
            {INDICADORES_SUPERIORES_COPILOTO.map((ind) => {
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
                    <span>{ind.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha Inferior do Hero: Objetivo Atual & Equipe Ativa */}
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Objetivo atual */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Target className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold uppercase tracking-wider text-neutral-400">
                  Objetivo atual:
                </span>
                <span className="font-bold text-emerald-400">68%</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">
                Aumentar vendas em 30% no próximo trimestre
              </p>
              {/* Barra de Progresso Laranja */}
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f95d14] to-orange-500 transition-all duration-500"
                  style={{ width: "68%" }}
                />
              </div>
            </div>
          </div>

          {/* Equipe ativa & Botão Gerenciar equipe */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Users className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Equipe ativa
                </span>
                <div className="text-xs font-bold text-white">
                  5 agentes <span className="text-neutral-500 font-normal">Operacionais</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavegarEquipe}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121722] px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-colors"
            >
              <Users className="size-3 text-neutral-400" />
              <span>Gerenciar equipe</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. LAYOUT PRINCIPAL EM 3 COLUNAS DO COPILOTO
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =====================================================================
            COLUNA ESQUERDA (3 colunas): CONVERSAS RECENTES
            ===================================================================== */}
        <div className={cn(PANEL_CLASS, "lg:col-span-3 p-4 space-y-3.5 flex flex-col")}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Conversas recentes</span>
            <div className="relative">
              <Search className="size-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={termoBuscaConversa}
              onChange={(e) => setTermoBuscaConversa(e.target.value)}
              className="w-full rounded-xl border border-white/5 bg-[#101622] pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          {/* Lista de Sessões */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {conversasFiltradas.map((conv) => {
              const ativa = conv.id === conversaAtivaId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setConversaAtivaId(conv.id);
                    setConversas((prev) =>
                      prev.map((c) => ({ ...c, selecionada: c.id === conv.id })),
                    );
                  }}
                  className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left",
                    ativa
                      ? "bg-[#f95d14]/15 border-[#f95d14]/50 shadow-md shadow-orange-500/10 text-white"
                      : "bg-[#101622]/60 border-transparent hover:bg-white/5 text-neutral-300",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg shrink-0 mt-0.5",
                      ativa
                        ? "bg-[#f95d14]/20 text-[#f95d14]"
                        : "bg-white/5 text-neutral-400",
                    )}
                  >
                    <MessageSquare className="size-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">
                        {conv.titulo}
                      </span>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {conv.horario}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {conv.subtitulo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Nova Conversa */}
          <button
            type="button"
            onClick={handleNovaConversa}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#121722] py-2 text-xs font-semibold text-neutral-200 hover:bg-[#182030] hover:text-white transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Nova conversa</span>
          </button>
        </div>

        {/* =====================================================================
            COLUNA CENTRAL (6 colunas): CHAT DO CEO & PLANO INTERATIVO
            ===================================================================== */}
        <div className={cn(PANEL_CLASS, "lg:col-span-6 p-4 lg:p-5 flex flex-col justify-between min-h-[720px]")}>
          {/* Área de Mensagens com Rolagem */}
          <div className="space-y-5 max-h-[560px] overflow-y-auto pr-1">
            {/* Mensagem 1: Usuário (Marcos) */}
            <div className="flex justify-end gap-3">
              <div className="max-w-xl space-y-1 text-right">
                <div className="inline-block rounded-2xl rounded-tr-sm bg-[#162134] border border-blue-500/20 px-4 py-3 text-xs text-neutral-100 shadow-md leading-relaxed text-left">
                  Quero aumentar as vendas em 30% no próximo trimestre. Monte um plano completo de ação com nichos, estratégias, agentes, campanhas e metas semanais.
                </div>
                <div className="text-[10px] text-neutral-500 font-mono pr-1">
                  14:32
                </div>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f95d14] text-xs font-bold text-white shadow-md">
                M
              </div>
            </div>

            {/* Mensagem 2: CEO de IA com Card de Plano de Vendas */}
            <div className="flex items-start gap-3">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80"
                alt="CEO de IA"
                className="size-8 rounded-full object-cover shrink-0 border border-amber-500/40"
              />

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">CEO de IA</span>
                  <span className="text-[10px] text-neutral-500 font-mono">14:33</span>
                </div>

                <div className="rounded-2xl rounded-tl-sm bg-[#101726] border border-white/5 p-4 text-xs text-neutral-200 leading-relaxed space-y-3">
                  <p>
                    Perfeito, Marcos! Vou criar um plano completo para aumentar as vendas em 30% no próximo trimestre. Aqui está a proposta estruturada com todos os detalhes:
                  </p>

                  {/* =========================================================
                      CARD INTERATIVO DO PLANO DE VENDAS — Q4 2026
                      ========================================================= */}
                  <div className="rounded-xl border border-white/10 bg-[#0a0f19] p-4 space-y-4">
                    {/* Cabeçalho do Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {planoVendas.titulo}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalVisualizarPlanoAberto(true)}
                        className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-[#f95d14] hover:bg-orange-500/20 transition-colors"
                      >
                        Visualizar completo
                      </button>
                    </div>

                    {/* 3 Blocos Superiores do Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-purple-400">
                          <Target className="size-3.5" />
                          <span className="text-[10px] font-semibold">Meta Principal</span>
                        </div>
                        <div className="text-xs font-bold text-white leading-tight">
                          +30% em vendas
                        </div>
                        <p className="text-[9px] text-neutral-400">no próximo trimestre</p>
                      </div>

                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Star className="size-3.5" />
                          <span className="text-[10px] font-semibold">Receita Projetada</span>
                        </div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {planoVendas.receitaProjetada}
                        </div>
                        <p className="text-[9px] text-emerald-400 font-medium">
                          ({planoVendas.receitaVariacao})
                        </p>
                      </div>

                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <Users className="size-3.5" />
                          <span className="text-[10px] font-semibold">Equipe de Agentes</span>
                        </div>
                        <div className="text-xs font-bold text-white leading-tight">
                          {planoVendas.equipeDescricao}
                        </div>
                        <p className="text-[9px] text-neutral-400 truncate">
                          CEO, SDR, Vendedor, Estrategista, Analista de Dados
                        </p>
                      </div>
                    </div>

                    {/* Nichos Prioritários */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Nichos Prioritários
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {planoVendas.nichos.map((nicho) => (
                          <button
                            key={nicho}
                            type="button"
                            onClick={() => setNichoAtivo(nicho)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                              nichoAtivo === nicho
                                ? "bg-blue-600/30 border-blue-500/50 text-blue-300 shadow-sm"
                                : "bg-[#141a27] border-white/5 text-neutral-400 hover:text-white",
                            )}
                          >
                            {nicho}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Estratégias Principais */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        Estratégias Principais
                      </span>
                      <div className="space-y-1 text-[11px] text-neutral-300">
                        {planoVendas.estrategias.map((est, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="flex size-4 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-tight">{est}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Arquivos e Entregáveis Ilustrativos */}
                    <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {planoVendas.arquivos.map((arq) => (
                        <div
                          key={arq.nome}
                          onClick={() => setArquivoSelecionado(arq)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[#141a27] border border-white/5 hover:border-white/10 cursor-pointer transition-colors"
                        >
                          {arq.tipo === "pdf" ? (
                            <FileText className="size-4 text-rose-400 shrink-0" />
                          ) : arq.tipo === "xlsx" ? (
                            <FileSpreadsheet className="size-4 text-emerald-400 shrink-0" />
                          ) : (
                            <FileCode className="size-4 text-purple-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-white truncate">
                              {arq.nome}
                            </div>
                            <div className="text-[9px] text-neutral-400 truncate">
                              {arq.subtitulo}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagens Adicionais Enviadas Durante a Sessão */}
            {mensagens.slice(2).map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3",
                  m.remetente === "usuario" ? "justify-end" : "justify-start",
                )}
              >
                {m.remetente === "ceo" && (
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80"
                    alt="CEO"
                    className="size-7 rounded-full object-cover shrink-0 border border-amber-500/40"
                  />
                )}
                <div
                  className={cn(
                    "max-w-xl space-y-1",
                    m.remetente === "usuario" ? "text-right" : "text-left",
                  )}
                >
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-3 text-xs leading-relaxed",
                      m.remetente === "usuario"
                        ? "rounded-tr-sm bg-[#162134] border border-blue-500/20 text-neutral-100"
                        : "rounded-tl-sm bg-[#101726] border border-white/5 text-neutral-200",
                    )}
                  >
                    {m.conteudo}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {m.horario}
                  </div>
                </div>
                {m.remetente === "usuario" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f95d14] text-xs font-bold text-white">
                    M
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* =====================================================================
              CAMPO DE DIGITAÇÃO & ATALHOS RÁPIDOS
              ===================================================================== */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <CeoCopilotoBanner ceo={ceoReal} flagLigada={CEO_IA_REAL_HABILITADO} />
            {/* Campo de Entrada de Mensagem */}
            <form onSubmit={handleEnviarMensagem} className="relative flex items-center">
              <input
                type="text"
                placeholder="Digite sua mensagem para o CEO de IA..."
                value={textoMensagem}
                disabled={bloqueadoPorEstado}
                onChange={(e) => setTextoMensagem(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#101624] pl-4 pr-32 py-3 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none shadow-inner"
              />

              {/* Botões de Ação na barra do chat */}
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => dispararToast("Upload de arquivos disponível na etapa de integração.")}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Anexar arquivo"
                >
                  <Paperclip className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => dispararToast("Busca web estratégica ativa.")}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Pesquisa web"
                >
                  <Globe className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => dispararToast("Comando de voz ativado em demonstração.")}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Mensagem de voz"
                >
                  <Mic className="size-4" />
                </button>
                <button
                  type="submit"
                  disabled={ceoRespondendo || bloqueadoPorEstado}
                  className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#f95d14] to-orange-600 text-white shadow-md shadow-orange-500/20 hover:from-orange-500 hover:to-orange-600 transition-all active:scale-95 disabled:opacity-60"
                  title="Enviar mensagem"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            {/* Atalhos Rápidos Abaixo do Chat */}
            <div className="flex flex-wrap items-center gap-1.5">
              {ATALHOS_ABAIXO_CHAT.map((at) => (
                <button
                  key={at.id}
                  type="button"
                  onClick={() => {
                    if (at.id === "resultado") onNavegarPlanejamento?.();
                    else if (at.id === "ajustar_metas") onNavegarPlanejamento?.();
                    else if (at.id === "revisar_equipe") onNavegarEquipe?.();
                    else setTextoMensagem(`CEO, por favor: ${at.rotulo.toLowerCase()}`);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#101622] px-2.5 py-1 text-[10px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span className="size-1.5 rounded-full bg-neutral-600" />
                  <span>{at.rotulo}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================================
            COLUNA DIREITA (3 colunas): AÇÕES RÁPIDAS, AGENTES & CONTEXTO
            ===================================================================== */}
        <div className="lg:col-span-3 space-y-5">
          {/* Card 1: Ações Rápidas */}
          <div className={cn(PANEL_CLASS, "p-4 space-y-3")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Ações rápidas</span>
              <span className="text-[11px] font-semibold text-[#f95d14] cursor-pointer hover:underline">
                Ver todas
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ACOES_RAPIDAS_COPILOTO.map((acao) => {
                const Icone = acao.icon;
                return (
                  <button
                    key={acao.id}
                    type="button"
                    onClick={() => {
                      if (acao.id === "criar_plano") setModalNovoPlanoAberto(true);
                      else if (acao.destinoTela === "equipe") onNavegarEquipe?.();
                      else if (acao.destinoTela === "fluxos") onNavegarFluxos?.();
                      else if (acao.destinoTela === "planejamento") onNavegarPlanejamento?.();
                      else if (acao.id === "gerar_relatorios")
                        dispararToast("Tela 12 — Relatórios & Resultados será implementada em breve.");
                      else dispararToast(`Comando "${acao.rotulo}" preparado no copiloto.`);
                    }}
                    className="flex flex-col items-start gap-1.5 p-2 rounded-xl bg-[#101622] border border-white/5 hover:border-white/10 text-left transition-all hover:scale-[1.02]"
                  >
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-lg border",
                        acao.corBg,
                      )}
                    >
                      <Icone className={cn("size-3", acao.corIcone)} />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-200 leading-tight">
                      {acao.rotulo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Agentes Disponíveis */}
          <div className={cn(PANEL_CLASS, "p-4 space-y-3")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Agentes disponíveis</span>
              <button
                type="button"
                onClick={onNavegarEquipe}
                className="text-[11px] font-semibold text-[#f95d14] hover:underline"
              >
                Gerenciar
              </button>
            </div>

            <div className="space-y-2">
              {AGENTES_DISPONIVEIS_COPILOTO.map((ag) => (
                <div
                  key={ag.id}
                  onClick={onNavegarEquipe}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#101622]/70 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={ag.avatarUrl}
                      alt={ag.nome}
                      className="size-7 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {ag.nome}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {ag.cargo}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-[10px] font-medium text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Contexto Atual */}
          <div className={cn(PANEL_CLASS, "p-4 space-y-3")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Contexto atual</span>
              <button
                type="button"
                onClick={() => setModalEditarContextoAberto(true)}
                className="text-[11px] font-semibold text-[#f95d14] hover:underline"
              >
                Editar
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Target className="size-3 text-neutral-500" />
                  Plano de vendas
                </span>
                <span className="font-semibold text-white">
                  {contexto.planoDeVendas}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Star className="size-3 text-neutral-500" />
                  Meta principal
                </span>
                <span className="font-semibold text-emerald-400">
                  {contexto.metaPrincipal}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <DollarSign className="size-3 text-neutral-500" />
                  Orçamento mensal
                </span>
                <span className="font-semibold text-white">
                  {contexto.orcamentoMensal}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Layers className="size-3 text-neutral-500" />
                  Nichos ativos
                </span>
                <span className="font-semibold text-white">
                  {contexto.nichosAtivos}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Megaphone className="size-3 text-neutral-500" />
                  Campanhas em andamento
                </span>
                <span className="font-semibold text-white">
                  {contexto.campanhasEmAndamento}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Users className="size-3 text-neutral-500" />
                  Agentes operacionais
                </span>
                <span className="font-semibold text-white">
                  {contexto.agentesOperacionais}
                </span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  <Clock className="size-3 text-neutral-500" />
                  Última atualização
                </span>
                <span className="font-mono text-[10px] text-neutral-400">
                  {contexto.ultimaAtualizacao}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. MODAIS INTERATIVOS
          ========================================================================= */}
      <NovoPlanoVendasModal
        aberto={modalNovoPlanoAberto}
        onFechar={() => setModalNovoPlanoAberto(false)}
        onSalvar={handleSalvarPlano}
      />

      <VisualizarPlanoModal
        aberto={modalVisualizarPlanoAberto}
        onFechar={() => setModalVisualizarPlanoAberto(false)}
        onNavegarEquipe={onNavegarEquipe}
      />

      <EditarContextoModal
        aberto={modalEditarContextoAberto}
        contexto={contexto}
        onFechar={() => setModalEditarContextoAberto(false)}
        onSalvar={(atualizado) => {
          setContexto(atualizado);
          setModalEditarContextoAberto(false);
          dispararToast("Contexto operacional atualizado localmente.");
        }}
      />

      <ArquivoExemploModal
        arquivo={arquivoSelecionado}
        onFechar={() => setArquivoSelecionado(null)}
      />
    </div>
  );
}
