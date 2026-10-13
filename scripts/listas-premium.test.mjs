// Suíte de Testes da Central de Listas Premium
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveListName } from "../src/lib/list-naming.ts";
import {
  calculateListKpis,
  calculateListResultMetrics,
} from "../src/components/listas-premium/listas-premium-metrics.ts";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("a rota dashboard renderiza ListasPremiumView quando a seção ativa é listas", () => {
  const file = read("src/routes/_authenticated/dashboard.tsx");

  assert.ok(
    file.includes("ListasPremiumView") &&
      file.includes("@/components/listas-premium/ListasPremiumView"),
    "Deveria importar ListasPremiumView de @/components/listas-premium/ListasPremiumView",
  );
  assert.ok(
    file.includes('{section === "listas" && ('),
    "Deveria renderizar condicionalmente section === 'listas'",
  );
  assert.ok(file.includes("<ListasPremiumView"), "Deveria instanciar ListasPremiumView");
  assert.ok(
    file.includes('section === "listas"') && file.includes("bg-home-background"),
    "Deveria aplicar o tema dark premium bg-home-background para a seção listas",
  );
});

test("a Central de Listas Premium reúne todos os componentes da composição aprovada", () => {
  const file = read("src/components/listas-premium/ListasPremiumView.tsx");

  assert.ok(file.includes("<ListasTopbar"), "Deveria conter ListasTopbar");
  assert.ok(file.includes("<ListasHeader"), "Deveria conter ListasHeader");
  assert.ok(file.includes("<ListasStatsCards"), "Deveria conter ListasStatsCards");
  assert.ok(file.includes("<BibliotecaListas"), "Deveria conter BibliotecaListas");
  assert.ok(file.includes("<ListaDetailsPanel"), "Deveria conter ListaDetailsPanel");
  assert.ok(file.includes("<RenomearListaModal"), "Deveria conter RenomearListaModal");
  assert.ok(file.includes("<NovaListaModal"), "Deveria conter NovaListaModal");
  assert.ok(file.includes("<CriarCampanhaModal"), "Deveria conter CriarCampanhaModal");
});

test("o cabeçalho exibe a arte fotográfica aprovada de montanhas com ambient glow", () => {
  const file = read("src/components/listas-premium/ListasHeader.tsx");

  assert.ok(file.includes("/auth-hero.png"), "Deveria conter a imagem hero /auth-hero.png");
  assert.ok(file.includes("Minhas Listas"), "Deveria conter o título Minhas Listas");
  assert.ok(
    file.includes("Seu centro de comando para organizar listas"),
    "Deveria conter o subtítulo aprovado",
  );
});

test("os 5 indicadores superiores refletem agregações reais e os cartões da referência", () => {
  const file = read("src/components/listas-premium/ListasStatsCards.tsx");

  assert.ok(file.includes("Total de listas"), "Deveria conter Total de listas");
  assert.ok(file.includes("Leads nas listas"), "Deveria conter Leads nas listas");
  assert.ok(file.includes("Listas com estratégia"), "Deveria conter Listas com estratégia");
  assert.ok(file.includes("Campanhas vinculadas"), "Deveria conter Campanhas vinculadas");
  assert.ok(file.includes("Aguardando ação"), "Deveria conter Aguardando ação");
});

test("o painel detalhado inclui as cinco abas e destaca Estratégia como padrão", () => {
  const file = read("src/components/listas-premium/ListaDetailsPanel.tsx");

  assert.ok(file.includes('"estrategia"'), "Deveria ter aba estrategia");
  assert.ok(file.includes('"leads"'), "Deveria ter aba leads");
  assert.ok(file.includes('"oferta"'), "Deveria ter aba oferta");
  assert.ok(file.includes('"campanhas"'), "Deveria ter aba campanhas");
  assert.ok(file.includes('"resultados"'), "Deveria ter aba resultados");
  assert.ok(
    file.includes('useState<ListaTabKey>("estrategia")'),
    "Aba padrão selecionada deve ser estrategia",
  );
});

test("a aba Estratégia reproduz a sequência, rascunho de mensagem e preview inferior de leads", () => {
  const file = read("src/components/listas-premium/ListaEstrategiaTab.tsx");

  assert.ok(file.includes("Oferta principal"), "Deveria conter Oferta principal");
  assert.ok(file.includes("Público e contexto"), "Deveria conter Público e contexto");
  assert.ok(file.includes("Abordagem"), "Deveria conter Abordagem");
  assert.ok(file.includes("Canais sugeridos"), "Deveria conter Canais sugeridos");
  assert.ok(file.includes("Sequência de abordagem"), "Deveria conter Sequência de abordagem");
  assert.ok(file.includes("Rascunho de mensagem"), "Deveria conter Rascunho de mensagem");
  assert.ok(file.includes("Campanhas vinculadas"), "Deveria conter Campanhas vinculadas");
  assert.ok(file.includes("Resultados rápidos"), "Deveria conter Resultados rápidos");
  assert.ok(
    file.includes("Preview de leads (5 primeiros)"),
    "Deveria conter Preview de leads (5 primeiros)",
  );
  assert.ok(file.includes("Ver todos os leads"), "Deveria conter o link Ver todos os leads");
});

test("a tela de busca de prospecção permite customizar o nome da lista conforme Etapa 7", () => {
  const file = read("src/components/leads/SearchSection.tsx");

  assert.ok(file.includes("nomeListaCustom"), "Deveria conter o estado nomeListaCustom");
  assert.ok(
    file.includes("resolveListName(nomeListaCustom, nicho, cidade, uf)"),
    "Deveria resolver o nome customizado com fallback automático",
  );
  assert.ok(
    file.includes("Nome da lista (opcional)"),
    "Deveria conter o rótulo do campo Nome da lista",
  );
  assert.match(
    file,
    /const nome = resolveListName\(nomeListaCustom, nicho, cidade, uf\);[\s\S]*criarListaComLeads\(\{[\s\S]*name: nome,/,
    "O nome resolvido deve ser entregue à persistência da lista",
  );
});

test("o nome personalizado é preservado e o vazio usa o fallback Nicho — Cidade/UF", () => {
  assert.equal(
    resolveListName("  Carteira prioritária  ", "Clínicas", "Recife", "PE"),
    "Carteira prioritária",
  );
  assert.equal(resolveListName("   ", "Clínicas", "Recife", "PE"), "Clínicas — Recife/PE");
});

test("os KPIs não confundem campanha ou follow-up com estratégia persistida", () => {
  const kpis = calculateListKpis([
    { leads_atuais: 8, campanhas_count: 1 },
    { leads_atuais: 5, campanhas_count: 0 },
    { leads_atuais: 0, campanhas_count: 0 },
  ]);

  assert.deepEqual(kpis, {
    totalListas: 3,
    totalLeads: 13,
    listasComEstrategia: null,
    campanhasVinculadas: 1,
    aguardandoAcao: 1,
  });
});

test("resultados distinguem disponibilidade de contato de contato efetivamente realizado", () => {
  const metrics = calculateListResultMetrics({
    leads_atuais: 13,
    com_contato_count: 8,
    campanhas_count: 2,
  });

  assert.equal(metrics.leadsComContatoDisponivel, 8);
  assert.equal(metrics.contatosRealizados, null);
  assert.equal(metrics.respostas, null);
  assert.equal(metrics.conversoes, null);
  assert.equal(metrics.clientesGanhos, null);
});

test("a central não apresenta tendências, campanhas, leads ou resultados simulados como reais", () => {
  const stats = read("src/components/listas-premium/ListasStatsCards.tsx");
  const strategy = read("src/components/listas-premium/ListaEstrategiaTab.tsx");
  const results = read("src/components/listas-premium/ListaResultadosTab.tsx");

  assert.doesNotMatch(stats, /↑|↓|badgeTrend/);
  assert.doesNotMatch(strategy, /Odonto Prime|Sorriso & Vida|Clínica OralTech/);
  assert.doesNotMatch(strategy, />312<|>87<|>36<|>12</);
  assert.match(strategy, /Modelo ilustrativo não persistido/);
  assert.match(strategy, /Sem métricas de execução consolidadas/);
  assert.match(results, /Contato disponível/);
  assert.match(results, /Contatos realizados/);
  assert.match(results, /Respostas/);
  assert.match(results, /Conversões/);
  assert.match(results, /Clientes ganhos/);
});

test("oferta e estratégia deixam explícito que os rascunhos não estão persistidos", () => {
  const offer = read("src/components/listas-premium/ListaOfertaTab.tsx");
  const strategy = read("src/components/listas-premium/ListaEstrategiaTab.tsx");

  assert.match(offer, /createEmptyOffer/);
  assert.match(offer, /Nenhum campo abaixo veio do banco/);
  assert.match(offer, /Atualizar rascunho temporário/);
  assert.doesNotMatch(offer, /toast\.success/);
  assert.match(strategy, /Alterações nesta aba não\s+são salvas/);
  assert.match(strategy, /nenhuma IA paga é acionada/);
});

test("as proteções de integridade e exclusão de listas do Prompt 36 permanecem 100% ativas", () => {
  const service = read("src/lib/lists-api.ts");

  assert.ok(service.includes("papel_do_usuario"), "Deveria exigir checagem de papel");
  assert.ok(service.includes('count: "exact"'), "Deveria checar count exato de leads");
  assert.ok(service.includes("Lista não pode ser excluída"), "Deveria bloquear exclusão com leads");
});
