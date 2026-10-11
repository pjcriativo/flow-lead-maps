import { z } from "zod";

const externalRecordSchema = z.record(z.unknown());
const successfulResponse = {
  success: z.literal(true),
  credits_remaining: z.number().int().nonnegative().optional(),
};

export const instagramProfileResponseSchema = z
  .object({ ...successfulResponse, data: externalRecordSchema })
  .passthrough();

export const instagramUserPostsResponseSchema = z
  .object({
    ...successfulResponse,
    items: z.array(externalRecordSchema),
    next_max_id: z.string().nullable().optional(),
    max_id: z.string().nullable().optional(),
    more_available: z.boolean().optional(),
  })
  .passthrough();

export const instagramPostCommentsResponseSchema = z
  .object({
    ...successfulResponse,
    comments: z.array(externalRecordSchema),
    cursor: z.string().nullable().optional(),
  })
  .passthrough();

export const instagramSearchProfilesResponseSchema = z
  .object({
    ...successfulResponse,
    query: z.string(),
    profiles: z.array(
      z
        .object({
          id: z.union([z.string(), z.number()]).optional(),
          username: z.string().min(1),
          full_name: z.string().nullable().optional(),
          biography: z.string().nullable().optional(),
          bio_links: z.array(externalRecordSchema).optional(),
          external_url: z.string().nullable().optional(),
          is_private: z.boolean().optional(),
          is_verified: z.boolean().optional(),
          is_business_account: z.boolean().optional(),
          is_professional_account: z.boolean().optional(),
          category_name: z.string().nullable().optional(),
          profile_pic_url: z.string().nullable().optional(),
          follower_count: z.number().nonnegative().optional(),
          following_count: z.number().nonnegative().optional(),
          media_count: z.number().nonnegative().optional(),
          url: z.string().nullable().optional(),
          matched_from: z.string().optional(),
          google_title: z.string().nullable().optional(),
          google_description: z.string().nullable().optional(),
        })
        .passthrough(),
    ),
    cursor: z.string().nullable().optional(),
  })
  .passthrough();

export const instagramSearchHashtagResponseSchema = z
  .object({
    ...successfulResponse,
    hashtag: z.string(),
    media_type: z.string().optional(),
    posts: z.array(externalRecordSchema),
    cursor: z.string().nullable().optional(),
  })
  .passthrough();

export const instagramReelsResponseSchema = z
  .object({
    ...successfulResponse,
    reels: z.array(externalRecordSchema),
    next_page: z.union([z.string(), z.number()]).nullable().optional(),
  })
  .passthrough();

const topLevelTrendingReelsSchema = z
  .object({
    ...successfulResponse,
    reels: z.array(externalRecordSchema),
    cursor: z.string().nullable().optional(),
  })
  .transform((response) => ({
    success: response.success,
    credits_remaining: response.credits_remaining,
    reels: response.reels,
    cursor: response.cursor,
  }));

const nestedTrendingReelsSchema = z
  .object({
    ...successfulResponse,
    data: z.object({
      reels: z.array(externalRecordSchema),
      cursor: z.string().nullable().optional(),
    }),
    cursor: z.string().nullable().optional(),
  })
  .transform((response) => ({
    success: response.success,
    credits_remaining: response.credits_remaining,
    reels: response.data.reels,
    cursor: response.cursor ?? response.data.cursor,
  }));

export const instagramTrendingReelsResponseSchema = z.union([
  topLevelTrendingReelsSchema,
  nestedTrendingReelsSchema,
]);

export const instagramTranscriptResponseSchema = z
  .object({
    ...successfulResponse,
    transcripts: z.array(
      z
        .object({
          id: z.union([z.string(), z.number()]),
          shortcode: z.string(),
          text: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export const aisaErrorResponseSchema = z
  .object({
    code: z.string().optional(),
    request_id: z.string().optional(),
    error: z
      .union([
        z.string(),
        z
          .object({
            code: z.string().optional(),
            message: z.string().optional(),
            request_id: z.string().optional(),
            retryable: z.boolean().optional(),
          })
          .passthrough(),
      ])
      .optional(),
    message: z.string().optional(),
  })
  .passthrough();
