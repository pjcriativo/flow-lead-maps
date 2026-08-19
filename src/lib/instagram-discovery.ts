import { normalizarBuscaInstagram } from "./instagram-search.ts";

const MAX_CANDIDATOS = 250;
const TAXA_APROVACAO_INICIAL = 0.25;

const EXPANSOES: Record<string, string[]> = {
  ortodontista: [
    "ortodontia",
    "invisalign",
    "alinhadores",
    "aparelho dentário",
    "dentista especialista",
  ],
  "clinica odontologica": ["dentista", "odontologia", "consultório odontológico", "saúde bucal"],
  dentista: [
    "odontologia",
    "clínica odontológica",
    "consultório odontológico",
    "cirurgião dentista",
  ],
  "clinica de estetica": [
    "estética avançada",
    "harmonização facial",
    "esteticista",
    "beleza e estética",
  ],
  pizzaria: ["pizza artesanal", "delivery de pizza", "pizzaria italiana", "rodízio de pizza"],
  advogado: [
    "advocacia",
    "escritório de advocacia",
    "assessoria jurídica",
    "advogado especialista",
  ],
  imobiliaria: ["corretor de imóveis", "imóveis", "consultoria imobiliária", "venda de imóveis"],
};

export type PlanoDescobertaInstagram = {
  metaQualificados: number;
  maxCandidatos: number;
  consultas: string[];
  buscaComposta: string;
};

function textoObrigatorio(valor: string, campo: string): string {
  const limpo = valor.trim();
  if (!limpo) throw new Error(`${campo} é obrigatório para a descoberta no Instagram.`);
  return limpo;
}

function consultasDoNicho(nicho: string): string[] {
  const chave = normalizarBuscaInstagram(nicho);
  const conhecidas = EXPANSOES[chave] ?? [];
  return [
    nicho,
    ...conhecidas,
    `${nicho} profissional`,
    `${nicho} especialista`,
    `${nicho} atendimento`,
  ];
}

export function montarPlanoDescobertaInstagram(params: {
  nicho: string;
  cidade: string;
  metaQualificados: number;
  taxaAprovacaoEsperada?: number;
}): PlanoDescobertaInstagram {
  const nicho = textoObrigatorio(params.nicho, "Nicho");
  const cidade = textoObrigatorio(params.cidade, "Cidade");
  const metaQualificados = Math.max(1, Math.min(100, Math.floor(params.metaQualificados)));
  const taxa = Math.max(0.1, Math.min(0.8, params.taxaAprovacaoEsperada ?? TAXA_APROVACAO_INICIAL));
  const maxCandidatos = Math.min(MAX_CANDIDATOS, Math.ceil(metaQualificados / taxa));
  const vistos = new Set<string>();
  const consultas = consultasDoNicho(nicho)
    .map((termo) => `${termo.trim()} ${cidade}`.replace(/\s+/g, " "))
    .filter((consulta) => {
      const chave = normalizarBuscaInstagram(consulta);
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .slice(0, 8);
  return {
    metaQualificados,
    maxCandidatos,
    consultas,
    buscaComposta: consultas.join(", "),
  };
}

export function selecionarAteMeta<T>(
  candidatos: readonly T[],
  meta: number,
  aprovado: (candidato: T) => boolean,
): T[] {
  const limite = Math.max(0, Math.floor(meta));
  const selecionados: T[] = [];
  for (const candidato of candidatos) {
    if (!aprovado(candidato)) continue;
    selecionados.push(candidato);
    if (selecionados.length >= limite) break;
  }
  return selecionados;
}
