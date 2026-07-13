// Contrato do provedor de IA (v2). MUDANÇA-CHAVE: a IA NÃO desenha mais o site.
// Ela só gera o CONTEÚDO (copy) em JSON; um TEMPLATE premium (design fixo) monta
// o HTML final. Assim o design nunca degrada — só o texto varia por negócio.

/** Matéria-prima do redesign: dados REAIS do lead + conteúdo do site atual. */
export type MateriaPrima = {
  nome: string;
  categoria: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  telefone: string | null;
  /** WhatsApp cru do lead (será normalizado para 55DDDNÚMERO). */
  whatsapp: string | null;
  rating: number | null;
  reviews: number | null;
  latitude: number | null;
  longitude: number | null;
  siteUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  /** Texto visível do site atual (para a IA se basear, não copiar). */
  textos: string;
  /** URLs absolutas das FOTOS reais do cliente. */
  imagens: string[];
  /** URL do logo do cliente. */
  logo: string | null;
  /** Cores predominantes (hex) do site atual. */
  cores: string[];
};

/** Um serviço/diferencial para um card (título + descrição + ícone). */
export type ServicoIA = {
  titulo: string;
  descricao: string;
  /** Palavra-chave de ícone (o template converte em SVG). Ex.: "tooth", "shield". */
  icone: string;
};

/**
 * CONTEÚDO gerado pela IA (o que entra nos placeholders do template).
 * A IA preenche isto com base nos dados reais — não inventa fatos.
 */
export type ConteudoIA = {
  headline: string;
  subheadline: string;
  /** 3–6 serviços/diferenciais reais (extraídos do site/categoria). */
  servicos: ServicoIA[];
  /** Texto "sobre" com autoridade (reescrito, sem inventar). */
  sobre: string;
  /** Rótulo do CTA principal. Ex.: "Agendar avaliação". */
  cta: string;
};

export type GerarConteudoResult = {
  conteudo: ConteudoIA;
  modelo: string;
  inputTokens: number;
  outputTokens: number;
  custoUsd: number;
  /** true quando a IA falhou e usamos o fallback rule-based (custo 0). */
  fallback: boolean;
};

/** Provedor plugável: recebe a matéria-prima + o nicho e devolve o CONTEÚDO. */
export type AiProvider = (mp: MateriaPrima, nicho: string) => Promise<GerarConteudoResult>;
