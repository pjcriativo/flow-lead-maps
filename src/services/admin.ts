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
  /** card "Tickets abertos" ← count(tickets) status in (aberto, em_andamento), todas as orgs */
  ticketsAbertos: number;
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
  /** enviados ← count(wa_envios)+count(propostas 'enviada') da campanha; total ← campanha_leads */
  total: number;
  enviados: number;
};

/** "Platform Snapshot" — cada número ← uma query real na Edge (comentadas lá). */
export type SnapshotPlataforma = {
  scrape: { rodando: number; concluidas: number; paradasTeto: number; erros: number };
  segmentos: { categoria: string; total: number }[];
  templatesWa: number;
  leadsAcionaveis: number;
  aprovadosDisparo: number;
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

export type Role = { papel: string; ativo: boolean };
export type Staff = {
  user_id: string;
  papel: string;
  email: string;
  nome: string | null;
  criada_em: string;
};
export type Plano = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  periodo: "mensal" | "anual";
  limite_leads: number | null;
  limite_sites: number | null;
  limite_campanhas: number | null;
  limite_mensagens: number | null;
  limite_whatsapp: number | null;
  limite_templates: number | null;
  limite_segmentos: number | null;
  ativo: boolean;
  ordem: number;
};

export type PainelAdmin = {
  kpis: AdminKpis;
  usuarios: UsuarioPlataforma[];
  statusCampanhas: { status: string; total: number }[];
  serie14d: PontoSerie[];
  leadsRecentes: LeadRecente[];
  campanhasRecentes: CampanhaRecente[];
  buscasRecentes: BuscaRecente[];
  snapshot: SnapshotPlataforma;
  orgAdmin: string | null;
  roles: Role[];
  staffs: Staff[];
  subscribers: null; // sem base de newsletter → "Em breve"
  planos: Plano[];
};

/** Uma chamada só: a Edge valida o papel no servidor e devolve a plataforma inteira. */
export async function carregarPainelAdmin(): Promise<PainelAdmin> {
  const { data, error } = await supabase.functions.invoke("admin-metricas", { body: {} });
  if (error) throw new Error(error.message ?? "Falha ao carregar as métricas");
  if (data?.error) throw new Error(String(data.error));
  return data as PainelAdmin;
}

/** Ações (leitura e escrita) do painel admin — Edge admin-acoes valida super_admin no servidor.
 * Tipo do retorno é genérico de propósito: cada ação devolve um formato próprio (tickets_listar
 * devolve {tickets:[...]}, plano_upsert devolve {id}, etc.) — quem chama sabe o que espera. */
export type AdminAcao =
  | "role_toggle"
  | "staff_add"
  | "staff_remove"
  | "user_add"
  | "plano_upsert"
  | "plano_toggle"
  | "plano_delete"
  | "tickets_listar"
  | "ticket_responder"
  | "ticket_status"
  | "relatorios_ler"
  | "config_ler"
  | "config_salvar"
  | "notificacao_enviar"
  | "notificacoes_listar"
  | "assinantes_listar"
  | "assinante_add"
  | "assinante_remove"
  | "cms_ler"
  | "cms_salvar";

export async function adminAcao(
  acao: AdminAcao,
  payload: Record<string, unknown> = {},
): Promise<Record<string, unknown> & { ok: boolean; reason?: string; detalhe?: string }> {
  const { data, error } = await supabase.functions.invoke("admin-acoes", {
    body: { acao, ...payload },
  });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown> & { ok: boolean; reason?: string; detalhe?: string };
}
