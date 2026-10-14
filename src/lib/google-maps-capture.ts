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
  // First, apply all the standard replacements
  let sanitized = message
    .replace(
      /\b(?:apify|geoapify|openstreetmap|google places|osm|leaflet|carto)\b/gi,
      "serviço de busca",
    )
    .replace(/\b(?:scraper|actor|dataset|run|backend|api)\b/gi, "processamento")
    .replace(/HTTP\s+\d{3}/gi, "serviço indisponível")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "identificador protegido")
    .replace(
      /\b(?:api_consumption_logs|memberships|profiles|lead_lists|leads)\b/gi,
      "dados internos",
    )
    .replace(
      /\b(?:constraint|foreign key|postgres|sqlstate|select|insert|update|delete)\b/gi,
      "operação interna",
    );

  // Remove cost information (patterns like "cost ~US$", "custo ~US$", etc.)
  sanitized = sanitized
    .replace(/\b(?:cost|custo)\s*[~≈]?\s*[$\s]*\d+[.,]?\d*\s*(?:usd|dólares?|brl|reais?)/gi, '')
    .replace(/\b(?:cost|custo)\s*[~≈]?\s*[$\s]*\d+[.,]?\d*/gi, '');

  // Check if this is a success message and show user-friendly text
  const successIndicators = [
    /SUCCEEDED/i,
    /SUCCESS/i,
    /CONCLUÍDO/i,
    /FINISHED/i,
    /COMPLETED/i,
  ];

  const isSuccess = successIndicators.some(pattern => pattern.test(message));

  if (isSuccess) {
    // For success messages, show a clean user-friendly message
    // Extract any meaningful info like lead count if possible
    const leadCountMatch = message.match(/(\d+)\s*(?:leads?|empresas?|resultados?)/i);
    if (leadCountMatch) {
      return `sua busca foi executada com sucesso e encontrou ${leadCountMatch[1]} leads`;
    }
    return "sua busca foi executada com sucesso";
  }

  // Clean up any extra spaces or punctuation that might be left
  sanitized = sanitized
    .replace(/\s+:/g, ': ')          // Fix spacing before colons
    .replace(/:\s+/g, ': ')          // Fix spacing after colons
    .replace(/\s{2,}/g, ' ')         // Remove multiple spaces
    .replace(/^[:\s]+|[:\s]+$/g, ''); // Remove leading/trailing spaces and colons

  return sanitized.slice(0, 240);
}

const SAFE_PUBLIC_ERRORS = [
  /^Informe o nicho e a cidade/i,
  /^Você não tem permissão/i,
  /^Acesso aguardando liberação/i,
  /^Sua conta ainda não possui/i,
  /^Limite mensal de leads atingido/i,
];

export function toGoogleMapsPublicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const sanitized = sanitizeGoogleMapsUserMessage(message).trim();
  if (SAFE_PUBLIC_ERRORS.some((pattern) => pattern.test(sanitized))) return sanitized;
  return "Não foi possível concluir a pesquisa. Tente novamente ou consulte o suporte.";
}
