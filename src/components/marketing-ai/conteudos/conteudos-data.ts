export type CanalPlataforma =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "whatsapp";

export type FormatoConteudo =
  | "post_simples"
  | "carrossel"
  | "reels_shorts"
  | "video_completo"
  | "story"
  | "artigo_blog"
  | "email"
  | "anuncio";

export type StatusConteudo =
  | "publicado"
  | "agendado"
  | "em_revisao"
  | "em_producao"
  | "rascunho"
  | "falha"
  | "cancelado";

export interface ConteudoKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  color: "orange" | "purple" | "blue" | "emerald" | "amber" | "rose";
  bars: number[];
}

export interface ConteudoItem {
  id: string;
  time: string;
  platform: CanalPlataforma;
  format: FormatoConteudo;
  formatLabel: string;
  title: string;
  subtitle?: string;
  status: StatusConteudo;
  imageUrl: string;
  dayIndex: number; // 0 = Dom 11 ... 6 = Sáb 17
  dateIso: string;
  copy?: string;
  hashtags?: string[];
  cta?: string;
  highlight?: boolean; // Para os cards em destaque do dia 14
}

export interface CalendarDayColumn {
  dayOfWeek: string;
  dayNumber: number;
  dateStr: string;
  isToday?: boolean;
  isSelected?: boolean;
}

export interface TipoConteudoItem {
  id: FormatoConteudo;
  title: string;
  iconName: string;
  previewUrl: string;
  description: string;
}

export interface AiSuggestionItem {
  id: string;
  badgeLabel: string;
  badgeColor: "emerald" | "blue" | "purple" | "teal";
  description: string;
  iconName: "TrendingUp" | "Clock" | "Sparkles" | "Lightbulb";
}

export interface AiAssistantAction {
  id: string;
  title: string;
  iconName: "PenSquare" | "Layers" | "Video" | "Image" | "Share2" | "RefreshCw";
  description: string;
}

// 6 Indicadores Superiores Aprovados na Imagem da Tela 3
export const CONTEUDOS_KPIS: ConteudoKpiItem[] = [
  {
    id: "conteudos_gerados",
    label: "Conteúdos gerados",
    value: "148",
    change: "32%",
    color: "orange",
    bars: [25, 40, 55, 65, 75, 85, 95, 100],
  },
  {
    id: "publicacoes_realizadas",
    label: "Publicações realizadas",
    value: "386",
    change: "28%",
    color: "purple",
    bars: [30, 45, 50, 60, 70, 80, 90, 100],
  },
  {
    id: "alcance_total",
    label: "Alcance total",
    value: "125.4K",
    change: "54%",
    color: "blue",
    bars: [35, 45, 60, 70, 80, 85, 95, 100],
  },
  {
    id: "engajamento",
    label: "Engajamento",
    value: "8.7K",
    change: "48%",
    color: "emerald",
    bars: [25, 35, 50, 65, 75, 80, 90, 95],
  },
  {
    id: "cliques_no_link",
    label: "Cliques no link",
    value: "2.4K",
    change: "36%",
    color: "amber",
    bars: [30, 40, 55, 60, 70, 75, 85, 100],
  },
  {
    id: "leads_gerados",
    label: "Leads gerados",
    value: "486",
    change: "61%",
    color: "rose",
    bars: [35, 45, 55, 70, 80, 85, 95, 100],
  },
];

// 7 Dias da Semana no Calendário Editorial Aprovado (Agosto 2024: 11 a 17)
export const CALENDAR_DAYS: CalendarDayColumn[] = [
  { dayOfWeek: "Dom", dayNumber: 11, dateStr: "2024-08-11" },
  { dayOfWeek: "Seg", dayNumber: 12, dateStr: "2024-08-12" },
  { dayOfWeek: "Ter", dayNumber: 13, dateStr: "2024-08-13" },
  { dayOfWeek: "Qua", dayNumber: 14, dateStr: "2024-08-14", isToday: true, isSelected: true },
  { dayOfWeek: "Qui", dayNumber: 15, dateStr: "2024-08-15" },
  { dayOfWeek: "Sex", dayNumber: 16, dateStr: "2024-08-16" },
  { dayOfWeek: "Sáb", dayNumber: 17, dateStr: "2024-08-17" },
];

// 21 Cartões de Conteúdo Exatos da Imagem de Referência
export const SCHEDULED_CONTENTS: ConteudoItem[] = [
  // --- DOMINGO 11 ---
  {
    id: "content-dom-1",
    time: "09:00",
    platform: "instagram",
    format: "post_simples",
    formatLabel: "Devocional da Manhã",
    title: "Devocional da Manhã",
    subtitle: "",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&auto=format&fit=crop&q=80",
    dayIndex: 0,
    dateIso: "2024-08-11T09:00:00Z",
    copy: "Comece o seu dia com propósito e fé. Reflexão matinal diária para fortalecer sua caminhada espiritual.",
    hashtags: ["#devocional", "#fe", "#proposito", "#reflexao"],
  },
  {
    id: "content-dom-2",
    time: "14:00",
    platform: "youtube",
    format: "reels_shorts",
    formatLabel: "Vídeo Curto",
    title: "Vídeo Curto",
    subtitle: "A Promessa de Deus",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80",
    dayIndex: 0,
    dateIso: "2024-08-11T14:00:00Z",
    copy: "Neste trecho especial, compreenda a profundidade das promessas e como aplicá-las no seu cotidiano.",
    hashtags: ["#promessa", "#estudobiblico", "#youtube"],
  },
  {
    id: "content-dom-3",
    time: "20:00",
    platform: "facebook",
    format: "post_simples",
    formatLabel: "Imagem",
    title: "Imagem",
    subtitle: "Frase Inspiradora",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
    dayIndex: 0,
    dateIso: "2024-08-11T20:00:00Z",
    copy: "Mensagem de encerramento de domingo: renove suas forças e confie no que está por vir.",
    hashtags: ["#inspiracao", "#domingo", "#frases"],
  },

  // --- SEGUNDA 12 ---
  {
    id: "content-seg-1",
    time: "08:00",
    platform: "instagram",
    format: "carrossel",
    formatLabel: "Carrossel",
    title: "Carrossel",
    subtitle: "História Bíblica",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T08:00:00Z",
    copy: "Arraste para o lado e conheça a jornada de fidelidade e liderança dos grandes patriarcas.",
    hashtags: ["#historiabiblica", "#carrossel", "#ensino"],
  },
  {
    id: "content-seg-2",
    time: "13:00",
    platform: "tiktok",
    format: "video_completo",
    formatLabel: "Vídeo",
    title: "Vídeo",
    subtitle: "Nos Dias de Isaías",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T13:00:00Z",
    copy: "O que estava acontecendo no império assírio quando Isaías profetizou? Análise histórica e arqueológica.",
    hashtags: ["#isaias", "#arqueologia", "#tiktok", "#historia"],
  },
  {
    id: "content-seg-3",
    time: "19:00",
    platform: "instagram",
    format: "story",
    formatLabel: "Story",
    title: "Story",
    subtitle: "Bastidores",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T19:00:00Z",
    copy: "Bastidores da gravação da nova série de aulas. Responda à enquete e dê sua opinião!",
    hashtags: ["#bastidores", "#story", "#comunidade"],
  },

  // --- TERÇA 13 ---
  {
    id: "content-ter-1",
    time: "08:00",
    platform: "instagram",
    format: "post_simples",
    formatLabel: "Post",
    title: "Post",
    subtitle: "Versículo do Dia",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T08:00:00Z",
    copy: "Versículo do dia selecionado com contexto explicativo e aplicação prática para sua semana.",
    hashtags: ["#versiculododia", "#palavradedeus", "#devocional"],
  },
  {
    id: "content-ter-2",
    time: "15:00",
    platform: "linkedin",
    format: "artigo_blog",
    formatLabel: "Artigo",
    title: "Artigo",
    subtitle: "Reflexão Teológica",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T15:00:00Z",
    copy: "Liderança com ética e propósito: uma análise sobre tomada de decisões e integridade corporativa.",
    hashtags: ["#lideranca", "#etica", "#artigo", "#linkedin"],
  },
  {
    id: "content-ter-3",
    time: "20:30",
    platform: "instagram",
    format: "reels_shorts",
    formatLabel: "Reels",
    title: "Reels",
    subtitle: "Curiosidades Bíblicas",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T20:30:00Z",
    copy: "Você sabia deste detalhe sobre a construção do Templo de Salomão? Assista até o final!",
    hashtags: ["#curiosidades", "#reels", "#estudo"],
  },

  // --- QUARTA 14 (HOJE / EM DESTAQUE) ---
  {
    id: "content-qua-1",
    time: "08:00",
    platform: "instagram",
    format: "carrossel",
    formatLabel: "Carrossel",
    title: "Carrossel",
    subtitle: "Ensino Bíblico",
    status: "em_revisao",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T08:00:00Z",
    copy: "5 princípios fundamentais de interpretação bíblica explicados de forma simples e visual.",
    hashtags: ["#ensinobiblico", "#carrossel", "#teologia"],
    highlight: true,
  },
  {
    id: "content-qua-2",
    time: "12:00",
    platform: "youtube",
    format: "reels_shorts",
    formatLabel: "Shorts",
    title: "Shorts",
    subtitle: "Israel Antigo",
    status: "em_producao",
    imageUrl: "https://images.unsplash.com/photo-1548625361-195fe5795df5?w=600&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T12:00:00Z",
    copy: "Como era o dia a dia em Jerusalém no século VIII a.C.? Reconstituição histórica em 60 segundos.",
    hashtags: ["#israelantigo", "#shorts", "#historia"],
    highlight: true,
  },
  {
    id: "content-qua-3",
    time: "18:00",
    platform: "facebook",
    format: "post_simples",
    formatLabel: "Imagem",
    title: "Imagem",
    subtitle: "Citação Teológica",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T18:00:00Z",
    copy: "Citação clássica sobre perseverança e graça para inspirar sua noite de quarta-feira.",
    hashtags: ["#citacao", "#teologia", "#fe"],
    highlight: true,
  },

  // --- QUINTA 15 ---
  {
    id: "content-qui-1",
    time: "08:00",
    platform: "facebook",
    format: "post_simples",
    formatLabel: "Post",
    title: "Post",
    subtitle: "Vida Cristã",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
    dayIndex: 4,
    dateIso: "2024-08-15T08:00:00Z",
    copy: "Práticas diárias para manter a paz interior em meio à rotina acelerada moderna.",
    hashtags: ["#vidacrista", "#paz", "#espiritualidade"],
  },
  {
    id: "content-qui-2",
    time: "14:00",
    platform: "tiktok",
    format: "video_completo",
    formatLabel: "Vídeo",
    title: "Vídeo",
    subtitle: "Arqueologia Bíblica",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
    dayIndex: 4,
    dateIso: "2024-08-15T14:00:00Z",
    copy: "Descobertas arqueológicas recentes confirmam relatos da Cidade de Davi. Veja os achados!",
    hashtags: ["#arqueologia", "#biblia", "#descobertas"],
  },
  {
    id: "content-qui-3",
    time: "20:00",
    platform: "instagram",
    format: "story",
    formatLabel: "Story",
    title: "Story",
    subtitle: "Perguntas e Respostas",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
    dayIndex: 4,
    dateIso: "2024-08-15T20:00:00Z",
    copy: "Caixa de perguntas aberta: tire suas dúvidas sobre o último estudo lançado esta semana.",
    hashtags: ["#perguntaserespostas", "#stories", "#engajamento"],
  },

  // --- SEXTA 16 ---
  {
    id: "content-sex-1",
    time: "08:30",
    platform: "instagram",
    format: "carrossel",
    formatLabel: "Carrossel",
    title: "Carrossel",
    subtitle: "Batalha Espiritual",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop&q=80",
    dayIndex: 5,
    dateIso: "2024-08-16T08:30:00Z",
    copy: "A armadura de Deus descrita em Efésios 6: o significado de cada peça para a vida prática.",
    hashtags: ["#batalhaespiritual", "#efesios6", "#carrossel"],
  },
  {
    id: "content-sex-2",
    time: "15:00",
    platform: "youtube",
    format: "video_completo",
    formatLabel: "Vídeo",
    title: "Vídeo",
    subtitle: "Estudo Bíblico",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80",
    dayIndex: 5,
    dateIso: "2024-08-16T15:00:00Z",
    copy: "Aula completa ao vivo: Como entender as parábolas no contexto do primeiro século.",
    hashtags: ["#estudobiblico", "#aulacompleta", "#youtube"],
  },
  {
    id: "content-sex-3",
    time: "19:00",
    platform: "linkedin",
    format: "post_simples",
    formatLabel: "Post",
    title: "Post",
    subtitle: "Liderança Cristã",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80",
    dayIndex: 5,
    dateIso: "2024-08-16T19:00:00Z",
    copy: "Princípios de liderança servidora que transformam equipes e fortalecem a cultura institucional.",
    hashtags: ["#lideranca", "#cultura", "#gestao"],
  },

  // --- SÁBADO 17 ---
  {
    id: "content-sab-1",
    time: "09:00",
    platform: "facebook",
    format: "post_simples",
    formatLabel: "Post",
    title: "Post",
    subtitle: "Família e Fé",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80",
    dayIndex: 6,
    dateIso: "2024-08-17T09:00:00Z",
    copy: "Construindo memórias com quem você ama: dedique seu sábado ao descanso e comunhão.",
    hashtags: ["#familia", "#fe", "#sabado"],
  },
  {
    id: "content-sab-2",
    time: "14:00",
    platform: "instagram",
    format: "reels_shorts",
    formatLabel: "Reels",
    title: "Reels",
    subtitle: "Mensagem Rápida",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
    dayIndex: 6,
    dateIso: "2024-08-17T14:00:00Z",
    copy: "30 segundos de encorajamento para você que teve uma semana desafiadora.",
    hashtags: ["#reels", "#motivacao", "#fe"],
  },
  {
    id: "content-sab-3",
    time: "20:00",
    platform: "facebook",
    format: "post_simples",
    formatLabel: "Imagem",
    title: "Imagem",
    subtitle: "Convite Especial",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80",
    dayIndex: 6,
    dateIso: "2024-08-17T20:00:00Z",
    copy: "Amanhã temos encontro marcado! Participe conosco e traga um amigo para este momento especial.",
    hashtags: ["#convite", "#encontro", "#comunidade"],
  },
];

// 8 Tipos de Conteúdo Aprovados na Seção Inferior
export const TIPOS_CONTEUDO: TipoConteudoItem[] = [
  {
    id: "post_simples",
    title: "Post simples",
    iconName: "Image",
    previewUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&auto=format&fit=crop&q=80",
    description: "Imagem única com copy objetiva e chamada para ação clara.",
  },
  {
    id: "carrossel",
    title: "Carrossel",
    iconName: "Layers",
    previewUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=80",
    description: "Sequência de slides visuais para reter atenção e ensinar.",
  },
  {
    id: "reels_shorts",
    title: "Reels / Shorts",
    iconName: "Film",
    previewUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    description: "Vídeos verticais de alto impacto para alcance e viralização.",
  },
  {
    id: "video_completo",
    title: "Vídeo completo",
    iconName: "Video",
    previewUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop&q=80",
    description: "Conteúdo longo em formato horizontal para YouTube e cursos.",
  },
  {
    id: "story",
    title: "Story",
    iconName: "Clock",
    previewUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
    description: "Publicações efêmeras de 24h para engajamento e bastidores.",
  },
  {
    id: "artigo_blog",
    title: "Artigo / Blog",
    iconName: "FileText",
    previewUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&auto=format&fit=crop&q=80",
    description: "Texto aprofundado para SEO, autoridade e LinkedIn.",
  },
  {
    id: "email",
    title: "E-mail",
    iconName: "Mail",
    previewUrl: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=400&auto=format&fit=crop&q=80",
    description: "Newsletters e sequências de nutrição para sua base de leads.",
  },
  {
    id: "anuncio",
    title: "Anúncio",
    iconName: "Megaphone",
    previewUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80",
    description: "Criativos focados em conversão direta para Meta e Google Ads.",
  },
];

// 6 Ações Rápidas do Assistente de Conteúdo com IA
export const ASSISTANT_ACTIONS: AiAssistantAction[] = [
  {
    id: "action-posts",
    title: "Gerar posts para redes sociais",
    iconName: "PenSquare",
    description: "Criação de publicações estruturadas para Instagram, Facebook e LinkedIn.",
  },
  {
    id: "action-carrossel",
    title: "Criar carrossel completo",
    iconName: "Layers",
    description: "Roteiro slide a slide com gancho, desenvolvimento e CTA final.",
  },
  {
    id: "action-roteiro",
    title: "Gerar roteiro de vídeo",
    iconName: "Video",
    description: "Estrutura para Reels, Shorts e vídeos longos com marcação de cenas.",
  },
  {
    id: "action-imagens",
    title: "Criar imagens com IA",
    iconName: "Image",
    description: "Prompts profissionais e sugestões visuais para suas artes.",
  },
  {
    id: "action-adaptar",
    title: "Adaptar conteúdo para cada canal",
    iconName: "Share2",
    description: "Transforma um texto base em múltiplos formatos personalizados.",
  },
  {
    id: "action-copy",
    title: "Reescrever e melhorar copy",
    iconName: "RefreshCw",
    description: "Otimização de persuasão, clareza e poder de conversão com IA.",
  },
];

// 4 Sugestões Estratégicas da IA
export const AI_SUGGESTIONS: AiSuggestionItem[] = [
  {
    id: "sug-1",
    badgeLabel: "Oportunidade de viralização",
    badgeColor: "emerald",
    description: 'Seu tema "Nos Dias de Isaías" pode gerar alto engajamento no YouTube.',
    iconName: "TrendingUp",
  },
  {
    id: "sug-2",
    badgeLabel: "Melhor horário de publicação",
    badgeColor: "blue",
    description: "Seus posts têm melhor performance entre 18h e 21h.",
    iconName: "Clock",
  },
  {
    id: "sug-3",
    badgeLabel: "Novo formato recomendado",
    badgeColor: "purple",
    description: "Carrosséis educativos estão gerando mais cliques que posts simples.",
    iconName: "Sparkles",
  },
  {
    id: "sug-4",
    badgeLabel: "Ideia de conteúdo",
    badgeColor: "teal",
    description: "Crie um vídeo comparando profecias de Isaías com o contexto atual.",
    iconName: "Lightbulb",
  },
];
