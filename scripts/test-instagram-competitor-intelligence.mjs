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

console.log("OK: conteudo, audiencia, tendencias, alertas e custo do concorrente validados.");
