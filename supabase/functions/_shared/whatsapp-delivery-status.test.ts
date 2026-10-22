// Suite: status de entrega e leitura vindos do webhook.
// Invariante: o status só avança (nunca regride), o mesmo evento aplicado duas vezes não duplica
// nada e um recibo só atinge registros da MESMA organização e instância.
// Boundary IN: aplicação de status sobre um banco simulado. Boundary OUT: PostgreSQL e Evolution.
import test from "node:test";
import assert from "node:assert/strict";
import { aplicarStatusDoProvedor } from "./whatsapp-delivery-status.ts";
import { normalizeReceiptEvent } from "./whatsapp-conversation.ts";

type Linha = Record<string, unknown>;

/** Banco simulado mínimo: select/eq/maybeSingle, update/eq e insert com chave única. */
function bancoSimulado(tabelas: Record<string, Linha[]>) {
  const eventosInseridos: string[] = [];
  const admin = {
    from(nome: string) {
      const filtros: Array<[string, unknown]> = [];
      let operacao: "select" | "update" = "select";
      let alteracao: Linha = {};
      const casa = (linha: Linha) => filtros.every(([coluna, valor]) => linha[coluna] === valor);
      const consulta = {
        select: () => consulta,
        eq: (coluna: string, valor: unknown) => {
          filtros.push([coluna, valor]);
          return consulta;
        },
        update: (valores: Linha) => {
          operacao = "update";
          alteracao = valores;
          return consulta;
        },
        maybeSingle: async () => ({
          data: (tabelas[nome] ?? []).find(casa) ?? null,
          error: null,
        }),
        insert: async (valores: Linha) => {
          const chave = String(valores.event_key);
          if (eventosInseridos.includes(chave)) return { error: { code: "23505" } };
          eventosInseridos.push(chave);
          (tabelas[nome] ??= []).push(valores);
          return { error: null };
        },
        then: (resolve: (valor: unknown) => unknown) => {
          if (operacao === "update") {
            for (const linha of (tabelas[nome] ?? []).filter(casa)) Object.assign(linha, alteracao);
          }
          return resolve({ data: null, error: null });
        },
      };
      return consulta;
    },
  };
  return { admin, eventosInseridos };
}

const inst = { id: "chip-1", org_id: "org-1" };
const mensagem = (extras: Linha = {}): Linha => ({
  id: "m-1",
  org_id: "org-1",
  instancia_id: "chip-1",
  externo_id: "3EB0AAAA",
  conversa_id: "c-1",
  status: "sent",
  ...extras,
});
const T = "2026-10-22T10:00:00.000Z";

test("delivered then read advance the chat bubble in order", async () => {
  const tabelas = { wa_mensagens: [mensagem()], wa_envios: [] as Linha[] };
  const { admin } = bancoSimulado(tabelas);
  assert.equal(
    await aplicarStatusDoProvedor(admin, inst, "3EB0AAAA", "delivered", T, "receipt"),
    "aplicado",
  );
  assert.equal(tabelas.wa_mensagens[0].status, "delivered");
  assert.equal(
    await aplicarStatusDoProvedor(admin, inst, "3EB0AAAA", "read", T, "receipt"),
    "aplicado",
  );
  assert.equal(tabelas.wa_mensagens[0].status, "read");
});

test("an out-of-order older event never regresses the status", async () => {
  const tabelas = { wa_mensagens: [mensagem({ status: "read" })], wa_envios: [] as Linha[] };
  const { admin } = bancoSimulado(tabelas);
  await aplicarStatusDoProvedor(admin, inst, "3EB0AAAA", "delivered", T, "receipt");
  await aplicarStatusDoProvedor(admin, inst, "3EB0AAAA", "sent", T, "message");
  assert.equal(tabelas.wa_mensagens[0].status, "read");
});

test("a duplicated webhook event is idempotent for chat and campaign deliveries", async () => {
  const tabelas = {
    wa_mensagens: [] as Linha[],
    wa_envios: [
      {
        id: "e-1",
        org_id: "org-1",
        instancia_id: "chip-1",
        provider_message_id: "3EB0BBBB",
        status: "sent",
      },
    ],
    wa_envio_eventos: [] as Linha[],
  };
  const { admin, eventosInseridos } = bancoSimulado(tabelas);
  const primeira = await aplicarStatusDoProvedor(
    admin,
    inst,
    "3EB0BBBB",
    "delivered",
    T,
    "receipt",
  );
  const repetida = await aplicarStatusDoProvedor(
    admin,
    inst,
    "3EB0BBBB",
    "delivered",
    T,
    "receipt",
  );
  assert.equal(primeira, "aplicado");
  assert.equal(repetida, "aplicado");
  assert.equal(eventosInseridos.length, 1, "o evento de entrega é gravado uma única vez");
  assert.equal(tabelas.wa_envios[0].status, "delivered");
});

test("a receipt cannot touch another instance or organization", async () => {
  const tabelas = {
    wa_mensagens: [mensagem({ instancia_id: "chip-2" }), mensagem({ id: "m-2", org_id: "org-2" })],
    wa_envios: [] as Linha[],
  };
  const { admin } = bancoSimulado(tabelas);
  const resultado = await aplicarStatusDoProvedor(admin, inst, "3EB0AAAA", "read", T, "receipt");
  assert.equal(resultado, "desconhecido");
  assert.deepEqual(
    tabelas.wa_mensagens.map((linha) => linha.status),
    ["sent", "sent"],
  );
});

test("an unknown external id is reported so the webhook can retry the lookup", async () => {
  const { admin } = bancoSimulado({ wa_mensagens: [], wa_envios: [] });
  assert.equal(
    await aplicarStatusDoProvedor(admin, inst, "INEXISTENTE", "delivered", T, "receipt"),
    "desconhecido",
  );
});

// Payload REAL de recibo da Evolution GO 0.7.x (state na raiz; ids e chat em data).
const recibo = (
  state: string,
  chat = "5541999990001@s.whatsapp.net",
  ids: unknown = ["3EB0AAAA"],
) => ({
  event: "Receipt",
  state,
  instanceName: "org-a08485ce-8cc7",
  data: {
    Chat: chat,
    Sender: chat,
    IsFromMe: false,
    IsGroup: chat.endsWith("@g.us"),
    MessageIDs: ids,
    MessageSender: "",
    Timestamp: "2026-10-22T07:00:00-03:00",
    Type: state === "Read" ? "read" : "",
  },
});

test("a real Delivered and Read receipt are normalized with every external id", () => {
  assert.deepEqual(normalizeReceiptEvent(recibo("Delivered", undefined, ["A", "B", "A"])), {
    status: "delivered",
    messageIds: ["A", "B"],
    occurredAt: "2026-10-22T10:00:00.000Z",
  });
  const lido = normalizeReceiptEvent(recibo("Read"));
  assert.ok("status" in lido);
  assert.equal("status" in lido && lido.status, "read");
});

test("ReadSelf, groups, broadcasts and receipts without ids are never applied to a sent message", () => {
  assert.deepEqual(normalizeReceiptEvent(recibo("ReadSelf")), { ignored: "recibo-nao-suportado" });
  assert.deepEqual(normalizeReceiptEvent(recibo("Read", "120363000000000000@g.us")), {
    ignored: "recibo-de-grupo",
  });
  assert.deepEqual(normalizeReceiptEvent(recibo("Read", "status@broadcast")), {
    ignored: "recibo-de-grupo",
  });
  assert.deepEqual(normalizeReceiptEvent(recibo("Delivered", undefined, [])), {
    ignored: "recibo-sem-id",
  });
  assert.deepEqual(normalizeReceiptEvent(null), { ignored: "recibo-nao-suportado" });
});
