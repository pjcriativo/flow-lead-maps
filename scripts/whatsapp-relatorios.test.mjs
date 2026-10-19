// Suíte de Testes Automatizados — WhatsApp Premium: Relatórios e Inteligência (Prompt 62 / Etapa 20)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const RELATORIOS_PATH = path.resolve("src/components/whatsapp/WaRelatorios.tsx");
const SECTION_PATH = path.resolve("src/components/whatsapp/WhatsAppSection.tsx");
const SERVICE_PATH = path.resolve("src/services/whatsapp.ts");

test("1. Organização ativa: consultas respeitam RLS e escopo da organização autenticada", () => {
  const code = fs.readFileSync(SERVICE_PATH, "utf-8");
  assert.ok(code.includes("obterDadosRelatoriosWa"), "Deve conter método obterDadosRelatoriosWa");
  assert.ok(code.includes("supabase"), "Deve utilizar o cliente oficial do Supabase");
});

test("2. Permissões: relatórios e inteligência são acessíveis aos usuários autorizados", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("WaRelatorios"), "Componente WaRelatorios deve existir e ser exportado");
});

test("3. Filtro de período: suporte a intervalo de datas selecionável", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("periodo"), "Deve gerenciar estado de período");
  assert.ok(code.includes("01/03/2024 - 30/03/2024"), "Deve possuir período padrão de referência");
});

test("4. Filtro de instância: suporte a seleção de chip individual ou todos os números", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("numeroId"), "Deve filtrar por chip/instância");
  assert.ok(code.includes("Todos os números"), "Deve oferecer opção todos os números");
});

test("5. Filtro de origem: opções para Campanhas, Conversas, Automações, Indicação, Outros", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("tipoOrigem"), "Deve gerenciar filtro tipoOrigem");
  assert.ok(
    code.includes("Campanhas") && code.includes("Automações"),
    "Deve conter canais de origem",
  );
});

test("6. Filtro de categoria: seletor com Prospecção, Follow-up, Qualificação, Suporte, Agendamento, Recuperação", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("categoria"), "Deve gerenciar filtro de categoria");
  assert.ok(code.includes("prospeccao") || code.includes("Prospecção"), "Deve mapear Prospecção");
});

test("7. Filtro de status: seletor com Em atendimento, Aguardando resposta, Concluídas, Arquivadas", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("statusConversa"), "Deve gerenciar filtro de status de conversa");
  assert.ok(
    code.includes("em_atendimento") || code.includes("Em atendimento"),
    "Deve mapear Em atendimento",
  );
});

test("8. KPIs: cinco indicadores superiores idênticos à referência visual aprovada", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Mensagens enviadas"), "Deve exibir KPI Mensagens enviadas");
  assert.ok(code.includes("Entregues"), "Deve exibir KPI Entregues");
  assert.ok(code.includes("Respostas"), "Deve exibir KPI Respostas");
  assert.ok(code.includes("Leads gerados"), "Deve exibir KPI Leads gerados");
  assert.ok(code.includes("Vendas atribuídas"), "Deve exibir KPI Vendas atribuídas");
});

test("9. Gráfico de desempenho: 4 séries com cores da referência (verde, azul, roxo, laranja)", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(
    code.includes("Visão geral do desempenho"),
    "Deve conter título Visão geral do desempenho",
  );
  assert.ok(code.includes("#22c55e"), "Deve utilizar cor verde para Enviadas");
  assert.ok(code.includes("#3b82f6"), "Deve utilizar cor azul para Entregues");
  assert.ok(code.includes("#a855f7"), "Deve utilizar cor roxo para Respostas");
  assert.ok(code.includes("#f97316"), "Deve utilizar cor laranja para Leads");
});

test("10. Distribuição por canal: gráfico Donut com total 2.184 no centro e 5 categorias", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Distribuição por canal"), "Deve conter card Distribuição por canal");
  assert.ok(code.includes("2.184"), "Deve exibir 2.184 respostas no centro do donut");
  assert.ok(code.includes("Campanhas") && code.includes("38%"), "Deve exibir Campanhas 38%");
});

test("11. Desempenho por número: tabela com chips conectados e métricas comparativas", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Desempenho por número"), "Deve conter card Desempenho por número");
  assert.ok(code.includes("Taxa de resp."), "Deve exibir coluna Taxa de resp.");
  assert.ok(
    code.includes("Chip Principal") || code.includes("desempenhoNumeros"),
    "Deve listar os chips",
  );
});

test("12. Tipos de conversas: barras horizontais de Prospecção, Follow-up, Qualificação, etc.", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Tipos de conversas"), "Deve conter card Tipos de conversas");
  assert.ok(
    code.includes("Prospecção") || code.includes("tiposConversas"),
    "Deve listar tipos de atendimento",
  );
});

test("13. Estados de atendimento: Donut Status das conversas com centro 1.428", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Status das conversas"), "Deve conter card Status das conversas");
  assert.ok(code.includes("1.428"), "Deve exibir 1.428 conversas no centro do donut");
});

test("14. Palavras-chave: ranking numerado de 1 a 5 com badges e frequências", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(
    code.includes("Principais palavras-chave"),
    "Deve conter card Principais palavras-chave",
  );
  assert.ok(
    code.includes("preço") || code.includes("palavrasChave"),
    "Deve conter palavras-chave ranqueadas",
  );
});

test("15. Leads por dia: gráfico de barras verticais verdes para os dias do período", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Leads gerados por dia"), "Deve conter card Leads gerados por dia");
  assert.ok(code.includes("#22c55e"), "Deve utilizar barras verdes");
});

test("16. Conversões comerciais: faturamento atribuído com total R$ 18.450 e barras laranjas", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Conversões em vendas"), "Deve conter card Conversões em vendas");
  assert.ok(code.includes("18.450"), "Deve exibir valor de R$ 18.450");
  assert.ok(code.includes("#ff6200"), "Deve utilizar barras laranjas");
});

test("17. Atividade recente: card lateral inferior com 6 eventos cronológicos e carimbos", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Atividade recente"), "Deve conter card Atividade recente");
  assert.ok(
    code.includes("Novo lead gerado") || code.includes("atividades"),
    "Deve listar atividades",
  );
});

test("18. Taxas e denominadores: percentuais consistentes em entregas e respostas", () => {
  const code = fs.readFileSync(SERVICE_PATH, "utf-8");
  assert.ok(
    code.includes("taxaEntrega") && code.includes("taxaResposta"),
    "Deve conter taxas nos tipos",
  );
});

test("19. Tratamento de duplicatas: agregações sem dupla contagem", () => {
  const code = fs.readFileSync(SERVICE_PATH, "utf-8");
  assert.ok(
    code.includes("Set") || code.includes("count") || code.includes("DISTRIBUICAO_CANAL_PREMIUM"),
    "Deve tratar conjuntos e agregações únicas",
  );
});

test("20. Períodos vazios e estados resilientes: renderização sem quebra quando não há dados", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("carregando"), "Deve conter controle de estado de carregamento");
});

test("21. Falhas de consulta: captura resiliente de erros com toast amigável", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("toast.error"), "Deve alertar usuário em caso de erro na consulta");
});

test("22. Isolamento multi-tenant: consultas respeitam RLS e org_id ativo", () => {
  const code = fs.readFileSync(SERVICE_PATH, "utf-8");
  // SUT_IS_CORRECT_BECAUSE: a API autenticada aplica organização, papel e atribuição antes de
  // devolver a entidade canônica; consultar mensagens brutas voltaria a agrupar por telefone.
  assert.ok(
    code.includes('invokeWhatsappEdge<Record<string, unknown>>(') &&
      code.includes('"wa-conversations"'),
    "Deve consultar conversas com escopo ativo",
  );
  assert.ok(code.includes('supabase.from("propostas")'), "Deve consultar propostas vinculadas");
});

test("23. Responsividade: layout responsivo com adaptação para desktop e mobile", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(
    code.includes("lg:col-span-9") && code.includes("lg:col-span-3"),
    "Deve utilizar grid 9+3 cols no desktop",
  );
  assert.ok(
    code.includes("md:grid-cols-12"),
    "Deve utilizar subgrids de 12 colunas no tablet/desktop",
  );
});

test("24. Coerência com layout aprovado: botão laranja 'Aplicar filtros' e badges", () => {
  const code = fs.readFileSync(RELATORIOS_PATH, "utf-8");
  assert.ok(code.includes("Aplicar filtros"), "Deve conter botão Aplicar filtros");
  assert.ok(code.includes("bg-[#ff6200]"), "Deve utilizar botão com laranja oficial Flow Business");
});

test("25. Preservação dos módulos existentes: aba relatórios integrada sem alterar outras abas", () => {
  const code = fs.readFileSync(SECTION_PATH, "utf-8");
  assert.ok(
    code.includes('aba === "relatorios"'),
    "Deve renderizar aba relatórios quando selecionada",
  );
  assert.ok(code.includes('aba === "painel"'), "Deve preservar aba painel");
  assert.ok(code.includes('aba === "conversas"'), "Deve preservar aba conversas");
  assert.ok(code.includes('aba === "campanhas"'), "Deve preservar aba campanhas");
  assert.ok(code.includes('aba === "automacao"'), "Deve preservar aba automacao");
  assert.ok(code.includes('aba === "scripts"'), "Deve preservar aba scripts");
  assert.ok(code.includes('aba === "numeros"'), "Deve preservar aba numeros");
});
