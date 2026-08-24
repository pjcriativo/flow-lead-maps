import { supabase } from "@/integrations/supabase/client";
import {
  estimateCompetitorMonitoringCost,
  type CompetitorAlert,
  type CompetitorCommentSummary,
  type CompetitorContentSummary,
  type CompetitorTrend,
} from "@/lib/instagram-competitor-intelligence";

export type InstagramCompetitor = {
  id: string;
  org_id: string;
  user_id: string;
  source_id: string | null;
  username: string;
  label: string | null;
  niche: string;
  city: string | null;
  state: string | null;
  status: "active" | "paused" | "archived";
  monitoring_interval_hours: number;
  last_analyzed_at: string | null;
  next_analysis_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InstagramCompetitorSnapshot = {
  id: string;
  competitor_id: string;
  job_id: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  follower_delta: number;
  follower_growth_percent: number;
  posts_delta: number;
  engagement_rate: number;
  engagement_delta: number;
  posting_frequency_weekly: number;
  average_likes: number;
  median_likes: number;
  average_comments: number;
  median_comments: number;
  content_score: number;
  profile_pic_url: string | null;
  full_name: string | null;
  biography: string | null;
  business_category: string | null;
  format_counts: Record<string, number>;
  hashtags: Array<{ name: string; count: number }>;
  locations: Array<{ name: string; count: number }>;
  top_posts: CompetitorContentSummary["topPosts"];
  comment_summary: CompetitorCommentSummary;
  profile_snapshot: Record<string, unknown> | null;
  captured_at: string;
};

export type InstagramCompetitorAlert = {
  id: string;
  competitor_id: string;
  snapshot_id: string | null;
  alert_type: CompetitorAlert["type"];
  severity: CompetitorAlert["severity"];
  title: string;
  description: string;
  score: number;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type CompetitorMonitorInput = {
  competitorId: string;
  maxPosts: number;
  commentPosts: number;
  commentsPerPost: number;
};

export type CompetitorMonitorResponse = {
  ok: boolean;
  jobId?: string;
  competitor?: InstagramCompetitor;
  snapshot?: InstagramCompetitorSnapshot;
  content?: CompetitorContentSummary;
  comments?: CompetitorCommentSummary;
  trend?: CompetitorTrend;
  alerts?: CompetitorAlert[];
  stats?: {
    posts: number;
    comments: number;
    uniqueCommenters: number;
    opportunities: number;
    recurringCommenters: number;
    objections: number;
    alerts: number;
  };
  estimatedCost?: number;
  actualCost?: number;
  error?: string;
};

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("instagram-discovery", { body });
  if (error) {
    const context = error.context as { json?: () => Promise<{ error?: string }> } | undefined;
    const payload = await context?.json?.().catch(() => null);
    throw new Error(payload?.error ?? error.message);
  }
  const response = data as T & { ok?: boolean; error?: string };
  if (response.ok === false) throw new Error(response.error ?? "Operação não concluída.");
  return response;
}

export function estimateCompetitorCost(input: CompetitorMonitorInput): number {
  return estimateCompetitorMonitoringCost(input);
}

export async function listInstagramCompetitors(): Promise<{
  competitors: InstagramCompetitor[];
  snapshots: InstagramCompetitorSnapshot[];
  alerts: InstagramCompetitorAlert[];
}> {
  return invoke({ acao: "listar_concorrentes" });
}

export async function saveInstagramCompetitor(input: {
  username: string;
  label: string;
  niche: string;
  city: string;
  state: string;
  monitoringIntervalHours: number;
}): Promise<InstagramCompetitor> {
  const response = await invoke<{ competitor: InstagramCompetitor }>({
    acao: "salvar_concorrente",
    requestId: crypto.randomUUID(),
    ...input,
  });
  return response.competitor;
}

export async function archiveInstagramCompetitor(competitorId: string): Promise<void> {
  await invoke({ acao: "arquivar_concorrente", competitorId });
}

export async function monitorInstagramCompetitor(
  input: CompetitorMonitorInput,
): Promise<CompetitorMonitorResponse> {
  return invoke({ acao: "monitorar_concorrente", requestId: crypto.randomUUID(), ...input });
}
