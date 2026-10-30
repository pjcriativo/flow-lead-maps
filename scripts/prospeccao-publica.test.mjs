import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Página 02 — Prospecção Multicanal: Validação Fiel ao Layout Aprovado", async (t) => {
  const pageContent = readFileSync("src/routes/prospeccao.tsx", "utf8");
  const heroContent = readFileSync("src/components/prospeccao-publica/HeroProspeccao.tsx", "utf8");
  const canaisContent = readFileSync("src/components/prospeccao-publica/PrincipaisCanaisSection.tsx", "utf8");
  const filtrosContent = readFileSync("src/components/prospeccao-publica/FiltrosInteligentesSection.tsx", "utf8");
  const comoContent = readFileSync("src/components/prospeccao-publica/ComoFuncionaSection.tsx", "utf8");
  const resContent = readFileSync("src/components/prospeccao-publica/ResultadosReaisSection.tsx", "utf8");
  const ctaContent = readFileSync("src/components/prospeccao-publica/CtaProspeccaoSection.tsx", "utf8");

  await t.test("1. SEO: Um único H1 e metadados Open Graph para /prospeccao", () => {
    const h1Matches = heroContent.match(/<h1[^>]*>/g);
    assert.equal(h1Matches?.length, 1, "Deve existir exatamente um H1 no Hero");
    assert.match(heroContent, /Encontre clientes/);
    assert.match(heroContent, /em todos os canais/);
    assert.match(heroContent, /com IA\./);
    assert.match(pageContent, /canonical.*\/prospeccao/);
    assert.match(pageContent, /og:title/);
  });

  await t.test("2. Hero: Mockup da interface, leads e 5 cards inferiores de canais", () => {
    assert.match(heroContent, /PROSPECÇÃO MULTICANAL/);
    assert.match(heroContent, /Buscar leads, nicho, localização\.\.\./);
    assert.match(heroContent, /Clínica Vida/);
    assert.match(heroContent, /Studio Fitness/);
    assert.match(heroContent, /Casa & Decor/);
    assert.match(heroContent, /Sabor da Mesa/);
    assert.match(heroContent, /Auto Center/);
    assert.match(heroContent, /1\.248 leads/);
    assert.match(heroContent, /932 leads/);
    assert.match(heroContent, /576 leads/);
    assert.match(heroContent, /418 leads/);
    assert.match(heroContent, /2\.143 leads/);
  });

  await t.test("3. Canais de Prospecção: 5 cards completos (Instagram, LinkedIn, YouTube, TikTok, Google Maps)", () => {
    assert.match(canaisContent, /Prospecção em/);
    assert.match(canaisContent, /múltiplos canais\./);
    assert.match(canaisContent, /Instagram/);
    assert.match(canaisContent, /LinkedIn/);
    assert.match(canaisContent, /YouTube/);
    assert.match(canaisContent, /TikTok/);
    assert.match(canaisContent, /Google Maps/);
  });

  await t.test("4. Filtros Inteligentes: 6 bullets + painel de busca + cards de leads", () => {
    assert.match(filtrosContent, /Resultados mais/);
    assert.match(filtrosContent, /rápidos e precisos\./);
    assert.match(filtrosContent, /Nicho e palavras-chave/);
    assert.match(filtrosContent, /Tipo de conta/);
    assert.match(filtrosContent, /Localização/);
    assert.match(filtrosContent, /E-mail e WhatsApp/);
    assert.match(filtrosContent, /Seguidores e engajamento/);
    assert.match(filtrosContent, /Conta comercial/);
    assert.match(filtrosContent, /Buscar leads/);
    assert.match(filtrosContent, /Limpar filtros/);
  });

  await t.test("5. Como Funciona: 4 etapas sequenciais", () => {
    assert.match(comoContent, /Da busca ao cliente,/);
    assert.match(comoContent, /em 4 etapas\./);
    assert.match(comoContent, /01/);
    assert.match(comoContent, /Buscar/);
    assert.match(comoContent, /02/);
    assert.match(comoContent, /Qualificar/);
    assert.match(comoContent, /03/);
    assert.match(comoContent, /Adicionar ao CRM/);
    assert.match(comoContent, /04/);
    assert.match(comoContent, /Converter/);
  });

  await t.test("6. Resultados Reais: 3 cards com valores numéricos e mini gráficos", () => {
    assert.match(resContent, /Mais oportunidades\./);
    assert.match(resContent, /Mais clientes\./);
    assert.match(resContent, /Leads encontrados/);
    assert.match(resContent, /2\.847/);
    assert.match(resContent, /Taxa de qualificação/);
    assert.match(resContent, /28%/);
    assert.match(resContent, /Leads no CRM/);
    assert.match(resContent, /463/);
  });

  await t.test("7. CTA Final: Headline aprovada e botões funcionais", () => {
    assert.match(ctaContent, /PRONTO PARA ENCONTRAR MAIS CLIENTES\?/);
    assert.match(ctaContent, /Comece sua/);
    assert.match(ctaContent, /prospecção agora\./);
    assert.match(ctaContent, /Ver planos/);
    assert.match(ctaContent, /Falar com especialista/);
    assert.match(ctaContent, /to="\/pricing"/);
    // Sem teste grátis
    assert.doesNotMatch(pageContent, /teste grátis/i);
  });
});
