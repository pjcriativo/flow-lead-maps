// Camada de serviço — Redesign (Fase 3) LIGADA à Edge Function redesign-site (IA).
import { supabase } from "@/integrations/supabase/client";
import type { Redesign } from "@/types";

export type RedesignUsage = {
  modelo: string;
  inputTokens: number;
  outputTokens: number;
  custoUsd: number;
  imagensUsadas: number;
  temLogo: boolean;
  cores: string[];
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

/** Gera o site novo do lead via IA (10-40s). */
export async function gerarRedesign(
  leadId: string,
): Promise<{ redesign: Redesign; usage: RedesignUsage; lead_nome: string }> {
  const { data, error } = await supabase.functions.invoke("redesign-site", { body: { lead_id: leadId } });
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
