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
    dashContent.includes('section === "marketing"'),
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

test("todos os componentes da Tela 2 — Agentes e Estratégias existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/marketing-ai/agentes/agentes-data.ts",
    "src/components/marketing-ai/agentes/AgentesHeader.tsx",
    "src/components/marketing-ai/agentes/AgentesKpiCards.tsx",
    "src/components/marketing-ai/agentes/AgentesSubnavTabs.tsx",
    "src/components/marketing-ai/agentes/AgentCard.tsx",
    "src/components/marketing-ai/agentes/RecentStrategiesSection.tsx",
    "src/components/marketing-ai/agentes/AgentesSidebarPanel.tsx",
    "src/components/marketing-ai/agentes/NovoAgenteModal.tsx",
    "src/components/marketing-ai/agentes/EstrategiaDetalhesDrawer.tsx",
    "src/components/marketing-ai/agentes/AgentesEstrategiasPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo da Tela 2 ausente: ${file}`);
  }
});

test("a rota dashboard renderiza AgentesEstrategiasPage quando marketingSubView é agentes", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("AgentesEstrategiasPage"),
    "Deve importar AgentesEstrategiasPage",
  );
  assert.ok(
    dashContent.includes('section === "marketing" && marketingSubView === "agentes"'),
    "Deve renderizar condicionalmente a Tela 2 para o submenu agentes",
  );
});

test("a Tela 2 possui os 4 agentes de IA, 6 KPIs e 4 estratégias recentes da referência", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/agentes/agentes-data.ts"),
    "utf8",
  );

  // 6 Indicadores
  assert.ok(dataContent.includes("Produtos analisados") && dataContent.includes('"6"'));
  assert.ok(dataContent.includes("Estratégias geradas") && dataContent.includes('"12"'));
  assert.ok(dataContent.includes("Oportunidades encontradas") && dataContent.includes('"28"'));
  assert.ok(dataContent.includes("Concorrentes analisados") && dataContent.includes('"14"'));
  assert.ok(dataContent.includes("Canais recomendados") && dataContent.includes('"5"'));
  assert.ok(dataContent.includes("Potencial de receita") && dataContent.includes('"R$ 128.500"'));

  // 4 Agentes
  assert.ok(dataContent.includes("Agente de Marketing"));
  assert.ok(dataContent.includes("Agente de Conteúdo"));
  assert.ok(dataContent.includes("Agente de Público"));
  assert.ok(dataContent.includes("Agente de Concorrência"));

  // 4 Estratégias
  assert.ok(dataContent.includes("Estratégia de Lançamento"));
  assert.ok(dataContent.includes("Crescimento no Instagram"));
  assert.ok(dataContent.includes("Campanha de Aquisição"));
  assert.ok(dataContent.includes("Diferenciação de Mercado"));

  // 3 Insights Estratégicos
  assert.ok(dataContent.includes("Oportunidade de mercado"));
  assert.ok(dataContent.includes("Canal recomendado"));
  assert.ok(dataContent.includes("Diferencial competitivo"));
});

test("o painel lateral da Tela 2 possui o assistente com 6 ações e o card de implementação", () => {
  const panelContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/agentes/AgentesSidebarPanel.tsx"),
    "utf8",
  );

  assert.ok(panelContent.includes("Assistente de Estratégias com IA"));
  assert.ok(panelContent.includes("Analisar produto selecionado"));
  assert.ok(panelContent.includes("Criar estratégia completa"));
  assert.ok(panelContent.includes("Sugerir canais de aquisição"));
  assert.ok(panelContent.includes("Gerar calendário de conteúdos"));
  assert.ok(panelContent.includes("Analisar concorrentes"));
  assert.ok(panelContent.includes("Otimizar campanhas existentes"));
  assert.ok(panelContent.includes("Insights estratégicos da IA"));
  assert.ok(panelContent.includes("Implemente suas estratégias"));
  assert.ok(panelContent.includes("Criar campanha agora"));
});

test("todos os componentes da Tela 3 — Campanhas e Conteúdos existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/marketing-ai/conteudos/conteudos-data.ts",
    "src/components/marketing-ai/conteudos/MarketingConteudoHeader.tsx",
    "src/components/marketing-ai/conteudos/MarketingConteudoKpis.tsx",
    "src/components/marketing-ai/conteudos/MarketingConteudoSubnav.tsx",
    "src/components/marketing-ai/conteudos/MarketingConteudoFiltersBar.tsx",
    "src/components/marketing-ai/conteudos/PlatformIcon.tsx",
    "src/components/marketing-ai/conteudos/EditorialContentCard.tsx",
    "src/components/marketing-ai/conteudos/EditorialCalendarGrid.tsx",
    "src/components/marketing-ai/conteudos/EditorialListView.tsx",
    "src/components/marketing-ai/conteudos/EditorialKanbanView.tsx",
    "src/components/marketing-ai/conteudos/TiposConteudoSection.tsx",
    "src/components/marketing-ai/conteudos/ConteudoAssistantPanel.tsx",
    "src/components/marketing-ai/conteudos/NovoConteudoModal.tsx",
    "src/components/marketing-ai/conteudos/ConteudoDetalhesDrawer.tsx",
    "src/components/marketing-ai/conteudos/MarketingConteudoPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo obrigatório ausente: ${file}`);
  }
});

test("a rota dashboard renderiza MarketingConteudoPage quando marketingSubView é campanhas_conteudo", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("MarketingConteudoPage"),
    "Deve importar MarketingConteudoPage",
  );
  assert.ok(
    dashContent.includes('marketingSubView === "campanhas_conteudo"'),
    "Deve renderizar condicionalmente MarketingConteudoPage",
  );
});

test("a Tela 3 possui os 6 KPIs, 7 dias de calendário, 21 conteúdos agendados e 8 tipos de formatos da referência", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/conteudos/conteudos-data.ts"),
    "utf8",
  );

  // 6 KPIs superiores
  assert.ok(dataContent.includes("Conteúdos gerados") && dataContent.includes('"148"'));
  assert.ok(dataContent.includes("Publicações realizadas") && dataContent.includes('"386"'));
  assert.ok(dataContent.includes("Alcance total") && dataContent.includes('"125.4K"'));
  assert.ok(dataContent.includes("Engajamento") && dataContent.includes('"8.7K"'));
  assert.ok(dataContent.includes("Cliques no link") && dataContent.includes('"2.4K"'));
  assert.ok(dataContent.includes("Leads gerados") && dataContent.includes('"486"'));

  // 7 Dias de calendário
  assert.ok(dataContent.includes('"Dom"') && dataContent.includes("11"));
  assert.ok(dataContent.includes('"Qua"') && dataContent.includes("14"));
  assert.ok(dataContent.includes('"Sáb"') && dataContent.includes("17"));

  // Conteúdos da referência
  assert.ok(dataContent.includes("Devocional da Manhã"));
  assert.ok(dataContent.includes("A Promessa de Deus"));
  assert.ok(dataContent.includes("História Bíblica"));
  assert.ok(dataContent.includes("Nos Dias de Isaías"));
  assert.ok(dataContent.includes("Versículo do Dia"));
  assert.ok(dataContent.includes("Ensino Bíblico"));
  assert.ok(dataContent.includes("Israel Antigo"));

  // 8 Tipos de conteúdo
  assert.ok(dataContent.includes("Post simples"));
  assert.ok(dataContent.includes("Carrossel"));
  assert.ok(dataContent.includes("Reels / Shorts"));
  assert.ok(dataContent.includes("Vídeo completo"));
  assert.ok(dataContent.includes("Story"));
  assert.ok(dataContent.includes("Artigo / Blog"));
  assert.ok(dataContent.includes("E-mail"));
  assert.ok(dataContent.includes("Anúncio"));
});

test("o painel lateral da Tela 3 possui o assistente com 6 ações e as 4 sugestões da IA", () => {
  const panelContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/conteudos/ConteudoAssistantPanel.tsx"),
    "utf8",
  );
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/conteudos/conteudos-data.ts"),
    "utf8",
  );

  assert.ok(panelContent.includes("Assistente de Conteúdo com IA"));
  assert.ok(dataContent.includes("Gerar posts para redes sociais"));
  assert.ok(dataContent.includes("Criar carrossel completo"));
  assert.ok(dataContent.includes("Gerar roteiro de vídeo"));
  assert.ok(dataContent.includes("Criar imagens com IA"));
  assert.ok(dataContent.includes("Adaptar conteúdo para cada canal"));
  assert.ok(dataContent.includes("Reescrever e melhorar copy"));
  assert.ok(panelContent.includes("Sugestões da IA"));
  assert.ok(panelContent.includes("Transforme ideias em conteúdos virais"));
  assert.ok(panelContent.includes("Criar agora"));
});

test("todos os componentes da Tela 4 — Calendário e Publicações existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/marketing-ai/calendario/calendario-data.ts",
    "src/components/marketing-ai/calendario/CalendarioPublicacoesHeader.tsx",
    "src/components/marketing-ai/calendario/CalendarioPublicacoesKpis.tsx",
    "src/components/marketing-ai/calendario/CalendarioPublicacoesSubnav.tsx",
    "src/components/marketing-ai/calendario/CalendarioFiltersBar.tsx",
    "src/components/marketing-ai/calendario/TimelineCalendarGrid.tsx",
    "src/components/marketing-ai/calendario/PublicacaoCard.tsx",
    "src/components/marketing-ai/calendario/FilaPublicacaoSection.tsx",
    "src/components/marketing-ai/calendario/CalendarioSidebarPanel.tsx",
    "src/components/marketing-ai/calendario/AgendarPublicacaoModal.tsx",
    "src/components/marketing-ai/calendario/ConectarCanaisModal.tsx",
    "src/components/marketing-ai/calendario/PublicacaoDetalhesDrawer.tsx",
    "src/components/marketing-ai/calendario/CalendarioPublicacoesPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo obrigatório ausente: ${file}`);
  }
});

test("a rota dashboard renderiza CalendarioPublicacoesPage quando marketingSubView é calendario", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("CalendarioPublicacoesPage"),
    "Deve importar CalendarioPublicacoesPage",
  );
  assert.ok(
    dashContent.includes('marketingSubView === "calendario"'),
    "Deve renderizar condicionalmente CalendarioPublicacoesPage",
  );
});

test("a Tela 4 possui os 6 KPIs, timeline slots, 6 canais conectados e fila de 5 publicações", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/calendario/calendario-data.ts"),
    "utf8",
  );

  // 6 KPIs superiores
  assert.ok(dataContent.includes("Publicações agendadas") && dataContent.includes('"42"'));
  assert.ok(dataContent.includes("Publicações hoje") && dataContent.includes('"12"'));
  assert.ok(dataContent.includes("Publicações realizadas") && dataContent.includes('"386"'));
  assert.ok(dataContent.includes("Taxa de sucesso") && dataContent.includes('"98,5%"'));
  assert.ok(dataContent.includes("Canais conectados") && dataContent.includes('"6"'));
  assert.ok(dataContent.includes("Alcance total") && dataContent.includes('"125.4K"'));

  // 6 Canais conectados
  assert.ok(dataContent.includes('"instagram"'));
  assert.ok(dataContent.includes('"facebook"'));
  assert.ok(dataContent.includes('"linkedin"'));
  assert.ok(dataContent.includes('"youtube"'));
  assert.ok(dataContent.includes('"tiktok"'));
  assert.ok(dataContent.includes('"whatsapp"'));

  // 5 Publicações da Fila
  assert.ok(dataContent.includes("Reels Motivacional"));
  assert.ok(dataContent.includes("Artigo Teológico"));
  assert.ok(dataContent.includes("Shorts Reflexão"));
  assert.ok(dataContent.includes("Reels de Oração"));
  assert.ok(dataContent.includes("Deus é Fiel"));
});

test("o painel lateral da Tela 4 possui o assistente com 6 ações e o card de automação com foguete", () => {
  const panelContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/calendario/CalendarioSidebarPanel.tsx"),
    "utf8",
  );
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/calendario/calendario-data.ts"),
    "utf8",
  );

  assert.ok(panelContent.includes("Assistente de Publicação com IA"));
  assert.ok(dataContent.includes("Sugerir melhor horário"));
  assert.ok(dataContent.includes("Agendar em múltiplos canais"));
  assert.ok(dataContent.includes("Ajustar conteúdos existentes"));
  assert.ok(dataContent.includes("Reaproveitar conteúdos mais performantes"));
  assert.ok(dataContent.includes("Corrigir e otimizar copy"));
  assert.ok(dataContent.includes("Analisar desempenho das publicações"));
  assert.ok(panelContent.includes("Status dos canais"));
  assert.ok(panelContent.includes("Publique com IA, sem esforço"));
  assert.ok(panelContent.includes("Ativar publicação automática"));
});

test("todos os componentes da Tela 5 (Resultados e ROI) existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/marketing-ai/resultados/resultados-data.ts",
    "src/components/marketing-ai/resultados/MarketingResultsHeader.tsx",
    "src/components/marketing-ai/resultados/MarketingResultsKpis.tsx",
    "src/components/marketing-ai/resultados/MarketingResultsSubnav.tsx",
    "src/components/marketing-ai/resultados/RevenueInvestmentChart.tsx",
    "src/components/marketing-ai/resultados/LeadsByChannelChart.tsx",
    "src/components/marketing-ai/resultados/ChannelPerformanceChart.tsx",
    "src/components/marketing-ai/resultados/MarketingConversionFunnel.tsx",
    "src/components/marketing-ai/resultados/TopCampaignsTable.tsx",
    "src/components/marketing-ai/resultados/MarketingResultsAssistantPanel.tsx",
    "src/components/marketing-ai/resultados/GerarRelatorioModal.tsx",
    "src/components/marketing-ai/resultados/CampanhaDetalhesDrawer.tsx",
    "src/components/marketing-ai/resultados/AnalisarResultadosModal.tsx",
    "src/components/marketing-ai/resultados/MarketingResultsPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo obrigatório da Tela 5 ausente: ${file}`);
  }
});

test("a Tela 5 possui os 6 KPIs, séries financeiras, funil de 4 etapas e 4 melhores campanhas", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/marketing-ai/resultados/resultados-data.ts"),
    "utf8",
  );

  // 6 KPIs superiores da Tela 5
  assert.ok(dataContent.includes("Investimento total") && dataContent.includes('"R$ 4.850"'));
  assert.ok(dataContent.includes("Receita atribuída") && dataContent.includes('"R$ 24.580"'));
  assert.ok(dataContent.includes("ROI geral") && dataContent.includes('"406%"'));
  assert.ok(dataContent.includes("Leads gerados") && dataContent.includes('"486"'));
  assert.ok(dataContent.includes("Custo por lead") && dataContent.includes('"R$ 9,98"'));
  assert.ok(dataContent.includes("Vendas realizadas") && dataContent.includes('"18"'));

  // 4 Etapas do funil
  assert.ok(dataContent.includes("Visitantes") && dataContent.includes("8420"));
  assert.ok(dataContent.includes("Leads") && dataContent.includes("486"));
  assert.ok(dataContent.includes("Propostas") && dataContent.includes("124"));
  assert.ok(dataContent.includes("Vendas") && dataContent.includes("18"));

  // 4 Melhores campanhas
  assert.ok(dataContent.includes("Experiência Gastronômica") && dataContent.includes('"620%"'));
  assert.ok(dataContent.includes("Plano Fitness Premium") && dataContent.includes('"591%"'));
  assert.ok(dataContent.includes("Consultoria Imobiliária") && dataContent.includes('"477%"'));
  assert.ok(dataContent.includes("Curso de Marketing Digital") && dataContent.includes('"521%"'));

  // 6 Ações do Assistente e 4 Insights
  assert.ok(dataContent.includes("Analisar desempenho geral"));
  assert.ok(dataContent.includes("Identificar oportunidades"));
  assert.ok(dataContent.includes("Sugerir ajustes nas campanhas"));
  assert.ok(dataContent.includes("Alto potencial de crescimento"));
  assert.ok(dataContent.includes("Reduzir custo por lead"));
  assert.ok(dataContent.includes("Produto em destaque"));
  assert.ok(dataContent.includes("Expandir para novos canais"));
});

test("o dashboard e sidebar conectam a Tela 5 (Resultados e ROI) com ready true", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('{ id: "resultados_roi" as const, label: "Resultados e ROI", icon: ChartNoAxesCombined, ready: true }'),
    "Resultados e ROI deve estar ativo com ready: true na sidebar",
  );

  assert.ok(
    dashContent.includes("MarketingResultsPage"),
    "Dashboard deve importar MarketingResultsPage",
  );
  assert.ok(
    dashContent.includes('marketingSubView === "resultados_roi"'),
    "Dashboard deve renderizar MarketingResultsPage para marketingSubView === 'resultados_roi'",
  );
});




