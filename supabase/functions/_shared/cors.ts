// CORS compartilhado entre as Edge Functions.
// 🔒 HARDENING: origin restrito aos domínios do Flow Business (antes era "*").

const ALLOWED_ORIGINS = [
  "https://business.flowgenius.com.br",
  "https://flow-leads-dusky.vercel.app",
  "https://flowleads.com.br",
  "https://www.flowleads.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
];

/** Retorna os CORS headers com o origin validado contra a allowlist. */
export function corsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : null;
  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-region, x-supabase-api-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function corsPreflightResponse(req: Request): Response {
  return new Response("ok", { status: 200, headers: corsHeaders(req) });
}

export function json(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/**
 * Envolve o handler da Edge e garante os headers CORS em TODA resposta (inclusive erros e exceções).
 * Evita depender de cada `json(...)` receber o `req`: sem isso o navegador bloqueia a resposta por CORS
 * mesmo quando a função respondeu corretamente.
 */
export function comCors(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    let res: Response;
    try {
      res = await handler(req);
    } catch (e) {
      console.error("edge:", e instanceof Error ? e.message : "erro");
      res = new Response(JSON.stringify({ ok: false, reason: "erro_interno" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const h = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders(req))) if (!h.has(k)) h.set(k, v);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  };
}
