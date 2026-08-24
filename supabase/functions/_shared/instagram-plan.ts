// Controle central das cotas Instagram. Toda Edge reserva antes de uma operação
// e finaliza com o consumo real para não ultrapassar o plano em concorrência.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export type InstagramUsageAmount = {
  leads?: number;
  audienceProfiles?: number;
  competitors?: number;
  hunts?: number;
  overlaps?: number;
  enrichments?: number;
  brands?: number;
  monthlyCostUsd?: number;
};

export type InstagramPlanStatus = {
  planId: string;
  planName: string;
  tier: "basico" | "pro" | "agencia";
  monitoring: "manual" | "weekly" | "daily";
  limits: Required<InstagramUsageAmount>;
  used: Required<InstagramUsageAmount>;
  features: { audience: boolean; overlap: boolean; reports: boolean; multiBrand: boolean };
  monthRef: string;
};

export class InstagramPlanLimitError extends Error {
  reason: string;
  status?: InstagramPlanStatus;

  constructor(reason: string, status?: InstagramPlanStatus) {
    const labels: Record<string, string> = {
      feature_not_in_plan: "O módulo Instagram não está incluído neste plano.",
      leads_limit: "A cota mensal de leads do Instagram foi atingida.",
      audience_limit: "A cota mensal de perfis de audiência foi atingida.",
      competitors_limit: "O limite de concorrentes monitorados foi atingido.",
      hunts_limit: "A cota mensal de caçadas do Instagram foi atingida.",
      overlap_not_in_plan: "O cruzamento de audiências está disponível a partir do plano Pro.",
      enrichments_limit: "A cota mensal de enriquecimentos foi atingida.",
      brands_limit: "O limite de marcas do plano foi atingido.",
      cost_limit: "O teto seguro mensal de custo do Instagram foi atingido.",
    };
    super(labels[reason] ?? "O limite do plano não permite concluir esta operação.");
    this.name = "InstagramPlanLimitError";
    this.reason = reason;
    this.status = status;
  }
}

const positiveInt = (value: number | undefined) => Math.max(0, Math.floor(Number(value ?? 0)));
const positiveCost = (value: number | undefined) => Math.max(0, Number(value ?? 0));

export async function getInstagramPlanStatus(
  admin: Admin,
  orgId: string,
): Promise<InstagramPlanStatus> {
  const { data, error } = await admin.rpc("instagram_plan_status", { p_org: orgId });
  if (error) throw new Error(`Falha ao consultar o plano Instagram: ${error.message}`);
  return data as InstagramPlanStatus;
}

export async function reserveInstagramUsage(params: {
  admin: Admin;
  orgId: string;
  userId: string;
  requestId: string;
  action: string;
  amount?: InstagramUsageAmount;
}): Promise<InstagramPlanStatus> {
  const { admin, orgId, userId, requestId, action, amount = {} } = params;
  const { data, error } = await admin.rpc("instagram_reserve_usage", {
    p_org: orgId,
    p_user: userId,
    p_request_id: requestId,
    p_action: action,
    p_leads: positiveInt(amount.leads),
    p_audience_profiles: positiveInt(amount.audienceProfiles),
    p_competitors: positiveInt(amount.competitors),
    p_hunts: positiveInt(amount.hunts),
    p_overlaps: positiveInt(amount.overlaps),
    p_enrichments: positiveInt(amount.enrichments),
    p_brands: positiveInt(amount.brands),
    p_cost_usd: positiveCost(amount.monthlyCostUsd),
  });
  if (error) throw new Error(`Falha ao reservar a cota Instagram: ${error.message}`);
  if (!data?.ok)
    throw new InstagramPlanLimitError(String(data?.reason ?? "plan_limit"), data?.status);
  return (
    data.status && typeof data.status === "object"
      ? data.status
      : await getInstagramPlanStatus(admin, orgId)
  ) as InstagramPlanStatus;
}

export async function finalizeInstagramUsage(params: {
  admin: Admin;
  orgId: string;
  requestId: string;
  status: "completed" | "failed";
  amount?: InstagramUsageAmount;
}): Promise<void> {
  const { admin, orgId, requestId, status, amount = {} } = params;
  const { error } = await admin.rpc("instagram_finalize_usage", {
    p_org: orgId,
    p_request_id: requestId,
    p_status: status,
    p_leads: positiveInt(amount.leads),
    p_audience_profiles: positiveInt(amount.audienceProfiles),
    p_competitors: positiveInt(amount.competitors),
    p_hunts: positiveInt(amount.hunts),
    p_overlaps: positiveInt(amount.overlaps),
    p_enrichments: positiveInt(amount.enrichments),
    p_brands: positiveInt(amount.brands),
    p_cost_usd: positiveCost(amount.monthlyCostUsd),
  });
  if (error) throw new Error(`Falha ao finalizar a cota Instagram: ${error.message}`);
}
