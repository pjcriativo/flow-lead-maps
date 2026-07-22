// Painel /admin — agora alimentado pela Edge `admin-metricas` (visão da PLATAFORMA, multi-org).
//
// RASTREABILIDADE (regra anti-mentira): cada card/gráfico/tabela ← um campo do retorno da Edge,
// que por sua vez nasce de UMA query com service role (comentadas lá). O guard REAL é o da Edge
// (403 para quem não é super admin — o redirect do client é só UX).
import { supabase } from "@/integrations/supabase/client";

export type AdminKpis = {
  /** card "Usuários da plataforma" ← count(profiles) */
  usuarios: number;
  /** card "Total de leads" ← count(leads) global */
  leads: number;
  /** card "Campanhas" ← count(campanhas) global + status='ativa' */
  campanhas: number;
  campanhasAtivas: number;
  /** card "Chips WhatsApp" ← count(wa_instancias) + conectados com número pareado */
  chips: number;
  chipsProntos: number;
  /** card "Disparos WhatsApp" ← count(wa_envios) — só envio confirmado */
  disparos: number;
  /** card "Mensagens de conversa" ← count(wa_mensagens) */
  conversas: number;
  /** card "Buscas de leads" ← count(lead_lists) + count(redes_buscas ≠ ia_site) */
  buscasMaps: number;
  buscasRedes: number;
  /** card "Sites publicados" ← count(sites_publicados) */
  sites: number;
  /** card "Follow-ups enviados" ← sum(propostas.follow_up_count) */
  followups: number;
  /** card "Gasto de API no mês" ← sum(redes_buscas.custo_usd) do mês (livro-caixa global) */
  gastoMesUsd: number;
  tetoMesUsd: number;
};

export type UsuarioPlataforma = { email: string; plan: string | null; created_at: string };
export type PontoSerie = { dia: string; leads: number; disparos: number };
export type LeadRecente = {
  id: string;
  business_name: string;
  city: string | null;
  created_at: string;
  dono: string;
};
export type CampanhaRecente = {
  id: string;
  nome: string;
  canal: string;
  status: string;
  criada_em: string;
  dono: string;
};
export type BuscaRecente = {
  id: string;
  fonte: string;
  estrategia: string;
  status: string;
  inseridos: number;
  custo_usd: number;
  criado_em: string;
  dono: string;
};

export type PainelAdmin = {
  kpis: AdminKpis;
  usuarios: UsuarioPlataforma[];
  statusCampanhas: { status: string; total: number }[];
  serie14d: PontoSerie[];
  leadsRecentes: LeadRecente[];
  campanhasRecentes: CampanhaRecente[];
  buscasRecentes: BuscaRecente[];
};

/** Uma chamada só: a Edge valida o papel no servidor e devolve a plataforma inteira. */
export async function carregarPainelAdmin(): Promise<PainelAdmin> {
  const { data, error } = await supabase.functions.invoke("admin-metricas", { body: {} });
  if (error) throw new Error(error.message ?? "Falha ao carregar as métricas");
  if (data?.error) throw new Error(String(data.error));
  return data as PainelAdmin;
}
