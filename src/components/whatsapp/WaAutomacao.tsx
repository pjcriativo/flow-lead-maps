import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap,
  MessageSquare,
  Users,
  Filter,
  Clock,
  Search,
  Plus,
  MoreVertical,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  Headphones,
  Calendar,
  UserCheck,
  AlertCircle,
  FileText,
  Copy,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  WaAutomacaoItem,
  WaAutomacaoTipo,
  WaAutomacaoGatilho,
  WaAutomacaoStatus,
  WaAutomacoesKpis,
  WaAutomacoesDesempenho,
  WaAutomacoesDistribuicaoItem,
  WaAutomacaoAtividadeItem,
  obterDadosAutomacoesWa,
  salvarAutomacaoWa,
  alternarStatusAutomacaoWa,
  excluirAutomacaoWa,
  duplicarAutomacaoWa,
} from "@/services/whatsapp";

interface WaAutomacaoProps {
  onIrParaCampanhas?: () => void;
  onIrParaScripts?: () => void;
  onIrParaNumeros?: () => void;
}

export function WaAutomacao({
  onIrParaCampanhas,
  onIrParaScripts,
  onIrParaNumeros,
}: WaAutomacaoProps) {
  // Estado dos dados
  const [carregando, setCarregando] = useState(true);
  const [automacoes, setAutomacoes] = useState<WaAutomacaoItem[]>([]);
  const [kpis, setKpis] = useState<WaAutomacoesKpis>({
    ativas: 0,
    ativasTrend: "—",
    mensagens: 0,
    mensagensTrend: "—",
    qualificados: 0,
    qualificadosTrend: "—",
    taxaResposta: "0%",
    taxaRespostaTrend: "—",
    tempoMedio: "Dados insuficientes",
    tempoMedioTrend: "—",
  });
  const [desempenho, setDesempenho] = useState<WaAutomacoesDesempenho>({
    mensagens: 0,
    mensagensTrend: "—",
    qualificados: 0,
    qualificadosTrend: "—",
    taxaResposta: "0%",
    taxaRespostaTrend: "—",
    pontos: [],
  });
  const [distribuicao, setDistribuicao] = useState<WaAutomacoesDistribuicaoItem[]>([]);
  const [atividades, setAtividades] = useState<WaAutomacaoAtividadeItem[]>([]);
  const [conectado, setConectado] = useState(false);

  // Filtros da tabela
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Menu de ações da tabela
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  // Assistente de Criação (Right Panel)
  const [etapaCriacao, setEtapaCriacao] = useState<1 | 2 | 3 | 4>(1);
  const [novoTipo, setNovoTipo] = useState<WaAutomacaoTipo>("boas_vindas");
  const [novoNome, setNovoNome] = useState("Boas-vindas para novos leads");
  const [novoGatilho, setNovoGatilho] = useState<WaAutomacaoGatilho>("nova_conversa");
  const [novasPalavras, setNovasPalavras] = useState("olá, boa tarde, suporte, orçamento");
  const [novoTempoHoras, setNovoTempoHoras] = useState(24);
  const [novaEtapaCrm, setNovaEtapaCrm] = useState("contato_inicial");
  const [novoScriptId, setNovoScriptId] = useState("");
  const [novoTexto, setNovoTexto] = useState(
    "Olá! Seja muito bem-vindo ao Flow Business. Como posso te ajudar hoje?",
  );
  const [salvandoNova, setSalvandoNova] = useState(false);

  // Filtro de período no desempenho
  const [periodoDesempenho, setPeriodoDesempenho] = useState<"30" | "7" | "1">("30");

  // Modais
  const [modalDetalhes, setModalDetalhes] = useState<WaAutomacaoItem | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<WaAutomacaoItem | null>(null);
  const [modalVerTodasAtividades, setModalVerTodasAtividades] = useState(false);
  const [modalVerDetalhesDist, setModalVerDetalhesDist] = useState(false);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await obterDadosAutomacoesWa();
      setAutomacoes(res.automacoes);
      setKpis(res.kpis);
      setDesempenho(res.desempenho);
      setDistribuicao(res.distribuicao);
      setAtividades(res.atividades);
      setConectado(res.conectado);
    } catch (err) {
      console.error("Erro ao carregar automações:", err);
      toast.error("Não foi possível sincronizar todas as automações com o servidor");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Filtragem da tabela
  const automacoesFiltradas = useMemo(() => {
    return automacoes.filter((a) => {
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = a.nome.toLowerCase().includes(termo);
        const matchDesc = a.descricao.toLowerCase().includes(termo);
        const matchGatilho = a.gatilho.toLowerCase().includes(termo);
        if (!matchNome && !matchDesc && !matchGatilho) return false;
      }
      if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
      if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
      return true;
    });
  }, [automacoes, busca, filtroTipo, filtroStatus]);

  // Alternar seleção única/todas
  const toggleSelecionarTudo = () => {
    if (selecionados.length === automacoesFiltradas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(automacoesFiltradas.map((a) => a.id));
    }
  };

  const toggleSelecionarItem = (id: string) => {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Toggle status da automação
  const handleToggleStatus = async (item: WaAutomacaoItem) => {
    const novoAtivo = !item.ativa;
    // Otimista
    setAutomacoes((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? {
              ...a,
              ativa: novoAtivo,
              status: novoAtivo ? "ativa" : "pausada",
            }
          : a,
      ),
    );

    try {
      const res = await alternarStatusAutomacaoWa(item.id, novoAtivo);
      if (res.ok) {
        if (novoAtivo) {
          toast.info("Automação salva. Execução automática ainda não disponível pelo backend.", {
            description: `A regra "${item.nome}" foi mantida como ativa para testes manuais.`,
            duration: 5000,
          });
        } else {
          toast.success(`Automação "${item.nome}" foi pausada.`);
        }
      }
    } catch {
      toast.error("Erro ao atualizar status da automação");
      carregarDados();
    }
  };

  // Excluir automação
  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    try {
      await excluirAutomacaoWa(itemParaExcluir.id);
      setAutomacoes((prev) => prev.filter((a) => a.id !== itemParaExcluir.id));
      toast.success(`Automação "${itemParaExcluir.nome}" excluída.`);
      setItemParaExcluir(null);
    } catch {
      toast.error("Falha ao excluir automação");
    }
  };

  // Duplicar automação
  const handleDuplicar = async (item: WaAutomacaoItem) => {
    try {
      const dup = await duplicarAutomacaoWa(item.id);
      if (dup) {
        setAutomacoes((prev) => [dup, ...prev]);
        toast.success(`Automação duplicada como "${dup.nome}"`);
      }
    } catch {
      toast.error("Falha ao duplicar automação");
    } finally {
      setMenuAbertoId(null);
    }
  };

  // Avançar no Wizard
  const handleContinuarWizard = () => {
    if (etapaCriacao === 1) {
      if (novoTipo === "boas_vindas") {
        setNovoNome("Boas-vindas novos contatos");
        setNovoGatilho("nova_conversa");
      } else if (novoTipo === "qualificacao") {
        setNovoNome("Qualificação automática de interesse");
        setNovoGatilho("palavras_chave");
      } else if (novoTipo === "agendamento") {
        setNovoNome("Link de agendamento automático");
        setNovoGatilho("comando");
      } else if (novoTipo === "follow_up") {
        setNovoNome("Follow-up de propostas abertas");
        setNovoGatilho("tempo_sem_resposta");
      } else if (novoTipo === "recuperacao") {
        setNovoNome("Reativação de contatos inativos");
        setNovoGatilho("tempo_sem_interacao");
      } else if (novoTipo === "atendimento") {
        setNovoNome("Transferência para equipe comercial");
        setNovoGatilho("palavras_chave");
      }
      setEtapaCriacao(2);
    } else if (etapaCriacao === 2) {
      setEtapaCriacao(3);
    } else if (etapaCriacao === 3) {
      setEtapaCriacao(4);
    }
  };

  // Salvar nova automação
  const handleSalvarNovaAutomação = async () => {
    try {
      setSalvandoNova(true);
      const gatilhoDescricao =
        novoGatilho === "nova_conversa"
          ? "Nova conversa"
          : novoGatilho === "palavras_chave"
            ? "Palavras-chave"
            : novoGatilho === "comando"
              ? "Comando / palavra"
              : novoGatilho === "tempo_sem_resposta"
                ? "Tempo sem resposta"
                : novoGatilho === "tempo_sem_interacao"
                  ? "Tempo sem interação"
                  : "Etapa CRM";

      const nova = await salvarAutomacaoWa({
        nome: novoNome,
        descricao:
          novoTipo === "boas_vindas"
            ? "Mensagem inicial automática para novos leads"
            : novoTipo === "qualificacao"
              ? "Identifica interesse e segmenta leads"
              : novoTipo === "agendamento"
                ? "Oferece link de agendamento de reunião"
                : novoTipo === "follow_up"
                  ? "Lembra o cliente sobre propostas pendentes"
                  : novoTipo === "recuperacao"
                    ? "Reativa contatos inativos da base"
                    : "Direciona para equipe comercial",
        tipo: novoTipo,
        gatilho: gatilhoDescricao,
        gatilhoTipo: novoGatilho,
        status: "ativa",
        ativa: true,
        execucoes: 0,
        condicoes: {
          palavrasChave: novasPalavras.split(",").map((s) => s.trim()),
          tempoHoras: novoTempoHoras,
          etapaCrm: novaEtapaCrm,
        },
        acoes: {
          textoMensagem: novoTexto,
          mudarEtapaCrm: novaEtapaCrm,
          criarSugestaoSdr: true,
        },
      });

      setAutomacoes((prev) => [nova, ...prev]);
      toast.info("Automação salva. Execução automática ainda não disponível.", {
        description:
          "Regra cadastrada com sucesso! Ativações em segundo plano aguardam homologação do worker.",
        duration: 6000,
      });

      // Resetar Wizard
      setEtapaCriacao(1);
    } catch {
      toast.error("Falha ao salvar automação");
    } finally {
      setSalvandoNova(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 5 KPIS SUPERIORES (ETAPA 4 — REPRODUÇÃO FIEL AO LAYOUT APROVADO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Automações ativas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Zap className="h-5 w-5 fill-emerald-400/20" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.ativasTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.ativas}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Automações ativas</div>
          </div>
        </div>

        {/* KPI 2: Mensagens automáticas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <MessageSquare className="h-5 w-5 fill-blue-400/20" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.mensagensTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.mensagens.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Mensagens automáticas</div>
          </div>
        </div>

        {/* KPI 3: Leads qualificados */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-5 w-5 fill-purple-400/20" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.qualificadosTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.qualificados.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Leads qualificados</div>
          </div>
        </div>

        {/* KPI 4: Taxa de resposta */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Filter className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.taxaRespostaTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.taxaResposta}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Taxa de resposta</div>
          </div>
        </div>

        {/* KPI 5: Tempo médio de resposta */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
              {kpis.tempoMedioTrend} <TrendingDown className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.tempoMedio}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Tempo médio de resposta</div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: MINHAS AUTOMAÇÕES (ESQUERDA) + CRIAR NOVA AUTOMAÇÃO (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =====================================================================
            PAINEL CENTRAL ESQUERDO: MINHAS AUTOMAÇÕES (ETAPAS 5 & 6)
            ===================================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm">
          {/* Header com Ícone Verde + Título + Subtítulo + Botão Nova Automação */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                <SiWhatsapp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Minhas automações</h2>
                <p className="text-xs text-home-muted mt-0.5">
                  Crie e gerencie regras de automação para atender seus leads 24 horas por dia
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEtapaCriacao(1);
                const el = document.getElementById("painel-criar-automacao");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-home-orange px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.3)] transition-all hover:bg-home-orange/90 active:scale-95 whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Nova automação
            </button>
          </div>

          {/* Barra de Busca e Filtros (ETAPA 6) */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar automações..."
                className="w-full rounded-xl border border-white/10 bg-[#161c28] pl-9 pr-3.5 py-2 text-xs text-white placeholder-home-muted focus:border-home-orange/60 focus:outline-none"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-home-muted hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Dropdown Filtro de Tipo */}
            <div className="relative">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full sm:w-auto appearance-none cursor-pointer rounded-xl border border-white/10 bg-[#161c28] pl-8 pr-8 py-2 text-xs font-medium text-white focus:border-home-orange/60 focus:outline-none"
              >
                <option value="todos">Todos os tipos</option>
                <option value="boas_vindas">Boas-vindas</option>
                <option value="qualificacao">Qualificação</option>
                <option value="agendamento">Agendamento</option>
                <option value="follow_up">Follow-up</option>
                <option value="recuperacao">Recuperação</option>
                <option value="atendimento">Atendimento</option>
              </select>
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
            </div>

            {/* Dropdown Filtro de Status */}
            <div className="relative">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full sm:w-auto appearance-none cursor-pointer rounded-xl border border-white/10 bg-[#161c28] pl-8 pr-8 py-2 text-xs font-medium text-white focus:border-home-orange/60 focus:outline-none"
              >
                <option value="todos">Todos os status</option>
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
                <option value="rascunho">Rascunho</option>
                <option value="com_erro">Com erro</option>
              </select>
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
            </div>
          </div>

          {/* Tabela de Automações */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/5 bg-[#0e131d]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-home-muted font-medium bg-[#131824]">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        automacoesFiltradas.length > 0 &&
                        selecionados.length === automacoesFiltradas.length
                      }
                      onChange={toggleSelecionarTudo}
                      className="cursor-pointer rounded border-white/20 bg-[#1a2030] text-home-orange accent-[#ff6200]"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold text-white/80">Nome da automação</th>
                  <th className="py-3 px-2 font-semibold text-white/80">Tipo</th>
                  <th className="py-3 px-2 font-semibold text-white/80">Gatilho</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-center">Status</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-right">Execuções</th>
                  <th className="py-3 px-3 font-semibold text-white/80">Última atualização</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-center w-10">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {automacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-home-muted">
                      Nenhuma automação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  automacoesFiltradas.map((auto) => {
                    const isSelected = selecionados.includes(auto.id);
                    return (
                      <tr
                        key={auto.id}
                        className={cn(
                          "transition-colors hover:bg-white/[0.02]",
                          isSelected && "bg-home-orange/[0.04]",
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelecionarItem(auto.id)}
                            className="cursor-pointer rounded border-white/20 bg-[#1a2030] text-home-orange accent-[#ff6200]"
                          />
                        </td>

                        {/* Nome da Automação + Ícone + Subtítulo */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
                                auto.tipo === "boas_vindas" && "bg-emerald-500/15 text-emerald-400",
                                auto.tipo === "qualificacao" && "bg-blue-500/15 text-blue-400",
                                auto.tipo === "agendamento" && "bg-purple-500/15 text-purple-400",
                                auto.tipo === "follow_up" && "bg-amber-500/15 text-amber-400",
                                auto.tipo === "recuperacao" && "bg-rose-500/15 text-rose-400",
                                auto.tipo === "atendimento" && "bg-cyan-500/15 text-cyan-400",
                              )}
                            >
                              {auto.tipo === "boas_vindas" && <SiWhatsapp className="h-4 w-4" />}
                              {auto.tipo === "qualificacao" && (
                                <MessageSquare className="h-4 w-4" />
                              )}
                              {auto.tipo === "agendamento" && <Calendar className="h-4 w-4" />}
                              {auto.tipo === "follow_up" && <Clock className="h-4 w-4" />}
                              {auto.tipo === "recuperacao" && <RefreshCw className="h-4 w-4" />}
                              {auto.tipo === "atendimento" && <Headphones className="h-4 w-4" />}
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate max-w-[200px]">
                                {auto.nome}
                              </div>
                              <div className="text-[11px] text-home-muted truncate max-w-[200px]">
                                {auto.descricao}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tipo (Badge Colorida) */}
                        <td className="py-3.5 px-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                              auto.tipo === "boas_vindas" &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                              auto.tipo === "qualificacao" &&
                                "border-blue-500/30 bg-blue-500/10 text-blue-400",
                              auto.tipo === "agendamento" &&
                                "border-purple-500/30 bg-purple-500/10 text-purple-400",
                              auto.tipo === "follow_up" &&
                                "border-amber-500/30 bg-amber-500/10 text-amber-400",
                              auto.tipo === "recuperacao" &&
                                "border-rose-500/30 bg-rose-500/10 text-rose-400",
                              auto.tipo === "atendimento" &&
                                "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
                            )}
                          >
                            {auto.tipo === "boas_vindas" && "Boas-vindas"}
                            {auto.tipo === "qualificacao" && "Qualificação"}
                            {auto.tipo === "agendamento" && "Agendamento"}
                            {auto.tipo === "follow_up" && "Follow-up"}
                            {auto.tipo === "recuperacao" && "Recuperação"}
                            {auto.tipo === "atendimento" && "Atendimento"}
                          </span>
                        </td>

                        {/* Gatilho */}
                        <td className="py-3.5 px-2 text-white/80 whitespace-nowrap">
                          {auto.gatilho}
                        </td>

                        {/* Switch Toggle Status */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(auto)}
                            title={
                              auto.ativa
                                ? "Automação ativa (clique para pausar)"
                                : "Automação pausada"
                            }
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              auto.ativa ? "bg-emerald-500" : "bg-white/20",
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                auto.ativa ? "translate-x-4" : "translate-x-0",
                              )}
                            />
                          </button>
                        </td>

                        {/* Execuções */}
                        <td className="py-3.5 px-2 text-right font-semibold text-white">
                          {auto.execucoes.toLocaleString("pt-BR")}
                        </td>

                        {/* Última atualização */}
                        <td className="py-3.5 px-3 text-home-muted text-[11px] whitespace-nowrap">
                          {auto.ultimaAtualizacao}
                        </td>

                        {/* Menu de Ações (⋮) */}
                        <td className="py-3.5 px-2 text-center relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuAbertoId(menuAbertoId === auto.id ? null : auto.id)
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-home-muted hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {menuAbertoId === auto.id && (
                            <div className="absolute right-2 top-10 z-30 w-44 rounded-xl border border-white/10 bg-[#161c28] p-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalDetalhes(auto);
                                  setMenuAbertoId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10"
                              >
                                <Info className="h-3.5 w-3.5 text-blue-400" /> Abrir / Detalhes
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleStatus(auto);
                                  setMenuAbertoId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10"
                              >
                                {auto.ativa ? (
                                  <>
                                    <Pause className="h-3.5 w-3.5 text-amber-400" /> Pausar
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5 text-emerald-400" /> Reativar
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicar(auto)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10"
                              >
                                <Copy className="h-3.5 w-3.5 text-purple-400" /> Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setItemParaExcluir(auto);
                                  setMenuAbertoId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================================
            PAINEL DIREITO: CRIAR NOVA AUTOMAÇÃO (ETAPAS 7, 8, 9 & 10)
            ===================================================================== */}
        <div
          id="painel-criar-automacao"
          className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm"
        >
          {/* Header do Painel */}
          <div className="flex items-start gap-3 pb-4 border-b border-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              <SiWhatsapp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Criar nova automação
              </h2>
              <p className="text-xs text-home-muted mt-0.5">
                Configure regras de automação em poucos passos
              </p>
            </div>
          </div>

          {/* Stepper Horizontal (1: Tipo, 2: Condições, 3: Ações, 4: Revisão) */}
          <div className="mt-4 flex items-center justify-between border-b border-white/5 pb-3">
            {[
              { num: 1, label: "Tipo" },
              { num: 2, label: "Condições" },
              { num: 3, label: "Ações" },
              { num: 4, label: "Revisão" },
            ].map((st) => {
              const ativo = etapaCriacao === st.num;
              const completado = etapaCriacao > st.num;
              return (
                <div key={st.num} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      ativo
                        ? "bg-home-orange text-white shadow-[0_0_12px_rgba(255,98,0,0.5)]"
                        : completado
                          ? "bg-emerald-500 text-white"
                          : "bg-[#182030] text-home-muted border border-white/10",
                    )}
                  >
                    {completado ? <Check className="h-3.5 w-3.5" /> : st.num}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      ativo
                        ? "text-home-orange font-bold"
                        : completado
                          ? "text-emerald-400"
                          : "text-home-muted",
                    )}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CONTEÚDO DO WIZARD CONFORME A ETAPA */}
          {etapaCriacao === 1 && (
            <div className="mt-4 space-y-3">
              <div className="text-xs font-semibold text-white/90">Tipo de automação</div>

              {/* Grid 2 Colunas com os 6 cards (ETAPA 7 — REPRODUÇÃO IDÊNTICA) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Boas-vindas */}
                <button
                  type="button"
                  onClick={() => setNovoTipo("boas_vindas")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    novoTipo === "boas_vindas"
                      ? "border-home-orange bg-home-orange/[0.08] shadow-[0_0_15px_rgba(255,98,0,0.15)] ring-1 ring-home-orange"
                      : "border-white/5 bg-[#141a27] hover:border-white/20",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-home-orange/15 text-home-orange mb-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">Boas-vindas</div>
                  <div className="text-[10px] text-home-muted mt-1 leading-tight">
                    Mensagem inicial para novos contatos
                  </div>
                </button>

                {/* 2. Qualificação */}
                <button
                  type="button"
                  onClick={() => setNovoTipo("qualificacao")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    novoTipo === "qualificacao"
                      ? "border-home-orange bg-home-orange/[0.08] shadow-[0_0_15px_rgba(255,98,0,0.15)] ring-1 ring-home-orange"
                      : "border-white/5 bg-[#141a27] hover:border-white/20",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 mb-2">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">Qualificação</div>
                  <div className="text-[10px] text-home-muted mt-1 leading-tight">
                    Identifica interesse e segmenta leads
                  </div>
                </button>

                {/* 3. Agendamento */}
                <button
                  type="button"
                  onClick={() => setNovoTipo("agendamento")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    novoTipo === "agendamento"
                      ? "border-home-orange bg-home-orange/[0.08] shadow-[0_0_15px_rgba(255,98,0,0.15)] ring-1 ring-home-orange"
                      : "border-white/5 bg-[#141a27] hover:border-white/20",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">Agendamento</div>
                  <div className="text-[10px] text-home-muted mt-1 leading-tight">
                    Oferece link de agendamento
                  </div>
                </button>

                {/* 4. Follow-up */}
                <button
                  type="button"
                  onClick={() => setNovoTipo("follow_up")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    novoTipo === "follow_up"
                      ? "border-home-orange bg-home-orange/[0.08] shadow-[0_0_15px_rgba(255,98,0,0.15)] ring-1 ring-home-orange"
                      : "border-white/5 bg-[#141a27] hover:border-white/20",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 mb-2">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">Follow-up</div>
                  <div className="text-[10px] text-home-muted mt-1 leading-tight">
                    Acompanha e lembra o cliente
                  </div>
                </button>

                {/* 5. Recuperação */}
                <button
                  type="button"
                  onClick={() => setNovoTipo("recuperacao")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    novoTipo === "recuperacao"
                      ? "border-home-orange bg-home-orange/[0.08] shadow-[0_0_15px_rgba(255,98,0,0.15)] ring-1 ring-home-orange"
                      : "border-white/5 bg-[#141a27] hover:border-white/20",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 mb-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">Recuperação</div>
                  <div className="text-[10px] text-home-muted mt-1 leading-tight">
                    Reativa contatos inativos
                  </div>
                </button>

                {/* 6. Atendimento */}
                <button
                  type="button"
                  onClick={() => setNovoTipo("atendimento")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    novoTipo === "atendimento"
                      ? "border-home-orange bg-home-orange/[0.08] shadow-[0_0_15px_rgba(255,98,0,0.15)] ring-1 ring-home-orange"
                      : "border-white/5 bg-[#141a27] hover:border-white/20",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 mb-2">
                    <Headphones className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-bold text-white">Atendimento</div>
                  <div className="text-[10px] text-home-muted mt-1 leading-tight">
                    Transfere para equipe humana
                  </div>
                </button>
              </div>

              {/* Botão Continuar */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinuarWizard}
                  className="w-full cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-home-orange py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all hover:bg-home-orange/90 active:scale-98"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {etapaCriacao === 2 && (
            <div className="mt-4 space-y-3.5">
              <div className="text-xs font-semibold text-white/90">Condições & Gatilhos</div>

              <div>
                <label className="text-[11px] font-medium text-home-muted">Nome da automação</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-home-muted">Gatilho principal</label>
                <select
                  value={novoGatilho}
                  onChange={(e) => setNovoGatilho(e.target.value as WaAutomacaoGatilho)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none"
                >
                  <option value="nova_conversa">Nova conversa recebida (Inbound)</option>
                  <option value="palavras_chave">Palavras-chave na mensagem</option>
                  <option value="comando">Comando específico (/agenda, /orcamento)</option>
                  <option value="tempo_sem_resposta">Tempo sem resposta do lead</option>
                  <option value="tempo_sem_interacao">Tempo sem interação total</option>
                  <option value="etapa_crm">Mudança de etapa no funil CRM</option>
                </select>
              </div>

              {novoGatilho === "palavras_chave" && (
                <div>
                  <label className="text-[11px] font-medium text-home-muted">
                    Palavras-chave (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={novasPalavras}
                    onChange={(e) => setNovasPalavras(e.target.value)}
                    placeholder="orçamento, preço, ajuda, planos"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none"
                  />
                </div>
              )}

              {(novoGatilho === "tempo_sem_resposta" || novoGatilho === "tempo_sem_interacao") && (
                <div>
                  <label className="text-[11px] font-medium text-home-muted">
                    Tempo de espera sem resposta (horas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={novoTempoHoras}
                    onChange={(e) => setNovoTempoHoras(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEtapaCriacao(1)}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#161c28] py-2 text-xs font-semibold text-white hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={handleContinuarWizard}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-xl bg-home-orange py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] hover:bg-home-orange/90"
                >
                  Continuar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {etapaCriacao === 3 && (
            <div className="mt-4 space-y-3.5">
              <div className="text-xs font-semibold text-white/90">Ações & Respostas</div>

              <div>
                <label className="text-[11px] font-medium text-home-muted">
                  Mensagem automática ou resposta
                </label>
                <textarea
                  rows={3}
                  value={novoTexto}
                  onChange={(e) => setNovoTexto(e.target.value)}
                  placeholder="Digite a mensagem padrão..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-home-muted">
                  Atualizar etapa no CRM (Pipeline)
                </label>
                <select
                  value={novaEtapaCrm}
                  onChange={(e) => setNovaEtapaCrm(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none"
                >
                  <option value="contato_inicial">Contato Inicial</option>
                  <option value="qualificacao">Qualificação</option>
                  <option value="reuniao_agendada">Reunião Agendada</option>
                  <option value="proposta_enviada">Proposta Enviada</option>
                  <option value="recuperacao">Recuperação</option>
                  <option value="atendimento_humano">Atendimento Humano</option>
                </select>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Proteção Anti-Loop Ativada
                </div>
                <div className="text-[11px] text-home-muted mt-1">
                  Máximo de 1 resposta automática por contato no intervalo de 30 minutos.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEtapaCriacao(2)}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#161c28] py-2 text-xs font-semibold text-white hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={handleContinuarWizard}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-xl bg-home-orange py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] hover:bg-home-orange/90"
                >
                  Revisar <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {etapaCriacao === 4 && (
            <div className="mt-4 space-y-3.5">
              <div className="text-xs font-semibold text-white/90">Revisão & Salvar</div>

              <div className="rounded-xl border border-white/5 bg-[#141a27] p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-home-muted">Nome:</span>
                  <span className="font-semibold text-white">{novoNome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Tipo:</span>
                  <span className="font-semibold text-home-orange capitalize">
                    {novoTipo.replace("_", "-")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Gatilho:</span>
                  <span className="font-semibold text-white">{novoGatilho.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Etapa CRM:</span>
                  <span className="font-semibold text-emerald-400 capitalize">
                    {novaEtapaCrm.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Status de Prontidão Operacional */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] p-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Info className="h-4 w-4" /> Prontidão Operacional
                </div>
                <div className="text-[11px] text-home-muted mt-1 leading-relaxed">
                  A automação será persistida com sucesso. O motor de execução em segundo plano
                  processará os gatilhos assim que homologado pelo servidor.
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEtapaCriacao(3)}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#161c28] py-2 text-xs font-semibold text-white hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  disabled={salvandoNova}
                  onClick={handleSalvarNovaAutomação}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-1 rounded-xl bg-home-orange py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] hover:bg-home-orange/90 disabled:opacity-50"
                >
                  {salvandoNova ? "Salvando..." : "Salvar automação"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          SEÇÃO INFERIOR: 3 CARDS (DESEMPENHO, DISTRIBUIÇÃO & ATIVIDADE RECENTE)
          (ETAPAS 13, 14 & 15 — REPRODUÇÃO FIEL AO LAYOUT APROVADO)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* =====================================================================
            CARD INFERIOR ESQUERDO: DESEMPENHO DAS AUTOMAÇÕES (ETAPA 13)
            ===================================================================== */}
        <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Desempenho das automações
                  </h3>
                  <p className="text-[11px] text-home-muted">
                    Resultados das suas automações em tempo real
                  </p>
                </div>
              </div>

              {/* Seletor de Período */}
              <div className="relative">
                <select
                  value={periodoDesempenho}
                  onChange={(e) => setPeriodoDesempenho(e.target.value as "30" | "7" | "1")}
                  className="appearance-none cursor-pointer rounded-lg border border-white/10 bg-[#161c28] pl-2.5 pr-6 py-1 text-[11px] font-medium text-white focus:outline-none"
                >
                  <option value="30">Últimos 30 dias</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="1">Hoje</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-home-muted" />
              </div>
            </div>

            {/* 3 Caixas de Métricas */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2.5">
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.mensagensTrend}
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1.5">
                  {desempenho.mensagens.toLocaleString("pt-BR")}
                </div>
                <div className="text-[10px] text-home-muted">Mensagens</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2.5">
                <div className="flex items-center justify-between">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.qualificadosTrend}
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1.5">
                  {desempenho.qualificados.toLocaleString("pt-BR")}
                </div>
                <div className="text-[10px] text-home-muted">Leads qualificados</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2.5">
                <div className="flex items-center justify-between">
                  <Zap className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.taxaRespostaTrend}
                  </span>
                </div>
                <div className="text-base font-bold text-white mt-1.5">
                  {desempenho.taxaResposta}
                </div>
                <div className="text-[10px] text-home-muted">Taxa de resposta</div>
              </div>
            </div>

            {/* Gráfico de Linhas SVG com 3 Séries */}
            <div className="mt-5 relative h-36 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
                {/* Linhas de Grade Horizontais */}
                <line
                  x1="30"
                  y1="20"
                  x2="390"
                  y2="20"
                  stroke="#ffffff"
                  strokeOpacity="0.05"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="50"
                  x2="390"
                  y2="50"
                  stroke="#ffffff"
                  strokeOpacity="0.05"
                  strokeDasharray="3 3"
                />
                <line
                  x1="30"
                  y1="80"
                  x2="390"
                  y2="80"
                  stroke="#ffffff"
                  strokeOpacity="0.05"
                  strokeDasharray="3 3"
                />
                <line x1="30" y1="105" x2="390" y2="105" stroke="#ffffff" strokeOpacity="0.1" />

                {/* Eixo Y Ticks */}
                <text x="5" y="23" fill="#64748b" fontSize="8">
                  200
                </text>
                <text x="5" y="53" fill="#64748b" fontSize="8">
                  100
                </text>
                <text x="10" y="83" fill="#64748b" fontSize="8">
                  50
                </text>
                <text x="15" y="107" fill="#64748b" fontSize="8">
                  0
                </text>

                {/* Curva 1: Mensagens (Cyan/Green - Topo) */}
                <path
                  d="M 30,55 Q 85,32 140,42 T 250,22 T 330,15 T 390,20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />

                {/* Curva 2: Leads Qualificados (Azul - Meio) */}
                <path
                  d="M 30,85 Q 85,68 140,75 T 250,60 T 330,48 T 390,52"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />

                {/* Curva 3: Respostas (Roxo - Base) */}
                <path
                  d="M 30,100 Q 85,92 140,96 T 250,86 T 330,78 T 390,82"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                />

                {/* Pontos nas Curvas */}
                <circle cx="390" cy="20" r="3.5" fill="#10b981" />
                <circle cx="390" cy="52" r="3.5" fill="#3b82f6" />
                <circle cx="390" cy="82" r="3.5" fill="#a855f7" />

                {/* Eixo X Datas */}
                <text x="30" y="118" fill="#64748b" fontSize="8">
                  01/03
                </text>
                <text x="90" y="118" fill="#64748b" fontSize="8">
                  05/03
                </text>
                <text x="150" y="118" fill="#64748b" fontSize="8">
                  10/03
                </text>
                <text x="210" y="118" fill="#64748b" fontSize="8">
                  15/03
                </text>
                <text x="270" y="118" fill="#64748b" fontSize="8">
                  20/03
                </text>
                <text x="330" y="118" fill="#64748b" fontSize="8">
                  25/03
                </text>
                <text x="375" y="118" fill="#64748b" fontSize="8">
                  30/03
                </text>
              </svg>
            </div>
          </div>

          {/* Legenda do Gráfico */}
          <div className="mt-3 flex items-center justify-center gap-5 border-t border-white/5 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span>Mensagens</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
              <span>Leads qualificados</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
              <span>Respostas</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD INFERIOR CENTRAL: DISTRIBUIÇÃO POR TIPO (ETAPA 14)
            ===================================================================== */}
        <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Distribuição por tipo
                  </h3>
                  <p className="text-[11px] text-home-muted">Execuções das automações por tipo</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalVerDetalhesDist(true)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Ver detalhes
              </button>
            </div>

            {/* Donut Chart + Legenda Lateral */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              {/* Gráfico Donut SVG */}
              <div className="relative h-32 w-32 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  {/* Segmento 1: Boas-vindas (35%) -> stroke-dasharray="77 220" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray="77 220"
                    strokeDashoffset="0"
                  />
                  {/* Segmento 2: Qualificação (24%) -> stroke-dasharray="52.8 220" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray="52.8 220"
                    strokeDashoffset="-77"
                  />
                  {/* Segmento 3: Agendamento (18%) -> stroke-dasharray="39.6 220" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="12"
                    strokeDasharray="39.6 220"
                    strokeDashoffset="-129.8"
                  />
                  {/* Segmento 4: Follow-up (12%) -> stroke-dasharray="26.4 220" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray="26.4 220"
                    strokeDashoffset="-169.4"
                  />
                  {/* Segmento 5: Recuperação (7%) -> stroke-dasharray="15.4 220" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray="15.4 220"
                    strokeDashoffset="-195.8"
                  />
                  {/* Segmento 6: Atendimento (4%) -> stroke-dasharray="8.8 220" */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="12"
                    strokeDasharray="8.8 220"
                    strokeDashoffset="-211.2"
                  />
                </svg>

                {/* Total Central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-extrabold text-white">1.428</span>
                  <span className="text-[10px] text-home-muted">execuções</span>
                </div>
              </div>

              {/* Legenda Lateral com Percentuais e Contagens */}
              <div className="flex-1 space-y-1.5 w-full">
                {distribuicao.map((item) => (
                  <div key={item.tipo} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.hex }}
                      />
                      <span className="text-white/80">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white/90">{item.percentual}%</span>
                      <span className="text-home-muted text-[11px] w-8 text-right">
                        {item.execucoes}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD INFERIOR DIREITO: ATIVIDADE RECENTE (ETAPA 15)
            ===================================================================== */}
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Atividade recente</h3>
                  <p className="text-[11px] text-home-muted">
                    Últimas execuções e eventos das automações
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalVerTodasAtividades(true)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Ver todas
              </button>
            </div>

            {/* Lista com os 6 Eventos Reais Recentes */}
            <div className="mt-3 divide-y divide-white/[0.04]">
              {atividades.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm",
                        act.cor === "green" && "bg-emerald-500/15 text-emerald-400",
                        act.cor === "blue" && "bg-blue-500/15 text-blue-400",
                        act.cor === "purple" && "bg-purple-500/15 text-purple-400",
                        act.cor === "amber" && "bg-amber-500/15 text-amber-400",
                        act.cor === "cyan" && "bg-cyan-500/15 text-cyan-400",
                        act.cor === "red" && "bg-rose-500/15 text-rose-400",
                      )}
                    >
                      {act.icone === "executada" && <SiWhatsapp className="h-3.5 w-3.5" />}
                      {act.icone === "qualificado" && <Users className="h-3.5 w-3.5" />}
                      {act.icone === "agendada" && <Calendar className="h-3.5 w-3.5" />}
                      {act.icone === "followup" && <Clock className="h-3.5 w-3.5" />}
                      {act.icone === "humano" && <Headphones className="h-3.5 w-3.5" />}
                      {act.icone === "erro" && <AlertCircle className="h-3.5 w-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{act.titulo}</div>
                      <div className="text-[11px] text-home-muted truncate">{act.descricao}</div>
                    </div>
                  </div>

                  <span className="text-[11px] text-home-muted shrink-0">{act.horario}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAIS & DIÁLOGOS DE CONFIRMAÇÃO
          ===================================================================== */}

      {/* Modal Detalhes da Automação */}
      {modalDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{modalDetalhes.nome}</h3>
                  <p className="text-xs text-home-muted">Detalhes da automação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhes(null)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-[#161c28] p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-home-muted">Tipo:</span>
                  <span className="font-semibold text-white capitalize">
                    {modalDetalhes.tipo.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Gatilho:</span>
                  <span className="font-semibold text-white">{modalDetalhes.gatilho}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Status:</span>
                  <span
                    className={cn(
                      "font-semibold",
                      modalDetalhes.ativa ? "text-emerald-400" : "text-amber-400",
                    )}
                  >
                    {modalDetalhes.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Total de Execuções:</span>
                  <span className="font-semibold text-white">{modalDetalhes.execucoes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-home-muted">Última atualização:</span>
                  <span className="text-white">{modalDetalhes.ultimaAtualizacao}</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#161c28] p-3">
                <span className="font-semibold text-white">Descrição Operacional</span>
                <p className="text-home-muted mt-1 leading-relaxed">{modalDetalhes.descricao}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalDetalhes(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#101520] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir automação?</h3>
                <p className="text-xs text-home-muted mt-0.5">
                  Esta ação é irreversível. Deseja remover permanentemente?
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#161c28] p-3 text-xs text-white">
              <strong>{itemParaExcluir.nome}</strong>
              <div className="text-[11px] text-home-muted mt-0.5">
                {itemParaExcluir.gatilho} • {itemParaExcluir.execucoes} execuções
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="rounded-xl border border-white/10 bg-[#161c28] px-4 py-2 text-xs font-semibold text-white hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Todas as Atividades */}
      {modalVerTodasAtividades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Histórico de Atividades</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVerTodasAtividades(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
              {atividades.map((act) => (
                <div key={act.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{act.titulo}</div>
                    <div className="text-[11px] text-home-muted">{act.descricao}</div>
                  </div>
                  <span className="text-[11px] text-home-muted">{act.horario}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setModalVerTodasAtividades(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalhes da Distribuição */}
      {modalVerDetalhesDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Detalhamento por Tipo</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVerDetalhesDist(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {distribuicao.map((item) => (
                <div
                  key={item.tipo}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#161c28] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.hex }}
                    />
                    <span className="font-semibold text-white">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{item.percentual}%</span>
                    <span className="text-home-muted text-[11px]">{item.execucoes} execuções</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setModalVerDetalhesDist(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
