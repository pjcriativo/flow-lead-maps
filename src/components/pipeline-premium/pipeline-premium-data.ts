export type PipelineStageKey =
  | "novo"
  | "contato"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "fechado";

export type OpportunityChannel =
  | "maps"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "whatsapp";

export interface PipelineStageInfo {
  key: PipelineStageKey;
  title: string;
  count: number;
  totalValue: string;
  badgeColor: string;
}

export interface OpportunityItem {
  id: string;
  stage: PipelineStageKey;
  company: string;
  category: string;
  value: string;
  channel: OpportunityChannel;
  channelLabel: string;
  statusTag: string;
  score: number;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  description?: string;
  responsible?: string;
  tags?: string[];
  avatarType:
    | "tooth"
    | "auto"
    | "fitness"
    | "restaurant"
    | "beauty"
    | "leaf"
    | "tech"
    | "legal"
    | "architecture"
    | "education"
    | "supermarket"
    | "transport"
    | "consulting"
    | "construction"
    | "holding"
    | "agency"
    | "industry"
    | "mechanic";
}

export interface PipelineMetricItem {
  id: string;
  label: string;
  value: string;
  change: string;
  accent: "orange" | "purple" | "green" | "blue" | "amber";
  bars: number[];
}

export const PIPELINE_METRICS: PipelineMetricItem[] = [
  {
    id: "leads",
    label: "Leads no pipeline",
    value: "1.248",
    change: "12%",
    accent: "orange",
    bars: [30, 48, 40, 75, 95, 60],
  },
  {
    id: "negociacao",
    label: "Em negociação",
    value: "892",
    change: "18%",
    accent: "purple",
    bars: [25, 40, 70, 55, 90, 80],
  },
  {
    id: "propostas",
    label: "Propostas enviadas",
    value: "312",
    change: "24%",
    accent: "green",
    bars: [35, 60, 25, 95, 75, 90],
  },
  {
    id: "vendas",
    label: "Vendas realizadas",
    value: "148",
    change: "16%",
    accent: "blue",
    bars: [25, 55, 70, 40, 75, 95],
  },
  {
    id: "valor",
    label: "Valor em negociação",
    value: "R$ 28.430",
    change: "28%",
    accent: "amber",
    bars: [30, 45, 60, 75, 90, 95],
  },
];

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    key: "novo",
    title: "Novo Lead",
    count: 248,
    totalValue: "R$ 0,00",
    badgeColor: "border-slate-700/80 bg-slate-900/60 text-slate-300",
  },
  {
    key: "contato",
    title: "Em Contato",
    count: 186,
    totalValue: "R$ 48.430,00",
    badgeColor: "border-purple-800/80 bg-purple-950/60 text-purple-300",
  },
  {
    key: "qualificacao",
    title: "Qualificação",
    count: 142,
    totalValue: "R$ 98.220,00",
    badgeColor: "border-blue-800/80 bg-blue-950/60 text-blue-300",
  },
  {
    key: "proposta",
    title: "Proposta",
    count: 98,
    totalValue: "R$ 164.500,00",
    badgeColor: "border-amber-800/80 bg-amber-950/60 text-amber-300",
  },
  {
    key: "negociacao",
    title: "Negociação",
    count: 76,
    totalValue: "R$ 212.340,00",
    badgeColor: "border-orange-800/80 bg-orange-950/60 text-orange-300",
  },
  {
    key: "fechado",
    title: "Fechado",
    count: 64,
    totalValue: "R$ 356.780,00",
    badgeColor: "border-emerald-800/80 bg-emerald-950/60 text-emerald-300",
  },
];

export const MOCK_OPPORTUNITIES: OpportunityItem[] = [
  // Coluna 1: Novo Lead
  {
    id: "opp-1",
    stage: "novo",
    company: "Clínica Odonto Prime",
    category: "Clínica odontológica",
    value: "R$ 0,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Novo",
    score: 92,
    contactName: "Dr. Carlos Silva",
    phone: "(41) 3222-1234",
    email: "contato@odontoprime.com.br",
    address: "Av. Getúlio Vargas, 1234\nCentro, Curitiba - PR",
    website: "www.odontoprime.com.br",
    description:
      "Clínica moderna com foco em odontologia estética, implantes e tratamentos especializados.",
    responsible: "Marcos Gonçalves",
    tags: ["Alto potencial", "Odontologia"],
    avatarType: "tooth",
  },
  {
    id: "opp-2",
    stage: "novo",
    company: "Auto Center Brasil",
    category: "Auto center",
    value: "R$ 0,00",
    channel: "instagram",
    channelLabel: "Instagram",
    statusTag: "Novo",
    score: 59,
    contactName: "Paulo Henrique",
    phone: "(41) 3555-4433",
    email: "vendas@autocenter.com.br",
    address: "Linha Verde, 4500 - Curitiba - PR",
    website: "www.autocenterbrasil.com.br",
    description: "Centro automotivo completo com oficina de ponta e funilaria express.",
    responsible: "Marcos Gonçalves",
    tags: ["Em qualificação", "Automotivo"],
    avatarType: "auto",
  },
  {
    id: "opp-3",
    stage: "novo",
    company: "Academia Evolution",
    category: "Academia",
    value: "R$ 0,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Novo",
    score: 76,
    contactName: "Ricardo Mendes",
    phone: "(41) 3444-8901",
    email: "ricardo@evolution.com.br",
    address: "Av. Paulista, 1500 - São Paulo - SP",
    website: "www.academiaevolution.com.br",
    description: "Complexo esportivo com treinamento funcional e alta adesão de alunos.",
    responsible: "Marcos Gonçalves",
    tags: ["Médio potencial", "Fitness"],
    avatarType: "fitness",
  },
  {
    id: "opp-4",
    stage: "novo",
    company: "Restaurante Sabor & Arte",
    category: "Restaurante",
    value: "R$ 0,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Novo",
    score: 88,
    contactName: "Ana Paula",
    phone: "(41) 3333-5678",
    email: "contato@saborarte.com.br",
    address: "Rua XV de Novembro, 890 - Curitiba - PR",
    website: "www.saborarte.com.br",
    description: "Alta gastronomia contemporânea com adega selecionada e público executivo.",
    responsible: "Marcos Gonçalves",
    tags: ["Alto potencial", "Gastronomia"],
    avatarType: "restaurant",
  },
  {
    id: "opp-5",
    stage: "novo",
    company: "Estética Bem Estar",
    category: "Estética",
    value: "R$ 0,00",
    channel: "tiktok",
    channelLabel: "TikTok",
    statusTag: "Novo",
    score: 81,
    contactName: "Camila Rocha",
    phone: "(11) 3999-8877",
    email: "contato@bemestar.com.br",
    address: "Rua Haddock Lobo, 800 - São Paulo - SP",
    website: "www.bemestar.com.br",
    description: "Procedimentos estéticos avançados com lasers e tecnologia de ponta.",
    responsible: "Marcos Gonçalves",
    tags: ["Alto potencial", "Estética"],
    avatarType: "beauty",
  },

  // Coluna 2: Em Contato
  {
    id: "opp-6",
    stage: "contato",
    company: "Clínica Vida Leve",
    category: "Clínica médica",
    value: "R$ 12.500,00",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    statusTag: "Em contato",
    score: 85,
    contactName: "Juliana Martins",
    phone: "(11) 98877-6655",
    email: "contato@vidaleve.com.br",
    address: "Rua Oscar Freire, 420 - São Paulo - SP",
    website: "www.vidaleve.com.br",
    description: "Saúde integrativa e medicina preventiva.",
    responsible: "Marcos Gonçalves",
    tags: ["Alto potencial", "Saúde"],
    avatarType: "leaf",
  },
  {
    id: "opp-7",
    stage: "contato",
    company: "Souza Tecnologia",
    category: "Tecnologia",
    value: "R$ 8.900,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Em contato",
    score: 72,
    contactName: "Ricardo Souza",
    phone: "(71) 3337-6655",
    email: "contato@souzatec.com.br",
    address: "Av. Tancredo Neves, 620 - Salvador - BA",
    website: "www.souzatec.com.br",
    description: "Soluções em cloud e inteligência corporativa.",
    responsible: "Marcos Gonçalves",
    tags: ["Médio potencial", "Tecnologia"],
    avatarType: "tech",
  },
  {
    id: "opp-8",
    stage: "contato",
    company: "Studio Beleza Total",
    category: "Salão de beleza",
    value: "R$ 6.800,00",
    channel: "instagram",
    channelLabel: "Instagram",
    statusTag: "Em contato",
    score: 77,
    contactName: "Mariana Lima",
    phone: "(41) 3777-2211",
    email: "contato@belezatotal.com.br",
    address: "Av. Batel, 1550 - Curitiba - PR",
    website: "www.belezatotal.com.br",
    description: "Salão conceito em visagismo e cuidados premium.",
    responsible: "Marcos Gonçalves",
    tags: ["Médio potencial", "Beleza"],
    avatarType: "beauty",
  },
  {
    id: "opp-9",
    stage: "contato",
    company: "Mendes Advocacia",
    category: "Advocacia",
    value: "R$ 15.000,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Em contato",
    score: 90,
    contactName: "Carlos Mendes",
    phone: "(21) 4111-2233",
    email: "contato@mendesadv.com.br",
    address: "Av. Rio Branco, 110 - Rio de Janeiro - RJ",
    website: "www.mendesadv.com.br",
    description: "Escritório de advocacia empresarial e direito tributário.",
    responsible: "Marcos Gonçalves",
    tags: ["Alto potencial", "Jurídico"],
    avatarType: "legal",
  },
  {
    id: "opp-10",
    stage: "contato",
    company: "Costa Arquitetura",
    category: "Arquitetura",
    value: "R$ 9.400,00",
    channel: "youtube",
    channelLabel: "YouTube",
    statusTag: "Em contato",
    score: 68,
    contactName: "Fernanda Costa",
    phone: "(31) 3666-9878",
    email: "fernanda@costaarq.com.br",
    address: "Rua da Bahia, 1200 - Belo Horizonte - MG",
    website: "www.costaarq.com.br",
    description: "Projetos de arquitetura comercial e residencial.",
    responsible: "Marcos Gonçalves",
    tags: ["Em negociação", "Arquitetura"],
    avatarType: "architecture",
  },

  // Coluna 3: Qualificação
  {
    id: "opp-11",
    stage: "qualificacao",
    company: "Educa Mais",
    category: "Educação",
    value: "R$ 18.900,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Qualificação",
    score: 84,
    avatarType: "education",
  },
  {
    id: "opp-12",
    stage: "qualificacao",
    company: "Clínica Saúde Total",
    category: "Clínica médica",
    value: "R$ 22.500,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Qualificação",
    score: 86,
    avatarType: "leaf",
  },
  {
    id: "opp-13",
    stage: "qualificacao",
    company: "Mercado Boa Compra",
    category: "Supermercado",
    value: "R$ 12.400,00",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    statusTag: "Qualificação",
    score: 79,
    avatarType: "supermarket",
  },
  {
    id: "opp-14",
    stage: "qualificacao",
    company: "Transportes Silva",
    category: "Transporte",
    value: "R$ 16.800,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Qualificação",
    score: 73,
    avatarType: "transport",
  },
  {
    id: "opp-15",
    stage: "qualificacao",
    company: "Consultoria Alves",
    category: "Consultoria",
    value: "R$ 25.000,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Qualificação",
    score: 88,
    avatarType: "consulting",
  },

  // Coluna 4: Proposta
  {
    id: "opp-16",
    stage: "proposta",
    company: "Construtora Horizonte",
    category: "Construção",
    value: "R$ 28.500,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Proposta",
    score: 89,
    avatarType: "construction",
  },
  {
    id: "opp-17",
    stage: "proposta",
    company: "Clínica Odonto Mais",
    category: "Clínica odontológica",
    value: "R$ 18.200,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Proposta",
    score: 83,
    avatarType: "tooth",
  },
  {
    id: "opp-18",
    stage: "proposta",
    company: "Restaurante do Chef",
    category: "Restaurante",
    value: "R$ 14.900,00",
    channel: "instagram",
    channelLabel: "Instagram",
    statusTag: "Proposta",
    score: 80,
    avatarType: "restaurant",
  },
  {
    id: "opp-19",
    stage: "proposta",
    company: "Tech Solutions",
    category: "Tecnologia",
    value: "R$ 32.400,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Proposta",
    score: 91,
    avatarType: "tech",
  },
  {
    id: "opp-20",
    stage: "proposta",
    company: "Imobiliária Smart",
    category: "Imobiliária",
    value: "R$ 26.800,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Proposta",
    score: 85,
    avatarType: "construction",
  },

  // Coluna 5: Negociação
  {
    id: "opp-21",
    stage: "negociacao",
    company: "Indústria Forte",
    category: "Indústria",
    value: "R$ 48.500,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Negociação",
    score: 94,
    avatarType: "industry",
  },
  {
    id: "opp-22",
    stage: "negociacao",
    company: "Clínica Harmonia",
    category: "Clínica médica",
    value: "R$ 36.200,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Negociação",
    score: 87,
    avatarType: "tooth",
  },
  {
    id: "opp-23",
    stage: "negociacao",
    company: "Escola do Futuro",
    category: "Educação",
    value: "R$ 29.900,00",
    channel: "instagram",
    channelLabel: "Instagram",
    statusTag: "Negociação",
    score: 82,
    avatarType: "education",
  },
  {
    id: "opp-24",
    stage: "negociacao",
    company: "Grupo Almeida",
    category: "Holding",
    value: "R$ 52.400,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Negociação",
    score: 96,
    avatarType: "holding",
  },
  {
    id: "opp-25",
    stage: "negociacao",
    company: "Agência Criativa",
    category: "Marketing",
    value: "R$ 28.900,00",
    channel: "youtube",
    channelLabel: "YouTube",
    statusTag: "Negociação",
    score: 84,
    avatarType: "agency",
  },

  // Coluna 6: Fechado
  {
    id: "opp-26",
    stage: "fechado",
    company: "Clínica Vida Plena",
    category: "Clínica médica",
    value: "R$ 18.000,00",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    statusTag: "Vendido",
    score: 93,
    avatarType: "tooth",
  },
  {
    id: "opp-27",
    stage: "fechado",
    company: "Restaurante Aroma",
    category: "Restaurante",
    value: "R$ 24.500,00",
    channel: "instagram",
    channelLabel: "Instagram",
    statusTag: "Vendido",
    score: 89,
    avatarType: "restaurant",
  },
  {
    id: "opp-28",
    stage: "fechado",
    company: "Mecânica do Vale",
    category: "Auto center",
    value: "R$ 16.800,00",
    channel: "maps",
    channelLabel: "Google Maps",
    statusTag: "Vendido",
    score: 81,
    avatarType: "mechanic",
  },
  {
    id: "opp-29",
    stage: "fechado",
    company: "Fitness Center",
    category: "Academia",
    value: "R$ 22.400,00",
    channel: "tiktok",
    channelLabel: "TikTok",
    statusTag: "Vendido",
    score: 85,
    avatarType: "fitness",
  },
  {
    id: "opp-30",
    stage: "fechado",
    company: "Clínica Sorriso",
    category: "Clínica odontológica",
    value: "R$ 28.900,00",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    statusTag: "Vendido",
    score: 92,
    avatarType: "tooth",
  },
];
