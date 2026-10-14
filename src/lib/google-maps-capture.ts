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
  const normalized = message.trim();

  if (
    /^(?:Informe o nicho|Você não tem permissão|Acesso aguardando|Sua conta ainda|Limite mensal)/i.test(
      normalized,
    )
  ) {
    return normalized.slice(0, 240);
  }

  if (/(?:erro|falha|failed|error|serviço indisponível)/i.test(normalized)) {
    return "Não foi possível concluir esta etapa da pesquisa.";
  }

  if (/(?:succeeded|success|concluído|finalizad|finished|completed)/i.test(normalized)) {
    return "Pesquisa concluída com sucesso.";
  }

  if (/(?:iniciad|conectad|starting|started)/i.test(normalized)) {
    return "Pesquisa iniciada. Estamos identificando empresas na região selecionada.";
  }

  if (/(?:duplicat|já existe|já pertenci|repetid)/i.test(normalized)) {
    return "Verificando empresas já conhecidas pela sua organização.";
  }

  return "Processando empresas encontradas...";
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
