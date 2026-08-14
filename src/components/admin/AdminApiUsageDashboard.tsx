import { Fragment, useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  DollarSign,
  Activity,
  Zap,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Search,
  ShieldAlert,
  Server,
  PieChart as PieChartIcon,
  Users,
  Download,
  AlertTriangle,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { obterResumoConsumoApi, type ApiUsageResumo } from "@/services/api-consumption";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const SERVICE_LABELS: Record<string, { label: string; badgeClass: string; color: string }> = {
  apify_maps: {
    label: "Apify (Google Maps Extractor)",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    color: "#3b82f6", // blue-500
  },
  openai_enrichment: {
    label: "OpenAI (GPT-4o Site Enrichment)",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    color: "#a855f7", // purple-500
  },
  whatsapp_evolution: {
    label: "Evolution API (WhatsApp Disparos)",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
    color: "#22c55e", // green-500
  },
  google_places: {
    label: "Google Places API Direct",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    color: "#f59e0b", // amber-500
  },
  osm_free: {
    label: "OpenStreetMap (sem custo)",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    color: "#64748b", // slate-500
  },
  geoapify_free: {
    label: "Geoapify (franquia gratuita)",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    color: "#06b6d4", // cyan-500
  },
};

const PLAN_BADGES: Record<string, string> = {
  starter: "bg-slate-100 text-slate-700 border-slate-200",
  basico: "bg-slate-100 text-slate-700 border-slate-200",
  pro: "bg-primary/10 text-primary border-primary/20 font-semibold",
  agencia: "bg-gold/15 text-navy font-bold border-gold/40",
  enterprise: "bg-gold/15 text-navy font-bold border-gold/40",
  "super admin": "bg-blue-100 text-blue-800 border-blue-200 font-bold",
  "sem plano": "bg-slate-100 text-slate-700 border-slate-200",
};

export function AdminApiUsageDashboard() {
  const [resumo, setResumo] = useState<ApiUsageResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dias, setDias] = useState(30);
  const [busca, setBusca] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const carregarDados = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErro(null);
    setResumo(null);
    try {
      const data = await obterResumoConsumoApi(dias);
      if (requestId === requestIdRef.current) setResumo(data);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      setErro(message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [dias]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const topUsersFiltrados = useMemo(() => {
    return (
      resumo?.top_users.filter((u) => {
        if (!busca.trim()) return true;
        const b = busca.toLowerCase();
        return u.user_name.toLowerCase().includes(b) || u.user_email.toLowerCase().includes(b);
      }) ?? []
    );
  }, [resumo, busca]);

  // Chart Data Preparation
  const providerData = useMemo(() => {
    if (!resumo?.service_breakdown) return [];
    return resumo.service_breakdown
      .filter((s) => s.cost_usd > 0)
      .map((s) => ({
        name: SERVICE_LABELS[s.service]?.label || s.service,
        value: Number(s.cost_usd.toFixed(2)),
        color: SERVICE_LABELS[s.service]?.color || "#cbd5e1",
      }));
  }, [resumo]);

  const topClientsData = useMemo(() => {
    if (!resumo?.top_users) return [];
    return [...resumo.top_users]
      .sort((a, b) => b.total_cost_usd - a.total_cost_usd)
      .slice(0, 5)
      .filter((u) => u.total_cost_usd > 0)
      .map((u) => ({
        name: u.user_name.split(" ")[0],
        cost: Number(u.total_cost_usd.toFixed(2)),
      }));
  }, [resumo]);

  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const usd = (v: number) =>
    v.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });

  const usoApify = resumo?.apify_account.usage_usd ?? 0;
  const limiteApify = resumo?.apify_account.limit_usd ?? 0;
  const saldoApify = resumo?.apify_account.remaining_usd ?? 0;
  const creditosIncluidosApify = resumo?.apify_account.included_credits_usd ?? 0;
  const saldoCreditosIncluidosApify = resumo?.apify_account.included_credits_remaining_usd ?? 0;
  const contasApify = resumo?.apify_account.accounts ?? [];
  const leituraFinanceiraDisponivel =
    resumo?.apify_account.financial_complete === true &&
    contasApify.length > 0 &&
    [
      resumo?.apify_account.usage_usd,
      resumo?.apify_account.limit_usd,
      resumo?.apify_account.remaining_usd,
      resumo?.apify_account.included_credits_usd,
      resumo?.apify_account.included_credits_remaining_usd,
    ].every((value) => typeof value === "number" && Number.isFinite(value));
  const totalTokensApify = contasApify.reduce((total, conta) => total + conta.token_count, 0);
  const custoPeriodo = resumo?.total_cost_usd ?? 0;
  const maiorConsumidor = resumo?.top_users.find((user) => user.total_cost_usd > 0);

  const percentageApify =
    limiteApify > 0 ? Math.min(100, Math.max(0, (usoApify / limiteApify) * 100)) : 0;

  // Função para exportar relatório financeiro em CSV
  const exportarCSV = () => {
    if (!resumo?.top_users) return;
    const headers = [
      "Cliente",
      "Email",
      "Plano",
      "Leads Gerados no Período",
      "Leads Apify no Período",
      "Uso no Mês",
      "Limite Mensal",
      "Runs API",
      "Itens Apify Cobrados",
      "Custo USD",
      "Custo BRL",
      "Receita Proporcional ao Período BRL",
      "Margem Estimada no Período BRL",
    ];

    const rows = resumo.top_users.map((u) => {
      const receitaBrl = u.monthly_revenue_brl * (dias / 30);
      const margemBrl = receitaBrl - u.total_cost_brl;
      return [
        `"${u.user_name}"`,
        `"${u.user_email}"`,
        `"${u.plan}"`,
        u.leads_generated_period,
        u.apify_leads_generated_period,
        u.leads_used,
        u.monthly_limit ?? "Ilimitado",
        u.requests_count,
        u.items_charged,
        u.total_cost_usd.toFixed(4),
        u.total_cost_brl.toFixed(2),
        receitaBrl.toFixed(2),
        margemBrl.toFixed(2),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_api_${dias}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Análise Financeira & API
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dashboard consolidado de custos de infraestrutura e margem operacional por cliente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="h-10 rounded-xl border border-border/50 bg-secondary/50 px-4 text-sm font-semibold shadow-xs focus:border-primary focus:outline-none transition-all hover:bg-secondary"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={365}>Últimos 12 meses</option>
          </select>

          <button
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="flex gap-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-destructive"
        >
          <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="text-sm font-bold">Não foi possível atualizar o consumo</p>
            <p className="text-sm mt-1">{erro}</p>
          </div>
        </div>
      )}

      {/* API Health Banner */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Status Financeiro Apify (Ao Vivo)</h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">Sincronizando…</p>
              ) : leituraFinanceiraDisponivel ? (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Uso no ciclo: <strong className="text-foreground">{usd(usoApify)}</strong> de{" "}
                  {usd(limiteApify)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Leitura financeira parcial/indisponível
                </p>
              )}
            </div>
          </div>

          {leituraFinanceiraDisponivel && (
            <div className="flex-1 w-full md:max-w-md">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span
                  className={percentageApify > 80 ? "text-destructive" : "text-muted-foreground"}
                >
                  {percentageApify.toFixed(1)}% utilizado
                </span>
                <span className="text-muted-foreground">Disponível: {usd(saldoApify)}</span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    percentageApify > 90
                      ? "bg-destructive"
                      : percentageApify > 75
                        ? "bg-amber-500"
                        : "bg-emerald-500",
                  )}
                  style={{ width: `${percentageApify}%` }}
                />
              </div>
              {limiteApify > creditosIncluidosApify + 0.01 && (
                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                  *Teto permite excedente (Risco de cobrança)
                </p>
              )}
            </div>
          )}
        </div>
        {resumo?.apify_account.sync_error && (
          <p className="mt-4 text-xs font-medium text-amber-600 bg-amber-500/10 p-2 rounded-lg inline-block">
            Atenção: {resumo.apify_account.sync_error}
          </p>
        )}
      </div>

      {/* Cards KPI Premium */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-24 w-24 text-emerald-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Custo do Período
              </p>
              <p className="text-3xl font-black text-foreground mt-1">
                {loading ? "..." : usd(custoPeriodo)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-medium text-muted-foreground relative z-10">
            Livro-caixa dos últimos {dias} dias
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-500/30 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="h-24 w-24 text-blue-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 shadow-inner">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Itens Processados
              </p>
              <p className="text-3xl font-black text-foreground mt-1">
                {loading ? "..." : (resumo?.total_leads_crawled ?? 0).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-medium text-muted-foreground relative z-10">
            Processados na API no período
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-500/30 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="h-24 w-24 text-purple-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 shadow-inner">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Runs Registrados
              </p>
              <p className="text-3xl font-black text-foreground mt-1">
                {loading ? "..." : (resumo?.total_requests ?? 0).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-medium text-muted-foreground relative z-10">
            Quantidade de chamadas efetuadas
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-24 w-24 text-amber-500" />
          </div>
          <div className="flex flex-col justify-between h-full relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 shadow-inner">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Top Consumidor
              </p>
            </div>
            <div className="mt-3">
              <p className="truncate text-lg font-black text-foreground">
                {loading ? "..." : maiorConsumidor?.user_name || "Nenhum no período"}
              </p>
              <p className="mt-1 text-sm font-bold text-amber-600">
                {loading
                  ? "..."
                  : maiorConsumidor
                    ? usd(maiorConsumidor.total_cost_usd)
                    : "US$ 0,00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Provedores */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-bold text-foreground">Distribuição por Provedor</h3>
          </div>
          <div className="h-[280px] w-full flex-1">
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => usd(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem dados suficientes no período.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Top Clientes */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-bold text-foreground">Top 5 Clientes (Custo US$)</h3>
          </div>
          <div className="h-[280px] w-full flex-1">
            {loading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : topClientsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topClientsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    formatter={(value: number) => usd(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="cost"
                    name="Custo API"
                    fill="#0f172a"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Nenhum consumo registrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {(resumo?.unattributed_cost_usd ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">
            Consumo legado sem usuário identificado: {usd(resumo?.unattributed_cost_usd ?? 0)}
          </p>
          <p className="mt-1 text-xs">
            A Apify confirmou esse custo e o run está no livro-caixa, mas a execução antiga não
            gravou qual usuário iniciou a busca. O valor permanece separado para não atribuir gasto
            à pessoa errada.
          </p>
        </div>
      )}

      {/* Tabela de Consumo por Cliente (Redesign) */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between border-b bg-muted/20">
          <div>
            <h3 className="text-lg font-bold text-foreground">Relatório Detalhado por Cliente</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Visão completa de uso, chamadas e custos atribuidos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente ou e-mail..."
                className="h-10 w-full rounded-xl border border-border/60 bg-background pl-10 pr-4 text-xs focus:border-primary focus:outline-none shadow-xs"
              />
            </div>

            <button
              onClick={exportarCSV}
              disabled={!resumo?.top_users.length}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-emerald-600" /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-bold border-b tracking-wider">
              <tr>
                <th className="px-4 py-4 w-8" />
                <th className="px-6 py-4">Cliente / Conta</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4 text-center">Leads gerados / uso mensal</th>
                <th className="px-6 py-4 text-center">Runs API</th>
                <th className="px-6 py-4 text-center">Itens Apify cobrados</th>
                <th className="px-6 py-4 text-right">Custo Infra (BRL / USD)</th>
                <th className="px-6 py-4 text-right">Margem est. no período</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {topUsersFiltrados.map((u) => {
                const receitaEstBrl = u.monthly_revenue_brl * (dias / 30);
                const margemLiquidaBrl = receitaEstBrl - u.total_cost_brl;
                const altoConsumo = u.total_cost_usd > 10;
                const margemNegativa = receitaEstBrl > 0 && margemLiquidaBrl < 0;
                const isExpanded = expandedUser === u.user_id;

                return (
                  <Fragment key={u.user_id}>
                    <tr
                      onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-4 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground" />
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">
                            {u.user_name}
                          </p>
                          {margemNegativa && (
                            <span
                              title="Custo de API excede a mensalidade do plano"
                              className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive"
                            >
                              <AlertTriangle className="h-3 w-3" /> Prejuízo
                            </span>
                          )}
                          {altoConsumo && !margemNegativa && (
                            <span
                              title="Alto consumo de infraestrutura"
                              className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600"
                            >
                              Alto Consumo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{u.user_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase font-bold shadow-xs",
                            PLAN_BADGES[u.plan.toLowerCase()] || PLAN_BADGES.starter,
                          )}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        <p className="font-bold text-foreground text-sm">
                          {u.leads_generated_period.toLocaleString("pt-BR")}
                          <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                            em {dias}d
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          mês: {u.leads_used.toLocaleString("pt-BR")} /{" "}
                          {u.monthly_limit === null
                            ? "ilimitado"
                            : u.monthly_limit.toLocaleString("pt-BR")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">
                        {u.requests_count}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-foreground">
                        {u.items_charged.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-black text-foreground text-sm">
                          {brl(u.total_cost_brl)}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {usd(u.total_cost_usd)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {receitaEstBrl > 0 ? (
                          <div>
                            <p
                              className={cn(
                                "font-bold text-sm",
                                margemLiquidaBrl >= 0 ? "text-emerald-600" : "text-destructive",
                              )}
                            >
                              {brl(margemLiquidaBrl)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {((margemLiquidaBrl / receitaEstBrl) * 100).toFixed(0)}% margem
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Detalhamento Expansível por Serviço */}
                    {isExpanded && (
                      <tr className="bg-secondary/20 border-b border-border/60">
                        <td colSpan={8} className="px-10 py-4">
                          <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Activity className="h-3.5 w-3.5 text-primary" /> Detalhamento de
                              Consumo de API por Serviço — {u.user_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Valores vindos dos lançamentos reais do livro-caixa no período
                              selecionado.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
                              {u.services.length > 0 ? (
                                u.services.map((service) => {
                                  const serviceInfo = SERVICE_LABELS[service.service];
                                  return (
                                    <div
                                      key={service.service}
                                      className="rounded-lg bg-secondary/50 p-3"
                                    >
                                      <p className="text-[11px] text-muted-foreground font-medium">
                                        {serviceInfo?.label ?? service.service}
                                      </p>
                                      <p className="text-sm font-bold text-foreground mt-0.5">
                                        {service.requests_count.toLocaleString("pt-BR")}{" "}
                                        {service.requests_count === 1 ? "run" : "runs"} ·{" "}
                                        {service.quantity.toLocaleString("pt-BR")} unidades
                                      </p>
                                      <p
                                        className="text-xs font-semibold"
                                        style={{ color: serviceInfo?.color ?? "#64748b" }}
                                      >
                                        {usd(service.cost_usd)} · {brl(service.cost_brl)}
                                      </p>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground sm:col-span-2">
                                  Nenhum lançamento de API atribuído a este usuário no período.
                                </div>
                              )}
                              {receitaEstBrl > 0 && (
                                <div className="rounded-lg bg-secondary/50 p-3">
                                  <p className="text-[11px] text-muted-foreground font-medium">
                                    Receita proporcional ({dias}d)
                                  </p>
                                  <p className="text-sm font-bold text-foreground mt-0.5">
                                    {brl(receitaEstBrl)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    mensalidade: {brl(u.monthly_revenue_brl)}
                                  </p>
                                  <p
                                    className={cn(
                                      "text-xs font-bold",
                                      margemLiquidaBrl >= 0
                                        ? "text-emerald-600"
                                        : "text-destructive",
                                    )}
                                  >
                                    {brl(margemLiquidaBrl)} líquido
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!busca.trim() && (resumo?.unattributed_cost_usd ?? 0) > 0 && (
                <tr className="bg-amber-50/50">
                  <td className="px-4 py-4" />
                  <td className="px-6 py-4 font-medium text-amber-950">
                    <p className="font-bold">Run legado sem usuário</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">—</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">—</td>
                  <td className="px-6 py-4 text-center font-bold text-foreground">
                    {resumo?.unattributed_requests ?? 0}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-foreground">
                    {(resumo?.unattributed_items ?? 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-black text-amber-600 text-base">
                      {usd(resumo?.unattributed_cost_usd ?? 0)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">—</td>
                </tr>
              )}
              {topUsersFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <p>Nenhum cliente encontrado no período.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
