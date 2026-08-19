// Suite: descoberta multifuente e qualificação por conteúdo do Instagram
// Invariant: sinais comerciais recentes e aderentes superam conteudo antigo ou fora do nicho
// Boundary IN: normalização, custo, URLs, relacionados, métricas robustas e score puro
// Boundary OUT: Apify, Supabase e interface (validados pelo deploy da Edge e build de producao)
import assert from "node:assert/strict";
import {
  analyzeInstagramContentSignals,
  buildInstagramHashtagUrls,
  buildInstagramProfileUrls,
  calculateInstagramContentLeadScore,
  estimateInstagramContentDiscoveryCost,
  extractInstagramRelatedUsernames,
  instagramContentResultsType,
  normalizeInstagramProfileInputs,
  normalizeInstagramHashtag,
} from "../src/lib/instagram-content-discovery.ts";

assert.equal(normalizeInstagramHashtag("#Clínica Estética"), "clinicaestetica");
assert.deepEqual(
  buildInstagramHashtagUrls(["#odontologia", "odontologia", "dentista_curitiba"]),
  [
    "https://www.instagram.com/explore/tags/odontologia/",
    "https://www.instagram.com/explore/tags/dentista_curitiba/",
  ],
  "hashtags repetidas precisam gerar uma unica origem",
);

assert.deepEqual(
  normalizeInstagramProfileInputs([
    "@Clinica.Exemplo",
    "https://instagram.com/clinica.exemplo/",
    "instagram.com/outra_clinica",
    "https://instagram.com/p/POST123/",
    "https://example.com/invalido",
  ]),
  ["clinica.exemplo", "outra_clinica"],
  "importacao deve aceitar usernames e URLs de perfil, deduplicar e rejeitar posts",
);
assert.deepEqual(buildInstagramProfileUrls(["@clinica.exemplo"]), [
  "https://www.instagram.com/clinica.exemplo/",
]);
assert.deepEqual(
  extractInstagramRelatedUsernames(
    [
      {
        relatedProfiles: [
          { username: "dentista.curitiba" },
          { userName: "odonto_pr" },
          "@clinica.exemplo",
        ],
      },
    ],
    5,
    ["clinica.exemplo"],
  ),
  ["dentista.curitiba", "odonto_pr"],
);
assert.equal(instagramContentResultsType("reels"), "reels");
assert.equal(instagramContentResultsType("mentions"), "mentions");
assert.equal(instagramContentResultsType("imports"), "posts");

const strong = analyzeInstagramContentSignals({
  followers: 2_000,
  niche: "clinica de estetica",
  city: "Curitiba",
  now: new Date("2026-08-19T12:00:00.000Z"),
  contents: [
    {
      caption: "Clínica de estética em Curitiba. Agende pelo WhatsApp, vagas esta semana!",
      likes: 120,
      comments: 18,
      postedAt: "2026-08-17T12:00:00.000Z",
      contentType: "reel",
      views: 4_000,
      locationText: "Curitiba, Paraná",
    },
    {
      caption: "Tratamento estético: peça seu orçamento no link da bio.",
      likes: 80,
      comments: 12,
      postedAt: "2026-08-10T12:00:00.000Z",
      contentType: "post",
      locationText: "Curitiba",
    },
    {
      caption: "Resultado da semana na nossa clínica de estética.",
      likes: 5_000,
      comments: 600,
      postedAt: "2026-08-08T12:00:00.000Z",
      contentType: "post",
      locationText: "Curitiba",
    },
  ],
});
const weak = analyzeInstagramContentSignals({
  followers: 2_000,
  niche: "clinica de estetica",
  city: "Curitiba",
  now: new Date("2026-08-19T12:00:00.000Z"),
  contents: [
    {
      caption: "Dia lindo na praia",
      likes: 2,
      comments: 0,
      postedAt: "2024-01-01T12:00:00.000Z",
      contentType: "post",
      locationText: "Recife",
    },
  ],
});

assert.equal(strong.medianLikes, 120, "outlier nao pode dominar a metrica robusta");
assert.ok(strong.robustEngagementRate > 5);
assert.ok(strong.commercialSignals.includes("agendamento"));
assert.ok(strong.formats.includes("reel"));
assert.equal(strong.medianViews, 0, "posts sem views impedem um Reel isolado de inflar a mediana");
assert.ok(strong.averageViews > 1_000);
assert.ok(strong.contentScore >= 75, "conteudo recente, local e comercial precisa se destacar");
assert.ok(weak.contentScore < 25, "conteudo antigo e sem aderencia precisa ficar fora");

const strongLead = calculateInstagramContentLeadScore({
  contentScore: strong.contentScore,
  professional: true,
  profileNicheMatch: true,
  profileLocationMatch: true,
  authenticityScore: 85,
  hasContact: true,
  followers: 2_000,
});
const weakLead = calculateInstagramContentLeadScore({
  contentScore: weak.contentScore,
  professional: false,
  profileNicheMatch: false,
  profileLocationMatch: false,
  authenticityScore: 30,
  hasContact: false,
  followers: 20,
});
assert.ok(strongLead >= 80);
assert.ok(weakLead < 20);

assert.equal(
  estimateInstagramContentDiscoveryCost({
    mode: "hashtags",
    hashtags: ["odontologia", "dentistacuritiba", "ortodontia"],
    sourcesLimit: 5,
    postsPerSource: 12,
    targetLeads: 15,
  }),
  0.2142,
  "frontend e Edge devem compartilhar o mesmo teto de custo",
);
assert.equal(
  estimateInstagramContentDiscoveryCost({
    mode: "imports",
    hashtags: [],
    profileInputs: ["perfil_a", "perfil_b", "perfil_c"],
    sourcesLimit: 5,
    postsPerSource: 30,
    targetLeads: 30,
  }),
  0.0078,
  "importacao deve coletar cada perfil uma unica vez",
);

assert.equal(
  estimateInstagramContentDiscoveryCost({
    mode: "mentions",
    hashtags: [],
    profileInputs: ["marca_a", "marca_b"],
    sourcesLimit: 5,
    postsPerSource: 10,
    targetLeads: 15,
  }),
  0.171,
);
assert.equal(
  estimateInstagramContentDiscoveryCost({
    mode: "related",
    hashtags: [],
    profileInputs: ["referencia"],
    sourcesLimit: 4,
    postsPerSource: 5,
    targetLeads: 10,
  }),
  0.1346,
);

console.log("OK: seis fontes, sinais de conteúdo, score e custo da fase 6 validados.");
