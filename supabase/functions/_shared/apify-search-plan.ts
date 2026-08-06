export type ApifySearchPlan = {
  input: Record<string, unknown>;
  maxPlaces: number;
  maxItems: number;
  maxTotalChargeUsd: number;
};

export const MAX_APIFY_COST_PER_ITEM_USD = 0.005;

export function criarPlanoBuscaApify(nicho: string, limite: number): ApifySearchPlan {
  const maxPlaces = Math.max(1, Math.floor(limite));
  const maxTotalChargeUsd = Number((maxPlaces * MAX_APIFY_COST_PER_ITEM_USD).toFixed(4));

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
      scrapeReviewsPersonalData: false,
      scrapeImageAuthors: false,
      reviewsSort: "newest",
    },
    maxPlaces,
    maxItems: maxPlaces,
    maxTotalChargeUsd,
  };
}
