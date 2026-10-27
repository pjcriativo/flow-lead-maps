// Serviço — equipe comercial de IA (Telas 02, 03, 07, 08, 11 e 12). LEITURAS pelas tabelas de agentes
// (RLS: só gestores da organização) e ESCRITAS exclusivamente pelas RPCs de governança da migration
// 202610270003, que exigem sessão humana. O processamento de tarefas é disparado manualmente pela
// Edge `agent-worker`. Nada aqui escreve direto em tabela, concede permissão por conta própria ou
// simula sucesso: sem backend, tudo falha com "serviço indisponível".
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import type { AgenteCeoRow } from "@/lib/ceo-config";
import {
  ehPapel,
  type AprovacaoLinha,
  type Papel,
  type RunLinha,
  type TarefaLinha,
} from "@/lib/equipe-config";
import {
  COLUNAS_AGENTE,
  db,
  ErroCeo,
  paraAgente,
  rpc,
  type LinhaAgente,
} from "@/services/agente-ceo-admin";

export type AgenteEquipe = AgenteCeoRow & { papel: Papel };

export type EquipeCarregada = {
  orgId: string;
  agentes: AgenteEquipe[];
  /** agentId → ferramentas com permissão ATIVA concedida por humano. */
  permissoes: Record<string, string[]>;
  tarefas: TarefaLinha[];
  runs: RunLinha[];
  aprovacoes: AprovacaoLinha[];
  gastoDiaUsd: number;
  gastoMesUsd: number;
};

const JANELA_DIAS = 30;

/** Lê o estado REAL da equipe da organização ativa. Falha com ErroCeo (inclui "serviço indisponível"). */
export async function carregarEquipe(): Promise<EquipeCarregada> {
  const { orgId } = await getActiveOrganizationContext();
  const desde = new Date(Date.now() - JANELA_DIAS * 86_400_000).toISOString();
  const [ag, pm, tk, rn, ap, consumo] = await Promise.all([
    db().from("agents").select(COLUNAS_AGENTE).eq("org_id", orgId),
    db()
      .from("agent_permissions")
      .select("agent_id, tool_nome")
      .eq("org_id", orgId)
      .eq("ativo", true),
    db()
      .from("agent_tasks")
      .select(
        "id, agent_id, tipo, status, delegado_por, criado_em, concluido_em, ultimo_erro, resultado",
      )
      .eq("org_id", orgId)
      .order("criado_em", { ascending: false })
      .limit(60),
    db()
      .from("agent_runs")
      .select("agent_id, status, custo_usd, passos, iniciado_em, finalizado_em")
      .eq("org_id", orgId)
      .gte("iniciado_em", desde)
      .order("iniciado_em", { ascending: false })
      .limit(500),
    db()
      .from("agent_approvals")
      .select("id, agent_id, tipo, resumo, status, payload, criado_em, decidido_em, motivo_decisao")
      .eq("org_id", orgId)
      .order("criado_em", { ascending: false })
      .limit(30),
    rpc<{ usd_dia: number | string; usd_mes: number | string }[]>("agent_consumo_org", {
      p_org: orgId,
    }),
  ]);
  for (const r of [ag, pm, tk, rn, ap]) if (r.error) throw new ErroCeo(r.error);

  const agentes = ((ag.data ?? []) as LinhaAgente[])
    .filter((l) => ehPapel(l.papel))
    .map((l) => ({ ...paraAgente(l), papel: l.papel as Papel }));
  const permissoes: Record<string, string[]> = {};
  for (const p of (pm.data ?? []) as { agent_id: string; tool_nome: string }[]) {
    (permissoes[p.agent_id] ??= []).push(p.tool_nome);
  }
  return {
    orgId,
    agentes,
    permissoes,
    tarefas: ((tk.data ?? []) as Record<string, unknown>[]).map((t) => ({
      id: t.id as string,
      agentId: t.agent_id as string,
      tipo: t.tipo as string,
      status: t.status as string,
      delegadoPor: (t.delegado_por as string | null) ?? null,
      criadoEm: t.criado_em as string,
      concluidoEm: (t.concluido_em as string | null) ?? null,
      ultimoErro: (t.ultimo_erro as string | null) ?? null,
      resultado: (t.resultado as TarefaLinha["resultado"]) ?? null,
    })),
    runs: ((rn.data ?? []) as Record<string, unknown>[]).map((r) => ({
      agentId: r.agent_id as string,
      status: r.status as string,
      custoUsd: Number(r.custo_usd ?? 0),
      passos: Number(r.passos ?? 0),
      iniciadoEm: r.iniciado_em as string,
      finalizadoEm: (r.finalizado_em as string | null) ?? null,
    })),
    aprovacoes: ((ap.data ?? []) as Record<string, unknown>[]).map((a) => ({
      id: a.id as string,
      agentId: a.agent_id as string,
      tipo: a.tipo as string,
      resumo: a.resumo as string,
      status: a.status as string,
      payload: (a.payload as AprovacaoLinha["payload"]) ?? null,
      criadoEm: a.criado_em as string,
      decididoEm: (a.decidido_em as string | null) ?? null,
      motivo: (a.motivo_decisao as string | null) ?? null,
    })),
    gastoDiaUsd: Number(consumo?.[0]?.usd_dia ?? 0),
    gastoMesUsd: Number(consumo?.[0]?.usd_mes ?? 0),
  };
}

// ───────────────────────────── ações humanas (RPCs de governança) ─────────────────────────────
/** Cria os agentes pedidos, INATIVOS, com as permissões padrão do papel. Humano apenas. */
export async function criarEquipe(orgId: string, papeis: readonly Papel[]): Promise<number> {
  return Number(
    (await rpc<number>("agent_criar_equipe", {
      p_org: orgId,
      p_def: papeis.map((papel) => ({ papel })),
    })) ?? 0,
  );
}

/** Decide a proposta de equipe do CEO; aprovar cria os agentes INATIVOS. */
export async function decidirPropostaEquipe(
  aprovacaoId: string,
  aprovar: boolean,
  motivo?: string,
): Promise<number> {
  return Number(
    (await rpc<number>("agent_decidir_proposta_equipe", {
      p_approval: aprovacaoId,
      p_aprovar: aprovar,
      p_motivo: motivo ?? null,
    })) ?? 0,
  );
}

/** Aprovações que não são de equipe (ação externa, gasto, outras configurações). */
export async function decidirAprovacao(
  aprovacaoId: string,
  aprovar: boolean,
  motivo?: string,
): Promise<void> {
  await rpc("agent_decidir_aprovacao", {
    p_approval: aprovacaoId,
    p_aprovar: aprovar,
    p_motivo: motivo ?? null,
  });
}

export async function habilitarDelegacao(agenteId: string): Promise<void> {
  await rpc("agent_habilitar_delegacao", { p_agent: agenteId });
}
export async function desabilitarDelegacao(agenteId: string): Promise<void> {
  await rpc("agent_desabilitar_delegacao", { p_agent: agenteId });
}
export async function concederFerramenta(agenteId: string, ferramenta: string): Promise<void> {
  await rpc("agent_conceder_permissao", { p_agent: agenteId, p_tool: ferramenta });
}
export async function revogarFerramenta(agenteId: string, ferramenta: string): Promise<void> {
  await rpc("agent_revogar_permissao", { p_agent: agenteId, p_tool: ferramenta });
}

export type ResultadoProcessamento = {
  processadas: number;
  resultados: { tarefa_id: string; ok: boolean; reason?: string; custo_usd?: number }[];
};

/** Dispara, MANUALMENTE, o processamento das próximas tarefas da fila (Edge agent-worker). */
export async function processarFila(orgId: string, limite = 2): Promise<ResultadoProcessamento> {
  const { data, error } = await supabase.functions.invoke("agent-worker", {
    body: { org_id: orgId, limite },
  });
  if (error) {
    const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new ErroCeo({
      message: (corpo as { error?: string } | null)?.error ?? error.message,
      code: "WORKER",
    });
  }
  const d = data as { ok?: boolean } & Partial<ResultadoProcessamento>;
  if (!d?.ok) throw new ErroCeo({ message: "Resposta inválida do processamento." });
  return { processadas: d.processadas ?? 0, resultados: d.resultados ?? [] };
}
