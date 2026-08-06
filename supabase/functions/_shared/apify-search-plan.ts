export type ApifySearchPlan = {
  input: Record<string, unknown>;
  maxPlaces: number;
  maxItems: number;
  maxTotalChargeUsd: number;
};

export const APIFY_BASE_PLACE_COST_USD = 0.004;
export const APIFY_RUN_START_RESERVE_USD = 0.0002;

export function criarPlanoBuscaApify(nicho: string, limite: number): ApifySearchPlan {
  const maxPlaces = Math.max(1, Math.floor(limite));
  const maxTotalChargeUsd = Number(
    (maxPlaces * APIFY_BASE_PLACE_COST_USD + APIFY_RUN_START_RESERVE_USD).toFixed(4),
  );

  return {
    input: {
      searchStringsArray: [nicho],
      maxCrawledPlacesPerSearch: maxPlaces,
      language: "pt-BR",
      skipClosedPlaces: false,
      maxReviews: 0,
      maxImages: 0,
      maxQuestions: 0,
      scrapeContacts: false,
      scrapePlaceDetailPage: false,
      scrapeSocialMediaProfiles: {
        facebooks: false,
        instagrams: false,
        youtubes: false,
        tiktoks: false,
        twitters: false,
      },
      maximumLeadsEnrichmentRecords: 0,
      verifyLeadsEnrichmentEmails: false,
      enableCompetitorAnalysis: false,
      scrapeReviewsPersonalData: false,
      scrapeImageAuthors: false,
      reviewsSort: "newest",
    },
    maxPlaces,
    maxItems: maxPlaces,
    maxTotalChargeUsd,
  };
}
