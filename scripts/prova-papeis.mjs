#!/usr/bin/env node
// PROVA ADVERSARIAL do sistema de PAPÉIS (etapa 2 do RLS org+papel).
// Ataca a API/RLS direto com JWT de cada persona — "não aparece na UI" não é isolamento.
//
// Personas (criadas/garantidas no início, na org do dono marcosg1):
//   vendedor  → papel 'vendedor' (só vê leads atribuídos A ELE)
//   gerente   → papel 'gerente'  (vê a org toda)
//   super     → marcosg1 (super_admin de plataforma; atravessa orgs)
//   forasteiro→ gevieskiagency (admin de OUTRA org)
//
// Checks:
//   1) vendedor NÃO vê lead não atribuído a ele (mesma org)
//   2) vendedor VÊ o lead atribuído a ele
//   3) gerente VÊ todos os leads da org
//   4) org A (forasteiro) NÃO vê nada da org do dono
//   5) super_admin enxerga leads de mais de uma org
//   6) forja: vendedor tenta atualizar org_id do lead p/ outra org → NEGADO (0 linhas)
//   7) forja: usuário tenta se auto-promover a super_admin (update profiles) → NEGADO
// Exit 0 só se TODOS passarem. Limpa as personas/atribuições de teste ao fim.
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
const FORA = "gevieskiagency@gmail.com";
const VEND = "vendedor.teste@flowleads.local";
const GER = "gerente.teste@flowleads.local";

let pass = 0,
  fail = 0;
const T = (cond, nome, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  \x1b[32mOK\x1b[0m   · ${nome}`);
  } else {
    fail++;
    console.log(`  \x1b[31mX\x1b[0m    · ${nome}${extra ? ` → ${extra}` : ""}`);
  }
};

// cliente autenticado como um usuário real (JWT via magiclink → verifyOtp)
async function comoUsuario(email) {
  const { data: lk, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error(`${email}: ${error.message}`);
  const an = createClient(URL_SB, ANON, OPTS);
  const { data: se, error: e2 } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  if (e2) throw new Error(`${email}: ${e2.message}`);
  return { client: an, uid: se.user.id };
}

// garante um usuário de teste com senha (idempotente) e devolve o id
async function garantirUsuario(email) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existe = (list?.users ?? []).find((u) => u.email === email);
  if (existe) return existe.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "Teste!" + Math.abs(hash(email)),
    email_confirm: true,
  });
  if (error) throw new Error(`criar ${email}: ${error.message}`);
  return data.user.id;
}
const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

const limpeza = [];
try {
  console.log("\x1b[1mPROVA ADVERSARIAL — papéis (RLS org+papel)\x1b[0m\n");

  // org do dono
  const { data: orgDono } = await admin
    .from("orgs")
    .select("id")
    .eq("dono_user_id", (await comoUsuario(DONO)).uid)
    .maybeSingle();
  const orgId = orgDono.id;
  const { data: orgFora } = await admin
    .from("orgs")
    .select("id, dono_user_id")
    .neq("id", orgId)
    .limit(1)
    .maybeSingle();

  // personas na org do dono
  const vendId = await garantirUsuario(VEND);
  const gerId = await garantirUsuario(GER);
  for (const [uid, papel] of [
    [vendId, "vendedor"],
    [gerId, "gerente"],
  ]) {
    await admin
      .from("memberships")
      .upsert({ org_id: orgId, user_id: uid, papel }, { onConflict: "org_id,user_id" });
  }

  // dois leads reais da org do dono: um atribuído ao vendedor, um NÃO
  const { data: doisLeads } = await admin
    .from("leads")
    .select("id, assigned_to")
    .eq("org_id", orgId)
    .limit(2);
  const leadDoVend = doisLeads[0].id;
  const leadAlheio = doisLeads[1].id;
  const assignedOrig = doisLeads[0].assigned_to;
  await admin.from("leads").update({ assigned_to: vendId }).eq("id", leadDoVend);
  limpeza.push(() =>
    admin.from("leads").update({ assigned_to: assignedOrig }).eq("id", leadDoVend),
  );

  // ---------- checks de LEITURA ----------
  const vend = await comoUsuario(VEND);
  const ger = await comoUsuario(GER);
  const fora = await comoUsuario(FORA);
  const sup = await comoUsuario(DONO);

  const vendVeAlheio = await vend.client.from("leads").select("id").eq("id", leadAlheio);
  T((vendVeAlheio.data ?? []).length === 0, "vendedor NÃO vê lead não-atribuído (mesma org)");

  const vendVeSeu = await vend.client.from("leads").select("id").eq("id", leadDoVend);
  T((vendVeSeu.data ?? []).length === 1, "vendedor VÊ o lead atribuído a ele");

  const gerTudo = await ger.client
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  const { count: totalOrg } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  T(
    gerTudo.count === totalOrg,
    "gerente VÊ todos os leads da org",
    `${gerTudo.count} vs ${totalOrg}`,
  );

  const foraVeDono = await fora.client
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  T(
    (foraVeDono.count ?? 0) === 0,
    "org A NÃO vê leads da org B (cross-org)",
    String(foraVeDono.count),
  );

  const supOrgs = await sup.client.from("leads").select("org_id").limit(2000);
  const orgsVistas = new Set((supOrgs.data ?? []).map((r) => r.org_id));
  T(
    orgsVistas.size >= 2,
    "super_admin vê leads de MAIS DE UMA org (atravessa)",
    `${orgsVistas.size} orgs`,
  );

  // ---------- checks de FORJA (escrita) ----------
  const forja = await vend.client
    .from("leads")
    .update({ org_id: orgFora.id })
    .eq("id", leadDoVend)
    .select("id");
  T(
    (forja.data ?? []).length === 0,
    "forja: vendedor movendo lead p/ outra org → NEGADO (0 linhas)",
  );
  const { data: aindaOrg } = await admin
    .from("leads")
    .select("org_id")
    .eq("id", leadDoVend)
    .single();
  T(aindaOrg.org_id === orgId, "lead permaneceu na org original após a forja");

  const autopromo = await vend.client
    .from("profiles")
    .update({ is_super_admin: true })
    .eq("id", vendId)
    .select("id");
  const { data: perfilVend } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", vendId)
    .maybeSingle();
  T(
    !(perfilVend && perfilVend.is_super_admin === true),
    "forja: auto-promoção a super_admin → NEGADA (flag intacto)",
    JSON.stringify({ resp: (autopromo.data ?? []).length, flag: perfilVend?.is_super_admin }),
  );
} catch (e) {
  fail++;
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e.message);
} finally {
  for (const f of limpeza.reverse()) {
    try {
      await f();
    } catch {
      /* já limpo */
    }
  }
  // remove as memberships de teste (os usuários de teste ficam, idempotentes, sem dado real)
  for (const email of [VEND, GER]) {
    const { data: u } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const id = (u?.users ?? []).find((x) => x.email === email)?.id;
    if (id) await admin.from("memberships").delete().eq("user_id", id);
  }
}

console.log(`\n${pass} passaram · ${fail} falharam`);
await new Promise((r) => setTimeout(r, 150));
process.exit(fail ? 1 : 0);
