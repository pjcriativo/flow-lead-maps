// Cliente do front para a Fase 1: busca (streaming) + gestão de leads.
// A chave da Google Places NUNCA passa por aqui — fica no secret da Edge Function.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];

export type ScoreTier = "quente" | "morno" | "frio";

export type ScoreBreakdown = {
  score: number;
  tier: ScoreTier;
  is_gold: boolean;
  motivo: string;
  has_website: boolean;
  site_fora_do_ar?: boolean;
  bad_site: boolean;
  bad_site_reasons: string[];
  has_instagram: boolean;
  has_facebook: boolean;
  has_whatsapp: boolean;
  has_email: boolean;
  rating_bonus: number;
  notes: string[];
};

/** Fontes de busca plugáveis (o seletor da UI escolhe; o backend despacha). */
export type FonteBusca = "osm" | "geoapify" | "apify" | "places";

export const FONTE_LABELS: Record<FonteBusca, string> = {
  osm: "OpenStreetMap (grátis)",
  geoapify: "Geoapify (grátis)",
  apify: "Google Maps via Apify (rico — pago)",
  places: "Google Places (requer billing)",
};

/** Fontes desativadas no seletor (presentes, mas não selecionáveis). */
export const FONTES_DESATIVADAS: FonteBusca[] = ["places"];

export type SearchParams = {
  nicho: string;
  cidade: string;
  uf: string;
  limite: number;
  buscarEmails: boolean;
  fonte: FonteBusca;
  /** Busca por área no mapa (alternativa a cidade/UF). */
  lat?: number | null;
  lng?: number | null;
  raioKm?: number | null;
};

export type SearchEvent =
  | { type: "log"; message: string }
  | { type: "lead"; lead: Lead }
  | { type: "progress"; found: number; target: number }
  | { type: "done"; inserted: number; total: number; fonte?: FonteBusca }
  | { type: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Chama a Edge Function search-leads e consome o stream NDJSON,
 * despachando cada evento para `onEvent`. Retorna quando o stream fecha.
 */
export async function streamSearchLeads(
  params: SearchParams,
  onEvent: (ev: SearchEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Você precisa estar logado para buscar leads.");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/search-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      nicho: params.nicho,
      cidade: params.cidade,
      uf: params.uf,
      limite: params.limite,
      buscarEmails: params.buscarEmails,
      fonte: params.fonte,
      ...(params.lat != null && params.lng != null
        ? { lat: params.lat, lng: params.lng, raio_km: params.raioKm ?? 10 }
        : {}),
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `Falha na busca (HTTP ${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        onEvent(JSON.parse(line) as SearchEvent);
      } catch {
        /* linha parcial/ruído — ignora */
      }
    }
  }
  const rest = buffer.trim();
  if (rest) {
    try {
      onEvent(JSON.parse(rest) as SearchEvent);
    } catch {
      /* ignora */
    }
  }
}

/** Enriquece um lead (visita o site: e-mail/WhatsApp + recalcula score). */
export async function enrichLead(leadId: string): Promise<Lead> {
  const { data, error } = await supabase.functions.invoke("enrich-lead", {
    body: { lead_id: leadId },
  });
  if (error) throw error;
  const d = data as { error?: string; lead?: Lead } | null;
  if (d?.error) throw new Error(d.error);
  return d?.lead as Lead;
}

/** Lista os leads do usuário, ordenados por score desc. */
export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Atualiza o status (usado pelo Kanban ao arrastar). */
export async function updateLeadStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Edição genérica de campos do lead. */
export async function updateLead(
  id: string,
  patch: Database["public"]["Tables"]["leads"]["Update"],
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}

/** Ações em MASSA (seleção em Meus Leads). RLS garante que só toca os leads do dono. */
export async function deleteLeads(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("leads").delete().in("id", ids);
  if (error) throw error;
}

export async function updateLeadsStatus(ids: string[], status: string): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

// ===== Contato MANUAL (WhatsApp/telefone/e-mail/presencial) =====
export const CANAIS_CONTATO = [
  { valor: "whatsapp", label: "WhatsApp" },
  { valor: "telefone", label: "Telefone" },
  { valor: "email", label: "E-mail" },
  { valor: "presencial", label: "Presencial" },
  { valor: "outro", label: "Outro" },
] as const;
export type CanalContato = (typeof CANAIS_CONTATO)[number]["valor"];
export const CANAL_LABEL: Record<string, string> = Object.fromEntries(
  CANAIS_CONTATO.map((c) => [c.valor, c.label]),
);

export type Contato = {
  id: string;
  lead_id: string;
  canal: string;
  anotacao: string | null;
  contatado_em: string;
};

/**
 * Registra um contato MANUAL de forma ATÔMICA (RPC registrar_contato_manual): insere no
 * histórico (lead_contatos → linha do tempo) E atualiza o lead na MESMA transação — move para
 * "Contatado" sem regredir quem já está adiantado (proposta_enviada+) e, se reengajou um lead
 * de lost/nurture, LIMPA o motivo de perda (o painel não conta mais quem voltou ao funil).
 * NÃO cria proposta nem seta "proposta_enviada" — o follow-up automático (que exige proposta
 * enviada) NUNCA é disparado por um contato manual.
 */
export async function registrarContato(
  leadId: string,
  entrada: { canal: CanalContato; anotacao?: string; contatado_em?: string },
): Promise<{ novoStatus: LeadStatus; quando: string; perdaLimpa: boolean }> {
  const quando = entrada.contatado_em ?? new Date().toISOString();
  const { data, error } = await supabase.rpc("registrar_contato_manual", {
    p_lead_id: leadId,
    p_canal: entrada.canal,
    p_anotacao: entrada.anotacao ?? null,
    p_contatado_em: quando,
  });
  if (error) throw error;
  const novoStatus = ((data as string) || "contacted") as LeadStatus;
  return {
    novoStatus,
    quando,
    perdaLimpa: novoStatus !== "lost" && novoStatus !== "nurture",
  };
}

/** Histórico de contatos manuais de um lead (mais recente primeiro). */
export async function listarContatos(leadId: string): Promise<Contato[]> {
  const { data, error } = await supabase
    .from("lead_contatos")
    .select("id, lead_id, canal, anotacao, contatado_em")
    .eq("lead_id", leadId)
    .order("contatado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ===== MOTIVO de perda/nutrição ESTRUTURADO (contável) =====
// Lista fixa: guardar o motivo como TEXTO exato desta lista o torna contável (ETAPA 3).
export const MOTIVOS_PERDA = [
  "Já tem site e está satisfeito",
  "Achou caro / sem orçamento",
  "Não é o momento",
  "Não respondeu",
  "Não é o decisor",
  "Já tem agência/fornecedor",
  "Outro",
] as const;
export type MotivoPerda = (typeof MOTIVOS_PERDA)[number];

/** Status "fora do funil" que pedem motivo estruturado. */
export const STATUS_PERDA: LeadStatus[] = ["lost", "nurture"];

/**
 * Move o lead para perdido/nutrição gravando o MOTIVO estruturado (contável) + anotação +
 * quando. Não cria proposta nem toca no follow-up. O motivo fica em leads (1 por lead =
 * estado atual), base do painel de aprendizado.
 */
export async function registrarPerda(
  leadId: string,
  entrada: { status: "lost" | "nurture"; motivo: MotivoPerda; anotacao?: string },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      status: entrada.status,
      motivo_perda: entrada.motivo,
      motivo_perda_nota: entrada.anotacao?.trim() || null,
      perda_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) throw error;
}

/**
 * Contagem por motivo de perda (painel de aprendizado). Conta SÓ quem está de fato fora do
 * funil (status lost/nurture) — se um lead foi reengajado, não conta mais, ainda que o campo
 * antigo persista. RLS já limita aos leads do dono.
 */
export async function contarMotivosPerda(): Promise<{ motivo: string; total: number }[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("motivo_perda")
    .in("status", STATUS_PERDA)
    .not("motivo_perda", "is", null);
  if (error) throw error;
  const cont = new Map<string, number>();
  for (const r of data ?? []) {
    const m = (r as { motivo_perda: string | null }).motivo_perda;
    if (m) cont.set(m, (cont.get(m) ?? 0) + 1);
  }
  return [...cont.entries()]
    .map(([motivo, total]) => ({ motivo, total }))
    .sort((a, b) => b.total - a.total);
}

export const LEAD_STATUSES = [
  "new",
  "enriched",
  "contacted",
  "proposta_enviada",
  "responded",
  "meeting",
  "won",
  "lost",
  "nurture",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  enriched: "Enriquecido",
  contacted: "Contatado",
  proposta_enviada: "Proposta enviada",
  responded: "Respondeu",
  meeting: "Reunião",
  won: "Ganho",
  lost: "Perdido",
  nurture: "Nutrição",
};
