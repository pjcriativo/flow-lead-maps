// Cliente do front para a Fase 1: busca (streaming) + gestão de leads.
// A chave da Google Places NUNCA passa por aqui — fica no secret da Edge Function.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];

export type ScoreBreakdown = {
  score: number;
  is_gold: boolean;
  rating_points: number;
  reviews_points: number;
  website_points: number;
  bad_site_points: number;
  email_points: number;
  bad_site: boolean;
  bad_site_reasons: string[];
  notes: string[];
};

/** Fontes de busca plugáveis (o seletor da UI escolhe; o backend despacha). */
export type FonteBusca = "osm" | "geoapify" | "places";

export const FONTE_LABELS: Record<FonteBusca, string> = {
  osm: "OpenStreetMap (grátis)",
  geoapify: "Geoapify (grátis)",
  places: "Google Maps (requer billing)",
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
    body: JSON.stringify(params),
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
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).lead as Lead;
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
  responded: "Respondeu",
  meeting: "Reunião",
  won: "Ganho",
  lost: "Perdido",
  nurture: "Nutrição",
};
