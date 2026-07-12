// Provedor de IA: OpenAI (Chat Completions). Chave em secret OPENAI_API_KEY.
// Modelo configurável por secret OPENAI_MODEL (default gpt-4o).
import type { AiProvider, MateriaPrima } from "./types.ts";

// Preços por 1M tokens (USD) para estimar o custo por geração.
const PRECOS: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4.1": { in: 2, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
};

const SYSTEM = `Você é um web designer sênior de sites de CONVERSÃO para pequenos negócios brasileiros. Gere um site NOVO, moderno e responsivo a partir dos dados fornecidos.

REGRAS INVIOLÁVEIS:
1. NÃO invente NENHUM fato. Use só o que está nos dados (nome, categoria, telefone, whatsapp, nota, avaliações, endereço, textos do site atual). Nunca invente serviços, preços, anos de experiência ou depoimentos.
2. Mantenha a IDENTIDADE do cliente: use o LOGO (URL dada), as FOTOS do cliente (URLs dadas) e a PALETA de cores dada. NÃO use imagens de stock aleatórias — use as URLs fornecidas. Se não houver imagens, use blocos de cor/gradiente sólidos, sem inventar fotos.
3. Reescreva o texto com copy FORTE (não copie o texto atual cru): headline = benefício claro. CTA principal: se houver WhatsApp, use link wa.me pré-preenchido (https://wa.me/NUMERO?text=mensagem); se NÃO houver WhatsApp mas houver telefone, use um link tel:+55... . Tom profissional e acolhedor, pt-BR.
4. ESTRUTURA (nesta ordem): hero (headline + subheadline + CTA) · prova social (mostre a NOTA real do Google e o nº de avaliações, se houver) · serviços (SÓ os que aparecem nos textos/categoria reais — se não houver, faça uma seção genérica curta SEM inventar serviços específicos) · sobre (curto, sem inventar) · localização/contato (endereço + telefone + WhatsApp; se houver endereço, inclua link do Google Maps: https://www.google.com/maps/search/?api=1&query=ENDERECO_URL_ENCODED) · rodapé (nome + redes se houver).
5. RESPONSIVO total de 360px a 1440px sem quebrar. ARQUIVO HTML ÚNICO com TODO o CSS em <style> no próprio arquivo, sem build/dependências externas (Google Fonts via <link> é permitido). CSS moderno (flex/grid, variáveis). Inclua um botão flutuante de WhatsApp.

SAÍDA: responda APENAS com o HTML completo (de <!doctype html> a </html>). Sem explicações, sem markdown, sem cercas de código.`;

function promptUsuario(mp: MateriaPrima): string {
  const dados = {
    nome: mp.nome,
    categoria: mp.categoria,
    endereco: mp.endereco,
    telefone: mp.telefone,
    whatsapp: mp.whatsapp,
    nota_google: mp.rating,
    numero_de_avaliacoes: mp.reviews,
    instagram: mp.instagram,
    facebook: mp.facebook,
    logo_url: mp.logo,
    fotos_urls: mp.imagens,
    cores_atuais: mp.cores,
    texto_do_site_atual: mp.textos?.slice(0, 2500) || "(sem site atual / sem texto)",
  };
  return `Gere o site para este negócio, seguindo TODAS as regras. Dados reais (não invente nada além disto):\n\n${JSON.stringify(dados, null, 2)}`;
}

export const gerarSiteOpenAI: AiProvider = async (mp) => {
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
        { role: "user", content: promptUsuario(mp) },
      ],
      temperature: 0.7,
      max_tokens: 9000,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`OpenAI: ${data?.error?.message ?? "HTTP " + res.status}`);
  }
  let html: string = data.choices?.[0]?.message?.content ?? "";
  // remove eventuais cercas de código
  html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  const inTok = data.usage?.prompt_tokens ?? 0;
  const outTok = data.usage?.completion_tokens ?? 0;
  const p = PRECOS[modelo] ?? { in: 2.5, out: 10 };
  const custoUsd = (inTok * p.in + outTok * p.out) / 1_000_000;

  return { html, modelo, inputTokens: inTok, outputTokens: outTok, custoUsd };
};
