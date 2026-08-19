// Edge: instagram-discovery — motor multietapas do workspace Instagram.
// Comments Hunter: descobre posts, coleta comentários públicos, classifica intenção,
// enriquece somente os autores promissores e salva a evidência que explica cada lead.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { acessoFerramentaLiberado } from "../_shared/acesso.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { lerConfigPlataforma } from "../_shared/config.ts";
import { consumir, estadoConsumo, orgDoUsuario } from "../_shared/limite.ts";
import { startRunComPool, tratarRunMorto, type ChaveApify } from "../_shared/apify-pool.ts";
import { liberarCacheRedes, prepararCacheRedes, salvarCacheRedes } from "../_shared/redes-cache.ts";
import { criarChaveCacheRedes } from "../../../src/lib/redes-economia.ts";
import { mesRefAtual } from "../../../src/lib/automacao-teto.ts";
import { TETO_REDES_MES_USD, TETO_REDES_RODADA_USD } from "../../../src/lib/redes-teto.ts";
import {
  calcularScoreLeadComentario,
  classificarIntencaoComentario,
  estimarCustoCommentsHunter,
  selecionarComentaristasUnicos,
} from "../../../src/lib/instagram-comments.ts";
import {
  analyzeInstagramContentSignals,
  buildInstagramHashtagUrls,
  calculateInstagramContentLeadScore,
  estimateInstagramContentDiscoveryCost,
  normalizeInstagramHashtag,
  type ContentDiscoveryMode,
} from "../../../src/lib/instagram-content-discovery.ts";
import {
  buildCompetitorAlerts,
  compareCompetitorSnapshots,
  estimateCompetitorMonitoringCost,
  summarizeCompetitorComments,
  summarizeCompetitorContent,
} from "../../../src/lib/instagram-competitor-intelligence.ts";
import {
  perfilEhProfissionalInstagram,
  perfilTemLocalidade,
  perfilTemNicho,
  temSiteProprioInstagram,
} from "../../../src/lib/instagram-search.ts";
import { perfilParaLead } from "../../../src/lib/fontes-prospeccao.ts";

const API = "https://api.apify.com/v2";
const ACTOR_POSTS = "apify~instagram-post-scraper";
const ACTOR_COMMENTS = "apify~instagram-comment-scraper";
const ACTOR_PROFILES = "apify~instagram-profile-scraper";
const ACTOR_DISCOVERY = "apify~instagram-scraper";
const TERMINAIS = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]);

// Payloads de Actors são fronteiras externas e deliberadamente flexíveis.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;
type Admin = SupabaseClient;

type EntradaComments = {
  requestId: string;
  sourceType: "profile" | "posts";
  profile: string;
  postUrls: string[];
  niche: string;
  city: string;
  state: string;
  maxPosts: number;
  commentsPerPost: number;
  targetLeads: number;
  minIntentScore: number;
  minLeadScore: number;
  onlyProfessionals: boolean;
  requireLocation: boolean;
  requireNiche: boolean;
};

type EntradaConteudo = {
  requestId: string;
  mode: ContentDiscoveryMode;
  hashtags: string[];
  niche: string;
  city: string;
  state: string;
  locationQuery: string;
  sourcesLimit: number;
  postsPerSource: number;
  targetLeads: number;
  recentDays: number;
  minFollowers: number;
  maxFollowers: number;
  minContentScore: number;
  minLeadScore: number;
  onlyProfessionals: boolean;
  requireLocation: boolean;
  requireNiche: boolean;
};

type EntradaMonitoramentoConcorrente = {
  requestId: string;
  competitorId: string;
  maxPosts: number;
  commentPosts: number;
  commentsPerPost: number;
};

type RunResult = {
  items: Rec[];
  cost: number;
  cacheHit: boolean;
  runId: string | null;
  datasetId: string | null;
  key: ChaveApify | null;
};

class ActorRunError extends Error {
  constructor(
    message: string,
    readonly costUsd: number,
  ) {
    super(message);
    this.name = "ActorRunError";
  }
}

function inteiro(valor: unknown, minimo: number, maximo: number, padrao: number): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return Math.max(minimo, Math.min(maximo, Math.floor(numero)));
}

function booleano(valor: unknown, padrao: boolean): boolean {
  return typeof valor === "boolean" ? valor : padrao;
}

function normalizarUsername(valor: unknown): string {
  return String(valor ?? "")
    .trim()
    .replace(/^@/, "")
    .toLocaleLowerCase("pt-BR");
}

function urlsValidas(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return [
    ...new Set(
      valor
        .map(String)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ].filter((url) => {
    try {
      const parsed = new URL(url);
      return (
        /(^|\.)instagram\.com$/i.test(parsed.hostname) && /\/(p|reel)\//i.test(parsed.pathname)
      );
    } catch {
      return false;
    }
  });
}

function validarEntrada(body: Rec): EntradaComments {
  const requestId = String(body.requestId ?? "").trim();
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId)) throw new Error("request_id_invalido");
  const sourceType = body.sourceType === "posts" ? "posts" : "profile";
  const profile = normalizarUsername(body.profile);
  const postUrls = urlsValidas(body.postUrls);
  const niche = String(body.niche ?? "").trim();
  if (!niche) throw new Error("Informe o nicho que define um lead relevante.");
  if (sourceType === "profile" && !/^[\w.]{1,30}$/.test(profile)) {
    throw new Error("Informe um perfil público válido do Instagram.");
  }
  if (sourceType === "posts" && postUrls.length === 0) {
    throw new Error("Informe ao menos uma URL pública de post ou Reel.");
  }
  return {
    requestId,
    sourceType,
    profile,
    postUrls: postUrls.slice(0, 8),
    niche,
    city: String(body.city ?? "").trim(),
    state: String(body.state ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 2),
    maxPosts: inteiro(body.maxPosts, 1, 8, 3),
    commentsPerPost: inteiro(body.commentsPerPost, 5, 100, 30),
    targetLeads: inteiro(body.targetLeads, 1, 50, 15),
    minIntentScore: inteiro(body.minIntentScore, 0, 100, 40),
    minLeadScore: inteiro(body.minLeadScore, 0, 100, 55),
    onlyProfessionals: booleano(body.onlyProfessionals, true),
    requireLocation: booleano(body.requireLocation, false),
    requireNiche: booleano(body.requireNiche, true),
  };
}

function validarEntradaConteudo(body: Rec): EntradaConteudo {
  const requestId = String(body.requestId ?? "").trim();
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId)) throw new Error("request_id_invalido");
  const mode: ContentDiscoveryMode = body.mode === "places" ? "places" : "hashtags";
  const hashtags = Array.isArray(body.hashtags)
    ? [
        ...new Set(
          body.hashtags
            .map(normalizeInstagramHashtag)
            .filter((tag: string) => /^[a-z0-9_]{2,100}$/.test(tag)),
        ),
      ].slice(0, 6)
    : [];
  const niche = String(body.niche ?? "").trim();
  const city = String(body.city ?? "").trim();
  const locationQuery = String(body.locationQuery ?? "").trim();
  if (!niche) throw new Error("Escolha o nicho do lead ideal.");
  if (mode === "hashtags" && hashtags.length === 0) {
    throw new Error("Informe ao menos uma hashtag valida, sem depender do #.");
  }
  if (mode === "places" && !city && !locationQuery) {
    throw new Error("Escolha a cidade ou informe um bairro/local para pesquisar.");
  }
  const minFollowers = inteiro(body.minFollowers, 0, 10_000_000, 100);
  const maxFollowers = inteiro(body.maxFollowers, minFollowers, 100_000_000, 250_000);
  return {
    requestId,
    mode,
    hashtags,
    niche,
    city,
    state: String(body.state ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 2),
    locationQuery,
    sourcesLimit: inteiro(body.sourcesLimit, 1, 12, 5),
    postsPerSource: inteiro(body.postsPerSource, 3, 30, 10),
    targetLeads: inteiro(body.targetLeads, 1, 50, 15),
    recentDays: inteiro(body.recentDays, 7, 365, 90),
    minFollowers,
    maxFollowers,
    minContentScore: inteiro(body.minContentScore, 0, 100, 45),
    minLeadScore: inteiro(body.minLeadScore, 0, 100, 55),
    onlyProfessionals: booleano(body.onlyProfessionals, true),
    requireLocation: booleano(body.requireLocation, false),
    requireNiche: booleano(body.requireNiche, true),
  };
}

function validarEntradaMonitoramento(body: Rec): EntradaMonitoramentoConcorrente {
  const requestId = String(body.requestId ?? "").trim();
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId)) throw new Error("request_id_invalido");
  const competitorId = String(body.competitorId ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(competitorId)) throw new Error("Concorrente invalido.");
  const maxPosts = inteiro(body.maxPosts, 5, 30, 12);
  return {
    requestId,
    competitorId,
    maxPosts,
    commentPosts: inteiro(body.commentPosts, 1, Math.min(5, maxPosts), 3),
    commentsPerPost: inteiro(body.commentsPerPost, 10, 100, 30),
  };
}

function acharEmail(texto: string): string | null {
  return texto.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/)?.[0]?.replace(/[.,;]$/, "") ?? null;
}

function acharWhatsapp(texto: string): string | null {
  const achado = texto.match(/(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/)?.[0];
  if (!achado) return null;
  const digitos = achado.replace(/\D/g, "");
  const completo = digitos.length <= 11 ? `55${digitos}` : digitos;
  return completo.length >= 12 && completo.length <= 13 ? completo : null;
}

function dataIso(valor: unknown): string | null {
  if (!valor) return null;
  const data = new Date(String(valor));
  return Number.isFinite(data.getTime()) ? data.toISOString() : null;
}

function atividadePerfil(perfil: Rec): number {
  const posts = Array.isArray(perfil.latestPosts) ? perfil.latestPosts : [];
  const maisRecente = posts
    .map((post: Rec) => dataIso(post.timestamp ?? post.takenAtTimestamp ?? post.createdAt))
    .filter(Boolean)
    .sort()
    .at(-1);
  if (maisRecente) {
    const dias = (Date.now() - new Date(maisRecente).getTime()) / 86_400_000;
    if (dias <= 14) return 100;
    if (dias <= 30) return 85;
    if (dias <= 90) return 60;
  }
  return Number(perfil.postsCount ?? 0) > 0 ? 35 : 10;
}

function autenticidadePerfil(perfil: Rec): number {
  const seguidores = Number(perfil.followersCount ?? 0);
  const seguindo = Number(perfil.followsCount ?? perfil.followingCount ?? 0);
  const posts = Number(perfil.postsCount ?? 0);
  let score = 45;
  if (posts >= 6) score += 15;
  if (seguidores >= 100) score += 15;
  if (seguidores >= 300 && seguindo > 0 && seguidores / seguindo >= 0.2) score += 15;
  if (perfil.private === true) score -= 15;
  if (perfil.verified === true) score += 10;
  return Math.max(0, Math.min(100, score));
}

async function criarStep(
  admin: Admin,
  jobId: string,
  orgId: string,
  stepType: string,
  actorId: string,
  input: Rec,
  requested: number,
): Promise<string> {
  const { data, error } = await admin
    .from("instagram_job_steps")
    .insert({
      job_id: jobId,
      org_id: orgId,
      step_type: stepType,
      actor_id: actorId,
      status: "running",
      input,
      requested_count: requested,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Não foi possível registrar a etapa ${stepType}.`);
  return data.id;
}

async function executarActor(params: {
  admin: Admin;
  jobId: string;
  orgId: string;
  stepType: string;
  actorId: string;
  input: Rec;
  requested: number;
  ttlHours: number;
  maxCharge: number;
}): Promise<RunResult> {
  const { admin, jobId, orgId, stepType, actorId, input, requested, ttlHours } = params;
  const stepId = await criarStep(admin, jobId, orgId, stepType, actorId, input, requested);
  const cacheKey = criarChaveCacheRedes(actorId, input);
  const log = (mensagem: string) => console.warn(`[${stepType}] ${mensagem}`);
  if (params.maxCharge < 0.01)
    throw new ActorRunError("O teto seguro desta busca foi atingido.", 0);
  const cache = await prepararCacheRedes<Rec>(admin, cacheKey, requested, ttlHours);
  if (cache.cacheHit) {
    await admin
      .from("instagram_job_steps")
      .update({
        status: "cached",
        returned_count: cache.items.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", stepId);
    return { items: cache.items, cost: 0, cacheHit: true, runId: null, datasetId: null, key: null };
  }

  let lastError = "Actor não concluiu.";
  let totalCost = 0;
  for (let rodada = 0; rodada < 3; rodada++) {
    const url =
      `${API}/acts/${actorId}/runs?timeout=300&memory=1024&maxItems=${requested}` +
      `&maxTotalChargeUsd=${Math.max(0.01, params.maxCharge).toFixed(4)}`;
    const start = await startRunComPool(admin, () => url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!start.ok) {
      lastError = start.detalhe;
      break;
    }
    const started = (await start.resp.json().catch(() => ({}))) as Rec;
    const runId = String(started?.data?.id ?? "");
    let datasetId = started?.data?.defaultDatasetId ? String(started.data.defaultDatasetId) : null;
    await admin
      .from("instagram_job_steps")
      .update({ apify_run_id: runId, apify_dataset_id: datasetId })
      .eq("id", stepId);

    let status = "READY";
    let cost = 0;
    for (let tentativa = 0; tentativa < 120; tentativa++) {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      const response = await fetch(`${API}/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${start.chave.token}` },
        signal: AbortSignal.timeout(10_000),
      });
      const responseBody = (await response.json().catch(() => ({}))) as Rec;
      status = String(responseBody?.data?.status ?? "UNKNOWN");
      cost = Number(responseBody?.data?.usageTotalUsd ?? 0);
      datasetId = responseBody?.data?.defaultDatasetId
        ? String(responseBody.data.defaultDatasetId)
        : datasetId;
      if (TERMINAIS.has(status)) break;
    }
    totalCost += cost;

    if (status === "SUCCEEDED" && datasetId) {
      const response = await fetch(
        `${API}/datasets/${datasetId}/items?limit=${requested}&clean=true`,
        {
          headers: { Authorization: `Bearer ${start.chave.token}` },
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (!response.ok) {
        lastError = `Dataset indisponível (HTTP ${response.status}).`;
        break;
      }
      const items = ((await response.json().catch(() => [])) ?? []) as Rec[];
      await salvarCacheRedes(admin, cacheKey, requested, items, log);
      await admin
        .from("instagram_job_steps")
        .update({
          status: "completed",
          apify_dataset_id: datasetId,
          returned_count: items.length,
          cost_usd: totalCost,
          completed_at: new Date().toISOString(),
        })
        .eq("id", stepId);
      return { items, cost: totalCost, cacheHit: false, runId, datasetId, key: start.chave };
    }

    lastError = `Run ${status}`;
    const veredito = await tratarRunMorto(admin, start.chave, status, false);
    if (veredito === "trocar_chave") continue;
    break;
  }

  await liberarCacheRedes(admin, cacheKey, log);
  await admin
    .from("instagram_job_steps")
    .update({
      status: "failed",
      error: lastError,
      cost_usd: totalCost,
      completed_at: new Date().toISOString(),
    })
    .eq("id", stepId);
  throw new ActorRunError(lastError, totalCost);
}

function normalizarPost(item: Rec, fallbackOwner: string): Rec | null {
  const url = String(item.url ?? item.inputUrl ?? item.postUrl ?? "").trim();
  if (!url || !/instagram\.com\/(p|reel)\//i.test(url)) return null;
  const contentType =
    String(item.type ?? "")
      .toLowerCase()
      .includes("video") || /\/reel\//i.test(url)
      ? "reel"
      : "post";
  return {
    instagram_content_id: String(item.id ?? item.instagramId ?? "") || null,
    shortcode: String(item.shortCode ?? item.shortcode ?? "") || null,
    content_type: contentType,
    owner_username: normalizarUsername(item.ownerUsername ?? fallbackOwner) || fallbackOwner,
    url,
    caption: String(item.caption ?? "") || null,
    posted_at: dataIso(item.timestamp ?? item.takenAtTimestamp ?? item.createdAt),
    location: item.location ?? null,
    metrics: {
      likes: Number(item.likesCount ?? 0),
      comments: Number(item.commentsCount ?? 0),
      views: Number(item.videoViewCount ?? item.videoPlayCount ?? 0),
    },
    raw_payload: item,
  };
}

function normalizarComentario(item: Rec) {
  const owner = item.owner && typeof item.owner === "object" ? item.owner : {};
  const username = normalizarUsername(item.ownerUsername ?? owner.username);
  const texto = String(item.text ?? item.commentText ?? "").trim();
  if (!username || !texto || item.error) return null;
  const classificacao = classificarIntencaoComentario(texto);
  return {
    username,
    texto,
    likes: Number(item.likesCount ?? 0),
    ocorridoEm: dataIso(item.timestamp),
    instagramEventId: String(item.id ?? item.commentId ?? "") || null,
    postUrl: String(item.postUrl ?? item.url ?? "") || null,
    fullName: String(owner.fullName ?? item.ownerFullName ?? "") || null,
    avatarUrl: String(item.ownerProfilePicUrl ?? owner.profilePicUrl ?? "") || null,
    instagramUserId: String(owner.id ?? item.ownerId ?? "") || null,
    repliesCount: Number(item.repliesCount ?? 0),
    classificacao,
    raw: item,
  };
}

async function salvarConteudos(params: {
  admin: Admin;
  orgId: string;
  userId: string;
  sourceId: string;
  jobId: string;
  posts: Rec[];
}): Promise<Map<string, string>> {
  const rows = params.posts.map((post) => ({
    ...post,
    org_id: params.orgId,
    user_id: params.userId,
    source_id: params.sourceId,
    job_id: params.jobId,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length) {
    const { error } = await params.admin
      .from("instagram_contents")
      .upsert(rows, { onConflict: "org_id,url" });
    if (error) throw new Error(`Falha ao salvar posts: ${error.message}`);
  }
  const urls = rows.map((row) => row.url);
  if (!urls.length) return new Map();
  const { data, error } = await params.admin
    .from("instagram_contents")
    .select("id,url")
    .eq("org_id", params.orgId)
    .in("url", urls);
  if (error) throw new Error(`Falha ao reler posts: ${error.message}`);
  return new Map((data ?? []).map((row: Rec) => [row.url, row.id]));
}

function perfilPorUsername(items: Rec[]): Map<string, Rec> {
  const mapa = new Map<string, Rec>();
  for (const item of items) {
    const username = normalizarUsername(item.username);
    if (username && !item.error) mapa.set(username, item);
  }
  return mapa;
}

function urlLocalInstagram(item: Rec): string | null {
  const candidates = [item.inputUrl, item.url, item.locationUrl];
  for (const value of candidates) {
    const url = String(value ?? "").trim();
    if (/instagram\.com\/explore\/locations\//i.test(url)) return url;
  }
  const id = String(item.location_id ?? item.locationId ?? item.id ?? "").trim();
  if (!/^\d+$/.test(id)) return null;
  return `https://www.instagram.com/explore/locations/${id}/`;
}

function textoLocalPost(post: Rec): string {
  if (!post.location) return "";
  return typeof post.location === "string" ? post.location : JSON.stringify(post.location);
}

function postsPorAutor(posts: Rec[]): Map<string, Rec[]> {
  const grouped = new Map<string, Rec[]>();
  for (const post of posts) {
    const username = normalizarUsername(post.owner_username);
    if (!username || username === "origem-direta") continue;
    grouped.set(username, [...(grouped.get(username) ?? []), post]);
  }
  return grouped;
}

async function processarDescobertaConteudo(params: {
  req: Request;
  admin: Admin;
  userId: string;
  orgId: string;
  body: Rec;
}): Promise<Response> {
  const { req, admin, userId, orgId, body } = params;
  let input: EntradaConteudo;
  try {
    input = validarEntradaConteudo(body);
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      400,
      req,
    );
  }

  const { data: existing } = await admin
    .from("instagram_discovery_jobs")
    .select("status,result,error")
    .eq("user_id", userId)
    .eq("request_id", input.requestId)
    .maybeSingle();
  if (existing?.result) return json(existing.result, 200, req);
  if (existing) {
    return json(
      {
        ok: existing.status !== "failed",
        pending: existing.status === "running",
        status: existing.status,
        error: existing.error,
      },
      existing.status === "failed" ? 409 : 202,
      req,
    );
  }

  const config = await lerConfigPlataforma(admin);
  const roundCap = config.teto_redes_rodada_usd ?? TETO_REDES_RODADA_USD;
  const monthCap = config.teto_redes_mes_usd ?? TETO_REDES_MES_USD;
  const monthRef = mesRefAtual(new Date());
  const [{ data: discoveryCosts }, { data: legacyCosts }] = await Promise.all([
    admin
      .from("instagram_discovery_jobs")
      .select("actual_cost_usd")
      .eq("user_id", userId)
      .eq("month_ref", monthRef),
    admin
      .from("redes_buscas")
      .select("custo_usd")
      .eq("user_id", userId)
      .eq("mes_ref", monthRef)
      .eq("fonte", "instagram"),
  ]);
  const spentMonth =
    (discoveryCosts ?? []).reduce(
      (sum: number, row: Rec) => sum + Number(row.actual_cost_usd ?? 0),
      0,
    ) + (legacyCosts ?? []).reduce((sum: number, row: Rec) => sum + Number(row.custo_usd ?? 0), 0);
  const estimatedCost = estimateInstagramContentDiscoveryCost(input);
  const availableBudget = Math.max(0, Math.min(roundCap, monthCap - spentMonth));

  const sourceName =
    input.mode === "hashtags"
      ? input.hashtags.map((tag) => `#${tag}`).join(", ")
      : [input.niche, input.locationQuery || input.city].filter(Boolean).join(" em ");
  const { data: source, error: sourceError } = await admin
    .from("instagram_sources")
    .insert({
      org_id: orgId,
      user_id: userId,
      source_type: input.mode === "hashtags" ? "hashtag" : "place",
      name: sourceName,
      config: input,
    })
    .select("id")
    .single();
  if (sourceError || !source) return json({ ok: false, error: sourceError?.message }, 500, req);

  const initialStatus = estimatedCost > availableBudget ? "budget_stopped" : "running";
  const { data: job, error: jobError } = await admin
    .from("instagram_discovery_jobs")
    .insert({
      org_id: orgId,
      user_id: userId,
      source_id: source.id,
      request_id: input.requestId,
      mode: input.mode,
      status: initialStatus,
      input,
      estimated_cost_usd: estimatedCost,
      month_ref: monthRef,
      stop_reason: initialStatus === "budget_stopped" ? "estimated_cost_exceeds_budget" : null,
      started_at: initialStatus === "running" ? new Date().toISOString() : null,
      completed_at: initialStatus === "budget_stopped" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (jobError || !job) return json({ ok: false, error: jobError?.message }, 500, req);
  if (initialStatus === "budget_stopped") {
    return json(
      {
        ok: false,
        reason: "budget",
        error: `A estimativa de US$ ${estimatedCost.toFixed(2)} excede o saldo seguro de US$ ${availableBudget.toFixed(2)}.`,
        estimatedCost,
        spentMonth,
        caps: { round: roundCap, month: monthCap },
      },
      409,
      req,
    );
  }

  let actualCost = 0;
  const cacheStats = { sources: false, content: false, profiles: false };
  const updateCost = async () => {
    await admin
      .from("instagram_discovery_jobs")
      .update({ actual_cost_usd: actualCost, updated_at: new Date().toISOString() })
      .eq("id", job.id);
  };

  try {
    let originUrls: string[] = [];
    let sourcesFound = input.mode === "hashtags" ? input.hashtags.length : 0;
    if (input.mode === "hashtags") {
      originUrls = buildInstagramHashtagUrls(input.hashtags);
    } else {
      const search = [input.niche, input.locationQuery, input.city, input.state]
        .filter(Boolean)
        .join(" ");
      const sourceRun = await executarActor({
        admin,
        jobId: job.id,
        orgId,
        stepType: "discover_sources",
        actorId: ACTOR_DISCOVERY,
        input: {
          search,
          searchType: "place",
          searchLimit: input.sourcesLimit,
          resultsType: "details",
        },
        requested: input.sourcesLimit,
        ttlHours: 7 * 24,
        maxCharge: Math.min(0.08, availableBudget - actualCost),
      });
      actualCost += sourceRun.cost;
      cacheStats.sources = sourceRun.cacheHit;
      await updateCost();
      originUrls = [
        ...new Set(
          sourceRun.items.map(urlLocalInstagram).filter((url): url is string => Boolean(url)),
        ),
      ].slice(0, input.sourcesLimit);
      sourcesFound = originUrls.length;
    }
    if (!originUrls.length) {
      throw new Error(
        input.mode === "hashtags"
          ? "Nenhuma hashtag valida foi montada."
          : "Nenhum local publico do Instagram foi encontrado para essa regiao.",
      );
    }

    const requestedContent = originUrls.length * input.postsPerSource;
    const contentRun = await executarActor({
      admin,
      jobId: job.id,
      orgId,
      stepType: "discover_content",
      actorId: ACTOR_DISCOVERY,
      input: {
        directUrls: originUrls,
        resultsType: "posts",
        resultsLimit: input.postsPerSource,
        onlyPostsNewerThan: `${input.recentDays} days`,
        addParentData: true,
      },
      requested: requestedContent,
      ttlHours: 12,
      maxCharge: Math.min(Math.max(0.08, requestedContent * 0.0032), availableBudget - actualCost),
    });
    actualCost += contentRun.cost;
    cacheStats.content = contentRun.cacheHit;
    await updateCost();
    const posts = contentRun.items
      .map((item) => normalizarPost(item, normalizarUsername(item.ownerUsername)))
      .filter((item): item is Rec => Boolean(item));
    if (!posts.length) throw new Error("A fonte nao retornou posts publicos recentes.");
    const contentIds = await salvarConteudos({
      admin,
      orgId,
      userId,
      sourceId: source.id,
      jobId: job.id,
      posts,
    });

    const grouped = postsPorAutor(posts);
    const prequalified = [...grouped.entries()]
      .map(([username, authorPosts]) => ({
        username,
        posts: authorPosts,
        signals: analyzeInstagramContentSignals({
          contents: authorPosts.map((post) => ({
            caption: post.caption,
            likes: post.metrics?.likes,
            comments: post.metrics?.comments,
            views: post.metrics?.views,
            postedAt: post.posted_at,
            contentType: post.content_type,
            locationText: textoLocalPost(post),
          })),
          followers: 0,
          niche: input.niche,
          city: input.city,
        }),
      }))
      .sort((a, b) => b.signals.contentScore - a.signals.contentScore);
    const enrichLimit = Math.min(75, Math.max(12, input.targetLeads * 3), prequalified.length);
    const toEnrich = prequalified.slice(0, enrichLimit);
    let profiles: Rec[] = [];
    if (toEnrich.length) {
      const profileRun = await executarActor({
        admin,
        jobId: job.id,
        orgId,
        stepType: "enrich_profiles",
        actorId: ACTOR_PROFILES,
        input: {
          usernames: toEnrich.map((candidate) => candidate.username),
          includeAboutSection: false,
        },
        requested: toEnrich.length,
        ttlHours: 7 * 24,
        maxCharge: Math.min(Math.max(0.08, toEnrich.length * 0.0035), availableBudget - actualCost),
      });
      actualCost += profileRun.cost;
      cacheStats.profiles = profileRun.cacheHit;
      await updateCost();
      profiles = profileRun.items;
    }

    const profileMap = perfilPorUsername(profiles);
    const results: Rec[] = [];
    const evidenceRows: Rec[] = [];
    const rejections: Record<string, number> = {};
    const formatCounts: Record<string, number> = {};
    let newLeads = 0;
    let duplicates = 0;
    let qualified = 0;
    const consumption = await estadoConsumo(admin, orgId, "leads");
    let planRemaining = consumption.limite == null ? Infinity : (consumption.restante ?? 0);

    for (const candidate of toEnrich) {
      const profile = profileMap.get(candidate.username) ?? null;
      const followers = Number(profile?.followersCount ?? 0);
      const signals = analyzeInstagramContentSignals({
        contents: candidate.posts.map((post) => ({
          caption: post.caption,
          likes: post.metrics?.likes,
          comments: post.metrics?.comments,
          views: post.metrics?.views,
          postedAt: post.posted_at,
          contentType: post.content_type,
          locationText: textoLocalPost(post),
        })),
        followers,
        niche: input.niche,
        city: input.city,
      });
      for (const format of signals.formats) formatCounts[format] = (formatCounts[format] ?? 0) + 1;
      const professional = profile ? perfilEhProfissionalInstagram(profile) : false;
      const profileNicheMatch = profile ? perfilTemNicho(profile, input.niche) : false;
      const profileLocationMatch = profile
        ? input.city
          ? perfilTemLocalidade(profile, input.city)
          : true
        : false;
      const nicheMatch = profileNicheMatch || signals.nicheScore >= 50;
      const locationMatch = profileLocationMatch || signals.locationScore >= 50;
      const externalUrl = profile?.externalUrl ?? null;
      const biography = String(profile?.biography ?? "");
      const email = acharEmail(`${biography} ${profile?.businessEmail ?? ""}`);
      const whatsapp = acharWhatsapp(
        `${biography} ${profile?.businessPhoneNumber ?? ""} ${externalUrl ?? ""}`,
      );
      const hasContact = Boolean(email || whatsapp || externalUrl);
      const authenticity = profile ? autenticidadePerfil(profile) : 0;
      const leadScore = calculateInstagramContentLeadScore({
        contentScore: signals.contentScore,
        professional,
        profileNicheMatch: nicheMatch,
        profileLocationMatch: locationMatch,
        authenticityScore: authenticity,
        hasContact,
        followers,
      });
      const accountKind = professional
        ? String(profile?.businessCategoryName ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes("creator")
          ? "creator"
          : "business"
        : "consumer";

      let decision: "qualified" | "candidate" | "rejected" | "duplicate" = "candidate";
      let rejectionReason: string | null = null;
      if (!profile) rejectionReason = "perfil_indisponivel";
      else if (input.onlyProfessionals && !professional) rejectionReason = "conta_pessoal";
      else if (followers < input.minFollowers) rejectionReason = "poucos_seguidores";
      else if (followers > input.maxFollowers) rejectionReason = "seguidores_acima_do_maximo";
      else if (input.requireNiche && !nicheMatch) rejectionReason = "fora_nicho";
      else if (input.requireLocation && !locationMatch) rejectionReason = "fora_localidade";
      else if (signals.contentScore < input.minContentScore) rejectionReason = "conteudo_fraco";
      else if (leadScore < input.minLeadScore) rejectionReason = "score_insuficiente";
      else if (qualified >= input.targetLeads) rejectionReason = "meta_atingida";
      else if (planRemaining <= 0) rejectionReason = "limite_plano";

      let leadId: string | null = null;
      if (!rejectionReason && profile) {
        const lead = perfilParaLead(
          {
            username: candidate.username,
            nome: profile.fullName,
            bio: biography,
            linkBio: temSiteProprioInstagram(externalUrl) ? externalUrl : null,
            email,
            whatsapp,
            categoria: profile.businessCategoryName ?? profile.category ?? null,
            cidade: locationMatch && input.city ? input.city : null,
            seguidores: followers || null,
          },
          input.mode === "hashtags" ? "IG-HASHTAG" : "IG-PLACES",
        ) as Rec;
        Object.assign(lead, {
          org_id: orgId,
          user_id: userId,
          assigned_to: userId,
          state: locationMatch ? input.state || null : null,
          score: leadScore,
          score_breakdown: {
            tipo: "instagram_content_signal",
            fonte: input.mode,
            conteudo: signals.contentScore,
            nicho_confirmado: nicheMatch,
            localidade_confirmada: locationMatch,
            conta: accountKind,
            atividade: signals.activityScore,
            engajamento_robusto: signals.robustEngagementRate,
            sinais_comerciais: signals.commercialSignals,
          },
          sem_contato: !hasContact,
        });
        const { data: existingLead } = await admin
          .from("leads")
          .select("id")
          .eq("org_id", orgId)
          .eq("place_id", lead.place_id)
          .maybeSingle();
        if (existingLead) {
          leadId = existingLead.id;
          decision = "duplicate";
          duplicates++;
        } else {
          const { data: inserted, error } = await admin
            .from("leads")
            .insert(lead)
            .select("id")
            .single();
          if (error || !inserted) rejectionReason = "erro_banco";
          else {
            leadId = inserted.id;
            decision = "qualified";
            newLeads++;
            planRemaining--;
          }
        }
        if (leadId) {
          const { error: profileError } = await admin.from("instagram_profiles").upsert(
            {
              lead_id: leadId,
              org_id: orgId,
              user_id: userId,
              username: candidate.username,
              instagram_user_id: String(profile.id ?? "") || null,
              full_name: profile.fullName ?? null,
              biography: biography || null,
              profile_pic_url: profile.profilePicUrlHD ?? profile.profilePicUrl ?? null,
              external_url: externalUrl,
              bio_links: Array.isArray(profile.externalUrls) ? profile.externalUrls : [],
              followers_count: followers || null,
              following_count: Number(profile.followsCount ?? 0) || null,
              posts_count: Number(profile.postsCount ?? 0) || null,
              verified: Boolean(profile.verified),
              private: Boolean(profile.private),
              professional,
              business_category: profile.businessCategoryName ?? null,
              business_email: email,
              business_phone: whatsapp,
              business_address: profile.businessAddress ?? null,
              avg_likes: signals.averageLikes,
              avg_comments: signals.averageComments,
              engagement_rate: signals.robustEngagementRate,
              last_post_at: signals.latestPostAt,
              recent_posts: candidate.posts.slice(0, 12).map((post) => post.raw_payload),
              related_profiles: Array.isArray(profile.relatedProfiles)
                ? profile.relatedProfiles.slice(0, 20)
                : [],
              raw_payload: profile,
              discovery_source: input.mode,
              last_active_at: signals.latestPostAt,
              intent_score: null,
              authenticity_score: authenticity,
              content_score: signals.contentScore,
              content_signals: signals,
              collected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "lead_id" },
          );
          if (profileError) throw new Error(`Falha ao salvar perfil: ${profileError.message}`);
        }
        if (!rejectionReason) qualified++;
      }

      if (rejectionReason && decision !== "duplicate") {
        decision =
          rejectionReason === "score_insuficiente" ||
          rejectionReason === "conteudo_fraco" ||
          rejectionReason === "meta_atingida"
            ? "candidate"
            : "rejected";
        rejections[rejectionReason] = (rejections[rejectionReason] ?? 0) + 1;
      }
      const bestPost = [...candidate.posts].sort(
        (a, b) => Number(b.metrics?.likes ?? 0) - Number(a.metrics?.likes ?? 0),
      )[0];
      results.push({
        username: candidate.username,
        fullName: profile?.fullName ?? null,
        avatarUrl: profile?.profilePicUrlHD ?? profile?.profilePicUrl ?? null,
        biography,
        followers,
        following: Number(profile?.followsCount ?? 0),
        posts: Number(profile?.postsCount ?? 0),
        professional,
        accountKind,
        category: profile?.businessCategoryName ?? null,
        externalUrl,
        email,
        whatsapp,
        sourceType: input.mode,
        sourceLabel: sourceName,
        sourceUrl: bestPost?.url ?? null,
        evidenceCaption: bestPost?.caption ?? "Conteudo publicado na origem selecionada.",
        contentCount: candidate.posts.length,
        signals,
        leadScore,
        nicheMatch,
        locationMatch,
        authenticity,
        decision,
        rejectionReason,
        leadId,
      });
      evidenceRows.push({
        org_id: orgId,
        user_id: userId,
        job_id: job.id,
        content_id: bestPost?.url ? (contentIds.get(bestPost.url) ?? null) : null,
        event_id: null,
        lead_id: leadId,
        username: candidate.username,
        evidence_type: input.mode === "hashtags" ? "hashtag_post" : "place_post",
        excerpt: String(bestPost?.caption ?? "Conteudo publicado na origem selecionada.").slice(
          0,
          1000,
        ),
        source_url: bestPost?.url ?? null,
        intent_label: null,
        intent_score: null,
        lead_score: leadScore,
        content_score: signals.contentScore,
        signal_data: signals,
        decision,
        rejection_reason: rejectionReason,
        profile_snapshot: profile,
        observed_at: bestPost?.posted_at ?? null,
      });
    }

    if (evidenceRows.length) {
      const { error } = await admin.from("instagram_profile_evidence").insert(evidenceRows);
      if (error) throw new Error(`Falha ao salvar evidencias: ${error.message}`);
    }
    if (newLeads > 0) await consumir(admin, orgId, "leads", newLeads);
    results.sort((a, b) => Number(b.leadScore) - Number(a.leadScore));
    const averageContentScore = results.length
      ? Number(
          (
            results.reduce((sum, result) => sum + Number(result.signals.contentScore), 0) /
            results.length
          ).toFixed(1),
        )
      : 0;
    const stats = {
      sourcesFound,
      contentItems: posts.length,
      uniqueProfiles: grouped.size,
      enrichedProfiles: profiles.length,
      qualified,
      newLeads,
      duplicates,
      averageContentScore,
      formatCounts,
      rejections,
      cache: cacheStats,
    };
    const response = {
      ok: true,
      jobId: job.id,
      stats,
      results,
      estimatedCost,
      actualCost,
      spentMonthAfter: spentMonth + actualCost,
      caps: { round: roundCap, month: monthCap },
    };
    await admin
      .from("instagram_discovery_jobs")
      .update({
        status: qualified > 0 ? "completed" : "partial",
        stats,
        result: response,
        actual_cost_usd: actualCost,
        stop_reason: qualified >= input.targetLeads ? "target_reached" : "source_exhausted",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return json(response, 200, req);
  } catch (error) {
    if (error instanceof ActorRunError) actualCost += error.costUsd;
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("instagram_discovery_jobs")
      .update({
        status: "failed",
        actual_cost_usd: actualCost,
        error: message.slice(0, 500),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return json({ ok: false, error: message, jobId: job.id, actualCost }, 500, req);
  }
}

async function listarConcorrentes(admin: Admin, orgId: string, req: Request): Promise<Response> {
  const { data: competitors, error } = await admin
    .from("instagram_competitors")
    .select("*")
    .eq("org_id", orgId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) return json({ ok: false, error: error.message }, 500, req);
  const ids = (competitors ?? []).map((item: Rec) => String(item.id));
  if (!ids.length) return json({ ok: true, competitors: [], snapshots: [], alerts: [] }, 200, req);
  const [{ data: snapshots, error: snapshotsError }, { data: alerts, error: alertsError }] =
    await Promise.all([
      admin
        .from("instagram_competitor_snapshots")
        .select("*")
        .in("competitor_id", ids)
        .order("captured_at", { ascending: false })
        .limit(300),
      admin
        .from("instagram_competitor_alerts")
        .select("*")
        .in("competitor_id", ids)
        .order("created_at", { ascending: false })
        .limit(150),
    ]);
  if (snapshotsError || alertsError) {
    return json({ ok: false, error: snapshotsError?.message ?? alertsError?.message }, 500, req);
  }
  return json(
    { ok: true, competitors: competitors ?? [], snapshots: snapshots ?? [], alerts: alerts ?? [] },
    200,
    req,
  );
}

async function salvarConcorrente(params: {
  admin: Admin;
  orgId: string;
  userId: string;
  body: Rec;
  req: Request;
}): Promise<Response> {
  const { admin, orgId, userId, body, req } = params;
  const username = normalizarUsername(body.username);
  const niche = String(body.niche ?? "").trim();
  if (!/^[\w.]{1,30}$/.test(username)) {
    return json({ ok: false, error: "Informe um perfil publico valido." }, 400, req);
  }
  if (!niche) return json({ ok: false, error: "Escolha o nicho do concorrente." }, 400, req);
  const intervalHours = inteiro(body.monitoringIntervalHours, 24, 720, 168);
  const { data, error } = await admin
    .from("instagram_competitors")
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        username,
        label: String(body.label ?? "").trim() || null,
        niche,
        city: String(body.city ?? "").trim() || null,
        state:
          String(body.state ?? "")
            .trim()
            .toUpperCase()
            .slice(0, 2) || null,
        status: "active",
        monitoring_interval_hours: intervalHours,
        next_analysis_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,username" },
    )
    .select("*")
    .single();
  if (error || !data) return json({ ok: false, error: error?.message }, 500, req);
  return json({ ok: true, competitor: data }, 200, req);
}

async function arquivarConcorrente(
  admin: Admin,
  orgId: string,
  body: Rec,
  req: Request,
): Promise<Response> {
  const competitorId = String(body.competitorId ?? "");
  const { error } = await admin
    .from("instagram_competitors")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", competitorId)
    .eq("org_id", orgId);
  if (error) return json({ ok: false, error: error.message }, 500, req);
  return json({ ok: true }, 200, req);
}

async function processarMonitoramentoConcorrente(params: {
  req: Request;
  admin: Admin;
  userId: string;
  orgId: string;
  body: Rec;
}): Promise<Response> {
  const { req, admin, userId, orgId, body } = params;
  let input: EntradaMonitoramentoConcorrente;
  try {
    input = validarEntradaMonitoramento(body);
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      400,
      req,
    );
  }
  const { data: competitor, error: competitorError } = await admin
    .from("instagram_competitors")
    .select("*")
    .eq("id", input.competitorId)
    .eq("org_id", orgId)
    .neq("status", "archived")
    .maybeSingle();
  if (competitorError || !competitor) {
    return json({ ok: false, error: "Concorrente nao encontrado." }, 404, req);
  }
  const { data: existing } = await admin
    .from("instagram_discovery_jobs")
    .select("status,result,error")
    .eq("user_id", userId)
    .eq("request_id", input.requestId)
    .maybeSingle();
  if (existing?.result) return json(existing.result, 200, req);
  if (existing) {
    return json(
      { ok: existing.status !== "failed", status: existing.status, error: existing.error },
      existing.status === "failed" ? 409 : 202,
      req,
    );
  }

  const config = await lerConfigPlataforma(admin);
  const roundCap = config.teto_redes_rodada_usd ?? TETO_REDES_RODADA_USD;
  const monthCap = config.teto_redes_mes_usd ?? TETO_REDES_MES_USD;
  const monthRef = mesRefAtual(new Date());
  const [{ data: discoveryCosts }, { data: legacyCosts }] = await Promise.all([
    admin
      .from("instagram_discovery_jobs")
      .select("actual_cost_usd")
      .eq("user_id", userId)
      .eq("month_ref", monthRef),
    admin
      .from("redes_buscas")
      .select("custo_usd")
      .eq("user_id", userId)
      .eq("mes_ref", monthRef)
      .eq("fonte", "instagram"),
  ]);
  const spentMonth =
    (discoveryCosts ?? []).reduce(
      (sum: number, row: Rec) => sum + Number(row.actual_cost_usd ?? 0),
      0,
    ) + (legacyCosts ?? []).reduce((sum: number, row: Rec) => sum + Number(row.custo_usd ?? 0), 0);
  const estimatedCost = estimateCompetitorMonitoringCost(input);
  const availableBudget = Math.max(0, Math.min(roundCap, monthCap - spentMonth));

  let sourceId = competitor.source_id ? String(competitor.source_id) : null;
  if (!sourceId) {
    const { data: source, error: sourceError } = await admin
      .from("instagram_sources")
      .insert({
        org_id: orgId,
        user_id: userId,
        source_type: "competitor",
        name: `@${competitor.username}`,
        config: { competitorId: competitor.id, username: competitor.username },
      })
      .select("id")
      .single();
    if (sourceError || !source) return json({ ok: false, error: sourceError?.message }, 500, req);
    sourceId = source.id;
    await admin
      .from("instagram_competitors")
      .update({ source_id: sourceId, updated_at: new Date().toISOString() })
      .eq("id", competitor.id);
  }
  const initialStatus = estimatedCost > availableBudget ? "budget_stopped" : "running";
  const { data: job, error: jobError } = await admin
    .from("instagram_discovery_jobs")
    .insert({
      org_id: orgId,
      user_id: userId,
      source_id: sourceId,
      request_id: input.requestId,
      mode: "competitors",
      status: initialStatus,
      input: { ...input, username: competitor.username },
      estimated_cost_usd: estimatedCost,
      month_ref: monthRef,
      stop_reason: initialStatus === "budget_stopped" ? "estimated_cost_exceeds_budget" : null,
      started_at: initialStatus === "running" ? new Date().toISOString() : null,
      completed_at: initialStatus === "budget_stopped" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (jobError || !job) return json({ ok: false, error: jobError?.message }, 500, req);
  if (initialStatus === "budget_stopped") {
    return json(
      {
        ok: false,
        error: `A estimativa de US$ ${estimatedCost.toFixed(2)} excede o saldo seguro de US$ ${availableBudget.toFixed(2)}.`,
        reason: "budget",
      },
      409,
      req,
    );
  }

  let actualCost = 0;
  const updateCost = async () => {
    await admin
      .from("instagram_discovery_jobs")
      .update({ actual_cost_usd: actualCost, updated_at: new Date().toISOString() })
      .eq("id", job.id);
  };
  try {
    const profileRun = await executarActor({
      admin,
      jobId: job.id,
      orgId,
      stepType: "enrich_profiles",
      actorId: ACTOR_PROFILES,
      input: { usernames: [competitor.username], includeAboutSection: false },
      requested: 1,
      ttlHours: 24,
      maxCharge: Math.min(0.05, availableBudget - actualCost),
    });
    actualCost += profileRun.cost;
    await updateCost();
    const profile = profilePorUsername(profileRun.items).get(competitor.username);
    if (!profile) throw new Error("O perfil publico do concorrente nao foi encontrado.");

    const postsRun = await executarActor({
      admin,
      jobId: job.id,
      orgId,
      stepType: "discover_content",
      actorId: ACTOR_POSTS,
      input: {
        username: [competitor.username],
        resultsLimit: input.maxPosts,
        skipPinnedPosts: true,
        dataDetailLevel: "basicData",
      },
      requested: input.maxPosts,
      ttlHours: 12,
      maxCharge: Math.min(Math.max(0.05, input.maxPosts * 0.002), availableBudget - actualCost),
    });
    actualCost += postsRun.cost;
    await updateCost();
    const posts = postsRun.items
      .map((item) => normalizarPost(item, competitor.username))
      .filter((item): item is Rec => Boolean(item));
    if (!posts.length) throw new Error("Nenhum post ou Reel publico foi encontrado.");
    const contentIds = await salvarConteudos({
      admin,
      orgId,
      userId,
      sourceId,
      jobId: job.id,
      posts,
    });
    const topForComments = [...posts]
      .sort((a, b) => Number(b.metrics?.comments ?? 0) - Number(a.metrics?.comments ?? 0))
      .slice(0, input.commentPosts);
    let comments: Array<NonNullable<ReturnType<typeof normalizarComentario>>> = [];
    if (topForComments.length) {
      const commentsRun = await executarActor({
        admin,
        jobId: job.id,
        orgId,
        stepType: "collect_comments",
        actorId: ACTOR_COMMENTS,
        input: {
          directUrls: topForComments.map((post) => post.url),
          resultsLimit: input.commentsPerPost,
          includeNestedComments: false,
          isNewestComments: true,
        },
        requested: topForComments.length * input.commentsPerPost,
        ttlHours: 6,
        maxCharge: Math.min(
          Math.max(0.08, topForComments.length * input.commentsPerPost * 0.003),
          availableBudget - actualCost,
        ),
      });
      actualCost += commentsRun.cost;
      await updateCost();
      comments = commentsRun.items
        .map(normalizarComentario)
        .filter((item): item is NonNullable<ReturnType<typeof normalizarComentario>> =>
          Boolean(item),
        );
    }
    if (comments.length) {
      const eventRows = comments.map((comment) => ({
        org_id: orgId,
        user_id: userId,
        source_id: sourceId,
        job_id: job.id,
        content_id: comment.postUrl ? (contentIds.get(comment.postUrl) ?? null) : null,
        instagram_event_id: comment.instagramEventId,
        event_type: "comment",
        actor_username: comment.username,
        actor_instagram_id: comment.instagramUserId,
        actor_full_name: comment.fullName,
        actor_avatar_url: comment.avatarUrl,
        text: comment.texto,
        likes_count: comment.likes,
        replies_count: comment.repliesCount,
        occurred_at: comment.ocorridoEm,
        intent_label: comment.classificacao.rotulo,
        intent_score: comment.classificacao.score,
        intent_signals: comment.classificacao.sinais,
        is_spam: comment.classificacao.spam,
        raw_payload: comment.raw,
      }));
      const { error } = await admin
        .from("instagram_engagement_events")
        .upsert(eventRows, { onConflict: "org_id,instagram_event_id", ignoreDuplicates: true });
      if (error) throw new Error(`Falha ao salvar comentarios: ${error.message}`);
    }

    const followers = Number(profile.followersCount ?? 0);
    const contentSummary = summarizeCompetitorContent({
      posts: posts.map((post) => ({
        url: post.url,
        caption: post.caption,
        likes: post.metrics?.likes,
        comments: post.metrics?.comments,
        views: post.metrics?.views,
        postedAt: post.posted_at,
        contentType: post.content_type,
        hashtags: Array.isArray(post.raw_payload?.hashtags) ? post.raw_payload.hashtags : [],
        locationText: textoLocalPost(post),
      })),
      followers,
      niche: competitor.niche,
      city: competitor.city ?? "",
    });
    const commentSummary = summarizeCompetitorComments(
      comments.map((comment) => ({
        username: comment.username,
        text: comment.texto,
        likes: comment.likes,
        occurredAt: comment.ocorridoEm,
        postUrl: comment.postUrl,
      })),
    );
    const { data: previousSnapshot } = await admin
      .from("instagram_competitor_snapshots")
      .select("followers_count,posts_count,engagement_rate,hashtags,captured_at")
      .eq("competitor_id", competitor.id)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const comparableCurrent = {
      followers,
      postsCount: Number(profile.postsCount ?? 0),
      engagementRate: contentSummary.signals.robustEngagementRate,
      hashtags: contentSummary.hashtags,
    };
    const trend = compareCompetitorSnapshots(
      comparableCurrent,
      previousSnapshot
        ? {
            followers: Number(previousSnapshot.followers_count ?? 0),
            postsCount: Number(previousSnapshot.posts_count ?? 0),
            engagementRate: Number(previousSnapshot.engagement_rate ?? 0),
            hashtags: previousSnapshot.hashtags ?? [],
            capturedAt: previousSnapshot.captured_at,
          }
        : null,
    );
    const { data: snapshot, error: snapshotError } = await admin
      .from("instagram_competitor_snapshots")
      .insert({
        competitor_id: competitor.id,
        org_id: orgId,
        user_id: userId,
        job_id: job.id,
        followers_count: followers,
        following_count: Number(profile.followsCount ?? 0),
        posts_count: Number(profile.postsCount ?? 0),
        follower_delta: trend.followerDelta,
        follower_growth_percent: trend.followerGrowthPercent,
        posts_delta: trend.postsDelta,
        engagement_rate: contentSummary.signals.robustEngagementRate,
        engagement_delta: trend.engagementDelta,
        posting_frequency_weekly: contentSummary.postingFrequencyWeekly,
        average_likes: contentSummary.signals.averageLikes,
        median_likes: contentSummary.signals.medianLikes,
        average_comments: contentSummary.signals.averageComments,
        median_comments: contentSummary.signals.medianComments,
        content_score: contentSummary.signals.contentScore,
        profile_pic_url: profile.profilePicUrlHD ?? profile.profilePicUrl ?? null,
        full_name: profile.fullName ?? null,
        biography: profile.biography ?? null,
        business_category: profile.businessCategoryName ?? null,
        format_counts: contentSummary.formatCounts,
        hashtags: contentSummary.hashtags,
        locations: contentSummary.locations,
        top_posts: contentSummary.topPosts,
        comment_summary: commentSummary,
        profile_snapshot: profile,
      })
      .select("*")
      .single();
    if (snapshotError || !snapshot)
      throw new Error(`Falha ao salvar snapshot: ${snapshotError?.message}`);

    const insightRows: Rec[] = [
      ...commentSummary.recurringCommenters.map((item) => ({
        insight_type: "recurring_commenter",
        key: item.username,
        title: `@${item.username} comenta com frequencia`,
        evidence: item.bestEvidence,
        score: item.bestIntentScore,
        occurrences: item.count,
        data: item,
      })),
      ...commentSummary.intentOpportunities.map((item) => ({
        insight_type: "purchase_intent",
        key: item.username,
        title: `@${item.username} demonstrou ${item.label}`,
        evidence: item.text,
        score: item.score,
        occurrences: 1,
        data: item,
      })),
      ...commentSummary.objections.map((item) => ({
        insight_type: "objection",
        key: item.category,
        title: `Objecao: ${item.category}`,
        evidence: item.examples.join(" | "),
        score: Math.min(100, 30 + item.count * 10),
        occurrences: item.count,
        data: item,
      })),
      ...commentSummary.questionTopics.map((item) => ({
        insight_type: "question_topic",
        key: item.name,
        title: `Duvidas sobre ${item.name}`,
        evidence: null,
        score: Math.min(100, 25 + item.count * 8),
        occurrences: item.count,
        data: item,
      })),
      ...contentSummary.hashtags.map((item) => ({
        insight_type: "hashtag",
        key: item.name,
        title: `#${item.name}`,
        evidence: null,
        score: Math.min(100, 20 + item.count * 5),
        occurrences: item.count,
        data: item,
      })),
      ...contentSummary.locations.map((item) => ({
        insight_type: "location",
        key: item.name,
        title: item.name,
        evidence: null,
        score: Math.min(100, 20 + item.count * 5),
        occurrences: item.count,
        data: item,
      })),
    ].map((item) => ({
      ...item,
      competitor_id: competitor.id,
      snapshot_id: snapshot.id,
      org_id: orgId,
      job_id: job.id,
    }));
    if (insightRows.length) {
      const { error } = await admin.from("instagram_competitor_insights").insert(insightRows);
      if (error) throw new Error(`Falha ao salvar insights: ${error.message}`);
    }
    const alerts = buildCompetitorAlerts({ comments: commentSummary, trend });
    if (alerts.length) {
      const { error } = await admin.from("instagram_competitor_alerts").insert(
        alerts.map((alert) => ({
          competitor_id: competitor.id,
          snapshot_id: snapshot.id,
          org_id: orgId,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          score: alert.score,
          data: alert.data,
        })),
      );
      if (error) throw new Error(`Falha ao salvar alertas: ${error.message}`);
    }
    const capturedAt = String(snapshot.captured_at ?? new Date().toISOString());
    const nextAnalysis = new Date(
      new Date(capturedAt).getTime() +
        Number(competitor.monitoring_interval_hours ?? 168) * 3_600_000,
    ).toISOString();
    await admin
      .from("instagram_competitors")
      .update({
        last_analyzed_at: capturedAt,
        next_analysis_at: nextAnalysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", competitor.id);
    const stats = {
      posts: posts.length,
      comments: comments.length,
      uniqueCommenters: commentSummary.uniqueCommenters,
      opportunities: commentSummary.intentOpportunities.length,
      recurringCommenters: commentSummary.recurringCommenters.length,
      objections: commentSummary.objectionCount,
      alerts: alerts.length,
    };
    const response = {
      ok: true,
      jobId: job.id,
      competitor: { ...competitor, last_analyzed_at: capturedAt, next_analysis_at: nextAnalysis },
      snapshot,
      content: contentSummary,
      comments: commentSummary,
      trend,
      alerts,
      stats,
      estimatedCost,
      actualCost,
      spentMonthAfter: spentMonth + actualCost,
    };
    await admin
      .from("instagram_discovery_jobs")
      .update({
        status: "completed",
        stats,
        result: response,
        actual_cost_usd: actualCost,
        stop_reason: "snapshot_completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return json(response, 200, req);
  } catch (error) {
    if (error instanceof ActorRunError) actualCost += error.costUsd;
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("instagram_discovery_jobs")
      .update({
        status: "failed",
        actual_cost_usd: actualCost,
        error: message.slice(0, 500),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return json({ ok: false, error: message, jobId: job.id, actualCost }, 500, req);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, req);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return json({ error: "Não autenticado" }, 401, req);
  if (!(await acessoFerramentaLiberado(userClient, auth.user.id))) {
    return json({ error: "Acesso aguardando liberação do administrador" }, 403, req);
  }
  const userId = auth.user.id;
  const orgId = await orgDoUsuario(admin, userId);
  if (!orgId) return json({ error: "Organização não encontrada." }, 409, req);

  let body: Rec;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400, req);
  }

  if (body.acao === "listar_concorrentes") return listarConcorrentes(admin, orgId, req);
  if (body.acao === "salvar_concorrente") {
    return salvarConcorrente({ admin, orgId, userId, body, req });
  }
  if (body.acao === "arquivar_concorrente") {
    return arquivarConcorrente(admin, orgId, body, req);
  }
  if (body.acao === "monitorar_concorrente") {
    return processarMonitoramentoConcorrente({ req, admin, userId, orgId, body });
  }

  if (body.acao === "historico") {
    const historyMode = ["comments", "hashtags", "places"].includes(String(body.mode))
      ? String(body.mode)
      : "comments";
    const { data, error } = await admin
      .from("instagram_discovery_jobs")
      .select(
        "id,status,input,stats,result,estimated_cost_usd,actual_cost_usd,created_at,completed_at",
      )
      .eq("org_id", orgId)
      .eq("mode", historyMode)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) return json({ error: error.message }, 500, req);
    return json({ ok: true, jobs: data ?? [] }, 200, req);
  }

  if (body.acao === "buscar_conteudo") {
    return processarDescobertaConteudo({ req, admin, userId, orgId, body });
  }

  let input: EntradaComments;
  try {
    input = validarEntrada(body);
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      400,
      req,
    );
  }

  const { data: existing } = await admin
    .from("instagram_discovery_jobs")
    .select("status,result,error")
    .eq("user_id", userId)
    .eq("request_id", input.requestId)
    .maybeSingle();
  if (existing?.result) return json(existing.result, 200, req);
  if (existing) {
    return json(
      {
        ok: existing.status !== "failed",
        pending: existing.status === "running",
        status: existing.status,
        error: existing.error,
      },
      existing.status === "failed" ? 409 : 202,
      req,
    );
  }

  const config = await lerConfigPlataforma(admin);
  const roundCap = config.teto_redes_rodada_usd ?? TETO_REDES_RODADA_USD;
  const monthCap = config.teto_redes_mes_usd ?? TETO_REDES_MES_USD;
  const monthRef = mesRefAtual(new Date());
  const [{ data: discoveryCosts }, { data: legacyCosts }] = await Promise.all([
    admin
      .from("instagram_discovery_jobs")
      .select("actual_cost_usd")
      .eq("user_id", userId)
      .eq("month_ref", monthRef),
    admin
      .from("redes_buscas")
      .select("custo_usd")
      .eq("user_id", userId)
      .eq("mes_ref", monthRef)
      .eq("fonte", "instagram"),
  ]);
  const spentMonth =
    (discoveryCosts ?? []).reduce(
      (sum: number, row: Rec) => sum + Number(row.actual_cost_usd ?? 0),
      0,
    ) + (legacyCosts ?? []).reduce((sum: number, row: Rec) => sum + Number(row.custo_usd ?? 0), 0);
  const estimatedCost = estimarCustoCommentsHunter(input);
  const availableBudget = Math.max(0, Math.min(roundCap, monthCap - spentMonth));

  const { data: source, error: sourceError } = await admin
    .from("instagram_sources")
    .insert({
      org_id: orgId,
      user_id: userId,
      source_type: input.sourceType === "profile" ? "competitor" : "post",
      name:
        input.sourceType === "profile"
          ? `@${input.profile}`
          : `${input.postUrls.length} posts selecionados`,
      config: input,
    })
    .select("id")
    .single();
  if (sourceError || !source) return json({ ok: false, error: sourceError?.message }, 500, req);

  const initialStatus = estimatedCost > availableBudget ? "budget_stopped" : "running";
  const { data: job, error: jobError } = await admin
    .from("instagram_discovery_jobs")
    .insert({
      org_id: orgId,
      user_id: userId,
      source_id: source.id,
      request_id: input.requestId,
      mode: "comments",
      status: initialStatus,
      input,
      estimated_cost_usd: estimatedCost,
      month_ref: monthRef,
      stop_reason: initialStatus === "budget_stopped" ? "estimated_cost_exceeds_budget" : null,
      started_at: initialStatus === "running" ? new Date().toISOString() : null,
      completed_at: initialStatus === "budget_stopped" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (jobError || !job) return json({ ok: false, error: jobError?.message }, 500, req);
  if (initialStatus === "budget_stopped") {
    return json(
      {
        ok: false,
        reason: "budget",
        error: `A estimativa de US$ ${estimatedCost.toFixed(2)} excede o saldo seguro de US$ ${availableBudget.toFixed(2)}.`,
        estimatedCost,
        spentMonth,
        caps: { round: roundCap, month: monthCap },
      },
      409,
      req,
    );
  }

  let actualCost = 0;
  const updateCost = async () => {
    await admin
      .from("instagram_discovery_jobs")
      .update({ actual_cost_usd: actualCost, updated_at: new Date().toISOString() })
      .eq("id", job.id);
  };

  try {
    let posts: Rec[] = [];
    const cacheStats = { posts: false, comments: false, profiles: false };
    if (input.sourceType === "profile") {
      const runPosts = await executarActor({
        admin,
        jobId: job.id,
        orgId,
        stepType: "discover_content",
        actorId: ACTOR_POSTS,
        input: {
          username: [input.profile],
          resultsLimit: input.maxPosts,
          skipPinnedPosts: true,
          dataDetailLevel: "basicData",
        },
        requested: input.maxPosts,
        ttlHours: 12,
        maxCharge: Math.min(0.12, availableBudget - actualCost),
      });
      actualCost += runPosts.cost;
      cacheStats.posts = runPosts.cacheHit;
      await updateCost();
      posts = runPosts.items
        .map((item) => normalizarPost(item, input.profile))
        .filter((item): item is Rec => Boolean(item));
    } else {
      posts = input.postUrls.map((url) => ({
        instagram_content_id: null,
        shortcode: url.match(/\/(?:p|reel)\/([^/]+)/i)?.[1] ?? null,
        content_type: /\/reel\//i.test(url) ? "reel" : "post",
        owner_username: "origem-direta",
        url,
        caption: null,
        posted_at: null,
        location: null,
        metrics: {},
        raw_payload: { url },
      }));
    }
    if (!posts.length) throw new Error("Nenhum post público foi encontrado nessa origem.");

    const contentIds = await salvarConteudos({
      admin,
      orgId,
      userId,
      sourceId: source.id,
      jobId: job.id,
      posts,
    });
    const postUrls = posts.map((post) => String(post.url));
    const requestedComments = postUrls.length * input.commentsPerPost;
    const runComments = await executarActor({
      admin,
      jobId: job.id,
      orgId,
      stepType: "collect_comments",
      actorId: ACTOR_COMMENTS,
      input: {
        directUrls: postUrls,
        resultsLimit: input.commentsPerPost,
        includeNestedComments: false,
      },
      requested: requestedComments,
      ttlHours: 6,
      maxCharge: Math.min(Math.max(0.08, requestedComments * 0.003), availableBudget - actualCost),
    });
    actualCost += runComments.cost;
    cacheStats.comments = runComments.cacheHit;
    await updateCost();

    const comentarios = runComments.items
      .map(normalizarComentario)
      .filter((item): item is NonNullable<ReturnType<typeof normalizarComentario>> =>
        Boolean(item),
      );
    const eventRows = comentarios.map((comment) => ({
      org_id: orgId,
      user_id: userId,
      source_id: source.id,
      job_id: job.id,
      content_id: comment.postUrl ? (contentIds.get(comment.postUrl) ?? null) : null,
      instagram_event_id: comment.instagramEventId,
      event_type: "comment",
      actor_username: comment.username,
      actor_instagram_id: comment.instagramUserId,
      actor_full_name: comment.fullName,
      actor_avatar_url: comment.avatarUrl,
      text: comment.texto,
      likes_count: comment.likes,
      replies_count: comment.repliesCount,
      occurred_at: comment.ocorridoEm,
      intent_label: comment.classificacao.rotulo,
      intent_score: comment.classificacao.score,
      intent_signals: comment.classificacao.sinais,
      is_spam: comment.classificacao.spam,
      raw_payload: comment.raw,
    }));
    if (eventRows.length) {
      const { error } = await admin
        .from("instagram_engagement_events")
        .upsert(eventRows, { onConflict: "org_id,instagram_event_id", ignoreDuplicates: true });
      if (error) throw new Error(`Falha ao salvar comentários: ${error.message}`);
    }

    const uniqueAll = selecionarComentaristasUnicos(comentarios);
    const unique = uniqueAll.filter(
      (comment) => comment.classificacao.score >= input.minIntentScore,
    );
    const enrichLimit = Math.min(60, Math.max(10, input.targetLeads * 3), unique.length);
    const toEnrich = unique.slice(0, enrichLimit);
    let profiles: Rec[] = [];
    if (toEnrich.length) {
      const runProfiles = await executarActor({
        admin,
        jobId: job.id,
        orgId,
        stepType: "enrich_profiles",
        actorId: ACTOR_PROFILES,
        input: {
          usernames: toEnrich.map((comment) => comment.username),
          includeAboutSection: false,
        },
        requested: toEnrich.length,
        ttlHours: 7 * 24,
        maxCharge: Math.min(Math.max(0.08, toEnrich.length * 0.0035), availableBudget - actualCost),
      });
      actualCost += runProfiles.cost;
      cacheStats.profiles = runProfiles.cacheHit;
      await updateCost();
      profiles = runProfiles.items;
    }

    const profileMap = perfilPorUsername(profiles);
    const { data: storedEvents } = await admin
      .from("instagram_engagement_events")
      .select("id,instagram_event_id")
      .eq("job_id", job.id);
    const eventIds = new Map(
      (storedEvents ?? []).map((event: Rec) => [String(event.instagram_event_id ?? ""), event.id]),
    );

    const results: Rec[] = [];
    const evidenceRows: Rec[] = [];
    let newLeads = 0;
    let duplicates = 0;
    let qualified = 0;
    const rejections: Record<string, number> = {};
    const consumption = await estadoConsumo(admin, orgId, "leads");
    let planRemaining = consumption.limite == null ? Infinity : (consumption.restante ?? 0);

    for (const comment of toEnrich) {
      const profile = profileMap.get(comment.username) ?? null;
      const professional = profile ? perfilEhProfissionalInstagram(profile) : false;
      const nicheMatch = profile ? perfilTemNicho(profile, input.niche) : false;
      const locationMatch = profile
        ? input.city
          ? perfilTemLocalidade(profile, input.city)
          : true
        : false;
      const followers = Number(profile?.followersCount ?? 0);
      const externalUrl = profile?.externalUrl ?? null;
      const biography = String(profile?.biography ?? "");
      const email = acharEmail(`${biography} ${profile?.businessEmail ?? ""}`);
      const whatsapp = acharWhatsapp(
        `${biography} ${profile?.businessPhoneNumber ?? ""} ${externalUrl ?? ""}`,
      );
      const hasContact = Boolean(email || whatsapp || externalUrl);
      const activity = profile ? atividadePerfil(profile) : 0;
      const leadScore = calcularScoreLeadComentario({
        intencao: comment.classificacao.score,
        profissional: professional,
        aderenciaNicho: nicheMatch ? 100 : 0,
        aderenciaLocalidade: locationMatch ? 100 : input.city ? 0 : 70,
        atividade: activity,
        temContato: hasContact,
        seguidores: followers,
      });

      let decision: "qualified" | "candidate" | "rejected" | "duplicate" = "candidate";
      let rejectionReason: string | null = null;
      if (!profile) rejectionReason = "perfil_indisponivel";
      else if (input.onlyProfessionals && !professional) rejectionReason = "conta_pessoal";
      else if (input.requireNiche && !nicheMatch) rejectionReason = "fora_nicho";
      else if (input.requireLocation && !locationMatch) rejectionReason = "fora_localidade";
      else if (leadScore < input.minLeadScore) rejectionReason = "score_insuficiente";
      else if (qualified >= input.targetLeads) rejectionReason = "meta_atingida";
      else if (planRemaining <= 0) rejectionReason = "limite_plano";

      let leadId: string | null = null;
      if (!rejectionReason && profile) {
        const lead = perfilParaLead(
          {
            username: comment.username,
            nome: profile.fullName ?? comment.fullName,
            bio: biography,
            linkBio: temSiteProprioInstagram(externalUrl) ? externalUrl : null,
            email,
            whatsapp,
            categoria: profile.businessCategoryName ?? profile.category ?? null,
            cidade: locationMatch && input.city ? input.city : null,
            seguidores: followers || null,
          },
          "IG-COMMENTS",
        ) as Rec;
        Object.assign(lead, {
          org_id: orgId,
          user_id: userId,
          assigned_to: userId,
          state: locationMatch ? input.state || null : null,
          score: leadScore,
          score_breakdown: {
            tipo: "instagram_comment_intent",
            intencao: comment.classificacao.score,
            conta_comercial: professional,
            nicho_confirmado: nicheMatch,
            localidade_confirmada: locationMatch,
            atividade: activity,
            contato_externo: hasContact,
          },
          sem_contato: false,
        });
        const { data: existingLead } = await admin
          .from("leads")
          .select("id")
          .eq("org_id", orgId)
          .eq("place_id", lead.place_id)
          .maybeSingle();
        if (existingLead) {
          leadId = existingLead.id;
          decision = "duplicate";
          duplicates++;
        } else {
          const { data: inserted, error } = await admin
            .from("leads")
            .insert(lead)
            .select("id")
            .single();
          if (error || !inserted) {
            rejectionReason = "erro_banco";
          } else {
            leadId = inserted.id;
            decision = "qualified";
            newLeads++;
            planRemaining--;
          }
        }
        if (leadId) {
          const latestPosts = Array.isArray(profile.latestPosts) ? profile.latestPosts : [];
          const { error: profileError } = await admin.from("instagram_profiles").upsert(
            {
              lead_id: leadId,
              org_id: orgId,
              user_id: userId,
              username: comment.username,
              instagram_user_id: String(profile.id ?? "") || null,
              full_name: profile.fullName ?? comment.fullName,
              biography: biography || null,
              profile_pic_url:
                profile.profilePicUrlHD ?? profile.profilePicUrl ?? comment.avatarUrl,
              external_url: externalUrl,
              bio_links: Array.isArray(profile.externalUrls) ? profile.externalUrls : [],
              followers_count: followers || null,
              following_count: Number(profile.followsCount ?? 0) || null,
              posts_count: Number(profile.postsCount ?? 0) || null,
              verified: Boolean(profile.verified),
              private: Boolean(profile.private),
              professional,
              business_category: profile.businessCategoryName ?? null,
              business_email: email,
              business_phone: whatsapp,
              business_address: profile.businessAddress ?? null,
              last_post_at: latestPosts.length
                ? dataIso(latestPosts[0]?.timestamp ?? latestPosts[0]?.takenAtTimestamp)
                : null,
              recent_posts: latestPosts.slice(0, 12),
              related_profiles: Array.isArray(profile.relatedProfiles)
                ? profile.relatedProfiles.slice(0, 20)
                : [],
              raw_payload: profile,
              discovery_source: "comments",
              last_active_at: comment.ocorridoEm,
              intent_score: comment.classificacao.score,
              authenticity_score: autenticidadePerfil(profile),
              collected_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "lead_id" },
          );
          if (profileError) throw new Error(`Falha ao salvar perfil: ${profileError.message}`);
        }
        if (!rejectionReason) qualified++;
      }

      if (rejectionReason && decision !== "duplicate") {
        decision =
          rejectionReason === "score_insuficiente" || rejectionReason === "meta_atingida"
            ? "candidate"
            : "rejected";
        rejections[rejectionReason] = (rejections[rejectionReason] ?? 0) + 1;
      }
      const sourceUrl = comment.postUrl;
      const result = {
        username: comment.username,
        fullName: profile?.fullName ?? comment.fullName,
        avatarUrl: profile?.profilePicUrlHD ?? profile?.profilePicUrl ?? comment.avatarUrl,
        biography,
        followers,
        following: Number(profile?.followsCount ?? 0),
        posts: Number(profile?.postsCount ?? 0),
        professional,
        category: profile?.businessCategoryName ?? null,
        externalUrl,
        email,
        whatsapp,
        comment: comment.texto,
        commentLikes: comment.likes,
        occurredAt: comment.ocorridoEm,
        sourceUrl,
        intentLabel: comment.classificacao.rotulo,
        intentScore: comment.classificacao.score,
        intentSignals: comment.classificacao.sinais,
        leadScore,
        nicheMatch,
        locationMatch,
        activity,
        authenticity: profile ? autenticidadePerfil(profile) : 0,
        decision,
        rejectionReason,
        leadId,
      };
      results.push(result);
      evidenceRows.push({
        org_id: orgId,
        user_id: userId,
        job_id: job.id,
        content_id: sourceUrl ? (contentIds.get(sourceUrl) ?? null) : null,
        event_id: comment.instagramEventId
          ? (eventIds.get(comment.instagramEventId) ?? null)
          : null,
        lead_id: leadId,
        username: comment.username,
        evidence_type: "comment",
        excerpt: comment.texto,
        source_url: sourceUrl,
        intent_label: comment.classificacao.rotulo,
        intent_score: comment.classificacao.score,
        lead_score: leadScore,
        decision,
        rejection_reason: rejectionReason,
        profile_snapshot: profile,
        observed_at: comment.ocorridoEm,
      });
    }

    if (evidenceRows.length) {
      const { error } = await admin.from("instagram_profile_evidence").insert(evidenceRows);
      if (error) throw new Error(`Falha ao salvar evidências: ${error.message}`);
    }
    if (newLeads > 0) await consumir(admin, orgId, "leads", newLeads);

    results.sort((a, b) => Number(b.leadScore) - Number(a.leadScore));
    const stats = {
      posts: posts.length,
      comments: comentarios.length,
      uniqueCommenters: uniqueAll.length,
      intentCandidates: unique.length,
      enrichedProfiles: profiles.length,
      qualified,
      newLeads,
      duplicates,
      rejections,
      cache: cacheStats,
    };
    const response = {
      ok: true,
      jobId: job.id,
      stats,
      results,
      estimatedCost,
      actualCost,
      spentMonthAfter: spentMonth + actualCost,
      caps: { round: roundCap, month: monthCap },
    };
    await admin
      .from("instagram_discovery_jobs")
      .update({
        status: qualified > 0 ? "completed" : "partial",
        stats,
        result: response,
        actual_cost_usd: actualCost,
        stop_reason: qualified >= input.targetLeads ? "target_reached" : "source_exhausted",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return json(response, 200, req);
  } catch (error) {
    if (error instanceof ActorRunError) actualCost += error.costUsd;
    const message = error instanceof Error ? error.message : String(error);
    await admin
      .from("instagram_discovery_jobs")
      .update({
        status: "failed",
        actual_cost_usd: actualCost,
        error: message.slice(0, 500),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return json({ ok: false, error: message, jobId: job.id, actualCost }, 500, req);
  }
});
