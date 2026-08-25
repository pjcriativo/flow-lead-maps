// CORS compartilhado entre as Edge Functions.
// 🔒 HARDENING: origin restrito aos domínios do Flow Business (antes era "*").

const ALLOWED_ORIGINS = [
  "https://flow-leads-dusky.vercel.app",
  "https://flowleads.com.br",
  "https://www.flowleads.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
];

/** Retorna os CORS headers com o origin validado contra a allowlist. */
export function corsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers?.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function json(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}
