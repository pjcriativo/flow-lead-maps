// Colaboradores da org + atribuição (handoff) de leads. Leituras por RLS (memberships da org
// que o usuário enxerga); a reatribuição passa pela Edge lead-atribuir (autorização server-side).
import { supabase } from "@/integrations/supabase/client";

export type Membro = { user_id: string; papel: string; email: string; nome: string | null };

/** Membros da org do lead (para o seletor de responsável). Junta memberships + profiles. */
export async function listarMembrosDaOrg(orgId: string): Promise<Membro[]> {
  const { data: mem, error } = await supabase
    .from("memberships")
    .select("user_id, papel")
    .eq("org_id", orgId);
  if (error) throw error;
  const ids = (mem ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data: perfis } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", ids);
  const perfilDe = new Map((perfis ?? []).map((p) => [p.id, p]));
  return (mem ?? []).map((m) => ({
    user_id: m.user_id,
    papel: m.papel,
    email: perfilDe.get(m.user_id)?.email ?? "?",
    nome: perfilDe.get(m.user_id)?.full_name ?? null,
  }));
}

export type AtribuirResp = { ok: boolean; reason?: string; de?: string | null; para?: string };

/** Reatribui o lead a um colaborador da org (Edge valida papel/organização e grava histórico). */
export async function atribuirLead(
  leadId: string,
  paraUserId: string,
  motivo?: string,
): Promise<AtribuirResp> {
  const { data, error } = await supabase.functions.invoke("lead-atribuir", {
    body: { lead_id: leadId, para_user_id: paraUserId, motivo },
  });
  if (error) throw new Error(error.message);
  return data as AtribuirResp;
}
