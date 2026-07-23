// Dispatch dos provedores de IA (plugável). A IA gera o CONTEÚDO (copy JSON),
// não o HTML. Cadeia com fallback: tenta o preferido, depois o próximo, e só então
// o orquestrador cai no rule-based. AI_PROVIDER força um provedor específico.
import type { AiProvider } from "./types.ts";
import { gerarConteudoOpenAI, setOpenAiKeyOverride, setOpenAiModeloOverride } from "./openai.ts";
import {
  gerarConteudoClaude,
  setAnthropicKeyOverride,
  setAnthropicModeloOverride,
} from "./claude.ts";
import { resolverChave } from "../chaves.ts";
import { lerConfigPlataforma } from "../config.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

/** Chamar 1x no início do handler (com o admin client) antes de getProviderChain() — aplica
 * o override do cofre de chaves (ANTHROPIC/OPENAI) e os modelos escolhidos em Configurações. */
export async function inicializarCofreIa(admin: Admin): Promise<void> {
  setAnthropicKeyOverride(await resolverChave(admin, "ANTHROPIC_API_KEY"));
  setOpenAiKeyOverride(await resolverChave(admin, "OPENAI_API_KEY"));
  const config = await lerConfigPlataforma(admin);
  setAnthropicModeloOverride(config.modelo_ia);
  setOpenAiModeloOverride(config.modelo_openai);
}

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
