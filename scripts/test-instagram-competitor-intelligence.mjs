// Suite: inteligencia historica de concorrentes no Instagram
// Invariant: sinais recorrentes, intencao e mudancas reais geram insights sem inflar outliers
// Boundary IN: agregacao pura de posts, comentarios, tendencias, alertas e custo
// Boundary OUT: Actors, banco e dashboard (validados pelo deploy Edge e build de producao)
import assert from "node:assert/strict";
import {
  buildCompetitorAlerts,
  compareCompetitorSnapshots,
  estimateCompetitorMonitoringCost,
  summarizeCompetitorComments,
  summarizeCompetitorContent,
} from "../src/lib/instagram-competitor-intelligence.ts";
import {
  buildGrowthComparison,
  buildInstagramIntelligence,
  validateCompetitorAnalysis,
} from "../src/lib/instagram-intelligence.ts";

const content = summarizeCompetitorContent({
  followers: 10_000,
  niche: "odontologia",
  city: "Curitiba",
  now: new Date("2026-08-19T12:00:00.000Z"),
  posts: [
    {
      url: "https://instagram.com/p/1",
      caption: "Odontologia em Curitiba. Agende pelo WhatsApp #odontologia #curitiba",
      likes: 300,
      comments: 30,
      views: 2_000,
      postedAt: "2026-08-18T12:00:00.000Z",
      contentType: "reel",
      hashtags: ["odontologia", "curitiba"],
      locationText: "Curitiba",
    },
    {
      url: "https://instagram.com/p/2",
      caption: "Antes e depois #odontologia",
      likes: 200,
      comments: 20,
      postedAt: "2026-08-11T12:00:00.000Z",
      contentType: "post",
      hashtags: ["odontologia"],
      locationText: "Curitiba",
    },
    {
      url: "https://instagram.com/p/3",
      caption: "Caso especial #implante",
      likes: 50_000,
      comments: 4_000,
      postedAt: "2026-08-04T12:00:00.000Z",
      contentType: "post",
      hashtags: ["implante"],
      locationText: "Curitiba",
    },
  ],
});
assert.equal(content.signals.medianLikes, 300, "post viral nao deve dominar a mediana");
assert.equal(content.hashtags[0].name, "odontologia");
assert.equal(
  content.hashtags[0].count,
  4,
  "hashtags declaradas e da legenda sao sinais observados",
);
assert.equal(content.formatCounts.post, 2);
assert.ok(content.postingFrequencyWeekly >= 1);

const comments = summarizeCompetitorComments([
  { username: "cliente1", text: "Qual o valor e como agendar?", postUrl: "p1" },
  { username: "cliente1", text: "Tem horário esta semana?", postUrl: "p2" },
  { username: "cliente2", text: "Achei caro, parcela?", postUrl: "p1" },
  { username: "cliente3", text: "Onde fica? É muito longe do centro?", postUrl: "p1" },
  { username: "spam", text: "DM for promotion", postUrl: "p1" },
]);
assert.equal(comments.uniqueCommenters, 3, "spam nao entra na inteligencia de audiencia");
assert.equal(comments.recurringCommenters[0].username, "cliente1");
assert.ok(comments.purchaseIntentCount >= 1);
assert.ok(comments.objections.some((item) => item.category === "preco"));
assert.ok(comments.questionTopics.some((item) => item.name === "agendar"));

const trend = compareCompetitorSnapshots(
  {
    followers: 10_500,
    postsCount: 103,
    engagementRate: 4.2,
    hashtags: [
      { name: "odontologia", count: 2 },
      { name: "invisalign", count: 1 },
    ],
  },
  {
    followers: 10_000,
    postsCount: 100,
    engagementRate: 2.8,
    hashtags: [{ name: "odontologia", count: 3 }],
  },
);
assert.equal(trend.followerDelta, 500);
assert.equal(trend.followerGrowthPercent, 5);
assert.equal(trend.postsDelta, 3);
assert.deepEqual(trend.newHashtags, ["invisalign"]);

const alerts = buildCompetitorAlerts({ comments, trend });
assert.ok(alerts.some((alert) => alert.type === "purchase_intent"));
assert.ok(alerts.some((alert) => alert.type === "recurring_commenter"));
assert.ok(alerts.some((alert) => alert.type === "follower_growth"));
assert.ok(alerts.some((alert) => alert.type === "new_hashtag"));

assert.equal(
  estimateCompetitorMonitoringCost({ maxPosts: 12, commentPosts: 3, commentsPerPost: 30 }),
  0.2216,
  "frontend e Edge compartilham o mesmo teto",
);

const competitors = [
  { id: "a", username: "alpha", label: "Alpha", status: "active" },
  { id: "b", username: "beta", label: null, status: "active" },
];
const historicalSnapshots = [
  {
    id: "a-old",
    competitor_id: "a",
    captured_at: "2026-08-01T12:00:00.000Z",
    followers_count: 100,
    engagement_rate: 2,
    posts_count: 10,
    follower_growth_percent: 0,
    profile_pic_url: null,
    full_name: "Alpha real",
    format_counts: { reel: 1 },
    hashtags: [{ name: "saude", count: 1 }],
    top_posts: [],
    profile_snapshot: {},
  },
  {
    id: "a-new",
    competitor_id: "a",
    captured_at: "2026-08-19T12:00:00.000Z",
    followers_count: 125,
    engagement_rate: 3.5,
    posts_count: 12,
    follower_growth_percent: 25,
    profile_pic_url: null,
    full_name: "Alpha real",
    format_counts: { reel: 2, post: 1 },
    hashtags: [{ name: "saude", count: 3 }],
    top_posts: [{ url: "https://instagram.com/p/real", postedAt: "2026-08-18T12:00:00Z" }],
    profile_snapshot: {},
  },
  {
    id: "b-only",
    competitor_id: "b",
    captured_at: "2026-08-19T12:00:00.000Z",
    followers_count: 80,
    engagement_rate: 1.5,
    posts_count: 6,
    follower_growth_percent: 0,
    profile_pic_url: null,
    full_name: null,
    format_counts: { post: 2 },
    hashtags: [{ name: "local", count: 2 }],
    top_posts: [],
    profile_snapshot: {},
  },
];

const followersChart = buildGrowthComparison({
  competitors,
  snapshots: historicalSnapshots,
  metric: "followers",
  periodDays: 30,
  now: new Date("2026-08-20T12:00:00.000Z"),
});
assert.equal(followersChart.points.length, 2, "o grafico usa apenas datas reais observadas");
assert.equal(followersChart.series.length, 1, "um unico snapshot nao deve produzir uma curva");
assert.equal(followersChart.points[1].a, 125);

const engagementChart = buildGrowthComparison({
  competitors,
  snapshots: historicalSnapshots,
  metric: "engagement",
  periodDays: 7,
  now: new Date("2026-08-20T12:00:00.000Z"),
});
assert.equal(engagementChart.series.length, 0, "o periodo deve remover historico fora da janela");
assert.equal(engagementChart.points[0].a, 3.5, "a metrica selecionada deve trocar os valores");

const intelligence = buildInstagramIntelligence({ competitors, snapshots: historicalSnapshots });
assert.equal(intelligence.monitored[0].followersCount, "125");
assert.equal(intelligence.monitored[1].followersGrowth, "Não disponível");
assert.ok(intelligence.insights.some((item) => item.kind === "growth"));
assert.ok(
  intelligence.trends.hashtags.every((item) => item.growthPercent === null),
  "contagens de uma coleta nao podem ser chamadas de crescimento",
);

assert.deepEqual(
  validateCompetitorAnalysis({
    analysisType: "concorrentes",
    profiles: ["@Alpha", "alpha", "beta"],
    period: "30d",
    metrics: ["followersGrowth", "engagementRate"],
  }),
  {
    ok: true,
    profiles: ["alpha", "beta"],
    periodDays: 30,
    metrics: ["followersGrowth", "engagementRate"],
  },
);
assert.equal(
  validateCompetitorAnalysis({
    analysisType: "nicho",
    profiles: ["alpha"],
    period: "30d",
    metrics: ["followersGrowth"],
  }).ok,
  false,
  "tipos ainda nao suportados devem falhar antes da execucao",
);
assert.equal(
  validateCompetitorAnalysis({
    analysisType: "concorrentes",
    profiles: ["alpha"],
    period: "30d",
    metrics: ["peakHours"],
  }).ok,
  false,
  "metricas ainda nao suportadas devem falhar antes da execucao",
);

console.log("OK: conteudo, audiencia, tendencias, alertas e custo do concorrente validados.");
