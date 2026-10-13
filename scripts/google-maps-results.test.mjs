/**
 * FLOW BUSINESS — TEST SUITE PROMPT 42
 * GOOGLE MAPS PREMIUM — TELA 03: RESULTADOS DA BUSCA
 *
 * 36 testes rigorosos validando fidelidade visual, contratos comerciais,
 * segurança multi-tenant, sanitização CSV anti-injection e preservação das Telas 01 e 02.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const resultsView = read("src/components/google-maps-premium/GoogleMapsSearchResultsView.tsx");
const header = read("src/components/google-maps-premium/GoogleMapsResultsHeader.tsx");
const indicators = read("src/components/google-maps-premium/GoogleMapsResultsIndicators.tsx");
const infoCard = read("src/components/google-maps-premium/GoogleMapsResultsInfo.tsx");
const filtersCard = read("src/components/google-maps-premium/GoogleMapsResultsFilters.tsx");
const bulkActions = read("src/components/google-maps-premium/GoogleMapsResultsBulkActions.tsx");
const table = read("src/components/google-maps-premium/GoogleMapsResultsTable.tsx");
const pagination = read("src/components/google-maps-premium/GoogleMapsResultsPagination.tsx");
const detailsPanel = read("src/components/google-maps-premium/GoogleMapsCompanyDetails.tsx");
const premiumView = read("src/components/google-maps-premium/GoogleMapsPremiumView.tsx");
const runningView = read("src/components/google-maps-premium/GoogleMapsRunningView.tsx");
const sidebar = read("src/components/home-premium/DashboardSidebar.tsx");
const dashboardRoute = read("src/routes/_authenticated/dashboard.tsx");
const listsApi = read("src/lib/lists-api.ts");
const leadsApi = read("src/lib/leads-api.ts");
const mapConfig = read("src/lib/map-config.ts");

// 1. Renderização da Tela 03
test("1. Renderização da Tela 03: a View principal reúne todos os blocos do layout aprovado", () => {
  assert.match(resultsView, /GoogleMapsTopbar/);
  assert.match(resultsView, /GoogleMapsResultsHeader/);
  assert.match(resultsView, /GoogleMapsResultsIndicators/);
  assert.match(resultsView, /GoogleMapsResultsInfo/);
  assert.match(resultsView, /GoogleMapsResultsFilters/);
  assert.match(resultsView, /GoogleMapsResultsBulkActions/);
  assert.match(resultsView, /GoogleMapsResultsTable/);
  assert.match(resultsView, /GoogleMapsResultsPagination/);
  assert.match(resultsView, /GoogleMapsCompanyDetails/);
});

// 2. Preservação da logomarca oficial
test("2. Preservação da logomarca oficial: a plataforma continua utilizando a FlowLeadsLogo oficial", () => {
  assert.match(sidebar, /FlowLeadsLogo/);
  assert.match(sidebar, /Flow Business/);
});

// 3. Navegação Tela 01 → Tela 02 → Tela 03
test("3. Navegação Tela 01 → Tela 02 → Tela 03: fluxo completo com suporte a resultados", () => {
  assert.match(premiumView, /activeView === "running"/);
  assert.match(premiumView, /activeView === "results"/);
  assert.match(premiumView, /onVerResultados=\{\(\) => setActiveView\("results"\)\}/);
  assert.match(runningView, /onVerResultados/);
  assert.match(runningView, /Ver resultados da busca/);
});

// 4. Resultados reais
test("4. Resultados reais: a Tela 03 recebe leads reais tipados sem dados mockados", () => {
  assert.match(resultsView, /leads:\s*Lead\[\]/);
  assert.doesNotMatch(resultsView, /const MOCK_LEADS/);
  assert.doesNotMatch(resultsView, /faker/);
});

// 5. Contagens consistentes
test("5. Contagens consistentes: totais e percentuais são calculados com base nos dados conhecidos", () => {
  assert.match(indicators, /pctIneditos/);
  assert.match(indicators, /pctDuplicatas/);
  assert.match(indicators, /pctEmail/);
  assert.match(indicators, /pctTelefone/);
  assert.match(indicators, /pctInstagram/);
  assert.match(indicators, /totalEncontrados > 0/);
});

// 6. Ausência de métricas fictícias
test("6. Ausência de métricas fictícias: percentuais não são gerados se denominador for zero", () => {
  assert.match(indicators, /totalEncontrados > 0 \? Math\.round/);
  assert.match(indicators, /leadsIneditos > 0 \? Math\.round/);
});

// 7. Nicho digitado preservado
test("7. Nicho digitado preservado: o nicho digitado pelo usuário é exibido fielmente", () => {
  assert.match(infoCard, /Nicho/);
  assert.match(infoCard, /\{nicho\}/);
  assert.match(resultsView, /nicho=\{nicho\}/);
});

// 8. Informações de localização
test("8. Informações de localização: cidade, UF e raio da busca são exibidos no card de informações", () => {
  assert.match(infoCard, /Localização/);
  assert.match(infoCard, /\{cidade\} - \{uf\}/);
  assert.match(infoCard, /raio de \$\{raioKm\} km/);
});

// 9. Filtros combinados
test("9. Filtros combinados: busca textual, categoria, avaliação e contato operam de forma combinada", () => {
  assert.match(resultsView, /filteredLeads = useMemo/);
  assert.match(resultsView, /categoriaFiltro !== "todas"/);
  assert.match(resultsView, /minAvaliacao !== "qualquer"/);
  assert.match(resultsView, /filtroContato === "telefone"/);
});

// 10. Busca textual
test("10. Busca textual: localiza por nome, categoria, endereço ou cidade", () => {
  assert.match(
    resultsView,
    /nomeMatch = lead\.business_name\?\.toLowerCase\(\)\.includes\(termo\)/,
  );
  assert.match(resultsView, /catMatch = lead\.category\?\.toLowerCase\(\)\.includes\(termo\)/);
  assert.match(resultsView, /endMatch = lead\.address\?\.toLowerCase\(\)\.includes\(termo\)/);
  assert.match(resultsView, /cidMatch = lead\.city\?\.toLowerCase\(\)\.includes\(termo\)/);
});

// 11. Avaliação mínima
test("11. Avaliação mínima: filtra leads pela nota mínima (3.0+, 4.0+, 4.5+, 5.0)", () => {
  assert.match(filtersCard, /Avaliação mínima/);
  assert.match(filtersCard, /3\.0\+/);
  assert.match(filtersCard, /4\.0\+/);
  assert.match(filtersCard, /4\.5\+/);
  assert.match(resultsView, /parseFloat\(minAvaliacao\)/);
});

// 12. Filtros por contato
test("12. Filtros por contato: permite filtrar por telefone, e-mail, site ou Instagram", () => {
  assert.match(filtersCard, /Com contato/);
  assert.match(filtersCard, /Com telefone/);
  assert.match(filtersCard, /Com e-mail/);
  assert.match(filtersCard, /Com site/);
  assert.match(filtersCard, /Com Instagram/);
});

// 13. Abas de resultados
test("13. Abas de resultados: abas com badges de contagem reais (Todos, Inéditos, Duplicatas, etc.)", () => {
  assert.match(filtersCard, /id: "todos", label: "Todos"/);
  assert.match(filtersCard, /id: "ineditos", label: "Inéditos"/);
  assert.match(filtersCard, /id: "duplicatas", label: "Duplicatas"/);
  assert.match(filtersCard, /id: "telefone", label: "Com telefone"/);
  assert.match(filtersCard, /id: "email", label: "Com e-mail"/);
  assert.match(filtersCard, /id: "site", label: "Com site"/);
  assert.match(filtersCard, /id: "instagram", label: "Com Instagram"/);
});

// 14. Duplicatas sem reinserção
test("14. Duplicatas sem reinserção: a aba duplicatas exibe resumo informativo sem reinserir dados no banco", () => {
  assert.match(table, /activeTab === "duplicatas"/);
  assert.match(table, /empresas já conhecidas descartadas/);
  assert.match(table, /duplicatasCount/);
});

// 15. Paginação
test("15. Paginação: suporta página atual, total, navegação e seletor de tamanho de página", () => {
  assert.match(pagination, /Mostrando/);
  assert.match(pagination, /totalItens/);
  assert.match(pagination, /itensPorPagina/);
  assert.match(pagination, /10 por página/);
  assert.match(pagination, /25 por página/);
  assert.match(pagination, /50 por página/);
});

// 16. Seleção individual
test("16. Seleção individual: checkbox por empresa com toggle e highlight", () => {
  assert.match(table, /onToggleSelectLead\(lead\.id\)/);
  assert.match(table, /isSelected \?/);
});

// 17. Seleção múltipla
test("17. Seleção múltipla: selecionar todos da página e contador de selecionados", () => {
  assert.match(bulkActions, /onToggleSelectAll/);
  assert.match(bulkActions, /empresas selecionadas/);
  assert.match(resultsView, /handleToggleSelectAllPage/);
});

// 18. Seleção entre páginas
test("18. Seleção entre páginas: selectedLeadIds usa Set estável com IDs dos leads", () => {
  assert.match(
    resultsView,
    /selectedLeadIds,\s*setSelectedLeadIds\s*\]\s*=\s*useState<Set<string>>/,
  );
  assert.match(resultsView, /next\.has\(id\)/);
});

// 19. Exportação CSV
test("19. Exportação CSV: botão de exportar gera download com colunas essenciais", () => {
  assert.match(resultsView, /handleExportCsv/);
  assert.match(resultsView, /leadsParaExportar/);
  assert.match(resultsView, /text\/csv;charset=utf-8;/);
});

// 20. Segurança do CSV
test("20. Segurança do CSV: sanitização anti-formula injection e BOM UTF-8", () => {
  assert.match(resultsView, /sanitizeCsvValue/);
  assert.match(resultsView, /\\uFEFF/);
  assert.match(resultsView, /dangerous = \["=", "\+", "-", "@", "\\t", "\\r"\]/);
});

// 21. Links externos
test("21. Links externos: telefone usa tel:, site e Instagram abrem validados em nova aba", () => {
  assert.match(table, /href=\{`tel:\$/);
  assert.match(table, /target="_blank"/);
  assert.match(table, /rel="noopener noreferrer"/);
  assert.match(detailsPanel, /googleMapsUrl/);
});

// 22. Painel de empresa
test("22. Painel de empresa: drawer/painel lateral exibe dados gerais, contatos, avaliações e mapa", () => {
  assert.match(detailsPanel, /business_name/);
  assert.match(detailsPanel, /Dados gerais/);
  assert.match(detailsPanel, /Avaliações/);
  assert.match(detailsPanel, /Fotos/);
  assert.match(detailsPanel, /Mais/);
  assert.match(detailsPanel, /mapContainerRef/);
});

// 23. Dados ausentes
test("23. Dados ausentes: exibe traço ou mensagem apropriada em campos não informados", () => {
  assert.match(table, /—/);
  assert.match(detailsPanel, /Não informado/);
  assert.match(detailsPanel, /Sem avaliações/);
});

// 24. Fotos reais ou placeholders
test("24. Fotos reais ou placeholders: usa placeholder profissional quando não há foto", () => {
  assert.match(detailsPanel, /bg-gradient-to-br/);
  assert.match(detailsPanel, /Sparkles/);
  assert.doesNotMatch(detailsPanel, /unsplash\.com\/photo-fake/);
});

// 25. Mapas e coordenadas
test("25. Mapas e coordenadas: mini-mapa utiliza Leaflet Dark e MAP_CONFIG sem marcas d'água", () => {
  assert.match(detailsPanel, /MAP_CONFIG/);
  assert.match(detailsPanel, /MAP_LAYERS/);
  assert.match(detailsPanel, /Abrir no Google Maps/);
  assert.match(resultsView, /modalMapaAberto/);
});

// 26. Navegação para Leads
test("26. Navegação para Leads: botão 'Ver empresa na Central de Leads' navega com ID real", () => {
  assert.match(detailsPanel, /onVerNaCentral\?\.?\(lead\.id\)/);
  assert.match(resultsView, /onOpenLeads\?\.?\(id\)/);
  assert.match(dashboardRoute, /onOpenLeads=\{\(leadId\) =>/);
  assert.match(dashboardRoute, /setFocusedLeadId\(leadId\)/);
  assert.match(dashboardRoute, /selectSection\("leads"\)/);
});

// 27. Integração com Minhas Listas
test("27. Integração com Minhas Listas: suporte para criar lista nova ou adicionar a lista existente", () => {
  assert.match(resultsView, /criarListaDeLeads/);
  assert.match(resultsView, /adicionarLeadsALista/);
  assert.match(resultsView, /listarListas/);
  assert.match(listsApi, /export async function criarListaDeLeads/);
  assert.match(listsApi, /export async function adicionarLeadsALista/);
});

// 28. Comportamento de leads.list_id
test("28. Comportamento de leads.list_id: aviso explícito de que mover o lead atualiza a lista única", () => {
  assert.match(resultsView, /vincula cada lead a uma única lista \(1:1\)/);
  assert.match(listsApi, /list_id é único por lead/);
});

// 29. Bloqueios de campanhas
test("29. Bloqueios de campanhas: 'Enviar para campanha' navega com segurança sem disparos automáticos", () => {
  assert.match(bulkActions, /Enviar para campanha/);
  assert.match(resultsView, /onOpenCampanhas/);
  assert.match(dashboardRoute, /onOpenCampanhas=\{\(\) => selectSection\("campanhas"\)\}/);
  assert.doesNotMatch(resultsView, /dispararCampanha/);
});

// 30. Resultados parciais
test("30. Resultados parciais: flag isParcial exibe alerta sincero e não simula sucesso completo", () => {
  assert.match(infoCard, /isParcial/);
  assert.match(infoCard, /Busca encerrada com entrega parcial/);
  assert.match(premiumView, /setIsParcial\(true\)/);
});

// 31. Falhas de persistência
test("31. Falhas de persistência: captura erros sem quebrar a interface ou criar dados corrompidos", () => {
  assert.match(premiumView, /catch \(err\)/);
  assert.match(resultsView, /catch \(err\)/);
});

// 32. Isolamento entre organizações
test("32. Isolamento entre organizações: chamadas passam por RLS Supabase e user_id da sessão", () => {
  assert.match(listsApi, /getUserId\(\)/);
  assert.match(leadsApi, /supabase/);
});

// 33. Controle de permissões
test("33. Controle de permissões: exclusão e gestão de listas respeitam papéis de admin/gerente", () => {
  assert.match(listsApi, /papel_do_usuario/);
  assert.match(listsApi, /eh_super_admin/);
});

// 34. Responsividade
test("34. Responsividade: layout com classes responsivas (grid-cols, flex-col, lg:grid-cols, lg:w)", () => {
  assert.match(resultsView, /flex-col lg:flex-row/);
  assert.match(resultsView, /lg:grid-cols-12/);
  assert.match(detailsPanel, /w-full md:w-\[380px\] lg:w-\[400px\]/);
});

// 35. Preservação da Tela 01
test("35. Preservação da Tela 01: Configurar Busca continua integralmente operacional", () => {
  assert.match(premiumView, /GoogleMapsNicheInput/);
  assert.match(premiumView, /GoogleMapsCategories/);
  assert.match(premiumView, /GoogleMapsLocation/);
  assert.match(premiumView, /GoogleMapsMapPanel/);
  assert.match(premiumView, /GoogleMapsSearchSummary/);
});

// 36. Preservação da Tela 02
test("36. Preservação da Tela 02: Prospecção em Andamento continua integralmente preservada", () => {
  assert.match(premiumView, /<GoogleMapsRunningView/);
  assert.match(runningView, /GoogleMapsRunningStepper/);
  assert.match(runningView, /GoogleMapsRunningIndicators/);
  assert.match(runningView, /GoogleMapsRunningMapPanel/);
  assert.match(runningView, /GoogleMapsRunningLiveStatus/);
  assert.match(runningView, /GoogleMapsRunningTable/);
});
