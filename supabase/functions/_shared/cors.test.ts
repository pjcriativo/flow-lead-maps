import assert from "node:assert/strict";
import test from "node:test";

import { readFileSync } from "node:fs";
import { corsHeaders, corsPreflightResponse, json } from "./cors.ts";

test("permite o dominio de producao do Flow Business no preflight", () => {
  const request = new Request("https://example.test", {
    method: "OPTIONS",
    headers: { origin: "https://business.flowgenius.com.br" },
  });

  const response = corsPreflightResponse(request);
  const headers = Object.fromEntries(response.headers.entries());

  assert.equal(response.status, 200);
  assert.equal(headers["access-control-allow-origin"], "https://business.flowgenius.com.br");
  assert.equal(headers["access-control-allow-methods"], "POST, OPTIONS");
  assert.equal(
    headers["access-control-allow-headers"],
    "authorization, x-client-info, apikey, content-type",
  );
  assert.equal(headers.vary, "Origin");
});

test("preserva o dominio legado oficialmente autorizado", () => {
  const request = new Request("https://example.test", {
    method: "OPTIONS",
    headers: { origin: "https://flow-leads-dusky.vercel.app" },
  });

  assert.equal(
    corsHeaders(request)["Access-Control-Allow-Origin"],
    "https://flow-leads-dusky.vercel.app",
  );
});

test("nao concede Access-Control-Allow-Origin a origem desconhecida", () => {
  const request = new Request("https://example.test", {
    method: "OPTIONS",
    headers: { origin: "https://malicious.example" },
  });

  assert.equal(corsHeaders(request)["Access-Control-Allow-Origin"], undefined);
});

test("respostas JSON de erro preservam o CORS da origem autorizada", async () => {
  const request = new Request("https://example.test", {
    headers: { origin: "https://flow-leads-dusky.vercel.app" },
  });
  const response = json({ error: "Falha controlada" }, 400, request);

  assert.equal(response.status, 400);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://flow-leads-dusky.vercel.app",
  );
  assert.deepEqual(await response.json(), { error: "Falha controlada" });
});

test("search-leads aplica o Request em erros e preserva CORS no stream", () => {
  const source = readFileSync(new URL("../search-leads/index.ts", import.meta.url), "utf8");
  const jsonCalls = source.match(/return json\([^;]+;/g) ?? [];

  assert.ok(jsonCalls.length >= 6);
  for (const call of jsonCalls) assert.match(call, /,\s*req,?\s*\);$/);
  assert.match(source, /\.\.\.corsHeaders\(req\)[\s\S]*application\/x-ndjson/);
});
