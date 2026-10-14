// Suite: filtros de captura da prospeccao Google Maps
// Invariant: cada filtro alterna de forma independente e filtra leads por qualquer canal ativo.
// Boundary IN: funcoes puras de estado e correspondencia dos filtros.
// Boundary OUT: renderizacao React e transporte HTTP, cobertos por google-maps-premium.test.mjs.

import assert from "node:assert/strict";
import test from "node:test";

import {
  matchesCaptureFilters,
  normalizeCaptureFilters,
  sanitizeGoogleMapsUserMessage,
  toGoogleMapsPublicErrorMessage,
  toggleCaptureFilter,
} from "../src/lib/google-maps-capture.ts";

test("erros públicos não expõem SQL, tabelas, constraints, providers ou UUIDs", () => {
  const technical =
    "Postgres SQLSTATE constraint api_consumption_logs provider apify id 123e4567-e89b-12d3-a456-426614174000";
  const message = toGoogleMapsPublicErrorMessage(technical);
  assert.equal(
    message,
    "Não foi possível concluir a pesquisa. Tente novamente ou consulte o suporte.",
  );
  assert.doesNotMatch(message, /postgres|sqlstate|constraint|api_consumption|apify|123e4567/i);
});

test("mensagens públicas de validação e permissão continuam acionáveis", () => {
  assert.match(toGoogleMapsPublicErrorMessage("Informe o nicho e a cidade."), /Informe o nicho/);
  assert.match(
    toGoogleMapsPublicErrorMessage("Você não tem permissão para usar esta organização."),
    /não tem permissão/,
  );
});

test("ativa e desativa Telefone, Site e Instagram sem alterar os demais filtros", () => {
  let active = [];

  active = toggleCaptureFilter(active, "telefone");
  assert.deepEqual(active, ["telefone"]);

  active = toggleCaptureFilter(active, "site");
  assert.deepEqual(active, ["telefone", "site"]);

  active = toggleCaptureFilter(active, "instagram");
  assert.deepEqual(active, ["telefone", "site", "instagram"]);

  active = toggleCaptureFilter(active, "site");
  assert.deepEqual(active, ["telefone", "instagram"]);
});

test("normaliza somente filtros suportados e remove duplicatas", () => {
  assert.deepEqual(normalizeCaptureFilters(["site", "interno", "site", "telefone"]), [
    "site",
    "telefone",
  ]);
});

test("sem filtro aceita qualquer lead e com filtros aceita qualquer canal selecionado", () => {
  const lead = { phone: null, whatsapp: "+5541999999999", website: null, instagram: "@flow" };

  assert.equal(matchesCaptureFilters(lead, []), true);
  assert.equal(matchesCaptureFilters(lead, ["telefone"]), true);
  assert.equal(matchesCaptureFilters(lead, ["site"]), false);
  assert.equal(matchesCaptureFilters(lead, ["site", "instagram"]), true);
});

test("mensagens visiveis ocultam nomes e termos tecnicos do fornecedor", () => {
  const sanitized = sanitizeGoogleMapsUserMessage(
    "Apify scraper API falhou no dataset com HTTP 500",
  );

  assert.doesNotMatch(sanitized, /Apify|scraper|API|dataset|HTTP 500/i);
});

test("mensagens publicas removem custo, saldo, ids externos e status tecnico", () => {
  const sanitized = sanitizeGoogleMapsUserMessage(
    "Apify actor RUNNING - custo ~US$ 0.002, saldo BRL 12, runId abc123",
  );

  assert.doesNotMatch(sanitized, /Apify|actor|RUNNING|US\$|BRL|saldo|custo|runId|abc123/i);
  assert.match(sanitized, /Processando empresas encontradas/);
});
