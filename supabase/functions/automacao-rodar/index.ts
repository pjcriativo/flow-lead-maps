// Edge: automacao-rodar — O ROBÔ. Executa UMA rodada de uma receita: busca leads NOVOS (Apify),
// qualifica (score) e DESCARTA sem contato, gera site RASCUNHO (custo real) + proposta rascunho,
// cria a campanha pra revisão e PARA no portão avisando "N prontos". NUNCA envia.
//
// 🚨 TETO DE GASTO em 2 camadas (src/lib/automacao-teto): (1) planejarRodada limita os leads ANTES
// de gastar; (2) o gasto REAL (Apify + custo de IA de cada site) é checado a CADA lead — bateu,
// para na hora com status 'parada_teto'.
//
// DOIS modos:
//  - MANUAL: JWT do dono + {receita_id} → roda essa receita.
//  - CRON (x-cron-secret): roda TODAS as receitas 'ativa' que estão VENCIDAS (diária/semanal).
//    Sem JWT do dono, o cron MINTA um token do dono (generateLink+verifyOtp — não envia e-mail)
//    só pra chamar o redesign-site (que exige RLS do usuário).
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
const SUPA = () => Deno.env.get("SUPABASE_URL")!;
const ANON = () => Deno.env.get("SUPABASE_ANON_KEY")!;
const SRV = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const temContatoValido = (email: string | null, whatsapp: string | null) =>
  Boolean((email && /@.+\..+/.test(email)) || whatsapp);

/** Receita 'ativa' está VENCIDA para o cron? (manual nunca vence pelo cron.) */
function estaVencida(
  r: { frequencia: string; ultima_rodada_em: string | null },
  agora: Date,
): boolean {
  if (r.frequencia === "manual") return false;
  if (!r.ultima_rodada_em) return true;
  const horas = (agora.getTime() - new Date(r.ultima_rodada_em).getTime()) / 3.6e6;
  if (r.frequencia === "diaria") return horas >= 23;
  if (r.frequencia === "semanal") return horas >= 24 * 6.9;
  return false;
}

/** Minta um token do dono (para o cron chamar o redesign-site com RLS). Não envia e-mail. */
async function tokenDoDono(admin: Admin, userId: string): Promise<string | null> {
  const { data: u } = await admin.auth.admin.getUserById(userId);
  const email = u?.user?.email;
  if (!email) return null;
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = lk?.properties?.hashed_token;
  if (!hashed) return null;
  const anon = createClient(SUPA(), ANON(), { auth: { persistSession: false } });
  const { data: se } = await anon.auth.verifyOtp({ token_hash: hashed, type: "magiclink" });
  return se?.session?.access_token ? `Bearer ${se.session.access_token}` : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Receita = any;

/** Executa UMA rodada de uma receita. Usado pelo modo manual e pelo cron. */
async function executarRodada(admin: Admin, userId: string, authHeader: string, receita: Receita) {
  const agora = new Date();
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

  const { data: rodada } = await admin
    .from("automacao_rodadas")
    .insert({ user_id: userId, receita_id: receita.id, status: "rodando" })
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
      .eq("id", receita.id);
    return { status, detalhe, rodada_id: rodadaId, ...campos };
  };

  if (!plano.podeRodar) {
    await admin.from("wa_alertas").insert({
      user_id: userId,
      tipo: "automacao_teto",
      mensagem: `Automação "${receita.nome}" pausada: ${plano.motivo}.`,
    });
    return await finalizar("parada_teto", {}, plano.motivo ?? "teto atingido");
  }

  const { data: jaTem } = await admin.from("leads").select("place_id").eq("user_id", userId);
  const seen = new Set((jaTem ?? []).map((l: { place_id: string }) => l.place_id));

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

  let gastoRodada = candidatos.length * teto.custo_lead_usd;
  let buscados = 0;
  let qualificados = 0;
  let descartados = 0;
  let preparados = 0;
  let campanhaId: string | null = null;
  const idsQualificados: { leadId: string; motivoNulo: boolean }[] = [];

  for (const p of candidatos) {
    buscados++;
    const website = p.website;
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
    if ((receita.exigir_contato && semContato) || breakdown.score < receita.score_minimo) {
      descartados++;
      continue;
    }
    qualificados++;
    idsQualificados.push({ leadId: up.id, motivoNulo: classificarMotivo(breakdown) == null });
  }

  if (idsQualificados.length > 0) {
    const { data: camp } = await admin
      .from("campanhas")
      .insert({
        user_id: userId,
        list_id: null,
        nome: `[Robô] ${receita.nicho} · ${receita.cidade} · ${mesRefAtual(agora)}`,
        status: "ativa",
        canal: receita.canal,
        wa_config: receita.canal === "whatsapp" ? (receita.wa_config ?? configPadraoWa()) : null,
      })
      .select("id")
      .single();
    campanhaId = camp!.id;

    const { data: perfil } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const remetente = perfil?.full_name ?? "";

    for (const q of idsQualificados) {
      if (estourou(gastoRodada, gastoMes, teto)) {
        await admin.from("wa_alertas").insert({
          user_id: userId,
          tipo: "automacao_teto",
          mensagem: `Automação "${receita.nome}": teto de gasto atingido no meio da rodada — parou com ${preparados} prontos.`,
        });
        break;
      }
      if (q.motivoNulo) continue;

      let redesignId: string | null = null;
      try {
        const rr = await fetch(`${SUPA()}/functions/v1/redesign-site`, {
          method: "POST",
          headers: {
            apikey: ANON(),
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lead_id: q.leadId }),
        });
        const rj = await rr.json();
        redesignId = rj?.redesign?.id ?? null;
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
    leadsMes + buscados,
    gastoMes + gastoRodada,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const admin = createClient(SUPA(), SRV(), { auth: { persistSession: false } });

  // -------- MODO CRON (x-cron-secret): roda todas as 'ativa' vencidas --------
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) {
    const agora = new Date();
    const { data: receitas } = await admin.from("automacao_receitas").select("*").eq("ativa", true);
    const vencidas = (receitas ?? []).filter((r: Receita) => estaVencida(r, agora));
    const resultados: unknown[] = [];
    for (const r of vencidas) {
      const auth = await tokenDoDono(admin, r.user_id);
      if (!auth) {
        resultados.push({ receita: r.id, erro: "sem token do dono" });
        continue;
      }
      resultados.push({ receita: r.id, ...(await executarRodada(admin, r.user_id, auth, r)) });
    }
    return json({ modo: "cron", rodadas: resultados.length, resultados });
  }

  // -------- MODO MANUAL (JWT do dono) --------
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPA(), ANON(), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  let b: { receita_id?: string };
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const receitaId = String(b.receita_id || "");
  if (!receitaId) return json({ error: "Informe receita_id" }, 400);

  const { data: receita } = await admin
    .from("automacao_receitas")
    .select("*")
    .eq("id", receitaId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!receita) return json({ error: "Receita não encontrada" }, 404);

  return json(await executarRodada(admin, userId, authHeader, receita));
});
