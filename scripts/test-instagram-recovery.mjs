// Suite: recuperação de coleta Instagram após timeout HTTP
// Invariant: recuperar consulta o run persistido e nunca inicia um segundo run pago.
// Boundary IN: contrato da Edge, persistência do run e polling do cliente.
// Boundary OUT: execução real do Actor e rede da Apify.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const edge = readFileSync("supabase/functions/buscar-redes/index.ts", "utf8");
const service = readFileSync("src/services/whatsapp.ts", "utf8");
const migration = readFileSync("supabase/migrations/078_redes_buscas_recovery.sql", "utf8");

const recuperar = edge.slice(
  edge.indexOf('if (acao === "recuperar")'),
  edge.indexOf("// ---------- BUSCAR ----------"),
);

assert.ok(recuperar.includes("actor-runs/${registro.apify_run_id}"));
assert.ok(recuperar.includes("datasets/${datasetId}/items"));
assert.ok(!recuperar.includes("startRunComPool"), "recuperação não pode abrir outro run pago");
assert.ok(edge.includes("apify_run_id: runId"), "run deve ser persistido antes da espera longa");
assert.ok(service.includes('acao: "recuperar", requestId'));
assert.ok(!service.includes('body: { acao: "buscar", requestId }'));
assert.ok(migration.includes("redes_buscas_user_request_key"));

console.log("OK: timeout recupera o mesmo run sem repetir cobrança.");
