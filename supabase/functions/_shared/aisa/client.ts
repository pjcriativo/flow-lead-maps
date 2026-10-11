import type { z, ZodTypeAny } from "zod";

import { AisaError, classifyAisaHttpError } from "./errors.ts";
import { AisaRateLimiter } from "./rate-limiter.ts";
import { aisaErrorResponseSchema } from "./schemas.ts";
import { parseAisaCost } from "./usage-tracker.ts";
import type {
  AisaLogger,
  AisaRequestContext,
  AisaTransportResult,
  AisaUsageTracker,
} from "./types.ts";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type TimeoutHandle = ReturnType<typeof setTimeout> | number;

export interface AisaClientOptions {
  apiKey: string | null;
  enabled: boolean;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetch?: FetchLike;
  rateLimiter?: AisaRateLimiter;
  usageTracker?: AisaUsageTracker;
  logger?: AisaLogger;
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  now?: () => Date;
  scheduleTimeout?: (handler: () => void, milliseconds: number) => TimeoutHandle;
  cancelTimeout?: (handle: TimeoutHandle) => void;
}

interface ParsedError {
  requestId: string | null;
  retryable: boolean;
}

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function queryToStrings(
  query: Readonly<Record<string, string | number | boolean | undefined>>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) normalized[key] = String(value);
  }
  return normalized;
}

function parseBody(text: string): unknown {
  if (!text.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

function readError(body: unknown): ParsedError {
  const parsed = aisaErrorResponseSchema.safeParse(body);
  if (!parsed.success) return { requestId: null, retryable: false };
  const nested = typeof parsed.data.error === "object" ? parsed.data.error : undefined;
  return {
    requestId: parsed.data.request_id ?? nested?.request_id ?? null,
    retryable: nested?.retryable ?? false,
  };
}

function requestIdFrom(response: Response, body: unknown): string | null {
  return response.headers.get("x-request-id")?.trim() || readError(body).requestId;
}

function retryDelayMs(response: Response | null, attempt: number, random: () => number): number {
  const retryAfter = response?.headers.get("retry-after")?.trim();
  if (retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter)) {
    return Math.max(0, Math.ceil(Number(retryAfter) * 1_000));
  }
  if (retryAfter) {
    const at = Date.parse(retryAfter);
    if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  }
  const base = Math.min(30_000, 500 * 2 ** attempt);
  return Math.round(base * (0.75 + random() * 0.5));
}

export class AisaClient {
  private readonly apiKey: string | null;
  private readonly enabled: boolean;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetcher: FetchLike;
  private readonly limiter: AisaRateLimiter;
  private readonly usageTracker?: AisaUsageTracker;
  private readonly logger?: AisaLogger;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly random: () => number;
  private readonly now: () => Date;
  private readonly scheduleTimeout: (handler: () => void, milliseconds: number) => TimeoutHandle;
  private readonly cancelTimeout: (handle: TimeoutHandle) => void;

  constructor(options: AisaClientOptions) {
    this.apiKey = options.apiKey?.trim() || null;
    this.enabled = options.enabled;
    this.baseUrl = (options.baseUrl ?? "https://api.aisa.one/apis/v1").replace(/\/+$/, "");
    this.timeoutMs = Math.max(1, options.timeoutMs ?? 20_000);
    this.maxRetries = Math.max(0, Math.min(3, Math.floor(options.maxRetries ?? 2)));
    this.fetcher = options.fetch ?? fetch;
    this.limiter = options.rateLimiter ?? new AisaRateLimiter();
    this.usageTracker = options.usageTracker;
    this.logger = options.logger;
    this.sleep = options.sleep ?? defaultSleep;
    this.random = options.random ?? Math.random;
    this.now = options.now ?? (() => new Date());
    this.scheduleTimeout = options.scheduleTimeout ?? setTimeout;
    this.cancelTimeout = options.cancelTimeout ?? clearTimeout;
  }

  async get<TSchema extends ZodTypeAny>(
    endpoint: string,
    query: Readonly<Record<string, string | number | boolean | undefined>>,
    schema: TSchema,
    context: AisaRequestContext,
  ): Promise<AisaTransportResult<z.output<TSchema>>> {
    if (!this.enabled) {
      throw new AisaError("AISA provider is disabled.", { code: "provider_disabled" });
    }
    if (!this.apiKey) {
      throw new AisaError("AISA provider is unavailable because its API key is missing.", {
        code: "missing_api_key",
      });
    }

    const normalizedQuery = queryToStrings(query);
    const queryId = context.queryId?.trim() || crypto.randomUUID();
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(normalizedQuery)) url.searchParams.set(key, value);

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      let timedOut = false;
      const timeout = this.scheduleTimeout(() => {
        timedOut = true;
        controller.abort();
      }, this.timeoutMs);

      let response: Response;
      let body: unknown;
      try {
        response = await this.limiter.run(
          () =>
            this.fetcher(url, {
              method: "GET",
              headers: { Accept: "application/json", Authorization: `Bearer ${this.apiKey}` },
              signal: controller.signal,
            }),
          controller.signal,
        );
        body = parseBody(await response.text());
      } catch (error) {
        this.cancelTimeout(timeout);
        if (timedOut || (error instanceof DOMException && error.name === "AbortError")) {
          throw new AisaError("AISA request timed out.", {
            code: "timeout",
            retryable: false,
            cause: error,
          });
        }
        if (error instanceof TypeError && attempt < this.maxRetries) {
          this.logger?.({
            level: "info",
            event: "request_retry",
            capability: context.capability,
            endpoint,
            queryId,
            requestId: null,
            attempt: attempt + 1,
          });
          await this.sleep(retryDelayMs(null, attempt, this.random));
          continue;
        }
        throw new AisaError("AISA network request failed.", {
          code: "network",
          retryable: false,
          cause: error,
        });
      } finally {
        this.cancelTimeout(timeout);
      }

      const requestId = requestIdFrom(response, body);
      const cost = parseAisaCost(response.headers);
      const occurredAt = this.now().toISOString();
      if (this.usageTracker) {
        try {
          await this.usageTracker.record({
            capability: context.capability,
            endpoint,
            queryId,
            requestId,
            attempt: attempt + 1,
            httpStatus: response.status,
            cost,
            occurredAt,
          });
        } catch {
          this.logger?.({
            level: "error",
            event: "usage_tracking_failed",
            capability: context.capability,
            endpoint,
            queryId,
            requestId,
            attempt: attempt + 1,
            httpStatus: response.status,
            errorCode: "usage_tracking_failed",
          });
        }
      }

      if (!response.ok) {
        const parsedError = readError(body);
        const retryable =
          response.status === 429 ||
          ([502, 503, 504].includes(response.status) && parsedError.retryable);
        const providerReportedCost = cost.status === "settled";
        if (retryable && !providerReportedCost && attempt < this.maxRetries) {
          this.logger?.({
            level: "info",
            event: "request_retry",
            capability: context.capability,
            endpoint,
            queryId,
            requestId,
            attempt: attempt + 1,
            httpStatus: response.status,
          });
          await this.sleep(retryDelayMs(response, attempt, this.random));
          continue;
        }
        const code = classifyAisaHttpError(response.status);
        this.logger?.({
          level: "error",
          event: "request_failed",
          capability: context.capability,
          endpoint,
          queryId,
          requestId,
          attempt: attempt + 1,
          httpStatus: response.status,
          errorCode: code,
        });
        throw new AisaError(`AISA request failed with HTTP ${response.status}.`, {
          code,
          status: response.status,
          requestId,
          retryable,
        });
      }

      const validated = schema.safeParse(body);
      if (!validated.success) {
        throw new AisaError("AISA returned a response outside the documented contract.", {
          code: "invalid_response",
          status: response.status,
          requestId,
          cause: validated.error,
        });
      }
      this.logger?.({
        level: "info",
        event: "request_complete",
        capability: context.capability,
        endpoint,
        queryId,
        requestId,
        attempt: attempt + 1,
        httpStatus: response.status,
      });
      return {
        data: validated.data,
        endpoint,
        query: normalizedQuery,
        queryId,
        requestId,
        receivedAt: occurredAt,
        cost,
      };
    }

    throw new AisaError("AISA request exhausted its retry policy.", {
      code: "network",
      retryable: false,
    });
  }
}
