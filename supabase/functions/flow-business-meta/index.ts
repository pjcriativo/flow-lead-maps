import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  decryptFlowBusinessToken,
  encryptFlowBusinessToken,
  validateFlowBusinessTokenKey,
} from "../_shared/flow-business-token.ts";
import { messagingWindowIsOpen } from "../_shared/flow-business-policy.ts";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
];

type AdminClient = ReturnType<typeof createClient>;

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_config:${name}`);
  return value;
}

function appUrl(): string {
  return Deno.env.get("FLOW_BUSINESS_APP_URL")?.trim() || "https://flow-leads-dusky.vercel.app";
}

function graphVersion(): string {
  return Deno.env.get("META_GRAPH_VERSION")?.trim() || "v23.0";
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

async function reserveAccountConnection(
  admin: AdminClient,
  input: { state: string; orgId: string; userId: string },
) {
  const { error } = await admin.rpc("flow_business_reserve_instagram_oauth_state", {
    p_state: input.state,
    p_org: input.orgId,
    p_user: input.userId,
    p_provider: "meta_official",
  });
  if (error) throw error;
}

async function startConnection(req: Request, admin: AdminClient): Promise<Response> {
  const { userId, orgId } = await authenticatedContext(req, admin);
  const clientId = env("META_INSTAGRAM_APP_ID");
  const redirectUri = env("FLOW_BUSINESS_META_REDIRECT_URL");
  env("META_INSTAGRAM_APP_SECRET");
  await validateFlowBusinessTokenKey();

  const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  await reserveAccountConnection(admin, { state, orgId, userId });

  const authorization = new URL("https://www.instagram.com/oauth/authorize");
  authorization.searchParams.set("enable_fb_login", "0");
  authorization.searchParams.set("force_authentication", "1");
  authorization.searchParams.set("client_id", clientId);
  authorization.searchParams.set("redirect_uri", redirectUri);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", SCOPES.join(","));
  authorization.searchParams.set("state", state);
  return json({ authorizationUrl: authorization.toString() }, 200, req);
}

async function exchangeCode(code: string) {
  const redirectUri = env("FLOW_BUSINESS_META_REDIRECT_URL");
  const form = new URLSearchParams({
    client_id: env("META_INSTAGRAM_APP_ID"),
    client_secret: env("META_INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const body = await response.json();
  if (!response.ok || typeof body.access_token !== "string")
    throw new Error("oauth_exchange_failed");

  const exchange = new URL("https://graph.instagram.com/access_token");
  exchange.searchParams.set("grant_type", "ig_exchange_token");
  exchange.searchParams.set("client_secret", env("META_INSTAGRAM_APP_SECRET"));
  exchange.searchParams.set("access_token", body.access_token);
  const longResponse = await fetch(exchange);
  const longBody = await longResponse.json();
  if (longResponse.ok && typeof longBody.access_token === "string") {
    return {
      accessToken: longBody.access_token as string,
      expiresIn: Number(longBody.expires_in || 0),
    };
  }
  return { accessToken: body.access_token as string, expiresIn: 0 };
}

async function consumeState(admin: AdminClient, state: string) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("instagram_oauth_states")
    .update({ used_at: now })
    .eq("state", state)
    .eq("provider", "meta_official")
    .is("used_at", null)
    .gt("expires_at", now)
    .select("org_id,user_id")
    .maybeSingle();
  if (error || !data) throw new Error("invalid_state");
  return { orgId: data.org_id as string, userId: data.user_id as string };
}

async function callback(req: Request, admin: AdminClient): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.replace(/#_$/, "");
  const state = url.searchParams.get("state");
  if (!code || !state) return redirectWithResult("error", "oauth_cancelled");

  let oauthState: { orgId: string; userId: string };
  try {
    oauthState = await consumeState(admin, state);
  } catch {
    return redirectWithResult("error", "invalid_state");
  }

  const token = await exchangeCode(code);
  const profileUrl = new URL(`https://graph.instagram.com/${graphVersion()}/me`);
  profileUrl.searchParams.set("fields", "user_id,username,account_type,profile_picture_url");
  profileUrl.searchParams.set("access_token", token.accessToken);
  const profileResponse = await fetch(profileUrl);
  const profile = await profileResponse.json();
  const metaUserId = String(profile.user_id || profile.id || "");
  if (!profileResponse.ok || !metaUserId || typeof profile.username !== "string")
    throw new Error("profile_fetch_failed");

  const expiresAt =
    token.expiresIn > 0 ? new Date(Date.now() + token.expiresIn * 1000).toISOString() : null;
  const { data: instance, error: instanceError } = await admin
    .from("ig_instancias")
    .upsert(
      {
        org_id: oauthState.orgId,
        nome: `meta_${metaUserId}`,
        username_ig: profile.username,
        status: "conectado",
        provider: "meta_official",
        meta_ig_user_id: metaUserId,
        account_type: profile.account_type || null,
        profile_picture_url: profile.profile_picture_url || null,
        permissions: SCOPES,
        token_expires_at: expiresAt,
        connected_by: oauthState.userId,
        connected_at: new Date().toISOString(),
        error_message: null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "org_id,meta_ig_user_id" },
    )
    .select("id")
    .single();
  if (instanceError || !instance) throw instanceError || new Error("instance_save_failed");

  const { error: tokenError } = await admin.from("ig_instancia_tokens").upsert({
    instancia_id: instance.id,
    token: null,
    access_token_ciphertext: await encryptFlowBusinessToken(token.accessToken),
    scopes: SCOPES,
    expires_at: expiresAt,
    atualizado_em: new Date().toISOString(),
  });
  if (tokenError) throw tokenError;
  return redirectWithResult("connected", "true");
}

async function sendMessage(
  req: Request,
  admin: AdminClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const { orgId } = await authenticatedContext(req, admin);
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!conversationId || !text || text.length > 1000)
    return json({ error: "invalid_message" }, 400, req);

  const { data: conversation } = await admin
    .from("ig_conversas")
    .select("id,instancia_id,external_contact_id,messaging_window_expires_at")
    .eq("id", conversationId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!conversation) return json({ error: "conversation_not_found" }, 404, req);
  if (!messagingWindowIsOpen(conversation.messaging_window_expires_at))
    return json({ error: "messaging_window_closed" }, 409, req);

  const { data: instance } = await admin
    .from("ig_instancias")
    .select("id,meta_ig_user_id,provider,status")
    .eq("id", conversation.instancia_id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (
    !instance ||
    instance.provider !== "meta_official" ||
    instance.status !== "conectado" ||
    !instance.meta_ig_user_id
  )
    return json({ error: "official_account_required" }, 409, req);
  const { data: storedToken } = await admin
    .from("ig_instancia_tokens")
    .select("access_token_ciphertext,expires_at")
    .eq("instancia_id", instance.id)
    .maybeSingle();
  if (!storedToken?.access_token_ciphertext)
    return json({ error: "account_token_missing" }, 409, req);
  if (storedToken.expires_at && new Date(storedToken.expires_at).getTime() <= Date.now())
    return json({ error: "account_token_expired" }, 409, req);

  const response = await fetch(
    `https://graph.instagram.com/${graphVersion()}/${instance.meta_ig_user_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await decryptFlowBusinessToken(storedToken.access_token_ciphertext)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: conversation.external_contact_id },
        message: { text },
      }),
    },
  );
  const responseBody = await response.json();
  if (!response.ok) return json({ error: "meta_send_failed" }, 502, req);
  const now = new Date().toISOString();
  await admin.from("ig_mensagens").insert({
    org_id: orgId,
    conversa_id: conversationId,
    external_message_id: responseBody.message_id || null,
    direction: "outbound",
    message_type: "text",
    text,
    timestamp: now,
    delivery_status: "sent",
  });
  await admin
    .from("ig_conversas")
    .update({
      last_message_text: text,
      last_message_at: now,
      last_outbound_at: now,
      atualizado_em: now,
    })
    .eq("id", conversationId);
  return json({ success: true, messageId: responseBody.message_id || null }, 200, req);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  const admin = adminClient();
  try {
    if (req.method === "GET") return await callback(req, admin);
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, req);
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object" || Array.isArray(body))
      return json({ error: "invalid_body" }, 400, req);
    if (body.action === "start") return await startConnection(req, admin);
    if (body.action === "send") return await sendMessage(req, admin, body);
    return json({ error: "invalid_action" }, 400, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    if (req.method === "GET")
      return redirectWithResult(
        "error",
        message.startsWith("missing_config") ? "not_configured" : "connection_failed",
      );
    const status =
      message === "unauthorized"
        ? 401
        : message.startsWith("missing_config") || message.startsWith("invalid_config")
          ? 503
          : 500;
    const safeError =
      message.startsWith("missing_config") || message.startsWith("invalid_config")
        ? "instagram_connection_unavailable"
        : message === "flow_business_limit:accounts"
          ? "flow_business_limit:accounts"
          : message === "unauthorized"
            ? "unauthorized"
            : "instagram_connection_failed";
    return json({ error: safeError }, status, req);
  }
});
