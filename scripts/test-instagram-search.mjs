// Suite: qualificação da busca Instagram
// Invariant: Maps nunca participa da relevância e um perfil Instagram é acionável por DM.
// Boundary IN: sinais públicos do perfil e filtros escolhidos pelo usuário.
// Boundary OUT: Actor Apify, banco e interface reais.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calcularScoreInstagram,
  motivoRejeicaoInstagram,
  perfilTemLocalidade,
  perfilTemNicho,
  temSiteProprioInstagram,
} from "../src/lib/instagram-search.ts";
import {
  mergeProspectingPages,
  normalizeAisaProfileForDiscovery,
  selectInstagramProfileProvider,
} from "../src/lib/instagram-prospecting.ts";

const perfil = {
  username: "sorrisocuritiba",
  fullName: "Clínica Odontológica Sorriso",
  biography: "Dentista no Batel, Curitiba. Agende pelo direct.",
  businessCategoryName: "Dentist & Dental Office",
  isBusinessAccount: true,
  followersCount: 1800,
  externalUrl: "https://linktr.ee/sorrisocuritiba",
};

assert.equal(perfilTemNicho(perfil, "Clínica odontológica"), true);
assert.equal(perfilTemLocalidade(perfil, "Curitiba"), true);
assert.equal(temSiteProprioInstagram(perfil.externalUrl), false, "Linktree não é site próprio");
assert.equal(
  temSiteProprioInstagram("https://maps.app.goo.gl/exemplo"),
  false,
  "Google Maps na bio não pode ser classificado como site próprio",
);
assert.equal(
  motivoRejeicaoInstagram(
    perfil,
    {
      nicho: "Clínica odontológica",
      cidade: "Curitiba",
      minSeguidores: 500,
      soComerciais: true,
      exigirLocalidade: true,
      semSiteProprio: true,
      exigirContatoExterno: false,
    },
    false,
  ),
  null,
  "perfil relevante não pode ser descartado só porque a abordagem será por DM",
);

assert.equal(
  motivoRejeicaoInstagram(
    { ...perfil, username: "sorrisoclinica", biography: "Atendimento em Londrina" },
    {
      nicho: "Clínica odontológica",
      cidade: "Curitiba",
      exigirLocalidade: true,
    },
    false,
  ),
  "fora_localidade",
);

const score = calcularScoreInstagram({
  temNicho: true,
  temLocalidade: true,
  comercial: true,
  temContatoExterno: false,
  semSiteProprio: true,
  seguidores: 1800,
});
assert.equal(score.score, 85);
assert.equal(score.breakdown.tipo, "aderencia_instagram");

assert.equal(
  motivoRejeicaoInstagram(
    {
      ...perfil,
      isBusinessAccount: false,
      isProfessionalAccount: true,
      businessCategoryName: "Digital creator",
    },
    {
      nicho: "Clínica odontológica",
      cidade: "Curitiba",
      minSeguidores: 500,
      soComerciais: true,
      exigirLocalidade: true,
    },
    false,
  ),
  null,
  "conta Creator/profissional relevante não pode ser descartada como pessoal",
);

assert.equal(
  selectInstagramProfileProvider({ aisaAvailable: true, capability: "profile_search" }),
  "aisa",
  "AISA disponível deve ser o provedor principal da busca de perfis",
);
assert.equal(
  selectInstagramProfileProvider({ aisaAvailable: false, capability: "profile_search" }),
  "apify",
  "AISA indisponível deve preservar o provedor anterior",
);
assert.equal(
  selectInstagramProfileProvider({ aisaAvailable: true, capability: "competitor_followers" }),
  "apify",
  "capacidades sem cobertura AISA comprovada permanecem no Apify",
);

const aisaProfile = normalizeAisaProfileForDiscovery({
  id: "188767259",
  username: "charliejohnsonfitness",
  full_name: "Fitness Business Coach",
  biography: "Coach em Curitiba. Contato coach@example.com",
  bio_links: [{ url: "https://example.com" }],
  external_url: "https://example.com",
  is_private: false,
  is_verified: true,
  is_business_account: true,
  is_professional_account: true,
  category_name: "Coach",
  profile_pic_url: "https://cdn.example.com/profile.jpg",
  follower_count: 503332,
  following_count: 6541,
  media_count: 8387,
  url: "https://www.instagram.com/charliejohnsonfitness/",
});
assert.deepEqual(
  {
    username: aisaProfile.username,
    fullName: aisaProfile.fullName,
    followersCount: aisaProfile.followersCount,
    isBusinessAccount: aisaProfile.isBusinessAccount,
    engagementRate: aisaProfile.engagementRate,
    locationName: aisaProfile.locationName,
  },
  {
    username: "charliejohnsonfitness",
    fullName: "Fitness Business Coach",
    followersCount: 503332,
    isBusinessAccount: true,
    engagementRate: null,
    locationName: null,
  },
  "normaliza campos documentados e mantém sinais ausentes como desconhecidos",
);

assert.equal(
  motivoRejeicaoInstagram(
    aisaProfile,
    { nicho: "fitness", cidade: "", maxSeguidores: 100_000 },
    true,
  ),
  "muitos_seguidores",
);
assert.equal(
  motivoRejeicaoInstagram(
    { ...aisaProfile, followersCount: 50_000 },
    { nicho: "fitness", cidade: "", exigirWhatsapp: true },
    true,
  ),
  "sem_whatsapp",
  "contato genérico não pode ser tratado como WhatsApp comprovado",
);
assert.equal(
  motivoRejeicaoInstagram(
    { ...aisaProfile, followersCount: 50_000 },
    { nicho: "fitness", cidade: "", minEngagementRate: 3.5 },
    true,
  ),
  "engajamento_desconhecido",
  "filtro de engajamento não pode preencher taxa ausente",
);

const mergedPages = mergeProspectingPages(
  [
    { id: "lead-1", username: "Alpha" },
    { id: "lead-2", username: "Beta" },
  ],
  [
    { id: "lead-2-new", username: "@beta" },
    { id: "lead-3", username: "Gamma" },
  ],
);
assert.deepEqual(
  mergedPages.map((item) => item.id),
  ["lead-1", "lead-2", "lead-3"],
  "paginação preserva a primeira ocorrência e elimina usernames repetidos",
);

const prospectingViewSource = readFileSync(
  new URL("../src/components/instagram/prospecting/InstagramProspectingView.tsx", import.meta.url),
  "utf8",
);
assert.doesNotMatch(prospectingViewSource, /setTimeout|DEFAULT_PROFILES|getCuratedProfilePhoto/);
assert.match(prospectingViewSource, /buscarRedes\(/);
assert.match(prospectingViewSource, /addLeadToFlowBusiness\(profile\.id\)/);

const discoveryEdgeSource = readFileSync(
  new URL("../supabase/functions/instagram-discovery/index.ts", import.meta.url),
  "utf8",
);
for (const capability of [
  "instagram.getProfile",
  "instagram.getUserPosts",
  "instagram.getPostComments",
  "instagram.searchHashtag",
  "instagram.searchReels",
]) {
  assert.match(discoveryEdgeSource, new RegExp(capability.replace(".", "\\.")));
}
assert.doesNotMatch(discoveryEdgeSource, /google[ _-]?maps/i);

console.log("OK: relevância, localidade, DM e score do Instagram validados.");
