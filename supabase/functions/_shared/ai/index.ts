// Dispatch do provedor de IA (plugável). O secret AI_PROVIDER decide qual usar;
// hoje só OpenAI. Para plugar Claude/OpenRouter: implementar o AiProvider (que
// gera o CONTEÚDO JSON, não o HTML) e adicionar um case aqui.
import type { AiProvider } from "./types.ts";
import { gerarConteudoOpenAI } from "./openai.ts";

export function getAiProvider(): AiProvider {
  const nome = (Deno.env.get("AI_PROVIDER") || "openai").toLowerCase();
  switch (nome) {
    // case "claude": return gerarConteudoClaude;
    // case "openrouter": return gerarConteudoOpenRouter;
    case "openai":
    default:
      return gerarConteudoOpenAI;
  }
}

export type {
  MateriaPrima,
  ConteudoIA,
  ServicoIA,
  GerarConteudoResult,
  AiProvider,
} from "./types.ts";
