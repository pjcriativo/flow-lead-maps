export type InstagramRejectionReason =
  | "perfil_invalido"
  | "fora_nicho"
  | "fora_localidade"
  | "nao_comercial"
  | "com_site_proprio"
  | "poucos_seguidores"
  | "sem_contato_externo";

export type InstagramProfileSignals = {
  username?: unknown;
  fullName?: unknown;
  name?: unknown;
  biography?: unknown;
  bio?: unknown;
  businessCategoryName?: unknown;
  category?: unknown;
  locationName?: unknown;
  cityName?: unknown;
  address?: unknown;
  businessAddress?: unknown;
  isBusinessAccount?: unknown;
  isProfessionalAccount?: unknown;
  accountType?: unknown;
  statistics?: { accountType?: unknown } | unknown;
  followersCount?: unknown;
  externalUrl?: unknown;
  website?: unknown;
  businessEmail?: unknown;
  businessPhoneNumber?: unknown;
};

export type InstagramFilters = {
  nicho: string;
  cidade: string;
  minSeguidores?: number;
  soComerciais?: boolean;
  exigirLocalidade?: boolean;
  semSiteProprio?: boolean;
  exigirContatoExterno?: boolean;
};

const STOP_WORDS = new Set([
  "a",
  "as",
  "de",
  "da",
  "das",
  "do",
  "dos",
  "e",
  "em",
  "para",
  "por",
  "servico",
  "servicos",
]);

export function normalizarBuscaInstagram(valor: unknown): string {
  return String(valor ?? "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function textoDoPerfil(perfil: InstagramProfileSignals): string {
  return normalizarBuscaInstagram(
    [
      perfil.username,
      perfil.fullName,
      perfil.name,
      perfil.biography,
      perfil.bio,
      perfil.businessCategoryName,
      perfil.category,
      perfil.locationName,
      perfil.cityName,
      perfil.address,
      typeof perfil.businessAddress === "string"
        ? perfil.businessAddress
        : JSON.stringify(perfil.businessAddress ?? ""),
    ].join(" "),
  );
}

function tokensRelevantes(valor: string): string[] {
  return normalizarBuscaInstagram(valor)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

export function perfilTemNicho(perfil: InstagramProfileSignals, nicho: string): boolean {
  const tokens = tokensRelevantes(nicho);
  if (tokens.length === 0) return true;
  const texto = textoDoPerfil(perfil);
  return tokens.some((token) => texto.includes(token));
}

export function perfilTemLocalidade(perfil: InstagramProfileSignals, cidade: string): boolean {
  const cidadeNormalizada = normalizarBuscaInstagram(cidade);
  if (!cidadeNormalizada) return true;
  return textoDoPerfil(perfil).includes(cidadeNormalizada);
}

const NAO_E_SITE =
  /(^|\.)(wa\.me|api\.whatsapp\.com|whatsapp\.com|linktr\.ee|linktree\.|beacons\.ai|bio\.link|linkin\.bio|linkbio|campsite\.bio|msha\.ke|instagram\.com|facebook\.com|fb\.me|youtube\.com|youtu\.be|tiktok\.com|twitter\.com|x\.com|t\.me|linktr\.|maps\.app\.goo\.gl|maps\.google\.|goo\.gl)/i;

export function temSiteProprioInstagram(url: unknown): boolean {
  if (!url) return false;
  try {
    return !NAO_E_SITE.test(new URL(String(url)).hostname);
  } catch {
    return false;
  }
}

export function perfilEhProfissionalInstagram(perfil: InstagramProfileSignals): boolean {
  if (perfil.isBusinessAccount === true || perfil.isProfessionalAccount === true) return true;
  if (String(perfil.businessCategoryName ?? perfil.category ?? "").trim()) return true;
  const statistics =
    perfil.statistics && typeof perfil.statistics === "object"
      ? (perfil.statistics as { accountType?: unknown })
      : null;
  const tipo = Number(statistics?.accountType ?? perfil.accountType ?? 0);
  return tipo === 2 || tipo === 3;
}

export function motivoRejeicaoInstagram(
  perfil: InstagramProfileSignals,
  filtros: InstagramFilters,
  temContatoExterno: boolean,
): InstagramRejectionReason | null {
  if (!String(perfil.username ?? "").trim()) return "perfil_invalido";
  if (!perfilTemNicho(perfil, filtros.nicho)) return "fora_nicho";
  if (filtros.exigirLocalidade && !perfilTemLocalidade(perfil, filtros.cidade))
    return "fora_localidade";
  if (filtros.soComerciais && !perfilEhProfissionalInstagram(perfil)) return "nao_comercial";
  if (filtros.semSiteProprio && temSiteProprioInstagram(perfil.externalUrl ?? perfil.website))
    return "com_site_proprio";
  if (Number(perfil.followersCount ?? 0) < Number(filtros.minSeguidores ?? 0))
    return "poucos_seguidores";
  if (filtros.exigirContatoExterno && !temContatoExterno) return "sem_contato_externo";
  return null;
}

export function calcularScoreInstagram(params: {
  temNicho: boolean;
  temLocalidade: boolean;
  comercial: boolean;
  temContatoExterno: boolean;
  semSiteProprio: boolean;
  seguidores: number;
}): { score: number; breakdown: Record<string, boolean | number | string> } {
  const score =
    (params.temNicho ? 30 : 0) +
    (params.temLocalidade ? 25 : 0) +
    (params.comercial ? 10 : 0) +
    (params.temContatoExterno ? 15 : 0) +
    (params.semSiteProprio ? 10 : 0) +
    (params.seguidores >= 100 && params.seguidores <= 100_000 ? 10 : 0);
  return {
    score,
    breakdown: {
      tipo: "aderencia_instagram",
      score,
      nicho_confirmado: params.temNicho,
      localidade_confirmada: params.temLocalidade,
      conta_comercial: params.comercial,
      contato_externo: params.temContatoExterno,
      sem_site_proprio: params.semSiteProprio,
      faixa_seguidores_ideal: params.seguidores >= 100 && params.seguidores <= 100_000,
    },
  };
}
