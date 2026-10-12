export type ChannelType = "google_maps" | "instagram" | "whatsapp" | "linkedin" | "youtube" | "tiktok";

export type EtapaType = "proposta" | "site_gerado" | "preparacao" | "aprovacao" | "envio";

export type StatusType = "em_producao" | "aguardando_aprovacao" | "em_envio" | "concluida" | "pausada";

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
  metrics?: {
    leads: number;
    leadsGrowth: string;
    responses: number;
    responsesGrowth: string;
    meetings: number;
    meetingsGrowth: string;
    acceptedProposals: number;
    acceptedGrowth: string;
  };
  stepperStep?: number; // 1: Leads, 2: Site, 3: Proposta, 4: Aprovação, 5: Envio
}

export interface MetricCardItem {
  id: string;
  label: string;
  value: string;
  change: string;
  accent: "orange" | "purple" | "green" | "blue" | "amber";
  bars: number[];
}

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

export interface ActionItem {
  id: string;
  title: string;
  time: string;
  tag: string;
  accent: "orange" | "red" | "blue" | "cyan" | "green";
}

export interface OperationalHealthItem {
  id: string;
  name: string;
  status: "Ativo" | "Parcial" | "Inativo";
  description: string;
  iconType: "openai" | "supabase" | "resend" | "meta" | "whatsapp";
}

export interface StageDistributionItem {
  id: string;
  label: string;
  percentage: number;
  count: number;
  color: string;
}

export const TOP_METRICS: MetricCardItem[] = [
  {
    id: "ativas",
    label: "Campanhas ativas",
    value: "24",
    change: "26%",
    accent: "orange",
    bars: [30, 45, 60, 50, 70, 85, 95, 100],
  },
  {
    id: "leads",
    label: "Leads em campanha",
    value: "1.248",
    change: "18%",
    accent: "purple",
    bars: [40, 55, 65, 50, 80, 75, 90, 100],
  },
  {
    id: "sites",
    label: "Sites gerados",
    value: "312",
    change: "24%",
    accent: "green",
    bars: [20, 35, 50, 65, 75, 80, 90, 100],
  },
  {
    id: "propostas",
    label: "Propostas enviadas",
    value: "148",
    change: "16%",
    accent: "blue",
    bars: [30, 40, 50, 60, 70, 80, 85, 95],
  },
  {
    id: "receita",
    label: "Receita gerada",
    value: "R$ 28.430",
    change: "28%",
    accent: "amber",
    bars: [45, 55, 60, 75, 80, 85, 90, 100],
  },
];

export const MOCK_CAMPANHAS: CampanhaPremiumItem[] = [
  {
    id: "camp-1",
    name: "Odonto Prime Reativação",
    niche: "Clínica Odontológica",
    channel: "google_maps",
    channelLabel: "Google Maps",
    leadsCount: 248,
    etapa: "proposta",
    status: "em_producao",
    priority: "alta",
    category: "Clínica odontológica",
    stepperStep: 3,
    responsible: {
      name: "Marcos Gonçalves",
      initials: "MG",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "30/10/2025 14:32",
    metrics: {
      leads: 84,
      leadsGrowth: "12%",
      responses: 12,
      responsesGrowth: "33%",
      meetings: 4,
      meetingsGrowth: "100%",
      acceptedProposals: 2,
      acceptedGrowth: "100%",
    },
  },
  {
    id: "camp-2",
    name: "Clínica Vida Premium",
    niche: "Clínica médica",
    channel: "instagram",
    channelLabel: "Instagram",
    leadsCount: 186,
    etapa: "site_gerado",
    status: "aguardando_aprovacao",
    priority: "alta",
    category: "Clínica médica",
    stepperStep: 2,
    responsible: {
      name: "Juliana Martins",
      initials: "JM",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "30/10/2025 13:45",
    metrics: {
      leads: 62,
      leadsGrowth: "15%",
      responses: 8,
      responsesGrowth: "20%",
      meetings: 3,
      meetingsGrowth: "50%",
      acceptedProposals: 1,
      acceptedGrowth: "100%",
    },
  },
  {
    id: "camp-3",
    name: "Restaurante Sabor & Arte",
    niche: "Restaurante",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    leadsCount: 142,
    etapa: "preparacao",
    status: "em_producao",
    priority: "media",
    category: "Gastronomia",
    stepperStep: 1,
    responsible: {
      name: "Carlos Mendes",
      initials: "CM",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "30/10/2025 12:20",
    metrics: {
      leads: 45,
      leadsGrowth: "8%",
      responses: 14,
      responsesGrowth: "40%",
      meetings: 2,
      meetingsGrowth: "25%",
      acceptedProposals: 1,
      acceptedGrowth: "50%",
    },
  },
  {
    id: "camp-4",
    name: "Mendes Advocacia Proposta",
    niche: "Escritório de advocacia",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    leadsCount: 98,
    etapa: "aprovacao",
    status: "em_envio",
    priority: "media",
    category: "Jurídico",
    stepperStep: 4,
    responsible: {
      name: "Fernanda Costa",
      initials: "FC",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "30/10/2025 11:18",
    metrics: {
      leads: 32,
      leadsGrowth: "10%",
      responses: 7,
      responsesGrowth: "15%",
      meetings: 3,
      meetingsGrowth: "75%",
      acceptedProposals: 2,
      acceptedGrowth: "100%",
    },
  },
  {
    id: "camp-5",
    name: "Auto Center Brasil",
    niche: "Auto center",
    channel: "youtube",
    channelLabel: "YouTube",
    leadsCount: 76,
    etapa: "envio",
    status: "concluida",
    priority: "baixa",
    category: "Automotivo",
    stepperStep: 5,
    responsible: {
      name: "Ricardo Souza",
      initials: "RS",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "29/10/2025 16:50",
    metrics: {
      leads: 76,
      leadsGrowth: "25%",
      responses: 19,
      responsesGrowth: "50%",
      meetings: 5,
      meetingsGrowth: "150%",
      acceptedProposals: 3,
      acceptedGrowth: "100%",
    },
  },
  {
    id: "camp-6",
    name: "Estética Bem Estar",
    niche: "Centro de estética",
    channel: "instagram",
    channelLabel: "Instagram",
    leadsCount: 64,
    etapa: "site_gerado",
    status: "pausada",
    priority: "baixa",
    category: "Beleza e Bem-Estar",
    stepperStep: 2,
    responsible: {
      name: "Camila Rocha",
      initials: "CR",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "29/10/2025 14:10",
    metrics: {
      leads: 28,
      leadsGrowth: "5%",
      responses: 4,
      responsesGrowth: "10%",
      meetings: 1,
      meetingsGrowth: "0%",
      acceptedProposals: 0,
      acceptedGrowth: "0%",
    },
  },
  {
    id: "camp-7",
    name: "Tech Solutions Outbound",
    niche: "Empresa de tecnologia",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    leadsCount: 52,
    etapa: "preparacao",
    status: "em_producao",
    priority: "alta",
    category: "Software & TI",
    stepperStep: 1,
    responsible: {
      name: "Paulo Henrique",
      initials: "PH",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&auto=format&fit=crop&q=80",
    },
    lastAction: "29/10/2025 12:35",
    metrics: {
      leads: 18,
      leadsGrowth: "12%",
      responses: 5,
      responsesGrowth: "20%",
      meetings: 2,
      meetingsGrowth: "50%",
      acceptedProposals: 1,
      acceptedGrowth: "100%",
    },
  },
];

export const CHART_SERIES: ChartDataPoint[] = [
  {
    date: "01/10",
    odontoPrime: 25,
    clinicaVida: 15,
    saborArte: 10,
    mendesAdvocacia: 8,
    autoCenter: 5,
    esteticaBemEstar: 4,
    techSolutions: 3,
  },
  {
    date: "05/10",
    odontoPrime: 55,
    clinicaVida: 35,
    saborArte: 28,
    mendesAdvocacia: 20,
    autoCenter: 15,
    esteticaBemEstar: 12,
    techSolutions: 10,
  },
  {
    date: "10/10",
    odontoPrime: 75,
    clinicaVida: 50,
    saborArte: 42,
    mendesAdvocacia: 34,
    autoCenter: 28,
    esteticaBemEstar: 22,
    techSolutions: 18,
  },
  {
    date: "15/10",
    odontoPrime: 105,
    clinicaVida: 70,
    saborArte: 58,
    mendesAdvocacia: 48,
    autoCenter: 40,
    esteticaBemEstar: 32,
    techSolutions: 26,
  },
  {
    date: "20/10",
    odontoPrime: 125,
    clinicaVida: 95,
    saborArte: 78,
    mendesAdvocacia: 64,
    autoCenter: 52,
    esteticaBemEstar: 45,
    techSolutions: 36,
  },
  {
    date: "25/10",
    odontoPrime: 145,
    clinicaVida: 110,
    saborArte: 85,
    mendesAdvocacia: 72,
    autoCenter: 60,
    esteticaBemEstar: 52,
    techSolutions: 42,
  },
  {
    date: "30/10",
    odontoPrime: 160,
    clinicaVida: 125,
    saborArte: 98,
    mendesAdvocacia: 82,
    autoCenter: 76,
    esteticaBemEstar: 58,
    techSolutions: 48,
  },
];

export const UPCOMING_ACTIONS: ActionItem[] = [
  {
    id: "act-1",
    title: "Revisar site da campanha",
    time: "Hoje, 14:30",
    tag: "Site",
    accent: "orange",
  },
  {
    id: "act-2",
    title: "Aprovar copy de e-mail",
    time: "Hoje, 16:00",
    tag: "Conteúdo",
    accent: "red",
  },
  {
    id: "act-3",
    title: "Enviar proposta para leads qualificados",
    time: "31/10/2025, 10:00",
    tag: "Proposta",
    accent: "blue",
  },
  {
    id: "act-4",
    title: "Follow-up manual (10 leads)",
    time: "31/10/2025, 14:00",
    tag: "Leads",
    accent: "cyan",
  },
  {
    id: "act-5",
    title: "Publicar nova segmentação",
    time: "01/11/2025, 09:00",
    tag: "Tráfego",
    accent: "green",
  },
];

export const OPERATIONAL_HEALTH: OperationalHealthItem[] = [
  {
    id: "openai",
    name: "OpenAI",
    status: "Ativo",
    description: "Geração de conteúdo",
    iconType: "openai",
  },
  {
    id: "supabase",
    name: "Supabase",
    status: "Ativo",
    description: "Sites e dados",
    iconType: "supabase",
  },
  {
    id: "resend",
    name: "Resend",
    status: "Ativo",
    description: "Envio de e-mails",
    iconType: "resend",
  },
  {
    id: "meta",
    name: "Meta",
    status: "Parcial",
    description: "Anúncios e tráfego",
    iconType: "meta",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    status: "Ativo",
    description: "Envio de mensagens",
    iconType: "whatsapp",
  },
];

export const STAGE_DISTRIBUTION: StageDistributionItem[] = [
  {
    id: "prep",
    label: "Preparação",
    percentage: 28,
    count: 349,
    color: "#6366F1", // Indigo/Purple
  },
  {
    id: "site",
    label: "Site gerado",
    percentage: 24,
    count: 249,
    color: "#A855F7", // Purple
  },
  {
    id: "aprovado",
    label: "Aprovado",
    percentage: 16,
    count: 200,
    color: "#F59E0B", // Amber/Orange
  },
  {
    id: "aprovacao",
    label: "Aprovação",
    percentage: 16,
    count: 200,
    color: "#10B981", // Emerald
  },
];
