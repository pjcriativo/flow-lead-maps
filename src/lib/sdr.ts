// AGENTE SDR — incremento 1: responde INBOUND (quem já respondeu), com PORTÃO.
//
// Lógica PURA (testada sem gastar IA). Aqui moram as travas que impedem os dois desastres:
//
// 1) RESPONDER A PESSOA ERRADA. O número conectado é o WhatsApp PESSOAL do dono — hoje 100% das
//    conversas recebidas são pessoais (família, amigos). O agente SÓ pode agir em conversa
//    vinculada a um LEAD. Sem lead_id, ele não escreve nada. Nunca.
//
// 2) PROMETER O QUE NÃO PODEMOS CUMPRIR. O rascunho vai SEMPRE para aprovação do dono (o mesmo
//    portão do disparo), e ainda sinalizamos quando o texto contém preço/prazo/garantia — coisas
//    que o agente não tem como saber e que criariam obrigação na boca do dono.

export const TETO_SDR_DIA_USD = 1;
export const TETO_SDR_MES_USD = 10;

export type MensagemConversa = {
  id: string;
  numero: string;
  lead_id: string | null;
  direcao: "in" | "out" | string;
  texto: string | null;
  criado_em: string;
};

export type MotivoInelegivel =
  "sem_lead" | "sem_mensagem" | "ultima_e_nossa" | "ja_tem_sugestao" | "sem_texto";

export type Elegibilidade = { elegivel: boolean; motivo?: MotivoInelegivel };

/**
 * Esta conversa pode receber um rascunho do agente?
 * A trava nº 1 é `lead_id`: conversa que não é de lead é vida pessoal do dono — fora.
 */
export function conversaElegivel(msgs: MensagemConversa[], jaTemSugestao: boolean): Elegibilidade {
  if (msgs.length === 0) return { elegivel: false, motivo: "sem_mensagem" };
  // TRAVA 1 — sem lead vinculado, o agente não toca.
  if (!msgs.some((m) => m.lead_id)) return { elegivel: false, motivo: "sem_lead" };
  if (jaTemSugestao) return { elegivel: false, motivo: "ja_tem_sugestao" };

  const ordenadas = [...msgs].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  const ultima = ordenadas[ordenadas.length - 1];
  // só faz sentido responder quem falou por último; se a última é nossa, a bola é do lead.
  if (ultima.direcao !== "in") return { elegivel: false, motivo: "ultima_e_nossa" };
  if (!ultima.texto || !ultima.texto.trim()) return { elegivel: false, motivo: "sem_texto" };
  return { elegivel: true };
}

/** Promessas que o agente NÃO tem como sustentar — viram alerta para o dono revisar. */
const PADROES_PROMESSA: { rotulo: string; re: RegExp }[] = [
  // atenção ao "R$": \b depois de "$" NUNCA casa (nem "$" nem espaço são caractere de palavra),
  // então um \b no fim faria o detector perder justamente "R$ 500".
  {
    rotulo: "preço",
    re: /(R\$\s*\d|\breais\b|\bvalor de\b|\bcusta\b|\bpre[çc]o\b|\bpor apenas\b)/i,
  },
  {
    rotulo: "prazo",
    re: /\b(em \d+\s*(dias?|horas?|semanas?)|at[ée] (amanh[ãa]|sexta|segunda)|hoje mesmo)\b/i,
  },
  { rotulo: "garantia", re: /\b(garanto|garantia|100%|com certeza|prometo|assegur)/i },
  { rotulo: "desconto", re: /\b(desconto|gr[áa]tis|de gra[çc]a|sem custo|cortesia)\b/i },
];

export type Alerta = { rotulo: string; trecho: string };

/** Sinaliza (não bloqueia) compromissos inventados: quem decide é o dono, mas ele é AVISADO. */
export function alertasDePromessa(texto: string): Alerta[] {
  const out: Alerta[] = [];
  for (const p of PADROES_PROMESSA) {
    const m = texto.match(p.re);
    if (m) out.push({ rotulo: p.rotulo, trecho: m[0] });
  }
  return out;
}

/** O agente nunca envia: todo rascunho nasce aguardando aprovação. */
export type EstadoSugestao = "rascunho" | "aprovada" | "descartada" | "enviada";
export const ESTADO_INICIAL: EstadoSugestao = "rascunho";

export type PlanoSdr = { podeRodar: boolean; motivo?: string; restanteDiaUsd: number };

/** Teto de gasto da IA do agente — mesma doutrina do resto: não liga sem teto. */
export function planejarSdr(
  gastoDiaUsd: number,
  gastoMesUsd: number,
  tetoDia: number = TETO_SDR_DIA_USD,
  tetoMes: number = TETO_SDR_MES_USD,
): PlanoSdr {
  const restanteDiaUsd = Math.max(0, tetoDia - gastoDiaUsd);
  if (gastoMesUsd >= tetoMes)
    return { podeRodar: false, motivo: `teto mensal de US$ ${tetoMes} atingido`, restanteDiaUsd };
  if (restanteDiaUsd <= 0)
    return { podeRodar: false, motivo: `teto diário de US$ ${tetoDia} atingido`, restanteDiaUsd };
  return { podeRodar: true, restanteDiaUsd };
}

/** Monta o histórico da conversa para o prompt, do mais antigo ao mais novo. */
export function historicoParaPrompt(msgs: MensagemConversa[], limite = 20): string {
  return [...msgs]
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em))
    .slice(-limite)
    .map((m) => `${m.direcao === "in" ? "LEAD" : "NÓS"}: ${(m.texto ?? "").trim()}`)
    .join("\n");
}
