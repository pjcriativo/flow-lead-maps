// Suite: adaptador da OpenAI (Responses API) com fetch SIMULADO — nenhuma chamada de rede, nenhum custo.
// Invariante: o pedido é stateless (store:false), usa function calling no formato da API, preserva itens de
// raciocínio entre passos, conta tokens, classifica erros e NUNCA deixa a chave vazar em mensagens.
// Boundary IN: ai-openai.ts. Boundary OUT: a API real (validação pós-autorização, fora desta suíte).
import test from "node:test";
import assert from "node:assert/strict";
import {
  OPENAI_BASE,
  chamarOpenAI,
  construirPedidoResponses,
  lerRespostaResponses,
  listarModelosOpenAI,
  paraFerramentasOpenAI,
  paraItensDeEntrada,
} from "./ai-openai.ts";
import { ModeloErro, type ChamadaModelo } from "./agent-ceo-turn.ts";
import { anthropicToolSchemas, TOOL_REGISTRY } from "./agent-tools.ts";

const CHAVE = "sk-proj-SEGREDO0123456789ABCDEFGHIJKLMNOP";
const base = (over: Partial<ChamadaModelo> = {}): ChamadaModelo => ({
  modelo: "modelo-qualquer",
  system: "Você é o CEO.",
  mensagens: [{ role: "user", content: "Analise minha empresa." }],
  maxTokensSaida: 800,
  tools: [],
  ...over,
});
const resp = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

test("pedido: stateless (store:false), instruções do sistema, limite de saída e raciocínio criptografado", () => {
  const p = construirPedidoResponses(base());
  assert.equal(p.model, "modelo-qualquer");
  assert.equal(p.instructions, "Você é o CEO.");
  assert.equal(p.store, false);
  assert.equal(p.max_output_tokens, 800);
  assert.deepEqual(p.include, ["reasoning.encrypted_content"]);
  assert.deepEqual(p.input, [{ role: "user", content: "Analise minha empresa." }]);
  assert.equal("tools" in p, false, "sem ferramentas autorizadas, nenhuma é enviada");
  assert.equal("temperature" in p, false);
});

test("function calling: só as ferramentas autorizadas viram function tools com o mesmo schema", () => {
  const tools = anthropicToolSchemas(
    TOOL_REGISTRY.filter((t) => t.nome === "consultar_oportunidades"),
  );
  const fn = paraFerramentasOpenAI(tools);
  assert.equal(fn.length, 1);
  assert.equal(fn[0].type, "function");
  assert.equal(fn[0].name, "consultar_oportunidades");
  assert.deepEqual(fn[0].parameters, tools[0].input_schema);
  const p = construirPedidoResponses(base({ tools }));
  assert.equal(p.tool_choice, "auto");
  assert.equal(p.tools.length, 1);
});

test("histórico: uso de ferramenta vira function_call e o resultado function_call_output; 'raw' é reenviado como veio", () => {
  const itens = paraItensDeEntrada(
    base({
      mensagens: [
        { role: "user", content: "oi" },
        {
          role: "assistant",
          text: "vou consultar",
          toolUses: [{ id: "call_1", name: "consultar_pipeline", input: {} }],
        },
        { role: "user", toolResults: [{ id: "call_1", content: '{"ok":1}', isError: false }] },
      ],
    }),
  );
  assert.deepEqual(itens[1], { role: "assistant", content: "vou consultar" });
  assert.deepEqual(itens[2], {
    type: "function_call",
    call_id: "call_1",
    name: "consultar_pipeline",
    arguments: "{}",
  });
  assert.deepEqual(itens[3], {
    type: "function_call_output",
    call_id: "call_1",
    output: '{"ok":1}',
  });

  const raw = [
    { type: "reasoning", id: "rs_1", encrypted_content: "xyz", summary: [] },
    { type: "function_call", call_id: "call_2", name: "consultar_pipeline", arguments: "{}" },
  ];
  const comRaw = paraItensDeEntrada(
    base({
      mensagens: [
        {
          role: "assistant",
          text: "",
          toolUses: [{ id: "call_2", name: "consultar_pipeline", input: {} }],
          raw,
        },
        { role: "user", toolResults: [{ id: "call_2", content: "{}", isError: false }] },
      ],
    }),
  );
  assert.deepEqual(comRaw.slice(0, 2), raw);
  assert.equal(comRaw[2].type, "function_call_output");
});

test("resposta: texto, function_call com argumentos JSON, tokens e itens opacos para o próximo passo", () => {
  const r = lerRespostaResponses({
    status: "completed",
    output: [
      { type: "reasoning", id: "rs_1", encrypted_content: "abc" },
      {
        type: "function_call",
        call_id: "call_9",
        name: "consultar_lead",
        arguments: '{"lead_id":"x"}',
      },
      {
        type: "message",
        content: [
          { type: "output_text", text: "Olá " },
          { type: "output_text", text: "mundo" },
        ],
      },
    ],
    usage: { input_tokens: 321, output_tokens: 45 },
  });
  assert.equal(r.texto, "Olá mundo");
  assert.deepEqual(r.toolUses, [{ id: "call_9", name: "consultar_lead", input: { lead_id: "x" } }]);
  assert.equal(r.tokensEntrada, 321);
  assert.equal(r.tokensSaida, 45);
  assert.equal(r.raw.length, 2);
  assert.equal(r.raw[0].type, "reasoning");
});

test("resposta: argumentos corrompidos viram {} (a validação de parâmetros do runtime bloqueia o uso)", () => {
  const r = lerRespostaResponses({
    output: [
      { type: "function_call", call_id: "c", name: "consultar_lead", arguments: "{quebrado" },
    ],
  });
  assert.deepEqual(r.toolUses[0].input, {});
});

test("resposta: falha/erro e 'incomplete' sem conteúdo viram ModeloErro; segredos são removidos", () => {
  assert.throws(
    () => lerRespostaResponses({ status: "failed", error: { message: `bad ${CHAVE}` } }),
    (e: unknown) => e instanceof ModeloErro && !e.message.includes("SEGREDO0123"),
  );
  assert.throws(
    () =>
      lerRespostaResponses({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [],
      }),
    (e: unknown) => e instanceof ModeloErro && e.status === 422,
  );
});

test("chamada: Authorization só no cabeçalho, corpo sem a chave, URL da Responses API, store:false", async () => {
  let visto: { url: string; init: RequestInit } | null = null;
  const fetcher = (async (url: string, init: RequestInit) => {
    visto = { url, init };
    return resp({
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }],
      usage: { input_tokens: 10, output_tokens: 2 },
    });
  }) as unknown as typeof fetch;
  const r = await chamarOpenAI(CHAVE, base(), { fetcher });
  assert.equal(r.texto, "ok");
  assert.equal(visto!.url, `${OPENAI_BASE}/responses`);
  assert.equal((visto!.init.headers as Record<string, string>).Authorization, `Bearer ${CHAVE}`);
  assert.ok(!String(visto!.init.body).includes("SEGREDO0123"), "a chave não vai no corpo");
  assert.equal(JSON.parse(String(visto!.init.body)).store, false);
});

test("erros: 401 com chave ecoada não vaza; 429/5xx são transitórios; 400 é permanente; timeout é 'incerto'", async () => {
  const falha = (status: number, msg: string) =>
    (async () => resp({ error: { message: msg } }, status)) as unknown as typeof fetch;
  await assert.rejects(
    () =>
      chamarOpenAI(CHAVE, base(), { fetcher: falha(401, `Incorrect API key provided: ${CHAVE}.`) }),
    (e: unknown) =>
      e instanceof ModeloErro && e.status === 401 && !e.message.includes("SEGREDO0123"),
  );
  await assert.rejects(
    () => chamarOpenAI(CHAVE, base(), { fetcher: falha(429, "rate") }),
    (e: unknown) => e instanceof ModeloErro && e.status === 429,
  );
  await assert.rejects(
    () => chamarOpenAI(CHAVE, base(), { fetcher: falha(503, "down") }),
    (e: unknown) => e instanceof ModeloErro && e.status === 503,
  );
  await assert.rejects(
    () => chamarOpenAI(CHAVE, base(), { fetcher: falha(400, "bad") }),
    (e: unknown) => e instanceof ModeloErro && e.status === 400,
  );
  const timeout = (async () => {
    throw new DOMException("t", "TimeoutError");
  }) as unknown as typeof fetch;
  await assert.rejects(
    () => chamarOpenAI(CHAVE, base(), { fetcher: timeout }),
    (e: unknown) => e instanceof ModeloErro && e.aborted === true,
  );
  const rede = (async () => {
    throw new TypeError("fetch failed");
  }) as unknown as typeof fetch;
  await assert.rejects(
    () => chamarOpenAI(CHAVE, base(), { fetcher: rede }),
    (e: unknown) => e instanceof ModeloErro && e.status === undefined && e.aborted === false,
  );
});

test("cancelamento: um AbortSignal já abortado interrompe a chamada", async () => {
  const ac = new AbortController();
  ac.abort();
  const fetcher = (async (_u: string, init: RequestInit) => {
    if (init.signal?.aborted) throw new DOMException("abort", "AbortError");
    return resp({});
  }) as unknown as typeof fetch;
  await assert.rejects(
    () => chamarOpenAI(CHAVE, base(), { fetcher, signal: ac.signal }),
    (e: unknown) => e instanceof ModeloErro && e.aborted === true,
  );
});

test("listagem de modelos: ids da API; erros traduzidos sem expor a chave", async () => {
  const ok = (async (u: string, init: RequestInit) => {
    assert.equal(u, `${OPENAI_BASE}/models`);
    assert.equal((init.headers as Record<string, string>).Authorization, `Bearer ${CHAVE}`);
    return resp({ data: [{ id: "gpt-x" }, { id: "text-embedding-z" }, { nada: 1 }] });
  }) as unknown as typeof fetch;
  assert.deepEqual(await listarModelosOpenAI(CHAVE, { fetcher: ok }), {
    ok: true,
    ids: ["gpt-x", "text-embedding-z"],
  });
  const f = (status: number) =>
    (async () => resp({ error: { message: CHAVE } }, status)) as unknown as typeof fetch;
  assert.deepEqual(await listarModelosOpenAI(CHAVE, { fetcher: f(401) }), {
    ok: false,
    status: 401,
    motivo: "chave_invalida_ou_revogada",
  });
  assert.deepEqual(await listarModelosOpenAI(CHAVE, { fetcher: f(403) }), {
    ok: false,
    status: 403,
    motivo: "chave_sem_permissao",
  });
  assert.deepEqual(await listarModelosOpenAI(CHAVE, { fetcher: f(429) }), {
    ok: false,
    status: 429,
    motivo: "limite_do_provedor",
  });
  const rede = (async () => {
    throw new Error("x");
  }) as unknown as typeof fetch;
  assert.deepEqual(await listarModelosOpenAI(CHAVE, { fetcher: rede }), {
    ok: false,
    status: null,
    motivo: "sem_resposta_do_provedor",
  });
});
