// Adaptador da OpenAI (Responses API). Sem estado no servidor deles (store:false): o histórico persistente
// é NOSSO (agent_tasks/agent_run_steps/agent_memoria). Traduz o formato interno (ChamadaModelo) para o
// pedido, e a resposta para RespostaModelo, preservando os itens opacos de raciocínio para o próximo passo
// do laço de ferramentas. Nenhuma regra de autorização mora aqui: as ferramentas continuam passando por
// authorizeToolCall + RPC fixa. A chave chega como argumento e NUNCA é logada nem devolvida em mensagens.
import { ModeloErro, type ChamadaModelo, type RespostaModelo } from "./agent-ceo-turn.ts";
import { redigirSegredos } from "./ai-provider.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

export const OPENAI_BASE = "https://api.openai.com/v1";
export const TIMEOUT_OPENAI_MS = 60_000;

/** Ferramentas no formato interno (input_schema) → function tools da Responses API. */
export function paraFerramentasOpenAI(tools: ChamadaModelo["tools"]): Rec[] {
  return tools.map((t) => ({
    type: "function",
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  }));
}

/** Mensagens internas → itens `input`. Itens opacos (`raw`) do passo anterior são reenviados como vieram. */
export function paraItensDeEntrada(r: ChamadaModelo): Rec[] {
  const itens: Rec[] = [];
  for (const m of r.mensagens) {
    if ("toolUses" in m) {
      const raw = (m as { raw?: unknown }).raw;
      if (Array.isArray(raw) && raw.length) {
        itens.push(...(raw as Rec[]));
      } else {
        if (m.text) itens.push({ role: "assistant", content: m.text });
        for (const t of m.toolUses) {
          itens.push({
            type: "function_call",
            call_id: t.id,
            name: t.name,
            arguments: JSON.stringify(t.input ?? {}),
          });
        }
      }
    } else if ("toolResults" in m) {
      for (const res of m.toolResults) {
        itens.push({ type: "function_call_output", call_id: res.id, output: res.content });
      }
    } else {
      itens.push({ role: m.role, content: m.content });
    }
  }
  return itens;
}

export function construirPedidoResponses(r: ChamadaModelo): Rec {
  return {
    model: r.modelo,
    instructions: r.system,
    input: paraItensDeEntrada(r),
    max_output_tokens: r.maxTokensSaida,
    store: false,
    include: ["reasoning.encrypted_content"],
    ...(r.tools.length ? { tools: paraFerramentasOpenAI(r.tools), tool_choice: "auto" } : {}),
  };
}

function lerArgumentos(bruto: unknown): unknown {
  if (typeof bruto !== "string") return bruto ?? {};
  try {
    return JSON.parse(bruto || "{}");
  } catch {
    // argumentos corrompidos viram objeto vazio → a validação de parâmetros do runtime bloqueia o uso
    return {};
  }
}

export function lerRespostaResponses(data: Rec): RespostaModelo & { raw: Rec[] } {
  if (data?.status === "failed" || data?.error) {
    throw new ModeloErro(`OpenAI: ${redigirSegredos(data?.error?.message ?? "falha")}`, 502);
  }
  const itens: Rec[] = Array.isArray(data?.output) ? data.output : [];
  const texto = itens
    .filter((i) => i.type === "message")
    .flatMap((i) => (Array.isArray(i.content) ? i.content : []))
    .filter((c: Rec) => c.type === "output_text")
    .map((c: Rec) => String(c.text ?? ""))
    .join("");
  const toolUses = itens
    .filter((i) => i.type === "function_call")
    .map((i) => ({
      id: String(i.call_id ?? i.id),
      name: String(i.name),
      input: lerArgumentos(i.arguments),
    }));
  if (data?.status === "incomplete" && toolUses.length === 0 && !texto) {
    throw new ModeloErro(
      `OpenAI: resposta incompleta (${redigirSegredos(data?.incomplete_details?.reason ?? "limite de saída")})`,
      422,
    );
  }
  return {
    texto,
    toolUses,
    tokensEntrada: Number(data?.usage?.input_tokens ?? 0),
    tokensSaida: Number(data?.usage?.output_tokens ?? 0),
    // reasoning + function_call precisam voltar no próximo passo; a mensagem final não
    raw: itens.filter((i) => i.type === "reasoning" || i.type === "function_call"),
  };
}

/** Uma chamada à Responses API. Timeout 60 s; sem retentativa aqui (o runtime decide por classe de falha). */
export async function chamarOpenAI(
  chave: string,
  r: ChamadaModelo,
  opts: { signal?: AbortSignal; fetcher?: typeof fetch } = {},
): Promise<RespostaModelo & { raw: Rec[] }> {
  const fetcher = opts.fetcher ?? fetch;
  const timeout = AbortSignal.timeout(TIMEOUT_OPENAI_MS);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
  const enviar = async (pedido: Rec): Promise<Response> => {
    try {
      return await fetcher(`${OPENAI_BASE}/responses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
        signal,
      });
    } catch (e) {
      const aborted =
        e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError");
      throw new ModeloErro("Falha de rede com o provedor de IA.", undefined, aborted);
    }
  };
  const pedido = construirPedidoResponses(r);
  let res = await enviar(pedido);
  let data: Rec = await res.json().catch(() => ({}));
  // Modelos sem raciocínio recusam `include: reasoning.encrypted_content` (400). O pedido foi rejeitado
  // antes de gerar tokens, então repetir sem o campo não gera custo extra nem duplica efeito.
  if (
    !res.ok &&
    res.status === 400 &&
    /encrypted|reasoning/i.test(String(data?.error?.message ?? ""))
  ) {
    const { include: _descartado, ...semInclude } = pedido;
    void _descartado;
    res = await enviar(semInclude);
    data = await res.json().catch(() => ({}));
  }
  if (!res.ok) {
    throw new ModeloErro(
      `OpenAI: ${redigirSegredos(data?.error?.message ?? "HTTP " + res.status)}`,
      res.status,
    );
  }
  return lerRespostaResponses(data);
}

const motivoHttp = (status: number): string =>
  status === 401
    ? "chave_invalida_ou_revogada"
    : status === 403
      ? "chave_sem_permissao"
      : status === 429
        ? "limite_do_provedor"
        : "erro_do_provedor";

export type ModeloListado = { id: string; criadoEm: number | null; dono: string | null };
const MAX_PAGINAS_MODELOS = 20;

/** Lista os modelos que a CHAVE enxerga (chamada gratuita). Usada para validar a conexão e a allowlist.
 *  Segue a paginação quando a API a anunciar (`has_more` + `after`); hoje ela devolve tudo de uma vez. */
export async function listarModelosOpenAI(
  chave: string,
  opts: { fetcher?: typeof fetch } = {},
): Promise<
  | { ok: true; ids: string[]; modelos: ModeloListado[]; paginas: number }
  | { ok: false; status: number | null; motivo: string }
> {
  const fetcher = opts.fetcher ?? fetch;
  const modelos: ModeloListado[] = [];
  const vistos = new Set<string>();
  let depois: string | null = null;
  let paginas = 0;
  while (paginas < MAX_PAGINAS_MODELOS) {
    const url: string = `${OPENAI_BASE}/models${depois ? `?after=${encodeURIComponent(depois)}` : ""}`;
    let res: Response;
    try {
      res = await fetcher(url, {
        headers: { Authorization: `Bearer ${chave}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return { ok: false, status: null, motivo: "sem_resposta_do_provedor" };
    }
    const data: Rec = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, motivo: motivoHttp(res.status) };
    paginas += 1;
    const pagina: Rec[] = Array.isArray(data?.data) ? data.data : [];
    let novos = 0;
    for (const m of pagina) {
      if (typeof m?.id !== "string" || vistos.has(m.id)) continue;
      vistos.add(m.id);
      novos += 1;
      modelos.push({
        id: m.id,
        criadoEm: typeof m.created === "number" ? m.created : null,
        dono: typeof m.owned_by === "string" ? m.owned_by.slice(0, 80) : null,
      });
    }
    const ultimo = pagina.length ? pagina[pagina.length - 1]?.id : null;
    // só continua se a API disse que há mais E a página trouxe algo novo (evita laço infinito)
    if (data?.has_more === true && typeof ultimo === "string" && novos > 0) depois = ultimo;
    else break;
  }
  return { ok: true, ids: modelos.map((m) => m.id), modelos, paginas };
}

/** O projeto/chave pode usar ESTE modelo? `GET /models/{id}` — gratuito, não gera inferência.
 *  Distingue autenticação válida (a lista funcionou) de permissão efetiva sobre o modelo. */
export async function verificarAcessoModeloOpenAI(
  chave: string,
  modelo: string,
  opts: { fetcher?: typeof fetch } = {},
): Promise<{ ok: true } | { ok: false; status: number | null; motivo: string }> {
  const fetcher = opts.fetcher ?? fetch;
  try {
    const res = await fetcher(`${OPENAI_BASE}/models/${encodeURIComponent(modelo)}`, {
      headers: { Authorization: `Bearer ${chave}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return { ok: true };
    return {
      ok: false,
      status: res.status,
      motivo: res.status === 404 ? "modelo_inacessivel_ao_projeto" : motivoHttp(res.status),
    };
  } catch {
    return { ok: false, status: null, motivo: "sem_resposta_do_provedor" };
  }
}
