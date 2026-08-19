import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InstagramProfileRow = Database["public"]["Tables"]["instagram_profiles"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type CampaignRow = Database["public"]["Tables"]["campanhas"]["Row"];
type OutreachRow = Database["public"]["Tables"]["instagram_outreach_tasks"]["Row"];

export type InstagramLead = InstagramProfileRow & {
  lead: Pick<
    LeadRow,
    | "id"
    | "business_name"
    | "category"
    | "city"
    | "state"
    | "email"
    | "whatsapp"
    | "instagram_url"
    | "score"
    | "status"
  >;
};

export type InstagramCampaign = CampaignRow & {
  total: number;
  sent: number;
  replied: number;
};

export type InstagramOutreachTask = OutreachRow & {
  lead: Pick<LeadRow, "business_name" | "instagram_url"> | null;
};

async function contextoAtual() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error("Usuário não autenticado.");
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", auth.user.id)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error("Organização não encontrada.");
  return { userId: auth.user.id, orgId: membership.org_id };
}

export async function listarInstagramLeads(limite = 250): Promise<InstagramLead[]> {
  const { data: profiles, error } = await supabase
    .from("instagram_profiles")
    .select("*")
    .order("collected_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  if (!profiles?.length) return [];

  const ids = profiles.map((profile) => profile.lead_id);
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select(
      "id, business_name, category, city, state, email, whatsapp, instagram_url, score, status",
    )
    .in("id", ids);
  if (leadsError) throw leadsError;
  const leadById = new Map((leads ?? []).map((lead) => [lead.id, lead]));
  return profiles.flatMap((profile) => {
    const lead = leadById.get(profile.lead_id);
    return lead ? [{ ...profile, lead }] : [];
  });
}

export async function listarCampanhasInstagram(): Promise<InstagramCampaign[]> {
  const { data: campaigns, error } = await supabase
    .from("campanhas")
    .select("*")
    .eq("canal", "instagram_assisted")
    .order("criada_em", { ascending: false });
  if (error) throw error;
  if (!campaigns?.length) return [];
  const { data: tasks, error: tasksError } = await supabase
    .from("instagram_outreach_tasks")
    .select("campanha_id, state")
    .in(
      "campanha_id",
      campaigns.map((campaign) => campaign.id),
    );
  if (tasksError) throw tasksError;
  return campaigns.map((campaign) => {
    const own = (tasks ?? []).filter((task) => task.campanha_id === campaign.id);
    return {
      ...campaign,
      total: own.length,
      sent: own.filter((task) =>
        ["sent", "replied", "interested", "converted"].includes(task.state),
      ).length,
      replied: own.filter((task) => ["replied", "interested", "converted"].includes(task.state))
        .length,
    };
  });
}

export async function criarCampanhaInstagram(params: {
  nome: string;
  mensagem: string;
  leads: InstagramLead[];
}): Promise<string> {
  if (!params.leads.length) throw new Error("Selecione pelo menos um perfil.");
  const { userId, orgId } = await contextoAtual();
  const { data: campaign, error } = await supabase
    .from("campanhas")
    .insert({
      nome: params.nome.trim(),
      canal: "instagram_assisted",
      user_id: userId,
      org_id: orgId,
      ig_config: { template: params.mensagem, mode: "assisted" },
    })
    .select("id")
    .single();
  if (error) throw error;

  const tasks = params.leads.map((profile) => ({
    org_id: orgId,
    user_id: userId,
    campanha_id: campaign.id,
    lead_id: profile.lead_id,
    assigned_to: userId,
    state: "ready",
    message_text: params.mensagem
      .replaceAll("{{nome}}", profile.full_name || profile.lead.business_name)
      .replaceAll("{{usuario}}", profile.username)
      .replaceAll("{{cidade}}", profile.lead.city || "sua cidade"),
  }));
  const { error: tasksError } = await supabase.from("instagram_outreach_tasks").insert(tasks);
  if (tasksError) throw tasksError;
  return campaign.id;
}

export async function listarTarefasInstagram(campanhaId: string): Promise<InstagramOutreachTask[]> {
  const { data: tasks, error } = await supabase
    .from("instagram_outreach_tasks")
    .select("*, lead:leads(business_name, instagram_url)")
    .eq("campanha_id", campanhaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (tasks ?? []) as InstagramOutreachTask[];
}

export async function atualizarTarefaInstagram(
  id: string,
  state: InstagramOutreachTask["state"],
): Promise<void> {
  const agora = new Date().toISOString();
  const timestamps =
    state === "opened"
      ? { opened_at: agora }
      : state === "sent"
        ? { sent_at: agora }
        : state === "replied"
          ? { replied_at: agora }
          : {};
  const { error } = await supabase
    .from("instagram_outreach_tasks")
    .update({ state, updated_at: agora, ...timestamps })
    .eq("id", id);
  if (error) throw error;
}
