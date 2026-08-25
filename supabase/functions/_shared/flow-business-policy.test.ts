// Suite: Regras de execução do Flow Business
// Invariant: nenhum fluxo ou envio executa fora do plano, da palavra-chave ou da janela permitida.
// Boundary IN: funções puras de política do Flow Business.
// Boundary OUT: PostgreSQL e Meta Graph API, verificados por smoke checks de produção.

import assert from "node:assert/strict";
import test from "node:test";
import {
  commentMatchesKeyword,
  messagingWindowIsOpen,
  planAllowsFlowExecution,
} from "./flow-business-policy.ts";

test("permite execução somente quando o plano possui pelo menos um fluxo", () => {
  assert.equal(planAllowsFlowExecution({ limits: { flows: 10 } }), true);
});

test("bloqueia execução no plano Básico e em snapshots malformados", () => {
  assert.equal(planAllowsFlowExecution({ limits: { flows: 0 } }), false);
  assert.equal(planAllowsFlowExecution({ limits: {} }), false);
});

test("reconhece palavra-chave sem depender de caixa ou acentuação", () => {
  assert.equal(commentMatchesKeyword("Eu QUÉRO receber detalhes", "quero"), true);
});

test("não ativa fluxo de comentário quando a palavra-chave está vazia ou ausente", () => {
  assert.equal(commentMatchesKeyword("Quero saber mais", ""), false);
  assert.equal(commentMatchesKeyword("Pode me explicar?", "quero"), false);
});

test("considera aberta apenas uma janela com expiração futura válida", () => {
  const now = Date.parse("2026-08-25T12:00:00.000Z");
  assert.equal(messagingWindowIsOpen("2026-08-25T12:00:01.000Z", now), true);
});

test("bloqueia janela expirada, ausente ou malformada", () => {
  const now = Date.parse("2026-08-25T12:00:00.000Z");
  assert.equal(messagingWindowIsOpen("2026-08-25T12:00:00.000Z", now), false);
  assert.equal(messagingWindowIsOpen(null, now), false);
  assert.equal(messagingWindowIsOpen("data-inválida", now), false);
});
