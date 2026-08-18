// Edge Function: resend-webhook (PÚBLICA — verify_jwt=false).
// Recebe eventos do Resend (email.sent, email.delivered, email.opened, email.clicked, email.bounced)
// e atualiza as colunas de rastreamento da proposta (aberta_em, clicada_em, bounced_at).
//
// 🔒 HARDENING: validação HMAC-SHA256 via headers Svix (svix-id, svix-timestamp, svix-signature).
// O signing secret é configurado no painel do Resend → Webhooks e armazenado como env
// RESEND_WEBHOOK_SECRET no Supabase. Sem o secret, rejeita com 401.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

// ---------- Svix signature verification ----------
// O Resend usa Svix (https://docs.svix.com/receiving/verifying-payloads/how)
// para assinar os payloads. O formato do secret é "whsec_<base64>".
async function verificarAssinatura(
  req: Request,
  rawBody: string,
): Promise<boolean> {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  // Se o secret não está configurado, rejeitamos por segurança.
  // Para desativar a verificação temporariamente, defina RESEND_WEBHOOK_SECRET=SKIP.
  if (!secret) return false;
  if (secret === "SKIP") return true; // escape hatch para migração

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Rejeitar timestamps com mais de 5 minutos de drift (anti-replay)
  const ts = parseInt(svixTimestamp, 10);
  const agora = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(agora - ts) > 300) return false;

  // O secret do Resend/Svix vem como "whsec_<base64>"
  const secretBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));

  // Mensagem assinada = "${svix-id}.${svix-timestamp}.${body}"
  const mensagem = `${svixId}.${svixTimestamp}.${rawBody}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(mensagem));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // O header pode ter múltiplas assinaturas separadas por espaço: "v1,<base64> v1,<base64>"
  const assinaturas = svixSignature.split(" ");
  for (const entry of assinaturas) {
    const [version, value] = entry.split(",", 2);
    if (version === "v1" && value === expected) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, req);

  // Ler o body como texto ANTES de parsear (necessário para verificar a assinatura)
  const rawBody = await req.text().catch(() => "");
  if (!rawBody) return json({ error: "Body vazio" }, 400, req);

  // 🔒 Anti-spoof: verificar assinatura Svix ANTES de processar qualquer coisa
  const valido = await verificarAssinatura(req, rawBody);
  if (!valido) return json({ error: "Assinatura inválida" }, 401, req);

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Body JSON inválido" }, 400, req);
  }

  const eventType: string = payload?.type || "";
  const data = payload?.data || {};
  const emailId: string = data?.email_id || data?.id || "";

  if (!emailId || !eventType) {
    return json({ ok: true, ignored: true, reason: "payload sem email_id ou tipo" });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const agora = new Date().toISOString();
  const timestamp = data?.created_at || payload?.created_at || agora;

  if (eventType === "email.opened") {
    // Registra primeira abertura no e-mail principal ou no follow-up
    await admin
      .from("propostas")
      .update({ aberta_em: timestamp })
      .or(`email_message_id.eq.${emailId},follow_up_message_id.eq.${emailId}`)
      .is("aberta_em", null);
  } else if (eventType === "email.clicked") {
    // Registra primeiro clique no link
    await admin
      .from("propostas")
      .update({ clicada_em: timestamp })
      .or(`email_message_id.eq.${emailId},follow_up_message_id.eq.${emailId}`)
      .is("clicada_em", null);
  } else if (eventType === "email.bounced") {
    // Registra falha de entrega (bounce)
    await admin
      .from("propostas")
      .update({ bounced_at: timestamp })
      .or(`email_message_id.eq.${emailId},follow_up_message_id.eq.${emailId}`)
      .is("bounced_at", null);
  }

  return json({ ok: true, type: eventType, email_id: emailId });
});
