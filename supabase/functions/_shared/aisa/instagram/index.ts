import type { InstagramDataProvider } from "../../social-data-contracts.ts";
import { AisaClient } from "../client.ts";
import { createAisaCommentOperations } from "./comments.ts";
import { createAisaHashtagOperations } from "./hashtags.ts";
import { createAisaMediaOperations } from "./media.ts";
import { createAisaPostOperations } from "./posts.ts";
import { createAisaProfileOperations } from "./profiles.ts";
import { createAisaReelOperations } from "./reels.ts";

export function createAisaInstagramProvider(client: AisaClient): InstagramDataProvider {
  return {
    ...createAisaProfileOperations(client),
    ...createAisaPostOperations(client),
    ...createAisaCommentOperations(client),
    ...createAisaHashtagOperations(client),
    ...createAisaReelOperations(client),
    ...createAisaMediaOperations(client),
  };
}
