// Tela 02 — Criador Profissional de Contratos (Gestão → Contratos → Criador de Contrato)
// Fiel ao layout final aprovado com máxima fidelidade visual:
// 1. Navegação lateral e cabeçalho com botões de ação (Salvar rascunho, Gerar com IA, Pré-visualizar, Enviar para aprovação).
// 2. Coluna esquerda: Biblioteca de Modelos (filtros, busca e 5 modelos) + Estrutura do Contrato (13 seções com reordenação/edição).
// 3. Editor central A4: Folha com proporção realista, capa geométrica moderna com edifícios corporativos, partes contratante/contratada, cláusulas e escopo com checkmarks, rodapé e controles (páginas, zoom, desktop/tablet/mobile, tela cheia).
// 4. Coluna direita: Dados do Cliente (com CRM), Configurações do Contrato, Serviços e Valores (com cálculo dinâmico), Assistente de IA e Checklist de Aprovação (0 a 6).
import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileEdit,
  FileSignature,
  FileSpreadsheet,
  FileText,
  GripVertical,
  HelpCircle,
  Layers,
  Layout,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  Lock,
  Mail,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  MoreVertical,
  Palette,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquarePen,
  Tablet,
  Trash2,
  User,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";

export interface CriadorContratosViewProps {
  onVoltarPainel?: () => void;
  onSalvarRascunho?: (dados: any) => void;
}

// ---------------------------------------------------------------------------
// Modelos de Contratos da Biblioteca Esquerda
// ---------------------------------------------------------------------------
export interface ModeloBiblioteca {
  id: string;
  titulo: string;
  descricao: string;
  categoria: "todos" | "comercial" | "prestacao" | "consultoria" | "parceria";
  iconeTag: string;
  badge: string;
  paginasPrevistas: number;
}

const MODELOS_CATALOGO: ModeloBiblioteca[] = [
  {
    id: "servicos_mensais",
    titulo: "Contratos de Serviços Mensais",
    descricao: "Ideal para contratos recorrentes de marketing, tráfego e gestão.",
    categoria: "prestacao",
    iconeTag: "Recorrência",
    badge: "Popular",
    paginasPrevistas: 12,
  },
  {
    id: "implantacao",
    titulo: "Contrato de Implantação",
    descricao: "Para projetos de implementação e setup de sistemas.",
    categoria: "prestacao",
    iconeTag: "Setup",
    badge: "Técnico",
    paginasPrevistas: 14,
  },
  {
    id: "consultoria",
    titulo: "Contrato de Consultoria",
    descricao: "Consultoria estratégica e acompanhamento.",
    categoria: "consultoria",
    iconeTag: "Estratégico",
    badge: "Executivo",
    paginasPrevistas: 10,
  },
  {
    id: "suporte",
    titulo: "Contrato de Suporte",
    descricao: "Suporte técnico e manutenção.",
    categoria: "prestacao",
    iconeTag: "SLA",
    badge: "Suporte",
    paginasPrevistas: 8,
  },
  {
    id: "parceria",
    titulo: "Contrato de Parceria",
    descricao: "Parcerias comerciais e sociedades.",
    categoria: "parceria",
    iconeTag: "Joint Venture",
    badge: "Comercial",
    paginasPrevistas: 16,
  },
];

// ---------------------------------------------------------------------------
// 13 Cláusulas da Estrutura do Contrato
// ---------------------------------------------------------------------------
export interface SecaoContrato {
  id: number;
  titulo: string;
  obrigatoria: boolean;
  conteudo?: string;
}

const SECOES_INICIAIS: SecaoContrato[] = [
  { id: 1, titulo: "Identificação das partes", obrigatoria: true },
  { id: 2, titulo: "Objeto do contrato", obrigatoria: true },
  { id: 3, titulo: "Escopo de serviços", obrigatoria: true },
  { id: 4, titulo: "Obrigações da contratante", obrigatoria: false },
  { id: 5, titulo: "Obrigações da contratada", obrigatoria: false },
  { id: 6, titulo: "Prazo e vigência", obrigatoria: true },
  { id: 7, titulo: "Valores e condições de pagamento", obrigatoria: true },
  { id: 8, titulo: "Reajuste", obrigatoria: false },
  { id: 9, titulo: "Rescisão", obrigatoria: true },
  { id: 10, titulo: "Confidencialidade", obrigatoria: false },
  { id: 11, titulo: "Propriedade intelectual", obrigatoria: false },
  { id: 12, titulo: "Disposições gerais", obrigatoria: false },
  { id: 13, titulo: "Assinaturas", obrigatoria: true },
];

// ---------------------------------------------------------------------------
// Tabela de Serviços e Valores
// ---------------------------------------------------------------------------
export interface ItemServicoContrato {
  id: string;
  servico: string;
  quantidade: number;
  valorUnitario: number;
}

export function CriadorContratosView({
  onVoltarPainel,
  onSalvarRascunho,
}: CriadorContratosViewProps) {
  // 1. Estado da Biblioteca de Modelos
  const [buscaModelo, setBuscaModelo] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos");
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string>("servicos_mensais");

  // 2. Estado da Estrutura de Cláusulas
  const [secoes, setSecoes] = useState<SecaoContrato[]>(SECOES_INICIAIS);
  const [secaoAtivaId, setSecaoAtivaId] = useState<number>(1);
  const [modalNovaSecaoAberto, setModalNovaSecaoAberto] = useState(false);
  const [novoTituloSecao, setNovoTituloSecao] = useState("");

  // 3. Controles do Documento A4
  const [paginaAtual, setPaginaAtual] = useState(1);
  const totalPaginas = 12;
  const [zoomNivel, setZoomNivel] = useState(100);
  const [modoDispositivo, setModoDispositivo] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [telaCheia, setTelaCheia] = useState(false);
  const [modalPreviewAberto, setModalPreviewAberto] = useState(false);

  // 4. Dados do Cliente
  const [cliente, setCliente] = useState({
    empresa: "Clinica Sorriso Mais",
    contato: "Dra. Juliana Silva",
    documento: "12.345.678/0001-90",
    email: "contato@clinicasorrisomais.com.br",
    telefone: "(41) 98765-4321",
    endereco: "Rua das Flores, 123",
    cidadeEstado: "Curitiba - PR, 80000-000",
  });

  // Dados da Contratada (Empresa Usuária)
  const contratada = {
    razaoSocial: "Flow Business",
    documento: "98.765.432/0001-10",
    responsavel: "Marcos Gonçalves",
    email: "contato@flowbusiness.com.br",
    telefone: "(41) 3123-4567",
    endereco: "Av. das Empresas, 456",
    cidadeEstado: "Curitiba - PR, 80000-000",
  };

  // 5. Configurações do Contrato
  const [configContrato, setConfigContrato] = useState({
    tipo: "Serviços mensais",
    modelo: "Contrato de Serviços Mensais",
    vigencia: "12 meses",
    dataInicio: "2026-10-01",
    dataTermino: "2027-10-01",
    moeda: "BRL",
  });

  // 6. Serviços e Valores
  const [servicos, setServicos] = useState<ItemServicoContrato[]>([
    {
      id: "srv-1",
      servico: "Gestão de tráfego pago",
      quantidade: 1,
      valorUnitario: 2500,
    },
    {
      id: "srv-2",
      servico: "Produção de conteúdo",
      quantidade: 1,
      valorUnitario: 1500,
    },
    {
      id: "srv-3",
      servico: "Consultoria estratégica",
      quantidade: 1,
      valorUnitario: 1000,
    },
  ]);
  const [modalNovoServicoAberto, setModalNovoServicoAberto] = useState(false);
  const [novoServicoNome, setNovoServicoNome] = useState("");
  const [novoServicoPreco, setNovoServicoPreco] = useState(1000);

  // Escopo de serviços no A4 (itens com checkmarks)
  const [itensEscopo, setItensEscopo] = useState<string[]>([
    "Gestão de tráfego pago (Google Ads e Meta Ads)",
    "Produção e gestão de conteúdo para redes sociais",
    "Otimização de presença digital e SEO local",
    "Relatórios mensais de desempenho",
    "Consultoria estratégica para crescimento",
  ]);

  // Texto do Objeto do Contrato
  const [objetoTexto, setObjetoTexto] = useState(
    "O presente contrato tem por objeto a prestação de serviços de marketing digital, gestão de tráfego, produção de conteúdo e consultoria estratégica, conforme descrito no escopo de serviços."
  );

  // 7. Assistente de IA
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [acaoIaSelecionada, setAcaoIaSelecionada] = useState<string | null>(null);

  // 8. Checklist de Aprovação (6 itens)
  const [checklist, setChecklist] = useState({
    dadosCliente: false,
    escopoDefinido: false,
    valoresConfigurados: false,
    prazoDefinido: false,
    revisaoClausulas: false,
    prontoEnvio: false,
  });

  // Modal de Selecionar do CRM
  const [modalCrmAberto, setModalCrmAberto] = useState(false);

  // Totais Calculados
  const valorTotalMensal = useMemo(() => {
    return servicos.reduce((acc, s) => acc + s.quantidade * s.valorUnitario, 0);
  }, [servicos]);

  const totalChecklist = useMemo(() => {
    return Object.values(checklist).filter(Boolean).length;
  }, [checklist]);

  // Modelos Filtrados
  const modelosFiltrados = useMemo(() => {
    return MODELOS_CATALOGO.filter((m) => {
      const matchBusca =
        m.titulo.toLowerCase().includes(buscaModelo.toLowerCase()) ||
        m.descricao.toLowerCase().includes(buscaModelo.toLowerCase());
      const matchCat =
        categoriaFiltro === "todos" ||
        (categoriaFiltro === "comercial" && m.categoria === "comercial") ||
        (categoriaFiltro === "prestacao" && m.categoria === "prestacao") ||
        (categoriaFiltro === "consultoria" && m.categoria === "consultoria") ||
        (categoriaFiltro === "parceria" && m.categoria === "parceria");
      return matchBusca && matchCat;
    });
  }, [buscaModelo, categoriaFiltro]);

  // Ações de Manipulação
  const handleSelecionarModelo = (m: ModeloBiblioteca) => {
    setModeloSelecionadoId(m.id);
    setConfigContrato((prev) => ({ ...prev, modelo: m.titulo }));
    toast.success(`Modelo "${m.titulo}" aplicado ao editor!`);
  };

  const handleSalvarRascunho = () => {
    const dados = {
      cliente,
      configContrato,
      servicos,
      valorTotalMensal,
      secoes,
      modeloSelecionadoId,
      objetoTexto,
      itensEscopo,
    };
    try {
      localStorage.setItem("flow_contrato_rascunho_local", JSON.stringify(dados));
    } catch (e) {
      // ignore
    }
    onSalvarRascunho?.(dados);
    toast.success("Rascunho salvo localmente com sucesso! (Edição protegida)", {
      description: "As cláusulas, dados e configurações foram preservados no seu navegador.",
    });
  };

  const handleEnviarAprovacao = () => {
    if (totalChecklist < 4) {
      toast.warning("Checklist incompleto", {
        description: `Complete mais etapas do Checklist de Aprovação antes de submeter (${totalChecklist}/6 concluídos).`,
      });
      return;
    }
    toast.success("Contrato enviado para fluxo de aprovação!", {
      description: `Notificação enviada para os revisores de "${cliente.empresa}".`,
    });
  };

  const handleAdicionarSecao = () => {
    if (!novoTituloSecao.trim()) return;
    const novoId = Math.max(...secoes.map((s) => s.id), 0) + 1;
    setSecoes([...secoes, { id: novoId, titulo: novoTituloSecao.trim(), obrigatoria: false }]);
    setNovoTituloSecao("");
    setModalNovaSecaoAberto(false);
    toast.success(`Seção "${novoTituloSecao}" adicionada à estrutura!`);
  };

  const handleAdicionarServico = () => {
    if (!novoServicoNome.trim()) return;
    const novoItem: ItemServicoContrato = {
      id: `srv-${Date.now()}`,
      servico: novoServicoNome.trim(),
      quantidade: 1,
      valorUnitario: novoServicoPreco,
    };
    setServicos([...servicos, novoItem]);
    setNovoServicoNome("");
    setModalNovoServicoAberto(false);
    toast.success(`Serviço "${novoItem.servico}" adicionado.`);
  };

  const handleRemoverServico = (id: string) => {
    setServicos(servicos.filter((s) => s.id !== id));
    toast.info("Serviço removido do contrato.");
  };

  const handleAbrirIa = (acao: string) => {
    setAcaoIaSelecionada(acao);
    setModalIaAberto(true);
  };

  // Pílulas de filtro de categorias
  const CATEGORIAS_PILLS = [
    { id: "todos", rotulo: "Todos" },
    { id: "comercial", rotulo: "Comercial" },
    { id: "prestacao", rotulo: "Prestação de Serviço" },
    { id: "consultoria", rotulo: "Consultoria" },
    { id: "parceria", rotulo: "Parceria" },
  ];

  return (
    <div className="space-y-4">
      {/* =========================================================================
          CABEÇALHO DA TELA 02 — CRIADOR PROFISSIONAL DE CONTRATOS
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#1b2232] pb-4">
        <div>
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
          >
            {onVoltarPainel && (
              <button
                type="button"
                onClick={onVoltarPainel}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors mr-1"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="size-3" />
                <span>Voltar</span>
              </button>
            )}
            <span>Gestão</span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span
              onClick={onVoltarPainel}
              className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
            >
              Contratos
            </span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span className="flex items-center gap-1 text-orange-400 font-semibold">
              <span className="size-1.5 rounded-full bg-orange-500" />
              Criador de Contrato
            </span>
          </nav>

          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <ScrollText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Criador Profissional de Contratos
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Elabore contratos completos, personalizados e seguros para sua empresa.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Botões Superiores do Cabeçalho */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Salvar rascunho */}
          <button
            type="button"
            onClick={handleSalvarRascunho}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs font-semibold text-neutral-200 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <Save className="size-3.5 text-neutral-400" />
            <span>Salvar rascunho</span>
          </button>

          {/* 2. Gerar com IA (Roxo vibrante) */}
          <button
            type="button"
            onClick={() => handleAbrirIa("Geração Completa de Contrato")}
            className="flex h-9 items-center gap-2 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 px-3.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Sparkles className="size-3.5 text-purple-200" />
            <span>Gerar com IA</span>
          </button>

          {/* 3. Pré-visualizar */}
          <button
            type="button"
            onClick={() => setModalPreviewAberto(true)}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs font-semibold text-neutral-200 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <Eye className="size-3.5 text-neutral-400" />
            <span>Pré-visualizar</span>
          </button>

          {/* 4. Enviar para aprovação (Laranja Vibrante) */}
          <button
            type="button"
            onClick={handleEnviarAprovacao}
            className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Enviar para aprovação</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          ESTRUTURA EM 3 ÁREAS:
          - ESQUERDA: Modelos de Contratos & Estrutura do Contrato
          - CENTRO: Editor Visual Documento A4 com Controles Superiores
          - DIREITA: Dados do Cliente, Configurações, Serviços/Valores, IA e Checklist
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =======================================================================
            COLUNA DA ESQUERDA (3 colunas lg:col-span-3 xl:col-span-3)
           ======================================================================= */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-4">
          {/* -------------------------------------------------------------------
              Card 1: Modelos de Contratos
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Modelos de Contratos
              </h2>
              <button
                type="button"
                onClick={() => {
                  setCategoriaFiltro("todos");
                  setBuscaModelo("");
                }}
                className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Ver todos
              </button>
            </div>

            {/* Campo de Busca de Modelos */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar modelos..."
                value={buscaModelo}
                onChange={(e) => setBuscaModelo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
            </div>

            {/* Pílulas de Categoria com Scroll Horizontal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIAS_PILLS.map((cat) => {
                const ativa = categoriaFiltro === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaFiltro(cat.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap transition-all",
                      ativa
                        ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                        : "bg-[#121620] text-neutral-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {cat.rotulo}
                  </button>
                );
              })}
            </div>

            {/* Lista dos 5 Modelos de Contrato */}
            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
              {modelosFiltrados.map((modelo) => {
                const selecionado = modeloSelecionadoId === modelo.id;
                return (
                  <div
                    key={modelo.id}
                    onClick={() => handleSelecionarModelo(modelo)}
                    className={cn(
                      "group relative flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all",
                      selecionado
                        ? "border-orange-500/60 bg-gradient-to-r from-orange-500/15 via-[#121620] to-[#121620] shadow-sm shadow-orange-500/10"
                        : "border-white/5 bg-[#121620]/70 hover:border-white/15 hover:bg-[#121620]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Miniatura Gráfica da Folha de Contrato */}
                      <div
                        className={cn(
                          "relative size-10 shrink-0 rounded-lg border flex flex-col justify-between p-1 shadow-sm overflow-hidden",
                          selecionado
                            ? "bg-white text-slate-900 border-orange-400"
                            : "bg-white/95 text-slate-800 border-white/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="size-2 rounded-full bg-orange-500" />
                          <span className="text-[6px] font-black tracking-tighter text-neutral-600">
                            DOC
                          </span>
                        </div>
                        <div className="space-y-0.5 my-auto">
                          <div className="h-0.5 w-full bg-slate-400 rounded-full" />
                          <div className="h-0.5 w-3/4 bg-slate-300 rounded-full" />
                          <div className="h-0.5 w-5/6 bg-orange-400 rounded-full" />
                        </div>
                        <div className="text-[5px] font-mono text-slate-500 text-right">
                          {modelo.paginasPrevistas}p
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-xs font-bold truncate leading-tight",
                            selecionado ? "text-white" : "text-neutral-200 group-hover:text-white"
                          )}
                        >
                          {modelo.titulo}
                        </p>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                          {modelo.descricao}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0 transition-transform ml-1",
                        selecionado
                          ? "text-orange-400 translate-x-0.5"
                          : "text-neutral-500 group-hover:text-neutral-300"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Card 2: Estrutura do Contrato (13 Seções)
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Estrutura do Contrato
              </h2>
              <button
                type="button"
                onClick={() => setModalNovaSecaoAberto(true)}
                className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-400 hover:bg-orange-500/20 transition-all"
              >
                <Plus className="size-3" />
                <span>Adicionar seção</span>
              </button>
            </div>

            {/* Lista das 13 Seções */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
              {secoes.map((secao) => {
                const ativa = secaoAtivaId === secao.id;
                return (
                  <div
                    key={secao.id}
                    onClick={() => setSecaoAtivaId(secao.id)}
                    className={cn(
                      "group flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer",
                      ativa
                        ? "border-orange-500/50 bg-[#121620] text-white font-semibold"
                        : "border-transparent bg-[#121620]/50 text-neutral-400 hover:bg-[#121620] hover:text-neutral-200"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Badge Numerado */}
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold",
                          ativa
                            ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                            : "border border-white/5 bg-white/5 text-neutral-400"
                        )}
                      >
                        {secao.id}
                      </span>
                      <span className="truncate text-[11px]">{secao.titulo}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info(`Configurações da seção: ${secao.titulo}`);
                        }}
                        className="p-1 rounded text-neutral-500 hover:text-neutral-300"
                        title="Opções da cláusula"
                      >
                        <MoreVertical className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA CENTRAL (EDITOR DOCUMENTO A4) - 5 colunas no lg / 5 no xl
           ======================================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-3 flex flex-col items-center">
          {/* -------------------------------------------------------------------
              Barra de Controles Superiores do Documento
             ------------------------------------------------------------------- */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1b2232] bg-[#0c1017] px-3.5 py-2 shadow-md">
            {/* Paginação < 1 / 12 > */}
            <div className="flex items-center gap-1.5 bg-[#121620] border border-white/5 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual <= 1}
                className="text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 p-0.5"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-white px-1">
                {paginaAtual} / {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual >= totalPaginas}
                className="text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 p-0.5"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Controle de Zoom - 100% + */}
            <div className="flex items-center gap-1.5 bg-[#121620] border border-white/5 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setZoomNivel((z) => Math.max(70, z - 10))}
                className="text-neutral-400 hover:text-white p-0.5"
                title="Diminuir Zoom"
              >
                <Minus className="size-3" />
              </button>
              <span className="text-[11px] font-mono text-neutral-300 font-semibold px-1">
                {zoomNivel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomNivel((z) => Math.min(130, z + 10))}
                className="text-neutral-400 hover:text-white p-0.5"
                title="Aumentar Zoom"
              >
                <Plus className="size-3" />
              </button>
            </div>

            {/* Botão Ajustar */}
            <button
              type="button"
              onClick={() => setZoomNivel(100)}
              className="rounded-xl border border-white/5 bg-[#121620] px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-white/10"
            >
              Ajustar
            </button>

            {/* Modos de Dispositivo: Desktop (ativo laranja), Tablet, Mobile */}
            <div className="flex items-center gap-1 bg-[#121620] border border-white/5 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setModoDispositivo("desktop")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  modoDispositivo === "desktop"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Visualização Desktop"
              >
                <Monitor className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setModoDispositivo("tablet")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  modoDispositivo === "tablet"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Visualização Tablet"
              >
                <Tablet className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setModoDispositivo("mobile")}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  modoDispositivo === "mobile"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Visualização Mobile"
              >
                <Smartphone className="size-3.5" />
              </button>
            </div>

            {/* Maximizar / Tela cheia */}
            <button
              type="button"
              onClick={() => setTelaCheia(!telaCheia)}
              className="rounded-xl border border-white/5 bg-[#121620] p-1.5 text-neutral-400 hover:text-white"
              title="Expandir editor"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>

          {/* -------------------------------------------------------------------
              FOLHA DE CONTRATO A4 (Fundo Branco, Visual Fiel à Referência)
             ------------------------------------------------------------------- */}
          <div
            className={cn(
              "w-full transition-all duration-200 overflow-hidden flex justify-center py-2",
              modoDispositivo === "mobile"
                ? "max-w-[380px]"
                : modoDispositivo === "tablet"
                ? "max-w-[520px]"
                : "max-w-[620px]"
            )}
            style={{
              transform: `scale(${zoomNivel / 100})`,
              transformOrigin: "top center",
            }}
          >
            <div className="relative w-full rounded-lg bg-white text-slate-900 shadow-2xl border border-slate-300 p-7 sm:p-8 space-y-5 font-sans select-text">
              {/* Topo / Capa do Contrato com Recorte Angular Moderno */}
              <div className="relative flex items-start justify-between min-h-[140px] overflow-hidden -mx-7 -mt-7 sm:-mx-8 sm:-mt-8 p-7 sm:p-8 bg-gradient-to-r from-white via-white to-slate-50 border-b border-slate-200">
                {/* Logo da Flow Business à Esquerda */}
                <div className="space-y-4 max-w-[55%] z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#f95d14] text-white font-black text-sm shadow-md">
                      F
                    </span>
                    <span className="text-base font-extrabold tracking-tight text-slate-950 font-sans">
                      Flow Business
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 leading-tight">
                      CONTRATO DE PRESTAÇÃO DE SERVIÇOS
                    </h2>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Soluções estratégicas para o crescimento do seu negócio.
                    </p>
                  </div>
                </div>

                {/* Banner Fotográfico Angular / Geométrico com Skylines e Faixas Laranjas */}
                <div className="absolute right-0 top-0 bottom-0 w-[45%] overflow-hidden pointer-events-none">
                  {/* Foto de prédios envidraçados / skyline corporativo */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80')`,
                      clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)",
                    }}
                  />
                  {/* Faixa decorativa em laranja neon angular */}
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#f95d14]/70 to-[#ea580c]/90 mix-blend-multiply"
                    style={{
                      clipPath: "polygon(20% 0%, 35% 0%, 10% 100%, 0% 100%)",
                    }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 bg-[#f95d14]"
                  />
                </div>
              </div>

              {/* Seção das Partes (CONTRATANTE e CONTRATADA) em 2 Colunas */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 text-[11px] leading-relaxed">
                {/* Coluna Contratante */}
                <div className="space-y-1 pr-2">
                  <p className="font-extrabold uppercase tracking-wide text-slate-950 text-xs border-b border-slate-200 pb-0.5">
                    CONTRATANTE
                  </p>
                  <p className="font-bold text-slate-900 text-xs">{cliente.empresa}</p>
                  <p className="text-slate-600 font-medium">CNPJ {cliente.documento}</p>
                  <p className="text-slate-700">Responsável: {cliente.contato}</p>
                  <p className="text-slate-600">E-mail: {cliente.email}</p>
                  <p className="text-slate-600">Telefone: {cliente.telefone}</p>
                  <p className="text-slate-600">
                    Endereço: {cliente.endereco}
                    <br />
                    {cliente.cidadeEstado}
                  </p>
                </div>

                {/* Coluna Contratada */}
                <div className="space-y-1 pl-2 border-l border-slate-200">
                  <p className="font-extrabold uppercase tracking-wide text-slate-950 text-xs border-b border-slate-200 pb-0.5">
                    CONTRATADA
                  </p>
                  <p className="font-bold text-slate-900 text-xs">{contratada.razaoSocial}</p>
                  <p className="text-slate-600 font-medium">CNPJ {contratada.documento}</p>
                  <p className="text-slate-700">Responsável: {contratada.responsavel}</p>
                  <p className="text-slate-600">E-mail: {contratada.email}</p>
                  <p className="text-slate-600">Telefone: {contratada.telefone}</p>
                  <p className="text-slate-600">
                    Endereço: {contratada.endereco}
                    <br />
                    {contratada.cidadeEstado}
                  </p>
                </div>
              </div>

              {/* Cláusula 1: OBJETO DO CONTRATO */}
              <div className="space-y-1.5 text-xs text-slate-800">
                <h3 className="font-black text-slate-950 uppercase tracking-tight flex items-center gap-1.5">
                  <span className="text-[#ea580c]">1.</span> OBJETO DO CONTRATO
                </h3>
                <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                  {objetoTexto}
                </p>
              </div>

              {/* Cláusula 2: ESCOPO DE SERVIÇOS */}
              <div className="space-y-2 text-xs text-slate-800">
                <h3 className="font-black text-slate-950 uppercase tracking-tight flex items-center gap-1.5">
                  <span className="text-[#ea580c]">2.</span> ESCOPO DE SERVIÇOS
                </h3>
                <p className="text-[11px] text-slate-700">
                  A CONTRATADA se compromete a prestar os seguintes serviços:
                </p>

                {/* Box de Serviços com Checkmarks em Laranja */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
                  {itensEscopo.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-[11px] text-slate-800">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#f95d14] text-white shadow-xs">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé da Página A4 */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 flex items-center gap-1">
                    <span className="text-[#f95d14]">F</span> Flow Business
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Soluções para o crescimento do seu negócio.</span>
                </div>
                <div className="font-mono font-medium text-slate-600">
                  Página {paginaAtual} de {totalPaginas}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA DA DIREITA (4 colunas lg:col-span-4 xl:col-span-4)
           ======================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4">
          {/* -------------------------------------------------------------------
              Card 1: Dados do Cliente
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Dados do Cliente
              </h2>
              <button
                type="button"
                onClick={() => setModalCrmAberto(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                <Search className="size-3" />
                <span>Selecionar do CRM</span>
              </button>
            </div>

            {/* Inputs em Grid 2 Colunas */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400">Empresa</label>
                <input
                  type="text"
                  value={cliente.empresa}
                  onChange={(e) => setCliente({ ...cliente, empresa: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400">Nome do contato</label>
                <input
                  type="text"
                  value={cliente.contato}
                  onChange={(e) => setCliente({ ...cliente, contato: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400">CNPJ / CPF</label>
                <input
                  type="text"
                  value={cliente.documento}
                  onChange={(e) => setCliente({ ...cliente, documento: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400">E-mail</label>
                <input
                  type="email"
                  value={cliente.email}
                  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400">Telefone</label>
                <input
                  type="text"
                  value={cliente.telefone}
                  onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-neutral-400">Endereço</label>
                <input
                  type="text"
                  value={cliente.endereco}
                  onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Card 2: Configurações do Contrato
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3 shadow-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Configurações do Contrato
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-neutral-400">
                    Tipo de contrato
                  </label>
                  <select
                    value={configContrato.tipo}
                    onChange={(e) =>
                      setConfigContrato({ ...configContrato, tipo: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                  >
                    <option value="Serviços mensais">Serviços mensais</option>
                    <option value="Projeto fechado">Projeto fechado</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Parceria comercial">Parceria comercial</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-neutral-400">Modelo</label>
                  <select
                    value={configContrato.modelo}
                    onChange={(e) =>
                      setConfigContrato({ ...configContrato, modelo: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                  >
                    <option value="Contrato de Serviços Mensais">
                      Contrato de Serviços Mensais
                    </option>
                    <option value="Contrato de Implantação">Contrato de Implantação</option>
                    <option value="Contrato de Consultoria">Contrato de Consultoria</option>
                    <option value="Contrato de Suporte">Contrato de Suporte</option>
                    <option value="Contrato de Parceria">Contrato de Parceria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-neutral-400">Vigência</label>
                  <select
                    value={configContrato.vigencia}
                    onChange={(e) =>
                      setConfigContrato({ ...configContrato, vigencia: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#121620] px-2 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                  >
                    <option value="12 meses">12 meses</option>
                    <option value="6 meses">6 meses</option>
                    <option value="24 meses">24 meses</option>
                    <option value="Indeterminado">Indeterminado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-neutral-400">
                    Data de início
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={configContrato.dataInicio}
                      onChange={(e) =>
                        setConfigContrato({ ...configContrato, dataInicio: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#121620] px-2 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-neutral-400">
                    Data de término
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={configContrato.dataTermino}
                      onChange={(e) =>
                        setConfigContrato({ ...configContrato, dataTermino: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#121620] px-2 py-1.5 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Card 3: Serviços e Valores
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Serviços e Valores
              </h2>
              <button
                type="button"
                onClick={() => setModalNovoServicoAberto(true)}
                className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-400 hover:bg-orange-500/20 transition-all"
              >
                <Plus className="size-3" />
                <span>Adicionar serviço</span>
              </button>
            </div>

            {/* Tabela de Serviços */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-neutral-400">
                    <th className="pb-1.5 font-semibold">Serviço</th>
                    <th className="pb-1.5 font-semibold text-center">Quantidade</th>
                    <th className="pb-1.5 font-semibold text-right">Valor unitário</th>
                    <th className="pb-1.5 font-semibold text-right">Total</th>
                    <th className="pb-1.5 w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {servicos.map((srv) => (
                    <tr key={srv.id} className="group hover:bg-white/5">
                      <td className="py-2 text-[11px] font-medium text-white max-w-[140px] truncate">
                        {srv.servico}
                      </td>
                      <td className="py-2 text-[11px] text-center text-neutral-300">
                        {srv.quantidade}
                      </td>
                      <td className="py-2 text-[11px] text-right text-neutral-300 font-mono">
                        {formatBRL(srv.valorUnitario)}
                      </td>
                      <td className="py-2 text-[11px] text-right font-bold text-white font-mono">
                        {formatBRL(srv.quantidade * srv.valorUnitario)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoverServico(srv.id)}
                          className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                          title="Remover serviço"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totalizador Laranja em Destaque */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">Valor total mensal</span>
              <span className="text-xl font-extrabold text-[#f95d14] font-mono tracking-tight">
                {formatBRL(valorTotalMensal)}
              </span>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Card 4: Assistente de IA (Roxo Vibrante)
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-[#180f28] to-[#0c1017] p-3.5 space-y-3 shadow-md shadow-purple-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Sparkles className="size-3.5" />
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Assistente de IA
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleAbrirIa("Painel Completo")}
                className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Ver todos
              </button>
            </div>

            {/* Grid 2x2 com Botões de Ação da IA */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Melhorar cláusulas */}
              <button
                type="button"
                onClick={() => handleAbrirIa("Melhorar cláusulas")}
                className="flex items-start gap-2 p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all group"
              >
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                  <Wand2 className="size-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white group-hover:text-purple-200">
                    Melhorar cláusulas
                  </p>
                  <p className="text-[9px] text-purple-300/70 leading-snug">
                    Tornar mais claras e seguras
                  </p>
                </div>
              </button>

              {/* 2. Gerar cláusulas */}
              <button
                type="button"
                onClick={() => handleAbrirIa("Gerar cláusulas")}
                className="flex items-start gap-2 p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all group"
              >
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                  <Plus className="size-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white group-hover:text-purple-200">
                    Gerar cláusulas
                  </p>
                  <p className="text-[9px] text-purple-300/70 leading-snug">
                    Personalizadas por segmento
                  </p>
                </div>
              </button>

              {/* 3. Revisar contrato */}
              <button
                type="button"
                onClick={() => handleAbrirIa("Revisar contrato")}
                className="flex items-start gap-2 p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all group"
              >
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white group-hover:text-purple-200">
                    Revisar contrato
                  </p>
                  <p className="text-[9px] text-purple-300/70 leading-snug">
                    Verificar possíveis riscos
                  </p>
                </div>
              </button>

              {/* 4. Resumir contrato */}
              <button
                type="button"
                onClick={() => handleAbrirIa("Resumir contrato")}
                className="flex items-start gap-2 p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-all group"
              >
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                  <FileText className="size-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white group-hover:text-purple-200">
                    Resumir contrato
                  </p>
                  <p className="text-[9px] text-purple-300/70 leading-snug">
                    Gerar versão simplificada
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* -------------------------------------------------------------------
              Card 5: Checklist de Aprovação
             ------------------------------------------------------------------- */}
          <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Checklist de Aprovação
                </h2>
              </div>
              <span className="font-mono text-xs font-bold text-neutral-400">
                {totalChecklist} de 6
              </span>
            </div>

            {/* Grid 2 Colunas com Checkboxes Interativos */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.dadosCliente}
                  onChange={(e) =>
                    setChecklist({ ...checklist, dadosCliente: e.target.checked })
                  }
                  className="size-3.5 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0"
                />
                <span>Dados do cliente preenchidos</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.prazoDefinido}
                  onChange={(e) =>
                    setChecklist({ ...checklist, prazoDefinido: e.target.checked })
                  }
                  className="size-3.5 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0"
                />
                <span>Prazo e vigência definidos</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.escopoDefinido}
                  onChange={(e) =>
                    setChecklist({ ...checklist, escopoDefinido: e.target.checked })
                  }
                  className="size-3.5 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0"
                />
                <span>Escopo de serviços definido</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.revisaoClausulas}
                  onChange={(e) =>
                    setChecklist({ ...checklist, revisaoClausulas: e.target.checked })
                  }
                  className="size-3.5 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0"
                />
                <span>Revisão das cláusulas</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.valoresConfigurados}
                  onChange={(e) =>
                    setChecklist({ ...checklist, valoresConfigurados: e.target.checked })
                  }
                  className="size-3.5 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0"
                />
                <span>Valores e condições configurados</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.prontoEnvio}
                  onChange={(e) =>
                    setChecklist({ ...checklist, prontoEnvio: e.target.checked })
                  }
                  className="size-3.5 rounded border-white/20 bg-[#121620] text-orange-500 focus:ring-0"
                />
                <span>Documento pronto para envio</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: PRÉ-VISUALIZAÇÃO COMPLETA DO CONTRATO A4
         ========================================================================= */}
      {modalPreviewAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalPreviewAberto(false)}>
          <DialogContent className="sm:max-w-4xl bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl max-h-[92vh] flex flex-col">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="size-5 text-orange-500" />
                <DialogTitle className="text-base font-bold text-white">
                  Pré-visualização do Contrato A4
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 flex justify-center">
              {/* Documento A4 Limpo para Impressão */}
              <div className="w-full max-w-[700px] bg-white text-slate-900 rounded-lg shadow-2xl p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#f95d14] text-white font-black text-sm">
                      F
                    </span>
                    <span className="text-base font-extrabold tracking-tight text-slate-950">
                      Flow Business
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    CONTRATO N° CT-2026-042
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <h1 className="text-xl font-black uppercase text-slate-950">
                    CONTRATO DE PRESTAÇÃO DE SERVIÇOS
                  </h1>
                  <p className="text-xs text-slate-600">
                    Instrumento particular de prestação de serviços e consultoria
                  </p>
                </div>

                {/* Partes */}
                <div className="grid grid-cols-2 gap-4 border y border-slate-200 py-3 text-xs leading-relaxed">
                  <div>
                    <p className="font-bold text-slate-950 uppercase">CONTRATANTE</p>
                    <p className="font-semibold text-slate-900">{cliente.empresa}</p>
                    <p className="text-slate-600">CNPJ {cliente.documento}</p>
                    <p className="text-slate-600">Resp: {cliente.contato}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-950 uppercase">CONTRATADA</p>
                    <p className="font-semibold text-slate-900">{contratada.razaoSocial}</p>
                    <p className="text-slate-600">CNPJ {contratada.documento}</p>
                    <p className="text-slate-600">Resp: {contratada.responsavel}</p>
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-600 font-medium">Vigência:</span>{" "}
                    <span className="font-bold text-slate-900">{configContrato.vigencia}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Valor Mensal:</span>{" "}
                    <span className="font-bold text-[#f95d14] font-mono text-sm">
                      {formatBRL(valorTotalMensal)}
                    </span>
                  </div>
                </div>

                {/* Cláusulas */}
                <div className="space-y-3 text-xs text-slate-800">
                  <p className="font-bold text-slate-950">1. OBJETO DO CONTRATO</p>
                  <p className="text-slate-700 leading-relaxed text-justify">{objetoTexto}</p>

                  <p className="font-bold text-slate-950 pt-2">2. ESCOPO DE SERVIÇOS</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {itensEscopo.map((it, idx) => (
                      <li key={idx}>{it}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-3 flex justify-between sm:justify-between">
              <button
                type="button"
                onClick={() => toast.info("Download do PDF em alta resolução preparado.")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <Download className="size-4" />
                <span>Baixar PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setModalPreviewAberto(false)}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-600/20"
              >
                Fechar Prévia
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL: ASSISTENTE DE IA DEMONSTRATIVO
         ========================================================================= */}
      {modalIaAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalIaAberto(false)}>
          <DialogContent className="sm:max-w-lg bg-[#0c1017] border border-purple-500/30 text-white p-6 rounded-2xl">
            <DialogHeader className="border-b border-purple-500/20 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                <Sparkles className="size-5 text-purple-400" />
                Assistente de IA Jurídico — Flow Business
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200">
                <p className="font-bold">Ação Selecionada: {acaoIaSelecionada}</p>
                <p className="text-[11px] text-purple-300/80 mt-1">
                  O assistente analisa as cláusulas do contrato atual e oferece recomendações
                  baseadas em boas práticas contratuais do mercado B2B.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Instruções para o Assistente
                </label>
                <textarea
                  rows={3}
                  defaultValue="Ajustar a cláusula de rescisão para incluir aviso prévio de 30 dias e multa proporcional."
                  className="w-full rounded-xl border border-white/10 bg-[#121620] p-2.5 text-xs text-white focus:border-purple-500/50 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-[#121620] p-3 text-[11px] text-neutral-400 space-y-1">
                <p className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Garantia de Revisão Humana
                </p>
                <p>
                  As sugestões geradas por IA devem ser sempre revisadas pelo responsável legal da
                  sua empresa antes do envio final.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end border-t border-purple-500/20 pt-3">
              <button
                type="button"
                onClick={() => setModalIaAberto(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalIaAberto(false);
                  toast.success("Sugestão de cláusula aplicada ao rascunho com sucesso!");
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/25"
              >
                <Wand2 className="size-3.5" />
                <span>Aplicar Sugestão</span>
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL: SELECIONAR DO CRM
         ========================================================================= */}
      {modalCrmAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalCrmAberto(false)}>
          <DialogContent className="sm:max-w-md bg-[#0c1017] border border-[#1b2232] text-white p-5 rounded-2xl">
            <DialogHeader className="border-b border-white/10 pb-2">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Search className="size-4 text-orange-400" />
                Importar Cliente do CRM
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 py-2 max-h-[300px] overflow-y-auto">
              {[
                {
                  empresa: "Clinica Sorriso Mais",
                  contato: "Dra. Juliana Silva",
                  documento: "12.345.678/0001-90",
                  email: "contato@clinicasorrisomais.com.br",
                  telefone: "(41) 98765-4321",
                  endereco: "Rua das Flores, 123",
                  cidadeEstado: "Curitiba - PR, 80000-000",
                },
                {
                  empresa: "Escritório Advocacia Silva",
                  contato: "Dr. Carlos Silva",
                  documento: "23.456.789/0001-01",
                  email: "carlos@silvaadvocacia.com.br",
                  telefone: "(11) 99123-4567",
                  endereco: "Av. Paulista, 1000",
                  cidadeEstado: "São Paulo - SP, 01310-100",
                },
                {
                  empresa: "TechStart Automações",
                  contato: "Mariana Souza",
                  documento: "34.567.890/0001-12",
                  email: "mariana@techstart.io",
                  telefone: "(31) 98877-6655",
                  endereco: "Rua da Tecnologia, 500",
                  cidadeEstado: "Belo Horizonte - MG, 30110-000",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setCliente(c);
                    setModalCrmAberto(false);
                    toast.success(`Dados de "${c.empresa}" importados do CRM!`);
                  }}
                  className="p-3 rounded-xl border border-white/5 bg-[#121620] hover:border-orange-500/40 hover:bg-orange-500/10 cursor-pointer transition-all"
                >
                  <p className="text-xs font-bold text-white">{c.empresa}</p>
                  <p className="text-[11px] text-neutral-400">
                    {c.contato} • {c.documento}
                  </p>
                  <p className="text-[10px] text-neutral-500">{c.email}</p>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setModalCrmAberto(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL: ADICIONAR SEÇÃO NA ESTRUTURA
         ========================================================================= */}
      {modalNovaSecaoAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalNovaSecaoAberto(false)}>
          <DialogContent className="sm:max-w-sm bg-[#0c1017] border border-[#1b2232] text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-white">
                Adicionar Seção ao Contrato
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Título da Seção / Cláusula
                </label>
                <input
                  type="text"
                  placeholder="Ex: Política de LGPD e Privacidade"
                  value={novoTituloSecao}
                  onChange={(e) => setNovoTituloSecao(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setModalNovaSecaoAberto(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarSecao}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-600/20"
              >
                Adicionar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* =========================================================================
          MODAL: ADICIONAR SERVIÇO
         ========================================================================= */}
      {modalNovoServicoAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalNovoServicoAberto(false)}>
          <DialogContent className="sm:max-w-sm bg-[#0c1017] border border-[#1b2232] text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-white">
                Adicionar Serviço ao Contrato
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Nome do Serviço</label>
                <input
                  type="text"
                  placeholder="Ex: Manutenção Mensal e SLA"
                  value={novoServicoNome}
                  onChange={(e) => setNovoServicoNome(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Valor Unitário (R$)
                </label>
                <input
                  type="number"
                  value={novoServicoPreco}
                  onChange={(e) => setNovoServicoPreco(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setModalNovoServicoAberto(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarServico}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-600/20"
              >
                Salvar Serviço
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
