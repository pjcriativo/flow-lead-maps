import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Zap,
  MessageSquare,
  Users,
  Clock,
  Star,
  Search,
  Plus,
  MoreVertical,
  Check,
  ChevronDown,
  FileText,
  Copy,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  X,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Send,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Smile,
  Eye,
  Edit3,
  Calendar,
  Headphones,
  RefreshCw,
  Tag,
  Folder,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  WaScriptItem,
  WaScriptCategoria,
  WaScriptStatus,
  WaScriptsKpis,
  WaScriptsDesempenho,
  WaScriptMaisUsado,
  WaScriptAtividadeItem,
  obterDadosScriptsWa,
  salvarScriptWa,
  alternarStatusScriptWa,
  excluirScriptWa,
  duplicarScriptWa,
  extrairVariaveis,
} from "@/services/whatsapp";
import { resolverVariaveis, WaLeadDados } from "@/lib/wa-copy";

const CATEGORIAS_INFO: Record<
  WaScriptCategoria,
  { label: string; cor: string; hex: string; count: number }
> = {
  boas_vindas: { label: "Boas-vindas", cor: "emerald", hex: "#10b981", count: 18 },
  qualificacao: { label: "Qualificação", cor: "blue", hex: "#3b82f6", count: 22 },
  follow_up: { label: "Follow-up", cor: "amber", hex: "#f59e0b", count: 24 },
  agendamento: { label: "Agendamento", cor: "purple", hex: "#8b5cf6", count: 16 },
  recuperacao: { label: "Recuperação", cor: "red", hex: "#ef4444", count: 12 },
  atendimento: { label: "Atendimento", cor: "cyan", hex: "#06b6d4", count: 36 },
};

const VARIAVEIS_DISPONIVEIS = [
  { token: "nome", label: "Nome do contato / decisor", exemplo: "Carlos Silva" },
  { token: "empresa", label: "Nome da empresa / negócio", exemplo: "Acme Soluções" },
  { token: "cidade", label: "Cidade de atuação", exemplo: "São Paulo" },
  { token: "categoria", label: "Nicho ou categoria", exemplo: "Marketing Digital" },
  { token: "telefone", label: "Telefone ou WhatsApp", exemplo: "(11) 98765-4321" },
  { token: "responsavel", label: "Atendente responsável", exemplo: "Ana Oliveira" },
  {
    token: "link",
    label: "Link de agendamento ou proposta",
    exemplo: "https://flowbusiness.com.br/agenda",
  },
];

const EMOJIS_COMUNS = ["👋", "🚀", "💬", "📅", "⭐", "✅", "🔥", "🎯", "💼", "🤝"];

export function WaScripts() {
  // Estado dos dados
  const [carregando, setCarregando] = useState(true);
  const [scripts, setScripts] = useState<WaScriptItem[]>([]);
  const [kpis, setKpis] = useState<WaScriptsKpis>({
    criados: 0,
    criadosTrend: "—",
    usosMes: 0,
    usosMesTrend: "—",
    atendimentos: 0,
    atendimentosTrend: "—",
    taxaUtilizacao: "0%",
    taxaUtilizacaoTrend: "—",
    avaliacao: "—",
    avaliacaoTrend: "—",
  });
  const [desempenho, setDesempenho] = useState<WaScriptsDesempenho>({
    usosMes: 0,
    usosMesTrend: "—",
    conversas: 0,
    conversasTrend: "—",
    taxaResposta: "0%",
    taxaRespostaTrend: "—",
    avaliacao: "—",
    avaliacaoTrend: "—",
    pontos: [],
  });
  const [maisUsados, setMaisUsados] = useState<WaScriptMaisUsado[]>([]);
  const [atividades, setAtividades] = useState<WaScriptAtividadeItem[]>([]);

  // Filtros da biblioteca
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [categoriaRapida, setCategoriaRapida] = useState<string>("todos");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  // Editor (Painel Direito)
  const [modoCriacao, setModoCriacao] = useState(false);
  const [scriptIdEdicao, setScriptIdEdicao] = useState<string>("sc-1");
  const [nomeForm, setNomeForm] = useState("Boas-vindas novo lead");
  const [categoriaForm, setCategoriaForm] = useState<WaScriptCategoria>("boas_vindas");
  const [statusForm, setStatusForm] = useState<boolean>(true);
  const [mensagemForm, setMensagemForm] = useState(
    "Olá, {{nome}}! 👋\n\nSeja muito bem-vindo(a) à {{empresa}}!\n\nVi que você se interessou pelos nossos serviços e gostaria de entender melhor a sua necessidade.\n\nComo posso te ajudar hoje?",
  );
  const [salvando, setSalvando] = useState(false);
  const [menuVariaveisAberto, setMenuVariaveisAberto] = useState(false);
  const [menuEmojiAberto, setMenuEmojiAberto] = useState(false);
  const [modoPrevia, setModoPrevia] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Modais
  const [itemParaExcluir, setItemParaExcluir] = useState<WaScriptItem | null>(null);
  const [modalVerMaisUsados, setModalVerMaisUsados] = useState(false);
  const [modalVerAtividades, setModalVerAtividades] = useState(false);
  const [modalPreviaLead, setModalPreviaLead] = useState<WaScriptItem | null>(null);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await obterDadosScriptsWa();
      setScripts(res.scripts);
      setKpis(res.kpis);
      setDesempenho(res.desempenho);
      setMaisUsados(res.maisUsados);
      setAtividades(res.atividades);

      // Carregar primeiro script se existir
      if (res.scripts.length > 0) {
        const primeiro = res.scripts[0];
        setScriptIdEdicao(primeiro.id);
        setNomeForm(primeiro.nome);
        setCategoriaForm(primeiro.categoria);
        setStatusForm(primeiro.ativo);
        setMensagemForm(primeiro.mensagem);
      }
    } catch (err) {
      console.error("Erro ao carregar scripts:", err);
      toast.error("Erro ao sincronizar scripts");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Contagem por categoria
  const contagensCategorias = useMemo(() => {
    const total = scripts.length >= 8 ? 128 : scripts.length;
    return {
      todos: total,
      boas_vindas: 18,
      qualificacao: 22,
      follow_up: 24,
      agendamento: 16,
      recuperacao: 12,
      atendimento: 36,
    };
  }, [scripts]);

  // Filtragem
  const scriptsFiltrados = useMemo(() => {
    return scripts.filter((s) => {
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = s.nome.toLowerCase().includes(termo);
        const matchMsg = s.mensagem.toLowerCase().includes(termo);
        const matchCat = s.categoria.toLowerCase().includes(termo);
        if (!matchNome && !matchMsg && !matchCat) return false;
      }
      if (filtroCategoria !== "todas" && s.categoria !== filtroCategoria) return false;
      if (categoriaRapida !== "todos" && s.categoria !== categoriaRapida) return false;
      if (filtroStatus !== "todos") {
        if (filtroStatus === "ativo" && !s.ativo) return false;
        if (filtroStatus === "inativo" && s.ativo) return false;
      }
      return true;
    });
  }, [scripts, busca, filtroCategoria, categoriaRapida, filtroStatus]);

  // Selecionar script para edição
  const handleSelecionarParaEdicao = (s: WaScriptItem) => {
    setModoCriacao(false);
    setScriptIdEdicao(s.id);
    setNomeForm(s.nome);
    setCategoriaForm(s.categoria);
    setStatusForm(s.ativo);
    setMensagemForm(s.mensagem);
    setModoPrevia(false);
  };

  // Botão + Novo script
  const handleNovoScript = () => {
    setModoCriacao(true);
    setScriptIdEdicao("");
    setNomeForm("");
    setCategoriaForm("boas_vindas");
    setStatusForm(true);
    setMensagemForm("");
    setModoPrevia(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Inserir texto ou formatação no cursor
  const inserirNoCursor = (antes: string, depois: string = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const textoSel = mensagemForm.substring(start, end);
    const novoTexto =
      mensagemForm.substring(0, start) +
      antes +
      (textoSel || "") +
      depois +
      mensagemForm.substring(end);
    setMensagemForm(novoTexto);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + antes.length, end + antes.length);
    }, 50);
  };

  // Salvar script
  const handleSalvarScript = async () => {
    if (!nomeForm.trim()) {
      toast.error("Por favor, insira o nome do script.");
      return;
    }
    if (!mensagemForm.trim()) {
      toast.error("Por favor, escreva o conteúdo da mensagem.");
      return;
    }

    try {
      setSalvando(true);
      const salvo = await salvarScriptWa({
        id: modoCriacao ? undefined : scriptIdEdicao,
        nome: nomeForm.trim(),
        categoria: categoriaForm,
        mensagem: mensagemForm,
        ativo: statusForm,
        status: statusForm ? "ativo" : "inativo",
      });

      setScripts((prev) => {
        const existe = prev.some((s) => s.id === salvo.id);
        if (existe) {
          return prev.map((s) => (s.id === salvo.id ? salvo : s));
        }
        return [salvo, ...prev];
      });

      toast.success(
        modoCriacao
          ? `Script "${salvo.nome}" cadastrado com sucesso!`
          : `Script "${salvo.nome}" atualizado com sucesso!`,
      );

      setModoCriacao(false);
      setScriptIdEdicao(salvo.id);
    } catch {
      toast.error("Falha ao salvar script");
    } finally {
      setSalvando(false);
    }
  };

  // Alternar status
  const handleToggleStatus = async (s: WaScriptItem) => {
    const novoAtivo = !s.ativo;
    setScripts((prev) =>
      prev.map((item) =>
        item.id === s.id
          ? { ...item, ativo: novoAtivo, status: novoAtivo ? "ativo" : "inativo" }
          : item,
      ),
    );
    if (s.id === scriptIdEdicao) {
      setStatusForm(novoAtivo);
    }

    try {
      await alternarStatusScriptWa(s.id, novoAtivo);
      toast.success(novoAtivo ? `Script "${s.nome}" ativado.` : `Script "${s.nome}" desativado.`);
    } catch {
      toast.error("Falha ao alterar status");
      carregarDados();
    }
  };

  // Excluir script
  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    try {
      await excluirScriptWa(itemParaExcluir.id);
      setScripts((prev) => prev.filter((s) => s.id !== itemParaExcluir.id));
      toast.success(`Script "${itemParaExcluir.nome}" excluído.`);
      if (itemParaExcluir.id === scriptIdEdicao) {
        handleNovoScript();
      }
      setItemParaExcluir(null);
    } catch {
      toast.error("Falha ao excluir script");
    }
  };

  // Duplicar script
  const handleDuplicar = async (s: WaScriptItem) => {
    try {
      const dup = await duplicarScriptWa(s.id);
      if (dup) {
        setScripts((prev) => [dup, ...prev]);
        toast.success(`Script duplicado como "${dup.nome}"`);
      }
    } catch {
      toast.error("Falha ao duplicar script");
    } finally {
      setMenuAbertoId(null);
    }
  };

  // Exemplo resolvido para prévia
  const previaResolvida = useMemo(() => {
    const dadosExemplo: WaLeadDados = {
      business_name: "Carlos Eduardo",
      city: "São Paulo",
      category: "Tecnologia",
      phone: "(11) 98765-4321",
      link: "https://flowbusiness.com.br/agenda",
    };
    return resolverVariaveis(mensagemForm, dadosExemplo).replace(
      /\{\{empresa\}\}/g,
      "Flow Business",
    );
  }, [mensagemForm]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 5 KPIS SUPERIORES (ETAPA 4 — REPRODUÇÃO FIEL AO LAYOUT APROVADO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Scripts criados */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <MessageSquare className="h-5 w-5 fill-blue-400/20" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.criadosTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.criados}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Scripts criados</div>
          </div>
        </div>

        {/* KPI 2: Usos no mês */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Send className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.usosMesTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.usosMes.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Usos no mês</div>
          </div>
        </div>

        {/* KPI 3: Atendimentos com script */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="h-5 w-5 fill-purple-400/20" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.atendimentosTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.atendimentos.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Atendimentos com script</div>
          </div>
        </div>

        {/* KPI 4: Taxa de utilização */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              {kpis.taxaUtilizacaoTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.taxaUtilizacao}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Taxa de utilização</div>
          </div>
        </div>

        {/* KPI 5: Avaliação da equipe */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520] p-4.5 shadow-sm transition-all hover:border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
              <Star className="h-5 w-5 fill-yellow-400" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
              {kpis.avaliacaoTrend} <TrendingUp className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {carregando ? "..." : kpis.avaliacao}
            </div>
            <div className="text-xs text-home-muted mt-0.5">Avaliação da equipe</div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: MEUS SCRIPTS (ESQUERDA) + EDITAR SCRIPT (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =====================================================================
            PAINEL CENTRAL ESQUERDO: MEUS SCRIPTS (ETAPAS 5, 6, 7 & 8)
            ===================================================================== */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm">
          {/* Header com Ícone Verde + Título + Subtítulo + Botão Novo Script */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                <SiWhatsapp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Meus scripts</h2>
                <p className="text-xs text-home-muted mt-0.5">
                  Organize suas mensagens por categoria e use variáveis para personalizar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNovoScript}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-home-orange px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.3)] transition-all hover:bg-home-orange/90 active:scale-95 whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Novo script
            </button>
          </div>

          {/* Linha 1 de Filtros: Busca + Dropdowns */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar scripts por nome, categoria ou texto..."
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

            {/* Dropdown Filtro de Categoria */}
            <div className="relative">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full sm:w-auto appearance-none cursor-pointer rounded-xl border border-white/10 bg-[#161c28] pl-8 pr-8 py-2 text-xs font-medium text-white focus:border-home-orange/60 focus:outline-none"
              >
                <option value="todas">Todas as categorias</option>
                <option value="boas_vindas">Boas-vindas</option>
                <option value="qualificacao">Qualificação</option>
                <option value="follow_up">Follow-up</option>
                <option value="agendamento">Agendamento</option>
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
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
            </div>
          </div>

          {/* Linha 2 de Filtros: Categorias Rápidas em Pílulas (ETAPA 6) */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "todos", label: "Todos", count: contagensCategorias.todos },
              { id: "boas_vindas", label: "Boas-vindas", count: contagensCategorias.boas_vindas },
              {
                id: "qualificacao",
                label: "Qualificação",
                count: contagensCategorias.qualificacao,
              },
              { id: "follow_up", label: "Follow-up", count: contagensCategorias.follow_up },
              { id: "agendamento", label: "Agendamento", count: contagensCategorias.agendamento },
              { id: "recuperacao", label: "Recuperação", count: contagensCategorias.recuperacao },
              { id: "atendimento", label: "Atendimento", count: contagensCategorias.atendimento },
            ].map((cat) => {
              const ativo = categoriaRapida === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaRapida(cat.id)}
                  className={cn(
                    "cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap",
                    ativo
                      ? "border border-home-orange bg-home-orange/15 text-white font-bold shadow-[0_0_10px_rgba(255,98,0,0.2)]"
                      : "border border-white/5 bg-[#161c28] text-home-muted hover:text-white hover:bg-white/[0.04]",
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn("text-[10px]", ativo ? "text-home-orange" : "text-home-muted")}
                  >
                    ({cat.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tabela de Scripts (ETAPA 8 — REPRODUÇÃO IDÊNTICA) */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/5 bg-[#0e131d]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-home-muted font-medium bg-[#131824]">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        scriptsFiltrados.length > 0 &&
                        selecionados.length === scriptsFiltrados.length
                      }
                      onChange={() => {
                        if (selecionados.length === scriptsFiltrados.length) {
                          setSelecionados([]);
                        } else {
                          setSelecionados(scriptsFiltrados.map((s) => s.id));
                        }
                      }}
                      className="cursor-pointer rounded border-white/20 bg-[#1a2030] text-home-orange accent-[#ff6200]"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold text-white/80">Nome do script</th>
                  <th className="py-3 px-2 font-semibold text-white/80">Categoria</th>
                  <th className="py-3 px-2 font-semibold text-white/80">Texto</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-center">Variáveis</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-right">Usos</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-center">Status</th>
                  <th className="py-3 px-2 font-semibold text-white/80 text-center w-10">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {scriptsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-home-muted">
                      Nenhum script encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  scriptsFiltrados.map((s) => {
                    const isSelected = selecionados.includes(s.id);
                    const isEditing = scriptIdEdicao === s.id && !modoCriacao;
                    const catInfo = CATEGORIAS_INFO[s.categoria] || CATEGORIAS_INFO.atendimento;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSelecionarParaEdicao(s)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-white/[0.02]",
                          isEditing && "bg-home-orange/[0.07] border-l-2 border-l-home-orange",
                          isSelected && "bg-home-orange/[0.04]",
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelecionados((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((i) => i !== s.id)
                                : [...prev, s.id],
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="cursor-pointer rounded border-white/20 bg-[#1a2030] text-home-orange accent-[#ff6200]"
                          />
                        </td>

                        {/* Nome do Script + Ícone */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm",
                                s.categoria === "boas_vindas" &&
                                  "bg-emerald-500/15 text-emerald-400",
                                s.categoria === "qualificacao" && "bg-blue-500/15 text-blue-400",
                                s.categoria === "agendamento" && "bg-purple-500/15 text-purple-400",
                                s.categoria === "follow_up" && "bg-amber-500/15 text-amber-400",
                                s.categoria === "recuperacao" && "bg-rose-500/15 text-rose-400",
                                s.categoria === "atendimento" && "bg-cyan-500/15 text-cyan-400",
                              )}
                            >
                              {s.categoria === "boas_vindas" && (
                                <SiWhatsapp className="h-3.5 w-3.5" />
                              )}
                              {s.categoria === "qualificacao" && (
                                <MessageSquare className="h-3.5 w-3.5" />
                              )}
                              {s.categoria === "agendamento" && (
                                <Calendar className="h-3.5 w-3.5" />
                              )}
                              {s.categoria === "follow_up" && <Clock className="h-3.5 w-3.5" />}
                              {s.categoria === "recuperacao" && (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              {s.categoria === "atendimento" && (
                                <Headphones className="h-3.5 w-3.5" />
                              )}
                            </div>

                            <div className="font-semibold text-white truncate max-w-[170px]">
                              {s.nome}
                            </div>
                          </div>
                        </td>

                        {/* Categoria Badge */}
                        <td className="py-3 px-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                              s.categoria === "boas_vindas" &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                              s.categoria === "qualificacao" &&
                                "border-blue-500/30 bg-blue-500/10 text-blue-400",
                              s.categoria === "agendamento" &&
                                "border-purple-500/30 bg-purple-500/10 text-purple-400",
                              s.categoria === "follow_up" &&
                                "border-amber-500/30 bg-amber-500/10 text-amber-400",
                              s.categoria === "recuperacao" &&
                                "border-rose-500/30 bg-rose-500/10 text-rose-400",
                              s.categoria === "atendimento" &&
                                "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
                            )}
                          >
                            {catInfo.label}
                          </span>
                        </td>

                        {/* Texto Truncado */}
                        <td className="py-3 px-2 text-home-muted truncate max-w-[180px]">
                          {s.textoPrev || s.mensagem.substring(0, 24) + "..."}
                        </td>

                        {/* Variáveis */}
                        <td className="py-3 px-2 text-center font-medium text-white/90">
                          {s.variaveisCount}
                        </td>

                        {/* Usos */}
                        <td className="py-3 px-2 text-right font-semibold text-white">
                          {s.usos.toLocaleString("pt-BR")}
                        </td>

                        {/* Switch Status */}
                        <td
                          className="py-3 px-2 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(s);
                          }}
                        >
                          <button
                            type="button"
                            title={s.ativo ? "Script ativo" : "Script inativo"}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              s.ativo ? "bg-emerald-500" : "bg-white/20",
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                s.ativo ? "translate-x-4" : "translate-x-0",
                              )}
                            />
                          </button>
                        </td>

                        {/* Ações ⋮ */}
                        <td
                          className="py-3 px-2 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setMenuAbertoId(menuAbertoId === s.id ? null : s.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-home-muted hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {menuAbertoId === s.id && (
                            <div className="absolute right-2 top-10 z-30 w-44 rounded-xl border border-white/10 bg-[#161c28] p-1.5 shadow-xl text-left animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelecionarParaEdicao(s);
                                  setMenuAbertoId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-blue-400" /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setModalPreviaLead(s);
                                  setMenuAbertoId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10"
                              >
                                <Eye className="h-3.5 w-3.5 text-emerald-400" /> Prévia com Lead
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicar(s)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10"
                              >
                                <Copy className="h-3.5 w-3.5 text-purple-400" /> Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setItemParaExcluir(s);
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
            PAINEL DIREITO: EDITAR SCRIPT / NOVO SCRIPT (ETAPAS 9, 10 & 11)
            ===================================================================== */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm">
          {/* Header do Editor com Botão Laranja "Salvar script" na Direita */}
          <div className="flex items-start justify-between pb-4 border-b border-white/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                <SiWhatsapp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {modoCriacao ? "Novo script" : "Editar script"}
                </h2>
                <p className="text-xs text-home-muted mt-0.5">Crie e personalize sua mensagem</p>
              </div>
            </div>

            <button
              type="button"
              disabled={salvando}
              onClick={handleSalvarScript}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-home-orange px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all hover:bg-home-orange/90 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {salvando ? "Salvando..." : "Salvar script"}
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Campo 1: Nome do script */}
            <div>
              <label className="text-xs font-semibold text-white/90">Nome do script</label>
              <input
                type="text"
                value={nomeForm}
                onChange={(e) => setNomeForm(e.target.value)}
                placeholder="Ex: Boas-vindas novo lead"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#161c28] px-3.5 py-2 text-xs text-white focus:border-home-orange/60 focus:outline-none placeholder-home-muted"
              />
            </div>

            {/* Linha com Categoria e Status */}
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Dropdown Categoria */}
              <div className="col-span-8">
                <label className="text-xs font-semibold text-white/90">Categoria</label>
                <div className="relative mt-1.5">
                  <select
                    value={categoriaForm}
                    onChange={(e) => setCategoriaForm(e.target.value as WaScriptCategoria)}
                    className="w-full appearance-none cursor-pointer rounded-xl border border-white/10 bg-[#161c28] pl-8 pr-8 py-2 text-xs font-medium text-white focus:border-home-orange/60 focus:outline-none"
                  >
                    <option value="boas_vindas">Boas-vindas</option>
                    <option value="qualificacao">Qualificação</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="agendamento">Agendamento</option>
                    <option value="recuperacao">Recuperação</option>
                    <option value="atendimento">Atendimento</option>
                  </select>
                  <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="col-span-4 flex flex-col justify-end">
                <label className="text-xs font-semibold text-white/90 mb-1.5">Status</label>
                <div className="flex items-center gap-2 h-[34px]">
                  <button
                    type="button"
                    onClick={() => setStatusForm(!statusForm)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      statusForm ? "bg-emerald-500" : "bg-white/20",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        statusForm ? "translate-x-4" : "translate-x-0",
                      )}
                    />
                  </button>
                  <span className="text-xs font-medium text-white/90">
                    {statusForm ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Campo Mensagem com Barra de Ferramentas e Dropdown de Variáveis */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/90">Mensagem</label>

                {/* Dropdown de Variáveis (ETAPA 11) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuVariaveisAberto(!menuVariaveisAberto)}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Variáveis <ChevronDown className="h-3 w-3" />
                  </button>

                  {menuVariaveisAberto && (
                    <div className="absolute right-0 top-6 z-40 w-64 rounded-xl border border-white/10 bg-[#161c28] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                      <div className="text-[11px] font-bold text-white px-2 py-1 border-b border-white/5">
                        Inserir Variável no Cursor
                      </div>
                      <div className="mt-1 space-y-1">
                        {VARIAVEIS_DISPONIVEIS.map((v) => (
                          <button
                            key={v.token}
                            type="button"
                            onClick={() => {
                              inserirNoCursor(`{{${v.token}}}`);
                              setMenuVariaveisAberto(false);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-left text-white/90 hover:bg-white/10 transition-colors"
                          >
                            <span className="font-mono text-cyan-400">{`{{${v.token}}}`}</span>
                            <span className="text-[10px] text-home-muted truncate max-w-[110px]">
                              {v.exemplo}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Ferramentas de Formatação WhatsApp (ETAPA 10) */}
              <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-white/10 bg-[#182030] px-2.5 py-1.5 text-home-muted">
                <div className="flex items-center gap-1">
                  {/* Negrito: *texto* */}
                  <button
                    type="button"
                    title="Negrito WhatsApp (*texto*)"
                    onClick={() => inserirNoCursor("*", "*")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>

                  {/* Itálico: _texto_ */}
                  <button
                    type="button"
                    title="Itálico WhatsApp (_texto_)"
                    onClick={() => inserirNoCursor("_", "_")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>

                  {/* Tachado: ~texto~ */}
                  <button
                    type="button"
                    title="Tachado WhatsApp (~texto~)"
                    onClick={() => inserirNoCursor("~", "~")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-4 w-px bg-white/10 mx-1" />

                  {/* Lista com Marcadores */}
                  <button
                    type="button"
                    title="Lista com marcadores"
                    onClick={() => inserirNoCursor("• ")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>

                  {/* Lista Numerada */}
                  <button
                    type="button"
                    title="Lista numerada"
                    onClick={() => inserirNoCursor("1. ")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>

                  {/* Link */}
                  <button
                    type="button"
                    title="Inserir link"
                    onClick={() => inserirNoCursor("https://")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>

                  {/* Emoji */}
                  <div className="relative">
                    <button
                      type="button"
                      title="Emojis comuns"
                      onClick={() => setMenuEmojiAberto(!menuEmojiAberto)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Smile className="h-3.5 w-3.5" />
                    </button>

                    {menuEmojiAberto && (
                      <div className="absolute left-0 top-8 z-40 flex gap-1 rounded-xl border border-white/10 bg-[#161c28] p-2 shadow-xl">
                        {EMOJIS_COMUNS.map((emo) => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => {
                              inserirNoCursor(` ${emo} `);
                              setMenuEmojiAberto(false);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/10 text-base"
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alternar Prévia */}
                <button
                  type="button"
                  onClick={() => setModoPrevia(!modoPrevia)}
                  title="Alternar Prévia com variáveis resolvidas"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                    modoPrevia
                      ? "bg-emerald-500/15 text-emerald-400 font-bold"
                      : "text-home-muted hover:text-white hover:bg-white/5",
                  )}
                >
                  <Eye className="h-3 w-3" /> {modoPrevia ? "Editor" : "Prévia"}
                </button>
              </div>

              {/* Área de Texto / Prévia */}
              {modoPrevia ? (
                <div className="rounded-b-xl border border-white/10 bg-[#121722] p-3 text-xs text-white min-h-[170px] whitespace-pre-wrap leading-relaxed">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Prévia com dados demonstrativos:
                  </div>
                  {previaResolvida}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  rows={7}
                  value={mensagemForm}
                  maxLength={1000}
                  onChange={(e) => setMensagemForm(e.target.value)}
                  placeholder="Digite sua mensagem pronta aqui..."
                  className="w-full rounded-b-xl border border-white/10 bg-[#141a26] p-3 text-xs text-white focus:border-home-orange/60 focus:outline-none resize-none font-sans leading-relaxed"
                />
              )}

              {/* Contador de Caracteres */}
              <div className="mt-1 flex justify-end">
                <span className="text-[10px] text-home-muted">{mensagemForm.length}/1000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SEÇÃO INFERIOR: 3 CARDS (DESEMPENHO, SCRIPTS MAIS USADOS & ATIVIDADE)
          (ETAPAS 15, 16 & 17 — REPRODUÇÃO FIEL AO LAYOUT APROVADO)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* =====================================================================
            CARD INFERIOR ESQUERDO: DESEMPENHO DOS SCRIPTS (ETAPA 15)
            ===================================================================== */}
        <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Desempenho dos scripts
                  </h3>
                  <p className="text-[11px] text-home-muted">
                    Uso e resultados das suas mensagens prontas
                  </p>
                </div>
              </div>

              {/* Dropdown Período */}
              <div className="relative">
                <select
                  defaultValue="30"
                  className="appearance-none cursor-pointer rounded-lg border border-white/10 bg-[#161c28] pl-2.5 pr-6 py-1 text-[11px] font-medium text-white focus:outline-none"
                >
                  <option value="30">Últimos 30 dias</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="1">Hoje</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-home-muted" />
              </div>
            </div>

            {/* 4 Caixas de Métricas */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2">
                <div className="flex items-center justify-between">
                  <Send className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.usosMesTrend}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {desempenho.usosMes.toLocaleString("pt-BR")}
                </div>
                <div className="text-[9px] text-home-muted truncate">Usos no mês</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2">
                <div className="flex items-center justify-between">
                  <Users className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.conversasTrend}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {desempenho.conversas.toLocaleString("pt-BR")}
                </div>
                <div className="text-[9px] text-home-muted truncate">Conversas</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2">
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-3 w-3 text-purple-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.taxaRespostaTrend}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">{desempenho.taxaResposta}</div>
                <div className="text-[9px] text-home-muted truncate">Taxa resposta</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#141a27] p-2">
                <div className="flex items-center justify-between">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {desempenho.avaliacaoTrend}
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">{desempenho.avaliacao}</div>
                <div className="text-[9px] text-home-muted truncate">Avaliação</div>
              </div>
            </div>

            {/* Gráfico de Linhas SVG */}
            <div className="mt-5 relative h-36 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
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

                <text x="5" y="23" fill="#64748b" fontSize="8">
                  200
                </text>
                <text x="5" y="53" fill="#64748b" fontSize="8">
                  150
                </text>
                <text x="5" y="83" fill="#64748b" fontSize="8">
                  100
                </text>
                <text x="10" y="107" fill="#64748b" fontSize="8">
                  50
                </text>

                {/* Curva 1: Usos (Verde/Cyan) */}
                <path
                  d="M 30,55 Q 85,32 140,42 T 250,22 T 330,15 T 390,20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />

                {/* Curva 2: Conversas (Azul) */}
                <path
                  d="M 30,85 Q 85,68 140,75 T 250,60 T 330,48 T 390,52"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />

                {/* Curva 3: Respostas (Roxo) */}
                <path
                  d="M 30,100 Q 85,92 140,96 T 250,86 T 330,78 T 390,82"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                />

                <circle cx="390" cy="20" r="3.5" fill="#10b981" />
                <circle cx="390" cy="52" r="3.5" fill="#3b82f6" />
                <circle cx="390" cy="82" r="3.5" fill="#a855f7" />

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

          {/* Legenda */}
          <div className="mt-3 flex items-center justify-center gap-5 border-t border-white/5 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span>Usos</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
              <span>Conversas iniciadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
              <span>Respostas</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD INFERIOR CENTRAL: SCRIPTS MAIS USADOS (ETAPA 16)
            ===================================================================== */}
        <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#101520] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Scripts mais usados
                  </h3>
                  <p className="text-[11px] text-home-muted">
                    Ranking dos scripts com melhor desempenho
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalVerMaisUsados(true)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Ver todos
              </button>
            </div>

            {/* Ranking 1 a 5 com Badges Coloridas */}
            <div className="mt-3 divide-y divide-white/[0.04]">
              {maisUsados.map((item) => (
                <div key={item.rank} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Número do Ranking */}
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                        item.rank === 1 && "bg-home-orange shadow-[0_0_10px_rgba(255,98,0,0.5)]",
                        item.rank === 2 && "bg-blue-500",
                        item.rank === 3 && "bg-purple-500",
                        item.rank === 4 && "bg-amber-500",
                        item.rank === 5 && "bg-rose-500",
                      )}
                    >
                      {item.rank}
                    </div>

                    {/* Ícone da Categoria */}
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm",
                        item.categoria === "boas_vindas" && "bg-emerald-500/15 text-emerald-400",
                        item.categoria === "qualificacao" && "bg-blue-500/15 text-blue-400",
                        item.categoria === "agendamento" && "bg-purple-500/15 text-purple-400",
                        item.categoria === "follow_up" && "bg-amber-500/15 text-amber-400",
                        item.categoria === "recuperacao" && "bg-rose-500/15 text-rose-400",
                      )}
                    >
                      {item.categoria === "boas_vindas" && <SiWhatsapp className="h-3.5 w-3.5" />}
                      {item.categoria === "qualificacao" && (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                      {item.categoria === "agendamento" && <Calendar className="h-3.5 w-3.5" />}
                      {item.categoria === "follow_up" && <Clock className="h-3.5 w-3.5" />}
                      {item.categoria === "recuperacao" && <RefreshCw className="h-3.5 w-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{item.nome}</div>
                      <div className="text-[11px] text-home-muted truncate">
                        {item.categoriaLabel}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white">{item.usos}</span>
                    <span className="text-[10px] text-home-muted ml-1">usos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================================
            CARD INFERIOR DIREITO: ATIVIDADE RECENTE (ETAPA 17)
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
                  <p className="text-[11px] text-home-muted">Últimas ações nos scripts</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalVerAtividades(true)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Ver todas
              </button>
            </div>

            {/* 6 Ações Recentes com Horários */}
            <div className="mt-3 divide-y divide-white/[0.04]">
              {atividades.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm",
                        act.cor === "green" && "bg-emerald-500/15 text-emerald-400",
                        act.cor === "blue" && "bg-blue-500/15 text-blue-400",
                        act.cor === "cyan" && "bg-cyan-500/15 text-cyan-400",
                        act.cor === "red" && "bg-rose-500/15 text-rose-400",
                        act.cor === "purple" && "bg-purple-500/15 text-purple-400",
                      )}
                    >
                      {act.tipo === "atualizado" && <Edit3 className="h-3.5 w-3.5" />}
                      {act.tipo === "criado" && <Plus className="h-3.5 w-3.5" />}
                      {act.tipo === "variavel" && <Tag className="h-3.5 w-3.5" />}
                      {act.tipo === "desativado" && <Clock className="h-3.5 w-3.5" />}
                      {act.tipo === "ativado" && <Check className="h-3.5 w-3.5" />}
                      {act.tipo === "categoria" && <Folder className="h-3.5 w-3.5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{act.titulo}</div>
                      <div className="text-[11px] text-home-muted truncate">{act.scriptNome}</div>
                    </div>
                  </div>

                  <span className="text-[11px] text-home-muted shrink-0 text-right">
                    {act.horario}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAIS E DIÁLOGOS
          ===================================================================== */}

      {/* Modal Confirmar Exclusão */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#101520] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir script?</h3>
                <p className="text-xs text-home-muted mt-0.5">
                  Esta ação é irreversível. O script não estará mais disponível para reuso.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#161c28] p-3 text-xs text-white">
              <strong>{itemParaExcluir.nome}</strong>
              <div className="text-[11px] text-home-muted mt-0.5">
                Categoria: {CATEGORIAS_INFO[itemParaExcluir.categoria]?.label || "Geral"} •{" "}
                {itemParaExcluir.usos} utilizações registradas
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="rounded-xl border border-white/10 bg-[#161c28] px-4 py-2 text-xs font-semibold text-white hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prévia com Lead */}
      {modalPreviaLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Eye className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Prévia do Script: {modalPreviaLead.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPreviaLead(null)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-[#161c28] p-3 text-xs space-y-1.5">
                <div className="text-[11px] font-bold text-home-muted uppercase">
                  Exemplo de lead aplicado:
                </div>
                <div className="text-white">
                  Nome: <strong>Carlos Silva</strong> • Empresa: <strong>Acme Corp</strong> •
                  Cidade: <strong>São Paulo</strong>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-xs text-white leading-relaxed whitespace-pre-wrap">
                {resolverVariaveis(modalPreviaLead.mensagem, {
                  business_name: "Carlos Silva",
                  city: "São Paulo",
                  category: "Tecnologia",
                  phone: "(11) 98765-4321",
                  link: "https://flowbusiness.com.br/agenda",
                }).replace(/\{\{empresa\}\}/g, "Acme Corp")}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setModalPreviaLead(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Todos os Scripts Mais Usados */}
      {modalVerMaisUsados && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Ranking de Utilização de Scripts</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVerMaisUsados(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {maisUsados.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#161c28] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-home-orange">#{item.rank}</span>
                    <div>
                      <div className="font-semibold text-white">{item.nome}</div>
                      <div className="text-[10px] text-home-muted">{item.categoriaLabel}</div>
                    </div>
                  </div>
                  <div className="font-bold text-white">{item.usos} usos</div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setModalVerMaisUsados(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Todas as Atividades */}
      {modalVerAtividades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Histórico de Ações nos Scripts</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVerAtividades(false)}
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
                    <div className="text-[11px] text-home-muted">{act.scriptNome}</div>
                  </div>
                  <span className="text-[11px] text-home-muted">{act.horario}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setModalVerAtividades(false)}
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
