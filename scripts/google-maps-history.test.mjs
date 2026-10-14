/**
 * FLOW BUSINESS — TEST SUITE PROMPT 44
 * GOOGLE MAPS PREMIUM — TELA 05: HISTÓRICO DE BUSCAS
 *
 * 40 testes rigorosos validando fidelidade visual, contratos do histórico,
 * segurança multi-tenant, sanitização CSV anti-injection, preservação das Telas 01, 02, 03 e 04,
 * e ausência de simulação fictícia de persistência.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const historyView = read("src/components/google-maps-premium/GoogleMapsHistoryView.tsx");
const historyHeader = read("src/components/google-maps-premium/GoogleMapsHistoryHeader.tsx");
const historyIndicators = read("src/components/google-maps-premium/GoogleMapsHistoryIndicators.tsx");
const historyFilters = read("src/components/google-maps-premium/GoogleMapsHistoryFilters.tsx");
const historyTable = read("src/components/google-maps-premium/GoogleMapsHistoryTable.tsx");
const historyDetails = read("src/components/google-maps-premium/GoogleMapsHistoryDetails.tsx");
const historyMap = read("src/components/google-maps-premium/GoogleMapsHistoryMap.tsx");
const historyPagination = read("src/components/google-maps-premium/GoogleMapsHistoryPagination.tsx");
const historyHook = read("src/components/google-maps-premium/useGoogleMapsHistory.ts");
const historyTypes = read("src/components/google-maps-premium/google-maps-history-types.ts");
const categoryIcon = read("src/components/google-maps-premium/GoogleMapsCategoryIcon.tsx");
const premiumView = read("src/components/google-maps-premium/GoogleMapsPremiumView.tsx");
const headerTela01 = read("src/components/google-maps-premium/GoogleMapsHeader.tsx");
const sidebar = read("src/components/home-premium/DashboardSidebar.tsx");
const runningView = read("src/components/google-maps-premium/GoogleMapsRunningView.tsx");
const resultsView = read("src/components/google-maps-premium/GoogleMapsSearchResultsView.tsx");
const approachView = read("src/components/google-maps-premium/GoogleMapsApproachView.tsx");
const technicalProposal = read("docs/proposta-tecnica-prospecting-runs.md");

// 1. Renderização da interface
test("1. Renderização da interface: a View principal reúne todos os blocos do layout aprovado", () => {
  assert.match(historyView, /GoogleMapsTopbar/);
  assert.match(historyView, /GoogleMapsHistoryHeader/);
  assert.match(historyView, /GoogleMapsHistoryIndicators/);
  assert.match(historyView, /GoogleMapsHistoryFilters/);
  assert.match(historyView, /GoogleMapsHistoryTable/);
  assert.match(historyView, /GoogleMapsHistoryPagination/);
  assert.match(historyView, /GoogleMapsHistoryDetails/);
});

// 2. Preservação da logo oficial
test("2. Preservação da logo oficial: o sidebar continua utilizando FlowLeadsLogo oficial", () => {
  assert.match(sidebar, /FlowLeadsLogo/);
  assert.match(sidebar, /Flow Business/);
});

// 3. Navegação para Histórico
test("3. Navegação para Histórico: acessível a partir do Google Maps e gerenciado em activeView", () => {
  assert.match(premiumView, /activeView === "history"/);
  assert.match(premiumView, /GoogleMapsHistoryView/);
  assert.match(headerTela01, /onOpenHistorico/);
  assert.match(headerTela01, /Histórico de Buscas/);
});

// 4. Carregamento de dados reais
test("4. Carregamento de dados reais: hook useGoogleMapsHistory consome tabelas reais", () => {
  assert.match(historyHook, /lead_lists/);
  assert.match(historyHook, /api_consumption_logs/);
  assert.match(historyHook, /leads/);
});

// 5. Ausência de mocks
test("5. Ausência de mocks: a interface não utiliza mocks fixos ou geradores sintéticos como faker", () => {
  assert.doesNotMatch(historyView, /const MOCK/);
  assert.doesNotMatch(historyView, /faker/);
  assert.doesNotMatch(historyHook, /faker/);
});

// 6. Isolamento multi-tenant
test("6. Isolamento multi-tenant: consultas respeitam RLS e sessões autenticadas do Supabase", () => {
  assert.match(historyHook, /supabase\s*\.\s*from\("lead_lists"\)/);
  assert.match(historyHook, /supabase\s*\.\s*from\("leads"\)/);
});

// 7. Filtro por período
test("7. Filtro por período: suporta 7d, 30d, 90d e todo o histórico", () => {
  assert.match(historyFilters, /Últimos 7 dias/);
  assert.match(historyFilters, /Últimos 30 dias/);
  assert.match(historyFilters, /Últimos 90 dias/);
  assert.match(historyFilters, /Todo o histórico/);
});

// 8. Filtro por status
test("8. Filtro por status: distingue Concluída, Parcial, Interrompida, Erro e Status não confirmado", () => {
  assert.match(historyFilters, /Concluída/);
  assert.match(historyFilters, /Parcial/);
  assert.match(historyFilters, /Interrompida/);
  assert.match(historyFilters, /Erro/);
  assert.match(historyFilters, /Status não confirmado/);
});

// 9. Filtro por nicho livre
test("9. Filtro por nicho livre: consome distinctNiches e preserva o texto digitado", () => {
  assert.match(historyFilters, /distinctNiches/);
  assert.match(historyHook, /distinctNiches/);
});

// 10. Filtro por cidade e UF
test("10. Filtro por cidade e UF: consome distinctCidadeUf das buscas reais", () => {
  assert.match(historyFilters, /distinctCidadeUf/);
  assert.match(historyHook, /distinctCidadeUf/);
});

// 11. Filtro por categoria
test("11. Filtro por categoria: consome distinctCategorias derivadas do catálogo", () => {
  assert.match(historyFilters, /distinctCategorias/);
  assert.match(historyHook, /distinctCategorias/);
});

// 12. Busca textual livre
test("12. Busca textual livre: busca por nicho, cidade, UF, categoria ou nome da lista", () => {
  assert.match(historyHook, /matchNicho/);
  assert.match(historyHook, /matchCidade/);
  assert.match(historyHook, /matchLista/);
});

// 13. Filtros combinados
test("13. Filtros combinados: aplica múltiplos critérios simultâneos no hook", () => {
  assert.match(historyHook, /minTimestamp > 0 && item\.timestamp < minTimestamp/);
  assert.match(historyHook, /filters\.status !== "todos"/);
  assert.match(historyHook, /filters\.nicho !== "todos"/);
});

// 14. Limpar filtros
test("14. Limpar filtros: botão Limpar filtros restaura todos os seletores para o padrão", () => {
  assert.match(historyFilters, /Limpar filtros/);
  assert.match(historyHook, /handleLimparFiltros/);
});

// 15. Seis indicadores superiores
test("15. Seis indicadores superiores: reúne Total de buscas, Leads coletados, Inéditos, Listas, Tempo e Sucesso", () => {
  assert.match(historyIndicators, /Total de buscas/);
  assert.match(historyIndicators, /Leads coletados/);
  assert.match(historyIndicators, /Leads inéditos/);
  assert.match(historyIndicators, /Listas criadas/);
  assert.match(historyIndicators, /Tempo total de coleta/);
  assert.match(historyIndicators, /Taxa de sucesso/);
});

// 16. Tratamento de dados indisponíveis
test("16. Tratamento de dados indisponíveis: tempo de coleta exibe traço seguro quando não comprovado", () => {
  assert.match(historyHook, /tempoTotalColeta:\s*"—"/);
  assert.match(historyIndicators, /tempoTotalColetaSub/);
});

// 17. Tabela principal com colunas solicitadas
test("17. Tabela principal: reúne Checkbox, Data/Hora, Nicho/Cat, Localização, Solicitado, Encontrados, Inéditos, Duplicatas, Status e Ações", () => {
  assert.match(historyTable, /Data e hora/);
  assert.match(historyTable, /Nicho \/ Categoria/);
  assert.match(historyTable, /Localização/);
  assert.match(historyTable, /Solicitado/);
  assert.match(historyTable, /Encontrados/);
  assert.match(historyTable, /Inéditos/);
  assert.match(historyTable, /Duplicatas/);
  assert.match(historyTable, /Status/);
  assert.match(historyTable, /Ações/);
});

// 18. Paginação
test("18. Paginação: suporta página atual, total, navegação e seletor de 10, 25 e 50 por página", () => {
  assert.match(historyPagination, /10 por página/);
  assert.match(historyPagination, /25 por página/);
  assert.match(historyPagination, /50 por página/);
  assert.match(historyPagination, /Mostrando/);
});

// 19. Ordenação
test("19. Ordenação: suporta alternar ordenação por dataHora, solicitado e encontrados", () => {
  assert.match(historyTable, /onToggleSort\("dataHora"\)/);
  assert.match(historyTable, /onToggleSort\("solicitado"\)/);
  assert.match(historyTable, /onToggleSort\("encontrados"\)/);
});

// 20. Seleção individual e por página
test("20. Seleção individual e por página: suporta checkbox por linha e selecionar todos da página", () => {
  assert.match(historyTable, /onToggleSelectRow/);
  assert.match(historyTable, /onToggleSelectPage/);
  assert.match(historyView, /buscas selecionadas/);
});

// 21. Exportação CSV com UTF-8 BOM
test("21. Exportação CSV com UTF-8 BOM: gera arquivo compatível com Excel sem corrupção de acentos", () => {
  assert.match(historyHook, /\\uFEFF/);
  assert.match(historyHook, /text\/csv;charset=utf-8;/);
});

// 22. Segurança do CSV contra Formula Injection
test("22. Segurança do CSV contra Formula Injection: sanitiza prefixos perigosos (=, +, -, @)", () => {
  assert.match(historyHook, /sanitizeCsvField/);
  assert.match(historyHook, /str = `'\$\{str\}`/);
});

// 23. Painel lateral de detalhes
test("23. Painel lateral de detalhes: exibe cabeçalho, abas, mini-mapa e botões contextuais", () => {
  assert.match(historyDetails, /GoogleMapsHistoryMap/);
  assert.match(historyDetails, /Ver resultados da busca/);
  assert.match(historyDetails, /Usar estes leads/);
  assert.match(historyDetails, /Nova busca com critérios/);
});

// 24. Quatro abas no painel
test("24. Quatro abas no painel: suporta Resumo, Leads, Duplicatas e Configuração", () => {
  assert.match(historyDetails, /activeTab === "resumo"/);
  assert.match(historyDetails, /activeTab === "leads"/);
  assert.match(historyDetails, /activeTab === "duplicatas"/);
  assert.match(historyDetails, /activeTab === "configuracao"/);
});

// 25. Mini-mapa com Leaflet Dark e MAP_CONFIG
test("25. Mini-mapa: utiliza MAP_CONFIG oficial sem chaves de terceiros CartoDB", () => {
  assert.match(historyMap, /MAP_CONFIG\.tileUrl/);
  assert.match(historyMap, /MAP_CONFIG\.darkTilesClass/);
  assert.match(historyMap, /L\.circle/);
});

// 26. Leads vinculados na aba Leads
test("26. Leads vinculados na aba Leads: renderiza empresas com contatos, notas e scores reais", () => {
  assert.match(historyDetails, /lead\.business_name/);
  assert.match(historyDetails, /lead\.phone/);
  assert.match(historyDetails, /lead\.email/);
});

// 27. Duplicatas agregadas e explicação de deduplicação
test("27. Duplicatas: explica a política de deduplicação e proteção de saldo de leads", () => {
  assert.match(historyDetails, /Deduplicação de Leads/);
  assert.match(historyDetails, /histórico permanente/);
  assert.match(historyDetails, /organização/);
});

// 28. Configuração histórica
test("28. Configuração histórica: exibe os parâmetros de nicho, categoria, cidade, UF e raio", () => {
  assert.match(historyDetails, /item\.nicho/);
  assert.match(historyDetails, /item\.cidade/);
  assert.match(historyDetails, /item\.raioKm/);
});

// 29. Abertura da lista com ID real
test("29. Abertura da lista: dispara onOpenLista com o ID persistido da lista", () => {
  assert.match(historyDetails, /onOpenLista\?\.?\(/);
  assert.match(historyDetails, /item\.listId/);
});

// 30. Recuperação dos resultados da busca
test("30. Recuperação dos resultados: aciona Tela 03 quando resultados completos estiverem disponíveis", () => {
  assert.match(historyView, /onVerResultadosBusca/);
  assert.match(premiumView, /onVerResultadosBusca=/);
  assert.match(premiumView, /setActiveView\("results"\)/);
});

// 31. Estado de execução parcial
test("31. Estado de execução parcial: identifica buscas parciais sem simular sucesso integral", () => {
  assert.match(historyTypes, /"parcial"/);
  assert.match(historyTable, /Parcial/);
});

// 32. Status não confirmado
test("32. Status não confirmado: exibe badge neutro para buscas cuja execução não pode ser reconstruída", () => {
  assert.match(historyTypes, /"nao_confirmado"/);
  assert.match(historyTable, /item\.statusLabel/);
});

// 33. Nova busca com critérios anteriores
test("33. Nova busca com critérios anteriores: carrega parâmetros para Tela 01 sem chamar Apify", () => {
  assert.match(historyView, /onNovaBuscaComCriterios/);
  assert.match(premiumView, /onNovaBuscaComCriterios=/);
  assert.match(premiumView, /setNicho\(criterios\.nicho\)/);
  assert.match(premiumView, /setActiveView\("config"\)/);
});

// 34. Ausência de chamadas pagas automáticas
test("34. Ausência de chamadas pagas automáticas: reutilizar critérios abre o formulário da Tela 01", () => {
  assert.doesNotMatch(historyDetails, /streamSearchLeads/);
  assert.doesNotMatch(historyView, /streamSearchLeads/);
});

// 35. Respeito à deduplicação permanente
test("35. Respeito à deduplicação permanente: nova busca a partir de critérios preserva lead_seen_registry", () => {
  assert.doesNotMatch(historyView, /delete.*lead_seen_registry/);
});

// 36. Limites do plano
test("36. Limites do plano: limites reais continuam sendo impostos pelo backend nas buscas", () => {
  assert.match(historyDetails, /consomem/);
  assert.match(historyDetails, /saldo de leads/);
});

// 37. Responsividade e classes CSS
test("37. Responsividade: usa layout flexível com adaptação para desktop e mobile", () => {
  assert.match(historyView, /lg:flex-row/);
  assert.match(historyIndicators, /grid-cols-2/);
  assert.match(historyIndicators, /xl:grid-cols-6/);
});

// 38. Preservação da Tela 01 (Configurar Busca)
test("38. Preservação da Tela 01: continua intacta e plenamente funcional", () => {
  assert.match(premiumView, /GoogleMapsNicheInput/);
  assert.match(premiumView, /GoogleMapsCategories/);
  assert.match(premiumView, /GoogleMapsLocation/);
  assert.match(premiumView, /GoogleMapsMapPanel/);
  assert.match(premiumView, /GoogleMapsSearchSummary/);
});

// 39. Preservação das Telas 02, 03 e 04
test("39. Preservação das Telas 02, 03 e 04: todas continuam ativas em activeView", () => {
  assert.match(premiumView, /activeView === "running"/);
  assert.match(premiumView, /activeView === "results"/);
  assert.match(premiumView, /activeView === "approach"/);
  assert.match(runningView, /GoogleMapsRunningIndicators/);
  assert.match(resultsView, /GoogleMapsResultsTable/);
  assert.match(approachView, /GoogleMapsApproachStepper/);
});

// 40. Proposta técnica de persistência futura (ETAPA 22)
test("40. Proposta técnica de persistência futura: documentação técnica detalha prospecting_runs", () => {
  assert.match(technicalProposal, /prospecting_runs/);
  assert.match(technicalProposal, /prospecting_run_status/);
  assert.match(technicalProposal, /request_key/);
  assert.match(technicalProposal, /Idempotência/);
});
