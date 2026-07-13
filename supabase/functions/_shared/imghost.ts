// Curadoria + RE-HOSTING de imagens (edge). Baixa as fotos reais do Google,
// escolhe a MELHOR pro hero (clara + landscape + resolução), re-hospeda tudo no
// bucket público `site-assets` (nada de hotlink lh3.googleusercontent, que expira)
// e, se nenhuma foto real servir pro hero, usa um HERO CURADO por nicho (também
// no nosso Storage). REGRA: nunca hero escuro/amador; galeria só com fotos reais.
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { hashSemente } from "./site/variantes.ts";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

// Bancos EDITORIAIS escuros premium por CLIMA (hero-premium/<x>/N.jpg). Usados
// só no hero de clima escuro (profissional). Não são as fotos candidatas do lead.
const PREMIUM: Record<string, number> = { profissional: 4 };

const BUCKET = "site-assets";
// Quantos heroes curados existem por nicho (seed em site-assets/hero/<nicho>/N.jpg).
// Inclui nichos FINOS (advocacia) além dos template-ids — o hero é mais específico
// que o template (advocacia usa o template "profissional", mas hero de Direito).
const CURADOS: Record<string, number> = {
  saude: 3,
  advocacia: 3,
  "servico-local": 3,
  profissional: 3,
  generico: 2,
};

function publicUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** URL pública de um hero CURADO do nicho (fallback premium, já no Storage). */
export function heroCurado(baseUrl: string, nicho: string, idx = 0): string {
  const n = CURADOS[nicho] ? nicho : "generico";
  const total = CURADOS[n];
  const i = (idx % total) + 1;
  return publicUrl(baseUrl, `hero/${n}/${i}.jpg`);
}

/**
 * URL de uma imagem EDITORIAL escura premium do clima, escolhida pela SEMENTE
 * (determinística). Usada no hero de clima escuro (profissional) — nunca a foto
 * candida do lead. Retorna null se não houver banco premium p/ o clima.
 */
export function heroPremiumUrl(baseUrl: string, clima: string, seed: string): string | null {
  const total = PREMIUM[clima];
  if (!total) return null;
  const i = (hashSemente(seed + ":img") % total) + 1;
  return publicUrl(baseUrl, `hero-premium/${clima}/${i}.jpg`);
}

/** Reduz a URL para uma miniatura (análise rápida), preservando o aspecto. */
function sizedUrl(u: string, w: number): string {
  try {
    if (u.includes("googleusercontent.com") || u.includes("ggpht.com")) {
      if (/=[^/?]*$/.test(u)) return u.replace(/=[^/?]*$/, `=w${w}`);
      return `${u}=w${w}`;
    }
    const url = new URL(u);
    if (url.hostname.includes("unsplash.com")) {
      url.searchParams.set("w", String(w));
      url.searchParams.delete("h");
      url.searchParams.set("fit", "max");
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

async function baixar(u: string, ms = 9000): Promise<Uint8Array | null> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    const r = await fetch(u, { signal: c.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const b = new Uint8Array(await r.arrayBuffer());
    return b.length > 3000 ? b : null;
  } catch {
    return null;
  }
}

type Analise = { url: string; bytes: Uint8Array; w: number; h: number; brilho: number };

async function analisar(url: string, bytes: Uint8Array): Promise<Analise | null> {
  try {
    const img = await Image.decode(bytes);
    const w = img.width;
    const h = img.height;
    const bmp: Uint8Array = img.bitmap;
    let sum = 0;
    let n = 0;
    const step = Math.max(1, Math.floor(bmp.length / 4 / 1500)) * 4;
    for (let i = 0; i + 2 < bmp.length; i += step) {
      sum += 0.2126 * bmp[i] + 0.7152 * bmp[i + 1] + 0.0722 * bmp[i + 2];
      n++;
    }
    const brilho = n ? sum / n / 255 : 0;
    return { url, bytes, w, h, brilho };
  } catch {
    return null;
  }
}

export type FotosResolvidas = {
  hero: string;
  heroReal: boolean;
  sobre: string;
  cta: string;
  galeria: string[];
  debug: string;
};

/**
 * Baixa/analisa as fotos reais, escolhe o hero (real bom ou curado), re-hospeda
 * tudo no Storage e devolve URLs do NOSSO domínio.
 */
export async function resolverImagens(
  admin: DB,
  baseUrl: string,
  redesignId: string,
  nicho: string,
  candidatos: string[],
  log: (m: string) => void = () => {},
): Promise<FotosResolvidas> {
  const rehost = async (bytes: Uint8Array, nome: string): Promise<string> => {
    const path = `${redesignId}/${nome}.jpg`;
    await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    return publicUrl(baseUrl, path);
  };

  const urls = [...new Set(candidatos.filter((u) => /^https?:\/\//.test(u)))].slice(0, 8);
  // Análise em miniatura (rápida).
  const analisadas: Analise[] = [];
  await Promise.all(
    urls.map(async (u) => {
      const b = await baixar(sizedUrl(u, 260));
      if (!b) return;
      const a = await analisar(u, b);
      if (a) analisadas.push(a);
    }),
  );
  log(`imghost: ${analisadas.length}/${urls.length} fotos reais analisáveis`);

  // Hero: landscape + clara + resolução (usa dims da miniatura p/ aspecto).
  const heroCands = analisadas
    .filter((a) => a.w >= a.h * 1.15 && a.brilho >= 0.42)
    .sort((a, b) => b.brilho - a.brilho);
  const heroPick = heroCands[0] ?? null;

  // Galeria/sobre: fotos reais decentes (qualquer orientação; object-fit corta).
  const restantes = analisadas
    .filter((a) => a !== heroPick && a.brilho >= 0.32)
    .sort((a, b) => b.brilho - a.brilho);

  // Baixa em BOA resolução e re-hospeda as escolhidas.
  let hero: string;
  let heroReal = false;
  if (heroPick) {
    const full = (await baixar(sizedUrl(heroPick.url, 1600))) ?? heroPick.bytes;
    hero = await rehost(full, "hero");
    heroReal = true;
  } else {
    hero = heroCurado(baseUrl, nicho, 0);
  }

  // Galeria: só entra se houver >=3 fotos reais decentes. Nunca stock aqui.
  let galeria: string[] = [];
  const galPick = restantes.slice(0, 3);
  if (galPick.length >= 3) {
    galeria = await Promise.all(
      galPick.map(async (g, i) => {
        const full = (await baixar(sizedUrl(g.url, 1200))) ?? g.bytes;
        return rehost(full, `g${i + 1}`);
      }),
    );
  }

  // Sobre: uma foto real (fora as da galeria/hero); senão, curado do nicho.
  const usadas = new Set([heroPick, ...galPick].filter(Boolean));
  const sobrePick = restantes.find((a) => !usadas.has(a)) ?? (galPick.length ? galPick[0] : null);
  let sobre: string;
  if (sobrePick) {
    const full = (await baixar(sizedUrl(sobrePick.url, 1200))) ?? sobrePick.bytes;
    sobre = await rehost(full, "sobre");
  } else {
    sobre = heroCurado(baseUrl, nicho, 1);
  }

  // CTA final (atrás de gradiente forte): curado do nicho, sempre limpo.
  const cta = heroCurado(baseUrl, nicho, 2);

  const debug = `reais=${analisadas.length} heroReal=${heroReal} galeria=${galeria.length}`;
  log(`imghost: ${debug}`);
  return { hero, heroReal, sobre, cta, galeria, debug };
}
