import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

type AdminClient = ReturnType<typeof createClient>;
type JsonRecord = Record<string, unknown>;

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_config:${name}`);
  return value;
}

function optionalEnv(name: string): string | null {
  return Deno.env.get(name)?.trim() || null;
}

function appUrl(): string {
  return optionalEnv("FLOW_BUSINESS_APP_URL") || "https://flow-leads-dusky.vercel.app";
}

function apiUrl(): string {
  return (optionalEnv("UNIPILE_API_URL") || "https://api.unipile.com").replace(/\/+$/, "");
}

function redirectWithResult(key: "connected" | "error", value: string): Response {
  const target = new URL("/dashboard", appUrl());
  target.searchParams.set("secao", "instagram");
  target.searchParams.set("instagram_view", "accounts");
  target.searchParams.set(`flow_business_${key}`, value);
  return Response.redirect(target.toString(), 302);
}

function adminClient(): AdminClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordAt(value: JsonRecord, key: string): JsonRecord | null {
  return isRecord(value[key]) ? value[key] : null;
}

function firstString(records: Array<JsonRecord | null>, keys: string[]): string | null {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  }
  return null;
}

async function authenticatedContext(req: Request, admin: AdminClient) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("unauthorized");
  const { data, error } = await admin.auth.getUser(authHeader.slice(7));
  if (error || !data.user) throw new Error("unauthorized");
  const { data: membership, error: membershipError } = await admin
    .from("memberships")
    .select("org_id")
    .eq("user_id", data.user.id)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) throw new Error("organization_not_found");
  return { userId: data.user.id, orgId: membership.org_id as string };
}

async function assertAccountCapacity(admin: AdminClient, orgId: string) {
  const { data, error } = await admin.rpc("flow_business_plan_snapshot", { p_org: orgId });
  if (error || !isRecord(data)) throw error || new Error("plan_not_found");
  const limits = recordAt(data, "limits");
  const used = recordAt(data, "used");
  const rawLimit = limits?.accounts;
  if (rawLimit !== null && typeof rawLimit !== "number") throw new Error("plan_not_found");
  const limit = rawLimit;
  const current = typeof used?.accounts === "number" ? used.accounts : 0;
  if (limit !== null && current >= limit) throw new Error("flow_business_limit:accounts");
}

async function startConnection(req: Request, admin: AdminClient): Promise<Response> {
  const { userId, orgId } = await authenticatedContext(req, admin);
  await assertAccountCapacity(admin, orgId);
  const apiKey = env("UNIPILE_API_KEY");
  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const { error: stateError } = await admin.from("instagram_oauth_states").insert({
    state,
    org_id: orgId,
    user_id: userId,
    provider: "unipile",
    redirect_to: "/dashboard?secao=instagram&instagram_view=accounts",
  });
  if (stateError) throw stateError;

  const callback = new URL(
    optionalEnv("FLOW_BUSINESS_UNIPILE_REDIRECT_URL") ||
      `${env("SUPABASE_URL")}/functions/v1/flow-business-unipile`,
  );
  callback.searchParams.set("state", state);
  const response = await fetch(`${apiUrl()}/v2/auth/link`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      providers: ["INSTAGRAM"],
      redirect_uri: callback.toString(),
      expires_on: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const payloadRecord = isRecord(payload) ? payload : null;
  const link = firstString(
    [payloadRecord, payloadRecord ? recordAt(payloadRecord, "data") : null],
    ["link", "url"],
  );
  if (!response.ok || !link) throw new Error("unipile_hosted_auth_failed");
  return json({ authorizationUrl: link }, 200, req);
}

async function consumeState(admin: AdminClient, state: string) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("instagram_oauth_states")
    .update({ used_at: now })
    .eq("state", state)
    .eq("provider", "unipile")
    .is("used_at", null)
    .gt("expires_at", now)
    .select("org_id,user_id")
    .maybeSingle();
  if (error || !data) throw new Error("invalid_state");
  return { orgId: data.org_id as string, userId: data.user_id as string };
}

async function accountDetails(accountId: string): Promise<JsonRecord> {
  const response = await fetch(`${apiUrl()}/v2/accounts/${encodeURIComponent(accountId)}`, {
    headers: { "X-API-KEY": env("UNIPILE_API_KEY"), Accept: "application/json" },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRecord(payload)) throw new Error("unipile_account_fetch_failed");
  return isRecord(payload.data) ? payload.data : payload;
}

async function callback(req: Request, admin: AdminClient): Promise<Response> {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  if (!state) return redirectWithResult("error", "invalid_state");
  const context = await consumeState(admin, state);
  if (url.searchParams.get("error_type")) return redirectWithResult("error", "connection_failed");
  const accountId = url.searchParams.get("account_id")?.trim() || "";
  if (!/^acc_[A-Za-z0-9_-]+$/.test(accountId))
    return redirectWithResult("error", "account_missing");

  await assertAccountCapacity(admin, context.orgId);
  const account = await accountDetails(accountId);
  const provider = firstString([account], ["provider", "type"]);
  if (!provider || provider.toUpperCase() !== "INSTAGRAM")
    return redirectWithResult("error", "invalid_provider");
  const sources = [
    account,
    recordAt(account, "connection_params"),
    recordAt(account, "profile"),
    recordAt(account, "user"),
  ];
  const username = firstString(sources, ["username", "user_name", "identifier", "name"]);
  const displayName = firstString(sources, ["name", "display_name", "username"]) || "Instagram";
  const picture = firstString(sources, ["profile_picture_url", "picture_url", "avatar_url"]);
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("ig_instancias")
    .select("id")
    .eq("org_id", context.orgId)
    .eq("provider", "unipile")
    .eq("external_account_id", accountId)
    .maybeSingle();
  const values = {
    org_id: context.orgId,
    nome: `unipile_${accountId}`,
    username_ig: username,
    status: "conectado",
    provider: "unipile",
    external_account_id: accountId,
    account_type: "alternativa",
    profile_picture_url: picture,
    permissions: ["messaging", "history", "webhooks"],
    connected_by: context.userId,
    connected_at: now,
    error_message: null,
    atualizado_em: now,
  };
  const mutation = existing
    ? admin.from("ig_instancias").update(values).eq("id", existing.id)
    : admin.from("ig_instancias").insert(values);
  const { error } = await mutation;
  if (error) throw error;
  return redirectWithResult("connected", displayName);
}

async function sendMessage(req: Request, admin: AdminClient, body: JsonRecord): Promise<Response> {
  const { orgId } = await authenticatedContext(req, admin);
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!conversationId || !text || text.length > 1000)
    return json({ error: "invalid_message" }, 400, req);
  const { data: conversation } = await admin
    .from("ig_conversas")
    .select("id,instancia_id,external_contact_id")
    .eq("id", conversationId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!conversation) return json({ error: "conversation_not_found" }, 404, req);
  const { data: instance } = await admin
    .from("ig_instancias")
    .select("external_account_id,provider,status")
    .eq("id", conversation.instancia_id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (
    !instance ||
    instance.provider !== "unipile" ||
    instance.status !== "conectado" ||
    !instance.external_account_id
  )
    return json({ error: "alternative_account_required" }, 409, req);

  const response = await fetch(
    `${apiUrl()}/v2/${encodeURIComponent(instance.external_account_id)}/chats/${encodeURIComponent(conversation.external_contact_id)}/messages/send`,
    {
      method: "POST",
      headers: {
        "X-API-KEY": env("UNIPILE_API_KEY"),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    },
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) return json({ error: "instagram_message_failed" }, 502, req);
  const responseRecord = isRecord(payload) ? payload : null;
  const externalMessageId = firstString(
    [responseRecord, responseRecord ? recordAt(responseRecord, "data") : null],
    ["id", "message_id"],
  );
  const now = new Date().toISOString();
  const { error: messageError } = await admin.from("ig_mensagens").insert({
    org_id: orgId,
    conversa_id: conversationId,
    external_message_id: externalMessageId,
    direction: "outbound",
    message_type: "text",
    text,
    timestamp: now,
    delivery_status: "sent",
  });
  if (messageError) throw messageError;
  await admin
    .from("ig_conversas")
    .update({
      last_message_text: text,
      last_message_at: now,
      last_outbound_at: now,
      atualizado_em: now,
    })
    .eq("id", conversationId)
    .eq("org_id", orgId);
  return json({ success: true, messageId: externalMessageId }, 200, req);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const admin = adminClient();
  let requestedAction = "";
  try {
    if (req.method === "GET") return await callback(req, admin);
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, req);
    const body: unknown = await req.json().catch(() => null);
    if (!isRecord(body)) return json({ error: "invalid_body" }, 400, req);
    requestedAction = typeof body.action === "string" ? body.action : "";
    if (body.action === "start") return await startConnection(req, admin);
    if (body.action === "send") return await sendMessage(req, admin, body);
    return json({ error: "invalid_action" }, 400, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("flow-business Instagram connection error", {
      method: req.method,
      message,
    });
    if (req.method === "GET")
      return redirectWithResult(
        "error",
        message.startsWith("missing_config") ? "not_configured" : "connection_failed",
      );
    const status =
      message === "unauthorized"
        ? 401
        : message.startsWith("flow_business_limit")
          ? 409
          : message.startsWith("missing_config")
            ? 503
            : 500;
    const publicError =
      message === "unauthorized"
        ? "unauthorized"
        : message.startsWith("flow_business_limit")
          ? "flow_business_limit"
          : message.startsWith("missing_config")
            ? "instagram_connection_unavailable"
            : requestedAction === "send"
              ? "instagram_message_failed"
              : "instagram_connection_failed";
    return json({ error: publicError }, status, req);
  }
});
