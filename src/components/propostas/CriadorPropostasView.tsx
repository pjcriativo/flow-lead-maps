// Tela 02 — Criador Profissional de Propostas (Gestão → Propostas → Criador)
// Editor visual de propostas comerciais no padrão A4 com biblioteca de modelos, estrutura de seções, dados do cliente, precificação e assistente de IA.
import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileText,
  Globe,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Lock,
  Mail,
  Megaphone,
  Monitor,
  MoreVertical,
  Palette,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Tag,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";

interface CriadorPropostasViewProps {
  onVoltarPainel?: () => void;
  onEnviarAprovacao?: () => void;
}

interface ModeloProposta {
  id: string;
  titulo: string;
  subtitulo: string;
  categoria: "comercial" | "marketing" | "consultoria";
  iconeNome: "Briefcase" | "Monitor" | "ShieldCheck" | "BarChart" | "Zap";
  corIcone: string;
  bgIcone: string;
}

const MODELOS_CATALOGO: ModeloProposta[] = [
  {
    id: "mensal",
    titulo: "Serviços Mensais",
    subtitulo: "Ideal para serviços recorrentes",
    categoria: "comercial",
    iconeNome: "Briefcase",
    corIcone: "text-orange-400",
    bgIcone: "bg-orange-500/15 border border-orange-500/30",
  },
  {
    id: "landing_trafego",
    titulo: "Landing Page + Tráfego",
    subtitulo: "Foco em sites e campanhas",
    categoria: "marketing",
    iconeNome: "Monitor",
    corIcone: "text-purple-400",
    bgIcone: "bg-purple-500/15 border border-purple-500/30",
  },
  {
    id: "consultoria",
    titulo: "Consultoria Comercial",
    subtitulo: "Diagnóstico e plano de ação",
    categoria: "consultoria",
    iconeNome: "ShieldCheck",
    corIcone: "text-emerald-400",
    bgIcone: "bg-emerald-500/15 border border-emerald-500/30",
  },
  {
    id: "seo",
    titulo: "Plano SEO",
    subtitulo: "Otimização para buscadores",
    categoria: "marketing",
    iconeNome: "BarChart",
    corIcone: "text-blue-400",
    bgIcone: "bg-blue-500/15 border border-blue-500/30",
  },
  {
    id: "express",
    titulo: "Proposta Express",
    subtitulo: "Modelo rápido e objetivo",
    categoria: "comercial",
    iconeNome: "Zap",
    corIcone: "text-amber-400",
    bgIcone: "bg-amber-500/15 border border-amber-500/30",
  },
];

interface SecaoEstrutura {
  id: string;
  numero: number;
  titulo: string;
  icone: string;
}

const SECOES_INICIAIS: SecaoEstrutura[] = [
  { id: "capa", numero: 1, titulo: "1. Capa", icone: "ImageIcon" },
  { id: "diagnostico", numero: 2, titulo: "2. Diagnóstico", icone: "Search" },
  { id: "solucao", numero: 3, titulo: "3. Solução proposta", icone: "Lightbulb" },
  { id: "escopo", numero: 4, titulo: "4. Escopo de serviços", icone: "Layers" },
  { id: "cronograma", numero: 5, titulo: "5. Cronograma", icone: "Calendar" },
  { id: "investimento", numero: 6, titulo: "6. Investimento", icone: "DollarSign" },
  { id: "bonus", numero: 7, titulo: "7. Bônus e diferenciais", icone: "Star" },
  { id: "garantia", numero: 8, titulo: "8. Garantia", icone: "ShieldCheck" },
  { id: "passos", numero: 9, titulo: "9. Próximos passos", icone: "ArrowRight" },
];

export function CriadorPropostasView({
  onVoltarPainel,
  onEnviarAprovacao,
}: CriadorPropostasViewProps) {
  // Estado do Modelo Selecionado
  const [modeloAtivo, setModeloAtivo] = useState<string>("mensal");
  const [filtroCategoriaModelo, setFiltroCategoriaModelo] = useState<
    "todos" | "comercial" | "marketing" | "consultoria"
  >("todos");
  const [buscaModelo, setBuscaModelo] = useState("");

  // Estado das Seções da Proposta
  const [secoes, setSecoes] = useState<SecaoEstrutura[]>(SECOES_INICIAIS);
  const [secaoAtivaId, setSecaoAtivaId] = useState<string>("capa");

  // Controles de Visualização Central
  const [paginaAtual, setPaginaAtual] = useState(1);
  const totalPaginas = 9;
  const [zoomPercent, setZoomPercent] = useState(100);
  const [dispositivoVisualizacao, setDispositivoVisualizacao] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // Dados do Cliente (Direita)
  const [dadosCliente, setDadosCliente] = useState({
    nomeEmpresa: "Escritório Parelheiros",
    segmento: "Jurídico",
    cnpj: "12.345.678/0001-90",
    contato: "Natália Silva",
    email: "natalia@escritorioparelheiros.com.br",
    telefone: "(11) 98765-4321",
  });
  const [modalEditarCliente, setModalEditarCliente] = useState(false);

  // Identidade Visual
  const [imagemCapaUrl, setImagemCapaUrl] = useState(
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80"
  );
  const [corPrimaria, setCorPrimaria] = useState("#f97316");

  // Precificação
  const [valoresComerciais, setValoresComerciais] = useState({
    valorTotal: "R$ 4.980,00",
    recorrencia: "2 mensalidades",
    desconto: "Nenhum",
    validade: "30 dias",
  });
  const [modalEditarPreco, setModalEditarPreco] = useState(false);

  // Conteúdo Editável da Proposta Central
  const [conteudoCapa, setConteudoCapa] = useState({
    tagTopo: "TRANSFORMANDO NEGÓCIOS EM RESULTADOS",
    tituloParte1: "Solução completa para o ",
    tituloDestaque: "crescimento do seu negócio",
    subtitulo:
      "Estratégia, tecnologia e marketing digital para gerar mais clientes, aumentar suas vendas e posicionar sua marca no mercado.",
    codigoProposta: "Proposta Comercial N° 2026-0717-001",
    dataProposta: "23 de julho de 2026",
    validadeDias: "30 dias",
    responsavelNome: "Marcos Gonçalves",
  });

  // Checklist de Aprovação (5 itens)
  const [checklist, setChecklist] = useState({
    dadosCliente: true,
    escopoRevisado: true,
    precificacao: true,
    condicoes: true,
    validadeTermos: false,
  });

  const checklistCount = Object.values(checklist).filter(Boolean).length;

  // Filtragem de Modelos
  const modelosFiltrados = MODELOS_CATALOGO.filter((m) => {
    const matchCat =
      filtroCategoriaModelo === "todos" ? true : m.categoria === filtroCategoriaModelo;
    const matchBusca =
      m.titulo.toLowerCase().includes(buscaModelo.toLowerCase()) ||
      m.subtitulo.toLowerCase().includes(buscaModelo.toLowerCase());
    return matchCat && matchBusca;
  });

  // Ações
  const handleSalvarRascunho = () => {
    toast.success("Rascunho da proposta salvo com sucesso!");
  };

  const handleGerarComIa = () => {
    toast.info("O assistente de IA refinou as seções de escopo e copy para o modelo selecionado!");
  };

  const handlePreVisualizar = () => {
    window.print();
  };

  const handleEnviarAprovacao = () => {
    if (checklistCount < 4) {
      toast.warning("Complete o checklist de aprovação antes de enviar.");
      return;
    }
    toast.success("Proposta enviada para aprovação do gestor comercial!");
    if (onEnviarAprovacao) onEnviarAprovacao();
  };

  const renderIconeModelo = (nome: ModeloProposta["iconeNome"]) => {
    switch (nome) {
      case "Briefcase":
        return <Briefcase className="size-4.5" />;
      case "Monitor":
        return <Monitor className="size-4.5" />;
      case "ShieldCheck":
        return <ShieldCheck className="size-4.5" />;
      case "BarChart":
        return <BarChart3 className="size-4.5" />;
      case "Zap":
        return <Zap className="size-4.5" />;
      default:
        return <FileText className="size-4.5" />;
    }
  };

  return (
    <div className="mx-auto max-w-[1720px] px-3.5 pb-16 pt-5 sm:px-6 lg:px-8 space-y-4 antialiased text-neutral-100">
      {/* =========================================================================
          1. CABEÇALHO DO CRIADOR PROFISSIONAL
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
          >
            <Building2 className="size-3.5 text-neutral-500" />
            <span>Gestão</span>
            <ChevronRight className="size-3 text-neutral-600" />
            <button
              onClick={onVoltarPainel}
              className="hover:text-neutral-200 transition-colors"
            >
              Propostas
            </button>
            <ChevronRight className="size-3 text-neutral-600" />
            <span className="text-neutral-200">Criador de Proposta</span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mt-1">
            Criador Profissional de Propostas
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
            Construa uma proposta comercial completa com o apoio da IA e impressione seus clientes.
          </p>
        </div>

        {/* 4 Botões Superiores de Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Salvar Rascunho */}
          <button
            type="button"
            onClick={handleSalvarRascunho}
            className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#121620] px-3.5 py-1.5 text-left transition-colors hover:border-white/20 hover:bg-[#181e2b]"
          >
            <Save className="size-4 text-neutral-300" />
            <div>
              <span className="text-xs font-bold text-white block leading-tight">
                Salvar rascunho
              </span>
              <span className="text-[10px] text-neutral-400 font-normal block leading-tight">
                Última edição: hoje às 14:32
              </span>
            </div>
          </button>

          {/* Gerar com IA */}
          <button
            type="button"
            onClick={handleGerarComIa}
            className="flex h-10 items-center gap-2 rounded-xl border border-purple-500/30 bg-[#121620] px-4 text-xs font-bold text-white transition-all hover:border-purple-500/60 hover:bg-[#181a2b]"
          >
            <Sparkles className="size-4 text-[#c084fc]" />
            <span>Gerar com IA</span>
          </button>

          {/* Pré-visualizar */}
          <button
            type="button"
            onClick={handlePreVisualizar}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-bold text-neutral-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Eye className="size-4 text-neutral-300" />
            <span>Pré-visualizar</span>
          </button>

          {/* Enviar para Aprovação */}
          <button
            type="button"
            onClick={handleEnviarAprovacao}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Send className="size-4 stroke-[2.5]" />
            <span>Enviar para aprovação</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. GRADE PRINCIPAL DE 3 COLUNAS
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =======================================================================
            COLUNA ESQUERDA: BIBLIOTECA DE MODELOS & ESTRUTURA (lg:col-span-3)
           ======================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Biblioteca de Modelos */}
          <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-3">
            <div>
              <h2 className="text-sm font-bold text-white">Biblioteca de Modelos</h2>
              <p className="text-[11px] text-neutral-400">
                Use um modelo profissional ou comece do zero.
              </p>
            </div>

            {/* Pílulas de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {[
                { id: "todos", rotulo: "Todos" },
                { id: "comercial", rotulo: "Comercial" },
                { id: "marketing", rotulo: "Marketing" },
                { id: "consultoria", rotulo: "Consultoria" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFiltroCategoriaModelo(cat.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                    filtroCategoriaModelo === cat.id
                      ? "bg-[#ea580c] text-white shadow-sm"
                      : "bg-[#121620] text-neutral-400 border border-white/5 hover:text-white"
                  )}
                >
                  {cat.rotulo}
                </button>
              ))}
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar modelos de proposta..."
                value={buscaModelo}
                onChange={(e) => setBuscaModelo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Lista dos 5 Modelos */}
            <div className="space-y-1.5 pt-1">
              {modelosFiltrados.map((m) => {
                const ativo = modeloAtivo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModeloAtivo(m.id);
                      toast.success(`Modelo "${m.titulo}" aplicado à proposta!`);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group",
                      ativo
                        ? "border-orange-500/60 bg-orange-500/[0.08] shadow-md shadow-orange-500/10"
                        : "border-white/5 bg-[#121620] hover:border-white/15 hover:bg-[#161c29]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                          m.bgIcone,
                          m.corIcone
                        )}
                      >
                        {renderIconeModelo(m.iconeNome)}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "text-xs font-bold block truncate",
                            ativo ? "text-orange-400" : "text-white group-hover:text-neutral-200"
                          )}
                        >
                          {m.titulo}
                        </span>
                        <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                          {m.subtitulo}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        ativo ? "text-orange-400" : "text-neutral-500 group-hover:text-neutral-300"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Estrutura da Proposta (9 Seções) */}
          <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#f97316]" />
                <h2 className="text-sm font-bold text-white">Estrutura da proposta</h2>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Modo de reordenação ativado: arraste as seções")}
                className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Sliders className="size-3" />
                <span>Reordenar</span>
              </button>
            </div>

            {/* Lista das 9 Seções */}
            <div className="space-y-1">
              {secoes.map((sec) => {
                const ativa = secaoAtivaId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSecaoAtivaId(sec.id);
                      setPaginaAtual(sec.numero);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left group",
                      ativa
                        ? "border border-orange-500/60 bg-gradient-to-r from-orange-500/20 to-transparent text-white font-bold shadow-sm"
                        : "border border-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="size-3 text-neutral-600 group-hover:text-neutral-400 shrink-0" />
                      <span className="truncate">{sec.titulo}</span>
                    </div>

                    {ativa && <ChevronRight className="size-3.5 text-orange-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Adicionar Seção */}
            <button
              type="button"
              onClick={() => {
                const novaSecao: SecaoEstrutura = {
                  id: `secao_${secoes.length + 1}`,
                  numero: secoes.length + 1,
                  titulo: `${secoes.length + 1}. Nova Seção`,
                  icone: "Plus",
                };
                setSecoes([...secoes, novaSecao]);
                toast.success("Nova seção adicionada à proposta!");
              }}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-white/10 bg-[#121620] text-xs font-semibold text-neutral-400 hover:border-white/20 hover:text-white transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Adicionar seção</span>
            </button>
          </div>
        </div>

        {/* =======================================================================
            COLUNA CENTRAL: EDITOR VISUAL A4 DA PROPOSTA (lg:col-span-6)
           ======================================================================= */}
        <div className="lg:col-span-6 space-y-3">
          {/* Barra de Controles Superior do Documento */}
          <div className="flex items-center justify-between rounded-xl border border-[#1e2638] bg-[#0c1017]/90 px-3.5 py-2 shadow-md">
            {/* Paginação */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
                title="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-neutral-300 font-mono text-xs px-2">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                className="p-1 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
                title="Próxima página"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Controles de Zoom */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.max(75, z - 10))}
                className="size-6 flex items-center justify-center rounded text-neutral-400 hover:text-white"
              >
                -
              </button>
              <span className="font-mono text-neutral-300 text-xs w-12 text-center">
                {zoomPercent}%
              </span>
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.min(150, z + 10))}
                className="size-6 flex items-center justify-center rounded text-neutral-400 hover:text-white"
              >
                +
              </button>
            </div>

            {/* Alternador de Dispositivo */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#121620] border border-white/5">
              <button
                type="button"
                onClick={() => setDispositivoVisualizacao("desktop")}
                className={cn(
                  "p-1.5 rounded transition-all",
                  dispositivoVisualizacao === "desktop"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Visualização Desktop"
              >
                <Monitor className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDispositivoVisualizacao("tablet")}
                className={cn(
                  "p-1.5 rounded transition-all",
                  dispositivoVisualizacao === "tablet"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Visualização Tablet"
              >
                <Tablet className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDispositivoVisualizacao("mobile")}
                className={cn(
                  "p-1.5 rounded transition-all",
                  dispositivoVisualizacao === "mobile"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Visualização Mobile"
              >
                <Smartphone className="size-3.5" />
              </button>
            </div>
          </div>

          {/* FOLHA A4 EDITÁVEL (Canvas Central) */}
          <div
            className={cn(
              "mx-auto transition-all duration-300 rounded-2xl border border-[#1e2638] bg-[#0c1017] p-6 sm:p-8 shadow-2xl space-y-7 relative overflow-hidden",
              dispositivoVisualizacao === "mobile"
                ? "max-w-sm text-xs"
                : dispositivoVisualizacao === "tablet"
                ? "max-w-xl"
                : "w-full"
            )}
            style={{ transform: `scale(${zoomPercent / 100})`, transformOrigin: "top center" }}
          >
            {/* Topo da Folha: Logo + Número da Proposta */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold text-sm shadow-md shadow-orange-600/30">
                  F
                </span>
                <span className="text-base font-bold text-white tracking-tight">
                  Flow Business
                </span>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    {conteudoCapa.codigoProposta}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Edição de cabeçalho da proposta")}
                  className="p-1 rounded text-neutral-500 hover:text-white"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Bloco Hero da Proposta (Capa) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <span className="h-0.5 w-4 bg-orange-500" />
                  {conteudoCapa.tagTopo}
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {conteudoCapa.tituloParte1}
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {conteudoCapa.tituloDestaque}
                  </span>
                </h2>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-xl">
                  {conteudoCapa.subtitulo}
                </p>
              </div>

              {/* Imagem Executiva de Capa */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-44 sm:h-56 group">
                <img
                  src={imagemCapaUrl}
                  alt="Capa Proposta Comercial"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button
                  type="button"
                  onClick={() => {
                    const nova =
                      imagemCapaUrl.includes("photo-1460925895917")
                        ? "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000&auto=format&fit=crop&q=80"
                        : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80";
                    setImagemCapaUrl(nova);
                    toast.success("Imagem de capa atualizada!");
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white hover:bg-black/80 transition-all flex items-center gap-1.5"
                >
                  <ImageIcon className="size-3.5" />
                  <span>Trocar imagem</span>
                </button>
              </div>

              {/* 3 Caixas de Metadados da Capa */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Cliente */}
                <div className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                    <User className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-400 block">Cliente</span>
                    <span className="text-xs font-bold text-white block truncate">
                      {dadosCliente.nomeEmpresa}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Identidade Visual + Site Institucional
                    </span>
                  </div>
                </div>

                {/* Data */}
                <div className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                    <Calendar className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-400 block">Data da proposta</span>
                    <span className="text-xs font-bold text-white block">
                      {conteudoCapa.dataProposta}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Validade: {conteudoCapa.validadeDias}
                    </span>
                  </div>
                </div>

                {/* Preparada Por */}
                <div className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <UserCheck className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-400 block">Preparada por</span>
                    <span className="text-xs font-bold text-white block">
                      {conteudoCapa.responsavelNome}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">Flow Business</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Nossos Serviços */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-orange-500" />
                    NOSSOS SERVIÇOS
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    O que está incluso na sua solução
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Uma estrutura completa para atrair mais clientes, fortalecer sua marca e gerar
                    resultados consistentes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Edição de serviços da proposta")}
                  className="p-1 text-neutral-500 hover:text-white"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>

              {/* 3 Cards de Serviços */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Site Institucional */}
                <div className="p-3.5 rounded-xl bg-[#121620] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                      <Globe className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Site Institucional</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Site moderno, responsivo e otimizado para conversão.
                  </p>
                  <div className="space-y-1 text-[10px] text-neutral-300 pt-1">
                    {[
                      "Design personalizado",
                      "SEO técnico",
                      "Integração com WhatsApp",
                      "Painel de gerenciamento",
                    ].map((it) => (
                      <div key={it} className="flex items-center gap-1.5">
                        <Check className="size-3 text-emerald-400 shrink-0" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Tráfego Pago */}
                <div className="p-3.5 rounded-xl bg-[#121620] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                      <Megaphone className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Tráfego Pago</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Campanhas estratégicas no Google e Meta Ads.
                  </p>
                  <div className="space-y-1 text-[10px] text-neutral-300 pt-1">
                    {[
                      "Criação de campanhas",
                      "Gestão mensal",
                      "Relatórios de desempenho",
                      "Otimização contínua",
                    ].map((it) => (
                      <div key={it} className="flex items-center gap-1.5">
                        <Check className="size-3 text-emerald-400 shrink-0" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Consultoria Estratégica */}
                <div className="p-3.5 rounded-xl bg-[#121620] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <ShieldCheck className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-white">Consultoria Estratégica</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Acompanhamento especializado para o seu crescimento.
                  </p>
                  <div className="space-y-1 text-[10px] text-neutral-300 pt-1">
                    {[
                      "Diagnóstico do mercado",
                      "Plano de ação personalizado",
                      "Reuniões mensais",
                      "Suporte via WhatsApp",
                    ].map((it) => (
                      <div key={it} className="flex items-center gap-1.5">
                        <Check className="size-3 text-emerald-400 shrink-0" />
                        <span>{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Condições Comerciais */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-orange-500" />
                    INVESTIMENTO
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Condições comerciais</h3>
                  <p className="text-xs text-neutral-400">
                    Transparência e flexibilidade para o seu projeto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalEditarPreco(true)}
                  className="p-1 text-neutral-500 hover:text-white"
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>

              {/* Tabela de Preços do Documento */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121620] text-neutral-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">SERVIÇO</th>
                      <th className="p-2.5">DESCRIÇÃO</th>
                      <th className="p-2.5 text-right">VALOR</th>
                      <th className="p-2.5 text-center">RECORRÊNCIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="p-2.5 font-bold text-white">Site Institucional</td>
                      <td className="p-2.5 text-neutral-400">Desenvolvimento completo</td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        R$ 2.500,00
                      </td>
                      <td className="p-2.5 text-center text-neutral-300">Único</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="p-2.5 font-bold text-white">Gestão de Tráfego</td>
                      <td className="p-2.5 text-neutral-400">Campanhas Google + Meta Ads</td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        R$ 1.500,00
                      </td>
                      <td className="p-2.5 text-center text-neutral-300">Mensal</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="p-2.5 font-bold text-white">Consultoria Mensal</td>
                      <td className="p-2.5 text-neutral-400">Acompanhamento estratégico</td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">R$ 980,00</td>
                      <td className="p-2.5 text-center text-neutral-300">Mensal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA DIREITA: CONFIGURAÇÕES COMERCIAIS & IA (lg:col-span-3)
           ======================================================================= */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Card 1: Dados do Cliente */}
          <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-4 text-neutral-300" />
                <h3 className="text-xs font-bold text-white">Dados do cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarCliente(true)}
                className="text-[11px] font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Pencil className="size-3" />
                <span>Editar</span>
              </button>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs">
                <Building2 className="size-4.5 text-neutral-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {dadosCliente.nomeEmpresa}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Lead
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px] text-neutral-400 mt-1 font-mono">
                  <div className="truncate">CNPJ {dadosCliente.cnpj}</div>
                  <div className="truncate text-neutral-300">Contato: {dadosCliente.contato}</div>
                  <div className="truncate text-neutral-300">E-mail: {dadosCliente.email}</div>
                  <div className="truncate text-neutral-300">Telefone: {dadosCliente.telefone}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Identidade Visual */}
          <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-neutral-300" />
                <h3 className="text-xs font-bold text-white">Identidade visual</h3>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Edição de paleta e tipografia da proposta")}
                className="text-[11px] font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Pencil className="size-3" />
                <span>Editar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              {/* Logo */}
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Logo da proposta</span>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#121620] border border-white/5">
                  <span className="size-5 rounded-md bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center">
                    F
                  </span>
                  <span className="text-xs font-bold text-white truncate">Flow Business</span>
                </div>
              </div>

              {/* Cores */}
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Cores principais</span>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#121620] border border-white/5">
                  <span className="size-4 rounded-full bg-[#f97316] ring-1 ring-white/30" />
                  <span className="size-4 rounded-full bg-[#0f172a] ring-1 ring-white/20" />
                  <span className="size-4 rounded-full bg-[#f8fafc] ring-1 ring-white/20" />
                </div>
              </div>
            </div>

            {/* Imagem de Capa */}
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1">Imagem de capa</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#121620] border border-white/5">
                <div className="size-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={imagemCapaUrl} alt="Preview" className="size-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImagemCapaUrl(
                      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000&auto=format&fit=crop&q=80"
                    );
                    toast.success("Imagem alternada!");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] font-semibold text-neutral-200 hover:text-white flex items-center gap-1.5"
                >
                  <ImageIcon className="size-3.5" />
                  <span>Trocar imagem</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Precificação */}
          <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-neutral-300" />
                <h3 className="text-xs font-bold text-white">Precificação</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarPreco(true)}
                className="text-[11px] font-semibold text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Pencil className="size-3" />
                <span>Editar</span>
              </button>
            </div>

            {/* 4 Caixas Métricas */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#121620] border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <DollarSign className="size-3" />
                  <span>Valor total</span>
                </div>
                <span className="font-mono font-bold text-white text-xs block mt-0.5">
                  {valoresComerciais.valorTotal}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121620] border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <RotateCcw className="size-3" />
                  <span>Recorrência</span>
                </div>
                <span className="font-mono font-bold text-white text-xs block mt-0.5">
                  {valoresComerciais.recorrencia}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121620] border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <Tag className="size-3" />
                  <span>Desconto</span>
                </div>
                <span className="font-mono font-bold text-white text-xs block mt-0.5">
                  {valoresComerciais.desconto}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121620] border border-white/5">
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <Calendar className="size-3" />
                  <span>Validade da proposta</span>
                </div>
                <span className="font-mono font-bold text-white text-xs block mt-0.5">
                  {valoresComerciais.validade}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Assistente de IA (Container Roxo) */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-[#181028]/95 to-[#0d0917]/95 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#c084fc]" />
                <h3 className="text-xs font-bold text-white">Assistente de IA</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-[#c084fc] border border-purple-500/30">
                  IA
                </span>
              </div>
              <button
                type="button"
                onClick={() => toast.success("Conteúdo otimizado automaticamente pela IA!")}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Gerar conteúdo
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-snug">
              Use a inteligência artificial para melhorar sua proposta.
            </p>

            {/* 4 Botões Rápidos de IA */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => toast.success("Copy da introdução melhorada com sucesso!")}
                className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/30 hover:border-purple-500/50 hover:bg-purple-950/50 text-left transition-all flex flex-col gap-1 text-neutral-200"
              >
                <Pencil className="size-3.5 text-purple-400" />
                <span className="font-semibold text-[11px] leading-tight">Melhorar copy</span>
              </button>

              <button
                type="button"
                onClick={() => toast.success("Objeções e respostas sugeridas adicionadas!")}
                className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/30 hover:border-purple-500/50 hover:bg-purple-950/50 text-left transition-all flex flex-col gap-1 text-neutral-200"
              >
                <HelpCircle className="size-3.5 text-purple-400" />
                <span className="font-semibold text-[11px] leading-tight">
                  Gerar objeções e respostas
                </span>
              </button>

              <button
                type="button"
                onClick={() => toast.success("Resumo executivo da proposta gerado!")}
                className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/30 hover:border-purple-500/50 hover:bg-purple-950/50 text-left transition-all flex flex-col gap-1 text-neutral-200"
              >
                <FileText className="size-3.5 text-purple-400" />
                <span className="font-semibold text-[11px] leading-tight">Resumir proposta</span>
              </button>

              <button
                type="button"
                onClick={() => toast.success("Tom persuasivo e focado em ROI aplicado!")}
                className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/30 hover:border-purple-500/50 hover:bg-purple-950/50 text-left transition-all flex flex-col gap-1 text-neutral-200"
              >
                <Sparkles className="size-3.5 text-purple-400" />
                <span className="font-semibold text-[11px] leading-tight">
                  Tornar mais persuasiva
                </span>
              </button>
            </div>
          </div>

          {/* Card 5: Checklist de Aprovação */}
          <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">Checklist de aprovação</h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {checklistCount} de 5 concluídos
              </span>
            </div>

            <div className="space-y-2 text-xs pt-1">
              {[
                { key: "dadosCliente", label: "Dados do cliente preenchidos" },
                { key: "escopoRevisado", label: "Escopo de serviços revisado" },
                { key: "precificacao", label: "Precificação definida" },
                { key: "condicoes", label: "Condições comerciais configuradas" },
                { key: "validadeTermos", label: "Validade e termos confirmados" },
              ].map((item) => {
                const checked = checklist[item.key as keyof typeof checklist];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setChecklist((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof checklist],
                      }))
                    }
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#121620] border border-white/5 text-left text-neutral-300 hover:text-white"
                  >
                    <span className="text-[11px] truncate">{item.label}</span>
                    <div
                      className={cn(
                        "size-4 rounded flex items-center justify-center border transition-colors",
                        checked
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "border-neutral-600 bg-transparent"
                      )}
                    >
                      {checked && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAIS AUXILIARES DE EDIÇÃO
         ========================================================================= */}
      {/* Modal Editar Cliente */}
      {modalEditarCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1017] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Editar Dados do Cliente</h3>
              <button
                onClick={() => setModalEditarCliente(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={dadosCliente.nomeEmpresa}
                  onChange={(e) =>
                    setDadosCliente({ ...dadosCliente, nomeEmpresa: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Contato Responsável</label>
                <input
                  type="text"
                  value={dadosCliente.contato}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, contato: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">E-mail</label>
                <input
                  type="email"
                  value={dadosCliente.email}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, email: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={dadosCliente.telefone}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, telefone: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalEditarCliente(false)}
                className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalEditarCliente(false);
                  toast.success("Dados do cliente atualizados!");
                }}
                className="px-4 py-1.5 rounded-lg bg-orange-600 text-xs font-bold text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Preço */}
      {modalEditarPreco && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1017] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Editar Precificação e Condições</h3>
              <button
                onClick={() => setModalEditarPreco(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Valor Total</label>
                <input
                  type="text"
                  value={valoresComerciais.valorTotal}
                  onChange={(e) =>
                    setValoresComerciais({ ...valoresComerciais, valorTotal: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Condição de Recorrência</label>
                <input
                  type="text"
                  value={valoresComerciais.recorrencia}
                  onChange={(e) =>
                    setValoresComerciais({ ...valoresComerciais, recorrencia: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Validade da Proposta</label>
                <input
                  type="text"
                  value={valoresComerciais.validade}
                  onChange={(e) =>
                    setValoresComerciais({ ...valoresComerciais, validade: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#121620] p-2 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalEditarPreco(false)}
                className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalEditarPreco(false);
                  toast.success("Condições comerciais atualizadas!");
                }}
                className="px-4 py-1.5 rounded-lg bg-orange-600 text-xs font-bold text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
