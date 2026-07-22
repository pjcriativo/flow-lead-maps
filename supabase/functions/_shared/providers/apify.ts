// Provedor Apify — Google Maps Scraper (Actor compass/crawler-google-places).
// Fonte RICA: telefone, WhatsApp (do celular), site, NOTA + nº de avaliações,
// endereço completo, lat/lng, e-mail/IG quando existir. PAGA (cobra por run).
// Token em secret APIFY_API_TOKEN (Deno.env), NUNCA no front.
import type { ProviderSearch, RawPlace } from "./types.ts";

const ACTOR = "compass~crawler-google-places"; // slug com ~ no path da API
const API = "https://api.apify.com/v2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const token = Deno.env.get("APIFY_API_TOKEN");
  if (!token) throw new Error("APIFY_API_TOKEN não configurada no secret da Edge Function.");

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

  log(`Apify: iniciando run (Google Maps) — até ${maxPlaces} lugares...`);
  const startRes = await fetch(`${API}/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const startJson = await startRes.json().catch(() => ({}));
  if (!startRes.ok) {
    throw new Error(`Apify start: ${startJson?.error?.message ?? "HTTP " + startRes.status}`);
  }
  const runId = startJson.data?.id;
  const datasetId = startJson.data?.defaultDatasetId;
  if (!runId || !datasetId) throw new Error("Apify: resposta de start inesperada");

  // Poll do status (cap dentro do limite de wall-clock do Edge).
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
    const st = await fetch(`${API}/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
    const sj = await st.json().catch(() => ({}));
    status = sj.data?.status ?? status;
    usd = sj.data?.usageTotalUsd ?? usd;
    log(`Apify: run ${status}${usd ? ` · custo ~US$ ${usd.toFixed(3)}` : ""}...`);
  }

  // Resultados do dataset (mesmo em timeout, o que já foi escrito vem).
  const dsRes = await fetch(
    `${API}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&limit=${maxPlaces}`,
  );
  const items: ApifyItem[] = await dsRes.json().catch(() => []);
  log(
    `Apify: ${items.length} lugares no dataset${usd ? ` · custo do run ~US$ ${usd.toFixed(3)}` : ""}`,
  );

  const found: RawPlace[] = [];
  const nomesEnderecos = new Set<string>();
  for (const it of items) {
    const p = mapItem(it);
    if (!p) continue;
    if (seen.has(p.source_id)) continue;
    const chave = (p.name + "|" + (p.address ?? "")).toLowerCase();
    if (nomesEnderecos.has(chave)) continue;
    nomesEnderecos.add(chave);
    seen.add(p.source_id);
    found.push(p);
  }
  return found;
};
