import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

type JsonRecord = Record<string, unknown>;

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_config:${name}`);
  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1)
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function signatureIsValid(rawBody: string, header: string | null): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v0 || "";
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300 || !signature)
    return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("UNIPILE_WEBHOOK_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(signed), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return constantTimeEqual(expected, signature.toLowerCase());
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const rawBody = await req.text();
  if (!(await signatureIsValid(rawBody, req.headers.get("unipile-signature"))))
    return json({ error: "invalid_signature" }, 403);
  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!isRecord(event)) return json({ error: "invalid_event" }, 400);
  const type = typeof event.type === "string" ? event.type : "";
  const accountId = typeof event.account_id === "string" ? event.account_id : "";
  const accountProvider =
    typeof event.account_provider === "string" ? event.account_provider.toUpperCase() : "";
  if (!accountId || accountProvider !== "INSTAGRAM") return json({ received: true, ignored: true });

  const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (type.startsWith("account.status.")) {
    const status = type === "account.status.running" ? "conectado" : "erro";
    await admin
      .from("ig_instancias")
      .update({
        status,
        error_message: status === "erro" ? type : null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("provider", "unipile")
      .eq("external_account_id", accountId);
    return json({ received: true });
  }
  if (type !== "message.new" || !isRecord(event.payload))
    return json({ received: true, ignored: true });

  const message = event.payload;
  const messageId = typeof message.id === "string" ? message.id : "";
  const chatId = typeof message.chat_id === "string" ? message.chat_id : "";
  if (!messageId || !chatId) return json({ error: "invalid_message" }, 400);
  const isSender = message.is_sender === true;
  const occurredAt =
    typeof message.timestamp === "string"
      ? message.timestamp
      : typeof event.created_at === "string"
        ? event.created_at
        : new Date().toISOString();
  const { data, error } = await admin.rpc("flow_business_ingest_unipile_message", {
    p_account_id: accountId,
    p_chat_id: chatId,
    p_external_message_id: messageId,
    p_sender_id: typeof message.sender_id === "string" ? message.sender_id : "",
    p_sender_name:
      typeof message.sender_name === "string"
        ? message.sender_name
        : typeof message.sender_id === "string"
          ? message.sender_id
          : "Instagram",
    p_text: typeof message.text === "string" ? message.text : "",
    p_direction: isSender ? "outbound" : "inbound",
    p_occurred_at: occurredAt,
    p_metadata: message,
  });
  if (error) return json({ error: "ingestion_failed" }, 500);
  return json({ received: true, result: data });
});
