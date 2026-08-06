#!/usr/bin/env node
// Suite: conta financeira Apify
// Invariant: credito do plano, uso e limite duro permanecem distintos e contas repetidas nao duplicam totais.
// Boundary IN: normalizacao pura das respostas oficiais /users/me e /users/me/limits.
// Boundary OUT: rede, banco e interface; cobertos pelas provas macro do pool e do painel.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { build } = require("esbuild");
const project = process.cwd();
const output = await build({
  entryPoints: [join(project, "supabase/functions/_shared/apify-financeiro.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const directory = mkdtempSync(join(tmpdir(), "apify-financeiro-"));
const modulePath = join(directory, "apify-financeiro.mjs");
writeFileSync(modulePath, output.outputFiles[0].text);
const {
  consultarContaFinanceiraApify,
  deduplicarContasFinanceirasApify,
  normalizarContaFinanceiraApify,
  resumirContaFinanceiraApify,
} = await import(pathToFileURL(modulePath).href);

const limits = {
  data: {
    monthlyUsageCycle: {
      startAt: "2026-08-01T00:00:00.000Z",
      endAt: "2026-08-31T23:59:59.999Z",
    },
    limits: { maxMonthlyUsageUsd: 10 },
    current: { monthlyUsageUsd: 4.6524 },
  },
};
const user = {
  data: {
    id: "account-1",
    username: "marcos",
    plan: { monthlyUsageCreditsUsd: 5 },
  },
};

const account = normalizarContaFinanceiraApify(user, limits);
assert.deepEqual(account, {
  accountId: "account-1",
  username: "marcos",
  planCreditsUsd: 5,
  usageUsd: 4.6524,
  planRemainingUsd: 0.3476,
  hardLimitUsd: 10,
  hardRemainingUsd: 5.3476,
  effectiveRemainingUsd: 5.3476,
  cycleStartAt: "2026-08-01T00:00:00.000Z",
  cycleEndAt: "2026-08-31T23:59:59.999Z",
});
assert.deepEqual(
  resumirContaFinanceiraApify(account),
  {
    usageUsd: 4.6524,
    limitUsd: 10,
    remainingUsd: 5.3476,
    includedCreditsUsd: 5,
    includedCreditsRemainingUsd: 0.3476,
  },
  "o painel deve mostrar US$ 4.6524 de US$ 10 e saldo operacional US$ 5.3476",
);

const duplicateToken = { ...account, username: "mesma-conta-outro-token" };
const secondAccount = { ...account, accountId: "account-2", username: "outra-conta" };
const deduplicated = deduplicarContasFinanceirasApify([account, duplicateToken, secondAccount]);
assert.equal(deduplicated.length, 2, "dois tokens da mesma conta nao podem dobrar o saldo");
assert.deepEqual(
  deduplicated.map((item) => item.accountId),
  ["account-1", "account-2"],
);

assert.throws(
  () => normalizarContaFinanceiraApify({ data: { id: "sem-plano" } }, limits),
  /data\.plan/,
  "resposta incompleta nao pode virar saldo zero silenciosamente",
);

const originalFetch = globalThis.fetch;
const endpoints = [];
globalThis.fetch = async (url, init) => {
  endpoints.push(String(url));
  assert.equal(init?.headers?.Authorization, "Bearer token-secreto");
  assert.doesNotMatch(String(url), /token-secreto/, "o token nao pode aparecer na URL");
  return new Response(JSON.stringify(String(url).endsWith("/limits") ? limits : user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
try {
  const live = await consultarContaFinanceiraApify("token-secreto");
  assert.equal(live.situacao, "ok");
  assert.deepEqual(endpoints.sort(), [
    "https://api.apify.com/v2/users/me",
    "https://api.apify.com/v2/users/me/limits",
  ]);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("OK: credito, uso, limite duro e deduplicacao por conta Apify estao coerentes.");
