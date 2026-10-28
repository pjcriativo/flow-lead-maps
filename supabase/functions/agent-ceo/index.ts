// Edge: agent-ceo — Copiloto do CEO de IA. Publicada (v1); a v2 acrescenta as ferramentas de equipe.
//
// Fina por design: autentica, autoriza a organização e delega ao runtime (_shared/agent-ceo-turn).
// 🔒 JWT + papel admin/gerente + vínculo com a org; org vem do corpo mas é VALIDADA contra a sessão.
// 🚧 Execução somente MANUAL (um turno por pedido do usuário), sem cron, sem envio externo.
// 🔎 Ferramentas: só as que o humano concedeu ao CEO (leitura + delegar/propor equipe). Todas passam
//    por RPC fixa que deriva a organização do agente; nada de SQL livre.
// 💸 Teto por agente (dia/mês) lido do banco; modelo barato por padrão.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import { resolverChave } from "../_shared/chaves.ts";
import type { StepRecord } from "../_shared/agent-runtime.ts";
import { executarFerramentaAgente } from "../_shared/agent-tool-exec.ts";
import { executarTurnoCeo, type CeoDeps, type TarefaRow } from "../_shared/agent-ceo-turn.ts";
import {
  autorizarGestorDeAgentes,
  carregarAgenteComPermissoes,
  carregarContextoIa,
  criarChamadorModelo,
  criarConsumoOrg,
  criarRegistradorDeEventos,
  criarRpc,
  ehMotivoDeTeto,
  type Rec,
} from "../_shared/agent-edge-kit.ts";
import { MSG_CONFIGURAR_PROVEDOR, redigirSegredos } from "../_shared/ai-provider.ts";
import {
  montarContextoOperacao,
  resumirAcaoDaFerramenta,
  type AcaoChat,
} from "../_shared/ceo-chat.ts";

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

  // Provedor/modelo vêm da Central de IA (Super Admin). Sem a Central publicada, vale o comportamento
  // anterior: Claude com a chave ANTHROPIC_API_KEY.
  const ia = await carregarContextoIa(admin);
  if (!ia.central && !(await resolverChave(admin, "ANTHROPIC_API_KEY"))) {
    return json({ error: "Assistente indisponível." }, 503);
  }

  const rpc = criarRpc(admin);
  const linhaTarefa = (t: Rec): TarefaRow => ({
    id: t.id,
    status: t.status,
    attemptCount: t.attempt_count,
    maxAttempts: t.max_attempts,
    resultado: t.resultado ?? null,
  });

  // ── conversa persistente (opcional): só quando a migration do chat existe; senão segue sem histórico ──
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const quer = body.persistir === true;
  const conversaPedida =
    typeof body.conversa_id === "string" && UUID.test(body.conversa_id) ? body.conversa_id : null;
  const operacaoPedida =
    typeof body.operacao_id === "string" && UUID.test(body.operacao_id) ? body.operacao_id : null;
  let conversaId: string | null = null;
  let persistencia = false;
  let historicoDb: { role: string; content: string }[] | null = null;
  if (quer) {
    const ceoCarga = await carregarAgenteComPermissoes(admin, { orgId, slug: "ceo" });
    if (ceoCarga) {
      try {
        conversaId = (await rpc("agent_conversa_abrir", {
          p_org: orgId,
          p_user: userId,
          p_agent: ceoCarga.agent.id,
          p_conversa: conversaPedida,
          p_operacao: operacaoPedida,
        })) as string;
        persistencia = true;
        const h = (await rpc("agent_conversa_historico", {
          p_org: orgId,
          p_user: userId,
          p_conversa: conversaId,
          p_limite: 12,
        })) as { papel: string; conteudo: string }[];
        historicoDb = (h ?? []).map((m) => ({ role: m.papel, content: m.conteudo }));
      } catch (e) {
        const msg = String(e instanceof Error ? e.message : e);
        // migration do chat ainda não aplicada: segue sem persistência (comportamento anterior)
        if (!/agent_conversa_abrir|agent_conversa_historico|PGRST202|does not exist/i.test(msg)) {
          const permissao = /sem_permissao|conversa_inexistente|agente_fora|operacao_fora/.test(
            msg,
          );
          return json(
            { ok: false, reason: permissao ? "conversa_invalida" : "erro_conversa" },
            permissao ? 403 : 500,
          );
        }
      }
    }
  }
  // operação em foco: texto montado NO SERVIDOR a partir de dados da própria organização
  let contextoExtra = "";
  const operacaoFoco = operacaoPedida;
  if (operacaoFoco) {
    const { data: op } = await admin
      .from("agent_operacoes")
      .select(
        "id, nome, nicho, subnicho, produto, publico_alvo, regiao, status, orcamento_usd_mes, papeis, papeis_pendentes",
      )
      .eq("id", operacaoFoco)
      .eq("org_id", orgId)
      .maybeSingle();
    if (op) contextoExtra = montarContextoOperacao(op as Rec);
  }
  const ferramentasUsadas = new Set<string>();
  const acoes: AcaoChat[] = [];

  const registrarEvento = criarRegistradorDeEventos(admin, { orgId });
  const deps: CeoDeps = {
    carregarAgente: (org) => carregarAgenteComPermissoes(admin, { orgId: org, slug: "ceo" }),
    consumo: async (agentId) => {
      const r = (await rpc("agent_consumo", { p_agent: agentId })) as Rec[];
      return { usdDia: Number(r?.[0]?.usd_dia ?? 0), usdMes: Number(r?.[0]?.usd_mes ?? 0) };
    },
    enfileirar: async (i) =>
      linhaTarefa(
        (await rpc("agent_enfileirar_tarefa", {
          p_org: i.orgId,
          p_agent: i.agentId,
          p_tipo: "copiloto_conversa",
          p_entrada: i.entrada,
          p_idempotency_key: i.idempotencyKey,
          p_user: i.userId,
        })) as Rec,
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
    // Único caminho de dados do modelo: RPC fixa por ferramenta, org derivada do agente no banco.
    executarFerramenta: async (nome, ctx) => {
      ferramentasUsadas.add(nome);
      const saida = await executarFerramentaAgente(
        nome,
        {
          orgId: ctx.orgId,
          agentId: ctx.agentId,
          taskId: ctx.taskId,
          hoje: new Date().toISOString().slice(0, 10),
          chamarRpc: rpc,
        },
        ctx.params,
      );
      const acao = resumirAcaoDaFerramenta(nome, saida);
      if (acao) acoes.push(acao);
      return saida;
    },
    chamarModelo: criarChamadorModelo(admin, ia, registrarEvento),
    tabelaPrecos: ia.tabela,
    consumoOrg: criarConsumoOrg(rpc),
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
    historico: historicoDb ?? (Array.isArray(body.historico) ? body.historico : []),
    workerId: `agent-ceo:${crypto.randomUUID()}`,
    contextoExtra: contextoExtra || undefined,
  });
  if (!resultado.ok) {
    if (ehMotivoDeTeto(resultado.reason)) {
      await registrarEvento({
        tipo: "limite_atingido",
        provider: null,
        modelo: "—",
        status: resultado.reason,
        detalhe: "Copiloto do CEO bloqueado por teto de custo",
      });
    }
    return json(
      {
        ok: false,
        reason: resultado.reason,
        detail: resultado.detail,
        ...(resultado.reason === "falha_modelo" ? { mensagem: MSG_CONFIGURAR_PROVEDOR } : {}),
      },
      resultado.httpStatus,
    );
  }
  let persistido = false;
  if (persistencia && conversaId) {
    try {
      await rpc("agent_conversa_registrar", {
        p_org: orgId,
        p_user: userId,
        p_conversa: conversaId,
        p_client_message_id:
          typeof body.client_message_id === "string" ? body.client_message_id : null,
        p_pergunta: typeof body.mensagem === "string" ? body.mensagem : "",
        p_resposta: resultado.resposta,
        p_ferramentas: [...ferramentasUsadas],
        p_acoes: acoes,
        p_task: resultado.taskId,
        p_custo: resultado.custoUsd,
      });
      persistido = true;
    } catch (e) {
      // a resposta já foi gerada e cobrada: não a perdemos; o cliente é avisado de que não foi salva
      console.error(
        "agent_conversa_registrar:",
        redigirSegredos(e instanceof Error ? e.message : e),
      );
    }
  }
  return json({
    ok: true,
    resposta: resultado.resposta,
    reutilizado: resultado.reutilizado,
    custo_usd: resultado.custoUsd,
    passos: resultado.passos,
    task_id: resultado.taskId,
    conversa_id: persistencia ? conversaId : null,
    persistido,
    ferramentas: [...ferramentasUsadas],
    acoes,
  });
});
