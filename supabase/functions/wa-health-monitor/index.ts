import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";
import { inicializarCofreWa, observarStatusInstancia, reconciliarWebhooks } from "../_shared/wa.ts";
import { calculateOperationalHealth } from "../_shared/whatsapp-instance-health.ts";

type HealthRow = {
  id: string;
  org_id: string;
  provider_status: "connected" | "disconnected" | "pairing" | "unknown";
  last_provider_success_at: string | null;
  health_failure_count: number;
};

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index++) {
    difference |= (a[index % Math.max(a.length, 1)] ?? 0) ^ (b[index % Math.max(b.length, 1)] ?? 0);
  }
  return difference === 0;
}

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  operation: (value: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor++;
      await operation(values[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  // WA_WORKER_SECRET (chamada operacional) ou CRON_SECRET (pg_cron, segredo guardado no vault).
  const workerSecret = Deno.env.get("WA_WORKER_SECRET") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const suppliedWorker = request.headers.get("x-wa-worker-secret") ?? "";
  const suppliedCron = request.headers.get("x-cron-secret") ?? "";
  const authorized =
    (workerSecret !== "" &&
      suppliedWorker !== "" &&
      constantTimeEqual(workerSecret, suppliedWorker)) ||
    (cronSecret !== "" && suppliedCron !== "" && constantTimeEqual(cronSecret, suppliedCron));
  if (!authorized) {
    return json({ error: "Não autorizado." }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  await inicializarCofreWa(admin);

  let requestedLimit = 25;
  let requestedOrg: string | null = null;
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") {
      const input = body as Record<string, unknown>;
      if (typeof input.limit === "number") requestedLimit = input.limit;
      if (typeof input.org_id === "string" && input.org_id.trim()) requestedOrg = input.org_id;
    }
  } catch {
    // Optional body. Authentication is carried only by the internal secret.
  }
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 100);
  let query = admin
    .from("wa_instancias")
    .select("id,org_id,provider_status,last_provider_success_at,health_failure_count")
    .neq("status", "queimada")
    // Chips arquivados não têm sessão na Evolution: checá-los só gera falhas e alertas falsos.
    .is("deleted_at", null)
    // Chips CONECTADOS entram em toda execução: o envio exige evidência de saúde com menos de
    // 5 min, e o próximo horário de checagem gravado (+5 min) deixava o envio sempre no limite,
    // forçando uma consulta ao vivo (mais lenta) no meio do atendimento. Os demais seguem o recuo.
    .or(
      `status.eq.conectado,next_health_check_at.is.null,next_health_check_at.lte.${new Date().toISOString()}`,
    )
    .order("next_health_check_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (requestedOrg) query = query.eq("org_id", requestedOrg);
  const { data: instances, error } = await query;
  if (error) return json({ error: "Falha ao selecionar instâncias." }, 503);

  const summary = { checked: 0, healthy: 0, unavailable: 0, degraded: 0, failed: 0 };
  await mapWithConcurrency((instances ?? []) as HealthRow[], 4, async (instance) => {
    const { data: tokenRow } = await admin
      .from("wa_instancia_tokens")
      .select("token")
      .eq("instancia_id", instance.id)
      .maybeSingle();
    const observation = tokenRow?.token
      ? await observarStatusInstancia(tokenRow.token, 8_000)
      : {
          ok: false as const,
          observedAt: new Date().toISOString(),
          failureKind: "authentication" as const,
          errorCode: "provider_authentication",
          httpStatus: null,
        };
    const failures = observation.ok ? 0 : (instance.health_failure_count ?? 0) + 1;
    const providerState = observation.ok ? observation.providerState : instance.provider_status;
    const operationalHealth = calculateOperationalHealth({
      providerState,
      lastSuccessfulCheckAt: observation.ok
        ? observation.observedAt
        : instance.last_provider_success_at,
      lastCheckFailed: !observation.ok,
      consecutiveFailures: failures,
    });
    const { error: persistError } = await admin.rpc("wa_apply_instance_observation", {
      p_org: instance.org_id,
      p_instance: instance.id,
      p_source: "monitor",
      p_observed_at: observation.observedAt,
      p_provider_status: providerState,
      p_operational_health: operationalHealth,
      p_success: observation.ok,
      p_error_code: observation.ok ? null : observation.errorCode,
      p_number: observation.ok ? observation.jid : null,
      p_actor: null,
    });
    summary.checked++;
    if (persistError) summary.failed++;
    else if (operationalHealth === "healthy") summary.healthy++;
    else if (operationalHealth === "unavailable") summary.unavailable++;
    else summary.degraded++;
  });
  // Webhook: o /instance/connect da Evolution GO sobrescreve o webhook; se uma reconexão ou um
  // reinício do servidor o apagou, a Central de Conversas para de receber. Reaplica nos chips
  // CONECTADOS sem webhook (não desconecta nada; ver reconciliarWebhooks).
  const webhooks = await reconciliarWebhooks(admin).catch(() => []);
  return json({
    ...summary,
    webhooks_reaplicados: webhooks.filter((item) => item.situacao === "configurado").length,
    webhooks_com_falha: webhooks.filter((item) => item.situacao === "falhou").length,
  });
});
