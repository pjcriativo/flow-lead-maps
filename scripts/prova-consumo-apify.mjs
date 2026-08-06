#!/usr/bin/env node
// Suite: orçamento de uma busca Apify
// Invariant: uma busca de N leads autoriza no máximo N itens cobrados e preserva o custo real.
// Boundary IN: plano puro enviado ao endpoint de execução da Apify.
// Boundary OUT: rede da Apify e persistência por usuário, verificadas na integração da Edge.
import assert from "node:assert/strict";
import {
  criarPlanoBuscaApify,
  respeitarMinimoTetoRunApify,
} from "../supabase/functions/_shared/apify-search-plan.ts";

assert.equal(
  respeitarMinimoTetoRunApify(0.3),
  0.5,
  "uma rodada reiniciada tambem precisa respeitar o minimo aceito pelo Actor",
);

for (const limite of [1, 10, 50, 100]) {
  const plano = criarPlanoBuscaApify("Clínica veterinária", limite);
  const termos = plano.input.searchStringsArray;
  assert.deepEqual(termos, ["Clínica veterinária"], `a busca de ${limite} deve usar um termo`);
  assert.equal(
    plano.input.maxCrawledPlacesPerSearch,
    limite,
    `a busca de ${limite} não pode ampliar o limite por termo`,
  );
  assert.equal(plano.maxItems, limite, `a cobrança de ${limite} deve ter teto de itens`);
  assert.equal(
    plano.maxTotalChargeUsd,
    Math.max(0.5, Number((limite * 0.004 + 0.0002).toFixed(4))),
    `a busca de ${limite} deve respeitar o mínimo de US$ 0,50 exigido pelo Actor sem ampliar itens`,
  );
  assert.equal(plano.input.scrapePlaceDetailPage, false, "detalhes pagos devem ficar desligados");
  assert.equal(plano.input.scrapeContacts, false, "contatos pagos devem ficar desligados");
  assert.equal(plano.input.maxReviews, 0, "reviews pagos devem ficar desligados");
  assert.equal(plano.input.maxImages, 0, "imagens pagas devem ficar desligadas");
}

console.log("OK: orçamento Apify não multiplica termos, itens nem custo da busca.");
