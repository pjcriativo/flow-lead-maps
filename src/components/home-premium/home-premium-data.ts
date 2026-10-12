export type ChannelKey =
  "maps" | "instagram" | "linkedin" | "youtube" | "tiktok" | "whatsapp" | "business";

export interface ChannelMetric {
  key: ChannelKey;
  label: string;
  leads: number;
  share: number;
  color: string;
  active: boolean;
}

export const CHANNELS: ChannelMetric[] = [
  {
    key: "maps",
    label: "Google Maps",
    leads: 349,
    share: 28,
    color: "var(--home-blue)",
    active: true,
  },
  {
    key: "instagram",
    label: "Instagram",
    leads: 274,
    share: 22,
    color: "var(--home-pink)",
    active: true,
  },
  { key: "linkedin", label: "LinkedIn", leads: 224, share: 18, color: "#0a8bea", active: true },
  {
    key: "youtube",
    label: "YouTube",
    leads: 150,
    share: 12,
    color: "var(--home-red)",
    active: true,
  },
  { key: "tiktok", label: "TikTok", leads: 100, share: 8, color: "var(--home-cyan)", active: true },
  {
    key: "whatsapp",
    label: "WhatsApp",
    leads: 87,
    share: 7,
    color: "var(--home-green)",
    active: true,
  },
  {
    key: "business",
    label: "Business B&B",
    leads: 64,
    share: 5,
    color: "var(--home-amber)",
    active: false,
  },
];

const wave = (index: number, offset: number, amplitude: number, growth: number) =>
  Math.max(8, Math.round(10 + index * growth + Math.sin((index + offset) * 0.72) * amplitude));

export const PERFORMANCE_DATA = Array.from({ length: 30 }, (_, index) => ({
  date: `${String(index + 1).padStart(2, "0")}/10`,
  maps: wave(index, 0, 22, 5.1),
  instagram: wave(index, 2, 31, 4.9),
  linkedin: wave(index, 4, 20, 4.2),
  youtube: wave(index, 1, 25, 3.7),
  tiktok: wave(index, 6, 16, 3.4),
  whatsapp: wave(index, 3, 18, 2.8),
  business: wave(index, 5, 10, 1.7),
}));

export const RECENT_LEADS = [
  {
    initials: "RA",
    name: "Roberto Almeida",
    company: "Almeida Odontologia",
    channel: "maps" as const,
    city: "Curitiba, PR",
    date: "30/10 14:32",
    status: "Novo",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
  },
  {
    initials: "JM",
    name: "Juliana Martins",
    company: "Clínica Vida Leve",
    channel: "instagram" as const,
    city: "São Paulo, SP",
    date: "30/10 13:45",
    status: "Contato",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
  },
  {
    initials: "CM",
    name: "Carlos Mendes",
    company: "Mendes Advocacia",
    channel: "linkedin" as const,
    city: "Rio de Janeiro, RJ",
    date: "30/10 11:20",
    status: "Oportunidade",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  },
  {
    initials: "FC",
    name: "Fernanda Costa",
    company: "Costa Arquitetura",
    channel: "youtube" as const,
    city: "Belo Horizonte, MG",
    date: "30/10 10:18",
    status: "Em negociação",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
  },
  {
    initials: "RS",
    name: "Ricardo Souza",
    company: "Souza Tecnologia",
    channel: "tiktok" as const,
    city: "Salvador, BA",
    date: "29/10 16:50",
    status: "Novo",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
  },
];

export const RECENT_ACTIVITIES = [
  { kind: "lead", title: "12 novos leads capturados", detail: "Google Maps • há 12 minutos" },
  { kind: "proposal", title: "Proposta enviada", detail: "Clínica Vida Leve • há 1 hora" },
  { kind: "campaign", title: "Campanha concluída", detail: "Instagram • há 2 horas" },
  { kind: "account", title: "Conta conectada", detail: "WhatsApp • há 3 horas" },
  { kind: "contract", title: "Contrato assinado", detail: "Mendes Advocacia • há 5 horas" },
];
