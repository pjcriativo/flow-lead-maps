// Edge: agent-worker — executa tarefas DELEGADAS da equipe comercial (Prompt 37). NÃO PUBLICADA.
//
// 🚧 Execução somente MANUAL: um administrador/gerente logado dispara; não há cron nem laço.
// 🔒 JWT + papel admin/gerente + vínculo com a org (mesma autorização do agent-ceo).
// 🔎 Cada tarefa roda com o agente DONO dela: ferramentas só as concedidas a ele, RPCs que derivam
//    a organização do agente no banco, teto de custo por agente, kill-switch relido a cada passo.
// 📝 O resultado vira RASCUNHO/ANÁLISE em agent_tasks.resultado. Nenhum envio externo, nenhuma
//    busca paga, nenhuma alteração de lead/proposta/contrato.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { resolverChave } from "../_shared/chaves.ts";
import type { StepRecord } from "../_shared/agent-runtime.ts";
import { executarFerramentaAgente } from "../_shared/agent-tool-exec.ts";
import {
  executarTarefaAgente,
  type RunnerDeps,
  type TarefaReservada,
} from "../_shared/agent-task-runner.ts";
import {
  autorizarGestorDeAgentes,
  carregarAgenteComPermissoes,
  chamarAnthropic,
  criarRpc,
  type Rec,
} from "../_shared/agent-edge-kit.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMITE_PADRAO = 2;
const LIMITE_MAX = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  let body: Rec = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 422);
  }
  const orgId = typeof body.org_id === "string" ? body.org_id.trim() : "";
  if (!orgId) return json({ error: "Selecione uma organização ativa." }, 422);

  const auth = await autorizarGestorDeAgentes({ admin, userClient, orgId });
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const userId = auth.userId;

  const chave = await resolverChave(admin, "ANTHROPIC_API_KEY");
  if (!chave) return json({ error: "Assistente indisponível." }, 503);
  const rpc = criarRpc(admin);

  // Tarefa específica (tem de ser da organização) ou as próximas da fila da organização.
  let ids: string[] = [];
  if (typeof body.task_id === "string" && body.task_id) {
    if (!UUID.test(body.task_id)) return json({ error: "task_id inválido." }, 422);
    const { data: t } = await admin
      .from("agent_tasks")
      .select("id")
      .eq("id", body.task_id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!t) return json({ error: "Tarefa não encontrada nesta organização." }, 404);
    ids = [t.id];
  } else {
    const limite = Math.min(
      Math.max(Number(body.limite ?? LIMITE_PADRAO) || LIMITE_PADRAO, 1),
      LIMITE_MAX,
    );
    const fila = (await rpc("agent_proximas_tarefas", { p_org: orgId, p_limite: limite })) as Rec[];
    ids = (fila ?? []).map((t) => t.id);
  }
  if (ids.length === 0) return json({ ok: true, processadas: 0, resultados: [] });

  const deps: RunnerDeps = {
    reservar: async (taskId, workerId): Promise<TarefaReservada | null> => {
      const r = (await rpc("agent_reservar_tarefa", {
        p_worker: workerId,
        p_task: taskId,
        p_lease_seconds: 150,
      })) as Rec[];
      const t = r?.[0];
      if (!t || t.org_id !== orgId) return null;
      return {
        id: t.id,
        orgId: t.org_id,
        agentId: t.agent_id,
        tipo: t.tipo,
        entrada: (t.entrada ?? {}) as Record<string, unknown>,
        attemptCount: t.attempt_count,
        maxAttempts: t.max_attempts,
      };
    },
    carregarAgente: (id) => carregarAgenteComPermissoes(admin, { id }, orgId),
    consumo: async (agentId) => {
      const r = (await rpc("agent_consumo", { p_agent: agentId })) as Rec[];
      return { usdDia: Number(r?.[0]?.usd_dia ?? 0), usdMes: Number(r?.[0]?.usd_mes ?? 0) };
    },
    iniciarRun: async (taskId, modelo) =>
      (await rpc("agent_iniciar_run", { p_task: taskId, p_modelo: modelo })) as string,
    registrarPasso: async (runId: string, s: StepRecord) => {
      await rpc("agent_registrar_passo", {
        p_run: runId,
        p_seq: s.seq,
        p_tipo: s.tipo,
        p_tool: s.toolNome,
        p_entrada: s.entrada,
        p_saida: s.saida,
        p_tokens_in: s.tokensEntrada,
        p_tokens_out: s.tokensSaida,
        p_custo: s.custoUsd,
        p_duracao_ms: s.duracaoMs,
        p_erro: s.erro,
      });
    },
    finalizarRun: async (runId, status, erro) => {
      await rpc("agent_finalizar_run", { p_run: runId, p_status: status, p_erro: erro });
    },
    concluirTarefa: async (i) => {
      await rpc("agent_concluir_tarefa", {
        p_task: i.taskId,
        p_status: i.status,
        p_resultado: i.resultado ?? null,
        p_erro: i.erro ?? null,
        p_reenfileirar_em: i.reenfileirarEm?.toISOString() ?? null,
      });
    },
    executarFerramenta: (nome, ctx) =>
      executarFerramentaAgente(
        nome,
        {
          orgId: ctx.orgId,
          agentId: ctx.agentId,
          taskId: ctx.taskId,
          hoje: new Date().toISOString().slice(0, 10),
          chamarRpc: rpc,
        },
        ctx.params,
      ),
    chamarModelo: (r) => chamarAnthropic(chave, r),
    registrarUsoIa: async ({ userId: uid, modelo }) => {
      await admin.from("ia_uso").insert({ user_id: uid, funcao: "agent-worker", modelo });
    },
    agora: () => new Date(),
  };

  const resultados: Rec[] = [];
  for (const taskId of ids) {
    const r = await executarTarefaAgente(deps, {
      taskId,
      userId,
      workerId: `agent-worker:${crypto.randomUUID()}`,
    });
    resultados.push(
      r.ok
        ? { tarefa_id: r.taskId, ok: true, custo_usd: r.custoUsd, passos: r.passos }
        : { tarefa_id: r.taskId, ok: false, reason: r.reason, detail: r.detail },
    );
  }
  return json({ ok: true, processadas: resultados.length, resultados });
});
