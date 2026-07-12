// Contrato ÚNICO do provedor de IA que gera o site (arquitetura plugável).
// Trocar OpenAI por Claude/OpenRouter depois = implementar outro AiProvider e
// registrá-lo no dispatch (index.ts). As chamadas não mudam.

/** Matéria-prima do redesign: dados reais do lead + conteúdo do site atual. */
export type MateriaPrima = {
  nome: string;
  categoria: string | null;
  endereco: string | null;
  telefone: string | null;
  /** WhatsApp no formato 55DDDNÚMERO (para wa.me). */
  whatsapp: string | null;
  rating: number | null;
  reviews: number | null;
  siteUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  /** Texto visível do site atual (para REESCREVER, não copiar). */
  textos: string;
  /** URLs absolutas das FOTOS do cliente (usar as originais). */
  imagens: string[];
  /** URL do logo do cliente. */
  logo: string | null;
  /** Cores predominantes (hex) do site atual. */
  cores: string[];
};

export type GerarSiteResult = {
  html: string;
  modelo: string;
  inputTokens: number;
  outputTokens: number;
  custoUsd: number;
};

export type AiProvider = (mp: MateriaPrima) => Promise<GerarSiteResult>;
