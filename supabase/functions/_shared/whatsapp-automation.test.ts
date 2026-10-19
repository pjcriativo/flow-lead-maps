// Suite: motor de automações WhatsApp
// Invariant: somente regras fechadas geram planos e nenhum plano libera transporte automático.
// Boundary IN: validação, condições, controles, scripts, causalidade e chave idempotente.
// Boundary OUT: persistência/RLS e transporte, cobertos pelos contratos SQL/Edge em scripts/whatsapp-automacao.test.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import {
  automationRunKey,
  extractScriptVariables,
  planAutomation,
  validateAutomationDefinition,
  type WaAutomationDefinition,
  type WaAutomationEvent,
} from "./whatsapp-automation.ts";

const definition = (overrides: Partial<WaAutomationDefinition> = {}): WaAutomationDefinition => ({
  name: "Boas-vindas inbound",
  description: "Prepara atendimento para a primeira conversa recebida.",
  type: "boas_vindas",
  status: "ativa",
  version: 2,
  trigger: { type: "conversation_created", config: {} },
  conditions: [{ field: "contact.consent", operator: "eq", value: true }],
  actions: [{ type: "prepare_reply", config: { script_snapshot: "Olá, {nome}." } }],
  config: {},
  ...overrides,
});

const event = (overrides: Partial<WaAutomationEvent> = {}): WaAutomationEvent => ({
  id: "provider:event-1",
  orgId: "org-a",
  source: "simulation",
  resource: "conversation",
  type: "conversation_created",
  occurredAt: "2026-10-19T12:00:00.000Z",
  depth: 0,
  payload: { contact: { consent: true }, variables: { nome: "Ana" } },
  ...overrides,
});

const controls = {
  ruleEnabled: true,
  organizationEnabled: true,
  platformEnabled: false,
  dispatchEnabled: false,
};

test("rejeita operador incompatível e ação fora do catálogo", () => {
  const invalid = definition({
    conditions: [{ field: "contact.consent", operator: "contains", value: true }],
    actions: [{ type: "webhook" as never, config: { url: "https://example.invalid" } }],
  });
  assert.deepEqual(validateAutomationDefinition(invalid), [
    "conditions[0] has an operator incompatible with its field",
    "actions[0] has an unsupported type",
  ]);
});

test("planeja resposta mas bloqueia transporte quando a plataforma está desligada", () => {
  const plan = planAutomation({ definition: definition(), event: event(), controls });
  assert.equal(plan.eligible, false);
  assert.ok(plan.blockers.includes("platform_engine_disabled"));
  assert.deepEqual(plan.plannedActions[0], {
    type: "prepare_reply",
    config: { script_snapshot: "Olá, {nome}." },
    blocked: true,
    reason: "automatic_whatsapp_transport_disabled",
  });
});

test("recusa condição não atendida e não inventa variável ausente", () => {
  const plan = planAutomation({
    definition: definition({
      actions: [
        { type: "prepare_reply", config: { script_snapshot: "Olá, {nome}." } },
        { type: "record_activity", config: {} },
      ],
    }),
    event: event({ payload: { contact: { consent: false }, variables: {} } }),
    controls: { ...controls, platformEnabled: true },
  });
  assert.equal(plan.conditionResults[0].matched, false);
  assert.deepEqual(plan.missingVariables, ["nome"]);
  assert.ok(plan.blockers.includes("conditions_not_matched"));
  assert.ok(plan.blockers.includes("missing_script_variables"));
  assert.deepEqual(plan.plannedActions[1], {
    type: "record_activity",
    config: {},
    blocked: true,
    reason: "automation_execution_blocked",
  });
});

test("bloqueia ciclo no limite de profundidade causal", () => {
  const plan = planAutomation({
    definition: definition({ actions: [{ type: "record_activity", config: {} }] }),
    event: event({ depth: 5 }),
    controls: { ...controls, platformEnabled: true },
  });
  assert.ok(plan.blockers.includes("causality_depth_limit"));
  assert.equal(plan.plannedActions[0].blocked, true);
});

test("bloqueia evento fora de ordem pela versão persistida do recurso", () => {
  const plan = planAutomation({
    definition: definition({ actions: [{ type: "record_activity", config: {} }] }),
    event: event({
      payload: {
        contact: { consent: true },
        variables: { nome: "Ana" },
        event: { resource_version: 2, current_resource_version: 3 },
      },
    }),
    controls: { ...controls, platformEnabled: true, organizationEnabled: true },
  });
  assert.ok(plan.blockers.includes("stale_event"));
  assert.equal(plan.eligible, false);
});

test("gera a mesma chave para o mesmo evento, regra e versão", () => {
  assert.equal(automationRunKey("auto-1", 3, "event-9"), automationRunKey("auto-1", 3, "event-9"));
  assert.notEqual(
    automationRunKey("auto-1", 3, "event-9"),
    automationRunKey("auto-1", 4, "event-9"),
  );
});

test("extrai variáveis únicas de snapshots sem avaliar conteúdo", () => {
  assert.deepEqual(extractScriptVariables("Olá {nome}, proposta {proposta.id}; {nome}"), [
    "nome",
    "proposta.id",
  ]);
  assert.deepEqual(extractScriptVariables("${process.env.SECRET} {{sql}}"), []);
});
