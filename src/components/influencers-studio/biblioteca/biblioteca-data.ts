export interface NicheCategoryItem {
  id: string;
  label: string;
  count: string;
  imageUrl?: string;
  isAll?: boolean;
}

export interface InfluencerCatalogItem {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  badge?: {
    text: string;
    variant: "pink" | "emerald" | "purple";
  };
  language: string;
  ageRange: string;
  tags: string[];
  status: "disponivel" | "ocupado";
  bio?: string;
  gender?: string;
  sampleVideos?: {
    title: string;
    duration: string;
    thumbnailUrl: string;
  }[];
}

export const NICHE_CATEGORIES: NicheCategoryItem[] = [
  {
    id: "todos",
    label: "Todos",
    count: "128 influencers",
    isAll: true,
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    count: "24 influencers",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "negocios",
    label: "Negócios",
    count: "18 influencers",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "saude",
    label: "Saúde e Bem-estar",
    count: "16 influencers",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "beleza",
    label: "Beleza e Moda",
    count: "18 influencers",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "tecnologia",
    label: "Tecnologia",
    count: "12 influencers",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "educacao",
    label: "Educação",
    count: "10 influencers",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "gastronomia",
    label: "Gastronomia",
    count: "10 influencers",
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "viagens",
    label: "Viagens",
    count: "8 influencers",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "esportes",
    label: "Esportes",
    count: "6 influencers",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
  },
];

export const INFLUENCERS_CATALOG: InfluencerCatalogItem[] = [
  {
    id: "isabella",
    name: "Isabella",
    role: "Lifestyle e Beleza",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    badge: {
      text: "Mais usado",
      variant: "pink",
    },
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Redes Sociais"],
    status: "disponivel",
    gender: "Feminino",
    bio: "Influencer virtual especialista em beleza, lifestyle e produtos do dia a dia. Ideal para UGC, reviews e demonstrações de produtos.",
    sampleVideos: [
      {
        title: "Review de Produto",
        duration: "00:32",
        thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
      },
      {
        title: "Rotina de Beleza",
        duration: "00:28",
        thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      },
      {
        title: "Dicas de Skincare",
        duration: "00:45",
        thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    id: "lucas",
    name: "Lucas",
    role: "Tecnologia e Negócios",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    badge: {
      text: "Novo",
      variant: "emerald",
    },
    language: "Português",
    ageRange: "25-34",
    tags: ["Apresentação", "Tutoriais"],
    status: "disponivel",
    gender: "Masculino",
    bio: "Especialista em softwares, inovação e finanças modernas. Comunicação clara, direta e orientada a conversão.",
  },
  {
    id: "mariana",
    name: "Mariana",
    role: "Saúde e Bem-estar",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
    badge: {
      text: "Em alta",
      variant: "purple",
    },
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Depoimentos"],
    status: "disponivel",
    gender: "Feminino",
    bio: "Presença acolhedora e motivacional voltada para saúde preventiva, nutrição e bem-estar físico e mental.",
  },
  {
    id: "rafael",
    name: "Rafael",
    role: "Negócios e Finanças",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "30-40",
    tags: ["Apresentação", "Comercial"],
    status: "disponivel",
    gender: "Masculino",
    bio: "Consultor corporativo voltado para campanhas B2B, pitch decks, propostas financeiras e investimentos.",
  },
  {
    id: "camila",
    name: "Camila",
    role: "Moda e Lifestyle",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Reviews"],
    status: "disponivel",
    gender: "Feminino",
    bio: "Criadora de conteúdo fashionista para marcas de roupas, calçados e cosméticos de alto padrão.",
  },
  {
    id: "bruno",
    name: "Bruno",
    role: "Esportes e Saúde",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Motivacional"],
    status: "disponivel",
    gender: "Masculino",
    bio: "Treinador e influencer fitness para marcas de suplementos, academias e vestuário esportivo.",
  },
  {
    id: "fernanda",
    name: "Fernanda",
    role: "Educação e Carreira",
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "25-34",
    tags: ["Tutoriais", "Explicativo"],
    status: "disponivel",
    gender: "Feminino",
    bio: "Didática impecável para cursos online, mentorias, transição de carreira e capacitação corporativa.",
  },
  {
    id: "thiago",
    name: "Thiago",
    role: "Gastronomia",
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Receitas"],
    status: "disponivel",
    gender: "Masculino",
    bio: "Chef e entusiasta da culinária para restaurantes, franquias de alimentos e utensílios gourmet.",
  },
  {
    id: "juliana",
    name: "Juliana",
    role: "Viagens e Lifestyle",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Experiências"],
    status: "disponivel",
    gender: "Feminino",
    bio: "Especialista em turismo, hotelaria e experiências inesquecíveis para resorts e agências de viagem.",
  },
  {
    id: "mateus",
    name: "Mateus",
    role: "Moda Masculina",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    language: "Português",
    ageRange: "25-34",
    tags: ["UGC", "Estilo de Vida"],
    status: "disponivel",
    gender: "Masculino",
    bio: "Elegância e atitude para vestuário masculino, relógios, barbearias e lifestyle urbano.",
  },
];
