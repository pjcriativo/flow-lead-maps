// Modelo de dados que os TEMPLATES renderizam. Já vem com tudo normalizado e
// os fallbacks resolvidos (nunca há placeholder cru: whatsappUrl/foto sempre
// válidos ou explicitamente null e o template esconde a seção).

export type TemplateId = "saude" | "servico-local" | "profissional";

export type Servico = { titulo: string; descricao: string; icone: string };

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

  // visual
  fotoHero: string; // SEMPRE preenchida (real ou fallback do nicho)
  fotos: string[]; // galeria (real ou fallback do nicho)
  logo: string | null;
  cores: Cores;
  instagram: string | null;
  facebook: string | null;

  // copy (IA ou fallback rule-based)
  headline: string;
  subheadline: string;
  servicos: Servico[];
  sobre: string;
  cta: string;
};
