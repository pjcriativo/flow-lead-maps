import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import {
  enviarTextoInstancia,
  inicializarCofreWa,
  resolverInstanciaDaOrg,
  sincronizarInstancia,
  statusInstancia,
  waBase,
} from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 422);
  }

  let context;
  try {
    context = await authorizeWhatsappRequest({
      admin,
      userClient,
      requestedOrgId: body.org_id,
      permission: "manage_numbers",
    });
  } catch (error) {
    const failure = whatsappAuthorizationFailure(error);
    return json({ error: failure.message }, failure.status);
  }

  const number = String(body.number || "").replace(/\D/g, "");
  const text = String(body.text || "").trim() || "Teste de conexão do WhatsApp do Flow Business.";
  if (number.length < 12) return json({ error: "Número inválido." }, 422);

  await inicializarCofreWa(admin);
  if (!waBase()) return json({ error: "Integração WhatsApp indisponível." }, 503);
  const scope = { userId: context.userId, orgId: context.orgId };
  const instance = await resolverInstanciaDaOrg(admin, scope, false);
  if (!instance) return json({ error: "Nenhum número autorizado está configurado." }, 409);
  const status = await statusInstancia(instance.token);
  await sincronizarInstancia(admin, instance, status);
  if (!status?.loggedIn) return json({ error: "O número autorizado não está conectado." }, 409);

  const result = await enviarTextoInstancia(instance.token, number, text);
  if (!result.ok) return json({ error: "Não foi possível enviar a mensagem de teste." }, 409);
  return json({ ok: true });
});
