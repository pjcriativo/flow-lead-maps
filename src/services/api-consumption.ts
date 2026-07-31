import { supabase } from "@/integrations/supabase/client";

export type ApiConsumptionLog = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  service: "apify_maps" | "openai_enrichment" | "whatsapp_evolution" | "google_places";
  action: string;
  quantity: number;
  cost_usd: number;
  cost_brl: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  created_at: string;
  user_email?: string;
  user_name?: string;
  org_name?: string;
};

export type ApiUsageResumo = {
  total_cost_usd: number;
  total_cost_brl: number;
  total_requests: number;
  total_leads_crawled: number;
  top_users: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    plan: string;
    monthly_limit: number;
    leads_used: number;
    total_cost_usd: number;
    total_cost_brl: number;
    requests_count: number;
  }>;
  service_breakdown: Array<{
    service: string;
    requests_count: number;
    cost_usd: number;
    cost_brl: number;
  }>;
};

/**
  Registra um log de consumo de API (Apify, OpenAI, WhatsApp, etc)
 */
export async function registrarConsumoApi(dados: {
  service: "apify_maps" | "openai_enrichment" | "whatsapp_evolution" | "google_places";
  action: string;
  quantity: number;
  cost_usd: number;
  cost_brl?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    const userId = authData.user.id;
    // Buscar org_id do usuário
    const { data: member } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", userId)
      .maybeSingle();

    const cotacaoDolar = 5.6;
    const costBrl = dados.cost_brl ?? dados.cost_usd * cotacaoDolar;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from<any, any>("api_consumption_logs").insert({
      user_id: userId,
      org_id: member?.org_id ?? null,
      service: dados.service,
      action: dados.action,
      quantity: dados.quantity,
      cost_usd: dados.cost_usd,
      cost_brl: costBrl,
      metadata: dados.metadata ?? {},
    });
  } catch (err) {
    console.error("Erro ao registrar consumo de API:", err);
  }
}

/**
 * Busca estatísticas de consumo de API para a Dashboard do Admin
 */
export async function obterResumoConsumoApi(dias: number = 30): Promise<ApiUsageResumo> {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - dias);

  const { data: logs, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from<any, any>("api_consumption_logs")
    .select(
      `
      id, org_id, user_id, service, action, quantity, cost_usd, cost_brl, created_at,
      profiles:user_id(full_name, email, plan, monthly_lead_limit, leads_used_monthly)
    `,
    )
    .gte("created_at", dataLimite.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar logs de consumo de API:", error);
    return {
      total_cost_usd: 0,
      total_cost_brl: 0,
      total_requests: 0,
      total_leads_crawled: 0,
      top_users: [],
      service_breakdown: [],
    };
  }

  let totalCostUsd = 0;
  let totalCostBrl = 0;
  let totalRequests = logs.length;
  let totalLeadsCrawled = 0;

  const usersMap = new Map<
    string,
    {
      user_id: string;
      user_name: string;
      user_email: string;
      plan: string;
      monthly_limit: number;
      leads_used: number;
      total_cost_usd: number;
      total_cost_brl: number;
      requests_count: number;
    }
  >();

  const serviceMap = new Map<
    string,
    { service: string; requests_count: number; cost_usd: number; cost_brl: number }
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs.forEach((log: any) => {
    const costUsd = Number(log.cost_usd) || 0;
    const costBrl = Number(log.cost_brl) || 0;
    const qty = Number(log.quantity) || 1;

    totalCostUsd += costUsd;
    totalCostBrl += costBrl;
    if (log.service === "apify_maps") totalLeadsCrawled += qty;

    // Service Breakdown
    const sKey = log.service;
    const sCurr = serviceMap.get(sKey) || {
      service: sKey,
      requests_count: 0,
      cost_usd: 0,
      cost_brl: 0,
    };
    sCurr.requests_count += 1;
    sCurr.cost_usd += costUsd;
    sCurr.cost_brl += costBrl;
    serviceMap.set(sKey, sCurr);

    // User aggregation
    if (log.user_id) {
      const uKey = log.user_id;
      const profile = log.profiles;
      const uCurr = usersMap.get(uKey) || {
        user_id: uKey,
        user_name: profile?.full_name || "Usuário Sem Nome",
        user_email: profile?.email || "sem-email@flowleads.com",
        plan: profile?.plan || "starter",
        monthly_limit: profile?.monthly_lead_limit || 1000,
        leads_used: profile?.leads_used_monthly || 0,
        total_cost_usd: 0,
        total_cost_brl: 0,
        requests_count: 0,
      };

      uCurr.total_cost_usd += costUsd;
      uCurr.total_cost_brl += costBrl;
      uCurr.requests_count += 1;
      usersMap.set(uKey, uCurr);
    }
  });

  const topUsers = Array.from(usersMap.values()).sort(
    (a, b) => b.total_cost_usd - a.total_cost_usd,
  );
  const serviceBreakdown = Array.from(serviceMap.values()).sort((a, b) => b.cost_usd - a.cost_usd);

  return {
    total_cost_usd: totalCostUsd,
    total_cost_brl: totalCostBrl,
    total_requests: totalRequests,
    total_leads_crawled: totalLeadsCrawled,
    top_users: topUsers,
    service_breakdown: serviceBreakdown,
  };
}
