// Edge: agent-ceo — Copiloto do CEO de IA (Prompt 28). NÃO PUBLICADA: o deploy e a migration
// 202610270001 dependem de autorização do dono.
//
// Fina por design: autentica, autoriza a organização e delega ao runtime (_shared/agent-ceo-turn).
// 🔒 JWT + papel admin/gerente + vínculo com a org; org vem do corpo mas é VALIDADA contra a sessão.
// 🚧 Execução somente MANUAL (um turno por pedido do usuário), sem cron, sem autonomia externa.
// 🔎 Única ferramenta: RPC agent_resumo_comercial executada com o JWT do usuário (RLS vale).
// 💸 Teto por agente (dia/mês) lido do banco; modelo barato por padrão; nada de SQL livre.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { acessoFerramentaLiberado } from "../_shared/acesso.ts";
import { resolverChave } from "../_shared/chaves.ts";
import { canManageAgents, type AgentIdentity, type StepRecord } from "../_shared/agent-runtime.ts";
import { anthropicToolSchemas } from "../_shared/agent-tools.ts";
import {
  executarTurnoCeo,
  ModeloErro,
  type CeoDeps,
  type ChamadaModelo,
  type RespostaModelo,
} from "../_shared/agent-ceo-turn.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

function paraMensagensAnthropic(req: ChamadaModelo): Rec[] {
  return req.mensagens.map((m) => {
    if ("toolUses" in m) {
      return {
        role: "assistant",
        content: [
          ...(m.text ? [{ type: "text", text: m.text }] : []),
          ...m.toolUses.map((t) => ({
            type: "tool_use",
            id: t.id,
            name: t.name,
            input: t.input ?? {},
          })),
        ],
      };
    }
    if ("toolResults" in m) {
      return {
        role: "user",
        content: m.toolResults.map((r) => ({
          type: "tool_result",
          tool_use_id: r.id,
          content: r.content,
          is_error: r.isError,
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

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

  // ── autenticação e autorização (revalidadas em TODA requisição) ──
  const { data: u, error: uErr } = await userClient.auth.getUser();
  if (uErr || !u.user) return json({ error: "Não autenticado." }, 401);
  const userId = u.user.id;
  const [liberado, perfil, vinculo] = await Promise.all([
    acessoFerramentaLiberado(userClient, userId),
    admin.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
    admin
      .from("memberships")
      .select("papel")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (!liberado) return json({ error: "Acesso não autorizado." }, 403);
  const isSuper = perfil.data?.is_super_admin === true;
  if (!vinculo.data && !isSuper) return json({ error: "Sem acesso à organização." }, 403);
  if (!canManageAgents(vinculo.data?.papel as string | undefined, isSuper)) {
    return json({ error: "Apenas administradores e gerentes usam o CEO de IA." }, 403);
  }

  const chave = await resolverChave(admin, "ANTHROPIC_API_KEY");
  if (!chave) return json({ error: "Assistente indisponível." }, 503);

  const carregarAgente: CeoDeps["carregarAgente"] = async (org) => {
    const { data: a } = await admin
      .from("agents")
      .select("*")
      .eq("org_id", org)
      .eq("slug", "ceo")
      .maybeSingle();
    if (!a) return null;
    const [perms, tools] = await Promise.all([
      admin
        .from("agent_permissions")
        .select("agent_id, org_id, tool_nome, ativo")
        .eq("agent_id", a.id)
        .eq("org_id", org),
      admin.from("agent_tools").select("nome, risco, ativo"),
    ]);
    const agent: AgentIdentity = {
      id: a.id,
      orgId: a.org_id,
      papel: a.papel,
      modelo: a.modelo,
      autonomia: a.autonomia,
      estado: a.estado,
      killSwitch: a.kill_switch,
      tetoUsdDia: Number(a.teto_usd_dia),
      tetoUsdMes: Number(a.teto_usd_mes),
      maxPassos: a.max_passos,
      maxTokensSaida: a.max_tokens_saida,
    };
    return {
      agent,
      catalog: (tools.data ?? []).map((t: Rec) => ({
        nome: t.nome,
        risco: t.risco,
        ativo: t.ativo,
      })),
      permissions: (perms.data ?? []).map((p: Rec) => ({
        agentId: p.agent_id,
        orgId: p.org_id,
        toolNome: p.tool_nome,
        ativo: p.ativo,
      })),
    };
  };

  const linhaTarefa = (t: Rec) => ({
    id: t.id,
    status: t.status,
    attemptCount: t.attempt_count,
    maxAttempts: t.max_attempts,
    resultado: t.resultado ?? null,
  });
  const rpc = async (nome: string, args: Rec) => {
    const { data, error } = await admin.rpc(nome, args);
    if (error) throw new Error(`${nome}: ${error.message}`);
    return data;
  };

  const deps: CeoDeps = {
    carregarAgente,
    consumo: async (agentId) => {
      const r = (await rpc("agent_consumo", { p_agent: agentId })) as Rec[];
      return { usdDia: Number(r?.[0]?.usd_dia ?? 0), usdMes: Number(r?.[0]?.usd_mes ?? 0) };
    },
    enfileirar: async (i) =>
      linhaTarefa(
        await rpc("agent_enfileirar_tarefa", {
          p_org: i.orgId,
          p_agent: i.agentId,
          p_tipo: "copiloto_conversa",
          p_entrada: i.entrada,
          p_idempotency_key: i.idempotencyKey,
          p_user: i.userId,
        }),
      ),
    reservar: async (taskId, workerId) => {
      const r = (await rpc("agent_reservar_tarefa", {
        p_worker: workerId,
        p_task: taskId,
        p_lease_seconds: 90,
      })) as Rec[];
      return r?.[0] ? linhaTarefa(r[0]) : null;
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
    // Único caminho de dados do modelo: RPC fixa, com o JWT do usuário (RLS de leads vale).
    executarFerramenta: async (nome, org) => {
      if (nome !== "consultar_resumo_comercial") throw new Error("ferramenta_sem_executor");
      const { data, error } = await userClient.rpc("agent_resumo_comercial", { p_org: org });
      if (error) throw new Error(error.message);
      return data;
    },
    chamarModelo: async (r: ChamadaModelo): Promise<RespostaModelo> => {
      let res: Response;
      try {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": chave,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: r.modelo,
            max_tokens: r.maxTokensSaida,
            system: r.system,
            tools: anthropicToolSchemas(),
            messages: paraMensagensAnthropic(r),
          }),
          signal: AbortSignal.timeout(45_000),
        });
      } catch (e) {
        const aborted = e instanceof DOMException && e.name === "TimeoutError";
        throw new ModeloErro("Falha de rede com o provedor de IA.", undefined, aborted);
      }
      const data: Rec = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new ModeloErro(`Claude: ${data?.error?.message ?? "HTTP " + res.status}`, res.status);
      const blocos: Rec[] = Array.isArray(data.content) ? data.content : [];
      return {
        texto: blocos
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join(""),
        toolUses: blocos
          .filter((b) => b.type === "tool_use")
          .map((b) => ({ id: b.id, name: b.name, input: b.input })),
        tokensEntrada: data.usage?.input_tokens ?? 0,
        tokensSaida: data.usage?.output_tokens ?? 0,
      };
    },
    registrarUsoIa: async ({ userId: uid, modelo }) => {
      await admin.from("ia_uso").insert({ user_id: uid, funcao: "agent-ceo", modelo });
    },
    agora: () => new Date(),
  };

  const resultado = await executarTurnoCeo(deps, {
    orgId,
    userId,
    clientMessageId: typeof body.client_message_id === "string" ? body.client_message_id : "",
    mensagem: typeof body.mensagem === "string" ? body.mensagem : "",
    historico: Array.isArray(body.historico) ? body.historico : [],
    workerId: `agent-ceo:${crypto.randomUUID()}`,
  });
  if (!resultado.ok)
    return json(
      { ok: false, reason: resultado.reason, detail: resultado.detail },
      resultado.httpStatus,
    );
  return json({
    ok: true,
    resposta: resultado.resposta,
    reutilizado: resultado.reutilizado,
    custo_usd: resultado.custoUsd,
    passos: resultado.passos,
  });
});
