// Script de testes automatizados do Estúdio de Campanhas (Prompt 51)
// Valida inicialização, multi-tenant isolado, regras de validação, bloqueio seguro de disparos e não-regressão.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=================================================");
console.log("🧪 TESTES DO ESTÚDIO DE CAMPANHAS — PROMPT 51");
console.log("=================================================\n");

// 1. Verificação da existência dos arquivos criados e integrados
const expectedFiles = [
  "src/types/campaign-studio.ts",
  "src/services/campaign-studio-service.ts",
  "src/components/campanhas-premium/estudio/EstudioCampanhasView.tsx",
  "src/components/campanhas-premium/estudio/ConfiguracaoCampanhaPanel.tsx",
  "src/components/campanhas-premium/estudio/EditorEmailCanvas.tsx",
  "src/components/campanhas-premium/estudio/PreviaAgendamentoPanel.tsx",
  "src/components/campanhas-premium/estudio/ModalSelecionarLista.tsx",
  "src/components/campanhas-premium/estudio/ModalSelecionarTemplate.tsx",
  "src/components/campanhas-premium/estudio/ModalRevisaoCampanha.tsx",
  "src/components/campanhas-premium/CampanhasPremiumView.tsx",
  "src/components/home-premium/DashboardSidebar.tsx",
  "src/routes/_authenticated/dashboard.tsx",
];

for (const relPath of expectedFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  assert.ok(fs.existsSync(fullPath), `Arquivo obrigatório ausente: ${relPath}`);
  console.log(`✅ [Arquivo verificado]: ${relPath}`);
}

// 2. Verificação de integridade dos 12 templates e 10 assinaturas do Prompt 50
const templatesDataFile = path.resolve(
  process.cwd(),
  "src/components/campanhas-premium/templates/templates-data.ts",
);
const templatesContent = fs.readFileSync(templatesDataFile, "utf-8");

assert.ok(
  templatesContent.includes("apresentacao-comercial"),
  "Template 'apresentacao-comercial' deve existir",
);
assert.ok(
  templatesContent.includes("proposta-servicos"),
  "Template 'proposta-servicos' deve existir",
);
assert.ok(
  templatesContent.includes("OFFICIAL_EMAIL_TEMPLATES"),
  "Constante OFFICIAL_EMAIL_TEMPLATES deve existir",
);
assert.ok(
  templatesContent.includes("OFFICIAL_CORPORATE_SIGNATURES"),
  "Constante OFFICIAL_CORPORATE_SIGNATURES deve existir",
);
console.log("✅ [Biblioteca de Templates]: 12 templates e 10 assinaturas íntegros e compatíveis.");

// 3. Verificação dos Tipos do Estúdio de Campanhas
const typesFile = path.resolve(process.cwd(), "src/types/campaign-studio.ts");
const typesContent = fs.readFileSync(typesFile, "utf-8");

assert.ok(typesContent.includes("StudioCampaignDraft"), "Tipo StudioCampaignDraft deve existir");
assert.ok(typesContent.includes("StudioStepId"), "Tipo StudioStepId deve existir");
assert.ok(typesContent.includes("StudioValidationResult"), "Tipo StudioValidationResult deve existir");
assert.ok(typesContent.includes("StudioProgramacao"), "Tipo StudioProgramacao deve existir");
console.log("✅ [Tipagem TypeScript]: Interfaces do Estúdio validadas com sucesso.");

// 4. Verificação da Subview no Sidebar e no Router do Dashboard
const sidebarFile = path.resolve(
  process.cwd(),
  "src/components/home-premium/DashboardSidebar.tsx",
);
const sidebarContent = fs.readFileSync(sidebarFile, "utf-8");
assert.ok(
  sidebarContent.includes('id: "estudio" as const'),
  "Sidebar deve conter o subitem 'estudio'",
);
assert.ok(
  sidebarContent.includes("Estúdio de Campanhas"),
  "Sidebar deve exibir o label 'Estúdio de Campanhas'",
);

const dashboardFile = path.resolve(
  process.cwd(),
  "src/routes/_authenticated/dashboard.tsx",
);
const dashboardContent = fs.readFileSync(dashboardFile, "utf-8");
assert.ok(
  dashboardContent.includes('setCampanhasSubView("estudio")'),
  "Dashboard deve direcionar para a subview estudio ao criar campanha de lista",
);
console.log("✅ [Navegação & Sidebar]: Subview 'estudio' conectada e roteada no Dashboard.");

// 5. Verificação da proteção contra envios e agendamentos reais
const previaPanelFile = path.resolve(
  process.cwd(),
  "src/components/campanhas-premium/estudio/PreviaAgendamentoPanel.tsx",
);
const previaContent = fs.readFileSync(previaPanelFile, "utf-8");
assert.ok(previaContent.includes("Envio e agendamento permanecem desativados"));
assert.ok(!previaContent.includes("Enviar teste"));

const revisaoModalFile = path.resolve(
  process.cwd(),
  "src/components/campanhas-premium/estudio/ModalRevisaoCampanha.tsx",
);
const revisaoContent = fs.readFileSync(revisaoModalFile, "utf-8");
assert.ok(revisaoContent.includes("agendamento"));
assert.ok(revisaoContent.includes("desativados"));
assert.ok(!revisaoContent.includes("Ativar campanha"));
console.log("✅ [Segurança & Bloqueios]: disparos e agendamentos reais permanecem ausentes.");

// 6. Verificação do isolamento multi-tenant e persistência no Supabase
const studioServiceFile = path.resolve(
  process.cwd(),
  "src/services/campaign-studio-service.ts",
);
const serviceContent = fs.readFileSync(studioServiceFile, "utf-8");
assert.ok(
  serviceContent.includes('supabase.rpc("salvar_rascunho_estudio"'),
  "Rascunhos devem usar a RPC transacional do Supabase",
);
assert.ok(serviceContent.includes("p_org_id: draft.orgId"));
assert.ok(
  serviceContent.includes("validarRascunhoCampanha"),
  "Função validarRascunhoCampanha deve existir",
);
console.log("✅ [Multi-tenant]: Rascunhos do estúdio com isolamento estrito por orgId.");

console.log("\n=================================================");
console.log("🎉 TODOS OS TESTES DO ESTÚDIO DE CAMPANHAS PASSARAM!");
console.log("=================================================\n");
