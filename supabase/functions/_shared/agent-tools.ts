// Registro de ferramentas dos agentes. Todas operam por RPC fixa (security definer, org derivada do
// agente, estado/kill-switch/permissão validados no SQL): o modelo nunca informa a organização, nunca
// escreve SQL e nunca acessa tabela arbitrária. Leitura (risk "read") e coordenação interna
// ("write_internal": delegar tarefa e propor equipe). Nenhuma envia mensagem, gasta ou altera contrato.
import {
  authorizeToolCall,
  type AgentIdentity,
  type AgentPermission,
  type ParamsSchema,
  type ToolRisco,
  type ToolSpec,
} from "./agent-runtime.ts";

export type ToolDefinition = {
  nome: string;
  descricao: string;
  risco: ToolRisco;
  params: ParamsSchema;
};

export const TOOL_RESUMO_COMERCIAL = "consultar_resumo_comercial";
export const TOOL_PIPELINE = "consultar_pipeline";
export const TOOL_OPORTUNIDADES = "consultar_oportunidades";
export const TOOL_LEAD = "consultar_lead";
export const TOOL_EXECUCOES = "consultar_execucoes_equipe";
export const TOOL_DELEGAR = "delegar_tarefa";
export const TOOL_PROPOR_EQUIPE = "propor_estrutura_equipe";

export const PAPEIS_SUBORDINADOS = [
  "gerente_comercial",
  "prospeccao",
  "sdr",
  "vendedor",
  "estrategista",
  "seo_geral",
] as const;
export const TIPOS_DELEGAVEIS = [
  "analise_comercial",
  "priorizar_oportunidades",
  "supervisao_comercial",
  "plano_prospeccao",
  "preparar_abordagem",
  "preparar_proposta",
  "plano_estrategia",
  "plano_seo",
] as const;

export const TOOL_REGISTRY: readonly ToolDefinition[] = [
  {
    nome: TOOL_RESUMO_COMERCIAL,
    descricao:
      "Resumo comercial REAL da organização: total de leads, leads por status, qualificados, etapas do pipeline e oportunidades disponíveis. Sem parâmetros. Somente leitura.",
    risco: "read",
    params: {},
  },
  {
    nome: TOOL_PIPELINE,
    descricao:
      "Etapas do pipeline com total, score médio e leads parados há 14 dias ou mais. Sem parâmetros. Somente leitura.",
    risco: "read",
    params: {},
  },
  {
    nome: TOOL_OPORTUNIDADES,
    descricao:
      "Melhores oportunidades da organização (score >= 70, novas ou enriquecidas, com contato), sem telefone nem e-mail. Somente leitura.",
    risco: "read",
    params: { limite: { type: "number", min: 1, max: 20 } },
  },
  {
    nome: TOOL_LEAD,
    descricao:
      "Ficha de UM lead da organização (negócio, categoria, cidade, nota, presença digital, score, consentimento), sem telefone nem e-mail. Somente leitura.",
    risco: "read",
    params: { lead_id: { type: "string", required: true, maxLength: 40 } },
  },
  {
    nome: TOOL_EXECUCOES,
    descricao:
      "Execuções, falhas, custos e fila de cada agente nos últimos 7 dias. Sem parâmetros. Somente leitura.",
    risco: "read",
    params: {},
  },
  {
    nome: TOOL_DELEGAR,
    descricao:
      "Cria uma tarefa INTERNA para um subordinado direto ativo. Não envia nada externo. A execução ocorre depois, quando um administrador dispara o processamento.",
    risco: "write_internal",
    params: {
      papel: { type: "string", required: true, enum: PAPEIS_SUBORDINADOS },
      tipo: { type: "string", required: true, enum: TIPOS_DELEGAVEIS },
      instrucoes: { type: "string", required: true, maxLength: 1500 },
      lead_id: { type: "string", maxLength: 40 },
    },
  },
  {
    nome: TOOL_PROPOR_EQUIPE,
    descricao:
      "Cria uma PROPOSTA de equipe (papéis separados por vírgula) para aprovação humana. Não cria agentes nem concede permissões.",
    risco: "write_internal",
    params: { papeis: { type: "string", required: true, maxLength: 200 } },
  },
];

/** Ferramentas que ESTE agente pode enxergar: no catálogo, no papel, na autonomia e concedidas por humano. */
export function ferramentasDoAgente(
  agent: AgentIdentity,
  catalog: readonly ToolSpec[],
  permissions: readonly AgentPermission[],
): ToolDefinition[] {
  return TOOL_REGISTRY.filter(
    (t) =>
      authorizeToolCall({ agent, orgId: agent.orgId, toolNome: t.nome, catalog, permissions }).ok,
  );
}

/** Formato `tools` da API Messages da Anthropic. */
export function anthropicToolSchemas(defs: readonly ToolDefinition[] = TOOL_REGISTRY): {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}[] {
  return defs.map((t) => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [nome, spec] of Object.entries(t.params)) {
      properties[nome] = {
        type: spec.type === "number" ? "number" : spec.type,
        ...(spec.enum ? { enum: [...spec.enum] } : {}),
        ...(spec.maxLength !== undefined ? { maxLength: spec.maxLength } : {}),
        ...(spec.min !== undefined ? { minimum: spec.min } : {}),
        ...(spec.max !== undefined ? { maximum: spec.max } : {}),
      };
      if (spec.required) required.push(nome);
    }
    return {
      name: t.nome,
      description: t.descricao,
      input_schema: {
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: false,
      },
    };
  });
}

/** Saída de ferramenta que vai para o modelo e para o histórico: nunca gigante. */
export function limitarSaidaFerramenta(valor: unknown, max = 6000): unknown {
  const texto = JSON.stringify(valor) ?? "null";
  return texto.length <= max ? valor : { truncado: true, previa: texto.slice(0, max) };
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
export const CEO_SYSTEM_PROMPT = `Você é o CEO de IA do Flow Business, orquestrador comercial de uma organização.
Responda em português do Brasil, de forma objetiva.
REGRAS INEGOCIÁVEIS:
- Para falar de leads, funil, pipeline, oportunidades ou da equipe, use SEMPRE as ferramentas de consulta. Use somente números que elas retornarem; se algo não vier, diga que não está disponível. Nunca estime nem invente.
- Você coordena a equipe: pode delegar tarefas INTERNAS aos subordinados diretos (delegar_tarefa) e propor a estrutura da equipe (propor_estrutura_equipe). Quem cria agentes e concede permissões é o administrador humano; você apenas propõe.
- Delegar não executa nada na hora: a tarefa fica na fila e roda quando o administrador dispara o processamento. Diga isso com clareza; nunca afirme que algo já foi feito.
- Você não envia mensagens, não cria nem altera leads, propostas ou contratos, não gasta dinheiro e não altera permissões, limites ou aprovações.
- Se pedirem uma ação externa ou fora do seu alcance, explique que não é permitida e sugira o próximo passo para o administrador aprovar.`;
