// Serviço — painel "Agentes & Automações". Só LÊ dados reais que já existem (leads, receitas e
// rodadas da automação). Os agentes de IA ainda não têm backend: nada aqui inventa métrica deles.
import { supabase } from "@/integrations/supabase/client";
import type { Rodada } from "@/services/automacao";

export type ResumoPainelAgentes = {
  leadsNaBase: number;
  rodadas30d: {
    total: number;
    buscados: number;
    qualificados: number;
    preparados: number;
  };
};

const DIAS_30_MS = 30 * 24 * 3.6e6;

export async function carregarResumoPainel(): Promise<ResumoPainelAgentes> {
  const desde = new Date(Date.now() - DIAS_30_MS).toISOString();
  const [leads, rodadas] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("automacao_rodadas")
      .select("leads_buscados, leads_qualificados, leads_preparados")
      .gte("iniciada_em", desde),
  ]);
  if (leads.error) throw leads.error;
  if (rodadas.error) throw rodadas.error;
  const linhas = rodadas.data ?? [];
  const soma = (campo: "leads_buscados" | "leads_qualificados" | "leads_preparados") =>
    linhas.reduce((acc, r) => acc + (r[campo] ?? 0), 0);
  return {
    leadsNaBase: leads.count ?? 0,
    rodadas30d: {
      total: linhas.length,
      buscados: soma("leads_buscados"),
      qualificados: soma("leads_qualificados"),
      preparados: soma("leads_preparados"),
    },
  };
}

export async function listarRodadasRecentes(limite = 6): Promise<Rodada[]> {
  const { data, error } = await supabase
    .from("automacao_rodadas")
    .select("*")
    .order("iniciada_em", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as Rodada[];
}
