import type { ComponentType } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Crown,
  FileCheck2,
  Filter,
  Megaphone,
  MessageCircleMore,
  Plus,
  Send,
  Users,
  WalletCards,
} from "lucide-react";
import {
  SiGooglemaps,
  SiInstagram,
  SiLinkedin,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import type { IconType } from "react-icons";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "./DashboardHeader";
import {
  CHANNELS,
  PERFORMANCE_DATA,
  RECENT_ACTIVITIES,
  RECENT_LEADS,
  type ChannelKey,
} from "./home-premium-data";

interface HomePremiumViewProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications: number;
  onNewCampaign: () => void;
  onOpenLeads: () => void;
}

const PANEL_CLASS =
  "rounded-2xl border border-home-border bg-[radial-gradient(circle_at_top_right,rgba(20,47,66,0.12),transparent_40%),var(--home-surface)]";

const BRAND_ICONS: Record<Exclude<ChannelKey, "business">, IconType> = {
  maps: SiGooglemaps,
  instagram: SiInstagram,
  linkedin: SiLinkedin,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  whatsapp: SiWhatsapp,
};

const BRAND_ICON_CLASSES: Record<ChannelKey, string> = {
  maps: "text-[#3b82f6]",
  instagram: "text-[#ec4899]",
  linkedin: "text-[#0a66c2]",
  youtube: "text-[#ef4444]",
  tiktok: "text-white",
  whatsapp: "text-[#25d366]",
  business: "text-home-orange",
};

function ChannelIcon({ channel, className }: { channel: ChannelKey; className?: string }) {
  if (channel === "business") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-lg bg-home-orange/20 font-black lowercase text-home-orange text-xs",
          className,
        )}
      >
        b&b
      </span>
    );
  }

  const Icon = BRAND_ICONS[channel];
  return <Icon aria-hidden="true" className={cn(BRAND_ICON_CLASSES[channel], className)} />;
}

export function OverviewHero({ name, onNewCampaign }: { name: string; onNewCampaign: () => void }) {
  const firstName = name.trim().split(" ")[0] || "Marcos";

  return (
    <div className="flex h-full flex-col justify-between gap-4 py-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-home-foreground sm:text-[28px]">
          Olá, {firstName}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-home-muted">
          Aqui está o resumo da sua operação no Flow Business. Continue prospectando e gerando mais
          oportunidades.
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={onNewCampaign}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl bg-home-orange px-4",
            "text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.36)] transition-all hover:bg-home-orange/90 hover:shadow-[0_0_28px_rgba(255,98,0,0.48)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
          )}
        >
          <Plus className="size-4" /> Nova campanha
        </button>
      </div>
    </div>
  );
}

function GoldenCrownGraphic() {
  return (
    <div className="pointer-events-none absolute -bottom-2 -right-2 select-none">
      <div className="absolute -inset-4 rounded-full bg-amber-500/20 blur-2xl" />
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-28 w-36 drop-shadow-[0_10px_30px_rgba(245,158,11,0.5)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="gold-crown-grad"
            x1="20"
            y1="20"
            x2="140"
            y2="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFF7D6" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#853A04" />
          </linearGradient>
          <linearGradient
            id="gold-shine"
            x1="40"
            y1="30"
            x2="120"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id="gold-base"
            x1="30"
            y1="85"
            x2="130"
            y2="105"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <path
          d="M25 90C55 100 105 100 135 90L140 98C105 110 55 110 20 98L25 90Z"
          fill="url(#gold-base)"
        />
        <path
          d="M25 90L20 44L48 66L80 26L112 66L140 44L135 90C105 100 55 100 25 90Z"
          fill="url(#gold-crown-grad)"
        />
        <path
          d="M25 90L20 44L48 66L80 26L85 44L60 76C45 83 35 88 25 90Z"
          fill="url(#gold-shine)"
          opacity="0.65"
        />
        <circle cx="20" cy="44" r="5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="48" cy="66" r="4" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="80" cy="26" r="6.5" fill="#FFFBEB" stroke="#D97706" strokeWidth="2" />
        <circle cx="112" cy="66" r="4" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="140" cy="44" r="5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="50" cy="95" r="2.5" fill="#EF4444" />
        <circle cx="80" cy="98" r="3.5" fill="#3B82F6" />
        <circle cx="110" cy="95" r="2.5" fill="#10B981" />
      </svg>
      <div className="pointer-events-none absolute -bottom-4 -left-12 h-14 w-44 rotate-[-12deg] bg-linear-to-r from-transparent via-amber-400/25 to-amber-500/10 blur-md" />
    </div>
  );
}

export function UsageInsightsCard() {
  return (
    <article
      className={cn(
        "relative min-h-36 overflow-hidden rounded-2xl border border-home-amber/35 p-5",
        "bg-[radial-gradient(ellipse_at_top_right,#2a1805_0%,#1a1005_55%,#0d0803_100%)] shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
      )}
    >
      <div className="relative z-10 max-w-56">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-home-amber/20 text-home-amber shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Crown className="size-4 fill-current" />
          </span>
          <h2 className="text-sm font-bold text-white">Plano Profissional</h2>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#fde68a]/85">
          Aproveite ao máximo todos os recursos do Flow Business.
        </p>
        <button
          type="button"
          className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-home-amber/40 bg-black/40 px-3 text-[10px] font-semibold text-white transition-colors hover:bg-black/60 hover:border-home-amber/60"
        >
          Ver meu plano <ArrowRight className="size-3 text-home-amber" />
        </button>
      </div>
      <GoldenCrownGraphic />
    </article>
  );
}

const KPI_DATA: Array<{
  label: string;
  value: string;
  change: string;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
  barColor: string;
  bars: number[];
}> = [
  {
    label: "Leads gerados",
    value: "1.248",
    change: "12%",
    icon: Users,
    iconColor: "bg-[#ff5500]/15 text-[#ff6600]",
    barColor: "bg-[#ff6600]",
    bars: [25, 48, 75, 40, 100, 62, 85],
  },
  {
    label: "Oportunidades",
    value: "312",
    change: "8%",
    icon: Filter,
    iconColor: "bg-[#8b5cf6]/15 text-[#a855f7]",
    barColor: "bg-[#a855f7]",
    bars: [20, 35, 60, 85, 50, 85, 95],
  },
  {
    label: "Em propostas",
    value: "R$ 28.430",
    change: "24%",
    icon: CircleDollarSign,
    iconColor: "bg-[#10b981]/15 text-[#10b981]",
    barColor: "bg-[#10b981]",
    bars: [15, 40, 70, 50, 95, 75, 100],
  },
  {
    label: "Em vendas",
    value: "R$ 12.960",
    change: "18%",
    icon: WalletCards,
    iconColor: "bg-[#0ea5e9]/15 text-[#38bdf8]",
    barColor: "bg-[#38bdf8]",
    bars: [30, 60, 45, 85, 60, 100, 80],
  },
];

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_DATA.map((item) => (
        <article
          key={item.label}
          className={cn(PANEL_CLASS, "relative min-h-28 overflow-hidden p-4")}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                item.iconColor,
              )}
            >
              <item.icon className="size-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[22px] font-bold leading-tight text-white">
                {item.value}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[11px] text-home-muted">{item.label}</span>
                <span className="text-[11px] font-semibold text-emerald-400">↑ {item.change}</span>
              </div>
            </div>
          </div>
          <div
            className="absolute bottom-3 right-4 flex h-7 items-end gap-1 opacity-90"
            aria-hidden="true"
          >
            {item.bars.map((height, index) => (
              <span
                key={`${item.label}-${index}`}
                className={cn("w-1 rounded-t-xs", item.barColor)}
                style={{ height: `${(height / 100) * 26}px` }}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-start gap-x-5 gap-y-1.5 px-1 text-[11px] text-home-foreground/90">
      {CHANNELS.map((channel) => (
        <span key={channel.key} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: channel.color }} />
          {channel.label}
        </span>
      ))}
    </div>
  );
}

export function PerformanceChart() {
  return (
    <article className={cn(PANEL_CLASS, "p-5")}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Desempenho por canal</h2>
          <p className="mt-0.5 text-[11px] text-home-muted">Leads gerados nos últimos 30 dias</p>
        </div>
        <button
          type="button"
          className="flex h-8.5 items-center gap-3 rounded-lg border border-home-border bg-home-surface-strong px-3 text-[11px] font-medium text-white transition-colors hover:bg-home-surface"
        >
          Leads gerados <ChevronDown className="size-3.5 text-home-muted" />
        </button>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--home-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              interval={4}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "var(--home-border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 200]}
              ticks={[0, 50, 100, 150, 200]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              contentStyle={{
                background: "#0c111a",
                border: "1px solid var(--home-border)",
                borderRadius: 8,
                fontSize: 11,
                color: "#f8fafc",
              }}
            />
            {CHANNELS.map((channel) => (
              <Line
                key={channel.key}
                type="monotone"
                dataKey={channel.key}
                stroke={channel.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend />
    </article>
  );
}

function LeadDistributionCard() {
  return (
    <article className={cn(PANEL_CLASS, "p-5")}>
      <h2 className="text-sm font-bold text-white">Distribuição de leads</h2>
      <p className="mt-0.5 text-[11px] text-home-muted">Total de 1.248 leads no período</p>
      <div className="mt-4 grid grid-cols-[140px_1fr] items-center gap-3">
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={CHANNELS}
                dataKey="leads"
                nameKey="label"
                innerRadius={50}
                outerRadius={74}
                paddingAngle={2}
                stroke="transparent"
              >
                {CHANNELS.map((channel) => (
                  <Cell key={channel.key} fill={channel.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-[22px] font-bold text-white">1.248</strong>
            <span className="text-[11px] text-home-muted">Leads</span>
          </div>
        </div>
        <div className="space-y-2">
          {CHANNELS.map((channel) => (
            <div
              key={channel.key}
              className="grid grid-cols-[1fr_32px_36px] items-center gap-2 text-[11px]"
            >
              <span className="flex min-w-0 items-center gap-2 text-home-foreground/90">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: channel.color }}
                />
                <span className="truncate">{channel.label}</span>
              </span>
              <span className="text-right text-home-muted">{channel.share}%</span>
              <span className="text-right font-semibold text-white/90">{channel.leads}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ChannelSummaryCards() {
  return (
    <section
      aria-label="Resumo por canal"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
    >
      {CHANNELS.map((channel) => (
        <button
          key={channel.key}
          type="button"
          className={cn(
            PANEL_CLASS,
            "group flex min-h-20 items-center gap-3 p-3.5 text-left transition-colors hover:bg-home-surface-strong",
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-home-surface-strong border border-home-border/60">
            <ChannelIcon channel={channel.key} className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
              <span className="truncate">{channel.label}</span>
              {channel.active ? (
                <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-bold text-emerald-400">
                  Ativo
                </span>
              ) : null}
            </div>
            <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
              +{channel.leads} leads
            </span>
          </div>
          <ChevronRight className="size-3.5 shrink-0 text-home-muted transition-transform group-hover:translate-x-0.5" />
        </button>
      ))}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Novo: "border-blue-500/30 bg-blue-500/20 text-blue-400",
  Contato: "border-amber-500/30 bg-amber-500/20 text-amber-400",
  Oportunidade: "border-purple-500/30 bg-purple-500/25 text-purple-400",
  "Em negociação": "border-orange-500/35 bg-orange-500/25 text-orange-400",
};

export function RecentActivityCard({ onOpenLeads }: { onOpenLeads: () => void }) {
  return (
    <article className={cn(PANEL_CLASS, "min-w-0 overflow-hidden p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Leads recentes</h2>
          <p className="mt-0.5 text-[11px] text-home-muted">
            Últimos leads capturados em todos os canais
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLeads}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-surface-strong px-3 text-[11px] font-semibold text-white transition-colors hover:bg-home-surface"
        >
          Ver todos os leads <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-180 text-left">
          <thead>
            <tr className="border-b border-home-border text-[10px] font-semibold uppercase tracking-wider text-home-muted">
              <th className="pb-2.5 font-semibold">Nome</th>
              <th className="pb-2.5 font-semibold">Empresa</th>
              <th className="pb-2.5 font-semibold">Canal</th>
              <th className="pb-2.5 font-semibold">Localização</th>
              <th className="pb-2.5 font-semibold">Data</th>
              <th className="pb-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_LEADS.map((lead) => (
              <tr key={lead.name} className="border-b border-home-border/50 last:border-0">
                <td className="py-2.5">
                  <span className="flex items-center gap-2.5 text-[12px] font-medium text-white">
                    <Avatar className="size-7 border border-home-border">
                      <AvatarImage src={lead.avatarUrl} alt={lead.name} />
                      <AvatarFallback className="bg-home-surface-strong text-[9px] font-semibold text-home-amber">
                        {lead.initials}
                      </AvatarFallback>
                    </Avatar>
                    {lead.name}
                  </span>
                </td>
                <td className="py-2.5 text-[11px] text-home-muted">{lead.company}</td>
                <td className="py-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] capitalize text-home-muted">
                    <ChannelIcon channel={lead.channel} className="size-4 shrink-0" />
                    {lead.channel === "maps" ? "Maps" : lead.channel}
                  </span>
                </td>
                <td className="py-2.5 text-[11px] text-home-muted">{lead.city}</td>
                <td className="py-2.5 text-[11px] text-home-muted">{lead.date}</td>
                <td className="py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                      STATUS_STYLES[lead.status],
                    )}
                  >
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

const ACTIVITY_ICONS = {
  lead: {
    icon: Users,
    className: "bg-slate-800 text-slate-300 border border-slate-700/60",
  },
  proposal: {
    icon: Send,
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  campaign: {
    icon: Megaphone,
    className: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  },
  account: {
    icon: MessageCircleMore,
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  },
  contract: {
    icon: FileCheck2,
    className: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  },
};

function RecentOperationsCard() {
  return (
    <article className={cn(PANEL_CLASS, "p-5")}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Atividades recentes</h2>
          <p className="mt-0.5 text-[11px] text-home-muted">Últimas ações na plataforma</p>
        </div>
        <button
          type="button"
          className="flex h-8 items-center gap-1 rounded-lg border border-home-border bg-home-surface-strong px-3 text-[11px] text-home-muted transition-colors hover:text-white"
        >
          Ver todas <ArrowRight className="size-3" />
        </button>
      </div>
      <div className="mt-3 divide-y divide-home-border/50">
        {RECENT_ACTIVITIES.map((activity) => {
          const config = ACTIVITY_ICONS[activity.kind as keyof typeof ACTIVITY_ICONS];
          const Icon = config.icon;
          return (
            <button
              key={activity.title}
              type="button"
              className="flex w-full items-center gap-3.5 py-2.5 text-left transition-colors hover:bg-home-surface-strong/40 rounded-lg px-1.5"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  config.className,
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-white">
                  {activity.title}
                </span>
                <span className="block truncate text-[10px] text-home-muted">
                  {activity.detail}
                </span>
              </span>
              <ChevronRight className="size-3.5 text-home-muted" />
            </button>
          );
        })}
      </div>
    </article>
  );
}

export function HomePremiumView({
  user,
  unreadNotifications,
  onNewCampaign,
  onOpenLeads,
}: HomePremiumViewProps) {
  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />
      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        {/* Row 1: Greeting + Plan Banner */}
        <section className="grid gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <OverviewHero name={user.name} onNewCampaign={onNewCampaign} />
          <UsageInsightsCard />
        </section>

        {/* Row 2: 4 KPI Cards */}
        <KpiCards />

        {/* Row 3: Performance Chart (68%) + Lead Distribution (32%) */}
        <section className="grid gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <PerformanceChart />
          <LeadDistributionCard />
        </section>

        {/* Row 4: 7 Channels Horizontal Row */}
        <ChannelSummaryCards />

        {/* Row 5: Recent Leads (68%) + Recent Activities (32%) */}
        <section className="grid gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <RecentActivityCard onOpenLeads={onOpenLeads} />
          <RecentOperationsCard />
        </section>
      </main>
    </div>
  );
}
