// O transporte em massa permanece deliberadamente bloqueado até existir reserva atômica.
// O fluxo anterior tratava `registro_falhou` depois da entrega e consultava `email_opt_out`,
// que não representa autorização específica de WhatsApp. Nenhum desses caminhos envia agora.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";

export const DISPARO_EM_MASSA_BLOQUEADO = "disparo_em_massa_bloqueado";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

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
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 422);
  }

  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission: "manage_campaigns",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status);
  }

  const campaignLeadId = String(body.campanha_lead_id || "");
  if (!campaignLeadId) return json({ error: "Item de campanha inválido." }, 422);
  const { data: campaignLead } = await admin
    .from("campanha_leads")
    .select("id, campanha_id, lead_id, proposta_id, estado")
    .eq("id", campaignLeadId)
    .eq("org_id", context.orgId)
    .maybeSingle();
  if (!campaignLead) return json({ error: "Item de campanha não encontrado." }, 404);

  const [{ data: campaign }, { data: lead }] = await Promise.all([
    admin
      .from("campanhas")
      .select("id, canal, status")
      .eq("id", campaignLead.campanha_id)
      .eq("org_id", context.orgId)
      .maybeSingle(),
    admin
      .from("leads")
      .select("id")
      .eq("id", campaignLead.lead_id)
      .eq("org_id", context.orgId)
      .maybeSingle(),
  ]);
  if (!campaign || !lead) return json({ error: "Campanha não encontrada." }, 404);
  if (campaign.canal !== "whatsapp") return json({ error: "Canal inválido." }, 422);
  if (campaign.status !== "ativa" || campaignLead.estado !== "aprovado") {
    return json({ error: "Campanha não está pronta para envio." }, 409);
  }
  if (campaignLead.proposta_id) {
    const { data: proposal } = await admin
      .from("propostas")
      .select("id")
      .eq("id", campaignLead.proposta_id)
      .eq("org_id", context.orgId)
      .maybeSingle();
    if (!proposal) return json({ error: "Proposta não encontrada." }, 404);
  }

  return json(
    {
      ok: false,
      reason: DISPARO_EM_MASSA_BLOQUEADO,
      error: "Envio em massa indisponível até a reserva atômica ser implantada.",
    },
    409,
  );
});
