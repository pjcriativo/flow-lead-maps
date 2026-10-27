// Executor de tarefas DELEGADAS (CEO → Gerente → especialistas). Orquestração pura: todo I/O entra
// por `RunnerDeps`, então os testes rodam o ciclo completo sem rede, sem banco e sem IA paga.
// Reaproveita os mesmos controles do Copiloto: reserva com lease, kill-switch relido a cada passo,
// teto de custo (dia/mês), limite de passos, ferramentas autorizadas, retentativa só p/ falha transitória.
// O resultado é guardado em agent_tasks.resultado como RASCUNHO/ANÁLISE para revisão humana.
import {
  budgetDecision,
  canRunAgent,
  classifyFailure,
  costUsd,
  estimateMaxCallCostUsd,
  retryDecision,
  StepRecorder,
  stepLimitDecision,
  TIPOS_DO_PAPEL,
  type AgentIdentity,
  type AgentPermission,
  type BlockReason,
  type StepRecord,
  type ToolSpec,
} from "./agent-runtime.ts";
import { anthropicToolSchemas, ferramentasDoAgente } from "./agent-tools.ts";
import { MAX_DELEGACOES_POR_EXECUCAO, processarUsosDeFerramenta } from "./agent-tool-exec.ts";
import { promptDaTarefa, promptDoPapel, tipoTemInstrucao } from "./agent-roles.ts";
import {
  ModeloErro,
  type ChamadaModelo,
  type ModeloMensagem,
  type RespostaModelo,
} from "./agent-ceo-turn.ts";

export const MAX_TEXTO_RESULTADO = 8000;

export type TarefaReservada = {
  id: string;
  orgId: string;
  agentId: string;
  tipo: string;
  entrada: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
};

export type RunnerDeps = {
  /** Reserva (lease) uma tarefa enfileirada; null se não estiver disponível. */
  reservar(taskId: string, workerId: string): Promise<TarefaReservada | null>;
  carregarAgente(
    agentId: string,
  ): Promise<{ agent: AgentIdentity; catalog: ToolSpec[]; permissions: AgentPermission[] } | null>;
  consumo(agentId: string): Promise<{ usdDia: number; usdMes: number }>;
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
  executarFerramenta(
    nome: string,
    ctx: { orgId: string; agentId: string; taskId: string | null; params: Record<string, unknown> },
  ): Promise<unknown>;
  chamarModelo(req: ChamadaModelo): Promise<RespostaModelo>;
  registrarUsoIa(i: { userId: string; modelo: string }): Promise<void>;
  agora(): Date;
};

export type ResultadoTarefa =
  | { ok: true; taskId: string; texto: string; custoUsd: number; passos: number }
  | {
      ok: false;
      taskId: string;
      reason:
        BlockReason | "indisponivel" | "agente_inexistente" | "tipo_nao_permitido" | "falha_modelo";
      detail?: string;
    };

export async function executarTarefaAgente(
  deps: RunnerDeps,
  input: { taskId: string; userId: string; workerId: string },
): Promise<ResultadoTarefa> {
  const tarefa = await deps.reservar(input.taskId, input.workerId);
  if (!tarefa) return { ok: false, taskId: input.taskId, reason: "indisponivel" };

  const carga = await deps.carregarAgente(tarefa.agentId);
  const modelo = carga?.agent.modelo ?? "indefinido";
  const runId = await deps.iniciarRun(tarefa.id, modelo);
  const rec = new StepRecorder();
  const gravar = (step: StepRecord) => deps.registrarPasso(runId, step);
  let custoTotal = 0;
  let delegacoes = 0;
  const usadas = new Set<string>();

  const encerrar = async (
    status: "failed" | "cancelled",
    motivo: string,
    tarefaStatus: "failed" | "cancelled" | "queued" = status,
    reenfileirarEm?: Date,
  ) => {
    await deps.finalizarRun(runId, status, motivo);
    await deps.concluirTarefa({
      taskId: tarefa.id,
      status: tarefaStatus,
      erro: motivo,
      reenfileirarEm,
    });
  };
  const bloquear = async (
    reason: BlockReason | "agente_inexistente" | "tipo_nao_permitido",
    detail?: string,
  ): Promise<ResultadoTarefa> => {
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
    return { ok: false, taskId: tarefa.id, reason, detail };
  };

  if (!carga) return bloquear("agente_inexistente");
  const inicial = canRunAgent(carga.agent, tarefa.orgId);
  if (!inicial.ok) return bloquear(inicial.reason);
  if (
    !TIPOS_DO_PAPEL[carga.agent.papel].includes(tarefa.tipo) ||
    tarefa.tipo === "copiloto_conversa" ||
    !tipoTemInstrucao(tarefa.tipo)
  ) {
    return bloquear("tipo_nao_permitido", tarefa.tipo);
  }

  const system = promptDoPapel(carga.agent.papel);
  const mensagens: ModeloMensagem[] = [
    { role: "user", content: promptDaTarefa(tarefa.tipo, tarefa.entrada) },
  ];

  try {
    for (let passo = 1; ; passo++) {
      const limite = stepLimitDecision(passo, carga.agent.maxPassos);
      if (!limite.ok) return await bloquear(limite.reason);

      // Estado e kill-switch relidos a CADA passo: desligar interrompe no passo seguinte.
      const atual = await deps.carregarAgente(tarefa.agentId);
      if (!atual) return await bloquear("agente_inexistente");
      const vivo = canRunAgent(atual.agent, tarefa.orgId);
      if (!vivo.ok) return await bloquear(vivo.reason);

      const estimativa = estimateMaxCallCostUsd(
        modelo,
        JSON.stringify(mensagens).length + system.length,
        atual.agent.maxTokensSaida,
      );
      if (estimativa === null) return await bloquear("modelo_nao_precificado", modelo);
      const consumo = await deps.consumo(atual.agent.id);
      const orcamento = budgetDecision({
        gastoDiaUsd: consumo.usdDia,
        gastoMesUsd: consumo.usdMes,
        tetoDiaUsd: atual.agent.tetoUsdDia,
        tetoMesUsd: atual.agent.tetoUsdMes,
        proximaChamadaUsd: estimativa,
      });
      if (!orcamento.ok) return await bloquear(orcamento.reason);

      const ferramentas = ferramentasDoAgente(atual.agent, atual.catalog, atual.permissions);
      const inicio = deps.agora().getTime();
      const resp = await deps.chamarModelo({
        modelo,
        system,
        mensagens,
        maxTokensSaida: atual.agent.maxTokensSaida,
        tools: anthropicToolSchemas(ferramentas),
      });
      const custo = costUsd(modelo, resp.tokensEntrada, resp.tokensSaida) ?? 0;
      custoTotal += custo;
      await deps.registrarUsoIa({ userId: input.userId, modelo });
      await gravar(
        rec.next({
          tipo: "model",
          toolNome: null,
          entrada: { passo, tarefa: tarefa.tipo },
          saida: { tool_uses: resp.toolUses.map((t) => t.name), chars: resp.texto.length },
          tokensEntrada: resp.tokensEntrada,
          tokensSaida: resp.tokensSaida,
          custoUsd: custo,
          duracaoMs: deps.agora().getTime() - inicio,
          erro: null,
        }),
      );

      if (resp.toolUses.length === 0) {
        const texto = (resp.texto.trim() || "Não consegui produzir o entregável.").slice(
          0,
          MAX_TEXTO_RESULTADO,
        );
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
          taskId: tarefa.id,
          status: "succeeded",
          resultado: {
            texto,
            tipo: tarefa.tipo,
            papel: atual.agent.papel,
            rascunho: true,
            custo_usd: custoTotal,
            ferramentas: [...usadas],
          },
        });
        return { ok: true, taskId: tarefa.id, texto, custoUsd: custoTotal, passos: rec.count };
      }

      mensagens.push({ role: "assistant", text: resp.texto, toolUses: resp.toolUses });
      for (const u of resp.toolUses) usadas.add(u.name);
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
            orgId: tarefa.orgId,
            agentId: atual.agent.id,
            taskId: tarefa.id,
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
      attemptCount: tarefa.attemptCount,
      maxAttempts: tarefa.maxAttempts,
      now: deps.agora(),
    });
    if (decisao.retry) await encerrar("failed", erro, "queued", decisao.nextAttemptAt);
    else await encerrar("failed", erro, "failed");
    return { ok: false, taskId: tarefa.id, reason: "falha_modelo", detail: classe };
  }
}
