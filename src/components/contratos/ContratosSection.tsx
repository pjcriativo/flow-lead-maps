// Fase 2 / Redesign Premium — Tela "Contratos" (Gestão → Contratos)
// Fiel ao layout visual final aprovado com máxima fidelidade, submenu lateral exclusivo,
// indicadores executivos (MRR), gráficos analíticos (Evolução, Status, Receita por Tipo),
// tabela completa paginada, painel direito da proposta/contrato selecionado, documentos e sugestões de IA.

import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  History,
  Info,
  LayoutGrid,
  LayoutTemplate,
  List,
  Loader2,
  Mail,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  Send,
  Share2,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wand2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import type { Contrato, ContratoStatus } from "@/types";
import { listarContratos, gerarContrato, marcarComoAssinado } from "@/services/contratos";
import { ContratosSidebarNav, type TelaContratosId } from "./ContratosSidebarNav";
import { CONTRATOS_CATALOGO_INICIAL, type ContratoItem } from "./contratos-data";
import { CriadorContratosView } from "./CriadorContratosView";
import { BibliotecaModelosContratosView } from "./BibliotecaModelosContratosView";

function getInitialTela(): TelaContratosId {
  if (typeof window === "undefined") return "painel";
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tela");
  if (t === "criador") return "criador";
  if (t === "modelos") return "modelos";
  if (t === "assinaturas") return "assinaturas";
  return "painel";
}

export function ContratosSection() {
  // Navegação do Submenu Lateral
  const [telaAtiva, setTelaAtiva] = useState<TelaContratosId>(getInitialTela);

  useEffect(() => {
    const onPopState = () => {
      setTelaAtiva(getInitialTela());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const mudarTela = (novaTela: TelaContratosId) => {
    setTelaAtiva(novaTela);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tela", novaTela);
      window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  // Modelo selecionado para carregar no Criador de Contrato (vindo da Biblioteca de Modelos)
  const [modeloSelecionadoCriadorId, setModeloSelecionadoCriadorId] = useState<string>("servicos_mensais");

  // Contratos Reais do Supabase e Catálogo Visual
  const [contratosReais, setContratosReais] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  // Lista mesclada para garantir 100% de fidelidade visual à referência
  const [itens, setItens] = useState<ContratoItem[]>(CONTRATOS_CATALOGO_INICIAL);
  const [selecionadoId, setSelecionadoId] = useState<string>("ct_1");

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroResponsavel, setFiltroResponsavel] = useState("all");
  const [filtroVencimento, setFiltroVencimento] = useState("all");

  // Paginação e Modo de Visualização
  const [modoVisualizacao, setModoVisualizacao] = useState<"tabela" | "cards">("tabela");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Abas do Painel Direito de Detalhes
  const [abaDetalhes, setAbaDetalhes] = useState<"visao_geral" | "servicos" | "faturamento" | "historico">(
    "visao_geral"
  );
  const [painelLateralAberto, setPainelLateralAberto] = useState(true);

  // Modais
  const [modalCriarIaAberto, setModalCriarIaAberto] = useState(false);
  const [previewReal, setPreviewReal] = useState<Contrato | null>(null);
  const [modalVerDocAberto, setModalVerDocAberto] = useState(false);

  // Carregar Contratos Reais
  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const reais = await listarContratos();
      setContratosReais(reais);

      // Se houver contratos reais, convertê-los para itens visuais
      if (reais.length > 0) {
        const convertidos: ContratoItem[] = reais.map((c, idx) => ({
          id: c.id,
          identificador: `CT-2026-${String(reais.length - idx).padStart(3, "0")}`,
          empresa: c.lead_nome || "Cliente Comercial",
          empresaIniciais: (c.lead_nome || "CC").slice(0, 2).toUpperCase(),
          avatarBg: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
          segmento: "Comercial",
          localizacao: "Brasil",
          tipo: "Serviços mensais",
          valorMensal: c.valor || 3500,
          valorMensalFormatado: formatBRL(c.valor || 3500),
          valorTotal: (c.valor || 3500) * 12,
          valorTotalFormatado: formatBRL((c.valor || 3500) * 12),
          status: c.status === "assinado" ? "ativo" : c.status === "cancelado" ? "cancelado" : "em_assinatura",
          statusRotulo: c.status === "assinado" ? "Ativo" : c.status === "cancelado" ? "Cancelado" : "Em assinatura",
          dataAssinatura: formatData(c.criado_em),
          dataInicio: formatData(c.criado_em),
          dataVencimento: "31/12/2026",
          responsavelNome: "Marcos",
          responsavelCompleto: "Marcos Gonçalves",
          responsavelAvatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          documentos: [
            {
              nome: `${c.titulo || "Contrato"}.pdf`,
              tipo: "PDF",
              tamanho: "1.9 MB",
              data: formatData(c.criado_em),
            },
          ],
          servicos: [{ nome: c.titulo, valor: formatBRL(c.valor) }],
          faturamento: {
            ciclo: "Mensal",
            diaVencimento: 10,
            metodo: "Boleto",
            status: "Em dia",
          },
          historico: [{ data: formatData(c.criado_em), evento: "Contrato gerado no sistema" }],
          observacoes: "Contrato criado pelo fluxo oficial do sistema.",
        }));

        setItens((prev) => {
          const idsExistentes = new Set(convertidos.map((x) => x.id));
          return [...convertidos, ...prev.filter((p) => !idsExistentes.has(p.id))];
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar contratos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  // Gerar Novo Contrato Real
  const handleGerarContratoReal = async () => {
    setGerando(true);
    try {
      const novo = await gerarContrato();
      setContratosReais((prev) => [novo, ...prev]);
      toast.success(`Contrato gerado com sucesso para "${novo.lead_nome}"!`);
      setPreviewReal(novo);
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o contrato");
    } finally {
      setGerando(false);
    }
  };

  // Contrato Ativo
  const contratoAtivo = itens.find((c) => c.id === selecionadoId) || itens[0];

  // Filtros Dinâmicos
  const contratosFiltrados = useMemo(() => {
    return itens.filter((c) => {
      // Status
      if (filtroStatus !== "all" && c.status !== filtroStatus) return false;

      // Tipo
      if (filtroTipo !== "all" && c.tipo !== filtroTipo) return false;

      // Responsável
      if (
        filtroResponsavel !== "all" &&
        c.responsavelNome.toLowerCase() !== filtroResponsavel.toLowerCase()
      )
        return false;

      // Vencimento
      if (filtroVencimento === "vencendo" && !c.vencendoAlerta) return false;

      // Busca Textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchEmpresa = c.empresa.toLowerCase().includes(termo);
        const matchId = c.identificador.toLowerCase().includes(termo);
        const matchSegmento = c.segmento.toLowerCase().includes(termo);
        if (!matchEmpresa && !matchId && !matchSegmento) return false;
      }

      return true;
    });
  }, [itens, filtroStatus, filtroTipo, filtroResponsavel, filtroVencimento, busca]);

  // Paginação
  const totalPaginas = Math.ceil(contratosFiltrados.length / itensPorPagina) || 1;
  const contratosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return contratosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [contratosFiltrados, paginaAtual, itensPorPagina]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#07090e] text-neutral-100 antialiased selection:bg-[#f95d14]/30 selection:text-white">
      {/* Submenu Lateral Interno de Contratos */}
      <ContratosSidebarNav telaAtiva={telaAtiva} onSelecionarTela={(t) => mudarTela(t)} />

      {/* Conteúdo Principal Dinâmico */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-[1720px] px-3.5 pb-16 pt-5 sm:px-6 lg:px-8 space-y-5 antialiased text-neutral-100">
          {telaAtiva === "criador" ? (
            <CriadorContratosView
              modeloInicialId={modeloSelecionadoCriadorId}
              onVoltarPainel={() => mudarTela("painel")}
            />
          ) : telaAtiva === "modelos" ? (
            <BibliotecaModelosContratosView
              onSelecionarModeloParaCriador={(modeloId) => {
                setModeloSelecionadoCriadorId(modeloId);
                mudarTela("criador");
              }}
              onVoltarPainel={() => mudarTela("painel")}
            />
          ) : (
            <>
              {/* =========================================================================
                  1. CABEÇALHO PRINCIPAL DO MÓDULO & BREADCRUMBS
                 ========================================================================= */}
              <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  {/* Breadcrumbs */}
                  <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
                  >
                    <span>Gestão</span>
                    <ChevronRight className="size-3 text-neutral-600" />
                    <span className="text-neutral-200 font-semibold">Contratos</span>
                  </nav>

                  <div className="flex items-center gap-2.5 mt-1.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
                      <ScrollText className="size-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Contratos
                      </h1>
                      <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                        Gerencie contratos, assinaturas e renovações com segurança e agilidade.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Três Botões de Ação Superiores */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Novo contrato (Laranja) -> Abre Tela 02 Criador de Contrato */}
                  <button
                    type="button"
                    onClick={() => mudarTela("criador")}
                    className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
                  >
                    <Plus className="size-4 stroke-[2.5]" />
                    <span>Novo contrato</span>
                  </button>

              {/* Criar com IA (Roxo) */}
              <button
                type="button"
                onClick={() => setModalCriarIaAberto(true)}
                className="flex h-10 items-center gap-2 rounded-xl border border-purple-500/30 bg-[#121620] px-4 text-xs font-bold text-white transition-all hover:border-purple-500/60 hover:bg-[#181a2b]"
              >
                <Sparkles className="size-4 text-[#c084fc]" />
                <span>Criar com IA</span>
              </button>

              {/* Modelos de contrato (Escuro) */}
              <button
                type="button"
                onClick={() => {
                  toast.info(
                    "A biblioteca de modelos de contratos será disponibilizada na Tela 03 — Modelos de Contratos."
                  );
                }}
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-4 text-xs font-bold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181d2a] hover:text-white"
              >
                <LayoutTemplate className="size-4 text-neutral-400" />
                <span>Modelos de contrato</span>
              </button>
            </div>
          </header>

          {/* =========================================================================
              2. SEIS CARDS DE INDICADORES EXECUTIVOS (KPIs)
             ========================================================================= */}
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Card 1: Total de contratos */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">Total de contratos</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#f97316]">
                  <FileText className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">24</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <TrendingUp className="size-3" />
                <span>+20% este mês</span>
              </div>
            </div>

            {/* Card 2: Ativos */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">Ativos</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]">
                  <CheckCircle2 className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">18</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <TrendingUp className="size-3" />
                <span>+12% este mês</span>
              </div>
            </div>

            {/* Card 3: Em assinatura */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">Em assinatura</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
                  <Pencil className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">3</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <TrendingUp className="size-3" />
                <span>+50% este mês</span>
              </div>
            </div>

            {/* Card 4: Vencendo em 30 dias */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">Vencendo em 30 dias</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#f59e0b]">
                  <Calendar className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">2</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-red-400">
                <TrendingDown className="size-3" />
                <span>-33% vs. mês anterior</span>
              </div>
            </div>

            {/* Card 5: Renovados */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">Renovados</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
                  <RefreshCw className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">6</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <TrendingUp className="size-3" />
                <span>+100% este mês</span>
              </div>
            </div>

            {/* Card 6: Receita recorrente (MRR) */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-400">Receita recorrente (MRR)</span>
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#f59e0b]">
                  <DollarSign className="size-3.5" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">R$ 42.800</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <TrendingUp className="size-3" />
                <span>+28% este mês</span>
              </div>
            </div>
          </section>

          {/* =========================================================================
              3. TRÊS PAINÉIS DE GRÁFICOS (Evolução, Status, Receita por Tipo)
             ========================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* GRÁFICO 1: Evolução de Contratos */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-xs font-bold text-white tracking-wide">Evolução de Contratos</h2>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 bg-[#121620] px-2.5 py-1 rounded-lg border border-white/5">
                  <span>Últimos 12 meses</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* Multi-Bar + Line Chart SVG */}
              <div className="relative h-48 w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
                  {/* Grid Lines Horizontais */}
                  <line x1="25" y1="20" x2="365" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="25" y1="55" x2="365" y2="55" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="25" y1="90" x2="365" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <line x1="25" y1="125" x2="365" y2="125" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                  {/* Y-axis Esquerda (Qtd) */}
                  <text x="8" y="24" fill="#737373" fontSize="8" fontFamily="monospace">20</text>
                  <text x="8" y="59" fill="#737373" fontSize="8" fontFamily="monospace">15</text>
                  <text x="8" y="84" fill="#737373" fontSize="8" fontFamily="monospace">10</text>
                  <text x="12" y="109" fill="#737373" fontSize="8" fontFamily="monospace">5</text>
                  <text x="12" y="132" fill="#737373" fontSize="8" fontFamily="monospace">0</text>

                  {/* Y-axis Direita (Receita R$) */}
                  <text x="368" y="24" fill="#737373" fontSize="8" fontFamily="monospace">R$ 80K</text>
                  <text x="368" y="59" fill="#737373" fontSize="8" fontFamily="monospace">R$ 60K</text>
                  <text x="368" y="94" fill="#737373" fontSize="8" fontFamily="monospace">R$ 40K</text>
                  <text x="368" y="129" fill="#737373" fontSize="8" fontFamily="monospace">R$ 20K</text>

                  {/* Barras dos 12 Meses */}
                  {[
                    { m: "Jan", x: 30, h1: 25, h2: 12 },
                    { m: "Fev", x: 58, h1: 30, h2: 18 },
                    { m: "Mar", x: 86, h1: 45, h2: 24 },
                    { m: "Abr", x: 114, h1: 40, h2: 20 },
                    { m: "Mai", x: 142, h1: 55, h2: 28 },
                    { m: "Jun", x: 170, h1: 65, h2: 35 },
                    { m: "Jul", x: 198, h1: 60, h2: 30 },
                    { m: "Ago", x: 226, h1: 75, h2: 40 },
                    { m: "Set", x: 254, h1: 85, h2: 50 },
                    { m: "Out", x: 282, h1: 95, h2: 60 },
                    { m: "Nov", x: 310, h1: 80, h2: 45 },
                    { m: "Dez", x: 338, h1: 60, h2: 30 },
                  ].map((bar, idx) => (
                    <g key={idx}>
                      {/* Barra 1: Novos Contratos (Azul #3b82f6) */}
                      <rect
                        x={bar.x}
                        y={130 - bar.h1}
                        width="6"
                        height={bar.h1}
                        rx="2"
                        fill="#3b82f6"
                      />
                      {/* Barra 2: Renovações (Verde #10b981) */}
                      <rect
                        x={bar.x + 8}
                        y={130 - bar.h2}
                        width="6"
                        height={bar.h2}
                        rx="2"
                        fill="#10b981"
                      />
                      {/* Mês no Eixo X */}
                      <text
                        x={bar.x + 7}
                        y="145"
                        textAnchor="middle"
                        fill="#737373"
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        {bar.m}
                      </text>
                    </g>
                  ))}

                  {/* Linha de Receita Contratual Prevista (Laranja #f97316) */}
                  <path
                    d="M 37 115 Q 93 100, 149 80 T 261 40 T 345 55"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {[
                    { cx: 37, cy: 115 },
                    { cx: 93, cy: 100 },
                    { cx: 149, cy: 80 },
                    { cx: 205, cy: 65 },
                    { cx: 261, cy: 40 },
                    { cx: 317, cy: 45 },
                    { cx: 345, cy: 55 },
                  ].map((pt, i) => (
                    <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#f97316" />
                  ))}
                </svg>
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-white/5 text-[10px] text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span>Novos contratos</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#10b981]" />
                  <span>Renovações</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ef4444]" />
                  <span>Cancelamentos</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#f97316]" />
                  <span>Receita (R$)</span>
                </span>
              </div>
            </div>

            {/* GRÁFICO 2: Status dos Contratos */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-xs font-bold text-white tracking-wide">Status dos Contratos</h2>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 bg-[#121620] px-2.5 py-1 rounded-lg border border-white/5">
                  <span>Todos os contratos</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* Donut SVG e Breakdown */}
              <div className="flex items-center justify-between gap-4 py-3">
                {/* SVG Donut */}
                <div className="relative size-36 shrink-0 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    {/* Ativos (75%) - Emerald #10b981 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="11"
                      strokeDasharray="180 240"
                      strokeDashoffset="0"
                    />
                    {/* Em assinatura (12%) - Purple #8b5cf6 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="11"
                      strokeDasharray="30 240"
                      strokeDashoffset="-180"
                    />
                    {/* Vencendo (8%) - Amber #f59e0b */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="11"
                      strokeDasharray="20 240"
                      strokeDashoffset="-210"
                    />
                    {/* Renovados (4%) - Blue #3b82f6 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="11"
                      strokeDasharray="10 240"
                      strokeDashoffset="-230"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold font-mono text-white leading-tight">24</span>
                    <span className="text-[10px] text-neutral-400">Contratos</span>
                  </div>
                </div>

                {/* Lista de Legendas com Porcentagens */}
                <div className="flex-1 space-y-1.5 text-[11px] pr-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      <span>Ativos</span>
                    </span>
                    <span className="font-mono text-neutral-400">18 <span className="text-[10px] text-neutral-600">(75%)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#8b5cf6]" />
                      <span>Em assinatura</span>
                    </span>
                    <span className="font-mono text-neutral-400">3 <span className="text-[10px] text-neutral-600">(12%)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#f59e0b]" />
                      <span>Vencendo</span>
                    </span>
                    <span className="font-mono text-neutral-400">2 <span className="text-[10px] text-neutral-600">(8%)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#3b82f6]" />
                      <span>Renovados</span>
                    </span>
                    <span className="font-mono text-neutral-400">1 <span className="text-[10px] text-neutral-600">(4%)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#ef4444]" />
                      <span>Cancelados</span>
                    </span>
                    <span className="font-mono text-neutral-400">0 <span className="text-[10px] text-neutral-600">(0%)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#64748b]" />
                      <span>Expirados</span>
                    </span>
                    <span className="font-mono text-neutral-400">0 <span className="text-[10px] text-neutral-600">(0%)</span></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-neutral-400 border-t border-white/5">
                Taxa de retenção e adimplência contratual: <strong className="text-white">96%</strong>
              </div>
            </div>

            {/* GRÁFICO 3: Receita por Tipo de Contrato */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-xs font-bold text-white tracking-wide">Receita por Tipo de Contrato</h2>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 bg-[#121620] px-2.5 py-1 rounded-lg border border-white/5">
                  <span>Este ano</span>
                  <ChevronDown className="size-3 text-neutral-500" />
                </div>
              </div>

              {/* Donut de Receita e Breakdown */}
              <div className="flex items-center justify-between gap-4 py-3">
                {/* SVG Donut */}
                <div className="relative size-36 shrink-0 flex items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    {/* Serviços mensais (52%) - Amber #f59e0b */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="11"
                      strokeDasharray="125 240"
                      strokeDashoffset="0"
                    />
                    {/* Implantação (24%) - Purple #8b5cf6 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="11"
                      strokeDasharray="58 240"
                      strokeDashoffset="-125"
                    />
                    {/* Consultoria (12%) - Blue #3b82f6 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="11"
                      strokeDasharray="29 240"
                      strokeDashoffset="-183"
                    />
                    {/* Suporte (8%) - Emerald #10b981 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="11"
                      strokeDasharray="19 240"
                      strokeDashoffset="-212"
                    />
                    {/* Outros (4%) - Gray #64748b */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="11"
                      strokeDasharray="9 240"
                      strokeDashoffset="-231"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-bold font-mono text-white leading-tight">R$ 42.8K</span>
                    <span className="text-[10px] text-neutral-400">MRR</span>
                  </div>
                </div>

                {/* Lista de Legendas */}
                <div className="flex-1 space-y-1.5 text-[11px] pr-1">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#f59e0b]" />
                      <span>Serviços mensais</span>
                    </span>
                    <span className="font-mono text-neutral-400">52%</span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#8b5cf6]" />
                      <span>Implantação</span>
                    </span>
                    <span className="font-mono text-neutral-400">24%</span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#3b82f6]" />
                      <span>Consultoria</span>
                    </span>
                    <span className="font-mono text-neutral-400">12%</span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#10b981]" />
                      <span>Suporte</span>
                    </span>
                    <span className="font-mono text-neutral-400">8%</span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#64748b]" />
                      <span>Outros</span>
                    </span>
                    <span className="font-mono text-neutral-400">4%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-neutral-400 border-t border-white/5">
                Receita recorrente prevista para os próximos 12 meses: <strong className="text-white">R$ 513.600</strong>
              </div>
            </div>
          </section>

          {/* =========================================================================
              4. BARRA DE BUSCA E FILTROS COMBINADOS
             ========================================================================= */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#0c1017] p-3 shadow-sm">
            {/* Campo de Busca */}
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar por empresa, contato ou assunto..."
                className="w-full rounded-xl border border-white/5 bg-[#121620] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Dropdowns de Filtro */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status */}
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPaginaAtual(1);
                }}
                aria-label="Filtro por status"
                className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="em_assinatura">Em assinatura</option>
                <option value="vencendo">Vencendo</option>
                <option value="renovado">Renovado</option>
                <option value="vencido">Vencido</option>
              </select>

              {/* Tipo */}
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value);
                  setPaginaAtual(1);
                }}
                aria-label="Filtro por tipo"
                className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
              >
                <option value="all">Todos os tipos</option>
                <option value="Serviços mensais">Serviços mensais</option>
                <option value="Implantação">Implantação</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Suporte">Suporte</option>
              </select>

              {/* Responsável */}
              <select
                value={filtroResponsavel}
                onChange={(e) => {
                  setFiltroResponsavel(e.target.value);
                  setPaginaAtual(1);
                }}
                aria-label="Filtro por responsável"
                className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
              >
                <option value="all">Todos os responsáveis</option>
                <option value="marcos">Marcos</option>
                <option value="ana">Ana</option>
                <option value="carlos">Carlos</option>
                <option value="juliana">Juliana</option>
              </select>

              {/* Vencimento */}
              <select
                value={filtroVencimento}
                onChange={(e) => {
                  setFiltroVencimento(e.target.value);
                  setPaginaAtual(1);
                }}
                aria-label="Filtro por vencimento"
                className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
              >
                <option value="all">Vencimento</option>
                <option value="vencendo">Próximos 30 dias</option>
                <option value="60dias">Próximos 60 dias</option>
                <option value="vencidos">Vencidos</option>
              </select>

              {/* Filtros Avançados */}
              <button
                type="button"
                onClick={() => toast.info("Filtros avançados de cláusulas e faixas de valores")}
                className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Sliders className="size-3.5 text-neutral-400" />
                <span>Filtros avançados</span>
              </button>

              {/* Alternar Visualização */}
              <div className="flex items-center rounded-xl border border-white/5 bg-[#121620] p-0.5">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("tabela")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    modoVisualizacao === "tabela" ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white"
                  )}
                  title="Visualização em tabela"
                >
                  <List className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("cards")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    modoVisualizacao === "cards" ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white"
                  )}
                  title="Visualização em cards"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </section>

          {/* =========================================================================
              5. CONTEÚDO PRINCIPAL: TABELA + PAINEL DIREITO DO CONTRATO
             ========================================================================= */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Coluna Esquerda/Central: Tabela de Contratos (xl:col-span-8 ou xl:col-span-12) */}
            <div className={cn("transition-all", painelLateralAberto ? "xl:col-span-8" : "xl:col-span-12")}>
              <div className="rounded-2xl border border-white/5 bg-[#0c1017] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300 border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#10141d]/80 text-[11px] font-semibold text-neutral-400">
                        <th className="py-3 px-3 w-8 text-center">
                          <input
                            type="checkbox"
                            aria-label="Selecionar todos os contratos"
                            className="rounded border-white/20 bg-neutral-900 text-orange-500 focus:ring-0"
                          />
                        </th>
                        <th className="py-3 px-3">Empresa / Cliente</th>
                        <th className="py-3 px-3">Contrato</th>
                        <th className="py-3 px-3">Tipo</th>
                        <th className="py-3 px-3 text-right">Valor</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Assinatura</th>
                        <th className="py-3 px-3 text-center">Vencimento</th>
                        <th className="py-3 px-3">Responsável</th>
                        <th className="py-3 px-3 text-center w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contratosPaginados.map((c) => {
                        const ativo = c.id === selecionadoId;

                        return (
                          <tr
                            key={c.id}
                            onClick={() => {
                              setSelecionadoId(c.id);
                              setPainelLateralAberto(true);
                            }}
                            className={cn(
                              "cursor-pointer transition-colors group",
                              ativo
                                ? "bg-orange-500/10 border-l-2 border-l-[#f97316]"
                                : "hover:bg-[#121620]/60"
                            )}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                aria-label={`Selecionar contrato ${c.identificador}`}
                                checked={ativo}
                                onChange={() => setSelecionadoId(c.id)}
                                className="rounded border-white/20 bg-neutral-900 text-orange-500 focus:ring-0"
                              />
                            </td>

                            {/* Empresa / Cliente */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-[10px]",
                                    c.avatarBg
                                  )}
                                >
                                  {c.empresaIniciais}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-white block truncate leading-tight group-hover:text-orange-300 transition-colors">
                                    {c.empresa}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                                    {c.segmento}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Contrato (ID) */}
                            <td className="py-3 px-3 font-mono font-semibold text-neutral-300 whitespace-nowrap">
                              {c.identificador}
                            </td>

                            {/* Tipo */}
                            <td className="py-3 px-3 text-neutral-300 whitespace-nowrap">
                              {c.tipo}
                            </td>

                            {/* Valor */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                              {c.valorMensalFormatado !== "--" ? c.valorMensalFormatado : c.valorTotalFormatado}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                                  c.status === "ativo"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                    : c.status === "em_assinatura"
                                    ? "bg-purple-500/15 text-purple-400 border-purple-500/25"
                                    : c.status === "vencendo"
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                                    : c.status === "renovado"
                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                    : "bg-red-500/15 text-red-400 border-red-500/25"
                                )}
                              >
                                <span className="size-1.5 rounded-full bg-current" />
                                {c.statusRotulo}
                              </span>
                            </td>

                            {/* Assinatura */}
                            <td className="py-3 px-3 text-center font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                              {c.dataAssinatura}
                            </td>

                            {/* Vencimento */}
                            <td
                              className={cn(
                                "py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap",
                                c.vencendoAlerta ? "text-red-400 font-bold" : "text-neutral-400"
                              )}
                            >
                              {c.dataVencimento}
                            </td>

                            {/* Responsável */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  src={c.responsavelAvatar}
                                  alt={c.responsavelNome}
                                  className="size-5 rounded-full object-cover border border-white/20"
                                />
                                <span className="text-neutral-300 text-xs">{c.responsavelNome}</span>
                              </div>
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelecionadoId(c.id);
                                    setModalVerDocAberto(true);
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                                  title="Ver documento do contrato"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info(`Editando minuta do contrato ${c.identificador}`);
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                                  title="Editar contrato"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.success(`Contrato ${c.identificador} duplicado com sucesso!`);
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                                  title="Duplicar contrato"
                                >
                                  <Copy className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info("Opções: Baixar PDF, Histórico de Assinatura, Cancelar");
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                                  title="Mais opções"
                                >
                                  <MoreVertical className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Paginação Inferior da Tabela */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-t border-white/5 bg-[#10141d]/60 text-xs text-neutral-400">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                      disabled={paginaAtual <= 1}
                      className="p-1 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setPaginaAtual(pg)}
                        className={cn(
                          "size-7 rounded-lg text-xs font-mono font-semibold transition-all",
                          paginaAtual === pg
                            ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                            : "text-neutral-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual >= totalPaginas}
                      className="p-1 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" />
                    </button>

                    <select
                      value={itensPorPagina}
                      onChange={(e) => {
                        setItensPorPagina(Number(e.target.value));
                        setPaginaAtual(1);
                      }}
                      aria-label="Itens por página"
                      className="rounded-lg border border-white/10 bg-[#121620] px-2 py-1 text-xs text-neutral-300 focus:outline-none ml-2"
                    >
                      <option value={5}>5 por página</option>
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                    </select>
                  </div>

                  <span className="font-mono text-[11px] text-neutral-400">
                    Mostrando 1 - {Math.min(itensPorPagina, contratosFiltrados.length)} de{" "}
                    <strong className="text-white">{contratosFiltrados.length}</strong> contratos
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Painel Lateral do Contrato Selecionado (xl:col-span-4) */}
            {painelLateralAberto && (
              <aside aria-label="Detalhes do contrato selecionado" className="xl:col-span-4 space-y-4">
                {/* Card Principal de Detalhes do Contrato */}
                <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm space-y-4">
                  {/* Header do Painel com Close */}
                  <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full font-bold text-xs",
                          contratoAtivo.avatarBg
                        )}
                      >
                        {contratoAtivo.empresaIniciais}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-white tracking-tight">
                            {contratoAtivo.empresa}
                          </h2>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                              contratoAtivo.status === "ativo"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                : contratoAtivo.status === "em_assinatura"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/25"
                                : contratoAtivo.status === "vencendo"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                                : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                            )}
                          >
                            {contratoAtivo.statusRotulo}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {contratoAtivo.segmento} • {contratoAtivo.localizacao}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPainelLateralAberto(false)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10"
                      title="Recolher painel"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* 4 Abas do Painel */}
                  <div className="flex items-center gap-1 border-b border-white/5 pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAbaDetalhes("visao_geral")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-semibold transition-all",
                        abaDetalhes === "visao_geral"
                          ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Visão Geral
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaDetalhes("servicos")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-semibold transition-all",
                        abaDetalhes === "servicos"
                          ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Serviços
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaDetalhes("faturamento")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-semibold transition-all",
                        abaDetalhes === "faturamento"
                          ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Faturamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaDetalhes("historico")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-semibold transition-all",
                        abaDetalhes === "historico"
                          ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      Histórico
                    </button>
                  </div>

                  {/* Conteúdo da Aba: Visão Geral */}
                  {abaDetalhes === "visao_geral" && (
                    <div className="space-y-4">
                      {/* Bloco: Informações do Contrato */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
                          Informações do Contrato
                        </span>
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-white/5 bg-[#121620]/60 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Número do contrato</span>
                            <span className="font-mono font-bold text-white text-sm">
                              {contratoAtivo.identificador}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Valor total</span>
                            <span className="font-mono font-bold text-white text-sm">
                              {contratoAtivo.valorTotalFormatado}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Valor mensal</span>
                            <span className="font-mono font-bold text-white">
                              {contratoAtivo.valorMensalFormatado}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Tipo</span>
                            <span className="font-medium text-neutral-200">
                              {contratoAtivo.tipo}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Início</span>
                            <span className="font-mono text-neutral-300">
                              {contratoAtivo.dataInicio}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Vencimento</span>
                            <span
                              className={cn(
                                "font-mono font-semibold",
                                contratoAtivo.vencendoAlerta ? "text-red-400" : "text-neutral-300"
                              )}
                            >
                              {contratoAtivo.dataVencimento}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Responsável</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <img
                                src={contratoAtivo.responsavelAvatar}
                                alt={contratoAtivo.responsavelNome}
                                className="size-4 rounded-full object-cover border border-white/20"
                              />
                              <span className="font-medium text-neutral-200">
                                {contratoAtivo.responsavelCompleto}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block">Status</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-0.5">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              <span>{contratoAtivo.statusRotulo}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bloco: Documentos */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
                          Documentos
                        </span>
                        <div className="space-y-2">
                          {contratoAtivo.documentos.map((doc, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <FileText className="size-4 text-red-400" />
                                <div>
                                  <span className="font-medium text-white block text-xs">{doc.nome}</span>
                                  <span className="font-mono text-[10px] text-neutral-500">
                                    {doc.tipo} • {doc.tamanho}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toast.success(`Download de ${doc.nome} iniciado!`)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
                                  title="Baixar arquivo"
                                >
                                  <Download className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModalVerDocAberto(true)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
                                  title="Visualizar documento"
                                >
                                  <Eye className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => toast.info("Selecione um arquivo PDF para anexar ao contrato")}
                            className="w-full py-2 rounded-xl border border-dashed border-white/10 bg-[#121620]/40 text-neutral-400 hover:border-white/20 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                          >
                            <Plus className="size-3.5" />
                            <span>Adicionar documento</span>
                          </button>
                        </div>
                      </div>

                      {/* Botões de Ação do Contrato */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setModalVerDocAberto(true)}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:brightness-110 active:scale-[0.98] transition-all"
                          >
                            <Eye className="size-3.5" />
                            <span>Ver contrato</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              toast.info(`Editando cláusulas do contrato ${contratoAtivo.identificador}`);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-xs font-bold text-white transition-all"
                          >
                            <Pencil className="size-3.5 text-neutral-400" />
                            <span>Editar</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              toast.success(`Disparo de documento agendado para ${contratoAtivo.empresa}!`);
                            }}
                            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-white/5 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
                          >
                            <Send className="size-3 text-neutral-400" />
                            <span>Enviar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              toast.success(`Processo de renovação iniciado para ${contratoAtivo.empresa}!`);
                            }}
                            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-white/5 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
                          >
                            <RotateCcw className="size-3 text-neutral-400" />
                            <span>Renovar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              toast.info("Mais ações: Gerar Aditivo, Pausar Vigência, Rescindir");
                            }}
                            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-white/5 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
                          >
                            <span>Mais ações</span>
                            <ChevronDown className="size-3 text-neutral-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conteúdo da Aba: Serviços */}
                  {abaDetalhes === "servicos" && (
                    <div className="space-y-3 text-xs">
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
                        Escopo Contratado
                      </span>
                      <div className="space-y-2">
                        {contratoAtivo.servicos.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#121620]"
                          >
                            <span className="font-medium text-white">{s.nome}</span>
                            <span className="font-mono font-bold text-orange-400">{s.valor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conteúdo da Aba: Faturamento */}
                  {abaDetalhes === "faturamento" && (
                    <div className="space-y-3 text-xs">
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
                        Condições de Faturamento
                      </span>
                      <div className="p-3 rounded-xl border border-white/5 bg-[#121620] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Ciclo de cobrança:</span>
                          <span className="font-semibold text-white">{contratoAtivo.faturamento.ciclo}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Dia de vencimento:</span>
                          <span className="font-mono font-semibold text-white">Dia {contratoAtivo.faturamento.diaVencimento}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">Método preferencial:</span>
                          <span className="font-semibold text-white">{contratoAtivo.faturamento.metodo}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                          <span className="text-neutral-400">Status financeiro:</span>
                          <span className="font-semibold text-emerald-400">{contratoAtivo.faturamento.status}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conteúdo da Aba: Histórico */}
                  {abaDetalhes === "historico" && (
                    <div className="space-y-3 text-xs">
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
                        Eventos Registrados
                      </span>
                      <div className="space-y-2 border-l border-white/10 pl-3 ml-1.5">
                        {contratoAtivo.historico.map((h, idx) => (
                          <div key={idx} className="relative space-y-0.5">
                            <span className="absolute -left-[17px] top-1 size-2 rounded-full bg-orange-500 ring-4 ring-[#0c1017]" />
                            <p className="font-medium text-white">{h.evento}</p>
                            <span className="font-mono text-[10px] text-neutral-500">{h.data}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD: SUGESTÕES DE IA (Fiel ao layout final da referência) */}
                <div className="rounded-2xl border border-purple-500/20 bg-[#0c1017] p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                        <Sparkles className="size-4" />
                      </div>
                      <h3 className="text-xs font-bold text-white tracking-wide">Sugestões de IA</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.info("Carregando catálogo de sugestões contratuais...")}
                      className="text-[11px] font-semibold text-purple-400 hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>

                  {/* 3 Recomendações da Referência */}
                  <div className="space-y-2">
                    {/* Sugestão 1: Programar renovação antecipada */}
                    <div
                      onClick={() => {
                        toast.success(
                          `Renovação antecipada programada para ${contratoAtivo.empresa}: Alerta configurado com antecedência de 30 dias.`
                        );
                      }}
                      className="group flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 hover:bg-[#181a2b] transition-all cursor-pointer"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20">
                        <Calendar className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white block text-xs group-hover:text-purple-300 transition-colors">
                          Programar renovação antecipada
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                          Este contrato vence em 30 dias.
                        </p>
                      </div>
                      <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all self-center" />
                    </div>

                    {/* Sugestão 2: Sugerir upgrade de plano */}
                    <div
                      onClick={() => {
                        toast.info(`Simulação de upgrade calculada com base no consumo de leads.`);
                      }}
                      className="group flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 hover:bg-[#181a2b] transition-all cursor-pointer"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20">
                        <Zap className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white block text-xs group-hover:text-blue-300 transition-colors">
                          Sugerir upgrade de plano
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                          Baseado na utilização e crescimento.
                        </p>
                      </div>
                      <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all self-center" />
                    </div>

                    {/* Sugestão 3: Preparar proposta de renovação */}
                    <div
                      onClick={() => {
                        toast.success("Rascunho de aditivo contratual preparado com reajuste pelo IPCA!");
                      }}
                      className="group flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 hover:bg-[#181a2b] transition-all cursor-pointer"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                        <FileText className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-white block text-xs group-hover:text-emerald-300 transition-colors">
                          Preparar proposta de renovação
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                          Gere uma proposta personalizada com IA.
                        </p>
                      </div>
                      <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all self-center" />
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          6. MODAIS
         ========================================================================= */}
      {/* Modal Demonstrativo: Criar com IA */}
      <Dialog open={modalCriarIaAberto} onOpenChange={setModalCriarIaAberto}>
        <DialogContent className="max-w-md bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Wand2 className="size-5 text-purple-400" />
              <span>Geração de Contrato com IA</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs text-neutral-300">
            <p className="leading-relaxed">
              O assistente jurídico inteligente redige cláusulas customizadas, regras de rescisão,
              índices de reajuste (IPCA/IGP-M) e SLAs com base no escopo aprovado pelo cliente.
            </p>
            <textarea
              rows={4}
              placeholder="Descreva as condições especiais deste contrato, partes envolvidas e cláusulas específicas..."
              className="w-full rounded-xl border border-white/10 bg-[#121620] p-3 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={() => setModalCriarIaAberto(false)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-xs font-semibold text-neutral-300"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                setModalCriarIaAberto(false);
                toast.success("Minuta contratual gerada pela IA!");
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20"
            >
              Redigir contrato
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Real de Visualização de Contrato do Supabase */}
      {previewReal && (
        <PreviewContratoDialog
          contrato={previewReal}
          onClose={() => setPreviewReal(null)}
          onAssinado={(atualizado) => {
            setContratosReais((prev) =>
              prev.map((c) => (c.id === atualizado.id ? atualizado : c))
            );
            setPreviewReal(atualizado);
          }}
        />
      )}

      {/* Modal de Documento do Contrato Selecionado */}
      <Dialog open={modalVerDocAberto} onOpenChange={setModalVerDocAberto}>
        <DialogContent className="max-w-2xl bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ScrollText className="size-5 text-orange-400" />
                <span>{contratoAtivo.identificador} — {contratoAtivo.empresa}</span>
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-3 text-xs">
            <div className="p-4 rounded-xl border border-white/10 bg-[#121620] space-y-3 font-serif leading-relaxed text-neutral-300 max-h-[50vh] overflow-y-auto">
              <h3 className="text-sm font-bold text-white text-center border-b border-white/10 pb-2">
                INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS
              </h3>
              <p>
                <strong>CONTRATADA:</strong> FLOW BUSINESS TECNOLOGIA LTDA, pessoa jurídica de direito privado inscrita no CNPJ sob o nº 45.678.901/0001-23.
              </p>
              <p>
                <strong>CONTRATANTE:</strong> {contratoAtivo.empresa}, estabelecida em {contratoAtivo.localizacao}, segmento {contratoAtivo.segmento}.
              </p>
              <p>
                <strong>CLÁUSULA PRIMEIRA — DO OBJETO:</strong> O presente contrato tem por objeto a prestação continuada de serviços de {contratoAtivo.tipo}, conforme escopo detalhado na proposta comercial aprovada.
              </p>
              <p>
                <strong>CLÁUSULA SEGUNDA — DO PREÇO E CONDIÇÕES:</strong> Pela prestação dos serviços contratados, a CONTRATANTE pagará à CONTRATADA o valor total de {contratoAtivo.valorTotalFormatado}, a ser adimplido conforme faturamento acordado.
              </p>
              <p>
                <strong>CLÁUSULA TERCEIRA — DA VIGÊNCIA:</strong> O presente instrumento terá vigência a partir de {contratoAtivo.dataInicio} com término previsto para {contratoAtivo.dataVencimento}, renovável automaticamente salvo manifestação em contrário com 30 dias de antecedência.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                toast.success("Download do PDF oficial em alta resolução iniciado!");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
            >
              <Download className="size-3.5" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setModalVerDocAberto(false)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-[#f97316] text-xs font-bold text-white shadow-md shadow-orange-600/20"
            >
              Concluir leitura
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Dialog Real de Visualização de Contrato HTML do Supabase (Preservado)
function PreviewContratoDialog({
  contrato,
  onClose,
  onAssinado,
}: {
  contrato: Contrato;
  onClose: () => void;
  onAssinado: (c: Contrato) => void;
}) {
  const [assinando, setAssinando] = useState(false);

  const assinar = async () => {
    setAssinando(true);
    try {
      const atualizado = await marcarComoAssinado(contrato.id);
      toast.success("Contrato marcado como assinado com sucesso.");
      onAssinado(atualizado);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao assinar");
    } finally {
      setAssinando(false);
    }
  };

  const baixar = () => {
    toast.info("Download do documento em PDF gerado com sucesso.");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <ScrollText className="h-5 w-5 text-orange-500" /> {contrato.titulo}
          </DialogTitle>
        </DialogHeader>
        {/* Preview do documento */}
        <div
          className="prose-contrato max-h-[55vh] overflow-y-auto rounded-xl border border-white/10 bg-white p-6 text-sm leading-relaxed text-slate-800 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-semibold [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contrato.conteudo_html) }}
        />
        <DialogFooter className="gap-2 sm:justify-between pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={baixar}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
          >
            <Download className="h-4 w-4" /> Baixar (PDF/DOCX)
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={assinar}
              disabled={assinando || contrato.status === "assinado"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-[#f97316] text-xs font-bold text-white shadow-md shadow-orange-600/20 disabled:opacity-50"
            >
              {assinando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Assinando...
                </>
              ) : contrato.status === "assinado" ? (
                <>
                  <FileSignature className="h-4 w-4" /> Assinado
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4" /> Marcar como assinado
                </>
              )}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
