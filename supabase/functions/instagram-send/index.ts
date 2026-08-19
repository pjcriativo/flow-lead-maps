import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing Authorization header", { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { conversationId, text, mediaUrl } = await req.json();
    if (!conversationId || (!text && !mediaUrl)) {
      return json({ error: "Parâmetros inválidos" }, 400);
    }

    // Buscar a conversa, account e garantir que o usuário pertence a org (via RLS)
    const { data: conversation, error: convError } = await supabase
      .from("instagram_conversations")
      .select("*, instagram_accounts(access_token, facebook_page_id)")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return json({ error: "Conversa não encontrada ou acesso negado" }, 404);
    }

    const account = conversation.instagram_accounts;
    const recipientId = conversation.external_contact_id;
    const pageToken = account.access_token;
    const pageId = account.facebook_page_id;

    let payload: any = {
      recipient: { id: recipientId },
      message: {}
    };

    if (mediaUrl) {
      // Simplificado, pode ser image, video, document baseado na extensao
      payload.message.attachment = {
        type: "image", 
        payload: { url: mediaUrl, is_reusable: true }
      };
    } else {
      payload.message.text = text;
    }

    // Call Meta API
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pageToken}`
      },
      body: JSON.stringify(payload)
    });

    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      console.error("Erro Meta API:", metaData);
      return json({ error: "Erro ao enviar na Meta", details: metaData }, 400);
    }

    // Insert message into DB using service role because RLS might need it immediately 
    // or we can just use the authenticated supabase client. Let's use authenticated.
    const { data: newMessage, error: msgError } = await supabase
      .from("instagram_messages")
      .insert({
        org_id: conversation.org_id,
        conversation_id: conversationId,
        external_message_id: metaData.message_id,
        direction: "outbound",
        message_type: mediaUrl ? "image" : "text",
        text: text,
        media_url: mediaUrl,
        is_read: true // Outbound messages are inherently read
      })
      .select("*")
      .single();
      
    if (msgError) {
      console.error("Erro ao salvar mensagem no db:", msgError);
    }

    return json({ success: true, message: newMessage });
  } catch (err) {
    console.error("Erro no instagram-send:", err);
    return json({ error: "Internal Server Error" }, 500);
  }
});
