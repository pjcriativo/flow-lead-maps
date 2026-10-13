import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("todos os componentes de AI Influencers Studio existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/influencers-studio/influencers-data.ts",
    "src/components/influencers-studio/InfluencersHeader.tsx",
    "src/components/influencers-studio/InfluencersKpis.tsx",
    "src/components/influencers-studio/InfluencersHeroBanner.tsx",
    "src/components/influencers-studio/AvataresDestaqueSection.tsx",
    "src/components/influencers-studio/MeusUltimosVideosSection.tsx",
    "src/components/influencers-studio/InfluencersAssistantPanel.tsx",
    "src/components/influencers-studio/CriarVideoModal.tsx",
    "src/components/influencers-studio/CriarAvatarModal.tsx",
    "src/components/influencers-studio/AvatarDetalhesDrawer.tsx",
    "src/components/influencers-studio/VideoPlayerModal.tsx",
    "src/components/influencers-studio/AIInfluencersStudioPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo obrigatório ausente: ${file}`);
  }
});

test("DashboardSidebar possui AI Influencers Studio posicionado entre Flow Marketing AI e Conversas com submenu aprovado", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('label: "AI Influencers Studio"'),
    "Deve conter o item AI Influencers Studio",
  );
  assert.ok(
    sidebarContent.includes("Clapperboard"),
    "Deve usar o ícone Clapperboard",
  );

  // Ordem de navegação
  const mktIdx = sidebarContent.indexOf('label: "Flow Marketing AI"');
  const infIdx = sidebarContent.indexOf('label: "AI Influencers Studio"');
  const convIdx = sidebarContent.indexOf('label: "Conversas"');

  assert.ok(mktIdx < infIdx, "Flow Marketing AI deve preceder AI Influencers Studio");
  assert.ok(infIdx < convIdx, "AI Influencers Studio deve preceder Conversas");

  // Estrutura das 6 entradas do submenu
  assert.ok(sidebarContent.includes("INFLUENCERS_SUBITEMS"), "Deve declarar INFLUENCERS_SUBITEMS");
  assert.ok(sidebarContent.includes('label: "Visão Geral"'), "Submenu deve ter Visão Geral");
  assert.ok(sidebarContent.includes('label: "Biblioteca de Influencers"'), "Submenu deve ter Biblioteca de Influencers");
  assert.ok(sidebarContent.includes('label: "Criador de Avatares"'), "Submenu deve ter Criador de Avatares");
  assert.ok(sidebarContent.includes('label: "AI UGC Video Studio"'), "Submenu deve ter AI UGC Video Studio");
  assert.ok(sidebarContent.includes('label: "Projetos e Biblioteca"'), "Submenu deve ter Projetos e Biblioteca");
  assert.ok(sidebarContent.includes('label: "Meus Influencers e Licenças"'), "Submenu deve ter Meus Influencers e Licenças");

  // Visão Geral deve ter ready: true
  assert.ok(
    sidebarContent.includes('{ id: "visao_geral" as const, label: "Visão Geral", icon: LayoutDashboard, ready: true }'),
    "Visão Geral deve estar pronta e ativa (ready: true)",
  );
});

test("dashboardNavigation inclui influencers e mapeia alias de busca", () => {
  const navContent = fs.readFileSync(
    path.join(root, "src/lib/dashboard-navigation.ts"),
    "utf8",
  );

  assert.ok(
    navContent.includes('"influencers"'),
    "DASHBOARD_SECTION_IDS deve conter influencers",
  );
  assert.ok(
    navContent.includes('requested === "influencers_studio"'),
    "dashboardSectionFromSearch deve reconhecer influencers_studio",
  );
});

test("a rota dashboard renderiza AIInfluencersStudioPage quando a seção é influencers", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("AIInfluencersStudioPage"),
    "Deve importar AIInfluencersStudioPage",
  );
  assert.ok(
    dashContent.includes('section === "influencers"'),
    "Deve renderizar condicionalmente section === 'influencers'",
  );
});

test("os 6 indicadores superiores e dados da referência visual estão configurados com fidelidade", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/influencers-studio/influencers-data.ts"),
    "utf8",
  );

  // 6 Indicadores
  assert.ok(dataContent.includes("Vídeos gerados") && dataContent.includes('"48"'));
  assert.ok(dataContent.includes("Avatares criados") && dataContent.includes('"12"'));
  assert.ok(dataContent.includes("Minutos de vídeo") && dataContent.includes('"86 min"'));
  assert.ok(dataContent.includes("Visualizações") && dataContent.includes('"125.4K"'));
  assert.ok(dataContent.includes("Taxa de engajamento") && dataContent.includes('"8.7K"'));
  assert.ok(dataContent.includes("Conversões") && dataContent.includes('"486"'));

  // 6 Avatares em destaque
  assert.ok(dataContent.includes("Isabella") && dataContent.includes("Apresentadora"));
  assert.ok(dataContent.includes("Lucas") && dataContent.includes("Especialista"));
  assert.ok(dataContent.includes("Mariana") && dataContent.includes("Influencer"));
  assert.ok(dataContent.includes("Rafael") && dataContent.includes("Empresário"));
  assert.ok(dataContent.includes("Camila") && dataContent.includes("UGC Creator"));
  assert.ok(dataContent.includes("Bruno") && dataContent.includes("Apresentador"));

  // 6 Últimos vídeos
  assert.ok(dataContent.includes("Apresentação de Produto") && dataContent.includes("00:28"));
  assert.ok(dataContent.includes("Anúncio Instagram") && dataContent.includes("00:32"));
  assert.ok(dataContent.includes("Depoimento UGC") && dataContent.includes("00:45"));
  assert.ok(dataContent.includes("Promoção de Serviço") && dataContent.includes("00:30"));
  assert.ok(dataContent.includes("Lançamento de Curso") && dataContent.includes("00:38"));
  assert.ok(dataContent.includes("Dicas e Tutorial") && dataContent.includes("00:52"));

  // 7 Ações do assistente
  assert.ok(dataContent.includes("Criar vídeo com avatar"));
  assert.ok(dataContent.includes("Sugerir roteiros para meu produto"));
  assert.ok(dataContent.includes("Escolher o melhor avatar"));
  assert.ok(dataContent.includes("Adaptar vídeo para cada rede social"));
  assert.ok(dataContent.includes("Criar variações de um vídeo"));
  assert.ok(dataContent.includes("Traduzir e dublar vídeo"));
  assert.ok(dataContent.includes("Melhorar roteiro com IA"));

  // 4 Templates
  assert.ok(dataContent.includes("Oferta e Promoção"));
  assert.ok(dataContent.includes("Tutorial e Dicas"));
});

test("todos os componentes de Tela 2 (Biblioteca de Influencers) existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/influencers-studio/biblioteca/biblioteca-data.ts",
    "src/components/influencers-studio/biblioteca/InfluencersLibraryHeader.tsx",
    "src/components/influencers-studio/biblioteca/NicheCategoriesBar.tsx",
    "src/components/influencers-studio/biblioteca/InfluencersFiltersBar.tsx",
    "src/components/influencers-studio/biblioteca/InfluencerCard.tsx",
    "src/components/influencers-studio/biblioteca/InfluencersCatalogGrid.tsx",
    "src/components/influencers-studio/biblioteca/InfluencersBottomPromoCards.tsx",
    "src/components/influencers-studio/biblioteca/InfluencerDetailsSidebar.tsx",
    "src/components/influencers-studio/biblioteca/UsarInfluencerModal.tsx",
    "src/components/influencers-studio/biblioteca/InfluencersLibraryPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo da Biblioteca ausente: ${file}`);
  }
});

test("dados da Biblioteca de Influencers contemplam 10 nichos e 10 influencers aprovados", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/influencers-studio/biblioteca/biblioteca-data.ts"),
    "utf8",
  );

  // 10 Categorias
  assert.ok(dataContent.includes("NICHE_CATEGORIES"));
  assert.ok(dataContent.includes("128 influencers"));
  assert.ok(dataContent.includes("Lifestyle") && dataContent.includes("24 influencers"));
  assert.ok(dataContent.includes("Negócios") && dataContent.includes("18 influencers"));
  assert.ok(dataContent.includes("Saúde e Bem-estar") && dataContent.includes("16 influencers"));
  assert.ok(dataContent.includes("Beleza e Moda") && dataContent.includes("18 influencers"));
  assert.ok(dataContent.includes("Tecnologia") && dataContent.includes("12 influencers"));
  assert.ok(dataContent.includes("Educação") && dataContent.includes("10 influencers"));
  assert.ok(dataContent.includes("Gastronomia") && dataContent.includes("10 influencers"));
  assert.ok(dataContent.includes("Viagens") && dataContent.includes("8 influencers"));
  assert.ok(dataContent.includes("Esportes") && dataContent.includes("6 influencers"));

  // 10 Influencers do catálogo
  assert.ok(dataContent.includes("INFLUENCERS_CATALOG"));
  assert.ok(dataContent.includes("Isabella") && dataContent.includes("Lifestyle e Beleza"));
  assert.ok(dataContent.includes("Lucas") && dataContent.includes("Tecnologia e Negócios"));
  assert.ok(dataContent.includes("Mariana") && dataContent.includes("Saúde e Bem-estar"));
  assert.ok(dataContent.includes("Rafael") && dataContent.includes("Negócios e Finanças"));
  assert.ok(dataContent.includes("Camila") && dataContent.includes("Moda e Lifestyle"));
  assert.ok(dataContent.includes("Bruno") && dataContent.includes("Esportes e Saúde"));
  assert.ok(dataContent.includes("Fernanda") && dataContent.includes("Educação e Carreira"));
  assert.ok(dataContent.includes("Thiago") && dataContent.includes("Gastronomia"));
  assert.ok(dataContent.includes("Juliana") && dataContent.includes("Viagens e Lifestyle"));
  assert.ok(dataContent.includes("Mateus") && dataContent.includes("Moda Masculina"));

  // Badges específicas
  assert.ok(dataContent.includes("Mais usado"));
  assert.ok(dataContent.includes("Novo"));
  assert.ok(dataContent.includes("Em alta"));
});

test("DashboardSidebar ativa Biblioteca de Influencers como pronta (ready: true)", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('{ id: "biblioteca" as const, label: "Biblioteca de Influencers", icon: Users, ready: true }'),
    "Biblioteca de Influencers deve estar pronta (ready: true) no submenu",
  );
});

test("a rota dashboard renderiza InfluencersLibraryPage quando influencersSubView for biblioteca", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("InfluencersLibraryPage"),
    "Deve importar InfluencersLibraryPage",
  );
  assert.ok(
    dashContent.includes('section === "influencers" && influencersSubView === "biblioteca"'),
    "Deve renderizar condicionalmente InfluencersLibraryPage quando influencersSubView for biblioteca",
  );
});

test("todos os componentes de Tela 3 (Criador de Avatares) existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/influencers-studio/criador/criador-data.ts",
    "src/components/influencers-studio/criador/AvatarCreatorHeader.tsx",
    "src/components/influencers-studio/criador/AvatarCreationStepper.tsx",
    "src/components/influencers-studio/criador/AvatarAppearanceLibrary.tsx",
    "src/components/influencers-studio/criador/AvatarCustomizationPanel.tsx",
    "src/components/influencers-studio/criador/AvatarPreviewPanel.tsx",
    "src/components/influencers-studio/criador/AvatarAdditionalSteps.tsx",
    "src/components/influencers-studio/criador/AvatarCreatorPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo do Criador de Avatares ausente: ${file}`);
  }
});

test("dados do Criador de Avatares contemplam 12 modelos da plataforma, 6 tons de pele, 5 cabelos, 5 olhos, 6 expressões e 5 etapas", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/influencers-studio/criador/criador-data.ts"),
    "utf8",
  );

  // 12 Modelos
  assert.ok(dataContent.includes("PLATFORM_MODELS"));
  assert.ok(dataContent.includes('"Sofia"') && dataContent.includes('"Lifestyle"'));
  assert.ok(dataContent.includes('"Lucas"') && dataContent.includes('"Negócios"'));
  assert.ok(dataContent.includes('"Mariana"') && dataContent.includes('"Moda"'));
  assert.ok(dataContent.includes('"Rafael"') && dataContent.includes('"Tecnologia"'));
  assert.ok(dataContent.includes('"Camila"') && dataContent.includes('"Beleza"'));
  assert.ok(dataContent.includes('"Bruno"') && dataContent.includes('"Saúde"'));
  assert.ok(dataContent.includes('"Juliana"') && dataContent.includes('"Viagens"'));
  assert.ok(dataContent.includes('"Mateus"') && dataContent.includes('"Corporativo"'));
  assert.ok(dataContent.includes('"Isabella"') && dataContent.includes('"UGC"'));
  assert.ok(dataContent.includes('"Caio"') && dataContent.includes('"Esportes"'));
  assert.ok(dataContent.includes('"Fernanda"') && dataContent.includes('"Educação"'));
  assert.ok(dataContent.includes('"Thiago"') && dataContent.includes('"Gastronomia"'));

  // 6 Tons de pele
  assert.ok(dataContent.includes("SKIN_TONES"));
  assert.ok(dataContent.includes('"#F7D1BA"'));
  assert.ok(dataContent.includes('"#543322"'));

  // 5 Cabelos, 5 Olhos, 6 Expressões
  assert.ok(dataContent.includes("HAIR_OPTIONS"));
  assert.ok(dataContent.includes("EYE_OPTIONS"));
  assert.ok(dataContent.includes("FACIAL_EXPRESSIONS"));
  assert.ok(dataContent.includes('"Normal"'));
  assert.ok(dataContent.includes('"Sorriso"'));
  assert.ok(dataContent.includes('"Séria"'));
  assert.ok(dataContent.includes('"Animada"'));
  assert.ok(dataContent.includes('"Surpresa"'));
  assert.ok(dataContent.includes('"Pensativa"'));

  // 5 Etapas do Stepper
  assert.ok(dataContent.includes("CREATOR_STEPS"));
  assert.ok(dataContent.includes('"Aparência"'));
  assert.ok(dataContent.includes('"Voz e Idioma"'));
  assert.ok(dataContent.includes('"Personalidade"'));
  assert.ok(dataContent.includes('"Estilo e Cenários"'));
  assert.ok(dataContent.includes('"Revisão e Criação"'));
});

test("DashboardSidebar ativa Criador de Avatares como pronto (ready: true)", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('{ id: "criador" as const, label: "Criador de Avatares", icon: UserPlus, ready: true }'),
    "Criador de Avatares deve estar pronto (ready: true) no submenu",
  );
});

test("a rota dashboard renderiza AvatarCreatorPage quando influencersSubView for criador", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("AvatarCreatorPage"),
    "Deve importar AvatarCreatorPage",
  );
  assert.ok(
    dashContent.includes('section === "influencers" && influencersSubView === "criador"'),
    "Deve renderizar condicionalmente AvatarCreatorPage quando influencersSubView for criador",
  );
});

test("a logomarca oficial do Flow Business foi preservada sem alterações", () => {
  const logoContent = fs.readFileSync(
    path.join(root, "src/components/FlowLeadsLogo.tsx"),
    "utf8",
  );
  assert.ok(logoContent.includes("FlowLeadsLogo"), "Componente FlowLeadsLogo deve existir");
  assert.ok(logoContent.includes("Flow"), "Deve conter a marca Flow");
});

test("todos os componentes de Tela 4 (AI UGC Video Studio) existem e estão presentes", () => {
  const requiredFiles = [
    "src/components/influencers-studio/ugc-studio/ugc-data.ts",
    "src/components/influencers-studio/ugc-studio/UgcStudioHeader.tsx",
    "src/components/influencers-studio/ugc-studio/UgcProductionStepper.tsx",
    "src/components/influencers-studio/ugc-studio/UgcProductObjectivePanel.tsx",
    "src/components/influencers-studio/ugc-studio/UgcScriptTextPanel.tsx",
    "src/components/influencers-studio/ugc-studio/UgcAvatarVoicePanel.tsx",
    "src/components/influencers-studio/ugc-studio/UgcStyleFormatPanel.tsx",
    "src/components/influencers-studio/ugc-studio/UgcPreviewStoryboardPanel.tsx",
    "src/components/influencers-studio/ugc-studio/UgcProjectSummaryCard.tsx",
    "src/components/influencers-studio/ugc-studio/UgcVideoStudioPage.tsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo do UGC Video Studio ausente: ${file}`);
  }
});

test("dados do AI UGC Video Studio contemplam 5 produtos, 6 objetivos, 4 durações, 4 estilos, 4 cenários e 5 cenas de storyboard", () => {
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/influencers-studio/ugc-studio/ugc-data.ts"),
    "utf8",
  );

  // 5 Produtos
  assert.ok(dataContent.includes("UGC_PRODUCTS"));
  assert.ok(dataContent.includes("Curso de Marketing Digital") && dataContent.includes("Curso online"));
  assert.ok(dataContent.includes("Consultoria Empresarial") && dataContent.includes("Serviço"));
  assert.ok(dataContent.includes("E-book Produtividade") && dataContent.includes("E-book"));
  assert.ok(dataContent.includes("Mentoria Individual") && dataContent.includes("Serviço"));
  assert.ok(dataContent.includes("Pack de Templates") && dataContent.includes("Template"));

  // 6 Objetivos
  assert.ok(dataContent.includes("UGC_OBJECTIVES"));
  assert.ok(dataContent.includes('"Anúncio"'));
  assert.ok(dataContent.includes('"Review"'));
  assert.ok(dataContent.includes('"Tutorial"'));
  assert.ok(dataContent.includes('"Depoimento"'));
  assert.ok(dataContent.includes('"Institucional"'));
  assert.ok(dataContent.includes('"Outro"'));

  // 4 Durações
  assert.ok(dataContent.includes("UGC_DURATIONS"));
  assert.ok(dataContent.includes('"15 segundos"'));
  assert.ok(dataContent.includes('"30 segundos"'));
  assert.ok(dataContent.includes('"60 segundos"'));

  // 4 Estilos e 4 Cenários
  assert.ok(dataContent.includes("UGC_VISUAL_STYLES"));
  assert.ok(dataContent.includes('"Natural"'));
  assert.ok(dataContent.includes('"Profissional"'));
  assert.ok(dataContent.includes('"Casual"'));
  assert.ok(dataContent.includes('"Criativo"'));
  assert.ok(dataContent.includes("UGC_SCENARIOS"));
  assert.ok(dataContent.includes('"Interno"'));
  assert.ok(dataContent.includes('"Externo"'));
  assert.ok(dataContent.includes('"Estúdio"'));

  // 5 Cenas
  assert.ok(dataContent.includes("UGC_SCENES"));
  assert.ok(dataContent.includes("Apresentação") && dataContent.includes("0:00 - 0:05"));
  assert.ok(dataContent.includes("Problema") && dataContent.includes("0:05 - 0:10"));
  assert.ok(dataContent.includes("Solução") && dataContent.includes("0:10 - 0:20"));
  assert.ok(dataContent.includes("Benefícios") && dataContent.includes("0:20 - 0:25"));
  assert.ok(dataContent.includes("CTA") && dataContent.includes("0:25 - 0:30"));

  // 5 Etapas
  assert.ok(dataContent.includes("UGC_STEPS"));
  assert.ok(dataContent.includes("Produto e Objetivo"));
  assert.ok(dataContent.includes("Roteiro e Texto"));
  assert.ok(dataContent.includes("Avatar e Voz"));
  assert.ok(dataContent.includes("Estilo e Formato"));
  assert.ok(dataContent.includes("Revisão e Geração"));
});

test("DashboardSidebar ativa AI UGC Video Studio como pronto (ready: true)", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('{ id: "ugc_studio" as const, label: "AI UGC Video Studio", icon: Video, ready: true }'),
    "AI UGC Video Studio deve estar pronto (ready: true) no submenu",
  );
});

test("a rota dashboard renderiza UgcVideoStudioPage quando influencersSubView for ugc_studio", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("UgcVideoStudioPage"),
    "Deve importar UgcVideoStudioPage",
  );
  assert.ok(
    dashContent.includes('section === "influencers" && influencersSubView === "ugc_studio"'),
    "Deve renderizar condicionalmente UgcVideoStudioPage quando influencersSubView for ugc_studio",
  );
});

test("DashboardSidebar ativa Projetos e Biblioteca como pronto (ready: true)", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('{ id: "projetos" as const, label: "Projetos e Biblioteca", icon: FolderGit2, ready: true }'),
    "Projetos e Biblioteca deve estar pronto (ready: true) no submenu",
  );
});

test("a rota dashboard renderiza ProjetosBibliotecaPage quando influencersSubView for projetos", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("ProjetosBibliotecaPage"),
    "Deve importar ProjetosBibliotecaPage",
  );
  assert.ok(
    dashContent.includes('section === "influencers" && influencersSubView === "projetos"'),
    "Deve renderizar condicionalmente ProjetosBibliotecaPage quando influencersSubView for projetos",
  );
});

test("todos os componentes e dados da Tela 5 Projetos e Biblioteca existem e estão íntegros", () => {
  const requiredTela5Files = [
    "src/components/influencers-studio/projetos/projetos-data.ts",
    "src/components/influencers-studio/projetos/ProjetosHeader.tsx",
    "src/components/influencers-studio/projetos/ProjetosMetricsBlock.tsx",
    "src/components/influencers-studio/projetos/ProjetosFilterBar.tsx",
    "src/components/influencers-studio/projetos/ProjetosLibraryGrid.tsx",
    "src/components/influencers-studio/projetos/ProjetoDetailsSidebar.tsx",
    "src/components/influencers-studio/projetos/ProjetosBibliotecaPage.tsx",
  ];

  for (const file of requiredTela5Files) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo da Tela 5 ausente: ${file}`);
  }

  // Validação dos dados em projetos-data.ts
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/influencers-studio/projetos/projetos-data.ts"),
    "utf8",
  );

  // 6 KPIs
  assert.ok(dataContent.includes("Total de projetos") && dataContent.includes('"48"'));
  assert.ok(dataContent.includes("Vídeos gerados") && dataContent.includes('"186"'));
  assert.ok(dataContent.includes("Em processamento") && dataContent.includes('"12"'));
  assert.ok(dataContent.includes("Concluídos") && dataContent.includes('"162"'));
  assert.ok(dataContent.includes("Falhas") && dataContent.includes('"8"'));
  assert.ok(dataContent.includes("Espaço utilizado") && dataContent.includes('"12.4 GB"'));

  // Abas de categorias
  assert.ok(dataContent.includes("Todos") && dataContent.includes("48"));
  assert.ok(dataContent.includes("Vídeos") && dataContent.includes("186"));
  assert.ok(dataContent.includes("Imagens") && dataContent.includes("42"));
  assert.ok(dataContent.includes("Roteiros") && dataContent.includes("28"));
  assert.ok(dataContent.includes("Avatares") && dataContent.includes("12"));
  assert.ok(dataContent.includes("Templates") && dataContent.includes("18"));

  // 12 Cards Mockados
  assert.ok(dataContent.includes("Anúncio Shampoo Natural"));
  assert.ok(dataContent.includes("Review Curso Online"));
  assert.ok(dataContent.includes("Depoimento Cliente"));
  assert.ok(dataContent.includes("Lançamento de Produto"));
  assert.ok(dataContent.includes("Dicas de Saúde"));
  assert.ok(dataContent.includes("Tutorial Ferramenta"));
  assert.ok(dataContent.includes("Viagem e Lifestyle"));
  assert.ok(dataContent.includes("Anúncio Produto Beleza"));
  assert.ok(dataContent.includes("Apresentação Institucional"));
  assert.ok(dataContent.includes("Podcast e Entrevista"));
  assert.ok(dataContent.includes("Black Friday Oferta"));
  assert.ok(dataContent.includes("Campanha de Vendas"));

  // Card 1 Selecionado por padrão
  assert.ok(dataContent.includes("Isabella"));
  assert.ok(dataContent.includes("Shampoo Natural"));
  assert.ok(dataContent.includes("Vertical (9:16)"));
  assert.ok(dataContent.includes("Adriana (Natural)"));
  assert.ok(dataContent.includes("Interno - Estúdio"));
});

test("DashboardSidebar ativa Meus Influencers e Licenças como pronto (ready: true)", () => {
  const sidebarContent = fs.readFileSync(
    path.join(root, "src/components/home-premium/DashboardSidebar.tsx"),
    "utf8",
  );

  assert.ok(
    sidebarContent.includes('{ id: "licencas" as const, label: "Meus Influencers e Licenças", icon: Award, ready: true }'),
    "Meus Influencers e Licenças deve estar pronto (ready: true) no submenu",
  );
});

test("a rota dashboard renderiza MeusInfluencersLicencasPage quando influencersSubView for licencas", () => {
  const dashContent = fs.readFileSync(
    path.join(root, "src/routes/_authenticated/dashboard.tsx"),
    "utf8",
  );

  assert.ok(
    dashContent.includes("MeusInfluencersLicencasPage"),
    "Deve importar MeusInfluencersLicencasPage",
  );
  assert.ok(
    dashContent.includes('section === "influencers" && influencersSubView === "licencas"'),
    "Deve renderizar condicionalmente MeusInfluencersLicencasPage quando influencersSubView for licencas",
  );
});

test("todos os componentes e dados da Tela 6 Meus Influencers e Licenças existem e estão íntegros", () => {
  const requiredTela6Files = [
    "src/components/influencers-studio/licencas/licencas-data.ts",
    "src/components/influencers-studio/licencas/LicencasHeader.tsx",
    "src/components/influencers-studio/licencas/LicencasMetricsBlock.tsx",
    "src/components/influencers-studio/licencas/LicencasFilterBar.tsx",
    "src/components/influencers-studio/licencas/LicencasLibraryGrid.tsx",
    "src/components/influencers-studio/licencas/LicencaDetailsSidebar.tsx",
    "src/components/influencers-studio/licencas/MeusInfluencersLicencasPage.tsx",
  ];

  for (const file of requiredTela6Files) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Arquivo da Tela 6 ausente: ${file}`);
  }

  // Validação dos dados em licencas-data.ts
  const dataContent = fs.readFileSync(
    path.join(root, "src/components/influencers-studio/licencas/licencas-data.ts"),
    "utf8",
  );

  // 5 KPIs
  assert.ok(dataContent.includes("Meus Avatares") && dataContent.includes('"12"'));
  assert.ok(dataContent.includes("Influencers Licenciados") && dataContent.includes('"8"'));
  assert.ok(dataContent.includes("Licenças Ativas") && dataContent.includes('"17"'));
  assert.ok(dataContent.includes("Renovação em breve") && dataContent.includes('"3"'));
  assert.ok(dataContent.includes("Uso Comercial") && dataContent.includes('"100%"'));

  // 5 Abas
  assert.ok(dataContent.includes("Meus Avatares") && dataContent.includes("12"));
  assert.ok(dataContent.includes("Licenças e Contratos") && dataContent.includes("17"));
  assert.ok(dataContent.includes("Influencers Favoritos") && dataContent.includes("8"));
  assert.ok(dataContent.includes("Histórico de Uso"));
  assert.ok(dataContent.includes("Renovações") && dataContent.includes("3"));

  // 8 Influencers Mockados
  assert.ok(dataContent.includes("Isabella"));
  assert.ok(dataContent.includes("Lucas"));
  assert.ok(dataContent.includes("Mariana"));
  assert.ok(dataContent.includes("Rafael"));
  assert.ok(dataContent.includes("Fernanda"));
  assert.ok(dataContent.includes("Mateus"));
  assert.ok(dataContent.includes("Juliana"));
  assert.ok(dataContent.includes("Thiago"));

  // Isabella selecionada com detalhes de licença
  assert.ok(dataContent.includes("Bella Vita Cosméticos"));
  assert.ok(dataContent.includes("Uso comercial exclusivo"));
  assert.ok(dataContent.includes("320"));
  assert.ok(dataContent.includes("Global"));
});

test("a logomarca oficial FlowLeadsLogo está 100% preservada", () => {
  const logoContent = fs.readFileSync(
    path.join(root, "src/components/FlowLeadsLogo.tsx"),
    "utf8",
  );
  assert.ok(logoContent.includes("FlowLeadsLogo"), "Componente FlowLeadsLogo deve existir");
  assert.ok(logoContent.includes("BRAND_NAME"), "Logo deve utilizar BRAND_NAME oficial");
  assert.ok(logoContent.includes("fill="), "Logo deve conter os vetores originais");
});

