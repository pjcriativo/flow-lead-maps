// SELEÇÃO DETERMINÍSTICA DE VARIANTE POR SEMENTE (composição por blocos).
//
// A MECÂNICA:
//   variante = PERMITIDAS[nicho][ fnv1a(semente) % PERMITIDAS[nicho].length ]
//
// - SEMENTE: identificador ESTÁVEL do lead — `place_id` (estável por lugar no
//   Google) ou, na falta dele, o `lead.id` (uuid estável do banco). NUNCA usar
//   o redesign_id (muda a cada geração e quebraria o determinismo).
// - DETERMINISMO: fnv1a é uma função pura → a mesma semente SEMPRE produz o
//   mesmo hash → o mesmo índice → a mesma variante. Regenerar o site do mesmo
//   lead nunca muda o hero. Leads diferentes → hashes diferentes → variantes
//   tendem a diferir (com N variantes, 2 leads colidem em ~1/N dos pares; isso
//   é esperado e honesto — não há sorteio, não há estado).
// - O NICHO restringe o que a semente pode escolher (PERMITIDAS). A paleta e a
//   copy sóbrias do nicho vêm do NichoCfg/cores — a variante é só a ESTRUTURA.
import type { HeroId, TemplateId } from "./tipos.ts";

/**
 * FNV-1a 32-bit — hash não-criptográfico, estável, sem dependências.
 * (offset basis 2166136261, prime 16777619; >>> 0 mantém uint32.)
 */
export function hashSemente(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Variantes de hero que cada nicho PERMITE (a semente escolhe DENTRO disto). */
const PERMITIDAS: Record<TemplateId, HeroId[]> = {
  saude: ["A", "B", "C"],
  profissional: ["A", "B", "C"], // sobriedade vem da paleta/copy do NichoCfg
  "servico-local": ["A"], // template antigo (não migrado p/ blocos) — só full-bleed
};

/**
 * Escolhe a variante de HERO do lead: determinística, restrita pelo nicho.
 * ATENÇÃO (determinismo): o `nicho` passado aqui deve derivar SÓ de dados
 * estáveis do lead (categoria do banco) — nunca do scrape ao vivo do site
 * (textos mudam/caem e mudariam a lista de permitidas entre regenerações).
 * Use `detectarNicho(categoria, "")` para obter esse nicho estável.
 */
export function varianteHero(seed: string, nicho: TemplateId): HeroId {
  const permitidas = PERMITIDAS[nicho] ?? PERMITIDAS["servico-local"];
  return permitidas[hashSemente(seed) % permitidas.length];
}

/**
 * Variante (0|1|2) de uma SEÇÃO, escolhida pela mesma semente do hero, mas com SALT por seção
 * (`seed:secao`) para que cada seção escolha de forma INDEPENDENTE — 3 variantes × 4 seções dão
 * 3⁴ = 81 composições, não 3. A ESTRUTURA é independente do nicho (o clima entra por CSS por
 * cima), então são 12 estruturas servindo os 2 climas. Determinístico: mesmo lead = mesmo site.
 */
export type SecaoId = "servicos" | "prova" | "sobre" | "contato";
export function varianteSecao(seed: string, secao: SecaoId): 0 | 1 | 2 {
  return (hashSemente(seed + ":" + secao) % 3) as 0 | 1 | 2;
}
