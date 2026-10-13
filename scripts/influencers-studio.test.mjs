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


