// Núcleo do runtime de agentes — partes PURAS (sem I/O), no padrão de whatsapp-delivery-engine.ts.
// A Edge `agent-ceo` e os testes importam daqui; nada neste arquivo fala com rede ou banco.
// Invariante: o agente só executa o que um HUMANO concedeu, dentro de limites de custo/passos,
// e toda decisão (permitir, bloquear, repetir) sai daqui de forma determinística e testável.

// ───────────────────────────── identidade e estados ─────────────────────────────
export type AgentEstado = "inativo" | "ativo" | "pausado";
export type AgentAutonomia = "somente_leitura" | "interna_supervisionada";

export const PAPEIS_AGENTE = [
  "ceo",
  "gerente_comercial",
  "prospeccao",
  "sdr",
  "vendedor",
  "estrategista",
  "seo_geral",
] as const;
export type AgentPapel = (typeof PAPEIS_AGENTE)[number];

/** Ferramentas permitidas por papel. Espelha agent_ferramentas_do_papel (migration 003); um teste garante a paridade. */
export const FERRAMENTAS_DO_PAPEL: Record<AgentPapel, readonly string[]> = {
  ceo: [
    "consultar_resumo_comercial",
    "consultar_pipeline",
    "consultar_oportunidades",
    "consultar_execucoes_equipe",
    "consultar_memoria",
    "consultar_operacoes",
    "delegar_tarefa",
    "propor_estrutura_equipe",
    "registrar_memoria",
    "propor_operacao",
  ],
  gerente_comercial: [
    "consultar_resumo_comercial",
    "consultar_pipeline",
    "consultar_oportunidades",
    "consultar_lead",
    "consultar_execucoes_equipe",
    "consultar_memoria",
    "consultar_operacoes",
    "delegar_tarefa",
  ],
  prospeccao: ["consultar_resumo_comercial", "consultar_oportunidades"],
  sdr: ["consultar_oportunidades", "consultar_lead"],
  vendedor: ["consultar_oportunidades", "consultar_lead", "consultar_pipeline"],
  estrategista: ["consultar_resumo_comercial", "consultar_pipeline"],
  seo_geral: ["consultar_resumo_comercial"],
};

/** Tipos de tarefa por papel. Espelha agent_tipos_do_papel (migration 003). */
export const TIPOS_DO_PAPEL: Record<AgentPapel, readonly string[]> = {
  ceo: ["copiloto_conversa", "analise_comercial"],
  gerente_comercial: ["analise_comercial", "priorizar_oportunidades", "supervisao_comercial"],
  prospeccao: ["plano_prospeccao"],
  sdr: ["preparar_abordagem"],
  vendedor: ["preparar_proposta"],
  estrategista: ["plano_estrategia"],
  seo_geral: ["plano_seo"],
};

/** Quem reporta a quem (CEO é a raiz). */
export const SUPERIOR_DO_PAPEL: Record<AgentPapel, AgentPapel | null> = {
  ceo: null,
  gerente_comercial: "ceo",
  prospeccao: "gerente_comercial",
  sdr: "gerente_comercial",
  vendedor: "gerente_comercial",
  estrategista: "gerente_comercial",
  seo_geral: "gerente_comercial",
};
export type ToolRisco = "read" | "write_internal" | "external_send" | "spend";

export type AgentIdentity = {
  id: string;
  orgId: string;
  papel: AgentPapel;
  reportsTo?: string | null;
  modelo: string;
  autonomia: AgentAutonomia;
  estado: AgentEstado;
  killSwitch: boolean;
  tetoUsdDia: number;
  tetoUsdMes: number;
  maxPassos: number;
  maxTokensSaida: number;
};

export type AgentPermission = { agentId: string; orgId: string; toolNome: string; ativo: boolean };

export type TaskStatus =
  "queued" | "processing" | "awaiting_approval" | "succeeded" | "failed" | "cancelled" | "blocked";

// Espelha o trigger agent_tasks_transicao (migration 202610270001).
export const TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  queued: ["processing", "cancelled", "blocked"],
  processing: ["queued", "succeeded", "failed", "cancelled", "awaiting_approval"],
  awaiting_approval: ["queued", "cancelled", "failed"],
  blocked: ["queued", "cancelled"],
  succeeded: [],
  failed: [],
  cancelled: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || TASK_TRANSITIONS[from].includes(to);
}

export function isTerminalTask(status: TaskStatus): boolean {
  return TASK_TRANSITIONS[status].length === 0;
}

// ───────────────────────────── quem pode gerir / executar ─────────────────────────────
export function canManageAgents(role: string | null | undefined, isSuperAdmin = false): boolean {
  return isSuperAdmin || role === "super_admin" || role === "admin" || role === "gerente";
}

export type BlockReason =
  | "agente_inativo"
  | "agente_pausado"
  | "kill_switch"
  | "organizacao_divergente"
  | "ferramenta_desconhecida"
  | "ferramenta_acima_da_autonomia"
  | "ferramenta_fora_do_papel"
  | "permissao_ausente"
  | "limite_de_passos"
  | "teto_dia"
  | "teto_mes"
  | "teto_org_dia"
  | "teto_org_mes"
  | "modelo_nao_precificado"
  | "parametros_invalidos";

export type Decision = { ok: true } | { ok: false; reason: BlockReason; detail?: string };

/** O agente pode executar algo agora? Kill-switch vence qualquer outro estado. */
export function canRunAgent(agent: AgentIdentity, orgId: string): Decision {
  if (agent.killSwitch) return { ok: false, reason: "kill_switch" };
  if (agent.orgId !== orgId) return { ok: false, reason: "organizacao_divergente" };
  if (agent.estado === "pausado") return { ok: false, reason: "agente_pausado" };
  if (agent.estado !== "ativo") return { ok: false, reason: "agente_inativo" };
  return { ok: true };
}

export type ToolSpec = { nome: string; risco: ToolRisco; ativo: boolean };

const RISCOS_POR_AUTONOMIA: Record<AgentAutonomia, readonly ToolRisco[]> = {
  somente_leitura: ["read"],
  interna_supervisionada: ["read", "write_internal"],
};

/** Ferramenta existe, cabe na autonomia do agente e foi CONCEDIDA por humano a este agente/org. */
export function authorizeToolCall(input: {
  agent: AgentIdentity;
  orgId: string;
  toolNome: string;
  catalog: readonly ToolSpec[];
  permissions: readonly AgentPermission[];
}): Decision {
  const tool = input.catalog.find((t) => t.nome === input.toolNome && t.ativo);
  if (!tool) return { ok: false, reason: "ferramenta_desconhecida", detail: input.toolNome };
  if (!RISCOS_POR_AUTONOMIA[input.agent.autonomia].includes(tool.risco)) {
    return { ok: false, reason: "ferramenta_acima_da_autonomia", detail: tool.risco };
  }
  if (!FERRAMENTAS_DO_PAPEL[input.agent.papel].includes(tool.nome)) {
    return { ok: false, reason: "ferramenta_fora_do_papel", detail: tool.nome };
  }
  const granted = input.permissions.some(
    (p) =>
      p.ativo &&
      p.toolNome === tool.nome &&
      p.agentId === input.agent.id &&
      p.orgId === input.orgId &&
      p.orgId === input.agent.orgId,
  );
  return granted ? { ok: true } : { ok: false, reason: "permissao_ausente", detail: tool.nome };
}

// ───────────────────────────── validação de parâmetros ─────────────────────────────
export type ParamSpec = {
  type: "string" | "number" | "boolean";
  required?: boolean;
  enum?: readonly (string | number)[];
  maxLength?: number;
  min?: number;
  max?: number;
};
export type ParamsSchema = Record<string, ParamSpec>;

/** Rejeita chaves desconhecidas (o modelo não injeta `org_id`, `sql`, `table`...). */
export function validateParams(
  schema: ParamsSchema,
  input: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; errors: string[] } {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["parametros devem ser um objeto"] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of Object.keys(raw)) {
    if (!(key in schema)) errors.push(`parametro nao permitido: ${key}`);
  }
  for (const [key, spec] of Object.entries(schema)) {
    const v = raw[key];
    if (v === undefined || v === null) {
      if (spec.required) errors.push(`parametro obrigatorio: ${key}`);
      continue;
    }
    if (typeof v !== spec.type || (spec.type === "number" && !Number.isFinite(v))) {
      errors.push(`tipo invalido em ${key}`);
      continue;
    }
    if (spec.enum && !spec.enum.includes(v as string | number))
      errors.push(`valor fora do enum em ${key}`);
    if (typeof v === "string" && spec.maxLength !== undefined && v.length > spec.maxLength) {
      errors.push(`${key} excede ${spec.maxLength} caracteres`);
    }
    if (typeof v === "number") {
      if (spec.min !== undefined && v < spec.min) errors.push(`${key} abaixo do minimo`);
      if (spec.max !== undefined && v > spec.max) errors.push(`${key} acima do maximo`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: raw };
}

// ───────────────────────────── custo de IA ─────────────────────────────
// USD por 1M de tokens (entrada/saída). Mesma tabela de _shared/ai/claude.ts. Modelo fora da
// tabela é RECUSADO: sem preço conhecido não há como respeitar o teto.
export const MODEL_PRICES: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5": { in: 1, out: 5 },
  "claude-sonnet-4-5": { in: 3, out: 15 },
  "claude-sonnet-5": { in: 3, out: 15 },
  "claude-opus-4-7": { in: 5, out: 25 },
  "claude-opus-4-8": { in: 5, out: 25 },
};
export const DEFAULT_CEO_MODEL = "claude-haiku-4-5";

export type TabelaPrecos = Record<string, { in: number; out: number }>;

/**
 * `tabela` (Central de IA) tem precedência sobre MODEL_PRICES; modelo sem preço em nenhuma das duas
 * continua RECUSADO. O preço dos modelos da OpenAI vem do Super Admin, nunca do código.
 */
export function costUsd(
  model: string,
  tokensIn: number,
  tokensOut: number,
  tabela?: TabelaPrecos,
): number | null {
  const p = tabela?.[model] ?? MODEL_PRICES[model];
  if (!p) return null;
  return (Math.max(0, tokensIn) * p.in + Math.max(0, tokensOut) * p.out) / 1_000_000;
}

/** Pior caso de uma chamada: entrada estimada (4 caracteres ≈ 1 token) + todo o limite de saída. */
export function estimateMaxCallCostUsd(
  model: string,
  promptChars: number,
  maxTokensOut: number,
  tabela?: TabelaPrecos,
): number | null {
  return costUsd(model, Math.ceil(promptChars / 4), maxTokensOut, tabela);
}

/** Teto AGREGADO da organização (todos os agentes e operações), imposto no backend além do teto por agente. */
export function orgBudgetDecision(input: {
  gastoDiaUsd: number;
  gastoMesUsd: number;
  tetoDiaUsd: number;
  tetoMesUsd: number;
  proximaChamadaUsd: number;
}): Decision {
  if (input.gastoDiaUsd + input.proximaChamadaUsd > input.tetoDiaUsd)
    return { ok: false, reason: "teto_org_dia" };
  if (input.gastoMesUsd + input.proximaChamadaUsd > input.tetoMesUsd)
    return { ok: false, reason: "teto_org_mes" };
  return { ok: true };
}

export function budgetDecision(input: {
  gastoDiaUsd: number;
  gastoMesUsd: number;
  tetoDiaUsd: number;
  tetoMesUsd: number;
  proximaChamadaUsd: number;
}): Decision {
  if (input.gastoDiaUsd + input.proximaChamadaUsd > input.tetoDiaUsd)
    return { ok: false, reason: "teto_dia" };
  if (input.gastoMesUsd + input.proximaChamadaUsd > input.tetoMesUsd)
    return { ok: false, reason: "teto_mes" };
  return { ok: true };
}

export function stepLimitDecision(passoAtual: number, maxPassos: number): Decision {
  return passoAtual > maxPassos ? { ok: false, reason: "limite_de_passos" } : { ok: true };
}

// ───────────────────────────── idempotência ─────────────────────────────
/** Chave determinística: o mesmo (org, agente, usuário, mensagem) nunca vira duas tarefas. */
export async function buildIdempotencyKey(parts: {
  orgId: string;
  agentId: string;
  userId: string;
  clientMessageId: string;
}): Promise<string> {
  const base = [parts.orgId, parts.agentId, parts.userId, parts.clientMessageId].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(base));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ───────────────────────────── falhas e retentativas ─────────────────────────────
export type FailureClass = "transient" | "permanent" | "uncertain";

/** Erro de rede/429/5xx do provedor é transitório; 4xx e bloqueios de política são permanentes. */
export function classifyFailure(input: {
  status?: number;
  blocked?: boolean;
  aborted?: boolean;
}): FailureClass {
  if (input.blocked) return "permanent";
  if (input.aborted) return "uncertain";
  const s = input.status;
  if (s === undefined) return "transient";
  if (s === 429 || s >= 500) return "transient";
  return "permanent";
}

export function retryDecision(input: {
  failure: FailureClass;
  attemptCount: number;
  maxAttempts: number;
  now?: Date;
}): { retry: false } | { retry: true; nextAttemptAt: Date } {
  // "uncertain" nunca repete sozinho: reexecutar poderia duplicar custo/efeito sem revisão.
  if (input.failure !== "transient" || input.attemptCount >= input.maxAttempts)
    return { retry: false };
  const base = (input.now ?? new Date()).getTime();
  const backoffSeconds = Math.min(300, 15 * 2 ** (input.attemptCount - 1));
  return { retry: true, nextAttemptAt: new Date(base + backoffSeconds * 1000) };
}

// ───────────────────────────── passos (rastreabilidade) ─────────────────────────────
export type StepType = "model" | "tool_call" | "tool_result" | "final" | "error" | "blocked";
export type StepRecord = {
  seq: number;
  tipo: StepType;
  toolNome: string | null;
  entrada: unknown;
  saida: unknown;
  tokensEntrada: number;
  tokensSaida: number;
  custoUsd: number;
  duracaoMs: number | null;
  erro: string | null;
};

const MAX_STEP_JSON_CHARS = 8_000;

/** Limita o que vai para o histórico (nunca grava resposta gigante) e remove campos sensíveis. */
export function sanitizeForLog(value: unknown): unknown {
  const SENSITIVE = /^(authorization|api[_-]?key|token|secret|password|senha)$/i;
  const walk = (v: unknown, depth: number): unknown => {
    if (depth > 6) return "[profundo]";
    if (Array.isArray(v)) return v.slice(0, 50).map((x) => walk(x, depth + 1));
    if (v && typeof v === "object") {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>).map(([k, x]) => [
          k,
          SENSITIVE.test(k) ? "[oculto]" : walk(x, depth + 1),
        ]),
      );
    }
    return v;
  };
  const cleaned = walk(value, 0);
  const text = JSON.stringify(cleaned) ?? "null";
  return text.length <= MAX_STEP_JSON_CHARS
    ? cleaned
    : { truncado: true, previa: text.slice(0, MAX_STEP_JSON_CHARS) };
}

export class StepRecorder {
  private seq = 0;
  readonly steps: StepRecord[] = [];
  next(
    partial: Omit<StepRecord, "seq" | "entrada" | "saida"> & { entrada?: unknown; saida?: unknown },
  ): StepRecord {
    this.seq += 1;
    const step: StepRecord = {
      ...partial,
      seq: this.seq,
      entrada: sanitizeForLog(partial.entrada ?? null),
      saida: sanitizeForLog(partial.saida ?? null),
    };
    this.steps.push(step);
    return step;
  }
  get count(): number {
    return this.seq;
  }
}
