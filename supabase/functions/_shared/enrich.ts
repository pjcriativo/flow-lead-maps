// Enriquecimento SÓ com fetch (sem browser/Selenium):
// visita o site do lead e extrai e-mail, WhatsApp e avalia se o site é "ruim".
import { toBrWhatsapp, whatsappFromLink } from "./phone.ts";

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
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Domínios/lixo que NÃO são e-mail de contato do negócio.
const EMAIL_JUNK = [
  "example.com", "sentry.io", "sentry-next.wixpress.com", "wixpress.com",
  "wix.com", "godaddy.com", "domain.com", "email.com", "yourdomain",
  "sradmin", "no-reply", "noreply", "@2x", ".png", ".jpg", ".jpeg",
  ".gif", ".svg", ".webp", ".css", ".js",
];

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

  const clean = [...found].filter((e) => {
    if (e.length > 80) return false;
    return !EMAIL_JUNK.some((j) => e.includes(j));
  });
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

/** Baixa o site (best-effort, com timeout) e enriquece. */
export async function enrichFromWebsite(
  website: string,
  fallbackPhone?: string | null,
): Promise<Enrichment> {
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FlowLeadsBot/1.0; +https://flowleads.com.br)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    const finalUrl = res.url || url;
    if (!res.ok) {
      return {
        site: { reachable: false, bad: false, reasons: ["site fora do ar (HTTP " + res.status + ")"] },
        email: null,
        whatsapp: toBrWhatsapp(fallbackPhone),
        instagram: null,
      };
    }
    const html = (await res.text()).slice(0, 400_000);
    return {
      site: evaluateSite(html, finalUrl),
      email: extractEmail(html),
      whatsapp: extractWhatsapp(html) ?? toBrWhatsapp(fallbackPhone),
      instagram: extractInstagram(html),
    };
  } catch (_e) {
    return {
      site: { reachable: false, bad: false, reasons: ["site inacessível (timeout/erro de rede)"] },
      email: null,
      whatsapp: toBrWhatsapp(fallbackPhone),
      instagram: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
