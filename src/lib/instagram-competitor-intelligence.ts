import { classificarIntencaoComentario } from "./instagram-comments.ts";
import {
  analyzeInstagramContentSignals,
  normalizeInstagramDiscoveryText,
  type InstagramContentSignalInput,
  type InstagramContentSignals,
} from "./instagram-content-discovery.ts";

export type CompetitorPostInput = InstagramContentSignalInput & {
  url: string;
  hashtags?: readonly string[] | null;
  locationText?: string | null;
};

export type CompetitorCommentInput = {
  username: string;
  text: string;
  likes?: number | null;
  occurredAt?: string | null;
  postUrl?: string | null;
};

export type RankedTerm = { name: string; count: number };

export type CompetitorContentSummary = {
  signals: InstagramContentSignals;
  postingFrequencyWeekly: number;
  formatCounts: Record<string, number>;
  hashtags: RankedTerm[];
  locations: RankedTerm[];
  topPosts: Array<{
    url: string;
    caption: string;
    likes: number;
    comments: number;
    views: number;
    engagement: number;
    contentType: string;
    postedAt: string | null;
  }>;
};

export type CompetitorCommentSummary = {
  totalComments: number;
  uniqueCommenters: number;
  purchaseIntentCount: number;
  questionCount: number;
  objectionCount: number;
  recurringCommenters: Array<{
    username: string;
    count: number;
    bestIntentScore: number;
    bestEvidence: string;
  }>;
  intentOpportunities: Array<{
    username: string;
    text: string;
    score: number;
    label: string;
    postUrl: string | null;
  }>;
  objections: Array<{ category: string; count: number; examples: string[] }>;
  questionTopics: RankedTerm[];
};

export type CompetitorSnapshotComparable = {
  followers: number;
  postsCount: number;
  engagementRate: number;
  capturedAt?: string | null;
  hashtags?: readonly RankedTerm[];
};

export type CompetitorTrend = {
  followerDelta: number;
  followerGrowthPercent: number;
  postsDelta: number;
  engagementDelta: number;
  newHashtags: string[];
};

export type CompetitorAlert = {
  type:
    | "purchase_intent"
    | "recurring_commenter"
    | "follower_growth"
    | "engagement_jump"
    | "objection_spike"
    | "new_hashtag";
  severity: "info" | "opportunity" | "warning";
  title: string;
  description: string;
  score: number;
  data: Record<string, unknown>;
};

const OBJECTION_PATTERNS: Array<[string, RegExp]> = [
  ["preco", /\b(caro|cara|preco|valor|desconto|parcel|dinheiro)\b/i],
  ["localizacao", /\b(longe|distante|endereco|onde fica|outra cidade|bairro)\b/i],
  ["prazo", /\b(demora|demorado|prazo|quanto tempo|espera)\b/i],
  ["agenda", /\b(sem horario|nao tem vaga|agenda cheia|disponibilidade)\b/i],
  ["confianca", /\b(funciona mesmo|garantia|medo|receio|reclam|problema)\b/i],
];

const QUESTION_STOP_WORDS = new Set([
  "como",
  "para",
  "qual",
  "quanto",
  "quando",
  "onde",
  "porque",
  "isso",
  "essa",
  "esse",
  "tem",
  "uma",
  "com",
  "vocês",
  "voces",
]);

function numberOrZero(value: number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function rank(values: readonly string[], limit = 12): RankedTerm[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = normalizeInstagramDiscoveryText(value).replace(/^#/, "").trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function hashtagsFromCaption(caption: string): string[] {
  return [...caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((match) => match[1]);
}

export function estimateCompetitorMonitoringCost(input: {
  maxPosts: number;
  commentPosts: number;
  commentsPerPost: number;
}): number {
  const posts = Math.max(1, input.maxPosts);
  const commentPosts = Math.min(posts, Math.max(1, input.commentPosts));
  const comments = commentPosts * Math.max(5, input.commentsPerPost);
  return Number((0.0026 + posts * 0.001 + comments * 0.0023).toFixed(4));
}

export function summarizeCompetitorContent(params: {
  posts: readonly CompetitorPostInput[];
  followers: number;
  niche: string;
  city: string;
  now?: Date;
}): CompetitorContentSummary {
  const { posts, followers, niche, city, now } = params;
  const signals = analyzeInstagramContentSignals({ contents: posts, followers, niche, city, now });
  const formatCounts: Record<string, number> = {};
  const hashtags: string[] = [];
  const locations: string[] = [];
  for (const post of posts) {
    const format = String(post.contentType ?? "post");
    formatCounts[format] = (formatCounts[format] ?? 0) + 1;
    hashtags.push(...(post.hashtags ?? []), ...hashtagsFromCaption(String(post.caption ?? "")));
    if (post.locationText) locations.push(post.locationText);
  }
  const dates = posts
    .map((post) => (post.postedAt ? new Date(post.postedAt) : null))
    .filter((date): date is Date => Boolean(date && Number.isFinite(date.getTime())))
    .sort((a, b) => a.getTime() - b.getTime());
  const coveredDays =
    dates.length > 1 ? Math.max(7, (dates.at(-1)!.getTime() - dates[0].getTime()) / 86_400_000) : 7;
  const postingFrequencyWeekly = Number(((posts.length / coveredDays) * 7).toFixed(1));
  const topPosts = posts
    .map((post) => {
      const likes = numberOrZero(post.likes);
      const comments = numberOrZero(post.comments);
      const views = numberOrZero(post.views);
      return {
        url: post.url,
        caption: String(post.caption ?? ""),
        likes,
        comments,
        views,
        engagement: likes + comments * 2,
        contentType: String(post.contentType ?? "post"),
        postedAt: post.postedAt ?? null,
      };
    })
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);
  return {
    signals,
    postingFrequencyWeekly,
    formatCounts,
    hashtags: rank(hashtags),
    locations: rank(locations),
    topPosts,
  };
}

export function summarizeCompetitorComments(
  comments: readonly CompetitorCommentInput[],
): CompetitorCommentSummary {
  const commenters = new Map<
    string,
    { count: number; bestIntentScore: number; bestEvidence: string }
  >();
  const opportunities: CompetitorCommentSummary["intentOpportunities"] = [];
  const objections = new Map<string, { count: number; examples: string[] }>();
  const questionTerms: string[] = [];
  let questionCount = 0;

  for (const comment of comments) {
    const username = normalizeInstagramDiscoveryText(comment.username).replace(/^@/, "");
    const text = String(comment.text ?? "").trim();
    if (!username || !text) continue;
    const intent = classificarIntencaoComentario(text);
    if (intent.spam) continue;
    const current = commenters.get(username) ?? {
      count: 0,
      bestIntentScore: 0,
      bestEvidence: text,
    };
    current.count++;
    if (intent.score > current.bestIntentScore) {
      current.bestIntentScore = intent.score;
      current.bestEvidence = text;
    }
    commenters.set(username, current);
    if (intent.score >= 45) {
      opportunities.push({
        username,
        text,
        score: intent.score,
        label: intent.rotulo,
        postUrl: comment.postUrl ?? null,
      });
    }
    if (text.includes("?")) {
      questionCount++;
      questionTerms.push(
        ...normalizeInstagramDiscoveryText(text)
          .split(" ")
          .filter((term) => term.length >= 4 && !QUESTION_STOP_WORDS.has(term)),
      );
    }
    for (const [category, pattern] of OBJECTION_PATTERNS) {
      if (!pattern.test(normalizeInstagramDiscoveryText(text))) continue;
      const item = objections.get(category) ?? { count: 0, examples: [] };
      item.count++;
      if (item.examples.length < 3) item.examples.push(text);
      objections.set(category, item);
    }
  }

  const recurringCommenters = [...commenters.entries()]
    .filter(([, item]) => item.count >= 2)
    .map(([username, item]) => ({ username, ...item }))
    .sort((a, b) => b.count - a.count || b.bestIntentScore - a.bestIntentScore)
    .slice(0, 20);
  const sortedOpportunities = opportunities
    .sort((a, b) => b.score - a.score)
    .filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.username === item.username) === index,
    )
    .slice(0, 30);
  const sortedObjections = [...objections.entries()]
    .map(([category, item]) => ({ category, ...item }))
    .sort((a, b) => b.count - a.count);
  return {
    totalComments: comments.length,
    uniqueCommenters: commenters.size,
    purchaseIntentCount: sortedOpportunities.filter((item) => item.score >= 60).length,
    questionCount,
    objectionCount: sortedObjections.reduce((sum, item) => sum + item.count, 0),
    recurringCommenters,
    intentOpportunities: sortedOpportunities,
    objections: sortedObjections,
    questionTopics: rank(questionTerms, 10),
  };
}

export function compareCompetitorSnapshots(
  current: CompetitorSnapshotComparable,
  previous?: CompetitorSnapshotComparable | null,
): CompetitorTrend {
  if (!previous) {
    return {
      followerDelta: 0,
      followerGrowthPercent: 0,
      postsDelta: 0,
      engagementDelta: 0,
      newHashtags: [],
    };
  }
  const previousTags = new Set((previous.hashtags ?? []).map((item) => item.name));
  const followerDelta = current.followers - previous.followers;
  return {
    followerDelta,
    followerGrowthPercent: previous.followers
      ? Number(((followerDelta / previous.followers) * 100).toFixed(2))
      : 0,
    postsDelta: current.postsCount - previous.postsCount,
    engagementDelta: Number((current.engagementRate - previous.engagementRate).toFixed(2)),
    newHashtags: (current.hashtags ?? [])
      .map((item) => item.name)
      .filter((name) => !previousTags.has(name)),
  };
}

export function buildCompetitorAlerts(params: {
  comments: CompetitorCommentSummary;
  trend: CompetitorTrend;
}): CompetitorAlert[] {
  const alerts: CompetitorAlert[] = [];
  for (const opportunity of params.comments.intentOpportunities.filter(
    (item) => item.score >= 60,
  )) {
    alerts.push({
      type: "purchase_intent",
      severity: "opportunity",
      title: `@${opportunity.username} demonstrou intenção`,
      description: opportunity.text,
      score: opportunity.score,
      data: opportunity,
    });
  }
  for (const commenter of params.comments.recurringCommenters.slice(0, 5)) {
    alerts.push({
      type: "recurring_commenter",
      severity: "opportunity",
      title: `@${commenter.username} interage com frequência`,
      description: `${commenter.count} comentários encontrados; melhor sinal ${commenter.bestIntentScore}/100.`,
      score: Math.min(100, 40 + commenter.count * 10 + commenter.bestIntentScore * 0.3),
      data: commenter,
    });
  }
  if (params.trend.followerGrowthPercent >= 2) {
    alerts.push({
      type: "follower_growth",
      severity: "info",
      title: "Concorrente acelerou o crescimento",
      description: `Audiência cresceu ${params.trend.followerGrowthPercent}% desde o snapshot anterior.`,
      score: Math.min(100, 50 + params.trend.followerGrowthPercent * 5),
      data: params.trend,
    });
  }
  if (params.trend.engagementDelta >= 1) {
    alerts.push({
      type: "engagement_jump",
      severity: "info",
      title: "Engajamento em alta",
      description: `A taxa robusta subiu ${params.trend.engagementDelta} pontos percentuais.`,
      score: Math.min(100, 50 + params.trend.engagementDelta * 8),
      data: params.trend,
    });
  }
  if (params.comments.objectionCount >= 3) {
    alerts.push({
      type: "objection_spike",
      severity: "warning",
      title: "Objeções recorrentes na audiência",
      description: `${params.comments.objectionCount} sinais agrupados em ${params.comments.objections.length} temas.`,
      score: Math.min(100, 40 + params.comments.objectionCount * 5),
      data: { objections: params.comments.objections },
    });
  }
  if (params.trend.newHashtags.length) {
    alerts.push({
      type: "new_hashtag",
      severity: "info",
      title: "Nova estratégia de hashtags",
      description: params.trend.newHashtags.map((tag) => `#${tag}`).join(", "),
      score: Math.min(100, 40 + params.trend.newHashtags.length * 5),
      data: { hashtags: params.trend.newHashtags },
    });
  }
  return alerts.sort((a, b) => b.score - a.score).slice(0, 50);
}
