// Suite: política base-first de leads
// Invariant: somente leads inéditos são entregues e uma API paga só complementa o estoque local.
// Boundary IN: combinação e planejamento puros do catálogo/cache.
// Boundary OUT: Supabase e Apify, validados pelo deploy das Edge Functions.
import assert from "node:assert/strict";
import test from "node:test";

import { combinarFontesIneditas, planejarComplementoBaseFirst } from "./lead-catalog-policy.ts";

test("catálogo tem prioridade e remove duplicatas presentes também no cache", () => {
  const resultado = combinarFontesIneditas({
    solicitado: 3,
    catalogo: ["lead-a", "lead-b"],
    cache: ["lead-b", "lead-c", "lead-d"],
    identidade: (lead) => lead,
  });

  assert.deepEqual(resultado.items, ["lead-a", "lead-b", "lead-c"]);
  assert.equal(resultado.doCatalogo, 2);
  assert.equal(resultado.doCache, 1);
  assert.equal(resultado.duplicadosDescartados, 1);
});

test("API paga complementa somente a quantidade ausente no estoque local", () => {
  assert.deepEqual(
    planejarComplementoBaseFirst({
      solicitado: 50,
      catalogoDisponivel: 32,
      cacheDisponivel: 8,
      pagamentoBloqueado: false,
    }),
    {
      retornoLocal: 40,
      faltantes: 10,
      podeIniciarPagamento: true,
      motivo: "complemento_pago",
    },
  );
});

test("busca recente ou fonte esgotada devolve o estoque parcial sem nova cobrança", () => {
  for (const motivo of ["busca_recente", "fonte_esgotada"] as const) {
    assert.deepEqual(
      planejarComplementoBaseFirst({
        solicitado: 50,
        catalogoDisponivel: 12,
        cacheDisponivel: 3,
        pagamentoBloqueado: true,
        motivoBloqueio: motivo,
      }),
      {
        retornoLocal: 15,
        faltantes: 35,
        podeIniciarPagamento: false,
        motivo,
      },
    );
  }
});
