// COPY de WhatsApp — variáveis + variações que revezam. Funções PURAS (dá pra provar sem rede),
// usadas TANTO pela tela (preview) QUANTO pelo edge send-proposal-wa (envio) — uma fonte só, sem
// duplicar a regra. REUSA o classificarMotivo e o piso de nota do e-mail (nunca inventa nota).
import { classificarMotivo, NOTA_MINIMA_ABERTURA_A } from "./copy-proposta";

export const NOTA_MINIMA_WA = NOTA_MINIMA_ABERTURA_A; // mesmo piso 4,5 da abertura A do e-mail

/** Dados do lead que as variáveis da mensagem podem citar. */
export type WaLeadDados = {
  business_name: string;
  city?: string | null;
  category?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  rating?: number | null;
  review_count?: number | null;
  score_breakdown?: unknown;
  link?: string | null; // prévia publicada (publish-on-approve) — {{link}}
};

export type WaVariacao = { id: string; texto: string; ativa: boolean };

/** Tokens que a UI oferece. {{bairro}} existe no set mas o Flow Leads não coleta bairro. */
export const WA_TOKENS = [
  "nome",
  "cidade",
  "categoria",
  "bairro",
  "telefone",
  "nota",
  "n_avaliacoes",
  "motivo",
  "link",
] as const;

/** Nota real e confiável? (piso 4,5 + avaliações reais). Espelha usaAberturaA do e-mail. */
export function temNotaValida(d: Pick<WaLeadDados, "rating" | "review_count">): boolean {
  return typeof d.rating === "number" && d.rating >= NOTA_MINIMA_WA && (d.review_count ?? 0) > 0;
}

const CITA_NOTA = /\{\{\s*(nota|n_avaliacoes)\s*\}\}/;

/**
 * Uma variação que cita {{nota}}/{{n_avaliacoes}} SÓ é elegível pra um lead com nota válida —
 * é assim que nunca se inventa uma nota que o lead não tem (mesma regra do e-mail).
 */
export function variacaoElegivel(texto: string, d: WaLeadDados): boolean {
  return CITA_NOTA.test(texto) ? temNotaValida(d) : true;
}

/** Resolve {{variáveis}} de UM lead. Token desconhecido é preservado; espaços colapsam. */
export function resolverVariaveis(texto: string, d: WaLeadDados): string {
  const motivo = classificarMotivo(d.score_breakdown);
  const mapa: Record<string, string> = {
    nome: d.business_name ?? "",
    cidade: d.city ?? "",
    categoria: d.category ?? "",
    bairro: "", // Flow Leads não coleta bairro (só city/state) — token resolve vazio
    telefone: d.phone ?? d.whatsapp ?? "",
    nota: d.rating != null ? String(d.rating).replace(".", ",") : "",
    n_avaliacoes: d.review_count != null ? String(d.review_count) : "",
    motivo: motivo?.texto ?? "",
    link: d.link ?? "",
  };
  return texto
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => (k in mapa ? mapa[k] : m))
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** FNV-1a 32-bit (mesmo algoritmo das variantes de site) — aqui para variar a mensagem por lead. */
export function hashSemente(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Escolhe UMA variação entre as elegíveis pra este lead, de forma determinística (hashSemente) e
 * NUNCA igual à última enviada na campanha (revezamento — "texto igual pra todo mundo derruba
 * conta"). Com 1 elegível não há como revezar (a UI avisa). Sem elegível → null.
 */
export function escolherVariacao(
  elegiveis: WaVariacao[],
  seed: string,
  ultimaId?: string | null,
): WaVariacao | null {
  if (elegiveis.length === 0) return null;
  let i = hashSemente(seed) % elegiveis.length;
  if (elegiveis.length > 1 && elegiveis[i].id === ultimaId) i = (i + 1) % elegiveis.length;
  return elegiveis[i];
}

/** Variações elegíveis e ativas de uma campanha, pra este lead. */
export function variacoesElegiveis(todas: WaVariacao[], d: WaLeadDados): WaVariacao[] {
  return todas.filter((v) => v.ativa && variacaoElegivel(v.texto, d));
}

// ---- Variações PADRÃO (2-3 de cada), já cadastradas quando a campanha WA é criada ----
// Curtas, COM link, zero preço, tom de pessoa. {{motivo}} vem do score_breakdown (4 casos).
// Fecho de opt-out em cada uma: convida a "responder SAIR" (processar a resposta é a etapa de
// Conversas — fora deste escopo; por ora o opt-out global de e-mail já é respeitado no envio).
export const VARIACOES_PADRAO_COM_NOTA: WaVariacao[] = [
  {
    id: "com-nota-1",
    ativa: true,
    texto:
      "Oi! Vi que a {{nome}} tem {{nota}} no Google ({{n_avaliacoes}} avaliações) — raro. {{motivo}} Refiz a página de vocês com as infos públicas, já tá no ar: {{link}} — se fizer sentido é só me chamar. (não quer contato? responda SAIR)",
  },
  {
    id: "com-nota-2",
    ativa: true,
    texto:
      "Olá, tudo bem? A {{nome}} tem {{nota}} no Google com {{n_avaliacoes}} avaliações — reputação assim é difícil. {{motivo}} Montei uma página nova de vocês (dados públicos), já publicada: {{link}} — qualquer coisa me responde. (pra sair, é só responder SAIR)",
  },
  {
    id: "com-nota-3",
    ativa: true,
    texto:
      "Oi! {{nota}} no Google ({{n_avaliacoes}} avaliações) coloca a {{nome}} na frente da maioria. {{motivo}} Deixei uma página de vocês pronta e no ar: {{link}} — se curtir, me chama. (não quiser, responda SAIR)",
  },
];

export const VARIACOES_PADRAO_SEM_NOTA: WaVariacao[] = [
  {
    id: "sem-nota-1",
    ativa: true,
    texto:
      "Oi! Encontrei a {{nome}} no Google. {{motivo}} Refiz a página de vocês com as infos públicas, já tá no ar: {{link}} — se fizer sentido é só me chamar. (não quer contato? responda SAIR)",
  },
  {
    id: "sem-nota-2",
    ativa: true,
    texto:
      "Olá, tudo bem? Achei a {{nome}} aqui no Google. {{motivo}} Montei uma página nova pra vocês (dados públicos), já publicada: {{link}} — qualquer coisa me responde. (pra sair, é só responder SAIR)",
  },
  {
    id: "sem-nota-3",
    ativa: true,
    texto:
      "Oi! Vi a {{nome}} no Google. {{motivo}} Deixei uma prévia de página no ar pra vocês: {{link}} — se fizer sentido, me chama. (não quiser, responda SAIR)",
  },
];

/** Conjunto padrão (com + sem nota). O lead sem nota válida só recebe as "sem nota" (elegibilidade). */
export function variacoesPadrao(): WaVariacao[] {
  return [...VARIACOES_PADRAO_COM_NOTA, ...VARIACOES_PADRAO_SEM_NOTA];
}

/** Config padrão de uma campanha WhatsApp nova. Intervalo com jitter (vazão, não cautela). */
export const WA_INTERVALO_MIN_PADRAO = 35; // segundos (dado de campo Kaptar: recomendado 35-60s)
export const WA_INTERVALO_MAX_PADRAO = 60;
export const WA_INTERVALO_MIN_ABS = 15; // piso duro (instantâneo = ban)
export const WA_INTERVALO_MAX_ABS = 180;

export type WaCampanhaConfig = {
  intervalo_min: number;
  intervalo_max: number;
  variacoes: WaVariacao[];
};

export function configPadraoWa(): WaCampanhaConfig {
  return {
    intervalo_min: WA_INTERVALO_MIN_PADRAO,
    intervalo_max: WA_INTERVALO_MAX_PADRAO,
    variacoes: variacoesPadrao(),
  };
}
