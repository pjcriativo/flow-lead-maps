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
    {
      name: "pool-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /cofre\.ts$/ }, () => ({
          path: "cofre",
          namespace: "pool-test",
        }));
        builder.onResolve({ filter: /chaves\.ts$/ }, () => ({
          path: "chaves",
          namespace: "pool-test",
        }));
        builder.onLoad({ filter: /.*/, namespace: "pool-test" }, (args) => ({
          contents:
            args.path === "cofre"
              ? "export async function decifrar(value) { return value; }"
              : "export async function resolverChave() { return null; }",
          loader: "js",
        }));
      },
    },
  ],
});
const directory = mkdtempSync(join(tmpdir(), "apify-pool-rotation-"));
const modulePath = join(directory, "apify-pool.mjs");
writeFileSync(modulePath, output.outputFiles[0].text);
const { startRunComPool, tratarRunMorto } = await import(pathToFileURL(modulePath).href);

const calls = [];
const rows = [
  {
    id: "key-a1",
    apelido: "conta-a-principal",
    valor_cifrado: "token-a1",
    status: "ativa",
    ordem: 1,
  },
  {
    id: "key-a2",
    apelido: "conta-a-duplicada",
    valor_cifrado: "token-a2",
    status: "ativa",
    ordem: 2,
  },
  {
    id: "key-b1",
    apelido: "conta-b",
    valor_cifrado: "token-b1",
    status: "ativa",
    ordem: 3,
  },
];
function query(table) {
  let operation = "select";
  let updatePayload = null;
  const filters = [];
  const matches = (row) =>
    filters.every((filter) =>
      filter.kind === "in"
        ? filter.values.includes(row[filter.field])
        : row[filter.field] === filter.value,
    );
  const chain = {
    select(columns, options) {
      operation = options?.head ? "head" : operation;
      calls.push({ table, action: "select", columns });
      return chain;
    },
    update(payload) {
      operation = "update";
      updatePayload = payload;
      calls.push({ table, action: "update", payload });
      return chain;
    },
    insert(payload) {
      operation = "insert";
      calls.push({ table, action: "insert", payload });
      return chain;
    },
    eq(field, value) {
      filters.push({ kind: "eq", field, value });
      calls.push({ table, action: "eq", field, value });
      return chain;
    },
    in(field, values) {
      filters.push({ kind: "in", field, values });
      calls.push({ table, action: "in", field, values });
      return chain;
    },
    order() {
      return chain;
    },
    async maybeSingle() {
      if (table === "apify_chaves" && operation === "update") {
        const row = rows.find(matches);
        if (!row) return { data: null, error: null };
        Object.assign(row, updatePayload);
        return { data: { apelido: row.apelido }, error: null };
      }
      return { data: null, error: null };
    },
    async single() {
      return { data: table === "notificacoes" ? { id: "notif-1" } : null, error: null };
    },
    then(resolve, reject) {
      let result = { data: null, error: null };
      if (table === "apify_chaves" && operation === "select") {
        result = {
          data: rows.filter(matches),
          error: null,
        };
      }
      if (table === "apify_chaves" && operation === "update") {
        const matched = rows.filter(matches);
        matched.forEach((row) => Object.assign(row, updatePayload));
        result = {
          data: matched.map((row) => ({ id: row.id, apelido: row.apelido })),
          error: null,
        };
      }
      if (table === "apify_chaves" && operation === "head") {
        result = {
          ...result,
          count: rows.filter(matches).length,
        };
      }
      if (table === "profiles") result = { data: [{ id: "admin-1" }], error: null };
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return chain;
}
const admin = { from: query };

function tokenFromHeaders(init) {
  const headers = init?.headers;
  const authorization =
    headers instanceof Headers ? headers.get("Authorization") : headers?.Authorization;
  return typeof authorization === "string" ? authorization.replace(/^Bearer\s+/, "") : "";
}

function accountResponse(token) {
  const accountId = token.startsWith("token-a") ? "account-a" : "account-b";
  return new Response(JSON.stringify({ data: { id: accountId } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).endsWith("/users/me")) return accountResponse(tokenFromHeaders(init));
  assert.match(String(url), /\/users\/me\/limits/);
  assert.ok(tokenFromHeaders(init), "o token de limites deve seguir no header Authorization");
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
    { id: "key-a1", apelido: "conta-a-principal", token: "token-a1" },
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
  assert.equal(
    rows.find((row) => row.id === "key-a2")?.status,
    "esgotada",
    "outro token da mesma conta precisa sair junto",
  );
  assert.equal(
    rows.find((row) => row.id === "key-b1")?.status,
    "ativa",
    "uma conta financeira diferente deve permanecer ativa",
  );
  assert.ok(
    calls.some(
      (call) =>
        call.table === "apify_chaves_auditoria" &&
        call.action === "insert" &&
        Array.isArray(call.payload) &&
        call.payload.length === 2 &&
        call.payload.every((item) => item.acao === "esgotada_automatico"),
    ),
    "a rotacao automatica precisa ficar registrada na auditoria",
  );
} finally {
  globalThis.fetch = originalFetch;
}

const restartAfterDeadRunCalls = [];
globalThis.fetch = async (url, init) => {
  restartAfterDeadRunCalls.push({ url: String(url), token: tokenFromHeaders(init) });
  return new Response(JSON.stringify({ data: { id: "run-b-after-dead-run" } }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
try {
  const restarted = await startRunComPool(admin, () => "https://start.test/run", {
    method: "POST",
  });
  assert.equal(restarted.ok, true);
  assert.equal(restarted.ok && restarted.chave.id, "key-b1");
  assert.deepEqual(restartAfterDeadRunCalls, [
    { url: "https://start.test/run", token: "token-b1" },
  ]);
} finally {
  globalThis.fetch = originalFetch;
}

for (const row of rows) row.status = "ativa";
calls.length = 0;
const startCalls = [];
globalThis.fetch = async (url, init) => {
  const target = String(url);
  if (target.endsWith("/users/me")) return accountResponse(tokenFromHeaders(init));
  if (target === "https://start.test/run") {
    assert.doesNotMatch(target, /token-/, "o token do start nao pode aparecer na URL");
    const token = tokenFromHeaders(init);
    startCalls.push(token);
    if (token === "token-a1") {
      return new Response(
        JSON.stringify({ error: { type: "not-enough-usage-to-run-paid-actor" } }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      );
    }
    if (token === "token-a2") throw new Error("token duplicado da conta esgotada foi tentado");
    return new Response(JSON.stringify({ data: { id: "run-b" } }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }
  throw new Error(`fetch inesperado: ${target}`);
};
try {
  const started = await startRunComPool(admin, () => "https://start.test/run", {
    method: "POST",
  });
  assert.equal(started.ok, true);
  assert.equal(started.ok && started.chave.id, "key-b1");
  assert.equal(started.ok && started.trocas, 1);
  assert.deepEqual(startCalls, ["token-a1", "token-b1"]);
} finally {
  globalThis.fetch = originalFetch;
}

for (const row of rows) row.status = "ativa";
const happyFetches = [];
globalThis.fetch = async (url, init) => {
  happyFetches.push({ url: String(url), token: tokenFromHeaders(init) });
  return new Response(JSON.stringify({ data: { id: "run-a" } }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
try {
  const started = await startRunComPool(admin, () => "https://start.test/run", {
    method: "POST",
  });
  assert.equal(started.ok, true);
  assert.deepEqual(happyFetches, [{ url: "https://start.test/run", token: "token-a1" }]);
} finally {
  globalThis.fetch = originalFetch;
}

for (const row of rows) row.status = "ativa";
let ambiguousStartCalls = 0;
globalThis.fetch = async (url) => {
  assert.equal(String(url), "https://start.test/run");
  ambiguousStartCalls++;
  throw new Error("a resposta do POST se perdeu");
};
try {
  const started = await startRunComPool(admin, () => "https://start.test/run", {
    method: "POST",
  });
  assert.equal(started.ok, false);
  assert.equal(!started.ok && started.reason, "falha_passageira");
  assert.equal(
    ambiguousStartCalls,
    1,
    "um POST ambiguo nao pode ser repetido e criar outro run pago",
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("OK: rodizio separa contas, pula saldo compartilhado e nao repete POST pago ambiguo.");
