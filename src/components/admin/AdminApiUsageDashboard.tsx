import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  Activity,
  Zap,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { obterResumoConsumoApi, type ApiUsageResumo } from "@/services/api-consumption";
import { cn } from "@/lib/utils";

const SERVICE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  apify_maps: {
    label: "Apify (Google Maps Extractor)",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  openai_enrichment: {
    label: "OpenAI (GPT-4o Site Enrichment)",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  whatsapp_evolution: {
    label: "Evolution API (WhatsApp Disparos)",
    badgeClass: "bg-green-100 text-green-800 border-green-200",
  },
  google_places: {
    label: "Google Places API Direct",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  osm_free: {
    label: "OpenStreetMap (sem custo)",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  geoapify_free: {
    label: "Geoapify (franquia gratuita)",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
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

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await obterResumoConsumoApi(dias);
      setResumo(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      setErro(message);
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const topUsersFiltrados =
    resumo?.top_users.filter((u) => {
      if (!busca.trim()) return true;
      const b = busca.toLowerCase();
      return u.user_name.toLowerCase().includes(b) || u.user_email.toLowerCase().includes(b);
    }) ?? [];

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
  const custoPeriodo = resumo?.total_cost_usd ?? 0;
  const maiorConsumidor = resumo?.top_users.find((user) => user.total_cost_usd > 0);

  return (
    <div className="space-y-6">
      {/* Header & Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Consumo de APIs & Análise Financeira por
            Cliente
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe em tempo real o gasto de infraestrutura de cada conta (Apify, OpenAI,
            WhatsApp) e a margem por cliente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium shadow-xs focus:border-primary focus:outline-none"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={365}>Últimos 12 meses</option>
          </select>

          <button
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted shadow-xs transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Não foi possível atualizar o consumo</p>
            <p className="text-xs">{erro}</p>
          </div>
        </div>
      )}

      {resumo?.apify_account.sync_error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">A leitura ao vivo da Apify ficou incompleta</p>
            <p className="text-xs">{resumo.apify_account.sync_error}</p>
          </div>
        </div>
      )}

      {/* Cards KPI Topo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Custo registrado no período
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : usd(custoPeriodo)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Livro-caixa dos últimos {dias} dias
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Itens cobrados no período
            </span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : (resumo?.total_leads_crawled ?? 0).toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Itens dos runs registrados no período
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Runs e chamadas registradas
            </span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {loading ? "..." : (resumo?.total_requests ?? 0).toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Livro-caixa no período selecionado
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Maior Consumidor
            </span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="truncate text-base font-bold text-foreground">
              {loading ? "..." : maiorConsumidor?.user_name || "Nenhum no período"}
            </p>
            <p className="mt-1 text-xs font-semibold text-amber-700">
              {loading ? "..." : maiorConsumidor ? usd(maiorConsumidor.total_cost_usd) : "US$ 0,00"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <p className="font-bold">
          Conta Apify — ciclo de cobrança atual: {usd(usoApify)} de {usd(limiteApify)} · saldo{" "}
          {usd(saldoApify)}
        </p>
        <p className="mt-1 text-xs">
          Este total vem diretamente da Apify e pertence ao ciclo mensal da conta; ele não muda com
          o filtro de dias acima. A tabela e os demais indicadores usam somente os runs do período
          selecionado.
        </p>
      </div>

      {(resumo?.unattributed_cost_usd ?? 0) > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-bold">
            Consumo legado sem usuário identificado: {usd(resumo?.unattributed_cost_usd ?? 0)}
          </p>
          <p className="mt-1 text-xs">
            A Apify confirmou esse custo e o run está no livro-caixa, mas a execução antiga não
            gravou qual usuário iniciou a busca. O valor permanece separado para não atribuir gasto
            à pessoa errada. Novos runs são vinculados ao usuário desde o início.
          </p>
        </div>
      )}

      {/* Breakdown por Serviço */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Detalhamento por Provedor no Período
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {resumo?.service_breakdown.map((s) => {
            const meta = SERVICE_LABELS[s.service] ?? {
              label: s.service,
              badgeClass: "bg-gray-100 text-gray-800",
            };
            return (
              <div key={s.service} className="rounded-lg border border-border/80 bg-background p-4">
                <span
                  className={cn(
                    "inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold mb-2",
                    meta.badgeClass,
                  )}
                >
                  {meta.label}
                </span>
                <p className="text-xl font-bold text-foreground mt-1">{usd(s.cost_usd)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.requests_count} chamadas · ({brl(s.cost_brl)})
                </p>
              </div>
            );
          })}
          {(!resumo?.service_breakdown || resumo.service_breakdown.length === 0) && !loading && (
            <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
              Nenhum log de consumo registrado no período selecionado.
            </p>
          )}
        </div>
      </div>

      {/* Tabela de Consumo por Cliente */}
      <div className="rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b">
          <div>
            <h3 className="text-base font-bold text-foreground">Consumo por Conta de Cliente</h3>
            <p className="text-xs text-muted-foreground">
              Todos os usuários do sistema; quem não consumiu no período aparece com valor zero.
            </p>
          </div>

          <div className="relative min-w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente ou e-mail..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Cliente / Conta</th>
                <th className="px-4 py-3">Plano Atual</th>
                <th className="px-4 py-3 text-center">Leads no mês / Limite</th>
                <th className="px-4 py-3 text-center">Chamadas API</th>
                <th className="px-4 py-3 text-center">Itens cobrados</th>
                <th className="px-4 py-3 text-right">Custo API (US$)</th>
                <th className="px-4 py-3 text-right">Custo API (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topUsersFiltrados.map((u) => (
                <tr key={u.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <p className="font-semibold">{u.user_name}</p>
                    <p className="text-[11px] text-muted-foreground">{u.user_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase font-bold",
                        PLAN_BADGES[u.plan.toLowerCase()] || PLAN_BADGES.starter,
                      )}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    <span className="font-bold text-foreground">{u.leads_used}</span> /{" "}
                    {u.monthly_limit === null || u.monthly_limit >= 999999 ? "∞" : u.monthly_limit}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {u.requests_count}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {u.items_charged.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                    {usd(u.total_cost_usd)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {brl(u.total_cost_brl)}
                  </td>
                </tr>
              ))}
              {!busca.trim() && (resumo?.unattributed_cost_usd ?? 0) > 0 && (
                <tr className="bg-amber-50/70">
                  <td className="px-4 py-3 font-medium text-amber-950">
                    <p className="font-semibold">Run legado sem usuário identificado</p>
                    <p className="text-[11px] text-amber-800">Confirmado diretamente pela Apify</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {resumo?.unattributed_requests ?? 0}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {(resumo?.unattributed_items ?? 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-800">
                    {usd(resumo?.unattributed_cost_usd ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {brl(resumo?.unattributed_cost_brl ?? 0)}
                  </td>
                </tr>
              )}
              {topUsersFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado no período.
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
