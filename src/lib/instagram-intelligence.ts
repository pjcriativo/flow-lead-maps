export type IntelligenceMetric = "followers" | "engagement" | "posts";

type CompetitorLike = {
  id: string;
  username: string;
  label?: string | null;
  status?: string;
};

type SnapshotLike = {
  id: string;
  competitor_id: string;
  captured_at: string;
  followers_count: number;
  engagement_rate: number;
  posts_count: number;
  follower_growth_percent?: number;
  profile_pic_url?: string | null;
  full_name?: string | null;
  format_counts?: Record<string, number>;
  hashtags?: Array<{ name: string; count: number }>;
  top_posts?: Array<{ url: string; postedAt?: string | null }>;
  profile_snapshot?: Record<string, unknown> | null;
};

const COLORS = ["#2563EB", "#8B5CF6", "#EC4899", "#F97316", "#F43F5E"];
const SUPPORTED_METRICS = new Set([
  "followersGrowth",
  "engagementRate",
  "contentTypes",
  "hashtagsKeywords",
]);
const PERIODS: Record<string, number> = { "7d": 7, "15d": 15, "30d": 30, "90d": 90 };

function orderedSnapshots(snapshots: SnapshotLike[], competitorId: string) {
  return snapshots
    .filter((item) => item.competitor_id === competitorId)
    .sort((a, b) => Date.parse(a.captured_at) - Date.parse(b.captured_at));
}

function metricValue(snapshot: SnapshotLike, metric: IntelligenceMetric) {
  if (metric === "engagement") return Number(snapshot.engagement_rate);
  if (metric === "posts") return Number(snapshot.posts_count);
  return Number(snapshot.followers_count);
}

export function validateCompetitorAnalysis(input: {
  analysisType: string;
  profiles: string[];
  period: string;
  metrics: string[];
}):
  | { ok: true; profiles: string[]; periodDays: number; metrics: string[] }
  | { ok: false; error: string } {
  if (input.analysisType !== "concorrentes") {
    return { ok: false, error: "Este tipo de análise ainda não possui coleta validada." };
  }
  const profiles = [
    ...new Set(
      input.profiles
        .map((profile) => profile.trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (!profiles.length) return { ok: false, error: "Informe ao menos um perfil." };
  if (profiles.length > 5) return { ok: false, error: "Informe no máximo cinco perfis." };
  if (profiles.some((profile) => !/^[\w.]{1,30}$/.test(profile))) {
    return { ok: false, error: "Há um perfil do Instagram inválido." };
  }
  const periodDays = PERIODS[input.period];
  if (!periodDays) return { ok: false, error: "Selecione um período suportado." };
  if (!input.metrics.length) return { ok: false, error: "Selecione ao menos uma métrica." };
  const unsupported = input.metrics.filter((metric) => !SUPPORTED_METRICS.has(metric));
  if (unsupported.length) {
    return {
      ok: false,
      error: "Horários de maior alcance ainda não estão disponíveis nesta coleta.",
    };
  }
  return { ok: true, profiles, periodDays, metrics: input.metrics };
}

export function buildGrowthComparison(params: {
  competitors: CompetitorLike[];
  snapshots: SnapshotLike[];
  metric: IntelligenceMetric;
  periodDays: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const since = now.getTime() - params.periodDays * 86_400_000;
  const eligible = params.competitors.slice(0, 5).flatMap((competitor, index) => {
    const history = orderedSnapshots(params.snapshots, competitor.id).filter(
      (snapshot) => Date.parse(snapshot.captured_at) >= since,
    );
    if (history.length < 2) return [];
    return [
      {
        key: competitor.id,
        name: competitor.label || `@${competitor.username}`,
        color: COLORS[index % COLORS.length],
        value: metricValue(history.at(-1)!, params.metric),
      },
    ];
  });
  const eligibleIds = new Set(eligible.map((series) => series.key));
  const byDate = new Map<string, Record<string, number | string>>();
  for (const snapshot of params.snapshots) {
    const captured = Date.parse(snapshot.captured_at);
    if (captured < since || captured > now.getTime()) continue;
    const dateKey = new Date(captured).toISOString();
    const point = byDate.get(dateKey) ?? { capturedAt: dateKey };
    point[snapshot.competitor_id] = metricValue(snapshot, params.metric);
    byDate.set(dateKey, point);
  }
  return {
    points: [...byDate.values()].sort(
      (a, b) => Date.parse(String(a.capturedAt)) - Date.parse(String(b.capturedAt)),
    ),
    series: eligible,
    hasHistory: eligibleIds.size > 0,
  };
}

function compactNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Não disponível";
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 1_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function latestPostAt(snapshot?: SnapshotLike) {
  const dates = (snapshot?.top_posts ?? [])
    .map((post) => (post.postedAt ? Date.parse(post.postedAt) : Number.NaN))
    .filter(Number.isFinite);
  if (!dates.length) return null;
  return new Date(Math.max(...dates)).toISOString();
}

export function buildInstagramIntelligence(params: {
  competitors: CompetitorLike[];
  snapshots: SnapshotLike[];
}) {
  const histories = new Map(
    params.competitors.map((competitor) => [
      competitor.id,
      orderedSnapshots(params.snapshots, competitor.id),
    ]),
  );
  const monitored = params.competitors.map((competitor, index) => {
    const history = histories.get(competitor.id) ?? [];
    const latest = history.at(-1);
    const previous = history.at(-2);
    const growth =
      latest && previous && previous.followers_count > 0
        ? ((latest.followers_count - previous.followers_count) / previous.followers_count) * 100
        : null;
    return {
      id: competitor.id,
      name: competitor.label || latest?.full_name || competitor.username,
      username: competitor.username,
      avatarUrl: latest?.profile_pic_url ?? undefined,
      followersCount: compactNumber(latest ? Number(latest.followers_count) : null),
      followersGrowth:
        growth === null ? "Não disponível" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
      isPositiveGrowth: growth !== null && growth >= 0,
      engagementRate: latest ? `${Number(latest.engagement_rate).toFixed(2)}%` : "Não disponível",
      lastPostTime: latestPostAt(latest) ?? "Não disponível",
      sparklineColor: COLORS[index % COLORS.length],
      sparklineValues: history.map((snapshot) => Number(snapshot.followers_count)),
      instagramUrl: `https://instagram.com/${competitor.username}`,
      status: competitor.status ?? "active",
    };
  });

  const insights = monitored.flatMap((item) => {
    if (item.followersGrowth === "Não disponível") return [];
    const growth = Number.parseFloat(item.followersGrowth);
    if (growth <= 0) return [];
    return [
      {
        id: `growth-${item.id}`,
        kind: "growth" as const,
        title: "Crescimento comprovado",
        description: `@${item.username} cresceu ${item.followersGrowth} entre os dois snapshots mais recentes.`,
        evidence: "Snapshots de monitoramento",
      },
    ];
  });

  const latestSnapshots = params.competitors.flatMap((competitor) => {
    const latest = histories.get(competitor.id)?.at(-1);
    return latest ? [latest] : [];
  });
  const hashtagCounts = new Map<string, number>();
  const formatCounts = new Map<string, number>();
  for (const snapshot of latestSnapshots) {
    for (const hashtag of snapshot.hashtags ?? []) {
      hashtagCounts.set(hashtag.name, (hashtagCounts.get(hashtag.name) ?? 0) + hashtag.count);
    }
    for (const [format, count] of Object.entries(snapshot.format_counts ?? {})) {
      formatCounts.set(format, (formatCounts.get(format) ?? 0) + Number(count));
    }
  }
  const hashtags = [...hashtagCounts]
    .map(([name, count]) => ({ name, count, growthPercent: null as number | null }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const formats = [...formatCounts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const featured = monitored
    .filter((item) => item.followersCount !== "Não disponível")
    .sort((a, b) => {
      const growthA = Number.parseFloat(a.followersGrowth) || 0;
      const growthB = Number.parseFloat(b.followersGrowth) || 0;
      return growthB - growthA;
    })
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.name,
      username: item.username,
      avatarUrl: item.avatarUrl,
      followersCount: item.followersCount,
    }));

  return {
    monitored,
    insights: insights.slice(0, 3),
    featured,
    trends: { hashtags, formats, source: "Snapshots de monitoramento" },
  };
}
