// PARTE 3 — "Minhas Listas": cada busca vira uma lista salva (lead_lists) com os
// leads daquela busca vinculados por list_id. Grava SEMPRE com o user_id do usuário
// logado (auth.uid()) — mesmo critério do RLS que a listagem usa, então o que é
// gravado é exatamente o que é lido de volta.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Lead } from "@/lib/leads-api";
import { nomeAutoLista } from "@/lib/list-naming";

export { nomeAutoLista } from "@/lib/list-naming";

export type LeadList = Database["public"]["Tables"]["lead_lists"]["Row"];

/** Lista + estatísticas ao vivo (contadas a partir dos leads, sem depender de colunas denormalizadas). */
export type LeadListComStats = LeadList & {
  leads_atuais: number;
  gold_count: number;
  enriched_atuais: number;
  /** Leads da lista em 'proposta_enviada' — pool elegível ao follow-up automático. */
  proposta_enviada_atuais: number;
};

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Você precisa estar logado.");
  return data.user.id;
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
  if (params.leadIds.length === 0) {
    throw new Error("Não é possível criar uma lista vazia.");
  }
  const uniqueLeadIds = [...new Set(params.leadIds)].filter(Boolean);
  if (uniqueLeadIds.length === 0) throw new Error("A lista não contém IDs de leads válidos.");
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
      total_leads: uniqueLeadIds.length,
    })
    .select()
    .single();
  if (error || !lista) throw new Error(error?.message ?? "Falha ao criar a lista");

  const { error: upErr } = await supabase
    .from("leads")
    .update({ list_id: lista.id })
    .in("id", uniqueLeadIds);
  if (upErr) {
    throw new Error(`Lista ${lista.id} criada, mas falhou ao vincular os leads: ${upErr.message}`);
  }

  // Uma atualização filtrada pelo RLS pode afetar menos linhas sem retornar erro. Só há
  // sucesso depois de reler o estado persistido e confirmar todos os IDs desta execução.
  const { data: vinculados, error: verifyErr } = await supabase
    .from("leads")
    .select("id")
    .eq("list_id", lista.id)
    .in("id", uniqueLeadIds);
  if (verifyErr || vinculados?.length !== uniqueLeadIds.length) {
    throw new Error(
      `Lista ${lista.id} criada, mas a associação ficou incompleta: ${vinculados?.length ?? 0}/${uniqueLeadIds.length} leads vinculados.`,
    );
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

  const stats = new Map<string, { total: number; gold: number; enriched: number; prop: number }>();
  for (const l of leads ?? []) {
    const lid = (l as { list_id: string | null }).list_id;
    if (!lid) continue;
    const s = stats.get(lid) ?? { total: 0, gold: 0, enriched: 0, prop: 0 };
    s.total += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((l as any).score_breakdown?.is_gold) s.gold += 1;
    const status = (l as { status: string }).status;
    if (status !== "new") s.enriched += 1;
    if (status === "proposta_enviada") s.prop += 1;
    stats.set(lid, s);
  }

  return (listas ?? []).map((ll) => {
    const s = stats.get(ll.id) ?? { total: 0, gold: 0, enriched: 0, prop: 0 };
    return {
      ...ll,
      leads_atuais: s.total,
      gold_count: s.gold,
      enriched_atuais: s.enriched,
      proposta_enviada_atuais: s.prop,
    };
  });
}

/** FIX 2 — liga/desliga o follow-up automático de uma lista (opt-in por lista).
 * Default é DESLIGADO; só o dono liga (RLS por user_id). O cron só processa listas
 * ligadas. */
export async function setFollowUpAtivo(listId: string, ativo: boolean): Promise<void> {
  const { error } = await supabase
    .from("lead_lists")
    .update({ follow_up_ativo: ativo })
    .eq("id", listId);
  if (error) throw error;
}

export async function renomearLista(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("lead_lists").update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
}

/** Vincula leads a uma lista EXISTENTE (seleção em massa). Como list_id é único por lead, um
 * lead que já estava em outra lista é MOVIDO — não fica em duas. */
export async function adicionarLeadsALista(listId: string, leadIds: string[]): Promise<void> {
  if (!leadIds.length) return;
  const { error } = await supabase.from("leads").update({ list_id: listId }).in("id", leadIds);
  if (error) throw error;
}

/** Cria uma lista NOVA a partir de leads selecionados. Deriva nicho/cidade/uf do 1º lead só
 * para preencher os campos da lista (não afeta os leads). */
export async function criarListaDeLeads(name: string, leads: Lead[]): Promise<LeadList> {
  const user_id = await getUserId();
  const base = leads[0];
  const { data: lista, error } = await supabase
    .from("lead_lists")
    .insert({
      user_id,
      name: name.trim() || nomeAutoLista(base?.category ?? "", base?.city ?? "", base?.state ?? ""),
      niche: base?.category || "—",
      city: base?.city || "—",
      uf: base?.state || null,
      fonte: "manual",
      radius: 0,
      total_leads: leads.length,
    })
    .select()
    .single();
  if (error || !lista) throw new Error(error?.message ?? "Falha ao criar a lista");
  await adicionarLeadsALista(
    lista.id,
    leads.map((l) => l.id),
  );
  return lista;
}

/**
 * Exclui somente listas comprovadamente vazias e somente por papel administrativo.
 * A checagem reduz o risco na aplicação; ON DELETE RESTRICT no banco ainda é necessário
 * para eliminar a janela de corrida entre a contagem e o DELETE.
 */
export async function excluirLista(id: string): Promise<void> {
  await getUserId();
  const { data: lista, error: listaErr } = await supabase
    .from("lead_lists")
    .select("id, org_id")
    .eq("id", id)
    .single();
  if (listaErr || !lista) throw new Error("Lista não encontrada ou acesso negado.");
  if (!lista.org_id) {
    throw new Error("Não foi possível validar a organização desta lista. Exclusão bloqueada.");
  }

  const [{ data: isSuperAdmin, error: superErr }, { data: papel, error: papelErr }] =
    await Promise.all([
      supabase.rpc("eh_super_admin"),
      supabase.rpc("papel_do_usuario", { p_org: lista.org_id }),
    ]);
  if (superErr || papelErr) {
    throw new Error("Não foi possível validar sua permissão. Exclusão bloqueada.");
  }
  if (!isSuperAdmin && !["admin", "gerente"].includes(papel ?? "")) {
    throw new Error("Somente administradores ou gerentes podem excluir listas.");
  }

  const { count, error: countErr } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("list_id", id);
  if (countErr) throw new Error("Não foi possível verificar os leads. Exclusão bloqueada.");
  if ((count ?? 0) > 0) {
    throw new Error(
      `Lista não pode ser excluída: ${count} leads vinculados seriam apagados. Remova o risco no banco antes de tentar novamente.`,
    );
  }

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
