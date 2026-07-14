// Edge Function: follow-up-cron (Fase 2) — roda 1x/dia (pg_cron via pg_net).
// Manda 1 SEGUNDA mensagem (D+3) por e-mail (Resend) pra quem recebeu proposta e
// NÃO avançou. "Não respondeu" = por STATUS: só dispara se o lead AINDA está em
// 'proposta_enviada' (se saiu, não cobra). Trava anti-spam/LGPD: 1 follow-up por
// lead, teto/dia (FOLLOWUP_MAX_DIA — sobra pra amanhã), opt-out global respeitado,
// rodapé de descadastro. Protegida por CRON_SECRET (header x-cron-secret).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";

const DEFAULT_FROM = "Flow Leads <onboarding@resend.dev>";
const DIAS = 3;

function followUpCorpo(nome: string, url: string, optout: string): string {
  return [
    `Oi! Passando só pra garantir que você viu a prévia que preparei do novo site${nome ? " da " + nome : ""}:`,
    url,
    "",
    "Fiz pensando em facilitar o contato pelo WhatsApp e passar mais credibilidade. Se fizer sentido, é só responder aqui que a gente ajusta o que você quiser — sem compromisso.",
    "",
    "Um abraço,",
    "Equipe Flow Leads",
    "",
    "—",
    `Se não quiser mais receber estes e-mails, cancele aqui: ${optout}`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET")
    return json({ error: "Método não permitido" }, 405);

  // Auth do cron (segredo compartilhado com o pg_cron).
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret)
    return json({ error: "Não autorizado" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const RESEND = Deno.env.get("RESEND_API_KEY");
  if (!RESEND) return json({ error: "RESEND_API_KEY não configurada" }, 503);
  const from = Deno.env.get("EMAIL_FROM") || DEFAULT_FROM;
  // Teto/dia: env FOLLOWUP_MAX_DIA (default 50). O cron manda body vazio → usa o
  // env; um override opcional `max` no body serve só para teste do teto.
  let bodyMax: unknown;
  if (req.method === "POST") {
    try {
      bodyMax = (await req.json())?.max;
    } catch {
      /* corpo vazio/{} */
    }
  }
  const envTeto = Math.max(1, parseInt(Deno.env.get("FOLLOWUP_MAX_DIA") || "50", 10) || 50);
  const teto = typeof bodyMax === "number" && bodyMax > 0 ? Math.floor(bodyMax) : envTeto;
  const funcsBase = `${SUPABASE_URL}/functions/v1`;

  const agora = new Date();
  const d3 = new Date(agora.getTime() - DIAS * 24 * 60 * 60 * 1000).toISOString();

  // Candidatos: proposta ENVIADA há 3+ dias, sem follow-up, cujo LEAD segue em
  // 'proposta_enviada' (não saiu), sem opt-out e com e-mail. Ordena mais antigo 1º.
  const { data: cands, error: qErr } = await admin
    .from("propostas")
    .select(
      "id, lead_id, corpo, assunto, enviada_em, leads!inner(id, email, business_name, status, email_opt_out, opt_out_token)",
    )
    .eq("status", "enviada")
    .eq("follow_up_count", 0)
    .lte("enviada_em", d3)
    .eq("leads.status", "proposta_enviada")
    .eq("leads.email_opt_out", false)
    .not("leads.email", "is", null)
    .order("enviada_em", { ascending: true })
    .limit(teto);
  if (qErr) return json({ error: qErr.message }, 500);

  const itens: Array<{ lead_id: string; nome: string; message_id: string }> = [];
  const falhas: Array<{ lead_id: string; motivo: string }> = [];
  const leadsFeitos = new Set<string>();

  for (const c of (cands ?? []) as unknown as Array<{
    id: string;
    lead_id: string;
    corpo: string;
    assunto: string;
    leads: {
      id: string;
      email: string;
      business_name: string | null;
      opt_out_token: string | null;
    };
  }>) {
    if (leadsFeitos.has(c.lead_id)) continue; // 1 follow-up por lead por rodada
    const lead = c.leads;
    const email = (lead.email ?? "").trim();
    if (!email) continue;

    // Garante o token de descadastro do lead (link do rodapé).
    let token = lead.opt_out_token;
    if (!token) {
      token = crypto.randomUUID();
      await admin.from("leads").update({ opt_out_token: token }).eq("id", lead.id);
    }
    const optout = `${funcsBase}/opt-out?lead=${lead.id}&t=${token}`;
    const url = c.corpo.match(/https?:\/\/\S+/)?.[0] ?? "";
    const assunto = c.assunto?.startsWith("Re:")
      ? c.assunto
      : `Re: ${c.assunto ?? "sua nova página"}`;
    const corpo = followUpCorpo(lead.business_name ?? "", url, optout);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: assunto, text: corpo }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      falhas.push({
        lead_id: c.lead_id,
        motivo: `Resend: ${data?.message ?? "HTTP " + res.status}`,
      });
      continue; // não marca — tenta de novo amanhã
    }

    await admin
      .from("propostas")
      .update({
        follow_up_enviado_em: agora.toISOString(),
        follow_up_count: 1,
        follow_up_message_id: data.id,
      })
      .eq("id", c.id);
    leadsFeitos.add(c.lead_id);
    itens.push({ lead_id: c.lead_id, nome: lead.business_name ?? "", message_id: data.id });
  }

  return json({
    ok: true,
    agora: agora.toISOString(),
    d3_corte: d3,
    teto,
    candidatos: (cands ?? []).length,
    enviados: itens.length,
    itens,
    falhas,
  });
});
