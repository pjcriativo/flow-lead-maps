export type ChannelType =
  "email" | "google_maps" | "instagram" | "whatsapp" | "linkedin" | "youtube" | "tiktok";

export type EtapaType = "proposta" | "site_gerado" | "preparacao" | "aprovacao" | "envio";

export type StatusType =
  "em_producao" | "aguardando_aprovacao" | "em_envio" | "concluida" | "pausada";

export interface CampanhaPremiumItem {
  id: string;
  name: string;
  niche: string;
  channel: ChannelType;
  channelLabel: string;
  leadsCount: number;
  etapa: EtapaType;
  status: StatusType;
  responsible: {
    name: string;
    avatarUrl?: string;
    initials: string;
  };
  lastAction: string;
  priority?: "alta" | "media" | "baixa";
  category?: string;
  stepperStep?: number;
}

export interface MetricCardItem {
  id: string;
  label: string;
  value: string;
  change: string;
  accent: "orange" | "purple" | "green" | "blue" | "amber";
  bars: number[];
}

/** Estrutura legada do gráfico; a Central passa [] até existir uma série histórica real. */
export interface ChartDataPoint {
  date: string;
  odontoPrime: number;
  clinicaVida: number;
  saborArte: number;
  mendesAdvocacia: number;
  autoCenter: number;
  esteticaBemEstar: number;
  techSolutions: number;
}
