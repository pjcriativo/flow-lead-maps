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
import { acessoFerramentaLiberado } from "../_shared/acesso.ts";
import { computeScore } from "../_shared/score.ts";
import {
  planejarColeta,
  estourouColeta,
  limitesRunApify,
  TETO_REDES_RODADA_USD,
  TETO_REDES_MES_USD,
} from "../../../src/lib/redes-teto.ts";
import { criarChaveCacheRedes } from "../../../src/lib/redes-economia.ts";
import { mesRefAtual } from "../../../src/lib/automacao-teto.ts";
import { lerConfigPlataforma } from "../_shared/config.ts";
import {
  carregarPoolApify,
  startRunComPool,
  tratarRunMorto,
  type ChaveApify,
} from "../_shared/apify-pool.ts";
import { estrategiaPorId, perfilParaLead } from "../../../src/lib/fontes-prospeccao.ts";
import {
  calcularScoreInstagram,
  motivoRejeicaoInstagram,
  perfilEhProfissionalInstagram,
  perfilTemLocalidade,
  perfilTemNicho,
  temSiteProprioInstagram,
  type InstagramRejectionReason,
} from "../../../src/lib/instagram-search.ts";
import { montarPlanoDescobertaInstagram } from "../../../src/lib/instagram-discovery.ts";
import { consumir, estadoConsumo, orgDoUsuario } from "../_shared/limite.ts";
import { liberarCacheRedes, prepararCacheRedes, salvarCacheRedes } from "../_shared/redes-cache.ts";
import { decifrar } from "../_shared/cofre.ts";

const API = "https://api.apify.com/v2";

/** Ator da Apify por estratégia. Só as 5 VIÁVEIS estão aqui — as frágeis/planejadas não
 *  entram até valerem o gasto. Quem não está no mapa é recusado antes de qualquer chamada. */
const ATOR: Record<string, { ator: string; monta: (c: Rec) => Rec }> = {
  "IG-LOCAL": {
    ator: "apify~instagram-scraper",
    monta: (c) => ({
      search: c.buscaComposta ?? `${c.nicho ?? ""} ${c.cidade ?? ""}`.trim(),
      searchType: "user",
      resultsType: "details",
      addProfileStatistics: true,
    }),
  },
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

// 🔐 Cofre de chaves: _apifyTokenCache é resolvido 1x no início do handler (resolverChave) —
// Deno.env.set não funciona no runtime das Edges, então token() lê deste cache de módulo.
let _apifyTokenCache: string | null = null;
const token = () => _apifyTokenCache ?? Deno.env.get("APIFY_API_TOKEN") ?? "";

/** Existe/está acessível? NÃO roda o ator — só lê os metadados (grátis). */
async function checarAtor(ator: string) {
  const r = await fetch(`${API}/acts/${ator}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
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

async function processarResultados(params: {
  admin: Rec;
  itens: Rec[];
  limite: number;
  metaQualificados: number;
  estrategiaId: string;
  fonte: "instagram" | "linkedin";
  campos: Rec;
  orgId: string;
  userId: string;
  searchId: string;
  somenteNovos?: boolean;
}) {
  const {
    admin,
    itens,
    limite,
    metaQualificados,
    estrategiaId,
    fonte,
    campos,
    orgId,
    userId,
    searchId,
    somenteNovos = true,
  } = params;
  let inseridos = 0;
  let aprovados = 0;
  let duplicados = 0;
  let analisados = 0;
  const leadIds: string[] = [];
  const newLeadIds: string[] = [];
  const rejeitados: Record<string, number> = {};
  const resultadosBusca: Rec[] = [];
  const usernamesVistos = new Set<string>();
  const registrarRejeicao = (motivo: InstagramRejectionReason | "sem_contato" | "erro_banco") => {
    rejeitados[motivo] = (rejeitados[motivo] ?? 0) + 1;
  };

  for (const it of itens.slice(0, limite)) {
    if (leadIds.length >= metaQualificados) break;
    const txt = JSON.stringify(it);
    let lead: Rec | null = null;
    let perfilRow: Rec | null = null;
    let usernameNormalizado: string | null = null;
    let scoreInstagram: number | null = null;
    analisados++;
    if (fonte === "instagram") {
      const username = it.username ?? it.ownerUsername ?? null;
      usernameNormalizado = String(username ?? "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
      if (usernameNormalizado && usernamesVistos.has(usernameNormalizado)) {
        analisados--;
        continue;
      }
      if (usernameNormalizado) usernamesVistos.add(usernameNormalizado);
      const bio = it.biography ?? it.bio ?? "";
      const link = it.externalUrl ?? it.website ?? null;
      const temSiteProprio = temSiteProprioInstagram(link);
      const email = it.businessEmail ?? achaEmail(bio) ?? null;
      const whatsapp = it.businessPhoneNumber ?? whatsDoLink(link) ?? achaWhats(bio) ?? null;
      const temContatoExterno = !!email || !!whatsapp || temSiteProprio;
      const perfil = { ...it, username };
      const filtros = {
        nicho: String(campos.nicho ?? campos.categoria ?? ""),
        cidade: String(campos.cidade ?? ""),
        minSeguidores: Number(campos.minSeguidores ?? 0),
        soComerciais: Boolean(campos.soComerciais),
        exigirLocalidade:
          campos.exigirLocalidade === undefined
            ? estrategiaId === "IG-LOCAL"
            : Boolean(campos.exigirLocalidade),
        semSiteProprio: estrategiaId === "IG-5" || Boolean(campos.semSiteProprio),
        exigirContatoExterno: Boolean(campos.exigirContatoExterno),
      };
      const motivo = motivoRejeicaoInstagram(perfil, filtros, temContatoExterno);
      if (motivo) {
        registrarRejeicao(motivo);
        resultadosBusca.push({
          search_id: searchId,
          org_id: orgId,
          user_id: userId,
          username: usernameNormalizado || `invalido-${analisados}`,
          decision: "rejected",
          rejection_reason: motivo,
          rank: analisados,
          is_new: false,
          profile_snapshot: perfil,
        });
        continue;
      }
      const localidadeConfirmada = perfilTemLocalidade(perfil, filtros.cidade);
      const nichoConfirmado = perfilTemNicho(perfil, filtros.nicho);
      const seguidores = Number(it.followersCount ?? 0);
      lead = perfilParaLead(
        {
          username: String(username),
          nome: it.fullName ?? it.name ?? null,
          bio,
          linkBio: temSiteProprio ? link : null,
          email,
          whatsapp,
          categoria: it.businessCategoryName ?? it.category ?? null,
          cidade: localidadeConfirmada ? String(campos.cidade ?? "") || null : null,
          seguidores: seguidores || null,
        },
        estrategiaId,
      );
      lead.state = localidadeConfirmada ? String(campos.uf ?? "") || null : null;
      const aderencia = calcularScoreInstagram({
        temNicho: nichoConfirmado,
        temLocalidade: localidadeConfirmada,
        comercial: perfilEhProfissionalInstagram(perfil),
        temContatoExterno,
        semSiteProprio: !temSiteProprio,
        seguidores,
      });
      lead.score = aderencia.score;
      lead.score_breakdown = aderencia.breakdown;
      scoreInstagram = aderencia.score;

      const posts = Array.isArray(it.latestPosts)
        ? it.latestPosts
        : Array.isArray(it.recentPosts)
          ? it.recentPosts
          : [];
      const postMetrics = posts.slice(0, 12).map((post: Rec) => ({
        likes: Number(post.likesCount ?? post.likes ?? 0),
        comments: Number(post.commentsCount ?? post.comments ?? 0),
      }));
      const media = (campo: "likes" | "comments") =>
        postMetrics.length
          ? postMetrics.reduce((total: number, post: Rec) => total + Number(post[campo]), 0) /
            postMetrics.length
          : null;
      const avgLikes = media("likes");
      const avgComments = media("comments");
      const engagement =
        seguidores > 0 && avgLikes != null && avgComments != null
          ? ((avgLikes + avgComments) / seguidores) * 100
          : null;
      const primeiraData = posts
        .map((post: Rec) => post.timestamp ?? post.takenAtTimestamp ?? post.createdAt)
        .find(Boolean);
      perfilRow = {
        org_id: orgId,
        user_id: userId,
        username: usernameNormalizado,
        instagram_user_id: String(it.id ?? it.instagramId ?? it.ownerId ?? "") || null,
        full_name: it.fullName ?? it.name ?? null,
        biography: bio || null,
        profile_pic_url: it.profilePicUrlHD ?? it.profilePicUrl ?? it.profilePictureUrl ?? null,
        external_url: link,
        bio_links: Array.isArray(it.bioLinks) ? it.bioLinks : link ? [{ url: link }] : [],
        followers_count: seguidores || null,
        following_count: Number(it.followsCount ?? it.followingCount ?? 0) || null,
        posts_count: Number(it.postsCount ?? it.mediaCount ?? 0) || null,
        verified: Boolean(it.verified ?? it.isVerified),
        private: Boolean(it.private ?? it.isPrivate),
        professional: perfilEhProfissionalInstagram(perfil),
        account_type: String(it.accountType ?? it.statistics?.accountType ?? "") || null,
        business_category: it.businessCategoryName ?? it.category ?? null,
        business_email: email,
        business_phone: whatsapp,
        business_address: it.businessAddress ?? null,
        last_post_at: primeiraData ? new Date(primeiraData).toISOString() : null,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        engagement_rate: engagement,
        recent_posts: posts.slice(0, 12),
        related_profiles: Array.isArray(it.relatedProfiles) ? it.relatedProfiles.slice(0, 20) : [],
        raw_payload: it,
        collected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
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
    if (fonte !== "instagram") {
      const sc = computeScore({
        hasWebsite: !!lead.website,
        site: null,
        hasInstagram: !!lead.instagram_url,
        hasFacebook: false,
        hasWhatsapp: !!lead.whatsapp,
        hasPhone: !!lead.phone,
        hasEmail: !!lead.email,
        rating: null,
        reviewCount: null,
      });
      lead.score = sc.score;
      lead.score_breakdown = sc;
    }
    lead.org_id = orgId;
    lead.user_id = userId;
    lead.assigned_to = userId;
    lead.sem_contato =
      !lead.instagram_url && !lead.email && !lead.whatsapp && !lead.phone && !lead.website;
    if (lead.sem_contato) {
      registrarRejeicao("sem_contato");
      continue;
    }
    aprovados++;
    const { data: existente } = await admin
      .from("leads")
      .select("id")
      .eq("org_id", orgId)
      .eq("place_id", lead.place_id)
      .maybeSingle();
    let leadId = existente?.id ?? null;
    let novo = false;
    if (!leadId) {
      const { data: insertedLead, error } = await admin
        .from("leads")
        .insert(lead)
        .select("id")
        .single();
      if (error || !insertedLead) {
        registrarRejeicao("erro_banco");
        if (fonte === "instagram") {
          resultadosBusca.push({
            search_id: searchId,
            org_id: orgId,
            user_id: userId,
            username: usernameNormalizado,
            decision: "rejected",
            rejection_reason: "erro_banco",
            rank: analisados,
            is_new: false,
            score: scoreInstagram,
            profile_snapshot: it,
          });
        }
        continue;
      }
      leadId = insertedLead.id;
      novo = true;
      inseridos++;
      newLeadIds.push(leadId);
    } else {
      duplicados++;
    }

    if (fonte === "instagram" && perfilRow && leadId) {
      await admin
        .from("instagram_profiles")
        .upsert({ ...perfilRow, lead_id: leadId }, { onConflict: "lead_id" });
      resultadosBusca.push({
        search_id: searchId,
        org_id: orgId,
        user_id: userId,
        username: usernameNormalizado,
        lead_id: leadId,
        decision: novo ? "approved" : "duplicate",
        rank: analisados,
        is_new: novo,
        score: scoreInstagram,
        profile_snapshot: it,
      });
    }
    if (novo || !somenteNovos) leadIds.push(leadId);
  }
  if (resultadosBusca.length > 0) {
    const { error } = await admin.from("instagram_search_results").upsert(resultadosBusca, {
      onConflict: "search_id,username",
    });
    if (error) console.warn(`Falha ao salvar auditoria Instagram: ${error.message}`);
  }
  const descartados = Object.values(rejeitados).reduce((total, valor) => total + valor, 0);
  const motivoParada = leadIds.length >= metaQualificados ? "meta_atingida" : "fonte_esgotada";
  return {
    inseridos,
    descartados,
    leadIds,
    newLeadIds,
    motivoParada,
    resumo: {
      analisados,
      aprovados,
      entregues: leadIds.length,
      meta: metaQualificados,
      novos: inseridos,
      duplicados,
      rejeitados,
      motivoParada,
    },
  };
}

async function tokenDaChaveDoRun(
  admin: Rec,
  chaveId: string | null,
  pool: ChaveApify[],
): Promise<string | null> {
  if (!chaveId) return (pool[0]?.token ?? token()) || null;
  const ativa = pool.find((chave) => chave.id === chaveId);
  if (ativa) return ativa.token;
  const { data } = await admin
    .from("apify_chaves")
    .select("valor_cifrado")
    .eq("id", chaveId)
    .maybeSingle();
  if (!data?.valor_cifrado) return null;
  try {
    return await decifrar(data.valor_cifrado);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  // 🔑 POOL DE CHAVES (Etapa 3): a chave corrente do rodízio alimenta o token() usado pelo
  // "verificar" (checarAtor, grátis). Pool vazio cai na chave única do cofre/secret; pool
  // configurado mas todo esgotado → PARAR com aviso claro, nunca falhar calado.
  const poolInicial = await carregarPoolApify(admin);
  _apifyTokenCache = poolInicial.chaves[0]?.token ?? null;
  // ⚠️ Guard EXPLÍCITO no pool (não em token(), que tem fallback pro secret do env): com o
  // pool CONFIGURADO, ele é a fonte da verdade — todo indisponível = PARAR com aviso, nunca
  // cair calado no secret (furo pego pela prova adversarial).
  if (poolInicial.chaves.length === 0)
    return json(
      {
        error: poolInicial.poolConfigurado
          ? "Todas as chaves Apify do pool estão esgotadas/indisponíveis — cadastre ou reative uma em Configurações → Chaves e integrações."
          : "APIFY_API_TOKEN não configurada",
      },
      503,
    );

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  if (!(await acessoFerramentaLiberado(userClient, userData.user.id)))
    return json({ error: "Acesso aguardando liberação do administrador" }, 403);
  const userId = userData.user.id;
  const orgId = await orgDoUsuario(admin, userId);
  if (!orgId) return json({ error: "Sua conta ainda não possui uma organização válida." }, 409);

  // ⚙️ CONFIGURAÇÕES (admin): teto de gasto override — null = usa o padrão de redes-teto.ts
  const configPlataforma = await lerConfigPlataforma(admin);
  const TETO_RODADA = configPlataforma.teto_redes_rodada_usd ?? TETO_REDES_RODADA_USD;
  const TETO_MES = configPlataforma.teto_redes_mes_usd ?? TETO_REDES_MES_USD;

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

  // ---------- RECUPERAR: consulta o MESMO run após timeout HTTP; nunca inicia outra cobrança ----------
  if (acao === "recuperar") {
    const requestId = String(b?.requestId ?? "");
    if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId))
      return json({ ok: false, reason: "request_id_invalido" }, 400);
    const { data: registro } = await admin
      .from("redes_buscas")
      .select(
        "id, fonte, estrategia, pedido, limite, meta_qualificados, candidatos_solicitados, consultas, mes_ref, status, resultado, apify_run_id, apify_dataset_id, apify_chave_id, cache_key, chave_apelido",
      )
      .eq("user_id", userId)
      .eq("request_id", requestId)
      .maybeSingle();
    if (!registro) return json({ ok: false, reason: "busca_nao_encontrada" }, 404);
    if (registro.resultado) return json(registro.resultado);
    if (!registro.apify_run_id)
      return json({ ok: true, pendente: true, requestId, status: registro.status });

    const tokenRun = await tokenDaChaveDoRun(admin, registro.apify_chave_id, poolInicial.chaves);
    if (!tokenRun) return json({ ok: false, reason: "chave_do_run_indisponivel" }, 503);
    const runResponse = await fetch(`${API}/actor-runs/${registro.apify_run_id}`, {
      headers: { Authorization: `Bearer ${tokenRun}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!runResponse.ok) return json({ ok: false, reason: "status_apify_indisponivel" }, 502);
    const runJson = (await runResponse.json().catch(() => ({}))) as Rec;
    const run = runJson?.data ?? {};
    const runStatus = String(run.status ?? "UNKNOWN");
    if (!["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(runStatus)) {
      return json({ ok: true, pendente: true, requestId, status: runStatus });
    }
    const custo = Number(run.usageTotalUsd ?? 0);
    if (runStatus !== "SUCCEEDED") {
      if (registro.cache_key)
        await liberarCacheRedes(admin, registro.cache_key, (mensagem) => console.warn(mensagem));
      await admin
        .from("redes_buscas")
        .update({
          status: "erro",
          custo_usd: custo,
          detalhe: `run ${runStatus}`,
          concluida_em: new Date().toISOString(),
        })
        .eq("id", registro.id);
      return json({ ok: false, reason: "run_nao_concluiu", status: runStatus, custo });
    }

    const datasetId = run.defaultDatasetId ?? registro.apify_dataset_id;
    const datasetResponse = await fetch(
      `${API}/datasets/${datasetId}/items?limit=${registro.candidatos_solicitados ?? registro.limite}`,
      { headers: { Authorization: `Bearer ${tokenRun}` }, signal: AbortSignal.timeout(20_000) },
    );
    if (!datasetResponse.ok) return json({ ok: false, reason: "dataset_indisponivel" }, 502);
    const itens = ((await datasetResponse.json().catch(() => [])) ?? []) as Rec[];
    if (registro.cache_key)
      await salvarCacheRedes(
        admin,
        registro.cache_key,
        registro.candidatos_solicitados ?? registro.limite,
        itens,
        (mensagem) => console.warn(mensagem),
      );

    const estrategia = estrategiaPorId(registro.estrategia);
    if (!estrategia) return json({ ok: false, reason: "estrategia_desconhecida" }, 409);
    const processado = await processarResultados({
      admin,
      itens,
      limite: registro.candidatos_solicitados ?? registro.limite,
      metaQualificados: registro.meta_qualificados ?? registro.limite,
      estrategiaId: registro.estrategia,
      fonte: registro.fonte,
      campos: registro.pedido?.campos ?? registro.pedido ?? {},
      orgId,
      userId,
      searchId: registro.id,
      somenteNovos: registro.pedido?.somenteNovos ?? true,
    });
    if (processado.inseridos > 0) await consumir(admin, orgId, "leads", processado.inseridos);
    const { data: buscasMes } = await admin
      .from("redes_buscas")
      .select("custo_usd")
      .eq("user_id", userId)
      .eq("mes_ref", registro.mes_ref)
      .neq("id", registro.id)
      .in("fonte", ["instagram", "linkedin"]);
    const gastoMes = (buscasMes ?? []).reduce(
      (total: number, item: Rec) => total + Number(item.custo_usd ?? 0),
      0,
    );
    const estourou = estourouColeta(custo, gastoMes, TETO_RODADA, TETO_MES);
    const resultado = {
      ok: true,
      estrategia: registro.estrategia,
      encontrados: processado.resumo.analisados,
      inseridos: processado.inseridos,
      descartados: processado.descartados,
      leadIds: processado.leadIds,
      newLeadIds: processado.newLeadIds,
      buscaId: registro.id,
      resumo: processado.resumo,
      custo,
      gastoMesDepois: gastoMes + custo,
      teto: { rodada: TETO_RODADA, mes: TETO_MES },
      estourou,
      chaveApelido: registro.chave_apelido,
      cacheHit: false,
      recuperada: true,
    };
    await admin
      .from("redes_buscas")
      .update({
        status: estourou ? "parada_teto" : "concluida",
        custo_usd: custo,
        encontrados: processado.resumo.analisados,
        inseridos: processado.inseridos,
        motivo_parada: processado.motivoParada,
        resultado,
        detalhe: "resultado recuperado após timeout HTTP",
        concluida_em: new Date().toISOString(),
      })
      .eq("id", registro.id);
    return json(resultado);
  }

  // ---------- BUSCAR ----------
  const requestId = String(b?.requestId ?? "");
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId))
    return json({ ok: false, reason: "request_id_invalido" }, 400);
  const { data: buscaExistente } = await admin
    .from("redes_buscas")
    .select("status, resultado")
    .eq("user_id", userId)
    .eq("request_id", requestId)
    .maybeSingle();
  if (buscaExistente?.resultado) return json(buscaExistente.resultado);
  if (buscaExistente)
    return json({ ok: true, pendente: true, requestId, status: buscaExistente.status });

  const estrategiaId = String(b?.estrategia || "");
  const estrategia = estrategiaPorId(estrategiaId);
  if (!estrategia) return json({ ok: false, reason: "estrategia_desconhecida" });
  const cfg = ATOR[estrategiaId];
  if (!cfg) return json({ ok: false, reason: "estrategia_sem_coleta", estrategia: estrategiaId });

  const campos: Rec = b?.campos ?? {};
  const limitePedido = Math.max(
    1,
    Math.min(estrategia.fonte === "instagram" ? 100 : 200, Number(b?.limite ?? 50)),
  );
  const somenteNovos = b?.somenteNovos === undefined ? true : Boolean(b.somenteNovos);
  const agora = new Date();
  const mesRef = mesRefAtual(agora);

  // A coleta social respeita a mesma cota de leads do plano antes de comprar perfis.
  const consumoPlano = await estadoConsumo(admin, orgId, "leads");
  const restantePlano = consumoPlano.limite == null ? limitePedido : (consumoPlano.restante ?? 0);
  if (restantePlano <= 0) {
    return json({
      ok: false,
      reason: "limite_plano",
      motivo: `Limite de leads do plano atingido: ${consumoPlano.usado ?? consumoPlano.limite}/${consumoPlano.limite}.`,
    });
  }
  const limiteComPlano = Math.min(limitePedido, restantePlano);

  // CAMADA 1 — teto ANTES de gastar
  const { data: doMes } = await admin
    .from("redes_buscas")
    .select("custo_usd")
    .eq("user_id", userId)
    .eq("mes_ref", mesRef)
    .in("fonte", ["instagram", "linkedin"]);
  const gastoMes = (doMes ?? []).reduce((s, r) => s + Number(r.custo_usd ?? 0), 0);
  let descobertaInstagram: ReturnType<typeof montarPlanoDescobertaInstagram> | null = null;
  if (estrategia.fonte === "instagram") {
    try {
      descobertaInstagram = montarPlanoDescobertaInstagram({
        nicho: String(campos.nicho ?? campos.categoria ?? ""),
        cidade: String(campos.cidade ?? ""),
        metaQualificados: limiteComPlano,
      });
    } catch (error) {
      return json({ ok: false, reason: "campos_invalidos", motivo: (error as Error).message }, 400);
    }
  }
  const candidatosDesejados = descobertaInstagram?.maxCandidatos ?? limiteComPlano;
  const plano = planejarColeta(gastoMes, candidatosDesejados, TETO_RODADA, TETO_MES);
  if (!plano.podeRodar) {
    await admin.from("redes_buscas").insert({
      user_id: userId,
      fonte: estrategia.fonte,
      estrategia: estrategiaId,
      pedido: { campos, somenteNovos },
      limite: limitePedido,
      meta_qualificados: limiteComPlano,
      candidatos_solicitados: candidatosDesejados,
      consultas: descobertaInstagram?.consultas ?? [],
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
      request_id: requestId,
      fonte: estrategia.fonte,
      estrategia: estrategiaId,
      pedido: { campos, somenteNovos },
      limite: limitePedido,
      meta_qualificados: limiteComPlano,
      candidatos_solicitados: plano.maxItens,
      consultas: descobertaInstagram?.consultas ?? [],
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

  let chaveCacheReservada: string | null = null;
  const logCache = (mensagem: string) => console.warn(mensagem);
  const liberarReservaCache = async () => {
    if (!chaveCacheReservada) return;
    await liberarCacheRedes(admin, chaveCacheReservada, logCache);
    chaveCacheReservada = null;
  };

  try {
    // A identidade considera só o pedido bruto ao Actor. Estratégias e filtros locais diferentes
    // reutilizam o mesmo resultado público quando a consulta externa é idêntica.
    const inputBase = cfg.monta({
      ...campos,
      buscaComposta: descobertaInstagram?.buscaComposta,
    });
    const chaveCache = criarChaveCacheRedes(cfg.ator, inputBase);
    const cache = await prepararCacheRedes<Rec>(admin, chaveCache, plano.maxItens);
    if (!cache.cacheHit) chaveCacheReservada = chaveCache;
    await admin.from("redes_buscas").update({ cache_key: chaveCache }).eq("id", registro?.id);

    const input = {
      ...inputBase,
      searchLimit: plano.maxItens,
      resultsLimit: plano.maxItens,
      maxItems: plano.maxItens,
    };

    // ═══ ETAPA 3 — NÃO DEIXAR CAIR: laço de rodadas com rodízio de chaves ═══
    // Crédito acaba no meio → colhe o PARCIAL do run morto (dataset sobrevive), marca a
    // chave, a próxima REINICIA o run — o upsert (user_id, place_id) elimina duplicata.
    // Só falha de verdade se TODAS as chaves acabarem (e ainda entrega o parcial se houver).
    const MAX_RODADAS = 4;
    const itens: Rec[] = [...cache.items];
    let custoTotal = 0;
    let chaveUsada: ChaveApify | null = null;
    let trocasDeChave = 0;
    let avisoChaves: string | null = null;

    const colherDataset = async (dsId: string | null, tok: string) => {
      if (!dsId) return;
      const dsRes = await fetch(`${API}/datasets/${dsId}/items?limit=${plano.maxItens}`, {
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => null);
      const parcial: Rec[] = (await dsRes?.json().catch(() => [])) ?? [];
      itens.push(...parcial);
    };

    if (!cache.cacheHit) {
      for (let rodada = 1; rodada <= MAX_RODADAS; rodada++) {
        const limitesRun = limitesRunApify(plano.maxItens, TETO_RODADA - custoTotal);
        if (limitesRun.maxItems <= 0) {
          avisoChaves = "A busca parou antes de outro run porque o orçamento da rodada acabou.";
          break;
        }
        const initStart: RequestInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            searchLimit: limitesRun.maxItems,
            resultsLimit: limitesRun.maxItems,
            maxItems: limitesRun.maxItems,
          }),
        };
        const urlRun =
          `${API}/acts/${cfg.ator}/runs?timeout=300&memory=1024` +
          `&maxItems=${limitesRun.maxItems}` +
          `&maxTotalChargeUsd=${limitesRun.maxTotalChargeUsd}`;
        const r = await startRunComPool(admin, () => urlRun, initStart);
        if (!r.ok) {
          if ((r.reason === "pool_esgotado" || r.reason === "sem_chave") && itens.length > 0) {
            avisoChaves = "Crédito das chaves acabou no meio — aproveitando o que já foi coletado.";
            break; // processa o parcial em vez de jogar fora
          }
          await finalizar({
            status: "erro",
            custo_usd: custoTotal,
            detalhe:
              r.reason === "pool_esgotado"
                ? "todas as chaves Apify esgotadas"
                : `Apify ${r.status ?? ""}: ${r.detalhe.slice(0, 180)}`,
            chave_apelido: chaveUsada?.id ? chaveUsada.apelido : null,
          });
          await liberarReservaCache();
          return json({
            ok: false,
            reason: r.reason === "pool_esgotado" ? "chaves_esgotadas" : "apify_falhou",
            status: r.status,
            detalhe: r.detalhe,
          });
        }
        chaveUsada = r.chave;
        trocasDeChave += r.trocas;
        const startJson = (await r.resp.json().catch(() => ({}))) as Rec;
        const runId = startJson?.data?.id;
        let datasetId: string | null = startJson?.data?.defaultDatasetId ?? null;
        await admin
          .from("redes_buscas")
          .update({
            apify_run_id: runId,
            apify_dataset_id: datasetId,
            apify_chave_id: chaveUsada.id,
            chave_apelido: chaveUsada.apelido,
          })
          .eq("id", registro?.id);

        // aguarda o run (com teto de tempo — o edge não pode ficar preso)
        let status = "READY";
        let custoRodada = 0;
        for (let i = 0; i < 100; i++) {
          await new Promise((rr) => setTimeout(rr, 3000));
          const st = await fetch(`${API}/actor-runs/${runId}`, {
            headers: { Authorization: `Bearer ${chaveUsada.token}` },
          });
          const sj = await st.json().catch(() => ({}) as Rec);
          status = sj?.data?.status ?? "UNKNOWN";
          custoRodada = Number(sj?.data?.usageTotalUsd ?? 0);
          datasetId = sj?.data?.defaultDatasetId ?? datasetId;
          if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) break;
          // trava de segurança: se a BUSCA já passou do teto da rodada, aborta na hora
          if (custoTotal + custoRodada >= TETO_RODADA) {
            await fetch(`${API}/actor-runs/${runId}/abort`, {
              method: "POST",
              headers: { Authorization: `Bearer ${chaveUsada.token}` },
            }).catch(() => {});
            await finalizar({
              status: "parada_teto",
              custo_usd: custoTotal + custoRodada,
              detalhe: "run abortado no teto",
              chave_apelido: chaveUsada.id ? chaveUsada.apelido : null,
            });
            await liberarReservaCache();
            return json({ ok: false, reason: "teto_no_run", custo: custoTotal + custoRodada });
          }
        }
        custoTotal += custoRodada;

        if (status === "SUCCEEDED") {
          await colherDataset(datasetId, chaveUsada.token);
          break;
        }

        if (status === "ABORTED" || status === "FAILED") {
          // parcial do run morto primeiro (o dataset do run morto continua legível)
          await colherDataset(datasetId, chaveUsada.token);
          const veredito = await tratarRunMorto(admin, chaveUsada, status, false);
          if (veredito === "trocar_chave") {
            trocasDeChave++;
            avisoChaves = `A busca continuou em outra chave (a "${chaveUsada.apelido}" esgotou no meio).`;
            continue; // a PRÓXIMA chave reinicia o run — dedupe elimina repetidos
          }
          if (veredito === "parar_sem_pool" && itens.length > 0) {
            avisoChaves = "Crédito esgotou no meio — aproveitando o que já foi coletado.";
            break;
          }
          await finalizar({
            status: "erro",
            custo_usd: custoTotal,
            detalhe:
              veredito === "parar_sem_pool"
                ? "crédito Apify esgotado (chave única)"
                : `run ${status}`,
            chave_apelido: chaveUsada.id ? chaveUsada.apelido : null,
          });
          await liberarReservaCache();
          return json({
            ok: false,
            reason: veredito === "parar_sem_pool" ? "chaves_esgotadas" : "run_nao_concluiu",
            status,
            custo: custoTotal,
          });
        }

        // TIMED-OUT / UNKNOWN — falha do run, não de crédito: sem rodízio (comportamento antigo)
        await finalizar({
          status: "erro",
          custo_usd: custoTotal,
          detalhe: `run ${status}`,
          chave_apelido: chaveUsada.id ? chaveUsada.apelido : null,
        });
        await liberarReservaCache();
        return json({ ok: false, reason: "run_nao_concluiu", status, custo: custoTotal });
      }
      await salvarCacheRedes(admin, chaveCache, plano.maxItens, itens, logCache);
      chaveCacheReservada = null;
    }
    const custo = custoTotal;

    const processado = await processarResultados({
      admin,
      itens,
      limite: plano.maxItens,
      metaQualificados: limiteComPlano,
      estrategiaId,
      fonte: estrategia.fonte,
      campos,
      orgId,
      userId,
      searchId: registro?.id,
      somenteNovos,
    });
    const { inseridos, descartados, leadIds, newLeadIds, resumo } = processado;
    const analisados = resumo.analisados;

    if (inseridos > 0) await consumir(admin, orgId, "leads", inseridos);

    const estourou = estourouColeta(custo, gastoMes, TETO_RODADA, TETO_MES);
    const resultado = {
      ok: true,
      estrategia: estrategiaId,
      encontrados: analisados,
      inseridos,
      descartados,
      leadIds,
      newLeadIds,
      buscaId: registro?.id,
      resumo,
      custo,
      gastoMesDepois: gastoMes + custo,
      teto: { rodada: TETO_RODADA, mes: TETO_MES },
      estourou,
      chaveApelido: chaveUsada?.id ? chaveUsada.apelido : null,
      trocasDeChave,
      avisoChaves,
      cacheHit: cache.cacheHit,
    };
    await finalizar({
      status: estourou ? "parada_teto" : "concluida",
      custo_usd: custo,
      encontrados: analisados,
      inseridos,
      motivo_parada: processado.motivoParada,
      // 📒 livro-caixa agora registra QUAL chave gastou + o rastro do rodízio
      chave_apelido: chaveUsada?.id ? chaveUsada.apelido : null,
      detalhe: estourou
        ? "custo real bateu o teto"
        : cache.cacheHit
          ? "resultado entregue pelo cache compartilhado"
          : (avisoChaves ?? null),
      resultado,
    });

    return json(resultado);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await liberarReservaCache();
    await finalizar({ status: "erro", detalhe: msg.slice(0, 300) });
    return json({ ok: false, reason: "erro", detalhe: msg.slice(0, 300) });
  }
});
