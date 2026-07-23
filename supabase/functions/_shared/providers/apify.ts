// Provedor Apify — Google Maps Scraper (Actor compass/crawler-google-places).
// Fonte RICA: telefone, WhatsApp (do celular), site, NOTA + nº de avaliações,
// endereço completo, lat/lng, e-mail/IG quando existir. PAGA (cobra por run).
//
// 🔑 POOL DE CHAVES (Etapa 3 — "não deixar cair"): o START passa pelo rodízio
// (startRunComPool). Se o crédito acabar NO MEIO do run (run morre ABORTED/FAILED e o
// endpoint de limites confirma), o PARCIAL do run morto é colhido do dataset (best-effort),
// a chave é marcada, a PRÓXIMA assume e um run novo continua a busca — o dedupe
// (seen + nome|endereço + upsert por place_id no caller) impede duplicata. A busca só
// falha de verdade se TODAS as chaves acabarem.
import type { ProviderSearch, RawPlace } from "./types.ts";
import { startRunComPool, tratarRunMorto, type ChaveApify } from "../apify-pool.ts";

const ACTOR = "compass~crawler-google-places"; // slug com ~ no path da API
const API = "https://api.apify.com/v2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_RUNS = 4; // teto duro de restarts numa busca (nunca loop infinito)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// Polígono circular (GeoJSON) p/ busca por pino manual (lat/lng+raio).
function circulo(lat: number, lng: number, raioKm: number, pts = 24) {
  const coords: number[][] = [];
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * 2 * Math.PI;
    const dLat = (raioKm / 111) * Math.cos(a);
    const dLng = (raioKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a);
    coords.push([lng + dLng, lat + dLat]);
  }
  return { type: "Polygon", coordinates: [coords] };
}

// Só os campos que usamos do item do dataset do ator de Google Maps.
type ApifyItem = {
  title?: string;
  placeId?: string;
  cid?: string;
  url?: string;
  location?: { lat?: number; lng?: number };
  instagrams?: string[];
  instagram?: string;
  facebooks?: string[];
  facebook?: string;
  categoryName?: string;
  categories?: string[];
  address?: string;
  phoneUnformatted?: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
};

function mapItem(it: ApifyItem): RawPlace | null {
  const name = (it.title ?? "").trim();
  if (!name) return null;
  const id = it.placeId ?? it.cid ?? it.url ?? `${it.location?.lat},${it.location?.lng}`;
  const igs = it.instagrams ?? it.instagram;
  const fbs = it.facebooks ?? it.facebook;
  return {
    source: "apify",
    source_id: `apify:${id}`,
    name,
    category: it.categoryName ?? it.categories?.[0] ?? null,
    address: it.address ?? null,
    phone: it.phoneUnformatted ?? it.phone ?? null,
    website: it.website ?? null,
    rating: typeof it.totalScore === "number" ? it.totalScore : null,
    review_count: typeof it.reviewsCount === "number" ? it.reviewsCount : null,
    instagram: Array.isArray(igs) ? (igs[0] ?? null) : (igs ?? null),
    facebook: Array.isArray(fbs) ? (fbs[0] ?? null) : (fbs ?? null),
    lat: it.location?.lat ?? null,
    lng: it.location?.lng ?? null,
  };
}

// 🔑 Contexto do pool: setado 1x por request pelo caller (search-leads) com o admin client —
// necessário porque marcar chave/avisar/rodiziar exige service role. Sem contexto, cai no
// comportamento antigo (chave única do cache/env), para não quebrar nenhum caller.
let _poolAdmin: Admin | null = null;
export function setApifyPoolContext(admin: Admin | null): void {
  _poolAdmin = admin;
}

// Compat: caminho antigo de chave única (mantido como fallback sem contexto de pool).
let _apifyTokenCache: string | null = null;
export function setApifyTokenOverride(v: string | null): void {
  _apifyTokenCache = v;
}

/** Baixa os itens do dataset de um run (mesmo morto, o que foi escrito fica). Best-effort. */
async function baixarDataset(datasetId: string, token: string, max: number): Promise<ApifyItem[]> {
  try {
    const r = await fetch(
      `${API}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&limit=${max}`,
    );
    return (await r.json().catch(() => [])) as ApifyItem[];
  } catch {
    return [];
  }
}

export const searchApify: ProviderSearch = async ({
  nicho,
  cidade,
  uf,
  lat,
  lng,
  raioKm,
  limite,
  seen,
  log,
}) => {
  // Fonte PAGA: pede só o necessário (limite + pequena folga), nunca ~1.6x.
  const maxPlaces = Math.min(limite + 5, 120);
  const input: Record<string, unknown> = {
    searchStringsArray: [nicho],
    maxCrawledPlacesPerSearch: maxPlaces,
    language: "pt-BR",
    skipClosedPlaces: false,
    // CUSTO MÍNIMO: nota + nº de avaliações vêm no lugar (agregados), mas NÃO
    // puxamos reviews/fotos individuais nem contatos (nosso enrich faz o e-mail).
    maxReviews: 0,
    maxImages: 0,
    maxQuestions: 0,
    scrapeContacts: false,
    scrapeReviewsPersonalData: false,
    scrapeImageAuthors: false,
    reviewsSort: "newest",
  };
  if (cidade) {
    input.locationQuery = `${cidade}${uf ? ", " + uf : ""}, Brasil`;
  } else if (lat != null && lng != null) {
    input.customGeolocation = circulo(lat, lng, raioKm ?? 10);
  }
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  };

  // Acumulado ATRAVÉS de restarts — o parcial de um run morto nunca se perde.
  const itensAcumulados: ApifyItem[] = [];
  let usdTotal = 0;

  for (let rodada = 1; rodada <= MAX_RUNS; rodada++) {
    // ── START (com rodízio quando há contexto de pool) ──
    let chave: ChaveApify;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let startJson: any;
    if (_poolAdmin) {
      log(
        rodada === 1
          ? `Apify: iniciando run (Google Maps) — até ${maxPlaces} lugares...`
          : `Apify: continuando a busca com a próxima chave do pool (rodada ${rodada})...`,
      );
      const r = await startRunComPool(
        _poolAdmin,
        (t) => `${API}/acts/${ACTOR}/runs?token=${encodeURIComponent(t)}`,
        init,
      );
      if (!r.ok) {
        // só falha DE VERDADE se não sobrou chave nenhuma — e preservando o parcial
        if (itensAcumulados.length > 0) {
          log(
            `Apify: ${r.detalhe} — aproveitando os ${itensAcumulados.length} itens já coletados.`,
          );
          break;
        }
        throw new Error(
          r.reason === "pool_esgotado"
            ? `Todas as chaves Apify esgotadas — cadastre/reative uma em Configurações → Chaves e integrações. (${r.detalhe})`
            : `Apify start: ${r.detalhe}`,
        );
      }
      chave = r.chave;
      if (r.trocas > 0)
        log(`Apify: ${r.trocas} chave(s) esgotada(s)/inválida(s) puladas — o rodízio assumiu.`);
      startJson = await r.resp.json().catch(() => ({}));
    } else {
      const token = _apifyTokenCache ?? Deno.env.get("APIFY_API_TOKEN");
      if (!token) throw new Error("APIFY_API_TOKEN não configurada no secret da Edge Function.");
      chave = { id: null, apelido: "chave única", token };
      log(`Apify: iniciando run (Google Maps) — até ${maxPlaces} lugares...`);
      const startRes = await fetch(
        `${API}/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}`,
        init,
      );
      startJson = await startRes.json().catch(() => ({}));
      if (!startRes.ok)
        throw new Error(`Apify start: ${startJson?.error?.message ?? "HTTP " + startRes.status}`);
    }

    const runId = startJson.data?.id;
    const datasetId = startJson.data?.defaultDatasetId;
    if (!runId || !datasetId) throw new Error("Apify: resposta de start inesperada");

    // ── POLL (preso à chave que iniciou — runId pertence àquela conta) ──
    const deadline = Date.now() + 130_000;
    let status = startJson.data?.status ?? "RUNNING";
    let usd = 0;
    const TERMINAIS = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"];
    while (!TERMINAIS.includes(status)) {
      if (Date.now() > deadline) {
        log("Apify: tempo limite — pegando o que já coletou");
        break;
      }
      await sleep(4000);
      const st = await fetch(`${API}/actor-runs/${runId}?token=${encodeURIComponent(chave.token)}`);
      const sj = await st.json().catch(() => ({}));
      status = sj.data?.status ?? status;
      usd = sj.data?.usageTotalUsd ?? usd;
      log(`Apify: run ${status}${usd ? ` · custo ~US$ ${usd.toFixed(3)}` : ""}...`);
    }
    usdTotal += usd;

    // ── DATASET: colhe o que este run escreveu (inclusive se morreu no meio) ──
    const items = await baixarDataset(datasetId, chave.token, maxPlaces);
    itensAcumulados.push(...items);
    log(
      `Apify: ${items.length} lugares no dataset${usd ? ` · custo do run ~US$ ${usd.toFixed(3)}` : ""}`,
    );

    // ── RUN MORTO? O status não diz o motivo — o árbitro (limites) decide ──
    if (status === "ABORTED" || status === "FAILED") {
      if (_poolAdmin) {
        const veredito = await tratarRunMorto(_poolAdmin, chave, status, false);
        if (veredito === "trocar_chave") {
          log(
            `⚠️ Crédito da chave "${chave.apelido}" acabou NO MEIO da busca — parcial preservado (${itensAcumulados.length} itens), a próxima chave continua.`,
          );
          continue; // reinicia o run com a próxima chave; dedupe elimina repetidos
        }
        if (veredito === "parar_sem_pool") {
          if (itensAcumulados.length > 0) break; // entrega o parcial com honestidade
          throw new Error(
            "Crédito Apify esgotado (chave única) — cadastre chaves no pool em Configurações → Chaves e integrações.",
          );
        }
      }
      log(
        `Apify: run terminou ${status} (falha do ator, não de crédito) — seguindo com o coletado.`,
      );
    }
    break; // SUCCEEDED / timeout / falha real: não reinicia
  }

  const found: RawPlace[] = [];
  const nomesEnderecos = new Set<string>();
  for (const it of itensAcumulados) {
    const p = mapItem(it);
    if (!p) continue;
    if (seen.has(p.source_id)) continue;
    const chaveDedupe = (p.name + "|" + (p.address ?? "")).toLowerCase();
    if (nomesEnderecos.has(chaveDedupe)) continue;
    nomesEnderecos.add(chaveDedupe);
    seen.add(p.source_id);
    found.push(p);
  }
  if (usdTotal > 0) log(`Apify: custo total da busca ~US$ ${usdTotal.toFixed(3)}`);
  return found;
};
