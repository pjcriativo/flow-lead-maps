// Suite: envio manual de mensagens WhatsApp — operação única, sem reenvio automático.
// Invariante: um clique é uma operação lógica; resposta perdida nunca vira "falhou" nem reenvio;
// o desfecho exibido é sempre o que o backend registrou.
// Boundary IN: decisão pura de reconciliação. Boundary OUT: rede, Edge e Evolution GO.
import test from "node:test";
import assert from "node:assert/strict";
import {
  MENSAGEM_ENVIO_NAO_CONFIRMADO,
  escolherOperacaoEnvio,
  reconciliarEnvio,
  resultadoDoRegistro,
  type WaEnvioResultado,
} from "../../../src/lib/whatsapp-envio.ts";

const resultado = (
  status: WaEnvioResultado["status"],
  extras: Partial<WaEnvioResultado> = {},
): WaEnvioResultado => ({
  ok: status === "sent" || status === "delivered" || status === "read",
  operation_id: "op-1",
  message_id: "msg-1",
  external_id: status === "sent" ? "3EB0AAAA" : null,
  status,
  occurred_at: "2026-10-22T10:00:00.000Z",
  ...extras,
});

class ErroHttp extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null) {
    super(message);
    this.status = status;
  }
}
const statusHttp = (error: unknown) => (error instanceof ErroHttp ? error.status : null);
const mensagemDoErro = (error: unknown) => (error instanceof Error ? error.message : "erro");

function cenario(opcoes: {
  enviar: () => Promise<WaEnvioResultado>;
  consultar?: () => Promise<WaEnvioResultado | null>;
}) {
  const chamadas = { enviar: 0, consultar: 0 };
  const executar = () =>
    reconciliarEnvio({
      enviar: () => {
        chamadas.enviar++;
        return opcoes.enviar();
      },
      consultar: () => {
        chamadas.consultar++;
        return (opcoes.consultar ?? (async () => null))();
      },
      statusHttp,
      mensagemDoErro,
    });
  return { chamadas, executar };
}

test("a confirmed send is reported once and never retried or reconciled", async () => {
  const { chamadas, executar } = cenario({ enviar: async () => resultado("sent") });
  const desfecho = await executar();
  assert.equal(desfecho.tipo, "confirmado");
  assert.deepEqual(chamadas, { enviar: 1, consultar: 0 });
});

test("WhatsApp refusing the message is a definitive refusal, not an unconfirmed send", async () => {
  const { executar } = cenario({
    enviar: async () =>
      resultado("failed", { error: "O WhatsApp recusou o envio desta mensagem." }),
  });
  const desfecho = await executar();
  assert.equal(desfecho.tipo, "recusado");
  assert.match(desfecho.tipo === "recusado" ? desfecho.mensagem : "", /recusou/);
});

test("an uncertain or pending result is 'Envio não confirmado', never 'falhou'", async () => {
  for (const status of ["uncertain", "pending"] as const) {
    const { executar } = cenario({ enviar: async () => resultado(status) });
    const desfecho = await executar();
    assert.equal(desfecho.tipo, "nao_confirmado");
    assert.equal(
      desfecho.tipo === "nao_confirmado" && desfecho.mensagem,
      MENSAGEM_ENVIO_NAO_CONFIRMADO,
    );
    assert.doesNotMatch(MENSAGEM_ENVIO_NAO_CONFIRMADO, /falhou/i);
  }
});

test("a lost response (CORS/network) reconciles with the backend record and does NOT resend", async () => {
  const { chamadas, executar } = cenario({
    enviar: async () => {
      throw new ErroHttp("Failed to send a request to the Edge Function", null);
    },
    consultar: async () => resultado("sent"),
  });
  const desfecho = await executar();
  // A mensagem tinha saído: o atendente vê o desfecho real e o texto pode ser limpo.
  assert.equal(desfecho.tipo, "confirmado");
  assert.deepEqual(chamadas, { enviar: 1, consultar: 1 });
});

test("a lost response with no backend record stays unconfirmed (safe to repeat the same operation)", async () => {
  const { chamadas, executar } = cenario({
    enviar: async () => {
      throw new ErroHttp("Failed to send a request to the Edge Function", null);
    },
    consultar: async () => null,
  });
  const desfecho = await executar();
  assert.equal(desfecho.tipo, "nao_confirmado");
  assert.deepEqual(chamadas, { enviar: 1, consultar: 1 });
});

test("a 5xx after acceptance (timeout after accept) is reconciled, not treated as failure", async () => {
  const { chamadas, executar } = cenario({
    enviar: async () => {
      throw new ErroHttp("Erro interno", 500);
    },
    consultar: async () => resultado("uncertain"),
  });
  const desfecho = await executar();
  assert.equal(desfecho.tipo, "nao_confirmado");
  assert.deepEqual(chamadas, { enviar: 1, consultar: 1 });
});

test("a 4xx rejection happens before any record: definitive refusal without reconciling", async () => {
  for (const status of [401, 403, 409, 422]) {
    const { chamadas, executar } = cenario({
      enviar: async () => {
        throw new ErroHttp("Sem permissão para esta operação.", status);
      },
    });
    const desfecho = await executar();
    assert.equal(desfecho.tipo, "recusado");
    assert.deepEqual(chamadas, { enviar: 1, consultar: 0 });
  }
});

test("if reconciliation itself fails the send is reported as unconfirmed", async () => {
  const { executar } = cenario({
    enviar: async () => {
      throw new ErroHttp("rede", null);
    },
    consultar: async () => {
      throw new Error("sem rede");
    },
  });
  assert.equal((await executar()).tipo, "nao_confirmado");
});

test("the backend record maps to the same outcome as the live response", () => {
  const registro = {
    id: "msg-1",
    status: "delivered",
    externo_id: "3EB0AAAA",
    provider_occurred_at: null,
    criado_em: "2026-10-22T10:00:00.000Z",
  };
  const mapeado = resultadoDoRegistro(registro, "op-1");
  assert.equal(mapeado.ok, true);
  assert.equal(mapeado.external_id, "3EB0AAAA");
  assert.equal(mapeado.occurred_at, "2026-10-22T10:00:00.000Z");
});

test("double click and retry reuse the same operation; edited text or another chat starts a new one", () => {
  let contador = 0;
  const gerar = () => `op-${++contador}`;
  const primeira = escolherOperacaoEnvio(null, "conversa-1", "Olá", gerar);
  const duploClique = escolherOperacaoEnvio(primeira, "conversa-1", "Olá", gerar);
  assert.equal(duploClique.operationId, primeira.operationId);
  const retry = escolherOperacaoEnvio(duploClique, "conversa-1", "Olá", gerar);
  assert.equal(retry.operationId, primeira.operationId);
  const editado = escolherOperacaoEnvio(primeira, "conversa-1", "Olá!", gerar);
  assert.notEqual(editado.operationId, primeira.operationId);
  const outraConversa = escolherOperacaoEnvio(primeira, "conversa-2", "Olá", gerar);
  assert.notEqual(outraConversa.operationId, primeira.operationId);
});

test("two legitimate messages with the same text are two operations once the first is confirmed", () => {
  let contador = 0;
  const gerar = () => `op-${++contador}`;
  const primeira = escolherOperacaoEnvio(null, "conversa-1", "Bom dia", gerar);
  // Confirmada: a tela zera a operação pendente (null). O mesmo texto depois é uma nova mensagem.
  const segunda = escolherOperacaoEnvio(null, "conversa-1", "Bom dia", gerar);
  assert.notEqual(segunda.operationId, primeira.operationId);
});
