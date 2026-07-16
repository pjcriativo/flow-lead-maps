// Prompt + sanitização COMPARTILHADOS entre os provedores (OpenAI/Claude).
// A IA gera o CONTEÚDO (copy) em JSON; o template premium monta o HTML.
import type { MateriaPrima, ConteudoIA, ServicoIA, FaqIA } from "./types.ts";

export const ICONES =
  "tooth, sparkles, shield, heart, smile, stethoscope, star, clock, phone, map-pin, check-circle, scissors, wrench, car, paw, scale, calculator, briefcase, users, award, leaf, home, camera, calendar, message-circle, gem, crown, droplet";

export const SYSTEM = `Você é um COPYWRITER e diretor de conteúdo sênior, especialista em sites de conversão para pequenos negócios brasileiros. Você NÃO desenha o site — um template premium (nível agência) já cuida do design. Sua tarefa é escrever TODO o conteúdo de texto do site, usando SOMENTE os dados reais fornecidos.

REGRAS:
1. NUNCA invente fatos: nada de anos de experiência, prêmios, números, endereços, preços ou depoimentos que não estejam nos dados. Se não sabe, não afirme.
1b. PROIBIDO EMITIR REGISTRO PROFISSIONAL: nunca escreva número de CRO, CRM, OAB, CRC, CREA, CRF, CRP, CRECI, CNPJ, CPF ou qualquer registro/inscrição regulada — a MENOS que o número apareça LITERALMENTE no "texto_do_site_atual". Registro é dado verificável e regulado; inventar um é fraude. Na dúvida, não cite nenhum registro nem "responsável técnico".
2. Seja ESPECÍFICO do negócio: use a categoria, a cidade e (quando houver) o TEXTO REAL do site atual. PROIBIDO clichê genérico ("sorrisos que transformam", "qualidade e compromisso", "bem-vindo ao nosso site").
2b. ADAPTE o vocabulário ao RAMO. Ex.: advocacia/jurídico fala de causa, defesa, direitos, cliente, consultoria, áreas de atuação — NUNCA "paciente", "tratamento", "sorriso", "bem-estar". Não vaze vocabulário de saúde num negócio que não é de saúde.
3. Prova social: use a NOTA do Google e o nº de avaliações no hero/sobre — é o ativo mais forte.
4. SERVIÇOS: se o texto do site atual listar serviços/especialidades, use ESSES (reescritos com clareza). Se o site for ilegível ou não listar, escreva serviços PADRÃO e realistas da categoria (sem inventar procedimentos exóticos).
5. DIFERENCIAIS: 3-4 motivos para escolher o negócio (benefícios reais/coerentes, ex.: atendimento humanizado, estrutura moderna, nota alta no Google).
6. FAQ (REGRA DURA — não inventar): gere SÓ perguntas cuja resposta saia dos DADOS REAIS: "Como agendo?" (responda com WhatsApp/telefone reais), "Onde ficam / como chegar?" (responda com o endereço real), "Quais serviços oferecem?" (responda com os serviços). É PROIBIDO perguntar/afirmar horário de funcionamento, convênios/planos, formas de pagamento, preços ou atendimento de emergência — NÃO temos esses dados. Se não der 3 perguntas com dado real, gere 2. Sem "das 8h às 18h", sem "aceitamos todos os convênios".
7. Tom pt-BR, profissional e acolhedor. Frases curtas e persuasivas.

RESPONDA APENAS com um JSON válido (sem markdown, sem cercas), neste formato EXATO:
{
  "headline": "curta (~70 car.), benefício claro + categoria/cidade",
  "subheadline": "1 frase de apoio (pode citar a nota do Google)",
  "servicos": [ { "titulo": "curto", "descricao": "~90 car.", "icone": "palavra da lista" } ],
  "diferenciais": [ { "titulo": "curto", "descricao": "~80 car.", "icone": "palavra da lista" } ],
  "sobre": "2-4 frases, autoridade, use nota/avaliações reais, sem inventar",
  "faq": [ { "pergunta": "curta", "resposta": "1-2 frases úteis" } ],
  "cta": "ação curta (ex.: Agendar avaliação)",
  "servicos_reais": true
}
IMPORTANTE: "servicos_reais" = true SOMENTE se os serviços/áreas vieram do TEXTO REAL do site do lead. Se você teve que usar serviços genéricos do nicho (site ilegível ou sem lista), coloque false — é honestidade obrigatória.
Use 4-6 servicos, 3-4 diferenciais, 2-4 faq (só com dado real). O campo "icone" DEVE ser uma destas palavras: ${ICONES}.`;

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
    servicosReais: o.servicos_reais === true || o.servicosReais === true,
  };
}

// ===== GARANTIA anti-fraude de REGISTROS PROFISSIONAIS =====
// O prompt pede pra IA não inventar CRO/CRM/OAB/CNPJ..., mas LLM alucina. Esta camada
// é a garantia: remove do conteúdo qualquer registro cujo NÚMERO não apareça no texto
// extraído do lead. Se estiver na fonte (dado real do site), mantém. Erra pro lado de
// REMOVER (na dúvida, fora) — melhor perder um registro real do que publicar um falso.
const REG_SIGLAS =
  "CRO|CRM|OAB|CRC|CREA|CRF|CRP|CRECI|CRQ|CRMV|COREN|CRN|CRB|CRA|CAU|CNPJ|CPF|CNAE|NIRE";
const REG_RE = new RegExp(
  `\\b(?:${REG_SIGLAS})\\b(?:\\s*[./-]?\\s*[A-Z]{2})?[\\s:.ºn°/-]*(\\d[\\d.\\-/ ]{2,}\\d)`,
  "gi",
);

/** Números (só dígitos) que aparecem como TOKEN no texto-fonte extraído. */
function numerosDaFonte(fonte: string): Set<string> {
  const set = new Set<string>();
  for (const t of fonte.match(/\d[\d.\-/ ]{2,}\d/g) ?? []) set.add(t.replace(/\D/g, ""));
  return set;
}

// Abreviações comuns pt-BR: o ponto delas NÃO encerra frase (senão "Dr. Fulano —
// CRO 999" quebraria em "...Dr." e deixaria um fragmento pendurado ao remover).
const ABREV = /\b(Dr|Dra|Sr|Sra|Srta|Profa?|Exm[oa]|Ltda|Me|Sto|Sta|Av|Pça|nº|no)\./gi;
const PONTO = ""; // marcador temporário do ponto de abreviação

/** Remove as FRASES que citam um registro cujo número NÃO está na fonte. */
function limparRegistros(
  txt: string,
  fonteNums: Set<string>,
): { txt: string; removidos: string[] } {
  if (!txt) return { txt, removidos: [] };
  const removidos: string[] = [];
  const marc = txt.replace(ABREV, (m) => m.slice(0, -1) + PONTO);
  const frases = marc.split(/(?<=[.!?…])\s+/);
  const mantidas = frases.filter((fr) => {
    let inventado = false;
    for (const m of fr.matchAll(REG_RE)) {
      const num = (m[1] ?? "").replace(/\D/g, "");
      if (num && !fonteNums.has(num)) {
        inventado = true;
        removidos.push(m[0].replace(new RegExp(PONTO, "g"), ".").trim());
      }
    }
    return !inventado;
  });
  return {
    txt: mantidas
      .join(" ")
      .replace(new RegExp(PONTO, "g"), ".")
      .replace(/\s{2,}/g, " ")
      .trim(),
    removidos,
  };
}

/**
 * Passa o conteúdo pela garantia: registro profissional só sobrevive se o número
 * estiver no texto extraído do lead. Devolve o conteúdo limpo + a lista do que caiu.
 */
export function sanearRegistros(
  c: ConteudoIA,
  fonte: string,
): { conteudo: ConteudoIA; removidos: string[] } {
  const nums = numerosDaFonte(fonte || "");
  const removidos: string[] = [];
  const limpa = (t: string) => {
    const r = limparRegistros(t, nums);
    removidos.push(...r.removidos);
    return r.txt;
  };
  const conteudo: ConteudoIA = {
    ...c,
    subheadline: limpa(c.subheadline),
    sobre: limpa(c.sobre),
    servicos: c.servicos.map((s) => ({ ...s, descricao: limpa(s.descricao) })),
    diferenciais: c.diferenciais.map((s) => ({ ...s, descricao: limpa(s.descricao) })),
    faq: c.faq.map((f) => ({ ...f, resposta: limpa(f.resposta) })),
  };
  return { conteudo, removidos };
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
