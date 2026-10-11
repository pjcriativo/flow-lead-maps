import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import { instagramSearchHashtagResponseSchema } from "../schemas.ts";
import { normalizeAisaRecords } from "./normalize.ts";

export function createAisaHashtagOperations(
  client: AisaClient,
): Pick<InstagramDataProvider, "searchHashtag"> {
  return {
    async searchHashtag(input) {
      const transport = await client.get(
        "/instagram/search/hashtag",
        {
          hashtag: input.hashtag,
          date_posted: input.datePosted,
          media_type: input.mediaType,
          cursor: input.cursor,
        },
        instagramSearchHashtagResponseSchema,
        { capability: "instagram.searchHashtag", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.posts, {
        cursor: transport.data.cursor,
      });
    },
  };
}
