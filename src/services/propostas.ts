// Camada de serviço — Propostas (Fase 2) LIGADA ao Supabase (RLS pela sessão).
// A copy é a APROVADA PELO DONO (src/lib/copy-proposta.ts): template + variáveis reais do
// lead, sem IA. Abertura A (com nota/avaliações) ou B (sem nota) + {motivo} classificado do
// score_breakdown (Fase 1) + link do site (Fase 4). Sem preço, 1 link só, saída fácil.
// "Melhorar com IA" é opcional e DESLIGADO por padrão (a IA achata a copy deliberada).
import { supabase } from "@/integrations/supabase/client";
import type { Proposta } from "@/types";
import {
  ASSUNTO_PROPOSTA,
  classificarMotivo,
  montarCorpoProposta,
  type DadosCopy,
} from "@/lib/copy-proposta";

// Linha do banco + nome/e-mail do lead via join.
type Row = {
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

const SELECT =
  "id, lead_id, assunto, corpo, valor, status, criada_em, aprovada_em, enviada_em, respondida_em, leads(business_name, email)";

function toProposta(r: Row): Proposta {
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

/** Lista todas as propostas do usuário (mais recentes primeiro). */
export async function listarPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("propostas")
    .select(SELECT)
    .order("criada_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toProposta(r as unknown as Row));
}

/** Lista as propostas de um lead específico. */
export async function listarPropostasPorLead(leadId: string): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("propostas")
    .select(SELECT)
    .eq("lead_id", leadId)
    .order("criada_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toProposta(r as unknown as Row));
}

/** Lista as propostas de uma campanha (para a revisão em lote). */
export async function listarPropostasPorCampanha(campanhaId: string): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("propostas")
    .select(SELECT)
    .eq("campanha_id", campanhaId)
    .order("criada_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => toProposta(r as unknown as Row));
}

/** Lead elegível para proposta: tem site publicado ATIVO e ainda sem proposta. */
export type LeadCandidato = {
  lead_id: string;
  lead_nome: string;
  site_id: string;
  site_url: string;
};

/** Leads com site publicado ativo e SEM proposta ainda (candidatos a gerar). */
export async function listarLeadsParaProposta(): Promise<LeadCandidato[]> {
  const nowIso = new Date().toISOString();
  const { data: sites, error: sErr } = await supabase
    .from("sites_publicados")
    .select("id, lead_id, url_publica, publicado_em, leads(business_name)")
    .eq("arquivos_removidos", false)
    .neq("status", "reprovado")
    .gt("expira_em", nowIso)
    .order("publicado_em", { ascending: false });
  if (sErr) throw sErr;

  const { data: props, error: pErr } = await supabase.from("propostas").select("lead_id");
  if (pErr) throw pErr;
  const comProposta = new Set((props ?? []).map((p) => (p as { lead_id: string }).lead_id));

  const vistos = new Set<string>();
  const out: LeadCandidato[] = [];
  for (const s of (sites ?? []) as unknown as Array<{
    id: string;
    lead_id: string;
    url_publica: string;
    leads?: { business_name: string } | null;
  }>) {
    if (comProposta.has(s.lead_id) || vistos.has(s.lead_id)) continue;
    vistos.add(s.lead_id);
    out.push({
      lead_id: s.lead_id,
      lead_nome: s.leads?.business_name ?? "—",
      site_id: s.id,
      site_url: s.url_publica,
    });
  }
  return out;
}

// ---- Montagem da copy (template local, grátis) ----

/** Campos do lead que a copy consome. Um só lugar pra manter o select em sincronia. */
const CAMPOS_COPY = "id, business_name, rating, review_count, category, city, score_breakdown";

type LeadCopy = {
  business_name: string;
  rating: number | string | null;
  review_count: number | null;
  category: string | null;
  city: string | null;
  score_breakdown: unknown;
};

/**
 * {remetente} = nome PESSOAL do dono (profiles.full_name). Nunca hardcoded: se não estiver
 * configurado, a geração PARA com um erro acionável — melhor barrar do que assinar o e-mail
 * de outra pessoa com um nome inventado.
 */
async function remetenteDaOrg(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const nome = ((data as { full_name: string | null } | null)?.full_name ?? "").trim();
  if (!nome)
    throw new Error(
      "Configure o seu nome em Configurações — ele assina os e-mails da proposta e do follow-up.",
    );
  return nome;
}

/** Erro do portão "sem motivo claro" — quem chama distingue isto de falha real. */
export class SemMotivoClaroError extends Error {
  constructor(nome: string) {
    super(
      `Sem motivo claro para abordar ${nome}: o score não permite classificar (site no ar e ok, ou lead antigo sem os sinais). Não dá pra escrever a proposta sem inventar um problema.`,
    );
    this.name = "SemMotivoClaroError";
  }
}

/** Monta assunto+corpo do lead. Lança SemMotivoClaroError quando não há motivo honesto. */
function copyDoLead(lead: LeadCopy, link: string, remetente: string) {
  const motivo = classificarMotivo(lead.score_breakdown);
  if (!motivo) throw new SemMotivoClaroError(lead.business_name);
  const dados: DadosCopy = {
    nome_negocio: lead.business_name,
    nota: lead.rating != null ? Number(lead.rating) : null,
    n_avaliacoes: lead.review_count ?? null,
    categoria: lead.category,
    cidade: lead.city,
    link,
    remetente,
  };
  return { assunto: ASSUNTO_PROPOSTA, corpo: montarCorpoProposta(dados, motivo) };
}

/** Gera uma proposta (rascunho) a partir de um lead COM site publicado. Se
 * `campanhaId` for passado, já nasce vinculada à campanha (usado no lote). */
export async function gerarProposta(leadId: string, campanhaId?: string): Promise<Proposta> {
  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .select(CAMPOS_COPY)
    .eq("id", leadId)
    .single();
  if (lErr || !lead) throw new Error("Lead não encontrado");

  const nowIso = new Date().toISOString();
  const { data: site } = await supabase
    .from("sites_publicados")
    .select("id, url_publica")
    .eq("lead_id", leadId)
    .eq("arquivos_removidos", false)
    .neq("status", "reprovado")
    .gt("expira_em", nowIso)
    .order("publicado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!site)
    throw new Error(
      "Este lead ainda não tem um site publicado — publique a prévia antes de gerar a proposta.",
    );

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const siteUrl = (site as { url_publica: string }).url_publica;
  const remetente = await remetenteDaOrg(userId);
  const { assunto, corpo } = copyDoLead(lead as unknown as LeadCopy, siteUrl, remetente);

  const { data: nova, error: iErr } = await supabase
    .from("propostas")
    .insert({
      user_id: userId,
      lead_id: leadId,
      site_id: (site as { id: string }).id,
      assunto,
      corpo,
      valor: null,
      status: "rascunho",
      campanha_id: campanhaId ?? null,
    })
    .select(SELECT)
    .single();
  if (iErr || !nova) throw new Error(iErr?.message ?? "Falha ao gerar a proposta");
  return toProposta(nova as unknown as Row);
}

/** Placeholder do link da prévia no corpo do rascunho de campanha. Ao APROVAR, é
 * substituído pela URL pública real (publish-on-approve, Etapa 3). */
export const PLACEHOLDER_LINK_PREVIA = "(o link da prévia é gerado quando você aprovar)";

/** CAMPANHA — gera uma proposta RASCUNHO SEM exigir site publicado. O corpo usa um
 * placeholder no lugar do link: a prévia é revisada por iframe do redesign (sem URL
 * pública); o link público só nasce na aprovação. Liga à campanha; site_id fica nulo. */
export async function gerarPropostaRascunhoSemSite(
  leadId: string,
  campanhaId: string,
): Promise<Proposta> {
  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .select(CAMPOS_COPY)
    .eq("id", leadId)
    .single();
  if (lErr || !lead) throw new Error("Lead não encontrado");

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const remetente = await remetenteDaOrg(userId);
  const { assunto, corpo } = copyDoLead(
    lead as unknown as LeadCopy,
    PLACEHOLDER_LINK_PREVIA,
    remetente,
  );

  const { data: nova, error: iErr } = await supabase
    .from("propostas")
    .insert({
      user_id: userId,
      lead_id: leadId,
      site_id: null,
      assunto,
      corpo,
      valor: null,
      status: "rascunho",
      campanha_id: campanhaId,
    })
    .select(SELECT)
    .single();
  if (iErr || !nova) throw new Error(iErr?.message ?? "Falha ao gerar a proposta");
  return toProposta(nova as unknown as Row);
}

/** Injeta a URL pública da prévia no corpo: substitui o placeholder, ou anexa ao fim
 * se o usuário o removeu ao editar (o texto editado à mão é preservado). */
export function injetarLinkPrevia(corpo: string, url: string): string {
  if (corpo.includes(PLACEHOLDER_LINK_PREVIA)) return corpo.replace(PLACEHOLDER_LINK_PREVIA, url);
  return `${corpo.trimEnd()}\n\nVeja a prévia (sem compromisso): ${url}`;
}

/** Salva a edição de uma proposta (assunto, corpo, valor). Mantém 'rascunho'. */
export async function salvarProposta(proposta: Proposta): Promise<Proposta> {
  const { data, error } = await supabase
    .from("propostas")
    .update({ assunto: proposta.assunto, corpo: proposta.corpo, valor: proposta.valor })
    .eq("id", proposta.id)
    .select(SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao salvar");
  return toProposta(data as unknown as Row);
}

/** PORTÃO DE REVISÃO (FIX 1) — grava o texto final editado à mão E aprova para
 * envio numa tacada só (rascunho → aprovada). O texto salvo aqui é EXATAMENTE o
 * que sai no e-mail: o send-proposal não regenera nada por cima. Só quem está em
 * 'rascunho' pode ser aprovado. */
export async function aprovarProposta(proposta: Proposta): Promise<Proposta> {
  const { data, error } = await supabase
    .from("propostas")
    .update({
      assunto: proposta.assunto,
      corpo: proposta.corpo,
      valor: proposta.valor,
      status: "aprovada",
      aprovada_em: new Date().toISOString(),
    })
    .eq("id", proposta.id)
    .eq("status", "rascunho") // só aprova a partir de rascunho
    .select(SELECT)
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "Falha ao aprovar (a proposta já saiu de rascunho?)");
  return toProposta(data as unknown as Row);
}

/** Reabre uma proposta aprovada para editar de novo (aprovada → rascunho). Zera a
 * aprovação: o usuário terá que revisar e aprovar novamente antes de enviar. */
export async function reabrirProposta(proposta: Proposta): Promise<Proposta> {
  const { data, error } = await supabase
    .from("propostas")
    .update({ status: "rascunho", aprovada_em: null })
    .eq("id", proposta.id)
    .eq("status", "aprovada")
    .select(SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao reabrir");
  return toProposta(data as unknown as Row);
}

/** Resultado do envio: sucesso (proposta atualizada), lead sem e-mail (a UI cai
 * no "copiar") ou lead em opt-out (não envia). Falha real do Resend é lançada
 * como erro (não vira sucesso). */
export type EnviarResult =
  | { ok: true; proposta: Proposta }
  | { ok: false; reason: "sem_email" | "opt_out" | "teto_dia" | "nao_aprovada" };

/** Status da rampa de aquecimento do e-mail (teto do dia / restante). */
export type RampaStatus = {
  ativa: boolean;
  dia: number;
  teto: number;
  enviados_hoje: number;
  restante: number;
};

export async function statusRampa(): Promise<RampaStatus | null> {
  const { data, error } = await supabase.rpc("email_rampa_status");
  if (error) return null;
  return (data as RampaStatus[])?.[0] ?? null;
}

/** ENVIO REAL por e-mail (edge send-proposal → Resend). Em sucesso: marca a
 * proposta enviada, grava o id do Resend e move o lead para 'proposta_enviada'
 * (tudo no servidor). Lead sem e-mail → 'sem_email'; lead descadastrado (LGPD)
 * → 'opt_out'. */
export async function enviarProposta(id: string): Promise<EnviarResult> {
  const { data, error } = await supabase.functions.invoke("send-proposal", {
    body: { proposta_id: id },
  });
  if (error) throw error;
  const d = data as {
    ok?: boolean;
    reason?: string;
    error?: string;
    proposta?: unknown;
  };
  if (d?.reason === "sem_email") return { ok: false, reason: "sem_email" };
  if (d?.reason === "opt_out") return { ok: false, reason: "opt_out" };
  if (d?.reason === "teto_dia") return { ok: false, reason: "teto_dia" };
  if (d?.reason === "nao_aprovada") return { ok: false, reason: "nao_aprovada" };
  if (d?.error) throw new Error(d.error);
  if (!d?.proposta) throw new Error("Resposta inválida do envio");
  return { ok: true, proposta: toProposta(d.proposta as Row) };
}

/** Conjunto de lead_ids que já receberam follow-up (para o badge no Pipeline). */
export async function listarLeadIdsComFollowUp(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("propostas")
    .select("lead_id")
    .gt("follow_up_count", 0);
  if (error) throw error;
  return new Set((data ?? []).map((p) => (p as { lead_id: string }).lead_id));
}

/** HÍBRIDO — reescreve a copy com IA (Claude via edge). Devolve o texto para a
 * UI revisar/editar; NÃO persiste (o usuário salva depois). */
export async function melhorarPropostaComIA(
  proposta: Proposta,
): Promise<{ assunto: string; corpo: string }> {
  const { data, error } = await supabase.functions.invoke("melhorar-proposta", {
    body: { assunto: proposta.assunto, corpo: proposta.corpo, lead_nome: proposta.lead_nome },
  });
  if (error) throw error;
  const d = data as { assunto?: string; corpo?: string; error?: string };
  if (d?.error) throw new Error(d.error);
  return { assunto: d.assunto ?? proposta.assunto, corpo: d.corpo ?? proposta.corpo };
}
