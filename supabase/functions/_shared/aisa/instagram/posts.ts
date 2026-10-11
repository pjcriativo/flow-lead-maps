import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import { instagramUserPostsResponseSchema } from "../schemas.ts";
import { normalizeAisaRecords } from "./normalize.ts";

export function createAisaPostOperations(
  client: AisaClient,
): Pick<InstagramDataProvider, "getUserPosts"> {
  return {
    async getUserPosts(input) {
      const transport = await client.get(
        "/instagram/user/posts",
        { handle: input.handle, next_max_id: input.nextMaxId, trim: input.trim },
        instagramUserPostsResponseSchema,
        { capability: "instagram.getUserPosts", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.items, {
        nextMaxId: transport.data.next_max_id ?? transport.data.max_id,
        moreAvailable: transport.data.more_available,
      });
    },
  };
}
