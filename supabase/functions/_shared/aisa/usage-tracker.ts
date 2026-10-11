import type { SocialCost } from "../social-data-contracts.ts";
import type { AisaUsageEvent, AisaUsageTracker } from "./types.ts";

const MAX_MICROS_USD = 9_223_372_036_854_775_807n;

export function parseAisaCost(headers: Headers): SocialCost {
  const raw = headers.get("x-aisa-customer-cost-micros-usd")?.trim();
  if (!raw || !/^\d+$/.test(raw)) {
    return { status: "unknown", customerCostMicrosUsd: null, costUsdExact: null };
  }
  const micros = BigInt(raw);
  if (micros > MAX_MICROS_USD) {
    return { status: "unknown", customerCostMicrosUsd: null, costUsdExact: null };
  }
  const normalized = micros.toString();
  const dollars = micros / 1_000_000n;
  const fraction = (micros % 1_000_000n).toString().padStart(6, "0");
  return {
    status: "settled",
    customerCostMicrosUsd: normalized,
    costUsdExact: `${dollars}.${fraction}`,
  };
}

interface SupabaseUsageResult {
  error: { message: string } | null;
}

interface SupabaseUsageClient {
  from(table: string): {
    upsert(
      values: Readonly<Record<string, unknown>>,
      options: { onConflict: string },
    ): PromiseLike<SupabaseUsageResult>;
  };
}

export function createSupabaseAisaUsageTracker(params: {
  admin: SupabaseUsageClient;
  orgId: string;
  userId: string;
}): AisaUsageTracker {
  return {
    async record(event: AisaUsageEvent): Promise<void> {
      const network = event.capability.startsWith("instagram.") ? "instagram" : "linkedin";
      const { error } = await params.admin.from("api_consumption_logs").upsert(
        {
          org_id: params.orgId,
          user_id: params.userId,
          service: `aisa_${network}`,
          action: event.capability,
          external_id: `${event.queryId}:${event.attempt}`,
          quantity: 1,
          cost_usd: event.cost.costUsdExact,
          cost_brl: null,
          metadata: {
            source: "aisa_gateway",
            request_id: event.requestId,
            http_status: event.httpStatus,
            cost_status: event.cost.status,
            cost_source: "x_aisa_customer_cost_micros_usd",
            customer_cost_micros_usd: event.cost.customerCostMicrosUsd,
          },
        },
        { onConflict: "service,external_id" },
      );
      if (error) throw new Error(`Failed to persist AISA usage: ${error.message}`);
    },
  };
}
