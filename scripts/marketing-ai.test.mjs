import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("todos os componentes de Flow Marketing AI existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/marketing-ai/marketing-data.ts",
    "src/components/marketing-ai/MarketingTopBar.tsx",
    "src/components/marketing-ai/MarketingHeader.tsx",
    "src/components/marketing-ai/MarketingKpiCards.tsx",
    "src/components/marketing-ai/MarketingTabsBar.tsx",
    "src/components/marketing-ai/MarketingFiltersBar.tsx",
    "src/components/marketing-ai/ProductCard.tsx",
    "src/components/marketing-ai/ProductListView.tsx",
    "src/components/marketing-ai/MarketingAssistantPanel.tsx",
    "src/components/marketing-ai/NovoProdutoModal.tsx",
    "src/components/marketing-ai/ComoFuncionaModal.tsx",
    "src/components/marketing-ai/ProdutoDetalhesDrawer.tsx",
    "src/components/marketing-ai/FlowMarketingPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo obrigatório ausente: ${file}`);
  }
});

test("DashboardSidebar possui Flow Marketing AI posicionado entre Campanhas e Conversas com ícones aprovados", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('label: "Flow Marketing AI"'),
    "Deve conter o item Flow Marketing AI",
  );
  assert.ok(
    sidebarContent.includes("Sparkles"),
    "Deve usar o ícone Sparkles",
  );

  // Ordem de navegação
  const campanhasIdx = sidebarContent.indexOf('label: "Campanhas"');
  const aiIdx = sidebarContent.indexOf('label: "Flow Marketing AI"');
  const conversasIdx = sidebarContent.indexOf('label: "Conversas"');

  assert.ok(campanhasIdx < aiIdx, "Campanhas deve preceder Flow Marketing AI");
  assert.ok(aiIdx < conversasIdx, "Flow Marketing AI deve preceder Conversas");

  // Estrutura definitiva do submenu e seus ícones
  assert.ok(sidebarContent.includes("MARKETING_SUBITEMS"), "Deve declarar MARKETING_SUBITEMS");
  assert.ok(sidebarContent.includes('label: "Produtos e Serviços"'), "Submenu deve ter Produtos e Serviços");
  assert.ok(sidebarContent.includes('label: "Agentes e Estratégias"'), "Submenu deve ter Agentes e Estratégias");
  assert.ok(sidebarContent.includes('label: "Campanhas e Conteúdos"'), "Submenu deve ter Campanhas e Conteúdos");
  assert.ok(sidebarContent.includes('label: "Calendário e Publicações"'), "Submenu deve ter Calendário e Publicações");
  assert.ok(sidebarContent.includes('label: "Resultados e ROI"'), "Submenu deve ter Resultados e ROI");

  assert.ok(sidebarContent.includes("Package"), "Deve usar ícone Package para Produtos e Serviços");
  assert.ok(sidebarContent.includes("BrainCircuit"), "Deve usar ícone BrainCircuit para Agentes e Estratégias");
  assert.ok(sidebarContent.includes("Megaphone"), "Deve usar ícone Megaphone para Campanhas e Conteúdos");
  assert.ok(sidebarContent.includes("CalendarDays"), "Deve usar ícone CalendarDays para Calendário e Publicações");
  assert.ok(sidebarContent.includes("ChartNoAxesCombined"), "Deve usar ícone ChartNoAxesCombined para Resultados e ROI");
});

test("a rota dashboard renderiza FlowMarketingPage com isolamento e visual dark premium", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("FlowMarketingPage"),
    "Deve importar FlowMarketingPage",
  );
  assert.ok(
    dashContent.includes('{section === "marketing" && ('),
    "Deve renderizar condicionalmente section === 'marketing'",
  );
  assert.ok(
    dashContent.includes('section === "marketing"'),
    "Deve aplicar o tema dark para marketing",
  );
});

test("os 6 indicadores superiores e os 6 produtos da imagem aprovada estão configurados com fidelidade", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/marketing-data.ts"),
    "utf8",
  );

  // 6 Indicadores
  assert.ok(dataContent.includes("Produtos cadastrados") && dataContent.includes('"8"'));
  assert.ok(dataContent.includes("Campanhas geradas") && dataContent.includes('"12"'));
  assert.ok(dataContent.includes("Leads gerados") && dataContent.includes('"486"'));
  assert.ok(dataContent.includes("Propostas enviadas") && dataContent.includes('"145"'));
  assert.ok(dataContent.includes("Vendas realizadas") && dataContent.includes('"18"'));
  assert.ok(dataContent.includes("Receita atribuída") && dataContent.includes('"R$ 24.580"'));

  // 6 Produtos
  assert.ok(dataContent.includes("Experiência Gastronômica Premium"));
  assert.ok(dataContent.includes("Hospedagem Boutique"));
  assert.ok(dataContent.includes("Plano Fitness Premium"));
  assert.ok(dataContent.includes("Consultoria Imobiliária"));
  assert.ok(dataContent.includes("Consultoria Empresarial"));
  assert.ok(dataContent.includes("Tratamento Estético Avançado"));

  // 3 Insights
  assert.ok(dataContent.includes("Alta oportunidade"));
  assert.ok(dataContent.includes("Sugestão de melhoria"));
  assert.ok(dataContent.includes("Novo nicho identificado"));
});

test("o assistente de marketing, insights e card promocional do foguete estão presentes no painel lateral", () => {
  const panelContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/MarketingAssistantPanel.tsx"),
    "utf8",
  );

  assert.ok(panelContent.includes("Assistente de Marketing com IA"));
  assert.ok(panelContent.includes("Analisar meus produtos"));
  assert.ok(panelContent.includes("Sugerir nova campanha"));
  assert.ok(panelContent.includes("Criar calendário de marketing"));
  assert.ok(panelContent.includes("Gerar conteúdo para redes sociais"));
  assert.ok(panelContent.includes("Analisar concorrentes"));
  assert.ok(panelContent.includes("Insights da IA"));
  assert.ok(panelContent.includes("Crie campanhas completas com IA"));
  assert.ok(panelContent.includes("Saiba mais"));
});
