import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { decryptFlowBusinessToken } from "../_shared/flow-business-token.ts";
import { commentMatchesKeyword, planAllowsFlowExecution } from "../_shared/flow-business-policy.ts";

type AdminClient = ReturnType<typeof createClient>;
type IngestedEvent = {
  accepted: boolean;
  duplicate: boolean;
  orgId: string;
  instanceId: string;
  conversationId: string;
  leadId: string | null;
};

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_config:${name}`);
  return value;
}

function graphVersion(): string {
  return Deno.env.get("META_GRAPH_VERSION")?.trim() || "v23.0";
}

function adminClient(): AdminClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringAt(value: unknown, key: string): string {
  return isRecord(value) && typeof value[key] === "string" ? value[key] : "";
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1)
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function signatureIsValid(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("META_INSTAGRAM_APP_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(signed), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return constantTimeEqual(expected, signature.slice(7).toLowerCase());
}

async function ingest(
  admin: AdminClient,
  input: {
    accountId: string;
    contactId: string;
    contactName: string;
    eventId: string;
    text: string;
    type: string;
    source: string;
    occurredAt: string;
    windowHours: number;
    metadata: Record<string, unknown>;
  },
): Promise<IngestedEvent | null> {
  const { data, error } = await admin.rpc("flow_business_ingest_meta_event", {
    p_meta_account_id: input.accountId,
    p_external_contact_id: input.contactId,
    p_external_contact_name: input.contactName,
    p_external_event_id: input.eventId,
    p_text: input.text,
    p_message_type: input.type,
    p_source: input.source,
    p_occurred_at: input.occurredAt,
    p_window_hours: input.windowHours,
    p_metadata: input.metadata,
  });
  if (error || !isRecord(data) || data.accepted !== true) return null;
  return {
    accepted: true,
    duplicate: data.duplicate === true,
    orgId: String(data.orgId || ""),
    instanceId: String(data.instanceId || ""),
    conversationId: String(data.conversationId || ""),
    leadId: typeof data.leadId === "string" ? data.leadId : null,
  };
}

async function accountToken(admin: AdminClient, instanceId: string) {
  const { data: instance } = await admin
    .from("ig_instancias")
    .select("id,meta_ig_user_id")
    .eq("id", instanceId)
    .maybeSingle();
  const { data: stored } = await admin
    .from("ig_instancia_tokens")
    .select("access_token_ciphertext,expires_at")
    .eq("instancia_id", instanceId)
    .maybeSingle();
  if (!instance?.meta_ig_user_id || !stored?.access_token_ciphertext)
    throw new Error("account_token_missing");
  if (stored.expires_at && new Date(stored.expires_at).getTime() <= Date.now())
    throw new Error("account_token_expired");
  return {
    accountId: instance.meta_ig_user_id as string,
    token: await decryptFlowBusinessToken(stored.access_token_ciphertext as string),
  };
}

async function sendDirect(token: string, accountId: string, contactId: string, text: string) {
  const response = await fetch(
    `https://graph.instagram.com/${graphVersion()}/${accountId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: contactId }, message: { text } }),
    },
  );
  if (!response.ok) throw new Error("meta_send_failed");
  const body = await response.json().catch(() => ({}));
  return isRecord(body) && typeof body.message_id === "string" ? body.message_id : null;
}

async function sendPrivateReply(token: string, commentId: string, text: string) {
  const response = await fetch(
    `https://graph.instagram.com/${graphVersion()}/${commentId}/private_replies`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    },
  );
  if (!response.ok) throw new Error("meta_private_reply_failed");
  const body = await response.json().catch(() => ({}));
  return isRecord(body) && typeof body.id === "string" ? body.id : null;
}

async function executeFlows(
  admin: AdminClient,
  event: IngestedEvent,
  context: {
    triggerType: "incoming_message" | "comment_keyword";
    text: string;
    contactId: string;
    commentId?: string;
  },
) {
  if (event.duplicate) return;
  const { data: plan } = await admin.rpc("flow_business_plan_snapshot", {
    p_org: event.orgId,
  });
  if (!planAllowsFlowExecution(plan)) return;
  const { data: flows } = await admin
    .from("instagram_flows")
    .select("id,trigger_type,trigger_config")
    .eq("org_id", event.orgId)
    .eq("account_id", event.instanceId)
    .eq("status", "active")
    .eq("trigger_type", context.triggerType);
  if (!flows?.length) return;
  const credentials = await accountToken(admin, event.instanceId);

  for (const flow of flows) {
    const config = isRecord(flow.trigger_config) ? flow.trigger_config : {};
    const keyword = typeof config.keyword === "string" ? config.keyword : "";
    if (context.triggerType === "comment_keyword" && !commentMatchesKeyword(context.text, keyword))
      continue;
    const { data: run } = await admin
      .from("instagram_flow_runs")
      .insert({
        org_id: event.orgId,
        flow_id: flow.id,
        conversation_id: event.conversationId,
        context: { triggerType: context.triggerType, contactId: context.contactId },
      })
      .select("id")
      .single();
    try {
      const { data: nodes, error: nodesError } = await admin
        .from("instagram_flow_nodes")
        .select("id,subtype,label,config")
        .eq("flow_id", flow.id)
        .neq("node_type", "trigger")
        .order("position_y", { ascending: true });
      if (nodesError) throw nodesError;
      for (const node of nodes ?? []) {
        const nodeConfig = isRecord(node.config) ? node.config : {};
        if (node.subtype === "send_message") {
          const text = typeof nodeConfig.text === "string" ? nodeConfig.text.trim() : "";
          if (!text) throw new Error("flow_message_empty");
          let externalMessageId: string | null;
          if (context.triggerType === "comment_keyword" && context.commentId)
            externalMessageId = await sendPrivateReply(credentials.token, context.commentId, text);
          else
            externalMessageId = await sendDirect(
              credentials.token,
              credentials.accountId,
              context.contactId,
              text,
            );
          const now = new Date().toISOString();
          await admin.from("ig_mensagens").insert({
            org_id: event.orgId,
            conversa_id: event.conversationId,
            external_message_id: externalMessageId,
            direction: "outbound",
            message_type: context.triggerType === "comment_keyword" ? "private_reply" : "text",
            text,
            timestamp: now,
            delivery_status: "sent",
            metadata: { flowId: flow.id, nodeId: node.id },
          });
          await admin
            .from("ig_conversas")
            .update({
              last_message_text: text,
              last_message_at: now,
              last_outbound_at: now,
              atualizado_em: now,
            })
            .eq("id", event.conversationId);
        } else if (node.subtype === "add_tag") {
          const tag =
            typeof nodeConfig.tag === "string" ? nodeConfig.tag.trim() : node.label.trim();
          const { data: conversation } = await admin
            .from("ig_conversas")
            .select("tags")
            .eq("id", event.conversationId)
            .single();
          const tags = Array.isArray(conversation?.tags)
            ? conversation.tags.filter((item): item is string => typeof item === "string")
            : [];
          if (tag && !tags.includes(tag))
            await admin
              .from("ig_conversas")
              .update({ tags: [...tags, tag] })
              .eq("id", event.conversationId);
        } else if (node.subtype === "move_crm" && event.leadId) {
          const { data: card } = await admin
            .from("instagram_crm_cards")
            .select("id")
            .eq("org_id", event.orgId)
            .eq("lead_id", event.leadId)
            .maybeSingle();
          const stage = typeof nodeConfig.stage === "string" ? nodeConfig.stage : "respondeu";
          if (card)
            await admin.rpc("flow_business_move_card", {
              p_card_id: card.id,
              p_stage: stage,
              p_reason: "Flow Business",
            });
        } else if (node.subtype === "create_task" && event.leadId) {
          const { data: card } = await admin
            .from("instagram_crm_cards")
            .select("id")
            .eq("org_id", event.orgId)
            .eq("lead_id", event.leadId)
            .maybeSingle();
          if (card)
            await admin.from("instagram_crm_tasks").insert({
              org_id: event.orgId,
              card_id: card.id,
              action_type: "custom",
              title: node.label,
              instructions:
                typeof nodeConfig.instructions === "string" ? nodeConfig.instructions : null,
              due_at: new Date().toISOString(),
            });
        }
      }
      if (run)
        await admin
          .from("instagram_flow_runs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", run.id);
    } catch (error) {
      if (run)
        await admin
          .from("instagram_flow_runs")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "flow_failed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);
    }
  }
}

async function processMessaging(admin: AdminClient, accountId: string, raw: unknown) {
  if (!isRecord(raw)) return;
  const sender = isRecord(raw.sender) ? raw.sender : {};
  const recipient = isRecord(raw.recipient) ? raw.recipient : {};
  const message = isRecord(raw.message) ? raw.message : {};
  const contactId = stringAt(sender, "id");
  const eventId = stringAt(message, "mid");
  if (!contactId || !eventId || stringAt(recipient, "id") !== accountId) return;
  const text = stringAt(message, "text");
  const timestamp =
    typeof raw.timestamp === "number"
      ? new Date(raw.timestamp).toISOString()
      : new Date().toISOString();
  const event = await ingest(admin, {
    accountId,
    contactId,
    contactName: "",
    eventId,
    text,
    type: "text",
    source: "direct",
    occurredAt: timestamp,
    windowHours: 24,
    metadata: raw,
  });
  if (event) await executeFlows(admin, event, { triggerType: "incoming_message", text, contactId });
}

async function processComment(admin: AdminClient, accountId: string, raw: unknown) {
  if (!isRecord(raw) || !isRecord(raw.value)) return;
  const value = raw.value;
  const from = isRecord(value.from) ? value.from : {};
  const commentId = stringAt(value, "id");
  const contactId = stringAt(from, "id");
  const text = stringAt(value, "text");
  if (!commentId || !contactId) return;
  const event = await ingest(admin, {
    accountId,
    contactId,
    contactName: stringAt(from, "username"),
    eventId: `comment:${commentId}`,
    text,
    type: "comment",
    source: "comment",
    occurredAt: new Date().toISOString(),
    windowHours: 0,
    metadata: value,
  });
  if (event)
    await executeFlows(admin, event, {
      triggerType: "comment_keyword",
      text,
      contactId,
      commentId,
    });
}

async function processPayload(admin: AdminClient, payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.entry)) return;
  for (const entry of payload.entry) {
    if (!isRecord(entry)) continue;
    const accountId = stringAt(entry, "id");
    if (!accountId) continue;
    if (Array.isArray(entry.messaging))
      for (const event of entry.messaging) await processMessaging(admin, accountId, event);
    if (Array.isArray(entry.changes))
      for (const change of entry.changes)
        if (isRecord(change) && ["comments", "live_comments"].includes(stringAt(change, "field")))
          await processComment(admin, accountId, change);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const valid =
        url.searchParams.get("hub.mode") === "subscribe" &&
        url.searchParams.get("hub.verify_token") === env("META_INSTAGRAM_WEBHOOK_VERIFY_TOKEN");
      return valid
        ? new Response(url.searchParams.get("hub.challenge") || "", { status: 200 })
        : new Response("Forbidden", { status: 403 });
    }
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const rawBody = await req.text();
    if (!(await signatureIsValid(rawBody, req.headers.get("x-hub-signature-256"))))
      return json({ error: "invalid_signature" }, 401);
    const payload: unknown = JSON.parse(rawBody);
    await processPayload(adminClient(), payload);
    return json({ received: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "webhook_failed" }, 500);
  }
});
