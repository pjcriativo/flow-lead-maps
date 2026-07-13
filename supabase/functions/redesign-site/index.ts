// Edge Function: redesign-site (v3 — nível agência).
// Fluxo: matéria-prima (dados reais + conteúdo do site atual) + DEPOIMENTOS REAIS
// do Google (Apify) → detecta nicho → escolhe template premium → IA (Claude→OpenAI)
// gera SÓ o conteúdo (copy) com base nos dados reais → template monta o HTML grande
// com animações. Salva em `redesigns` e os reviews em `lead_reviews` (RLS por user).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { coletarConteudoSite } from "../_shared/materiaprima.ts";
import { coletarReviews } from "../_shared/reviews.ts";
import { getProviderChain, type MateriaPrima, type ConteudoIA } from "../_shared/ai/index.ts";
import { detectarNicho, heroNicho } from "../_shared/site/nicho.ts";
import { varianteHero } from "../_shared/site/variantes.ts";
import { montarHtml } from "../_shared/site/montar.ts";
import { conteudoFallback } from "../_shared/site/fallback.ts";
import { resolverImagens, heroPremiumUrl } from "../_shared/imghost.ts";
import type { Depoimento } from "../_shared/site/tipos.ts";

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

  const logs: string[] = [];
  const log = (m: string) => logs.push(m);

  try {
    // 1. Matéria-prima (site atual) + DEPOIMENTOS reais do Google (Apify), em paralelo.
    const [siteC, coleta] = await Promise.all([
      lead.website ? coletarConteudoSite(lead.website) : Promise.resolve(null),
      coletarReviews(lead.place_id, { maxReviews: 8, maxImages: 6, log }),
    ]);

    // Fotos reais: do site atual + do Google (Apify).
    const imagens = [...(siteC?.imagens ?? []), ...coleta.imagens].filter(
      (v, i, a) => a.indexOf(v) === i,
    );

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
      imagens,
      logo: siteC?.logo ?? null,
      cores: siteC?.cores ?? [],
      descricao: siteC?.descricao ?? null,
      legivel: siteC?.legivel ?? false,
    };

    // 2. Salva os depoimentos reais vinculados ao lead (substitui os anteriores).
    // photo=null de propósito: os avatares do Google (lh3) expiram/bloqueiam — o
    // template usa a inicial do nome. Nenhuma URL lh3 vai pro site final.
    const depoimentos: Depoimento[] = coleta.reviews.map((r) => ({
      author: r.author,
      photo: null,
      rating: r.rating,
      text: r.text,
      when: r.when,
    }));
    if (depoimentos.length) {
      await supabase.from("lead_reviews").delete().eq("lead_id", leadId);
      await supabase.from("lead_reviews").insert(
        coleta.reviews.map((r) => ({
          user_id: userId,
          lead_id: leadId,
          author_name: r.author,
          author_photo: r.photo,
          rating: r.rating,
          text: r.text,
          when_label: r.when,
          review_url: r.url,
          source: "google",
        })),
      );
    }

    // 3. Nicho → template.
    const nicho = detectarNicho(mp.categoria, mp.textos);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 4+5 em PARALELO (economiza wall-clock): IA gera o CONTEÚDO (copy, cadeia
    // Claude→OpenAI→fallback) enquanto o imghost escolhe/curadoria/re-hospeda as
    // imagens (hero real claro/landscape ou curado do nicho; nada de lh3).
    const errosIa: string[] = [];
    const gerarConteudo = async () => {
      for (const p of getProviderChain()) {
        try {
          const out = await p.fn(mp, nicho);
          log(`IA: ${p.nome} (${out.modelo}) ok`);
          return { ...out, provider: p.nome, usouFallback: false };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errosIa.push(`${p.nome}: ${msg}`);
          log(`IA: ${p.nome} falhou — ${msg}`);
        }
      }
      return {
        conteudo: conteudoFallback(mp, nicho),
        modelo: "fallback (rule-based)",
        inputTokens: 0,
        outputTokens: 0,
        custoUsd: 0,
        provider: "fallback",
        usouFallback: true,
      };
    };

    const [ai, fotos] = await Promise.all([
      gerarConteudo(),
      resolverImagens(
        admin,
        Deno.env.get("SUPABASE_URL")!,
        rd.id,
        heroNicho(mp.categoria, nicho),
        imagens,
        log,
      ),
    ]);

    const conteudo: ConteudoIA = ai.conteudo;
    const modelo = ai.modelo;
    const provider = ai.provider;
    const inTok = ai.inputTokens;
    const outTok = ai.outputTokens;
    const custoIa = ai.custoUsd;
    const usouFallback = ai.usouFallback;

    // 6. Template premium monta o HTML final (design fixo, dados reais + copy + reviews).
    // SEMENTE estável do lead (place_id do Google; senão o uuid do lead). NUNCA o
    // redesign_id — regenerar o mesmo lead tem que dar SEMPRE a mesma variante.
    // A variante usa o nicho ESTÁVEL (categoria do banco, sem textos do scrape,
    // que oscilam) — mesma chamada feita dentro de montarHtml.
    const seed: string = lead.place_id || lead.id;
    const heroVar = varianteHero(seed, detectarNicho(mp.categoria, ""));

    // HERO de clima ESCURO (profissional): usa imagem EDITORIAL do banco premium
    // (escolhida pela semente) em vez da foto candida do lead. Só o hero muda —
    // sobre/galeria/cta seguem com as fotos reais/curadas do imghost.
    if (nicho === "profissional") {
      const editorial = heroPremiumUrl(Deno.env.get("SUPABASE_URL")!, "profissional", seed);
      if (editorial) fotos.hero = editorial;
    }

    const html = montarHtml(mp, conteudo, nicho, depoimentos, fotos, seed);
    if (!html || html.length < 800) throw new Error("Falha ao montar o HTML do template");

    const custoTotal = custoIa + coleta.custoUsd;
    const conteudoLegivel = mp.legivel;
    // FLAG de honestidade (D): serviços vieram do site real OU são genéricos do nicho.
    const servicosReais = conteudo.servicosReais;
    const avisoGenerico = servicosReais
      ? null
      : usouFallback
        ? `Serviços GENÉRICOS do nicho: IA indisponível (${errosIa.join(" | ")}); usado conteúdo rule-based.`
        : `Serviços GENÉRICOS do nicho: não foi possível extrair as áreas reais do site do lead${conteudoLegivel ? "" : " (site ilegível — texto em imagem/JS)"}.`;

    const now = new Date().toISOString();
    const obs = [
      `provider=${provider} modelo=${modelo}`,
      `depoimentos=${depoimentos.length}`,
      `heroVar=${heroVar} seed=${seed}`,
      `heroReal=${fotos.heroReal} galeria=${fotos.galeria.length}`,
      `img=${fotos.debug}`,
      `servicosReais=${servicosReais} legivel=${conteudoLegivel}`,
      avisoGenerico ?? "",
      `apify=${coleta.debug}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const { data: done, error: upErr } = await supabase
      .from("redesigns")
      .update({
        html_gerado: html,
        status: "pronto",
        modelo,
        custo_usd: custoTotal,
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
        provider,
        modelo,
        inputTokens: inTok,
        outputTokens: outTok,
        custoIaUsd: custoIa,
        custoApifyUsd: coleta.custoUsd,
        custoUsd: custoTotal,
        fallback: usouFallback,
        depoimentos: depoimentos.length,
        servicos: conteudo.servicos.length,
        servicosReais,
        heroNicho: heroNicho(mp.categoria, nicho),
        heroVar,
        seed,
        temNota: mp.rating != null,
        diferenciais: conteudo.diferenciais.length,
        faq: conteudo.faq.length,
        imagensUsadas: imagens.length,
        fotosReais: imagens.length,
        heroReal: fotos.heroReal,
        galeria: fotos.galeria.length,
        fotosDebug: fotos.debug,
        temLogo: !!mp.logo,
        cores: mp.cores,
        usouNota: mp.rating != null,
        usouWhatsapp: !!mp.whatsapp,
        conteudoLegivel,
        avisoGenerico,
        logs,
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
