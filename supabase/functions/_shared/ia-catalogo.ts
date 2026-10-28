// Catálogo dinâmico de modelos da OpenAI — partes PURAS (sem I/O), usadas pela Edge admin-acoes e pela tela
// do Super Admin. A API `GET /v1/models` só informa id, data de criação e dono: NÃO informa preço, contexto
// nem capacidades. Por isso a classificação abaixo é INFERIDA do id (marcada como tal) e pode ser corrigida
// à mão pelo Super Admin; preços e limites nunca são inventados aqui — vêm de configuração administrativa.
// Nenhum modelo é enumerado: versões novas entram pela API sem mudar este arquivo.
import { modeloOpenAICompativel } from "./ai-provider.ts";

export const CATEGORIAS = [
  "texto",
  "raciocinio",
  "visao",
  "imagem",
  "audio",
  "voz",
  "realtime",
  "video",
  "embeddings",
  "moderacao",
  "outros",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  texto: "Texto e conversação",
  raciocinio: "Raciocínio",
  visao: "Visão e análise de imagens",
  imagem: "Geração e edição de imagens",
  audio: "Áudio e transcrição",
  voz: "Voz e síntese de fala",
  realtime: "Realtime e conversação por voz",
  video: "Vídeo",
  embeddings: "Embeddings",
  moderacao: "Moderação",
  outros: "Outros modelos e ferramentas",
};

export const ehCategoria = (v: unknown): v is Categoria =>
  typeof v === "string" && (CATEGORIAS as readonly string[]).includes(v);

export const ENDPOINTS = [
  "responses",
  "chat_completions",
  "completions",
  "images",
  "audio_transcriptions",
  "audio_speech",
  "realtime",
  "embeddings",
  "moderations",
  "videos",
  "desconhecido",
] as const;
export type EndpointOpenAI = (typeof ENDPOINTS)[number];

export type Modalidade = "texto" | "imagem" | "audio" | "video" | "embedding";

export type Classificacao = {
  categorias: Categoria[];
  modalidadesEntrada: Modalidade[];
  modalidadesSaida: Modalidade[];
  endpoint: EndpointOpenAI;
  /** Série do modelo (ex.: "gpt-5", "o3", "gpt-image"), sem variante nem snapshot. */
  familia: string;
  /** Sufixo de data/versão fixa (ex.: "2025-04-14", "0613"); null quando o id é um alias. */
  snapshot: string | null;
  /** Texto + chamada de ferramentas na Responses API (o que o CEO exige). */
  chatCeo: boolean;
};

const SNAPSHOT = /-(\d{4}-\d{2}-\d{2}|\d{4})$/;
const FAMILIA =
  /^(gpt-oss|gpt-image|gpt-audio|gpt-realtime|gpt-\d+(?:\.\d+)?o?|chatgpt-image|chatgpt|o\d+|dall-e|whisper|tts|text-embedding|omni-moderation|text-moderation|sora|codex|computer-use|babbage|davinci)/;
// Entrada de imagem documentada: famílias vision conhecidas. Séries futuras (gpt-6+) NÃO ganham visão por
// suposição — o Super Admin ajusta à mão se a documentação confirmar.
const VISAO_CONHECIDA =
  /^(chatgpt-4o|gpt-4o|gpt-4\.1|gpt-4\.5|gpt-4-turbo|gpt-4-vision|gpt-5|o3|o4|o1(?!-mini|-preview))/;
const RACIOCINIO_CONHECIDO = /^(o\d|gpt-5|gpt-oss)/;

export function classificarModelo(idBruto: string): Classificacao {
  const id = idBruto.toLowerCase();
  const snap = id.match(SNAPSHOT);
  const semSnapshot = snap ? id.slice(0, -snap[0].length) : id;
  const familia = semSnapshot.match(FAMILIA)?.[1] ?? semSnapshot.split("-")[0] ?? semSnapshot;
  const base = { familia, snapshot: snap ? snap[1] : null };
  const feito = (
    categorias: Categoria[],
    entrada: Modalidade[],
    saida: Modalidade[],
    endpoint: EndpointOpenAI,
    chatCeo = false,
  ): Classificacao => ({
    ...base,
    categorias,
    modalidadesEntrada: entrada,
    modalidadesSaida: saida,
    endpoint,
    chatCeo,
  });

  if (/embedding/.test(id)) return feito(["embeddings"], ["texto"], ["embedding"], "embeddings");
  if (/moderation/.test(id))
    return feito(["moderacao"], ["texto", "imagem"], ["texto"], "moderations");
  if (/(^|-)sora/.test(id)) return feito(["video"], ["texto", "imagem"], ["video"], "videos");
  if (/^(dall-e|gpt-image|chatgpt-image)/.test(id)) {
    const comReferencia = /^(gpt-image|chatgpt-image)/.test(id);
    return feito(["imagem"], comReferencia ? ["texto", "imagem"] : ["texto"], ["imagem"], "images");
  }
  if (/realtime/.test(id))
    return feito(["realtime"], ["texto", "audio"], ["texto", "audio"], "realtime");
  if (/(whisper|transcribe)/.test(id))
    return feito(["audio"], ["audio"], ["texto"], "audio_transcriptions");
  if (/(^|-)tts/.test(id)) return feito(["voz"], ["texto"], ["audio"], "audio_speech");
  if (/audio/.test(id))
    return feito(["audio", "voz"], ["texto", "audio"], ["texto", "audio"], "chat_completions");
  if (/search/.test(id))
    return feito(["texto", "outros"], ["texto"], ["texto"], "chat_completions");
  if (/computer-use/.test(id))
    return feito(["outros"], ["texto", "imagem"], ["texto"], "responses");
  if (/deep-research/.test(id))
    return feito(["raciocinio", "outros"], ["texto"], ["texto"], "responses");
  if (/(davinci|babbage|instruct)/.test(id))
    return feito(["texto"], ["texto"], ["texto"], "completions");

  if (/^(gpt-|chatgpt-|o\d|codex)/.test(id)) {
    const categorias: Categoria[] = ["texto"];
    // "chat-latest" é a variante sem raciocínio dos modelos gpt-5
    if (RACIOCINIO_CONHECIDO.test(id) && !/chat-latest/.test(id)) categorias.push("raciocinio");
    const visao = VISAO_CONHECIDA.test(id);
    if (visao) categorias.push("visao");
    return feito(
      categorias,
      visao ? ["texto", "imagem"] : ["texto"],
      ["texto"],
      /^gpt-3\.5/.test(id) ? "chat_completions" : "responses",
      modeloOpenAICompativel(idBruto),
    );
  }
  return feito(["outros"], ["texto"], ["texto"], "desconhecido");
}

// ───────────────────────────── sincronização ─────────────────────────────
export type ModeloApi = { id: string; criadoEm: number | null; dono: string | null };

/** Colunas que a sincronização enxerga de uma linha existente de ia_modelos (provedor openai). */
export type ModeloExistente = {
  id: string;
  disponibilidade?: string | null;
  classificacao_origem?: string | null;
};

export type LinhaNova = {
  id: string;
  provider: "openai";
  rotulo: string;
  ativo: false;
  disponibilidade: "disponivel";
  visto_em: string;
  primeiro_visto_em: string;
  api_criado_em: string | null;
  api_dono: string | null;
  categorias: Categoria[];
  modalidades_entrada: Modalidade[];
  modalidades_saida: Modalidade[];
  endpoint: EndpointOpenAI;
  familia: string;
  snapshot: string | null;
  classificacao_origem: "inferida";
  chat_ceo: boolean;
  suporta_ferramentas: boolean;
};

export type PlanoSincronizacao = {
  novos: LinhaNova[];
  /** Linhas já conhecidas e ainda listadas: só metadados de disponibilidade/classificação. NUNCA preço/ativo. */
  atualizar: { id: string; patch: Record<string, unknown> }[];
  indisponiveis: string[];
  reaparecidos: string[];
  /** Indisponíveis que ainda estão em uso na configuração (CEO/padrão/papéis/capacidades). */
  indisponiveisEmUso: string[];
};

const isoDe = (epoch: number | null): string | null =>
  epoch !== null && Number.isFinite(epoch) && epoch > 0
    ? new Date(epoch * 1000).toISOString()
    : null;

export function planejarSincronizacao(input: {
  existentes: readonly ModeloExistente[];
  api: readonly ModeloApi[];
  agora: string;
  emUso?: ReadonlySet<string>;
}): PlanoSincronizacao {
  const conhecidos = new Map(input.existentes.map((m) => [m.id, m]));
  const naApi = new Set<string>();
  const plano: PlanoSincronizacao = {
    novos: [],
    atualizar: [],
    indisponiveis: [],
    reaparecidos: [],
    indisponiveisEmUso: [],
  };
  for (const m of input.api) {
    if (!m.id || m.id.length < 3 || m.id.length > 80 || naApi.has(m.id)) continue;
    naApi.add(m.id);
    const c = classificarModelo(m.id);
    const atual = conhecidos.get(m.id);
    if (!atual) {
      plano.novos.push({
        id: m.id,
        provider: "openai",
        rotulo: m.id,
        ativo: false,
        disponibilidade: "disponivel",
        visto_em: input.agora,
        primeiro_visto_em: input.agora,
        api_criado_em: isoDe(m.criadoEm),
        api_dono: m.dono,
        categorias: c.categorias,
        modalidades_entrada: c.modalidadesEntrada,
        modalidades_saida: c.modalidadesSaida,
        endpoint: c.endpoint,
        familia: c.familia,
        snapshot: c.snapshot,
        classificacao_origem: "inferida",
        chat_ceo: c.chatCeo,
        suporta_ferramentas: c.chatCeo,
      });
      continue;
    }
    const patch: Record<string, unknown> = {
      disponibilidade: "disponivel",
      visto_em: input.agora,
      api_criado_em: isoDe(m.criadoEm),
      api_dono: m.dono,
    };
    // classificação manual do Super Admin é preservada; a inferida é refeita com a regra mais recente
    if (atual.classificacao_origem !== "manual") {
      Object.assign(patch, {
        categorias: c.categorias,
        modalidades_entrada: c.modalidadesEntrada,
        modalidades_saida: c.modalidadesSaida,
        endpoint: c.endpoint,
        familia: c.familia,
        snapshot: c.snapshot,
        classificacao_origem: "inferida",
        chat_ceo: c.chatCeo,
      });
    }
    if (atual.disponibilidade === "indisponivel") plano.reaparecidos.push(m.id);
    plano.atualizar.push({ id: m.id, patch });
  }
  for (const m of input.existentes) {
    if (naApi.has(m.id)) continue;
    plano.indisponiveis.push(m.id);
    if (input.emUso?.has(m.id)) plano.indisponiveisEmUso.push(m.id);
  }
  return plano;
}

// ───────────────────────────── preços e unidades ─────────────────────────────
export const ITENS_PRECO = [
  "entrada",
  "saida",
  "entrada_cache",
  "audio_entrada",
  "audio_saida",
  "imagem_entrada",
  "imagem_saida",
  "imagem_geracao",
  "video",
  "ferramenta",
] as const;
export const UNIDADES_PRECO = [
  "1M_tokens",
  "minuto",
  "segundo",
  "imagem",
  "1k_chamadas",
  "1M_caracteres",
] as const;
export const MODOS_PROCESSAMENTO = ["padrao", "batch", "flex", "priority"] as const;

export type PrecoExtra = {
  item: (typeof ITENS_PRECO)[number];
  unidade: (typeof UNIDADES_PRECO)[number];
  usd: number;
  modo: (typeof MODOS_PROCESSAMENTO)[number];
};

export const ROTULO_UNIDADE: Record<(typeof UNIDADES_PRECO)[number], string> = {
  "1M_tokens": "por 1M de tokens",
  minuto: "por minuto",
  segundo: "por segundo",
  imagem: "por imagem",
  "1k_chamadas": "por 1.000 chamadas",
  "1M_caracteres": "por 1M de caracteres",
};

/** Valida a lista de preços adicionais enviada pelo Super Admin. Nada é inferido nem convertido em silêncio. */
export function validarPrecosExtras(
  bruto: unknown,
): { ok: true; precos: PrecoExtra[] } | { ok: false; erro: string } {
  if (bruto === null || bruto === undefined) return { ok: true, precos: [] };
  if (!Array.isArray(bruto) || bruto.length > 20)
    return { ok: false, erro: "precos_extra_invalido" };
  const precos: PrecoExtra[] = [];
  const vistos = new Set<string>();
  for (const p of bruto) {
    const o = (p ?? {}) as Record<string, unknown>;
    const item = o.item;
    const unidade = o.unidade;
    const modo = o.modo ?? "padrao";
    const usd = typeof o.usd === "number" ? o.usd : Number(o.usd);
    if (!(ITENS_PRECO as readonly unknown[]).includes(item))
      return { ok: false, erro: "preco_item_invalido" };
    if (!(UNIDADES_PRECO as readonly unknown[]).includes(unidade))
      return { ok: false, erro: "preco_unidade_invalida" };
    if (!(MODOS_PROCESSAMENTO as readonly unknown[]).includes(modo))
      return { ok: false, erro: "preco_modo_invalido" };
    if (o.usd === null || o.usd === "" || !Number.isFinite(usd) || usd < 0 || usd > 1000)
      return { ok: false, erro: "preco_invalido" };
    const chave = `${item}|${unidade}|${modo}`;
    if (vistos.has(chave)) return { ok: false, erro: "preco_duplicado" };
    vistos.add(chave);
    precos.push({
      item: item as PrecoExtra["item"],
      unidade: unidade as PrecoExtra["unidade"],
      usd,
      modo: modo as PrecoExtra["modo"],
    });
  }
  return { ok: true, precos };
}

/** O preço que o runtime de texto usa: US$ por 1.000.000 de tokens (entrada e saída). */
export const temPrecoDeTokens = (m: {
  usd_in_mtok?: number | null;
  usd_out_mtok?: number | null;
}) =>
  m.usd_in_mtok !== null &&
  m.usd_in_mtok !== undefined &&
  m.usd_out_mtok !== null &&
  m.usd_out_mtok !== undefined;

/** Custo de uma chamada de texto, SEMPRE na unidade correta (preço por 1M de tokens). */
export const custoTokensUsd = (
  tokensEntrada: number,
  tokensSaida: number,
  precoPorMtok: { in: number; out: number },
): number =>
  (Math.max(0, tokensEntrada) * precoPorMtok.in + Math.max(0, tokensSaida) * precoPorMtok.out) /
  1_000_000;

/** Um modelo só pode ser HABILITADO se há preço na unidade que o seu endpoint cobra. */
export function precoSuficienteParaAtivar(m: {
  chatCeo: boolean;
  usd_in_mtok: number | null;
  usd_out_mtok: number | null;
  precosExtra: readonly PrecoExtra[];
}): boolean {
  return m.chatCeo ? temPrecoDeTokens(m) : m.precosExtra.length > 0;
}

// ───────────────────────────── capacidades do CEO ─────────────────────────────
/** Capacidades independentes configuráveis; "principal" (modelo_ceo) e "padrão" já existem em ia_config. */
export const CAPACIDADES = [
  "economico",
  "analise_complexa",
  "visao",
  "imagem",
  "transcricao",
  "voz",
] as const;
export type Capacidade = (typeof CAPACIDADES)[number];
export const ehCapacidade = (v: unknown): v is Capacidade =>
  typeof v === "string" && (CAPACIDADES as readonly string[]).includes(v);

export const ROTULO_CAPACIDADE: Record<Capacidade, string> = {
  economico: "Modelo econômico (tarefas simples)",
  analise_complexa: "Modelo de análise complexa",
  visao: "Modelo de visão",
  imagem: "Modelo de imagem",
  transcricao: "Modelo de transcrição",
  voz: "Modelo de voz",
};

export type ModeloParaSlot = {
  categorias?: readonly string[] | null;
  chatCeo?: boolean | null;
  ativo: boolean;
};

/** O modelo serve àquela capacidade? Texto/visão exigem também compatibilidade com o runtime de chat. */
export function modeloServeCapacidade(cap: Capacidade, m: ModeloParaSlot): boolean {
  const cats = m.categorias ?? [];
  const chat = m.chatCeo !== false;
  switch (cap) {
    case "economico":
      return chat && cats.includes("texto");
    case "analise_complexa":
      return chat && cats.includes("raciocinio");
    case "visao":
      return chat && cats.includes("visao");
    case "imagem":
      return cats.includes("imagem");
    case "transcricao":
      return cats.includes("audio") && !cats.includes("voz");
    case "voz":
      return cats.includes("voz");
  }
}

/** Seletor do "Modelo do CEO Mestre": só texto compatível com o runtime, habilitado e precificado. */
export function modeloElegivelParaCeo(m: {
  id: string;
  provider: string;
  ativo: boolean;
  usd_in_mtok: number | null;
  usd_out_mtok: number | null;
  categorias?: readonly string[] | null;
  chat_ceo?: boolean | null;
  disponibilidade?: string | null;
}): boolean {
  if (!m.ativo || !temPrecoDeTokens(m) || m.disponibilidade === "indisponivel") return false;
  if (m.provider !== "openai") return true;
  if (m.chat_ceo === false || !modeloOpenAICompativel(m.id)) return false;
  const cats = m.categorias ?? classificarModelo(m.id).categorias;
  return cats.includes("texto") || cats.includes("raciocinio");
}
