export interface InfluencerKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  color: "red" | "purple" | "blue" | "teal" | "orange" | "emerald";
  barColor: "orange" | "purple" | "blue" | "emerald" | "amber" | "rose";
  bars: number[];
}

export interface FeaturedAvatarItem {
  id: string;
  name: string;
  role: string;
  categoryBadge: string;
  badgeType: "featured" | "tech" | "lifestyle" | "business" | "beauty" | "corporate";
  imageUrl: string;
  isSelected?: boolean;
  language?: string;
  voiceStyle?: string;
  description?: string;
}

export interface RecentVideoItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  status: "concluido" | "em_processamento";
  thumbnailUrl: string;
  avatarName?: string;
}

export interface AssistantActionItem {
  id: string;
  title: string;
  iconName: string;
  description: string;
}

export interface VideoTemplateItem {
  id: string;
  title: string;
  thumbnailUrl: string;
}

// 6 Indicadores Superiores da Imagem Aprovada
export const INFLUENCERS_KPIS: InfluencerKpiItem[] = [
  {
    id: "videos_gerados",
    label: "Vídeos gerados",
    value: "48",
    change: "32%",
    color: "red",
    barColor: "orange",
    bars: [25, 40, 55, 65, 75, 85, 95, 100],
  },
  {
    id: "avatares_criados",
    label: "Avatares criados",
    value: "12",
    change: "50%",
    color: "purple",
    barColor: "purple",
    bars: [30, 45, 50, 60, 70, 80, 90, 100],
  },
  {
    id: "minutos_video",
    label: "Minutos de vídeo",
    value: "86 min",
    change: "28%",
    color: "blue",
    barColor: "blue",
    bars: [35, 45, 60, 70, 80, 85, 95, 100],
  },
  {
    id: "visualizacoes",
    label: "Visualizações",
    value: "125.4K",
    change: "62%",
    color: "teal",
    barColor: "emerald",
    bars: [25, 35, 50, 65, 75, 80, 90, 100],
  },
  {
    id: "taxa_engajamento",
    label: "Taxa de engajamento",
    value: "8.7K",
    change: "48%",
    color: "orange",
    barColor: "orange",
    bars: [30, 40, 55, 60, 70, 75, 85, 100],
  },
  {
    id: "conversoes",
    label: "Conversões",
    value: "486",
    change: "36%",
    color: "emerald",
    barColor: "rose",
    bars: [35, 45, 55, 70, 80, 85, 95, 100],
  },
];

// 4 Recursos em Destaque do Hero
export const HERO_FEATURES = [
  {
    id: "feat-1",
    title: "Avatares realistas",
    subtitle: "Expressões naturais",
    iconName: "User",
  },
  {
    id: "feat-2",
    title: "Vozes em múltiplos idiomas",
    subtitle: "Mais de 40 idiomas",
    iconName: "Languages",
  },
  {
    id: "feat-3",
    title: "Templates prontos",
    subtitle: "Para todos os nichos",
    iconName: "LayoutTemplate",
  },
  {
    id: "feat-4",
    title: "Vídeos otimizados",
    subtitle: "Para redes sociais e anúncios",
    iconName: "MonitorPlay",
  },
];

// 6 Avatares em Destaque
export const FEATURED_AVATARS: FeaturedAvatarItem[] = [
  {
    id: "avatar-isabella",
    name: "Isabella",
    role: "Apresentadora",
    categoryBadge: "Mais usado",
    badgeType: "featured",
    imageUrl: "/images/hero_influencer_banner.jpg",
    isSelected: true,
    language: "Português (BR), Inglês, Espanhol",
    voiceStyle: "Entusiasmada, Comercial e Empática",
    description: "Ideal para apresentações de produto, vídeos institucionais e anúncios para redes sociais com alta conversão.",
  },
  {
    id: "avatar-lucas",
    name: "Lucas",
    role: "Especialista",
    categoryBadge: "Tecnologia",
    badgeType: "tech",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    language: "Português (BR), Inglês",
    voiceStyle: "Profissional, Confiante e Didático",
    description: "Perfeito para demonstrações de software, análises de mercado e tutoriais técnicos.",
  },
  {
    id: "avatar-mariana",
    name: "Mariana",
    role: "Influencer",
    categoryBadge: "Estilo de vida",
    badgeType: "lifestyle",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
    language: "Português (BR), Espanhol",
    voiceStyle: "Casual, Amigável e Espontânea",
    description: "Excelente para lifestyle, fitness, viagens e conteúdos informais voltados para Instagram e TikTok.",
  },
  {
    id: "avatar-rafael",
    name: "Rafael",
    role: "Empresário",
    categoryBadge: "Negócios",
    badgeType: "business",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    language: "Português (BR), Inglês, Alemão",
    voiceStyle: "Corporativo, Sério e Inspirador",
    description: "Voltado para propostas B2B, consultorias financeiras e palestras corporativas.",
  },
  {
    id: "avatar-camila",
    name: "Camila",
    role: "UGC Creator",
    categoryBadge: "Beleza",
    badgeType: "beauty",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    language: "Português (BR)",
    voiceStyle: "Jovem, Vibrante e Autêntica",
    description: "Especialista em vídeos no formato UGC para cosméticos, moda e reviews de produtos.",
  },
  {
    id: "avatar-bruno",
    name: "Bruno",
    role: "Apresentador",
    categoryBadge: "Corporativo",
    badgeType: "corporate",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    language: "Português (BR), Inglês",
    voiceStyle: "Formal, Claro e Articulado",
    description: "Recomendado para telejornais corporativos, treinamentos internos e lançamentos de marcas consolidadas.",
  },
];

// 6 Últimos Vídeos da Biblioteca
export const RECENT_VIDEOS: RecentVideoItem[] = [
  {
    id: "video-1",
    title: "Apresentação de Produto",
    date: "12 de Ago, 2024",
    duration: "00:28",
    status: "concluido",
    thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    avatarName: "Isabella",
  },
  {
    id: "video-2",
    title: "Anúncio Instagram",
    date: "10 de Ago, 2024",
    duration: "00:32",
    status: "concluido",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    avatarName: "Lucas",
  },
  {
    id: "video-3",
    title: "Depoimento UGC",
    date: "08 de Ago, 2024",
    duration: "00:45",
    status: "concluido",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    avatarName: "Mariana",
  },
  {
    id: "video-4",
    title: "Promoção de Serviço",
    date: "06 de Ago, 2024",
    duration: "00:30",
    status: "em_processamento",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    avatarName: "Rafael",
  },
  {
    id: "video-5",
    title: "Lançamento de Curso",
    date: "04 de Ago, 2024",
    duration: "00:38",
    status: "concluido",
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    avatarName: "Camila",
  },
  {
    id: "video-6",
    title: "Dicas e Tutorial",
    date: "02 de Ago, 2024",
    duration: "00:52",
    status: "concluido",
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    avatarName: "Bruno",
  },
];

// 7 Ações do Assistente de Avatares com IA
export const ASSISTANT_AVATAR_ACTIONS: AssistantActionItem[] = [
  {
    id: "act-criar-video",
    title: "Criar vídeo com avatar",
    iconName: "Clapperboard",
    description: "Inicie uma produção rápida escolhendo um avatar e definindo seu roteiro.",
  },
  {
    id: "act-sugerir-roteiros",
    title: "Sugerir roteiros para meu produto",
    iconName: "Lightbulb",
    description: "A IA elabora copies persuasivas no modelo AIDA para sua oferta.",
  },
  {
    id: "act-escolher-avatar",
    title: "Escolher o melhor avatar",
    iconName: "UserCheck",
    description: "Encontre o perfil demográfico e tom de voz ideal para o seu público.",
  },
  {
    id: "act-adaptar-redes",
    title: "Adaptar vídeo para cada rede social",
    iconName: "Smartphone",
    description: "Formate proporções 9:16 para Reels/TikTok e 16:9 para YouTube.",
  },
  {
    id: "act-variacoes",
    title: "Criar variações de um vídeo",
    iconName: "RefreshCw",
    description: "Gere testes A/B com ganchos iniciais e chamadas para ação diferentes.",
  },
  {
    id: "act-traduzir-dublar",
    title: "Traduzir e dublar vídeo",
    iconName: "Globe",
    description: "Sincronize lábios e expanda seus vídeos para inglês, espanhol e outros 40 idiomas.",
  },
  {
    id: "act-melhorar-roteiro",
    title: "Melhorar roteiro com IA",
    iconName: "Sparkles",
    description: "Otimize retenção, ritmo e poder de conversão da sua narrativa.",
  },
];

// 4 Ações Rápidas
export const QUICK_ACTIONS = [
  {
    id: "qa-criar-avatar",
    title: "Criar novo avatar",
    iconName: "UserPlus",
    isPrimary: true,
  },
  {
    id: "qa-gerar-ugc",
    title: "Gerar vídeo UGC",
    iconName: "Video",
    isPrimary: false,
  },
  {
    id: "qa-usar-template",
    title: "Usar template",
    iconName: "LayoutTemplate",
    isPrimary: false,
  },
  {
    id: "qa-importar-roteiro",
    title: "Importar roteiro",
    iconName: "FileText",
    isPrimary: false,
  },
];

// 4 Templates de Vídeos
export const VIDEO_TEMPLATES: VideoTemplateItem[] = [
  {
    id: "tmpl-1",
    title: "Apresentação de Produto",
    thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "tmpl-2",
    title: "Depoimento UGC",
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "tmpl-3",
    title: "Oferta e Promoção",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "tmpl-4",
    title: "Tutorial e Dicas",
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
];
