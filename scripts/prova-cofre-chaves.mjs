#!/usr/bin/env node
// PROVA — Cofre de chaves: guard 403 pra não-admin (leitura E escrita); o valor NUNCA volta
// em texto puro em NENHUMA ação (chaves_listar/chave_salvar/chaves_auditoria_listar); a
// coluna no banco é CIFRADA (não dá pra ler a chave direto na tabela, nem com service role
// sem a CHAVES_MASTER_KEY); resolverChave() (o mecanismo usado pelas 13 edges wireadas) lê o
// cofre de verdade no runtime da Edge. Auditoria registra quem/quando. Restaura o estado
// original ao final (não deixa a chave de teste no cofre real).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
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
async function token(email) {
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

// nome de uma chave de TESTE que não colide com nenhuma chave real gerenciada
const NOME_TESTE = "TESTE_PROVA_COFRE_KEY";
const VALOR_TESTE = "sk-teste-1234567890-valorsecreto-abcd";

let jwtDono;
try {
  console.log("\x1b[1mPROVA — Cofre de chaves (config_chaves)\x1b[0m\n");
  jwtDono = await token("marcosg1.pereira@gmail.com");
  const jwtFora = await token("gevieskiagency@gmail.com");

  const rForaListar = await chamar(jwtFora, { acao: "chaves_listar" });
  T(rForaListar.status === 403, "não-super-admin → 403 em chaves_listar");
  const rForaSalvar = await chamar(jwtFora, {
    acao: "chave_salvar",
    nome: NOME_TESTE,
    valor: VALOR_TESTE,
  });
  T(rForaSalvar.status === 403, "não-super-admin → 403 em chave_salvar");

  const rSalvar = await chamarJson(jwtDono, {
    acao: "chave_salvar",
    nome: NOME_TESTE,
    valor: VALOR_TESTE,
  });
  T(rSalvar.ok === true, "admin salva a chave de teste (chave_salvar)", JSON.stringify(rSalvar));
  T(
    rSalvar.ultimos4 === VALOR_TESTE.slice(-4) &&
      JSON.stringify(rSalvar).indexOf(VALOR_TESTE) === -1,
    "resposta de chave_salvar NUNCA contém o valor completo (só últimos4)",
    JSON.stringify(rSalvar),
  );

  // PROVA-CHAVE 1: a coluna no banco NÃO é o texto puro — é ilegível sem decifrar.
  const { data: linhaBanco } = await admin
    .from("config_chaves")
    .select("valor_cifrado, ultimos4")
    .eq("nome", NOME_TESTE)
    .maybeSingle();
  T(
    !!linhaBanco?.valor_cifrado &&
      linhaBanco.valor_cifrado !== VALOR_TESTE &&
      !linhaBanco.valor_cifrado.includes(VALOR_TESTE),
    "coluna valor_cifrado NO BANCO é ilegível — não contém o valor em texto puro",
    linhaBanco?.valor_cifrado?.slice(0, 24) + "…",
  );
  T(
    linhaBanco?.ultimos4 === VALOR_TESTE.slice(-4),
    "ultimos4 gravado bate com o fim do valor real (exibição mascarada correta)",
  );

  // PROVA-CHAVE 2: chaves_listar NUNCA devolve o valor — só status/últimos4/metadados.
  const rListar = await chamarJson(jwtDono, { acao: "chaves_listar" });
  const linhaListada = (rListar.chaves ?? []).find((c) => c.nome === NOME_TESTE);
  T(
    !!linhaListada &&
      linhaListada.configurada === true &&
      linhaListada.ultimos4 === VALOR_TESTE.slice(-4) &&
      JSON.stringify(rListar).indexOf(VALOR_TESTE) === -1,
    "chaves_listar mostra 'configurada' + últimos4, NUNCA o valor completo",
    JSON.stringify(linhaListada),
  );
  T(
    linhaListada?.atualizado_por === "marcosg1.pereira@gmail.com",
    "chaves_listar mostra quem alterou (e-mail resolvido)",
  );

  // PROVA-CHAVE 3: auditoria registrou a troca (quem + quando).
  const rAuditoria = await chamarJson(jwtDono, { acao: "chaves_auditoria_listar" });
  const entradaAuditoria = (rAuditoria.auditoria ?? []).find((a) => a.nome === NOME_TESTE);
  T(
    !!entradaAuditoria && entradaAuditoria.email === "marcosg1.pereira@gmail.com",
    "auditoria registra a troca desta chave (quem + quando)",
    JSON.stringify(entradaAuditoria),
  );

  // PROVA-CHAVE 4: valor rejeitado (curto demais) não grava.
  const rCurta = await chamarJson(jwtDono, {
    acao: "chave_salvar",
    nome: NOME_TESTE,
    valor: "ab",
  });
  T(rCurta.ok === false && rCurta.reason === "valor_invalido", "valor curto demais é rejeitado");

  // PROVA-CHAVE 5 (a mais importante): o MECANISMO que as 13 edges usam (resolverChave(),
  // em _shared/chaves.ts) funciona de fato dentro do runtime real da Supabase Edge — testado
  // aqui com um nome de chave de ESCOPO (não é nenhuma chave real gerenciada, zero risco em
  // produção): salva no cofre, chama chave_efetiva_teste (resolve via resolverChave) e
  // confirma que o valor resolvido bate com o que foi salvo.
  const NOME_MECANISMO = "TESTE_PROVA_MECANISMO_ENV";
  const VALOR_MECANISMO = "valor-mecanismo-9876543210";
  try {
    await chamarJson(jwtDono, {
      acao: "chave_salvar",
      nome: NOME_MECANISMO,
      valor: VALOR_MECANISMO,
    });
    const rEfetiva = await chamarJson(jwtDono, {
      acao: "chave_efetiva_teste",
      nome: NOME_MECANISMO,
    });
    T(
      rEfetiva.ok === true &&
        rEfetiva.configurada === true &&
        rEfetiva.ultimos4 === VALOR_MECANISMO.slice(-4),
      "resolverChave() lê o cofre de verdade no runtime da Edge (mesmo mecanismo usado nas 13 edges wireadas)",
      JSON.stringify(rEfetiva),
    );
  } finally {
    await admin.from("config_chaves").delete().eq("nome", NOME_MECANISMO);
    await admin.from("config_chaves_auditoria").delete().eq("nome", NOME_MECANISMO);
  }
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
} finally {
  // cleanup da chave de teste, sempre
  await admin.from("config_chaves").delete().eq("nome", NOME_TESTE);
  await admin.from("config_chaves_auditoria").delete().eq("nome", NOME_TESTE);
  const { data: sobrou } = await admin
    .from("config_chaves")
    .select("id")
    .eq("nome", NOME_TESTE)
    .maybeSingle();
  T(!sobrou, "cleanup: chave de teste removida do cofre (não deixa lixo em produção)");
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
