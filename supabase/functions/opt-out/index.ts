// Edge Function: opt-out (LGPD, PÚBLICA — verify_jwt=false). Link do rodapé do
// follow-up. GET mostra uma página de CONFIRMAÇÃO (evita descadastro acidental por
// scanner de e-mail que só faz GET); o POST do botão efetiva o opt-out global do
// lead (email_opt_out=true) — dali em diante nada mais é enviado (proposta E follow-up).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

function page(titulo: string, corpo: string): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${titulo}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0;display:grid;place-items:center;min-height:100vh;margin:0}
.card{background:#111c2e;border:1px solid #24344a;border-radius:16px;padding:36px 32px;max-width:440px;text-align:center;box-shadow:0 20px 60px -20px rgba(0,0,0,.6)}
h1{font-size:1.3rem;margin:0 0 10px}p{color:#9db0c2;line-height:1.6}
button{margin-top:18px;background:#c9a24b;color:#17130a;border:0;border-radius:10px;padding:12px 22px;font-weight:700;font-size:.98rem;cursor:pointer}
button:hover{filter:brightness(1.05)}</style></head><body><div class="card">${corpo}</div></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead") ?? "";
  const token = url.searchParams.get("t") ?? "";
  if (!leadId || !token)
    return page(
      "Link inválido",
      "<h1>Link inválido</h1><p>Este link de descadastro está incompleto.</p>",
    );

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data: lead } = await admin
    .from("leads")
    .select("id, business_name, opt_out_token, email_opt_out")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead || !lead.opt_out_token || lead.opt_out_token !== token)
    return page(
      "Link inválido",
      "<h1>Link inválido</h1><p>Não foi possível validar este descadastro.</p>",
    );

  if (lead.email_opt_out)
    return page(
      "Já descadastrado",
      `<h1>Tudo certo ✓</h1><p>Você já não recebe mais e-mails nossos.</p>`,
    );

  // GET = mostra confirmação (não efetiva — evita opt-out por prefetch de scanner).
  if (req.method === "GET") {
    return page(
      "Cancelar e-mails",
      `<h1>Não receber mais e-mails?</h1><p>Confirme abaixo para parar de receber mensagens sobre ${lead.business_name ?? "o seu negócio"}.</p>
<form method="POST"><button type="submit">Confirmar descadastro</button></form>`,
    );
  }

  // POST = efetiva o opt-out global.
  await admin
    .from("leads")
    .update({ email_opt_out: true, email_opt_out_em: new Date().toISOString() })
    .eq("id", leadId);
  return page(
    "Descadastrado",
    "<h1>Pronto ✓</h1><p>Você não receberá mais e-mails nossos. Obrigado!</p>",
  );
});
