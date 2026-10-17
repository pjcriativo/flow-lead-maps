import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MUTATIONS = new Set([
  "claim",
  "transfer",
  "unassign",
  "set_status",
  "mark_read",
  "add_note",
  "link_lead",
  "create_lead",
  "add_tag",
  "remove_tag",
]);
const CONVERSATION_FIELDS =
  "id,org_id,instancia_id,remote_contact_id,normalized_phone,contact_name,lead_id,assigned_to,status,priority,origin,last_message_at,last_message_preview,last_message_type,last_message_direction,last_inbound_at,last_outbound_at,first_response_at,unread_count,version,created_at,updated_at";

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
  const action = String(body.acao || "snapshot");
  if (action !== "snapshot" && !MUTATIONS.has(action)) {
    return json({ error: "Ação inválida." }, 422);
  }

  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission: action === "snapshot" ? "view_conversations" : "reply_conversations",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status);
  }

  if (action === "snapshot") {
    const requestedPage = Number(body.page ?? 0);
    const requestedPageSize = Number(body.page_size ?? 200);
    const page = Number.isInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
    const pageSize =
      Number.isInteger(requestedPageSize) && requestedPageSize >= 1
        ? Math.min(requestedPageSize, 200)
        : 200;
    const selectedId =
      typeof body.conversa_id === "string" && UUID.test(body.conversa_id) ? body.conversa_id : null;
    let conversationsQuery = admin
      .from("wa_conversas")
      .select(CONVERSATION_FIELDS, { count: "exact" })
      .eq("org_id", context.orgId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (context.role === "vendedor" || context.role === "sdr") {
      conversationsQuery = conversationsQuery.or(
        `assigned_to.eq.${context.userId},assigned_to.is.null`,
      );
    }
    const { data: conversations, error: conversationsError, count } = await conversationsQuery;
    if (conversationsError) return json({ error: "Não foi possível carregar conversas." }, 503);

    let selectedConversation = null;
    if (selectedId) {
      let selectedQuery = admin
        .from("wa_conversas")
        .select(CONVERSATION_FIELDS)
        .eq("org_id", context.orgId)
        .eq("id", selectedId);
      if (context.role === "vendedor" || context.role === "sdr") {
        selectedQuery = selectedQuery.or(`assigned_to.eq.${context.userId},assigned_to.is.null`);
      }
      const selectedResult = await selectedQuery.maybeSingle();
      if (selectedResult.error) {
        return json({ error: "Não foi possível carregar a conversa." }, 503);
      }
      selectedConversation = selectedResult.data;
      if (!selectedConversation) return json({ error: "Conversa não encontrada." }, 404);
    }
    const detail = selectedConversation ?? conversations?.[0] ?? null;
    const detailId = detail?.id ?? null;
    const [messagesResult, notesResult, eventsResult, tagsResult] = await Promise.all([
      detailId
        ? admin
            .from("wa_mensagens")
            .select(
              "id,conversa_id,direcao,tipo,texto,media_url,externo_id,lida,status,author_id,provider_occurred_at,criado_em",
            )
            .eq("org_id", context.orgId)
            .eq("conversa_id", detailId)
            .order("provider_occurred_at", { ascending: true })
            .limit(500)
        : Promise.resolve({ data: [] }),
      detailId
        ? admin
            .from("wa_conversa_notas")
            .select("id,author_id,body,created_at,updated_at")
            .eq("org_id", context.orgId)
            .eq("conversa_id", detailId)
            .order("created_at")
        : Promise.resolve({ data: [] }),
      detailId
        ? admin
            .from("wa_conversa_eventos")
            .select("id,event_type,actor_id,occurred_at,details")
            .eq("org_id", context.orgId)
            .eq("conversa_id", detailId)
            .order("occurred_at")
        : Promise.resolve({ data: [] }),
      detailId
        ? admin
            .from("wa_conversa_etiquetas")
            .select("etiqueta_id,wa_etiquetas(id,name,color)")
            .eq("org_id", context.orgId)
            .eq("conversa_id", detailId)
        : Promise.resolve({ data: [] }),
    ]);
    const detailError = [messagesResult, notesResult, eventsResult, tagsResult].find(
      (result) => "error" in result && result.error,
    );
    if (detailError) return json({ error: "Não foi possível carregar a conversa." }, 503);
    let lead = null;
    let proposal = null;
    if (detail?.lead_id) {
      const leadResult = await admin
        .from("leads")
        .select(
          "id,business_name,owner_name,cargo,phone,whatsapp,email,status,assigned_to,notes,updated_at",
        )
        .eq("id", detail.lead_id)
        .eq("org_id", context.orgId)
        .maybeSingle();
      if (leadResult.error) return json({ error: "Não foi possível carregar o CRM." }, 503);
      lead = leadResult.data;
      const proposalResult = await admin
        .from("propostas")
        .select("id,lead_id,assunto,valor,status,criada_em,enviada_em,respondida_em")
        .eq("org_id", context.orgId)
        .eq("lead_id", detail.lead_id)
        .order("criada_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (proposalResult.error) {
        return json({ error: "Não foi possível carregar a oportunidade." }, 503);
      }
      proposal = proposalResult.data;
    }
    return json({
      role: context.role,
      conversations: conversations ?? [],
      pagination: {
        page,
        page_size: pageSize,
        total: count ?? 0,
        has_more: (page + 1) * pageSize < (count ?? 0),
      },
      selected_id: detailId,
      messages: messagesResult.data ?? [],
      notes: notesResult.data ?? [],
      events: eventsResult.data ?? [],
      tags: tagsResult.data ?? [],
      lead,
      proposal,
    });
  }

  const conversationId = String(body.conversa_id || "");
  if (!UUID.test(conversationId)) return json({ error: "Conversa inválida." }, 422);
  const value =
    body.valor && typeof body.valor === "object" && !Array.isArray(body.valor) ? body.valor : {};
  const { data, error } = await admin.rpc("wa_conversation_action", {
    p_org: context.orgId,
    p_conversation: conversationId,
    p_actor: context.userId,
    p_action: action,
    p_value: value,
  });
  if (error) {
    const forbidden = error.code === "42501";
    const missing = error.code === "P0002";
    console.error("wa-conversations action failed", action, error.code);
    return json(
      {
        error: forbidden
          ? "Ação não permitida."
          : missing
            ? "Registro não encontrado."
            : "Não foi possível concluir a ação.",
      },
      forbidden ? 403 : missing ? 404 : 409,
    );
  }
  return json({ ok: true, conversation: data });
});
