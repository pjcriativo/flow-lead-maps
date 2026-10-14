export const CAPTURE_FILTERS = ["telefone", "site", "instagram"] as const;

export type CaptureFilter = (typeof CAPTURE_FILTERS)[number];

export type CaptureCandidate = {
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  instagram_url?: string | null;
};

export function isCaptureFilter(value: unknown): value is CaptureFilter {
  return typeof value === "string" && CAPTURE_FILTERS.includes(value as CaptureFilter);
}

export function normalizeCaptureFilters(value: unknown): CaptureFilter[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isCaptureFilter))];
}

export function toggleCaptureFilter(
  activeFilters: readonly CaptureFilter[],
  filter: CaptureFilter,
): CaptureFilter[] {
  return activeFilters.includes(filter)
    ? activeFilters.filter((activeFilter) => activeFilter !== filter)
    : [...activeFilters, filter];
}

export function matchesCaptureFilters(
  candidate: CaptureCandidate,
  activeFilters: readonly CaptureFilter[],
): boolean {
  if (activeFilters.length === 0) return true;

  return activeFilters.some((filter) => {
    if (filter === "telefone") return Boolean(candidate.phone || candidate.whatsapp);
    if (filter === "site") return Boolean(candidate.website);
    return Boolean(candidate.instagram || candidate.instagram_url);
  });
}

export function sanitizeGoogleMapsUserMessage(message: string): string {
  return message
    .replace(
      /\b(?:apify|geoapify|openstreetmap|google places|osm|leaflet|carto)\b/gi,
      "serviço de busca",
    )
    .replace(/\b(?:scraper|actor|dataset|run|backend|api)\b/gi, "processamento")
    .replace(/HTTP\s+\d{3}/gi, "serviço indisponível");
}
