import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("a rota dashboard renderiza CampanhasPremiumView quando a seção ativa é campanhas", () => {
  const file = fs.readFileSync(path.join(root, "src/routes/_authenticated/dashboard.tsx"), "utf8");
  assert.ok(
    file.includes("CampanhasPremiumView") &&
      file.includes("@/components/campanhas-premium/CampanhasPremiumView"),
    "Deveria importar CampanhasPremiumView",
  );
  assert.ok(
    file.includes('{section === "campanhas" && ('),
    "Deveria renderizar condicionalmente section === 'campanhas'",
  );
  assert.ok(file.includes("<CampanhasPremiumView"), "Deveria instanciar CampanhasPremiumView");
  assert.ok(
    file.includes('section === "campanhas"') && file.includes("bg-home-background"),
    "Deveria aplicar o tema dark premium bg-home-background para campanhas",
  );
});

test("a sidebar inclui Flow Marketing AI abaixo de Campanhas com ícone Sparkles e badge EM BREVE", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );
  assert.ok(file.includes('label: "Flow Marketing AI"'), "Deveria ter o item Flow Marketing AI");
  assert.ok(file.includes("icon: Sparkles"), "Deveria usar o ícone Sparkles");
  assert.ok(
    file.includes('badge: "EM BREVE"') || file.includes('badge: "Em breve"'),
    "Deveria ter o badge EM BREVE ou Em breve",
  );

  // Verifica ordem: Campanhas vem antes de Flow Marketing AI e AI Influencers Studio
  const campanhasIdx = file.indexOf('label: "Campanhas"');
  const aiIdx = file.indexOf('label: "Flow Marketing AI"');
  const influencersIdx = file.indexOf('label: "AI Influencers Studio"');

  assert.ok(campanhasIdx < aiIdx, "Campanhas deve vir antes de Flow Marketing AI");
  assert.ok(aiIdx < influencersIdx, "Flow Marketing AI deve vir antes de AI Influencers Studio");
});

test("a tela Campanhas Premium reúne todos os componentes da composição aprovada", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhasPremiumView.tsx"),
    "utf8",
  );
  assert.ok(file.includes("<CampanhasHeader"), "Deveria conter CampanhasHeader");
  assert.ok(file.includes("<CampanhasStatsCards"), "Deveria conter CampanhasStatsCards");
  assert.ok(file.includes("<CampanhasTable"), "Deveria conter CampanhasTable");
  assert.ok(
    file.includes("<CampanhasPerformanceChart"),
    "Deveria conter CampanhasPerformanceChart",
  );
  assert.ok(file.includes("<CampanhaSummaryPanel"), "Deveria conter CampanhaSummaryPanel");
  assert.ok(file.includes("<CriarCampanhaModal"), "Deveria conter CriarCampanhaModal");
  assert.ok(
    file.includes("<GestaoProducaoView"),
    "Deveria abrir a Tela 2 GestaoProducaoView ao selecionar uma campanha",
  );
});

test("os cards superiores exibem somente indicadores operacionais comprováveis", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhasPremiumView.tsx"),
    "utf8",
  );
  const data = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/campanhas-premium-data.ts"),
    "utf8",
  );
  assert.ok(file.includes('label: "Campanhas ativas"'), "Deveria ter Campanhas ativas");
  assert.ok(file.includes('label: "Leads em campanha"'), "Deveria ter Leads em campanha");
  assert.ok(file.includes('label: "Sites gerados"'), "Deveria ter Sites gerados");
  assert.ok(file.includes('label: "Propostas enviadas"'), "Deveria ter Propostas enviadas");
  assert.ok(file.includes('label: "Falhas registradas"'), "Deveria ter Falhas registradas");
  assert.ok(!file.includes("Receita gerada"), "Não deveria inventar receita");
  assert.ok(!file.includes("MOCK_CAMPANHAS"), "Não deveria usar campanhas simuladas");
  assert.ok(!file.includes("TOP_METRICS"), "Não deveria usar métricas simuladas");
  assert.ok(!data.includes("MOCK_CAMPANHAS"), "Não deveria manter catálogo operacional mock");
  assert.ok(!data.includes("TOP_METRICS"), "Não deveria manter métricas operacionais mock");
});

test("o painel lateral direito possui o resumo com stepper, próximas ações e saúde operacional", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhaSummaryPanel.tsx"),
    "utf8",
  );
  assert.ok(file.includes("Resumo da campanha selecionada"), "Deveria ter o título do Resumo");
  assert.ok(
    file.includes("Leads") && file.includes("Site") && file.includes("Proposta"),
    "Deveria ter o stepper horizontal",
  );
  assert.ok(file.includes("Próximas ações"), "Deveria ter Próximas ações");
  assert.ok(file.includes("Saúde operacional"), "Deveria ter Saúde operacional");
  assert.ok(file.includes("Distribuição por etapa"), "Deveria ter Distribuição por etapa");
  assert.ok(!file.includes("1.248"), "Não deveria exibir contagem simulada de leads");
});

test("o gráfico de desempenho preserva o layout e usa estado neutro sem série real", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhasPerformanceChart.tsx"),
    "utf8",
  );
  assert.ok(file.includes("<LineChart"), "Deveria usar LineChart do Recharts");
  assert.ok(file.includes("<ResponsiveContainer"), "Deveria ser responsivo");
  assert.ok(file.includes("Nenhum histórico confiável disponível"), "Deveria ter estado neutro");
  assert.ok(!file.includes("CHART_SERIES"), "Não deveria carregar série simulada por padrão");
  assert.ok(
    file.includes("Desempenho por campanha"),
    "Deveria ter o título Desempenho por campanha",
  );
});

test("Tela 2: Gestão e Produção de Campanhas integra todos os componentes da composição aprovada", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/GestaoProducaoView.tsx"),
    "utf8",
  );
  assert.ok(file.includes("<GestaoHeader"), "Deveria incluir GestaoHeader com título e badges");
  assert.ok(
    file.includes("<GestaoProcessSteps"),
    "Deveria incluir GestaoProcessSteps com as 5 etapas",
  );
  assert.ok(
    file.includes("<GestaoLeadsTable"),
    "Deveria incluir GestaoLeadsTable com lista de leads e filtros",
  );
  assert.ok(
    file.includes("<GestaoSitePreview"),
    "Deveria incluir GestaoSitePreview com visualização do site",
  );
  assert.ok(
    file.includes("<GestaoProposalEditor"),
    "Deveria incluir GestaoProposalEditor para copy e envio",
  );
  assert.ok(
    file.includes("<GestaoConfigDrawer"),
    "Deveria incluir GestaoConfigDrawer para governança e rampa",
  );
  assert.ok(
    file.includes("prepararCampanhaLead"),
    "Deveria integrar serviço real prepararCampanhaLead",
  );
  assert.ok(
    file.includes("aprovarTodosDaCampanha"),
    "Deveria integrar serviço real aprovarTodosDaCampanha",
  );
  assert.ok(file.includes("enviarProposta"), "Deveria integrar serviço real enviarProposta");
});

test("Tela 2: GestaoProcessSteps implementa as 5 fases horizontais do processo comercial", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/GestaoProcessSteps.tsx"),
    "utf8",
  );
  assert.ok(file.includes("Selecionar leads"), "Etapa 1: Selecionar leads");
  assert.ok(file.includes("Gerar sites e propostas"), "Etapa 2: Gerar sites e propostas");
  assert.ok(file.includes("Revisar e aprovar"), "Etapa 3: Revisar e aprovar");
  assert.ok(file.includes("Enviar propostas"), "Etapa 4: Enviar propostas");
  assert.ok(file.includes("Acompanhar resultados"), "Etapa 5: Acompanhar resultados");
});

test("Tela 2: GestaoSitePreview possui abas (Site gerado, Proposta, Análise, Histórico) e alternância Desktop/Tablet/Mobile", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/GestaoSitePreview.tsx"),
    "utf8",
  );
  assert.ok(file.includes("Site gerado"), "Deveria ter aba Site gerado");
  assert.ok(file.includes("Proposta comercial"), "Deveria ter aba Proposta comercial");
  assert.ok(file.includes("Análise da IA"), "Deveria ter aba Análise da IA");
  assert.ok(file.includes("Histórico"), "Deveria ter aba Histórico");
  assert.ok(file.includes("Abrir site"), "Deveria ter botão Abrir site");
  assert.ok(
    file.includes("Desktop") && file.includes("Tablet") && file.includes("Mobile"),
    "Deveria ter controles de viewport",
  );
  assert.ok(file.includes("Editar site"), "Deveria ter botão Editar site");
});

test("Tela 3: Resultados e Métricas reúne todos os componentes da composição aprovada", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/ResultadosCampanhaView.tsx"),
    "utf8",
  );
  assert.ok(file.includes("<ResultadosHeader"), "Deveria incluir ResultadosHeader");
  assert.ok(file.includes("<ResultadosKpiCards"), "Deveria incluir ResultadosKpiCards");
  assert.ok(file.includes("<ResultadosEvolutionChart"), "Deveria incluir ResultadosEvolutionChart");
  assert.ok(file.includes("<ResultadosFunnelCard"), "Deveria incluir ResultadosFunnelCard");
  assert.ok(
    file.includes("<ResultadosPerformanceTable"),
    "Deveria incluir ResultadosPerformanceTable",
  );
  assert.ok(file.includes("<ResultadosChannelsCard"), "Deveria incluir ResultadosChannelsCard");
  assert.ok(
    file.includes("<ResultadosActivityTimeline"),
    "Deveria incluir ResultadosActivityTimeline",
  );
});

test("Tela 3: os 6 cards superiores de KPIs e dados do funil e canais correspondem ao layout", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/resultados-campanha-data.ts"),
    "utf8",
  );
  assert.ok(file.includes("Leads da campanha"), "Deveria ter Leads da campanha");
  assert.ok(file.includes("Sites gerados"), "Deveria ter Sites gerados");
  assert.ok(file.includes("Propostas enviadas"), "Deveria ter Propostas enviadas");
  assert.ok(file.includes("Taxa de abertura"), "Deveria ter Taxa de abertura");
  assert.ok(file.includes("Cliques no site"), "Deveria ter Cliques no site");
  assert.ok(file.includes("Leads interessados"), "Deveria ter Leads interessados");
  assert.ok(file.includes("FUNNEL_STAGES"), "Deveria ter FUNNEL_STAGES com 6 etapas");
  assert.ok(
    file.includes("CHANNELS_DATA"),
    "Deveria ter CHANNELS_DATA com distribuição multicanal",
  );
});

test("Submenu Campanhas: DashboardSidebar implementa submenu expansível com os 3 itens obrigatórios", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );
  assert.ok(file.includes("CAMPANHAS_SUBITEMS"), "Deveria definir CAMPANHAS_SUBITEMS");
  assert.ok(file.includes("Central de Campanhas"), "Deveria ter o subitem Central de Campanhas");
  assert.ok(file.includes("Gestão e Produção"), "Deveria ter o subitem Gestão e Produção");
  assert.ok(file.includes("Resultados e Métricas"), "Deveria ter o subitem Resultados e Métricas");
  assert.ok(
    file.includes("isCampanhasExpanded"),
    "Deveria controlar o estado expandido/recolhido do submenu",
  );
  assert.ok(
    file.includes("bg-home-orange text-white font-bold"),
    "Deveria destacar visualmente o subitem ativo com laranja premium",
  );
  assert.ok(
    file.includes("onNavigateCampanhasSub"),
    "Deveria suportar callback de navegação entre as subviews de campanhas",
  );
});

test("SelecionarCampanhaModal: apresenta lista de campanhas reais, busca, loading e estado vazio", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/SelecionarCampanhaModal.tsx"),
    "utf8",
  );
  assert.ok(file.includes("Selecionar Campanha"), "Deveria ter o título Selecionar Campanha");
  assert.ok(file.includes("targetView"), "Deveria aceitar targetView gestao ou resultados");
  assert.ok(
    file.includes("Carregando campanhas do seu workspace"),
    "Deveria ter estado de loading",
  );
  assert.ok(file.includes("Nenhuma campanha encontrada"), "Deveria ter estado vazio");
  assert.ok(
    file.includes("Criar nova campanha"),
    "Deveria ter botão de criar campanha no estado vazio",
  );
  assert.ok(file.includes("onSelect"), "Deveria fornecer callback de seleção da campanha");
});

test("CampanhasPremiumView: coordena subviews (central, gestao, resultados) e preserva contexto da campanha selecionada", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhasPremiumView.tsx"),
    "utf8",
  );
  assert.ok(
    file.includes("SelecionarCampanhaModal"),
    "Deveria importar e usar SelecionarCampanhaModal",
  );
  assert.ok(file.includes('currentSubView === "resultados"'), "Deveria rotear para Resultados");
  assert.ok(file.includes('currentSubView === "gestao"'), "Deveria rotear para Gestao");
  assert.ok(
    file.includes("onBackToCentral"),
    "Deveria permitir voltar para a Central de Campanhas",
  );
  assert.ok(
    file.includes("onBackToProducao"),
    "Deveria permitir transição preservada entre Resultados e Gestão",
  );
});

test("disparos em massa permanecem bloqueados sem reserva atômica no servidor", () => {
  const service = fs.readFileSync(path.join(root, "src/services/campanhas.ts"), "utf8");
  const whatsapp = fs.readFileSync(
    path.join(root, "src/components/whatsapp/WaCampanhas.tsx"),
    "utf8",
  );

  assert.ok(service.includes("BULK_SEND_BLOCKED_MESSAGE"), "E-mail em massa deve ser bloqueado");
  assert.ok(
    whatsapp.includes("DISPARO_EM_MASSA_BLOQUEADO"),
    "WhatsApp em massa deve ser bloqueado",
  );
});

test("edge de WhatsApp trata falha de persistência e não confunde opt-out de e-mail com autorização do canal", () => {
  const edge = fs.readFileSync(
    path.join(root, "supabase/functions/send-proposal-wa/index.ts"),
    "utf8",
  );
  const shared = fs.readFileSync(path.join(root, "supabase/functions/_shared/wa.ts"), "utf8");

  assert.ok(edge.includes("registro_falhou"), "Falha de registro deve ser explícita");
  assert.ok(shared.includes("throw new Error"), "O insert de wa_envios não pode ignorar erro");
  assert.ok(
    edge.includes("email_opt_out") && edge.includes("autorização específica de WhatsApp"),
    "O contrato atual deve documentar que email_opt_out não prova autorização de WhatsApp",
  );
});

test("Sidebar Premium: implementa recolhimento/expansão e rolagem sem barra visível", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );
  assert.ok(file.includes("isCollapsed"), "Deveria ter estado isCollapsed");
  assert.ok(
    file.includes("PanelLeftClose") && file.includes("PanelLeftOpen"),
    "Deveria ter ícones de recolher e expandir",
  );
  assert.ok(file.includes("w-[272px]"), "Deveria expandir com 272px para evitar nomes cortados");
  assert.ok(file.includes("w-[72px]"), "Deveria recolher para 72px em modo ícones");
  assert.ok(file.includes("overflow-y-auto"), "Deveria permitir rolagem vertical");
  assert.ok(file.includes("scrollbar-none"), "Deveria ocultar a barra de rolagem visual");
  assert.ok(!file.includes("[scrollbar-gutter:stable]"), "Não deveria reservar uma faixa lateral");
  assert.ok(
    file.includes("overflow-x-hidden"),
    "Deveria impedir truncamento por rolagem horizontal",
  );
});
