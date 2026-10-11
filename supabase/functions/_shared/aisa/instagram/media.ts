import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import { instagramTranscriptResponseSchema } from "../schemas.ts";
import { normalizeAisaRecords } from "./normalize.ts";

export function createAisaMediaOperations(
  client: AisaClient,
): Pick<InstagramDataProvider, "transcribeMedia"> {
  return {
    async transcribeMedia(input) {
      const transport = await client.get(
        "/instagram/media/transcript",
        { url: input.url },
        instagramTranscriptResponseSchema,
        { capability: "instagram.transcribeMedia", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.transcripts);
    },
  };
}
