// Edge: wa-send-test (WhatsApp peça 1). Envia 1 mensagem de texto de TESTE para um
// número informado (o do próprio dono), via Evolution GO (POST /send/text com o
// token da instância). Mostra o erro/sucesso REAL da Evolution — não mascara.
// ⚠️ PEÇA 1 = só PROVAR conexão. NÃO É disparo em massa/proposta/follow-up por
// WhatsApp nem seleção de leads — isso é peça 2 (depois do aquecimento de chip).
import { corsHeaders, json } from "../_shared/cors.ts";
import { resolverInstancia, statusInstancia, waBase } from "../_shared/wa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

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

  const inst = await resolverInstancia(false);
  if (!inst)
    return json({ ok: false, error: "Instância não existe — conecte o WhatsApp primeiro." });
  const st = await statusInstancia(inst.token);
  if (!st?.loggedIn)
    return json({ ok: false, error: "WhatsApp não está conectado — pareie o QR primeiro." });

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
