import assert from "node:assert/strict";
import test from "node:test";

import { orcamentoRestanteRunApify } from "../../../src/lib/redes-teto.ts";
import { planejarColetaApify } from "./apify-economy.ts";

test("retentativa Apify usa apenas o orçamento que ainda não foi consumido", () => {
  assert.equal(orcamentoRestanteRunApify(0.75, 0), 0.75);
  assert.equal(orcamentoRestanteRunApify(0.75, 0.42), 0.33);
  assert.equal(orcamentoRestanteRunApify(0.75, 0.749), 0);
  assert.equal(orcamentoRestanteRunApify(0.75, 1.2), 0);
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
