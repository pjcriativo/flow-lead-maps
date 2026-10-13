// Suite: Home Premium
// Invariant: a entrada autenticada exibe o dashboard executivo e preserva todos os canais aprovados
// Boundary IN: contrato da rota inicial, composição da Home e bibliotecas dos ícones
// Boundary OUT: renderização pixel a pixel, validada no navegador em produção

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navigation = readFileSync("src/lib/dashboard-navigation.ts", "utf8");
const dashboardRoute = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
const home = readFileSync("src/components/home-premium/HomePremiumView.tsx", "utf8");
const sidebar = readFileSync("src/components/home-premium/DashboardSidebar.tsx", "utf8");

test("a Gestão aparece logo após Home e reúne os oito destinos comerciais na ordem definida", () => {
  const homeIndex = sidebar.indexOf('{ label: "Home"');
  const managementIndex = sidebar.indexOf('{ label: "Gestão"');
  const campaignsIndex = sidebar.indexOf('{ label: "Campanhas"');

  assert.ok(homeIndex >= 0, "Home deve existir na navegação");
  assert.ok(homeIndex < managementIndex, "Gestão deve aparecer imediatamente após Home");
  assert.ok(managementIndex < campaignsIndex, "Campanhas deve aparecer após Gestão");

  const managementItems = [
    ['label: "Leads", section: "leads"', "Leads"],
    ['label: "Minhas Listas", section: "listas"', "Minhas Listas"],
    ['label: "Pipeline", section: "pipeline"', "Pipeline"],
    ['label: "Conversas e WhatsApp", section: "whatsapp"', "Conversas e WhatsApp"],
    ['label: "Automações", section: "automacao"', "Automações"],
    ['label: "Propostas", section: "propostas"', "Propostas"],
    ['label: "Contratos", section: "contratos"', "Contratos"],
    ['label: "Financeiro", section: "financeiro"', "Financeiro"],
  ];

  let previousIndex = -1;
  for (const [source, label] of managementItems) {
    const currentIndex = sidebar.indexOf(source);
    assert.ok(currentIndex > previousIndex, `${label} deve preservar a ordem do submenu Gestão`);
    previousIndex = currentIndex;
  }

  assert.match(sidebar, /MANAGEMENT_SECTION_IDS\.has\(activeSection\)/);
  assert.match(sidebar, /aria-expanded=\{isManagementExpanded\}/);
});

test("WhatsApp continua disponível em Canais de Aquisição sem recriar sua rota", () => {
  assert.match(sidebar, /label: "WhatsApp",\s*section: "whatsapp",\s*icon: SiWhatsapp/);
  assert.equal(
    [...sidebar.matchAll(/label: "Conversas e WhatsApp"/g)].length,
    1,
    "Gestão deve reutilizar uma única definição de destino para Conversas e WhatsApp",
  );
  assert.doesNotMatch(
    sidebar,
    /label: "Conversas",\s*section: "whatsapp"/,
    "Conversas não deve permanecer como entrada principal independente",
  );
});

test("a rota autenticada abre a Home Premium em vez da busca do Google Maps", () => {
  assert.match(navigation, /"home"/);
  assert.match(navigation, /return isDashboardSection\(requested\) \? requested : "home"/);
  assert.match(dashboardRoute, /section === "home"/);
  assert.match(dashboardRoute, /<HomePremiumView/);
});

test("a Home mantém todos os blocos do layout executivo aprovado", () => {
  for (const component of [
    "DashboardHeader",
    "OverviewHero",
    "KpiCards",
    "PerformanceChart",
    "ChannelSummaryCards",
    "RecentActivityCard",
    "UsageInsightsCard",
  ]) {
    assert.match(home, new RegExp(`<${component}`));
  }

  for (const copy of [
    "Desempenho por canal",
    "Distribuição de leads",
    "Leads recentes",
    "Atividades recentes",
    "Plano Profissional",
  ]) {
    assert.match(home, new RegExp(copy));
  }
});

test("a sidebar usa lucide para interface e Simple Icons para canais", () => {
  assert.match(sidebar, /from "lucide-react"/);
  assert.match(sidebar, /from "react-icons\/si"/);

  for (const channel of [
    "Google Maps",
    "Instagram",
    "LinkedIn",
    "YouTube",
    "TikTok",
    "WhatsApp",
    "Business B&B",
  ]) {
    assert.match(sidebar, new RegExp(channel.replace("&", "\\&")));
  }
});
