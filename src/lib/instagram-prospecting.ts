export type InstagramProfileCapability =
  | "profile_search"
  | "profile_lookup"
  | "posts"
  | "comments"
  | "hashtags"
  | "reels"
  | "trending_reels"
  | "media_transcript"
  | "competitor_followers"
  | "audience_overlap"
  | "location_search"
  | "mentions"
  | "related_profiles";

const AISA_CAPABILITIES = new Set<InstagramProfileCapability>([
  "profile_search",
  "profile_lookup",
  "posts",
  "comments",
  "hashtags",
  "reels",
  "trending_reels",
  "media_transcript",
]);

export function selectInstagramProfileProvider(params: {
  aisaAvailable: boolean;
  capability: InstagramProfileCapability;
}): "aisa" | "apify" {
  return params.aisaAvailable && AISA_CAPABILITIES.has(params.capability) ? "aisa" : "apify";
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function records(value: unknown): ReadonlyArray<Readonly<Record<string, unknown>>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Readonly<Record<string, unknown>> =>
      item !== null && typeof item === "object" && !Array.isArray(item),
  );
}

/** Converts the documented AISA snake_case profile into the existing discovery contract. */
export function normalizeAisaProfileForDiscovery(
  profile: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const bioLinks = records(profile.bio_links);
  return {
    id: text(profile.id),
    username: text(profile.username),
    fullName: text(profile.full_name),
    biography: text(profile.biography) ?? "",
    bioLinks,
    externalUrl: text(profile.external_url),
    private: boolean(profile.is_private),
    isPrivate: boolean(profile.is_private),
    verified: boolean(profile.is_verified),
    isVerified: boolean(profile.is_verified),
    isBusinessAccount: boolean(profile.is_business_account),
    isProfessionalAccount: boolean(profile.is_professional_account),
    businessCategoryName: text(profile.category_name),
    profilePicUrl: text(profile.profile_pic_url),
    followersCount: finiteNumber(profile.follower_count),
    followingCount: finiteNumber(profile.following_count),
    postsCount: finiteNumber(profile.media_count),
    mediaCount: finiteNumber(profile.media_count),
    instagramUrl: text(profile.url),
    googleTitle: text(profile.google_title),
    googleDescription: text(profile.google_description),
    engagementRate: null,
    locationName: null,
    provider: "aisa",
  };
}

function usernameKey(username: string): string {
  return username.trim().replace(/^@/, "").toLocaleLowerCase("pt-BR");
}

export function mergeProspectingPages<T extends { id: string; username: string }>(
  current: readonly T[],
  next: readonly T[],
): T[] {
  const merged: T[] = [];
  const seen = new Set<string>();
  for (const item of [...current, ...next]) {
    const key = usernameKey(item.username);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}
