// Suite: qualificação da busca Instagram
// Invariant: Maps nunca participa da relevância e um perfil Instagram é acionável por DM.
// Boundary IN: sinais públicos do perfil e filtros escolhidos pelo usuário.
// Boundary OUT: Actor Apify, banco e interface reais.
import assert from "node:assert/strict";
import {
  calcularScoreInstagram,
  motivoRejeicaoInstagram,
  perfilTemLocalidade,
  perfilTemNicho,
  temSiteProprioInstagram,
} from "../src/lib/instagram-search.ts";

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

console.log("OK: relevância, localidade, DM e score do Instagram validados.");
