export const DASHBOARD_SECTION_IDS = [
  "buscar",
  "instagram",
  "listas",
  "pipeline",
  "leads",
  "propostas",
  "campanhas",
  "whatsapp",
  "automacao",
  "contratos",
  "financeiro",
  "redesign",
  "publicar",
  "suporte",
  "notificacoes",
  "academy",
  "sheets",
  "settings",
] as const;

export type DashboardSection = (typeof DASHBOARD_SECTION_IDS)[number];

export function isDashboardSection(value: string | null): value is DashboardSection {
  return DASHBOARD_SECTION_IDS.some((section) => section === value);
}

export function dashboardSectionFromSearch(search: string): DashboardSection {
  const requested = new URLSearchParams(search).get("secao");
  if (requested === "configuracoes" || requested === "perfil") return "settings";
  return isDashboardSection(requested) ? requested : "buscar";
}

export function dashboardUrlForSection(currentUrl: string, section: DashboardSection): string {
  const url = new URL(currentUrl);
  url.searchParams.set("secao", section);
  return `${url.pathname}${url.search}${url.hash}`;
}
