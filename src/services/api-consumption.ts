import { adminAcao } from "@/services/admin";

export type ApiUsageResumo = {
  period_days: number;
  period_started_at: string;
  total_cost_usd: number;
  total_cost_brl: number;
  attributed_cost_usd: number;
  attributed_cost_brl: number;
  attributed_apify_cost_usd: number;
  unattributed_cost_usd: number;
  unattributed_cost_brl: number;
  unattributed_requests: number;
  unattributed_items: number;
  total_requests: number;
  total_leads_crawled: number;
  top_users: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    plan: string;
    monthly_limit: number | null;
    leads_used: number;
    leads_generated_period: number;
    apify_leads_generated_period: number;
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
    usage_usd: number | null;
    limit_usd: number | null;
    remaining_usd: number | null;
    included_credits_usd: number | null;
    included_credits_remaining_usd: number | null;
    hard_limit_usd: number | null;
    hard_remaining_usd: number | null;
    synced_at: string;
    reconciled_runs: number;
    accounts: Array<{
      label: string;
      account_id: string;
      username: string;
      token_count: number;
      usage_usd: number | null;
      limit_usd: number | null;
      remaining_usd: number | null;
      included_credits_usd: number | null;
      included_credits_remaining_usd: number | null;
      hard_limit_usd: number | null;
      hard_remaining_usd: number | null;
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

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
        leads_generated_period: number(user.leads_generated_period),
        apify_leads_generated_period: number(user.apify_leads_generated_period),
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
        account_id: text(account.account_id, "conta-desconhecida"),
        username: text(account.username, "Conta Apify"),
        token_count: number(account.token_count),
        usage_usd: optionalNumber(account.usage_usd),
        limit_usd: optionalNumber(account.limit_usd),
        remaining_usd: optionalNumber(account.remaining_usd),
        included_credits_usd: optionalNumber(account.included_credits_usd),
        included_credits_remaining_usd: optionalNumber(account.included_credits_remaining_usd),
        hard_limit_usd: optionalNumber(account.hard_limit_usd),
        hard_remaining_usd: optionalNumber(account.hard_remaining_usd),
      }))
    : [];

  return {
    period_days: number(result.period_days),
    period_started_at: text(result.period_started_at, new Date(0).toISOString()),
    total_cost_usd: number(result.total_cost_usd),
    total_cost_brl: number(result.total_cost_brl),
    attributed_cost_usd: number(result.attributed_cost_usd),
    attributed_cost_brl: number(result.attributed_cost_brl),
    attributed_apify_cost_usd: number(result.attributed_apify_cost_usd),
    unattributed_cost_usd: number(result.unattributed_cost_usd),
    unattributed_cost_brl: number(result.unattributed_cost_brl),
    unattributed_requests: number(result.unattributed_requests),
    unattributed_items: number(result.unattributed_items),
    total_requests: number(result.total_requests),
    total_leads_crawled: number(result.total_leads_crawled),
    top_users: topUsers,
    service_breakdown: serviceBreakdown,
    apify_account: {
      usage_usd: optionalNumber(apify.usage_usd),
      limit_usd: optionalNumber(apify.limit_usd),
      remaining_usd: optionalNumber(apify.remaining_usd),
      included_credits_usd: optionalNumber(apify.included_credits_usd),
      included_credits_remaining_usd: optionalNumber(apify.included_credits_remaining_usd),
      hard_limit_usd: optionalNumber(apify.hard_limit_usd),
      hard_remaining_usd: optionalNumber(apify.hard_remaining_usd),
      synced_at: text(apify.synced_at, new Date(0).toISOString()),
      reconciled_runs: number(apify.reconciled_runs),
      accounts,
      sync_error: typeof apify.sync_error === "string" ? apify.sync_error : null,
    },
  };
}
