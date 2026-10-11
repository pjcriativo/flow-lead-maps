import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Clock3,
  Crown,
  ExternalLink,
  Filter,
  Flame,
  Instagram,
  MoreVertical,
  Search,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";
import type {
  FlowBusinessActivity,
  FlowBusinessCadence,
  FlowBusinessCard,
  FlowBusinessStage,
} from "@/services/flow-business";

const FULL_STAGES: Array<{ id: FlowBusinessStage; label: string }> = [
  { id: "novo", label: "Novos" },
  { id: "analisando", label: "Analisando" },
  { id: "aquecendo", label: "Aquecendo" },
  { id: "pronto_abordar", label: "Prontos" },
  { id: "abordado", label: "Abordados" },
  { id: "respondeu", label: "Responderam" },
  { id: "qualificado", label: "Qualificados" },
  { id: "proposta", label: "Proposta" },
  { id: "cliente", label: "Clientes" },
  { id: "perdido", label: "Perdidos" },
];

type SummaryStageId = "new" | "contact" | "qualified" | "negotiation" | "clients";

const SUMMARY_STAGES: Array<{
  id: SummaryStageId;
  label: string;
  stages: FlowBusinessStage[];
  color: string;
  soft: string;
  border: string;
}> = [
  {
    id: "new",
    label: "Novos leads",
    stages: ["novo", "analisando"],
    color: "text-[#2563EB]",
    soft: "bg-[#EFF6FF]",
    border: "border-[#DBEAFE]",
  },
  {
    id: "contact",
    label: "Em contato",
    stages: ["aquecendo", "pronto_abordar", "abordado", "respondeu"],
    color: "text-[#833AB4]",
    soft: "bg-[#F5F0FF]",
    border: "border-[#EDE9FE]",
  },
  {
    id: "qualified",
    label: "Qualificados",
    stages: ["qualificado"],
    color: "text-[#F77737]",
    soft: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
  },
  {
    id: "negotiation",
    label: "Em negociação",
    stages: ["proposta"],
    color: "text-[#F72585]",
    soft: "bg-[#FFF1F6]",
    border: "border-[#FCE7F3]",
  },
  {
    id: "clients",
    label: "Clientes",
    stages: ["cliente"],
    color: "text-[#059669]",
    soft: "bg-[#ECFDF5]",
    border: "border-[#D1FAE5]",
  },
];

interface FlowBusinessCrmProps {
  cards: FlowBusinessCard[];
  cadences: FlowBusinessCadence[];
  activities?: FlowBusinessActivity[];
  onMove: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onStartCadence: (cardId: string, cadenceId: string) => Promise<void>;
  onNavigate: (view: InstagramView) => void;
}

export function FlowBusinessCrm({
  cards,
  cadences,
  activities = [],
  onMove,
  onStartCadence,
  onNavigate,
}: FlowBusinessCrmProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SummaryStageId | "all">("all");
  const [source, setSource] = useState("all");
  const [period, setPeriod] = useState("30");
  const [temperature, setTemperature] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [fullFunnel, setFullFunnel] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<SummaryStageId | null>(null);

  const sources = useMemo(
    () => [
      ...new Set(cards.map((card) => card.source).filter((item): item is string => Boolean(item))),
    ],
    [cards],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const selectedStages = SUMMARY_STAGES.find((item) => item.id === status)?.stages;
    const periodDays = period === "all" ? null : Number(period);
    const cutoff = periodDays ? Date.now() - periodDays * 86_400_000 : null;

    return cards.filter((card) => {
      const matchesText =
        !normalized ||
        [card.businessName, card.fullName, card.username, card.category, card.city]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalized);
      return (
        matchesText &&
        (!selectedStages || selectedStages.includes(card.stage)) &&
        (source === "all" || card.source === source) &&
        (temperature === "all" || card.temperature === temperature) &&
        (!cutoff || new Date(card.createdAt ?? card.updatedAt).getTime() >= cutoff)
      );
    });
  }, [cards, period, query, source, status, temperature]);

  const metrics = useMemo(() => {
    const qualified = cards.filter((card) => card.stage === "qualificado").length;
    const negotiation = cards.filter((card) => card.stage === "proposta").length;
    const clients = cards.filter((card) => card.stage === "cliente").length;
    return { total: cards.length, qualified, negotiation, clients };
  }, [cards]);

  const conversionsThisMonth = useMemo(() => {
    const now = new Date();
    const convertedCards = cards.filter((card) => {
      if (!card.wonAt) return false;
      const wonAt = new Date(card.wonAt);
      return wonAt.getMonth() === now.getMonth() && wonAt.getFullYear() === now.getFullYear();
    });
    if (convertedCards.length) return convertedCards.length;
    return activities.filter((activity) => {
      const occurred = new Date(activity.occurredAt);
      const metadata = isRecord(activity.metadata) ? activity.metadata : {};
      return (
        occurred.getMonth() === now.getMonth() &&
        occurred.getFullYear() === now.getFullYear() &&
        (activity.activityType === "won" || metadata.to === "cliente")
      );
    }).length;
  }, [activities, cards]);

  const insights = useMemo(() => {
    const staleCutoff = Date.now() - 7 * 86_400_000;
    return {
      ready: cards.filter((card) => card.stage === "pronto_abordar").length,
      stale: cards.filter(
        (card) =>
          !["cliente", "perdido"].includes(card.stage) &&
          new Date(card.updatedAt).getTime() < staleCutoff,
      ).length,
      canAdvance: cards.filter(
        (card) =>
          (card.score ?? 0) >= 70 &&
          ["novo", "analisando", "aquecendo", "abordado", "respondeu"].includes(card.stage),
      ).length,
    };
  }, [cards]);

  return (
    <div className="space-y-4">
      <CrmHero
        cards={cards}
        conversionsThisMonth={conversionsThisMonth}
        totalClients={metrics.clients}
        onNavigate={onNavigate}
      />

      <KpiGrid metrics={metrics} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_224px]">
        <Pipeline
          cards={filtered}
          totalCards={cards.length}
          cadences={cadences}
          source={source}
          sources={sources}
          fullFunnel={fullFunnel}
          expandedGroup={expandedGroup}
          onSourceChange={setSource}
          onToggleFull={() => setFullFunnel((current) => !current)}
          onExpandGroup={setExpandedGroup}
          onMove={onMove}
          onStartCadence={onStartCadence}
        />

        <aside className="space-y-4">
          <FiltersCard
            query={query}
            status={status}
            source={source}
            period={period}
            temperature={temperature}
            sources={sources}
            showMore={showMoreFilters}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onSourceChange={setSource}
            onPeriodChange={setPeriod}
            onTemperatureChange={setTemperature}
            onToggleMore={() => setShowMoreFilters((current) => !current)}
          />
          <InsightsCard insights={insights} onNavigate={onNavigate} />
          <ActivityCard activities={activities} cards={cards} />
        </aside>
      </div>
    </div>
  );
}

function CrmHero({
  cards,
  conversionsThisMonth,
  totalClients,
  onNavigate,
}: {
  cards: FlowBusinessCard[];
  conversionsThisMonth: number;
  totalClients: number;
  onNavigate: (view: InstagramView) => void;
}) {
  const conversionRate = cards.length ? Math.round((totalClients / cards.length) * 100) : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#F0B6D0] bg-card px-6 py-5 shadow-xs sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(247,37,133,0.10),transparent_31%),linear-gradient(115deg,rgba(247,119,55,0.06),transparent_36%,rgba(131,58,180,0.07))]" />
      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_330px_280px]">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F72585]">
            Do primeiro contato ao cliente
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-[1.08] tracking-tight text-[#101828] sm:text-[28px]">
            Organize, acompanhe e converta{" "}
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">
              mais oportunidades.
            </span>
          </h2>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#475467]">
            Todos os perfis encontrados, interações e oportunidades ficam centralizados no seu CRM,
            com histórico completo e próxima ação sempre à vista.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={() => onNavigate("hunter")}
            >
              <CirclePlus className="size-4" /> Adicionar lead
            </Button>
            <Button
              variant="outline"
              className="rounded-lg bg-card"
              onClick={() => onNavigate("cadences")}
            >
              Ver cadências <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>

        <CrmArtwork cards={cards} />

        <Card className="relative border-[#E4E7EC] bg-card/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[#F72585]">
              <Crown className="size-4 text-[#F79009]" /> Conversões este mês
            </div>
            <span className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground">
              <MoreVertical className="size-3.5" />
            </span>
          </div>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-[#101828] tabular-nums">
            {conversionsThisMonth}
          </p>
          <p className="text-xs text-[#667085]">leads convertidos em clientes</p>
          <p className="mt-2 text-xs font-bold text-[#10B981]">
            {conversionRate}% <span className="font-normal text-[#667085]">da base é cliente</span>
          </p>
          <Progress value={conversionRate} className="mt-3 h-2 bg-[#E4E7EC] [&>div]:bg-[#10B981]" />
          <Button
            variant="outline"
            className="mt-3 w-full rounded-lg bg-card text-xs"
            onClick={() => onNavigate("overview")}
          >
            Ver relatório completo <ArrowRight className="size-3.5" />
          </Button>
        </Card>
      </div>
    </section>
  );
}

function CrmArtwork({ cards }: { cards: FlowBusinessCard[] }) {
  const avatars = cards.filter((card) => card.profilePictureUrl).slice(0, 2);
  const qualified = cards.filter((card) => card.stage === "qualificado").length;
  const negotiation = cards.filter((card) => card.stage === "proposta").length;

  return (
    <div className="relative hidden h-44 items-center justify-center lg:flex" aria-hidden="true">
      <div className="absolute size-44 rounded-full border border-[#FBCFE8]/70" />
      <div className="absolute size-32 rounded-full border border-[#E9D5FF]" />
      <div className="absolute size-24 rounded-full bg-[#F72585]/5 blur-xl" />
      <div className="relative z-10 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white shadow-[0_14px_30px_rgba(225,48,108,0.30)] ring-4 ring-card/80">
        <Instagram className="size-11" />
      </div>
      {avatars.map((card, index) => (
        <Avatar
          key={card.id}
          className={cn(
            "absolute z-20 size-11 border-4 border-card shadow-md",
            index === 0 ? "left-8 top-7" : "right-10 bottom-5",
          )}
        >
          <AvatarImage src={card.profilePictureUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-muted" />
        </Avatar>
      ))}
      <div className="absolute left-0 bottom-2 rotate-[-5deg] rounded-xl border border-border bg-card px-3 py-2 shadow-md">
        <p className="text-[9px] text-muted-foreground">Leads qualificados</p>
        <p className="text-sm font-extrabold text-foreground">{qualified}</p>
      </div>
      <div className="absolute right-0 top-3 rotate-[6deg] rounded-xl border border-border bg-card px-3 py-2 shadow-md">
        <p className="text-[9px] text-muted-foreground">Em negociação</p>
        <p className="text-sm font-extrabold text-foreground">{negotiation} oportunidades</p>
      </div>
    </div>
  );
}

function KpiGrid({
  metrics,
}: {
  metrics: { total: number; qualified: number; negotiation: number; clients: number };
}) {
  const items = [
    {
      label: "Total de leads",
      value: metrics.total,
      Icon: UsersRound,
      tone: "blue",
      comparison: "base comercial",
    },
    {
      label: "Leads qualificados",
      value: metrics.qualified,
      Icon: Target,
      tone: "purple",
      comparison: percentage(metrics.qualified, metrics.total),
    },
    {
      label: "Em negociação",
      value: metrics.negotiation,
      Icon: Clock3,
      tone: "orange",
      comparison: percentage(metrics.negotiation, metrics.total),
    },
    {
      label: "Clientes",
      value: metrics.clients,
      Icon: Trophy,
      tone: "green",
      comparison: percentage(metrics.clients, metrics.total),
    },
  ] as const;
  const tones = {
    blue: "bg-[#EFF6FF] text-[#2563EB]",
    purple: "bg-[#F5F0FF] text-[#833AB4]",
    orange: "bg-[#FFF7ED] text-[#F77737]",
    green: "bg-[#ECFDF5] text-[#10B981]",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, Icon, tone, comparison }) => (
        <Card
          key={label}
          className="flex min-h-24 items-center gap-4 border-[#E4E7EC] p-4 shadow-xs"
        >
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl",
              tones[tone],
            )}
          >
            <Icon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-[#344054]">{label}</p>
              <ChevronRight className="size-4 text-[#475467]" />
            </div>
            <p className="mt-0.5 text-2xl font-extrabold text-[#101828] tabular-nums">{value}</p>
            <p className="text-[11px] font-semibold text-[#10B981]">{comparison}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Pipeline({
  cards,
  totalCards,
  cadences,
  source,
  sources,
  fullFunnel,
  expandedGroup,
  onSourceChange,
  onToggleFull,
  onExpandGroup,
  onMove,
  onStartCadence,
}: {
  cards: FlowBusinessCard[];
  totalCards: number;
  cadences: FlowBusinessCadence[];
  source: string;
  sources: string[];
  fullFunnel: boolean;
  expandedGroup: SummaryStageId | null;
  onSourceChange: (source: string) => void;
  onToggleFull: () => void;
  onExpandGroup: (stage: SummaryStageId | null) => void;
  onMove: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onStartCadence: (cardId: string, cadenceId: string) => Promise<void>;
}) {
  return (
    <Card className="overflow-hidden border-[#E4E7EC] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#FFF1F6] text-[#F72585]">
            <UsersRound className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#101828]">Pipeline de oportunidades</h3>
            <p className="text-[11px] text-[#667085]">
              Acompanhe seus leads em cada etapa do funil comercial.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={source} onValueChange={onSourceChange}>
            <SelectTrigger className="h-9 w-36 rounded-lg text-xs">
              <SelectValue placeholder="Todas as origens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              {sources.map((item) => (
                <SelectItem key={item} value={item}>
                  {sourceLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 rounded-lg text-xs" onClick={onToggleFull}>
            {fullFunnel ? "Ver resumo" : "Ver funil completo"} <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto p-3">
        <div
          className={cn(
            "grid min-w-[920px] gap-3",
            fullFunnel ? "grid-cols-10 min-w-[2100px]" : "grid-cols-5",
          )}
        >
          {fullFunnel
            ? FULL_STAGES.map((stage, index) => (
                <PipelineColumn
                  key={stage.id}
                  label={stage.label}
                  cards={cards.filter((card) => card.stage === stage.id)}
                  total={totalCards}
                  colorConfig={SUMMARY_STAGES[Math.min(Math.floor(index / 2), 4)]}
                  cadences={cadences}
                  showAll
                  onMove={onMove}
                  onStartCadence={onStartCadence}
                />
              ))
            : SUMMARY_STAGES.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  label={stage.label}
                  cards={cards.filter((card) => stage.stages.includes(card.stage))}
                  total={totalCards}
                  colorConfig={stage}
                  cadences={cadences}
                  showAll={expandedGroup === stage.id}
                  onShowAll={() => onExpandGroup(expandedGroup === stage.id ? null : stage.id)}
                  onMove={onMove}
                  onStartCadence={onStartCadence}
                />
              ))}
        </div>
      </div>
    </Card>
  );
}

function PipelineColumn({
  label,
  cards,
  total,
  colorConfig,
  cadences,
  showAll,
  onShowAll,
  onMove,
  onStartCadence,
}: {
  label: string;
  cards: FlowBusinessCard[];
  total: number;
  colorConfig: (typeof SUMMARY_STAGES)[number];
  cadences: FlowBusinessCadence[];
  showAll: boolean;
  onShowAll?: () => void;
  onMove: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onStartCadence: (cardId: string, cadenceId: string) => Promise<void>;
}) {
  const visible = showAll ? cards : cards.slice(0, 5);
  return (
    <section className="flex min-h-[310px] min-w-0 flex-col overflow-hidden rounded-xl border border-[#E4E7EC] bg-card">
      <header className={cn("border-b px-3 py-3", colorConfig.soft, colorConfig.border)}>
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn("truncate text-xs font-bold", colorConfig.color)}>
            {label} ({cards.length})
          </h4>
          <ChevronRight className={cn("size-4", colorConfig.color)} />
        </div>
        <p className="mt-0.5 text-[10px] text-[#667085]">
          {percentage(cards.length, total)} do total
        </p>
      </header>
      <div className="flex-1 divide-y divide-border px-2">
        {visible.map((card) => (
          <OpportunityRow
            key={card.id}
            card={card}
            cadences={cadences}
            onMove={onMove}
            onStartCadence={onStartCadence}
          />
        ))}
        {!cards.length ? (
          <p className="px-2 py-10 text-center text-[11px] text-muted-foreground">Nenhum lead</p>
        ) : null}
      </div>
      {onShowAll ? (
        <button
          type="button"
          onClick={onShowAll}
          className="flex items-center justify-center gap-2 border-t border-border px-3 py-3 text-[11px] font-semibold text-[#344054] hover:bg-muted/50"
        >
          {showAll ? "Recolher" : `Ver todos (${cards.length})`} <ArrowRight className="size-3.5" />
        </button>
      ) : null}
    </section>
  );
}

function OpportunityRow({
  card,
  cadences,
  onMove,
  onStartCadence,
}: {
  card: FlowBusinessCard;
  cadences: FlowBusinessCadence[];
  onMove: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onStartCadence: (cardId: string, cadenceId: string) => Promise<void>;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-1 py-2 text-left hover:bg-muted/40"
        >
          <Avatar className="size-8 shrink-0 border border-border">
            <AvatarImage
              src={card.profilePictureUrl ?? undefined}
              alt={card.fullName || card.businessName}
            />
            <AvatarFallback className="bg-muted" />
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold text-[#101828]">
              {card.fullName || card.businessName}
            </span>
            <span className="block truncate text-[10px] text-[#667085]">
              {card.username ? `@${card.username}` : sourceLabel(card.source)}
            </span>
          </span>
          {card.temperature === "quente" ? <Flame className="size-3.5 text-[#F72585]" /> : null}
          <span className="text-[9px] text-[#667085]">{relativeTime(card.updatedAt)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-border">
            <AvatarImage
              src={card.profilePictureUrl ?? undefined}
              alt={card.fullName || card.businessName}
            />
            <AvatarFallback className="bg-muted" />
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{card.fullName || card.businessName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {card.username ? `@${card.username}` : card.category}
            </p>
          </div>
          <span className="text-xs font-bold">Score {card.score ?? 0}</span>
        </div>
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <Select
            value={card.stage}
            onValueChange={(value) => void onMove(card.id, value as FlowBusinessStage)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FULL_STAGES.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            {card.instagramUrl ? (
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <a href={card.instagramUrl} target="_blank" rel="noreferrer">
                  Perfil <ExternalLink className="size-3" />
                </a>
              </Button>
            ) : null}
            <Select onValueChange={(cadenceId) => void onStartCadence(card.id, cadenceId)}>
              <SelectTrigger className="h-9 flex-1 text-xs">
                <SelectValue placeholder="Cadência" />
              </SelectTrigger>
              <SelectContent>
                {cadences
                  .filter((cadence) => cadence.isActive)
                  .map((cadence) => (
                    <SelectItem key={cadence.id} value={cadence.id}>
                      {cadence.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FiltersCard({
  query,
  status,
  source,
  period,
  temperature,
  sources,
  showMore,
  onQueryChange,
  onStatusChange,
  onSourceChange,
  onPeriodChange,
  onTemperatureChange,
  onToggleMore,
}: {
  query: string;
  status: SummaryStageId | "all";
  source: string;
  period: string;
  temperature: string;
  sources: string[];
  showMore: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: SummaryStageId | "all") => void;
  onSourceChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onTemperatureChange: (value: string) => void;
  onToggleMore: () => void;
}) {
  return (
    <Card className="border-[#E4E7EC] p-3 shadow-xs">
      <h3 className="flex items-center gap-2 text-xs font-bold text-[#101828]">
        <Filter className="size-4 text-[#2563EB]" /> Filtros e busca
      </h3>
      <div className="relative mt-3">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar nome ou @username..."
          className="h-8 pl-8 text-[10px]"
        />
      </div>
      <FilterSelect
        label="Status do lead"
        value={status}
        onChange={(value) => onStatusChange(value as SummaryStageId | "all")}
      >
        <SelectItem value="all">Todos os status</SelectItem>
        {SUMMARY_STAGES.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect label="Origem" value={source} onChange={onSourceChange}>
        <SelectItem value="all">Todas as origens</SelectItem>
        {sources.map((item) => (
          <SelectItem key={item} value={item}>
            {sourceLabel(item)}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect
        label="Período de criação"
        value={period}
        onChange={onPeriodChange}
        icon={<CalendarDays className="size-3.5" />}
      >
        <SelectItem value="7">Últimos 7 dias</SelectItem>
        <SelectItem value="30">Últimos 30 dias</SelectItem>
        <SelectItem value="90">Últimos 90 dias</SelectItem>
        <SelectItem value="all">Todo o período</SelectItem>
      </FilterSelect>
      {showMore ? (
        <FilterSelect label="Temperatura" value={temperature} onChange={onTemperatureChange}>
          <SelectItem value="all">Todas as temperaturas</SelectItem>
          <SelectItem value="quente">Quentes</SelectItem>
          <SelectItem value="morno">Mornos</SelectItem>
          <SelectItem value="frio">Frios</SelectItem>
        </FilterSelect>
      ) : null}
      <button
        type="button"
        onClick={onToggleMore}
        className="mt-3 flex w-full items-center justify-end gap-1 text-[10px] font-semibold text-[#2563EB]"
      >
        {showMore ? "Menos filtros" : "Mais filtros"} <Filter className="size-3" />
      </button>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  icon,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-2.5">
      <p className="mb-1 text-[10px] font-semibold text-[#344054]">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-full text-[10px]">
          {icon}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function InsightsCard({
  insights,
  onNavigate,
}: {
  insights: { ready: number; stale: number; canAdvance: number };
  onNavigate: (view: InstagramView) => void;
}) {
  const items = [
    {
      value: insights.ready,
      title: "leads prontos para abordagem",
      subtitle: "Sinalizados pela etapa atual",
      color: "text-[#F72585] bg-[#FFF1F6]",
    },
    {
      value: insights.stale,
      title: "leads sem atividade",
      subtitle: "Há mais de 7 dias",
      color: "text-[#E1306C] bg-[#FFF1F2]",
    },
    {
      value: insights.canAdvance,
      title: "oportunidades podem avançar",
      subtitle: "Score 70+ em etapas iniciais",
      color: "text-[#F77737] bg-[#FFF7ED]",
    },
  ];
  return (
    <Card className="border-[#E4E7EC] p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-[#101828]">
          <Sparkles className="size-4 text-[#833AB4]" /> Insights da AISA
        </h3>
        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="text-[9px] font-semibold text-[#475467]"
        >
          Ver todos
        </button>
      </div>
      <p className="mt-1 text-[9px] text-muted-foreground">
        Cálculos locais, sem análise da API AISA.
      </p>
      <div className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-2 py-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-[10px] font-extrabold",
                item.color,
              )}
            >
              {item.value}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-[#344054]">{item.title}</span>
              <span className="block text-[9px] text-[#667085]">{item.subtitle}</span>
            </span>
            <ChevronRight className="size-3.5 text-[#475467]" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityCard({
  activities,
  cards,
}: {
  activities: FlowBusinessActivity[];
  cards: FlowBusinessCard[];
}) {
  const byId = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  return (
    <Card className="border-[#E4E7EC] p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-[#101828]">
          <Clock3 className="size-4 text-[#F79009]" /> Atividade recente
        </h3>
        <span className="text-[9px] font-semibold text-[#475467]">Ver tudo</span>
      </div>
      <div className="mt-2 space-y-2.5">
        {activities.slice(0, 3).map((activity) => {
          const card = byId.get(activity.cardId);
          return (
            <div key={activity.id} className="flex gap-2">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#F5F0FF] text-[#833AB4]">
                <Sparkles className="size-3" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold text-[#344054]">
                  {activityTitle(activity)}
                </span>
                <span className="block truncate text-[9px] text-[#667085]">
                  {card?.businessName ?? activity.detail ?? "CRM"}
                </span>
              </span>
              <span className="shrink-0 text-[8px] text-[#98A2B3]">
                {relativeTime(activity.occurredAt)}
              </span>
            </div>
          );
        })}
        {!activities.length ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            Nenhuma atividade registrada.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function percentage(value: number, total: number): string {
  return `${total ? Math.round((value / total) * 100) : 0}%`;
}

function sourceLabel(source: string | null): string {
  if (!source) return "Instagram";
  return source.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function activityTitle(activity: FlowBusinessActivity): string {
  const metadata = isRecord(activity.metadata) ? activity.metadata : {};
  if (activity.activityType === "created") return "Novo lead adicionado";
  if (activity.activityType === "qualified" || metadata.to === "qualificado") {
    return "Lead qualificado";
  }
  if (activity.activityType === "won" || metadata.to === "cliente") {
    return "Lead convertido em cliente";
  }
  return activity.title;
}

export function FlowBusinessCrmEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <UsersRound className="mx-auto size-9 text-muted-foreground/50" />
      <p className="mt-3 font-medium">Sua operação começa na descoberta</p>
    </div>
  );
}
