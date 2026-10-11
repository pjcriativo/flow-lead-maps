import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import { instagramPostCommentsResponseSchema } from "../schemas.ts";
import { normalizeAisaRecords } from "./normalize.ts";

export function createAisaCommentOperations(
  client: AisaClient,
): Pick<InstagramDataProvider, "getPostComments"> {
  return {
    async getPostComments(input) {
      const transport = await client.get(
        "/instagram/post/comments",
        { url: input.url, cursor: input.cursor },
        instagramPostCommentsResponseSchema,
        { capability: "instagram.getPostComments", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.comments, {
        cursor: transport.data.cursor,
      });
    },
  };
}
