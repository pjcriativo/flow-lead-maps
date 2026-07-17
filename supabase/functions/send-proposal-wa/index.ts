// Edge: send-proposal-wa — envia UMA mensagem de campanha por WhatsApp (o cliente orquestra o lote
// com o intervalo/jitter, para respeitar a vazão como tempo real e dar progresso ao vivo).
//
// REUSA o motor de campanha (mesmas tabelas campanhas/campanha_leads/propostas): este edge é o
// ESPELHO do send-proposal, trocando só o TRANSPORTE (Resend → Evolution) e a COPY (proposta de
// e-mail → variações de WhatsApp que revezam). O PORTÃO é o mesmo: nada sai sem o lead estar
// 'aprovado' (site publicado / link pronto).
//
// 🔒 ISOLAMENTO: AUTH OBRIGATÓRIA (getUser); a org sai SEMPRE do JWT. Tudo escopado por user_id.
// O chip é resolvido por proximaInstanciaDisparo (só 'disparo'+'conectado' → NUNCA o flowleads).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  waBase,
  proximaInstanciaDisparo,
  enviarTextoInstancia,
  enviosHojeDoChip,
  ultimaVariacaoDaCampanha,
  jaEnviouNaCampanha,
  registrarEnvio,
  WA_TETO_DIARIO_CHIP,
} from "../_shared/wa.ts";
import {
  escolherVariacao,
  resolverVariaveis,
  variacoesElegiveis,
} from "../../../src/lib/wa-copy.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let b: { campanha_lead_id?: string };
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const clId = String(b?.campanha_lead_id || "");
  if (!clId) return json({ ok: false, reason: "sem_campanha_lead" });

  // 1) campanha_lead do dono (escopado por user_id) — id forjado de outra org → não encontra.
  const { data: cl } = await admin
    .from("campanha_leads")
    .select("id, campanha_id, lead_id, estado, proposta_id")
    .eq("id", clId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!cl) return json({ ok: false, reason: "nao_encontrado" });

  // 2) campanha precisa ser do canal WhatsApp (não dispara e-mail por aqui).
  const { data: camp } = await admin
    .from("campanhas")
    .select("id, canal, wa_config, status")
    .eq("id", cl.campanha_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!camp) return json({ ok: false, reason: "campanha_nao_encontrada" });
  if (camp.canal !== "whatsapp") return json({ ok: false, reason: "canal_errado" });
  if (camp.status !== "ativa") return json({ ok: false, reason: "campanha_concluida" });

  // 3) PORTÃO (o mesmo do e-mail): só sai o que foi aprovado (site publicado / link pronto).
  if (cl.estado !== "aprovado") return json({ ok: false, reason: "nao_aprovado" });

  // 4) idempotência do lote: não manda duas vezes pro mesmo lead na mesma campanha.
  if (await jaEnviouNaCampanha(admin, userId, cl.campanha_id, cl.lead_id))
    return json({ ok: false, reason: "ja_enviado" });

  // 5) lead + link publicado.
  const { data: lead } = await admin
    .from("leads")
    .select(
      "id, business_name, city, category, phone, whatsapp, rating, review_count, score_breakdown, email_opt_out",
    )
    .eq("id", cl.lead_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!lead) return json({ ok: false, reason: "lead_nao_encontrado" });

  // Opt-out GLOBAL existente (e-mail) é respeitado também no WhatsApp (LGPD, não incomodar).
  if (lead.email_opt_out) return json({ ok: false, reason: "opt_out" });

  // Lead sem WhatsApp → avisa, não finge (não inventa número).
  const numero = String(lead.whatsapp || "").replace(/\D/g, "");
  if (numero.length < 12) return json({ ok: false, reason: "sem_whatsapp" });

  // Link da prévia publicada (do site vinculado à proposta aprovada deste lead).
  let link: string | null = null;
  if (cl.proposta_id) {
    const { data: prop } = await admin
      .from("propostas")
      .select("site_id")
      .eq("id", cl.proposta_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (prop?.site_id) {
      const { data: site } = await admin
        .from("sites_publicados")
        .select("url_publica")
        .eq("id", prop.site_id)
        .maybeSingle();
      link = site?.url_publica ?? null;
    }
  }
  if (!link) return json({ ok: false, reason: "sem_link" });

  // 6) chip de disparo conectado (proximaInstanciaDisparo NUNCA devolve 'conversa'/flowleads).
  const chip = await proximaInstanciaDisparo(admin, userId);
  if (!chip) return json({ ok: false, reason: "sem_chip" });

  // 7) teto diário POR CHIP (backstop; a vazão real é o intervalo do cliente).
  const hoje = await enviosHojeDoChip(admin, userId, chip.id);
  if (hoje >= WA_TETO_DIARIO_CHIP)
    return json({ ok: false, reason: "teto_dia", chip: chip.numero ?? chip.nome });

  // 8) escolhe a variação (elegível p/ este lead — nunca inventa nota) e NUNCA repete a anterior.
  const dados = {
    business_name: lead.business_name,
    city: lead.city,
    category: lead.category,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    rating: lead.rating,
    review_count: lead.review_count,
    score_breakdown: lead.score_breakdown,
    link,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg: any = camp.wa_config || {};
  const eleg = variacoesElegiveis(cfg.variacoes || [], dados);
  if (eleg.length === 0) return json({ ok: false, reason: "sem_variacao" });
  const ultima = await ultimaVariacaoDaCampanha(admin, userId, cl.campanha_id);
  const variacao = escolherVariacao(eleg, lead.id, ultima);
  if (!variacao) return json({ ok: false, reason: "sem_variacao" });
  const texto = resolverVariaveis(variacao.texto, dados);

  // 9) ENVIA de fato.
  const env = await enviarTextoInstancia(chip.token, numero, texto);
  if (!env.ok)
    return json({ ok: false, reason: "envio_falhou", error: env.error, chip: chip.numero });

  // 10) registra (base de graduação, histórico e revezamento) + move o lead (best-effort).
  await registrarEnvio(admin, userId, {
    leadId: lead.id,
    instanciaId: chip.id,
    campanhaId: cl.campanha_id,
    variacaoId: variacao.id,
    mensagem: texto,
  });
  await admin
    .from("leads")
    .update({ status: "proposta_enviada", last_contacted_at: new Date().toISOString() })
    .eq("id", lead.id)
    .eq("user_id", userId)
    .in("status", ["new", "enriched", "contacted"]);

  return json({
    ok: true,
    para: numero,
    chip: chip.numero ?? chip.nome,
    variacao: variacao.id,
    mensagem: texto,
  });
});
