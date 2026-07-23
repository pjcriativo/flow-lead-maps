// Puxa DEPOIMENTOS REAIS + fotos reais de um place do Google via Apify (actor
// compass~crawler-google-places, por placeIds). Roda SÓ no redesign (não na busca,
// que fica com maxReviews=0). Custo é retornado p/ log.
//
// 🔑 POOL DE CHAVES (Etapa 3): o START passa pelo rodízio (startRunComPool) quando o caller
// setou o contexto (setReviewsPoolContext). Run morto no meio por crédito → a próxima chave
// REFAZ a coleta (barata, 1 place) — reviews não têm parcial que valha preservar. Devolve
// chaveApelido pro livro-caixa (redes_buscas.chave_apelido do registro ia_site).
import { startRunComPool, tratarRunMorto, type ChaveApify } from "./apify-pool.ts";

const ACTOR = "compass~crawler-google-places";
const API = "https://api.apify.com/v2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_RUNS = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// 🔑 Contexto do pool (admin client p/ marcar/avisar/rodiziar). Sem ele → chave única.
let _poolAdmin: Admin | null = null;
export function setReviewsPoolContext(admin: Admin | null): void {
  _poolAdmin = admin;
}

// Compat: caminho antigo de chave única.
let _apifyTokenCache: string | null = null;
export function setReviewsApifyTokenOverride(v: string | null): void {
  _apifyTokenCache = v;
}

export type ReviewReal = {
  author: string | null;
  photo: string | null;
  rating: number | null;
  text: string;
  when: string | null;
  url: string | null;
};

export type ColetaReviews = {
  reviews: ReviewReal[];
  imagens: string[];
  custoUsd: number;
  debug: string;
  /** apelido da chave do pool que pagou a coleta (null = chave única/sem coleta) */
  chaveApelido: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(r: any): ReviewReal | null {
  const text = String(r?.text ?? r?.reviewText ?? r?.review ?? "").trim();
  const author = r?.name ?? r?.reviewerName ?? r?.author ?? null;
  const rating =
    typeof r?.stars === "number" ? r.stars : typeof r?.rating === "number" ? r.rating : null;
  if (!text && !author) return null;
  return {
    author: author ? String(author).trim() : null,
    photo: r?.reviewerPhotoUrl ?? r?.reviewerPhoto ?? null,
    rating,
    text,
    when: r?.publishAt ?? r?.publishedAtDate ?? r?.date ?? null,
    url: r?.reviewUrl ?? r?.url ?? null,
  };
}

/** Extrai o placeId cru (ChIJ...) do lead.place_id ("apify:ChIJ..."). */
export function placeIdCru(placeId: string | null): string | null {
  if (!placeId) return null;
  const m = placeId.match(/(ChIJ[\w-]+)/);
  if (m) return m[1];
  const semPrefixo = placeId.replace(/^[a-z]+:/i, "").trim();
  return semPrefixo || null;
}

export async function coletarReviews(
  placeIdRaw: string | null,
  opts: { maxReviews?: number; maxImages?: number; log?: (m: string) => void } = {},
): Promise<ColetaReviews> {
  const vazio: ColetaReviews = {
    reviews: [],
    imagens: [],
    custoUsd: 0,
    debug: "",
    chaveApelido: null,
  };
  const placeId = placeIdCru(placeIdRaw);
  const log = opts.log ?? (() => {});
  if (!placeId) return { ...vazio, debug: "sem placeId" };

  const maxReviews = opts.maxReviews ?? 8;
  const maxImages = opts.maxImages ?? 6;

  const input = {
    placeIds: [placeId],
    language: "pt-BR",
    maxReviews,
    reviewsSort: "newest",
    maxImages,
    maxQuestions: 0,
    scrapeContacts: false,
    scrapeReviewsPersonalData: true,
    scrapeImageAuthors: false,
  };
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  };

  try {
    for (let rodada = 1; rodada <= MAX_RUNS; rodada++) {
      // ── START (com rodízio quando há contexto) ──
      let chave: ChaveApify;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sj: any;
      if (_poolAdmin) {
        log(
          rodada === 1
            ? `Apify reviews: iniciando (place ${placeId}, até ${maxReviews} reviews)...`
            : `Apify reviews: refazendo com a próxima chave do pool (rodada ${rodada})...`,
        );
        const r = await startRunComPool(
          _poolAdmin,
          (t) => `${API}/acts/${ACTOR}/runs?token=${encodeURIComponent(t)}`,
          init,
        );
        if (!r.ok) return { ...vazio, debug: `start: ${r.reason} — ${r.detalhe}` };
        chave = r.chave;
        sj = await r.resp.json().catch(() => ({}));
      } else {
        const token = _apifyTokenCache ?? Deno.env.get("APIFY_API_TOKEN");
        if (!token) return { ...vazio, debug: "sem APIFY_API_TOKEN" };
        chave = { id: null, apelido: "chave única", token };
        log(`Apify reviews: iniciando (place ${placeId}, até ${maxReviews} reviews)...`);
        const startRes = await fetch(
          `${API}/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}`,
          init,
        );
        sj = await startRes.json().catch(() => ({}));
        if (!startRes.ok)
          return { ...vazio, debug: `start ${startRes.status}: ${sj?.error?.message ?? ""}` };
      }
      const runId = sj.data?.id;
      const datasetId = sj.data?.defaultDatasetId;
      if (!runId || !datasetId) return { ...vazio, debug: "start sem runId" };

      // ── POLL (preso à chave que iniciou) ──
      const deadline = Date.now() + 150_000;
      let status = sj.data?.status ?? "RUNNING";
      let usd = 0;
      const TERM = ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"];
      while (!TERM.includes(status)) {
        if (Date.now() > deadline) {
          log("Apify reviews: timeout — pego o que houver");
          break;
        }
        await sleep(4000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const st: any = await (
          await fetch(`${API}/actor-runs/${runId}?token=${encodeURIComponent(chave.token)}`)
        )
          .json()
          .catch(() => ({}));
        status = st.data?.status ?? status;
        usd = st.data?.usageTotalUsd ?? usd;
        log(`Apify reviews: ${status}${usd ? ` · ~US$ ${usd.toFixed(4)}` : ""}`);
      }

      // ── RUN MORTO? árbitro de limites decide se troca a chave e refaz ──
      if ((status === "ABORTED" || status === "FAILED") && _poolAdmin) {
        const veredito = await tratarRunMorto(_poolAdmin, chave, status, false);
        if (veredito === "trocar_chave") {
          log(`⚠️ Chave "${chave.apelido}" esgotou no meio — a próxima refaz a coleta.`);
          continue;
        }
        if (veredito === "parar_sem_pool")
          return { ...vazio, custoUsd: usd, debug: "crédito esgotado (chave única)" };
      }

      // ── DATASET ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = await (
        await fetch(
          `${API}/datasets/${datasetId}/items?token=${encodeURIComponent(chave.token)}&clean=true`,
        )
      )
        .json()
        .catch(() => []);
      const it = items[0] ?? {};
      const reviews = (it.reviews ?? [])
        .map(mapReview)
        .filter((r: ReviewReal | null): r is ReviewReal => !!r && r.text.length >= 15)
        .slice(0, maxReviews);
      const imagens: string[] = (it.imageUrls ?? it.images ?? [])
        .map((x: unknown) => {
          if (typeof x === "string") return x;
          const o = (x ?? {}) as { imageUrl?: string; url?: string };
          return o.imageUrl ?? o.url;
        })
        .filter((u: unknown): u is string => typeof u === "string" && /^https?:\/\//.test(u))
        .slice(0, maxImages);

      log(
        `Apify reviews: ${reviews.length} depoimentos, ${imagens.length} fotos · ~US$ ${usd.toFixed(4)}`,
      );
      return {
        reviews,
        imagens,
        custoUsd: usd,
        debug: `ok: ${reviews.length} reviews`,
        chaveApelido: chave.id ? chave.apelido : null,
      };
    }
    return { ...vazio, debug: "esgotou as tentativas de run" };
  } catch (e) {
    return { ...vazio, debug: `erro: ${e instanceof Error ? e.message : String(e)}` };
  }
}
