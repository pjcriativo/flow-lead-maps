import assert from "node:assert/strict";
import test from "node:test";

import { orcamentoRestanteRunApify } from "../../../src/lib/redes-teto.ts";
import {
  criarChaveCacheApify,
  planejarCacheIncrementalApify,
  planejarColetaApify,
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
