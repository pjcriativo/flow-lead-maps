import { supabase } from "@/integrations/supabase/client";
import { estimarCustoCommentsHunter } from "@/lib/instagram-comments";
import {
  estimateInstagramContentDiscoveryCost,
  type ContentDiscoveryMode,
  type InstagramContentSignals,
} from "@/lib/instagram-content-discovery";
import {
  calculateInstagramScoreV2,
  isInstagramScoreV2,
  scoreInstagramCommercialIntent,
  type InstagramScoreV2Result,
} from "@/lib/instagram-score-v2";

export type CommentsHunterInput = {
  sourceType: "profile" | "posts";
  profile: string;
  postUrls: string[];
  niche: string;
  city: string;
  state: string;
  maxPosts: number;
  commentsPerPost: number;
  targetLeads: number;
  minIntentScore: number;
  minLeadScore: number;
  onlyProfessionals: boolean;
  requireLocation: boolean;
  requireNiche: boolean;
};

export type CommentLeadResult = {
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  biography: string;
  followers: number;
  following: number;
  posts: number;
  professional: boolean;
  category: string | null;
  externalUrl: string | null;
  email: string | null;
  whatsapp: string | null;
  comment: string;
  commentLikes: number;
  occurredAt: string | null;
  sourceUrl: string | null;
  intentLabel: "compra" | "duvida" | "interesse" | "elogio" | "generico";
  intentScore: number;
  intentSignals: string[];
  leadScore: number;
  scoreV2: InstagramScoreV2Result;
  nicheMatch: boolean;
  locationMatch: boolean;
  activity: number;
  authenticity: number;
  decision: "qualified" | "candidate" | "rejected" | "duplicate";
  rejectionReason: string | null;
  leadId: string | null;
};

export type CommentsHunterStats = {
  posts: number;
  comments: number;
  uniqueCommenters: number;
  intentCandidates: number;
  enrichedProfiles: number;
  qualified: number;
  newLeads: number;
  duplicates: number;
  rejections: Record<string, number>;
  cache: { posts: boolean; comments: boolean; profiles: boolean };
};

export type CommentsHunterResponse = {
  ok: boolean;
  jobId?: string;
  stats?: CommentsHunterStats;
  results?: CommentLeadResult[];
  estimatedCost?: number;
  actualCost?: number;
  spentMonthAfter?: number;
  caps?: { round: number; month: number };
  reason?: string;
  error?: string;
  pending?: boolean;
  status?: string;
};

export type CommentsHunterHistory = {
  id: string;
  status: string;
  input: CommentsHunterInput;
  stats: CommentsHunterStats | Record<string, never>;
  result: CommentsHunterResponse | null;
  estimated_cost_usd: number;
  actual_cost_usd: number;
  created_at: string;
  completed_at: string | null;
};

export function estimateCommentsHunterCost(input: CommentsHunterInput): number {
  return estimarCustoCommentsHunter(input);
}

function normalizeCommentScore(result: CommentLeadResult): CommentLeadResult {
  if (isInstagramScoreV2(result.scoreV2)) return result;
  return {
    ...result,
    scoreV2: calculateInstagramScoreV2({
      source: "comments",
      intent: result.intentScore,
      fit: {
        niche: result.nicheMatch ? 100 : 0,
        location: result.locationMatch ? 100 : 70,
        profileType: result.professional ? 100 : 60,
        audience: result.followers >= 100 ? 100 : 45,
        contact: result.email || result.whatsapp || result.externalUrl ? 100 : 60,
      },
      activity: result.activity,
      authenticity: result.authenticity,
      evidence: { intent: result.intentSignals },
    }),
  };
}

function normalizeCommentsResponse(response: CommentsHunterResponse): CommentsHunterResponse {
  return { ...response, results: response.results?.map(normalizeCommentScore) };
}

export async function runCommentsHunter(
  input: CommentsHunterInput,
): Promise<CommentsHunterResponse> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", {
    body: { acao: "buscar_comentarios", requestId: crypto.randomUUID(), ...input },
  });
  if (error) {
    const context = error.context as { json?: () => Promise<CommentsHunterResponse> } | undefined;
    const payload = await context?.json?.().catch(() => null);
    throw new Error(payload?.error ?? error.message);
  }
  const response = data as CommentsHunterResponse;
  if (!response.ok) throw new Error(response.error ?? "O Comments Hunter não concluiu a busca.");
  return normalizeCommentsResponse(response);
}

export async function listCommentsHunterHistory(): Promise<CommentsHunterHistory[]> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", {
    body: { acao: "historico" },
  });
  if (error) throw error;
  return ((data as { jobs?: CommentsHunterHistory[] })?.jobs ?? []).map((job) => ({
    ...job,
    result: job.result ? normalizeCommentsResponse(job.result) : null,
  }));
}

export type ContentDiscoveryInput = {
  mode: ContentDiscoveryMode;
  hashtags: string[];
  profileInputs: string[];
  niche: string;
  city: string;
  state: string;
  locationQuery: string;
  sourcesLimit: number;
  postsPerSource: number;
  targetLeads: number;
  recentDays: number;
  minFollowers: number;
  maxFollowers: number;
  minContentScore: number;
  minLeadScore: number;
  onlyProfessionals: boolean;
  requireLocation: boolean;
  requireNiche: boolean;
};

export type ContentLeadResult = {
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  biography: string;
  followers: number;
  following: number;
  posts: number;
  professional: boolean;
  accountKind: "business" | "creator" | "consumer";
  category: string | null;
  externalUrl: string | null;
  email: string | null;
  whatsapp: string | null;
  sourceType: ContentDiscoveryMode;
  sourceLabel: string;
  sourceUrl: string | null;
  evidenceCaption: string;
  contentCount: number;
  signals: InstagramContentSignals;
  leadScore: number;
  scoreV2: InstagramScoreV2Result;
  nicheMatch: boolean;
  locationMatch: boolean;
  authenticity: number;
  decision: "qualified" | "candidate" | "rejected" | "duplicate";
  rejectionReason: string | null;
  leadId: string | null;
};

export type ContentDiscoveryStats = {
  sourcesFound: number;
  contentItems: number;
  uniqueProfiles: number;
  enrichedProfiles: number;
  qualified: number;
  newLeads: number;
  duplicates: number;
  averageContentScore: number;
  formatCounts: Record<string, number>;
  rejections: Record<string, number>;
  cache: { sources: boolean; content: boolean; profiles: boolean };
};

export type ContentDiscoveryResponse = {
  ok: boolean;
  jobId?: string;
  stats?: ContentDiscoveryStats;
  results?: ContentLeadResult[];
  estimatedCost?: number;
  actualCost?: number;
  spentMonthAfter?: number;
  caps?: { round: number; month: number };
  reason?: string;
  error?: string;
};

export type ContentDiscoveryHistory = {
  id: string;
  status: string;
  input: ContentDiscoveryInput;
  stats: ContentDiscoveryStats | Record<string, never>;
  result: ContentDiscoveryResponse | null;
  estimated_cost_usd: number;
  actual_cost_usd: number;
  created_at: string;
  completed_at: string | null;
};

export function estimateContentDiscoveryCost(input: ContentDiscoveryInput): number {
  return estimateInstagramContentDiscoveryCost(input);
}

function normalizeContentScore(result: ContentLeadResult): ContentLeadResult {
  if (isInstagramScoreV2(result.scoreV2)) return result;
  return {
    ...result,
    scoreV2: calculateInstagramScoreV2({
      source: result.sourceType,
      intent: scoreInstagramCommercialIntent({
        explicitIntent: result.signals.commercialScore,
        professional: result.professional,
        hasContact: Boolean(result.email || result.whatsapp || result.externalUrl),
      }),
      fit: {
        niche: result.nicheMatch ? 100 : result.signals.nicheScore,
        location: result.locationMatch ? 100 : result.signals.locationScore,
        profileType: result.professional ? 100 : 60,
        audience: result.followers >= 100 ? 100 : 45,
        contact: result.email || result.whatsapp || result.externalUrl ? 100 : 55,
      },
      activity: result.signals.activityScore,
      authenticity: result.authenticity,
    }),
  };
}

function normalizeContentResponse(response: ContentDiscoveryResponse): ContentDiscoveryResponse {
  return { ...response, results: response.results?.map(normalizeContentScore) };
}

export async function runContentDiscovery(
  input: ContentDiscoveryInput,
): Promise<ContentDiscoveryResponse> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", {
    body: { acao: "buscar_conteudo", requestId: crypto.randomUUID(), ...input },
  });
  if (error) {
    const context = error.context as { json?: () => Promise<ContentDiscoveryResponse> } | undefined;
    const payload = await context?.json?.().catch(() => null);
    throw new Error(payload?.error ?? error.message);
  }
  const response = data as ContentDiscoveryResponse;
  if (!response.ok) throw new Error(response.error ?? "A descoberta por conteudo nao concluiu.");
  return normalizeContentResponse(response);
}

export async function listContentDiscoveryHistory(
  mode: ContentDiscoveryMode,
): Promise<ContentDiscoveryHistory[]> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", {
    body: { acao: "historico", mode },
  });
  if (error) throw error;
  return ((data as { jobs?: ContentDiscoveryHistory[] })?.jobs ?? []).map((job) => ({
    ...job,
    result: job.result ? normalizeContentResponse(job.result) : null,
  }));
}
