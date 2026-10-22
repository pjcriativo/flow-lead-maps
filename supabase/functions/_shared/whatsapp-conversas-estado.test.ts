// Suite: estado da Central de Conversas — histórico preservado e leitura automática.
// Invariante: recarregar a lista nunca apaga o histórico já carregado da conversa aberta; só a
// conversa aberta e visível é marcada como lida.
// Boundary IN: regras puras. Boundary OUT: React, Realtime e rede.
import test from "node:test";
import assert from "node:assert/strict";
import {
  leituraAutomatica,
  mesclarListaComDetalhe,
} from "../../../src/lib/whatsapp-conversas-estado.ts";

type Contato = {
  id: string;
  numero: string;
  nome: string;
  avatar?: string;
  ultimaMensagem: string;
  horario: string;
  naoLidas: number;
  statusAtendimento: string;
  leadId?: string;
  assignedTo?: string;
  chip?: string;
  mensagens: string[];
  notas: string[];
};

const resumo = (id: string, extras: Partial<Contato> = {}): Contato => ({
  id,
  numero: "5541999990001",
  nome: "Maria",
  ultimaMensagem: "oi",
  horario: "10:00",
  naoLidas: 0,
  statusAtendimento: "nao_atribuida",
  mensagens: [],
  notas: [],
  ...extras,
});

test("reloading the list does not erase the history already loaded for the open conversation", () => {
  // 1) o detalhe chegou primeiro e preencheu mensagens e notas
  const comDetalhe = [
    resumo("c1", { mensagens: ["m1", "m2", "m3"], notas: ["nota"], nome: "Maria (CRM)" }),
  ];
  // 2) a lista, mais lenta, termina depois e traz só o resumo (sem mensagens)
  const recarregada = [resumo("c1", { ultimaMensagem: "nova", naoLidas: 2, horario: "10:05" })];
  const resultado = mesclarListaComDetalhe(comDetalhe, recarregada);
  assert.deepEqual(resultado[0].mensagens, ["m1", "m2", "m3"]);
  assert.deepEqual(resultado[0].notas, ["nota"]);
  assert.equal(resultado[0].nome, "Maria (CRM)");
  // E o que a lista realmente traz continua sendo atualizado.
  assert.equal(resultado[0].ultimaMensagem, "nova");
  assert.equal(resultado[0].naoLidas, 2);
  assert.equal(resultado[0].horario, "10:05");
});

test("new conversations enter the list and removed ones leave it", () => {
  const antes = [resumo("c1", { mensagens: ["m1"] }), resumo("c2")];
  const depois = [resumo("c3"), resumo("c1")];
  const resultado = mesclarListaComDetalhe(antes, depois);
  assert.deepEqual(
    resultado.map((contato) => contato.id),
    ["c3", "c1"],
  );
  assert.deepEqual(resultado[1].mensagens, ["m1"]);
});

test("a conversation without loaded detail takes the list name and data as is", () => {
  const resultado = mesclarListaComDetalhe(
    [resumo("c1", { nome: "Antigo" })],
    [resumo("c1", { nome: "Novo" })],
  );
  assert.equal(resultado[0].nome, "Novo");
});

test("the list can clear a lead link only through the server value and keeps the loaded avatar", () => {
  const antes = [
    resumo("c1", { avatar: "https://foto/1.jpg", leadId: "lead-1", mensagens: ["m"] }),
  ];
  const depois = [resumo("c1", { avatar: undefined, leadId: undefined })];
  const [mesclado] = mesclarListaComDetalhe(antes, depois);
  assert.equal(mesclado.avatar, "https://foto/1.jpg");
  assert.equal(mesclado.leadId, "lead-1");
});

test("only an open, visible conversation with unread messages is marked as read", () => {
  const base = { conversaAbertaId: "c1", naoLidas: 3, abaVisivel: true, ultimaChaveEnviada: null };
  assert.equal(leituraAutomatica(base), "c1:3");
  // Nenhuma conversa aberta (ninguém olhou): nada é marcado.
  assert.equal(leituraAutomatica({ ...base, conversaAbertaId: null }), null);
  // Aba em segundo plano: a mensagem ainda não foi vista de verdade.
  assert.equal(leituraAutomatica({ ...base, abaVisivel: false }), null);
  // Nada não lido.
  assert.equal(leituraAutomatica({ ...base, naoLidas: 0 }), null);
});

test("the same unread count is not sent twice, but a new message in the open chat is", () => {
  const primeira = leituraAutomatica({
    conversaAbertaId: "c1",
    naoLidas: 1,
    abaVisivel: true,
    ultimaChaveEnviada: null,
  });
  assert.equal(primeira, "c1:1");
  assert.equal(
    leituraAutomatica({
      conversaAbertaId: "c1",
      naoLidas: 1,
      abaVisivel: true,
      ultimaChaveEnviada: primeira,
    }),
    null,
  );
  assert.equal(
    leituraAutomatica({
      conversaAbertaId: "c1",
      naoLidas: 2,
      abaVisivel: true,
      ultimaChaveEnviada: primeira,
    }),
    "c1:2",
  );
});
