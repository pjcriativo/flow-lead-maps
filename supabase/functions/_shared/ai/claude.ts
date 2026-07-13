// Provedor de IA: Claude (Anthropic Messages API). Melhor para copy/design.
// Chave em ANTHROPIC_API_KEY; modelo em ANTHROPIC_MODEL (default claude-sonnet-4-5).
// Gera SÓ o CONTEÚDO (copy) em JSON; o template monta o HTML.
import type { AiProvider } from "./types.ts";
import { SYSTEM, promptUsuario, sanear, extrairJson } from "./prompt.ts";

// Preço por 1M tokens (USD). Ajuste conforme o modelo escolhido.
const PRECOS: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-5": { in: 3, out: 15 },
  "claude-opus-4-8": { in: 15, out: 75 },
  "claude-3-5-sonnet-latest": { in: 3, out: 15 },
  "claude-3-5-haiku-latest": { in: 0.8, out: 4 },
};

export const gerarConteudoClaude: AiProvider = async (mp, nicho) => {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY não configurada.");
  const modelo = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 3000,
      temperature: 0.6,
      system: SYSTEM + "\n\nResponda APENAS com o JSON, começando por { e terminando por }.",
      messages: [{ role: "user", content: promptUsuario(mp, nicho) }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Claude: ${data?.error?.message ?? "HTTP " + res.status}`);

  const txt = Array.isArray(data.content)
    ? data.content.map((c: { text?: string }) => c.text ?? "").join("")
    : "";
  const conteudo = sanear(extrairJson(txt));
  const inTok = data.usage?.input_tokens ?? 0;
  const outTok = data.usage?.output_tokens ?? 0;
  const p = PRECOS[modelo] ?? { in: 3, out: 15 };
  const custoUsd = (inTok * p.in + outTok * p.out) / 1_000_000;

  return { conteudo, modelo, inputTokens: inTok, outputTokens: outTok, custoUsd, fallback: false };
};
