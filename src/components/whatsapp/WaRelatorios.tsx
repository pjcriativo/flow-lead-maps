// Tela 07 — WhatsApp Premium: Relatórios e Inteligência (Fidelidade Visual Absoluta ao Layout Aprovado)
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  Filter,
  Flame,
  Hash,
  HelpCircle,
  Inbox,
  Layers,
  LineChart,
  Loader2,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Phone,
  PieChart,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  obterDadosRelatoriosWa,
  type WaRelatoriosData,
  type WaRelatoriosFiltros,
  type WaDesempenhoPonto,
  type WaDistribuicaoCanal,
  type WaDesempenhoNumero,
  type WaTipoConversa,
  type WaStatusConversa,
  type WaPalavraChave,
  type WaLeadsDiaPonto,
  type WaVendasDiaPonto,
  type WaRelatorioAtividade,
} from "@/services/whatsapp";

export interface WaRelatoriosProps {
  onIrParaNumeros?: () => void;
  onIrParaCampanhas?: () => void;
  onIrParaConversas?: () => void;
  onIrParaAutomacao?: () => void;
}

export function WaRelatorios({
  onIrParaNumeros,
  onIrParaCampanhas,
  onIrParaConversas,
  onIrParaAutomacao,
}: WaRelatoriosProps) {
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState<WaRelatoriosData | null>(null);

  // Filtros de Relatório
  const [periodo, setPeriodo] = useState("01/03/2024 - 30/03/2024");
  const [numeroId, setNumeroId] = useState("todos");
  const [tipoOrigem, setTipoOrigem] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [statusConversa, setStatusConversa] = useState("todos");

  // Estado para modais de detalhe ("Ver todos")
  const [modalAtivo, setModalAtivo] = useState<
    "distribuicao" | "numeros" | "tipos" | "palavras" | "leads" | "vendas" | "atividades" | null
  >(null);

  // Tooltip interativo do gráfico geral
  const [pontoHover, setPontoHover] = useState<WaDesempenhoPonto | null>(null);

  // Carregamento de dados com tenancy
  const carregarDados = useCallback(async (filtrosAplicados?: Partial<WaRelatoriosFiltros>) => {
    setCarregando(true);
    try {
      const res = await obterDadosRelatoriosWa(filtrosAplicados);
      setDados(res);
    } catch {
      toast.error("Erro ao carregar dados de relatórios. Exibindo modo de segurança.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const aplicarFiltros = () => {
    carregarDados({
      periodo,
      numeroId,
      tipoOrigem,
      categoria,
      statusConversa,
    });
    toast.success("Filtros aplicados com sucesso aos relatórios!");
  };

  if (carregando && !dados) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-3 text-home-muted">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Carregando métricas e inteligência do WhatsApp...</p>
      </div>
    );
  }

  const kpis = dados?.kpis;
  const desempenhoGeral = dados?.desempenhoGeral || [];
  const distribuicaoCanal = dados?.distribuicaoCanal || [];
  const desempenhoNumeros = dados?.desempenhoNumeros || [];
  const tiposConversas = dados?.tiposConversas || [];
  const statusConversas = dados?.statusConversas || [];
  const palavrasChave = dados?.palavrasChave || [];
  const leadsPorDia = dados?.leadsPorDia || [];
  const conversoesVendas = dados?.conversoesVendas || [];
  const atividades = dados?.atividades || [];

  return (
    <div className="w-full space-y-4 text-white animate-in fade-in duration-200">
      {/* =========================================================================
          ETAPA 4: LINHA DOS CINCO KPIS SUPERIORES (FIDELIDADE 1:1)
          ========================================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {/* KPI 1: Mensagens enviadas */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520]/95 p-4.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.enviadasTrend ?? "—"}
            </span>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {(kpis?.mensagensEnviadas ?? 0).toLocaleString("pt-BR")}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Mensagens enviadas</p>
          </div>
        </div>

        {/* KPI 2: Entregues */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520]/95 p-4.5 shadow-sm transition-all hover:border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCheck className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.taxaEntrega ?? "Dados insuficientes"}
            </span>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {(kpis?.entregues ?? 0).toLocaleString("pt-BR")}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Entregues</p>
          </div>
        </div>

        {/* KPI 3: Respostas */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520]/95 p-4.5 shadow-sm transition-all hover:border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Inbox className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">
                {kpis?.taxaResposta ?? "0%"}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                {kpis?.respostasTrend ?? "—"}
              </span>
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {(kpis?.respostas ?? 0).toLocaleString("pt-BR")}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Respostas</p>
          </div>
        </div>

        {/* KPI 4: Leads gerados */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520]/95 p-4.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.leadsTrend ?? "—"}
            </span>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {(kpis?.leadsGerados ?? 0).toLocaleString("pt-BR")}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Leads gerados</p>
          </div>
        </div>

        {/* KPI 5: Vendas atribuídas */}
        <div className="col-span-2 group relative overflow-hidden rounded-2xl border border-white/5 bg-[#101520]/95 p-4.5 shadow-sm transition-all hover:border-orange-500/30 md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              {kpis?.vendasTrend ?? "—"}
            </span>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              R$ {(kpis?.vendasAtribuidas ?? 0).toLocaleString("pt-BR")}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Vendas atribuídas</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          GRID PRINCIPAL: COLUNAS ESQUERDA (9 COLS) + SIDEBAR DIREITA (3 COLS)
          ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* COLUNA ESQUERDA (LARGURA 9 COLS NO DESKTOP) */}
        <div className="space-y-4 lg:col-span-9">
          {/* LINHA 2: VISÃO GERAL DO DESEMPENHO + DISTRIBUIÇÃO POR CANAL */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* CARD: Visão geral do desempenho (7 cols) */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm md:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
                      <SiWhatsapp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Visão geral do desempenho</h3>
                      <p className="text-xs text-slate-400">
                        Evolução das mensagens, entregas, respostas e leads gerados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#161c28] px-2.5 py-1 text-xs font-medium text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    <span>Últimos 30 dias</span>
                    <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
                  </div>
                </div>

                {/* Gráfico de 4 Linhas com SVG Suave */}
                <div className="relative mt-5 h-48 w-full">
                  {/* Linhas de grade e ticks do eixo Y */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-semibold text-slate-500">
                    <div className="flex items-center w-full">
                      <span className="w-9 shrink-0 text-right pr-2">2.000</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-9 shrink-0 text-right pr-2">1.500</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-9 shrink-0 text-right pr-2">1.000</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-9 shrink-0 text-right pr-2">500</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-9 shrink-0 text-right pr-2">0</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                  </div>

                  {/* SVG das 4 curvas vetoriais */}
                  <div className="absolute inset-0 pl-9">
                    <svg
                      className="h-full w-full overflow-visible"
                      viewBox="0 0 700 160"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="grad-enviadas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Linha 1: Enviadas (Verde) */}
                      <path
                        d="M 20 120 C 120 85, 180 50, 240 45 C 320 60, 380 30, 460 25 C 540 45, 600 30, 680 20"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {/* Pontos da linha verde */}
                      {[
                        { cx: 20, cy: 120 },
                        { cx: 130, cy: 85 },
                        { cx: 240, cy: 45 },
                        { cx: 350, cy: 55 },
                        { cx: 460, cy: 25 },
                        { cx: 570, cy: 40 },
                        { cx: 680, cy: 20 },
                      ].map((p, idx) => (
                        <circle
                          key={`env-${idx}`}
                          cx={p.cx}
                          cy={p.cy}
                          r="4"
                          className="fill-[#22c55e] stroke-[#101520] stroke-2 hover:r-5 transition-all cursor-pointer"
                          onMouseEnter={() => setPontoHover(desempenhoGeral[idx])}
                          onMouseLeave={() => setPontoHover(null)}
                        />
                      ))}

                      {/* Linha 2: Entregues (Azul) */}
                      <path
                        d="M 20 125 C 120 95, 180 60, 240 55 C 320 70, 380 45, 460 40 C 540 55, 600 45, 680 30"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {[
                        { cx: 20, cy: 125 },
                        { cx: 130, cy: 95 },
                        { cx: 240, cy: 55 },
                        { cx: 350, cy: 68 },
                        { cx: 460, cy: 40 },
                        { cx: 570, cy: 50 },
                        { cx: 680, cy: 30 },
                      ].map((p, idx) => (
                        <circle
                          key={`ent-${idx}`}
                          cx={p.cx}
                          cy={p.cy}
                          r="4"
                          className="fill-[#3b82f6] stroke-[#101520] stroke-2 hover:r-5 transition-all cursor-pointer"
                          onMouseEnter={() => setPontoHover(desempenhoGeral[idx])}
                          onMouseLeave={() => setPontoHover(null)}
                        />
                      ))}

                      {/* Linha 3: Respostas (Roxo) */}
                      <path
                        d="M 20 145 C 120 135, 180 120, 240 120 C 320 125, 380 115, 460 110 C 540 115, 600 110, 680 100"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {[
                        { cx: 20, cy: 145 },
                        { cx: 130, cy: 135 },
                        { cx: 240, cy: 120 },
                        { cx: 350, cy: 124 },
                        { cx: 460, cy: 110 },
                        { cx: 570, cy: 114 },
                        { cx: 680, cy: 100 },
                      ].map((p, idx) => (
                        <circle
                          key={`resp-${idx}`}
                          cx={p.cx}
                          cy={p.cy}
                          r="4"
                          className="fill-[#a855f7] stroke-[#101520] stroke-2 hover:r-5 transition-all cursor-pointer"
                          onMouseEnter={() => setPontoHover(desempenhoGeral[idx])}
                          onMouseLeave={() => setPontoHover(null)}
                        />
                      ))}

                      {/* Linha 4: Leads (Laranja) */}
                      <path
                        d="M 20 155 C 120 150, 180 148, 240 145 C 320 148, 380 142, 460 138 C 540 142, 600 138, 680 132"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {[
                        { cx: 20, cy: 155 },
                        { cx: 130, cy: 150 },
                        { cx: 240, cy: 145 },
                        { cx: 350, cy: 147 },
                        { cx: 460, cy: 138 },
                        { cx: 570, cy: 140 },
                        { cx: 680, cy: 132 },
                      ].map((p, idx) => (
                        <circle
                          key={`lead-${idx}`}
                          cx={p.cx}
                          cy={p.cy}
                          r="4"
                          className="fill-[#f97316] stroke-[#101520] stroke-2 hover:r-5 transition-all cursor-pointer"
                          onMouseEnter={() => setPontoHover(desempenhoGeral[idx])}
                          onMouseLeave={() => setPontoHover(null)}
                        />
                      ))}
                    </svg>

                    {/* Tooltip do ponto ativo */}
                    {pontoHover && (
                      <div className="absolute top-2 right-2 rounded-xl border border-white/10 bg-[#161c28]/95 p-2 text-xs shadow-2xl backdrop-blur-md">
                        <span className="font-bold text-white">{pontoHover.label}</span>
                        <div className="mt-1 space-y-0.5 text-[11px]">
                          <div className="text-emerald-400">Enviadas: {pontoHover.enviadas}</div>
                          <div className="text-blue-400">Entregues: {pontoHover.entregues}</div>
                          <div className="text-purple-400">Respostas: {pontoHover.respostas}</div>
                          <div className="text-orange-400">Leads: {pontoHover.leads}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Eixo X com as 7 datas de referência */}
                <div className="mt-2 flex justify-between pl-9 text-[11px] font-medium text-slate-500">
                  <span>01/03</span>
                  <span>05/03</span>
                  <span>10/03</span>
                  <span>15/03</span>
                  <span>20/03</span>
                  <span>25/03</span>
                  <span>30/03</span>
                </div>
              </div>

              {/* Legenda inferior do gráfico */}
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/5 pt-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                  <span>Enviadas</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                  <span>Entregues</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" />
                  <span>Respostas</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
                  <span>Leads</span>
                </div>
              </div>
            </div>

            {/* CARD: Distribuição por canal (5 cols) */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm md:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Distribuição por canal</h3>
                      <p className="text-xs text-slate-400">Origem das conversas e resultados</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAtivo("distribuicao")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Ver detalhes
                  </button>
                </div>

                {/* Conteúdo Donut + Legenda */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Gráfico Donut Circular com Centro 2.184 */}
                  <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      {/* Segmentos Circulares: Campanhas 38%, Conversas 26%, Automações 18%, Indicação 10%, Outros 8% */}
                      {/* 1. Campanhas: 38% -> strokeDasharray="38 62" */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="14"
                        strokeDasharray="38 62"
                        strokeDashoffset="0"
                      />
                      {/* 2. Conversas: 26% -> strokeDasharray="26 74" */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="14"
                        strokeDasharray="26 74"
                        strokeDashoffset="-38"
                      />
                      {/* 3. Automações: 18% -> strokeDasharray="18 82" */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#a855f7"
                        strokeWidth="14"
                        strokeDasharray="18 82"
                        strokeDashoffset="-64"
                      />
                      {/* 4. Indicação: 10% -> strokeDasharray="10 90" */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#f97316"
                        strokeWidth="14"
                        strokeDasharray="10 90"
                        strokeDashoffset="-82"
                      />
                      {/* 5. Outros: 8% -> strokeDasharray="8 92" */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#06b6d4"
                        strokeWidth="14"
                        strokeDasharray="8 92"
                        strokeDashoffset="-92"
                      />
                    </svg>

                    {/* Texto Central */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-white">
                        {distribuicaoCanal
                          .reduce((total, item) => total + item.quantidade, 0)
                          .toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">respostas</span>
                    </div>
                  </div>

                  {/* Lista de Legendas com Porcentagem e Quantidade */}
                  <div className="w-full space-y-2">
                    {distribuicaoCanal.map((canal) => (
                      <div key={canal.canal} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: canal.cor }}
                          />
                          <span className="font-medium text-slate-300">{canal.canal}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{canal.percentual}%</span>
                          <span className="w-8 text-right font-medium text-slate-400">
                            {canal.quantidade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-white/5 pt-2 text-[11px] text-slate-400 text-center">
                38% do volume originado por campanhas ativas
              </div>
            </div>
          </div>

          {/* LINHA 3: DESEMPENHO POR NÚMERO (6 COLS) + TIPOS DE CONVERSAS (3 COLS) + STATUS DAS CONVERSAS (3 COLS) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* CARD: Desempenho por número (6 cols) */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm md:col-span-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Desempenho por número</h3>
                      <p className="text-xs text-slate-400">
                        Compare o resultado de cada chip conectado
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAtivo("numeros")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Ver todos
                  </button>
                </div>

                {/* Tabela de Números */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-[11px] font-semibold text-slate-400">
                        <th className="pb-2 font-normal">Número / Instância</th>
                        <th className="pb-2 font-normal text-right">Enviadas</th>
                        <th className="pb-2 font-normal text-right">Entregues</th>
                        <th className="pb-2 font-normal text-right">Respostas</th>
                        <th className="pb-2 font-normal text-right">Leads</th>
                        <th className="pb-2 font-normal text-right">Taxa de resp.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {desempenhoNumeros.slice(0, 5).map((num) => (
                        <tr key={num.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${num.cor}18`, color: num.cor }}
                              >
                                <SiWhatsapp className="h-4 w-4" />
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-white truncate max-w-[110px]">
                                  {num.nome}
                                </p>
                                <p className="text-[10px] text-slate-400">{num.numero}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-right font-medium text-slate-300">
                            {num.enviadas.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2.5 text-right font-medium text-slate-300">
                            {num.entregues.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2.5 text-right font-medium text-slate-300">
                            {num.respostas.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2.5 text-right font-bold text-white">
                            {num.leads.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, num.taxaResposta * 3.5)}%`,
                                    backgroundColor: num.cor,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CARD: Tipos de conversas (3 cols) */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm md:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <MessagesSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Tipos de conversas</h3>
                      <p className="text-xs text-slate-400">Distribuição por tipo de atendimento</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAtivo("tipos")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Ver todos
                  </button>
                </div>

                {/* Lista de Barras de Progresso Horizontais */}
                <div className="mt-4 space-y-3">
                  {tiposConversas.map((tipo) => (
                    <div key={tipo.tipo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tipo.cor }}
                          />
                          <span className="font-medium text-slate-300">{tipo.tipo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{tipo.percentual}%</span>
                          <span className="text-[11px] text-slate-400">
                            {tipo.quantidade.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${tipo.percentual}%`,
                            backgroundColor: tipo.corBarra,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD: Status das conversas (3 cols) */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm md:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Status das conversas</h3>
                    <p className="text-xs text-slate-400">Situação atual dos atendimentos</p>
                  </div>
                </div>

                {/* Donut Chart 1.428 conversas */}
                <div className="mt-4 flex flex-col items-center justify-center">
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      {/* Em atendimento: 38% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="14"
                        strokeDasharray="38 62"
                        strokeDashoffset="0"
                      />
                      {/* Aguardando resposta: 32% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="14"
                        strokeDasharray="32 68"
                        strokeDashoffset="-38"
                      />
                      {/* Concluídas: 20% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#a855f7"
                        strokeWidth="14"
                        strokeDasharray="20 80"
                        strokeDashoffset="-70"
                      />
                      {/* Arquivadas: 10% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#64748b"
                        strokeWidth="14"
                        strokeDasharray="10 90"
                        strokeDashoffset="-90"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-black text-white">1.428</span>
                      <span className="text-[10px] font-medium text-slate-400">conversas</span>
                    </div>
                  </div>

                  {/* Legenda em 2 colunas abaixo */}
                  <div className="mt-3 w-full space-y-1.5 text-xs">
                    {statusConversas.map((st) => (
                      <div key={st.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: st.cor }}
                          />
                          <span className="text-slate-300 text-[11px]">{st.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-[11px]">{st.percentual}%</span>
                          <span className="text-[10px] text-slate-400">{st.quantidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LINHA 4: PALAVRAS-CHAVE (3 COLS) + LEADS POR DIA (3 COLS) + CONVERSÕES EM VENDAS (3 COLS) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* CARD: Principais palavras-chave */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Principais palavras-chave</h3>
                      <p className="text-xs text-slate-400">
                        Termos mais mencionados nas conversas
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAtivo("palavras")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>

                {/* Ranking de 1 a 5 com badges laranja */}
                <div className="mt-4 space-y-2.5">
                  {palavrasChave.map((palavra) => (
                    <div
                      key={palavra.ranking}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-[90px]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200] text-[10px] font-black text-white shrink-0">
                          {palavra.ranking}
                        </span>
                        <span className="font-medium text-slate-200">{palavra.palavra}</span>
                      </div>

                      {/* Barra laranja central */}
                      <div className="h-2 w-16 sm:w-20 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ff6200]"
                          style={{ width: `${Math.min(100, palavra.percentual * 7)}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{palavra.frequencia}</span>
                        <span className="w-7 text-right text-[11px] text-slate-400">
                          {palavra.percentual}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD: Leads gerados por dia */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Leads gerados por dia</h3>
                      <p className="text-xs text-slate-400">Evolução de novos leads via WhatsApp</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAtivo("leads")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Ver todos
                  </button>
                </div>

                {/* Gráfico de Barras Verticais Verdes */}
                <div className="relative mt-4 h-36 w-full">
                  {/* Linhas de grade e ticks do eixo Y */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-semibold text-slate-500">
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">50</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">40</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">30</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">20</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">10</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">0</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                  </div>

                  {/* Barras Verdes */}
                  <div className="absolute inset-0 pl-6 flex items-end justify-between gap-1 pt-2 pb-1">
                    {leadsPorDia.map((p, idx) => (
                      <div
                        key={idx}
                        className="group/bar relative flex-1 h-full flex items-end justify-center"
                        title={`${p.label}: ${p.leads} leads`}
                      >
                        <div
                          className="w-full max-w-[8px] rounded-t-sm bg-[#22c55e] hover:bg-[#16a34a] transition-all cursor-pointer"
                          style={{ height: `${Math.min(100, (p.leads / 50) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eixo X com as 7 datas de referência */}
                <div className="mt-1 flex justify-between pl-6 text-[10px] font-medium text-slate-500">
                  <span>01/03</span>
                  <span>05/03</span>
                  <span>10/03</span>
                  <span>15/03</span>
                  <span>20/03</span>
                  <span>25/03</span>
                  <span>30/03</span>
                </div>
              </div>
            </div>

            {/* CARD: Conversões em vendas */}
            <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Conversões em vendas</h3>
                      <p className="text-xs text-slate-400">Faturamento atribuído ao WhatsApp</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAtivo("vendas")}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>

                {/* Header com Valor R$ 18.450 e Badge +34% */}
                <div className="mt-2.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-white">
                      R$ {(kpis?.vendasAtribuidas ?? 0).toLocaleString("pt-BR")}
                    </span>
                    <span className="ml-1.5 text-[11px] text-slate-400">Vendas atribuídas</span>
                  </div>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    +34% ↗
                  </span>
                </div>

                {/* Gráfico de Barras Laranjas */}
                <div className="relative mt-2 h-28 w-full">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-semibold text-slate-500">
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">3K</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">2K</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">1K</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                    <div className="flex items-center w-full">
                      <span className="w-6 shrink-0 text-right pr-1">0</span>
                      <div className="h-px w-full bg-white/5" />
                    </div>
                  </div>

                  <div className="absolute inset-0 pl-6 flex items-end justify-between gap-1 pt-2 pb-1">
                    {conversoesVendas.map((p, idx) => (
                      <div
                        key={idx}
                        className="group/bar relative flex-1 h-full flex items-end justify-center"
                        title={`${p.label}: R$ ${p.valor}`}
                      >
                        <div
                          className="w-full max-w-[8px] rounded-t-sm bg-[#ff6200] hover:bg-[#ea580c] transition-all cursor-pointer"
                          style={{ height: `${Math.min(100, (p.valor / 3000) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eixo X com as 7 datas de referência */}
                <div className="mt-1 flex justify-between pl-6 text-[10px] font-medium text-slate-500">
                  <span>01/03</span>
                  <span>05/03</span>
                  <span>10/03</span>
                  <span>15/03</span>
                  <span>20/03</span>
                  <span>25/03</span>
                  <span>30/03</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUNA DIREITA (3 COLS NO DESKTOP): FILTROS + ATIVIDADE RECENTE
            ======================================================================= */}
        <div className="space-y-4 lg:col-span-3">
          {/* CARD: Filtros de relatório (Fidelidade 1:1 ao Layout Aprovado) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Filter className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Filtros de relatório</h3>
            </div>

            {/* Campos de Filtro */}
            <div className="space-y-3 text-xs">
              {/* Campo 1: Período */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Período</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#161c28] pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#ff6200] focus:outline-none"
                  />
                </div>
              </div>

              {/* Campo 2: Número / Instância */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Número / Instância</label>
                <div className="relative">
                  <select
                    value={numeroId}
                    onChange={(e) => setNumeroId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs font-semibold text-white focus:border-[#ff6200] focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todos os números</option>
                    {desempenhoNumeros.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.nome} ({n.numero})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Campo 3: Tipo de origem */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Tipo de origem</label>
                <div className="relative">
                  <select
                    value={tipoOrigem}
                    onChange={(e) => setTipoOrigem(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs font-semibold text-white focus:border-[#ff6200] focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todos os tipos</option>
                    <option value="campanhas">Campanhas</option>
                    <option value="conversas">Conversas</option>
                    <option value="automacoes">Automações</option>
                    <option value="indicacao">Indicação</option>
                    <option value="outros">Outros</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Campo 4: Categoria */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Categoria</label>
                <div className="relative">
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs font-semibold text-white focus:border-[#ff6200] focus:outline-none cursor-pointer"
                  >
                    <option value="todas">Todas as categorias</option>
                    <option value="prospeccao">Prospecção</option>
                    <option value="followup">Follow-up</option>
                    <option value="qualificacao">Qualificação</option>
                    <option value="suporte">Suporte</option>
                    <option value="agendamento">Agendamento</option>
                    <option value="recuperacao">Recuperação</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Campo 5: Status da conversa */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-300">Status da conversa</label>
                <div className="relative">
                  <select
                    value={statusConversa}
                    onChange={(e) => setStatusConversa(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-[#161c28] px-3 py-2 text-xs font-semibold text-white focus:border-[#ff6200] focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="em_atendimento">Em atendimento</option>
                    <option value="aguardando_resposta">Aguardando resposta</option>
                    <option value="concluidas">Concluídas</option>
                    <option value="arquivadas">Arquivadas</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Botão Laranja: Aplicar filtros */}
              <button
                type="button"
                onClick={aplicarFiltros}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff6200] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#e05600] active:scale-[0.98]"
              >
                <span>Aplicar filtros</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CARD: Atividade recente (Fidelidade 1:1 ao Layout Aprovado) */}
          <div className="rounded-2xl border border-white/5 bg-[#101520]/95 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Atividade recente</h3>
                  <p className="text-xs text-slate-400">Últimas ações e eventos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAtivo("atividades")}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver todas
              </button>
            </div>

            {/* Lista dos 6 eventos reais com ícones e horários */}
            <div className="space-y-3">
              {atividades.map((atv) => (
                <div key={atv.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${atv.cor}18`, color: atv.cor }}
                    >
                      {atv.tipo === "lead" && <UserCheck className="h-3.5 w-3.5" />}
                      {atv.tipo === "venda" && <DollarSign className="h-3.5 w-3.5" />}
                      {atv.tipo === "resposta" && <Inbox className="h-3.5 w-3.5" />}
                      {atv.tipo === "concluida" && <Check className="h-3.5 w-3.5" />}
                      {atv.tipo === "automacao" && <Zap className="h-3.5 w-3.5" />}
                      {atv.tipo === "falha" && <AlertTriangle className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-white">{atv.titulo}</p>
                      <p className="text-[11px] text-slate-400">{atv.subtitulo}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">
                    {atv.horario}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE DETALHES GLOBAIS ("VER TODOS" / "VER DETALHES")
          ========================================================================= */}
      {modalAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101520] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white">
                {modalAtivo === "distribuicao" && "Detalhamento: Distribuição por Canal"}
                {modalAtivo === "numeros" && "Todos os Chips e Instâncias Conectadas"}
                {modalAtivo === "tipos" && "Detalhamento: Tipos de Conversas"}
                {modalAtivo === "palavras" && "Ranking Completo: Palavras-Chave"}
                {modalAtivo === "leads" && "Histórico Diário de Novos Leads"}
                {modalAtivo === "vendas" && "Faturamento Atribuído Detalhado"}
                {modalAtivo === "atividades" && "Registro Completo de Atividades Recentes"}
              </h3>
              <button
                type="button"
                onClick={() => setModalAtivo(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 text-xs text-slate-300 pr-2">
              {modalAtivo === "distribuicao" && (
                <div className="space-y-2">
                  {distribuicaoCanal.map((c) => (
                    <div
                      key={c.canal}
                      className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02]"
                    >
                      <span className="font-semibold text-white">{c.canal}</span>
                      <span>
                        {c.percentual}% ({c.quantidade} conversas)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {modalAtivo === "numeros" && (
                <div className="space-y-2">
                  {desempenhoNumeros.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-lg bg-white/[0.02] flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-white">{n.nome}</p>
                        <p className="text-slate-400 text-[11px]">{n.numero}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{n.leads} leads gerados</p>
                        <p className="text-slate-400 text-[11px]">
                          {n.enviadas} enviadas | {n.respostas} respostas (
                          {n.taxaResposta.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalAtivo === "tipos" && (
                <div className="space-y-2">
                  {tiposConversas.map((t) => (
                    <div
                      key={t.tipo}
                      className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02]"
                    >
                      <span className="font-semibold text-white">{t.tipo}</span>
                      <span>
                        {t.percentual}% ({t.quantidade.toLocaleString("pt-BR")} conversas)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {modalAtivo === "palavras" && (
                <div className="space-y-2">
                  {palavrasChave.map((p) => (
                    <div
                      key={p.ranking}
                      className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02]"
                    >
                      <span className="font-bold text-white">
                        #{p.ranking} {p.palavra}
                      </span>
                      <span>
                        {p.frequencia} menções ({p.percentual}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {modalAtivo === "leads" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {leadsPorDia.map((l) => (
                    <div
                      key={l.data}
                      className="p-2 rounded-lg bg-white/[0.02] flex justify-between items-center"
                    >
                      <span className="text-slate-400">{l.label}</span>
                      <span className="font-bold text-emerald-400">+{l.leads} leads</span>
                    </div>
                  ))}
                </div>
              )}

              {modalAtivo === "vendas" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {conversoesVendas.map((v) => (
                    <div
                      key={v.data}
                      className="p-2 rounded-lg bg-white/[0.02] flex justify-between items-center"
                    >
                      <span className="text-slate-400">{v.label}</span>
                      <span className="font-bold text-orange-400">R$ {v.valor}</span>
                    </div>
                  ))}
                </div>
              )}

              {modalAtivo === "atividades" && (
                <div className="space-y-2">
                  {atividades.map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-lg bg-white/[0.02] flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-white">{a.titulo}</p>
                        <p className="text-[11px] text-slate-400">{a.subtitulo}</p>
                      </div>
                      <span className="text-slate-400 font-semibold">{a.horario}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalAtivo(null)}
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
