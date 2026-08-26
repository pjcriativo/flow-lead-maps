import { supabase } from "@/integrations/supabase/client";

export type InstagramUsage = {
  leads: number;
  audienceProfiles: number;
  competitors: number;
  hunts: number;
  overlaps: number;
  enrichments: number;
  brands: number;
  monthlyCostUsd: number;
};

export type InstagramPlanStatus = {
  planId: string;
  planName: string;
  tier: "basico" | "pro" | "agencia";
  unlimited: boolean;
  monitoring: "manual" | "weekly" | "daily";
  limits: InstagramUsage;
  used: InstagramUsage;
  features: { audience: boolean; overlap: boolean; reports: boolean; multiBrand: boolean };
  monthRef: string;
};

export type AudienceMember = {
  sourceUsername: string;
  identityKey: string;
  instagramUserId: string | null;
  username: string;
  fullName: string | null;
  profilePicUrl: string | null;
  private: boolean;
  verified: boolean;
  collectedAt: string;
};

export type AudienceSearchResponse = {
  ok: boolean;
  jobId: string | null;
  cacheHit: boolean;
  charged: boolean;
  actualCost: number;
  newProfiles: number;
  total: number;
  sources: Record<string, AudienceMember[]>;
};

export type AudienceOverlapMember = {
  key: string;
  username: string;
  instagramUserId?: string | null;
  fullName?: string | null;
  sources: string[];
};

export type AudienceOverlapResponse = {
  ok: boolean;
  locked: boolean;
  requiredPlan?: string;
  preview?: { total: number; overlap: number };
  all?: AudienceOverlapMember[];
  overlap?: AudienceOverlapMember[];
  exclusiveBySource?: Record<string, AudienceOverlapMember[]>;
};

export type InstagramOpportunity = {
  id: string;
  score: number;
  temperature: "quente" | "morno" | "frio";
  reasons: string[];
  evidence: Array<Record<string, unknown>>;
  sources: string[];
  suggested_approach: string | null;
  status: "new" | "saved" | "contacted" | "won" | "lost" | "ignored";
  last_seen_at: string;
  profile: {
    username: string;
    full_name: string | null;
    biography: string | null;
    profile_pic_url: string | null;
    followers_count: number | null;
    professional: boolean | null;
  } | null;
};

export type InstagramCommercialReport = {
  periodDays: number;
  opportunities: number;
  hot: number;
  won: number;
  competitors: number;
  runs: number;
  costUsd: number;
  costPerOpportunityUsd: number;
  mapsInstagram: number;
  weakDigitalPresence: number;
  modes: Array<[string, number]>;
};

type EdgeError = { ok?: boolean; error?: string; reason?: string };

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", { body });
  if (error) {
    const context = error.context as { json?: () => Promise<EdgeError> } | undefined;
    const payload = await context?.json?.().catch(() => null);
    throw new Error(payload?.error ?? error.message);
  }
  const response = data as T & EdgeError;
  if (response.ok === false) throw new Error(response.error ?? "A operação não foi concluída.");
  return response;
}

export async function getInstagramPlan(): Promise<InstagramPlanStatus> {
  const response = await invoke<{ ok: true; plan: InstagramPlanStatus }>({ acao: "plano_status" });
  return response.plan;
}

export async function searchCompetitorAudiences(
  usernames: string[],
  resultsLimit: number,
): Promise<AudienceSearchResponse> {
  return invoke({
    acao: "buscar_audiencia",
    requestId: crypto.randomUUID(),
    usernames,
    resultsLimit,
  });
}

export async function overlapCompetitorAudiences(
  usernames: string[],
): Promise<AudienceOverlapResponse> {
  return invoke({ acao: "cruzar_audiencia", requestId: crypto.randomUUID(), usernames });
}

export async function listInstagramOpportunities(): Promise<InstagramOpportunity[]> {
  const response = await invoke<{ ok: true; opportunities: InstagramOpportunity[] }>({
    acao: "listar_oportunidades",
  });
  return response.opportunities;
}

export async function enrichInstagramOpportunities(
  limit: number,
): Promise<{ enriched: number; cacheHit: boolean; actualCost: number }> {
  return invoke({
    acao: "enriquecer_oportunidades",
    requestId: crypto.randomUUID(),
    limit,
  });
}

export async function generateOpportunityApproach(
  opportunityId: string,
  offer: string,
): Promise<string> {
  const response = await invoke<{ ok: true; message: string }>({
    acao: "gerar_abordagem",
    opportunityId,
    offer,
  });
  return response.message;
}

export async function updateOpportunityStatus(
  opportunityId: string,
  status: InstagramOpportunity["status"],
): Promise<void> {
  await invoke({ acao: "atualizar_oportunidade", opportunityId, status });
}

export async function getInstagramCommercialReport(): Promise<{
  report: InstagramCommercialReport;
  mapsInstagram: Array<Record<string, unknown>>;
}> {
  return invoke({ acao: "relatorio_comercial" });
}
