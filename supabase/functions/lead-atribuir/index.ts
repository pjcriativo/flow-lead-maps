// Edge: lead-atribuir — handoff de um lead a um colaborador da MESMA org, com histórico.
//
// 🔒 AUTORIZAÇÃO (server-side): quem chama tem que ser admin/gerente da org do lead (redistribui
// qualquer um) OU o SDR/vendedor dono atual passando adiante (só o próprio lead). O destino tem
// que ser membro da MESMA org. Nada disso confia no client — tudo relido do banco.
// 📝 Grava lead_atribuicoes (de→para, quem, motivo) e move leads.assigned_to. A visibilidade
// (RLS) muda junto: o novo responsável passa a ver; o antigo, se vendedor/sdr, deixa de ver.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

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
  const quem = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let b: { lead_id?: string; para_user_id?: string; motivo?: string };
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const leadId = String(b?.lead_id || "");
  const paraUser = String(b?.para_user_id || "");
  if (!leadId || !paraUser) return json({ ok: false, reason: "faltam_campos" });

  // lead + org + responsável atual
  const { data: lead } = await admin
    .from("leads")
    .select("id, org_id, assigned_to")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return json({ ok: false, reason: "lead_nao_encontrado" });

  // papel de QUEM chama, na org do lead
  const { data: memQuem } = await admin
    .from("memberships")
    .select("papel")
    .eq("org_id", lead.org_id)
    .eq("user_id", quem)
    .maybeSingle();
  const ehSuper = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", quem)
    .maybeSingle()
    .then((r) => r.data?.is_super_admin === true);
  const papel = memQuem?.papel ?? (ehSuper ? "super_admin" : null);
  if (!papel) return json({ ok: false, reason: "sem_acesso_a_org" }, 403);

  // regra: admin/gerente/super redistribuem qualquer lead; vendedor/sdr só o PRÓPRIO
  const podeRedistribuir = ["admin", "gerente", "super_admin"].includes(papel);
  if (!podeRedistribuir && lead.assigned_to !== quem)
    return json({ ok: false, reason: "so_o_dono_atual_passa_adiante" }, 403);

  // destino tem que ser membro da MESMA org (não dá pra jogar o lead pra fora)
  const { data: memDestino } = await admin
    .from("memberships")
    .select("papel")
    .eq("org_id", lead.org_id)
    .eq("user_id", paraUser)
    .maybeSingle();
  if (!memDestino) return json({ ok: false, reason: "destino_nao_e_da_org" });

  // move + registra o histórico (o "de" é o responsável atual)
  const { error: upErr } = await admin
    .from("leads")
    .update({ assigned_to: paraUser })
    .eq("id", leadId);
  if (upErr) return json({ ok: false, reason: "falha_update", detalhe: upErr.message });

  await admin.from("lead_atribuicoes").insert({
    lead_id: leadId,
    org_id: lead.org_id,
    de_user_id: lead.assigned_to,
    para_user_id: paraUser,
    por_user_id: quem,
    motivo: (b?.motivo ?? "").slice(0, 200) || null,
  });

  return json({ ok: true, lead_id: leadId, de: lead.assigned_to, para: paraUser });
});
