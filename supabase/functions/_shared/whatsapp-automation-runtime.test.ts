// Suite: executor de automações WhatsApp (partes puras).
// Invariante: o executor só gera comandos sobre o CRM (etiqueta, nota, status, responsável,
// follow-up); nenhuma ação vira envio de mensagem; o payload real alimenta as mesmas condições
// da simulação.
import test from "node:test";
import assert from "node:assert/strict";
import {
  comandosDaAcao,
  montarPayloadAutomacao,
  renderizarScript,
} from "./whatsapp-automation-runtime.ts";
import { planAutomation, type WaAutomationDefinition } from "./whatsapp-automation.ts";

const conversa = {
  origin: "whatsapp",
  instancia_id: "chip-1",
  status: "unassigned",
  assigned_to: null,
  contact_name: "Marcos Silva",
  normalized_phone: "5541999990000",
  tag_ids: ["tag-vip"],
};
const lead = {
  id: "lead-1",
  status: "new",
  business_name: "Padaria Central",
  whatsapp_opt_in: true,
  whatsapp_opt_in_at: "2026-10-01T00:00:00.000Z",
  whatsapp_opt_out: false,
};

test("real payload exposes the same fields the conditions evaluate", () => {
  const payload = montarPayloadAutomacao({
    conversa,
    lead,
    ocorridoEm: "2026-10-21T12:00:00.000Z",
    agora: new Date("2026-10-21T12:30:00.000Z"),
    timezone: "America/Sao_Paulo",
  });
  assert.deepEqual(payload.conversation, {
    origin: "whatsapp",
    instance_id: "chip-1",
    tag_ids: ["tag-vip"],
    status: "unassigned",
    assigned_to: null,
  });
  assert.deepEqual(payload.lead, { id: "lead-1", stage: "new" });
  assert.deepEqual(payload.event, { elapsed_minutes: 30, local_hour: 9 });
  assert.deepEqual(payload.contact, { consent: true, eligible: true });
  assert.equal((payload.variables as Record<string, unknown>).nome, "Marcos");
});

test("an opted-out lead is never consented nor eligible", () => {
  const payload = montarPayloadAutomacao({
    conversa,
    lead: { ...lead, whatsapp_opt_out: true },
    ocorridoEm: "2026-10-21T12:00:00.000Z",
  });
  assert.deepEqual(payload.contact, { consent: false, eligible: false });
});

test("CRM actions become conversation commands; preparation actions become internal notes", () => {
  const vars = { nome: "Marcos" };
  assert.deepEqual(comandosDaAcao({ type: "apply_tag", config: { name: "Quente" } }, vars), [
    { tipo: "conversa", acao: "add_tag", valor: { name: "Quente" } },
  ]);
  assert.deepEqual(
    comandosDaAcao({ type: "set_conversation_status", config: { status: "in_progress" } }, vars),
    [{ tipo: "conversa", acao: "set_status", valor: { status: "in_progress" } }],
  );
  assert.deepEqual(comandosDaAcao({ type: "assign_agent", config: { user_id: "u-1" } }, vars), [
    { tipo: "conversa", acao: "transfer", valor: { user_id: "u-1" } },
  ]);
  assert.deepEqual(
    comandosDaAcao({ type: "prepare_reply", config: { script_snapshot: "Olá {nome}!" } }, vars),
    [
      {
        tipo: "conversa",
        acao: "add_note",
        valor: { body: "[Automação] Resposta sugerida (enviar manualmente): Olá Marcos!" },
      },
    ],
  );
  assert.deepEqual(
    comandosDaAcao({ type: "prepare_follow_up", config: { delay_minutes: 90 } }, vars),
    [{ tipo: "follow_up", atrasoMinutos: 90 }],
  );
});

test("no action is ever translated into a WhatsApp send", () => {
  for (const type of ["queue_authorized_message"] as const) {
    assert.deepEqual(comandosDaAcao({ type, config: { message: "oi" } }, {}), [
      { tipo: "bloqueado", motivo: "automatic_whatsapp_transport_disabled" },
    ]);
  }
  const todos = [
    "apply_tag",
    "remove_tag",
    "create_note",
    "assign_agent",
    "prepare_task",
    "set_conversation_status",
    "record_activity",
    "prepare_script",
    "request_human",
    "prepare_reply",
    "prepare_follow_up",
    "queue_authorized_message",
  ] as const;
  for (const type of todos) {
    for (const comando of comandosDaAcao(
      {
        type,
        config: {
          name: "x",
          tag_id: "t",
          user_id: "u",
          status: "in_progress",
          body: "b",
          delay_minutes: 10,
        },
      },
      {},
    )) {
      if (comando.tipo === "conversa") {
        assert.ok(
          ["add_tag", "remove_tag", "add_note", "transfer", "set_status"].includes(comando.acao),
        );
      }
    }
  }
});

test("incomplete actions are blocked instead of guessing", () => {
  assert.equal(comandosDaAcao({ type: "apply_tag", config: {} }, {})[0].tipo, "bloqueado");
  assert.equal(comandosDaAcao({ type: "assign_agent", config: {} }, {})[0].tipo, "bloqueado");
  assert.equal(
    comandosDaAcao({ type: "prepare_follow_up", config: { delay_minutes: -5 } }, {})[0].tipo,
    "bloqueado",
  );
});

test("missing script variables are left visible rather than silently blanked", () => {
  assert.equal(renderizarScript("Oi {nome}, {cidade}", { nome: "Ana" }), "Oi Ana, {cidade}");
});

test("execution stays blocked while the platform switch is off, even for a fully matching rule", () => {
  const definition: WaAutomationDefinition = {
    id: "a-1",
    name: "Boas-vindas",
    description: "",
    type: "boas_vindas",
    status: "ativa",
    version: 1,
    trigger: { type: "conversation_created", config: {} },
    conditions: [{ field: "contact.consent", operator: "eq", value: true }],
    actions: [{ type: "apply_tag", config: { name: "Novo" } }],
    config: {},
  };
  const payload = montarPayloadAutomacao({ conversa, lead, ocorridoEm: new Date().toISOString() });
  const plan = planAutomation({
    definition,
    event: {
      id: "e-1",
      orgId: "org-1",
      source: "conversation",
      resource: "conversation",
      type: "conversation_created",
      occurredAt: new Date().toISOString(),
      depth: 0,
      payload,
    },
    controls: {
      ruleEnabled: true,
      organizationEnabled: true,
      platformEnabled: false,
      dispatchEnabled: false,
    },
  });
  assert.deepEqual(plan.blockers, ["platform_engine_disabled"]);
  assert.ok(plan.plannedActions.every((action) => action.blocked));
});
