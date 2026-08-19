// Suite: Métricas do dashboard Instagram
// Invariant: custos e conversões permanecem finitos e as origens são ranqueadas sem misturar inteligência com aquisição
// Boundary IN: parser, taxas, custo unitário e ranking do domínio puro
// Boundary OUT: SQL, Supabase, React e Recharts
import assert from "node:assert/strict";
import {
  calculateInstagramDashboardEfficiency,
  mergeInstagramDashboards,
  parseInstagramDashboard,
  rankInstagramDashboardSources,
} from "../src/lib/instagram-dashboard.ts";

const emptyEfficiency = calculateInstagramDashboardEfficiency({
  collected: 0,
  uniqueProfiles: 0,
  enriched: 0,
  qualified: 0,
  newLeads: 0,
  duplicates: 0,
  cost: 4.2,
});
assert.deepEqual(emptyEfficiency, {
  qualificationRate: 0,
  deliveryRate: 0,
  costPerQualified: 0,
  costPerNewLead: 0,
});

const sources = rankInstagramDashboardSources([
  {
    id: "comments",
    label: "Comments Hunter",
    kind: "acquisition",
    runs: 2,
    successfulRuns: 2,
    collected: 100,
    uniqueProfiles: 50,
    enriched: 20,
    qualified: 10,
    newLeads: 8,
    duplicates: 2,
    cost: 0.08,
  },
  {
    id: "profile_search",
    label: "Busca de perfis",
    kind: "acquisition",
    runs: 1,
    successfulRuns: 1,
    collected: 100,
    uniqueProfiles: 50,
    enriched: 50,
    qualified: 8,
    newLeads: 3,
    duplicates: 5,
    cost: 0.15,
  },
  {
    id: "competitors",
    label: "Concorrentes",
    kind: "intelligence",
    runs: 1,
    successfulRuns: 1,
    collected: 30,
    uniqueProfiles: 20,
    enriched: 0,
    qualified: 9,
    newLeads: 0,
    duplicates: 0,
    cost: 0.05,
  },
]);
assert.equal(sources[0].id, "comments");
assert.equal(sources.at(-1).kind, "intelligence");
assert.equal(sources[0].costPerNewLead, 0.01);

const parsed = parseInstagramDashboard({
  version: 1,
  days: 30,
  generatedAt: "2026-08-19T12:00:00.000Z",
  overview: {
    profiles: 20,
    followers: 5000,
    contactable: 12,
    averageEngagement: 2.4,
    averageScore: 74,
    scoreCoverage: 95,
  },
  funnel: {
    collected: 100,
    unique_profiles: 70,
    enriched: 50,
    qualified: 20,
    new_leads: 15,
    duplicates: 5,
    cost: 0.3,
  },
  allCost: 0.35,
  intelligenceOpportunities: 3,
  sources: [],
  timeline: [],
  rejections: [{ reason: "fora_nicho", amount: 7 }],
  intentSignals: [{ label: "compra", amount: 4 }],
  scoreDistribution: [{ range: "80-100", amount: 8 }],
  audienceDistribution: [{ range: "1-5 mil", amount: 10 }],
  campaign: { queued: 10, opened: 8, sent: 6, replied: 2, interested: 1, converted: 1 },
  topNiches: [{ label: "Dentista", amount: 8 }],
  topCities: [{ label: "Curitiba", amount: 9 }],
  recentRuns: [],
});
assert.equal(parsed.funnel.newLeads, 15);
assert.deepEqual(parsed.rejections[0], { label: "fora_nicho", amount: 7 });
assert.throws(() => parseInstagramDashboard({ version: 2 }), /Versão/);

const advanced = {
  ...parsed,
  generatedAt: "2026-08-19T13:00:00.000Z",
  funnel: {
    ...parsed.funnel,
    collected: 20,
    uniqueProfiles: 12,
    qualified: 5,
    newLeads: 4,
    cost: 0.1,
  },
  allCost: 0.1,
  sources: [sources[0]],
  timeline: [{ date: "2026-08-19", collected: 20, qualified: 5, newLeads: 4, cost: 0.1 }],
};
const merged = mergeInstagramDashboards(
  {
    ...parsed,
    timeline: [{ date: "2026-08-19", collected: 10, qualified: 2, newLeads: 1, cost: 0.05 }],
  },
  advanced,
);
assert.equal(merged.funnel.collected, 120);
assert.equal(merged.allCost, 0.45);
assert.deepEqual(merged.timeline[0], {
  date: "2026-08-19",
  collected: 30,
  qualified: 7,
  newLeads: 5,
  cost: 0.15,
});

console.log("OK: métricas, parser e ranking do dashboard Instagram validados.");
