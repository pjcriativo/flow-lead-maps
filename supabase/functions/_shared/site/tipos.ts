// Modelo de dados que os TEMPLATES renderizam. Já vem com tudo normalizado e
// os fallbacks resolvidos (nunca há placeholder cru: whatsappUrl/foto sempre
// válidos ou explicitamente null e o template esconde a seção).

export type TemplateId = "saude" | "servico-local" | "profissional";

/** Variante de HERO da biblioteca de blocos (composição por semente). */
export type HeroId = "A" | "B" | "C";

export type Servico = { titulo: string; descricao: string; icone: string };

export type Faq = { pergunta: string; resposta: string };

/** Depoimento REAL do Google (via Apify) — nunca inventado. */
export type Depoimento = {
  author: string | null;
  photo: string | null;
  rating: number | null;
  text: string;
  when: string | null;
};

export type Cores = {
  primaria: string;
  secundaria: string;
  escura: string;
  clara: string;
  contraste: string; // texto sobre a cor primária (branco/escuro)
};

export type SiteData = {
  nome: string;
  categoriaLabel: string;
  cidade: string | null;
  estado: string | null;

  // prova social real
  rating: number | null; // 0–5
  reviews: number | null;

  // contato (sempre pronto para uso — nunca "wa.me/" vazio)
  whatsapp: string | null; // 55DDDNÚMERO
  whatsappUrl: string | null; // https://wa.me/55...?text=...
  telefone: string | null;
  telUrl: string | null; // tel:+55...
  endereco: string | null;
  mapsUrl: string | null; // link do Google Maps
  mapEmbedUrl: string | null; // iframe embed (sem API key)

  // visual (fotos DISTINTAS por seção — nunca repete)
  fotoHero: string; // SEMPRE preenchida (real ou fallback do nicho)
  fotoSobre: string;
  fotoCta: string;
  fotos: string[]; // galeria (real ou fallback do nicho)
  logo: string | null;
  cores: Cores;
  instagram: string | null;
  facebook: string | null;

  // copy (IA ou fallback rule-based)
  headline: string;
  subheadline: string;
  servicos: Servico[];
  diferenciais: Servico[];
  sobre: string;
  faq: Faq[];
  cta: string;

  // depoimentos REAIS do Google (via Apify) — vazio quando não coletados
  depoimentos: Depoimento[];

  // composição por blocos: semente estável do lead + variante de hero escolhida
  seed: string;
  heroVar: HeroId;
  // Variante (0|1|2) de cada seção — escolhida por semente com salt por seção (81 composições).
  servVar: 0 | 1 | 2;
  provaVar: 0 | 1 | 2;
  sobreVar: 0 | 1 | 2;
  contatoVar: 0 | 1 | 2;

  /** Crédito do rodapé (profiles.site_credito). null = SEM crédito — o default.
   *  NUNCA cita a plataforma: o lead é prospect da agência, não cliente do Flow Leads. */
  creditoRodape: string | null;
};
