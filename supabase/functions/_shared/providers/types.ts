// Contrato ÚNICO dos provedores de busca (arquitetura plugável).
// Adicionar uma fonte nova (ex.: Apify) = criar um arquivo que implemente
// `ProviderSearch` e registrá-la no dispatch da search-leads. Nada mais muda.

export type Fonte = "osm" | "geoapify" | "places";

/** Lugar normalizado que TODO provedor devolve (o que não vier, fica null — nunca inventar). */
export type RawPlace = {
  /** Fonte que originou o registro. */
  source: Fonte;
  /** Id único e estável, prefixado pela fonte (ex.: "osm:node/123", "geoapify:..."). Vai em leads.place_id. */
  source_id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  instagram: string | null;
  facebook: string | null;
  /** Coordenadas quando a fonte fornecer (hoje NÃO persistidas — a tabela leads não tem colunas lat/lng). */
  lat: number | null;
  lng: number | null;
};

export type ProviderParams = {
  nicho: string;
  cidade: string;
  uf: string;
  /** Busca por área no mapa: centro + raio (km). Quando presentes, têm prioridade sobre cidade/uf. */
  lat: number | null;
  lng: number | null;
  raioKm: number | null;
  /** Quantos candidatos coletar (a search-leads pede ~1.6x o limite). */
  alvo: number;
  /** Ids já vistos (dedupe entre buscas do usuário). */
  seen: Set<string>;
  /** Log de progresso (vai pro stream NDJSON da UI). */
  log: (message: string) => void;
};

/** Assinatura única: buscarLeads(params) -> lugares normalizados. */
export type ProviderSearch = (params: ProviderParams) => Promise<RawPlace[]>;
