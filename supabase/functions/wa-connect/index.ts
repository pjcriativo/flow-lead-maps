import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json as jsonResponse } from "../_shared/cors.ts";
import {
  authorizeWhatsappRequest,
  whatsappAuthorizationFailure,
} from "../_shared/whatsapp-authorization.ts";
import {
  inicializarCofreWa,
  EvolutionGoPairingError,
  pairInstancia,
  qrInstancia,
  resolverInstanciaDaOrg,
  sincronizarInstancia,
  statusInstancia,
  waBase,
} from "../_shared/wa.ts";

Deno.serve(async (req) => {
  // Toda resposta leva os headers de CORS do domínio chamador (antes saíam sem origem e o
  // navegador bloqueava a leitura, escondendo o resultado real da operação).
  const json = (body: unknown, status = 200) => jsonResponse(body, status, req);
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
  const scope = { userId: context.userId, orgId: context.orgId };

  await inicializarCofreWa(admin);
  if (!waBase()) return json({ error: "Integração WhatsApp indisponível." }, 503);

  const fresh = body.fresh === true;
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (body.phone !== undefined && phone.length < 12) {
    return json({ error: "Número inválido (DDI+DDD)." }, 422);
  }

  if (phone) {
    const instance = await resolverInstanciaDaOrg(admin, scope, true);
    if (!instance) return json({ error: "Não foi possível preparar a instância." }, 409);
    let code: string | null;
    try {
      code = await pairInstancia(instance.token, phone);
    } catch (error) {
      if (error instanceof EvolutionGoPairingError) {
        return json({ error: error.message }, error.status);
      }
      throw error;
    }
    if (!code) return json({ error: "Não foi possível gerar o código de pareamento." }, 409);
    return json({ status: "code", instancia: instance.nome, code });
  }

  if (fresh) {
    const instance = await resolverInstanciaDaOrg(admin, scope, true);
    if (!instance) return json({ error: "Não foi possível preparar a instância." }, 409);
    let qr: string | null;
    try {
      qr = await qrInstancia(instance.token);
    } catch (error) {
      if (error instanceof EvolutionGoPairingError) {
        return json({ error: error.message }, error.status);
      }
      throw error;
    }
    return qr
      ? json({ status: "qr", instancia: instance.nome, qr, expires_in: 40 })
      : json({ status: "aguardando", instancia: instance.nome });
  }

  const instance = await resolverInstanciaDaOrg(admin, scope, true);
  if (!instance) return json({ error: "Não foi possível ler a instância." }, 409);
  const status = await statusInstancia(instance.token);
  const numero = await sincronizarInstancia(admin, instance, status);
  if (!status) {
    return json({ status: "desconhecido", instancia: instance.nome, numero: instance.numero });
  }
  if (status?.loggedIn) {
    return json({
      status: "conectado",
      instancia: instance.nome,
      numero: numero ?? instance.numero,
    });
  }
  let qr: string | null;
  try {
    qr = await qrInstancia(instance.token);
  } catch (error) {
    if (error instanceof EvolutionGoPairingError) {
      return json({ error: error.message }, error.status);
    }
    throw error;
  }
  return qr
    ? json({ status: "qr", instancia: instance.nome, qr, expires_in: 40 })
    : json({ status: "aguardando", instancia: instance.nome });
});
