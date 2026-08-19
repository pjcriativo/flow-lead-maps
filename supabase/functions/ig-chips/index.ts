import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  inicializarCofreIg,
  resolverInstanciaIg,
  definirWebhookInstanciaIg,
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
  const acao = body.acao;
  let orgId = body.orgId;

  if (!orgId) {
    const { data: membro } = await admin.from('memberships').select('org_id').eq('user_id', user.id).limit(1).maybeSingle();
    if (membro) orgId = membro.org_id;
  }

  if (!orgId) return json({ error: "orgId não encontrado" }, 400);

  const { data: checkMembro } = await admin.from('memberships').select('id').eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if (!checkMembro) return json({ error: "Não pertence a org" }, 403);

  if (acao === "listar") {
    const inst = await resolverInstanciaIg(admin, orgId, false);
    // Hide token for security
    if (inst) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (inst as any).token;
    }
    return json({ inst });
  }

  if (acao === "criar") {
    const inst = await resolverInstanciaIg(admin, orgId, true);
    if (inst) {
      await definirWebhookInstanciaIg(inst.nome, inst.token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (inst as any).token;
    }
    return json({ inst });
  }

  return json({ error: "Ação inválida" }, 400);
});
