export type ApiUsageProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_super_admin: boolean | null;
  plan?: string | null;
};

export type ApiUsageMembership = {
  user_id: string;
  org_id: string;
  criada_em?: string | null;
};

export type ApiUsageOrg = {
  id: string;
  nome: string | null;
  plano_id: string | null;
  dono_user_id: string | null;
};

export type ApiUsagePlan = {
  id: string;
  nome: string | null;
  limite_leads: number | null;
};

export type ApiUsageOrgConsumption = {
  org_id: string;
  leads: number | null;
};

export type ApiUsageUserLeadCount = {
  user_id: string;
  leads_period: number | null;
  leads_month: number | null;
  apify_leads_period: number | null;
};

export type ApiUsageLog = {
  user_id: string | null;
  org_id: string | null;
  service: string;
  action?: string | null;
  quantity: number | null;
  cost_usd: number | null;
  cost_brl: number | null;
};

export type ApiUsageUserSummary = {
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
};

export type ApiUsageServiceSummary = {
  service: string;
  requests_count: number;
  cost_usd: number;
  cost_brl: number;
};

type ApiUsagePeriodInput = {
  profiles: ApiUsageProfile[];
  memberships: ApiUsageMembership[];
  orgs: ApiUsageOrg[];
  plans: ApiUsagePlan[];
  orgConsumption: ApiUsageOrgConsumption[];
  userLeadCounts?: ApiUsageUserLeadCount[];
  logs: ApiUsageLog[];
};

type ApiUsagePeriodSummary = {
  users: ApiUsageUserSummary[];
  services: ApiUsageServiceSummary[];
  totalCostUsd: number;
  totalCostBrl: number;
  totalRequests: number;
  totalItemsCharged: number;
  attributedApifyCostUsd: number;
  unattributedCostUsd: number;
  unattributedCostBrl: number;
  unattributedRequests: number;
  unattributedItems: number;
  unattributedApifyCostUsd: number;
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Básico",
  basico: "Básico",
  pro: "Pro",
  agencia: "Agência",
  enterprise: "Agência",
};

function finiteNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function planLabel(profilePlan: string | null | undefined): string {
  if (!profilePlan) return "Sem plano";
  return PLAN_LABELS[profilePlan.toLowerCase()] ?? profilePlan;
}

export function buildApiUsagePeriodSummary({
  profiles,
  memberships,
  orgs,
  plans,
  orgConsumption,
  userLeadCounts = [],
  logs,
}: ApiUsagePeriodInput): ApiUsagePeriodSummary {
  const accountableLogs = logs.filter(
    (log) => !(log.service === "apify_maps" && log.action === "legacy_search_estimate_invalidated"),
  );
  const membershipsByUser = new Map<string, string>();
  for (const membership of memberships) {
    if (!membershipsByUser.has(membership.user_id)) {
      membershipsByUser.set(membership.user_id, membership.org_id);
    }
  }

  const orgsById = new Map(orgs.map((org) => [org.id, org]));
  const ownedOrgByUser = new Map(
    orgs
      .filter((org): org is ApiUsageOrg & { dono_user_id: string } => Boolean(org.dono_user_id))
      .map((org) => [org.dono_user_id, org.id]),
  );
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  const leadsByOrg = new Map(
    orgConsumption.map((consumption) => [consumption.org_id, finiteNumber(consumption.leads)]),
  );
  const leadCountsByUser = new Map(
    userLeadCounts.map((count) => [
      count.user_id,
      {
        period: finiteNumber(count.leads_period),
        month: finiteNumber(count.leads_month),
        apifyPeriod: finiteNumber(count.apify_leads_period),
      },
    ]),
  );

  const usersMap = new Map<string, ApiUsageUserSummary>();
  for (const profile of profiles) {
    const orgId = ownedOrgByUser.get(profile.id) ?? membershipsByUser.get(profile.id);
    const org = orgId ? orgsById.get(orgId) : undefined;
    const plan = org?.plano_id ? plansById.get(org.plano_id) : undefined;
    const isSuperAdmin = profile.is_super_admin === true;
    const leadCounts = leadCountsByUser.get(profile.id) ?? { period: 0, month: 0, apifyPeriod: 0 };
    usersMap.set(profile.id, {
      user_id: profile.id,
      user_name: profile.full_name?.trim() || org?.nome?.trim() || "Usuário sem nome",
      user_email: profile.email?.trim() || "E-mail não encontrado",
      plan: isSuperAdmin ? "Super admin" : plan?.nome?.trim() || planLabel(profile.plan),
      monthly_limit: isSuperAdmin ? null : finiteNumber(plan?.limite_leads),
      leads_used: Math.max(orgId ? (leadsByOrg.get(orgId) ?? 0) : 0, leadCounts.month),
      leads_generated_period: leadCounts.period,
      apify_leads_generated_period: leadCounts.apifyPeriod,
      total_cost_usd: 0,
      total_cost_brl: 0,
      requests_count: 0,
      items_charged: 0,
    });
  }

  const servicesMap = new Map<string, ApiUsageServiceSummary>();
  let totalCostUsd = 0;
  let totalCostBrl = 0;
  let totalItemsCharged = 0;
  let unattributedCostUsd = 0;
  let unattributedCostBrl = 0;
  let unattributedRequests = 0;
  let unattributedItems = 0;
  let unattributedApifyCostUsd = 0;

  for (const log of accountableLogs) {
    const costUsd = finiteNumber(log.cost_usd);
    const costBrl = finiteNumber(log.cost_brl);
    const quantity = finiteNumber(log.quantity);
    totalCostUsd += costUsd;
    totalCostBrl += costBrl;
    if (log.service === "apify_maps") totalItemsCharged += quantity;

    const service = servicesMap.get(log.service) ?? {
      service: log.service,
      requests_count: 0,
      cost_usd: 0,
      cost_brl: 0,
    };
    service.requests_count += 1;
    service.cost_usd += costUsd;
    service.cost_brl += costBrl;
    servicesMap.set(log.service, service);

    if (!log.user_id) {
      unattributedCostUsd += costUsd;
      unattributedCostBrl += costBrl;
      unattributedRequests += 1;
      if (log.service === "apify_maps") {
        unattributedItems += quantity;
        unattributedApifyCostUsd += costUsd;
      }
      continue;
    }
    const user = usersMap.get(log.user_id);
    if (!user) continue;
    user.total_cost_usd += costUsd;
    user.total_cost_brl += costBrl;
    user.requests_count += 1;
    if (log.service === "apify_maps") user.items_charged += quantity;
  }

  const users = [...usersMap.values()].sort(
    (left, right) => right.total_cost_usd - left.total_cost_usd,
  );
  const services = [...servicesMap.values()].sort((left, right) => right.cost_usd - left.cost_usd);

  return {
    users,
    services,
    totalCostUsd,
    totalCostBrl,
    totalRequests: accountableLogs.length,
    totalItemsCharged,
    attributedApifyCostUsd: servicesMap.get("apify_maps")?.cost_usd ?? 0,
    unattributedCostUsd,
    unattributedCostBrl,
    unattributedRequests,
    unattributedItems,
    unattributedApifyCostUsd,
  };
}
