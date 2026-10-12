// Suite: Leads Premium
// Invariant: a Central de Leads Premium implementa fielmente o layout aprovado com todos os indicadores, tabela e painel lateral
// Boundary IN: componentes de Leads Premium, contrato da rota do dashboard e ícones
// Boundary OUT: testes de regressão no node:test

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboardRoute = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
const leadsView = readFileSync("src/components/leads-premium/LeadsPremiumView.tsx", "utf8");
const leadsHeader = readFileSync("src/components/leads-premium/LeadsHeader.tsx", "utf8");
const leadsStats = readFileSync("src/components/leads-premium/LeadsStatsCards.tsx", "utf8");
const leadsFilters = readFileSync("src/components/leads-premium/LeadsFiltersBar.tsx", "utf8");
const leadsTable = readFileSync("src/components/leads-premium/LeadsTable.tsx", "utf8");
const leadDetails = readFileSync("src/components/leads-premium/LeadDetailsPanel.tsx", "utf8");
const leadsData = readFileSync("src/components/leads-premium/leads-premium-data.ts", "utf8");
const sidebar = readFileSync("src/components/home-premium/DashboardSidebar.tsx", "utf8");

test("a rota autenticada renderiza LeadsPremiumView quando a seção ativa é leads", () => {
  assert.match(dashboardRoute, /section === "leads"/);
  assert.match(dashboardRoute, /<LeadsPremiumView/);
  assert.match(sidebar, /label: "Leads", section: "leads", icon: Share2/);
});

test("a tela Leads Premium reúne todos os componentes modulares da composição aprovada", () => {
  for (const component of [
    "DashboardHeader",
    "LeadsHeader",
    "LeadsStatsCards",
    "LeadsFiltersBar",
    "LeadsTable",
    "LeadDetailsPanel",
  ]) {
    assert.match(leadsView, new RegExp(`<${component}`));
  }
});

test("o cabeçalho e os indicadores de métricas possuem os textos e dados aprovados", () => {
  assert.match(leadsHeader, /Leads/);
  assert.match(leadsHeader, /Gerencie todos os leads capturados em seus canais de aquisição\./);
  assert.match(leadsHeader, /Importar/);
  assert.match(leadsHeader, /Exportar/);
  assert.match(leadsHeader, /Novo lead/);

  for (const metric of [
    "Total de leads",
    "Em contato",
    "Oportunidades",
    "Propostas",
    "Clientes",
  ]) {
    assert.match(leadsData, new RegExp(metric));
  }
});

test("a barra de filtros contém todos os campos e ações requeridas", () => {
  for (const filterText of [
    "Todos os canais",
    "Todos os status",
    "Todas as tags",
    "Todos os scores",
    "Mais filtros",
  ]) {
    assert.match(leadsFilters, new RegExp(filterText));
  }
});

test("a tabela e o painel detalhado de lead contêm as empresas e seções do layout aprovado", () => {
  for (const company of [
    "Clínica Odonto Prime",
    "Restaurante Sabor & Arte",
    "Academia Evolution",
    "Clínica Vida Leve",
    "Mendes Advocacia",
    "Costa Arquitetura",
    "Souza Tecnologia",
    "Estética Bem Estar",
    "Auto Center Brasil",
    "Studio Beleza Total",
  ]) {
    assert.match(leadsData, new RegExp(company));
  }

  for (const sectionTitle of [
    "Informações da empresa",
    "Contatos e canais",
    "Score e classificação",
    "Visão geral",
    "Contatos",
    "Histórico",
    "Anotações",
  ]) {
    assert.match(leadDetails, new RegExp(sectionTitle));
  }
});

test("os ícones usam lucide-react para sistema e Simple Icons para canais de marca", () => {
  assert.match(leadsHeader, /from "lucide-react"/);
  assert.match(leadsStats, /from "lucide-react"/);
  assert.match(leadsFilters, /from "lucide-react"/);
  assert.match(leadsTable, /from "lucide-react"/);
  assert.match(leadDetails, /from "lucide-react"/);
  assert.match(leadDetails, /from "react-icons\/si"/);
});
