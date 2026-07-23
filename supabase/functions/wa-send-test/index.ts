// Edge: wa-send-test — envia 1 mensagem de teste pelo WhatsApp DA ORG do usuário logado.
//
// 🔒 CORREÇÃO DO INCIDENTE: esta edge NÃO tinha getUser e enviava pela instância GLOBAL —
// ou seja, a org B mandava mensagem pelo número da org A. Agora: AUTH OBRIGATÓRIA e o envio
// usa SEMPRE o token da instância da própria org (resolvida pelo user_id do JWT). A edge não
// aceita nome/id/token de instância vindo do cliente — não há como apontar para outra org.
// ⚠️ PEÇA 1 = só PROVAR conexão. NÃO é disparo em massa/proposta por WhatsApp (peça 2).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  resolverInstanciaDaOrg,
  statusInstancia,
  sincronizarInstancia,
  waBase,
  inicializarCofreWa,
} from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  // 🔐 Cofre de chaves: EVOLUTION_URL/EVOLUTION_API_KEY passam a valer o override do painel.
  await inicializarCofreWa(admin);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  // AUTH OBRIGATÓRIA — a org sai do JWT, nunca do corpo.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  let body: { number?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const number = (body.number || "").replace(/\D/g, "");
  if (number.length < 12)
    return json({ error: "Número inválido — use DDI+DDD (ex.: 5511987654321)." }, 400);
  const text =
    (body.text || "").trim() || "✅ Teste do Flow Leads — conexão do WhatsApp funcionando!";

  // Instância DA ORG (não cria: se ela não tem, não há o que enviar).
  const inst = await resolverInstanciaDaOrg(admin, userId, false);
  if (!inst)
    return json({
      ok: false,
      error: "A sua org ainda não tem WhatsApp — conecte o seu número primeiro.",
    });
  const st = await statusInstancia(inst.token);
  await sincronizarInstancia(admin, inst, st);
  if (!st?.loggedIn)
    return json({
      ok: false,
      error: "O seu WhatsApp não está conectado — pareie o seu número primeiro.",
    });

  const r = await fetch(`${waBase()}/send/text`, {
    method: "POST",
    headers: { apikey: inst.token, "Content-Type": "application/json" },
    body: JSON.stringify({ number, text }),
  });
  const raw = await r.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  if (!r.ok)
    return json({
      ok: false,
      error: `Evolution: ${data?.error ?? data?.message ?? "HTTP " + r.status}`,
      evolution: data,
    });
  return json({ ok: true, para: number, evolution: data });
});
