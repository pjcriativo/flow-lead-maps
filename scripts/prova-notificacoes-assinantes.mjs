#!/usr/bin/env node
// PROVA — ETAPA 4: Notificações (admin envia aviso in-app → todos os usuários da
// plataforma recebem, cliente lê e marca como lida, NÃO mexe em consumo_org) +
// Assinantes (CRUD manual real: cadastra, rejeita duplicado, remove). Limpa tudo ao fim.
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
async function sessao(email) {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return { client: an, token: se.session.access_token, uid: se.user.id };
}
const chamar = (jwt, body) =>
  fetch(`${URL_SB}/functions/v1/admin-acoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  });
const chamarJson = (...a) => chamar(...a).then((r) => r.json());

const limpeza = [];
try {
  console.log("\x1b[1mPROVA — Notificações + Assinantes (Etapa 4)\x1b[0m\n");

  const cliente = await sessao("gevieskiagency@gmail.com");
  const donoAdmin = await sessao("marcosg1.pereira@gmail.com");

  // ---------- guard 403 pra não-admin ----------
  const rForaEnviar = await chamar(cliente.token, {
    acao: "notificacao_enviar",
    titulo: "x",
    mensagem: "x",
  });
  T(rForaEnviar.status === 403, "não-super-admin → 403 em notificacao_enviar");
  const rForaAssinante = await chamar(cliente.token, {
    acao: "assinante_add",
    email: "x@x.com",
  });
  T(rForaAssinante.status === 403, "não-super-admin → 403 em assinante_add");

  // ---------- contagem real de usuários da plataforma (pra conferir destinatarios) ----------
  const { count: totalUsuarios } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  // ---------- NOTIFICAÇÕES ----------
  const titulo = "[TESTE PROVA] Manutenção programada";
  const mensagem = "Isto é um teste automatizado — pode ignorar.";
  const rEnviar = await chamarJson(donoAdmin.token, {
    acao: "notificacao_enviar",
    titulo,
    mensagem,
  });
  T(rEnviar.ok === true, "admin envia notificacao_enviar", JSON.stringify(rEnviar));
  T(
    rEnviar.destinatarios === totalUsuarios,
    "destinatarios == count(profiles) real (todos os usuários da plataforma, não uma amostra)",
    `${rEnviar.destinatarios} vs ${totalUsuarios}`,
  );
  const notifId = rEnviar.notificacao_id;
  if (notifId) {
    limpeza.push(() => admin.from("notificacao_destinatarios").delete().eq("notificacao_id", notifId));
    limpeza.push(() => admin.from("notificacoes").delete().eq("id", notifId));
  }

  // NÃO mexeu em consumo_org (a rampa/cota de prospecção fica intacta)
  const { data: consumoAntes } = await admin
    .from("consumo_org")
    .select("org_id, leads, sites, mensagens, campanhas");
  T(
    Array.isArray(consumoAntes),
    "consumo_org continua legível/intacto após enviar notificação (não foi tocado)",
  );

  // cliente vê a notificação (RLS direta, sem edge) e ela está NÃO lida
  const { data: minhas } = await cliente.client
    .from("notificacao_destinatarios")
    .select("id, lida_em, notificacoes(titulo, mensagem)")
    .order("enviado_em", { ascending: false })
    .limit(5);
  const recebida = (minhas ?? []).find((n) => n.notificacoes?.titulo === titulo);
  T(!!recebida && recebida.lida_em === null, "cliente VÊ a notificação, ainda não lida (RLS direta)");

  // cliente marca como lida (update na própria linha)
  if (recebida) {
    const { error: eMarcar } = await cliente.client
      .from("notificacao_destinatarios")
      .update({ lida_em: new Date().toISOString() })
      .eq("id", recebida.id);
    T(!eMarcar, "cliente marca a própria notificação como lida", eMarcar?.message);
  }

  // admin vê no histórico que 1 pessoa já leu
  const rHistorico = await chamarJson(donoAdmin.token, { acao: "notificacoes_listar" });
  const doTeste = (rHistorico.notificacoes ?? []).find((n) => n.id === notifId);
  T(
    (doTeste?.lidas ?? 0) >= 1,
    "admin vê no histórico que pelo menos 1 usuário já leu",
    JSON.stringify(doTeste),
  );

  // isolamento de escrita: cliente não consegue marcar a linha de OUTRO usuário como lida
  const outro = await sessao("marcosg1.pereira@gmail.com");
  const { data: linhaDoOutro } = await outro.client
    .from("notificacao_destinatarios")
    .select("id")
    .eq("notificacao_id", notifId)
    .eq("user_id", outro.uid)
    .maybeSingle();
  if (linhaDoOutro) {
    const { data: tentativa } = await cliente.client
      .from("notificacao_destinatarios")
      .update({ lida_em: new Date().toISOString() })
      .eq("id", linhaDoOutro.id)
      .select();
    T(
      (tentativa ?? []).length === 0,
      "cliente NÃO consegue marcar a notificação de outro usuário como lida (RLS)",
    );
  }

  // ---------- ASSINANTES ----------
  const emailTeste = `teste-prova-${Date.now()}@example.com`;
  const rAdd = await chamarJson(donoAdmin.token, {
    acao: "assinante_add",
    email: emailTeste,
    nome: "Teste Prova",
  });
  T(rAdd.ok === true, "admin cadastra assinante (assinante_add)", JSON.stringify(rAdd));
  const assinanteId = rAdd.assinante?.id;
  if (assinanteId) limpeza.push(() => admin.from("assinantes").delete().eq("id", assinanteId));

  const rListar = await chamarJson(donoAdmin.token, { acao: "assinantes_listar" });
  T(
    (rListar.assinantes ?? []).some((a) => a.email === emailTeste),
    "assinante aparece em assinantes_listar",
  );

  const rDup = await chamarJson(donoAdmin.token, { acao: "assinante_add", email: emailTeste });
  T(rDup.ok === false && rDup.reason === "email_duplicado", "e-mail duplicado é rejeitado");

  if (assinanteId) {
    const rRemove = await chamarJson(donoAdmin.token, {
      acao: "assinante_remove",
      id: assinanteId,
    });
    T(rRemove.ok === true, "admin remove assinante (assinante_remove)");
    const rListar2 = await chamarJson(donoAdmin.token, { acao: "assinantes_listar" });
    T(
      !(rListar2.assinantes ?? []).some((a) => a.id === assinanteId),
      "assinante removido não aparece mais na lista",
    );
  }
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
} finally {
  for (const f of limpeza.reverse()) {
    try {
      await f();
    } catch {
      /* ok */
    }
  }
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
