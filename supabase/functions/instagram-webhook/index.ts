import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

// Utiliza crypto do Deno nativo
async function verifySignature(payload: string, signature: string, secret: string) {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) return false;
  
  const signatureHex = signature.slice(expectedPrefix.length);
  const signatureBytes = new Uint8Array(
    signatureHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payload)
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. Webhook Verification (hub.challenge)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VALID_TOKEN = Deno.env.get("INSTAGRAM_WEBHOOK_VERIFY_TOKEN") || "flow_leads_insta_secret";

    if (mode === "subscribe" && token === VALID_TOKEN) {
      console.log("Webhook verificado com sucesso.");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Incoming Messages
  if (req.method === "POST") {
    const payloadText = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET");

    if (appSecret) {
      const isValid = await verifySignature(payloadText, signature, appSecret);
      if (!isValid) {
        console.error("Assinatura do webhook invalida.");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    try {
      const body = JSON.parse(payloadText);
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Meta sends a list of 'entry'
      if (body.object === "instagram") {
        for (const entry of body.entry) {
          const accountId = entry.id; // Instagram Business Account ID
          
          if (!entry.messaging) continue;
          
          for (const event of entry.messaging) {
            const senderId = event.sender.id;
            const recipientId = event.recipient.id; // Should match accountId
            
            // Only process messages sent BY the lead TO the page
            if (senderId === accountId) continue; 
            
            let messageText = null;
            let messageType = 'text';

            if (event.message) {
              messageText = event.message.text;
              if (event.message.attachments) {
                messageType = event.message.attachments[0].type; // image, video, etc
                // Na v1 vamos salvar a URL se existir
                messageText = event.message.attachments[0].payload?.url || messageText; 
              }
            } else if (event.postback) {
              messageText = event.postback.payload;
              messageType = 'postback';
            }

            if (!messageText && messageType === 'text') continue;

            // 1. Achar a conta no DB
            const { data: accounts } = await supabaseAdmin
              .from('instagram_accounts')
              .select('id, org_id')
              .eq('instagram_id', recipientId)
              .eq('status', 'active')
              .limit(1);

            if (!accounts || accounts.length === 0) continue;
            const account = accounts[0];

            // 2. Achar ou criar a conversa
            let { data: convs } = await supabaseAdmin
              .from('instagram_conversations')
              .select('id')
              .eq('account_id', account.id)
              .eq('external_contact_id', senderId)
              .limit(1);

            let conversationId;
            if (!convs || convs.length === 0) {
              const { data: newConv } = await supabaseAdmin
                .from('instagram_conversations')
                .insert({
                  org_id: account.org_id,
                  account_id: account.id,
                  external_contact_id: senderId,
                  last_message_text: messageText,
                  status: 'open'
                })
                .select('id')
                .single();
              conversationId = newConv?.id;
            } else {
              conversationId = convs[0].id;
              // Atualizar ultima mensagem
              await supabaseAdmin
                .from('instagram_conversations')
                .update({ 
                  last_message_text: messageText, 
                  last_message_at: new Date().toISOString(),
                  status: 'open' // reabre se estava fechada
                })
                .eq('id', conversationId);
            }

            // 3. Salvar a mensagem
            if (conversationId) {
              await supabaseAdmin
                .from('instagram_messages')
                .insert({
                  org_id: account.org_id,
                  conversation_id: conversationId,
                  external_message_id: event.message?.mid,
                  direction: 'inbound',
                  message_type: messageType,
                  text: messageType === 'text' || messageType === 'postback' ? messageText : null,
                  media_url: messageType !== 'text' && messageType !== 'postback' ? messageText : null,
                  timestamp: new Date(event.timestamp).toISOString()
                });
            }
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (err) {
      console.error("Erro no processamento do webhook", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
