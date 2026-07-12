// Provedor OpenStreetMap (Overpass API) — grátis, SEM chave.
// Uso justo: User-Agent identificando o app + throttle entre chamadas.
// Só devolve o que existe nas tags do OSM — o que não vier fica null.
import type { ProviderSearch, RawPlace } from "./types.ts";

// Espelhos da Overpass — se um cair (429/504), tenta o próximo.
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const USER_AGENT = "FlowLeads/1.0 (prospeccao; contato@flowleads.com.br)";
const THROTTLE_MS = 1200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Seletores Overpass por nicho (pt-BR). Cada item vira uma sub-query. */
const NICHO_TAGS: Array<{ re: RegExp; selectors: string[] }> = [
  { re: /odontol|dentist/i, selectors: ['["amenity"="dentist"]', '["healthcare"="dentist"]'] },
  { re: /cl[ií]nica|m[eé]dic|sa[uú]de/i, selectors: ['["amenity"="clinic"]', '["healthcare"="clinic"]', '["amenity"="doctors"]'] },
  { re: /est[eé]tica/i, selectors: ['["shop"="beauty"]', '["beauty"]'] },
  { re: /restaurante/i, selectors: ['["amenity"="restaurant"]'] },
  { re: /lanchonete|hamburgue/i, selectors: ['["amenity"="fast_food"]'] },
  { re: /academia|fitness|crossfit/i, selectors: ['["leisure"="fitness_centre"]'] },
  { re: /sal[aã]o de beleza|cabeleireir/i, selectors: ['["shop"="hairdresser"]', '["shop"="beauty"]'] },
  { re: /barbearia|barbeiro/i, selectors: ['["shop"="hairdresser"]'] },
  { re: /advocacia|advogad|jur[ií]dic/i, selectors: ['["office"="lawyer"]'] },
  { re: /contab|contador/i, selectors: ['["office"="accountant"]'] },
  { re: /imobili[aá]ria|corretor de im[oó]veis/i, selectors: ['["office"="estate_agent"]'] },
  { re: /pet ?shop|veterin[aá]ri/i, selectors: ['["shop"="pet"]', '["amenity"="veterinary"]'] },
  { re: /oficina|mec[aâ]nica/i, selectors: ['["shop"="car_repair"]'] },
  { re: /fot[oó]graf/i, selectors: ['["craft"="photographer"]', '["shop"="photo"]'] },
  { re: /marketing|publicidade/i, selectors: ['["office"="advertising_agency"]', '["office"="marketing"]'] },
  { re: /farm[aá]cia/i, selectors: ['["amenity"="pharmacy"]'] },
  { re: /padaria|confeitaria/i, selectors: ['["shop"="bakery"]'] },
  { re: /escola|curso/i, selectors: ['["amenity"="school"]', '["amenity"="language_school"]'] },
  { re: /hotel|pousada/i, selectors: ['["tourism"="hotel"]', '["tourism"="guest_house"]'] },
  { re: /seguro/i, selectors: ['["office"="insurance"]'] },
];

/** Resolve os seletores do nicho; fallback = busca por nome (regex no name). */
function selectorsFor(nicho: string): string[] {
  const hit = NICHO_TAGS.find((n) => n.re.test(nicho));
  if (hit) return hit.selectors;
  // fallback: POIs com nome contendo o termo principal do nicho
  const termo = nicho.trim().split(/\s+/)[0].replace(/[^\p{L}\p{N}]/gu, "");
  return [`["name"~"${termo}",i]`];
}

function tag(tags: Record<string, string>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = tags[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string | null {
  const rua = tag(tags, "addr:street");
  const num = tag(tags, "addr:housenumber");
  const bairro = tag(tags, "addr:suburb", "addr:neighbourhood");
  const partes = [rua && num ? `${rua}, ${num}` : rua, bairro].filter(Boolean);
  return partes.length ? partes.join(" — ") : null;
}

async function overpass(query: string): Promise<any> {
  let lastErr = "";
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: "data=" + encodeURIComponent(query),
      });
      if (res.ok) return res.json();
      lastErr = `HTTP ${res.status}`;
      // 429/504/502 são transientes → tenta o próximo espelho
      if (![429, 502, 503, 504].includes(res.status)) break;
      await sleep(THROTTLE_MS);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Overpass indisponível (${lastErr})`);
}

export const searchOsm: ProviderSearch = async ({ nicho, cidade, uf, lat, lng, raioKm, alvo, seen, log }) => {
  const selectors = selectorsFor(nicho);
  const found: RawPlace[] = [];
  const nomesEnderecos = new Set<string>(); // dedupe extra por nome+endereço

  // Modo mapa (around: raio + centro) tem prioridade sobre a área da cidade.
  const porMapa = lat != null && lng != null;
  const areaPrefixo = porMapa
    ? ""
    : `area["name"="${cidade}"]["boundary"="administrative"]["admin_level"~"7|8"]->.cidade;`;
  const espacial = porMapa
    ? `(around:${Math.round((raioKm ?? 10) * 1000)},${lat},${lng})`
    : `(area.cidade)`;
  const onde = porMapa ? `raio ${raioKm ?? 10}km` : `${cidade}${uf ? "/" + uf : ""}`;

  for (const sel of selectors) {
    if (found.length >= alvo) break;
    log(`OSM/Overpass: buscando ${sel} em ${onde}`);
    const q = `
[out:json][timeout:30];
${areaPrefixo}
nwr${sel}${espacial};
out center tags ${Math.min(alvo * 3, 200)};`;
    try {
      const data = await overpass(q);
      for (const el of data.elements ?? []) {
        const tags: Record<string, string> = el.tags ?? {};
        const name = tag(tags, "name");
        if (!name) continue; // sem nome não é lead
        const source_id = `osm:${el.type}/${el.id}`;
        if (seen.has(source_id)) continue;
        const chave = (name + "|" + (buildAddress(tags) ?? "")).toLowerCase();
        if (nomesEnderecos.has(chave)) continue;
        nomesEnderecos.add(chave);
        seen.add(source_id);
        found.push({
          source: "osm",
          source_id,
          name,
          category: tag(tags, "amenity", "shop", "office", "healthcare", "craft", "leisure", "tourism") ?? null,
          address: buildAddress(tags),
          phone: tag(tags, "contact:phone", "phone"),
          website: tag(tags, "contact:website", "website"),
          rating: null, // OSM não tem nota — não inventar
          review_count: null, // idem
          instagram: tag(tags, "contact:instagram"),
          facebook: tag(tags, "contact:facebook"),
          lat: el.lat ?? el.center?.lat ?? null,
          lng: el.lon ?? el.center?.lon ?? null,
        });
        if (found.length >= alvo) break;
      }
    } catch (e) {
      log(`OSM: ${e instanceof Error ? e.message : String(e)}`);
    }
    await sleep(THROTTLE_MS); // uso justo da Overpass
  }
  log(`OSM: ${found.length} lugares únicos coletados`);
  return found;
};
