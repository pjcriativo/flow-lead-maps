export interface UgcProductItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  price?: string;
}

export interface UgcObjectiveItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: "anuncio" | "review" | "tutorial" | "depoimento" | "institucional" | "outro";
}

export interface UgcAvatarItem {
  id: string;
  name: string;
  badge: string;
  category: string;
  language: string;
  age: string;
  imageUrl: string;
}

export interface UgcSceneItem {
  id: string;
  sceneNumber: number;
  timeRange: string;
  title: string;
  text: string;
  imageUrl: string;
}

export interface UgcDurationOption {
  id: string;
  duration: string;
  tag: string;
  seconds: number;
}

// 5 Produtos da referência aprovada
export const UGC_PRODUCTS: UgcProductItem[] = [
  {
    id: "prod-curso-mkt",
    name: "Curso de Marketing Digital",
    category: "Curso online",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80",
    description: "Treinamento completo do zero ao avançado para captação de clientes.",
    price: "R$ 497",
  },
  {
    id: "prod-consultoria",
    name: "Consultoria Empresarial",
    category: "Serviço",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&auto=format&fit=crop&q=80",
    description: "Diagnóstico e plano estratégico para acelerar o crescimento do seu negócio.",
    price: "R$ 2.500",
  },
  {
    id: "prod-ebook",
    name: "E-book Produtividade",
    category: "E-book",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
    description: "Métodos comprovados para triplicar seu foco e entregas diárias.",
    price: "R$ 47",
  },
  {
    id: "prod-mentoria",
    name: "Mentoria Individual",
    category: "Serviço",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    description: "Sessões 1 a 1 para estruturação comercial e posicionamento de marca.",
    price: "R$ 1.800",
  },
  {
    id: "prod-templates",
    name: "Pack de Templates",
    category: "Template",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&auto=format&fit=crop&q=80",
    description: "Mais de 100 templates prontos para redes sociais e apresentações comerciais.",
    price: "R$ 97",
  },
];

// 6 Objetivos de vídeo
export const UGC_OBJECTIVES: UgcObjectiveItem[] = [
  {
    id: "anuncio",
    title: "Anúncio",
    subtitle: "Vender produto ou serviço",
    iconType: "anuncio",
  },
  {
    id: "review",
    title: "Review",
    subtitle: "Avaliar e recomendar",
    iconType: "review",
  },
  {
    id: "tutorial",
    title: "Tutorial",
    subtitle: "Ensinar como usar",
    iconType: "tutorial",
  },
  {
    id: "depoimento",
    title: "Depoimento",
    subtitle: "Prova social",
    iconType: "depoimento",
  },
  {
    id: "institucional",
    title: "Institucional",
    subtitle: "Apresentar a marca",
    iconType: "institucional",
  },
  {
    id: "outro",
    title: "Outro",
    subtitle: "Personalizado",
    iconType: "outro",
  },
];

// 4 Opções de Duração
export const UGC_DURATIONS: UgcDurationOption[] = [
  {
    id: "15s",
    duration: "15 segundos",
    tag: "Reels e Stories",
    seconds: 15,
  },
  {
    id: "30s",
    duration: "30 segundos",
    tag: "Recomendado",
    seconds: 30,
  },
  {
    id: "60s",
    duration: "60 segundos",
    tag: "Vídeo completo",
    seconds: 60,
  },
  {
    id: "custom",
    duration: "Personalizado",
    tag: "Definir tempo",
    seconds: 45,
  },
];

// Avatares de destaque na coluna 3
export const UGC_AVATARS: UgcAvatarItem[] = [
  {
    id: "isabella",
    name: "Isabella",
    badge: "Premium",
    category: "Lifestyle e Beleza",
    language: "Português",
    age: "25-34 anos",
    imageUrl: "/images/hero_influencer_banner.jpg",
  },
  {
    id: "lucas",
    name: "Lucas",
    badge: "Oficial",
    category: "Negócios & Finanças",
    language: "Português",
    age: "25-34 anos",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "mariana",
    name: "Mariana",
    badge: "Top Creator",
    category: "Saúde & Bem-estar",
    language: "Português",
    age: "25-34 anos",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "rafael",
    name: "Rafael",
    badge: "Premium",
    category: "Tecnologia & Inovação",
    language: "Português",
    age: "30-40 anos",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
];

// Estilos visuais da coluna 4
export const UGC_VISUAL_STYLES = [
  {
    id: "natural",
    label: "Natural",
    imageUrl: "/images/hero_influencer_banner.jpg",
  },
  {
    id: "profissional",
    label: "Profissional",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "casual",
    label: "Casual",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "criativo",
    label: "Criativo",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
  },
];

// Cenários da coluna 4
export const UGC_SCENARIOS = [
  {
    id: "interno",
    label: "Interno",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "externo",
    label: "Externo",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "estudio",
    label: "Estúdio",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "personalizado",
    label: "Personalizado",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&auto=format&fit=crop&q=80",
  },
];

// 5 Cenas do Storyboard da referência
export const UGC_SCENES: UgcSceneItem[] = [
  {
    id: "scene-1",
    sceneNumber: 1,
    timeRange: "0:00 - 0:05",
    title: "Apresentação",
    text: "Olá! Eu sou a Isabella e vim te mostrar como virar o jogo...",
    imageUrl: "/images/hero_influencer_banner.jpg",
  },
  {
    id: "scene-2",
    sceneNumber: 2,
    timeRange: "0:05 - 0:10",
    title: "Problema",
    text: "Você quer crescer no digital, mas sente que não tem tempo ou estratégia?",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "scene-3",
    sceneNumber: 3,
    timeRange: "0:10 - 0:20",
    title: "Solução",
    text: "Com o nosso curso você vai aprender o passo a passo validado do marketing.",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "scene-4",
    sceneNumber: 4,
    timeRange: "0:20 - 0:25",
    title: "Benefícios",
    text: "Resultados reais e práticos aplicáveis para produtos e serviços.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "scene-5",
    sceneNumber: 5,
    timeRange: "0:25 - 0:30",
    title: "CTA",
    text: "Clique no link e garanta sua vaga agora mesmo com condições exclusivas!",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
  },
];

// 5 Etapas do Stepper
export const UGC_STEPS = [
  {
    number: 1,
    title: "Produto e Objetivo",
    subtitle: "Escolha o produto e o tipo de vídeo",
  },
  {
    number: 2,
    title: "Roteiro e Texto",
    subtitle: "Defina o roteiro com IA",
  },
  {
    number: 3,
    title: "Avatar e Voz",
    subtitle: "Selecione o avatar e a voz",
  },
  {
    number: 4,
    title: "Estilo e Formato",
    subtitle: "Configure o visual do vídeo",
  },
  {
    number: 5,
    title: "Revisão e Geração",
    subtitle: "Revise e gere seu vídeo",
  },
];
