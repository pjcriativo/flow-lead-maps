// Coleta a MATÉRIA-PRIMA do redesign: visita o site atual do lead e extrai
// textos, imagens (URLs absolutas), logo e cores predominantes. Só fetch.
import { extractInstagram, extractFacebook } from "./enrich.ts";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

export type ConteudoSite = {
  textos: string;
  imagens: string[];
  logo: string | null;
  cores: string[];
  instagram: string | null;
  facebook: string | null;
  /** Meta description / título do site atual (contexto extra p/ a IA). */
  descricao: string | null;
  /** false quando o site é ilegível (texto em imagem / JS pesado) — copy genérica. */
  legivel: boolean;
};

function extrairDescricao(html: string): string | null {
  const meta =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const d = (meta?.[1] ?? "").trim();
  const titulo = (t?.[1] ?? "").replace(/\s+/g, " ").trim();
  const junto = [titulo, d].filter(Boolean).join(" — ");
  return junto || null;
}

function absolutizar(src: string, base: string): string | null {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function extrairTextos(html: string): string {
  // pega texto de títulos/parágrafos/itens/botões (conteúdo com significado)
  const trechos: string[] = [];
  for (const m of html.matchAll(/<(h1|h2|h3|h4|p|li|a|button|span)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (t.length >= 3 && t.length <= 400) trechos.push(t);
    if (trechos.join(" ").length > 4500) break;
  }
  return [...new Set(trechos)].join("\n").slice(0, 4500);
}

function extrairImagens(html: string, base: string): { imagens: string[]; logo: string | null } {
  const imgs: string[] = [];
  let logo: string | null = null;

  // og:image (boa imagem principal)
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) {
    const u = absolutizar(og[1], base);
    if (u) imgs.push(u);
  }
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const srcM = tag.match(/\bsrc=["']([^"']+)["']/i) || tag.match(/\bdata-src=["']([^"']+)["']/i);
    if (!srcM) continue;
    const src = srcM[1];
    if (/^data:/i.test(src)) continue;
    if (/\.(svg|gif)(\?|$)/i.test(src) && !/logo/i.test(tag)) continue;
    const u = absolutizar(src, base);
    if (!u) continue;
    if (!logo && /logo/i.test(tag)) logo = u;
    if (!imgs.includes(u)) imgs.push(u);
    if (imgs.length >= 12) break;
  }
  if (!logo && imgs.length) logo = imgs[0];
  return { imagens: imgs.slice(0, 10), logo };
}

function extrairCores(html: string): string[] {
  const freq = new Map<string, number>();
  const tema = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
  if (tema) freq.set(tema[1].toLowerCase(), 100);
  for (const m of html.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const c = ("#" + m[1]).toLowerCase();
    if (c === "#ffffff" || c === "#000000") continue; // ignora branco/preto puros
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);
}

export async function coletarConteudoSite(url: string): Promise<ConteudoSite | null> {
  let base = url.trim();
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(base, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "pt-BR,pt;q=0.9" },
    });
    if (!res.ok) return null;
    const finalUrl = res.url || base;
    const html = (await res.text()).slice(0, 800_000);
    const { imagens, logo } = extrairImagens(html, finalUrl);
    const textos = extrairTextos(html);
    return {
      textos,
      imagens,
      logo,
      cores: extrairCores(html),
      instagram: extractInstagram(html),
      facebook: extractFacebook(html),
      descricao: extrairDescricao(html),
      // ilegível quando quase não há texto real (site em imagem/JS pesado).
      legivel: textos.replace(/\s+/g, "").length >= 180,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
