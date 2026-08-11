// Edge Function: resend-webhook (PÚBLICA — verify_jwt=false).
// Recebe eventos do Resend (email.sent, email.delivered, email.opened, email.clicked, email.bounced)
// e atualiza as colunas de rastreamento da proposta (aberta_em, clicada_em, bounced_at).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Body JSON inválido" }, 400);
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
