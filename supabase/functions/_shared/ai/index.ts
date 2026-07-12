// Dispatch do provedor de IA (plugável). O secret AI_PROVIDER decide qual usar;
// hoje só OpenAI. Para plugar Claude/OpenRouter: implementar o AiProvider e
// adicionar um case aqui.
import type { AiProvider } from "./types.ts";
import { gerarSiteOpenAI } from "./openai.ts";

export function getAiProvider(): AiProvider {
  const nome = (Deno.env.get("AI_PROVIDER") || "openai").toLowerCase();
  switch (nome) {
    // case "claude": return gerarSiteClaude;
    // case "openrouter": return gerarSiteOpenRouter;
    case "openai":
    default:
      return gerarSiteOpenAI;
  }
}

export type { MateriaPrima, GerarSiteResult, AiProvider } from "./types.ts";
