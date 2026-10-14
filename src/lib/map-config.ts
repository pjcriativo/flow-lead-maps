/**
 * Configuração Cartográfica Centralizada do Flow Business (Google Maps Module)
 *
 * Centraliza os endpoints de tiles, atribuições legais e classes de estilo do Leaflet
 * para evitar duplicação de URLs hardcoded e garantir a ausência de marcas d'água
 * decorrentes de serviços que exigem chave (como cartocdn.com/basemaps/apikey).
 */

export interface MapLayerConfig {
  id: "dark" | "streets";
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains: string;
  cssClass?: string;
}

export const MAP_CONFIG = {
  /**
   * Endpoint oficial gratuito OpenStreetMap sem exigência de API Key
   */
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

  /**
   * Atribuição legal padrão exigida pelos termos de uso do OSM / Leaflet
   */
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',

  /**
   * Subdomínios padrão para balanceamento de carga de tiles
   */
  subdomains: "abc",

  /**
   * Nível máximo de zoom suportado pelas camadas
   */
  maxZoom: 19,

  /**
   * Coordenadas padrão para o centro da busca (Curitiba / PR)
   */
  defaultCenter: [-25.4284, -49.2733] as [number, number],

  /**
   * Classe CSS que aplica inversão/contraste de cores nos tiles OSM para renderização Dark Mode nativa
   */
  darkTilesClass: "leaflet-dark-tiles",
} as const;

export const MAP_LAYERS: Record<"dark" | "streets", MapLayerConfig> = {
  dark: {
    id: "dark",
    label: "Modo Escuro (Dark Matter)",
    url: MAP_CONFIG.tileUrl,
    attribution: MAP_CONFIG.attribution,
    maxZoom: MAP_CONFIG.maxZoom,
    subdomains: MAP_CONFIG.subdomains,
    cssClass: MAP_CONFIG.darkTilesClass,
  },
  streets: {
    id: "streets",
    label: "Modo Claro (Ruas)",
    url: MAP_CONFIG.tileUrl,
    attribution: MAP_CONFIG.attribution,
    maxZoom: MAP_CONFIG.maxZoom,
    subdomains: MAP_CONFIG.subdomains,
  },
};
