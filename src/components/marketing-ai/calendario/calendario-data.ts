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
  | "video_longo"
  | "story"
  | "artigo"
  | "mensagem"
  | "anuncio";

export type StatusPublicacao =
  | "publicado"
  | "agendado"
  | "em_revisao"
  | "em_producao"
  | "rascunho"
  | "falha";

export interface CalendarioKpiItem {
  id: string;
  label: string;
  value: string;
  change: string;
  color: "orange" | "purple" | "emerald" | "teal" | "blue" | "rose";
  barColor: "orange" | "purple" | "blue" | "emerald" | "amber" | "rose";
  bars: number[];
}

export interface PublicacaoItem {
  id: string;
  time: string;
  timeSlot: string; // "08:00" | "10:00" | "12:00" | "14:00" | "16:00" | "18:00" | "20:00"
  platform: CanalPlataforma;
  format: FormatoConteudo;
  title: string;
  subtitle?: string;
  status: StatusPublicacao;
  imageUrl: string;
  dayIndex: number; // 0 = Dom 11 ... 6 = Sáb 17
  dateIso: string;
  highlight?: boolean; // Para destacar o card do dia 14 às 12:00
  copy?: string;
  author?: string;
}

export interface FilaPublicacaoItem {
  id: string;
  horario: string; // "Hoje, 15:00"
  title: string;
  platform: CanalPlataforma;
  platformLabel: string;
  imageUrl: string;
  status: StatusPublicacao;
}

export interface CanalConectadoItem {
  id: CanalPlataforma;
  name: string;
  status: "conectado" | "pendente" | "erro";
}

export interface AssistantPublicacaoAction {
  id: string;
  title: string;
  iconName: string;
  description: string;
}

// 6 Indicadores Superiores Aprovados na Tela 4
export const CALENDARIO_KPIS: CalendarioKpiItem[] = [
  {
    id: "publicacoes_agendadas",
    label: "Publicações agendadas",
    value: "42",
    change: "28%",
    color: "orange",
    barColor: "orange",
    bars: [25, 40, 55, 65, 75, 85, 95, 100],
  },
  {
    id: "publicacoes_hoje",
    label: "Publicações hoje",
    value: "12",
    change: "50%",
    color: "purple",
    barColor: "purple",
    bars: [30, 45, 50, 60, 70, 80, 90, 100],
  },
  {
    id: "publicacoes_realizadas",
    label: "Publicações realizadas",
    value: "386",
    change: "32%",
    color: "emerald",
    barColor: "blue", // Barras azuis conforme layout aprovado
    bars: [35, 45, 60, 70, 80, 85, 95, 100],
  },
  {
    id: "taxa_sucesso",
    label: "Taxa de sucesso",
    value: "98,5%",
    change: "12%",
    color: "teal",
    barColor: "emerald", // Barras verdes conforme layout aprovado
    bars: [25, 35, 50, 65, 75, 80, 90, 95],
  },
  {
    id: "canais_conectados",
    label: "Canais conectados",
    value: "6",
    change: "0%",
    color: "blue",
    barColor: "amber", // Barras amarelas conforme layout aprovado
    bars: [30, 40, 55, 60, 70, 75, 85, 100],
  },
  {
    id: "alcance_total",
    label: "Alcance total",
    value: "125.4K",
    change: "54%",
    color: "rose",
    barColor: "rose",
    bars: [35, 45, 55, 70, 80, 85, 95, 100],
  },
];

// 7 Dias de Calendário
export const DIAS_SEMANA = [
  { dayOfWeek: "Dom", dayNumber: 11, dateStr: "2024-08-11" },
  { dayOfWeek: "Seg", dayNumber: 12, dateStr: "2024-08-12" },
  { dayOfWeek: "Ter", dayNumber: 13, dateStr: "2024-08-13" },
  { dayOfWeek: "Qua", dayNumber: 14, dateStr: "2024-08-14", isToday: true, isSelected: true },
  { dayOfWeek: "Qui", dayNumber: 15, dateStr: "2024-08-15" },
  { dayOfWeek: "Sex", dayNumber: 16, dateStr: "2024-08-16" },
  { dayOfWeek: "Sáb", dayNumber: 17, dateStr: "2024-08-17" },
];

// Horários do Eixo Temporal Esquerdo
export const TIMELINE_SLOTS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
];

// Publicações Reais da Grade de Calendário
export const CALENDARIO_PUBLICACOES: PublicacaoItem[] = [
  // --- SEGUNDA 12 ---
  {
    id: "pub-seg-1",
    time: "08:00",
    timeSlot: "08:00",
    platform: "instagram",
    format: "post_simples",
    title: "Devocional da Manhã",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=500&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T08:00:00Z",
    copy: "Inicie sua semana com fé e determinação.",
  },
  {
    id: "pub-seg-2",
    time: "10:00",
    timeSlot: "10:00",
    platform: "linkedin",
    format: "artigo",
    title: "Liderança Cristã",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T10:00:00Z",
    copy: "Princípios éticos que fortalecem equipes e inspiram resultados duradouros.",
  },
  {
    id: "pub-seg-3",
    time: "14:00",
    timeSlot: "14:00",
    platform: "youtube",
    format: "video_longo",
    title: "Estudo Bíblico",
    status: "em_revisao",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T14:00:00Z",
    copy: "Aula completa com análise contextual e aplicação prática.",
  },
  {
    id: "pub-seg-4",
    time: "18:00",
    timeSlot: "18:00",
    platform: "tiktok",
    format: "video_longo",
    title: "Nos Dias de Isaías",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    dayIndex: 1,
    dateIso: "2024-08-12T18:00:00Z",
    copy: "O contexto histórico e arqueológico que surpreende historiadores.",
  },

  // --- TERÇA 13 ---
  {
    id: "pub-ter-1",
    time: "09:00",
    timeSlot: "08:00",
    platform: "facebook",
    format: "post_simples",
    title: "Família e Fé",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T09:00:00Z",
    copy: "Construindo momentos inesquecíveis e valores que permanecem.",
  },
  {
    id: "pub-ter-2",
    time: "11:00",
    timeSlot: "10:00",
    platform: "instagram",
    format: "carrossel",
    title: "Carrossel",
    status: "rascunho",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T11:00:00Z",
    copy: "Arrasta para o lado para conferir os 5 passos práticos.",
  },
  {
    id: "pub-ter-3",
    time: "15:00",
    timeSlot: "14:00",
    platform: "whatsapp",
    format: "mensagem",
    title: "Mensagem",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=500&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T15:00:00Z",
    copy: "Transmissão exclusiva com resumo semanal e links úteis.",
  },
  {
    id: "pub-ter-4",
    time: "19:00",
    timeSlot: "18:00",
    platform: "youtube",
    format: "reels_shorts",
    title: "Shorts",
    status: "em_producao",
    imageUrl: "https://images.unsplash.com/photo-1548625361-195fe5795df5?w=500&auto=format&fit=crop&q=80",
    dayIndex: 2,
    dateIso: "2024-08-13T19:00:00Z",
    copy: "Trecho dinâmico com lição impactante em 45 segundos.",
  },

  // --- QUARTA 14 (HOJE / SELECIONADO) ---
  {
    id: "pub-qua-1",
    time: "08:00",
    timeSlot: "08:00",
    platform: "tiktok",
    format: "post_simples",
    title: "Versículo do Dia",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T08:00:00Z",
    copy: "Reflexão matinal para guiar suas decisões hoje.",
  },
  {
    id: "pub-qua-2",
    time: "12:00",
    timeSlot: "12:00",
    platform: "instagram",
    format: "reels_shorts",
    title: "Reels Motivacional",
    status: "em_producao",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T12:00:00Z",
    highlight: true, // Card iluminado com borda laranja
    copy: "Supere os obstáculos com foco, constância e coragem.",
  },
  {
    id: "pub-qua-3",
    time: "16:00",
    timeSlot: "16:00",
    platform: "linkedin",
    format: "artigo",
    title: "Artigo Teológico",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T16:00:00Z",
    copy: "Reflexão teológica e histórica para profissionais e líderes.",
  },
  {
    id: "pub-qua-4",
    time: "20:00",
    timeSlot: "20:00",
    platform: "facebook",
    format: "post_simples",
    title: "Batalha Espiritual",
    status: "rascunho",
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=500&auto=format&fit=crop&q=80",
    dayIndex: 3,
    dateIso: "2024-08-14T20:00:00Z",
    copy: "Princípios práticos de fortalecimento espiritual diário.",
  },

  // --- QUINTA 15 ---
  {
    id: "pub-qui-1",
    time: "09:00",
    timeSlot: "08:00",
    platform: "youtube",
    format: "video_longo",
    title: "Vídeo Longo",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500&auto=format&fit=crop&q=80",
    dayIndex: 4,
    dateIso: "2024-08-15T09:00:00Z",
    copy: "Documentário completo com especialistas e convidados.",
  },
  {
    id: "pub-qui-2",
    time: "13:00",
    timeSlot: "12:00",
    platform: "instagram",
    format: "carrossel",
    title: "Carrossel Fé",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&auto=format&fit=crop&q=80",
    dayIndex: 4,
    dateIso: "2024-08-15T13:00:00Z",
    copy: "7 pilares para uma fé inabalável em tempos de crise.",
  },
  {
    id: "pub-qui-3",
    time: "17:00",
    timeSlot: "16:00",
    platform: "tiktok",
    format: "reels_shorts",
    title: "Shorts Reflexão",
    status: "rascunho",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    dayIndex: 4,
    dateIso: "2024-08-15T17:00:00Z",
    copy: "Uma pergunta sincera para você refletir esta noite.",
  },

  // --- SEXTA 16 ---
  {
    id: "pub-sex-1",
    time: "08:30",
    timeSlot: "08:00",
    platform: "linkedin",
    format: "post_simples",
    title: "Crescimento Espiritual",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80",
    dayIndex: 5,
    dateIso: "2024-08-16T08:30:00Z",
    copy: "Como desenvolver disciplina pessoal e propósito profissional.",
  },
  {
    id: "pub-sex-2",
    time: "12:00",
    timeSlot: "12:00",
    platform: "whatsapp",
    format: "mensagem",
    title: "Convite Especial",
    status: "publicado",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80",
    dayIndex: 5,
    dateIso: "2024-08-16T12:00:00Z",
    copy: "Participe da nossa transmissão especial neste fim de semana.",
  },
  {
    id: "pub-sex-3",
    time: "18:00",
    timeSlot: "18:00",
    platform: "instagram",
    format: "reels_shorts",
    title: "Reels de Oração",
    status: "em_revisao",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
    dayIndex: 5,
    dateIso: "2024-08-16T18:00:00Z",
    copy: "Momento de oração para encerrar a semana com gratidão.",
  },

  // --- SÁBADO 17 ---
  {
    id: "pub-sab-1",
    time: "09:00",
    timeSlot: "08:00",
    platform: "facebook",
    format: "post_simples",
    title: "Estudo Bíblico",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80",
    dayIndex: 6,
    dateIso: "2024-08-17T09:00:00Z",
    copy: "Estudo matinal de sábado em família.",
  },
  {
    id: "pub-sab-2",
    time: "14:00",
    timeSlot: "14:00",
    platform: "youtube",
    format: "video_longo",
    title: "Israel Antigo",
    status: "rascunho",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80",
    dayIndex: 6,
    dateIso: "2024-08-17T14:00:00Z",
    copy: "Reconstituição em 3D dos principais sítios arqueológicos.",
  },
  {
    id: "pub-sab-3",
    time: "19:00",
    timeSlot: "18:00",
    platform: "tiktok",
    format: "reels_shorts",
    title: "Deus é Fiel",
    status: "agendado",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80",
    dayIndex: 6,
    dateIso: "2024-08-17T19:00:00Z",
    copy: "Mensagem inspiradora para seu sábado à noite.",
  },
];

// Fila de Publicação (Próximos 5 Conteúdos da Seção Inferior)
export const FILA_PUBLICACOES: FilaPublicacaoItem[] = [
  {
    id: "fila-1",
    horario: "Hoje, 15:00",
    title: "Reels Motivacional",
    platform: "instagram",
    platformLabel: "Instagram",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80",
    status: "em_producao",
  },
  {
    id: "fila-2",
    horario: "Hoje, 16:00",
    title: "Artigo Teológico",
    platform: "linkedin",
    platformLabel: "LinkedIn",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    status: "agendado",
  },
  {
    id: "fila-3",
    horario: "Hoje, 17:00",
    title: "Shorts Reflexão",
    platform: "tiktok",
    platformLabel: "TikTok",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    status: "rascunho",
  },
  {
    id: "fila-4",
    horario: "Hoje, 18:00",
    title: "Reels de Oração",
    platform: "instagram",
    platformLabel: "Instagram",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
    status: "em_revisao",
  },
  {
    id: "fila-5",
    horario: "Hoje, 19:00",
    title: "Deus é Fiel",
    platform: "tiktok",
    platformLabel: "TikTok",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80",
    status: "agendado",
  },
];

// Status dos 6 Canais Conectados
export const CANAIS_STATUS: CanalConectadoItem[] = [
  { id: "instagram", name: "Instagram", status: "conectado" },
  { id: "facebook", name: "Facebook", status: "conectado" },
  { id: "linkedin", name: "LinkedIn", status: "conectado" },
  { id: "youtube", name: "YouTube", status: "conectado" },
  { id: "tiktok", name: "TikTok", status: "conectado" },
  { id: "whatsapp", name: "WhatsApp", status: "conectado" },
];

// 6 Ações do Assistente de Publicação com IA
export const ASSISTANT_PUBLICACAO_ACTIONS: AssistantPublicacaoAction[] = [
  {
    id: "act-melhor-horario",
    title: "Sugerir melhor horário",
    iconName: "Clock",
    description: "Analisa o engajamento histórico de cada rede e recomenda os picos de tráfego.",
  },
  {
    id: "act-multiplos-canais",
    title: "Agendar em múltiplos canais",
    iconName: "Share2",
    description: "Distribuição simultânea adaptando copies e formatos em um só clique.",
  },
  {
    id: "act-ajustar-conteudos",
    title: "Ajustar conteúdos existentes",
    iconName: "Sliders",
    description: "Revisão rápida de horários, legendas e regras de publicação em lote.",
  },
  {
    id: "act-reaproveitar",
    title: "Reaproveitar conteúdos mais performantes",
    iconName: "Repeat",
    description: "Identifica posts virais anteriores e gera novas versões para republicação.",
  },
  {
    id: "act-otimizar-copy",
    title: "Corrigir e otimizar copy",
    iconName: "PenSquare",
    description: "Aprimoramento ortográfico, tom persuasivo e hashtags estratégicas.",
  },
  {
    id: "act-analisar-desempenho",
    title: "Analisar desempenho das publicações",
    iconName: "BarChart3",
    description: "Diagnóstico completo de alcance, taxa de cliques e conversão dos últimos posts.",
  },
];
