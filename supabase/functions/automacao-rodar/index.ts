// Edge: automacao-rodar — O ROBÔ. Executa UMA rodada de uma receita: busca leads NOVOS (Apify),
// qualifica (score) e DESCARTA sem contato, gera site RASCUNHO (custo real) + proposta rascunho,
// cria a campanha pra revisão e PARA no portão avisando "N prontos". NUNCA envia.
//
// 🚨 TETO DE GASTO em 2 camadas (src/lib/automacao-teto): (1) planejarRodada limita os leads ANTES
// de gastar; (2) o gasto REAL (Apify + custo de IA de cada site) é checado a CADA lead — bateu,
// para na hora com status 'parada_teto'.
//
// Esta versão roda em modo MANUAL (JWT do dono) — o agendamento (cron) é a ETAPA seguinte.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { searchApify } from "../_shared/providers/apify.ts";
import { enrichFromWebsite } from "../_shared/enrich.ts";
import { computeScore } from "../_shared/score.ts";
import { firstBrWhatsapp } from "../_shared/phone.ts";
import { extrairBairro } from "../../../src/lib/bairro.ts";
import {
  planejarRodada,
  estourou,
  mesRefAtual,
  precisaZerarMes,
} from "../../../src/lib/automacao-teto.ts";
import { configPadraoWa } from "../../../src/lib/wa-copy.ts";
import {
  classificarMotivo,
  montarCorpoProposta,
  ASSUNTO_PROPOSTA,
} from "../../../src/lib/copy-proposta.ts";

const temContatoValido = (email: string | null, whatsapp: string | null) =>
  Boolean((email && /@.+\..+/.test(email)) || whatsapp);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let b: { receita_id?: string };
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const receitaId = String(b.receita_id || "");
  if (!receitaId) return json({ error: "Informe receita_id" }, 400);

  // Receita do próprio dono.
  const { data: receita } = await admin
    .from("automacao_receitas")
    .select("*")
    .eq("id", receitaId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!receita) return json({ error: "Receita não encontrada" }, 404);

  const agora = new Date();
  // Reset do rastreio mensal se o mês virou.
  let leadsMes = receita.leads_mes as number;
  let gastoMes = Number(receita.gasto_mes_usd);
  if (precisaZerarMes(receita.mes_ref, agora)) {
    leadsMes = 0;
    gastoMes = 0;
  }

  const teto = {
    leads_por_rodada: receita.leads_por_rodada,
    max_leads_rodada: receita.max_leads_rodada,
    max_leads_mes: receita.max_leads_mes,
    max_usd_rodada: Number(receita.max_usd_rodada),
    max_usd_mes: Number(receita.max_usd_mes),
    custo_lead_usd: Number(receita.custo_lead_usd),
    leads_mes: leadsMes,
    gasto_mes_usd: gastoMes,
  };
  const plano = planejarRodada(teto);

  // Cria a rodada (log).
  const { data: rodada } = await admin
    .from("automacao_rodadas")
    .insert({ user_id: userId, receita_id: receitaId, status: "rodando" })
    .select("id")
    .single();
  const rodadaId = rodada!.id;

  const finalizar = async (
    status: string,
    campos: Record<string, unknown>,
    detalhe: string,
    novoLeadsMes = leadsMes,
    novoGasto = gastoMes,
  ) => {
    await admin
      .from("automacao_rodadas")
      .update({ ...campos, status, detalhe, concluida_em: new Date().toISOString() })
      .eq("id", rodadaId);
    await admin
      .from("automacao_receitas")
      .update({
        mes_ref: mesRefAtual(agora),
        leads_mes: novoLeadsMes,
        gasto_mes_usd: novoGasto,
        ultima_rodada_em: new Date().toISOString(),
      })
      .eq("id", receitaId);
    return json({ status, detalhe, rodada_id: rodadaId, ...campos });
  };

  if (!plano.podeRodar) {
    await admin.from("wa_alertas").insert({
      user_id: userId,
      tipo: "automacao_teto",
      mensagem: `Automação "${receita.nome}" pausada: ${plano.motivo}.`,
    });
    return await finalizar("parada_teto", {}, plano.motivo ?? "teto atingido");
  }

  // ------- BUSCA (Apify) — só leads NOVOS (dedupe por place_id já existente) -------
  const { data: jaTem } = await admin.from("leads").select("place_id").eq("user_id", userId);
  const seen = new Set((jaTem ?? []).map((l) => (l as { place_id: string }).place_id));

  let candidatos: Awaited<ReturnType<typeof searchApify>> = [];
  try {
    candidatos = await searchApify({
      nicho: receita.nicho,
      cidade: receita.cidade,
      uf: receita.uf ?? null,
      lat: null,
      lng: null,
      raioKm: null,
      limite: plano.leadsPermitidos,
      seen,
      log: () => {},
    });
  } catch (e) {
    return await finalizar("erro", {}, `busca falhou: ${e instanceof Error ? e.message : e}`);
  }
  candidatos = candidatos.slice(0, plano.leadsPermitidos);

  let gastoRodada = candidatos.length * teto.custo_lead_usd; // Apify por candidato buscado
  let buscados = 0;
  let qualificados = 0;
  let descartados = 0;
  let preparados = 0;

  // Campanha da rodada (pra revisão do dono). Criada só se houver algo a preparar.
  let campanhaId: string | null = null;
  const nomeCamp = `[Robô] ${receita.nicho} · ${receita.cidade} · ${mesRefAtual(agora)}`;

  const idsQualificados: { leadId: string; motivoNulo: boolean }[] = [];

  for (const p of candidatos) {
    buscados++;
    // Qualificação = mesma do search-leads (núcleo compartilhado: enrich/score).
    let website = p.website;
    let instagram = p.instagram;
    let facebook = p.facebook;
    let email: string | null = null;
    let whatsapp: string | null = firstBrWhatsapp(p.phone);
    let site = null;
    if (website) {
      const enr = await enrichFromWebsite(website, p.phone);
      email = enr.email;
      whatsapp = enr.whatsapp ?? whatsapp;
      instagram = instagram ?? enr.instagram;
      facebook = facebook ?? enr.facebook;
      site = enr.site;
    }
    const breakdown = computeScore({
      hasWebsite: !!website,
      site,
      hasInstagram: !!instagram,
      hasFacebook: !!facebook,
      hasWhatsapp: !!whatsapp,
      hasPhone: !!p.phone,
      hasEmail: !!email,
      rating: p.rating,
      reviewCount: p.review_count,
    });
    const semContato = !temContatoValido(email, whatsapp);
    const row = {
      user_id: userId,
      place_id: p.source_id,
      business_name: p.name,
      address: p.address,
      bairro: extrairBairro(p.address),
      city: receita.cidade,
      state: receita.uf || null,
      phone: p.phone,
      whatsapp,
      website,
      category: p.category ?? receita.nicho,
      rating: p.rating,
      review_count: p.review_count ?? 0,
      has_website: !!website,
      has_phone: !!p.phone,
      email,
      instagram_url: instagram,
      facebook_url: facebook,
      score: breakdown.score,
      score_breakdown: breakdown,
      status: email ? "enriched" : "new",
      enriched_at: website ? new Date().toISOString() : null,
      sem_contato: semContato,
    };
    const { data: up } = await admin
      .from("leads")
      .upsert(row, { onConflict: "user_id,place_id" })
      .select("id")
      .single();
    if (!up) continue;

    // Descarta sem contato (receita exige) OU score abaixo do mínimo.
    if ((receita.exigir_contato && semContato) || breakdown.score < receita.score_minimo) {
      descartados++;
      continue;
    }
    qualificados++;
    idsQualificados.push({ leadId: up.id, motivoNulo: classificarMotivo(breakdown) == null });
  }

  // ------- PREPARAR (site rascunho + proposta rascunho) com vigia de gasto a CADA lead -------
  if (idsQualificados.length > 0) {
    const { data: camp } = await admin
      .from("campanhas")
      .insert({
        user_id: userId,
        list_id: null,
        nome: nomeCamp,
        status: "ativa",
        canal: receita.canal,
        wa_config: receita.canal === "whatsapp" ? (receita.wa_config ?? configPadraoWa()) : null,
      })
      .select("id")
      .single();
    campanhaId = camp!.id;

    // remetente da org (assinatura da copy)
    const { data: perfil } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const remetente = perfil?.full_name ?? "";

    for (const q of idsQualificados) {
      // TETO camada 2: parar ANTES de gastar mais IA se já estourou.
      if (estourou(gastoRodada, gastoMes, teto)) {
        await admin.from("wa_alertas").insert({
          user_id: userId,
          tipo: "automacao_teto",
          mensagem: `Automação "${receita.nome}": teto de gasto atingido no meio da rodada — parou com ${preparados} prontos.`,
        });
        break;
      }
      if (q.motivoNulo) continue; // sem motivo claro → não gera proposta (nada a dizer)

      // Site rascunho via redesign-site (com o JWT do dono) — custo REAL medido depois.
      let redesignId: string | null = null;
      try {
        const rr = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/redesign-site`, {
          method: "POST",
          headers: {
            apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lead_id: q.leadId }),
        });
        const rj = await rr.json();
        redesignId = rj?.redesign?.id ?? null;
        // custo REAL do site (gravado pelo redesign-site em redesigns.custo_usd)
        if (redesignId) {
          const { data: rd } = await admin
            .from("redesigns")
            .select("custo_usd")
            .eq("id", redesignId)
            .maybeSingle();
          gastoRodada += Number(rd?.custo_usd ?? 0);
        }
      } catch {
        continue;
      }
      if (!redesignId) continue;

      // Proposta rascunho (template — mesma copy do gerarPropostaRascunhoSemSite).
      const { data: lead } = await admin
        .from("leads")
        .select("business_name, rating, review_count, category, city, score_breakdown")
        .eq("id", q.leadId)
        .single();
      const motivo = classificarMotivo(lead?.score_breakdown);
      if (!motivo) continue;
      const corpo = montarCorpoProposta(
        {
          nome_negocio: lead!.business_name,
          nota: lead!.rating != null ? Number(lead!.rating) : null,
          n_avaliacoes: lead!.review_count ?? null,
          categoria: lead!.category,
          cidade: lead!.city,
          link: "(o link da prévia é gerado quando você aprovar)",
          remetente,
        },
        motivo,
      );
      const { data: prop } = await admin
        .from("propostas")
        .insert({
          user_id: userId,
          lead_id: q.leadId,
          site_id: null,
          assunto: ASSUNTO_PROPOSTA,
          corpo,
          status: "rascunho",
          campanha_id: campanhaId,
        })
        .select("id")
        .single();

      await admin.from("campanha_leads").insert({
        campanha_id: campanhaId,
        lead_id: q.leadId,
        user_id: userId,
        estado: "rascunho",
        redesign_id: redesignId,
        proposta_id: prop?.id ?? null,
      });
      preparados++;
    }
  }

  const novoLeadsMes = leadsMes + buscados;
  const novoGasto = gastoMes + gastoRodada;

  // Avisa o dono: N prontos pra revisão (o portão — o robô PARA aqui).
  await admin.from("wa_alertas").insert({
    user_id: userId,
    tipo: "automacao_pronto",
    mensagem:
      preparados > 0
        ? `Robô "${receita.nome}": ${preparados} leads prontos pra revisão. Custo da rodada: US$ ${gastoRodada.toFixed(2)}.`
        : `Robô "${receita.nome}": buscou ${buscados}, nenhum qualificado pra preparar (custo US$ ${gastoRodada.toFixed(2)}).`,
  });

  return await finalizar(
    estourou(gastoRodada, gastoMes, teto) ? "parada_teto" : "concluida",
    {
      leads_buscados: buscados,
      leads_qualificados: qualificados,
      leads_descartados: descartados,
      leads_preparados: preparados,
      custo_usd: gastoRodada,
      campanha_id: campanhaId,
    },
    `${preparados} prontos de ${buscados} buscados (${descartados} descartados). US$ ${gastoRodada.toFixed(2)}.`,
    novoLeadsMes,
    novoGasto,
  );
});
