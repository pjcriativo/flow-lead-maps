// Edge: wa-responder — envia a RESPOSTA de uma conversa pelo chip de CONVERSA da org e grava a
// saída em wa_mensagens. AUTH obrigatória (getUser); a org sai do JWT. Usa o chip 'conversa'
// (flowleads) — seu propósito é justamente conversar (nunca dispara a frio).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { waBase, instanciaConversaDaOrg, enviarTextoInstancia } from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let b: { numero?: string; texto?: string };
  try {
    b = await req.json();
  } catch {
    return json({ ok: false, error: "Body inválido" }, 400);
  }
  const numero = String(b.numero || "").replace(/\D/g, "");
  const texto = String(b.texto || "").trim();
  if (numero.length < 12) return json({ ok: false, error: "Número inválido" });
  if (!texto) return json({ ok: false, error: "Mensagem vazia" });

  const chip = await instanciaConversaDaOrg(admin, userId);
  if (!chip) return json({ ok: false, error: "Nenhum chip de conversa conectado." });

  const env = await enviarTextoInstancia(chip.token, numero, texto);
  if (!env.ok) return json({ ok: false, error: `Evolution: ${env.error}` });

  await admin.from("wa_mensagens").insert({
    user_id: userId,
    instancia_id: chip.id,
    numero,
    direcao: "out",
    tipo: "texto",
    texto,
    lida: true,
  });

  return json({ ok: true, chip: chip.numero ?? chip.nome });
});
