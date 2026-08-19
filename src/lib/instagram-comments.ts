export type RotuloIntencaoComentario =
  "compra" | "duvida" | "interesse" | "elogio" | "generico" | "spam";

export type ClassificacaoComentario = {
  rotulo: RotuloIntencaoComentario;
  score: number;
  sinais: string[];
  spam: boolean;
};

export type ComentarioCandidato = {
  username: string;
  texto: string;
  likes?: number | null;
  ocorridoEm?: string | null;
  [chave: string]: unknown;
};

export type ParametrosCustoCommentsHunter = {
  sourceType: "profile" | "posts";
  maxPosts: number;
  postUrls: readonly string[];
  commentsPerPost: number;
  targetLeads: number;
};

const TERMOS_COMPRA = [
  "qual o valor",
  "quanto custa",
  "qual o preco",
  "preco",
  "orcamento",
  "quero comprar",
  "quero contratar",
  "tenho interesse",
  "preciso desse",
  "preciso de um",
];

const TERMOS_ACAO = [
  "agendar",
  "agenda",
  "horario",
  "disponibilidade",
  "atendimento",
  "atendem",
  "contato",
  "whatsapp",
  "como faco",
  "como comprar",
  "onde compro",
  "entrega",
];

const TERMOS_DUVIDA = [
  "como funciona",
  "onde fica",
  "qual endereco",
  "tem em",
  "vocês fazem",
  "voces fazem",
  "pode explicar",
  "mais informacoes",
];

const TERMOS_ELOGIO = ["amei", "lindo", "linda", "perfeito", "maravilhoso", "parabens"];
const TERMOS_SPAM = [
  "dm for promo",
  "dm for promotion",
  "gain followers",
  "ganhe seguidores",
  "buy followers",
  "promote it on",
  "check my profile",
  "renda extra",
  "link na minha bio",
];

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function contemAlgum(texto: string, termos: readonly string[]): string[] {
  return termos.filter((termo) => texto.includes(normalizar(termo)));
}

function limitarScore(valor: number): number {
  return Math.max(0, Math.min(100, Math.round(valor)));
}

export function estimarCustoCommentsHunter(input: ParametrosCustoCommentsHunter): number {
  const posts = input.sourceType === "profile" ? input.maxPosts : input.postUrls.length;
  const comments = posts * input.commentsPerPost;
  const profiles = Math.min(60, Math.max(10, input.targetLeads * 3));
  const contentCost = input.sourceType === "profile" ? posts * 0.001 : 0;
  return Number((contentCost + comments * 0.0023 + profiles * 0.0026).toFixed(4));
}

export function classificarIntencaoComentario(textoOriginal: string): ClassificacaoComentario {
  const texto = normalizar(textoOriginal);
  const sinais: string[] = [];
  if (!texto) return { rotulo: "spam", score: 0, sinais: ["comentario_vazio"], spam: true };

  const spam = contemAlgum(texto, TERMOS_SPAM);
  const apenasMarcacoes = /^(@[\w.]+\s*)+$/.test(texto);
  const links = (texto.match(/https?:\/\/|www\./g) ?? []).length;
  if (spam.length > 0 || apenasMarcacoes || links > 0) {
    return {
      rotulo: "spam",
      score: 0,
      sinais: spam.length ? spam.map((termo) => `spam:${termo}`) : ["padrao_spam"],
      spam: true,
    };
  }

  const compra = contemAlgum(texto, TERMOS_COMPRA);
  const acao = contemAlgum(texto, TERMOS_ACAO);
  const duvida = contemAlgum(texto, TERMOS_DUVIDA);
  const elogio = contemAlgum(texto, TERMOS_ELOGIO);
  const temPergunta = texto.includes("?");

  if (compra.length) sinais.push(...compra.map((termo) => `compra:${termo}`));
  if (acao.length) sinais.push(...acao.map((termo) => `acao:${termo}`));
  if (duvida.length) sinais.push(...duvida.map((termo) => `duvida:${termo}`));
  if (temPergunta) sinais.push("pergunta_explicita");

  if (compra.length) {
    return {
      rotulo: "compra",
      score: limitarScore(62 + Math.min(18, compra.length * 9) + Math.min(15, acao.length * 7)),
      sinais,
      spam: false,
    };
  }
  if (acao.length || duvida.length) {
    return {
      rotulo: "duvida",
      score: limitarScore(
        45 + Math.min(25, (acao.length + duvida.length) * 9) + (temPergunta ? 8 : 0),
      ),
      sinais,
      spam: false,
    };
  }
  if (/\b(quero|preciso|interessad[oa]|gostaria)\b/.test(texto)) {
    return { rotulo: "interesse", score: 48, sinais: ["interesse_explicito"], spam: false };
  }
  if (elogio.length) {
    return {
      rotulo: "elogio",
      score: limitarScore(18 + Math.min(12, elogio.length * 4)),
      sinais: elogio.map((termo) => `elogio:${termo}`),
      spam: false,
    };
  }
  return {
    rotulo: "generico",
    score: temPergunta ? 32 : 12,
    sinais: temPergunta ? ["pergunta_sem_contexto_comercial"] : [],
    spam: false,
  };
}

function instante(valor: string | null | undefined): number {
  const data = valor ? new Date(valor).getTime() : 0;
  return Number.isFinite(data) ? data : 0;
}

export function selecionarComentaristasUnicos<T extends ComentarioCandidato>(
  comentarios: readonly T[],
): Array<T & { username: string; classificacao: ClassificacaoComentario }> {
  const porUsuario = new Map<
    string,
    T & { username: string; classificacao: ClassificacaoComentario }
  >();
  for (const comentario of comentarios) {
    const username = normalizar(String(comentario.username ?? "")).replace(/^@/, "");
    if (!username) continue;
    const classificacao = classificarIntencaoComentario(String(comentario.texto ?? ""));
    if (classificacao.spam) continue;
    const atual = porUsuario.get(username);
    const candidato = { ...comentario, username, classificacao };
    if (
      !atual ||
      classificacao.score > atual.classificacao.score ||
      (classificacao.score === atual.classificacao.score &&
        instante(comentario.ocorridoEm) > instante(atual.ocorridoEm))
    ) {
      porUsuario.set(username, candidato);
    }
  }
  return [...porUsuario.values()].sort(
    (a, b) =>
      b.classificacao.score - a.classificacao.score ||
      Number(b.likes ?? 0) - Number(a.likes ?? 0) ||
      instante(b.ocorridoEm) - instante(a.ocorridoEm),
  );
}

export function calcularScoreLeadComentario(params: {
  intencao: number;
  profissional: boolean;
  aderenciaNicho: number;
  aderenciaLocalidade: number;
  atividade: number;
  temContato: boolean;
  seguidores: number;
}): number {
  const audiencia = params.seguidores >= 500 ? 5 : params.seguidores >= 100 ? 3 : 0;
  const score =
    limitarScore(params.intencao) * 0.4 +
    (params.profissional ? 20 : 0) +
    limitarScore(params.aderenciaNicho) * 0.15 +
    limitarScore(params.aderenciaLocalidade) * 0.1 +
    limitarScore(params.atividade) * 0.1 +
    (params.temContato ? 10 : 0) +
    audiencia;
  return limitarScore(score);
}
