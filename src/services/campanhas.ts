// Camada de serviço — CAMPANHAS (Fase 2) LIGADA ao Supabase (RLS pela sessão).
// Uma campanha nasce de uma LISTA e reúne as propostas (rascunho) geradas para os
// leads elegíveis dela (com site publicado e ainda sem proposta). A revisão em lote
// aprova/edita/envia essas propostas reusando o PORTÃO DE REVISÃO (send-proposal só
// aceita 'aprovada') e a RAMPA POR ORG (teto do dia da própria org).
import { supabase } from "@/integrations/supabase/client";
import type { Campanha, Proposta } from "@/types";
import { gerarProposta, enviarProposta } from "@/services/propostas";

type CampanhaRow = {
  id: string;
  list_id: string | null;
  nome: string;
  status: Campanha["status"];
  criada_em: string;
};

const CONTAGEM_VAZIA = { total: 0, rascunho: 0, aprovada: 0, enviada: 0, respondida: 0 };

/** Lista as campanhas do usuário com as contagens de propostas por status. */
export async function listarCampanhas(): Promise<Campanha[]> {
  const [{ data: camps, error: cErr }, { data: props, error: pErr }] = await Promise.all([
    supabase
      .from("campanhas")
      .select("id, list_id, nome, status, criada_em")
      .order("criada_em", { ascending: false }),
    supabase.from("propostas").select("campanha_id, status").not("campanha_id", "is", null),
  ]);
  if (cErr) throw cErr;
  if (pErr) throw pErr;

  const contagem = new Map<string, typeof CONTAGEM_VAZIA>();
  for (const p of (props ?? []) as Array<{ campanha_id: string; status: string }>) {
    const c = contagem.get(p.campanha_id) ?? { ...CONTAGEM_VAZIA };
    c.total += 1;
    if (p.status in c) (c as unknown as Record<string, number>)[p.status] += 1;
    contagem.set(p.campanha_id, c);
  }

  return ((camps ?? []) as CampanhaRow[]).map((c) => ({
    id: c.id,
    list_id: c.list_id,
    nome: c.nome,
    status: c.status,
    criada_em: c.criada_em,
    ...(contagem.get(c.id) ?? { ...CONTAGEM_VAZIA }),
  }));
}

export type CriarCampanhaResult = {
  campanha_id: string;
  geradas: number; // propostas rascunho criadas
  sem_site: number; // leads da lista sem site publicado (não entram)
  ja_com_proposta: number; // leads que já tinham proposta (pulados)
};

/** Cria a campanha a partir de uma lista e GERA as propostas (rascunho) para os
 * leads elegíveis: os que têm site publicado ativo e ainda não têm proposta.
 * Reporta honestamente quantos ficaram de fora (sem site / já com proposta). */
export async function criarCampanhaDaLista(
  listId: string,
  nome: string,
): Promise<CriarCampanhaResult> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");

  // Leads da lista.
  const { data: leadsDaLista, error: lErr } = await supabase
    .from("leads")
    .select("id")
    .eq("list_id", listId);
  if (lErr) throw lErr;
  const leadIds = (leadsDaLista ?? []).map((l) => (l as { id: string }).id);
  if (leadIds.length === 0)
    throw new Error("Esta lista está vazia — não há leads para gerar propostas.");

  const nowIso = new Date().toISOString();
  // Leads com site publicado ATIVO.
  const { data: sites, error: sErr } = await supabase
    .from("sites_publicados")
    .select("lead_id")
    .in("lead_id", leadIds)
    .eq("arquivos_removidos", false)
    .neq("status", "reprovado")
    .gt("expira_em", nowIso);
  if (sErr) throw sErr;
  const comSite = new Set((sites ?? []).map((s) => (s as { lead_id: string }).lead_id));

  // Leads que já têm proposta (não duplica).
  const { data: props, error: pErr } = await supabase.from("propostas").select("lead_id");
  if (pErr) throw pErr;
  const comProposta = new Set((props ?? []).map((p) => (p as { lead_id: string }).lead_id));

  const elegiveis = leadIds.filter((id) => comSite.has(id) && !comProposta.has(id));
  const semSite = leadIds.filter((id) => !comSite.has(id)).length;
  const jaComProposta = leadIds.filter((id) => comSite.has(id) && comProposta.has(id)).length;

  // Cria a campanha.
  const { data: camp, error: cErr } = await supabase
    .from("campanhas")
    .insert({ user_id: userId, list_id: listId, nome: nome.trim() || "Campanha", status: "ativa" })
    .select("id")
    .single();
  if (cErr || !camp) throw new Error(cErr?.message ?? "Falha ao criar a campanha");

  // Gera as propostas (rascunho) vinculadas à campanha. Erros por lead são pulados.
  let geradas = 0;
  for (const leadId of elegiveis) {
    try {
      await gerarProposta(leadId, camp.id);
      geradas += 1;
    } catch {
      /* pula o lead problemático — não derruba a campanha inteira */
    }
  }

  return { campanha_id: camp.id, geradas, sem_site: semSite, ja_com_proposta: jaComProposta };
}

/** Renomeia a campanha. */
export async function renomearCampanha(id: string, nome: string): Promise<void> {
  const { error } = await supabase.from("campanhas").update({ nome: nome.trim() }).eq("id", id);
  if (error) throw error;
}

/** Exclui a campanha (as propostas continuam existindo, só desvinculadas). */
export async function excluirCampanha(id: string): Promise<void> {
  const { error } = await supabase.from("campanhas").delete().eq("id", id);
  if (error) throw error;
}

/** REVISÃO EM LOTE — aprova de uma vez todas as propostas em rascunho da campanha
 * (rascunho → aprovada). O texto atual de cada uma é o que será enviado. Devolve
 * quantas foram aprovadas. */
export async function aprovarTodasDaCampanha(campanhaId: string): Promise<number> {
  const { data, error } = await supabase
    .from("propostas")
    .update({ status: "aprovada", aprovada_em: new Date().toISOString() })
    .eq("campanha_id", campanhaId)
    .eq("status", "rascunho")
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

export type EnviarLoteResult = {
  enviadas: number;
  sem_email: number;
  opt_out: number;
  teto_dia: number;
  erro: number;
};

/** REVISÃO EM LOTE — envia todas as propostas APROVADAS da campanha, uma a uma,
 * respeitando o portão (só aprovada) e a rampa por org (para no teto do dia). */
export async function enviarAprovadasDaCampanha(campanhaId: string): Promise<EnviarLoteResult> {
  const { data: aprovadas, error } = await supabase
    .from("propostas")
    .select("id")
    .eq("campanha_id", campanhaId)
    .eq("status", "aprovada")
    .order("criada_em", { ascending: true });
  if (error) throw error;

  const r: EnviarLoteResult = { enviadas: 0, sem_email: 0, opt_out: 0, teto_dia: 0, erro: 0 };
  for (const p of (aprovadas ?? []) as Array<{ id: string }>) {
    try {
      const res = await enviarProposta(p.id);
      if (res.ok) {
        r.enviadas += 1;
      } else if (res.reason === "teto_dia") {
        r.teto_dia += 1;
        break; // bateu o teto do dia da org — o resto sai amanhã
      } else if (res.reason === "sem_email") {
        r.sem_email += 1;
      } else if (res.reason === "opt_out") {
        r.opt_out += 1;
      } else {
        r.erro += 1; // nao_aprovada (não deveria acontecer aqui) etc.
      }
    } catch {
      r.erro += 1;
    }
  }
  return r;
}

export type { Campanha, Proposta };
