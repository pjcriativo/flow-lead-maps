export type InstagramScoreSource =
  | "profile_search"
  | "comments"
  | "hashtags"
  | "places"
  | "competitor"
  | "reels"
  | "mentions"
  | "imports"
  | "related";

export type InstagramScoreDimension = "intent" | "fit" | "activity" | "authenticity";
export type InstagramScoreWeights = Record<InstagramScoreDimension, number>;
export type InstagramScoreGrade = "hot" | "strong" | "developing" | "weak";

export type InstagramFitSignals = {
  niche: number;
  location: number;
  profileType: number;
  audience: number;
  contact: number;
};

export type InstagramScoreV2Input = {
  source: InstagramScoreSource;
  intent: number;
  fit: InstagramFitSignals;
  activity: number;
  authenticity: number;
  weights?: Partial<InstagramScoreWeights>;
  evidence?: Partial<Record<InstagramScoreDimension, string[]>>;
};

export type InstagramScoreV2Result = {
  version: 2;
  source: InstagramScoreSource;
  total: number;
  grade: InstagramScoreGrade;
  scores: Record<InstagramScoreDimension, number>;
  weights: InstagramScoreWeights;
  contributions: Record<InstagramScoreDimension, number>;
  fitSignals: InstagramFitSignals;
  strengths: string[];
  risks: string[];
  explanation: string;
  evidence: Record<InstagramScoreDimension, string[]>;
};

export const INSTAGRAM_SCORE_DEFAULT_WEIGHTS: Record<InstagramScoreSource, InstagramScoreWeights> =
  {
    profile_search: { intent: 0.1, fit: 0.55, activity: 0.2, authenticity: 0.15 },
    comments: { intent: 0.45, fit: 0.3, activity: 0.1, authenticity: 0.15 },
    hashtags: { intent: 0.2, fit: 0.4, activity: 0.25, authenticity: 0.15 },
    places: { intent: 0.2, fit: 0.4, activity: 0.25, authenticity: 0.15 },
    competitor: { intent: 0.4, fit: 0.3, activity: 0.15, authenticity: 0.15 },
    reels: { intent: 0.25, fit: 0.35, activity: 0.25, authenticity: 0.15 },
    mentions: { intent: 0.4, fit: 0.3, activity: 0.15, authenticity: 0.15 },
    imports: { intent: 0.1, fit: 0.55, activity: 0.2, authenticity: 0.15 },
    related: { intent: 0.15, fit: 0.45, activity: 0.25, authenticity: 0.15 },
  };

const DIMENSION_LABELS: Record<InstagramScoreDimension, string> = {
  intent: "intenção",
  fit: "aderência",
  activity: "atividade",
  authenticity: "autenticidade",
};
const SCORE_DIMENSIONS: readonly InstagramScoreDimension[] = [
  "intent",
  "fit",
  "activity",
  "authenticity",
];

const SOURCE_LABELS: Record<InstagramScoreSource, string> = {
  profile_search: "busca por perfil",
  comments: "comentários",
  hashtags: "hashtags",
  places: "lugares",
  competitor: "concorrentes",
  reels: "Reels",
  mentions: "menções",
  imports: "importação de perfis",
  related: "perfis relacionados",
};

function clamp(value: number): number {
  const parsed = Number(value);
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(parsed) ? parsed : 0)));
}

function normalizeWeights(
  source: InstagramScoreSource,
  custom?: Partial<InstagramScoreWeights>,
): InstagramScoreWeights {
  const defaults = INSTAGRAM_SCORE_DEFAULT_WEIGHTS[source];
  const merged: InstagramScoreWeights = {
    intent: Math.max(0, Number(custom?.intent ?? defaults.intent) || 0),
    fit: Math.max(0, Number(custom?.fit ?? defaults.fit) || 0),
    activity: Math.max(0, Number(custom?.activity ?? defaults.activity) || 0),
    authenticity: Math.max(0, Number(custom?.authenticity ?? defaults.authenticity) || 0),
  };
  const total = Object.values(merged).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return defaults;
  return {
    intent: Number((merged.intent / total).toFixed(4)),
    fit: Number((merged.fit / total).toFixed(4)),
    activity: Number((merged.activity / total).toFixed(4)),
    authenticity: Number((merged.authenticity / total).toFixed(4)),
  };
}

export function calculateInstagramFitScore(signals: InstagramFitSignals): number {
  return clamp(
    clamp(signals.niche) * 0.4 +
      clamp(signals.location) * 0.25 +
      clamp(signals.profileType) * 0.15 +
      clamp(signals.audience) * 0.1 +
      clamp(signals.contact) * 0.1,
  );
}

export function scoreInstagramActivity(input: {
  lastActiveAt?: string | null;
  postsCount?: number | null;
  engagementRate?: number | null;
  now?: Date;
}): number {
  const lastActive = input.lastActiveAt ? new Date(input.lastActiveAt) : null;
  const lastActiveTime = lastActive?.getTime() ?? Number.NaN;
  const validDate = Number.isFinite(lastActiveTime);
  const ageDays = validDate
    ? ((input.now ?? new Date()).getTime() - lastActiveTime) / 86_400_000
    : Infinity;
  let score = ageDays <= 7 ? 100 : ageDays <= 30 ? 82 : ageDays <= 90 ? 58 : 20;
  if (!validDate && Number(input.postsCount ?? 0) > 0) score = 35;
  if (Number(input.engagementRate ?? 0) >= 1) score += 8;
  if (Number(input.postsCount ?? 0) >= 12) score += 5;
  return clamp(score);
}

export function scoreInstagramAuthenticity(input: {
  followers?: number | null;
  following?: number | null;
  posts?: number | null;
  private?: boolean;
  verified?: boolean;
  hasAvatar?: boolean;
  hasBio?: boolean;
}): number {
  const followers = Math.max(0, Number(input.followers ?? 0));
  const following = Math.max(0, Number(input.following ?? 0));
  const posts = Math.max(0, Number(input.posts ?? 0));
  let score = 25;
  if (input.hasAvatar) score += 10;
  if (input.hasBio) score += 10;
  if (posts >= 6) score += 15;
  if (followers >= 100) score += 15;
  if (followers >= 300 && following > 0 && followers / following >= 0.2) score += 15;
  if (input.private) score -= 15;
  if (input.verified) score += 10;
  return clamp(score);
}

export function scoreInstagramCommercialIntent(input: {
  explicitIntent?: number | null;
  professional?: boolean;
  hasContact?: boolean;
  commercialSignalCount?: number;
  contentScore?: number | null;
  callToAction?: boolean;
}): number {
  if (input.explicitIntent != null) return clamp(input.explicitIntent);
  return clamp(
    (input.professional ? 20 : 0) +
      (input.hasContact ? 25 : 0) +
      Math.min(30, Math.max(0, Number(input.commercialSignalCount ?? 0)) * 10) +
      clamp(Number(input.contentScore ?? 0)) * 0.15 +
      (input.callToAction ? 10 : 0),
  );
}

export function calculateInstagramScoreV2(input: InstagramScoreV2Input): InstagramScoreV2Result {
  const weights = normalizeWeights(input.source, input.weights);
  const scores = {
    intent: clamp(input.intent),
    fit: calculateInstagramFitScore(input.fit),
    activity: clamp(input.activity),
    authenticity: clamp(input.authenticity),
  };
  const contributions: Record<InstagramScoreDimension, number> = {
    intent: Number((scores.intent * weights.intent).toFixed(2)),
    fit: Number((scores.fit * weights.fit).toFixed(2)),
    activity: Number((scores.activity * weights.activity).toFixed(2)),
    authenticity: Number((scores.authenticity * weights.authenticity).toFixed(2)),
  };
  let total = clamp(Object.values(contributions).reduce((sum, value) => sum + value, 0));
  if (scores.authenticity < 25) total = Math.min(total, 64);
  if (scores.fit < 20) total = Math.min(total, 69);
  const grade: InstagramScoreGrade =
    total >= 80 ? "hot" : total >= 65 ? "strong" : total >= 45 ? "developing" : "weak";
  const ordered = [...SCORE_DIMENSIONS].sort((left, right) => scores[right] - scores[left]);
  const strengths = ordered
    .filter((dimension) => scores[dimension] >= 70)
    .map((dimension) => `${DIMENSION_LABELS[dimension]} ${scores[dimension]}/100`);
  const risks = ordered
    .filter((dimension) => scores[dimension] < 45)
    .map((dimension) => `${DIMENSION_LABELS[dimension]} ${scores[dimension]}/100`);
  const evidence = {
    intent: input.evidence?.intent ?? [],
    fit: input.evidence?.fit ?? [],
    activity: input.evidence?.activity ?? [],
    authenticity: input.evidence?.authenticity ?? [],
  };
  const priority = [...SCORE_DIMENSIONS].sort((left, right) => weights[right] - weights[left])[0];
  return {
    version: 2,
    source: input.source,
    total,
    grade,
    scores,
    weights,
    contributions,
    fitSignals: {
      niche: clamp(input.fit.niche),
      location: clamp(input.fit.location),
      profileType: clamp(input.fit.profileType),
      audience: clamp(input.fit.audience),
      contact: clamp(input.fit.contact),
    },
    strengths,
    risks,
    explanation: `Nota ${total}/100 em ${SOURCE_LABELS[input.source]}; ${DIMENSION_LABELS[priority]} tem o maior peso (${Math.round(weights[priority] * 100)}%).`,
    evidence,
  };
}

export function instagramScoreValue(
  score: InstagramScoreV2Result,
  dimension: InstagramScoreDimension | "total",
): number {
  return dimension === "total" ? score.total : score.scores[dimension];
}

export function isInstagramScoreV2(value: unknown): value is InstagramScoreV2Result {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<InstagramScoreV2Result>;
  return (
    candidate.version === 2 &&
    typeof candidate.total === "number" &&
    Boolean(candidate.scores) &&
    typeof candidate.scores?.intent === "number" &&
    typeof candidate.scores?.fit === "number" &&
    typeof candidate.scores?.activity === "number" &&
    typeof candidate.scores?.authenticity === "number"
  );
}
