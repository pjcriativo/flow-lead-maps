// Edge Function: redesign-site (Fase 3)
// Entrada: { lead_id }. Coleta a matéria-prima (dados do lead + conteúdo/imagens/
// cores do site atual) e chama a IA plugável para gerar um site NOVO. Salva o
// HTML em `redesigns` (RLS por usuário). Retorna o redesign + custo da geração.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { coletarConteudoSite } from "../_shared/materiaprima.ts";
import { getAiProvider, type MateriaPrima } from "../_shared/ai/index.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

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

  // Cria o registro do redesign (status: gerando).
  const { data: rd, error: rdErr } = await supabase
    .from("redesigns")
    .insert({ user_id: userId, lead_id: leadId, site_original_url: lead.website, status: "gerando" })
    .select()
    .single();
  if (rdErr || !rd) return json({ error: "Falha ao criar redesign: " + (rdErr?.message ?? "") }, 500);

  try {
    // Matéria-prima: visita o site atual (se houver) para pegar textos/fotos/cores.
    const siteC = lead.website ? await coletarConteudoSite(lead.website) : null;
    const mp: MateriaPrima = {
      nome: lead.business_name,
      categoria: lead.category,
      endereco: lead.address,
      telefone: lead.phone,
      whatsapp: lead.whatsapp,
      rating: lead.rating,
      reviews: lead.review_count,
      siteUrl: lead.website,
      instagram: lead.instagram_url ?? siteC?.instagram ?? null,
      facebook: lead.facebook_url ?? siteC?.facebook ?? null,
      textos: siteC?.textos ?? "",
      imagens: siteC?.imagens ?? [],
      logo: siteC?.logo ?? null,
      cores: siteC?.cores ?? [],
    };

    const ai = getAiProvider();
    const out = await ai(mp);
    if (!out.html || out.html.length < 200) throw new Error("A IA retornou HTML vazio/inválido");

    const now = new Date().toISOString();
    const { data: done, error: upErr } = await supabase
      .from("redesigns")
      .update({
        html_gerado: out.html,
        status: "pronto",
        modelo: out.modelo,
        custo_usd: out.custoUsd,
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
        modelo: out.modelo,
        inputTokens: out.inputTokens,
        outputTokens: out.outputTokens,
        custoUsd: out.custoUsd,
        imagensUsadas: mp.imagens.length,
        temLogo: !!mp.logo,
        cores: mp.cores,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("redesigns").update({ status: "erro", observacoes: msg, updated_at: new Date().toISOString() }).eq("id", rd.id);
    return json({ error: msg }, 500);
  }
});
