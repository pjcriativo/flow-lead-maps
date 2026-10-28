// Provedores de IA do CEO/agentes — partes PURAS (sem I/O). A Central de IA do Super Admin grava a
// configuração; o runtime lê daqui as regras: qual modelo vale, qual provedor o atende, quanto custa e
// quando o fallback autorizado pode entrar. Nenhum modelo é fixado no código: a lista vem da API do
// provedor (filtrada pela allowlist de capacidades abaixo) e do preço informado pelo Super Admin.
export const PROVEDORES = ["anthropic", "openai"] as const;
export type ProviderId = (typeof PROVEDORES)[number];
export const ehProvedor = (v: unknown): v is ProviderId =>
  typeof v === "string" && (PROVEDORES as readonly string[]).includes(v);

export type ModeloIa = {
  id: string;
  provider: ProviderId;
  rotulo?: string | null;
  usdIn: number | null;
  usdOut: number | null;
  ativo: boolean;
  suportaFerramentas: boolean;
};

export type ConfigIa = {
  provedorCeo: ProviderId;
  modeloPadrao: string | null;
  modeloCeo: string | null;
  modelosPorPapel: Record<string, string>;
  fallbackProvider: ProviderId | null;
  fallbackModelo: string | null;
};

// ───────────────────────────── segredos ─────────────────────────────
const PADROES_SEGREDO: readonly RegExp[] = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /sbp_[A-Za-z0-9]{8,}/g,
  /apify_api_[A-Za-z0-9]{6,}/g,
  /Bearer\s+[A-Za-z0-9._-]{12,}/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{4,}/g,
];

/** Remove qualquer coisa parecida com chave/token de um texto antes de logar, gravar ou devolver. */
export function redigirSegredos(texto: unknown, max = 300): string {
  let t = typeof texto === "string" ? texto : String(texto ?? "");
  for (const p of PADROES_SEGREDO) t = t.replace(p, "[segredo removido]");
  return t.slice(0, max);
}

/** Chaves da OpenAI: "sk-..." (inclui "sk-proj-..."), sem espaços, comprimento plausível. */
export function validarFormatoChaveOpenAI(
  valor: string,
): { ok: true; chave: string } | { ok: false; motivo: "vazia" | "espacos" | "formato" } {
  const v = (valor ?? "").trim();
  if (!v) return { ok: false, motivo: "vazia" };
  if (/\s/.test(v)) return { ok: false, motivo: "espacos" };
  if (!/^sk-[A-Za-z0-9_-]{20,300}$/.test(v)) return { ok: false, motivo: "formato" };
  return { ok: true, chave: v };
}

/** Único formato exibido ao navegador: nunca mais que os 4 últimos caracteres. */
export const mascararChave = (ultimos4: string | null | undefined): string | null =>
  ultimos4 ? `••••••••${String(ultimos4).slice(-4)}` : null;

// ───────────────────────────── allowlist de modelos ─────────────────────────────
// Capacidade exigida: texto + chamada de função (Responses API). Famílias de embeddings, voz, imagem,
// moderação, busca e vídeo ficam de fora. NÃO enumera versões: modelos novos entram sem mudar código.
const FAMILIAS_CHAT_OPENAI = /^(gpt-|o\d|chatgpt-)/i;
const EXCLUIDOS_OPENAI =
  /(embedding|tts|whisper|transcribe|audio|realtime|image|dall-e|moderation|search|computer-use|davinci|babbage|instruct|sora|codex-mini|deep-research|-live)/i;

export function modeloOpenAICompativel(id: string): boolean {
  return FAMILIAS_CHAT_OPENAI.test(id) && !EXCLUIDOS_OPENAI.test(id) && id.length <= 80;
}

export function classificarModelosOpenAI(idsDaApi: readonly string[]): {
  compativeis: string[];
  descartados: string[];
} {
  const vistos = new Set<string>();
  const compativeis: string[] = [];
  const descartados: string[] = [];
  for (const id of idsDaApi) {
    if (typeof id !== "string" || vistos.has(id)) continue;
    vistos.add(id);
    (modeloOpenAICompativel(id) ? compativeis : descartados).push(id);
  }
  return { compativeis: compativeis.sort(), descartados: descartados.sort() };
}

// ───────────────────────────── preço e resolução ─────────────────────────────
/** Só entram na tabela os modelos ATIVOS com os DOIS preços informados; o resto é "não precificado". */
export function tabelaDePrecos(
  modelos: readonly ModeloIa[],
): Record<string, { in: number; out: number }> {
  const t: Record<string, { in: number; out: number }> = {};
  for (const m of modelos) {
    if (m.ativo && m.usdIn !== null && m.usdOut !== null) t[m.id] = { in: m.usdIn, out: m.usdOut };
  }
  return t;
}

/** Provedor que atende o modelo. Sem linha na Central, "claude-*" mantém o comportamento anterior. */
export function provedorDoModelo(id: string, modelos: readonly ModeloIa[]): ProviderId | null {
  const m = modelos.find((x) => x.id === id);
  if (m) return m.provider;
  return id.startsWith("claude-") ? "anthropic" : null;
}

/** Modelo para um papel: configuração por papel → padrão → nada (o chamador decide o que fazer). */
export function modeloParaPapel(
  papel: string,
  cfg: Pick<ConfigIa, "modelosPorPapel" | "modeloPadrao" | "modeloCeo">,
  permitidos: readonly string[],
): string | null {
  const candidatos = [
    papel === "ceo" ? cfg.modeloCeo : null,
    cfg.modelosPorPapel[papel],
    cfg.modeloPadrao,
  ];
  return candidatos.find((c): c is string => !!c && permitidos.includes(c)) ?? null;
}

export type DecisaoProvedor =
  | { ok: true; provider: ProviderId; modelo: string }
  | {
      ok: false;
      reason:
        | "provedor_desativado"
        | "modelo_nao_configurado"
        | "provedor_sem_chave"
        | "modelo_nao_precificado";
    };

/** O modelo do agente pode ser usado AGORA? (provedor ativo e conectado, chave no cofre, preço conhecido). */
export function decidirProvedor(input: {
  modelo: string;
  modelos: readonly ModeloIa[];
  provedoresAtivos: ReadonlySet<ProviderId>;
  chavesConfiguradas: ReadonlySet<ProviderId>;
}): DecisaoProvedor {
  const provider = provedorDoModelo(input.modelo, input.modelos);
  if (!provider) return { ok: false, reason: "modelo_nao_configurado" };
  if (!input.provedoresAtivos.has(provider)) return { ok: false, reason: "provedor_desativado" };
  if (!input.chavesConfiguradas.has(provider)) return { ok: false, reason: "provedor_sem_chave" };
  const preco = tabelaDePrecos(input.modelos)[input.modelo];
  const legadoClaude =
    provider === "anthropic" && input.modelos.every((m) => m.id !== input.modelo);
  if (!preco && !legadoClaude) return { ok: false, reason: "modelo_nao_precificado" };
  return { ok: true, provider, modelo: input.modelo };
}

/** Fallback só existe se o Super Admin autorizou, o provedor alternativo está pronto e o erro é transitório. */
export function decidirFallback(input: {
  cfg: Pick<ConfigIa, "fallbackProvider" | "fallbackModelo">;
  provedorAtual: ProviderId;
  modelos: readonly ModeloIa[];
  provedoresAtivos: ReadonlySet<ProviderId>;
  chavesConfiguradas: ReadonlySet<ProviderId>;
  falhaTransitoria: boolean;
}): { usar: false } | { usar: true; provider: ProviderId; modelo: string } {
  const { fallbackProvider, fallbackModelo } = input.cfg;
  if (!input.falhaTransitoria || !fallbackProvider || !fallbackModelo) return { usar: false };
  if (fallbackProvider === input.provedorAtual) return { usar: false };
  const d = decidirProvedor({
    modelo: fallbackModelo,
    modelos: input.modelos,
    provedoresAtivos: input.provedoresAtivos,
    chavesConfiguradas: input.chavesConfiguradas,
  });
  return d.ok && d.provider === fallbackProvider
    ? { usar: true, provider: d.provider, modelo: d.modelo }
    : { usar: false };
}

/** Mensagem exibida quando o CEO não tem provedor utilizável (Tela 02). */
export const MSG_CONFIGURAR_PROVEDOR =
  "Configure um provedor de IA no Super Admin para ativar o CEO.";

/** Mesma regra de agent_modelos_permitidos (SQL): Claude padrão (salvo desativado) ∪ ativos+precificados de provedor ativo. */
export const MODELOS_CLAUDE_PADRAO = [
  "claude-haiku-4-5",
  "claude-sonnet-4-5",
  "claude-sonnet-5",
  "claude-opus-4-7",
  "claude-opus-4-8",
] as const;

export function modelosPermitidos(
  modelos: readonly ModeloIa[],
  provedoresAtivos: ReadonlySet<ProviderId>,
): string[] {
  const ids = new Set<string>();
  for (const id of MODELOS_CLAUDE_PADRAO) {
    if (!modelos.some((m) => m.id === id && !m.ativo)) ids.add(id);
  }
  for (const m of modelos) {
    if (m.ativo && provedoresAtivos.has(m.provider) && m.usdIn !== null && m.usdOut !== null)
      ids.add(m.id);
  }
  return [...ids].sort();
}
