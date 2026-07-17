// Serviço — AUTOMAÇÃO DE PROSPECÇÃO (receitas + rodadas). O robô roda no edge automacao-rodar
// (com o JWT do dono, modo manual). Aqui é só CRUD da receita + disparar a rodada + ler o histórico.
import { supabase } from "@/integrations/supabase/client";
import { configPadraoWa } from "@/lib/wa-copy";

export type Receita = {
  id: string;
  nome: string;
  ativa: boolean;
  nicho: string;
  cidade: string;
  uf: string | null;
  fonte: string;
  score_minimo: number;
  exigir_contato: boolean;
  canal: string;
  leads_por_rodada: number;
  frequencia: string;
  max_leads_rodada: number;
  max_leads_mes: number;
  max_usd_rodada: number;
  max_usd_mes: number;
  custo_lead_usd: number;
  mes_ref: string | null;
  leads_mes: number;
  gasto_mes_usd: number;
  ultima_rodada_em: string | null;
  criada_em: string;
};

export type Rodada = {
  id: string;
  receita_id: string;
  iniciada_em: string;
  concluida_em: string | null;
  leads_buscados: number;
  leads_qualificados: number;
  leads_descartados: number;
  leads_preparados: number;
  custo_usd: number;
  campanha_id: string | null;
  status: string;
  detalhe: string | null;
};

const CAMPOS =
  "id, nome, ativa, nicho, cidade, uf, fonte, score_minimo, exigir_contato, canal, leads_por_rodada, frequencia, max_leads_rodada, max_leads_mes, max_usd_rodada, max_usd_mes, custo_lead_usd, mes_ref, leads_mes, gasto_mes_usd, ultima_rodada_em, criada_em";

export async function listarReceitas(): Promise<Receita[]> {
  const { data, error } = await supabase
    .from("automacao_receitas")
    .select(CAMPOS)
    .order("criada_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Receita[];
}

export type NovaReceita = {
  nome: string;
  nicho: string;
  cidade: string;
  uf?: string | null;
  fonte?: string;
  score_minimo: number;
  exigir_contato: boolean;
  canal: string;
  leads_por_rodada: number;
  frequencia: string;
  max_leads_rodada: number;
  max_leads_mes: number;
  max_usd_rodada: number;
  max_usd_mes: number;
};

export async function criarReceita(r: NovaReceita): Promise<Receita> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("automacao_receitas")
    .insert({
      user_id: u.user.id,
      ...r,
      uf: r.uf ?? null,
      fonte: r.fonte ?? "apify",
      wa_config: r.canal === "whatsapp" ? configPadraoWa() : null,
    })
    .select(CAMPOS)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao criar a receita");
  return data as Receita;
}

export async function atualizarReceita(
  id: string,
  patch: Partial<NovaReceita & { ativa: boolean }>,
) {
  const { error } = await supabase.from("automacao_receitas").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirReceita(id: string): Promise<void> {
  const { error } = await supabase.from("automacao_receitas").delete().eq("id", id);
  if (error) throw error;
}

/** Dispara UMA rodada agora (manual). O robô busca→qualifica→prepara→PARA no portão. */
export async function rodarAgora(receita_id: string): Promise<{
  status: string;
  detalhe?: string;
  leads_buscados?: number;
  leads_preparados?: number;
  leads_descartados?: number;
  custo_usd?: number;
  campanha_id?: string | null;
}> {
  const { data, error } = await supabase.functions.invoke("automacao-rodar", {
    body: { receita_id },
  });
  if (error) throw error;
  return data;
}

export async function listarRodadas(receita_id: string): Promise<Rodada[]> {
  const { data, error } = await supabase
    .from("automacao_rodadas")
    .select("*")
    .eq("receita_id", receita_id)
    .order("iniciada_em", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Rodada[];
}
