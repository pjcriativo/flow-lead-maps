// Edge: wa-connect (WhatsApp peça 1). Cria/lê a instância dedicada na Evolution GO
// e devolve o QR (pra parear o número dedicado) ou o status "conectado". Secrets
// EVOLUTION_URL/API_KEY só no servidor. NÃO envia nada, NÃO mexe em leads.
import { corsHeaders, json } from "../_shared/cors.ts";
import { resolverInstancia, statusInstancia, waBase } from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET")
    return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  const inst = await resolverInstancia(true);
  if (!inst)
    return json({
      status: "erro",
      error: "Não foi possível criar/ler a instância na Evolution GO",
    });

  const st = await statusInstancia(inst.token);
  if (st?.loggedIn) {
    return json({ status: "conectado", instancia: inst.name, numero: inst.jid || st.name });
  }

  // Ainda não pareado → busca o QR (GET /instance/qr com o token da instância).
  const q = await fetch(`${waBase()}/instance/qr`, { headers: { apikey: inst.token } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qj: any = await q.json().catch(() => ({}));
  const qr = qj?.data?.Qrcode || "";
  if (!qr)
    return json({
      status: "aguardando",
      instancia: inst.name,
      aviso: "QR ainda não disponível — tente novamente em instantes.",
    });
  return json({ status: "qr", instancia: inst.name, qr });
});
