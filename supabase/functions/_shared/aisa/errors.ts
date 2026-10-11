export type AisaErrorCode =
  | "provider_disabled"
  | "missing_api_key"
  | "authentication"
  | "invalid_request"
  | "budget"
  | "conflict"
  | "rate_limited"
  | "upstream_unavailable"
  | "timeout"
  | "network"
  | "invalid_response"
  | "http_error";

export class AisaError extends Error {
  readonly code: AisaErrorCode;
  readonly status: number | null;
  readonly requestId: string | null;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      code: AisaErrorCode;
      status?: number | null;
      requestId?: string | null;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AisaError";
    this.code = options.code;
    this.status = options.status ?? null;
    this.requestId = options.requestId ?? null;
    this.retryable = options.retryable ?? false;
  }
}

export function classifyAisaHttpError(status: number): AisaErrorCode {
  if (status === 401 || status === 403) return "authentication";
  if (status === 400 || status === 404 || status === 422) return "invalid_request";
  if (status === 402) return "budget";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status === 502 || status === 503 || status === 504) return "upstream_unavailable";
  return "http_error";
}
