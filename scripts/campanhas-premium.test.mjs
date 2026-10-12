import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("a rota dashboard renderiza CampanhasPremiumView quando a seção ativa é campanhas", () => {
  const file = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );
  assert.ok(
    file.includes('import { CampanhasPremiumView } from "@/components/campanhas-premium/CampanhasPremiumView";'),
    "Deveria importar CampanhasPremiumView",
  );
  assert.ok(
    file.includes('{section === "campanhas" && ('),
    "Deveria renderizar condicionalmente section === 'campanhas'",
  );
  assert.ok(
    file.includes("<CampanhasPremiumView"),
    "Deveria instanciar CampanhasPremiumView",
  );
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
  assert.ok(
    file.includes('label: "Flow Marketing AI"'),
    "Deveria ter o item Flow Marketing AI",
  );
  assert.ok(
    file.includes("icon: Sparkles"),
    "Deveria usar o ícone Sparkles",
  );
  assert.ok(
    file.includes('badge: "EM BREVE"'),
    "Deveria ter o badge EM BREVE",
  );

  // Verifica ordem: Campanhas vem antes de Flow Marketing AI, e Flow Marketing AI vem antes de Conversas
  const campanhasIdx = file.indexOf('label: "Campanhas"');
  const aiIdx = file.indexOf('label: "Flow Marketing AI"');
  const conversasIdx = file.indexOf('label: "Conversas"');

  assert.ok(campanhasIdx < aiIdx, "Campanhas deve vir antes de Flow Marketing AI");
  assert.ok(aiIdx < conversasIdx, "Flow Marketing AI deve vir antes de Conversas");
});

test("a tela Campanhas Premium reúne todos os componentes da composição aprovada", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhasPremiumView.tsx"),
    "utf8",
  );
  assert.ok(
    file.includes("<CampanhasHeader"),
    "Deveria conter CampanhasHeader",
  );
  assert.ok(
    file.includes("<CampanhasStatsCards"),
    "Deveria conter CampanhasStatsCards",
  );
  assert.ok(
    file.includes("<CampanhasTable"),
    "Deveria conter CampanhasTable",
  );
  assert.ok(
    file.includes("<CampanhasPerformanceChart"),
    "Deveria conter CampanhasPerformanceChart",
  );
  assert.ok(
    file.includes("<CampanhaSummaryPanel"),
    "Deveria conter CampanhaSummaryPanel",
  );
  assert.ok(
    file.includes("<CriarCampanhaModal"),
    "Deveria conter CriarCampanhaModal",
  );
  assert.ok(
    file.includes("<GestaoProducaoView"),
    "Deveria abrir a Tela 2 GestaoProducaoView ao selecionar uma campanha",
  );
});

test("os 5 cards superiores de métricas possuem os indicadores aprovados", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/campanhas-premium-data.ts"),
    "utf8",
  );
  assert.ok(file.includes('label: "Campanhas ativas"'), "Deveria ter Campanhas ativas");
  assert.ok(file.includes('label: "Leads em campanha"'), "Deveria ter Leads em campanha");
  assert.ok(file.includes('label: "Sites gerados"'), "Deveria ter Sites gerados");
  assert.ok(file.includes('label: "Propostas enviadas"'), "Deveria ter Propostas enviadas");
  assert.ok(file.includes('label: "Receita gerada"'), "Deveria ter Receita gerada / Desempenho comercial");
});

test("o painel lateral direito possui o resumo com stepper, próximas ações e saúde operacional", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhaSummaryPanel.tsx"),
    "utf8",
  );
  assert.ok(file.includes("Resumo da campanha selecionada"), "Deveria ter o título do Resumo");
  assert.ok(file.includes("Leads") && file.includes("Site") && file.includes("Proposta"), "Deveria ter o stepper horizontal");
  assert.ok(file.includes("Próximas ações"), "Deveria ter Próximas ações");
  assert.ok(file.includes("Saúde operacional"), "Deveria ter Saúde operacional");
  assert.ok(file.includes("Distribuição por etapa"), "Deveria ter Distribuição por etapa");
  assert.ok(file.includes("1.248"), "Deveria ter a contagem total de leads");
});

test("o gráfico de desempenho utiliza Recharts com linhas multicanal", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/CampanhasPerformanceChart.tsx"),
    "utf8",
  );
  assert.ok(file.includes("<LineChart"), "Deveria usar LineChart do Recharts");
  assert.ok(file.includes("<ResponsiveContainer"), "Deveria ser responsivo");
  assert.ok(file.includes("odontoPrime"), "Deveria ter a série da Odonto Prime");
  assert.ok(file.includes("clinicaVida"), "Deveria ter a série da Clínica Vida");
  assert.ok(file.includes("Desempenho por campanha"), "Deveria ter o título Desempenho por campanha");
});

test("Tela 2: Gestão e Produção de Campanhas integra todos os componentes da composição aprovada", () => {
  const file = fs.readFileSync(
    path.join(root, "src/components/campanhas-premium/GestaoProducaoView.tsx"),
    "utf8",
  );
  assert.ok(file.includes("<GestaoHeader"), "Deveria incluir GestaoHeader com título e badges");
  assert.ok(file.includes("<GestaoProcessSteps"), "Deveria incluir GestaoProcessSteps com as 5 etapas");
  assert.ok(file.includes("<GestaoLeadsTable"), "Deveria incluir GestaoLeadsTable com lista de leads e filtros");
  assert.ok(file.includes("<GestaoSitePreview"), "Deveria incluir GestaoSitePreview com visualização do site");
  assert.ok(file.includes("<GestaoProposalEditor"), "Deveria incluir GestaoProposalEditor para copy e envio");
  assert.ok(file.includes("<GestaoConfigDrawer"), "Deveria incluir GestaoConfigDrawer para governança e rampa");
  assert.ok(file.includes("prepararCampanhaLead"), "Deveria integrar serviço real prepararCampanhaLead");
  assert.ok(file.includes("aprovarTodosDaCampanha"), "Deveria integrar serviço real aprovarTodosDaCampanha");
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
  assert.ok(file.includes("Desktop") && file.includes("Tablet") && file.includes("Mobile"), "Deveria ter controles de viewport");
  assert.ok(file.includes("Editar site"), "Deveria ter botão Editar site");
});

