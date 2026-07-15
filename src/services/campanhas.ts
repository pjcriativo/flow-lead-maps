// Camada de serviço — CAMPANHAS (Fase 2, portão do site) LIGADA ao Supabase (RLS).
// Modelo SOB DEMANDA: criar campanha de uma lista NÃO gera nada — só cria campanha_leads
// 'pendente' (custo zero). O usuário SELECIONA quem preparar → só esses geram site
// (reusando redesign pronto quando houver) + proposta rascunho, revisada por PREVIEW
// (iframe do HTML, sem publicar). Publicar (URL pública) só acontece na APROVAÇÃO.
// Mantém intactos: portão da proposta, envio em lote, rampa por org.
import { supabase } from "@/integrations/supabase/client";
import type { Campanha, CampanhaLeadView, Proposta } from "@/types";
import { classificarMotivo } from "@/lib/copy-proposta";
import {
  injetarLinkPrevia,
  enviarProposta,
  salvarProposta,
  listarPropostasPorCampanha,
} from "@/services/propostas";
import { publicarSite } from "@/services/publicacao";

type CampanhaRow = {
  id: string;
  list_id: string | null;
  nome: string;
  status: Campanha["status"];
  criada_em: string;
};

const CONTAGEM_VAZIA = {
  total: 0,
  pendente: 0,
  rascunho: 0,
  aprovado: 0,
  enviado: 0,
  descartado: 0,
  erro: 0,
};

/** Lista as campanhas do usuário com as contagens dos leads por estado. 'enviado' =
 * lead aprovado cuja proposta já saiu (proposta.status='enviada'). */
export async function listarCampanhas(): Promise<Campanha[]> {
  const [{ data: camps, error: cErr }, { data: cls, error: clErr }, { data: props, error: pErr }] =
    await Promise.all([
      supabase
        .from("campanhas")
        .select("id, list_id, nome, status, criada_em")
        .order("criada_em", { ascending: false }),
      supabase.from("campanha_leads").select("campanha_id, estado, proposta_id"),
      supabase.from("propostas").select("id, status").not("campanha_id", "is", null),
    ]);
  if (cErr) throw cErr;
  if (clErr) throw clErr;
  if (pErr) throw pErr;

  const statusProposta = new Map(
    (props ?? []).map((p) => [(p as { id: string }).id, (p as { status: string }).status]),
  );
  const contagem = new Map<string, typeof CONTAGEM_VAZIA>();
  for (const cl of (cls ?? []) as Array<{
    campanha_id: string;
    estado: string;
    proposta_id: string | null;
  }>) {
    const c = contagem.get(cl.campanha_id) ?? { ...CONTAGEM_VAZIA };
    c.total += 1;
    // 'gerando' conta como pendente (em preparo).
    if (cl.estado === "aprovado") {
      if (cl.proposta_id && statusProposta.get(cl.proposta_id) === "enviada") c.enviado += 1;
      else c.aprovado += 1;
    } else if (cl.estado === "gerando") {
      c.pendente += 1;
    } else if (cl.estado in c) {
      (c as unknown as Record<string, number>)[cl.estado] += 1;
    }
    contagem.set(cl.campanha_id, c);
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

/** Cria a campanha a partir de uma lista. CUSTO ZERO: NÃO gera site nem proposta —
 * só cria os campanha_leads 'pendente' (TODOS os leads da lista entram). */
export async function criarCampanhaDaLista(
  listId: string,
  nome: string,
): Promise<{ campanha_id: string; total: number }> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const { data: leadsDaLista, error: lErr } = await supabase
    .from("leads")
    .select("id")
    .eq("list_id", listId);
  if (lErr) throw lErr;
  const leadIds = (leadsDaLista ?? []).map((l) => (l as { id: string }).id);
  if (leadIds.length === 0) throw new Error("Esta lista está vazia — não há leads.");

  const { data: camp, error: cErr } = await supabase
    .from("campanhas")
    .insert({ user_id: userId, list_id: listId, nome: nome.trim() || "Campanha", status: "ativa" })
    .select("id")
    .single();
  if (cErr || !camp) throw new Error(cErr?.message ?? "Falha ao criar a campanha");

  const linhas = leadIds.map((lead_id) => ({
    campanha_id: camp.id,
    lead_id,
    user_id: userId,
    estado: "pendente",
  }));
  const { error: iErr } = await supabase.from("campanha_leads").insert(linhas);
  if (iErr) {
    // desfaz a campanha se não conseguiu semear os leads (não deixa campanha órfã)
    await supabase.from("campanhas").delete().eq("id", camp.id);
    throw new Error("Falha ao adicionar os leads à campanha: " + iErr.message);
  }
  return { campanha_id: camp.id, total: leadIds.length };
}

/** Carrega a revisão em lote: cada lead da campanha + o que já foi preparado
 * (redesign/proposta) + indicadores (tem site próprio, tem redesign pronto reusável). */
export async function listarCampanhaLeadsView(campanhaId: string): Promise<CampanhaLeadView[]> {
  const { data: cls, error } = await supabase
    .from("campanha_leads")
    .select("id, lead_id, estado, redesign_id, proposta_id, motivo_descarte, erro, criado_em")
    .eq("campanha_id", campanhaId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  const linhas = (cls ?? []) as Array<{
    id: string;
    lead_id: string;
    estado: CampanhaLeadView["estado"];
    redesign_id: string | null;
    proposta_id: string | null;
    motivo_descarte: string | null;
    erro: string | null;
  }>;
  const leadIds = linhas.map((l) => l.lead_id);
  if (leadIds.length === 0) return [];

  const nowIso = new Date().toISOString();
  const redesignIds = linhas.map((l) => l.redesign_id).filter((x): x is string => !!x);
  const [{ data: leads }, { data: reds }, { data: sites }, propostas] = await Promise.all([
    supabase.from("leads").select("id, business_name, email, website").in("id", leadIds),
    // redesigns 'pronto' NÃO expirados desses leads → reusáveis (não regenera).
    supabase
      .from("redesigns")
      .select("lead_id")
      .in("lead_id", leadIds)
      .eq("status", "pronto")
      .gt("expira_em", nowIso),
    // site publicado ativo de cada redesign da campanha → url_publica ("Abrir site").
    redesignIds.length
      ? supabase
          .from("sites_publicados")
          .select("redesign_id, url_publica")
          .in("redesign_id", redesignIds)
          .eq("arquivos_removidos", false)
          .neq("status", "reprovado")
          .gt("expira_em", nowIso)
      : Promise.resolve({ data: [] as { redesign_id: string; url_publica: string }[] }),
    listarPropostasPorCampanha(campanhaId),
  ]);

  const leadById = new Map((leads ?? []).map((l) => [(l as { id: string }).id, l]));
  const temRedesignPronto = new Set((reds ?? []).map((r) => (r as { lead_id: string }).lead_id));
  const urlPorRedesign = new Map(
    ((sites ?? []) as { redesign_id: string; url_publica: string }[]).map((s) => [
      s.redesign_id,
      s.url_publica,
    ]),
  );
  const propById = new Map(propostas.map((p) => [p.id, p]));

  return linhas.map((cl) => {
    const lead = leadById.get(cl.lead_id) as
      { business_name: string; email: string | null; website: string | null } | undefined;
    return {
      id: cl.id,
      lead_id: cl.lead_id,
      lead_nome: lead?.business_name ?? "—",
      lead_email: lead?.email ?? null,
      tem_website: !!lead?.website,
      tem_redesign_pronto: temRedesignPronto.has(cl.lead_id),
      estado: cl.estado,
      redesign_id: cl.redesign_id,
      proposta_id: cl.proposta_id,
      proposta: cl.proposta_id ? (propById.get(cl.proposta_id) ?? null) : null,
      url_publica: cl.redesign_id ? (urlPorRedesign.get(cl.redesign_id) ?? null) : null,
      motivo_descarte: cl.motivo_descarte,
      erro: cl.erro,
    };
  });
}

/** Conclui a campanha (status='concluida'). NÃO apaga nada — leads 'pendente' ficam
 * intactos; a UI apenas trava as ações. Reabrir volta para 'ativa'. */
export async function concluirCampanha(id: string): Promise<void> {
  const { error } = await supabase.from("campanhas").update({ status: "concluida" }).eq("id", id);
  if (error) throw error;
}

export async function reabrirCampanha(id: string): Promise<void> {
  const { error } = await supabase.from("campanhas").update({ status: "ativa" }).eq("id", id);
  if (error) throw error;
}

/** redesign 'pronto' não expirado do lead (o mais recente) para REUSO — ou null. */
export async function redesignProntoDoLead(leadId: string): Promise<string | null> {
  const { data } = await supabase
    .from("redesigns")
    .select("id")
    .eq("lead_id", leadId)
    .eq("status", "pronto")
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * PORTÃO DA COPY: o lead tem um {motivo} classificável no score_breakdown?
 * Chamado ANTES de gerar o redesign (que custa IA) — barrar depois seria pagar por um lead
 * que nunca receberia e-mail. false → o lead vira 'sem_motivo' e o dono decide.
 */
export async function leadTemMotivoClaro(leadId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("leads")
    .select("score_breakdown")
    .eq("id", leadId)
    .single();
  if (error || !data) return false;
  return classificarMotivo((data as { score_breakdown: unknown }).score_breakdown) !== null;
}

/** Atualiza estado/vínculos de um campanha_lead (patch parcial). */
export async function atualizarCampanhaLead(
  id: string,
  patch: {
    estado?: CampanhaLeadView["estado"];
    redesign_id?: string | null;
    proposta_id?: string | null;
    erro?: string | null;
    motivo_descarte?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("campanha_leads")
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Descarta um lead da campanha (com motivo). Apaga a proposta rascunho (barata);
 * mantém o redesign (caro) para reuso. Não pode descartar o que já foi enviado. */
export async function descartarCampanhaLead(id: string, motivo: string): Promise<void> {
  const { data: cl } = await supabase
    .from("campanha_leads")
    .select("proposta_id")
    .eq("id", id)
    .single();
  const propostaId = (cl as { proposta_id: string | null } | null)?.proposta_id;
  if (propostaId) {
    // só remove a proposta se ainda for rascunho/aprovada (não enviada)
    await supabase
      .from("propostas")
      .delete()
      .eq("id", propostaId)
      .in("status", ["rascunho", "aprovada"]);
  }
  await atualizarCampanhaLead(id, {
    estado: "descartado",
    proposta_id: null,
    motivo_descarte: motivo.trim() || "Sem motivo informado",
  });
}

/** APROVAÇÃO (publish-on-approve, Etapa 3): publica o redesign do lead (gera a URL
 * pública), injeta o link na proposta (preservando o texto editado), aprova a proposta
 * e marca o lead 'aprovado'. ANTES disso, o redesign não tem NENHUMA URL pública.
 * Recebe a proposta editada (do diálogo) para gravar o texto final antes de publicar. */
export async function aprovarCampanhaLead(
  campanhaLeadId: string,
  propostaEditada: Proposta,
): Promise<Proposta> {
  const { data: cl, error: clErr } = await supabase
    .from("campanha_leads")
    .select("id, estado, redesign_id, proposta_id")
    .eq("id", campanhaLeadId)
    .single();
  if (clErr || !cl) throw new Error("Lead da campanha não encontrado");
  const row = cl as { estado: string; redesign_id: string | null; proposta_id: string | null };
  if (row.estado !== "rascunho") throw new Error("Só é possível aprovar um rascunho.");
  if (!row.redesign_id) throw new Error("Este lead não tem site gerado para publicar.");
  if (!row.proposta_id) throw new Error("Este lead não tem proposta para enviar.");

  // 1) grava o texto editado à mão (antes de publicar/injetar).
  await salvarProposta(propostaEditada);
  // 2) publica o redesign → URL pública real (só agora nasce a URL).
  const site = await publicarSite(row.redesign_id);
  // 3) injeta o link no corpo editado + aprova a proposta + liga o site_id.
  const corpoComLink = injetarLinkPrevia(propostaEditada.corpo, site.url_publica);
  const { data: prop, error: upErr } = await supabase
    .from("propostas")
    .update({
      corpo: corpoComLink,
      site_id: site.id,
      status: "aprovada",
      aprovada_em: new Date().toISOString(),
    })
    .eq("id", row.proposta_id)
    .eq("status", "rascunho")
    .select(
      "id, lead_id, assunto, corpo, valor, status, criada_em, aprovada_em, enviada_em, respondida_em, leads(business_name, email)",
    )
    .single();
  if (upErr || !prop) throw new Error(upErr?.message ?? "Falha ao aprovar a proposta");
  // 4) marca o lead da campanha aprovado.
  await atualizarCampanhaLead(campanhaLeadId, { estado: "aprovado" });

  const r = prop as unknown as {
    id: string;
    lead_id: string;
    assunto: string;
    corpo: string;
    valor: number | null;
    status: Proposta["status"];
    criada_em: string;
    aprovada_em: string | null;
    enviada_em: string | null;
    respondida_em: string | null;
    leads?: { business_name: string; email: string | null } | null;
  };
  return {
    id: r.id,
    lead_id: r.lead_id,
    lead_nome: r.leads?.business_name ?? "—",
    lead_email: r.leads?.email ?? null,
    assunto: r.assunto,
    corpo: r.corpo,
    valor: r.valor,
    status: r.status,
    criada_em: r.criada_em,
    aprovada_em: r.aprovada_em,
    enviada_em: r.enviada_em,
    respondida_em: r.respondida_em,
  };
}

export type AprovarLoteResult = { aprovados: number; erros: number };

/** REVISÃO EM LOTE — aprova (publish-on-approve) todos os leads 'rascunho' da campanha.
 * Publica um a um (Storage), injeta o link e aprova. Erros por lead são contados. */
export async function aprovarTodosDaCampanha(campanhaId: string): Promise<AprovarLoteResult> {
  const view = await listarCampanhaLeadsView(campanhaId);
  const rascunhos = view.filter((v) => v.estado === "rascunho" && v.proposta);
  const r: AprovarLoteResult = { aprovados: 0, erros: 0 };
  for (const v of rascunhos) {
    try {
      await aprovarCampanhaLead(v.id, v.proposta as Proposta);
      r.aprovados += 1;
    } catch {
      r.erros += 1;
    }
  }
  return r;
}

/** Renomeia a campanha. */
export async function renomearCampanha(id: string, nome: string): Promise<void> {
  const { error } = await supabase.from("campanhas").update({ nome: nome.trim() }).eq("id", id);
  if (error) throw error;
}

/** Exclui a campanha (campanha_leads caem por cascade; propostas ficam desvinculadas). */
export async function excluirCampanha(id: string): Promise<void> {
  const { error } = await supabase.from("campanhas").delete().eq("id", id);
  if (error) throw error;
}

export type EnviarLoteResult = {
  enviadas: number;
  sem_email: number;
  opt_out: number;
  teto_dia: number;
  erro: number;
  /** Falta o "E-mail para respostas" da org: problema de CONFIG, não do lead. */
  sem_reply_to: number;
};

/** REVISÃO EM LOTE — envia todas as propostas APROVADAS da campanha, respeitando o
 * portão (só aprovada) e a rampa por org (para no teto do dia). */
export async function enviarAprovadasDaCampanha(campanhaId: string): Promise<EnviarLoteResult> {
  const { data: aprovadas, error } = await supabase
    .from("propostas")
    .select("id")
    .eq("campanha_id", campanhaId)
    .eq("status", "aprovada")
    .order("criada_em", { ascending: true });
  if (error) throw error;

  const r: EnviarLoteResult = {
    enviadas: 0,
    sem_email: 0,
    opt_out: 0,
    teto_dia: 0,
    erro: 0,
    sem_reply_to: 0,
  };
  for (const p of (aprovadas ?? []) as Array<{ id: string }>) {
    try {
      const res = await enviarProposta(p.id);
      if (res.ok) {
        r.enviadas += 1;
      } else if (res.reason === "teto_dia") {
        r.teto_dia += 1;
        break; // teto do dia da org — o resto sai amanhã
      } else if (res.reason === "sem_reply_to") {
        // Config da ORG, não do lead: sem Reply-To NENHUMA proposta sai. Insistir lead a
        // lead só produziria N erros iguais — para na hora.
        r.sem_reply_to += 1;
        break;
      } else if (res.reason === "sem_email") {
        r.sem_email += 1;
      } else if (res.reason === "opt_out") {
        r.opt_out += 1;
      } else {
        r.erro += 1;
      }
    } catch {
      r.erro += 1;
    }
  }
  return r;
}

export type { Campanha, CampanhaLeadView, Proposta };
