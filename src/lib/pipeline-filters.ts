// Traduz os filtros do Pipeline em cláusulas do banco (puro, sem acesso a rede, testável).
import type { Lead } from "./leads-api.ts";
import type { PipelineFilters } from "../components/pipeline-premium/pipeline-premium-data.ts";

export interface PipelineFilterPlan {
  /** Cada item vira um `.or()` (todos combinados com AND). */
  or: string[];
  eq: Array<[string, string]>;
  isNull: string[];
  gte: Array<[string, string | number]>;
  lt: Array<[string, number]>;
  lte: Array<[string, string]>;
}

function safeSearch(value: string): string {
  return value
    .replace(/[,%()*:\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Traduz os filtros da tela para cláusulas do banco, com a mesma semântica do filtro em memória. */
export function pipelineFilterPlan(filters: PipelineFilters): PipelineFilterPlan {
  const plan: PipelineFilterPlan = { or: [], eq: [], isNull: [], gte: [], lt: [], lte: [] };
  const search = safeSearch(filters.search);
  if (search) {
    const pattern = `%${search}%`;
    plan.or.push(
      ["business_name", "owner_name", "phone", "email", "website"]
        .map((column) => `${column}.ilike.${pattern}`)
        .join(","),
    );
  }
  switch (filters.channel) {
    case "instagram":
    case "linkedin":
      plan.eq.push(["origem_fonte", filters.channel]);
      break;
    case "maps":
      plan.or.push(
        "origem_fonte.eq.google_maps,and(place_id.not.is.null,or(origem_fonte.is.null,origem_fonte.not.in.(instagram,linkedin)))",
      );
      break;
    case "manual":
      plan.isNull.push("place_id");
      plan.or.push("origem_fonte.is.null,origem_fonte.not.in.(instagram,linkedin,google_maps)");
      break;
    default:
      break;
  }
  if (filters.responsible === "none") plan.isNull.push("assigned_to");
  else if (filters.responsible !== "all") plan.eq.push(["assigned_to", filters.responsible]);
  if (filters.score === "high") plan.gte.push(["score", 80]);
  if (filters.score === "medium") {
    plan.gte.push(["score", 70]);
    plan.lt.push(["score", 80]);
  }
  if (filters.score === "qualification") plan.lt.push(["score", 70]);
  if (filters.createdFrom) {
    plan.gte.push(["created_at", new Date(`${filters.createdFrom}T00:00:00`).toISOString()]);
  }
  if (filters.createdTo) {
    plan.lte.push(["created_at", new Date(`${filters.createdTo}T23:59:59.999`).toISOString()]);
  }
  return plan;
}

/** Posição do último card carregado; o próximo lote começa logo depois dela (ordem estável). */
export interface PipelineCursor {
  score: number;
  createdAt: string;
  id: string;
}

export function cursorOf(lead: Lead): PipelineCursor {
  return { score: lead.score, createdAt: lead.created_at, id: lead.id };
}

/** Cláusula "depois do cursor" para a ordem score desc, created_at desc, id desc. */
export function cursorClause(cursor: PipelineCursor): string {
  return [
    `score.lt.${cursor.score}`,
    `and(score.eq.${cursor.score},created_at.lt.${cursor.createdAt})`,
    `and(score.eq.${cursor.score},created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
  ].join(",");
}
