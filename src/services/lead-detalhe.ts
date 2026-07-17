// Camada de serviço — DETALHE do lead. Junta, para um lead_id, o que aconteceu com ele:
// proposta(s) real(is) com destinatário/message_id/follow-up (campos que o SELECT padrão de
// propostas.ts OMITE), o redesign mais recente e o site publicado ativo. Tudo por RLS do dono.
import { supabase } from "@/integrations/supabase/client";
import type { Redesign } from "@/types";

/** Proposta com os campos ricos (destinatário, id do Resend, follow-up) para o detalhe. */
export type PropostaDetalhe = {
  id: string;
  assunto: string;
  corpo: string;
  status: "rascunho" | "aprovada" | "enviada" | "respondida";
  criada_em: string;
  aprovada_em: string | null;
  enviada_em: string | null;
  respondida_em: string | null;
  email_para: string | null;
  email_message_id: string | null;
  follow_up_enviado_em: string | null;
  follow_up_count: number;
  follow_up_message_id: string | null;
};

export type SiteResumo = {
  id: string;
  slug: string;
  url_publica: string;
  status: string;
  publicado_em: string;
  expira_em: string;
};

export type ContatoDetalhe = {
  id: string;
  canal: string;
  anotacao: string | null;
  contatado_em: string;
};

export type LeadDetalheData = {
  redesign: Redesign | null;
  site: SiteResumo | null;
  propostas: PropostaDetalhe[];
  contatos: ContatoDetalhe[];
};

const PROP_SELECT =
  "id, assunto, corpo, status, criada_em, aprovada_em, enviada_em, respondida_em, email_para, email_message_id, follow_up_enviado_em, follow_up_count, follow_up_message_id";

/** Carrega tudo do detalhe de um lead (proposta real + redesign + site). */
export async function carregarDetalheLead(leadId: string): Promise<LeadDetalheData> {
  const nowIso = new Date().toISOString();
  const [propRes, redRes, siteRes, contatosRes] = await Promise.all([
    supabase
      .from("propostas")
      .select(PROP_SELECT)
      .eq("lead_id", leadId)
      .order("criada_em", { ascending: false }),
    supabase
      .from("redesigns")
      .select("*, leads(business_name)")
      .eq("lead_id", leadId)
      .order("criado_em", { ascending: false })
      .limit(1),
    supabase
      .from("sites_publicados")
      .select("id, slug, url_publica, status, publicado_em, expira_em")
      .eq("lead_id", leadId)
      .eq("arquivos_removidos", false)
      .neq("status", "reprovado")
      .gt("expira_em", nowIso)
      .order("publicado_em", { ascending: false })
      .limit(1),
    supabase
      .from("lead_contatos")
      .select("id, canal, anotacao, contatado_em")
      .eq("lead_id", leadId)
      .order("contatado_em", { ascending: false }),
  ]);
  if (propRes.error) throw propRes.error;
  if (contatosRes.error) throw contatosRes.error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rd = redRes.data?.[0] as any;
  const redesign: Redesign | null = rd
    ? { ...rd, lead_nome: rd.leads?.business_name ?? undefined }
    : null;

  return {
    redesign,
    site: (siteRes.data?.[0] as SiteResumo | undefined) ?? null,
    propostas: (propRes.data ?? []) as unknown as PropostaDetalhe[],
    contatos: (contatosRes.data ?? []) as ContatoDetalhe[],
  };
}
