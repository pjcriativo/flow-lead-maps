#!/usr/bin/env node
// PROVA do HANDOFF (etapa 3): reatribuir um lead MOVE a visibilidade.
// vendedorA vê o lead → gerente reatribui p/ vendedorB via Edge lead-atribuir →
// agora vendedorB vê e vendedorA (que é vendedor) DEIXA de ver. Histórico gravado.
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

const DONO = "marcosg1.pereira@gmail.com";
const GER = "gerente.teste@flowleads.local";
const VA = "vendedor.teste@flowleads.local";
const VB = "vendedorb.teste@flowleads.local";

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

async function comoUsuario(email) {
  const { data: lk, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error(`${email}: ${error.message}`);
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return { client: an, uid: se.user.id, token: se.session.access_token };
}
async function garantirUsuario(email) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const e = (list?.users ?? []).find((u) => u.email === email);
  if (e) return e.id;
  const { data } = await admin.auth.admin.createUser({
    email,
    password: "Teste!handoff9",
    email_confirm: true,
  });
  return data.user.id;
}
const ve = async (client, leadId) =>
  ((await client.from("leads").select("id").eq("id", leadId)).data ?? []).length === 1;

const limpeza = [];
try {
  console.log("\x1b[1mPROVA — HANDOFF move a visibilidade\x1b[0m\n");
  const dono = await comoUsuario(DONO);
  const { data: org } = await admin
    .from("orgs")
    .select("id")
    .eq("dono_user_id", dono.uid)
    .maybeSingle();

  const gerId = await garantirUsuario(GER);
  const vaId = await garantirUsuario(VA);
  const vbId = await garantirUsuario(VB);
  for (const [uid, papel] of [
    [gerId, "gerente"],
    [vaId, "vendedor"],
    [vbId, "vendedor"],
  ])
    await admin
      .from("memberships")
      .upsert({ org_id: org.id, user_id: uid, papel }, { onConflict: "org_id,user_id" });

  const { data: lead } = await admin
    .from("leads")
    .select("id, assigned_to")
    .eq("org_id", org.id)
    .limit(1)
    .single();
  const orig = lead.assigned_to;
  limpeza.push(() => admin.from("leads").update({ assigned_to: orig }).eq("id", lead.id));
  limpeza.push(() => admin.from("lead_atribuicoes").delete().eq("lead_id", lead.id));

  // começa atribuído ao vendedor A
  await admin.from("leads").update({ assigned_to: vaId }).eq("id", lead.id);

  const va = await comoUsuario(VA);
  const vb = await comoUsuario(VB);
  const ger = await comoUsuario(GER);
  T(await ve(va.client, lead.id), "antes: vendedor A vê o lead (atribuído a ele)");
  T(!(await ve(vb.client, lead.id)), "antes: vendedor B NÃO vê");

  // gerente reatribui A → B pela Edge (autorização server-side)
  const r = await fetch(`${URL_SB}/functions/v1/lead-atribuir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ger.token}`,
      apikey: ANON,
    },
    body: JSON.stringify({ lead_id: lead.id, para_user_id: vbId, motivo: "teste handoff" }),
  });
  const j = await r.json();
  T(
    r.status === 200 && j.ok === true,
    "gerente reatribui A→B via Edge (200 ok)",
    JSON.stringify(j),
  );

  T(await ve(vb.client, lead.id), "depois: vendedor B PASSA a ver o lead");
  T(!(await ve(va.client, lead.id)), "depois: vendedor A DEIXA de ver (handoff moveu a visão)");

  const { data: hist } = await admin
    .from("lead_atribuicoes")
    .select("de_user_id, para_user_id, por_user_id")
    .eq("lead_id", lead.id)
    .order("criado_em", { ascending: false })
    .limit(1);
  T(
    hist?.[0]?.para_user_id === vbId && hist?.[0]?.por_user_id === gerId,
    "histórico gravado (para=B, por=gerente)",
    JSON.stringify(hist?.[0]),
  );

  // trava: vendedor B NÃO pode empurrar pra fora da org (destino inexistente na org)
  const rForaOrg = await fetch(`${URL_SB}/functions/v1/lead-atribuir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vb.token}`,
      apikey: ANON,
    },
    body: JSON.stringify({ lead_id: lead.id, para_user_id: dono.uid.replace(/.$/, "0") }),
  });
  const jFora = await rForaOrg.json();
  T(jFora.ok === false, "vendedor não joga lead p/ id inválido/fora da org → negado");
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
  // apaga membership + conta auth de teste (não deixar usuário de teste no banco de produção)
  for (const email of [GER, VA, VB]) {
    const { data: u } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const id = (u?.users ?? []).find((x) => x.email === email)?.id;
    if (!id) continue;
    await admin.from("memberships").delete().eq("user_id", id);
    await admin.from("leads").update({ assigned_to: null }).eq("assigned_to", id);
    await admin
      .from("lead_atribuicoes")
      .delete()
      .or(`de_user_id.eq.${id},para_user_id.eq.${id},por_user_id.eq.${id}`);
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}
console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
