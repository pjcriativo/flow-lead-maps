// Edge: admin-acoes — mutações das telas de admin (Roles/Staffs/Users). Guard super_admin
// SERVER-SIDE em toda ação (o client é só UX). Tudo escrito com service role, escopado à org
// do super admin (roles/staffs) ou à plataforma (users).
//
// Ações:
//   role_toggle  { papel, ativo }               → liga/desliga um papel na org do admin (org_papeis)
//   staff_add    { email, papel }               → cria (ou acha) o usuário e o vincula à org
//   staff_remove { user_id }                     → remove o membership (não apaga a conta)
//   user_add     { email, papel? }               → cria conta + org própria (admin) ou vincula
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

const PAPEIS = ["admin", "gerente", "vendedor", "sdr", "suporte"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data: perfil } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (perfil?.is_super_admin !== true) return json({ error: "Acesso negado" }, 403);

  // org do admin (roles/staffs operam nela)
  const { data: minhaOrg } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", userData.user.id)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  const orgAdmin = minhaOrg?.org_id ?? null;

  let b: Record<string, unknown> = {};
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const acao = String(b.acao || "");

  const acharUsuarioPorEmail = async (email: string) => {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return (data?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  };

  try {
    if (acao === "role_toggle") {
      if (!orgAdmin) return json({ ok: false, reason: "sem_org" });
      const papel = String(b.papel || "");
      if (!PAPEIS.includes(papel)) return json({ ok: false, reason: "papel_invalido" });
      const ativo = b.ativo === true;
      await admin
        .from("org_papeis")
        .upsert({ org_id: orgAdmin, papel, ativo }, { onConflict: "org_id,papel" });
      return json({ ok: true, papel, ativo });
    }

    if (acao === "staff_add") {
      if (!orgAdmin) return json({ ok: false, reason: "sem_org" });
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      const papel = String(b.papel || "vendedor");
      if (!email.includes("@")) return json({ ok: false, reason: "email_invalido" });
      if (!PAPEIS.includes(papel)) return json({ ok: false, reason: "papel_invalido" });
      // papel precisa estar ATIVO na org (respeita o toggle da tela Roles)
      const { data: rp } = await admin
        .from("org_papeis")
        .select("ativo")
        .eq("org_id", orgAdmin)
        .eq("papel", papel)
        .maybeSingle();
      if (rp && rp.ativo === false) return json({ ok: false, reason: "papel_desativado" });

      let u = await acharUsuarioPorEmail(email);
      if (!u) {
        const { data: novo, error } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
        });
        if (error)
          return json({ ok: false, reason: "falha_criar_usuario", detalhe: error.message });
        u = novo.user;
      }
      await admin
        .from("memberships")
        .upsert({ org_id: orgAdmin, user_id: u.id, papel }, { onConflict: "org_id,user_id" });
      return json({ ok: true, user_id: u.id, email, papel });
    }

    if (acao === "staff_remove") {
      if (!orgAdmin) return json({ ok: false, reason: "sem_org" });
      const uid = String(b.user_id || "");
      if (uid === userData.user.id) return json({ ok: false, reason: "nao_remova_a_si" });
      await admin.from("memberships").delete().eq("org_id", orgAdmin).eq("user_id", uid);
      return json({ ok: true, removido: uid });
    }

    if (acao === "user_add") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      if (!email.includes("@")) return json({ ok: false, reason: "email_invalido" });
      let u = await acharUsuarioPorEmail(email);
      if (!u) {
        const { data: novo, error } = await admin.auth.admin.createUser({
          email,
          email_confirm: true,
          password: crypto.randomUUID(),
        });
        if (error)
          return json({ ok: false, reason: "falha_criar_usuario", detalhe: error.message });
        u = novo.user;
      }
      // novo usuário de plataforma nasce como ADMIN da própria org (mesmo backfill dos donos)
      let { data: org } = await admin
        .from("orgs")
        .select("id")
        .eq("dono_user_id", u.id)
        .maybeSingle();
      if (!org) {
        const ins = await admin
          .from("orgs")
          .insert({ nome: email.split("@")[0], dono_user_id: u.id })
          .select("id")
          .single();
        org = ins.data;
      }
      if (org)
        await admin
          .from("memberships")
          .upsert(
            { org_id: org.id, user_id: u.id, papel: "admin" },
            { onConflict: "org_id,user_id" },
          );
      return json({ ok: true, user_id: u.id, email });
    }

    return json({ ok: false, reason: "acao_desconhecida" });
  } catch (e) {
    return json({ ok: false, reason: "erro", detalhe: e instanceof Error ? e.message : String(e) });
  }
});
