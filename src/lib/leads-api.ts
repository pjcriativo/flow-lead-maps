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
