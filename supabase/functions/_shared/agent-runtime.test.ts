// Suite: núcleo do runtime de agentes (decisões puras).
// Invariante: o agente só age com permissão humana, dentro de custo/passos, sem duplicar nem repetir às cegas.
// Boundary IN: estados, autorização de ferramenta, parâmetros, custo, idempotência, retentativa, log.
// Boundary OUT: Postgres/RLS (agent-foundation-contract.test.ts) e o ciclo completo (agent-ceo-turn.test.ts).
import test from "node:test";
import assert from "node:assert/strict";
import {
  authorizeToolCall,
  budgetDecision,
  buildIdempotencyKey,
  canManageAgents,
  canRunAgent,
  canTransitionTask,
  classifyFailure,
  costUsd,
  retryDecision,
  sanitizeForLog,
  StepRecorder,
  stepLimitDecision,
  validateParams,
  isTerminalTask,
  type AgentIdentity,
  type AgentPermission,
  type ToolSpec,
} from "./agent-runtime.ts";

const ORG_A = "00000000-0000-4000-8000-00000000000a";
const ORG_B = "00000000-0000-4000-8000-00000000000b";
const ceo = (over: Partial<AgentIdentity> = {}): AgentIdentity => ({
  id: "agent-a",
  orgId: ORG_A,
  papel: "ceo",
  modelo: "claude-haiku-4-5",
  autonomia: "somente_leitura",
  estado: "ativo",
  killSwitch: false,
  tetoUsdDia: 0.5,
  tetoUsdMes: 5,
  maxPassos: 4,
  maxTokensSaida: 800,
  ...over,
});
const catalogo: ToolSpec[] = [
  { nome: "consultar_resumo_comercial", risco: "read", ativo: true },
  { nome: "enviar_whatsapp", risco: "external_send", ativo: true },
];
const perm = (over: Partial<AgentPermission> = {}): AgentPermission => ({
  agentId: "agent-a",
  orgId: ORG_A,
  toolNome: "consultar_resumo_comercial",
  ativo: true,
  ...over,
});

test("agente só roda ativo, sem kill-switch e na própria organização", () => {
  assert.deepEqual(canRunAgent(ceo(), ORG_A), { ok: true });
  assert.deepEqual(canRunAgent(ceo({ estado: "inativo" }), ORG_A), {
    ok: false,
    reason: "agente_inativo",
  });
  assert.deepEqual(canRunAgent(ceo({ estado: "pausado" }), ORG_A), {
    ok: false,
    reason: "agente_pausado",
  });
  assert.deepEqual(canRunAgent(ceo(), ORG_B), { ok: false, reason: "organizacao_divergente" });
});

test("kill-switch vence qualquer outro estado, mesmo agente ativo", () => {
  assert.deepEqual(canRunAgent(ceo({ killSwitch: true }), ORG_A), {
    ok: false,
    reason: "kill_switch",
  });
  assert.deepEqual(canRunAgent(ceo({ killSwitch: true, estado: "inativo" }), ORG_A), {
    ok: false,
    reason: "kill_switch",
  });
});

test("ferramenta exige concessão ativa para este agente e esta organização", () => {
  const base = {
    agent: ceo(),
    orgId: ORG_A,
    toolNome: "consultar_resumo_comercial",
    catalog: catalogo,
  };
  assert.deepEqual(authorizeToolCall({ ...base, permissions: [perm()] }), { ok: true });
  assert.equal(
    (authorizeToolCall({ ...base, permissions: [] }) as { reason: string }).reason,
    "permissao_ausente",
  );
  assert.equal(
    (authorizeToolCall({ ...base, permissions: [perm({ ativo: false })] }) as { reason: string })
      .reason,
    "permissao_ausente",
  );
  // concessão de OUTRO agente ou de OUTRA organização não vale
  assert.equal(
    (
      authorizeToolCall({ ...base, permissions: [perm({ agentId: "agent-x" })] }) as {
        reason: string;
      }
    ).reason,
    "permissao_ausente",
  );
  assert.equal(
    (authorizeToolCall({ ...base, permissions: [perm({ orgId: ORG_B })] }) as { reason: string })
      .reason,
    "permissao_ausente",
  );
});

test("autonomia somente-leitura bloqueia ferramenta de envio mesmo com concessão no banco", () => {
  const r = authorizeToolCall({
    agent: ceo(),
    orgId: ORG_A,
    toolNome: "enviar_whatsapp",
    catalog: catalogo,
    permissions: [perm({ toolNome: "enviar_whatsapp" })],
  });
  assert.deepEqual(r, {
    ok: false,
    reason: "ferramenta_acima_da_autonomia",
    detail: "external_send",
  });
});

test("ferramenta fora do catálogo ou inativa é desconhecida (sem acesso arbitrário)", () => {
  const base = { agent: ceo(), orgId: ORG_A, permissions: [perm({ toolNome: "run_sql" })] };
  assert.equal(
    (authorizeToolCall({ ...base, toolNome: "run_sql", catalog: catalogo }) as { reason: string })
      .reason,
    "ferramenta_desconhecida",
  );
  assert.equal(
    (
      authorizeToolCall({
        ...base,
        toolNome: "consultar_resumo_comercial",
        catalog: [{ ...catalogo[0], ativo: false }],
      }) as { reason: string }
    ).reason,
    "ferramenta_desconhecida",
  );
});

test("só administrador, gerente ou super admin gerenciam agentes (o agente não é humano)", () => {
  assert.equal(canManageAgents("admin"), true);
  assert.equal(canManageAgents("gerente"), true);
  assert.equal(canManageAgents("vendedor"), false);
  assert.equal(canManageAgents("sdr"), false);
  assert.equal(canManageAgents(null), false);
  assert.equal(canManageAgents("vendedor", true), true);
});

test("parâmetros: rejeita chaves desconhecidas, tipos errados e excesso", () => {
  const schema = { termo: { type: "string" as const, required: true, maxLength: 5 } };
  assert.deepEqual(validateParams(schema, { termo: "ok" }), { ok: true, value: { termo: "ok" } });
  assert.equal(validateParams(schema, { termo: "ok", org_id: "x" }).ok, false);
  assert.equal(validateParams(schema, {}).ok, false);
  assert.equal(validateParams(schema, { termo: 1 }).ok, false);
  assert.equal(validateParams(schema, { termo: "longo demais" }).ok, false);
  assert.equal(validateParams(schema, "texto").ok, false);
  assert.equal(validateParams({}, { sql: "select 1" }).ok, false);
  assert.deepEqual(validateParams({}, {}), { ok: true, value: {} });
});

test("custo: modelo precificado calcula; modelo desconhecido é recusado", () => {
  assert.equal(costUsd("claude-haiku-4-5", 1_000_000, 1_000_000), 6);
  assert.equal(costUsd("modelo-inexistente", 10, 10), null);
});

test("orçamento bloqueia ao estourar o teto do dia ou do mês, incluindo a próxima chamada", () => {
  const base = {
    gastoDiaUsd: 0.1,
    gastoMesUsd: 1,
    tetoDiaUsd: 0.5,
    tetoMesUsd: 5,
    proximaChamadaUsd: 0.05,
  };
  assert.deepEqual(budgetDecision(base), { ok: true });
  assert.deepEqual(budgetDecision({ ...base, gastoDiaUsd: 0.46 }), {
    ok: false,
    reason: "teto_dia",
  });
  assert.deepEqual(budgetDecision({ ...base, gastoMesUsd: 4.98 }), {
    ok: false,
    reason: "teto_mes",
  });
  assert.deepEqual(budgetDecision({ ...base, tetoDiaUsd: 0 }), { ok: false, reason: "teto_dia" });
});

test("limite de passos", () => {
  assert.deepEqual(stepLimitDecision(4, 4), { ok: true });
  assert.deepEqual(stepLimitDecision(5, 4), { ok: false, reason: "limite_de_passos" });
});

test("idempotência: mesma entrada gera a mesma chave; qualquer parte diferente muda", async () => {
  const p = { orgId: ORG_A, agentId: "a", userId: "u", clientMessageId: "m1" };
  const k1 = await buildIdempotencyKey(p);
  assert.equal(k1, await buildIdempotencyKey({ ...p }));
  assert.match(k1, /^[0-9a-f]{64}$/);
  assert.notEqual(k1, await buildIdempotencyKey({ ...p, orgId: ORG_B }));
  assert.notEqual(k1, await buildIdempotencyKey({ ...p, clientMessageId: "m2" }));
});

test("estados: transições válidas e terminais imutáveis", () => {
  assert.equal(canTransitionTask("queued", "processing"), true);
  assert.equal(canTransitionTask("processing", "queued"), true);
  assert.equal(canTransitionTask("queued", "succeeded"), false);
  for (const t of ["succeeded", "failed", "cancelled"] as const) {
    assert.equal(isTerminalTask(t), true);
    assert.equal(canTransitionTask(t, "queued"), false);
  }
  assert.equal(canTransitionTask("awaiting_approval", "processing"), false);
});

test("retentativa: só falha transitória, com backoff e teto de tentativas", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  const r1 = retryDecision({ failure: "transient", attemptCount: 1, maxAttempts: 2, now });
  assert.equal(r1.retry, true);
  assert.equal((r1 as { nextAttemptAt: Date }).nextAttemptAt.getTime(), now.getTime() + 15_000);
  assert.deepEqual(retryDecision({ failure: "transient", attemptCount: 2, maxAttempts: 2, now }), {
    retry: false,
  });
  assert.deepEqual(retryDecision({ failure: "permanent", attemptCount: 1, maxAttempts: 5, now }), {
    retry: false,
  });
  assert.deepEqual(retryDecision({ failure: "uncertain", attemptCount: 1, maxAttempts: 5, now }), {
    retry: false,
  });
});

test("classificação de falhas do provedor", () => {
  assert.equal(classifyFailure({ status: 429 }), "transient");
  assert.equal(classifyFailure({ status: 503 }), "transient");
  assert.equal(classifyFailure({}), "transient");
  assert.equal(classifyFailure({ status: 400 }), "permanent");
  assert.equal(classifyFailure({ status: 401 }), "permanent");
  assert.equal(classifyFailure({ aborted: true }), "uncertain");
  assert.equal(classifyFailure({ blocked: true, status: 500 }), "permanent");
});

test("log: oculta campos sensíveis e limita o tamanho", () => {
  const limpo = sanitizeForLog({
    api_key: "sk-123",
    nested: { Authorization: "Bearer x", ok: 1 },
  }) as { api_key: string; nested: { Authorization: string; ok: number } };
  assert.equal(limpo.api_key, "[oculto]");
  assert.equal(limpo.nested.Authorization, "[oculto]");
  assert.equal(limpo.nested.ok, 1);
  const grande = sanitizeForLog({ texto: "x".repeat(20_000) }) as Record<string, unknown>;
  assert.equal(grande.truncado, true);
});

test("gravador de passos numera em sequência sem pular", () => {
  const rec = new StepRecorder();
  const base = {
    tipo: "model" as const,
    toolNome: null,
    tokensEntrada: 0,
    tokensSaida: 0,
    custoUsd: 0,
    duracaoMs: null,
    erro: null,
  };
  assert.equal(rec.next(base).seq, 1);
  assert.equal(rec.next(base).seq, 2);
  assert.equal(rec.count, 2);
});
