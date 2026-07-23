// Provedor de IA: OpenAI (Chat Completions). Gera SÓ o CONTEÚDO (copy) em JSON;
// o template monta o HTML. Chave em OPENAI_API_KEY; modelo em OPENAI_MODEL
// (default gpt-4o). Usa o prompt/sanitização compartilhados (ai/prompt.ts).
import type { AiProvider } from "./types.ts";
import { SYSTEM, promptUsuario, sanear, extrairJson } from "./prompt.ts";

const PRECOS: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4-turbo": { in: 10, out: 30 },
};

// 🔐 Cofre de chaves: chamado 1x por request (setOpenAiKeyOverride, via ai/index.ts) —
// Deno.env.set não funciona no runtime das Edges, por isso o cache de módulo aqui.
let _openAiKeyCache: string | null = null;
export function setOpenAiKeyOverride(v: string | null): void {
  _openAiKeyCache = v;
}

export const gerarConteudoOpenAI: AiProvider = async (mp, nicho) => {
  const key = _openAiKeyCache ?? Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY não configurada.");
  const modelo = Deno.env.get("OPENAI_MODEL") || "gpt-4o";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: promptUsuario(mp, nicho) },
      ],
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI: ${data?.error?.message ?? "HTTP " + res.status}`);

  const conteudo = sanear(extrairJson(data.choices?.[0]?.message?.content ?? ""));
  const inTok = data.usage?.prompt_tokens ?? 0;
  const outTok = data.usage?.completion_tokens ?? 0;
  const p = PRECOS[modelo] ?? { in: 2.5, out: 10 };
  const custoUsd = (inTok * p.in + outTok * p.out) / 1_000_000;

  return { conteudo, modelo, inputTokens: inTok, outputTokens: outTok, custoUsd, fallback: false };
};
