import { supabase } from "@/integrations/supabase/client";
import { estimarCustoCommentsHunter } from "@/lib/instagram-comments";

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
  return response;
}

export async function listCommentsHunterHistory(): Promise<CommentsHunterHistory[]> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", {
    body: { acao: "historico" },
  });
  if (error) throw error;
  return ((data as { jobs?: CommentsHunterHistory[] })?.jobs ?? []) as CommentsHunterHistory[];
}
