// Edge: buscar-redes — coleta REAL de leads no Instagram/LinkedIn via Apify.
//
// 🔒 AUTH OBRIGATÓRIA (getUser); tudo escopado por user_id do JWT.
// 💸 TETO DE GASTO em 2 camadas (regra do projeto: coleta paga não liga sem teto):
//    1) ANTES  — soma o gasto do mês (tabela redes_buscas) e limita maxItems do run.
//    2) DEPOIS — lê o custo REAL do run na Apify e registra. Estourou → próxima é bloqueada.
// MESMO PIPELINE: o resultado vira linha de `leads` (perfilParaLead/pessoaParaLead) com
// origem_fonte/origem_estrategia, passa pelo MESMO score e cai no MESMO funil.
//
// Ações:
//   verificar  -> só checa se o ator existe/está acessível. NÃO roda nada, NÃO gasta.
//   buscar     -> roda de verdade, respeitando o teto.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { computeScore } from "../_shared/score.ts";
import {
  planejarColeta,
  estourouColeta,
  TETO_RODADA_USD,
  TETO_MES_USD,
} from "../../../src/lib/redes-teto.ts";
import { mesRefAtual } from "../../../src/lib/automacao-teto.ts";
import { lerConfigPlataforma } from "../_shared/config.ts";
import { estrategiaPorId, perfilParaLead } from "../../../src/lib/fontes-prospeccao.ts";

const API = "https://api.apify.com/v2";

/** Ator da Apify por estratégia. Só as 5 VIÁVEIS estão aqui — as frágeis/planejadas não
 *  entram até valerem o gasto. Quem não está no mapa é recusado antes de qualquer chamada. */
const ATOR: Record<string, { ator: string; monta: (c: Rec) => Rec }> = {
  // Instagram — o mesmo ator oficial cobre hashtag/busca; o filtro fino é NOSSO.
  "IG-5": {
    ator: "apify~instagram-scraper",
    monta: (c) => ({
      search: `${c.nicho ?? ""} ${c.cidade ?? ""}`.trim(),
      searchType: "user",
      resultsType: "details",
    }),
  },
  "IG-7": {
    ator: "apify~instagram-scraper",
    monta: (c) => ({
      search: `${c.nicho ?? ""} ${c.cidade ?? ""}`.trim(),
      searchType: "user",
      resultsType: "details",
    }),
  },
  "IG-8": {
    ator: "apify~instagram-scraper",
    monta: (c) => ({
      search: `${c.categoria ?? ""} ${c.cidade ?? ""}`.trim(),
      searchType: "user",
      resultsType: "details",
    }),
  },
  "IG-9": {
    ator: "apify~instagram-scraper",
    monta: (c) => ({
      search: `${c.nicho ?? ""} ${c.cidade ?? ""}`.trim(),
      searchType: "user",
      resultsType: "details",
    }),
  },
  // LinkedIn — empresa por setor/região; o "site ruim" quem decide é o NOSSO score.
  "LI-4": {
    ator: "harvestapi~linkedin-company-search",
    monta: (c) => ({
      searchQuery: String(c.setor ?? "").trim(),
      locations: c.regiao ? [String(c.regiao).trim()] : [],
      scraperMode: "full",
    }),
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

const token = () => Deno.env.get("APIFY_API_TOKEN") ?? "";

/** Existe/está acessível? NÃO roda o ator — só lê os metadados (grátis). */
async function checarAtor(ator: string) {
  const r = await fetch(`${API}/acts/${ator}?token=${encodeURIComponent(token())}`);
  if (!r.ok) return { ok: false, status: r.status };
  const j = await r.json().catch(() => ({}) as Rec);
  return {
    ok: true,
    status: r.status,
    nome: j?.data?.name ?? ator,
    titulo: j?.data?.title ?? null,
    precoModelo: j?.data?.pricingInfos?.[0]?.pricingModel ?? "desconhecido",
  };
}

/** O link da bio é um SITE PRÓPRIO? Agregador (linktree), rede social ou link de WhatsApp NÃO é
 *  site — e é exatamente esse perfil que a IG-5 procura ("só tem Instagram, sem site"). */
const NAO_E_SITE =
  /(^|\.)(wa\.me|api\.whatsapp\.com|whatsapp\.com|linktr\.ee|linktree\.|beacons\.ai|bio\.link|linkin\.bio|linkbio|campsite\.bio|msha\.ke|instagram\.com|facebook\.com|fb\.me|youtube\.com|youtu\.be|tiktok\.com|twitter\.com|x\.com|t\.me|linktr\.)/i;
function ehSiteProprio(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const h = new URL(String(url)).hostname;
    return !NAO_E_SITE.test(h);
  } catch {
    return false;
  }
}

/** Link de WhatsApp na bio é presente: vira contato de verdade, não lixo. */
function whatsDoLink(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = String(url).match(/(?:wa\.me|api\.whatsapp\.com\/send)[/?].*?(\d{10,15})/i);
  if (!m) return null;
  const d = m[1];
  const full = d.startsWith("55") ? d : "55" + d;
  return full.length >= 12 && full.length <= 13 ? full : null;
}

/** Extrai o texto todo do item para garimpar e-mail/WhatsApp da bio (nunca inventa). */
function achaEmail(txt: string): string | null {
  const m = txt.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
  return m ? m[0].replace(/[.,;]$/, "") : null;
}
function achaWhats(txt: string): string | null {
  const m = txt.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/);
  if (!m) return null;
  const d = m[0].replace(/\D/g, "");
  const full = d.length <= 11 ? "55" + d : d;
  return full.length >= 12 && full.length <= 13 ? full : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!token()) return json({ error: "APIFY_API_TOKEN não configurada" }, 503);

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

  // ⚙️ CONFIGURAÇÕES (admin): teto de gasto override — null = usa o padrão de redes-teto.ts
  const configPlataforma = await lerConfigPlataforma(admin);
  const TETO_RODADA = configPlataforma.teto_rodada_usd ?? TETO_RODADA_USD;
  const TETO_MES = configPlataforma.teto_mes_usd ?? TETO_MES_USD;

  let b: Rec = {};
  try {
    b = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const acao = String(b?.acao || "buscar");

  // ---------- VERIFICAR: não roda nada, não gasta ----------
  if (acao === "verificar") {
    const vistos = new Map<string, unknown>();
    for (const [estr, cfg] of Object.entries(ATOR)) {
      if (!vistos.has(cfg.ator)) vistos.set(cfg.ator, await checarAtor(cfg.ator));
      vistos.set(estr, vistos.get(cfg.ator));
    }
    const atores: Rec = {};
    for (const [estr, cfg] of Object.entries(ATOR))
      atores[estr] = { ator: cfg.ator, ...(vistos.get(cfg.ator) as Rec) };
    return json({ ok: true, atores, teto: { rodada: TETO_RODADA, mes: TETO_MES } });
  }

  // ---------- BUSCAR ----------
  const estrategiaId = String(b?.estrategia || "");
  const estrategia = estrategiaPorId(estrategiaId);
  if (!estrategia) return json({ ok: false, reason: "estrategia_desconhecida" });
  const cfg = ATOR[estrategiaId];
  if (!cfg) return json({ ok: false, reason: "estrategia_sem_coleta", estrategia: estrategiaId });

  const campos: Rec = b?.campos ?? {};
  const limitePedido = Math.max(1, Math.min(200, Number(b?.limite ?? 50)));
  const agora = new Date();
  const mesRef = mesRefAtual(agora);

  // CAMADA 1 — teto ANTES de gastar
  const { data: doMes } = await admin
    .from("redes_buscas")
    .select("custo_usd")
    .eq("user_id", userId)
    .eq("mes_ref", mesRef);
  const gastoMes = (doMes ?? []).reduce((s, r) => s + Number(r.custo_usd ?? 0), 0);
  const plano = planejarColeta(gastoMes, limitePedido, TETO_RODADA, TETO_MES);
  if (!plano.podeRodar) {
    await admin.from("redes_buscas").insert({
      user_id: userId,
      fonte: estrategia.fonte,
      estrategia: estrategiaId,
      pedido: campos,
      limite: limitePedido,
      status: "parada_teto",
      detalhe: plano.motivo,
      mes_ref: mesRef,
      concluida_em: new Date().toISOString(),
    });
    return json({
      ok: false,
      reason: "teto",
      motivo: plano.motivo,
      gastoMes,
      teto: { rodada: TETO_RODADA, mes: TETO_MES },
    });
  }

  const { data: registro } = await admin
    .from("redes_buscas")
    .insert({
      user_id: userId,
      fonte: estrategia.fonte,
      estrategia: estrategiaId,
      pedido: campos,
      limite: plano.maxItens,
      status: "rodando",
      mes_ref: mesRef,
    })
    .select("id")
    .single();

  const finalizar = async (patch: Rec) =>
    await admin
      .from("redes_buscas")
      .update({ ...patch, concluida_em: new Date().toISOString() })
      .eq("id", registro?.id);

  try {
    // roda o ator com o teto TRADUZIDO em limite de itens + timeout
    const input = {
      ...cfg.monta(campos),
      searchLimit: plano.maxItens,
      resultsLimit: plano.maxItens,
      maxItems: plano.maxItens,
    };
    const start = await fetch(
      `${API}/acts/${cfg.ator}/runs?token=${encodeURIComponent(token())}&timeout=300&memory=1024`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!start.ok) {
      const t = await start.text().catch(() => "");
      await finalizar({ status: "erro", detalhe: `Apify ${start.status}: ${t.slice(0, 200)}` });
      return json({
        ok: false,
        reason: "apify_falhou",
        status: start.status,
        detalhe: t.slice(0, 300),
      });
    }
    const runId = (await start.json())?.data?.id;

    // aguarda o run (com teto de tempo — o edge não pode ficar preso)
    let status = "READY";
    let custo = 0;
    let datasetId: string | null = null;
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const st = await fetch(`${API}/actor-runs/${runId}?token=${encodeURIComponent(token())}`);
      const sj = await st.json().catch(() => ({}) as Rec);
      status = sj?.data?.status ?? "UNKNOWN";
      custo = Number(sj?.data?.usageTotalUsd ?? 0);
      datasetId = sj?.data?.defaultDatasetId ?? null;
      if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
      // trava de segurança: se o run já passou do teto da rodada, aborta na hora
      if (custo >= TETO_RODADA) {
        await fetch(`${API}/actor-runs/${runId}/abort?token=${encodeURIComponent(token())}`, {
          method: "POST",
        }).catch(() => {});
        await finalizar({
          status: "parada_teto",
          custo_usd: custo,
          detalhe: "run abortado no teto",
        });
        return json({ ok: false, reason: "teto_no_run", custo });
      }
    }

    if (status !== "SUCCEEDED" || !datasetId) {
      await finalizar({ status: "erro", custo_usd: custo, detalhe: `run ${status}` });
      return json({ ok: false, reason: "run_nao_concluiu", status, custo });
    }

    const dsRes = await fetch(
      `${API}/datasets/${datasetId}/items?token=${encodeURIComponent(token())}&limit=${plano.maxItens}`,
    );
    const itens: Rec[] = await dsRes.json().catch(() => []);

    // ---------- MESMO PIPELINE: vira `leads`, passa pelo MESMO score ----------
    let inseridos = 0;
    let descartados = 0;
    for (const it of itens.slice(0, plano.maxItens)) {
      const txt = JSON.stringify(it);
      let lead: Rec | null = null;

      if (estrategia.fonte === "instagram") {
        const username = it.username ?? it.ownerUsername ?? null;
        if (!username) continue;
        const bio = it.biography ?? it.bio ?? "";
        const link = it.externalUrl ?? it.website ?? null;
        const temSiteProprio = ehSiteProprio(link);
        // IG-5 "sem site na bio": descarta só quem tem SITE PRÓPRIO. Link de WhatsApp ou
        // linktree NÃO é site — esse perfil é exatamente o alvo.
        if (estrategiaId === "IG-5" && temSiteProprio) continue;
        // só conta contas comerciais quando o dono pediu isso
        if (campos.soComerciais && it.isBusinessAccount === false) continue;
        lead = perfilParaLead(
          {
            username,
            nome: it.fullName ?? it.name ?? null,
            bio,
            linkBio: temSiteProprio ? link : null,
            email: it.businessEmail ?? achaEmail(bio) ?? null,
            whatsapp: it.businessPhoneNumber ?? whatsDoLink(link) ?? achaWhats(bio) ?? null,
            categoria: it.businessCategoryName ?? it.category ?? null,
            cidade: String(campos.cidade ?? "") || null,
            seguidores: Number(it.followersCount ?? 0) || null,
          },
          estrategiaId,
        );
        // IG-7 "alto engajamento, baixa presença": cálculo NOSSO sobre o que veio.
        if (estrategiaId === "IG-7") {
          const seg = Number(it.followersCount ?? 0);
          const minSeg = Number(campos.minSeguidores ?? 0);
          if (seg < minSeg) continue;
        }
      } else {
        // LI-4 busca EMPRESA (não pessoa): o lead é a empresa. owner_name/cargo ficam vazios —
        // gravar o nome da empresa como "dono" seria mentir sobre quem é o contato.
        const slug =
          it.publicIdentifier ?? it.universalName ?? it.slug ?? it.linkedinUrl ?? it.id ?? null;
        if (!slug) continue;
        const nome = it.name ?? it.companyName ?? it.title ?? null;
        if (!nome) continue;
        lead = {
          place_id: `li:${String(slug)
            .replace(/^https?:\/\/[^/]+\/company\//, "")
            .replace(/\/$/, "")}`,
          business_name: String(nome).trim(),
          linkedin_url: it.linkedinUrl ?? `https://linkedin.com/company/${slug}`,
          website: it.websiteUrl ?? it.website ?? null,
          category: it.industry ?? (String(campos.setor ?? "") || null),
          city: it.location ?? (String(campos.regiao ?? "") || null),
          email: achaEmail(txt),
          status: "new",
          origem_fonte: "linkedin",
          origem_estrategia: estrategiaId,
        };
      }
      if (!lead) continue;

      // MESMO score do Maps — nada de régua paralela.
      const sc = computeScore({
        business_name: lead.business_name ?? "",
        website: lead.website ?? null,
        phone: lead.phone ?? null,
        email: lead.email ?? null,
        rating: null,
        review_count: null,
        instagram_url: lead.instagram_url ?? null,
        facebook_url: null,
      });
      lead.score = sc.score;
      lead.score_breakdown = sc;
      lead.user_id = userId;
      lead.sem_contato = !lead.email && !lead.whatsapp && !lead.phone && !lead.website;
      // Coleta PAGA não guarda peso morto: sem e-mail, WhatsApp, telefone nem site, o lead não
      // é acionável por nenhuma campanha nossa. Descarta em vez de encher a base (foi por isso
      // que 101 leads sem canal foram apagados).
      if (lead.sem_contato) {
        descartados++;
        continue;
      }

      const { error } = await admin
        .from("leads")
        .upsert(lead, { onConflict: "user_id,place_id", ignoreDuplicates: false });
      if (!error) inseridos++;
    }

    const estourou = estourouColeta(custo, gastoMes, TETO_RODADA, TETO_MES);
    await finalizar({
      status: estourou ? "parada_teto" : "concluida",
      custo_usd: custo,
      encontrados: itens.length,
      inseridos,
      detalhe: estourou ? "custo real bateu o teto" : null,
    });

    return json({
      ok: true,
      estrategia: estrategiaId,
      amostra: itens[0] ? Object.keys(itens[0]).slice(0, 40) : null,
      amostraValores: itens[0]
        ? {
            username: itens[0].username ?? null,
            externalUrl: itens[0].externalUrl ?? null,
            followersCount: itens[0].followersCount ?? null,
            name: itens[0].name ?? null,
          }
        : null,
      encontrados: itens.length,
      inseridos,
      descartados,
      custo,
      gastoMesDepois: gastoMes + custo,
      teto: { rodada: TETO_RODADA, mes: TETO_MES },
      estourou,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finalizar({ status: "erro", detalhe: msg.slice(0, 300) });
    return json({ ok: false, reason: "erro", detalhe: msg.slice(0, 300) });
  }
});
