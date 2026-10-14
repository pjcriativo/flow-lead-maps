// Suite: Google Maps Premium — Tela 01: Configurar Busca
// Testes de regressão, conformidade visual e integridade funcional dos 30 itens exigidos

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const view = readFileSync("src/components/google-maps-premium/GoogleMapsPremiumView.tsx", "utf8");
const topbar = readFileSync("src/components/google-maps-premium/GoogleMapsTopbar.tsx", "utf8");
const header = readFileSync("src/components/google-maps-premium/GoogleMapsHeader.tsx", "utf8");
const statsCards = readFileSync(
  "src/components/google-maps-premium/GoogleMapsStatsCards.tsx",
  "utf8",
);
const nicheInput = readFileSync(
  "src/components/google-maps-premium/GoogleMapsNicheInput.tsx",
  "utf8",
);
const categories = readFileSync(
  "src/components/google-maps-premium/GoogleMapsCategories.tsx",
  "utf8",
);
const location = readFileSync("src/components/google-maps-premium/GoogleMapsLocation.tsx", "utf8");
const mapPanel = readFileSync("src/components/google-maps-premium/GoogleMapsMapPanel.tsx", "utf8");
const summary = readFileSync(
  "src/components/google-maps-premium/GoogleMapsSearchSummary.tsx",
  "utf8",
);
const resultsPanel = readFileSync(
  "src/components/google-maps-premium/GoogleMapsResultsPanel.tsx",
  "utf8",
);
const ibge = readFileSync("src/lib/ibge.ts", "utf8");
const statsHook = readFileSync("src/components/google-maps-premium/useGoogleMapsStats.ts", "utf8");
const dashboardRoute = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
const sidebar = readFileSync("src/components/home-premium/DashboardSidebar.tsx", "utf8");
const leadsApi = readFileSync("src/lib/leads-api.ts", "utf8");
const searchFunction = readFileSync("supabase/functions/search-leads/index.ts", "utf8");
const runningConfig = readFileSync(
  "src/components/google-maps-premium/GoogleMapsRunningConfigCard.tsx",
  "utf8",
);
const runningStepper = readFileSync(
  "src/components/google-maps-premium/GoogleMapsRunningStepper.tsx",
  "utf8",
);
const runningView = readFileSync(
  "src/components/google-maps-premium/GoogleMapsRunningView.tsx",
  "utf8",
);
const resultsHeader = readFileSync(
  "src/components/google-maps-premium/GoogleMapsResultsHeader.tsx",
  "utf8",
);
const companyDetails = readFileSync(
  "src/components/google-maps-premium/GoogleMapsCompanyDetails.tsx",
  "utf8",
);
const historyDetails = readFileSync(
  "src/components/google-maps-premium/GoogleMapsHistoryDetails.tsx",
  "utf8",
);
const historyHook = readFileSync(
  "src/components/google-maps-premium/useGoogleMapsHistory.ts",
  "utf8",
);
const searchResultsView = readFileSync(
  "src/components/google-maps-premium/GoogleMapsSearchResultsView.tsx",
  "utf8",
);

// 1. Renderização da interface
test("1. Renderização da interface: a View principal reúne todos os blocos do layout", () => {
  assert.ok(existsSync("src/components/google-maps-premium/GoogleMapsPremiumView.tsx"));
  assert.match(view, /<GoogleMapsTopbar/);
  assert.match(view, /<GoogleMapsHeader/);
  assert.match(view, /<GoogleMapsStatsCards/);
  assert.match(view, /<GoogleMapsNicheInput/);
  assert.match(view, /<GoogleMapsCategories/);
  assert.match(view, /<GoogleMapsLocation/);
  assert.match(view, /<GoogleMapsMapPanel/);
  assert.match(view, /<GoogleMapsSearchSummary/);
  assert.match(view, /<GoogleMapsResultsPanel/);
});

// 2. Preservação da logo oficial
test("2. Preservação da logo oficial: o sidebar continua utilizando FlowLeadsLogo", () => {
  assert.match(sidebar, /import\s*\{\s*FlowLeadsLogo\s*\}\s*from\s*"@\/components\/FlowLeadsLogo"/);
  assert.match(sidebar, /<FlowLeadsLogo/);
});

// 3. Sidebar
test("3. Sidebar: Google Maps permanece selecionado com destaque laranja e vinculado à seção buscar", () => {
  assert.match(sidebar, /label:\s*"Google Maps",\s*section:\s*"buscar"/);
  assert.match(sidebar, /bg-home-orange text-white shadow-\[0_0_20px_rgba\(255,98,0,0\.3\)\]/);
  assert.match(dashboardRoute, /section === "buscar"/);
  assert.match(dashboardRoute, /<GoogleMapsPremiumView/);
});

// 4. Campo de nicho livre
test("4. Campo de nicho livre: o usuário pode digitar qualquer texto sem obrigatoriedade de categoria", () => {
  assert.match(nicheInput, /Nicho \(digite ou escolha\)/);
  assert.match(nicheInput, /placeholder="Digite qualquer nicho, profissão ou serviço\.\.\."/);
  assert.match(
    nicheInput,
    /onChange=\{(?:e\s*=>\s*\{[^}]*onChangeNicho\(e\.target\.value\)|(?:\(e\)\s*=>\s*\{[^}]*onChangeNicho\(e\.target\.value\)))/,
  );
  assert.match(nicheInput, /aria-label="Limpar nicho"/);
});

// 5. Seleção de nicho por categoria
test("5. Seleção de nicho por categoria: o catálogo consome os 132 nichos reais do projeto", () => {
  assert.match(categories, /import\s*\{[^}]*NICHOS_POR_CATEGORIA[^}]*\}\s*from\s*"@\/lib\/niches"/);
  assert.match(categories, /TOTAL_NICHOS/);
  assert.match(categories, /onSelectCategoria\(n,\s*grupo\.categoria\)/);
});

// 6. Sincronização entre categoria e input
test("6. Sincronização entre categoria e input: selecionar uma categoria preenche o nicho", () => {
  assert.match(
    view,
    /onSelectCategoria=\{(?:n,\s*cat|(?:\(n,\s*cat\)))\s*=>\s*\{[^}]*setNicho\(n\)/,
  );
  assert.match(view, /setCategoriaAtiva\(cat\)/);
});

// 7. Pesquisa de categorias
test("7. Pesquisa de categorias: permite filtrar segmentos e nichos por texto", () => {
  assert.match(categories, /placeholder="Buscar categoria\.\.\."/);
  assert.match(categories, /norm\(grupo\.categoria\)\.includes\(termo\)/);
});

// 8. Nicho não cadastrado
test("8. Nicho não cadastrado: autocomplete oferece opção 'Usar exatamente' e preserva o texto digitado", () => {
  assert.match(nicheInput, /Usar exatamente:/);
  assert.match(nicheInput, /onSelectNicho\(nicho\.trim\(\)\)/);
});

// 9. Seleção única
test("9. Seleção única: apenas um nicho principal é armazenado no estado por busca", () => {
  assert.match(view, /const\s*\[nicho,\s*setNicho\]\s*=\s*useState/);
  assert.doesNotMatch(view, /const\s*\[nichosSelecionados,\s*setNichosSelecionados\]/);
});

// 10. Estado antes de cidade
test("10. Estado antes de cidade: o campo Estado (UF) precede o campo Cidade no layout", () => {
  const ufMatch = location.search(/Estado \(UF\)/);
  const cidadeMatch = location.search(/<label[^>]*>\s*Cidade\s*<\/label>/);
  assert.ok(ufMatch >= 0 && cidadeMatch >= 0, "Labels de UF e Cidade devem existir no JSX");
  assert.ok(ufMatch < cidadeMatch, "Estado (UF) deve aparecer antes de Cidade no JSX");
});

// 11. Carregamento completo de municípios
test("11. Carregamento completo de municípios: consome a API do IBGE com cache e fallback", () => {
  assert.match(ibge, /https:\/\/servicodados\.ibge\.gov\.br\/api\/v1\/localidades\/estados\//);
  assert.match(ibge, /export\s*async\s*function\s*listarMunicipiosPorUf/);
  assert.match(ibge, /ESTADOS_BRASIL/);
  assert.match(ibge, /cacheEmMemoria/);
});

// 12. Limpeza de cidade ao trocar UF
test("12. Limpeza de cidade ao trocar UF: alterar o estado limpa a cidade e as coordenadas", () => {
  assert.match(
    view,
    /onSelectUf=\{(?:novaUf|(?:\(novaUf\)))\s*=>\s*\{[^}]*setCidade\(""\)[^}]*setPin\(null\)/,
  );
});

// 13. Nome automático da lista
test("13. Nome automático da lista: resolve o nome via resolveListName", () => {
  assert.match(view, /resolveListName\(nomeListaCustom,\s*nicho,\s*cidade,\s*uf\)/);
});

// 14. Preservação do nome personalizado
test("14. Preservação do nome personalizado: o nome customizado tem precedência e não é sobrescrito", () => {
  assert.match(view, /setNomeListaCustom/);
  assert.match(view, /nomeLista=\{nomeListaResolvido\}/);
  assert.match(summary, /\{nomeLista \|\| "Sugestão automática"\}/);
});

// 15. Raio e mapa
test("15. Raio e mapa: Leaflet escuro com marcador central, círculo laranja e slider de raio", () => {
  assert.match(mapPanel, /leaflet/);
  assert.match(mapPanel, /cartocdn\.com\/dark_all/);
  assert.match(mapPanel, /color:\s*"#ff6200"/);
  assert.match(mapPanel, /Raio da Busca/);
  assert.match(mapPanel, /onChangeRaio/);
});

// 16. Filtros por captura
test("16. Filtros por captura: permite alternar telefone, site e instagram", () => {
  assert.match(summary, /id:\s*"telefone"/);
  assert.match(summary, /id:\s*"site"/);
  assert.match(summary, /id:\s*"instagram"/);
  assert.match(resultsPanel, /capturaOk/);
  assert.match(summary, /aria-pressed=\{ativo\}/);
  assert.match(view, /toggleCaptureFilter/);
  assert.match(view, /const config = \{[^}]*filtrosCaptura/s);
  assert.match(view, /buscarEmails,\s*filtrosCaptura,\s*fonte:/);
  assert.match(leadsApi, /filtrosCaptura:\s*CaptureFilter\[\]/);
  assert.match(leadsApi, /filtros_captura:\s*params\.filtrosCaptura/);
  assert.match(searchFunction, /filtros_captura\?:\s*unknown/);
  assert.match(searchFunction, /matchesCaptureFilters/);
});

// 17. Enriquecimento por e-mail
test("17. Enriquecimento por e-mail: controle 'Buscar e-mails (visita ao site)' com switch", () => {
  assert.match(location, /Buscar e-mails/);
  assert.match(location, /Switch/);
  assert.match(view, /buscarEmails,\s*filtrosCaptura,\s*fonte:\s*"apify"/);
});

// 18. Quantidade por plano
test("18. Quantidade por plano: slider de quantidade respeita teto máximo", () => {
  assert.match(summary, /Quantidade de leads/);
  assert.match(summary, /max=\{Math\.min\(maxLimite,\s*500\)\}/);
});

// 19. Origem técnica oculta
test("19. Origem técnica oculta: integração configurada sem revelar fornecedor", () => {
  assert.match(view, /fonte:\s*"apify"/);
  assert.doesNotMatch(location, /Apify|Geoapify|OpenStreetMap|Scraper/i);
  assert.match(location, /Base conectada/);
});

test("19.1. Nenhuma tela, modal ou exportacao do modulo revela fornecedor tecnico", () => {
  const userFacingModules = [
    location,
    summary,
    runningConfig,
    runningStepper,
    runningView,
    resultsHeader,
    companyDetails,
    historyDetails,
    searchResultsView,
  ];
  const forbidden = /Apify|Geoapify|OpenStreetMap|Google Places|Scraper|Provedor/i;

  for (const moduleSource of userFacingModules) {
    assert.doesNotMatch(moduleSource, forbidden);
  }
  assert.doesNotMatch(historyHook, /"Provedor"|sanitizeCsvField\(item\.provedor\)/);
});

// 20. Ausência de fallback silencioso para OSM
test("20. Ausência de fallback silencioso para OSM: a nova interface não permite selecionar OSM como provedor", () => {
  assert.doesNotMatch(location, /<option value="osm">/);
  assert.doesNotMatch(location, /<option value="geoapify">/);
});

// 21. Deduplicação preservada
test("21. Deduplicação preservada: a interface exibe aviso de desconsideração automática de duplicatas", () => {
  assert.match(
    summary,
    /Empresas já entregues à sua organização serão\s+desconsideradas automaticamente\./,
  );
});

// 22. Indicadores reais
test("22. Indicadores reais: o hook useGoogleMapsStats consulta limites reais e dados da organização", () => {
  assert.match(statsHook, /google_maps_plan_usage/);
  assert.match(statsHook, /activeOrganization\.orgId/);
  assert.match(statsHook, /lead_lists/);
  assert.match(statsHook, /from\("leads"\)/);
});

// 23. Resumo sincronizado
test("23. Resumo sincronizado: o painel direito reflete nicho, local, raio, limite e filtros em tempo real", () => {
  assert.match(view, /<GoogleMapsSearchSummary[^>]*nicho=\{nicho\}/s);
  assert.match(view, /<GoogleMapsSearchSummary[^>]*cidade=\{cidade\}/s);
  assert.match(view, /<GoogleMapsSearchSummary[^>]*raioKm=\{raioKm\}/s);
  assert.match(view, /<GoogleMapsSearchSummary[^>]*limite=\{limite\}/s);
  assert.match(summary, /\{nicho \|\| "Não definido"\}/);
  assert.match(summary, /\{cidade \? `\$\{cidade\} - \$\{uf \|\| "BR"\}` : "Não definida"\}/);
});

// 24. Área de resultados preservada
test("24. Área de resultados preservada: status, 4 contadores, tabela ao vivo e exportação CSV", () => {
  assert.match(resultsPanel, /Resultados da busca/);
  assert.match(resultsPanel, /ScoreBadge/);
  assert.match(resultsPanel, /Exportar CSV/);
  assert.match(resultsPanel, /handleExportCsv/);
});

// 25. Estados de erro
test("25. Estados de erro: falhas na busca geram log explícito e toast de erro", () => {
  assert.match(view, /toast\.error/);
  assert.match(view, /pushLog\(`✖ \$\{sanitizeGoogleMapsUserMessage\(ev\.message\)\}`\)/);
  assert.match(resultsPanel, /status\.startsWith\("Erro"\)/);
});

// 26. Responsividade
test("26. Responsividade: composição em três colunas no desktop (lg:grid-cols-12) e empilhamento móvel", () => {
  assert.match(view, /grid grid-cols-1 gap-5 lg:grid-cols-12/);
  assert.match(view, /lg:col-span-4/);
  assert.match(view, /lg:col-span-5/);
  assert.match(view, /lg:col-span-3/);
});

// 27. Não regressão de Leads
test("27. Não regressão de Leads: rota e componentes da Central de Leads continuam intactos", () => {
  assert.ok(existsSync("src/components/leads/LeadsManager.tsx"));
  assert.match(dashboardRoute, /section === "leads"/);
});

// 28. Não regressão de Minhas Listas
test("28. Não regressão de Minhas Listas: rota e componentes de Minhas Listas continuam intactos", () => {
  assert.ok(existsSync("src/components/listas-premium/ListasPremiumView.tsx"));
  assert.match(dashboardRoute, /section === "listas"/);
});

// 29. Não regressão de Pipeline
test("29. Não regressão de Pipeline: rota e componentes do Pipeline continuam intactos", () => {
  assert.ok(existsSync("src/components/leads/PipelineSection.tsx"));
  assert.match(dashboardRoute, /section === "pipeline"/);
});

// 30. Não regressão de Campanhas
test("30. Não regressão de Campanhas: rota e componentes de Campanhas continuam intactos", () => {
  assert.ok(existsSync("src/components/campanhas-premium/CampanhasPremiumView.tsx"));
  assert.match(dashboardRoute, /section === "campanhas"/);
});
