import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import { instagramReelsResponseSchema, instagramTrendingReelsResponseSchema } from "../schemas.ts";
import { normalizeAisaRecords } from "./normalize.ts";

function nextPage(value: string | number | null | undefined): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function createAisaReelOperations(
  client: AisaClient,
): Pick<InstagramDataProvider, "searchReels" | "getTrendingReels"> {
  return {
    async searchReels(input) {
      const transport = await client.get(
        "/instagram/reels/search",
        { query: input.query, date_posted: input.datePosted, page: input.page },
        instagramReelsResponseSchema,
        { capability: "instagram.searchReels", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.reels, {
        nextPage: nextPage(transport.data.next_page),
      });
    },
    async getTrendingReels(input = {}) {
      const transport = await client.get(
        "/instagram/reels/trending",
        {},
        instagramTrendingReelsResponseSchema,
        { capability: "instagram.getTrendingReels", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.reels, {
        cursor: transport.data.cursor,
      });
    },
  };
}
