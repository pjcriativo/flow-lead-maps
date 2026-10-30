import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

test("Página 04 — CEO Mestre & Agentes de IA: Validação Estrutural e Fidelidade Visual", async (t) => {
  const pageContent = readFileSync("src/routes/agentes.tsx", "utf8");
  const heroContent = readFileSync("src/components/agentes-publico/HeroAgentes.tsx", "utf8");
  const equipeContent = readFileSync("src/components/agentes-publico/EquipeAgentesSection.tsx", "utf8");
  const comoContent = readFileSync("src/components/agentes-publico/ComoFuncionaAgentesSection.tsx", "utf8");
  const ctaContent = readFileSync("src/components/agentes-publico/CtaAgentesSection.tsx", "utf8");
  const navbarContent = readFileSync("src/components/home-publica/NavbarPublica.tsx", "utf8");
  const footerContent = readFileSync("src/components/home-publica/FooterPublico.tsx", "utf8");

  await t.test("1. SEO: Um único H1 e metadados Open Graph para /agentes", () => {
    const h1Matches = heroContent.match(/<h1[^>]*>/g);
    assert.equal(h1Matches?.length, 1, "Deve existir exatamente um H1 no Hero");
    assert.match(heroContent, /Um CEO de IA/);
    assert.match(heroContent, /para coordenar/);
    assert.match(heroContent, /sua equipe\./);
    assert.match(pageContent, /canonical.*\/agentes/);
    assert.match(pageContent, /og:title/);
    assert.match(pageContent, /og:description/);
  });

  await t.test("2. Hero: Imagem cinematográfica do CEO e 3 indicadores", () => {
    assert.match(heroContent, /CEO MESTRE & AGENTES DE IA/);
    assert.match(heroContent, /ceo-hero\.webp/);
    assert.match(heroContent, /Mais vendas/);
    assert.match(heroContent, /Equipe 24\/7/);
    assert.match(heroContent, /Resultados previsíveis/);
    assert.match(heroContent, /Ver planos/);
    assert.match(heroContent, /Conhecer os agentes/);
    assert.match(heroContent, /href="#agentes"/);
  });

  await t.test("3. Equipe de IA: 7 funcionários com retratos, cargos e ícones", () => {
    assert.match(equipeContent, /Uma equipe de IA/);
    assert.match(equipeContent, /pronta para executar\./);
    // 7 Agentes
    assert.match(equipeContent, /CEO Mestre/);
    assert.match(equipeContent, /Estratégia e coordenação/);
    assert.match(equipeContent, /Prospecção/);
    assert.match(equipeContent, /Descoberta de oportunidades/);
    assert.match(equipeContent, /SDR/);
    assert.match(equipeContent, /Qualificação e agendamento/);
    assert.match(equipeContent, /Vendas/);
    assert.match(equipeContent, /Negociações e propostas/);
    assert.match(equipeContent, /Conteúdo/);
    assert.match(equipeContent, /Produção de conteúdo/);
    assert.match(equipeContent, /Tráfego/);
    assert.match(equipeContent, /Gestão de campanhas/);
    assert.match(equipeContent, /SEO/);
    assert.match(equipeContent, /Crescimento orgânico/);
  });

  await t.test("4. Integridade das Imagens dos Agentes no Disco", () => {
    assert.ok(existsSync("public/images/agentes/ceo-hero.webp"), "ceo-hero.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-ceo.webp"), "agente-ceo.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-prospeccao.webp"), "agente-prospeccao.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-sdr.webp"), "agente-sdr.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-vendas.webp"), "agente-vendas.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-conteudo.webp"), "agente-conteudo.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-trafego.webp"), "agente-trafego.webp deve existir");
    assert.ok(existsSync("public/images/agentes/agente-seo.webp"), "agente-seo.webp deve existir");
  });

  await t.test("5. Como Funciona: 3 passos horizontais sequenciais", () => {
    assert.match(comoContent, /Como funciona/);
    assert.match(comoContent, /Do planejamento aos resultados/);
    assert.match(comoContent, /01/);
    assert.match(comoContent, /Defina seu objetivo/);
    assert.match(comoContent, /02/);
    assert.match(comoContent, /O CEO monta a equipe/);
    assert.match(comoContent, /03/);
    assert.match(comoContent, /Acompanhe os resultados/);
  });

  await t.test("6. CTA Final: Faixa luminosa e botões para rotas válidas", () => {
    assert.match(ctaContent, /Sua próxima fase/);
    assert.match(ctaContent, /crescimento/);
    assert.match(ctaContent, /começa aqui\./);
    assert.match(ctaContent, /Ver planos/);
    assert.match(ctaContent, /to="\/pricing"/);
    // Sem teste grátis na página
    assert.doesNotMatch(pageContent, /teste grátis/i);
  });

  await t.test("7. Menus & Navegação: /agentes presente na Navbar e Footer", () => {
    assert.match(navbarContent, /to="\/agentes"/, "Navbar deve ter link para /agentes");
    assert.match(footerContent, /to="\/agentes"/, "Footer deve ter link para /agentes");
  });
});
