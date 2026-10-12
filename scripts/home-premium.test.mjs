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
