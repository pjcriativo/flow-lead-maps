// Tela 04 — Treinamento & Conhecimento
// Central de treinamento dos agentes de IA do Flow Business com fidelidade visual absoluta ao layout aprovado.
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
  Clock,
  Compass,
  Crown,
  Database,
  Download,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderKanban,
  FolderPlus,
  Globe,
  Handshake,
  HelpCircle,
  Layers,
  Lightbulb,
  Link2,
  Megaphone,
  MoreVertical,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  UploadCloud,
  UserCheck,
  Users,
  Video,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORIAS_INICIAIS,
  DOCUMENTOS_INICIAIS,
  CONEXOES_EXTERNAS_INICIAIS,
  TOPICOS_MAIS_UTILIZADOS,
  DESEMPENHO_CONHECIMENTO_SERIE,
  SUGESTOES_MELHORIA_INICIAIS,
  type CategoriaConhecimento,
  type DocumentoConhecimento,
  type ConexaoExternaItem,
} from "./treinamento-data";
import { NovaCategoriaModal } from "./NovaCategoriaModal";
import { ConexaoExternaModal } from "./ConexaoExternaModal";

interface TreinamentoConhecimentoViewProps {
  agenteId?: string;
  onVoltar?: () => void;
  onNavegarPerfil?: () => void;
  onNavegarEquipe?: () => void;
  onNavegarMemoria?: () => void;
  onNavegarSkills?: () => void;
  onNavegarFluxos?: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 backdrop-blur-sm shadow-xl";

export function TreinamentoConhecimentoView({
  agenteId = "ceo",
  onVoltar,
  onNavegarPerfil,
  onNavegarEquipe,
  onNavegarMemoria,
  onNavegarSkills,
  onNavegarFluxos,
}: TreinamentoConhecimentoViewProps) {
  // Estados de dados locais
  const [categorias, setCategorias] = useState<CategoriaConhecimento[]>(CATEGORIAS_INICIAIS);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [documentos, setDocumentos] = useState<DocumentoConhecimento[]>(DOCUMENTOS_INICIAIS);
  const [conexoes, setConexoes] = useState<ConexaoExternaItem[]>(CONEXOES_EXTERNAS_INICIAIS);

  // Barra de ferramentas
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [documentosSelecionados, setDocumentosSelecionados] = useState<string[]>(["doc-1"]);

  // Painel "Adicionar Conhecimento"
  const [abaAdicionar, setAbaAdicionar] = useState<"arquivo" | "link" | "texto" | "faq" | "video">("arquivo");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitulo, setLinkTitulo] = useState("");
  const [textoTitulo, setTextoTitulo] = useState("");
  const [textoConteudo, setTextoConteudo] = useState("");
  const [faqPergunta, setFaqPergunta] = useState("");
  const [faqResposta, setFaqResposta] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitulo, setVideoTitulo] = useState("");

  // Modais
  const [modalNovaCatAberto, setModalNovaCatAberto] = useState(false);
  const [modalConexaoAberto, setModalConexaoAberto] = useState(false);
  const [conexaoSelecionada, setConexaoSelecionada] = useState<ConexaoExternaItem | null>(null);

  // Notificação de feedback
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const mostrarToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // Filtragem dos documentos
  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const matchBusca =
        doc.nome.toLowerCase().includes(busca.toLowerCase()) ||
        doc.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        (doc.descricao && doc.descricao.toLowerCase().includes(busca.toLowerCase()));

      const matchCat =
        categoriaAtiva === "todos" ||
        doc.categoria.toLowerCase().includes(
          categorias.find((c) => c.id === categoriaAtiva)?.nome.toLowerCase() || "",
        );

      const matchTipo =
        tipoFiltro === "todos" || doc.tipo.toLowerCase() === tipoFiltro.toLowerCase();

      return matchBusca && matchCat && matchTipo;
    });
  }, [documentos, busca, categoriaAtiva, tipoFiltro, categorias]);

  const toggleSelectDoc = (id: string) => {
    setDocumentosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectTodos = () => {
    if (documentosSelecionados.length === documentosFiltrados.length) {
      setDocumentosSelecionados([]);
    } else {
      setDocumentosSelecionados(documentosFiltrados.map((d) => d.id));
    }
  };

  // Simulação de upload local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
      const tipoMapeado =
        ext === "MD" ? "Markdown" : ext === "TXT" ? "Texto" : ext === "CSV" ? "CSV" : "PDF";

      const novoDoc: DocumentoConhecimento = {
        id: `doc-${Date.now()}`,
        nome: file.name,
        tipo: tipoMapeado as any,
        categoria: "Estratégia Comercial",
        atualizadoEm: "20/10/2026",
        status: "Ativo",
        tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        descricao: "Arquivo carregado localmente para treinamento.",
      };

      setDocumentos((prev) => [novoDoc, ...prev]);
      mostrarToast(`Arquivo "${file.name}" indexado com sucesso na biblioteca!`);
    }
  };

  // Adicionar conteúdo dos formulários
  const handleAdicionarConteudo = (tipo: string) => {
    let nomeDoc = "";
    let catDoc = "Geral";

    if (tipo === "link" && linkTitulo) {
      nomeDoc = `${linkTitulo}.link`;
      catDoc = "Links e Referências";
      setLinkTitulo("");
      setLinkUrl("");
    } else if (tipo === "texto" && textoTitulo) {
      nomeDoc = `${textoTitulo}.md`;
      catDoc = "Processos e Procedimentos";
      setTextoTitulo("");
      setTextoConteudo("");
    } else if (tipo === "faq" && faqPergunta) {
      nomeDoc = `FAQ: ${faqPergunta.substring(0, 30)}...`;
      catDoc = "FAQs";
      setFaqPergunta("");
      setFaqResposta("");
    } else if (tipo === "video" && videoTitulo) {
      nomeDoc = `${videoTitulo}.mp4`;
      catDoc = "Treinamentos em Vídeo";
      setVideoTitulo("");
      setVideoUrl("");
    } else {
      return;
    }

    const novoDoc: DocumentoConhecimento = {
      id: `doc-${Date.now()}`,
      nome: nomeDoc,
      tipo: tipo === "link" ? "Link" : tipo === "video" ? "Vídeo" : tipo === "faq" ? "FAQ" : "Markdown",
      categoria: catDoc,
      atualizadoEm: "20/10/2026",
      status: "Ativo",
      tamanho: "N/A",
      descricao: "Conteúdo adicionado diretamente pelo formulário.",
    };

    setDocumentos((prev) => [novoDoc, ...prev]);
    mostrarToast("Novo conhecimento adicionado com sucesso!");
  };

  const handleExcluirDoc = (id: string) => {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
    setDocumentosSelecionados((prev) => prev.filter((item) => item !== id));
    mostrarToast("Documento removido da biblioteca.");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      <div className="mx-auto max-w-[1680px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 space-y-6">

        {/* =========================================================================
            1. CABEÇALHO DA TELA 04
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
                04
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
                <button
                  type="button"
                  onClick={onNavegarPerfil}
                  className="hover:text-white transition-colors"
                >
                  CEO de IA
                </button>
                <ChevronRight className="size-3 text-neutral-500" />
                <span className="text-neutral-200 font-semibold">Treinamento &amp; Conhecimento</span>
              </nav>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Treinamento &amp; Conhecimento
              </h1>
              <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
                Documentos, bases de conhecimento, FAQs e treinamento personalizado.
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
              onClick={() => {
                const input = document.getElementById("file-upload-input");
                if (input) input.click();
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Download className="size-4 text-neutral-400" />
              <span>Importar conteúdo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setConexaoSelecionada(conexoes.find((c) => c.id === "obsidian") || conexoes[0]);
                setModalConexaoAberto(true);
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181e2b] hover:text-white"
            >
              <Database className="size-4 text-purple-400" />
              <span>Conectar Obsidian</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const addCard = document.getElementById("card-adicionar-conhecimento");
                if (addCard) addCard.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f95d14] px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#ff6c26]"
            >
              <Plus className="size-4" />
              <span>Adicionar conhecimento</span>
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
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                <div className="absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-lg bg-amber-400 text-black shadow-md">
                  <Crown className="size-4 fill-black" />
                </div>
              </div>

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
                  Treinamento contínuo e base de conhecimento para aumentar a performance do agente.
                  Aqui você pode fornecer documentos, links, FAQs, estratégias, exemplos e todo o material que o agente deve utilizar.
                </p>
              </div>
            </div>

            {/* 6 Indicadores Superiores da Referência */}
            <div className="space-y-2.5">
              {/* Linha 1: 4 Cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { label: "Documentos", val: "124", sub: "+12 este mês", icon: FileText, cor: "text-purple-400 bg-purple-500/10" },
                  { label: "Links e Referências", val: "36", sub: "+5 este mês", icon: Link2, cor: "text-blue-400 bg-blue-500/10" },
                  { label: "Perguntas Frequentes", val: "48", sub: "+8 este mês", icon: HelpCircle, cor: "text-purple-400 bg-purple-500/10" },
                  { label: "Versões de Treinamento", val: "7", sub: "+2 atualizações", icon: Layers, cor: "text-emerald-400 bg-emerald-500/10" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col justify-between rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-neutral-400 truncate">{item.label}</span>
                      <div className={cn("flex size-6 items-center justify-center rounded-lg border border-white/5", item.cor)}>
                        <item.icon className="size-3.5" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-base font-bold text-white tracking-tight">{item.val}</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Linha 2: 2 Cards (Última atualização & Status do treinamento) */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    <RefreshCw className="size-4 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-neutral-400">Última atualização</span>
                    <p className="text-sm font-bold text-white">20/10/2026 14:32</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-[#121620]/90 p-3 shadow-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-neutral-400">Status do treinamento</span>
                    <span className="text-xs font-bold text-emerald-400">87%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 w-[87%]" />
                  </div>
                  <p className="mt-1 text-[10px] text-neutral-400">Base de conhecimento ativa e sincronizada</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            3. NAVEGAÇÃO DO PERFIL (Pill Tabs com Treinamento Ativo)
           ========================================================================= */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#1b2232] pb-3 scrollbar-none">
          {[
            { id: "visao_geral", label: "Visão Geral", action: onNavegarPerfil },
            { id: "configuracoes", label: "Configurações" },
            { id: "treinamento", label: "Treinamento", ativo: true },
            { id: "memoria", label: "Memória", action: onNavegarMemoria },
            { id: "skills", label: "Skills", action: onNavegarSkills },
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
            4. LAYOUT EM TRÊS COLUNAS DA REFERÊNCIA
           ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* =======================================================================
              4.1 COLUNA ESQUERDA — CATEGORIAS DE CONHECIMENTO (~25% / 3 cols)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-3">
            <div className={cn(PANEL_CLASS, "p-4")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  Categorias de conhecimento
                </h3>
                <button
                  type="button"
                  onClick={() => setModalNovaCatAberto(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#f95d14] hover:text-[#ff7836]"
                >
                  <Plus className="size-3" />
                  <span>Nova categoria</span>
                </button>
              </div>

              {/* Lista de Categorias com Ícones e Contadores */}
              <div className="space-y-1">
                {categorias.map((cat) => {
                  const ativa = categoriaAtiva === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoriaAtiva(cat.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-all",
                        ativa
                          ? "bg-white/10 text-white font-semibold ring-1 ring-white/15"
                          : "text-neutral-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={cn("size-3.5 shrink-0", cat.cor)} />
                        <span className="truncate">{cat.nome}</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-mono",
                          ativa ? "bg-[#f95d14] text-white font-bold" : "bg-white/5 text-neutral-500",
                        )}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =======================================================================
              4.2 COLUNA CENTRAL — BIBLIOTECA DE CONHECIMENTO (~50% / 6 cols)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-6">
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white">Biblioteca de Conhecimento</h3>
                
                {/* Barra de Ferramentas */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar por nome, conteúdo ou categoria..."
                      className="h-9 w-full rounded-xl border border-white/10 bg-[#121620] pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={tipoFiltro}
                      onChange={(e) => setTipoFiltro(e.target.value)}
                      className="h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-neutral-300 focus:border-[#f95d14] focus:outline-none"
                    >
                      <option value="todos">Todos os tipos</option>
                      <option value="pdf">PDF</option>
                      <option value="markdown">Markdown</option>
                      <option value="texto">Texto</option>
                      <option value="link">Link</option>
                      <option value="faq">FAQ</option>
                    </select>

                    <div className="flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-[#121620] px-3 text-xs text-neutral-300">
                      <span>Mais recentes</span>
                      <ChevronDown className="size-3 text-neutral-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Documentos */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1b2232] text-[10px] uppercase tracking-wider text-neutral-400">
                      <th className="py-2.5 pl-2 pr-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            documentosFiltrados.length > 0 &&
                            documentosSelecionados.length === documentosFiltrados.length
                          }
                          onChange={toggleSelectTodos}
                          className="rounded border-[#1b2232] accent-[#f95d14]"
                        />
                      </th>
                      <th className="py-2.5 pr-3 font-medium">Nome</th>
                      <th className="py-2.5 pr-3 font-medium">Tipo</th>
                      <th className="py-2.5 pr-3 font-medium">Categoria</th>
                      <th className="py-2.5 pr-3 font-medium">Atualizado em</th>
                      <th className="py-2.5 pr-3 font-medium">Status</th>
                      <th className="py-2.5 pr-2 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161c28]">
                    {documentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                          Nenhum documento encontrado para o filtro aplicado.
                        </td>
                      </tr>
                    ) : (
                      documentosFiltrados.map((doc) => {
                        const isSelecionado = documentosSelecionados.includes(doc.id);
                        return (
                          <tr
                            key={doc.id}
                            className={cn(
                              "transition-colors hover:bg-white/[0.03]",
                              isSelecionado && "bg-white/[0.02]",
                            )}
                          >
                            <td className="py-3 pl-2 pr-3">
                              <input
                                type="checkbox"
                                checked={isSelecionado}
                                onChange={() => toggleSelectDoc(doc.id)}
                                className="rounded border-[#1b2232] accent-[#f95d14]"
                              />
                            </td>
                            <td className="py-3 pr-3 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <FileText className="size-4 text-orange-400 shrink-0" />
                                <span className="truncate max-w-[180px]" title={doc.nome}>
                                  {doc.nome}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-3">
                              <span className="rounded bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                                {doc.tipo}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-neutral-400 text-[11px] truncate max-w-[130px]">
                              {doc.categoria}
                            </td>
                            <td className="py-3 pr-3 text-neutral-400 text-[11px] whitespace-nowrap">
                              {doc.atualizadoEm}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-400" />
                                <span>{doc.status}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleExcluirDoc(doc.id)}
                                title="Remover da lista"
                                className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =======================================================================
              4.3 COLUNA DIREITA — ADICIONAR CONHECIMENTO & CONEXÕES (~25% / 3 cols)
             ======================================================================= */}
          <div className="space-y-6 lg:col-span-3">
            
            {/* Card Adicionar Conhecimento */}
            <div id="card-adicionar-conhecimento" className={cn(PANEL_CLASS, "p-5")}>
              <h3 className="text-sm font-bold text-white mb-3">Adicionar Conhecimento</h3>

              {/* Abas de Adição */}
              <div className="flex gap-1 border-b border-[#1b2232] pb-2">
                {[
                  { id: "arquivo", label: "Arquivo" },
                  { id: "link", label: "Link" },
                  { id: "texto", label: "Texto" },
                  { id: "faq", label: "FAQ" },
                  { id: "video", label: "Vídeo" },
                ].map((item) => {
                  const ativa = abaAdicionar === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAbaAdicionar(item.id as typeof abaAdicionar)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all",
                        ativa ? "bg-[#f95d14] text-white" : "text-neutral-400 hover:text-white",
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Aba Arquivo: Drag & Drop Area */}
              {abaAdicionar === "arquivo" && (
                <div className="mt-4">
                  <input
                    id="file-upload-input"
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload-input"
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#1b2232] bg-[#10141e] p-6 text-center cursor-pointer transition-all hover:border-[#f95d14]/50 hover:bg-[#131926]"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-[#f95d14] mb-3">
                      <UploadCloud className="size-6" />
                    </div>
                    <p className="text-xs font-bold text-white">
                      Arraste e solte arquivos aqui
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#f95d14] font-medium">
                      ou clique para selecionar
                    </p>
                    <p className="mt-3 text-[10px] text-neutral-500 leading-tight">
                      Suporte a: PDF, DOC, DOCX, TXT, MD, CSV, XLS, XLSX
                      <br />
                      Tamanho máximo: 50 MB
                    </p>
                  </label>
                </div>
              )}

              {/* Aba Link */}
              {abaAdicionar === "link" && (
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block font-semibold">URL da Página / Documento</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://suaempresa.com.br/regras"
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block font-semibold">Título do Link</label>
                    <input
                      type="text"
                      value={linkTitulo}
                      onChange={(e) => setLinkTitulo(e.target.value)}
                      placeholder="Ex: Regulamento de Vendas 2026"
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdicionarConteudo("link")}
                    className="w-full rounded-xl bg-[#f95d14] py-2 font-bold text-white shadow-md hover:bg-[#ff6c26]"
                  >
                    Indexar Link
                  </button>
                </div>
              )}

              {/* Aba Texto */}
              {abaAdicionar === "texto" && (
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block font-semibold">Título da Nota</label>
                    <input
                      type="text"
                      value={textoTitulo}
                      onChange={(e) => setTextoTitulo(e.target.value)}
                      placeholder="Ex: Regras de Desconto Especial"
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block font-semibold">Conteúdo em Texto</label>
                    <textarea
                      rows={4}
                      value={textoConteudo}
                      onChange={(e) => setTextoConteudo(e.target.value)}
                      placeholder="Cole aqui o texto ou instrução direta para o agente..."
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdicionarConteudo("texto")}
                    className="w-full rounded-xl bg-[#f95d14] py-2 font-bold text-white shadow-md hover:bg-[#ff6c26]"
                  >
                    Salvar Nota
                  </button>
                </div>
              )}

              {/* Aba FAQ */}
              {abaAdicionar === "faq" && (
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block font-semibold">Pergunta Frequente</label>
                    <input
                      type="text"
                      value={faqPergunta}
                      onChange={(e) => setFaqPergunta(e.target.value)}
                      placeholder="Ex: Como funciona a garantia do serviço?"
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block font-semibold">Resposta Oficial</label>
                    <textarea
                      rows={3}
                      value={faqResposta}
                      onChange={(e) => setFaqResposta(e.target.value)}
                      placeholder="Explique a resposta que o agente deve fornecer..."
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdicionarConteudo("faq")}
                    className="w-full rounded-xl bg-[#f95d14] py-2 font-bold text-white shadow-md hover:bg-[#ff6c26]"
                  >
                    Adicionar FAQ
                  </button>
                </div>
              )}

              {/* Aba Vídeo */}
              {abaAdicionar === "video" && (
                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block font-semibold">URL do Vídeo (YouTube / Vimeo / Loom)</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://loom.com/share/..."
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block font-semibold">Título do Treinamento</label>
                    <input
                      type="text"
                      value={videoTitulo}
                      onChange={(e) => setVideoTitulo(e.target.value)}
                      placeholder="Ex: Demonstração da Apresentação Comercial"
                      className="mt-1 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdicionarConteudo("video")}
                    className="w-full rounded-xl bg-[#f95d14] py-2 font-bold text-white shadow-md hover:bg-[#ff6c26]"
                  >
                    Salvar Treinamento em Vídeo
                  </button>
                </div>
              )}
            </div>

            {/* Card Conexões Externas */}
            <div className={cn(PANEL_CLASS, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Conexões Externas</h3>
                <button
                  type="button"
                  onClick={() => {
                    setConexaoSelecionada(conexoes[0]);
                    setModalConexaoAberto(true);
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-white/10"
                >
                  Configurar
                </button>
              </div>

              <div className="space-y-3">
                {conexoes.map((cx) => (
                  <div
                    key={cx.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620] p-3 transition-colors hover:border-white/15"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-neutral-300">
                        {cx.id === "obsidian" ? (
                          <Database className="size-4 text-purple-400" />
                        ) : cx.id === "github" ? (
                          <FileCode className="size-4 text-white" />
                        ) : (
                          <Globe className="size-4 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white leading-tight">{cx.nome}</p>
                        <p className="text-[10px] text-neutral-400 truncate max-w-[130px]">
                          {cx.descricao}
                        </p>
                      </div>
                    </div>

                    <div>
                      {cx.status === "Conectado" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <Check className="size-3" />
                          <span>Conectado</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500">Não conectado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================================
            5. ÁREA INFERIOR — 3 CARDS DE INDICADORES
           ========================================================================= */}
        <section className="grid gap-6 lg:grid-cols-12">
          
          {/* 5.1 Tópicos Mais Utilizados (~25% / 3 cols) */}
          <div className={cn(PANEL_CLASS, "p-5 lg:col-span-3")}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Tópicos mais utilizados</h3>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <span>Últimos 30 dias</span>
                <ChevronDown className="size-3 text-neutral-500" />
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {TOPICOS_MAIS_UTILIZADOS.map((item) => (
                <div key={item.topico}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-neutral-300">{item.topico}</span>
                    <span className="font-bold text-white">{item.consultas}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#f95d14] transition-all duration-300"
                      style={{ width: `${Math.min(100, (item.consultas / 130) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5.2 Desempenho do Conhecimento (~50% / 6 cols) */}
          <div className={cn(PANEL_CLASS, "p-5 lg:col-span-6")}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Desempenho do conhecimento</h3>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-blue-400">
                    <span className="size-1.5 rounded-full bg-blue-400" /> Consultas
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> Respostas
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#f95d14]">
                    <span className="size-1.5 rounded-full bg-[#f95d14]" /> Aprendizado
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                  <span>Últimos 30 dias</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>
            </div>

            {/* Smooth SVG Line Chart */}
            <div className="relative mt-2 h-44 w-full">
              <svg className="size-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="#1b2232" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="#1b2232" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="#1b2232" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#1b2232" strokeWidth="1" />

                {/* Series Consultas (Blue) */}
                <path
                  d="M 20,130 Q 120,95 200,105 T 350,55 T 480,40 T 580,35"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <circle cx="350" cy="55" r="4" fill="#38bdf8" />

                {/* Series Respostas (Green) */}
                <path
                  d="M 20,140 Q 120,110 200,120 T 350,75 T 480,60 T 580,50"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                />
                <circle cx="350" cy="75" r="4" fill="#34d399" />

                {/* Series Aprendizado (Orange) */}
                <path
                  d="M 20,150 Q 120,135 200,140 T 350,115 T 480,105 T 580,95"
                  fill="none"
                  stroke="#f95d14"
                  strokeWidth="2.5"
                />
                <circle cx="350" cy="115" r="4" fill="#f95d14" />

                {/* Tooltip vertical line */}
                <line x1="350" y1="15" x2="350" y2="150" stroke="#f95d14" strokeWidth="1" strokeDasharray="2 2" />
              </svg>

              {/* Tooltip box at 20/10 */}
              <div className="absolute left-[58%] top-[12%] -translate-x-1/2 rounded-xl border border-white/10 bg-[#121620]/95 p-2 text-[10px] shadow-2xl backdrop-blur-md">
                <p className="font-semibold text-neutral-400 pb-1 border-b border-white/5">20/10</p>
                <div className="mt-1 space-y-0.5">
                  <div className="flex justify-between gap-3 text-neutral-300">
                    <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-blue-400" /> Consultas</span>
                    <span className="font-bold text-white">142</span>
                  </div>
                  <div className="flex justify-between gap-3 text-neutral-300">
                    <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-emerald-400" /> Respostas</span>
                    <span className="font-bold text-white">118</span>
                  </div>
                  <div className="flex justify-between gap-3 text-neutral-300">
                    <span className="flex items-center gap-1"><span className="size-1 rounded-full bg-[#f95d14]" /> Aprendizado</span>
                    <span className="font-bold text-white">64</span>
                  </div>
                </div>
              </div>

              {/* Axis Dates */}
              <div className="mt-2 flex justify-between text-[10px] text-neutral-500 font-medium">
                <span>01/10</span>
                <span>05/10</span>
                <span>10/10</span>
                <span>15/10</span>
                <span className="text-[#f95d14] font-bold">20/10</span>
                <span>25/10</span>
                <span>30/10</span>
              </div>
            </div>
          </div>

          {/* 5.3 Sugestões de Melhoria (~25% / 3 cols) */}
          <div className={cn(PANEL_CLASS, "p-5 lg:col-span-3")}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Sugestões de melhoria</h3>
              <button type="button" className="text-xs font-semibold text-[#f95d14] hover:text-[#ff7836]">
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {SUGESTOES_MELHORIA_INICIAIS.map((sug) => {
                const Icon = sug.icon;
                return (
                  <div
                    key={sug.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121620] p-3 transition-colors hover:border-white/15"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", sug.corBg, sug.corIcone)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate max-w-[130px]">{sug.titulo}</p>
                        <p className="text-[10px] text-neutral-400 truncate max-w-[130px]">{sug.descricao}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCategoriaAtiva(sug.categoriaAlvo);
                        mostrarToast(`Categoria "${sug.titulo}" selecionada para ação.`);
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-[#f95d14] hover:text-white hover:border-[#f95d14] transition-all"
                    >
                      {sug.acaoTexto}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

      </div>

      {/* Modais */}
      <NovaCategoriaModal
        aberto={modalNovaCatAberto}
        onFechar={() => setModalNovaCatAberto(false)}
        onCriar={(nova) => {
          setCategorias((prev) => [...prev, nova]);
          mostrarToast(`Categoria "${nova.nome}" criada com sucesso!`);
        }}
      />

      <ConexaoExternaModal
        aberto={modalConexaoAberto}
        onFechar={() => setModalConexaoAberto(false)}
        conexao={conexaoSelecionada}
        onSalvar={(id, status) => {
          setConexoes((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status } : c)),
          );
          mostrarToast(`Status da conexão atualizado para "${status}".`);
        }}
      />
    </div>
  );
}
