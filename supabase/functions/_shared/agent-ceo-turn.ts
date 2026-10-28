// Um turno do Copiloto do CEO de IA: pergunta do usuário → (consulta de leitura) → resposta.
// Orquestração PURA: todo I/O (banco, modelo, ferramenta) entra por `CeoDeps`, então os testes
// rodam o ciclo completo com dublês — sem rede, sem banco e sem gastar IA.
import {
  budgetDecision,
  buildIdempotencyKey,
  canRunAgent,
  classifyFailure,
  costUsd,
  estimateMaxCallCostUsd,
  orgBudgetDecision,
  retryDecision,
  StepRecorder,
  stepLimitDecision,
  type AgentIdentity,
  type AgentPermission,
  type BlockReason,
  type StepRecord,
  type TabelaPrecos,
  type TaskStatus,
  type ToolSpec,
} from "./agent-runtime.ts";
import { CEO_SYSTEM_PROMPT, anthropicToolSchemas, ferramentasDoAgente } from "./agent-tools.ts";
import { MAX_DELEGACOES_POR_EXECUCAO, processarUsosDeFerramenta } from "./agent-tool-exec.ts";

export type ToolSchema = ReturnType<typeof anthropicToolSchemas>[number];

export const MAX_MENSAGEM_CHARS = 2000;
const MAX_HISTORICO = 10;

export class ModeloErro extends Error {
  readonly status: number | undefined;
  readonly aborted: boolean;
  constructor(message: string, status?: number, aborted = false) {
    super(message);
    this.name = "ModeloErro";
    this.status = status;
    this.aborted = aborted;
  }
}

export type ChamadaModelo = {
  modelo: string;
  system: string;
  mensagens: ModeloMensagem[];
  maxTokensSaida: number;
  /** Somente as ferramentas que ESTE agente pode usar (papel + autonomia + permissão humana). */
  tools: ToolSchema[];
};
export type ModeloMensagem =
  | { role: "user" | "assistant"; content: string }
  | {
      role: "assistant";
      toolUses: { id: string; name: string; input: unknown }[];
      text: string;
      /** Itens opacos do provedor (ex.: raciocínio da OpenAI) reenviados no passo seguinte. */
      raw?: unknown;
    }
  | { role: "user"; toolResults: { id: string; content: string; isError: boolean }[] };
export type RespostaModelo = {
  texto: string;
  toolUses: { id: string; name: string; input: unknown }[];
  tokensEntrada: number;
  tokensSaida: number;
  raw?: unknown[];
  /** Modelo que de fato respondeu (difere do do agente quando o fallback autorizado entrou). */
  modeloUsado?: string;
};

export type TarefaRow = {
  id: string;
  status: TaskStatus;
  attemptCount: number;
  maxAttempts: number;
  resultado: { resposta?: string } | null;
};

export type CeoDeps = {
  carregarAgente(orgId: string): Promise<{
    agent: AgentIdentity;
    catalog: ToolSpec[];
    permissions: AgentPermission[];
  } | null>;
  consumo(agentId: string): Promise<{ usdDia: number; usdMes: number }>;
  /** Gasto e teto AGREGADOS da organização. Ausente = só vale o teto por agente (comportamento anterior). */
  consumoOrg?(
    orgId: string,
  ): Promise<{ usdDia: number; usdMes: number; tetoDia: number; tetoMes: number }>;
  /** Preços da Central de IA (modelos fora de MODEL_PRICES). */
  tabelaPrecos?: TabelaPrecos;
  enfileirar(i: {
    orgId: string;
    agentId: string;
    userId: string;
    entrada: unknown;
    idempotencyKey: string;
  }): Promise<TarefaRow>;
  reservar(taskId: string, workerId: string): Promise<TarefaRow | null>;
  iniciarRun(taskId: string, modelo: string): Promise<string>;
  registrarPasso(runId: string, step: StepRecord): Promise<void>;
  finalizarRun(
    runId: string,
    status: "succeeded" | "failed" | "cancelled",
    erro: string | null,
  ): Promise<void>;
  concluirTarefa(i: {
    taskId: string;
    status: "succeeded" | "failed" | "cancelled" | "queued";
    resultado?: unknown;
    erro?: string | null;
    reenfileirarEm?: Date;
  }): Promise<void>;
  /** Executa uma ferramenta REGISTRADA com a org da sessão. Devolve o payload bruto da RPC. */
  executarFerramenta(
    nome: string,
    ctx: { orgId: string; agentId: string; taskId: string | null; params: Record<string, unknown> },
  ): Promise<unknown>;
  chamarModelo(req: ChamadaModelo): Promise<RespostaModelo>;
  registrarUsoIa(i: { userId: string; modelo: string }): Promise<void>;
  agora(): Date;
};

export type TurnoCeoInput = {
  orgId: string;
  userId: string;
  clientMessageId: string;
  mensagem: string;
  historico?: { role: string; content: string }[];
  workerId: string;
  /** Texto acrescentado ao prompt do sistema (ex.: operação em foco). Gerado pelo servidor, nunca pelo cliente. */
  contextoExtra?: string;
};

export type TurnoCeoResultado =
  | {
      ok: true;
      resposta: string;
      runId: string | null;
      taskId: string;
      custoUsd: number;
      passos: number;
      reutilizado: boolean;
    }
  | {
      ok: false;
      reason:
        | BlockReason
        | "ceo_nao_configurado"
        | "mensagem_invalida"
        | "falha_modelo"
        | "em_andamento"
        | "tarefa_encerrada";
      detail?: string;
      httpStatus: number;
    };

const HTTP: Record<string, number> = {
  ceo_nao_configurado: 409,
  mensagem_invalida: 422,
  agente_inativo: 409,
  agente_pausado: 409,
  kill_switch: 423,
  organizacao_divergente: 403,
  teto_dia: 429,
  teto_mes: 429,
  teto_org_dia: 429,
  teto_org_mes: 429,
  em_andamento: 409,
  tarefa_encerrada: 409,
  falha_modelo: 502,
};
const falha = (
  reason: Extract<TurnoCeoResultado, { ok: false }>["reason"],
  detail?: string,
): TurnoCeoResultado => ({ ok: false, reason, detail, httpStatus: HTTP[reason] ?? 403 });

/** Histórico vem do cliente: aceita só user/assistant em texto, com tamanho limitado. */
export function sanitizarHistorico(h: TurnoCeoInput["historico"]): ModeloMensagem[] {
  if (!Array.isArray(h)) return [];
  return h
    .filter(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-MAX_HISTORICO)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, MAX_MENSAGEM_CHARS),
    }));
}

export async function executarTurnoCeo(
  deps: CeoDeps,
  input: TurnoCeoInput,
): Promise<TurnoCeoResultado> {
  const mensagem = (input.mensagem ?? "").trim();
  if (!mensagem || mensagem.length > MAX_MENSAGEM_CHARS || !input.clientMessageId?.trim()) {
    return falha("mensagem_invalida");
  }

  const carga = await deps.carregarAgente(input.orgId);
  if (!carga) return falha("ceo_nao_configurado");
  const podeRodar = canRunAgent(carga.agent, input.orgId);
  if (!podeRodar.ok) return falha(podeRodar.reason);

  const idempotencyKey = await buildIdempotencyKey({
    orgId: input.orgId,
    agentId: carga.agent.id,
    userId: input.userId,
    clientMessageId: input.clientMessageId,
  });
  const tarefa = await deps.enfileirar({
    orgId: input.orgId,
    agentId: carga.agent.id,
    userId: input.userId,
    entrada: { tipo: "copiloto_conversa", tamanho: mensagem.length },
    idempotencyKey,
  });
  // Repetição do mesmo envio: devolve o que já foi respondido, sem nova chamada paga.
  if (tarefa.status === "succeeded" && tarefa.resultado?.resposta) {
    return {
      ok: true,
      resposta: tarefa.resultado.resposta,
      runId: null,
      taskId: tarefa.id,
      custoUsd: 0,
      passos: 0,
      reutilizado: true,
    };
  }
  if (tarefa.status === "processing") return falha("em_andamento");
  if (tarefa.status !== "queued") return falha("tarefa_encerrada", tarefa.status);

  const reservada = await deps.reservar(tarefa.id, input.workerId);
  if (!reservada) return falha("em_andamento");

  const modelo = carga.agent.modelo;
  const system = CEO_SYSTEM_PROMPT + (input.contextoExtra ? `\n\n${input.contextoExtra}` : "");
  const runId = await deps.iniciarRun(reservada.id, modelo);
  const rec = new StepRecorder();
  const gravar = async (step: StepRecord) => deps.registrarPasso(runId, step);
  let custoTotal = 0;
  let delegacoes = 0;

  const encerrar = async (
    status: "failed" | "cancelled",
    motivo: string,
    tarefaStatus: "failed" | "cancelled" | "queued" = status,
    reenfileirarEm?: Date,
  ) => {
    await deps.finalizarRun(runId, status, motivo);
    await deps.concluirTarefa({
      taskId: reservada.id,
      status: tarefaStatus,
      erro: motivo,
      reenfileirarEm,
    });
  };
  const bloquear = async (reason: BlockReason, detail?: string): Promise<TurnoCeoResultado> => {
    await gravar(
      rec.next({
        tipo: "blocked",
        toolNome: null,
        entrada: { reason, detail },
        tokensEntrada: 0,
        tokensSaida: 0,
        custoUsd: 0,
        duracaoMs: null,
        erro: reason,
      }),
    );
    await encerrar(reason === "kill_switch" ? "cancelled" : "failed", reason);
    return falha(reason, detail);
  };

  const mensagens: ModeloMensagem[] = [
    ...sanitizarHistorico(input.historico),
    { role: "user", content: mensagem },
  ];

  try {
    for (let passo = 1; ; passo++) {
      const limite = stepLimitDecision(passo, carga.agent.maxPassos);
      if (!limite.ok) return await bloquear(limite.reason);

      // Kill-switch e estado são relidos a CADA passo: desligar interrompe no passo seguinte.
      const atual = await deps.carregarAgente(input.orgId);
      if (!atual) return await bloquear("agente_inativo");
      const vivo = canRunAgent(atual.agent, input.orgId);
      if (!vivo.ok) return await bloquear(vivo.reason);

      const estimativa = estimateMaxCallCostUsd(
        modelo,
        JSON.stringify(mensagens).length + system.length,
        atual.agent.maxTokensSaida,
        deps.tabelaPrecos,
      );
      if (estimativa === null) return await bloquear("modelo_nao_precificado", modelo);
      // O gasto de passos anteriores já está em agent_runs (registrarPasso soma antes do próximo passo).
      const consumo = await deps.consumo(atual.agent.id);
      const orcamento = budgetDecision({
        gastoDiaUsd: consumo.usdDia,
        gastoMesUsd: consumo.usdMes,
        tetoDiaUsd: atual.agent.tetoUsdDia,
        tetoMesUsd: atual.agent.tetoUsdMes,
        proximaChamadaUsd: estimativa,
      });
      if (!orcamento.ok) return await bloquear(orcamento.reason);
      if (deps.consumoOrg) {
        const org = await deps.consumoOrg(input.orgId);
        const orcOrg = orgBudgetDecision({
          gastoDiaUsd: org.usdDia,
          gastoMesUsd: org.usdMes,
          tetoDiaUsd: org.tetoDia,
          tetoMesUsd: org.tetoMes,
          proximaChamadaUsd: estimativa,
        });
        if (!orcOrg.ok) return await bloquear(orcOrg.reason);
      }

      const inicio = deps.agora().getTime();
      const resp = await deps.chamarModelo({
        modelo,
        system,
        mensagens,
        maxTokensSaida: atual.agent.maxTokensSaida,
        tools: anthropicToolSchemas(
          ferramentasDoAgente(atual.agent, atual.catalog, atual.permissions),
        ),
      });
      const modeloUsado = resp.modeloUsado ?? modelo;
      const custo =
        costUsd(modeloUsado, resp.tokensEntrada, resp.tokensSaida, deps.tabelaPrecos) ?? 0;
      custoTotal += custo;
      await deps.registrarUsoIa({ userId: input.userId, modelo: modeloUsado });
      await gravar(
        rec.next({
          tipo: "model",
          toolNome: null,
          entrada: { passo, mensagens: mensagens.length },
          saida: { tool_uses: resp.toolUses.map((t) => t.name), chars: resp.texto.length },
          tokensEntrada: resp.tokensEntrada,
          tokensSaida: resp.tokensSaida,
          custoUsd: custo,
          duracaoMs: deps.agora().getTime() - inicio,
          erro: null,
        }),
      );

      if (resp.toolUses.length === 0) {
        const texto = resp.texto.trim() || "Não consegui formular uma resposta.";
        await gravar(
          rec.next({
            tipo: "final",
            toolNome: null,
            saida: { chars: texto.length },
            tokensEntrada: 0,
            tokensSaida: 0,
            custoUsd: 0,
            duracaoMs: null,
            erro: null,
          }),
        );
        await deps.finalizarRun(runId, "succeeded", null);
        await deps.concluirTarefa({
          taskId: reservada.id,
          status: "succeeded",
          resultado: { resposta: texto, custo_usd: custoTotal },
        });
        return {
          ok: true,
          resposta: texto,
          runId,
          taskId: reservada.id,
          custoUsd: custoTotal,
          passos: rec.count,
          reutilizado: false,
        };
      }

      mensagens.push({
        role: "assistant",
        text: resp.texto,
        toolUses: resp.toolUses,
        raw: resp.raw,
      });
      const { resultados, delegacoesUsadas } = await processarUsosDeFerramenta({
        usos: resp.toolUses,
        agent: atual.agent,
        catalog: atual.catalog,
        permissions: atual.permissions,
        rec,
        gravar,
        agora: () => deps.agora(),
        delegacoesRestantes: MAX_DELEGACOES_POR_EXECUCAO - delegacoes,
        executar: (nome, params) =>
          deps.executarFerramenta(nome, {
            orgId: input.orgId,
            agentId: atual.agent.id,
            taskId: reservada.id,
            params,
          }),
      });
      delegacoes += delegacoesUsadas;
      mensagens.push({ role: "user", toolResults: resultados });
    }
  } catch (e) {
    const status = e instanceof ModeloErro ? e.status : undefined;
    const aborted = e instanceof ModeloErro ? e.aborted : false;
    const classe = classifyFailure({ status, aborted });
    const erro = (e instanceof Error ? e.message : "falha").slice(0, 300);
    await gravar(
      rec.next({
        tipo: "error",
        toolNome: null,
        saida: { classe },
        tokensEntrada: 0,
        tokensSaida: 0,
        custoUsd: 0,
        duracaoMs: null,
        erro,
      }),
    ).catch(() => {});
    const decisao = retryDecision({
      failure: classe,
      attemptCount: reservada.attemptCount,
      maxAttempts: reservada.maxAttempts,
      now: deps.agora(),
    });
    if (decisao.retry) {
      await encerrar("failed", erro, "queued", decisao.nextAttemptAt);
    } else {
      await encerrar("failed", erro, "failed");
    }
    return falha("falha_modelo", classe);
  }
}
