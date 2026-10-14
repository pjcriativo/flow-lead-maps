import assert from "node:assert/strict";
import test from "node:test";

import { orcamentoRestanteRunApify } from "../../../src/lib/redes-teto.ts";
import {
  calcularAlvoCandidatosApify,
  criarChaveCacheApify,
  planejarCacheIncrementalApify,
  planejarColetaApify,
  processarCandidatosEmLotes,
  selecionarIneditosApify,
} from "./apify-economy.ts";

test("retentativa Apify usa apenas o orçamento que ainda não foi consumido", () => {
  assert.equal(orcamentoRestanteRunApify(0.75, 0), 0.75);
  assert.equal(orcamentoRestanteRunApify(0.75, 0.42), 0.33);
  assert.equal(orcamentoRestanteRunApify(0.75, 0.749), 0);
  assert.equal(orcamentoRestanteRunApify(0.75, 1.2), 0);
});

test("consulta equivalente compartilha a mesma chave apesar de acentos e espaços", () => {
  const base = {
    lat: null,
    lng: null,
    raioKm: null,
    usarAreaMapa: false,
  };

  assert.equal(
    criarChaveCacheApify({
      ...base,
      nicho: "  ClÍnica   Odontológica ",
      cidade: "São   Paulo",
      uf: "SP",
    }),
    criarChaveCacheApify({
      ...base,
      nicho: "clinica odontologica",
      cidade: "sao paulo",
      uf: "sp",
    }),
  );
});

test("cache esgotado evita repetir uma busca que já devolveu tudo que existia", () => {
  assert.deepEqual(
    planejarColetaApify({
      solicitado: 50,
      restantePlano: 50,
      profundidadeCache: 21,
      cacheEsgotado: true,
    }),
    { limiteEfetivo: 50, limiteApify: 0, servidoDoCache: true },
  );
});

test("busca repetida entrega a próxima fatia inédita do cache sem novo run", () => {
  const items = ["lead-1", "lead-2", "lead-3", "lead-4"];
  const seen = new Set(["lead-1", "lead-2"]);

  assert.deepEqual(
    selecionarIneditosApify(items, 2, (item) => seen.has(item)),
    ["lead-3", "lead-4"],
  );
  assert.deepEqual(
    planejarCacheIncrementalApify({
      solicitado: 2,
      itensCache: 4,
      ineditosCache: 2,
      cacheEsgotado: false,
    }),
    { servidoDoCache: true, profundidadeColeta: 0 },
  );
});

test("cache sem inéditos amplia somente a profundidade necessária", () => {
  assert.deepEqual(
    planejarCacheIncrementalApify({
      solicitado: 50,
      itensCache: 50,
      ineditosCache: 0,
      cacheEsgotado: false,
      buscaPagaRecente: false,
    }),
    { servidoDoCache: false, profundidadeColeta: 100 },
  );
});

test("mesma organização nunca paga duas vezes pela mesma consulta recente", () => {
  assert.deepEqual(
    planejarCacheIncrementalApify({
      solicitado: 50,
      itensCache: 50,
      ineditosCache: 0,
      cacheEsgotado: false,
      buscaPagaRecente: true,
    }),
    { servidoDoCache: true, profundidadeColeta: 0 },
  );
});

test("fonte esgotada nunca abre novo run mesmo sem inéditos", () => {
  assert.deepEqual(
    planejarCacheIncrementalApify({
      solicitado: 50,
      itensCache: 21,
      ineditosCache: 0,
      cacheEsgotado: true,
    }),
    { servidoDoCache: true, profundidadeColeta: 0 },
  );
});

test("meta de entrega preserva a reserva de candidatos pedida pelo pipeline", () => {
  assert.equal(calcularAlvoCandidatosApify(100, 250), 250);
  assert.equal(calcularAlvoCandidatosApify(100, 40), 100);
  assert.equal(calcularAlvoCandidatosApify(100, 10_000), 1_000);
});

test("processamento em lotes limita a concorrência e para exatamente na meta", async () => {
  let ativos = 0;
  let maximoAtivos = 0;

  const aceitos = await processarCandidatosEmLotes({
    candidatos: Array.from({ length: 20 }, (_, index) => index),
    tamanhoLote: 4,
    meta: 5,
    preparar: async (candidato) => {
      ativos += 1;
      maximoAtivos = Math.max(maximoAtivos, ativos);
      await Promise.resolve();
      ativos -= 1;
      return candidato;
    },
    consumir: async (candidato) => candidato % 2 === 0,
  });

  assert.equal(aceitos, 5);
  assert.equal(maximoAtivos, 4);
});

test("meta zero não inicia nenhum enriquecimento", async () => {
  let preparados = 0;
  const aceitos = await processarCandidatosEmLotes({
    candidatos: [1, 2, 3],
    tamanhoLote: 2,
    meta: 0,
    preparar: async (candidato) => {
      preparados += 1;
      return candidato;
    },
    consumir: async () => true,
  });

  assert.equal(aceitos, 0);
  assert.equal(preparados, 0);
});
