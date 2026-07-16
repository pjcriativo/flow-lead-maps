// Dispatch dos provedores de IA (plugável). A IA gera o CONTEÚDO (copy JSON),
// não o HTML. Cadeia com fallback: tenta o preferido, depois o próximo, e só então
// o orquestrador cai no rule-based. AI_PROVIDER força um provedor específico.
import type { AiProvider } from "./types.ts";
import { gerarConteudoOpenAI } from "./openai.ts";
import { gerarConteudoClaude } from "./claude.ts";

export type ProvedorNomeado = { nome: string; fn: AiProvider };

/**
 * Ordem de tentativa dos provedores. Default: Claude (melhor p/ copy) → OpenAI.
 * Cada um lança se a chave não estiver configurada → o próximo assume.
 * AI_PROVIDER=openai|claude força só aquele.
 */
export function getProviderChain(): ProvedorNomeado[] {
  const forcado = (Deno.env.get("AI_PROVIDER") || "").toLowerCase();
  const claude: ProvedorNomeado = { nome: "claude", fn: gerarConteudoClaude };
  const openai: ProvedorNomeado = { nome: "openai", fn: gerarConteudoOpenAI };
  if (forcado === "openai") return [openai];
  if (forcado === "claude") return [claude];
  return [claude, openai];
}

export { sanearRegistros } from "./prompt.ts";

export type {
  MateriaPrima,
  ConteudoIA,
  ServicoIA,
  FaqIA,
  GerarConteudoResult,
  AiProvider,
} from "./types.ts";
