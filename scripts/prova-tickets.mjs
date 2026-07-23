#!/usr/bin/env node
// PROVA — fluxo completo de Suporte: cliente abre → admin vê e responde → cliente vê a resposta.
// 2 sessões reais (gevieskiagency=cliente, marcosg1=super_admin). Limpa tudo ao fim.
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
const chamarAdminAcoes = (jwt, body) =>
  fetch(`${URL_SB}/functions/v1/admin-acoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}`, apikey: ANON },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const limpeza = [];
try {
  console.log("\x1b[1mPROVA — Suporte: cliente abre → admin responde → cliente vê\x1b[0m\n");

  const cliente = await sessao("gevieskiagency@gmail.com");
  const donoAdmin = await sessao("marcosg1.pereira@gmail.com");

  // 1) CLIENTE abre o ticket (client direto, RLS)
  const assuntoTeste = "[TESTE PROVA] dúvida sobre limite de leads";
  const { data: ticket, error: eCriar } = await cliente.client
    .from("tickets")
    .insert({
      autor_user_id: cliente.uid,
      assunto: assuntoTeste,
      mensagem: "Meu plano bloqueou a busca, é esperado?",
      prioridade: "alta",
    })
    .select("id, status, org_id")
    .single();
  T(!eCriar && !!ticket, "cliente abre o ticket (insert real, RLS)", eCriar?.message);
  if (ticket) limpeza.push(() => admin.from("tickets").delete().eq("id", ticket.id));

  // 2) ADMIN vê o ticket na lista de TODAS as orgs (tickets_listar)
  const listaAdmin = await chamarAdminAcoes(donoAdmin.token, { acao: "tickets_listar" });
  const achado = (listaAdmin.tickets ?? []).find((t) => t.id === ticket?.id);
  T(
    !!achado,
    "admin VÊ o ticket na lista (tickets_listar, todas as orgs)",
    JSON.stringify(listaAdmin).slice(0, 120),
  );
  T(
    achado?.autor_email === "gevieskiagency@gmail.com",
    "ticket vem com o e-mail do autor certo",
    achado?.autor_email,
  );

  // 3) ADMIN responde + muda status
  const rResp = await chamarAdminAcoes(donoAdmin.token, {
    acao: "ticket_responder",
    ticket_id: ticket.id,
    texto: "[TESTE PROVA] Sim, é o limite do plano Starter — dá pra fazer upgrade.",
  });
  T(rResp.ok === true, "admin responde (ticket_responder)", JSON.stringify(rResp));
  const rStatus = await chamarAdminAcoes(donoAdmin.token, {
    acao: "ticket_status",
    ticket_id: ticket.id,
    status: "resolvido",
  });
  T(
    rStatus.ok === true && rStatus.status === "resolvido",
    "admin muda o status → resolvido",
    JSON.stringify(rStatus),
  );

  // 4) CLIENTE vê a resposta do admin (RLS: pode_ver_ticket também cobre ticket_respostas)
  const { data: respostasCliente } = await cliente.client
    .from("ticket_respostas")
    .select("texto, eh_admin")
    .eq("ticket_id", ticket.id);
  const respostaAdmin = (respostasCliente ?? []).find((r) => r.eh_admin);
  T(
    !!respostaAdmin && /upgrade/.test(respostaAdmin.texto),
    "cliente VÊ a resposta do admin",
    JSON.stringify(respostasCliente),
  );

  const { data: ticketDepois } = await cliente.client
    .from("tickets")
    .select("status")
    .eq("id", ticket.id)
    .single();
  T(ticketDepois?.status === "resolvido", "cliente vê o status atualizado (resolvido)");

  // 5) isolamento: outra org (nayara) NÃO vê o ticket de gevieskiagency
  const outra = await sessao("nayarasacramentosousa@gmail.com");
  const { data: veOutraOrg } = await outra.client.from("tickets").select("id").eq("id", ticket.id);
  T((veOutraOrg ?? []).length === 0, "outra org NÃO vê o ticket (isolamento por org)");

  // 6) CLIENTE responde de volta (thread bidirecional)
  const { error: eRespCliente } = await cliente.client.from("ticket_respostas").insert({
    ticket_id: ticket.id,
    autor_user_id: cliente.uid,
    eh_admin: false,
    texto: "[TESTE PROVA] Perfeito, obrigado!",
  });
  T(
    !eRespCliente,
    "cliente responde de volta (thread funciona nos dois sentidos)",
    eRespCliente?.message,
  );

  // 7) card do dashboard: kpis.ticketsAbertos reflete a REALIDADE (o ticket de teste está
  // 'resolvido' agora, então não deve contar — prova que o número É real, não estático)
  const { data: lk2 } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: "marcosg1.pereira@gmail.com",
  });
  const an2 = createClient(URL_SB, ANON, OPTS);
  const { data: se2 } = await an2.auth.verifyOtp({
    token_hash: lk2.properties.hashed_token,
    type: "magiclink",
  });
  const rMetricas = await fetch(`${URL_SB}/functions/v1/admin-metricas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${se2.session.access_token}`,
      apikey: ANON,
    },
    body: "{}",
  }).then((r) => r.json());
  const { count: abertosReal } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .in("status", ["aberto", "em_andamento"]);
  T(
    rMetricas.kpis?.ticketsAbertos === (abertosReal ?? -1),
    "KPI 'Tickets abertos' do dashboard bate com o count real",
    `${rMetricas.kpis?.ticketsAbertos} vs ${abertosReal}`,
  );
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
