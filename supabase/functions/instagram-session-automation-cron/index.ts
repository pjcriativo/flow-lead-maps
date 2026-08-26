import { corsHeaders, json } from "../_shared/cors.ts";

type JsonRecord = Record<string, unknown>;

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_config:${name}`);
  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

async function runWorker(maxAccounts: number) {
  const body = JSON.stringify({
    requestId: crypto.randomUUID(),
    maxAccounts,
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacHex(env("INSTAGRAM_CONNECTOR_SECRET"), `${timestamp}.${body}`);
  const response = await fetch(
    `${env("INSTAGRAM_CONNECTOR_URL").replace(/\/+$/, "")}/v1/automation/run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Flow-Timestamp": timestamp,
        "X-Flow-Signature": signature,
      },
      body,
    },
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`worker_http_${response.status}`);
  return isRecord(payload) ? payload : {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, req);

  try {
    const receivedSecret = req.headers.get("x-cron-secret")?.trim();
    if (!receivedSecret || receivedSecret !== env("CRON_SECRET")) {
      return json({ error: "unauthorized" }, 401, req);
    }
    const raw: unknown = await req.json().catch(() => ({}));
    const maxAccounts =
      isRecord(raw) && typeof raw.maxAccounts === "number"
        ? Math.min(1, Math.max(1, Math.trunc(raw.maxAccounts)))
        : 1;
    return json(await runWorker(maxAccounts), 200, req);
  } catch (error) {
    const code =
      error instanceof Error && error.message.startsWith("missing_config:")
        ? "automation_not_configured"
        : "automation_run_failed";
    console.error("Instagram automation cron failed", {
      code,
      error: error instanceof Error ? error.message : "unknown",
    });
    return json({ error: code }, 500, req);
  }
});
