// Suite: CORS das Edge Functions de WhatsApp chamadas pelo navegador.
// Invariante: TODA resposta (2xx, 4xx e 5xx) e o preflight carregam Access-Control-Allow-Origin do
// domínio oficial. Sem isso o navegador bloqueia a LEITURA da resposta, esconde o resultado real
// (a mensagem já tinha saído) e o atendente reenvia.
// Boundary IN: contrato do módulo compartilhado e do código de cada função.
// Boundary OUT: gateway da Supabase e rede, provados por chamada real em produção.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { corsHeaders, corsPreflightResponse, json } from "./cors.ts";

const ORIGEM_OFICIAL = "https://business.flowgenius.com.br";
const requisicao = (origem = ORIGEM_OFICIAL, metodo = "POST") =>
  new Request("https://projeto.supabase.co/functions/v1/wa-responder", {
    method: metodo,
    headers: { origin: origem },
  });

test("responses of every status carry the official origin when built with the request", () => {
  for (const status of [200, 201, 401, 403, 409, 422, 500, 503]) {
    const resposta = json({ ok: status < 400 }, status, requisicao());
    assert.equal(resposta.status, status);
    assert.equal(
      resposta.headers.get("access-control-allow-origin"),
      ORIGEM_OFICIAL,
      String(status),
    );
    assert.equal(resposta.headers.get("content-type"), "application/json");
  }
});

test("the preflight accepts the official origin and the headers the browser sends", () => {
  const preflight = corsPreflightResponse(requisicao(ORIGEM_OFICIAL, "OPTIONS"));
  assert.equal(preflight.status, 200);
  assert.equal(preflight.headers.get("access-control-allow-origin"), ORIGEM_OFICIAL);
  const permitidos = String(preflight.headers.get("access-control-allow-headers")).toLowerCase();
  for (const cabecalho of ["authorization", "apikey", "content-type", "x-client-info"]) {
    assert.ok(permitidos.includes(cabecalho), cabecalho);
  }
  assert.match(String(preflight.headers.get("access-control-allow-methods")), /POST/);
});

test("an unknown origin is never authorized and a response without the request has no origin", () => {
  assert.equal(
    json({}, 200, requisicao("https://site-malicioso.invalid")).headers.get(
      "access-control-allow-origin",
    ),
    null,
  );
  // Era exatamente o defeito: json(body, status) sem a requisição não tem como saber a origem.
  assert.equal(json({}, 500).headers.get("access-control-allow-origin"), null);
  assert.equal(corsHeaders().Vary, "Origin");
});

/** Nomes das Edge Functions de WhatsApp que o navegador chama (lidos do código do front). */
function funcoesChamadasPeloNavegador(): string[] {
  const nomes = new Set<string>();
  for (const arquivo of readdirSync("src/services").filter((nome) => nome.endsWith(".ts"))) {
    const codigo = readFileSync(`src/services/${arquivo}`, "utf8");
    for (const m of codigo.matchAll(
      /(?:invoke|invokeWhatsappEdge)(?:<[^>]*>)?\(\s*"([a-z0-9-]+)"/g,
    )) {
      nomes.add(m[1]);
    }
    for (const m of codigo.matchAll(/functionName:\s*((?:"[a-z0-9-]+"\s*\|?\s*)+)/g)) {
      for (const n of m[1].matchAll(/"([a-z0-9-]+)"/g)) nomes.add(n[1]);
    }
  }
  return [...nomes].filter((nome) => /^(wa-|send-proposal-wa$)/.test(nome)).sort();
}

/** Argumentos (texto bruto) de cada chamada a json( ), com parênteses balanceados. */
function chamadasJson(codigo: string): string[] {
  const limpo = codigo.replace(/\/\/[^\n]*/g, "");
  const chamadas: string[] = [];
  const padrao = /(?<![\w.])json\(/g;
  let m: RegExpExecArray | null;
  while ((m = padrao.exec(limpo))) {
    let profundidade = 1;
    let i = m.index + m[0].length;
    const inicio = i;
    while (i < limpo.length && profundidade > 0) {
      const c = limpo[i];
      if (c === "(") profundidade++;
      else if (c === ")") profundidade--;
      i++;
    }
    chamadas.push(limpo.slice(inicio, i - 1));
  }
  return chamadas;
}

test("the browser-called WhatsApp functions are discovered from the front-end code", () => {
  const funcoes = funcoesChamadasPeloNavegador();
  for (const esperado of ["wa-chips", "wa-conversations", "wa-responder", "wa-campaign-control"]) {
    assert.ok(
      funcoes.includes(esperado),
      `${esperado} deveria ser detectada (${funcoes.join(", ")})`,
    );
  }
});

test("every browser-called WhatsApp function binds CORS to the request in ALL its responses", () => {
  const funcoes = funcoesChamadasPeloNavegador().filter((nome) =>
    existsSync(`supabase/functions/${nome}/index.ts`),
  );
  assert.ok(funcoes.length >= 4);
  for (const nome of funcoes) {
    const codigo = readFileSync(`supabase/functions/${nome}/index.ts`, "utf8");
    const comWrapper =
      /const json = \(\s*body: unknown,\s*status = 200\s*\)\s*=>\s*jsonResponse\(body, status, req\)/.test(
        codigo,
      );
    if (comWrapper) {
      // Com o wrapper local, o json importado só pode aparecer renomeado (jsonResponse).
      assert.match(codigo, /json as jsonResponse/, nome);
      continue;
    }
    // Sem wrapper: cada chamada a json(...) precisa passar a requisição como último argumento.
    for (const argumentos of chamadasJson(codigo)) {
      assert.match(
        argumentos,
        /\breq\s*,?\s*$/,
        `${nome}: json(${argumentos.slice(0, 60)}…) sem req`,
      );
    }
  }
});

test("wa-responder answers 2xx, 4xx and 5xx through the bound helper, including an unexpected crash", () => {
  const codigo = readFileSync("supabase/functions/wa-responder/index.ts", "utf8");
  assert.match(
    codigo,
    /Deno\.serve\(async \(req\) => \{\s*try \{\s*return await handleRequest\(req\);/,
  );
  assert.match(codigo, /catch \(error\) \{[\s\S]*jsonResponse\([\s\S]*500,\s*req,?\s*\)/);
  assert.match(
    codigo,
    /req\.method === "OPTIONS"\) return new Response\("ok", \{ headers: corsHeaders\(req\) \}/,
  );
  // Nunca desabilitar JWT nem abrir a função.
  assert.match(
    readFileSync("supabase/config.toml", "utf8"),
    /\[functions\.wa-responder\][\s\S]*?verify_jwt\s*=\s*true/,
  );
});
