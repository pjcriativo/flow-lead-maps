import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";
import {
  enviarTextoInstancia,
  instanciaDaOrgComToken,
  WA_TETO_DIARIO_CHIP,
  enviosHojeDoChip,
} from "../_shared/wa.ts";
import {
  classifyProviderFailure,
  extractProviderMessageId,
  sanitizeProviderError,
  shouldRetryDelivery,
} from "../_shared/whatsapp-delivery-engine.ts";

type ReservedDelivery = {
  id: string;
  org_id: string;
  user_id: string;
  campanha_id: string;
  lead_id: string;
  instancia_id: string;
  recipient: string;
  mensagem: string;
  attempt_count: number;
  provider_attempt_count: number;
  max_attempts: number;
};

type AttemptOutcome = "accepted" | "failed" | "uncertain" | "blocked" | "deferred";
type AdminClient = ReturnType<typeof createClient>;

async function completeAttempt(
  admin: AdminClient,
  delivery: ReservedDelivery,
  values: {
    outcome: AttemptOutcome;
    retryable?: boolean;
    httpStatus?: number;
    providerMessageId?: string | null;
    errorCode?: string;
    errorMessage?: string;
    providerResponse?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await admin
    .from("wa_envio_tentativas")
    .update({
      completed_at: new Date().toISOString(),
      outcome: values.outcome,
      retryable: values.retryable ?? false,
      http_status: values.httpStatus,
      provider_message_id: values.providerMessageId,
      error_code: values.errorCode,
      error_message: values.errorMessage,
      provider_response: values.providerResponse,
    })
    .eq("org_id", delivery.org_id)
    .eq("envio_id", delivery.id)
    .eq("attempt_number", delivery.attempt_count);
  if (error) {
    console.error(
      JSON.stringify({ event: "attempt_persistence_failed", code: error.code ?? "database_error" }),
    );
  }
}

async function registerCampaignHealth(
  admin: AdminClient,
  delivery: ReservedDelivery,
  input: { success: boolean; critical?: boolean; reason?: string },
): Promise<void> {
  const { error } = await admin.rpc("wa_register_campaign_health", {
    p_org: delivery.org_id,
    p_campaign: delivery.campanha_id,
    p_success: input.success,
    p_critical: input.critical ?? false,
    p_reason: input.reason ?? null,
  });
  if (error) {
    console.error(
      JSON.stringify({
        event: "campaign_health_persistence_failed",
        code: error.code ?? "database_error",
      }),
    );
  }
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index++) {
    difference |= (a[index % Math.max(a.length, 1)] ?? 0) ^ (b[index % Math.max(b.length, 1)] ?? 0);
  }
  return difference === 0;
}

function safeProviderResponse(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const key of ["status", "success", "message"]) {
    const field = input[key];
    if (typeof field === "boolean" || typeof field === "number") output[key] = field;
    else if (typeof field === "string") output[key] = field.slice(0, 500);
  }
  const providerMessageId = extractProviderMessageId(value);
  if (providerMessageId) output.provider_message_id = providerMessageId;
  return output;
}

function retryAt(attemptCount: number): string {
  const seconds = Math.min(15 * 60, 30 * 2 ** Math.max(0, attemptCount - 1));
  return new Date(Date.now() + seconds * 1000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "MÃ©todo nÃ£o permitido." }, 405);
  const configuredSecret = Deno.env.get("WA_WORKER_SECRET") ?? "";
  const suppliedSecret = req.headers.get("x-wa-worker-secret") ?? "";
  if (!configuredSecret || !constantTimeEqual(configuredSecret, suppliedSecret)) {
    return json({ error: "NÃ£o autorizado." }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  let requestedLimit = 10;
  try {
    const body = await req.json();
    if (typeof body?.limit === "number") requestedLimit = body.limit;
  } catch {
    // Corpo opcional; autenticacao e limites persistidos continuam obrigatorios.
  }
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 25);
  const workerId = crypto.randomUUID();
  const { data, error } = await admin.rpc("wa_reserve_delivery_batch", {
    p_worker: workerId,
    p_limit: limit,
    p_lease_seconds: 180,
  });
  if (error) {
    console.error(
      JSON.stringify({ event: "reservation_failed", code: error.code ?? "database_error" }),
    );
    return json({ error: "Falha ao reservar fila." }, 503);
  }

  const summary = {
    reserved: (data ?? []).length,
    accepted: 0,
    failed: 0,
    uncertain: 0,
    blocked: 0,
    deferred: 0,
  };
  for (const delivery of (data ?? []) as ReservedDelivery[]) {
    const [{ data: campaign }, { data: lead }, { data: instance }] = await Promise.all([
      admin
        .from("campanhas")
        .select("id,status,approved_at,dispatch_enabled")
        .eq("id", delivery.campanha_id)
        .eq("org_id", delivery.org_id)
        .maybeSingle(),
      admin
        .from("leads")
        .select(
          "id,whatsapp_opt_in,whatsapp_opt_in_at,whatsapp_consent_source,whatsapp_consent_purpose,whatsapp_opt_out",
        )
        .eq("id", delivery.lead_id)
        .eq("org_id", delivery.org_id)
        .maybeSingle(),
      admin
        .from("wa_instancias")
        .select(
          "id,status,funcao,numero,provider_status,operational_health,last_provider_success_at",
        )
        .eq("id", delivery.instancia_id)
        .eq("org_id", delivery.org_id)
        .maybeSingle(),
    ]);

    const blockReason =
      !campaign ||
      campaign.status !== "ativa" ||
      !campaign.approved_at ||
      !campaign.dispatch_enabled
        ? "campanha_indisponivel"
        : !lead ||
            !lead.whatsapp_opt_in ||
            !lead.whatsapp_opt_in_at ||
            !String(lead.whatsapp_consent_source ?? "").trim() ||
            !String(lead.whatsapp_consent_purpose ?? "").trim() ||
            lead.whatsapp_opt_out
          ? "destinatario_inelegivel"
          : null;
    if (blockReason) {
      await admin
        .from("wa_envios")
        .update({
          status: "blocked",
          blocked_reason: blockReason,
          retryable: false,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id)
        .eq("org_id", delivery.org_id)
        .eq("worker_id", workerId)
        .eq("status", "processing");
      await completeAttempt(admin, delivery, { outcome: "blocked", errorCode: blockReason });
      summary.blocked++;
      continue;
    }

    const healthIsFresh = Boolean(
      instance?.last_provider_success_at &&
      Date.now() - Date.parse(instance.last_provider_success_at) <= 5 * 60_000,
    );
    const instanceUnavailable =
      !instance ||
      instance.status !== "conectado" ||
      instance.funcao !== "disparo" ||
      !instance.numero ||
      instance.provider_status !== "connected" ||
      instance.operational_health !== "healthy" ||
      !healthIsFresh;
    if (instanceUnavailable) {
      await admin.rpc("wa_defer_delivery_for_instance_health", {
        p_delivery: delivery.id,
        p_worker: workerId,
        p_reason: healthIsFresh ? "instance_health_unavailable" : "instance_health_stale",
      });
      summary.deferred++;
      continue;
    }

    const sentToday = await enviosHojeDoChip(admin, delivery.org_id, delivery.instancia_id);
    if (sentToday >= WA_TETO_DIARIO_CHIP) {
      await admin
        .from("wa_envios")
        .update({
          status: "queued",
          worker_id: null,
          reserved_at: null,
          lease_expires_at: null,
          next_attempt_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          last_error_code: "daily_limit",
          last_error: "Limite diÃ¡rio operacional atingido.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id)
        .eq("worker_id", workerId)
        .eq("status", "processing");
      await completeAttempt(admin, delivery, {
        outcome: "deferred",
        retryable: true,
        errorCode: "daily_limit",
        errorMessage: "Limite diÃ¡rio operacional atingido.",
      });
      continue;
    }

    const resolvedInstance = await instanciaDaOrgComToken(
      admin,
      delivery.org_id,
      delivery.instancia_id,
    );
    if (!resolvedInstance) {
      await admin.rpc("wa_defer_delivery_for_instance_health", {
        p_delivery: delivery.id,
        p_worker: workerId,
        p_reason: "token_instancia_indisponivel",
      });
      await registerCampaignHealth(admin, delivery, {
        success: false,
        critical: true,
        reason: "token_instancia_indisponivel",
      });
      summary.deferred++;
      continue;
    }

    const { data: marked } = await admin.rpc("wa_mark_delivery_dispatched", {
      p_delivery: delivery.id,
      p_worker: workerId,
    });
    if (!marked) {
      await completeAttempt(admin, delivery, {
        outcome: "deferred",
        retryable: true,
        errorCode: "lease_invalid_before_dispatch",
      });
      continue;
    }

    const requestDispatched = true;
    try {
      const result = await enviarTextoInstancia(
        resolvedInstance.token,
        delivery.recipient,
        delivery.mensagem,
      );
      if (result.ok) {
        const providerMessageId = extractProviderMessageId(result.data);
        const now = new Date().toISOString();
        const { data: persisted, error: persistenceError } = await admin
          .from("wa_envios")
          .update({
            status: "accepted",
            provider_message_id: providerMessageId,
            provider_response: safeProviderResponse(result.data),
            accepted_at: now,
            enviado_em: now,
            processed_at: now,
            retryable: false,
            worker_id: null,
            reserved_at: null,
            lease_expires_at: null,
            updated_at: now,
          })
          .eq("id", delivery.id)
          .eq("org_id", delivery.org_id)
          .eq("worker_id", workerId)
          .eq("status", "processing")
          .select("id")
          .maybeSingle();
        if (persistenceError || !persisted) throw new Error("persistence_after_send");
        await completeAttempt(admin, delivery, {
          outcome: "accepted",
          httpStatus: result.httpStatus,
          providerMessageId,
          providerResponse: safeProviderResponse(result.data),
        });
        await registerCampaignHealth(admin, delivery, { success: true });
        summary.accepted++;
        continue;
      }

      const decision = classifyProviderFailure({
        kind: "provider",
        requestDispatched,
        httpStatus: result.httpStatus,
      });
      const retryable = shouldRetryDelivery(
        decision.status,
        delivery.provider_attempt_count + 1,
        delivery.max_attempts,
        decision.retryable,
      );
      const safeError = sanitizeProviderError(result.error);
      await admin
        .from("wa_envios")
        .update({
          status: decision.status,
          retryable,
          next_attempt_at: retryable ? retryAt(delivery.provider_attempt_count + 1) : null,
          last_error_code: decision.code,
          last_error: safeError,
          failed_at: decision.status === "failed" ? new Date().toISOString() : null,
          uncertain_at: decision.status === "uncertain" ? new Date().toISOString() : null,
          processed_at: new Date().toISOString(),
          worker_id: null,
          reserved_at: null,
          lease_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id)
        .eq("org_id", delivery.org_id)
        .eq("worker_id", workerId)
        .eq("status", "processing");
      await completeAttempt(admin, delivery, {
        outcome: decision.status,
        retryable,
        httpStatus: result.httpStatus,
        errorCode: decision.code,
        errorMessage: safeError,
      });
      await registerCampaignHealth(admin, delivery, {
        success: false,
        critical: result.httpStatus === 401 || result.httpStatus === 403,
        reason: decision.code,
      });
      summary[decision.status]++;
    } catch (caught) {
      const persistenceFailure =
        caught instanceof Error && caught.message === "persistence_after_send";
      if (persistenceFailure) {
        // O lease expirado serÃ¡ reconciliado como uncertain; nÃ£o arriscamos um segundo envio.
        summary.uncertain++;
        continue;
      }
      const decision = classifyProviderFailure({ kind: "network", requestDispatched });
      const safeError = sanitizeProviderError(caught);
      await admin
        .from("wa_envios")
        .update({
          status: decision.status,
          retryable: false,
          last_error_code: decision.code,
          last_error: safeError,
          uncertain_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          worker_id: null,
          reserved_at: null,
          lease_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id)
        .eq("org_id", delivery.org_id)
        .eq("worker_id", workerId)
        .eq("status", "processing");
      await completeAttempt(admin, delivery, {
        outcome: "uncertain",
        errorCode: decision.code,
        errorMessage: safeError,
      });
      await registerCampaignHealth(admin, delivery, {
        success: false,
        critical: true,
        reason: decision.code,
      });
      summary.uncertain++;
    }
  }

  return json({ ok: true, ...summary });
});
