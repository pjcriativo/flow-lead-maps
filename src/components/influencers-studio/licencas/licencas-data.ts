export interface LicencaKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  subtitle?: string;
  iconName: "users" | "licensed" | "activeLicenses" | "renewal" | "commercial";
  iconColor: string;
  iconBg: string;
  barColor: "orange" | "purple" | "blue" | "amber" | "emerald";
  bars: number[];
}

export interface InfluencerLicenciadoItem {
  id: string;
  name: string;
  role: string;
  niche: string;
  type: "meu_avatar" | "licenciado";
  typeLabel: "Meu avatar" | "Licenciado";
  language: string;
  ageRange: string;
  gender: string;
  voiceTone: string;
  authorizedChannels: string[];
  formats: string;
  specialties: string[];
  tags: string[];
  imageUrl: string;
  videoPreviewUrl?: string;
  description: string;
  licenseStatus: "ativa" | "renovacao_breve" | "expirada" | "suspensa";
  licenseStatusLabel: string;
  licenseStatusDays?: string; // ex: "Renovação em 15 dias", "Expira em 12 dias"
  licenseDetails: {
    holder: string;
    licensee: string;
    type: string;
    startDate: string;
    renewalDate: string;
    daysRemaining: number;
    usageLimit: string;
    territory: string;
    exclusivity: boolean;
    contractRef: string;
  };
  stats?: {
    videosProduced: number;
    minutesRendered: number;
    projectsCount: number;
    creditsUsed: number;
  };
  associatedContents?: {
    title: string;
    date: string;
    channel: string;
    format: string;
    duration: string;
    thumbnailUrl: string;
  }[];
}

// 5 Cards de Indicadores do Topo
export const LICENCAS_KPIS: LicencaKpiItem[] = [
  {
    id: "meus_avatares",
    label: "Meus Avatares",
    value: "12",
    change: "50%",
    trend: "up",
    iconName: "users",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/15 border-rose-500/30",
    barColor: "orange",
    bars: [25, 40, 55, 68, 82, 100],
  },
  {
    id: "influencers_licenciados",
    label: "Influencers Licenciados",
    value: "8",
    change: "14%",
    trend: "up",
    iconName: "licensed",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15 border-purple-500/30",
    barColor: "purple",
    bars: [30, 45, 60, 75, 88, 100],
  },
  {
    id: "licencas_ativas",
    label: "Licenças Ativas",
    value: "17",
    change: "31%",
    trend: "up",
    iconName: "activeLicenses",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/15 border-sky-500/30",
    barColor: "blue",
    bars: [20, 35, 50, 68, 85, 100],
  },
  {
    id: "renovacao_breve",
    label: "Renovação em breve",
    value: "3",
    change: "25%",
    trend: "down",
    iconName: "renewal",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15 border-amber-500/30",
    barColor: "amber",
    bars: [80, 65, 55, 40, 30, 20],
  },
  {
    id: "uso_comercial",
    label: "Uso Comercial",
    value: "100%",
    change: "Tudo em conformidade",
    trend: "neutral",
    iconName: "commercial",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    barColor: "emerald",
    bars: [35, 50, 65, 80, 92, 100],
  },
];

// Abas de categoria da barra
export const LICENCAS_TABS = [
  { id: "meus_avatares", label: "Meus Avatares", count: 12 },
  { id: "licencas_contratos", label: "Licenças e Contratos", count: 17 },
  { id: "favoritos", label: "Influencers Favoritos", count: 8 },
  { id: "historico", label: "Histórico de Uso" },
  { id: "renovacoes", label: "Renovações", count: 3 },
];

// 8 Influencers da Grid Principal
export const MEUS_INFLUENCERS_MOCK: InfluencerLicenciadoItem[] = [
  {
    id: "inf-isabella",
    name: "Isabella",
    role: "Apresentadora e Criadora Virtual",
    niche: "Lifestyle | Beleza",
    type: "meu_avatar",
    typeLabel: "Meu avatar",
    language: "Português (BR)",
    ageRange: "25 - 34 anos",
    gender: "Feminino",
    voiceTone: "Natural e amigável",
    authorizedChannels: ["instagram", "tiktok", "web"],
    formats: "Vertical, Quadrado, Horizontal",
    specialties: ["UGC", "Review", "Anúncios", "Tutoriais"],
    tags: ["Lifestyle", "Beleza", "UGC", "Reels", "Anúncios"],
    imageUrl: "/images/hero_influencer_banner.jpg",
    description: "Influencer virtual especialista em beleza, lifestyle e produtos do dia a dia.",
    licenseStatus: "ativa",
    licenseStatusLabel: "Licença ativa",
    licenseDetails: {
      holder: "Bella Vita Cosméticos",
      licensee: "Minha Organização (Carlos Mendes)",
      type: "Uso comercial exclusivo",
      startDate: "12 de Ago, 2024",
      renewalDate: "12 de Ago, 2025",
      daysRemaining: 320,
      usageLimit: "Ilimitado",
      territory: "Global",
      exclusivity: true,
      contractRef: "CTR-2024-ISAB-001",
    },
    stats: {
      videosProduced: 18,
      minutesRendered: 34,
      projectsCount: 14,
      creditsUsed: 540,
    },
    associatedContents: [
      {
        title: "Anúncio Shampoo Natural",
        date: "12 de Ago, 2024",
        channel: "Instagram Reels",
        format: "Vertical (9:16)",
        duration: "00:32",
        thumbnailUrl: "/images/hero_influencer_banner.jpg",
      },
      {
        title: "Depoimento Pele Renovada",
        date: "05 de Ago, 2024",
        channel: "TikTok",
        format: "Vertical (9:16)",
        duration: "00:28",
        thumbnailUrl: "/images/hero_influencer_banner.jpg",
      },
    ],
  },
  {
    id: "inf-lucas",
    name: "Lucas",
    role: "Especialista em Tecnologia e Negócios",
    niche: "Negócios | Tecnologia",
    type: "licenciado",
    typeLabel: "Licenciado",
    language: "Português",
    ageRange: "25 - 34",
    gender: "Masculino",
    voiceTone: "Profissional e didático",
    authorizedChannels: ["youtube", "linkedin", "instagram"],
    formats: "Horizontal, Vertical",
    specialties: ["Anúncios", "Review", "Tutoriais"],
    tags: ["Anúncios", "Review", "Tutoriais"],
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    description: "Apresentador corporativo ideal para análises de software, SaaS e treinamentos.",
    licenseStatus: "ativa",
    licenseStatusLabel: "Licença ativa",
    licenseDetails: {
      holder: "Flow AI Studios",
      licensee: "Minha Organização",
      type: "Uso comercial corporativo",
      startDate: "01 de Jun, 2024",
      renewalDate: "01 de Jun, 2025",
      daysRemaining: 232,
      usageLimit: "60 minutos/mês",
      territory: "América Latina",
      exclusivity: false,
      contractRef: "CTR-2024-LUC-042",
    },
    stats: {
      videosProduced: 12,
      minutesRendered: 26,
      projectsCount: 8,
      creditsUsed: 380,
    },
  },
  {
    id: "inf-mariana",
    name: "Mariana",
    role: "Criadora de Conteúdo e Saúde",
    niche: "Saúde e Bem-estar",
    type: "meu_avatar",
    typeLabel: "Meu avatar",
    language: "Português",
    ageRange: "25 - 34",
    gender: "Feminino",
    voiceTone: "Enérgica e empática",
    authorizedChannels: ["instagram", "tiktok"],
    formats: "Vertical (9:16)",
    specialties: ["UGC", "Depoimentos", "Lives"],
    tags: ["UGC", "Depoimentos", "Lives"],
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
    description: "Comunicação espontânea voltada para fitness, suplementação e estilo de vida saudável.",
    licenseStatus: "ativa",
    licenseStatusLabel: "Licença ativa",
    licenseDetails: {
      holder: "Minha Organização",
      licensee: "Minha Organização",
      type: "Avatar proprietário",
      startDate: "15 de Mai, 2024",
      renewalDate: "Indeterminado",
      daysRemaining: 365,
      usageLimit: "Ilimitado",
      territory: "Global",
      exclusivity: true,
      contractRef: "AVT-PROP-MAR-007",
    },
    stats: {
      videosProduced: 15,
      minutesRendered: 29,
      projectsCount: 11,
      creditsUsed: 420,
    },
  },
  {
    id: "inf-rafael",
    name: "Rafael",
    role: "Consultor de Investimentos e B2B",
    niche: "Finanças | Investimentos",
    type: "licenciado",
    typeLabel: "Licenciado",
    language: "Português",
    ageRange: "30 - 40",
    gender: "Masculino",
    voiceTone: "Sério e inspirador",
    authorizedChannels: ["youtube", "linkedin"],
    formats: "Horizontal, Quadrado",
    specialties: ["Tutoriais", "Anúncios", "YouTube"],
    tags: ["Tutoriais", "Anúncios", "YouTube"],
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    description: "Excelente credibilidade para produtos financeiros, imobiliários e negócios de alto valor.",
    licenseStatus: "renovacao_breve",
    licenseStatusLabel: "Renovação em 15 dias",
    licenseStatusDays: "Renovação em 15 dias",
    licenseDetails: {
      holder: "Flow Business Models",
      licensee: "Minha Organização",
      type: "Licença Trimestral B2B",
      startDate: "28 de Jul, 2024",
      renewalDate: "28 de Out, 2024",
      daysRemaining: 15,
      usageLimit: "30 minutos/trimestre",
      territory: "Brasil",
      exclusivity: false,
      contractRef: "CTR-2024-RAF-109",
    },
    stats: {
      videosProduced: 7,
      minutesRendered: 19,
      projectsCount: 5,
      creditsUsed: 210,
    },
  },
  {
    id: "inf-fernanda",
    name: "Fernanda",
    role: "Mentora de Carreira e Educadora",
    niche: "Educação | Carreira",
    type: "meu_avatar",
    typeLabel: "Meu avatar",
    language: "Português",
    ageRange: "25 - 34",
    gender: "Feminino",
    voiceTone: "Inspiradora e didática",
    authorizedChannels: ["instagram", "youtube", "tiktok"],
    formats: "Vertical, Horizontal",
    specialties: ["Reels", "Tutoriais", "Anúncios"],
    tags: ["Reels", "Tutoriais", "Anúncios"],
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    description: "Apresentação acadêmica e de desenvolvimento pessoal com alta taxa de retenção.",
    licenseStatus: "ativa",
    licenseStatusLabel: "Licença ativa",
    licenseDetails: {
      holder: "Minha Organização",
      licensee: "Minha Organização",
      type: "Avatar proprietário exclusivo",
      startDate: "10 de Jul, 2024",
      renewalDate: "Indeterminado",
      daysRemaining: 365,
      usageLimit: "Ilimitado",
      territory: "Global",
      exclusivity: true,
      contractRef: "AVT-PROP-FER-023",
    },
    stats: {
      videosProduced: 9,
      minutesRendered: 22,
      projectsCount: 6,
      creditsUsed: 290,
    },
  },
  {
    id: "inf-mateus",
    name: "Mateus",
    role: "Criador de Moda e Tendências",
    niche: "Moda Masculina",
    type: "licenciado",
    typeLabel: "Licenciado",
    language: "Português",
    ageRange: "25 - 34",
    gender: "Masculino",
    voiceTone: "Moderno e informal",
    authorizedChannels: ["instagram", "tiktok"],
    formats: "Vertical (9:16)",
    specialties: ["UGC", "Reels", "Estilo de Vida"],
    tags: ["UGC", "Reels", "Estilo de Vida"],
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80",
    description: "Estilo urbano para campanhas de vestuário, acessórios masculinos e calçados.",
    licenseStatus: "renovacao_breve",
    licenseStatusLabel: "Expira em 12 dias",
    licenseStatusDays: "Expira em 12 dias",
    licenseDetails: {
      holder: "Urban Creators Media",
      licensee: "Minha Organização",
      type: "Licença Comercial Campanhas",
      startDate: "25 de Jul, 2024",
      renewalDate: "25 de Out, 2024",
      daysRemaining: 12,
      usageLimit: "20 vídeos",
      territory: "Brasil e Portugal",
      exclusivity: false,
      contractRef: "CTR-2024-MAT-088",
    },
    stats: {
      videosProduced: 8,
      minutesRendered: 14,
      projectsCount: 6,
      creditsUsed: 195,
    },
  },
  {
    id: "inf-juliana",
    name: "Juliana",
    role: "Influencer de Viagens e Experiências",
    niche: "Viagens | Lifestyle",
    type: "meu_avatar",
    typeLabel: "Meu avatar",
    language: "Português",
    ageRange: "25 - 34",
    gender: "Feminino",
    voiceTone: "Acolhedora e vibrante",
    authorizedChannels: ["instagram", "reels", "tiktok"],
    formats: "Vertical (9:16)",
    specialties: ["Reels", "Anúncios", "Depoimentos"],
    tags: ["Reels", "Anúncios", "Depoimentos"],
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    description: "Narrativas visuais para hotelaria, turismo e produtos voltados para experiências ao ar livre.",
    licenseStatus: "ativa",
    licenseStatusLabel: "Licença ativa",
    licenseDetails: {
      holder: "Minha Organização",
      licensee: "Minha Organização",
      type: "Avatar proprietário exclusivo",
      startDate: "02 de Ago, 2024",
      renewalDate: "Indeterminado",
      daysRemaining: 365,
      usageLimit: "Ilimitado",
      territory: "Global",
      exclusivity: true,
      contractRef: "AVT-PROP-JUL-015",
    },
    stats: {
      videosProduced: 11,
      minutesRendered: 24,
      projectsCount: 8,
      creditsUsed: 310,
    },
  },
  {
    id: "inf-thiago",
    name: "Thiago",
    role: "Chef e Creator Gastronômico",
    niche: "Gastronomia",
    type: "licenciado",
    typeLabel: "Licenciado",
    language: "Português",
    ageRange: "25 - 34",
    gender: "Masculino",
    voiceTone: "Entusiasmado e articulado",
    authorizedChannels: ["youtube", "instagram", "tiktok"],
    formats: "Vertical, Horizontal",
    specialties: ["Receitas", "Review", "YouTube"],
    tags: ["Receitas", "Review", "YouTube"],
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    description: "Criação de receitas, apresentação de restaurantes e avaliações de alimentos e bebidas.",
    licenseStatus: "ativa",
    licenseStatusLabel: "Licença ativa",
    licenseDetails: {
      holder: "Food Creators Hub",
      licensee: "Minha Organização",
      type: "Licença Comercial Semestral",
      startDate: "10 de Jun, 2024",
      renewalDate: "10 de Dez, 2024",
      daysRemaining: 58,
      usageLimit: "45 minutos/mês",
      territory: "América do Sul",
      exclusivity: false,
      contractRef: "CTR-2024-THI-204",
    },
    stats: {
      videosProduced: 6,
      minutesRendered: 18,
      projectsCount: 4,
      creditsUsed: 220,
    },
  },
];
