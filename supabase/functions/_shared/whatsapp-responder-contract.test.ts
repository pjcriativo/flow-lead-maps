// Suite: contrato do envio manual (wa-responder) e do envio ao provedor.
// Invariante: resultado estruturado e sanitizado, idempotência por operação antes de qualquer
// validação de saúde, chip sempre o da conversa, e nenhum envio fica pendurado sem prazo.
// Boundary IN: contrato do código e envio ao provedor com fetch simulado.
// Boundary OUT: Evolution GO real — a confirmação de entrega só é declarada com evento dela.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const responder = readFileSync("supabase/functions/wa-responder/index.ts", "utf8");
const webhook = readFileSync("supabase/functions/wa-webhook/index.ts", "utf8");
const wa = readFileSync("supabase/functions/_shared/wa.ts", "utf8");

test("every registered outcome returns the structured result with no credential", () => {
  for (const campo of [
    "operation_id: operationId",
    "message_id: mensagem.id",
    "external_id: mensagem.externo_id ?? null",
    "status: mensagem.status as EstadoEnvio",
    "occurred_at:",
  ]) {
    assert.ok(responder.includes(campo), campo);
  }
  // Nunca devolve token da instância nem o payload bruto do provedor.
  assert.doesNotMatch(responder, /json\([^)]*token|resultado\([^)]*token|\.token\b[^;]*json/);
  assert.doesNotMatch(responder, /provider_response|sent\.data\)?\s*[,}]/);
});

test("the same operation id returns the stored state before any health check or send", () => {
  const jaRegistrada = responder.indexOf('.eq("client_operation_id", operationId)');
  const saude = responder.indexOf("const carregarSaude");
  const envio = responder.indexOf("enviarTextoInstancia(instance.token");
  assert.ok(jaRegistrada > 0 && jaRegistrada < saude && saude < envio);
  assert.match(responder, /duplicate: true/);
});

test("provider acceptance alone is never reported as delivered or read", () => {
  // O responder só grava 'sent' (confirmação do servidor do WhatsApp); delivered/read vêm do webhook.
  // Ao enviar, só são gravados sent/failed/uncertain; delivered/read são apenas LIDOS de um
  // registro anterior (operação repetida).
  assert.match(
    responder,
    /status: "sent" \| "failed" \| "uncertain",\s*externalId: string \| null,/,
  );
  assert.doesNotMatch(responder, /p_status: "(delivered|read)"|finalizar\(\s*"(delivered|read)"/);
  assert.match(webhook, /normalizeReceiptEvent/);
  assert.match(webhook, /aplicarStatusDoProvedor/);
});

test("only a refusal before the record is a 4xx; a crash is a JSON 500 with CORS", () => {
  assert.match(responder, /const recusa = \(error: string, status: number, code\?: string\)/);
  assert.match(responder, /code: "erro_interno"/);
  assert.match(responder, /ok: false, error, \.\.\.\(code \? \{ code \} : \{\}\)/);
});

test("the provider send has a deadline and a hung provider becomes an uncertain result", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  // Provedor que nunca responde: só encerra quando o sinal de aborto dispara.
  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const erro = new Error("aborted");
        erro.name = "AbortError";
        reject(erro);
      });
    });
  try {
    const { enviarTextoInstancia } = await import("./wa.ts");
    const inicio = Date.now();
    await assert.rejects(
      enviarTextoInstancia("token-da-instancia", "5541999990001", "oi", 40),
      (erro: unknown) => erro instanceof Error && erro.name === "AbortError",
    );
    assert.ok(Date.now() - inicio < 2_000, "não pode ficar pendurado");
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
  // E o responder trata essa exceção como INCERTO, jamais como falha definitiva.
  assert.match(responder, /await finalizar\(\s*"uncertain"/);
  assert.match(wa, /clearTimeout\(timer\)/);
});
