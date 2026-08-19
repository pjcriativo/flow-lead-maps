import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  inicializarCofreIg,
  evoBase,
  evoGlobalKey
} from "../_shared/ig.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  await inicializarCofreIg(admin);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Sem auth" }, 401);

  const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) return json({ error: "Inválido" }, 401);

  const body = await req.json().catch(() => ({}));
  let orgId = body.orgId;
  const conversaId = body.conversaId;
  const text = body.text;

  if (!orgId) {
    const { data: membro } = await admin.from('memberships').select('org_id').eq('user_id', user.id).limit(1).maybeSingle();
    if (membro) orgId = membro.org_id;
  }

  if (!orgId || !conversaId || !text) return json({ error: "Faltam parametros" }, 400);

  const { data: checkMembro } = await admin.from('memberships').select('id').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if (!checkMembro) return json({ error: "Não pertence a org" }, 403);

  const { data: conv } = await admin
    .from("ig_conversas")
    .select("external_contact_id, instancia_id")
    .eq("id", conversaId)
    .eq("org_id", orgId)
    .maybeSingle();
    
  if (!conv) return json({ error: "Conversa não encontrada" }, 404);

  const { data: inst } = await admin.from("ig_instancias").select("nome").eq("id", conv.instancia_id).maybeSingle();
  if (!inst) return json({ error: "Instancia não encontrada" }, 404);

  const r = await fetch(`${evoBase()}/message/sendText/${inst.nome}`, {
    method: "POST",
    headers: { apikey: evoGlobalKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      number: conv.external_contact_id,
      text: text
    }),
  });

  if (!r.ok) {
    return json({ error: "Falha na Evolution API" }, 500);
  }
  
  const rJson = await r.json().catch(()=>({}));

  await admin.from("ig_mensagens").insert({
    org_id: orgId,
    conversa_id: conversaId,
    direction: "outbound",
    text: text,
    message_type: "text",
    timestamp: new Date().toISOString()
  });

  await admin.from("ig_conversas").update({
    last_message_text: text,
    last_message_at: new Date().toISOString()
  }).eq("id", conversaId);

  return json({ success: true, evolution: rJson });
});
