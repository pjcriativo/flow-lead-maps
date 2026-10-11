export type SocialNetwork = "instagram" | "linkedin";
export type SocialProvider = "aisa" | "apify";

export interface SocialPagination {
  cursor?: string | null;
  nextMaxId?: string | null;
  nextPage?: number | null;
  moreAvailable?: boolean;
}

export interface SocialCost {
  status: "settled" | "unknown";
  customerCostMicrosUsd: string | null;
  costUsdExact: string | null;
}

export interface SocialEvidence {
  endpoint: string;
  query: Readonly<Record<string, string>>;
  requestId: string | null;
  receivedAt: string;
}

export interface SocialRecord {
  id: string;
  provider: SocialProvider;
  network: SocialNetwork;
  username: string | null;
  data: Readonly<Record<string, unknown>>;
  evidence: SocialEvidence;
  timestamp: string;
  queryId: string;
}

export interface SocialProviderResult<TRecord extends SocialRecord = SocialRecord> {
  items: TRecord[];
  pagination: SocialPagination;
  requestId: string | null;
  queryId: string;
  receivedAt: string;
  cost: SocialCost;
}

export type InstagramDatePosted =
  "last-hour" | "last-day" | "last-week" | "last-month" | "last-year";

export interface InstagramDataProvider {
  getProfile(input: {
    handle: string;
    trim?: boolean;
    queryId?: string;
  }): Promise<SocialProviderResult>;
  getUserPosts(input: {
    handle: string;
    nextMaxId?: string;
    trim?: boolean;
    queryId?: string;
  }): Promise<SocialProviderResult>;
  getPostComments(input: {
    url: string;
    cursor?: string;
    queryId?: string;
  }): Promise<SocialProviderResult>;
  searchProfiles(input: {
    query: string;
    cursor?: string;
    queryId?: string;
  }): Promise<SocialProviderResult>;
  searchHashtag(input: {
    hashtag: string;
    datePosted?: InstagramDatePosted;
    mediaType?: "all" | "reels";
    cursor?: string;
    queryId?: string;
  }): Promise<SocialProviderResult>;
  searchReels(input: {
    query: string;
    datePosted?: InstagramDatePosted;
    page?: number;
    queryId?: string;
  }): Promise<SocialProviderResult>;
  getTrendingReels(input?: { queryId?: string }): Promise<SocialProviderResult>;
  transcribeMedia(input: { url: string; queryId?: string }): Promise<SocialProviderResult>;
}
