import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  ContactRound,
  Database,
  Instagram,
  Loader2,
  RefreshCw,
  SearchX,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateInstagramDashboardEfficiency,
  rankInstagramDashboardSources,
  safePercentage,
  type InstagramDashboard,
  type InstagramDashboardAmount,
  type InstagramDashboardPeriod,
} from "@/lib/instagram-dashboard";
import { loadInstagramDashboard } from "@/services/instagram-dashboard";
import { cn } from "@/lib/utils";

type InstagramAnalyticsDashboardProps = { refreshToken?: number };

const PERIODS: InstagramDashboardPeriod[] = [7, 30, 90];
const REJECTION_LABELS: Record<string, string> = {
  fora_nicho: "Fora do nicho",
  niche_mismatch: "Fora do nicho",
  fora_localidade: "Fora da região",
  location_mismatch: "Fora da região",
  conta_pessoal: "Conta pessoal",
  personal_account: "Conta pessoal",
  poucos_seguidores: "Audiência insuficiente",
  low_followers: "Audiência insuficiente",
  baixa_atividade: "Baixa atividade",
  low_score: "Score abaixo do corte",
  duplicate: "Já estava na base",
  nao_informado: "Motivo não informado",
};

export function InstagramAnalyticsDashboard({
  refreshToken = 0,
}: InstagramAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<InstagramDashboardPeriod>(30);
  const [dashboard, setDashboard] = useState<InstagramDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void loadInstagramDashboard(period)
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : "Falha ao carregar métricas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, refreshToken, reloadKey]);

  if (loading && !dashboard) return <DashboardLoading />;
  if (error && !dashboard) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      >
        <SearchX className="mx-auto size-8 text-destructive" />
        <h2 className="mt-3 font-semibold">Não foi possível montar o dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          <RefreshCw className="size-4" /> Tentar novamente
        </Button>
      </div>
    );
  }
  if (!dashboard) return null;

  return (
    <DashboardContent
      dashboard={dashboard}
      period={period}
      loading={loading}
      error={error}
      onPeriodChange={setPeriod}
      onRefresh={() => setReloadKey((value) => value + 1)}
    />
  );
}

function DashboardContent({
  dashboard,
  period,
  loading,
  error,
  onPeriodChange,
  onRefresh,
}: {
  dashboard: InstagramDashboard;
  period: InstagramDashboardPeriod;
  loading: boolean;
  error: string;
  onPeriodChange: (period: InstagramDashboardPeriod) => void;
  onRefresh: () => void;
}) {
  const efficiency = calculateInstagramDashboardEfficiency(dashboard.funnel);
  const rankedSources = useMemo(
    () => rankInstagramDashboardSources(dashboard.sources),
    [dashboard.sources],
  );
  const timeline = useMemo(
    () =>
      dashboard.timeline.map((point) => ({
        ...point,
        label: new Date(`${point.date}T12:00:00`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
      })),
    [dashboard.timeline],
  );

  return (
    <section aria-labelledby="instagram-dashboard-title" className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="h-1 bg-[linear-gradient(90deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))]" />
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <TrendingUp className="size-4" />
              </span>
              <h2 id="instagram-dashboard-title" className="text-lg font-semibold">
                Central de performance
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Aquisição, qualidade e evolução consolidadas de todas as fontes do Instagram.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(period)}
              onValueChange={(value) => onPeriodChange(Number(value) as InstagramDashboardPeriod)}
            >
              <SelectTrigger aria-label="Período do dashboard" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    Últimos {days} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              aria-label="Atualizar dashboard"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        {error ? (
          <p role="status" className="border-t border-border px-5 py-2 text-xs text-destructive">
            Dados anteriores mantidos. {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Database}
          label="Base qualificada"
          value={formatNumber(dashboard.overview.profiles)}
          helper={`${dashboard.overview.scoreCoverage.toFixed(0)}% com Score v2`}
        />
        <MetricCard
          icon={UserPlus}
          label={`Novos em ${period} dias`}
          value={formatNumber(dashboard.funnel.newLeads)}
          helper={`${efficiency.deliveryRate.toFixed(1)}% dos qualificados`}
          accent
        />
        <MetricCard
          icon={BadgeCheck}
          label="Taxa de qualificação"
          value={`${efficiency.qualificationRate.toFixed(1)}%`}
          helper={`${formatNumber(dashboard.funnel.qualified)} perfis aprovados`}
        />
        <MetricCard
          icon={Sparkles}
          label="Score médio"
          value={dashboard.overview.averageScore.toFixed(1)}
          helper={`${dashboard.overview.averageEngagement.toFixed(2)}% de engajamento`}
        />
        <MetricCard
          icon={Target}
          label="Oportunidades em rivais"
          value={formatNumber(dashboard.intelligenceOpportunities)}
          helper="Não entram no funil de leads"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <SectionTitle
          title="Funil de aquisição"
          text="O caminho real entre dados coletados e leads novos salvos no CRM."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FunnelStep
            label="Coletados"
            value={dashboard.funnel.collected}
            icon={Activity}
            percentage={100}
          />
          <FunnelStep
            label="Perfis únicos"
            value={dashboard.funnel.uniqueProfiles}
            icon={Users}
            percentage={safePercentage(dashboard.funnel.uniqueProfiles, dashboard.funnel.collected)}
          />
          <FunnelStep
            label="Enriquecidos"
            value={dashboard.funnel.enriched}
            icon={ContactRound}
            percentage={safePercentage(dashboard.funnel.enriched, dashboard.funnel.uniqueProfiles)}
          />
          <FunnelStep
            label="Qualificados"
            value={dashboard.funnel.qualified}
            icon={BadgeCheck}
            percentage={safePercentage(dashboard.funnel.qualified, dashboard.funnel.uniqueProfiles)}
          />
          <FunnelStep
            label="Novos leads"
            value={dashboard.funnel.newLeads}
            icon={UserPlus}
            percentage={safePercentage(dashboard.funnel.newLeads, dashboard.funnel.qualified)}
            highlight
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel
          title="Evolução da prospecção"
          text="Qualificados e novos leads por dia para acompanhar a evolução da operação."
        >
          {timeline.length ? (
            <div className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ left: -22, right: 8, top: 10 }}>
                  <defs>
                    <linearGradient id="instagramQualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--instagram-purple)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--instagram-purple)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip content={<DashboardTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="qualified"
                    name="Qualificados"
                    stroke="var(--instagram-purple)"
                    fill="url(#instagramQualified)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="newLeads"
                    name="Novos leads"
                    stroke="var(--instagram-pink)"
                    fill="transparent"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart text="As próximas buscas formarão a série histórica." />
          )}
        </Panel>
        <Panel title="Qualidade da base" text="Distribuição do Score v2 em todos os perfis salvos.">
          <DistributionChart
            data={orderedRanges(dashboard.scoreDistribution, ["0-39", "40-59", "60-79", "80-100"])}
            color="var(--instagram-pink)"
          />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/50 p-3 text-sm">
            <span className="text-muted-foreground">Perfis com contato externo</span>
            <b>
              {formatNumber(dashboard.overview.contactable)} ·{" "}
              {safePercentage(dashboard.overview.contactable, dashboard.overview.profiles).toFixed(
                1,
              )}
              %
            </b>
          </div>
        </Panel>
      </div>

      <Panel
        title="Performance por fonte"
        text="Ranking comercial separado da inteligência de concorrentes, com volume e conversão."
      >
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-y border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Fonte</th>
                <th className="px-3 py-3">Execuções</th>
                <th className="px-3 py-3">Únicos</th>
                <th className="px-3 py-3">Qualificados</th>
                <th className="px-3 py-3">Novos</th>
                <th className="px-3 py-3">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {rankedSources.map((source, index) => (
                <tr key={source.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <b>{source.label}</b>
                        <div className="text-xs text-muted-foreground">
                          {source.kind === "intelligence"
                            ? "Inteligência"
                            : `Índice ${source.performanceScore.toFixed(1)}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {source.successfulRuns}/{source.runs}
                  </td>
                  <td className="px-3 py-3 tabular-nums">{formatNumber(source.uniqueProfiles)}</td>
                  <td className="px-3 py-3 tabular-nums">{formatNumber(source.qualified)}</td>
                  <td className="px-3 py-3 font-semibold tabular-nums">
                    {source.kind === "intelligence" ? "—" : formatNumber(source.newLeads)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">{source.qualificationRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rankedSources.length ? (
            <EmptyChart text="Nenhuma fonte executada no período selecionado." />
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Por que os perfis ficaram de fora"
          text="Motivos de rejeição somados em todas as estratégias."
        >
          <RankedList
            items={dashboard.rejections}
            label={(value) => REJECTION_LABELS[value] ?? humanize(value)}
            empty="Nenhuma rejeição registrada no período."
          />
        </Panel>
        <Panel
          title="Sinais de intenção"
          text="Interações públicas que indicam interesse, dúvida ou compra."
        >
          <RankedList
            items={dashboard.intentSignals}
            label={humanize}
            empty="O Comments Hunter criará sinais de intenção aqui."
            accent
          />
        </Panel>
        <Panel title="Audiência dos leads" text="Faixas reais de seguidores da base qualificada.">
          <DistributionChart
            data={orderedRanges(dashboard.audienceDistribution, [
              "Ate 1 mil",
              "1-5 mil",
              "5-20 mil",
              "20 mil+",
            ])}
            color="var(--instagram-purple)"
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Panel
          title="Da descoberta à conversa"
          text="Funil das campanhas de Direct assistido criadas no período."
        >
          <CampaignFunnel dashboard={dashboard} />
        </Panel>
        <Panel
          title="Concentração da base"
          text="Nichos e cidades com maior presença entre os leads do Instagram."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <CompactRanking title="Nichos" items={dashboard.topNiches} />
            <CompactRanking title="Cidades" items={dashboard.topCities} />
          </div>
        </Panel>
      </div>

      <Panel
        title="Execuções recentes"
        text="Histórico auditável de buscas e monitoramentos, com os resultados entregues."
      >
        <div className="mt-4 divide-y divide-border">
          {dashboard.recentRuns.map((run) => (
            <div
              key={`${run.source}-${run.id}`}
              className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-xl p-2",
                    run.kind === "intelligence"
                      ? "bg-secondary text-muted-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Instagram className="size-4" />
                </span>
                <div>
                  <b className="text-sm">{run.label}</b>
                  <div className="text-xs text-muted-foreground">
                    {[run.niche, run.city].filter(Boolean).join(" · ") || "Monitoramento geral"} ·{" "}
                    {formatDateTime(run.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span>{formatNumber(run.qualified)} qualificados</span>
                <span className="font-semibold text-primary">
                  {run.kind === "intelligence"
                    ? `${run.qualified} oportunidades`
                    : `${run.newLeads} novos`}
                </span>
                <StatusBadge status={run.status} />
              </div>
            </div>
          ))}
          {!dashboard.recentRuns.length ? (
            <EmptyChart text="Ainda não existem execuções neste período." />
          ) : null}
        </div>
      </Panel>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]",
        accent ? "border-primary/40 ring-1 ring-primary/10" : "border-border",
      )}
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className={cn("size-4", accent && "text-primary")} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  icon: Icon,
  percentage,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  percentage: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/20",
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("size-4", highlight ? "text-primary" : "text-muted-foreground")} />
        <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{formatNumber(value)}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <Progress value={Math.min(100, percentage)} className="mt-3 h-1" />
    </div>
  );
}

function Panel({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <SectionTitle title={title} text={text} />
      {children}
    </div>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function DistributionChart({ data, color }: { data: InstagramDashboardAmount[]; color: string }) {
  if (!data.some((item) => item.amount > 0))
    return <EmptyChart text="Dados insuficientes para esta distribuição." />;
  return (
    <div className="h-52 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -25, right: 5, top: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip content={<DashboardTooltip />} />
          <Bar dataKey="amount" name="Perfis" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RankedList({
  items,
  label,
  empty,
}: {
  items: InstagramDashboardAmount[];
  label: (value: string) => string;
  empty: string;
  accent?: boolean;
}) {
  const visible = items.slice(0, 6);
  const maximum = Math.max(...visible.map((item) => item.amount), 1);
  if (!visible.length) return <EmptyChart text={empty} />;
  return (
    <div className="mt-4 space-y-3">
      {visible.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>{label(item.label)}</span>
            <b>{formatNumber(item.amount)}</b>
          </div>
          <Progress value={(item.amount / maximum) * 100} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}

function CampaignFunnel({ dashboard }: { dashboard: InstagramDashboard }) {
  const steps = [
    { label: "Na fila", value: dashboard.campaign.queued },
    { label: "Perfil aberto", value: dashboard.campaign.opened },
    { label: "Enviados", value: dashboard.campaign.sent },
    { label: "Respostas", value: dashboard.campaign.replied },
    { label: "Interessados", value: dashboard.campaign.interested },
    { label: "Convertidos", value: dashboard.campaign.converted },
  ];
  const base = Math.max(dashboard.campaign.queued, 1);
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {steps.map((step) => (
        <div key={step.label} className="rounded-xl bg-secondary/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{step.label}</span>
            <span className="text-[11px] text-muted-foreground">
              {safePercentage(step.value, base).toFixed(0)}%
            </span>
          </div>
          <b className="mt-2 block text-xl tabular-nums">{formatNumber(step.value)}</b>
        </div>
      ))}
    </div>
  );
}

function CompactRanking({ title, items }: { title: string; items: InstagramDashboardAmount[] }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              <span className="mr-2 text-xs text-muted-foreground">{index + 1}</span>
              {item.label}
            </span>
            <b>{item.amount}</b>
          </div>
        ))}
        {!items.length ? <span className="text-sm text-muted-foreground">Sem dados</span> : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const success = ["completed", "partial", "concluida"].includes(status);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 font-medium",
        success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      {success ? "Concluída" : humanize(status)}
    </span>
  );
}

function DashboardTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md">
      <b>{label}</b>
      {payload.map((item) => (
        <div key={item.name} className="mt-1 flex min-w-32 items-center justify-between gap-3">
          <span>{item.name}</span>
          <b>{formatNumber(Number(item.value ?? 0))}</b>
        </div>
      ))}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div
      role="status"
      className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-card"
    >
      <div className="text-center">
        <Loader2 className="mx-auto size-7 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          Consolidando todas as fontes do Instagram…
        </p>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function orderedRanges(
  items: InstagramDashboardAmount[],
  order: string[],
): InstagramDashboardAmount[] {
  const amounts = new Map(items.map((item) => [item.label, item.amount]));
  return order.map((label) => ({
    label: label === "Ate 1 mil" ? "Até 1 mil" : label,
    amount: amounts.get(label) ?? 0,
  }));
}

function humanize(value: string): string {
  const normalized = value.replaceAll("_", " ").trim();
  return normalized
    ? normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1)
    : "Não informado";
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("pt-BR");
}
function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "—";
}
