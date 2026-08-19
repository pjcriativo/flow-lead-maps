// Suite: economia da coleta em redes sociais
// Invariant: uma busca paga nunca pode cobrar acima do menor limite entre itens, rodada e saldo mensal.
// Boundary IN: planejamento puro de custo, limite nativo da Apify e identidade do cache compartilhado.
// Boundary OUT: Apify, Supabase e Edge Function reais (validados sem iniciar runs pagos).
import assert from "node:assert/strict";

import {
  CUSTO_ITEM_ESTIMADO_USD,
  TETO_REDES_MES_USD,
  TETO_REDES_RODADA_USD,
  estimarCustoColeta,
  limitesRunApify,
  planejarColeta,
} from "../src/lib/redes-teto.ts";
import { criarChaveCacheRedes } from "../src/lib/redes-economia.ts";

assert.equal(CUSTO_ITEM_ESTIMADO_USD, 0.003, "estimativa deve cobrir o preço Free de US$ 0,0027");
assert.equal(TETO_REDES_RODADA_USD, 0.75, "uma rodada não pode expor US$ 5");
assert.equal(TETO_REDES_MES_USD, 5, "o teto mensal social deve ser 90% menor que o legado");

assert.equal(estimarCustoColeta(50), 0.15, "50 perfis devem estimar US$ 0,15");
assert.equal(estimarCustoColeta(200), 0.6, "200 perfis devem estimar US$ 0,60");

assert.deepEqual(
  limitesRunApify(50, 0.75),
  { maxItems: 50, maxTotalChargeUsd: 0.15 },
  "o limite enviado à Apify deve acompanhar os itens pedidos",
);
assert.deepEqual(
  limitesRunApify(200, 0.2),
  { maxItems: 66, maxTotalChargeUsd: 0.198 },
  "o saldo restante deve reduzir itens e cobrança antes de iniciar o run",
);

assert.equal(planejarColeta(0, 200).maxItens, 200, "o teto menor não reduz a busca máxima da UI");
assert.equal(planejarColeta(4.9, 200).maxItens, 33, "o saldo mensal limita o próximo run");
assert.equal(planejarColeta(5, 50).podeRodar, false, "o teto mensal bloqueia antes de gastar");

const buscaComercial = {
  search: "Clínica Odontológica   Curitiba",
  searchType: "user",
  resultsType: "details",
};
const mesmaBuscaNormalizada = {
  resultsType: "details",
  searchType: "user",
  search: "clinica odontologica curitiba",
};
assert.equal(
  criarChaveCacheRedes("apify~instagram-scraper", buscaComercial),
  criarChaveCacheRedes("apify~instagram-scraper", mesmaBuscaNormalizada),
  "acentos, caixa, espaços e ordem das propriedades não podem causar cobrança duplicada",
);
assert.notEqual(
  criarChaveCacheRedes("apify~instagram-scraper", buscaComercial),
  criarChaveCacheRedes("outro~ator", buscaComercial),
  "atores diferentes não podem compartilhar resultados",
);

console.log("OK: limites, estimativa e cache social impedem cobranças desnecessárias.");
