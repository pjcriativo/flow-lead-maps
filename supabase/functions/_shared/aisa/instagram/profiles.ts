import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import {
  instagramProfileResponseSchema,
  instagramSearchProfilesResponseSchema,
} from "../schemas.ts";
import { nestedRecord, normalizeAisaRecords } from "./normalize.ts";

export function createAisaProfileOperations(
  client: AisaClient,
): Pick<InstagramDataProvider, "getProfile" | "searchProfiles"> {
  return {
    async getProfile(input) {
      const transport = await client.get(
        "/instagram/profile",
        { handle: input.handle, trim: input.trim },
        instagramProfileResponseSchema,
        { capability: "instagram.getProfile", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, [nestedRecord(transport.data.data, "user")]);
    },
    async searchProfiles(input) {
      const transport = await client.get(
        "/instagram/search/profiles",
        { query: input.query, cursor: input.cursor },
        instagramSearchProfilesResponseSchema,
        { capability: "instagram.searchProfiles", queryId: input.queryId },
      );
      return normalizeAisaRecords(transport, transport.data.profiles, {
        cursor: transport.data.cursor,
      });
    },
  };
}
