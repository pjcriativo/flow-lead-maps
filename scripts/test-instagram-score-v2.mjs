// Suite: Score Instagram v2 multidimensional
// Invariant: cada origem prioriza o sinal correto sem esconder aderência ou autenticidade fracas
// Boundary IN: sinais normalizados, pesos e explicação do motor puro
// Boundary OUT: Actors, banco e componentes visuais
import assert from "node:assert/strict";
import {
  calculateInstagramScoreV2,
  scoreInstagramActivity,
  scoreInstagramAuthenticity,
  scoreInstagramCommercialIntent,
} from "../src/lib/instagram-score-v2.ts";

const baseFit = { niche: 90, location: 100, profileType: 80, audience: 85, contact: 70 };
const commentLead = calculateInstagramScoreV2({
  source: "comments",
  intent: 95,
  fit: baseFit,
  activity: 65,
  authenticity: 80,
  evidence: { intent: ["perguntou preço e disponibilidade"] },
});
const profileLead = calculateInstagramScoreV2({
  source: "profile_search",
  intent: 45,
  fit: baseFit,
  activity: 65,
  authenticity: 80,
});

assert.ok(commentLead.total > profileLead.total, "comentários devem dar mais peso à intenção");
assert.equal(commentLead.version, 2);
assert.equal(commentLead.weights.intent, 0.45);
assert.match(commentLead.explanation, /inten[cç][aã]o|intenção/i);
assert.deepEqual(commentLead.evidence.intent, ["perguntou preço e disponibilidade"]);

const contentLead = calculateInstagramScoreV2({
  source: "hashtags",
  intent: 62,
  fit: baseFit,
  activity: 92,
  authenticity: 78,
});
assert.ok(contentLead.total >= 75, "conteúdo aderente e recente deve ser priorizado");
assert.equal(contentLead.weights.activity, 0.25);

const suspicious = calculateInstagramScoreV2({
  source: "comments",
  intent: 100,
  fit: baseFit,
  activity: 100,
  authenticity: 10,
});
assert.ok(suspicious.total <= 64, "autenticidade crítica deve limitar a prioridade");
assert.ok(suspicious.risks.some((risk) => risk.includes("autenticidade")));

const custom = calculateInstagramScoreV2({
  source: "places",
  intent: 10,
  fit: baseFit,
  activity: 10,
  authenticity: 80,
  weights: { intent: 0, fit: 10, activity: 0, authenticity: 0 },
});
assert.equal(custom.weights.fit, 1, "pesos customizados devem ser normalizados");
assert.equal(custom.total, custom.scores.fit);

assert.equal(
  scoreInstagramActivity({
    lastActiveAt: "2026-08-17T12:00:00.000Z",
    postsCount: 30,
    now: new Date("2026-08-19T12:00:00.000Z"),
  }),
  100,
);
assert.ok(
  scoreInstagramAuthenticity({
    followers: 2_000,
    following: 500,
    posts: 40,
    hasAvatar: true,
    hasBio: true,
  }) >= 85,
);
assert.ok(
  scoreInstagramCommercialIntent({
    professional: true,
    hasContact: true,
    commercialSignalCount: 3,
    callToAction: true,
  }) >= 80,
);

console.log("OK: Score Instagram v2, pesos, limites e explicações validados.");
