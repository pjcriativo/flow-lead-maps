// Suite: número de atendimento exibido na Central de Conversas.
// Invariante: o número mostrado é sempre o da instância vinculada à conversa; sem número
// conhecido o texto é "não identificado" — nunca o telefone do lead nem outro chip.
import test from "node:test";
import assert from "node:assert/strict";
import {
  NUMERO_NAO_IDENTIFICADO,
  descreverChipAtendimento,
  formatarNumeroWhatsapp,
  type WaInstanciaAtendimento,
} from "../../../src/lib/whatsapp-numero-atendimento.ts";

const chip = (overrides: Partial<WaInstanciaAtendimento> = {}): WaInstanciaAtendimento => ({
  id: "i-1",
  nome: "org-a08485ce-8cc7",
  numero: "554197844716",
  status: "conectado",
  provider_status: "connected",
  arquivada: false,
  ...overrides,
});

test("formats Brazilian numbers with and without the ninth digit", () => {
  assert.equal(formatarNumeroWhatsapp("554197844716"), "+55 41 9784-4716");
  assert.equal(formatarNumeroWhatsapp("5541997844716"), "+55 41 99784-4716");
  assert.equal(formatarNumeroWhatsapp("+55 (41) 99784-4716"), "+55 41 99784-4716");
});

test("keeps foreign numbers as international digits and rejects unusable values", () => {
  assert.equal(formatarNumeroWhatsapp("14155550123"), "+14155550123");
  assert.equal(formatarNumeroWhatsapp(""), null);
  assert.equal(formatarNumeroWhatsapp(null), null);
  assert.equal(formatarNumeroWhatsapp("123"), null);
});

test("describes the real linked chip with its number, instance and state", () => {
  assert.deepEqual(descreverChipAtendimento(chip()), {
    numeroFormatado: "+55 41 9784-4716",
    rotuloNumero: "+55 41 9784-4716",
    nomeInstancia: "org-a08485ce-8cc7",
    estado: "conectado",
    estadoRotulo: "Conectado",
  });
});

test("a disconnected or pairing chip keeps its number and reports the real state", () => {
  assert.equal(
    descreverChipAtendimento(chip({ status: "desconectado", provider_status: "disconnected" }))
      .estado,
    "desconectado",
  );
  assert.equal(
    descreverChipAtendimento(chip({ status: "aguardando", provider_status: "pairing" })).estado,
    "aguardando",
  );
  assert.equal(
    descreverChipAtendimento(chip({ status: "desconectado" })).numeroFormatado,
    "+55 41 9784-4716",
  );
});

test("a legacy archived chip without a known number is never replaced by another number", () => {
  const legado = descreverChipAtendimento(
    chip({ nome: "flowleads", numero: null, status: "desconectado", arquivada: true }),
  );
  assert.equal(legado.rotuloNumero, NUMERO_NAO_IDENTIFICADO);
  assert.equal(legado.numeroFormatado, null);
  assert.equal(legado.nomeInstancia, "flowleads");
  assert.equal(legado.estado, "arquivado");
});

test("a conversation whose instance is unknown reports it instead of guessing", () => {
  for (const ausente of [null, undefined]) {
    const descrito = descreverChipAtendimento(ausente);
    assert.equal(descrito.rotuloNumero, NUMERO_NAO_IDENTIFICADO);
    assert.equal(descrito.nomeInstancia, null);
    assert.equal(descrito.estado, "desconhecido");
  }
});
