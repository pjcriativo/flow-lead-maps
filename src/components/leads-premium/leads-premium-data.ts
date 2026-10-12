export type LeadStatus =
  | "Novo"
  | "Em contato"
  | "Oportunidade"
  | "Proposta"
  | "Negociação";

export type LeadChannel =
  | "maps"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "whatsapp";

export type LeadScoreClassification =
  | "Alto potencial"
  | "Médio potencial"
  | "Em negociação"
  | "Em qualificação";

export interface LeadItem {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  channel: LeadChannel;
  channelLabel: string;
  city: string;
  state: string;
  address: string;
  score: number;
  status: LeadStatus;
  date: string;
  time: string;
  category: string;
  website: string;
  description: string;
  classification: LeadScoreClassification;
  tags: string[];
  avatarType:
    | "tooth"
    | "restaurant"
    | "fitness"
    | "leaf"
    | "legal"
    | "architecture"
    | "tech"
    | "beauty"
    | "auto"
    | "hair";
}

export interface MetricCardItem {
  id: string;
  label: string;
  value: string;
  change: string;
  accent: "orange" | "purple" | "green" | "blue" | "amber";
  bars: number[]; // heights in % (0 - 100)
}

export const LEADS_METRICS: MetricCardItem[] = [
  {
    id: "total",
    label: "Total de leads",
    value: "1.248",
    change: "12%",
    accent: "orange",
    bars: [30, 48, 40, 75, 95, 60],
  },
  {
    id: "contato",
    label: "Em contato",
    value: "892",
    change: "18%",
    accent: "purple",
    bars: [25, 40, 70, 55, 90, 80],
  },
  {
    id: "oportunidades",
    label: "Oportunidades",
    value: "312",
    change: "24%",
    accent: "green",
    bars: [35, 60, 25, 95, 75, 90],
  },
  {
    id: "propostas",
    label: "Propostas",
    value: "148",
    change: "16%",
    accent: "blue",
    bars: [25, 55, 70, 40, 75, 95],
  },
  {
    id: "clientes",
    label: "Clientes",
    value: "86",
    change: "28%",
    accent: "amber",
    bars: [30, 45, 60, 75, 90, 95],
  },
];

export const MOCK_LEADS: LeadItem[] = [
  {
    id: "lead-1",
    company: "Clínica Odonto Prime",
    contactName: "Dr. Carlos Silva",
    phone: "(41) 3222-1234",
    email: "contato@odontoprime.com.br",
    channel: "maps",
    channelLabel: "Google Maps",
    city: "Curitiba",
    state: "PR",
    address: "Av. Getúlio Vargas, 1234\nCentro, Curitiba - PR, 80020-300",
    score: 92,
    status: "Novo",
    date: "30/10/2025",
    time: "14:32",
    category: "Clínica odontológica",
    website: "www.odontoprime.com.br",
    description:
      "Clínica moderna com foco em odontologia estética, implantes e tratamentos especializados com equipamentos de última geração.",
    classification: "Alto potencial",
    tags: ["Google Maps", "Alto potencial", "Nova oportunidade"],
    avatarType: "tooth",
  },
  {
    id: "lead-2",
    company: "Restaurante Sabor & Arte",
    contactName: "Ana Paula",
    phone: "(41) 3333-5678",
    email: "contato@saborarte.com.br",
    channel: "maps",
    channelLabel: "Google Maps",
    city: "Curitiba",
    state: "PR",
    address: "Rua XV de Novembro, 890\nCentro, Curitiba - PR, 80020-310",
    score: 88,
    status: "Em contato",
    date: "30/10/2025",
    time: "13:45",
    category: "Restaurante e Gastronomia",
    website: "www.saborarte.com.br",
    description:
      "Culinária contemporânea refinada, atendimento corporativo executivo e adega com rótulos premiados.",
    classification: "Alto potencial",
    tags: ["Google Maps", "Alto potencial", "Gastronomia"],
    avatarType: "restaurant",
  },
  {
    id: "lead-3",
    company: "Academia Evolution",
    contactName: "Ricardo Mendes",
    phone: "(41) 3444-8901",
    email: "ricardo@evolution.com.br",
    channel: "instagram",
    channelLabel: "Instagram",
    city: "São Paulo",
    state: "SP",
    address: "Av. Paulista, 1500\nBela Vista, São Paulo - SP, 01310-100",
    score: 76,
    status: "Oportunidade",
    date: "30/10/2025",
    time: "12:20",
    category: "Fitness e Saúde",
    website: "www.academiaevolution.com.br",
    description:
      "Complexo fitness com musculação de ponta, consultoria esportiva e alta taxa de retenção de membros.",
    classification: "Médio potencial",
    tags: ["Instagram", "Médio potencial", "Fitness"],
    avatarType: "fitness",
  },
  {
    id: "lead-4",
    company: "Clínica Vida Leve",
    contactName: "Juliana Martins",
    phone: "(11) 98877-6655",
    email: "contato@vidaleve.com.br",
    channel: "maps",
    channelLabel: "Google Maps",
    city: "São Paulo",
    state: "SP",
    address: "Rua Oscar Freire, 420\nCerqueira César, São Paulo - SP, 01426-000",
    score: 85,
    status: "Em contato",
    date: "30/10/2025",
    time: "11:18",
    category: "Clínica Médica e Nutrição",
    website: "www.vidaleve.com.br",
    description:
      "Saúde integrativa, tratamentos corporais e emagrecimento sustentável com corpo clínico qualificado.",
    classification: "Alto potencial",
    tags: ["Google Maps", "Alto potencial", "Saúde"],
    avatarType: "leaf",
  },
  {
    id: "lead-5",
    company: "Mendes Advocacia",
    contactName: "Carlos Mendes",
    phone: "(21) 4111-2233",
    email: "contato@mendesadv.com.br",
    channel: "linkedin",
    channelLabel: "LinkedIn",
    city: "Rio de Janeiro",
    state: "RJ",
    address: "Av. Rio Branco, 110\nCentro, Rio de Janeiro - RJ, 20040-001",
    score: 90,
    status: "Proposta",
    date: "30/10/2025",
    time: "10:50",
    category: "Advocacia e Consultoria",
    website: "www.mendesadv.com.br",
    description:
      "Boutique jurídica com foco em direito tributário, societário e contratos corporativos de alto valor.",
    classification: "Alto potencial",
    tags: ["LinkedIn", "Alto potencial", "Jurídico"],
    avatarType: "legal",
  },
  {
    id: "lead-6",
    company: "Costa Arquitetura",
    contactName: "Fernanda Costa",
    phone: "(31) 3666-9878",
    email: "fernanda@costaarq.com.br",
    channel: "youtube",
    channelLabel: "YouTube",
    city: "Belo Horizonte",
    state: "MG",
    address: "Rua da Bahia, 1200\nLourdes, Belo Horizonte - MG, 30160-011",
    score: 68,
    status: "Negociação",
    date: "29/10/2025",
    time: "16:45",
    category: "Arquitetura e Interiores",
    website: "www.costaarq.com.br",
    description:
      "Projetos arquitetônicos residenciais e corporativos de alto padrão com forte apelo visual digital.",
    classification: "Em negociação",
    tags: ["YouTube", "Em negociação", "Arquitetura"],
    avatarType: "architecture",
  },
  {
    id: "lead-7",
    company: "Souza Tecnologia",
    contactName: "Ricardo Souza",
    phone: "(71) 3337-6655",
    email: "contato@souzatec.com.br",
    channel: "tiktok",
    channelLabel: "TikTok",
    city: "Salvador",
    state: "BA",
    address: "Av. Tancredo Neves, 620\nCaminho das Árvores, Salvador - BA, 41820-020",
    score: 72,
    status: "Em contato",
    date: "29/10/2025",
    time: "15:30",
    category: "Tecnologia e Cloud",
    website: "www.souzatec.com.br",
    description:
      "Desenvolvimento de software empresarial, integrações de APIs e soluções digitais modernas.",
    classification: "Médio potencial",
    tags: ["TikTok", "Médio potencial", "Tecnologia"],
    avatarType: "tech",
  },
  {
    id: "lead-8",
    company: "Estética Bem Estar",
    contactName: "Camila Rocha",
    phone: "(11) 3999-8877",
    email: "contato@bemestar.com.br",
    channel: "whatsapp",
    channelLabel: "WhatsApp",
    city: "São Paulo",
    state: "SP",
    address: "Rua Haddock Lobo, 800\nCerqueira César, São Paulo - SP, 01414-000",
    score: 81,
    status: "Oportunidade",
    date: "29/10/2025",
    time: "14:10",
    category: "Estética Avançada",
    website: "www.bemestar.com.br",
    description:
      "Clínica de estética avançada com tratamentos corporais e faciais tecnológicos e equipe multidisciplinar.",
    classification: "Alto potencial",
    tags: ["WhatsApp", "Alto potencial", "Estética"],
    avatarType: "beauty",
  },
  {
    id: "lead-9",
    company: "Auto Center Brasil",
    contactName: "Paulo Henrique",
    phone: "(41) 3555-4433",
    email: "vendas@autocenter.com.br",
    channel: "maps",
    channelLabel: "Google Maps",
    city: "Curitiba",
    state: "PR",
    address: "Linha Verde, 4500\nPrado Velho, Curitiba - PR, 81690-000",
    score: 59,
    status: "Novo",
    date: "29/10/2025",
    time: "12:35",
    category: "Centro Automotivo Multimarcas",
    website: "www.autocenterbrasil.com.br",
    description:
      "Serviços mecânicos completos, diagnóstico eletrônico e manutenção automotiva especializada.",
    classification: "Em qualificação",
    tags: ["Google Maps", "Em qualificação", "Automotivo"],
    avatarType: "auto",
  },
  {
    id: "lead-10",
    company: "Studio Beleza Total",
    contactName: "Mariana Lima",
    phone: "(41) 3777-2211",
    email: "contato@belezatotal.com.br",
    channel: "instagram",
    channelLabel: "Instagram",
    city: "Curitiba",
    state: "PR",
    address: "Av. do Batel, 1550\nBatel, Curitiba - PR, 80420-090",
    score: 77,
    status: "Em contato",
    date: "29/10/2025",
    time: "11:20",
    category: "Salão de Beleza e Visagismo",
    website: "www.belezatotal.com.br",
    description:
      "Salão premium especializado em mechas, visagismo, estética capilar e tratamentos personalizados.",
    classification: "Médio potencial",
    tags: ["Instagram", "Médio potencial", "Beleza"],
    avatarType: "hair",
  },
];
