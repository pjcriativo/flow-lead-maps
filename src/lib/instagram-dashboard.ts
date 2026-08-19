export type InstagramDashboardPeriod = 7 | 30 | 90;
export type InstagramDashboardSourceKind = "acquisition" | "intelligence";

export type InstagramDashboardOverview = {
  profiles: number;
  followers: number;
  contactable: number;
  averageEngagement: number;
  averageScore: number;
  scoreCoverage: number;
};

export type InstagramDashboardFunnel = {
  collected: number;
  uniqueProfiles: number;
  enriched: number;
  qualified: number;
  newLeads: number;
  duplicates: number;
  cost: number;
};

export type InstagramDashboardSource = InstagramDashboardFunnel & {
  id: string;
  label: string;
  kind: InstagramDashboardSourceKind;
  runs: number;
  successfulRuns: number;
};

export type InstagramDashboardTimelinePoint = {
  date: string;
  collected: number;
  qualified: number;
  newLeads: number;
  cost: number;
};

export type InstagramDashboardAmount = { label: string; amount: number };

export type InstagramDashboardCampaign = {
  queued: number;
  opened: number;
  sent: number;
  replied: number;
  interested: number;
  converted: number;
};

export type InstagramDashboardRun = {
  id: string;
  source: string;
  label: string;
  kind: InstagramDashboardSourceKind;
  status: string;
  createdAt: string;
  collected: number;
  qualified: number;
  newLeads: number;
  cost: number;
  niche: string;
  city: string;
};

export type InstagramDashboard = {
  version: 1;
  days: number;
  generatedAt: string;
  overview: InstagramDashboardOverview;
  funnel: InstagramDashboardFunnel;
  allCost: number;
  intelligenceOpportunities: number;
  sources: InstagramDashboardSource[];
  timeline: InstagramDashboardTimelinePoint[];
  rejections: InstagramDashboardAmount[];
  intentSignals: InstagramDashboardAmount[];
  scoreDistribution: InstagramDashboardAmount[];
  audienceDistribution: InstagramDashboardAmount[];
  campaign: InstagramDashboardCampaign;
  topNiches: InstagramDashboardAmount[];
  topCities: InstagramDashboardAmount[];
  recentRuns: InstagramDashboardRun[];
};

export type InstagramDashboardEfficiency = {
  qualificationRate: number;
  deliveryRate: number;
  costPerQualified: number;
  costPerNewLead: number;
};

export type InstagramDashboardRankedSource = InstagramDashboardSource &
  InstagramDashboardEfficiency & { performanceScore: number };

type UnknownRecord = Record<string, unknown>;

function recordOf(value: unknown, context: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Dashboard do Instagram inválido em ${context}.`);
  }
  return value as UnknownRecord;
}

function numberOf(record: UnknownRecord, key: string): number {
  const value = Number(record[key] ?? 0);
  if (!Number.isFinite(value)) throw new Error(`Métrica inválida: ${key}.`);
  return value;
}

function stringOf(record: UnknownRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseFunnel(value: unknown): InstagramDashboardFunnel {
  const row = recordOf(value, "funil");
  return {
    collected: numberOf(row, "collected"),
    uniqueProfiles: numberOf(row, "unique_profiles"),
    enriched: numberOf(row, "enriched"),
    qualified: numberOf(row, "qualified"),
    newLeads: numberOf(row, "new_leads"),
    duplicates: numberOf(row, "duplicates"),
    cost: numberOf(row, "cost"),
  };
}

function parseAmount(value: unknown): InstagramDashboardAmount {
  const row = recordOf(value, "distribuição");
  return {
    label: stringOf(row, "label") || stringOf(row, "range") || stringOf(row, "reason"),
    amount: numberOf(row, "amount"),
  };
}

function parseSource(value: unknown): InstagramDashboardSource {
  const row = recordOf(value, "origem");
  const kind = stringOf(row, "kind");
  if (kind !== "acquisition" && kind !== "intelligence") {
    throw new Error("Tipo de origem inválido no dashboard do Instagram.");
  }
  return {
    id: stringOf(row, "id"),
    label: stringOf(row, "label"),
    kind,
    runs: numberOf(row, "runs"),
    successfulRuns: numberOf(row, "successfulRuns"),
    collected: numberOf(row, "collected"),
    uniqueProfiles: numberOf(row, "uniqueProfiles"),
    enriched: numberOf(row, "enriched"),
    qualified: numberOf(row, "qualified"),
    newLeads: numberOf(row, "newLeads"),
    duplicates: numberOf(row, "duplicates"),
    cost: numberOf(row, "cost"),
  };
}

export function parseInstagramDashboard(value: unknown): InstagramDashboard {
  const root = recordOf(value, "resposta");
  if (numberOf(root, "version") !== 1) throw new Error("Versão do dashboard incompatível.");
  const overview = recordOf(root.overview, "resumo");
  const campaign = recordOf(root.campaign, "campanhas");
  return {
    version: 1,
    days: numberOf(root, "days"),
    generatedAt: stringOf(root, "generatedAt"),
    overview: {
      profiles: numberOf(overview, "profiles"),
      followers: numberOf(overview, "followers"),
      contactable: numberOf(overview, "contactable"),
      averageEngagement: numberOf(overview, "averageEngagement"),
      averageScore: numberOf(overview, "averageScore"),
      scoreCoverage: numberOf(overview, "scoreCoverage"),
    },
    funnel: parseFunnel(root.funnel),
    allCost: numberOf(root, "allCost"),
    intelligenceOpportunities: numberOf(root, "intelligenceOpportunities"),
    sources: arrayOf(root.sources).map(parseSource),
    timeline: arrayOf(root.timeline).map((value) => {
      const row = recordOf(value, "série histórica");
      return {
        date: stringOf(row, "date"),
        collected: numberOf(row, "collected"),
        qualified: numberOf(row, "qualified"),
        newLeads: numberOf(row, "newLeads"),
        cost: numberOf(row, "cost"),
      };
    }),
    rejections: arrayOf(root.rejections).map(parseAmount),
    intentSignals: arrayOf(root.intentSignals).map(parseAmount),
    scoreDistribution: arrayOf(root.scoreDistribution).map(parseAmount),
    audienceDistribution: arrayOf(root.audienceDistribution).map(parseAmount),
    campaign: {
      queued: numberOf(campaign, "queued"),
      opened: numberOf(campaign, "opened"),
      sent: numberOf(campaign, "sent"),
      replied: numberOf(campaign, "replied"),
      interested: numberOf(campaign, "interested"),
      converted: numberOf(campaign, "converted"),
    },
    topNiches: arrayOf(root.topNiches).map(parseAmount),
    topCities: arrayOf(root.topCities).map(parseAmount),
    recentRuns: arrayOf(root.recentRuns).map((value) => {
      const row = recordOf(value, "execução");
      const kind = stringOf(row, "kind");
      if (kind !== "acquisition" && kind !== "intelligence") {
        throw new Error("Tipo de execução inválido no dashboard do Instagram.");
      }
      return {
        id: stringOf(row, "id"),
        source: stringOf(row, "source"),
        label: stringOf(row, "label"),
        kind,
        status: stringOf(row, "status"),
        createdAt: stringOf(row, "createdAt"),
        collected: numberOf(row, "collected"),
        qualified: numberOf(row, "qualified"),
        newLeads: numberOf(row, "newLeads"),
        cost: numberOf(row, "cost"),
        niche: stringOf(row, "niche"),
        city: stringOf(row, "city"),
      };
    }),
  };
}

export function safePercentage(numerator: number, denominator: number): number {
  if (denominator <= 0 || numerator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export function mergeInstagramDashboards(
  base: InstagramDashboard,
  advanced: InstagramDashboard,
): InstagramDashboard {
  const timeline = new Map<string, InstagramDashboardTimelinePoint>();
  for (const point of [...base.timeline, ...advanced.timeline]) {
    const current = timeline.get(point.date);
    timeline.set(point.date, {
      date: point.date,
      collected: (current?.collected ?? 0) + point.collected,
      qualified: (current?.qualified ?? 0) + point.qualified,
      newLeads: (current?.newLeads ?? 0) + point.newLeads,
      cost: Number(((current?.cost ?? 0) + point.cost).toFixed(6)),
    });
  }
  const addFunnel = (
    left: InstagramDashboardFunnel,
    right: InstagramDashboardFunnel,
  ): InstagramDashboardFunnel => ({
    collected: left.collected + right.collected,
    uniqueProfiles: left.uniqueProfiles + right.uniqueProfiles,
    enriched: left.enriched + right.enriched,
    qualified: left.qualified + right.qualified,
    newLeads: left.newLeads + right.newLeads,
    duplicates: left.duplicates + right.duplicates,
    cost: Number((left.cost + right.cost).toFixed(6)),
  });
  return {
    ...base,
    generatedAt: base.generatedAt > advanced.generatedAt ? base.generatedAt : advanced.generatedAt,
    funnel: addFunnel(base.funnel, advanced.funnel),
    allCost: Number((base.allCost + advanced.allCost).toFixed(6)),
    sources: [...base.sources, ...advanced.sources],
    timeline: [...timeline.values()].sort((left, right) => left.date.localeCompare(right.date)),
    recentRuns: [...base.recentRuns, ...advanced.recentRuns]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 12),
  };
}

export function calculateInstagramDashboardEfficiency(
  funnel: InstagramDashboardFunnel,
): InstagramDashboardEfficiency {
  return {
    qualificationRate: safePercentage(funnel.qualified, funnel.uniqueProfiles),
    deliveryRate: safePercentage(funnel.newLeads, funnel.qualified),
    costPerQualified: funnel.qualified > 0 ? funnel.cost / funnel.qualified : 0,
    costPerNewLead: funnel.newLeads > 0 ? funnel.cost / funnel.newLeads : 0,
  };
}

export function rankInstagramDashboardSources(
  sources: readonly InstagramDashboardSource[],
): InstagramDashboardRankedSource[] {
  return sources
    .map((source) => {
      const efficiency = calculateInstagramDashboardEfficiency(source);
      const costHealth =
        source.cost === 0 ? 100 : Math.max(0, 100 - efficiency.costPerNewLead * 100);
      const performanceScore =
        source.kind === "intelligence"
          ? safePercentage(source.qualified, source.uniqueProfiles)
          : Number(
              (
                efficiency.qualificationRate * 0.4 +
                efficiency.deliveryRate * 0.4 +
                costHealth * 0.2
              ).toFixed(1),
            );
      return { ...source, ...efficiency, performanceScore };
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === "acquisition" ? -1 : 1;
      return right.performanceScore - left.performanceScore;
    });
}
