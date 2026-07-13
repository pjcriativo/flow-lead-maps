// Edge Function: melhorar-proposta (Fase 2, opcional "híbrido").
// Recebe a copy montada por template e pede ao Claude para reescrever mais
// persuasiva/humana, SEM preço, preservando o link único e sem gatilhos de spam.
// Devolve { assunto, corpo } — a UI revisa e o usuário salva. Chave em secret.
import { corsHeaders, json } from "../_shared/cors.ts";

const SYSTEM = `Você é redator de prospecção B2B no Brasil. Reescreve uma mensagem de
PRIMEIRA ABORDAGEM (e-mail/WhatsApp) para dono de negócio local, tornando-a mais
persuasiva e humana, sem parecer spam. REGRAS INVIOLÁVEIS:
- NUNCA cite preço, valor ou custo.
- MANTENHA exatamente o mesmo link (URL) que já está na mensagem, uma única vez;
  não invente outro link nem remova o existente.
- Não invente números, prêmios, notas ou fatos que não estejam na mensagem original.
- Tom cordial, direto, brasileiro, em 1ª pessoa; curto (5 a 9 linhas).
- Sem palavras-gatilho de spam (grátis, promoção, urgente, clique aqui, garantido, oferta).
- Assunto: uma PERGUNTA curta e pessoal, no máximo 60 caracteres, sem CAPS.
Responda APENAS um JSON válido: {"assunto":"...","corpo":"..."}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "IA indisponível (sem chave configurada)" }, 503);

  let body: { assunto?: string; corpo?: string; lead_nome?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const assunto = (body.assunto ?? "").slice(0, 200);
  const corpo = (body.corpo ?? "").slice(0, 4000);
  if (!corpo.trim()) return json({ error: "Corpo vazio" }, 400);

  const modelo = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8";
  const urlOriginal = corpo.match(/https?:\/\/\S+/)?.[0] ?? "";
  const prompt = `Negócio: ${body.lead_nome ?? ""}

Assunto atual:
${assunto}

Mensagem atual:
${corpo}

Reescreva melhorando a persuasão e a naturalidade, respeitando TODAS as regras.
Preserve o link exatamente como está${urlOriginal ? ` (${urlOriginal})` : ""}.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 1200,
      system: SYSTEM + "\n\nResponda APENAS com o JSON, começando por { e terminando por }.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok)
    return json({ error: `Claude: ${data?.error?.message ?? "HTTP " + res.status}` }, 502);

  const txt = Array.isArray(data.content)
    ? data.content.map((c: { text?: string }) => c.text ?? "").join("")
    : "";
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return json({ error: "Resposta da IA inválida" }, 502);
  let out: { assunto?: string; corpo?: string };
  try {
    out = JSON.parse(m[0]);
  } catch {
    return json({ error: "JSON da IA inválido" }, 502);
  }

  let novoCorpo = (out.corpo ?? corpo).trim();
  // Blindagem: se a IA removeu/alterou o link, reinjeta o original.
  if (urlOriginal && !novoCorpo.includes(urlOriginal)) novoCorpo += `\n\n${urlOriginal}`;
  const novoAssunto = (out.assunto ?? assunto).slice(0, 120);

  return json({ assunto: novoAssunto, corpo: novoCorpo });
});
