import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Home Pública — Validação Estrutural e Fidelidade ao Layout Aprovado", async (t) => {
  const indexContent = readFileSync("src/routes/index.tsx", "utf8");
  const navbarContent = readFileSync("src/components/home-publica/NavbarPublica.tsx", "utf8");
  const heroContent = readFileSync("src/components/home-publica/HeroVideoMockup.tsx", "utf8");
  const recursosContent = readFileSync("src/components/home-publica/RecursosSection.tsx", "utf8");
  const ecoContent = readFileSync("src/components/home-publica/EcossistemaSection.tsx", "utf8");
  const planosContent = readFileSync("src/components/home-publica/PlanosSection.tsx", "utf8");
  const ctaContent = readFileSync("src/components/home-publica/BannerCtaFinal.tsx", "utf8");
  const footerContent = readFileSync("src/components/home-publica/FooterPublico.tsx", "utf8");

  await t.test("1. SEO: Deve possuir um único H1 semântico e metadados Open Graph", () => {
    const h1Matches = indexContent.match(/<h1[^>]*>/g);
    assert.equal(h1Matches?.length, 1, "Deve existir exatamente um H1 na página");
    assert.match(indexContent, /Mais vendas para o seu negócio/);
    assert.match(indexContent, /com IA e automação\./);
    assert.match(indexContent, /canonical/);
    assert.match(indexContent, /og:title/);
  });

  await t.test("2. Cabeçalho: Links reais, Logo e botões Entrar e Ver planos", () => {
    assert.match(navbarContent, /Flow Business/);
    assert.match(navbarContent, /Recursos/);
    assert.match(navbarContent, /CRM & Vendas/);
    assert.match(navbarContent, /Prospecção/);
    assert.match(navbarContent, /Planos/);
    assert.match(navbarContent, /Entrar/);
    assert.match(navbarContent, /to="\/auth"/);
    assert.match(navbarContent, /to="\/pricing"/);
    assert.match(navbarContent, /to="\/crm"/);
    assert.match(navbarContent, /to="\/prospeccao"/);
  });

  await t.test("3. Hero Visual & Player de Vídeo: Métricas reais do dashboard e play interativo", () => {
    // 4 métricas do painel
    assert.match(heroContent, /2\.847/);
    assert.match(heroContent, /463/);
    assert.match(heroContent, /52/);
    assert.match(heroContent, /148\.920/);
    // Elementos do player
    assert.match(heroContent, /<video/);
    assert.match(heroContent, /Ver demonstração/);
    assert.match(heroContent, /Google Maps Pro/);
    assert.match(heroContent, /WhatsApp Ativo/);
  });

  await t.test("4. 6 Cards de Recursos: Presença dos 6 canais com textos corretos", () => {
    assert.match(recursosContent, /Google Maps/);
    assert.match(recursosContent, /Encontre empresas e oportunidades por localização\./);
    assert.match(recursosContent, /Instagram/);
    assert.match(recursosContent, /Descubra perfis e analise oportunidades comerciais\./);
    assert.match(recursosContent, /LinkedIn/);
    assert.match(recursosContent, /Explore oportunidades B2B e organize sua prospecção\./);
    assert.match(recursosContent, /WhatsApp/);
    assert.match(recursosContent, /Centralize conversas e processos de atendimento\./);
    assert.match(recursosContent, /Agentes de IA/);
    assert.match(recursosContent, /Planeje operações e coordene tarefas com inteligência artificial\./);
    assert.match(recursosContent, /Propostas e Contratos/);
    assert.match(recursosContent, /Organize documentos e acompanhe negociações\./);
  });

  await t.test("5. Ecossistema Integrado: Hub central com conexões e 4 benefícios", () => {
    assert.match(ecoContent, /Tudo conectado em um só lugar\./);
    assert.match(ecoContent, /Mais produtividade/);
    assert.match(ecoContent, /Leads organizados/);
    assert.match(ecoContent, /Processos automatizados/);
    assert.match(ecoContent, /Acompanhamento comercial/);
    assert.match(ecoContent, /Conhecer a plataforma/);
  });

  await t.test("6. Planos: Mensal e Anual sem preços inventados e sem oferta de teste grátis", () => {
    assert.match(planosContent, /Plano Mensal/);
    assert.match(planosContent, /Plano Anual/);
    assert.match(planosContent, /Mais escolhido/);
    assert.match(planosContent, /to="\/pricing"/);
    // Regra 8: Não exibir teste grátis na Home
    assert.doesNotMatch(indexContent, /teste grátis/i);
    assert.doesNotMatch(planosContent, /teste grátis/i);
  });

  await t.test("7. Chamada Final & Rodapé: Links e Copyright dinâmico", () => {
    assert.match(ctaContent, /Pronto para escalar suas/);
    assert.match(ctaContent, /vendas com IA\?/);
    assert.match(ctaContent, /to="\/pricing"/);
    assert.match(footerContent, /Flow Business/);
    assert.match(footerContent, /getFullYear\(\)/);
    assert.match(footerContent, /YouTube/i);
    assert.match(footerContent, /Instagram/i);
    assert.match(footerContent, /LinkedIn/i);
  });
});

