import assert from "node:assert/strict";
import test from "node:test";

import { corsHeaders } from "./cors.ts";

test("permite o dominio de producao do Flow Business no preflight", () => {
  const request = new Request("https://example.test", {
    method: "OPTIONS",
    headers: { origin: "https://business.flowgenius.com.br" },
  });

  const headers = corsHeaders(request);

  assert.equal(headers["Access-Control-Allow-Origin"], "https://business.flowgenius.com.br");
  assert.equal(headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
});
