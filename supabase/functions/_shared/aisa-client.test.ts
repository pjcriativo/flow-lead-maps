// Suite: infraestrutura compartilhada AISA
// Invariant: chamadas AISA autenticam, validam, limitam e contabilizam sem vazar credenciais.
// Boundary IN: cliente HTTP, flags, schemas, normalizadores e limitador em _shared/aisa.
// Boundary OUT: rede AISA real, Supabase e fluxos comerciais existentes.
import assert from "node:assert/strict";
import test from "node:test";

import { AisaClient } from "./aisa/client.ts";
import { readAisaFeatureFlags, resolveAisaAvailability } from "./aisa/config.ts";
import { AisaError } from "./aisa/errors.ts";
import { createAisaInstagramProvider } from "./aisa/instagram/index.ts";
import { AisaRateLimiter } from "./aisa/rate-limiter.ts";
import { instagramProfileResponseSchema } from "./aisa/schemas.ts";
import { createSupabaseAisaUsageTracker, parseAisaCost } from "./aisa/usage-tracker.ts";
import type { AisaLogEvent, AisaUsageEvent } from "./aisa/types.ts";

const API_KEY = "secret-aisa-key";

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

test("flags AISA ficam desligadas por padrão e chave ausente mantém o provedor indisponível", () => {
  const flags = readAisaFeatureFlags(() => undefined);
  assert.deepEqual(flags, { instagram: false, linkedin: false });
  assert.deepEqual(resolveAisaAvailability({ flags, apiKey: null }), {
    instagram: { enabled: false, available: false, reason: "feature_disabled" },
    linkedin: { enabled: false, available: false, reason: "feature_disabled" },
  });

  const enabled = readAisaFeatureFlags((name) =>
    name === "AISA_INSTAGRAM_ENABLED" ? "true" : undefined,
  );
  assert.deepEqual(enabled, { instagram: true, linkedin: false });
  assert.equal(
    resolveAisaAvailability({ flags: enabled, apiKey: null }).instagram.reason,
    "missing_api_key",
  );

  const linkedinEnabled = readAisaFeatureFlags((name) =>
    name === "AISA_LINKEDIN_ENABLED" ? "true" : undefined,
  );
  assert.deepEqual(resolveAisaAvailability({ flags: linkedinEnabled, apiKey: "secret" }).linkedin, {
    enabled: true,
    available: false,
    reason: "integration_not_implemented",
  });
});

test("chave ausente falha antes da rede e sem afetar qualquer outro provedor", async () => {
  let calls = 0;
  const client = new AisaClient({
    apiKey: null,
    enabled: true,
    fetch: async () => {
      calls += 1;
      return jsonResponse({ success: true, data: {} });
    },
  });

  await assert.rejects(
    () =>
      client.get("/instagram/profile", { handle: "flow" }, instagramProfileResponseSchema, {
        capability: "instagram.getProfile",
        queryId: "missing-key",
      }),
    (error: unknown) => error instanceof AisaError && error.code === "missing_api_key",
  );
  assert.equal(calls, 0);
});

test("cliente envia Bearer, preserva request ID e custo exato sem registrar a chave", async () => {
  const logs: AisaLogEvent[] = [];
  const usage: AisaUsageEvent[] = [];
  let requestedUrl = "";
  let authorization = "";

  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    fetch: async (input, init) => {
      requestedUrl = String(input);
      authorization = new Headers(init?.headers).get("authorization") ?? "";
      return jsonResponse(
        { success: true, credits_remaining: 99, data: { user: { id: "42", username: "flow" } } },
        {
          headers: {
            "x-request-id": "req-42",
            "x-aisa-customer-cost-micros-usd": "12345",
          },
        },
      );
    },
    logger: (event) => logs.push(event),
    usageTracker: { record: async (event) => void usage.push(event) },
  });

  const response = await client.get(
    "/instagram/profile",
    { handle: "flow", trim: true },
    instagramProfileResponseSchema,
    { capability: "instagram.getProfile", queryId: "query-42" },
  );

  assert.equal(authorization, `Bearer ${API_KEY}`);
  assert.match(requestedUrl, /\/apis\/v1\/instagram\/profile\?handle=flow&trim=true$/);
  assert.equal(response.requestId, "req-42");
  assert.deepEqual(response.cost, {
    status: "settled",
    customerCostMicrosUsd: "12345",
    costUsdExact: "0.012345",
  });
  assert.equal(usage[0]?.queryId, "query-42");
  assert.equal(JSON.stringify(logs).includes(API_KEY), false);
});

test("resposta fora do contrato falha na fronteira com erro de validação", async () => {
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    fetch: async () => jsonResponse({ success: true, data: "invalid" }),
  });

  await assert.rejects(
    () =>
      client.get("/instagram/profile", { handle: "flow" }, instagramProfileResponseSchema, {
        capability: "instagram.getProfile",
        queryId: "invalid-schema",
      }),
    (error: unknown) => error instanceof AisaError && error.code === "invalid_response",
  );
});

test("HTTP 429 respeita Retry-After antes da retentativa controlada", async () => {
  const waits: number[] = [];
  let calls = 0;
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    maxRetries: 1,
    sleep: async (milliseconds) => void waits.push(milliseconds),
    random: () => 0.5,
    fetch: async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse(
          { error: { code: "rate_limit_exceeded", retryable: true } },
          { status: 429, headers: { "retry-after": "2" } },
        );
      }
      return jsonResponse({ success: true, data: { user: { id: "42", username: "flow" } } });
    },
  });

  await client.get("/instagram/profile", { handle: "flow" }, instagramProfileResponseSchema, {
    capability: "instagram.getProfile",
    queryId: "retry-429",
  });

  assert.equal(calls, 2);
  assert.deepEqual(waits, [2_000]);
});

test("resposta retryable com custo liquidado não repete uma possível chamada paga", async () => {
  let calls = 0;
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    maxRetries: 2,
    sleep: async () => undefined,
    fetch: async () => {
      calls += 1;
      return jsonResponse(
        { error: { code: "upstream_unavailable", retryable: true } },
        {
          status: 503,
          headers: { "x-aisa-customer-cost-micros-usd": "12000" },
        },
      );
    },
  });

  await assert.rejects(
    () =>
      client.get("/instagram/profile", { handle: "flow" }, instagramProfileResponseSchema, {
        capability: "instagram.getProfile",
        queryId: "paid-ambiguous",
      }),
    (error: unknown) => error instanceof AisaError && error.code === "upstream_unavailable",
  );
  assert.equal(calls, 1);
});

test("timeout aborta a chamada e não repete uma execução de custo ambíguo", async () => {
  let calls = 0;
  let triggerTimeout: (() => void) | undefined;
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    timeoutMs: 10,
    maxRetries: 2,
    scheduleTimeout: (handler) => {
      triggerTimeout = handler;
      return 1;
    },
    cancelTimeout: () => undefined,
    fetch: async (_input, init) => {
      calls += 1;
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    },
  });

  const request = client.get(
    "/instagram/profile",
    { handle: "flow" },
    instagramProfileResponseSchema,
    { capability: "instagram.getProfile", queryId: "timeout" },
  );
  await new Promise<void>((resolve) => setImmediate(resolve));
  triggerTimeout?.();

  await assert.rejects(
    request,
    (error: unknown) => error instanceof AisaError && error.code === "timeout",
  );
  assert.equal(calls, 1);
});

test("erro de autenticação não é repetido e nunca inclui a chave", async () => {
  let calls = 0;
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    maxRetries: 2,
    fetch: async () => {
      calls += 1;
      return jsonResponse(
        { code: "invalid_api_key", error: "AISA API key is invalid", request_id: "auth-1" },
        { status: 401 },
      );
    },
  });

  await assert.rejects(
    () =>
      client.get("/instagram/profile", { handle: "flow" }, instagramProfileResponseSchema, {
        capability: "instagram.getProfile",
        queryId: "auth",
      }),
    (error: unknown) =>
      error instanceof AisaError &&
      error.code === "authentication" &&
      error.requestId === "auth-1" &&
      !error.message.includes(API_KEY),
  );
  assert.equal(calls, 1);
});

test("falha de rede anterior à resposta usa retentativa limitada", async () => {
  let calls = 0;
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    maxRetries: 1,
    sleep: async () => undefined,
    fetch: async () => {
      calls += 1;
      if (calls === 1) throw new TypeError("network unavailable");
      return jsonResponse({ success: true, data: { user: { id: "42", username: "flow" } } });
    },
  });

  await client.get("/instagram/profile", { handle: "flow" }, instagramProfileResponseSchema, {
    capability: "instagram.getProfile",
    queryId: "network-retry",
  });
  assert.equal(calls, 2);
});

test("limitador nunca ultrapassa a concorrência configurada", async () => {
  const limiter = new AisaRateLimiter({ maxConcurrent: 2, requestsPerMinute: 60_000 });
  let active = 0;
  let peak = 0;
  const releases: Array<() => void> = [];

  const tasks = Array.from({ length: 4 }, () =>
    limiter.run(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      active -= 1;
    }),
  );

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(active, 2);
  releases.splice(0).forEach((release) => release());
  await new Promise<void>((resolve) => setImmediate(resolve));
  releases.splice(0).forEach((release) => release());
  await Promise.all(tasks);
  assert.equal(peak, 2);
});

test("adaptador Instagram normaliza identidade, evidência, paginação e origem", async () => {
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    fetch: async () =>
      jsonResponse(
        {
          success: true,
          query: "fitness",
          profiles: [{ id: "188", username: "coach", follower_count: 500 }],
          cursor: "2",
        },
        { headers: { "x-request-id": "profiles-1" } },
      ),
  });
  const provider = createAisaInstagramProvider(client);

  const result = await provider.searchProfiles({ query: "fitness", queryId: "search-1" });

  assert.equal(result.items[0]?.id, "188");
  assert.equal(result.items[0]?.username, "coach");
  assert.equal(result.items[0]?.provider, "aisa");
  assert.equal(result.items[0]?.network, "instagram");
  assert.equal(result.items[0]?.queryId, "search-1");
  assert.equal(result.items[0]?.evidence.requestId, "profiles-1");
  assert.deepEqual(result.pagination, { cursor: "2" });
});

test("trending reels aceita o envelope data documentado e normaliza o cursor", async () => {
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    fetch: async () =>
      jsonResponse({
        success: true,
        data: { reels: [{ shortcode: "REEL-1", user: { username: "creator" } }] },
        cursor: "next",
      }),
  });
  const provider = createAisaInstagramProvider(client);

  const result = await provider.getTrendingReels({ queryId: "trending-1" });

  assert.equal(result.items[0]?.id, "REEL-1");
  assert.equal(result.items[0]?.username, "creator");
  assert.deepEqual(result.pagination, { cursor: "next" });
});

test("as oito capacidades Instagram usam apenas os endpoints e parâmetros documentados", async () => {
  const requested: URL[] = [];
  const client = new AisaClient({
    apiKey: API_KEY,
    enabled: true,
    fetch: async (input) => {
      const url = new URL(String(input));
      requested.push(url);
      switch (url.pathname) {
        case "/apis/v1/instagram/profile":
          return jsonResponse({ success: true, data: { user: { id: "profile-1" } } });
        case "/apis/v1/instagram/user/posts":
          return jsonResponse({ success: true, items: [{ id: "post-1" }], next_max_id: "post-2" });
        case "/apis/v1/instagram/post/comments":
          return jsonResponse({
            success: true,
            comments: [{ id: "comment-1" }],
            cursor: "comment-2",
          });
        case "/apis/v1/instagram/search/profiles":
          return jsonResponse({
            success: true,
            query: "fitness",
            profiles: [{ id: "profile-2", username: "fitness_profile" }],
            cursor: null,
          });
        case "/apis/v1/instagram/search/hashtag":
          return jsonResponse({
            success: true,
            hashtag: "fitness",
            posts: [{ id: "hashtag-1" }],
            cursor: "3",
          });
        case "/apis/v1/instagram/reels/search":
          return jsonResponse({ success: true, reels: [{ id: "reel-1" }], next_page: 4 });
        case "/apis/v1/instagram/reels/trending":
          return jsonResponse({ success: true, reels: [{ id: "trend-1" }], cursor: null });
        case "/apis/v1/instagram/media/transcript":
          return jsonResponse({
            success: true,
            transcripts: [{ id: "media-1", shortcode: "ABC", text: "Olá" }],
          });
        default:
          return jsonResponse({ error: "unexpected endpoint" }, { status: 404 });
      }
    },
  });
  const provider = createAisaInstagramProvider(client);

  const results = [
    await provider.getProfile({ handle: "flow", trim: true, queryId: "q1" }),
    await provider.getUserPosts({ handle: "flow", nextMaxId: "post-0", trim: true, queryId: "q2" }),
    await provider.getPostComments({
      url: "https://instagram.com/p/ABC",
      cursor: "comment-0",
      queryId: "q3",
    }),
    await provider.searchProfiles({ query: "fitness", cursor: "1", queryId: "q4" }),
    await provider.searchHashtag({
      hashtag: "fitness",
      datePosted: "last-week",
      mediaType: "reels",
      cursor: "2",
      queryId: "q5",
    }),
    await provider.searchReels({
      query: "fitness",
      datePosted: "last-month",
      page: 3,
      queryId: "q6",
    }),
    await provider.getTrendingReels({ queryId: "q7" }),
    await provider.transcribeMedia({ url: "https://instagram.com/reel/ABC", queryId: "q8" }),
  ];

  assert.deepEqual(
    requested.map((url) => url.pathname),
    [
      "/apis/v1/instagram/profile",
      "/apis/v1/instagram/user/posts",
      "/apis/v1/instagram/post/comments",
      "/apis/v1/instagram/search/profiles",
      "/apis/v1/instagram/search/hashtag",
      "/apis/v1/instagram/reels/search",
      "/apis/v1/instagram/reels/trending",
      "/apis/v1/instagram/media/transcript",
    ],
  );
  assert.equal(requested[0]?.searchParams.get("trim"), "true");
  assert.equal(requested[1]?.searchParams.get("next_max_id"), "post-0");
  assert.equal(requested[2]?.searchParams.get("cursor"), "comment-0");
  assert.equal(requested[4]?.searchParams.get("date_posted"), "last-week");
  assert.equal(requested[4]?.searchParams.get("media_type"), "reels");
  assert.equal(requested[5]?.searchParams.get("page"), "3");
  assert.equal(requested[6]?.search, "");
  assert.deepEqual(
    results.map((result) => result.items[0]?.id),
    ["profile-1", "post-1", "comment-1", "profile-2", "hashtag-1", "reel-1", "trend-1", "media-1"],
  );
});

test("custo ausente permanece desconhecido e inteiro inválido nunca vira cobrança zero", () => {
  assert.deepEqual(parseAisaCost(new Headers()), {
    status: "unknown",
    customerCostMicrosUsd: null,
    costUsdExact: null,
  });
  assert.deepEqual(parseAisaCost(new Headers({ "x-aisa-customer-cost-micros-usd": "12.5" })), {
    status: "unknown",
    customerCostMicrosUsd: null,
    costUsdExact: null,
  });
});

test("ledger Supabase preserva custo exato e torna cada tentativa idempotente", async () => {
  const writes: Array<Readonly<Record<string, unknown>>> = [];
  const tracker = createSupabaseAisaUsageTracker({
    orgId: "org-1",
    userId: "user-1",
    admin: {
      from(table) {
        assert.equal(table, "api_consumption_logs");
        return {
          async upsert(values, options) {
            assert.deepEqual(options, { onConflict: "service,external_id" });
            writes.push(values);
            return { error: null };
          },
        };
      },
    },
  });

  await tracker.record({
    capability: "instagram.getProfile",
    endpoint: "/instagram/profile",
    queryId: "query-cost",
    requestId: "request-cost",
    attempt: 2,
    httpStatus: 200,
    occurredAt: "2026-10-11T12:00:00.000Z",
    cost: {
      status: "settled",
      customerCostMicrosUsd: "12345",
      costUsdExact: "0.012345",
    },
  });

  assert.equal(writes[0]?.service, "aisa_instagram");
  assert.equal(writes[0]?.external_id, "query-cost:2");
  assert.equal(writes[0]?.cost_usd, "0.012345");
  assert.equal(JSON.stringify(writes).includes(API_KEY), false);
});
