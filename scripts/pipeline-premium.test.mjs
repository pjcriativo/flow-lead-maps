// Suite: Pipeline Premium
// Invariant: o CRM / Funil Comercial Premium implementa fielmente o layout aprovado com 6 etapas, métricas e painel de oportunidade
// Boundary IN: componentes de Pipeline Premium, contrato da rota do dashboard e ícones
// Boundary OUT: testes de regressão no node:test

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboardRoute = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
const pipelineView = readFileSync("src/components/pipeline-premium/PipelinePremiumView.tsx", "utf8");
const pipelineHeader = readFileSync("src/components/pipeline-premium/PipelineHeader.tsx", "utf8");
const pipelineStats = readFileSync("src/components/pipeline-premium/PipelineStatsCards.tsx", "utf8");
const pipelineFilters = readFileSync("src/components/pipeline-premium/PipelineFiltersBar.tsx", "utf8");
const pipelineBoard = readFileSync("src/components/pipeline-premium/PipelineBoard.tsx", "utf8");
const oppDetails = readFileSync("src/components/pipeline-premium/OpportunityDetailsPanel.tsx", "utf8");
const pipelineData = readFileSync("src/components/pipeline-premium/pipeline-premium-data.ts", "utf8");
const sidebar = readFileSync("src/components/home-premium/DashboardSidebar.tsx", "utf8");

test("a rota autenticada renderiza PipelinePremiumView quando a seção ativa é pipeline", () => {
  assert.match(dashboardRoute, /section === "pipeline"/);
  assert.match(dashboardRoute, /<PipelinePremiumView/);
  assert.match(sidebar, /label: "Pipeline", section: "pipeline", icon: Filter/);
});

test("a tela Pipeline Premium reúne todos os componentes modulares da composição aprovada", () => {
  for (const component of [
    "DashboardHeader",
    "PipelineHeader",
    "PipelineStatsCards",
    "PipelineFiltersBar",
    "PipelineBoard",
    "OpportunityDetailsPanel",
  ]) {
    assert.match(pipelineView, new RegExp(`<${component}`));
  }
});

test("o cabeçalho e os indicadores de métricas possuem os textos e dados aprovados", () => {
  assert.match(pipelineHeader, /Pipeline/);
  assert.match(pipelineHeader, /Acompanhe e gerencie suas oportunidades de vendas em todas as etapas\./);
  assert.match(pipelineHeader, /Kanban/);
  assert.match(pipelineHeader, /Lista/);
  assert.match(pipelineHeader, /Nova oportunidade/);

  for (const metric of [
    "Leads no pipeline",
    "Em negociação",
    "Propostas enviadas",
    "Vendas realizadas",
    "Valor em negociação",
  ]) {
    assert.match(pipelineData, new RegExp(metric));
  }
});

test("as 6 etapas do funil Kanban estão configuradas com valores e contagens fiéis", () => {
  for (const stage of [
    "Novo Lead",
    "Em Contato",
    "Qualificação",
    "Proposta",
    "Negociação",
    "Fechado",
  ]) {
    assert.match(pipelineData, new RegExp(stage));
  }

  for (const totalVal of [
    "R\\$ 0,00",
    "R\\$ 48\\.430,00",
    "R\\$ 98\\.220,00",
    "R\\$ 164\\.500,00",
    "R\\$ 212\\.340,00",
    "R\\$ 356\\.780,00",
  ]) {
    assert.match(pipelineData, new RegExp(totalVal));
  }
});

test("as oportunidades principais e o painel detalhado de oportunidade possuem as seções aprovadas", () => {
  for (const company of [
    "Clínica Odonto Prime",
    "Auto Center Brasil",
    "Academia Evolution",
    "Restaurante Sabor & Arte",
    "Estética Bem Estar",
    "Clínica Vida Leve",
    "Souza Tecnologia",
    "Studio Beleza Total",
    "Mendes Advocacia",
    "Costa Arquitetura",
    "Educa Mais",
    "Construtora Horizonte",
    "Indústria Forte",
    "Clínica Vida Plena",
  ]) {
    assert.match(pipelineData, new RegExp(company));
  }

  for (const sectionTitle of [
    "Informações da empresa",
    "Score e classificação",
    "Visão geral",
    "Atividades",
    "Propostas",
    "Histórico",
  ]) {
    assert.match(oppDetails, new RegExp(sectionTitle));
  }
});

test("os ícones usam lucide-react para sistema e Simple Icons para canais de marca", () => {
  assert.match(pipelineHeader, /from "lucide-react"/);
  assert.match(pipelineStats, /from "lucide-react"/);
  assert.match(pipelineFilters, /from "lucide-react"/);
  assert.match(oppDetails, /from "lucide-react"/);
  assert.match(oppDetails, /from "react-icons\/si"/);
});
