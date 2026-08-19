import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const payload = await req.json().catch(() => ({}));
  const event = payload.event;
  const instanceName = payload.instance;
  const data = payload.data;

  if (!instanceName || !data) return new Response("OK");

  const { data: inst } = await admin
    .from("ig_instancias")
    .select("id, org_id")
    .eq("nome", instanceName)
    .maybeSingle();

  if (!inst) return new Response("Instância ignorada");

  if (event === "MESSAGES_UPSERT") {
    const message = data.message || data.messages?.[0] || data;
    if (!message || !message.key) return new Response("No message");

    const remoteJid = message.key?.remoteJid;
    const fromMe = message.key?.fromMe;
    
    const pushName = message.pushName || remoteJid;
    
    // O texto da Evolution pode vir em vários lugares
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || 
                 message.text || 
                 "";

    const { data: conv, error: convErr } = await admin.from("ig_conversas").upsert({
      org_id: inst.org_id,
      instancia_id: inst.id,
      external_contact_id: remoteJid,
      external_contact_name: pushName,
      last_message_text: text || "[Mídia]",
      last_message_at: message.messageTimestamp ? new Date(message.messageTimestamp * 1000).toISOString() : new Date().toISOString()
    }, { onConflict: 'instancia_id,external_contact_id' }).select('id').single();

    if (convErr || !conv) {
      console.error("Erro upsert conv", convErr);
      return new Response("Conv err");
    }

    const { error: msgErr } = await admin.from("ig_mensagens").upsert({
      org_id: inst.org_id,
      conversa_id: conv.id,
      external_message_id: message.key?.id,
      direction: fromMe ? "outbound" : "inbound",
      text: text,
      message_type: text ? "text" : "media",
      timestamp: message.messageTimestamp ? new Date(message.messageTimestamp * 1000).toISOString() : new Date().toISOString()
    }, { onConflict: 'external_message_id' });
    
    if(msgErr) console.error("Erro upsert msg", msgErr);
  }

  return new Response("OK");
});
