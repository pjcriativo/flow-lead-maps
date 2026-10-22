// Consultas paginadas do Pipeline. O escopo (organização, papel, responsável) é imposto pelas RLS de
// `leads`; os filtros abaixo apenas estreitam o que o usuário já pode ver. Nada aqui carrega o
// conjunto inteiro: cada etapa pede um lote de PIPELINE_PAGE_SIZE leads por vez, por cursor.
import { supabase } from "@/integrations/supabase/client";
import type { Lead, LeadStatus } from "@/lib/leads-api";
import {
  cursorClause,
  cursorOf,
  pipelineFilterPlan,
  type PipelineCursor,
  type PipelineFilterPlan,
} from "@/lib/pipeline-filters";
import type {
  PipelineFilters,
  PipelineStageKey,
} from "@/components/pipeline-premium/pipeline-premium-data";
import { STAGE_STATUSES } from "@/components/pipeline-premium/pipeline-premium-data";

export { cursorOf, type PipelineCursor };
export const PIPELINE_PAGE_SIZE = 30;
const ID_CHUNK = 100;

function leadsQuery() {
  return supabase.from("leads").select("*");
}

function applyPlan(query: ReturnType<typeof leadsQuery>, plan: PipelineFilterPlan) {
  let q = query;
  for (const clause of plan.or) q = q.or(clause);
  for (const [column, value] of plan.eq) q = q.eq(column, value);
  for (const column of plan.isNull) q = q.is(column, null);
  for (const [column, value] of plan.gte) q = q.gte(column, value);
  for (const [column, value] of plan.lt) q = q.lt(column, value);
  for (const [column, value] of plan.lte) q = q.lte(column, value);
  return q;
}

export interface PipelineStagePage {
  items: Lead[];
  hasMore: boolean;
}

/**
 * Um lote de uma etapa. Pagina por cursor (e não por deslocamento), então o custo do lote 50 é o
 * mesmo do lote 1 mesmo sob RLS, e mover um card entre lotes não faz outro card sumir ou repetir.
 * Pede um registro a mais só para saber se existe próximo lote.
 */
export async function fetchPipelineStagePage(
  stage: PipelineStageKey,
  filters: PipelineFilters,
  cursor: PipelineCursor | null,
  pageSize = PIPELINE_PAGE_SIZE,
): Promise<PipelineStagePage> {
  if (filters.stage !== "all" && filters.stage !== stage) return { items: [], hasMore: false };
  let query = applyPlan(leadsQuery(), pipelineFilterPlan(filters)).in("status", [
    ...STAGE_STATUSES[stage],
  ]);
  if (cursor) query = query.or(cursorClause(cursor));
  const { data, error } = await query
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (error) throw error;
  const rows = data ?? [];
  return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
}

export type PipelineStatusCounts = Partial<Record<LeadStatus, number>>;

/** Quantos leads há em cada status (com os filtros da tela), em uma única passada sob RLS. */
export async function fetchPipelineCounts(filters: PipelineFilters): Promise<PipelineStatusCounts> {
  const search = filters.search
    .replace(/[,%()*:\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const { data, error } = await supabase.rpc("pipeline_status_counts", {
    p_search: search || undefined,
    p_channel: filters.channel,
    p_responsible: filters.responsible,
    p_score: filters.score,
    p_created_from: filters.createdFrom
      ? new Date(`${filters.createdFrom}T00:00:00`).toISOString()
      : undefined,
    p_created_to: filters.createdTo
      ? new Date(`${filters.createdTo}T23:59:59.999`).toISOString()
      : undefined,
  });
  if (error) throw error;
  const counts: PipelineStatusCounts = {};
  for (const row of data ?? []) counts[row.status as LeadStatus] = Number(row.total);
  return counts;
}

/**
 * Status dos leads que têm proposta (só esses importam para somar valores), respeitando os filtros.
 * Consulta em lotes pequenos de ids; leads fora da RLS ou fora do filtro simplesmente não voltam.
 */
export async function fetchProposalLeadStatuses(
  leadIds: readonly string[],
  filters: PipelineFilters | null,
): Promise<Map<string, LeadStatus>> {
  const plan = filters ? pipelineFilterPlan(filters) : null;
  const unique = [...new Set(leadIds)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += ID_CHUNK) chunks.push(unique.slice(i, i + ID_CHUNK));
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      let query = leadsQuery().in("id", chunk);
      if (plan) query = applyPlan(query, plan);
      const { data, error } = await query.limit(ID_CHUNK);
      if (error) throw error;
      return data ?? [];
    }),
  );
  const statuses = new Map<string, LeadStatus>();
  for (const rows of results) {
    for (const row of rows) statuses.set(row.id, row.status as LeadStatus);
  }
  return statuses;
}
