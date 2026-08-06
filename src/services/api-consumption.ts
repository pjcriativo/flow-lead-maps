import { adminAcao } from "@/services/admin";

export type ApiUsageResumo = {
  total_cost_usd: number;
  total_cost_brl: number;
  attributed_cost_usd: number;
  attributed_cost_brl: number;
  attributed_apify_cost_usd: number;
  total_requests: number;
  total_leads_crawled: number;
  top_users: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    plan: string;
    monthly_limit: number | null;
    leads_used: number;
    total_cost_usd: number;
    total_cost_brl: number;
    requests_count: number;
    items_charged: number;
  }>;
  service_breakdown: Array<{
    service: string;
    requests_count: number;
    cost_usd: number;
    cost_brl: number;
  }>;
  apify_account: {
    usage_usd: number;
    limit_usd: number;
    remaining_usd: number;
    synced_at: string;
    accounts: Array<{
      label: string;
      usage_usd: number;
      limit_usd: number;
      remaining_usd: number;
    }>;
    sync_error: string | null;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function obterResumoConsumoApi(dias: number = 30): Promise<ApiUsageResumo> {
  const result = await adminAcao("api_consumo_resumo", { dias });
  if (!result.ok) throw new Error(result.detalhe ?? result.reason ?? "Falha ao carregar consumo");

  const topUsers = Array.isArray(result.top_users)
    ? result.top_users.filter(isRecord).map((user) => ({
        user_id: text(user.user_id, "sem-usuario"),
        user_name: text(user.user_name, "Usuário sem nome"),
        user_email: text(user.user_email, "E-mail não encontrado"),
        plan: text(user.plan, "Sem plano"),
        monthly_limit: user.monthly_limit === null ? null : number(user.monthly_limit),
        leads_used: number(user.leads_used),
        total_cost_usd: number(user.total_cost_usd),
        total_cost_brl: number(user.total_cost_brl),
        requests_count: number(user.requests_count),
        items_charged: number(user.items_charged),
      }))
    : [];

  const serviceBreakdown = Array.isArray(result.service_breakdown)
    ? result.service_breakdown.filter(isRecord).map((service) => ({
        service: text(service.service, "unknown"),
        requests_count: number(service.requests_count),
        cost_usd: number(service.cost_usd),
        cost_brl: number(service.cost_brl),
      }))
    : [];

  const apify = isRecord(result.apify_account) ? result.apify_account : {};
  const accounts = Array.isArray(apify.accounts)
    ? apify.accounts.filter(isRecord).map((account) => ({
        label: text(account.label, "Conta Apify"),
        usage_usd: number(account.usage_usd),
        limit_usd: number(account.limit_usd),
        remaining_usd: number(account.remaining_usd),
      }))
    : [];

  return {
    total_cost_usd: number(result.total_cost_usd),
    total_cost_brl: number(result.total_cost_brl),
    attributed_cost_usd: number(result.attributed_cost_usd),
    attributed_cost_brl: number(result.attributed_cost_brl),
    attributed_apify_cost_usd: number(result.attributed_apify_cost_usd),
    total_requests: number(result.total_requests),
    total_leads_crawled: number(result.total_leads_crawled),
    top_users: topUsers,
    service_breakdown: serviceBreakdown,
    apify_account: {
      usage_usd: number(apify.usage_usd),
      limit_usd: number(apify.limit_usd),
      remaining_usd: number(apify.remaining_usd),
      synced_at: text(apify.synced_at, new Date(0).toISOString()),
      accounts,
      sync_error: typeof apify.sync_error === "string" ? apify.sync_error : null,
    },
  };
}
