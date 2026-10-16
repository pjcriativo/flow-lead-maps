import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import { isAssignedConversationAllowed } from "../_shared/whatsapp-policy.ts";
import {
  enviarTextoInstancia,
  inicializarCofreWa,
  instanciaDaOrgComToken,
  waBase,
} from "../_shared/wa.ts";

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
      permission: "reply_conversations",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status);
  }

  const conversationId = String(body.conversa_id || "");
  const text = String(body.texto || "").trim();
  if (!conversationId || !text)
    return json({ error: "Conversa e mensagem são obrigatórias." }, 422);

  const { data: conversation } = await admin
    .from("wa_mensagens")
    .select("id, org_id, numero, lead_id, instancia_id")
    .eq("id", conversationId)
    .eq("org_id", context.orgId)
    .maybeSingle();
  if (!conversation) return json({ error: "Conversa não encontrada." }, 404);

  let assignedTo: string | null = null;
  if (conversation.lead_id) {
    const { data: lead } = await admin
      .from("leads")
      .select("id, assigned_to")
      .eq("id", conversation.lead_id)
      .eq("org_id", context.orgId)
      .maybeSingle();
    if (!lead) return json({ error: "Conversa não encontrada." }, 404);
    assignedTo = lead.assigned_to;
  }
  if (
    !isAssignedConversationAllowed({
      role: context.role,
      userId: context.userId,
      assignedTo,
      leadId: conversation.lead_id,
    })
  ) {
    return json({ error: "Conversa não atribuída a este atendente." }, 403);
  }

  await inicializarCofreWa(admin);
  if (!waBase()) return json({ error: "Integração WhatsApp indisponível." }, 503);
  const instance = await instanciaDaOrgComToken(admin, context.orgId, conversation.instancia_id);
  if (!instance || instance.status !== "conectado") {
    return json({ error: "Número de atendimento indisponível." }, 409);
  }

  const sent = await enviarTextoInstancia(instance.token, conversation.numero, text);
  if (!sent.ok) return json({ error: "Não foi possível enviar a mensagem." }, 409);

  const { error: insertError } = await admin.from("wa_mensagens").insert({
    user_id: context.userId,
    org_id: context.orgId,
    instancia_id: instance.id,
    lead_id: conversation.lead_id,
    numero: conversation.numero,
    direcao: "out",
    tipo: "texto",
    texto: text,
    lida: true,
  });
  if (insertError) {
    console.error("wa-responder persistence failed", insertError.code);
    return json({ error: "Mensagem entregue, mas o histórico não foi confirmado." }, 409);
  }
  return json({ ok: true });
});
