// Enriquecimento SÓ com fetch (sem browser/Selenium):
// visita o site do lead e extrai e-mail, WhatsApp e avalia se o site é "ruim".
import { toBrWhatsapp, firstBrWhatsapp, whatsappFromLink } from "./phone.ts";

export type SiteEval = {
  reachable: boolean;
  bad: boolean;
  reasons: string[];
};

export type Enrichment = {
  site: SiteEval;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  /** Diagnóstico: como foi a visita (para log). */
  debug: string;
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Domínios/lixo que NÃO são e-mail de contato do negócio.
const EMAIL_JUNK = [
  "example.com", "example.org", "exemplo.com", "sentry.io", "sentry-next.wixpress.com",
  "wixpress.com", "wix.com", "godaddy.com", "domain.com", "dominio.com", "email.com",
  "yourdomain", "seudominio", "sradmin", "no-reply", "noreply", "@2x", ".png", ".jpg",
  ".jpeg", ".gif", ".svg", ".webp", ".css", ".js",
];

// E-mails PLACEHOLDER de template (não são de negócio real).
const EMAIL_PLACEHOLDER = /^(your|you|youremail|email|e-?mail|name|nome|seu|sua|seuemail|user|username|teste|test|abc|xyz|info@info|mail@mail|admin@admin)@|@(example|exemplo|domain|dominio|yourdomain|seudominio|test|teste|email|mail|placeholder)\./i;

function emailValido(e: string): boolean {
  if (e.length > 80) return false;
  if (EMAIL_JUNK.some((j) => e.includes(j))) return false;
  if (EMAIL_PLACEHOLDER.test(e)) return false;
  return true;
}

// Marcadores de domínio estacionado / à venda / em construção (site NÃO válido).
const PARKED_RE =
  /domain (is )?(for sale|parked)|buy this domain|this domain (is|may be) for sale|hugedomains|sedoparking|bodis\.com|domain parking|parkingcrew|dom[ií]nio (à venda|estacionado|em constru[çc][aã]o)|site em constru[çc][aã]o|em constru[çc][aã]o|under construction|coming soon|em breve|account suspended|default web page|apache2 (ubuntu|debian) default/i;

// Plataformas de site grátis / construtor (sinal de site fraco).
const BUILDER_HOSTS = [
  "wixsite.com", "wix.com", "sites.google.com", "blogspot.com",
  "wordpress.com", "webnode.", "weebly.com", "godaddysites.com",
  "negocio.site", "business.site", "linktr.ee", "fb.com", "facebook.com",
  "instagram.com",
];

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&#x40;/gi, "@")
    .replace(/\s*\[at\]\s*|\s*\(at\)\s*/gi, "@")
    .replace(/\s*\[dot\]\s*|\s*\(dot\)\s*/gi, ".");
}

export function extractEmail(html: string): string | null {
  const text = decodeEntities(html);
  const found = new Set<string>();

  // 1) links mailto:
  for (const m of text.matchAll(/mailto:([^"'?>\s]+)/gi)) {
    found.add(m[1].trim().toLowerCase());
  }
  // 2) regex geral no texto
  for (const m of text.matchAll(EMAIL_RE)) {
    found.add(m[0].trim().toLowerCase());
  }

  const clean = [...found].filter(emailValido);
  if (clean.length === 0) return null;
  // preferir e-mails "de contato"
  clean.sort((a, b) => {
    const score = (e: string) =>
      /(contato|comercial|atendimento|faleconosco|vendas|financeiro)/.test(e)
        ? 0
        : 1;
    return score(a) - score(b);
  });
  return clean[0];
}

export function extractWhatsapp(html: string): string | null {
  // links de whatsapp explícitos
  for (const m of html.matchAll(/https?:\/\/[^"'\s]*(?:wa\.me|api\.whatsapp\.com|whatsapp\.com)\/[^"'\s]*/gi)) {
    const w = whatsappFromLink(m[0]);
    if (w) return w;
  }
  // tel: com celular BR
  for (const m of html.matchAll(/tel:(\+?[\d\s().-]{8,})/gi)) {
    const w = toBrWhatsapp(m[1]);
    if (w) return w;
  }
  return null;
}

// Palavras que não são perfil (paths do próprio Instagram).
const IG_NAO_PERFIL = new Set(["p", "reel", "reels", "explore", "accounts", "sharer", "stories", "tv", "about", "developer", "legal"]);

export function extractInstagram(html: string): string | null {
  for (const m of html.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/gi)) {
    const handle = m[1]?.replace(/\/$/, "");
    if (!handle || IG_NAO_PERFIL.has(handle.toLowerCase())) continue;
    return `https://instagram.com/${handle}`;
  }
  return null;
}

const FB_NAO_PERFIL = new Set(["sharer", "sharer.php", "plugins", "tr", "dialog", "events", "groups", "profile.php"]);

export function extractFacebook(html: string): string | null {
  for (const m of html.matchAll(/https?:\/\/(?:www\.|m\.|pt-br\.|business\.)?facebook\.com\/([A-Za-z0-9_.-]+)/gi)) {
    const handle = m[1]?.replace(/\/$/, "");
    if (!handle || FB_NAO_PERFIL.has(handle.toLowerCase())) continue;
    return `https://facebook.com/${handle}`;
  }
  return null;
}

/**
 * Avalia se o site é "ruim" pelos critérios do plugin (2+ problemas = ruim).
 * Guarda o motivo específico (usado depois na proposta).
 */
export function evaluateSite(html: string, finalUrl: string): SiteEval {
  const reasons: string[] = [];
  const lower = html.toLowerCase();
  const host = (() => {
    try { return new URL(finalUrl).host.toLowerCase(); } catch { return ""; }
  })();
  // primeira dobra ~ primeiros 4000 chars do body
  const firstFold = lower.slice(0, 4000);

  // 1) Domínio grátis / construtor
  if (BUILDER_HOSTS.some((h) => host.includes(h))) {
    reasons.push(`domínio em plataforma grátis/construtor (${host})`);
  }

  // 2) Não responsivo (sem meta viewport)
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) {
    reasons.push("não responsivo (sem meta viewport para mobile)");
  }

  // 3) Sem CTA de contato/WhatsApp na primeira dobra
  const hasCta =
    /wa\.me|api\.whatsapp|whatsapp|tel:|agende|agendar|fale conosco|contato|orçamento|orcamento/.test(
      firstFold,
    );
  if (!hasCta) {
    reasons.push("sem CTA de contato/WhatsApp na primeira dobra");
  }

  // 4) Sem prova social (nenhum depoimento/avaliação no conteúdo)
  const hasSocialProof =
    /depoimento|depoimentos|avalia|review|testemunho|cliente[s]? satisfeit|5 estrelas|nota \d/.test(
      lower,
    );
  if (!hasSocialProof) {
    reasons.push("sem prova social (depoimentos/avaliações)");
  }

  // 5) Layout datado (marcadores de HTML antigo)
  if (/<font|<marquee|<center|cellpadding=|<frameset/i.test(html)) {
    reasons.push("layout datado (HTML antigo: font/table/marquee)");
  }

  return { reachable: true, bad: reasons.length >= 2, reasons };
}

// UA de navegador real (o "FlowLeadsBot" era bloqueado por muitos sites).
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 8000;
// Muito e-mail brasileiro fica na página de contato, não na home.
const PAGINAS_CONTATO = ["/contato", "/fale-conosco", "/contact"];

type Fetched = { ok: boolean; status: number; finalUrl: string; html: string };

async function fetchHtml(url: string): Promise<Fetched> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    const finalUrl = res.url || url;
    if (!res.ok) return { ok: false, status: res.status, finalUrl, html: "" };
    const raw = await res.text();
    // BUG corrigido: truncar só o início cortava o RODAPÉ (onde ficam e-mail/IG).
    // Em páginas grandes, mantém cabeçalho + rodapé.
    const html = raw.length > 1_500_000
      ? raw.slice(0, 900_000) + "\n<!--…-->\n" + raw.slice(-600_000)
      : raw;
    return { ok: true, status: res.status, finalUrl, html };
  } catch (_e) {
    return { ok: false, status: 0, finalUrl: url, html: "" };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Visita o site (home + páginas de contato) e extrai e-mail, WhatsApp,
 * Instagram e Facebook. Só fetch, best-effort, com timeout curto por página.
 */
export async function enrichFromWebsite(
  website: string,
  fallbackPhone?: string | null,
): Promise<Enrichment> {
  let base = website.trim();
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  let origin = base;
  try { origin = new URL(base).origin; } catch { /* mantém base */ }

  const home = await fetchHtml(base);
  if (!home.ok) {
    return {
      site: { reachable: false, bad: false, reasons: [`site fora do ar (HTTP ${home.status || "timeout/DNS"})`] },
      email: null,
      whatsapp: firstBrWhatsapp(fallbackPhone),
      instagram: null,
      facebook: null,
      debug: `home HTTP ${home.status || "erro"}`,
    };
  }

  // Domínio estacionado / à venda / em construção = site NÃO válido.
  const semTexto = home.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length < 200;
  if (PARKED_RE.test(home.html.slice(0, 8000)) || semTexto) {
    return {
      site: { reachable: false, bad: false, reasons: ["domínio estacionado/à venda ou em construção (sem site funcional)"] },
      email: null,
      whatsapp: firstBrWhatsapp(fallbackPhone),
      instagram: null,
      facebook: null,
      debug: semTexto ? "página vazia" : "parked",
    };
  }

  const site = evaluateSite(home.html, home.finalUrl);
  let email = extractEmail(home.html);
  let whatsapp = extractWhatsapp(home.html);
  let instagram = extractInstagram(home.html);
  let facebook = extractFacebook(home.html);
  const paginas: string[] = ["home"];

  // Se faltou e-mail (ou IG), tenta páginas de contato.
  if (!email || !instagram) {
    for (const path of PAGINAS_CONTATO) {
      if (email && instagram) break;
      const page = await fetchHtml(origin + path);
      if (!page.ok) continue;
      paginas.push(path);
      if (!email) email = extractEmail(page.html);
      if (!instagram) instagram = extractInstagram(page.html);
      if (!whatsapp) whatsapp = extractWhatsapp(page.html);
      if (!facebook) facebook = extractFacebook(page.html);
    }
  }

  return {
    site,
    email,
    whatsapp: whatsapp ?? firstBrWhatsapp(fallbackPhone),
    instagram,
    facebook,
    debug: `visitou ${paginas.join("+")} · email=${email ? "sim" : "não"} ig=${instagram ? "sim" : "não"}`,
  };
}
