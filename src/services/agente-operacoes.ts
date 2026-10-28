// Serviço — Operações Comerciais por nicho/produto e memória da organização (CEO Mestre).
// LEITURAS pelas tabelas (RLS: só gestores DA organização; o super admin da plataforma não lê memória)
// e ESCRITAS exclusivamente por RPC humana (migration 202610280001). Com a flag desligada, ou com a
// migration ainda não aplicada, devolve "indisponível" e a interface não mostra nada (sem dado inventado).
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { db, rpc } from "@/services/agente-ceo-admin";

export const CEO_MESTRE_HABILITADO = import.meta.env.VITE_CEO_MESTRE === "true";

export type OperacaoLinha = {
  id: string;
  nome: string;
  nicho: string;
  subnicho: string | null;
  produto: string;
  publico_alvo: string;
  regiao: string;
  status: "ativa" | "pausada" | "encerrada";
  orcamento_usd_mes: number;
  papeis: string[];
  papeis_pendentes: string[];
  estrategia: Record<string, string>;
  criado_em: string;
};

export type DesempenhoOperacao = {
  operacao_id: string;
  nome: string;
  nicho: string;
  produto: string;
  regiao: string;
  status: string;
  orcamento_usd_mes: number;
  agentes: number;
  tarefas_total: number;
  tarefas_abertas: number;
  tarefas_concluidas: number;
  tarefas_falhas: number;
  custo_mes_usd: number;
};

export type MemoriaLinha = {
  id: string;
  categoria: string;
  titulo: string;
  conteudo: string;
  origem: "agente" | "humano" | "sistema";
  operacao_id: string | null;
  criado_em: string;
};

type Erro = { code?: string; message?: string } | null;
/** Tabela/função ainda não existe no banco (migration não aplicada) → recurso "ainda não publicado". */
export const recursoAusente = (e: Erro): boolean =>
  Boolean(
    e &&
    (e.code === "42P01" ||
      e.code === "42883" ||
      e.code === "PGRST205" ||
      e.code === "PGRST202" ||
      /does not exist|schema cache/i.test(e.message ?? "")),
  );

export type CargaOperacoes =
  | { disponivel: false }
  | {
      disponivel: true;
      orgId: string;
      operacoes: OperacaoLinha[];
      desempenho: DesempenhoOperacao[];
    };

export async function carregarOperacoes(): Promise<CargaOperacoes> {
  if (!CEO_MESTRE_HABILITADO) return { disponivel: false };
  const { orgId } = await getActiveOrganizationContext();
  const { data, error } = await db()
    .from("agent_operacoes")
    .select(
      "id, nome, nicho, subnicho, produto, publico_alvo, regiao, status, orcamento_usd_mes, papeis, papeis_pendentes, estrategia, criado_em",
    )
    .eq("org_id", orgId)
    .order("criado_em", { ascending: false })
    .limit(50);
  if (recursoAusente(error)) return { disponivel: false };
  if (error) throw new Error("Não foi possível consultar as operações.");
  let desempenho: DesempenhoOperacao[] = [];
  try {
    desempenho =
      (await rpc<DesempenhoOperacao[]>("agent_operacoes_desempenho", { p_org: orgId })) ?? [];
  } catch {
    desempenho = []; // desempenho é complementar: a lista segue válida
  }
  return {
    disponivel: true,
    orgId,
    operacoes: ((data ?? []) as unknown as OperacaoLinha[]).map((o) => ({
      ...o,
      orcamento_usd_mes: Number(o.orcamento_usd_mes),
    })),
    desempenho: desempenho.map((d) => ({
      ...d,
      custo_mes_usd: Number(d.custo_mes_usd),
      orcamento_usd_mes: Number(d.orcamento_usd_mes),
    })),
  };
}

export async function definirEstadoOperacao(
  id: string,
  estado: "ativa" | "pausada" | "encerrada",
): Promise<void> {
  await rpc("agent_operacao_definir_estado", { p_op: id, p_estado: estado });
}

export async function autorizarAgenteNaOperacao(
  operacaoId: string,
  agenteId: string,
  autorizar = true,
): Promise<void> {
  await rpc("agent_operacao_autorizar_agente", {
    p_op: operacaoId,
    p_agent: agenteId,
    p_autorizar: autorizar,
  });
}

/** Aprova/rejeita uma proposta de operação do CEO. Aprovar cria a operação (nunca agentes nem permissões). */
export async function decidirPropostaOperacao(
  aprovacaoId: string,
  aprovar: boolean,
  motivo?: string,
): Promise<void> {
  await rpc("agent_decidir_proposta_operacao", {
    p_approval: aprovacaoId,
    p_aprovar: aprovar,
    p_motivo: motivo ?? null,
  });
}

export type CargaMemoria = { disponivel: false } | { disponivel: true; itens: MemoriaLinha[] };

export async function carregarMemoria(): Promise<CargaMemoria> {
  if (!CEO_MESTRE_HABILITADO) return { disponivel: false };
  const { orgId } = await getActiveOrganizationContext();
  const { data, error } = await db()
    .from("agent_memoria")
    .select("id, categoria, titulo, conteudo, origem, operacao_id, criado_em")
    .eq("org_id", orgId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(50);
  if (recursoAusente(error)) return { disponivel: false };
  if (error) throw new Error("Não foi possível consultar a memória.");
  return { disponivel: true, itens: (data ?? []) as unknown as MemoriaLinha[] };
}

export async function registrarMemoriaHumana(
  orgId: string,
  categoria: string,
  titulo: string,
  conteudo: string,
): Promise<void> {
  await rpc("agent_memoria_registrar_humano", {
    p_org: orgId,
    p_categoria: categoria,
    p_titulo: titulo,
    p_conteudo: conteudo,
    p_operacao: null,
  });
}

export async function arquivarMemoria(id: string): Promise<void> {
  await rpc("agent_memoria_arquivar", { p_id: id });
}
