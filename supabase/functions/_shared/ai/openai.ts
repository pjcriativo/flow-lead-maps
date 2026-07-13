// Provedor de IA: OpenAI (Chat Completions) — v2. A IA gera SÓ o CONTEÚDO (copy)
// em JSON; o template monta o HTML. Chave em secret OPENAI_API_KEY; modelo em
// OPENAI_MODEL (default gpt-4o). Qualidade > custo.
import type { AiProvider, MateriaPrima, ConteudoIA, ServicoIA } from "./types.ts";

const PRECOS: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
  "gpt-4-turbo": { in: 10, out: 30 },
};

const ICONES =
  "tooth, sparkles, shield, heart, smile, stethoscope, star, clock, phone, map-pin, check-circle, scissors, wrench, car, paw, scale, calculator, briefcase, users, award, leaf, home, camera, calendar, message-circle, gem, crown, droplet";

const SYSTEM = `Você é um COPYWRITER sênior de conversão para pequenos negócios brasileiros. Você NÃO desenha sites — um template premium já cuida do design. Sua única tarefa é escrever o CONTEÚDO (texto) que preenche o template, usando SOMENTE os dados reais fornecidos.

REGRAS:
1. NUNCA invente fatos: nada de anos de experiência, prêmios, números, procedimentos ou depoimentos que não estejam nos dados. Se não sabe, não afirme.
2. Seja ESPECÍFICO do negócio: cite a categoria e a cidade reais. PROIBIDO clichê genérico como "sorrisos que transformam", "qualidade e compromisso" soltos, "bem-vindo ao nosso site".
3. Use a PROVA SOCIAL real quando existir (nota do Google e nº de avaliações) no texto do "sobre" e nas subheadlines — é o ativo mais forte.
4. Serviços: baseie-se no texto do site atual e na categoria. Se o site listar serviços, use-os (reescritos). Se não houver evidência de serviços específicos, escreva 3 DIFERENCIAIS coerentes com a categoria (não procedimentos inventados).
5. Tom pt-BR, profissional e acolhedor. Frases curtas e persuasivas.

RESPONDA APENAS com um JSON válido, sem markdown, neste formato exato:
{
  "headline": "string curta (max ~75 caracteres), benefício claro + categoria/cidade",
  "subheadline": "string (1 frase de apoio, pode citar a nota do Google)",
  "servicos": [ { "titulo": "string curta", "descricao": "string (max ~90 caracteres)", "icone": "uma palavra da lista" } ],
  "sobre": "string (2-3 frases, autoridade, use nota/avaliações reais, sem inventar)",
  "cta": "string curta de ação (ex.: Agendar avaliação)"
}
Use de 3 a 6 serviços. O campo "icone" DEVE ser uma destas palavras: ${ICONES}.`;

function promptUsuario(mp: MateriaPrima, nicho: string): string {
  const dados = {
    nome: mp.nome,
    categoria: mp.categoria,
    cidade: mp.cidade,
    estado: mp.estado,
    nicho_do_template: nicho,
    nota_google: mp.rating,
    numero_de_avaliacoes: mp.reviews,
    endereco: mp.endereco,
    tem_whatsapp: !!mp.whatsapp,
    instagram: mp.instagram,
    texto_do_site_atual: mp.textos?.slice(0, 2800) || "(sem site atual / sem texto útil)",
  };
  return `Escreva o conteúdo para este negócio (não invente nada além disto):\n\n${JSON.stringify(dados, null, 2)}`;
}

function sanear(raw: unknown): ConteudoIA {
  const o = (raw ?? {}) as Record<string, unknown>;
  const servicosIn = Array.isArray(o.servicos) ? o.servicos : [];
  const servicos: ServicoIA[] = servicosIn
    .map((s) => {
      const x = (s ?? {}) as Record<string, unknown>;
      return {
        titulo: String(x.titulo ?? "").trim(),
        descricao: String(x.descricao ?? "").trim(),
        icone: String(x.icone ?? "check-circle")
          .trim()
          .toLowerCase(),
      };
    })
    .filter((s) => s.titulo)
    .slice(0, 6);
  const headline = String(o.headline ?? "").trim();
  if (!headline) throw new Error("IA não retornou headline");
  return {
    headline,
    subheadline: String(o.subheadline ?? "").trim(),
    servicos,
    sobre: String(o.sobre ?? "").trim(),
    cta: String(o.cta ?? "").trim() || "Fale conosco",
  };
}

export const gerarConteudoOpenAI: AiProvider = async (mp, nicho) => {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY não configurada no secret da Edge Function.");
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
      max_tokens: 1600,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI: ${data?.error?.message ?? "HTTP " + res.status}`);

  const txt: string = data.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(txt);
  } catch {
    throw new Error("IA não retornou JSON válido");
  }
  const conteudo = sanear(parsed);

  const inTok = data.usage?.prompt_tokens ?? 0;
  const outTok = data.usage?.completion_tokens ?? 0;
  const p = PRECOS[modelo] ?? { in: 2.5, out: 10 };
  const custoUsd = (inTok * p.in + outTok * p.out) / 1_000_000;

  return { conteudo, modelo, inputTokens: inTok, outputTokens: outTok, custoUsd, fallback: false };
};
