// Edge Function: redesign-site (v3 — nível agência).
// Fluxo: matéria-prima (dados reais + conteúdo do site atual) + DEPOIMENTOS REAIS
// do Google (Apify) → detecta nicho → escolhe template premium → IA (Claude→OpenAI)
// gera SÓ o conteúdo (copy) com base nos dados reais → template monta o HTML grande
// com animações. Salva em `redesigns` e os reviews em `lead_reviews` (RLS por user).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { coletarConteudoSite } from "../_shared/materiaprima.ts";
import { coletarReviews } from "../_shared/reviews.ts";
import {
  getProviderChain,
  sanearRegistros,
  type MateriaPrima,
  type ConteudoIA,
} from "../_shared/ai/index.ts";
import { detectarNicho, heroNicho } from "../_shared/site/nicho.ts";
import { varianteHero } from "../_shared/site/variantes.ts";
import { montarHtml } from "../_shared/site/montar.ts";
import { conteudoFallback } from "../_shared/site/fallback.ts";
import { resolverImagens, heroPremiumUrl } from "../_shared/imghost.ts";
import type { Depoimento } from "../_shared/site/tipos.ts";
import {
  planejarColeta,
  estourouColeta,
  TETO_RODADA_USD,
  TETO_MES_USD,
} from "../../../src/lib/redes-teto.ts";
import { mesRefAtual, CUSTO_SITE_ESTIMADO_USD } from "../../../src/lib/automacao-teto.ts";
import { orgDoUsuario, consumir } from "../_shared/limite.ts";

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
  // ignorarSite: gera um site NOVO do zero (só dados do Google), sem raspar o site atual.
  // Ausente/false = REDESIGN a partir do site existente (comportamento padrão).
  let ignorarSite = false;
  try {
    const body = await req.json();
    leadId = body?.lead_id;
    ignorarSite = !!body?.ignorar_site;
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

  // 💸 TETO DE GASTO (FASE 0 / Frente 2): gerar site custa IA + Apify. O portão fica AQUI
  // (server-side) para valer em TODO caminho — Preparar da campanha, tela Redesign e a
  // automação (que ainda tem o teto próprio da receita; o mais restritivo ganha).
  // MESMO livro-caixa da coleta de redes (redes_buscas): o teto mensal de US$ 50 é GLOBAL —
  // coleta e geração de sites disputam o mesmo orçamento, de propósito (teto separado por
  // categoria seria furo). Nunca estoura calado: recusa AQUI, antes de gastar 1 token.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const mesRef = mesRefAtual(new Date());
  const { data: doMes } = await admin
    .from("redes_buscas")
    .select("custo_usd")
    .eq("user_id", userId)
    .eq("mes_ref", mesRef);
  const gastoMes = (doMes ?? []).reduce(
    (s: number, r: { custo_usd: unknown }) => s + Number(r.custo_usd ?? 0),
    0,
  );
  const plano = planejarColeta(gastoMes, 1, TETO_RODADA_USD, TETO_MES_USD, CUSTO_SITE_ESTIMADO_USD);
  const registrarGasto = async (
    status: "concluida" | "parada_teto" | "erro",
    custoUsd: number,
    detalhe: string | null,
    gerou: boolean,
  ) =>
    await admin.from("redes_buscas").insert({
      user_id: userId,
      fonte: "ia_site",
      estrategia: ignorarSite ? "SITE-NOVO" : "SITE",
      pedido: { lead_id: leadId },
      limite: 1,
      custo_usd: custoUsd,
      encontrados: gerou ? 1 : 0,
      inseridos: gerou ? 1 : 0,
      status,
      detalhe,
      mes_ref: mesRef,
      concluida_em: new Date().toISOString(),
    });
  if (!plano.podeRodar) {
    await registrarGasto("parada_teto", 0, plano.motivo ?? "teto", false);
    // 200 + error: gerarRedesign() lança ESTA mensagem, que aparece no estado de erro do lote.
    return json({
      error: `Teto de gasto do mês atingido — geração de site bloqueada (${plano.motivo}). O teto zera na virada do mês.`,
      reason: "teto",
      gastoMes,
      teto: { rodada: TETO_RODADA_USD, mes: TETO_MES_USD },
    });
  }

  // 📊 LIMITE DO PLANO (billing camada 2): gerar site consome a cota "sites" da org.
  // Conta e bloqueia de forma atômica; super_admin/dono da plataforma é ilimitado.
  const orgId = await orgDoUsuario(admin, userId);
  if (orgId) {
    const cota = await consumir(admin, orgId, "sites", 1);
    if (!cota.ok && cota.reason === "limite_atingido") {
      return json({
        error: `Limite de sites do seu plano atingido: ${cota.usado}/${cota.limite} neste mês. Faça upgrade do plano para gerar mais.`,
        reason: "limite_plano",
        recurso: "sites",
        usado: cota.usado,
        limite: cota.limite,
      });
    }
  }

  // custo já incorrido (Apify de reviews + IA) — vai pro livro-caixa MESMO se a geração falhar
  let custoJaIncorridoUsd = 0;

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
    // ignorarSite → NÃO raspa o site atual (gera do zero, como se não houvesse site).
    const raspar = lead.website && !ignorarSite;
    if (ignorarSite) log("modo: site NOVO do zero (ignora o site atual)");
    const [siteC, coleta] = await Promise.all([
      raspar ? coletarConteudoSite(lead.website) : Promise.resolve(null),
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

    // 2. PROVA SOCIAL — só entra review POSITIVA real. Limiar: nota >= 4.
    //    Justificativa: 4-5 estrelas = cliente satisfeito (prova social legítima);
    //    1-3 = reclamação/experiência mista e NUNCA vira depoimento (mandar isso pro
    //    dono queima o lead); sem nota = não dá pra confirmar que é positiva → fica de
    //    fora ("sem dado, na dúvida, fora"). Se sobrar 0, a seção se OMITE (sec_prova)
    //    ou mostra só a nota real — nunca completa com negativa nem inventa.
    const MIN_ESTRELAS = 4;
    const reviewsPositivas = coleta.reviews.filter(
      (r) => typeof r.rating === "number" && r.rating >= MIN_ESTRELAS,
    );
    log(
      `reviews: ${coleta.reviews.length} coletadas → ${reviewsPositivas.length} positivas (>=${MIN_ESTRELAS}★) publicáveis`,
    );
    // photo=null de propósito: os avatares do Google (lh3) expiram/bloqueiam — o
    // template usa a inicial do nome. Nenhuma URL lh3 vai pro site final.
    const depoimentos: Depoimento[] = reviewsPositivas.map((r) => ({
      author: r.author,
      photo: null,
      rating: r.rating,
      text: r.text,
      when: r.when,
    }));
    // lead_reviews guarda SÓ as publicáveis (positivas) — nunca uma negativa fica no
    // acervo do site pronta pra vazar numa republicação.
    if (reviewsPositivas.length) {
      await supabase.from("lead_reviews").delete().eq("lead_id", leadId);
      await supabase.from("lead_reviews").insert(
        reviewsPositivas.map((r) => ({
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
    custoJaIncorridoUsd = coleta.custoUsd;

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

    // SEMENTE estável do lead (place_id; senão uuid). Definida ANTES das imagens para o
    // fallback do Sobre variar por lead (banco temático do nicho re-hospedado).
    const seed: string = lead.place_id || lead.id;

    const [ai, fotos] = await Promise.all([
      gerarConteudo(),
      resolverImagens(
        admin,
        Deno.env.get("SUPABASE_URL")!,
        rd.id,
        heroNicho(mp.categoria, nicho),
        imagens,
        log,
        seed,
        nicho,
      ),
    ]);

    // GARANTIA anti-fraude: remove qualquer registro profissional (CRO/CRM/OAB/CNPJ...)
    // cujo número não esteja no texto extraído do lead — mesmo que a IA tenha inventado.
    const san = sanearRegistros(ai.conteudo, mp.textos ?? "");
    if (san.removidos.length) log(`registros inventados removidos: ${san.removidos.join(" | ")}`);
    const conteudo: ConteudoIA = san.conteudo;
    const registrosRemovidos = san.removidos;
    const modelo = ai.modelo;
    const provider = ai.provider;
    const inTok = ai.inputTokens;
    const outTok = ai.outputTokens;
    const custoIa = ai.custoUsd;
    const usouFallback = ai.usouFallback;
    custoJaIncorridoUsd = custoIa + coleta.custoUsd;

    // 6. Template premium monta o HTML final (design fixo, dados reais + copy + reviews).
    // SEMENTE estável do lead (place_id do Google; senão o uuid do lead). NUNCA o
    // redesign_id — regenerar o mesmo lead tem que dar SEMPRE a mesma variante.
    // A variante usa o nicho ESTÁVEL (categoria do banco, sem textos do scrape,
    // que oscilam) — mesma chamada feita dentro de montarHtml. (seed já definido acima.)
    const heroVar = varianteHero(seed, detectarNicho(mp.categoria, ""));

    // HERO de clima ESCURO (profissional): usa imagem EDITORIAL do banco premium
    // (escolhida pela semente) em vez da foto candida do lead. Só o hero muda —
    // sobre/galeria/cta seguem com as fotos reais/curadas do imghost.
    if (nicho === "profissional") {
      const editorial = heroPremiumUrl(Deno.env.get("SUPABASE_URL")!, "profissional", seed);
      if (editorial) fotos.hero = editorial;
    }

    // Crédito do rodapé DA ORG (profiles.site_credito). Default: NULL = rodapé sem crédito
    // nenhum — o que chega no lead não carrega a marca da plataforma.
    const { data: perfil } = await supabase
      .from("profiles")
      .select("site_credito")
      .eq("id", userId)
      .maybeSingle();
    const creditoRodape = (perfil as { site_credito: string | null } | null)?.site_credito ?? null;

    const html = montarHtml(mp, conteudo, nicho, depoimentos, fotos, seed, creditoRodape);
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

    // 💸 registra a geração no livro-caixa com o custo REAL. Se o custo real bateu o teto,
    // fica 'parada_teto' — e a PRÓXIMA geração é recusada pelo portão lá de cima.
    const tetoEstourou = estourouColeta(custoTotal, gastoMes);
    await registrarGasto(
      tetoEstourou ? "parada_teto" : "concluida",
      custoTotal,
      tetoEstourou
        ? `custo real bateu o teto — próximas gerações do mês bloqueadas (${provider}/${modelo})`
        : `${provider}/${modelo} · ${lead.business_name}`,
      true,
    ).catch(() => {});

    return json({
      redesign: done,
      lead_nome: lead.business_name,
      usage: {
        gastoMesDepois: gastoMes + custoTotal,
        tetoEstourou,
        tetoMesUsd: TETO_MES_USD,
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
        reviewsColetadas: coleta.reviews.length,
        reviewsPositivas: reviewsPositivas.length,
        registrosRemovidos,
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
    // gasto parcial (Apify/IA que já rodou) entra no livro-caixa mesmo em erro — sem furo.
    await registrarGasto("erro", custoJaIncorridoUsd, msg.slice(0, 300), false).catch(() => {});
    return json({ error: msg }, 500);
  }
});
