// Peças comuns das Edges de agentes (agent-ceo e agent-worker): autorização do gestor, carga do
// agente, RPC do runtime e chamada ao provedor de IA. Sem regra de negócio: ela mora nos módulos puros.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { acessoFerramentaLiberado } from "./acesso.ts";
import {
  canManageAgents,
  type AgentIdentity,
  type AgentPermission,
  type ToolSpec,
} from "./agent-runtime.ts";
import { ModeloErro, type ChamadaModelo, type RespostaModelo } from "./agent-ceo-turn.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Rec = Record<string, any>;

export type Autorizacao =
  { ok: true; userId: string; isSuper: boolean } | { ok: false; status: number; error: string };

/** JWT válido + acesso liberado + vínculo com a org + papel de gestão. Revalidado em TODA requisição. */
export async function autorizarGestorDeAgentes(input: {
  admin: SupabaseClient;
  userClient: SupabaseClient;
  orgId: string;
}): Promise<Autorizacao> {
  const { data: u, error } = await input.userClient.auth.getUser();
  if (error || !u.user) return { ok: false, status: 401, error: "Não autenticado." };
  const userId = u.user.id;
  const [liberado, perfil, vinculo] = await Promise.all([
    acessoFerramentaLiberado(input.userClient, userId),
    input.admin.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
    input.admin
      .from("memberships")
      .select("papel")
      .eq("org_id", input.orgId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (!liberado) return { ok: false, status: 403, error: "Acesso não autorizado." };
  const isSuper = perfil.data?.is_super_admin === true;
  if (!vinculo.data && !isSuper)
    return { ok: false, status: 403, error: "Sem acesso à organização." };
  if (!canManageAgents(vinculo.data?.papel as string | undefined, isSuper)) {
    return { ok: false, status: 403, error: "Apenas administradores e gerentes usam os agentes." };
  }
  return { ok: true, userId, isSuper };
}

export function criarRpc(admin: SupabaseClient) {
  return async (nome: string, args: Rec): Promise<unknown> => {
    const { data, error } = await admin.rpc(nome, args);
    if (error) throw new Error(`${nome}: ${error.message}`);
    return data;
  };
}

export type CargaAgente = {
  agent: AgentIdentity;
  catalog: ToolSpec[];
  permissions: AgentPermission[];
};

export function paraIdentidade(a: Rec): AgentIdentity {
  return {
    id: a.id,
    orgId: a.org_id,
    papel: a.papel,
    reportsTo: a.reports_to ?? null,
    modelo: a.modelo,
    autonomia: a.autonomia,
    estado: a.estado,
    killSwitch: a.kill_switch,
    tetoUsdDia: Number(a.teto_usd_dia),
    tetoUsdMes: Number(a.teto_usd_mes),
    maxPassos: a.max_passos,
    maxTokensSaida: a.max_tokens_saida,
  };
}

/** Carrega agente + catálogo + permissões ATIVAS dele (sempre filtrando pela organização). */
export async function carregarAgenteComPermissoes(
  admin: SupabaseClient,
  filtro: { id: string } | { orgId: string; slug: string },
  orgEsperada?: string,
): Promise<CargaAgente | null> {
  let q = admin.from("agents").select("*");
  q = "id" in filtro ? q.eq("id", filtro.id) : q.eq("org_id", filtro.orgId).eq("slug", filtro.slug);
  if (orgEsperada) q = q.eq("org_id", orgEsperada);
  const { data: a } = await q.maybeSingle();
  if (!a) return null;
  const [perms, tools] = await Promise.all([
    admin
      .from("agent_permissions")
      .select("agent_id, org_id, tool_nome, ativo")
      .eq("agent_id", a.id)
      .eq("org_id", a.org_id),
    admin.from("agent_tools").select("nome, risco, ativo"),
  ]);
  return {
    agent: paraIdentidade(a),
    catalog: (tools.data ?? []).map((t: Rec) => ({ nome: t.nome, risco: t.risco, ativo: t.ativo })),
    permissions: (perms.data ?? []).map((p: Rec) => ({
      agentId: p.agent_id,
      orgId: p.org_id,
      toolNome: p.tool_nome,
      ativo: p.ativo,
    })),
  };
}

export function paraMensagensAnthropic(req: ChamadaModelo): Rec[] {
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

/** Chamada à API Messages. Timeout de 45 s; falha de rede é transitória, timeout é "incerto". */
export async function chamarAnthropic(chave: string, r: ChamadaModelo): Promise<RespostaModelo> {
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
        ...(r.tools.length ? { tools: r.tools } : {}),
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
}
