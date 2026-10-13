export interface PlatformModelItem {
  id: string;
  name: string;
  category: string;
  categoryColor: "orange" | "blue" | "purple" | "cyan" | "pink" | "emerald" | "amber" | "indigo";
  imageUrl: string;
  gender: "Feminino" | "Masculino";
  ageRange: string;
  ethnicity: string;
  bodyType: string;
}

export interface HairStyleOption {
  id: string;
  label: string;
  imageUrl: string;
}

export interface EyeColorOption {
  id: string;
  label: string;
  imageUrl: string;
}

export interface FacialExpressionOption {
  id: string;
  label: string;
  imageUrl: string;
}

export interface VariationGalleryItem {
  id: string;
  label: string;
  imageUrl: string;
}

// 12 Modelos da plataforma exatamente como na referência aprovada
export const PLATFORM_MODELS: PlatformModelItem[] = [
  {
    id: "sofia",
    name: "Sofia",
    category: "Lifestyle",
    categoryColor: "orange",
    imageUrl: "/images/hero_influencer_banner.jpg",
    gender: "Feminino",
    ageRange: "25-34 anos",
    ethnicity: "Branca",
    bodyType: "Esbelta",
  },
  {
    id: "lucas",
    name: "Lucas",
    category: "Negócios",
    categoryColor: "blue",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    gender: "Masculino",
    ageRange: "25-34 anos",
    ethnicity: "Branca",
    bodyType: "Atlético",
  },
  {
    id: "mariana",
    name: "Mariana",
    category: "Moda",
    categoryColor: "purple",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    gender: "Feminino",
    ageRange: "25-34 anos",
    ethnicity: "Branca",
    bodyType: "Esbelta",
  },
  {
    id: "rafael",
    name: "Rafael",
    category: "Tecnologia",
    categoryColor: "cyan",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    gender: "Masculino",
    ageRange: "30-40 anos",
    ethnicity: "Branca",
    bodyType: "Médio",
  },
  {
    id: "camila",
    name: "Camila",
    category: "Beleza",
    categoryColor: "pink",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    gender: "Feminino",
    ageRange: "25-34 anos",
    ethnicity: "Latina",
    bodyType: "Esbelta",
  },
  {
    id: "bruno",
    name: "Bruno",
    category: "Saúde",
    categoryColor: "emerald",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
    gender: "Masculino",
    ageRange: "25-34 anos",
    ethnicity: "Branca",
    bodyType: "Atlético",
  },
  {
    id: "juliana",
    name: "Juliana",
    category: "Viagens",
    categoryColor: "amber",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
    gender: "Feminino",
    ageRange: "25-34 anos",
    ethnicity: "Branca",
    bodyType: "Esbelta",
  },
  {
    id: "mateus",
    name: "Mateus",
    category: "Corporativo",
    categoryColor: "indigo",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80",
    gender: "Masculino",
    ageRange: "30-40 anos",
    ethnicity: "Branca",
    bodyType: "Médio",
  },
  {
    id: "isabella",
    name: "Isabella",
    category: "UGC",
    categoryColor: "pink",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    gender: "Feminino",
    ageRange: "25-34 anos",
    ethnicity: "Latina",
    bodyType: "Esbelta",
  },
  {
    id: "caio",
    name: "Caio",
    category: "Esportes",
    categoryColor: "blue",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
    gender: "Masculino",
    ageRange: "20-29 anos",
    ethnicity: "Branca",
    bodyType: "Atlético",
  },
  {
    id: "fernanda",
    name: "Fernanda",
    category: "Educação",
    categoryColor: "emerald",
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80",
    gender: "Feminino",
    ageRange: "25-34 anos",
    ethnicity: "Branca",
    bodyType: "Médio",
  },
  {
    id: "thiago",
    name: "Thiago",
    category: "Gastronomia",
    categoryColor: "amber",
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&auto=format&fit=crop&q=80",
    gender: "Masculino",
    ageRange: "30-40 anos",
    ethnicity: "Branca",
    bodyType: "Médio",
  },
];

// 6 Tons de pele da referência
export const SKIN_TONES = [
  { id: "skin-1", hex: "#F7D1BA", label: "Claro porcelana" },
  { id: "skin-2", hex: "#E8B298", label: "Claro quente" },
  { id: "skin-3", hex: "#D69777", label: "Médio natural" },
  { id: "skin-4", hex: "#B57B58", label: "Moreno oliva" },
  { id: "skin-5", hex: "#8A5436", label: "Bronzeado escuro" },
  { id: "skin-6", hex: "#543322", label: "Escuro profundo" },
];

// 5 Opções de Cabelo da referência
export const HAIR_OPTIONS: HairStyleOption[] = [
  {
    id: "hair-1",
    label: "Castanho longo ondulado",
    imageUrl: "/images/hero_influencer_banner.jpg",
  },
  {
    id: "hair-2",
    label: "Castanho liso médio",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "hair-3",
    label: "Moreno escuro longo",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "hair-4",
    label: "Loiro iluminado",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "hair-5",
    label: "Castanho moderno",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
  },
];

// 5 Opções de Olhos com close-up fotográfico
export const EYE_OPTIONS: EyeColorOption[] = [
  {
    id: "eye-1",
    label: "Verde acinzentado",
    imageUrl: "https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "eye-2",
    label: "Castanho profundo",
    imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "eye-3",
    label: "Castanho mel",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "eye-4",
    label: "Castanho amêndoa",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
  },
  {
    id: "eye-5",
    label: "Castanho escuro",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
  },
];

// 6 Expressões faciais
export const FACIAL_EXPRESSIONS: FacialExpressionOption[] = [
  {
    id: "normal",
    label: "Normal",
    imageUrl: "/images/hero_influencer_banner.jpg",
  },
  {
    id: "sorriso",
    label: "Sorriso",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "seria",
    label: "Séria",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "animada",
    label: "Animada",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "surpresa",
    label: "Surpresa",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "pensativa",
    label: "Pensativa",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
  },
];

// 4 Variações para a galeria inferior de prévia
export const SOFIA_VARIATIONS: VariationGalleryItem[] = [
  {
    id: "var-1",
    label: "Retrato principal",
    imageUrl: "/images/hero_influencer_banner.jpg",
  },
  {
    id: "var-2",
    label: "Ângulo estúdio",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "var-3",
    label: "Luz natural",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "var-4",
    label: "Close comercial",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
  },
];

// Etapas do Stepper
export const CREATOR_STEPS = [
  {
    number: 1,
    title: "Aparência",
    subtitle: "Defina o visual do seu avatar",
  },
  {
    number: 2,
    title: "Voz e Idioma",
    subtitle: "Escolha a voz e o idioma",
  },
  {
    number: 3,
    title: "Personalidade",
    subtitle: "Configure o comportamento",
  },
  {
    number: 4,
    title: "Estilo e Cenários",
    subtitle: "Defina estilos e cenários",
  },
  {
    number: 5,
    title: "Revisão e Criação",
    subtitle: "Revise e gere seu avatar",
  },
];
