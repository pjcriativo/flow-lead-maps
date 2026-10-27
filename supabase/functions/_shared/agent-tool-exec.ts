// Execução das ferramentas dos agentes: traduz o pedido do modelo em UMA chamada de RPC fixa e
// processa os usos de ferramenta de um passo (autorização, parâmetros, registro, limites).
// PURO: o I/O (RPC, gravação de passos) entra por funções injetadas, então tudo é testável sem rede.
import {
  authorizeToolCall,
  validateParams,
  type AgentIdentity,
  type AgentPermission,
  type StepRecord,
  type StepRecorder,
  type ToolSpec,
} from "./agent-runtime.ts";
import {
  TOOL_DELEGAR,
  TOOL_EXECUCOES,
  TOOL_LEAD,
  TOOL_OPORTUNIDADES,
  TOOL_PIPELINE,
  TOOL_PROPOR_EQUIPE,
  TOOL_REGISTRY,
  TOOL_RESUMO_COMERCIAL,
  limitarSaidaFerramenta,
  normalizarResumoComercial,
  PAPEIS_SUBORDINADOS,
} from "./agent-tools.ts";

/** Teto de delegações criadas por UMA execução: impede laço de tarefas. */
export const MAX_DELEGACOES_POR_EXECUCAO = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ContextoFerramenta = {
  orgId: string;
  agentId: string;
  /** Tarefa em execução (vira parent_task_id das delegações). */
  taskId: string | null;
  /** AAAA-MM-DD, para a chave de idempotência das delegações. */
  hoje: string;
  chamarRpc(nome: string, args: Record<string, unknown>): Promise<unknown>;
};

async function sha256(texto: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** "sdr, vendedor" → ["sdr","vendedor"]; recusa papel desconhecido. */
export function parsePapeis(texto: string): { ok: true; papeis: string[] } | { ok: false } {
  const lista = texto
    .split(/[,\s;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const validos = PAPEIS_SUBORDINADOS as readonly string[];
  if (lista.length === 0 || lista.length > 6 || lista.some((p) => !validos.includes(p))) {
    return { ok: false };
  }
  return { ok: true, papeis: lista };
}

/** Executa UMA ferramenta registrada. Já recebeu autorização e parâmetros validados. */
export async function executarFerramentaAgente(
  nome: string,
  ctx: ContextoFerramenta,
  params: Record<string, unknown>,
): Promise<unknown> {
  const base = { p_agent: ctx.agentId };
  switch (nome) {
    case TOOL_RESUMO_COMERCIAL:
      return ctx.chamarRpc("agent_tool_resumo_comercial", base);
    case TOOL_PIPELINE:
      return ctx.chamarRpc("agent_tool_pipeline", base);
    case TOOL_OPORTUNIDADES:
      return ctx.chamarRpc("agent_tool_oportunidades", {
        ...base,
        p_limite: Math.trunc(Number(params.limite ?? 10)),
      });
    case TOOL_LEAD: {
      const id = String(params.lead_id ?? "");
      if (!UUID.test(id)) throw new Error("lead_id_invalido");
      return ctx.chamarRpc("agent_tool_lead", { ...base, p_lead: id });
    }
    case TOOL_EXECUCOES:
      return ctx.chamarRpc("agent_tool_execucoes_equipe", base);
    case TOOL_DELEGAR: {
      const instrucoes = String(params.instrucoes ?? "").trim();
      if (!instrucoes) throw new Error("instrucoes_vazias");
      const leadId = params.lead_id ? String(params.lead_id) : null;
      if (leadId && !UUID.test(leadId)) throw new Error("lead_id_invalido");
      const chave = await sha256(
        [
          ctx.orgId,
          ctx.agentId,
          params.papel,
          params.tipo,
          instrucoes,
          leadId ?? "",
          ctx.hoje,
        ].join("|"),
      );
      const tarefa = (await ctx.chamarRpc("agent_delegar_tarefa", {
        p_org: ctx.orgId,
        p_de: ctx.agentId,
        p_para_papel: params.papel,
        p_tipo: params.tipo,
        p_entrada: { instrucoes, ...(leadId ? { lead_id: leadId } : {}) },
        p_idempotency_key: chave,
        p_parent: ctx.taskId,
      })) as { id?: string; status?: string } | null;
      return {
        delegada: true,
        tarefa_id: tarefa?.id ?? null,
        status: tarefa?.status ?? null,
        destinatario: params.papel,
        tipo: params.tipo,
        observacao: "Tarefa na fila; só executa quando um administrador dispara o processamento.",
      };
    }
    case TOOL_PROPOR_EQUIPE: {
      const lista = parsePapeis(String(params.papeis ?? ""));
      if (!lista.ok) throw new Error("papeis_invalidos");
      const id = await ctx.chamarRpc("agent_propor_equipe", {
        p_org: ctx.orgId,
        p_de: ctx.agentId,
        p_def: lista.papeis.map((papel) => ({ papel })),
      });
      return {
        proposta_criada: true,
        aprovacao_id: id,
        papeis: lista.papeis,
        observacao: "Aguardando aprovação de um administrador; nenhum agente foi criado.",
      };
    }
    default:
      throw new Error("ferramenta_sem_executor");
  }
}

export type UsoFerramenta = { id: string; name: string; input: unknown };
export type ResultadoFerramenta = { id: string; content: string; isError: boolean };

/**
 * Processa os usos de ferramenta de um passo do modelo. Cada uso é autorizado contra o papel, a
 * autonomia e as permissões concedidas por humano, tem os parâmetros validados e deixa rastro.
 * `delegacoesRestantes` limita quantas tarefas o agente cria numa execução.
 */
export async function processarUsosDeFerramenta(args: {
  usos: readonly UsoFerramenta[];
  agent: AgentIdentity;
  catalog: readonly ToolSpec[];
  permissions: readonly AgentPermission[];
  rec: StepRecorder;
  gravar(step: StepRecord): Promise<void>;
  executar(nome: string, params: Record<string, unknown>): Promise<unknown>;
  agora(): Date;
  delegacoesRestantes: number;
}): Promise<{ resultados: ResultadoFerramenta[]; delegacoesUsadas: number }> {
  const resultados: ResultadoFerramenta[] = [];
  let delegacoes = 0;
  for (const uso of args.usos) {
    const inicio = args.agora().getTime();
    const passo = (
      tipo: StepRecord["tipo"],
      entrada: unknown,
      saida: unknown,
      erro: string | null,
    ) =>
      args.gravar(
        args.rec.next({
          tipo,
          toolNome: uso.name,
          entrada,
          saida,
          tokensEntrada: 0,
          tokensSaida: 0,
          custoUsd: 0,
          duracaoMs: tipo === "tool_call" ? null : args.agora().getTime() - inicio,
          erro,
        }),
      );
    const negar = async (motivo: string, saida: unknown = { negado: motivo }) => {
      await passo("blocked", uso.input, saida, motivo);
      resultados.push({ id: uso.id, content: `Ferramenta negada: ${motivo}.`, isError: true });
    };

    const def = TOOL_REGISTRY.find((t) => t.nome === uso.name);
    const auth = authorizeToolCall({
      agent: args.agent,
      orgId: args.agent.orgId,
      toolNome: uso.name,
      catalog: args.catalog,
      permissions: args.permissions,
    });
    if (!def || !auth.ok) {
      await negar(auth.ok ? "ferramenta_desconhecida" : auth.reason);
      continue;
    }
    const parametros = validateParams(def.params, uso.input ?? {});
    if (!parametros.ok) {
      await passo("blocked", uso.input, { erros: parametros.errors }, "parametros_invalidos");
      resultados.push({ id: uso.id, content: "Parâmetros inválidos.", isError: true });
      continue;
    }
    if (uso.name === TOOL_DELEGAR && delegacoes >= args.delegacoesRestantes) {
      await negar("limite_de_delegacoes");
      continue;
    }
    await passo("tool_call", parametros.value, null, null);
    try {
      const bruto = await args.executar(uso.name, parametros.value);
      if (uso.name === TOOL_DELEGAR) delegacoes += 1;
      const orgDoPayload = (bruto as { org_id?: unknown } | null)?.org_id;
      const saida =
        orgDoPayload !== undefined && orgDoPayload !== args.agent.orgId
          ? { disponivel: false, motivo: "organizacao_divergente" }
          : uso.name === TOOL_RESUMO_COMERCIAL
            ? normalizarResumoComercial(bruto, args.agent.orgId)
            : limitarSaidaFerramenta(bruto);
      await passo("tool_result", null, saida, null);
      resultados.push({ id: uso.id, content: JSON.stringify(saida), isError: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro_ferramenta";
      await passo("blocked", null, { erro: msg.slice(0, 200) }, "erro_ferramenta");
      resultados.push({
        id: uso.id,
        content: JSON.stringify({
          disponivel: false,
          motivo: "consulta_indisponivel",
          detalhe: msg.slice(0, 120),
        }),
        isError: true,
      });
    }
  }
  return { resultados, delegacoesUsadas: delegacoes };
}
