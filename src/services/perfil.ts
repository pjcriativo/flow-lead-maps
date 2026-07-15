// Perfil da org (profiles, RLS pelo dono). Hoje serve a UMA coisa: o {remetente} que assina
// a proposta e o follow-up. É `full_name` — nome PESSOAL, não da empresa: quem recebe o e-mail
// responde pra uma pessoa. Nunca hardcoded no código (a copy aprovada exige configurável).
import { supabase } from "@/integrations/supabase/client";

async function idDaOrg(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Não autenticado");
  return id;
}

/** Nome que assina os e-mails. "" = não configurado (a geração de proposta bloqueia). */
export async function lerNomeRemetente(): Promise<string> {
  const id = await idDaOrg();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return ((data as { full_name: string | null } | null)?.full_name ?? "").trim();
}

export async function salvarNomeRemetente(nome: string): Promise<void> {
  const id = await idDaOrg();
  const limpo = nome.trim();
  if (!limpo) throw new Error("O nome não pode ficar vazio");
  // UPDATE (não upsert): a RLS de profiles tem policy de SELECT e UPDATE, mas NÃO de INSERT
  // — um upsert bateria em 42501. A linha existe: o trigger on_auth_user_created a cria.
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: limpo, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Perfil não encontrado para esta conta.");
}
