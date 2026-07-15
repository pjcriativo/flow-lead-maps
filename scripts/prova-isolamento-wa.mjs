#!/usr/bin/env node
// Regressão de ISOLAMENTO MULTI-TENANT do WhatsApp (incidente de 2026-07-15).
//
// O bug: existia UMA instância global ("flowleads") e as edges não checavam o dono — a org B
// via o número da org A, podia enviar pelo WhatsApp de A e, ao pedir código, derrubava A.
// Este script re-prova, com 2 orgs REAIS, que o servidor nega tudo isso. "Não aparece na UI"
// não é isolamento: aqui atacamos a API direto, forjando os campos que ela aceita.
//
// Uso: node scripts/prova-isolamento-wa.mjs <email-alvo> <email-atacante> [--dos]
//   --dos  inclui o teste de negação de serviço (o atacante pede pareamento, o que RECRIA a
//          instância DELE). Fora por padrão: derruba a conexão do atacante se ele estiver
//          pareado. O alvo nunca é tocado — é justamente o que o teste prova.
//
// TRAVA: e-mail inexistente => ABORTA. `generateLink` CRIA o usuário se ele não existir; foi
// assim que um usuário órfão nasceu no banco de produção durante a correção do incidente.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  } catch {
    /* .env opcional */
  }
}
loadEnv();

const URL_SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
if (!URL_SB || !SERVICE || !ANON) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY no .env");
  process.exit(2);
}

const argv = process.argv.slice(2);
const COM_DOS = argv.includes("--dos");
const [emailAlvo, emailAtacante] = argv.filter((a) => !a.startsWith("--"));
if (!emailAlvo || !emailAtacante) {
  console.error("Uso: node scripts/prova-isolamento-wa.mjs <email-alvo> <email-atacante> [--dos]");
  process.exit(2);
}

// autoRefreshToken: false — sem timer pendurado, o processo sai limpo (com o refresh ligado,
// sair no meio de uma chamada dispara uma assertion do libuv no Windows e o exit code vira lixo;
// este script vale pelo exit code).
const OPTS = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_SB, SERVICE, OPTS);
let falhas = 0;

/**
 * Encerra com código 2 (= não rodou; ≠ 1, que é "isolamento quebrado"). O respiro antes do
 * exit é necessário: process.exit() logo depois de um fetch, com o socket ainda fechando,
 * dispara "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)" no Windows e o código de
 * saída vira 127 — o que faria a trava parecer um crash.
 */
async function abortar(msg) {
  console.error(msg);
  await new Promise((r) => setTimeout(r, 100));
  process.exit(2);
}
const check = (nome, ok, extra = "") => {
  console.log(
    (ok ? "  OK   " : " FALHA ") + "· " + nome + (extra ? "\n           → " + extra : ""),
  );
  if (!ok) falhas++;
};

/** Resolve o usuário POR E-MAIL, sem criar nada. Aborta se não existir. */
async function usuarioPorEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error("listUsers: " + error.message);
  const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  if (!u)
    await abortar(
      `ABORTADO: não existe usuário com o e-mail "${email}". Este script NÃO cria usuários ` +
        `(generateLink criaria um órfão no banco). Use um e-mail real de uma org existente.`,
    );
  return u.id;
}

/** Sessão real do usuário (magic link -> verifyOtp). Só para e-mails já existentes. */
async function sessao(email) {
  const { data: lk, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error("generateLink: " + error.message);
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se, error: e2 } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  if (e2 || !se?.session) throw new Error("verifyOtp: " + (e2?.message ?? "sem sessão"));
  const cli = createClient(URL_SB, ANON, OPTS);
  await cli.auth.setSession({
    access_token: se.session.access_token,
    refresh_token: se.session.refresh_token,
  });
  return { jwt: se.session.access_token, cli };
}

const edge = async (fn, jwt, body) => {
  const h = { apikey: ANON, "Content-Type": "application/json" };
  if (jwt) h.Authorization = "Bearer " + jwt;
  const r = await fetch(`${URL_SB}/functions/v1/${fn}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body ?? {}),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const linhaWa = async (uid) =>
  (
    await admin
      .from("wa_instancias")
      .select("id, nome, numero, status")
      .eq("user_id", uid)
      .maybeSingle()
  ).data;

/* ------------------------------- preparação ------------------------------- */

const ALVO = await usuarioPorEmail(emailAlvo);
const ATAC = await usuarioPorEmail(emailAtacante);
const rowAlvo = await linhaWa(ALVO);
const rowAtac = await linhaWa(ATAC);
if (!rowAlvo || !rowAtac) {
  console.error("ABORTADO: as duas orgs precisam ter linha em wa_instancias para o teste valer.");
  process.exit(2);
}
const NOME_ALVO = rowAlvo.nome;
const NUM_ALVO = (rowAlvo.numero || "").replace(/\D/g, "") || "__sem_numero__";
console.log(
  `ALVO     ${emailAlvo}: nome=${rowAlvo.nome} numero=${rowAlvo.numero} status=${rowAlvo.status}`,
);
console.log(`ATACANTE ${emailAtacante}: nome=${rowAtac.nome} status=${rowAtac.status}\n`);

const { jwt: jwtAtac, cli: cliAtac } = await sessao(emailAtacante);
const { cli: cliAlvo, jwt: jwtAlvo } = await sessao(emailAlvo);
const vazou = (s) =>
  s.includes(NOME_ALVO) || (NUM_ALVO !== "__sem_numero__" && s.includes(NUM_ALVO));

/* --------------------------------- ataques -------------------------------- */

console.log("### 1 — forjar nome/id/user_id da instância do alvo (wa-connect)");
for (const forja of [
  { instancia: NOME_ALVO },
  { instance: NOME_ALVO },
  { instance_name: NOME_ALVO },
  { nome: NOME_ALVO },
  { user_id: ALVO },
  { userId: ALVO },
  { instancia_id: rowAlvo.id },
  { org: ALVO },
  { token: "roubado" },
]) {
  const r = await edge("wa-connect", jwtAtac, forja);
  check(
    "forja " + JSON.stringify(forja) + " → devolve a instância do atacante",
    !vazou(JSON.stringify(r.body)),
    `instancia=${r.body?.instancia ?? "-"} status=${r.body?.status ?? "-"} numero=${r.body?.numero ?? "-"}`,
  );
}

console.log("\n### 2 — enviar pelo WhatsApp do alvo (wa-send-test forjado)");
for (const forja of [
  { instancia: NOME_ALVO, user_id: ALVO, number: "5541999999999", text: "sequestro" },
  { instance_name: NOME_ALVO, number: "5541999999999", text: "sequestro" },
]) {
  const r = await edge("wa-send-test", jwtAtac, forja);
  check(
    "envio forjado " + JSON.stringify(Object.keys(forja)) + " → NEGADO",
    r.body?.ok !== true,
    JSON.stringify(r.body).slice(0, 160),
  );
}

console.log("\n### 3 — ler a instância/token do alvo (e o próprio token) via RLS");
const { data: verAlvo } = await cliAtac.from("wa_instancias").select("*").eq("user_id", ALVO);
check(
  "atacante lê a linha do alvo → 0",
  (verAlvo ?? []).length === 0,
  (verAlvo ?? []).length + " linhas",
);
const { data: verTudo } = await cliAtac.from("wa_instancias").select("user_id, nome, numero");
check(
  "atacante listando TUDO só vê a própria org",
  (verTudo ?? []).every((r) => r.user_id === ATAC) && !vazou(JSON.stringify(verTudo)),
  JSON.stringify(verTudo),
);
const { data: tkTudo } = await cliAtac.from("wa_instancia_tokens").select("*");
check(
  "atacante lê wa_instancia_tokens → 0",
  (tkTudo ?? []).length === 0,
  (tkTudo ?? []).length + " linhas",
);
const { data: tkProprio } = await cliAtac
  .from("wa_instancia_tokens")
  .select("*")
  .eq("instancia_id", rowAtac.id);
check(
  "atacante lê o PRÓPRIO token → 0 (token fora do alcance do cliente)",
  (tkProprio ?? []).length === 0,
  (tkProprio ?? []).length + " linhas",
);
const { data: tkDono } = await cliAlvo
  .from("wa_instancia_tokens")
  .select("*")
  .eq("instancia_id", rowAlvo.id);
check(
  "o DONO lê o próprio token → 0 (nem ele enxerga)",
  (tkDono ?? []).length === 0,
  (tkDono ?? []).length + " linhas",
);
const rest = await fetch(`${URL_SB}/rest/v1/wa_instancia_tokens?select=*`, {
  headers: { apikey: ANON, Authorization: "Bearer " + jwtAtac },
});
const restJ = await rest.json().catch(() => null);
check(
  "REST cru (anon key) em wa_instancia_tokens → sem token",
  Array.isArray(restJ) ? restJ.length === 0 : !JSON.stringify(restJ).includes('"token"'),
  "HTTP " + rest.status + " " + JSON.stringify(restJ).slice(0, 120),
);

console.log("\n### 4 — escrever para sequestrar (o vetor mais perigoso)");
const { data: upd, error: eUpd } = await cliAtac
  .from("wa_instancias")
  .update({ nome: NOME_ALVO })
  .eq("user_id", ATAC)
  .select("nome");
check(
  `atacante reescreve o PRÓPRIO nome p/ "${NOME_ALVO}" (sequestraria a instância do alvo) → NEGADO`,
  (upd ?? []).length === 0,
  eUpd ? eUpd.code : (upd ?? []).length + " linhas alteradas",
);
const { error: eIns } = await cliAtac
  .from("wa_instancias")
  .insert({ user_id: ALVO, nome: "roubo-" + process.pid })
  .select("id");
check(
  "atacante insere linha com o user_id do alvo → NEGADO",
  !!eIns,
  eIns ? eIns.code : "INSERIU!",
);
const { error: eIns2 } = await cliAtac
  .from("wa_instancias")
  .insert({ user_id: ATAC, nome: "extra-" + process.pid })
  .select("id");
check(
  "atacante cria instância extra pra si → NEGADO (escrita só do servidor)",
  !!eIns2,
  eIns2 ? eIns2.code : "INSERIU!",
);
const { error: eTk } = await cliAtac
  .from("wa_instancia_tokens")
  .insert({ instancia_id: rowAlvo.id, token: "meu" })
  .select("instancia_id");
check("atacante insere token na instância do alvo → NEGADO", !!eTk, eTk ? eTk.code : "INSERIU!");
const { data: delTk } = await cliAtac
  .from("wa_instancia_tokens")
  .delete()
  .eq("instancia_id", rowAtac.id)
  .select("instancia_id");
check(
  "atacante apaga o próprio token (forçaria re-adoção por nome) → NEGADO",
  (delTk ?? []).length === 0,
  (delTk ?? []).length + " apagadas",
);
const { data: delAlvo } = await cliAtac
  .from("wa_instancias")
  .delete()
  .eq("user_id", ALVO)
  .select("id");
check(
  "atacante apaga a instância do alvo → NEGADO",
  (delAlvo ?? []).length === 0,
  (delAlvo ?? []).length + " apagadas",
);

console.log("\n### 5 — sem Authorization (anon puro)");
for (const fn of ["wa-connect", "wa-send-test", "melhorar-proposta"]) {
  const r = await edge(fn, null, { instancia: NOME_ALVO });
  check(fn + " sem Authorization → 401", r.status === 401, "HTTP " + r.status);
}

if (COM_DOS) {
  console.log("\n### 6 — DoS: atacante pede pareamento forjando a instância do alvo");
  const dos = await edge("wa-connect", jwtAtac, {
    phone: "5541988887777",
    instancia: NOME_ALVO,
    user_id: ALVO,
  });
  check(
    "o pedido do atacante NÃO tocou a instância do alvo",
    !vazou(JSON.stringify(dos)),
    JSON.stringify(dos.body).slice(0, 140),
  );
} else {
  console.log("\n### 6 — DoS: PULADO (rode com --dos; ele recria a instância DO ATACANTE)");
}

console.log("\n### veredito — o alvo sobreviveu?");
const depois = await linhaWa(ALVO);
check(
  "alvo continua com o nome/numero originais no banco",
  depois.nome === rowAlvo.nome && depois.numero === rowAlvo.numero,
  `nome=${depois.nome} numero=${depois.numero} status=${depois.status}`,
);
const st = await edge("wa-connect", jwtAlvo, {});
check(
  "estado real do alvo na Evolution, após os ataques: inalterado",
  st.body?.status === rowAlvo.status ||
    (rowAlvo.status === "conectado" && st.body?.status === "conectado"),
  `status=${st.body?.status} instancia=${st.body?.instancia} numero=${st.body?.numero}`,
);

console.log(
  "\n=== " +
    (falhas === 0 ? "TODOS OS ATAQUES NEGADOS" : falhas + " FALHA(S) — ISOLAMENTO QUEBRADO") +
    " ===",
);
process.exit(falhas === 0 ? 0 : 1);
