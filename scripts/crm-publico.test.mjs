import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Página 03 — CRM & Vendas: Validação Estrutural e Fidelidade Visual", async (t) => {
  const pageContent = readFileSync("src/routes/crm.tsx", "utf8");
  const heroContent = readFileSync("src/components/crm-publico/HeroCrm.tsx", "utf8");
  const recursosContent = readFileSync("src/components/crm-publico/RecursosCrmSection.tsx", "utf8");
  const waContent = readFileSync("src/components/crm-publico/WhatsAppIntegradoSection.tsx", "utf8");
  const comoContent = readFileSync("src/components/crm-publico/ComoFuncionaCrmSection.tsx", "utf8");
  const resContent = readFileSync("src/components/crm-publico/ResultadosIndicadoresSection.tsx", "utf8");
  const ctaContent = readFileSync("src/components/crm-publico/CtaCrmSection.tsx", "utf8");

  await t.test("1. SEO: Um único H1 e metadados Open Graph para /crm", () => {
    const h1Matches = heroContent.match(/<h1[^>]*>/g);
    assert.equal(h1Matches?.length, 1, "Deve existir exatamente um H1 no Hero");
    assert.match(heroContent, /Organize suas/);
    assert.match(heroContent, /vendas e aumente/);
    assert.match(heroContent, /seus resultados\./);
    assert.match(pageContent, /canonical.*\/crm/);
    assert.match(pageContent, /og:title/);
  });

  await t.test("2. Hero & Kanban: Métricas e 5 colunas com cards", () => {
    assert.match(heroContent, /CRM & VENDAS/);
    assert.match(heroContent, /Pipeline visual/);
    assert.match(heroContent, /Automação de vendas/);
    assert.match(heroContent, /Mais conversões/);
    // 4 métricas
    assert.match(heroContent, /2\.847/);
    assert.match(heroContent, /463/);
    assert.match(heroContent, /126/);
    assert.match(heroContent, /52/);
    // 5 colunas
    assert.match(heroContent, /Novos Leads/);
    assert.match(heroContent, /Em Contato/);
    assert.match(heroContent, /Proposta/);
    assert.match(heroContent, /Negociação/);
    assert.match(heroContent, /Clientes/);
    // Cards
    assert.match(heroContent, /Clínica Vida/);
    assert.match(heroContent, /Studio Fitness/);
  });

  await t.test("3. Recursos do CRM: 6 cards completos com navegação funcional", () => {
    assert.match(recursosContent, /Gestão de Leads/);
    assert.match(recursosContent, /Pipeline de Vendas/);
    assert.match(recursosContent, /WhatsApp Integrado/);
    assert.match(recursosContent, /Propostas Comerciais/);
    assert.match(recursosContent, /Contratos Digitais/);
    assert.match(recursosContent, /Campanhas/);
  });

  await t.test("4. WhatsApp Integrado: Interface Web com 3 colunas e checklist", () => {
    assert.match(waContent, /Atendimento e vendas/);
    assert.match(waContent, /no automático\./);
    assert.match(waContent, /Caixa de entrada unificada/);
    assert.match(waContent, /Respostas automáticas com IA/);
    assert.match(waContent, /Organização por etiquetas/);
    assert.match(waContent, /Conversões direto no CRM/);
    assert.match(waContent, /Clínica Vida/);
    assert.match(waContent, /Detalhes do Lead/);
    assert.match(waContent, /Adicionar ao CRM/);
  });

  await t.test("5. Como Funciona: 4 etapas sequenciais", () => {
    assert.match(comoContent, /Do lead ao cliente, em/);
    assert.match(comoContent, /4 etapas\./);
    assert.match(comoContent, /Capturar/);
    assert.match(comoContent, /Qualificar/);
    assert.match(comoContent, /Acompanhar/);
    assert.match(comoContent, /Converter/);
  });

  await t.test("6. Resultados e Indicadores: 3 composições gráficas", () => {
    assert.match(resContent, /Mais organização\./);
    assert.match(resContent, /Mais/);
    assert.match(resContent, /vendas\./);
    assert.match(resContent, /Evolução de Vendas/);
    assert.match(resContent, /Leads por Origem/);
    assert.match(resContent, /Taxa de Conversão/);
    assert.match(resContent, /48\.920/);
    assert.match(resContent, /2\.847/);
    assert.match(resContent, /3\.2%/);
  });

  await t.test("7. CTA Final: Headline e botões para rotas válidas", () => {
    assert.match(ctaContent, /Transforme oportunidades em resultados\./);
    assert.match(ctaContent, /Ver planos/);
    assert.match(ctaContent, /Falar com especialista/);
    assert.match(ctaContent, /to="\/pricing"/);
    // Sem teste grátis na página
    assert.doesNotMatch(pageContent, /teste grátis/i);
  });
});

