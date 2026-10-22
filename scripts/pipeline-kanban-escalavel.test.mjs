// Suite: Pipeline Kanban escalável.
// Invariante: com milhares de leads a tela mantém altura controlada, cada coluna rola sozinha e cada
// etapa carrega em lotes pelo banco, sem baixar nem renderizar tudo de uma vez.
// Boundary IN: domínio puro, plano de filtros e contratos do código. Boundary OUT: Supabase e
// navegador reais (provados à parte com dados sintéticos).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  STAGE_STATUSES,
  buildPipelineMetricsFromTotals,
  buildPipelineStagesFromTotals,
  stageForStatus,
  sumStageValues,
} from "../src/components/pipeline-premium/pipeline-premium-data.ts";
import { cursorClause, cursorOf, pipelineFilterPlan } from "../src/lib/pipeline-filters.ts";

const read = (path) => readFileSync(path, "utf8");
const hook = read("src/components/pipeline-premium/usePipelinePremium.ts");
const board = read("src/components/pipeline-premium/PipelineBoard.tsx");
const column = read("src/components/pipeline-premium/PipelineColumn.tsx");
const fill = read("src/components/pipeline-premium/use-fill-viewport-height.ts");
const query = read("src/lib/pipeline-query.ts");

const baseFilters = {
  search: "",
  channel: "all",
  stage: "all",
  responsible: "all",
  score: "all",
  createdFrom: "",
  createdTo: "",
};
const ALL_STATUSES = [
  "new",
  "contacted",
  "enriched",
  "nurture",
  "proposta_enviada",
  "responded",
  "meeting",
  "won",
  "lost",
];

test("o board ocupa a área útil: altura medida, colunas com rolagem própria e cabeçalho fixo", () => {
  assert.match(fill, /window\.innerHeight - top - bottomGap/);
  assert.match(fill, /ResizeObserver/);
  assert.match(board, /useFillViewportHeight\(boardRef\)/);
  assert.match(board, /overflow-x-auto overflow-y-hidden/);
  assert.match(column, /h-full min-h-0/);
  assert.match(column, /shrink-0 rounded-xl border/);
  assert.match(column, /min-h-0 flex-1 flex-col gap-2\.5 overflow-y-auto overscroll-contain/);
});

test("cada etapa carrega em lotes de 30 pelo banco e nunca baixa todos os leads", () => {
  assert.match(query, /PIPELINE_PAGE_SIZE = 30/);
  // Cursor (e não deslocamento): o custo do lote 50 é o do lote 1, mesmo sob RLS.
  assert.match(query, /\.limit\(pageSize \+ 1\)/);
  assert.match(query, /query\.or\(cursorClause\(cursor\)\)/);
  assert.doesNotMatch(query, /\.range\(/);
  assert.match(query, /\.in\("status", \[\s*\.\.\.STAGE_STATUSES\[stage\],?\s*\]\)/);
  // Ordem estável (desempate por id) para não perder nem repetir cards entre lotes.
  assert.match(query, /\.order\("score"[\s\S]*\.order\("created_at"[\s\S]*\.order\("id"/);
  // Nenhuma contagem exata por lote: a contagem vem de uma consulta agrupada à parte.
  assert.doesNotMatch(query, /count: "exact"/);
  assert.doesNotMatch(hook, /fetchLeads\b/);
  assert.match(hook, /useInfiniteQuery/);
  assert.match(hook, /getNextPageParam/);
  assert.match(hook, /useDebounced\(filters\.search, 300\)/);
});

test("o fim de cada coluna pede o próximo lote sem requisições duplicadas", () => {
  assert.match(column, /new IntersectionObserver/);
  assert.match(column, /root,\s*rootMargin/);
  assert.match(hook, /if \(query\.hasNextPage && !query\.isFetchingNextPage\)/);
  assert.match(column, /Carregando mais/);
});

test("arrastar funciona com colunas roláveis e as colunas não re-renderizam à toa", () => {
  assert.match(column, /list\.scrollTop -= 16/);
  assert.match(column, /memo\(PipelineColumnBase/);
  assert.match(board, /handlersRef/);
  // A movida otimista corrige contagens das duas etapas e é desfeita se o banco recusar.
  assert.match(hook, /moveCount\(current, from, status\)/);
  assert.match(hook, /previousCounts/);
  assert.match(hook, /onError:[\s\S]*setQueryData\(key, data\)/);
});

test("os KPIs do topo vêm de contagens do banco, não de uma lista completa no navegador", () => {
  assert.match(query, /rpc\("pipeline_status_counts"/);
  const migration = read("supabase/migrations/202610220002_pipeline_status_counts.sql");
  // Invoker: a RLS de leads continua decidindo o que cada usuário conta.
  assert.match(migration, /security invoker/);
  assert.doesNotMatch(migration, /security definer/);
  assert.match(migration, /grant execute[\s\S]*to authenticated/);
  assert.match(migration, /revoke all[\s\S]*from public, anon/);
  assert.match(hook, /buildPipelineMetricsFromTotals/);
});

test("STAGE_STATUSES cobre todos os status exatamente uma vez e coerente com a etapa", () => {
  const all = Object.values(STAGE_STATUSES).flat();
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual([...all].sort(), [...ALL_STATUSES].sort());
  for (const [stage, statuses] of Object.entries(STAGE_STATUSES)) {
    for (const status of statuses) assert.equal(stageForStatus(status), stage);
  }
});

test("totais e valores por etapa usam os números reais, não só os cards carregados", () => {
  const zero = { sum: 0, known: 0 };
  const negotiation = sumStageValues(
    new Map([
      ["a", "meeting"],
      ["b", "responded"],
      ["c", "new"],
    ]),
    new Map([
      ["a", 1000],
      ["b", 500],
    ]),
  );
  const stages = buildPipelineStagesFromTotals(
    { novo: 5000, contato: 0, qualificacao: 0, proposta: 0, negociacao: 2, fechado: 0 },
    {
      novo: negotiation.novo,
      contato: zero,
      qualificacao: zero,
      proposta: zero,
      negociacao: negotiation.negociacao,
      fechado: zero,
    },
  );
  assert.equal(stages[0].count, 5000);
  assert.equal(stages[0].totalValue, "Sem valores");
  assert.match(stages[4].totalValue, /1\.500/);

  const metrics = Object.fromEntries(
    buildPipelineMetricsFromTotals(
      { total: 5002, negotiation: 2, won: 7 },
      [{ lead_id: "a", status: "enviada", valor: 1000, criada_em: "2026-10-01T00:00:00Z" }],
      new Map([["a", "meeting"]]),
    ).map((item) => [item.id, item.value]),
  );
  assert.equal(metrics.leads, "5.002");
  assert.equal(metrics.vendas, "7");
  assert.equal(metrics.propostas, "1");
  assert.match(metrics.valor, /1\.000/);
});

test("filtros viram cláusulas do banco com a mesma semântica do filtro em memória", () => {
  assert.deepEqual(pipelineFilterPlan(baseFilters), {
    or: [],
    eq: [],
    isNull: [],
    gte: [],
    lt: [],
    lte: [],
  });

  // A busca é higienizada: vírgulas e parênteses não podem quebrar a cláusula do PostgREST.
  const search = pipelineFilterPlan({ ...baseFilters, search: "  Clínica, (Aurora)% " });
  assert.equal(search.or.length, 1);
  assert.match(search.or[0], /business_name\.ilike\.%Clínica Aurora%/);
  assert.equal(search.or[0].split(",").length, 5);

  assert.deepEqual(pipelineFilterPlan({ ...baseFilters, channel: "instagram" }).eq, [
    ["origem_fonte", "instagram"],
  ]);
  assert.match(pipelineFilterPlan({ ...baseFilters, channel: "maps" }).or[0], /google_maps/);
  assert.deepEqual(pipelineFilterPlan({ ...baseFilters, channel: "manual" }).isNull, ["place_id"]);

  assert.deepEqual(pipelineFilterPlan({ ...baseFilters, responsible: "none" }).isNull, [
    "assigned_to",
  ]);
  assert.deepEqual(pipelineFilterPlan({ ...baseFilters, responsible: "m1" }).eq, [
    ["assigned_to", "m1"],
  ]);

  assert.deepEqual(pipelineFilterPlan({ ...baseFilters, score: "high" }).gte, [["score", 80]]);
  const medium = pipelineFilterPlan({ ...baseFilters, score: "medium" });
  assert.deepEqual([medium.gte, medium.lt], [[["score", 70]], [["score", 80]]]);
  assert.deepEqual(pipelineFilterPlan({ ...baseFilters, score: "qualification" }).lt, [
    ["score", 70],
  ]);

  const dates = pipelineFilterPlan({
    ...baseFilters,
    createdFrom: "2026-10-05",
    createdTo: "2026-10-05",
  });
  assert.equal(dates.gte[0][0], "created_at");
  assert.ok(new Date(dates.gte[0][1]) < new Date(dates.lte[0][1]));
});

test("isolamento multi-tenant: as consultas nunca escolhem organização, a RLS decide", () => {
  assert.doesNotMatch(query, /org_id|service_role/);
  assert.match(query, /supabase\.from\("leads"\)/);
});

test("o cursor continua exatamente depois do último card, sem perder nem repetir", () => {
  const lead = { score: 70, created_at: "2026-10-05T12:00:00.123+00:00", id: "id-9" };
  const cursor = cursorOf(lead);
  assert.deepEqual(cursor, { score: 70, createdAt: lead.created_at, id: "id-9" });
  assert.equal(
    cursorClause(cursor),
    "score.lt.70,and(score.eq.70,created_at.lt.2026-10-05T12:00:00.123+00:00)," +
      "and(score.eq.70,created_at.eq.2026-10-05T12:00:00.123+00:00,id.lt.id-9)",
  );

  // Simulação com a mesma ordem do banco (score, created_at, id desc), paginada só pelo cursor.
  const rows = Array.from({ length: 200 }, (_, i) => ({
    score: i % 7,
    created_at: `2026-10-0${(i % 5) + 1}T00:00:00.000+00:00`,
    id: `id-${String(i).padStart(4, "0")}`,
  })).sort(
    (a, b) =>
      b.score - a.score || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
  );
  const after = (row, c) =>
    row.score < c.score ||
    (row.score === c.score && row.created_at < c.createdAt) ||
    (row.score === c.score && row.created_at === c.createdAt && row.id < c.id);
  const seen = [];
  let current = null;
  for (;;) {
    const page = rows.filter((row) => !current || after(row, current)).slice(0, 30);
    if (!page.length) break;
    seen.push(...page.map((row) => row.id));
    current = cursorOf(page.at(-1));
  }
  assert.equal(seen.length, rows.length);
  assert.equal(new Set(seen).size, rows.length);
  assert.deepEqual(
    seen,
    rows.map((row) => row.id),
  );
});
