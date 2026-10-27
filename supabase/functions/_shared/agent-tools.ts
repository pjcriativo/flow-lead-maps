// Registro de ferramentas do CEO de IA. Nesta fase existe UMA: consultar_resumo_comercial.
// Somente leitura, sem parâmetros do modelo (a organização vem da sessão autorizada, nunca do
// modelo), sem SQL livre e sem acesso a tabela arbitrária: o executor chama uma RPC fixa.
import type { ParamsSchema, ToolRisco } from "./agent-runtime.ts";

export type ToolDefinition = {
  nome: string;
  descricao: string;
  risco: ToolRisco;
  params: ParamsSchema;
};

export const TOOL_RESUMO_COMERCIAL = "consultar_resumo_comercial";

export const TOOL_REGISTRY: readonly ToolDefinition[] = [
  {
    nome: TOOL_RESUMO_COMERCIAL,
    descricao:
      "Consulta o resumo comercial REAL da organização: total de leads, leads por status, qualificados, etapas do pipeline e oportunidades disponíveis. Não recebe parâmetros. Somente leitura.",
    risco: "read",
    params: {},
  },
];

/** Formato `tools` da API Messages da Anthropic. */
export function anthropicToolSchemas(): {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}[] {
  return TOOL_REGISTRY.map((t) => ({
    name: t.nome,
    description: t.descricao,
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  }));
}

// Ordem e rótulos do funil (CHECK de leads.status, migration 011).
export const ETAPAS_PIPELINE: readonly { status: string; rotulo: string }[] = [
  { status: "new", rotulo: "Novo" },
  { status: "enriched", rotulo: "Enriquecido" },
  { status: "contacted", rotulo: "Contatado" },
  { status: "proposta_enviada", rotulo: "Proposta enviada" },
  { status: "responded", rotulo: "Respondeu" },
  { status: "meeting", rotulo: "Reunião" },
  { status: "won", rotulo: "Ganho" },
  { status: "lost", rotulo: "Perdido" },
  { status: "nurture", rotulo: "Nutrição" },
];

export type ResumoComercial =
  | { disponivel: false; motivo: string }
  | {
      disponivel: true;
      orgId: string;
      geradoEm: string;
      totalLeads: number;
      porStatus: Record<string, number>;
      etapasPipeline: { status: string; rotulo: string; total: number }[];
      qualificados: { total: number; criterio: string };
      oportunidadesDisponiveis: { total: number; criterio: string };
      novosUltimos30Dias: number;
      ganhos: number;
      perdidos: number;
      /** ganhos / (ganhos + perdidos); null quando ainda não há negócio encerrado. */
      taxaConversao: number | null;
      indisponiveis: string[];
    };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const toCount = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0
    ? v
    : typeof v === "string" && /^\d+$/.test(v)
      ? Number(v)
      : null;

/**
 * Valida o jsonb devolvido pela RPC agent_resumo_comercial. Qualquer campo ausente ou malformado
 * vira indisponibilidade explícita — o modelo nunca recebe número inventado.
 * `orgEsperada` garante que o payload é da organização autorizada.
 */
export function normalizarResumoComercial(raw: unknown, orgEsperada: string): ResumoComercial {
  if (!isRecord(raw)) return { disponivel: false, motivo: "resposta_vazia_ou_invalida" };
  if (raw.org_id !== orgEsperada) return { disponivel: false, motivo: "organizacao_divergente" };
  const total = toCount(raw.total_leads);
  if (total === null) return { disponivel: false, motivo: "total_de_leads_indisponivel" };

  const indisponiveis: string[] = [];
  const porStatus: Record<string, number> = {};
  if (isRecord(raw.por_status)) {
    for (const [status, n] of Object.entries(raw.por_status)) {
      const c = toCount(n);
      if (c !== null) porStatus[status] = c;
    }
  } else indisponiveis.push("por_status");

  const bloco = (nome: string, v: unknown): { total: number; criterio: string } | null => {
    if (!isRecord(v)) return (indisponiveis.push(nome), null);
    const t = toCount(v.total);
    if (t === null || typeof v.criterio !== "string") return (indisponiveis.push(nome), null);
    return { total: t, criterio: v.criterio };
  };
  const qualificados = bloco("qualificados", raw.qualificados);
  const oportunidades = bloco("oportunidades_disponiveis", raw.oportunidades_disponiveis);
  const contagem = (nome: string, v: unknown): number => {
    const c = toCount(v);
    if (c === null) indisponiveis.push(nome);
    return c ?? 0;
  };
  const novos = contagem("novos_ultimos_30_dias", raw.novos_ultimos_30_dias);
  const ganhos = contagem("ganhos", raw.ganhos);
  const perdidos = contagem("perdidos", raw.perdidos);
  const encerrados = ganhos + perdidos;

  return {
    disponivel: true,
    orgId: orgEsperada,
    geradoEm: typeof raw.gerado_em === "string" ? raw.gerado_em : "",
    totalLeads: total,
    porStatus,
    etapasPipeline: ETAPAS_PIPELINE.map((e) => ({ ...e, total: porStatus[e.status] ?? 0 })),
    qualificados: qualificados ?? { total: 0, criterio: "indisponivel" },
    oportunidadesDisponiveis: oportunidades ?? { total: 0, criterio: "indisponivel" },
    novosUltimos30Dias: novos,
    ganhos,
    perdidos,
    taxaConversao: encerrados > 0 && !indisponiveis.includes("ganhos") ? ganhos / encerrados : null,
    indisponiveis,
  };
}

/** Texto de sistema do CEO: papel, limites e instrução de nunca inventar número. */
export const CEO_SYSTEM_PROMPT = `Você é o CEO de IA do Flow Business, assistente comercial de uma organização.
Responda em português do Brasil, de forma objetiva.
REGRAS INEGOCIÁVEIS:
- Para falar de leads, funil, pipeline ou oportunidades, use SEMPRE a ferramenta consultar_resumo_comercial.
- Use somente números retornados pela ferramenta. Se algo não vier, diga que a informação não está disponível. Nunca estime nem invente.
- Você só consulta dados. Não envia mensagens, não cria nem altera registros, não gasta dinheiro e não altera permissões ou limites.
- Se pedirem uma ação externa ou de escrita, explique que ainda não é permitida e sugira o próximo passo para o usuário aprovar.`;
