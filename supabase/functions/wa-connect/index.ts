// Edge: wa-connect (WhatsApp peça 1). Cria/lê a instância dedicada na Evolution GO
// e devolve o QR (pra parear o número dedicado) ou o status "conectado". Secrets
// EVOLUTION_URL/API_KEY só no servidor. NÃO envia nada, NÃO mexe em leads.
// body {fresh:true} (clique explícito em "Conectar") RECRIA a sessão p/ um QR novo,
// porque a Evolution GO devolve um QR ESTÁTICO válido só ~60s; o polling manda
// {} e só relê status/QR atual (não recria, pra não matar o pareamento em curso).
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  resolverInstancia,
  recriarInstancia,
  statusInstancia,
  pairInstancia,
  waBase,
} from "../_shared/wa.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET")
    return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  let fresh = false;
  let phone = "";
  try {
    const b = await req.json();
    fresh = !!b?.fresh;
    phone = (b?.phone || "").replace(/\D/g, "");
  } catch {
    /* corpo vazio */
  }

  let inst = await resolverInstancia(true);
  if (!inst)
    return json({
      status: "erro",
      error: "Não foi possível criar/ler a instância na Evolution GO",
    });

  const st = await statusInstancia(inst.token);
  if (st?.loggedIn) {
    return json({ status: "conectado", instancia: inst.name, numero: inst.jid || st.name });
  }

  // CÓDIGO DE PAREAMENTO (recomendado): recria a sessão e gera o código do número.
  // Mais confiável que o QR (que é estático e expira em ~60s).
  if (phone && phone.length >= 12) {
    const nova = await recriarInstancia();
    if (nova) {
      inst = nova;
      await sleep(2500);
    }
    const code = await pairInstancia(inst.token, phone);
    if (!code)
      return json({ status: "erro", error: "Não foi possível gerar o código de pareamento." });
    return json({ status: "code", instancia: inst.name, code });
  }

  // Clique explícito em "Conectar" (QR) → recria a sessão para um QR fresco (~60s).
  if (fresh) {
    const nova = await recriarInstancia();
    if (nova) {
      inst = nova;
      await sleep(2500); // dá tempo do socket subir e gerar o QR
    }
  }

  // Busca o QR (GET /instance/qr com o token da instância).
  const q = await fetch(`${waBase()}/instance/qr`, { headers: { apikey: inst.token } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qj: any = await q.json().catch(() => ({}));
  const qr = qj?.data?.Qrcode || "";
  if (!qr)
    return json({
      status: "aguardando",
      instancia: inst.name,
      aviso: "QR ainda não disponível — clique em Conectar novamente.",
    });
  return json({ status: "qr", instancia: inst.name, qr });
});
