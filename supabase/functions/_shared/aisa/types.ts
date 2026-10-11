import type { SocialCost } from "../social-data-contracts.ts";

export type AisaCapability =
  | "instagram.getProfile"
  | "instagram.getUserPosts"
  | "instagram.getPostComments"
  | "instagram.searchProfiles"
  | "instagram.searchHashtag"
  | "instagram.searchReels"
  | "instagram.getTrendingReels"
  | "instagram.transcribeMedia";

export interface AisaRequestContext {
  capability: AisaCapability;
  queryId?: string;
}

export interface AisaTransportResult<T> {
  data: T;
  endpoint: string;
  query: Readonly<Record<string, string>>;
  queryId: string;
  requestId: string | null;
  receivedAt: string;
  cost: SocialCost;
}

export interface AisaUsageEvent {
  capability: AisaCapability;
  endpoint: string;
  queryId: string;
  requestId: string | null;
  attempt: number;
  httpStatus: number;
  cost: SocialCost;
  occurredAt: string;
}

export interface AisaUsageTracker {
  record(event: AisaUsageEvent): Promise<void>;
}

export type AisaLogEvent =
  | {
      level: "info";
      event: "request_complete" | "request_retry";
      capability: AisaCapability;
      endpoint: string;
      queryId: string;
      requestId: string | null;
      attempt: number;
      httpStatus?: number;
    }
  | {
      level: "error";
      event: "usage_tracking_failed" | "request_failed";
      capability: AisaCapability;
      endpoint: string;
      queryId: string;
      requestId: string | null;
      attempt: number;
      httpStatus?: number;
      errorCode: string;
    };

export type AisaLogger = (event: AisaLogEvent) => void;
