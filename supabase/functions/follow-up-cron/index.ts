// Edge Function: follow-up-cron (Fase 2) — roda 1x/dia (pg_cron via pg_net).
// Manda 1 SEGUNDA mensagem (D+3) por e-mail (Resend) pra quem recebeu proposta e
// NÃO avançou. "Não respondeu" = por STATUS: só dispara se o lead AINDA está em
// 'proposta_enviada' (se saiu, não cobra).
//
// FIX 2 (opt-in por lista): NÃO varre mais tudo — só processa leads cuja LISTA
// (lead_list) tenha follow_up_ativo = true (o usuário liga explicitamente). Lista
// desligada, lead sem lista → ignorado.
// FIX 3 (rampa por org): o teto do dia é POR ORG (user_id dona da proposta) — cada
// org gasta só a SUA cota. Antes era global e uma org consumia a da outra.
//
// Travas mantidas: 1 follow-up por lead, teto/dia da rampa (sobra pra amanhã),
// opt-out global (LGPD) respeitado, rodapé de descadastro. Protegida por CRON_SECRET.
//
// TODO (blueprint — identidade de envio por org): EMAIL_FROM é global hoje (todas as
// orgs compartilham a reputação do domínio). Próximo: subdomínio/reply-to por org.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { json } from "../_shared/cors.ts";
import { montarFrom } from "../_shared/remetente.ts";

const DEFAULT_FROM = "Flow Leads <onboarding@resend.dev>";
const DIAS = 3;
const BATCH = 1000; // teto de segurança de candidatos lidos por rodada

// COPY APROVADA PELO DONO (follow-up D+3). Espelha src/lib/copy-proposta.ts — este runtime é
// Deno e não importa de src/. Se mudar lá, mude aqui.
//
// {dias_restantes} sai de sites_publicados.expira_em — é ELE que tira a página do ar
// (publicacao.core.ts recusa servir depois dessa data). O expira_em do redesign PODE DIVERGIR
// (visto em produção: site 15 dias x redesign 13); prometer a data do redesign faria a copy
// mentir justo na frase que existe pra ser honesta. Sem data → "em alguns dias": nunca chutar.
function frasePrazo(dias: number | null): string {
  const quando =
    dias != null && dias > 0 ? `em ${dias} ${dias === 1 ? "dia" : "dias"}` : "em alguns dias";
  return `Um aviso prático: eu tiro essa página do ar ${quando}. Não é pressão de venda — é que eu não deixo prévia hospedada por tempo indeterminado.`;
}

function diasAte(expiraEm: string | null, agora: Date): number | null {
  if (!expiraEm) return null;
  const t = Date.parse(expiraEm);
  if (Number.isNaN(t)) return null;
  const d = Math.ceil((t - agora.getTime()) / 86400000);
  return d > 0 ? d : null;
}

function followUpCorpo(
  nome: string,
  url: string,
  dias: number | null,
  remetente: string,
  optout: string,
): string {
  return [
    `${nome}, imagino que a rotina não deixe muito tempo pra e-mail.`,
    "",
    "Deixo o link de novo, caso tenha passado batido — é a página de vocês refeita, no ar:",
    "",
    url,
    "",
    frasePrazo(dias),
    "",
    'Se não for o momento, responde só "não" que eu não escrevo mais.',
    "",
    remetente,
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
  const funcsBase = `${SUPABASE_URL}/functions/v1`;

  // body {max} = teto GLOBAL da rodada (só teste). Sem isso, cada org manda até o
  // teto da SUA rampa (nada de teto global de produção).
  let bodyMax: number | undefined;
  if (req.method === "POST") {
    try {
      const b = await req.json();
      if (typeof b?.max === "number" && b.max >= 0) bodyMax = Math.floor(b.max);
    } catch {
      /* corpo vazio/{} */
    }
  }

  const agora = new Date();
  const d3 = new Date(agora.getTime() - DIAS * 24 * 60 * 60 * 1000).toISOString();

  // Candidatos: proposta ENVIADA há 3+ dias, sem follow-up, cujo LEAD segue em
  // 'proposta_enviada' (não saiu), sem opt-out, com e-mail, E cuja LISTA tem o
  // follow-up LIGADO (leads.lead_lists.follow_up_ativo). Mais antigo primeiro.
  const { data: candsRaw, error: qErr } = await admin
    .from("propostas")
    .select(
      "id, user_id, lead_id, site_id, corpo, assunto, enviada_em, leads!inner(id, email, business_name, status, email_opt_out, opt_out_token, list_id, last_contacted_at, lead_lists!inner(id, follow_up_ativo))",
    )
    .eq("status", "enviada")
    .eq("follow_up_count", 0)
    .lte("enviada_em", d3)
    .eq("leads.status", "proposta_enviada")
    .eq("leads.email_opt_out", false)
    .not("leads.email", "is", null)
    .eq("leads.lead_lists.follow_up_ativo", true)
    .order("enviada_em", { ascending: true })
    .limit(BATCH);
  if (qErr) return json({ error: qErr.message }, 500);

  // CONTATO MANUAL depois do envio = o humano assumiu → NÃO dispara o follow-up automático
  // (o follow-up é seu). Comparação por-linha (last_contacted_at vs enviada_em) que o filtro
  // do PostgREST não faz. Assim, registrar um contato manual num lead que já tem proposta
  // enviada PAUSA o follow-up pendente daquela proposta.
  const cands = (candsRaw ?? []).filter((c) => {
    const lc = (c.leads as { last_contacted_at?: string | null } | null)?.last_contacted_at;
    return !lc || new Date(lc).getTime() <= new Date(c.enviada_em as string).getTime();
  });
  const suprimidosPorContato = (candsRaw ?? []).length - cands.length;

  // Teto do dia POR ORG (rampa da própria org). Cache p/ não repetir a rpc; decrementa
  // localmente a cada envio (o count do dia inclui proposta+follow-up somados da org).
  const restanteDaOrg = new Map<string, number>();
  const rampaPorOrg: Record<string, unknown> = {};
  async function tetoRestante(uid: string): Promise<number> {
    if (restanteDaOrg.has(uid)) return restanteDaOrg.get(uid)!;
    const { data } = await admin.rpc("email_rampa_status", { p_user_id: uid });
    const r = data?.[0];
    rampaPorOrg[uid] = r;
    const rest = r?.restante ?? 0;
    restanteDaOrg.set(uid, rest);
    return rest;
  }

  // {dias_restantes} de cada proposta: expira_em do SITE PUBLICADO (é ele que tira a página
  // do ar). Uma consulta só pros sites da rodada — não N+1 dentro do loop.
  const siteIds = [
    ...new Set(
      ((cands ?? []) as Array<{ site_id: string | null }>)
        .map((c) => c.site_id)
        .filter((x): x is string => !!x),
    ),
  ];
  const expiraPorSite = new Map<string, string>();
  if (siteIds.length) {
    const { data: sites } = await admin
      .from("sites_publicados")
      .select("id, expira_em, arquivos_removidos")
      .in("id", siteIds);
    for (const s of (sites ?? []) as Array<{
      id: string;
      expira_em: string;
      arquivos_removidos: boolean;
    }>) {
      // Site já retirado do ar → sem prazo a prometer (cai em "em alguns dias").
      if (!s.arquivos_removidos) expiraPorSite.set(s.id, s.expira_em);
    }
  }

  // {remetente} por org (profiles.full_name). Sem nome configurado, o follow-up NÃO sai:
  // assinar com nome inventado é pior do que tentar de novo amanhã.
  const remetentePorOrg = new Map<string, string>();
  // REPLY-TO por org: onde a resposta do lead cai. Sem ele o follow-up pede resposta e ela
  // some numa caixa que o dono não lê — não manda (tenta amanhã, já cadastrado).
  const replyToPorOrg = new Map<string, string>();
  const orgIds = [...new Set(((cands ?? []) as Array<{ user_id: string }>).map((c) => c.user_id))];
  if (orgIds.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name, reply_to_email")
      .in("id", orgIds);
    for (const p of (profs ?? []) as Array<{
      id: string;
      full_name: string | null;
      reply_to_email: string | null;
    }>) {
      const n = (p.full_name ?? "").trim();
      if (n) remetentePorOrg.set(p.id, n);
      const r = (p.reply_to_email ?? "").trim();
      if (r) replyToPorOrg.set(p.id, r);
    }
  }

  const itens: Array<{
    lead_id: string;
    org: string;
    nome: string;
    message_id: string;
    dias_restantes: number | null;
  }> = [];
  const falhas: Array<{ lead_id: string; motivo: string }> = [];
  const leadsFeitos = new Set<string>();
  let enviadosRodada = 0;

  for (const c of (cands ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    lead_id: string;
    site_id: string | null;
    corpo: string;
    assunto: string;
    leads: {
      id: string;
      email: string;
      business_name: string | null;
      opt_out_token: string | null;
      lead_lists: { id: string; follow_up_ativo: boolean } | null;
    };
  }>) {
    if (bodyMax !== undefined && enviadosRodada >= bodyMax) break; // teto global (só teste)
    if (leadsFeitos.has(c.lead_id)) continue; // 1 follow-up por lead por rodada
    const lead = c.leads;
    // Garantia extra (além do !inner): a lista precisa estar LIGADA.
    if (!lead.lead_lists?.follow_up_ativo) continue;
    const email = (lead.email ?? "").trim();
    if (!email) continue;

    // Teto da rampa DA ORG dona da proposta (FIX 3). Org sem cota hoje → pula (amanhã).
    const rest = await tetoRestante(c.user_id);
    if (rest <= 0) continue;

    // Garante o token de descadastro do lead (link do rodapé).
    let token = lead.opt_out_token;
    if (!token) {
      token = crypto.randomUUID();
      await admin.from("leads").update({ opt_out_token: token }).eq("id", lead.id);
    }
    const optout = `${funcsBase}/opt-out?lead=${lead.id}&t=${token}`;
    const url = c.corpo.match(/https?:\/\/\S+/)?.[0] ?? "";

    // Sem nome do remetente configurado → não manda (tenta amanhã, já configurado).
    const remetente = remetentePorOrg.get(c.user_id);
    if (!remetente) {
      falhas.push({
        lead_id: c.lead_id,
        motivo: "Sem nome do remetente (Configurações) — o e-mail não pode ser assinado.",
      });
      continue;
    }

    const replyTo = replyToPorOrg.get(c.user_id);
    if (!replyTo) {
      falhas.push({
        lead_id: c.lead_id,
        motivo:
          'Sem "E-mail para respostas" (Configurações) — a resposta do lead não teria onde chegar.',
      });
      continue;
    }

    const dias = diasAte(c.site_id ? (expiraPorSite.get(c.site_id) ?? null) : null, agora);
    const assunto = /^re:/i.test(c.assunto ?? "")
      ? c.assunto
      : `Re: ${c.assunto ?? "sua nova página"}`;
    // From com o NOME PESSOAL da org — o lead não vê a marca da plataforma na caixa dele.
    // O domínio continua o verificado. `remetente` já foi validado acima (sem nome, não envia).
    const fromPessoal = montarFrom(from, remetente);
    if (!fromPessoal) {
      falhas.push({
        lead_id: c.lead_id,
        motivo: "Sem nome do remetente — From não pôde ser montado.",
      });
      continue;
    }

    const corpo = followUpCorpo(lead.business_name ?? "", url, dias, remetente, optout);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromPessoal,
        to: [email],
        reply_to: replyTo,
        subject: assunto,
        text: corpo,
      }),
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
    restanteDaOrg.set(c.user_id, rest - 1); // consome 1 da cota da org
    enviadosRodada++;
    itens.push({
      lead_id: c.lead_id,
      org: c.user_id,
      nome: lead.business_name ?? "",
      message_id: data.id,
      dias_restantes: dias,
    });
  }

  return json({
    ok: true,
    agora: agora.toISOString(),
    d3_corte: d3,
    candidatos: cands.length,
    suprimidos_por_contato_manual: suprimidosPorContato,
    enviados: itens.length,
    itens,
    falhas,
    rampa_por_org: rampaPorOrg,
  });
});
