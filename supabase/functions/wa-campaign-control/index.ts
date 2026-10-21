import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";

type CampaignAction =
  | "list"
  | "eligibility"
  | "create_draft"
  | "prepare"
  | "pause"
  | "resume"
  | "cancel"
  | "reschedule"
  | "release_dispatch"
  | "hold_dispatch";

/** Mensagens claras para as recusas de liberação de disparo (o resto segue a mensagem genérica). */
const RECUSAS_LIBERACAO: Record<string, string> = {
  "campaign is not approved":
    "A campanha precisa estar aprovada (fila preparada) antes da liberação.",
  "campaign cannot be released": "Só campanhas ativas ou agendadas podem ter o disparo liberado.",
  "release reason is required": "Informe o motivo da liberação (mínimo 10 caracteres).",
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function schedule(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function timezone(value: unknown): string {
  const candidate = text(value) ?? "America/Sao_Paulo";
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: candidate }).format();
    return candidate;
  } catch {
    throw new Error("Fuso horário inválido.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 422, req);
  }
  const action = text(body.action) as CampaignAction | null;
  if (
    !action ||
    ![
      "list",
      "eligibility",
      "create_draft",
      "prepare",
      "pause",
      "resume",
      "cancel",
      "reschedule",
      "release_dispatch",
      "hold_dispatch",
    ].includes(action)
  ) {
    return json({ error: "Ação inválida." }, 422, req);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );

  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission:
        action === "list" || action === "eligibility" ? "view_dashboard" : "manage_campaigns",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status, req);
  }

  try {
    if (action === "list") {
      const [
        { data: campaigns, error: campaignError },
        { data: deliveries, error: deliveryError },
        { data: responses, error: responseError },
      ] = await Promise.all([
        admin
          .from("campanhas")
          .select(
            "id,nome,status,list_id,criada_em,scheduled_at,schedule_timezone,dispatch_enabled",
          )
          .eq("org_id", context.orgId)
          .eq("canal", "whatsapp")
          .order("criada_em", { ascending: false }),
        admin
          .from("wa_envios")
          .select("campanha_id,status,instancia_id,created_at:enviado_em")
          .eq("org_id", context.orgId),
        admin
          .from("wa_mensagens")
          .select("campanha_id")
          .eq("org_id", context.orgId)
          .eq("direcao", "in"),
      ]);
      if (campaignError || deliveryError || responseError)
        throw campaignError ?? deliveryError ?? responseError;

      const byCampaign = new Map<string, Record<string, number>>();
      for (const delivery of deliveries ?? []) {
        if (!delivery.campanha_id) continue;
        const counts = byCampaign.get(delivery.campanha_id) ?? {};
        counts[delivery.status] = (counts[delivery.status] ?? 0) + 1;
        byCampaign.set(delivery.campanha_id, counts);
      }
      for (const response of responses ?? []) {
        if (!response.campanha_id) continue;
        const counts = byCampaign.get(response.campanha_id) ?? {};
        counts.responses = (counts.responses ?? 0) + 1;
        byCampaign.set(response.campanha_id, counts);
      }
      const acceptedStatuses = new Set(["accepted", "sent", "delivered", "read"]);
      const sent = (deliveries ?? []).filter((item) => acceptedStatuses.has(item.status)).length;
      const chipMetrics: Record<string, { sent: number; percentage: number }> = {};
      for (const delivery of deliveries ?? []) {
        if (!acceptedStatuses.has(delivery.status)) continue;
        const current = chipMetrics[delivery.instancia_id] ?? { sent: 0, percentage: 0 };
        current.sent++;
        chipMetrics[delivery.instancia_id] = current;
      }
      for (const current of Object.values(chipMetrics)) {
        current.percentage = sent > 0 ? Math.round((current.sent / sent) * 1000) / 10 : 0;
      }
      const delivered = (deliveries ?? []).filter(
        (item) => item.status === "delivered" || item.status === "read",
      ).length;
      const failed = (deliveries ?? []).filter((item) => item.status === "failed").length;
      const uncertain = (deliveries ?? []).filter((item) => item.status === "uncertain").length;
      const pending = (deliveries ?? []).filter((item) =>
        ["scheduled", "queued", "processing"].includes(item.status),
      ).length;
      const paused = (campaigns ?? []).filter((campaign) => campaign.status === "pausada").length;
      return json(
        {
          campaigns: (campaigns ?? []).map((campaign) => ({
            ...campaign,
            counts: byCampaign.get(campaign.id) ?? {},
          })),
          metrics: {
            prepared: (deliveries ?? []).length,
            pending,
            processed: sent + failed + uncertain,
            sent,
            delivered,
            failed,
            uncertain,
            responses: (responses ?? []).length,
            paused,
          },
          chip_metrics: chipMetrics,
        },
        200,
        req,
      );
    }

    if (action === "eligibility") {
      const listId = text(body.list_id);
      if (!listId) return json({ error: "Lista inválida." }, 422, req);
      const { data: leads, error } = await admin
        .from("leads")
        .select(
          "whatsapp,phone,whatsapp_opt_in,whatsapp_opt_in_at,whatsapp_consent_source,whatsapp_consent_purpose,whatsapp_opt_out",
        )
        .eq("org_id", context.orgId)
        .eq("list_id", listId);
      if (error) throw error;
      const summary = { total: (leads ?? []).length, eligible: 0, blocked: 0 };
      for (const lead of leads ?? []) {
        const number = String(lead.whatsapp ?? lead.phone ?? "").replace(/\D/g, "");
        const eligible =
          number.length >= 10 &&
          number.length <= 15 &&
          !/^0+$/.test(number) &&
          lead.whatsapp_opt_in === true &&
          Boolean(lead.whatsapp_opt_in_at) &&
          Boolean(String(lead.whatsapp_consent_source ?? "").trim()) &&
          Boolean(String(lead.whatsapp_consent_purpose ?? "").trim()) &&
          lead.whatsapp_opt_out !== true;
        if (eligible) summary.eligible++;
        else summary.blocked++;
      }
      return json(summary, 200, req);
    }

    if (action === "create_draft") {
      const name = text(body.name);
      const listId = text(body.list_id);
      const message = text(body.message);
      const campaignType = text(body.campaign_type) ?? "prospeccao";
      const requestedSchedule = body.scheduled_at == null ? null : schedule(body.scheduled_at);
      if (!name || !listId || !message) {
        return json({ error: "Nome, lista e mensagem são obrigatórios." }, 422, req);
      }
      if (body.scheduled_at != null && !requestedSchedule) {
        return json({ error: "Agendamento inválido." }, 422, req);
      }
      const { data, error } = await admin.rpc("wa_create_campaign_draft", {
        p_org: context.orgId,
        p_actor: context.userId,
        p_list: listId,
        p_name: name,
        p_message: message,
        p_campaign_type: campaignType,
        p_scheduled_at: requestedSchedule,
        p_timezone: timezone(body.timezone),
      });
      if (error) throw error;
      return json({ ok: true, campaign: Array.isArray(data) ? data[0] : data }, 201, req);
    }

    const campaignId = text(body.campaign_id);
    if (!campaignId) return json({ error: "Campanha inválida." }, 422, req);

    if (action === "prepare") {
      const purpose = text(body.purpose);
      if (!purpose) return json({ error: "Informe a finalidade da comunicação." }, 422, req);
      const requestedSchedule = body.scheduled_at == null ? null : schedule(body.scheduled_at);
      if (body.scheduled_at != null && !requestedSchedule) {
        return json({ error: "Agendamento inválido." }, 422, req);
      }
      const { data, error } = await admin.rpc("wa_prepare_campaign", {
        p_org: context.orgId,
        p_campaign: campaignId,
        p_actor: context.userId,
        p_scheduled_at: requestedSchedule,
        p_timezone: timezone(body.timezone),
        p_purpose: purpose,
      });
      if (error) throw error;
      return json({ ok: true, result: data, dispatch_enabled: false }, 200, req);
    }

    if (action === "reschedule") {
      const requestedSchedule = schedule(body.scheduled_at);
      if (!requestedSchedule) return json({ error: "Agendamento inválido." }, 422, req);
      const { data, error } = await admin.rpc("wa_reschedule_campaign", {
        p_org: context.orgId,
        p_campaign: campaignId,
        p_actor: context.userId,
        p_scheduled_at: requestedSchedule,
        p_timezone: timezone(body.timezone),
      });
      if (error) throw error;
      return json({ ok: true, updated: data }, 200, req);
    }

    const { data, error } = await admin.rpc("wa_control_campaign", {
      p_org: context.orgId,
      p_campaign: campaignId,
      p_actor: context.userId,
      p_action: action,
      p_reason: text(body.reason),
    });
    if (error) {
      const recusa = RECUSAS_LIBERACAO[String(error.message ?? "")];
      if (recusa) return json({ error: recusa }, 409, req);
      throw error;
    }
    return json({ ok: true, status: data }, 200, req);
  } catch (error) {
    console.error("wa campaign control failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Não foi possível concluir a operação da campanha." }, 409, req);
  }
});
