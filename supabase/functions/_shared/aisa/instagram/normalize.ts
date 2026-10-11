import type {
  SocialPagination,
  SocialProviderResult,
  SocialRecord,
} from "../../social-data-contracts.ts";
import type { AisaTransportResult } from "../types.ts";

function recordValue(record: Readonly<Record<string, unknown>>, key: string): unknown {
  return record[key];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function nestedUsername(record: Readonly<Record<string, unknown>>): string | null {
  const direct = stringValue(recordValue(record, "username"));
  if (direct) return direct;
  for (const key of ["owner", "user"]) {
    const nested = recordValue(record, key);
    if (isRecord(nested)) {
      const username = stringValue(nested.username);
      if (username) return username;
    }
  }
  return null;
}

function recordId(
  record: Readonly<Record<string, unknown>>,
  queryId: string,
  index: number,
): string {
  for (const key of ["id", "pk", "pk_id", "shortcode", "code", "url"]) {
    const value = stringValue(recordValue(record, key));
    if (value) return value;
  }
  const username = nestedUsername(record);
  return username ?? `${queryId}:${index}`;
}

export function normalizeAisaRecords<T>(
  transport: AisaTransportResult<T>,
  records: ReadonlyArray<Readonly<Record<string, unknown>>>,
  pagination: SocialPagination = {},
): SocialProviderResult {
  const items: SocialRecord[] = records.map((record, index) => ({
    id: recordId(record, transport.queryId, index),
    provider: "aisa",
    network: "instagram",
    username: nestedUsername(record),
    data: record,
    evidence: {
      endpoint: transport.endpoint,
      query: transport.query,
      requestId: transport.requestId,
      receivedAt: transport.receivedAt,
    },
    timestamp: transport.receivedAt,
    queryId: transport.queryId,
  }));
  return {
    items,
    pagination,
    requestId: transport.requestId,
    queryId: transport.queryId,
    receivedAt: transport.receivedAt,
    cost: transport.cost,
  };
}

export function nestedRecord(
  value: Readonly<Record<string, unknown>>,
  key: string,
): Readonly<Record<string, unknown>> {
  const nested = value[key];
  return isRecord(nested) ? nested : value;
}
