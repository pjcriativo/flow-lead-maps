// Edge: wa-connect — conecta o WhatsApp DA ORG do usuário logado (multi-tenant).
//
// 🔒 CORREÇÃO DO INCIDENTE: esta edge NÃO tinha getUser e operava numa instância GLOBAL
// ("flowleads") — qualquer org via/usava a de outra. Agora: AUTH OBRIGATÓRIA (getUser) e a
// instância é resolvida SEMPRE pelo user_id do caller (wa_instancias.nome ARMAZENADO). Não
// aceita nome/id de instância vindo do cliente, não lista instância de outra org, e recriar
// (QR/código) mexe SÓ na instância da própria org — nunca derruba a conexão de outra (o DoS).
//
// Secrets EVOLUTION_URL/EVOLUTION_API_KEY seguem só no servidor e servem apenas para
// GERENCIAR instâncias; o token de cada org vive em wa_instancia_tokens (RLS sem policy).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  resolverInstanciaDaOrg,
  recriarInstanciaDaOrg,
  statusInstancia,
  sincronizarInstancia,
  pairInstancia,
  qrInstancia,
  waBase,
} from "../_shared/wa.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET")
    return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  // AUTH OBRIGATÓRIA — a org sai do JWT, nunca do corpo da requisição.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  // service_role só para as tabelas wa_* (inacessíveis ao cliente).
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let fresh = false;
  let phone = "";
  if (req.method === "POST") {
    try {
      const b = await req.json();
      fresh = !!b?.fresh;
      phone = (b?.phone || "").replace(/\D/g, "");
    } catch {
      /* corpo vazio */
    }
  }

  // CÓDIGO DE PAREAMENTO (recomendado): recria a instância DA ORG e gera o código.
  if (phone && phone.length >= 12) {
    const nova = await recriarInstanciaDaOrg(admin, userId);
    if (!nova) return json({ status: "erro", error: "Não foi possível preparar a sua instância." });
    await sleep(2500);
    const code = await pairInstancia(nova.token, phone);
    if (!code)
      return json({ status: "erro", error: "Não foi possível gerar o código de pareamento." });
    return json({ status: "code", instancia: nova.nome, code });
  }

  // Clique explícito em "Conectar" (QR) → recria a instância DA ORG p/ um QR fresco (~60s).
  if (fresh) {
    const nova = await recriarInstanciaDaOrg(admin, userId);
    if (!nova) return json({ status: "erro", error: "Não foi possível preparar a sua instância." });
    await sleep(2500);
    const qr = await qrInstancia(nova.token);
    if (!qr)
      return json({
        status: "aguardando",
        instancia: nova.nome,
        aviso: "QR ainda não disponível — clique em Conectar novamente.",
      });
    return json({ status: "qr", instancia: nova.nome, qr });
  }

  // Polling: lê o status da instância DA ORG (cria a dela se ainda não existir).
  const inst = await resolverInstanciaDaOrg(admin, userId, true);
  if (!inst) return json({ status: "erro", error: "Não foi possível criar/ler a sua instância." });
  const st = await statusInstancia(inst.token);
  const numero = await sincronizarInstancia(admin, inst, st);
  if (st?.loggedIn)
    return json({ status: "conectado", instancia: inst.nome, numero: numero ?? inst.numero });

  const qr = await qrInstancia(inst.token);
  if (!qr)
    return json({
      status: "aguardando",
      instancia: inst.nome,
      aviso: "QR ainda não disponível — clique em Conectar novamente.",
    });
  return json({ status: "qr", instancia: inst.nome, qr });
});
