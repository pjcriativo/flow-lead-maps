#!/usr/bin/env node
// Suite: orçamento de uma busca Apify
// Invariant: uma busca de N leads autoriza no máximo N itens cobrados e preserva o custo real.
// Boundary IN: plano puro enviado ao endpoint de execução da Apify.
// Boundary OUT: rede da Apify e persistência por usuário, verificadas na integração da Edge.
import assert from "node:assert/strict";
import { criarPlanoBuscaApify } from "../supabase/functions/_shared/apify-search-plan.ts";

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
  assert.ok(
    plano.maxTotalChargeUsd > 0 && plano.maxTotalChargeUsd <= limite * 0.004 + 0.0002,
    `a busca de ${limite} deve ter teto financeiro no preço base mais a inicialização`,
  );
  assert.equal(plano.input.scrapePlaceDetailPage, false, "detalhes pagos devem ficar desligados");
  assert.equal(plano.input.scrapeContacts, false, "contatos pagos devem ficar desligados");
  assert.equal(plano.input.maxReviews, 0, "reviews pagos devem ficar desligados");
  assert.equal(plano.input.maxImages, 0, "imagens pagas devem ficar desligadas");
}

console.log("OK: orçamento Apify não multiplica termos, itens nem custo da busca.");
