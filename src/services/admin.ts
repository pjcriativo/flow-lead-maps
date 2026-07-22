// Painel /admin — TODAS as queries que alimentam a tela, num lugar só.
// RASTREABILIDADE (regra anti-mentira): cada número exibido nasce numa função DESTE arquivo,
// com a tabela de origem no nome/comentário. Nenhum número é inventado; o que não tem base
// vira "Em breve" na tela (não um zero fake).
//
// ESCOPO ATUAL: o painel enxerga a operação da ORG LOGADA (RLS) — hoje a plataforma tem 1 org
// ativa (o dono), então isso É a plataforma. Quando existir multi-org/memberships, estas
// queries migram para uma Edge com service role que agrega todas as orgs (TODO junto do guard).
import { supabase } from "@/integrations/supabase/client";

export type AdminKpis = {
  /** card "Total de Leads" ← count(leads) */
  leads: number;
  /** card "Campanhas" ← count(campanhas) + count(status='ativa') */
  campanhas: number;
  campanhasAtivas: number;
  /** card "Chips WhatsApp" ← count(wa_instancias) + conectados com número pareado */
  chips: number;
  chipsProntos: number;
  /** card "Disparos WhatsApp" ← count(wa_envios) — só entra com confirmação da Evolution */
  disparos: number;
  /** card "Mensagens de conversa" ← count(wa_mensagens) — recebidas/enviadas no chat */
  conversas: number;
  /** card "Buscas de leads" ← count(lead_lists) (Maps) + count(redes_buscas fonte≠ia_site) */
  buscasMaps: number;
  buscasRedes: number;
  /** card "Sites publicados" ← count(sites_publicados) */
  sites: number;
  /** card "Follow-ups enviados" ← sum(propostas.follow_up_count) — medido pela edge follow-up-cron */
  followups: number;
  /** card "Gasto do mês (livro-caixa)" ← sum(redes_buscas.custo_usd) do mes_ref corrente */
  gastoMesUsd: number;
  tetoMesUsd: number;
};

const contar = async (
  q: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> => {
  const { count: n, error } = await q;
  if (error) throw new Error(error.message);
  return n ?? 0;
};
const head = { count: "exact" as const, head: true };

const mesRefAtual = () => new Date().toISOString().slice(0, 7);

export async function carregarKpis(): Promise<AdminKpis> {
  const [
    leads,
    campanhas,
    campanhasAtivas,
    chips,
    chipsProntos,
    disparos,
    conversas,
    buscasMaps,
    buscasRedes,
    sites,
  ] = await Promise.all([
    contar(supabase.from("leads").select("id", head)),
    contar(supabase.from("campanhas").select("id", head)),
    contar(supabase.from("campanhas").select("id", head).eq("status", "ativa")),
    contar(supabase.from("wa_instancias").select("id", head)),
    contar(
      supabase
        .from("wa_instancias")
        .select("id", head)
        .eq("status", "conectado")
        .not("numero", "is", null),
    ),
    contar(supabase.from("wa_envios").select("id", head)),
    contar(supabase.from("wa_mensagens").select("id", head)),
    contar(supabase.from("lead_lists").select("id", head)),
    contar(supabase.from("redes_buscas").select("id", head).neq("fonte", "ia_site")),
    contar(supabase.from("sites_publicados").select("id", head)),
  ]);

  // follow-ups: soma do contador REAL gravado pela edge follow-up-cron
  const { data: fu, error: fuErr } = await supabase
    .from("propostas")
    .select("follow_up_count")
    .gt("follow_up_count", 0);
  if (fuErr) throw fuErr;
  const followups = (fu ?? []).reduce((s, r) => s + Number(r.follow_up_count ?? 0), 0);

  // gasto do mês: livro-caixa (mesma fonte do teto — redes + geração de sites)
  const { data: gastos, error: gErr } = await supabase
    .from("redes_buscas")
    .select("custo_usd")
    .eq("mes_ref", mesRefAtual());
  if (gErr) throw gErr;
  const gastoMesUsd = (gastos ?? []).reduce((s, r) => s + Number(r.custo_usd ?? 0), 0);

  return {
    leads,
    campanhas,
    campanhasAtivas,
    chips,
    chipsProntos,
    disparos,
    conversas,
    buscasMaps,
    buscasRedes,
    sites,
    followups,
    gastoMesUsd,
    tetoMesUsd: 50, // TETO_MES_USD do livro-caixa (redes-teto.ts)
  };
}

/** Gráfico de linha ← leads.created_at e wa_envios.enviado_em dos últimos 14 dias (datas REAIS). */
export type PontoSerie = { dia: string; leads: number; disparos: number };

export async function carregarSerie14d(): Promise<{ pontos: PontoSerie[]; temAlgo: boolean }> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 13);
  inicio.setHours(0, 0, 0, 0);
  const iso = inicio.toISOString();

  const [{ data: ld, error: e1 }, { data: env, error: e2 }] = await Promise.all([
    supabase.from("leads").select("created_at").gte("created_at", iso),
    supabase.from("wa_envios").select("enviado_em").gte("enviado_em", iso),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const porDia = new Map<string, PontoSerie>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    porDia.set(key, {
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      leads: 0,
      disparos: 0,
    });
  }
  for (const r of ld ?? []) {
    const k = String(r.created_at).slice(0, 10);
    const p = porDia.get(k);
    if (p) p.leads++;
  }
  for (const r of env ?? []) {
    const k = String(r.enviado_em).slice(0, 10);
    const p = porDia.get(k);
    if (p) p.disparos++;
  }
  const pontos = [...porDia.values()];
  return { pontos, temAlgo: pontos.some((p) => p.leads > 0 || p.disparos > 0) };
}

/** Donut ← campanhas.status reais (contagem por status). */
export async function carregarStatusCampanhas(): Promise<{ status: string; total: number }[]> {
  const { data, error } = await supabase.from("campanhas").select("status");
  if (error) throw error;
  const m = new Map<string, number>();
  for (const r of data ?? []) m.set(r.status, (m.get(r.status) ?? 0) + 1);
  return [...m.entries()].map(([status, total]) => ({ status, total }));
}

/** Tabela "Leads recentes" ← leads mais novos (nome, cidade, quando). */
export type LeadRecente = {
  id: string;
  business_name: string;
  city: string | null;
  created_at: string;
};
export async function carregarLeadsRecentes(): Promise<LeadRecente[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, business_name, city, created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as LeadRecente[];
}

/** Tabela "Campanhas recentes" ← campanhas mais novas (nome, canal, status). */
export type CampanhaRecente = {
  id: string;
  nome: string;
  canal: string;
  status: string;
  criada_em: string;
};
export async function carregarCampanhasRecentes(): Promise<CampanhaRecente[]> {
  const { data, error } = await supabase
    .from("campanhas")
    .select("id, nome, canal, status, criada_em")
    .order("criada_em", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as CampanhaRecente[];
}

/** Tabela "Buscas recentes" ← livro-caixa (redes + geração de sites), o mais novo primeiro. */
export type BuscaRecente = {
  id: string;
  fonte: string;
  estrategia: string;
  status: string;
  inseridos: number;
  custo_usd: number;
  criado_em: string;
};
export async function carregarBuscasRecentes(): Promise<BuscaRecente[]> {
  const { data, error } = await supabase
    .from("redes_buscas")
    .select("id, fonte, estrategia, status, inseridos, custo_usd, criado_em")
    .order("criado_em", { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as BuscaRecente[];
}
