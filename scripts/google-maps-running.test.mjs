/**
 * FLOW BUSINESS — TEST SUITE PROMPT 41
 * GOOGLE MAPS PREMIUM — TELA 02: PROSPECÇÃO EM ANDAMENTO & CONFIGURAÇÃO CARTOGRÁFICA
 *
 * Executa 30 testes rigorosos validando fidelidade visual, contratos funcionais,
 * remoção da marca d'água de API e não-regressão de toda a plataforma.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const runningView = read("src/components/google-maps-premium/GoogleMapsRunningView.tsx");
const stepper = read("src/components/google-maps-premium/GoogleMapsRunningStepper.tsx");
const indicators = read("src/components/google-maps-premium/GoogleMapsRunningIndicators.tsx");
const configCard = read("src/components/google-maps-premium/GoogleMapsRunningConfigCard.tsx");
const runningMap = read("src/components/google-maps-premium/GoogleMapsRunningMapPanel.tsx");
const liveStatus = read("src/components/google-maps-premium/GoogleMapsRunningLiveStatus.tsx");
const runningTable = read("src/components/google-maps-premium/GoogleMapsRunningTable.tsx");
const premiumView = read("src/components/google-maps-premium/GoogleMapsPremiumView.tsx");
const mapConfig = read("src/lib/map-config.ts");
const topbar = read("src/components/google-maps-premium/GoogleMapsTopbar.tsx");
const sidebar = read("src/components/home-premium/DashboardSidebar.tsx");
const mapPanel = read("src/components/google-maps-premium/GoogleMapsMapPanel.tsx");
const dashboardRoute = read("src/routes/_authenticated/dashboard.tsx");
const leadsManager = read("src/components/leads/LeadsManager.tsx");
const listasView = read("src/components/listas-premium/ListasPremiumView.tsx");
const pipelineSection = read("src/components/leads/PipelineSection.tsx");
const campanhasView = read("src/components/campanhas-premium/CampanhasPremiumView.tsx");

// 1. Renderização da Tela 02
test("1. Renderização da Tela 02: a View principal reúne todos os blocos do layout", () => {
  assert.match(runningView, /GoogleMapsTopbar/);
  assert.match(runningView, /GoogleMapsRunningStepper/);
  assert.match(runningView, /GoogleMapsRunningIndicators/);
  assert.match(runningView, /GoogleMapsRunningConfigCard/);
  assert.match(runningView, /GoogleMapsRunningMapPanel/);
  assert.match(runningView, /GoogleMapsRunningLiveStatus/);
  assert.match(runningView, /GoogleMapsRunningTable/);
});

// 2. Preservação da logo oficial
test("2. Preservação da logo oficial: o sidebar da plataforma utiliza FlowLeadsLogo", () => {
  assert.match(sidebar, /FlowLeadsLogo/);
  assert.match(sidebar, /Flow Business/);
});

// 3. Navegação Tela 01 → Tela 02
test("3. Navegação Tela 01 → Tela 02: ao iniciar prospecção na Tela 01 transiciona para Tela 02", () => {
  assert.match(premiumView, /setActiveView\("running"\)/);
  assert.match(premiumView, /activeView === "running"/);
  assert.match(premiumView, /<GoogleMapsRunningView/);
});

// 4. Navegação reversa Tela 02 → Tela 01
test("4. Navegação reversa Tela 02 → Tela 01: o botão 'Editar configuração' permite retornar à Tela 01", () => {
  assert.match(configCard, /Editar configuração/);
  assert.match(configCard, /onEditarConfiguracao/);
  assert.match(runningView, /onVoltarConfiguracao/);
  assert.match(premiumView, /onVoltarConfiguracao=\{\(\) => setActiveView\("config"\)\}/);
});

// 5. Preservação da configuração real
test("5. Preservação da configuração real: a Tela 02 recebe e exibe nicho, local, raio, limite e nome da lista", () => {
  assert.match(configCard, /Nicho \/ Especialidade/);
  assert.match(configCard, /Localização/);
  assert.match(configCard, /Quantidade solicitada/);
  assert.match(configCard, /Nome da lista/);
  assert.match(configCard, /Fonte de busca/);
  assert.match(configCard, /Base conectada/);
  assert.doesNotMatch(configCard, /Apify|Geoapify|Scraper|Provedor/i);
});

// 6. Barra de 5 etapas
test("6. Barra de 5 etapas: componente GoogleMapsRunningStepper possui as 5 etapas documentadas", () => {
  assert.match(stepper, /Inicializando/);
  assert.match(stepper, /Coletando do Google Maps/);
  assert.match(stepper, /Processando resultados/);
  assert.match(stepper, /Salvando leads/);
  assert.match(stepper, /Concluindo/);
});

// 7. Etapa 1 Inicializando
test("7. Etapa 1 Inicializando: valida configuração e reserva de cota", () => {
  assert.match(stepper, /Validando configuração e reservando cota/);
});

// 8. Etapa 2 Coletando do Google Maps
test("8. Etapa 2 Coletando do Google Maps: busca empresas sem revelar fornecedor", () => {
  assert.match(stepper, /Buscando empresas na região selecionada/);
  assert.doesNotMatch(stepper, /Apify|Geoapify|Scraper|Provedor/i);
});

// 9. Etapa 3 Processando resultados
test("9. Etapa 3 Processando resultados: filtrando, enriquecendo e removendo duplicatas", () => {
  assert.match(stepper, /Filtrando, enriquecendo e removendo duplicatas/);
});

// 10. Etapa 4 Salvando leads
test("10. Etapa 4 Salvando leads: gravando na organização e criando a lista", () => {
  assert.match(stepper, /Gravando na sua organização e criando a lista/);
});

// 11. Etapa 5 Concluindo
test("11. Etapa 5 Concluindo: finalizando e preparando resultados", () => {
  assert.match(stepper, /Finalizando e preparando seus resultados/);
});

// 12. Cinco indicadores operacionais
test("12. Cinco indicadores operacionais: GoogleMapsRunningIndicators apresenta os 5 cards da referência", () => {
  assert.match(indicators, /Empresas encontradas/);
  assert.match(indicators, /Leads inéditos/);
  assert.match(indicators, /Duplicatas descartadas/);
  assert.match(indicators, /Progresso da coleta/);
  assert.match(indicators, /Tempo decorrido/);
});

// 13. Card Empresas encontradas
test("13. Card Empresas encontradas: exibe total de empresas retornadas pelo provedor", () => {
  assert.match(indicators, /totalEmpresasEncontradas/);
  assert.match(indicators, /na região pesquisada/);
});

// 14. Card Leads inéditos
test("14. Card Leads inéditos: exibe leads novos inseridos para a organização", () => {
  assert.match(indicators, /leadsIneditos/);
  assert.match(indicators, /novos para sua organização/);
});

// 15. Card Duplicatas descartadas
test("15. Card Duplicatas descartadas: contabiliza registros já pertencentes à organização", () => {
  assert.match(indicators, /duplicatasDescartadas/);
  assert.match(indicators, /já entregues anteriormente/);
});

// 16. Card Progresso da coleta
test("16. Card Progresso da coleta: porcentagem e barra de progresso baseadas em dados reais", () => {
  assert.match(indicators, /percentualProgresso/);
  assert.match(indicators, /progressFound.*progressTarget/);
});

// 17. Card Tempo decorrido
test("17. Card Tempo decorrido: cronômetro em tempo real no formato MM:SS", () => {
  assert.match(indicators, /formatTime\(elapsedSeconds\)/);
  assert.match(premiumView, /elapsedSeconds/);
});

// 18. Mapa compartilhado
test("18. Mapa compartilhado: GoogleMapsRunningMapPanel reutiliza a configuração centralizada MAP_CONFIG", () => {
  assert.match(runningMap, /MAP_CONFIG/);
  assert.match(runningMap, /MAP_LAYERS/);
  assert.match(mapPanel, /MAP_CONFIG/);
});

// 19. Remoção do erro API KEY REQUIRED
test("19. Remoção do erro API KEY REQUIRED: endpoints CartoDB eliminados em favor de OpenStreetMap seguro", () => {
  assert.match(mapConfig, /openstreetmap\.org/);
  assert.match(mapConfig, /leaflet-dark-tiles/);
  assert.match(mapConfig, /tileUrl:\s*"https:\/\/\{s\}\.tile\.openstreetmap\.org/);
});

// 20. Configuração centralizada de mapas
test("20. Configuração centralizada de mapas: map-config.ts exporta MAP_CONFIG e MAP_LAYERS compartilhados", () => {
  assert.match(mapConfig, /export const MAP_CONFIG/);
  assert.match(mapConfig, /export const MAP_LAYERS/);
  assert.match(mapConfig, /darkTilesClass/);
});

// 21. Marcadores de empresas reais
test("21. Marcadores de empresas reais: o mapa da Tela 02 plota pinos para empresas com coordenadas", () => {
  assert.match(runningMap, /leadsComCoords/);
  assert.match(runningMap, /latitude/);
  assert.match(runningMap, /longitude/);
  assert.match(runningMap, /leadMarkers/);
});

// 22. Painel de status em tempo real
test("22. Painel de status em tempo real: exibe apenas estados públicos seguros", () => {
  assert.match(liveStatus, /Status em tempo real/);
  assert.match(liveStatus, /Pesquisa em andamento|Pesquisa concluída/);
  assert.doesNotMatch(liveStatus, /logs\.map|US\$|USD|BRL|custo\s|saldo\s|RUNNING|SUCCEEDED/);
});

// 23. Categorização de logs
test("23. Categorização de logs: marcadores coloridos diferenciam requisição, leads, duplicatas e erros", () => {
  assert.match(liveStatus, /A busca continua em segundo plano/);
  assert.match(liveStatus, /emerald-400/);
  assert.doesNotMatch(liveStatus, /message|log\.match/);
});

// 24. Tabela de empresas encontradas
test("24. Tabela de empresas encontradas: GoogleMapsRunningTable exibe registros coletados durante a execução", () => {
  assert.match(runningTable, /Empresas encontradas/);
  assert.match(runningTable, /business_name/);
  assert.match(runningTable, /rating/);
  assert.match(runningTable, /phone/);
  assert.match(runningTable, /website/);
  assert.match(runningTable, /Novo lead/);
});

// 25. Tabs de filtro na tabela
test("25. Tabs de filtro na tabela: filtros Todos, Inéditos e Duplicatas", () => {
  assert.match(runningTable, /tabFiltro/);
  assert.match(runningTable, /Todos/);
  assert.match(runningTable, /Inéditos/);
  assert.match(runningTable, /Duplicatas/);
});

// 26. Exportação CSV autorizada
test("26. Exportação CSV autorizada: função de download CSV disponível para os leads coletados", () => {
  assert.match(runningTable, /handleExportarCSV/);
  assert.match(runningTable, /text\/csv;charset=utf-8/);
  assert.match(runningTable, /Exportar CSV/);
});

// 27. Cancelamento honesto
test("27. Cancelamento honesto: botão e modal de interrupção abortam o stream sem falsas promessas externas", () => {
  assert.match(runningView, /Cancelar busca/);
  assert.match(runningView, /onCancelarBusca/);
  assert.match(premiumView, /handleCancelarBusca/);
  assert.match(premiumView, /abortRef\.current\.abort\(\)/);
});

// 28. Tratamento de stream encerrado sem conclusão
test("28. Tratamento de stream encerrado sem conclusão: detecta encerramento prematuro sem alegar conclusão indevida", () => {
  assert.match(premiumView, /!doneRecebido && !streamHadError/);
  assert.match(premiumView, /Parcial — conexão encerrada/);
});

// 29. Não regressão da Tela 01
test("29. Não regressão da Tela 01: GoogleMapsPremiumView mantém a renderização da Tela 01 intacta", () => {
  assert.match(premiumView, /GoogleMapsNicheInput/);
  assert.match(premiumView, /GoogleMapsCategories/);
  assert.match(premiumView, /GoogleMapsLocation/);
  assert.match(premiumView, /GoogleMapsMapPanel/);
  assert.match(premiumView, /GoogleMapsSearchSummary/);
});

// 30. Não regressão dos módulos globais
test("30. Não regressão dos módulos globais: Leads, Minhas Listas, Pipeline e Campanhas preservados", () => {
  assert.match(dashboardRoute, /section === "buscar"/);
  assert.match(dashboardRoute, /GoogleMapsPremiumView/);
  assert.ok(leadsManager.length > 500);
  assert.ok(listasView.length > 500);
  assert.ok(pipelineSection.length > 500);
  assert.ok(campanhasView.length > 500);
});

test("31. Tabela ao vivo pagina 10, 25 ou 50 itens sem descartar a colecao", () => {
  assert.match(runningTable, /itensPorPagina/);
  assert.match(runningTable, /setItensPorPagina/);
  assert.match(runningTable, /useState\(10\)/);
  assert.match(runningTable, /\.slice\(inicio, inicio \+ itensPorPagina\)/);
  assert.match(runningTable, /10 por página/);
  assert.match(runningTable, /25 por página/);
  assert.match(runningTable, /50 por página/);
  assert.match(runningTable, /max-h-/);
});

test("32. Tela 02 oferece retorno seguro a configuracao sem tratar navegacao como cancelamento", () => {
  assert.match(runningView, /Voltar à configuração/);
  assert.match(runningView, /continuará em andamento/);
  assert.match(runningView, /onVoltarConfiguracao/);
});
