// Camada de serviço — Propostas (Fase 2) LIGADA ao Supabase (RLS pela sessão).
// A copy é montada por TEMPLATE LOCAL (grátis) com dados REAIS do lead: elogio
// das avaliações do Google + motivo do site ruim (score_breakdown da Fase 1) +
// link do site JÁ PUBLICADO (Fase 4) como prévia. NÃO gera site novo, SEM preço
// na 1ª abordagem. "Melhorar com IA" é opcional (edge melhorar-proposta).
import { supabase } from "@/integrations/supabase/client";
import type { Proposta } from "@/types";

// Linha do banco + nome do lead via join.
type Row = {
  id: string;
  lead_id: string;
  assunto: string;
  corpo: string;
  valor: number | null;
  status: Proposta["status"];
  criada_em: string;
  enviada_em: string | null;
  respondida_em: string | null;
  leads?: { business_name: string } | null;
};

const SELECT =
  "id, lead_id, assunto, corpo, valor, status, criada_em, enviada_em, respondida_em, leads(business_name)";

function toProposta(r: Row): Proposta {
  return {
    id: r.id,
    lead_id: r.lead_id,
    lead_nome: r.leads?.business_name ?? "—",
    assunto: r.assunto,
    corpo: r.corpo,
    valor: r.valor,
    status: r.status,
    criada_em: r.criada_em,
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
function motivoDoLead(scoreBreakdown: unknown): string {
  const m = (scoreBreakdown as { motivo?: unknown } | null)?.motivo;
  if (typeof m === "string" && m.trim())
    return m
      .trim()
      .replace(/\.$/, "")
      .replace(/^[A-ZÀ-Ú]/, (c) => c.toLowerCase());
  return "não passa a credibilidade que a sua reputação merece e não facilita o contato pelo celular";
}

function elogio(nome: string, rating: number | null, reviews: number | null): string {
  const nota = rating != null ? rating.toFixed(1).replace(".", ",") : "";
  if (rating != null && reviews)
    return `Encontrei a ${nome} no Google e reparei na ótima reputação de vocês — nota ${nota} com ${reviews.toLocaleString("pt-BR")} avaliações de clientes reais.`;
  if (rating != null)
    return `Encontrei a ${nome} no Google e reparei na ótima reputação de vocês — nota ${nota}.`;
  return `Encontrei a ${nome} no Google e vi que vocês têm uma presença sólida e clientes fiéis.`;
}

function montarCorpo(
  nome: string,
  motivo: string,
  siteUrl: string,
  rating: number | null,
  reviews: number | null,
): string {
  return [
    elogio(nome, rating, reviews),
    "",
    `Justamente por isso me chamou atenção que o site atual ${motivo}. Hoje boa parte dos clientes decide pelo celular, e um site assim faz perder contato que já estava quase fechado.`,
    "",
    "Eu refiz a página de vocês com foco em contato pelo WhatsApp e visual moderno. Fiz uma prévia, sem compromisso, pra você ver como fica:",
    siteUrl,
    "",
    "Se fizer sentido, respondo aqui mesmo e a gente ajusta o que você quiser.",
    "",
    "Um abraço,",
    "Equipe Flow Leads",
  ].join("\n");
}

/** Gera uma proposta (rascunho) a partir de um lead COM site publicado. */
export async function gerarProposta(leadId: string): Promise<Proposta> {
  const { data: lead, error: lErr } = await supabase
    .from("leads")
    .select("id, business_name, rating, review_count, score_breakdown")
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

  const nome = lead.business_name as string;
  const rating = lead.rating != null ? Number(lead.rating) : null;
  const reviews = (lead.review_count as number | null) ?? null;
  const motivo = motivoDoLead(lead.score_breakdown);
  const siteUrl = (site as { url_publica: string }).url_publica;
  const corpo = montarCorpo(nome, motivo, siteUrl, rating, reviews);
  const assunto = `Uma versão muito melhor do site — ${nome}`.slice(0, 78);

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");

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
    })
    .select(SELECT)
    .single();
  if (iErr || !nova) throw new Error(iErr?.message ?? "Falha ao gerar a proposta");
  return toProposta(nova as unknown as Row);
}

/** Salva a edição de uma proposta (assunto, corpo, valor). */
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

/** Resultado do envio: sucesso (proposta atualizada) OU lead sem e-mail (a UI
 * cai no "copiar"). Falha real do Resend é lançada como erro (não vira sucesso). */
export type EnviarResult = { ok: true; proposta: Proposta } | { ok: false; reason: "sem_email" };

/** ENVIO REAL por e-mail (edge send-proposal → Resend). Em sucesso: marca a
 * proposta enviada, grava o id do Resend e move o lead para 'proposta_enviada'
 * (tudo no servidor). Lead sem e-mail → { ok:false, reason:'sem_email' }. */
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
  if (d?.error) throw new Error(d.error);
  if (!d?.proposta) throw new Error("Resposta inválida do envio");
  return { ok: true, proposta: toProposta(d.proposta as Row) };
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
