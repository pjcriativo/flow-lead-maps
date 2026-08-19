// Smoke test PAGO do Instagram em produção.
// Invariant: uma solicitação abre no máximo um run e retorna somente leads IG qualificados.
// Boundary IN: Edge/Supabase/Apify reais com sessão do dono.
// Boundary OUT: interface visual do navegador.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
const { createClient } = require("@supabase/supabase-js");

for (const line of readFileSync(join(PROJ, ".env"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!match) continue;
  let value = match[2].trim();
  if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
  if (!(match[1] in process.env)) process.env[match[1]] = value;
}

const URL_SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });

async function sessao(email) {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const anon = createClient(URL_SB, ANON, { auth: { persistSession: false } });
  const { data, error: otpError } = await anon.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (otpError || !data.session) throw otpError ?? new Error("Sessão não criada");
  return data.session.access_token;
}

async function chamar(jwt, body) {
  const response = await fetch(`${URL_SB}/functions/v1/buscar-redes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      apikey: ANON,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { status: response.status, data };
}

const requestId = process.env.IG_REQUEST_ID || crypto.randomUUID();
const jwt = await sessao("marcosg1.pereira@gmail.com");
const pedido = {
  acao: "buscar",
  requestId,
  estrategia: "IG-LOCAL",
  campos: {
    nicho: "Pizzaria",
    cidade: "Maringá",
    uf: "PR",
    minSeguidores: 100,
    soComerciais: true,
    exigirLocalidade: true,
    semSiteProprio: false,
    exigirContatoExterno: false,
  },
  limite: 5,
};

console.log(
  `${process.env.IG_REQUEST_ID ? "Recuperando" : "Iniciando run real"} IG-LOCAL requestId=${requestId}…`,
);
const inicio = Date.now();
let resposta = process.env.IG_REQUEST_ID
  ? await chamar(jwt, { acao: "recuperar", requestId })
  : await chamar(jwt, pedido);
console.log(
  `Primeira resposta: HTTP ${resposta.status} em ${((Date.now() - inicio) / 1000).toFixed(1)}s`,
);

const deadline = Date.now() + 10 * 60 * 1000;
while ((resposta.status >= 500 || resposta.data?.pendente) && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 4_000));
  resposta = await chamar(jwt, { acao: "recuperar", requestId });
  console.log(`Recuperação: HTTP ${resposta.status} · ${resposta.data?.status ?? "final"}`);
}

assert.equal(resposta.status, 200, JSON.stringify(resposta.data));
assert.equal(resposta.data?.ok, true, JSON.stringify(resposta.data));
assert.equal(resposta.data?.estrategia, "IG-LOCAL");
assert.equal(resposta.data?.resumo?.analisados, resposta.data?.encontrados);

const repetida = await chamar(jwt, { acao: "recuperar", requestId });
assert.equal(repetida.status, 200);
assert.deepEqual(
  repetida.data?.leadIds,
  resposta.data?.leadIds,
  "recuperação deve ser idempotente",
);

const { data: ledger, error: ledgerError } = await admin
  .from("redes_buscas")
  .select(
    "id, request_id, fonte, estrategia, status, custo_usd, encontrados, inseridos, apify_run_id, apify_dataset_id, resultado, detalhe",
  )
  .eq("request_id", requestId)
  .single();
if (ledgerError) throw ledgerError;
assert.equal(ledger.fonte, "instagram");
assert.equal(ledger.estrategia, "IG-LOCAL");
assert.ok(["concluida", "parada_teto"].includes(ledger.status));
assert.ok(ledger.resultado, "resultado final deve estar persistido");

const ids = resposta.data?.leadIds ?? [];
let leads = [];
if (ids.length > 0) {
  const { data, error } = await admin
    .from("leads")
    .select(
      "id, place_id, business_name, origem_fonte, origem_estrategia, instagram_url, city, state, seguidores, score, score_breakdown, rating, review_count",
    )
    .in("id", ids);
  if (error) throw error;
  leads = data ?? [];
  assert.equal(leads.length, ids.length);
  for (const lead of leads) {
    assert.ok(lead.place_id?.startsWith("ig:"));
    assert.equal(lead.origem_fonte, "instagram");
    assert.equal(lead.origem_estrategia, "IG-LOCAL");
    assert.equal(lead.score_breakdown?.tipo, "aderencia_instagram");
    assert.equal(lead.rating, null);
    // A coluna compartilhada tem default 0; a busca IG não a usa nem a exibe.
    assert.equal(lead.review_count, 0);
  }
}

console.log("\nRESULTADO FINAL");
console.log(JSON.stringify(resposta.data, null, 2));
console.log("\nLIVRO-CAIXA");
console.table([
  {
    status: ledger.status,
    run: ledger.apify_run_id,
    analisados: ledger.encontrados,
    inseridos: ledger.inseridos,
    custo_usd: Number(ledger.custo_usd),
    detalhe: ledger.detalhe,
  },
]);
if (leads.length) {
  console.log("\nLEADS INSERIDOS");
  console.table(
    leads.map((lead) => ({
      empresa: lead.business_name,
      cidade: lead.city,
      seguidores: lead.seguidores,
      aderencia: lead.score,
      instagram: lead.instagram_url,
    })),
  );
}

console.log("\nOK: smoke test pago do Instagram concluído com evidência do banco.");
