import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Página 02 — Prospecção Multicanal: Validação Estrutural e Fidelidade Visual", async (t) => {
  const pageContent = readFileSync("src/routes/prospeccao.tsx", "utf8");
  const heroContent = readFileSync("src/components/prospeccao-publica/HeroProspeccao.tsx", "utf8");
  const principaisContent = readFileSync("src/components/prospeccao-publica/PrincipaisCanaisSection.tsx", "utf8");
  const compContent = readFileSync("src/components/prospeccao-publica/CanaisComplementaresSection.tsx", "utf8");
  const comoContent = readFileSync("src/components/prospeccao-publica/ComoFuncionaSection.tsx", "utf8");
  const intelContent = readFileSync("src/components/prospeccao-publica/InteligenciaComercialSection.tsx", "utf8");
  const ctaContent = readFileSync("src/components/prospeccao-publica/CtaProspeccaoSection.tsx", "utf8");

  await t.test("1. SEO: Um único H1 e metadados Open Graph para /prospeccao", () => {
    const h1Matches = heroContent.match(/<h1[^>]*>/g);
    assert.equal(h1Matches?.length, 1, "Deve existir exatamente um H1 no Hero");
    assert.match(heroContent, /Encontre seus/);
    assert.match(heroContent, /próximos clientes/);
    assert.match(heroContent, /nos canais certos\./);
    assert.match(pageContent, /canonical.*\/prospeccao/);
    assert.match(pageContent, /og:title/);
  });

  await t.test("2. Hero: Presença de botões, 3 badges e painéis de Google Maps, Instagram e LinkedIn", () => {
    assert.match(heroContent, /PROSPECÇÃO MULTICANAL/);
    assert.match(heroContent, /Ver planos/);
    assert.match(heroContent, /Conhecer os recursos/);
    assert.match(heroContent, /Mais oportunidades/);
    assert.match(heroContent, /Dados qualificados/);
    assert.match(heroContent, /Integração com CRM/);
    assert.match(heroContent, /Clínicas odontológicas em São Paulo - SP/);
    assert.match(heroContent, /Oral Prime/);
    assert.match(heroContent, /Instagram/);
    assert.match(heroContent, /LinkedIn/);
  });

  await t.test("3. Principais Canais: Google Maps, Instagram e LinkedIn com 5 itens de checklist cada", () => {
    assert.match(principaisContent, /Google Maps/);
    assert.match(principaisContent, /Busca por segmento/);
    assert.match(principaisContent, /Localização/);
    assert.match(principaisContent, /Dados empresariais/);
    assert.match(principaisContent, /Filtros avançados/);
    assert.match(principaisContent, /Organização em listas/);

    assert.match(principaisContent, /Instagram/);
    assert.match(principaisContent, /Pesquisa de perfis/);
    assert.match(principaisContent, /Filtros de segmentação/);
    assert.match(principaisContent, /Análise de perfis/);
    assert.match(principaisContent, /Inteligência competitiva/);
    assert.match(principaisContent, /Organização no CRM/);

    assert.match(principaisContent, /LinkedIn/);
    assert.match(principaisContent, /Empresas e profissionais/);
    assert.match(principaisContent, /Segmentação comercial/);
    assert.match(principaisContent, /Organização de oportunidades/);
    assert.match(principaisContent, /Integração com CRM/);
    assert.match(principaisContent, /Planejamento de prospecção/);
  });

  await t.test("4. Canais Complementares: Business B2B, YouTube e TikTok", () => {
    assert.match(compContent, /Business B2B/);
    assert.match(compContent, /Empresas e dados corporativos\./);
    assert.match(compContent, /YouTube/);
    assert.match(compContent, /Canais e criadores do seu nicho\./);
    assert.match(compContent, /TikTok/);
    assert.match(compContent, /Perfis e tendências do seu mercado\./);
  });

  await t.test("5. Como Funciona: 3 passos sequenciais", () => {
    assert.match(comoContent, /Da busca ao cliente, em/);
    assert.match(comoContent, /3 passos\./);
    assert.match(comoContent, /Escolha seu público/);
    assert.match(comoContent, /Descubra oportunidades/);
    assert.match(comoContent, /Organize suas vendas/);
  });

  await t.test("6. Inteligência Comercial: Apresentação da arquitetura em 5 etapas", () => {
    assert.match(intelContent, /Da prospecção à estratégia comercial\./);
    assert.match(intelContent, /Canais de Prospecção/);
    assert.match(intelContent, /Leads Qualificados/);
    assert.match(intelContent, /CRM Organização/);
    assert.match(intelContent, /CEO Mestre/);
    assert.match(intelContent, /Equipe Comercial/);
  });

  await t.test("7. CTA Final: Headline e botões para rotas válidas", () => {
    assert.match(ctaContent, /Seu próximo cliente pode estar a uma busca de distância\./);
    assert.match(ctaContent, /Ver planos/);
    assert.match(ctaContent, /Conhecer o CRM/);
    assert.match(ctaContent, /to="\/pricing"/);
  });
});
