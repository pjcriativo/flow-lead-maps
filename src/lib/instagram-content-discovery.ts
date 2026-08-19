export type ContentDiscoveryMode =
  "hashtags" | "places" | "reels" | "mentions" | "imports" | "related";

export type ContentDiscoveryCostInput = {
  mode: ContentDiscoveryMode;
  hashtags: readonly string[];
  profileInputs?: readonly string[];
  sourcesLimit: number;
  postsPerSource: number;
  targetLeads: number;
};

export type InstagramContentSignalInput = {
  caption?: string | null;
  likes?: number | null;
  comments?: number | null;
  views?: number | null;
  postedAt?: string | null;
  contentType?: "post" | "reel" | "carousel" | string | null;
  locationText?: string | null;
};

export type InstagramContentSignals = {
  contentScore: number;
  activityScore: number;
  nicheScore: number;
  locationScore: number;
  commercialScore: number;
  averageLikes: number;
  medianLikes: number;
  averageComments: number;
  medianComments: number;
  averageViews: number;
  medianViews: number;
  viewRate: number;
  robustEngagementRate: number;
  latestPostAt: string | null;
  formats: string[];
  matchedTerms: string[];
  commercialSignals: string[];
};

const STOP_WORDS = new Set([
  "a",
  "as",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "para",
  "por",
  "servico",
  "servicos",
]);

const COMMERCIAL_PATTERNS: Array<[RegExp, string]> = [
  [/\b(agenda|agende|agendamento|horario|vagas?)\b/i, "agendamento"],
  [/\b(orcamento|valor|preco|promocao|desconto)\b/i, "oferta"],
  [/\b(whatsapp|direct|chame|contato|fale conosco)\b/i, "chamada_para_contato"],
  [/\b(compre|peca|reserve|contrate|delivery|entrega)\b/i, "chamada_comercial"],
  [/\b(link na bio|saiba mais|acesse)\b/i, "conversao_na_bio"],
];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeInstagramDiscoveryText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9#_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeInstagramHashtag(value: unknown): string {
  return normalizeInstagramDiscoveryText(value).replace(/^#+/, "").replace(/\s+/g, "");
}

export function buildInstagramHashtagUrls(hashtags: readonly string[]): string[] {
  return [
    ...new Set(
      hashtags.map(normalizeInstagramHashtag).filter((tag) => /^[a-z0-9_]{2,100}$/.test(tag)),
    ),
  ].map((tag) => `https://www.instagram.com/explore/tags/${tag}/`);
}

export function normalizeInstagramProfileInputs(values: readonly unknown[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => String(value ?? "").trim())
        .map((value) => {
          if (!value) return "";
          if (!/instagram\.com/i.test(value)) return value.replace(/^@/, "");
          try {
            const parsed = new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`);
            if (!/(^|\.)instagram\.com$/i.test(parsed.hostname)) return "";
            const [segment = ""] = parsed.pathname.split("/").filter(Boolean);
            if (["p", "reel", "reels", "stories", "explore", "share"].includes(segment)) return "";
            return segment;
          } catch {
            return value.replace(/^@/, "");
          }
        })
        .map((value) => value.toLocaleLowerCase("pt-BR"))
        .filter((value) => /^[a-z0-9._]{1,30}$/.test(value)),
    ),
  ];
}

export function buildInstagramProfileUrls(values: readonly unknown[]): string[] {
  return normalizeInstagramProfileInputs(values).map(
    (username) => `https://www.instagram.com/${username}/`,
  );
}

export function extractInstagramRelatedUsernames(
  profiles: readonly unknown[],
  limit: number,
  excluded: readonly unknown[] = [],
): string[] {
  const excludedSet = new Set(normalizeInstagramProfileInputs(excluded));
  const candidates = profiles.flatMap((profile) => {
    if (!profile || typeof profile !== "object") return [];
    const related = (profile as { relatedProfiles?: unknown }).relatedProfiles;
    if (!Array.isArray(related)) return [];
    return related.map((item) =>
      typeof item === "string"
        ? item
        : item && typeof item === "object"
          ? ((item as { username?: unknown; userName?: unknown }).username ??
            (item as { userName?: unknown }).userName)
          : "",
    );
  });
  return normalizeInstagramProfileInputs(candidates)
    .filter((username) => !excludedSet.has(username))
    .slice(0, Math.max(0, Math.floor(limit)));
}

export function instagramContentResultsType(
  mode: ContentDiscoveryMode,
): "posts" | "reels" | "mentions" {
  if (mode === "reels") return "reels";
  if (mode === "mentions") return "mentions";
  return "posts";
}

export function instagramDiscoverySourceCount(input: ContentDiscoveryCostInput): number {
  if (input.mode === "hashtags" || input.mode === "reels") {
    return Math.max(1, input.hashtags.length);
  }
  if (input.mode === "mentions" || input.mode === "imports") {
    return Math.max(1, input.profileInputs?.length ?? 0);
  }
  return Math.max(1, input.sourcesLimit);
}

export function estimateInstagramContentDiscoveryCost(input: ContentDiscoveryCostInput): number {
  const sourceCount = instagramDiscoverySourceCount(input);
  if (input.mode === "imports") return Number((sourceCount * 0.0026).toFixed(4));
  const sourceDiscovery = input.mode === "places" ? input.sourcesLimit * 0.0027 : 0;
  const seedEnrichment =
    input.mode === "related" ? Math.max(1, input.profileInputs?.length ?? 0) * 0.0026 : 0;
  const contentItems = sourceCount * input.postsPerSource;
  const profiles = Math.min(75, Math.max(12, input.targetLeads * 3));
  return Number(
    (sourceDiscovery + seedEnrichment + contentItems * 0.0027 + profiles * 0.0026).toFixed(4),
  );
}

function relevantTokens(value: string): string[] {
  return normalizeInstagramDiscoveryText(value)
    .split(" ")
    .map((token) => token.replace(/^#/, ""))
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function average(values: readonly number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function validMetric(value: number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function analyzeInstagramContentSignals(params: {
  contents: readonly InstagramContentSignalInput[];
  followers: number;
  niche: string;
  city: string;
  now?: Date;
}): InstagramContentSignals {
  const { contents, niche, city } = params;
  const followers = Math.max(0, Number(params.followers) || 0);
  const now = params.now ?? new Date();
  const likes = contents.map((item) => validMetric(item.likes));
  const comments = contents.map((item) => validMetric(item.comments));
  const views = contents.map((item) => validMetric(item.views));
  const captions = contents.map((item) => normalizeInstagramDiscoveryText(item.caption));
  const nicheTokens = relevantTokens(niche);
  const cityTokens = relevantTokens(city);
  const matchedTerms = [
    ...new Set(nicheTokens.filter((token) => captions.some((caption) => caption.includes(token)))),
  ];
  const locationCorpus = contents
    .map((item) =>
      normalizeInstagramDiscoveryText(`${item.locationText ?? ""} ${item.caption ?? ""}`),
    )
    .join(" ");
  const matchedCity = cityTokens.filter((token) => locationCorpus.includes(token));
  const commercialSignals = [
    ...new Set(
      COMMERCIAL_PATTERNS.filter(([pattern]) =>
        contents.some((item) => pattern.test(String(item.caption ?? ""))),
      ).map(([, label]) => label),
    ),
  ];
  const dates = contents
    .map((item) => (item.postedAt ? new Date(item.postedAt) : null))
    .filter((date): date is Date => Boolean(date && Number.isFinite(date.getTime())))
    .sort((a, b) => b.getTime() - a.getTime());
  const latest = dates[0] ?? null;
  const ageDays = latest ? (now.getTime() - latest.getTime()) / 86_400_000 : Infinity;
  const activityScore = ageDays <= 7 ? 100 : ageDays <= 30 ? 80 : ageDays <= 90 ? 55 : 20;
  const nicheScore = nicheTokens.length
    ? clamp((matchedTerms.length / nicheTokens.length) * 100)
    : 70;
  const locationScore = cityTokens.length
    ? clamp((matchedCity.length / cityTokens.length) * 100)
    : 70;
  const commercialScore = clamp(commercialSignals.length * 24);
  const medianLikes = median(likes);
  const medianComments = median(comments);
  const medianViews = median(views);
  const robustEngagementRate = followers
    ? Number((((medianLikes + medianComments) / followers) * 100).toFixed(2))
    : 0;
  const engagementScore = clamp(Math.min(100, robustEngagementRate * 16));
  const viewRate = followers ? Number(((medianViews / followers) * 100).toFixed(2)) : 0;
  const viewScore = clamp(Math.min(100, viewRate * 2));
  const hasVideoMetrics = views.some((value) => value > 0);
  const contentScore = clamp(
    nicheScore * 0.35 +
      locationScore * 0.15 +
      commercialScore * 0.2 +
      activityScore * 0.2 +
      Math.max(engagementScore, hasVideoMetrics ? viewScore : 0) * 0.1,
  );

  return {
    contentScore,
    activityScore,
    nicheScore,
    locationScore,
    commercialScore,
    averageLikes: Number(average(likes).toFixed(1)),
    medianLikes: Number(medianLikes.toFixed(1)),
    averageComments: Number(average(comments).toFixed(1)),
    medianComments: Number(medianComments.toFixed(1)),
    averageViews: Number(average(views).toFixed(1)),
    medianViews: Number(medianViews.toFixed(1)),
    viewRate,
    robustEngagementRate,
    latestPostAt: latest?.toISOString() ?? null,
    formats: [...new Set(contents.map((item) => String(item.contentType ?? "post")))],
    matchedTerms,
    commercialSignals,
  };
}

export function calculateInstagramContentLeadScore(params: {
  contentScore: number;
  professional: boolean;
  profileNicheMatch: boolean;
  profileLocationMatch: boolean;
  authenticityScore: number;
  hasContact: boolean;
  followers: number;
}): number {
  const audience = params.followers >= 100 && params.followers <= 250_000 ? 5 : 0;
  return clamp(
    params.contentScore * 0.35 +
      (params.professional ? 18 : 0) +
      (params.profileNicheMatch ? 15 : 0) +
      (params.profileLocationMatch ? 12 : 0) +
      params.authenticityScore * 0.1 +
      (params.hasContact ? 5 : 0) +
      audience,
  );
}
