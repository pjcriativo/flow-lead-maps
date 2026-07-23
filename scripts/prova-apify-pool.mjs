#!/usr/bin/env node
// PROVA ADVERSARIAL — POOL DE CHAVES APIFY (rodízio por esgotamento).
// BLOCO 1: critério PURO (apify-criterio.ts bundlado de verdade, padrão da bateria) contra
//          os SINAIS REAIS da Etapa 0 — inclusive os que NÃO podem marcar (permissão/404).
// BLOCO 2: produção — 403 p/ não-admin; 401 REAL da Apify marca 'invalida' (não 'esgotada');
//          reativação manual; RODÍZIO E2E com UMA busca mínima real (chave inválida na
//          frente → a real assume e a busca CONCLUI; livro-caixa registra a chave; aviso
//          criado); árbitro de limites ao vivo; todas indisponíveis → PARA com mensagem
//          clara; valor de chave NUNCA volta em texto puro. Cleanup completo (a chave real
//          importada FICA no pool — estado final desejado pelo dono).
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
const { build } = require("esbuild");
const { createClient } = require("@supabase/supabase-js");

for (const l of readFileSync(join(PROJ, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}
const URL_SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const OPTS = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_SB, SERVICE, OPTS);

let pass = 0,
  fail = 0;
const T = (c, n, e = "") => {
  if (c) {
    pass++;
    console.log(`  \x1b[32mOK\x1b[0m   · ${n}`);
  } else {
    fail++;
    console.log(`  \x1b[31mX\x1b[0m    · ${n}${e ? ` → ${e}` : ""}`);
  }
};
async function sessao(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return se.session.access_token;
}
const chamar = (jwt, body, fn = "admin-acoes") =>
  fetch(`${URL_SB}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  });
const chamarJson = (...a) => chamar(...a).then((r) => r.json());

const FAKE = "apify_api_PROVAINVALIDA0000000000000000000";
const T0 = new Date().toISOString();
let idInvalida = null;
let importouPrincipal = false;

try {
  console.log("\x1b[1m═══ BLOCO 1 — critério PURO (bundlado do TS real) ═══\x1b[0m");
  const out = await build({
    entryPoints: [join(PROJ, "supabase/functions/_shared/apify-criterio.ts")],
    bundle: true,
    format: "esm",
    write: false,
    platform: "neutral",
  });
  const tmp = mkdtempSync(join(tmpdir(), "apify-crit-"));
  const mod = join(tmp, "criterio.mjs");
  writeFileSync(mod, out.outputFiles[0].text);
  const { classificarErroApify, creditoRestanteDeLimits, runMortoSuspeito } = await import(
    pathToFileURL(mod).href
  );

  const casos = [
    // [status, corpo, esperado, descrição]
    [403, { error: { type: "platform-feature-disabled", message: "Monthly usage hard limit exceeded" } }, "esgotada", "403 limite mensal estourado (sinal REAL observado) → esgotada"],
    [402, { error: { type: "x402-payment-required", message: "payment required" } }, "esgotada", "402 payment required (doc oficial do POST /runs) → esgotada"],
    [400, { error: { type: "not-enough-usage-to-run-paid-actor", message: "not enough usage" } }, "esgotada", "crédito insuficiente p/ ator PAGO → esgotada"],
    [401, { error: { type: "user-or-token-not-found", message: "User was not found or authentication token is not valid" } }, "invalida", "401 real (capturado pelo probe) → invalida, NUNCA esgotada"],
    [401, { error: { type: "token-not-provided", message: "Authentication token was not provided" } }, "invalida", "401 token ausente → invalida"],
    [429, { error: { type: "rate-limit-exceeded", message: "You have exceeded the rate limit" } }, "passageira", "429 rate limit → passageira (retry na MESMA chave, não marca)"],
    [500, {}, "passageira", "5xx → passageira (não marca)"],
    [0, "fetch failed", "passageira", "falha de rede → passageira (não marca)"],
    [408, { error: { type: "run-timeout-exceeded" } }, "passageira", "408 timeout de endpoint → passageira"],
    [200, { error: { type: "concurrent-runs-limit-exceeded" } }, "passageira", "concorrência estourada → passageira (resolve sozinho, NÃO é crédito)"],
    [403, { error: { type: "insufficient-permissions", message: "You do not have permission to perform this action" } }, "outro", "403 de PERMISSÃO → outro (marcar aqui queimaria o pool à toa)"],
    [404, { error: { type: "record-not-found", message: "Actor with this name was not found" } }, "outro", "404 ator inexistente → outro (erro da operação, não da chave)"],
    [400, { error: { type: "invalid-input", message: "Input is not valid" } }, "outro", "400 input inválido → outro"],
  ];
  for (const [status, corpo, esperado, desc] of casos) {
    const got = classificarErroApify(status, corpo);
    T(got === esperado, desc, `veio "${got}"`);
  }

  // árbitro: parser do /users/me/limits com o SHAPE REAL capturado pelo probe
  const limitsReal = {
    data: {
      limits: { maxMonthlyUsageUsd: 5 },
      current: { monthlyUsageUsd: 3.874373555629187 },
    },
  };
  const restante = creditoRestanteDeLimits(limitsReal);
  T(
    restante !== null && Math.abs(restante - 1.1256264443708128) < 1e-9,
    "creditoRestanteDeLimits lê o shape REAL do endpoint (probe) — restante = max − uso",
    String(restante),
  );
  T(creditoRestanteDeLimits({}) === null, "limits ilegível → null (nunca chuta)");

  T(runMortoSuspeito("ABORTED", false) === true, "run ABORTED que NÃO abortamos → suspeito (vai ao árbitro)");
  T(runMortoSuspeito("ABORTED", true) === false, "run ABORTED por NÓS (teto) → não é suspeito (não marca chave)");
  T(runMortoSuspeito("SUCCEEDED", false) === false, "run SUCCEEDED → nunca suspeito");

  console.log("\n\x1b[1m═══ BLOCO 2 — produção (rodízio de verdade) ═══\x1b[0m");
  const jwtDono = await sessao("marcosg1.pereira@gmail.com");
  const jwtFora = await sessao("gevieskiagency@gmail.com");

  // 1) guard
  const rF1 = await chamar(jwtFora, { acao: "apify_pool_listar" });
  T(rF1.status === 403, "não-super-admin → 403 em apify_pool_listar");
  const rF2 = await chamar(jwtFora, { acao: "apify_chave_add", apelido: "x", valor: FAKE });
  T(rF2.status === 403, "não-super-admin → 403 em apify_chave_add");

  // 2) add chave FAKE + mascaramento
  const rAdd = await chamarJson(jwtDono, {
    acao: "apify_chave_add",
    apelido: "prova-invalida",
    valor: FAKE,
  });
  T(rAdd.ok === true && !JSON.stringify(rAdd).includes(FAKE), "add não ecoa o valor da chave");
  const rL1 = await chamarJson(jwtDono, { acao: "apify_pool_listar" });
  const linhaFake = (rL1.chaves ?? []).find((c) => c.apelido === "prova-invalida");
  idInvalida = linhaFake?.id ?? null;
  T(
    !!linhaFake &&
      linhaFake.ultimos4 === FAKE.slice(-4) &&
      !JSON.stringify(rL1).includes(FAKE),
    "pool_listar mostra só últimos4/status — o valor NUNCA volta",
  );
  const { data: noBanco } = await admin
    .from("apify_chaves")
    .select("valor_cifrado")
    .eq("id", idInvalida)
    .maybeSingle();
  T(
    !!noBanco?.valor_cifrado && !noBanco.valor_cifrado.includes(FAKE),
    "no BANCO a chave está cifrada (dump da tabela não revela o valor)",
  );

  // 3) testar chave fake → 401 REAL da Apify → 'invalida' (não 'esgotada')
  const rTeste = await chamarJson(jwtDono, { acao: "apify_chave_testar", id: idInvalida });
  T(
    rTeste.ok === true && rTeste.situacao === "invalida",
    "Testar chave: 401 REAL da Apify → situacao 'invalida'",
    JSON.stringify(rTeste),
  );
  const rL2 = await chamarJson(jwtDono, { acao: "apify_pool_listar" });
  T(
    (rL2.chaves ?? []).find((c) => c.id === idInvalida)?.status === "invalida",
    "status virou 'invalida' — NÃO 'esgotada' (é erro de cadastro, não crédito)",
  );
  T(
    (rL2.auditoria ?? []).some((a) => a.apelido === "prova-invalida" && a.acao === "invalida_teste"),
    "auditoria registrou a invalidação (quem/quando)",
  );

  // 4) reativação manual (chave esgotada/invalida só volta pela mão do admin — sem automação)
  const rReat = await chamarJson(jwtDono, {
    acao: "apify_chave_status",
    id: idInvalida,
    status: "ativa",
  });
  T(rReat.ok === true, "reativação manual funciona (sem automação de reset — decisão do dono)");

  // 5) importa a chave REAL do cofre pro pool (valor nunca sai do servidor).
  //    Idempotente: re-execução da prova encontra a 'principal' já lá (apelido_duplicado).
  const rImp = await chamarJson(jwtDono, {
    acao: "apify_chave_importar_secret",
    apelido: "principal",
  });
  importouPrincipal = rImp.ok === true || rImp.reason === "apelido_duplicado";
  T(
    importouPrincipal,
    "chave real importada do cofre pro pool (plaintext nunca trafegou)",
    JSON.stringify(rImp),
  );

  // garante a ORDEM do cenário: a chave inválida tem que ser a 1ª do rodízio
  for (let i = 0; i < 4; i++) {
    const rOrd = await chamarJson(jwtDono, { acao: "apify_pool_listar" });
    const idx = (rOrd.chaves ?? []).findIndex((c) => c.id === idInvalida);
    if (idx <= 0) break;
    await chamarJson(jwtDono, { acao: "apify_chave_ordem", id: idInvalida, direcao: "subir" });
  }

  // árbitro AO VIVO na chave real: /users/me/limits com crédito > 0 → jamais marcaria
  const rL3 = await chamarJson(jwtDono, { acao: "apify_pool_listar" });
  const principal = (rL3.chaves ?? []).find((c) => c.apelido === "principal");
  const rTesteReal = await chamarJson(jwtDono, { acao: "apify_chave_testar", id: principal?.id });
  T(
    rTesteReal.ok === true && rTesteReal.situacao === "ok" && rTesteReal.restante > 0,
    `árbitro (limits) AO VIVO na chave real: US$ ${Number(rTesteReal.restante ?? 0).toFixed(2)} restantes — com crédito, NUNCA marca`,
    JSON.stringify(rTesteReal),
  );

  // 6) RODÍZIO E2E com gasto MÍNIMO real: chave inválida na ordem 0 → a real assume e a
  //    busca CONCLUI (IG-5, limite=1 — centavos; o necessário pra provar, dentro do teto).
  const rBusca = await chamarJson(
    jwtDono,
    {
      acao: "buscar",
      estrategia: "IG-5",
      campos: { nicho: "barbearia", cidade: "Curitiba" },
      limite: 1,
    },
    "buscar-redes",
  );
  T(
    rBusca.ok === true,
    "busca REAL concluiu APESAR da 1ª chave ser inválida (a operação NÃO caiu)",
    JSON.stringify(rBusca).slice(0, 200),
  );
  T(
    rBusca.chaveApelido === "principal",
    "quem pagou foi a chave 'principal' (a 2ª do rodízio) — troca automática no start",
    String(rBusca.chaveApelido),
  );
  T(
    Number(rBusca.trocasDeChave ?? 0) >= 1,
    "resposta reporta a(s) troca(s) de chave — o usuário vê, sem susto",
    String(rBusca.trocasDeChave),
  );
  const rL4 = await chamarJson(jwtDono, { acao: "apify_pool_listar" });
  T(
    (rL4.chaves ?? []).find((c) => c.id === idInvalida)?.status === "invalida",
    "a chave inválida foi marcada AUTOMATICAMENTE durante a busca",
  );
  T(
    (rL4.auditoria ?? []).some(
      (a) => a.apelido === "prova-invalida" && a.acao === "invalida_automatico",
    ),
    "auditoria da marcação automática registrada",
  );
  const { data: registro } = await admin
    .from("redes_buscas")
    .select("chave_apelido, status, custo_usd")
    .eq("estrategia", "IG-5")
    .gte("criado_em", T0)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  T(
    registro?.chave_apelido === "principal",
    `LIVRO-CAIXA registra QUAL chave gastou (custo real US$ ${Number(registro?.custo_usd ?? 0).toFixed(4)})`,
    JSON.stringify(registro),
  );
  const { data: aviso } = await admin
    .from("notificacoes")
    .select("id, titulo")
    .ilike("titulo", "%prova-invalida%")
    .gte("criado_em", T0)
    .limit(1)
    .maybeSingle();
  T(!!aviso, "aviso VISÍVEL criado pro dono (notificação in-app) na marcação automática");

  // 7) TODAS indisponíveis → PARA com mensagem clara (nunca calado)
  await chamarJson(jwtDono, {
    acao: "apify_chave_status",
    id: principal?.id,
    status: "desativada",
  });
  const rTodas = await chamar(jwtDono, { acao: "verificar" }, "buscar-redes");
  const corpoTodas = await rTodas.json();
  T(
    rTodas.status === 503 && /esgotadas|indisponíveis/i.test(String(corpoTodas?.error ?? "")),
    "pool todo indisponível → PARA com mensagem clara (503), não falha calado",
    JSON.stringify(corpoTodas),
  );
  await chamarJson(jwtDono, { acao: "apify_chave_status", id: principal?.id, status: "ativa" });
  const rDepois = await chamar(jwtDono, { acao: "verificar" }, "buscar-redes");
  T(rDepois.status === 200, "reativou a principal → verificar volta a funcionar");
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e);
} finally {
  // ── CLEANUP ── (a chave "principal" FICA no pool — estado final desejado)
  if (idInvalida) {
    await admin.from("apify_chaves").delete().eq("id", idInvalida);
  }
  await admin.from("apify_chaves_auditoria").delete().eq("apelido", "prova-invalida");
  // avisos de teste (mencionam a chave de prova)
  const { data: notifs } = await admin
    .from("notificacoes")
    .select("id")
    .ilike("titulo", "%prova-invalida%")
    .gte("criado_em", T0);
  for (const n of notifs ?? []) {
    await admin.from("notificacao_destinatarios").delete().eq("notificacao_id", n.id);
    await admin.from("notificacoes").delete().eq("id", n.id);
  }
  // leads criados pela busca mínima (janela da prova) — o REGISTRO do livro-caixa fica
  // (gasto real tem que constar). Leads de teste saem.
  const { data: dono } = await admin
    .from("profiles")
    .select("id")
    .eq("email", "marcosg1.pereira@gmail.com")
    .maybeSingle();
  if (dono) {
    const { count } = await admin
      .from("leads")
      .delete({ count: "exact" })
      .eq("user_id", dono.id)
      .eq("origem_estrategia", "IG-5")
      .gte("created_at", T0);
    console.log(`  cleanup: ${count ?? 0} lead(s) de teste removido(s); livro-caixa preservado`);
  }
  const { data: sobrou } = await admin
    .from("apify_chaves")
    .select("apelido, status")
    .order("ordem");
  console.log(
    `  estado final do pool: ${JSON.stringify((sobrou ?? []).map((c) => `${c.apelido}:${c.status}`))}`,
  );
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
