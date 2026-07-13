// Prompt + sanitização COMPARTILHADOS entre os provedores (OpenAI/Claude).
// A IA gera o CONTEÚDO (copy) em JSON; o template premium monta o HTML.
import type { MateriaPrima, ConteudoIA, ServicoIA, FaqIA } from "./types.ts";

export const ICONES =
  "tooth, sparkles, shield, heart, smile, stethoscope, star, clock, phone, map-pin, check-circle, scissors, wrench, car, paw, scale, calculator, briefcase, users, award, leaf, home, camera, calendar, message-circle, gem, crown, droplet";

export const SYSTEM = `Você é um COPYWRITER e diretor de conteúdo sênior, especialista em sites de conversão para pequenos negócios brasileiros. Você NÃO desenha o site — um template premium (nível agência) já cuida do design. Sua tarefa é escrever TODO o conteúdo de texto do site, usando SOMENTE os dados reais fornecidos.

REGRAS:
1. NUNCA invente fatos: nada de anos de experiência, prêmios, números, endereços, preços ou depoimentos que não estejam nos dados. Se não sabe, não afirme.
2. Seja ESPECÍFICO do negócio: use a categoria, a cidade e (quando houver) o TEXTO REAL do site atual. PROIBIDO clichê genérico ("sorrisos que transformam", "qualidade e compromisso", "bem-vindo ao nosso site").
3. Prova social: use a NOTA do Google e o nº de avaliações no hero/sobre — é o ativo mais forte.
4. SERVIÇOS: se o texto do site atual listar serviços/especialidades, use ESSES (reescritos com clareza). Se o site for ilegível ou não listar, escreva serviços PADRÃO e realistas da categoria (sem inventar procedimentos exóticos).
5. DIFERENCIAIS: 3-4 motivos para escolher o negócio (benefícios reais/coerentes, ex.: atendimento humanizado, estrutura moderna, nota alta no Google).
6. FAQ: 3-5 perguntas frequentes REAIS do nicho, com respostas úteis e curtas.
7. Tom pt-BR, profissional e acolhedor. Frases curtas e persuasivas.

RESPONDA APENAS com um JSON válido (sem markdown, sem cercas), neste formato EXATO:
{
  "headline": "curta (~70 car.), benefício claro + categoria/cidade",
  "subheadline": "1 frase de apoio (pode citar a nota do Google)",
  "servicos": [ { "titulo": "curto", "descricao": "~90 car.", "icone": "palavra da lista" } ],
  "diferenciais": [ { "titulo": "curto", "descricao": "~80 car.", "icone": "palavra da lista" } ],
  "sobre": "2-4 frases, autoridade, use nota/avaliações reais, sem inventar",
  "faq": [ { "pergunta": "curta", "resposta": "1-2 frases úteis" } ],
  "cta": "ação curta (ex.: Agendar avaliação)"
}
Use 4-6 servicos, 3-4 diferenciais, 3-5 faq. O campo "icone" DEVE ser uma destas palavras: ${ICONES}.`;

export function promptUsuario(mp: MateriaPrima, nicho: string): string {
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
    site_legivel: mp.legivel,
    descricao_do_site: mp.descricao,
    texto_do_site_atual: mp.legivel
      ? mp.textos?.slice(0, 3500)
      : "(site ilegível — texto em imagem/JS; escreva conteúdo padrão da categoria)",
  };
  return `Escreva o conteúdo para este negócio (não invente nada além disto):\n\n${JSON.stringify(dados, null, 2)}`;
}

function servico(x: unknown): ServicoIA {
  const o = (x ?? {}) as Record<string, unknown>;
  return {
    titulo: String(o.titulo ?? "").trim(),
    descricao: String(o.descricao ?? "").trim(),
    icone: String(o.icone ?? "check-circle")
      .trim()
      .toLowerCase(),
  };
}

/** Valida e normaliza a saída da IA em ConteudoIA (nunca deixa campo quebrado). */
export function sanear(raw: unknown): ConteudoIA {
  const o = (raw ?? {}) as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const servicos = arr(o.servicos)
    .map(servico)
    .filter((s) => s.titulo)
    .slice(0, 6);
  const diferenciais = arr(o.diferenciais)
    .map(servico)
    .filter((s) => s.titulo)
    .slice(0, 4);
  const faq: FaqIA[] = arr(o.faq)
    .map((x) => {
      const q = (x ?? {}) as Record<string, unknown>;
      return {
        pergunta: String(q.pergunta ?? "").trim(),
        resposta: String(q.resposta ?? "").trim(),
      };
    })
    .filter((f) => f.pergunta && f.resposta)
    .slice(0, 5);
  const headline = String(o.headline ?? "").trim();
  if (!headline) throw new Error("IA não retornou headline");
  return {
    headline,
    subheadline: String(o.subheadline ?? "").trim(),
    servicos,
    diferenciais,
    sobre: String(o.sobre ?? "").trim(),
    faq,
    cta: String(o.cta ?? "").trim() || "Fale conosco",
  };
}

/** Extrai o primeiro objeto JSON de um texto (tolera markdown/cercas). */
export function extrairJson(txt: string): unknown {
  const limpo = txt
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(limpo);
  } catch {
    const m = limpo.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("IA não retornou JSON válido");
  }
}
