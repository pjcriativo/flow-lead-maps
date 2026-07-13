// Camada de serviço — Redesign (Fase 3) LIGADA à Edge Function redesign-site (IA).
import { supabase } from "@/integrations/supabase/client";
import type { Redesign } from "@/types";

export type RedesignUsage = {
  /** Template premium usado (nicho): saude | servico-local | profissional. */
  template: string;
  /** Motor de IA usado: claude | openai | fallback. */
  provider: string;
  modelo: string;
  inputTokens: number;
  outputTokens: number;
  /** Custo só da IA. */
  custoIaUsd: number;
  /** Custo do Apify (reviews). */
  custoApifyUsd: number;
  /** Custo total (IA + Apify). */
  custoUsd: number;
  /** true = IA indisponível, conteúdo rule-based. */
  fallback: boolean;
  /** Depoimentos REAIS do Google que entraram. */
  depoimentos: number;
  servicos: number;
  /** true = serviços extraídos do site real; false = genéricos do nicho (flag). */
  servicosReais: boolean;
  /** pasta de hero curado usada (ex.: "advocacia", "saude"). */
  heroNicho: string;
  /** false = lead sem nota no Google (site não exibe estrela/nota). */
  temNota: boolean;
  diferenciais: number;
  faq: number;
  imagensUsadas: number;
  fotosReais: number;
  /** true = hero usa foto real do lead; false = hero curado do nicho (Storage). */
  heroReal: boolean;
  /** nº de fotos reais curadas na galeria (0 = seção omitida). */
  galeria: number;
  temLogo: boolean;
  cores: string[];
  usouNota: boolean;
  usouWhatsapp: boolean;
  /** false = site do lead ilegível → copy tende a genérica. */
  conteudoLegivel: boolean;
  /** Aviso honesto quando a copy ficou genérica (ou null). */
  avisoGenerico: string | null;
};

/** Lista os redesigns do usuário (com o nome do lead). */
export async function listarRedesigns(): Promise<Redesign[]> {
  const { data, error } = await supabase
    .from("redesigns")
    .select("*, leads(business_name)")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({ ...r, lead_nome: r.leads?.business_name ?? undefined }));
}

/** Conjunto de lead_ids que já têm um redesign (para marcar o card em Meus Leads). */
export async function listarLeadIdsComRedesign(): Promise<Set<string>> {
  const { data, error } = await supabase.from("redesigns").select("lead_id");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Set((data ?? []).map((r: any) => r.lead_id as string));
}

/** Gera o site novo do lead via IA (10-40s). */
export async function gerarRedesign(
  leadId: string,
): Promise<{ redesign: Redesign; usage: RedesignUsage; lead_nome: string }> {
  const { data, error } = await supabase.functions.invoke("redesign-site", {
    body: { lead_id: leadId },
  });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data as any)?.error) throw new Error((data as any).error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

/** Salva a edição do usuário (html_editado) — é o que vai para publicação. */
export async function salvarEdicao(id: string, html: string): Promise<void> {
  const { error } = await supabase
    .from("redesigns")
    .update({ html_editado: html, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function excluirRedesign(id: string): Promise<void> {
  const { error } = await supabase.from("redesigns").delete().eq("id", id);
  if (error) throw error;
}
