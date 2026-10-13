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
