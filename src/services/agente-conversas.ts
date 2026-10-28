// Serviço — histórico de conversas do CEO (Tela 10). LEITURAS pelas tabelas (RLS: só o DONO da conversa lê,
// dentro da própria organização; nem outro admin nem o super admin da plataforma). ESCRITAS só pela Edge
// agent-ceo (runtime) e pelas RPCs do dono (arquivar / vincular operação). Sem a migration do chat
// aplicada, devolve "indisponível" e a tela mostra apenas a sessão atual — nada é inventado.
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { CEO_CHAT_PERSISTENTE_HABILITADO, type AcaoChat } from "@/services/agente-ceo";
import { db, rpc } from "@/services/agente-ceo-admin";
import { recursoAusente } from "@/services/agente-operacoes";

export type ConversaLinha = {
  id: string;
  titulo: string;
  operacao_id: string | null;
  atualizado_em: string;
};

export type MensagemSalva = {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
  ferramentas: string[];
  acoes: AcaoChat[];
  criado_em: string;
};

export type ListaConversas = { disponivel: false } | { disponivel: true; itens: ConversaLinha[] };

export async function listarConversas(): Promise<ListaConversas> {
  if (!CEO_CHAT_PERSISTENTE_HABILITADO) return { disponivel: false };
  const { orgId } = await getActiveOrganizationContext();
  const { data, error } = await db()
    .from("agent_conversas")
    .select("id, titulo, operacao_id, atualizado_em")
    .eq("org_id", orgId)
    .eq("estado", "ativa")
    .order("atualizado_em", { ascending: false })
    .limit(40);
  if (recursoAusente(error)) return { disponivel: false };
  if (error) throw new Error("Não foi possível carregar o histórico.");
  return { disponivel: true, itens: (data ?? []) as unknown as ConversaLinha[] };
}

export async function carregarMensagens(conversaId: string): Promise<MensagemSalva[]> {
  const { data, error } = await db()
    .from("agent_conversa_mensagens")
    .select("id, papel, conteudo, ferramentas, acoes, criado_em")
    .eq("conversa_id", conversaId)
    .order("criado_em", { ascending: true })
    .limit(200);
  if (error) throw new Error("Não foi possível carregar a conversa.");
  return (data ?? []) as unknown as MensagemSalva[];
}

export async function arquivarConversa(conversaId: string): Promise<void> {
  await rpc("agent_conversa_arquivar", { p_conversa: conversaId });
}

export async function vincularOperacao(
  conversaId: string,
  operacaoId: string | null,
): Promise<void> {
  await rpc("agent_conversa_definir_operacao", { p_conversa: conversaId, p_operacao: operacaoId });
}

/** Situação atual das aprovações citadas nos cartões do chat (pendente, aprovada, rejeitada). */
export async function statusDasAprovacoes(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await db().from("agent_approvals").select("id, status").in("id", ids);
  if (error) return {};
  return Object.fromEntries(
    ((data ?? []) as { id: string; status: string }[]).map((a) => [a.id, a.status]),
  );
}
