// Suite: Instagram Client Hunter — limites, cruzamento e abordagem contextual.
// Invariant: cotas são previsíveis por plano e perfis repetidos nunca contam duas vezes.
// Boundary IN: dados públicos já coletados e sinais comerciais normalizados.
// Boundary OUT: nenhuma chamada a Apify, Meta, OpenAI ou outro serviço pago.
import assert from "node:assert/strict";
import test from "node:test";

import {
  INSTAGRAM_PLAN_POLICIES,
  buildContextualApproach,
  crossInstagramAudiences,
  normalizeInstagramUsername,
  rankInstagramOpportunity,
} from "../../../src/lib/instagram-client-hunter.ts";

test("Básico fica limitado e o cruzamento é reservado aos planos superiores", () => {
  assert.deepEqual(INSTAGRAM_PLAN_POLICIES.basico, {
    leads: 30,
    audienceProfiles: 100,
    competitors: 1,
    hunts: 3,
    overlaps: 0,
    enrichments: 10,
    brands: 1,
    monthlyCostUsd: 0.75,
    monitoring: "manual",
  });
  assert.equal(INSTAGRAM_PLAN_POLICIES.pro.overlaps, 3);
  assert.equal(INSTAGRAM_PLAN_POLICIES.agencia.brands, 10);
});

test("normaliza @, URL, caixa e barra final para a mesma identidade", () => {
  assert.equal(normalizeInstagramUsername(" @Pablo.Marcal/ "), "pablo.marcal");
  assert.equal(
    normalizeInstagramUsername("https://www.instagram.com/Pablo.Marcal/?hl=pt-br"),
    "pablo.marcal",
  );
});

test("cruza audiências sem duplicar perfis e preserva todas as origens", () => {
  const result = crossInstagramAudiences([
    {
      source: "pablo",
      members: [
        { username: "@ClienteA", instagramUserId: "1" },
        { username: "cliente_b", instagramUserId: "2" },
      ],
    },
    {
      source: "wendell",
      members: [
        { username: "cliente-a-renomeado", instagramUserId: "1" },
        { username: "CLIENTE_C", instagramUserId: "3" },
      ],
    },
  ]);

  assert.equal(result.all.length, 3);
  assert.equal(result.overlap.length, 1);
  assert.deepEqual(result.overlap[0]?.sources, ["pablo", "wendell"]);
  assert.equal(result.exclusiveBySource.pablo.length, 1);
  assert.equal(result.exclusiveBySource.wendell.length, 1);
});

test("ranqueia intenção, recorrência, cruzamento e fit sem ultrapassar 100", () => {
  const ranked = rankInstagramOpportunity({
    intentScore: 90,
    sourceCount: 3,
    evidenceCount: 5,
    nicheMatch: true,
    locationMatch: true,
    professional: true,
    hasContact: true,
    followers: 4_500,
  });
  assert.equal(ranked.score, 100);
  assert.ok(ranked.reasons.includes("aparece em 3 audiências"));
  assert.ok(ranked.reasons.includes("sinal de intenção forte"));
});

test("gera abordagem usando evidência concreta e sem inventar informação", () => {
  const message = buildContextualApproach({
    firstName: "Ana",
    sourceName: "Agência XPTO",
    evidence: "como melhorar meus anúncios?",
    offer: "uma análise rápida das campanhas",
  });
  assert.match(message, /^Oi, Ana!/);
  assert.match(message, /como melhorar meus anúncios/);
  assert.match(message, /análise rápida das campanhas/);
  assert.ok(message.length <= 320);
});
