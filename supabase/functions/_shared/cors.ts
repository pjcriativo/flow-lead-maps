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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
