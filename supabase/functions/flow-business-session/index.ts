import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

type AdminClient = ReturnType<typeof createClient>;
type JsonRecord = Record<string, unknown>;

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_config:${name}`);
  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUsername(value: unknown): string {
  if (typeof value !== "string") throw new Error("invalid_username");
  const username = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(username)) throw new Error("invalid_username");
  return username;
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
  const limits = isRecord(data.limits) ? data.limits : {};
  const used = isRecord(data.used) ? data.used : {};
  const limit = typeof limits.accounts === "number" ? limits.accounts : 0;
  const current = typeof used.accounts === "number" ? used.accounts : 0;
  if (current >= limit) throw new Error("flow_business_limit:accounts");
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function callWorker(path: string, payload: JsonRecord) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacHex(env("INSTAGRAM_CONNECTOR_SECRET"), `${timestamp}.${body}`);
  const response = await fetch(`${env("INSTAGRAM_CONNECTOR_URL").replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flow-Timestamp": timestamp,
      "X-Flow-Signature": signature,
    },
    body,
  });
  const result: unknown = await response.json().catch(() => null);
  return { response, result: isRecord(result) ? result : {} };
}

async function connect(req: Request, body: JsonRecord, admin: AdminClient) {
  const { userId, orgId } = await authenticatedContext(req, admin);
  const username = normalizeUsername(body.username);
  if (typeof body.password !== "string" || !body.password) throw new Error("invalid_credentials");
  const verificationCode =
    typeof body.verificationCode === "string" ? body.verificationCode.trim() : "";

  const { data: existing } = await admin
    .from("ig_instancias")
    .select("id")
    .eq("org_id", orgId)
    .eq("provider", "session_worker")
    .eq("username_ig", username)
    .maybeSingle();

  let instanceId = existing?.id as string | undefined;
  if (!instanceId) {
    await assertAccountCapacity(admin, orgId);
    const { data: created, error } = await admin
      .from("ig_instancias")
      .insert({
        org_id: orgId,
        nome: `Instagram @${username}`,
        username_ig: username,
        provider: "session_worker",
        status: "aguardando",
        connected_by: userId,
      })
      .select("id")
      .single();
    if (error || !created) throw error || new Error("connection_record_failed");
    instanceId = created.id as string;
  }

  const { response, result } = await callWorker("/v1/connect", {
    requestId: crypto.randomUUID(),
    instanceId,
    username,
    password: body.password,
    verificationCode,
  });
  const detail = isRecord(result.detail) ? result.detail : null;
  const workerCode =
    typeof result.code === "string"
      ? result.code
      : typeof detail?.code === "string"
        ? detail.code
        : "connection_failed";

  if (response.status === 409 && workerCode === "two_factor_required") {
    await admin
      .from("ig_instancias")
      .update({
        status: "aguardando",
        error_message: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", instanceId)
      .eq("org_id", orgId);
    return json({ needsTwoFactor: true, instanceId }, 200, req);
  }
  if (response.status === 409 && workerCode === "challenge_required") {
    await admin
      .from("ig_instancias")
      .update({
        status: "aguardando",
        error_message: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", instanceId)
      .eq("org_id", orgId);
    return json(
      {
        needsApproval: detail?.mode !== "verification_code",
        needsTwoFactor: detail?.mode === "verification_code",
        instanceId,
      },
      200,
      req,
    );
  }
  if (!response.ok) {
    await admin
      .from("ig_instancias")
      .update({ status: "erro", error_message: workerCode })
      .eq("id", instanceId)
      .eq("org_id", orgId);
    throw new Error(workerCode);
  }

  await admin
    .from("ig_instancias")
    .update({
      status: "conectado",
      username_ig: username,
      account_type: "session",
      connected_at: new Date().toISOString(),
      error_message: null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", instanceId)
    .eq("org_id", orgId);
  const { error: automationStateError } = await admin.from("instagram_automation_accounts").upsert(
    {
      instance_id: instanceId,
      org_id: orgId,
      enabled: false,
      next_poll_at: new Date().toISOString(),
      consecutive_failures: 0,
      paused_reason: null,
      lease_owner: null,
      lease_until: null,
    },
    { onConflict: "instance_id" },
  );
  if (automationStateError) throw automationStateError;
  return json({ connected: true, instanceId, username }, 200, req);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, req);
  try {
    const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body: unknown = await req.json();
    if (!isRecord(body)) throw new Error("invalid_body");
    if (body.action === "connect") return await connect(req, body, admin);
    return json({ error: "invalid_action" }, 400, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "instagram_connection_failed";
    const status =
      message === "unauthorized" ? 401 : message.includes("flow_business_limit") ? 409 : 400;
    const safe = [
      "unauthorized",
      "invalid_username",
      "invalid_credentials",
      "flow_business_limit:accounts",
      "two_factor_required",
      "challenge_required",
      "instagram_connection_failed",
    ].find((code) => message.includes(code));
    return json({ error: safe || "instagram_connection_failed" }, status, req);
  }
});
