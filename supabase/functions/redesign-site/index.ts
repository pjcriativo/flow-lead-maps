// Edge Function: redesign-site (v2 — TEMPLATE premium + IA preenche).
// Fluxo: coleta a matéria-prima (dados reais do lead + conteúdo do site atual) →
// detecta o nicho → escolhe o TEMPLATE premium → a IA gera SÓ o CONTEÚDO (copy)
// com base nos dados reais → o template monta o HTML final. O design é fixo e
// profissional; só o texto varia. Salva em `redesigns` (RLS por usuário).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { coletarConteudoSite } from "../_shared/materiaprima.ts";
import { getAiProvider, type MateriaPrima } from "../_shared/ai/index.ts";
import { detectarNicho } from "../_shared/site/nicho.ts";
import { montarHtml } from "../_shared/site/montar.ts";
import { conteudoFallback } from "../_shared/site/fallback.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  let leadId: string | undefined;
  try {
    leadId = (await req.json())?.lead_id;
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (!leadId) return json({ error: "Informe lead_id" }, 400);

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) return json({ error: "Lead não encontrado" }, 404);

  const { data: rd, error: rdErr } = await supabase
    .from("redesigns")
    .insert({
      user_id: userId,
      lead_id: leadId,
      site_original_url: lead.website,
      status: "gerando",
    })
    .select()
    .single();
  if (rdErr || !rd)
    return json({ error: "Falha ao criar redesign: " + (rdErr?.message ?? "") }, 500);

  try {
    // 1. Matéria-prima: dados reais do lead + conteúdo do site atual (se houver).
    const siteC = lead.website ? await coletarConteudoSite(lead.website) : null;
    const mp: MateriaPrima = {
      nome: lead.business_name,
      categoria: lead.category,
      cidade: lead.city,
      estado: lead.state,
      endereco: lead.address,
      telefone: lead.phone,
      whatsapp: lead.whatsapp,
      rating: lead.rating != null ? Number(lead.rating) : null,
      reviews: lead.review_count,
      latitude: lead.latitude != null ? Number(lead.latitude) : null,
      longitude: lead.longitude != null ? Number(lead.longitude) : null,
      siteUrl: lead.website,
      instagram: lead.instagram_url ?? siteC?.instagram ?? null,
      facebook: lead.facebook_url ?? siteC?.facebook ?? null,
      textos: siteC?.textos ?? "",
      imagens: siteC?.imagens ?? [],
      logo: siteC?.logo ?? null,
      cores: siteC?.cores ?? [],
    };

    // 2. Nicho → template.
    const nicho = detectarNicho(mp.categoria, mp.textos);

    // 3. IA gera o CONTEÚDO (copy). Se falhar, usa fallback rule-based específico.
    let conteudo,
      modelo,
      inTok,
      outTok,
      custo,
      usouFallback,
      erroIa: string | null = null;
    try {
      const ai = getAiProvider();
      const out = await ai(mp, nicho);
      conteudo = out.conteudo;
      modelo = out.modelo;
      inTok = out.inputTokens;
      outTok = out.outputTokens;
      custo = out.custoUsd;
      usouFallback = false;
    } catch (e) {
      erroIa = e instanceof Error ? e.message : String(e);
      conteudo = conteudoFallback(mp, nicho);
      modelo = "fallback (rule-based)";
      inTok = 0;
      outTok = 0;
      custo = 0;
      usouFallback = true;
    }

    // 4. Template premium monta o HTML final (design fixo, dados reais + copy).
    const html = montarHtml(mp, conteudo, nicho);
    if (!html || html.length < 500) throw new Error("Falha ao montar o HTML do template");

    const now = new Date().toISOString();
    const obs = usouFallback ? `IA indisponível (${erroIa}); usado conteúdo rule-based.` : null;
    const { data: done, error: upErr } = await supabase
      .from("redesigns")
      .update({
        html_gerado: html,
        status: "pronto",
        modelo,
        custo_usd: custo,
        observacoes: obs,
        gerado_em: now,
        updated_at: now,
      })
      .eq("id", rd.id)
      .select()
      .single();
    if (upErr) throw new Error(upErr.message);

    return json({
      redesign: done,
      lead_nome: lead.business_name,
      usage: {
        template: nicho,
        modelo,
        inputTokens: inTok,
        outputTokens: outTok,
        custoUsd: custo,
        fallback: usouFallback,
        imagensUsadas: mp.imagens.length,
        temLogo: !!mp.logo,
        cores: mp.cores,
        usouNota: mp.rating != null,
        usouWhatsapp: !!mp.whatsapp,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("redesigns")
      .update({ status: "erro", observacoes: msg, updated_at: new Date().toISOString() })
      .eq("id", rd.id);
    return json({ error: msg }, 500);
  }
});
