// Score "régua Kaptar" (0–100) — SEM depender de nota (OSM/Geoapify não têm).
// Filosofia: quanto PIOR a presença digital, mais QUENTE o lead (mais há para
// vender: site novo/redesign). Nota (quando a fonte tiver, ex. Places) é BÔNUS,
// nunca base. Guarda o motivo em score_breakdown para citar na proposta.
import type { SiteEval } from "./enrich.ts";

export type ScoreInput = {
  hasWebsite: boolean;
  site: SiteEval | null; // avaliação do site (enrich); null = não avaliado
  hasInstagram: boolean;
  hasFacebook: boolean;
  hasWhatsapp: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  rating: number | null; // BÔNUS quando existir
  reviewCount: number | null;
};

export type Tier = "quente" | "morno" | "frio";

export type ScoreBreakdown = {
  score: number;
  tier: Tier;
  is_gold: boolean;
  motivo: string;
  has_website: boolean;
  site_fora_do_ar: boolean;
  bad_site: boolean;
  bad_site_reasons: string[];
  has_instagram: boolean;
  has_facebook: boolean;
  has_whatsapp: boolean;
  has_email: boolean;
  rating_bonus: number;
  notes: string[]; // compat com a UI (lista de observações)
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function computeScore(input: ScoreInput): ScoreBreakdown {
  const hasSocial = input.hasInstagram || input.hasFacebook;
  const badSite = !!input.site?.bad;
  const badReasons = input.site?.reasons ?? [];
  const notes: string[] = [];

  let base: number;
  let motivo: string;

  // Site FORA DO AR / estacionado = sem site VÁLIDO (mesma régua de "sem site").
  const siteMorto = input.hasWebsite && !!input.site && input.site.reachable === false;
  const semSiteValido = !input.hasWebsite || siteMorto;

  if (semSiteValido) {
    if (!hasSocial) {
      base = 84;
      motivo = siteMorto
        ? "Site cadastrado está FORA DO AR (sem presença digital funcional) — oportunidade de fazer um site novo."
        : "Sem site e sem redes sociais — presença digital zero; máxima oportunidade de vender um site.";
    } else {
      base = 75;
      motivo = siteMorto
        ? "Site fora do ar; só tem redes sociais — oportunidade de vender um site próprio."
        : "Tem redes sociais mas não tem site — oportunidade de vender um site próprio.";
    }
    // Contactabilidade: lead que dá pra abordar vale mais.
    if (input.hasWhatsapp) {
      base += 9;
      notes.push("WhatsApp disponível — canal direto de abordagem");
    } else if (input.hasPhone) {
      base += 4;
      notes.push("Telefone disponível para abordagem");
    } else {
      notes.push("Sem contato direto — buscar e-mail/Instagram");
    }
  } else if (badSite) {
    base = 80;
    motivo = "Site fraco/datado: " + badReasons.join("; ");
    if (input.hasWhatsapp) {
      base += 8;
      notes.push("WhatsApp disponível — canal direto de abordagem");
    }
    if (!input.hasEmail && input.hasWhatsapp) {
      base += 5;
      notes.push("WhatsApp como principal canal (sem e-mail)");
    }
  } else if (input.site && input.site.bad === false) {
    base = 25;
    motivo = "Site moderno e bem estruturado — lead frio (pouco a melhorar).";
    if (!input.hasWhatsapp && !input.hasEmail) base = 15;
    base = clamp(base, 10, 40);
  } else {
    // tem site mas não foi avaliado (busca de e-mails desligada)
    base = 50;
    motivo = "Tem site, mas não foi avaliado — ative a busca de e-mails para qualificar.";
  }

  // BÔNUS de reputação — régua completa quando a fonte traz NOTA (Apify/Places).
  // Nunca é base: soma à régua de presença digital (negócio que fatura bem +
  // site fraco = cliente-ouro).
  let ratingBonus = 0;
  if (input.rating != null) {
    const rc = input.reviewCount ?? 0;
    if (input.rating >= 4.7 && rc >= 40)
      ratingBonus = 12; // reputação "ouro"
    else if (input.rating >= 4.5 && rc >= 20) ratingBonus = 6;
    else if (input.rating >= 4.0) ratingBonus = 2;
    if (ratingBonus)
      notes.push(`Bônus de reputação: nota ${input.rating}${rc ? ` (${rc} avaliações)` : ""}`);
  }

  const score = clamp(base + ratingBonus, 0, 100);
  const tier: Tier = score >= 75 ? "quente" : score >= 45 ? "morno" : "frio";

  return {
    score,
    tier,
    is_gold: score >= 80,
    motivo,
    has_website: input.hasWebsite && !siteMorto,
    site_fora_do_ar: siteMorto,
    bad_site: badSite,
    bad_site_reasons: badReasons,
    has_instagram: input.hasInstagram,
    has_facebook: input.hasFacebook,
    has_whatsapp: input.hasWhatsapp,
    has_email: input.hasEmail,
    rating_bonus: ratingBonus,
    notes: [motivo, ...notes],
  };
}
