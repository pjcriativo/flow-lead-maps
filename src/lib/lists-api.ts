// PARTE 3 — "Minhas Listas": cada busca vira uma lista salva (lead_lists) com os
// leads daquela busca vinculados por list_id. Grava SEMPRE com o user_id do usuário
// logado (auth.uid()) — mesmo critério do RLS que a listagem usa, então o que é
// gravado é exatamente o que é lido de volta.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Lead } from "@/lib/leads-api";

export type LeadList = Database["public"]["Tables"]["lead_lists"]["Row"];

/** Lista + estatísticas ao vivo (contadas a partir dos leads, sem depender de colunas denormalizadas). */
export type LeadListComStats = LeadList & {
  leads_atuais: number;
  gold_count: number;
  enriched_atuais: number;
};

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Você precisa estar logado.");
  return data.user.id;
}

/** Nome automático da lista a partir dos parâmetros da busca (editável depois). */
export function nomeAutoLista(niche: string, city: string, uf: string): string {
  const local = [city.trim(), uf.trim()].filter(Boolean).join("/");
  return [niche.trim() || "Busca", local].filter(Boolean).join(" — ");
}

/**
 * Cria a lista da busca e vincula os leads (por id) a ela. Grava com o user_id do
 * usuário logado; a atualização dos leads respeita o RLS (só mexe nos próprios).
 */
export async function criarListaComLeads(params: {
  name: string;
  niche: string;
  city: string;
  uf: string;
  fonte: string;
  radius: number;
  leadIds: string[];
}): Promise<LeadList> {
  const user_id = await getUserId();
  const { data: lista, error } = await supabase
    .from("lead_lists")
    .insert({
      user_id,
      name: params.name.trim() || nomeAutoLista(params.niche, params.city, params.uf),
      niche: params.niche || "—",
      city: params.city || "—",
      uf: params.uf || null,
      fonte: params.fonte || null,
      radius: params.radius,
      total_leads: params.leadIds.length,
    })
    .select()
    .single();
  if (error || !lista) throw new Error(error?.message ?? "Falha ao criar a lista");

  if (params.leadIds.length) {
    const { error: upErr } = await supabase
      .from("leads")
      .update({ list_id: lista.id })
      .in("id", params.leadIds);
    if (upErr) throw new Error("Lista criada, mas falhou ao vincular os leads: " + upErr.message);
  }
  return lista;
}

/** Lista as listas do usuário com contagens ao vivo (nº de leads, cliente-ouro, enriquecidos). */
export async function listarListas(): Promise<LeadListComStats[]> {
  const [{ data: listas, error: e1 }, { data: leads, error: e2 }] = await Promise.all([
    supabase.from("lead_lists").select("*").order("created_at", { ascending: false }),
    supabase.from("leads").select("list_id, status, score_breakdown"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const stats = new Map<string, { total: number; gold: number; enriched: number }>();
  for (const l of leads ?? []) {
    const lid = (l as { list_id: string | null }).list_id;
    if (!lid) continue;
    const s = stats.get(lid) ?? { total: 0, gold: 0, enriched: 0 };
    s.total += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((l as any).score_breakdown?.is_gold) s.gold += 1;
    if ((l as { status: string }).status !== "new") s.enriched += 1;
    stats.set(lid, s);
  }

  return (listas ?? []).map((ll) => {
    const s = stats.get(ll.id) ?? { total: 0, gold: 0, enriched: 0 };
    return { ...ll, leads_atuais: s.total, gold_count: s.gold, enriched_atuais: s.enriched };
  });
}

export async function renomearLista(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("lead_lists").update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
}

/** Exclui a lista. Os leads vinculados são apagados junto (FK on delete cascade). */
export async function excluirLista(id: string): Promise<void> {
  const { error } = await supabase.from("lead_lists").delete().eq("id", id);
  if (error) throw error;
}

/** Leads de uma lista específica (ordenados por score). */
export async function fetchLeadsDaLista(listId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("list_id", listId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
