// Edge Function: send-proposal (Fase 2) — ENVIO REAL da proposta por e-mail (Resend).
// Lê/escreve via client do USUÁRIO (RLS pela sessão); a RESEND_API_KEY fica só no
// secret do servidor (Deno.env). Fluxo: valida dono → pega e-mail do lead → envia
// pelo Resend → grava o id da mensagem + marca proposta 'enviada' + move o lead
// para 'proposta_enviada'. Sem e-mail do lead → { ok:false, reason:'sem_email' }
// (a UI cai no "copiar"). Falha do Resend → { ok:false, error } (NÃO marca enviada).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { montarFrom } from "../_shared/remetente.ts";

// Identidade do remetente. EMAIL_FROM é GLOBAL hoje (uma reputação de domínio p/
// todas as orgs). TODO (blueprint — identidade de envio por org): cada org deve ter
// subdomínio/remetente próprio + reply-to da org, para não compartilhar reputação.
// Quando isso existir, ler o remetente da config da org (não do env global).
const DEFAULT_FROM = "Flow Leads <onboarding@resend.dev>";

const SELECT =
  "id, lead_id, assunto, corpo, valor, status, criada_em, enviada_em, respondida_em, email_message_id, email_para, leads(business_name)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

  let propostaId: string | undefined;
  try {
    propostaId = (await req.json())?.proposta_id;
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (!propostaId) return json({ error: "Informe proposta_id" }, 400);

  // Proposta (RLS garante que é do usuário).
  const { data: prop, error: pErr } = await supabase
    .from("propostas")
    .select("id, lead_id, assunto, corpo, status")
    .eq("id", propostaId)
    .single();
  if (pErr || !prop) return json({ error: "Proposta não encontrada" }, 404);

  // PORTÃO DE REVISÃO (FIX 1): nada sai sem aprovação humana. Só envia 'aprovada'.
  // Trava no SERVIDOR — mesmo que a UI mande um rascunho, aqui é recusado. Se já
  // foi enviada, também não reenvia. O corpo enviado é o texto aprovado (prop.corpo),
  // sem regenerar nada por cima.
  if (prop.status !== "aprovada") return json({ ok: false, reason: "nao_aprovada" });

  // E-mail do lead (o enrich da Fase 1 preenche quando acha) + opt-out.
  const { data: lead } = await supabase
    .from("leads")
    .select("id, email, business_name, email_opt_out")
    .eq("id", prop.lead_id)
    .single();
  // Opt-out GLOBAL (LGPD): nunca envia a quem pediu descadastro.
  if (lead?.email_opt_out) return json({ ok: false, reason: "opt_out" });
  const email = (lead?.email ?? "").trim();
  if (!email) return json({ ok: false, reason: "sem_email" });

  // Rampa de aquecimento: respeita o teto do dia (proposta + follow-up somados,
  // global). Se estourou, não envia — a UI avisa pra tentar amanhã.
  const { data: rampa } = await supabase.rpc("email_rampa_status");
  if ((rampa?.[0]?.restante ?? 0) <= 0) return json({ ok: false, reason: "teto_dia" });

  const RESEND = Deno.env.get("RESEND_API_KEY");
  if (!RESEND)
    return json({ ok: false, error: "Envio indisponível: RESEND_API_KEY não configurada." });
  const from = Deno.env.get("EMAIL_FROM") || DEFAULT_FROM;

  // REPLY-TO da org: é onde a resposta do lead cai. Sem ele, o e-mail pede "responde este
  // e-mail" e a resposta some numa caixa que o dono não lê — pior do que não enviar. Barra.
  // (O From continua no domínio VERIFICADO: trocá-lo pelo e-mail do usuário seria spoofing.)
  const { data: perfil } = await supabase
    .from("profiles")
    .select("reply_to_email, full_name")
    .eq("id", userData.user.id)
    .maybeSingle();
  const p = perfil as { reply_to_email: string | null; full_name: string | null } | null;
  const replyTo = (p?.reply_to_email ?? "").trim();
  if (!replyTo)
    return json({
      ok: false,
      reason: "sem_reply_to",
      error:
        'Cadastre o "E-mail para respostas" em Configurações antes de enviar — sem ele, a resposta do lead chega numa caixa que você não lê.',
    });

  // From com o NOME PESSOAL da org (o lead não pode ver a marca da plataforma na caixa
  // dele). O DOMÍNIO continua o verificado — só o nome de exibição muda.
  const fromPessoal = montarFrom(from, p?.full_name);
  if (!fromPessoal)
    return json({
      ok: false,
      reason: "sem_remetente",
      error:
        'Cadastre o "Seu nome" em Configurações antes de enviar — é ele que aparece como remetente e assina a mensagem.',
    });

  // Envia pelo Resend (corpo em texto puro — menos "cara de spam").
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromPessoal,
      to: [email],
      reply_to: replyTo,
      subject: prop.assunto,
      text: prop.corpo,
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.id) {
    const msg = data?.message ?? data?.error?.message ?? `HTTP ${res.status}`;
    return json({ ok: false, error: `Resend: ${msg}` });
  }
  const messageId: string = data.id;

  const agora = new Date().toISOString();
  // Marca a proposta enviada + grava o rastro. Devolve com o nome do lead (join).
  const { data: atualizada, error: upErr } = await supabase
    .from("propostas")
    .update({
      status: "enviada",
      enviada_em: agora,
      email_message_id: messageId,
      email_para: email,
    })
    .eq("id", propostaId)
    .select(SELECT)
    .single();
  if (upErr || !atualizada)
    return json({ ok: false, error: `Enviado, mas falhou ao gravar: ${upErr?.message ?? ""}` });

  // Move o lead para 'proposta_enviada' (distingue de 'contacted'). Best-effort.
  await supabase
    .from("leads")
    .update({ status: "proposta_enviada", updated_at: agora })
    .eq("id", prop.lead_id);

  return json({ ok: true, message_id: messageId, to: email, proposta: atualizada });
});
