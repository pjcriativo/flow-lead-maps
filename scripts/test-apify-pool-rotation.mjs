#!/usr/bin/env node
// Suite: rodizio do pool Apify quando uma chave esgota no meio do run
// Invariant: a chave sem credito sai do pool persistente antes de a proxima rodada iniciar.
// Boundary IN: criterio real, tratamento do run morto e gravacao de status/auditoria.
// Boundary OUT: rede Apify e PostgreSQL reais; somente essas fronteiras externas sao simuladas.
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
  entryPoints: [join(project, "supabase/functions/_shared/apify-pool.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
  plugins: [
    {
      name: "http-external",
      setup(builder) {
        builder.onResolve({ filter: /^https?:\/\// }, (args) => ({
          path: args.path,
          external: true,
        }));
      },
    },
  ],
});
const directory = mkdtempSync(join(tmpdir(), "apify-pool-rotation-"));
const modulePath = join(directory, "apify-pool.mjs");
writeFileSync(modulePath, output.outputFiles[0].text);
const { tratarRunMorto } = await import(pathToFileURL(modulePath).href);

const calls = [];
function query(table) {
  let operation = "select";
  const chain = {
    select(columns, options) {
      operation = options?.head ? "head" : operation;
      calls.push({ table, action: "select", columns });
      return chain;
    },
    update(payload) {
      operation = "update";
      calls.push({ table, action: "update", payload });
      return chain;
    },
    insert(payload) {
      operation = "insert";
      calls.push({ table, action: "insert", payload });
      return chain;
    },
    eq(field, value) {
      calls.push({ table, action: "eq", field, value });
      return chain;
    },
    async maybeSingle() {
      return { data: table === "apify_chaves" ? { apelido: "sem-saldo" } : null, error: null };
    },
    async single() {
      return { data: table === "notificacoes" ? { id: "notif-1" } : null, error: null };
    },
    then(resolve, reject) {
      let result = { data: null, error: null };
      if (table === "apify_chaves" && operation === "head") result = { ...result, count: 1 };
      if (table === "profiles") result = { data: [{ id: "admin-1" }], error: null };
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return chain;
}
const admin = { from: query };

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  assert.match(String(url), /\/users\/me\/limits/);
  return new Response(
    JSON.stringify({
      data: {
        limits: { maxMonthlyUsageUsd: 5 },
        current: { monthlyUsageUsd: 5 },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

try {
  const verdict = await tratarRunMorto(
    admin,
    { id: "key-1", apelido: "sem-saldo", token: "token-de-teste" },
    "ABORTED",
    false,
  );
  assert.equal(verdict, "trocar_chave");
  assert.ok(
    calls.some(
      (call) =>
        call.table === "apify_chaves" &&
        call.action === "update" &&
        call.payload?.status === "esgotada",
    ),
    "a chave esgotada precisa sair do pool antes da proxima rodada",
  );
  assert.ok(
    calls.some(
      (call) =>
        call.table === "apify_chaves_auditoria" &&
        call.action === "insert" &&
        call.payload?.acao === "esgotada_automatico",
    ),
    "a rotacao automatica precisa ficar registrada na auditoria",
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("OK: chave sem saldo sai do pool e a proxima rodada pode usar a chave seguinte.");
