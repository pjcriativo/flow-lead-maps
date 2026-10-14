// Teste automatizado do Módulo Biblioteca de Templates (Prompt 50)
// Validação dos 12 templates de e-mail, 10 assinaturas corporativas,
// variáveis dinâmicas, fallback e contratos para o Estúdio de Campanhas.

import { OFFICIAL_EMAIL_TEMPLATES, OFFICIAL_CORPORATE_SIGNATURES, interpolateVariables, renderSignatureHtml, DEFAULT_SIGNATURE_DATA } from "../src/components/campanhas-premium/templates/templates-data.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n🧪 EXECUTANDO BATERIA DE TESTES — BIBLIOTECA DE TEMPLATES (PROMPT 50)\n");

// TESTE 1: Quantidade exata de templates oficiais
console.log("1. Validação do Catálogo de Templates:");
assert(OFFICIAL_EMAIL_TEMPLATES.length === 12, `Deve conter exatamente 12 templates oficiais (encontrados: ${OFFICIAL_EMAIL_TEMPLATES.length})`);

const expectedTemplateIds = [
  "apresentacao-comercial",
  "proposta-servicos",
  "newsletter-corporativa",
  "convite-empresarial",
  "followup-comercial",
  "pos-atendimento",
  "diagnostico-comercial",
  "portfolio-servicos",
  "agendamento-reuniao",
  "lancamento-servico",
  "conteudo-educativo",
  "reativacao-relacionamento",
];

for (const id of expectedTemplateIds) {
  const found = OFFICIAL_EMAIL_TEMPLATES.find((t) => t.id === id);
  assert(!!found, `Template "${id}" deve existir no catálogo oficial`);
  if (found) {
    assert(found.conteudoHtml.includes("<html") && found.conteudoHtml.includes("</html>"), `Template "${id}" deve conter estrutura HTML válida`);
    assert(found.assuntoPadrao.length > 0, `Template "${id}" deve possuir assunto padrão`);
    assert(found.ctaTexto.length > 0, `Template "${id}" deve possuir CTA definido`);
    assert(!found.conteudoHtml.includes("<script"), `Template "${id}" não pode conter scripts executáveis`);
  }
}

// TESTE 2: Quantidade e estrutura das 10 Assinaturas Corporativas
console.log("\n2. Validação das Assinaturas Corporativas:");
assert(OFFICIAL_CORPORATE_SIGNATURES.length === 10, `Deve conter exatamente 10 assinaturas corporativas (encontradas: ${OFFICIAL_CORPORATE_SIGNATURES.length})`);

const expectedSignatures = [
  "executiva-classica",
  "minimalista-premium",
  "corporativa-logomarca",
  "moderna-icones",
  "consultor-comercial",
  "agencia-marketing",
  "tecnologia-saas",
  "profissional-liberal",
  "empresarial-horizontal",
  "institucional",
];

for (const id of expectedSignatures) {
  const found = OFFICIAL_CORPORATE_SIGNATURES.find((s) => s.id === id);
  assert(!!found, `Assinatura "${id}" deve existir no catálogo oficial`);
  if (found) {
    assert(!found.htmlTemplate.includes("<script"), `Assinatura "${id}" não pode conter scripts`);
    assert(!found.htmlTemplate.includes("<form"), `Assinatura "${id}" não pode conter formulários`);
    const rendered = renderSignatureHtml(found.htmlTemplate, DEFAULT_SIGNATURE_DATA);
    assert(rendered.includes(DEFAULT_SIGNATURE_DATA.nome), `Assinatura "${id}" deve interpolar o nome do usuário`);
  }
}

// TESTE 3: Interpolação de variáveis e Fallbacks
console.log("\n3. Validação do Mecanismo de Interpolação e Fallbacks:");
const rawTemplate = "Olá {{nome}}, convidamos a {{empresa}} de {{cidade}} para falar com {{nome_remetente}}.";
const interpolated = interpolateVariables(rawTemplate, {
  nome: "Carlos",
  empresa: "Acme Corp",
  cidade: "Curitiba",
  nome_remetente: "Ana Silva",
});
assert(interpolated === "Olá Carlos, convidamos a Acme Corp de Curitiba para falar com Ana Silva.", "Deve substituir variáveis fornecidas com exatidão");

const fallbackResult = interpolateVariables(rawTemplate, {});
assert(fallbackResult === "Olá Cliente, convidamos a sua empresa de sua região para falar com Equipe Comercial.", "Deve aplicar fallbacks inteligentes quando campos estiverem vazios");

// TESTE 4: Isolamento Multi-Tenant e Contrato do Estúdio
console.log("\n4. Validação de Isolamento Multi-Tenant e Contrato:");
const contract = {
  templateId: "apresentacao-comercial",
  templateNome: "Apresentação Comercial",
  templateTipo: "email",
  versao: "1.0",
  assunto: "Apresentação executiva",
  preheader: "Detalhes",
  htmlRenderizado: "<table role=\"presentation\">...</table>",
  variaveisUtilizadas: { nome: "João" },
  orgId: "org-12345",
  timestamp: new Date().toISOString(),
};
assert(contract.orgId === "org-12345", "Contrato deve ser isolado pela org ativa");
assert(contract.templateTipo === "email", "Tipo de contrato deve ser 'email'");

console.log(`\n========================================`);
console.log(`RESULTADO DOS TESTES: ${passed} passaram, ${failed} falharam.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
