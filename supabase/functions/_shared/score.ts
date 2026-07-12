// Score "cliente-ouro" (0–100), adaptado da heurística do plugin.
// Cliente-ouro = fatura bem (nota alta + muitas avaliações) MAS tem site fraco,
// tem site ativo (pré-req do redesign) e e-mail público (pré-req da proposta).
import type { SiteEval } from "./enrich.ts";

export type ScoreInput = {
  rating: number | null;
  reviewCount: number | null;
  hasWebsite: boolean;
  site: SiteEval | null; // resultado do enrich; null = não avaliado
  hasEmail: boolean;
  /** Rede social encontrada (instagram/facebook) — sinal de negócio ativo. */
  hasSocial?: boolean;
};

export type ScoreBreakdown = {
  score: number;
  is_gold: boolean;
  rating_points: number;
  reviews_points: number;
  website_points: number;
  bad_site_points: number;
  email_points: number;
  social_points: number;
  bad_site: boolean;
  bad_site_reasons: string[];
  notes: string[];
};

export function computeScore(input: ScoreInput): ScoreBreakdown {
  const rating = input.rating ?? 0;
  const reviews = input.reviewCount ?? 0;
  const notes: string[] = [];

  // Potencial financeiro
  let ratingPoints = 0;
  if (rating >= 4.7) ratingPoints = 25;
  else if (rating >= 4.5) ratingPoints = 12;
  else if (rating >= 4.0) ratingPoints = 5;

  let reviewsPoints = 0;
  if (reviews >= 40) reviewsPoints = 20;
  else if (reviews >= 20) reviewsPoints = 8;
  else if (reviews >= 10) reviewsPoints = 3;

  // Pré-requisito do redesign: ter site ativo
  const websitePoints = input.hasWebsite ? 10 : 0;
  if (!input.hasWebsite) notes.push("sem site — fora do alvo de redesign");

  // Site ruim (a joia): 2+ problemas
  const badSite = !!input.site?.bad;
  const badSitePoints = badSite ? 25 : 0;
  const badSiteReasons = input.site?.reasons ?? [];

  // Pré-requisito da proposta: e-mail público
  const emailPoints = input.hasEmail ? 20 : 0;
  if (!input.hasEmail) notes.push("sem e-mail público — não fecha o ciclo da proposta");

  // Rede social (fontes sem nota, ex. OSM/Foursquare): negócio ativo online
  const socialPoints = input.hasSocial ? 5 : 0;

  const score = Math.min(
    100,
    ratingPoints + reviewsPoints + websitePoints + badSitePoints + emailPoints + socialPoints,
  );

  const isGold =
    rating >= 4.7 &&
    reviews >= 40 &&
    input.hasWebsite &&
    badSite &&
    input.hasEmail;

  return {
    score,
    is_gold: isGold,
    rating_points: ratingPoints,
    reviews_points: reviewsPoints,
    website_points: websitePoints,
    bad_site_points: badSitePoints,
    email_points: emailPoints,
    social_points: socialPoints,
    bad_site: badSite,
    bad_site_reasons: badSiteReasons,
    notes,
  };
}
