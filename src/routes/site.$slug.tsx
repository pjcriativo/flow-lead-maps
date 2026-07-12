// Rota PÚBLICA /site/<slug> — serve o HTML do site publicado (Fase 4).
// Abre para QUALQUER pessoa (o lead não é usuário logado): não exige auth.
// Lê via service role (server-side) e só serve sites ativos e não expirados.
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

function paginaAviso(titulo: string, msg: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${titulo}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0}
.box{text-align:center;padding:2rem}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#94a3b8;margin:0}</style>
</head><body><div class="box"><h1>${titulo}</h1><p>${msg}</p></div></body></html>`;
}

export const Route = createFileRoute("/site/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { loadSiteForServe } = await import("@/services/publicacao.core");

        const res = await loadSiteForServe(supabaseAdmin, params.slug);
        if (!res.ok) {
          const titulo =
            res.code === 410
              ? "Site indisponível"
              : res.code === 404
                ? "Site não encontrado"
                : "Erro";
          return new Response(paginaAviso(titulo, res.motivo), {
            status: res.code,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
          });
        }
        return new Response(res.html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            // Sites temporários mudam/expiram — cache curto, revalidável.
            "Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});
