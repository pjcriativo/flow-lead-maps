// Serviço — administração do CEO de IA (Telas 02 e 03). SÓ chama as RPCs de governança da migration
// 202610270001/2, que exigem sessão humana com papel admin/gerente. Nada aqui escreve direto em
// tabela de agente, concede permissão por conta própria ou muda o estado sem confirmação do banco.
// Enquanto as migrations não forem aplicadas, toda chamada falha com "serviço indisponível"
// (nunca simula sucesso).
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import {
  traduzirErroCeo,
  type AgenteCeoRow,
  type CargaCeo,
  type ConfigCeoForm,
} from "@/lib/ceo-config";

// As tabelas de agentes ainda não estão em types.ts (gerado após a migration ser aplicada).
export const db = () => supabase as unknown as SupabaseClient;

export class ErroCeo extends Error {
  readonly indisponivel: boolean;
  constructor(causa: unknown) {
    const t = traduzirErroCeo(causa);
    super(t.mensagem);
    this.name = "ErroCeo";
    this.indisponivel = t.indisponivel;
  }
}

export type LinhaAgente = {
  id: string;
  org_id: string;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  descricao: string | null;
  especialidade: string | null;
  avatar_url: string | null;
  modelo: string;
  estado: AgenteCeoRow["estado"];
  kill_switch: boolean;
  teto_usd_dia: number | string;
  teto_usd_mes: number | string;
  max_passos: number;
  papel?: string;
  autonomia?: "somente_leitura" | "interna_supervisionada";
  reports_to?: string | null;
};

export const COLUNAS_AGENTE =
  "id, org_id, nome, cargo, departamento, descricao, especialidade, avatar_url, modelo, estado, kill_switch, teto_usd_dia, teto_usd_mes, max_passos, papel, autonomia, reports_to";

export function paraAgente(l: LinhaAgente): AgenteCeoRow {
  return {
    id: l.id,
    orgId: l.org_id,
    nome: l.nome,
    cargo: l.cargo,
    departamento: l.departamento,
    descricao: l.descricao,
    especialidade: l.especialidade,
    avatarUrl: l.avatar_url,
    modelo: l.modelo,
    estado: l.estado,
    killSwitch: l.kill_switch,
    tetoDiaUsd: Number(l.teto_usd_dia),
    tetoMesUsd: Number(l.teto_usd_mes),
    maxPassos: l.max_passos,
    papel: l.papel,
    autonomia: l.autonomia,
    reportsTo: l.reports_to ?? null,
  };
}

export async function rpc<T = unknown>(nome: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(nome, args);
  if (error) throw new ErroCeo(error);
  return data as T;
}

/** Colunas das migrations 001/002 (sem a hierarquia da 003), para ambientes em que a 003 ainda não foi aplicada. */
export const COLUNAS_AGENTE_LEGADAS = COLUNAS_AGENTE.replace(", reports_to", "");

const colunaAusente = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "42703" || /column .* does not exist/i.test(e.message ?? "")));

/** Lê o estado REAL do CEO da organização ativa (RLS: só gestores enxergam). */
export async function carregarCeo(): Promise<CargaCeo & { orgId: string }> {
  const { orgId } = await getActiveOrganizationContext();
  type Leitura = { data: LinhaAgente | null; error: { code?: string; message?: string } | null };
  const ler = async (colunas: string): Promise<Leitura> =>
    (await db()
      .from("agents")
      .select(colunas)
      .eq("org_id", orgId)
      .eq("slug", "ceo")
      .maybeSingle()) as unknown as Leitura;
  let { data: agente, error } = await ler(COLUNAS_AGENTE);
  // Retrocompatibilidade: a migration 003 (reports_to) pode ainda não existir no banco.
  if (colunaAusente(error)) ({ data: agente, error } = await ler(COLUNAS_AGENTE_LEGADAS));
  if (error) throw new ErroCeo(error);
  if (!agente)
    return { orgId, agente: null, ferramentasConcedidas: [], gastoDiaUsd: 0, gastoMesUsd: 0 };

  const [perms, consumo] = await Promise.all([
    db().from("agent_permissions").select("tool_nome").eq("agent_id", agente.id).eq("ativo", true),
    rpc<{ usd_dia: number | string; usd_mes: number | string }[]>("agent_consumo_org", {
      p_org: orgId,
    }),
  ]);
  if (perms.error) throw new ErroCeo(perms.error);
  return {
    orgId,
    agente: paraAgente(agente as LinhaAgente),
    ferramentasConcedidas: (perms.data ?? []).map((p: { tool_nome: string }) => p.tool_nome),
    gastoDiaUsd: Number(consumo?.[0]?.usd_dia ?? 0),
    gastoMesUsd: Number(consumo?.[0]?.usd_mes ?? 0),
  };
}

/** Cria/atualiza identidade, modelo, limites e ferramentas (somente leitura). NÃO ativa. */
export async function salvarConfigCeo(orgId: string, f: ConfigCeoForm): Promise<AgenteCeoRow> {
  const linha = await rpc<LinhaAgente>("agent_configurar_ceo", {
    p_org: orgId,
    p_nome: f.nome,
    p_cargo: f.cargo,
    p_departamento: f.departamento,
    p_descricao: f.descricao,
    p_especialidade: f.especialidade,
    p_avatar_url: f.avatarUrl,
    p_modelo: f.modelo,
    p_teto_dia: f.tetoDiaUsd,
    p_teto_mes: f.tetoMesUsd,
    p_ferramentas: f.ferramentas,
  });
  return paraAgente(linha);
}

/** Muda o estado; o banco recusa ativar sem ferramenta, identidade ou com kill-switch ligado. */
export async function definirEstadoCeo(
  agenteId: string,
  estado: "ativo" | "pausado" | "inativo",
): Promise<void> {
  await rpc("agent_definir_estado", { p_agent: agenteId, p_estado: estado });
}

export async function definirKillSwitch(orgId: string, ligado: boolean): Promise<number> {
  return Number((await rpc<number>("agent_kill_switch", { p_org: orgId, p_ligado: ligado })) ?? 0);
}

export async function definirLimitesCeo(
  agente: AgenteCeoRow,
  tetoDiaUsd: number,
  tetoMesUsd: number,
  modelo: string,
): Promise<void> {
  await rpc("agent_definir_limites", {
    p_agent: agente.id,
    p_teto_dia: tetoDiaUsd,
    p_teto_mes: tetoMesUsd,
    p_max_passos: agente.maxPassos,
    p_modelo: modelo,
  });
}
