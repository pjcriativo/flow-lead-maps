// Suporte — lado CLIENTE (dentro do app): abrir chamado + ver os seus + responder.
// RLS (migration 049) já restringe: vendedor/sdr só o próprio; admin/gerente/suporte veem a
// org toda. Sem Edge aqui — client direto, a regra vive no banco (mesmo padrão de leads).
import { supabase } from "@/integrations/supabase/client";

export type Prioridade = "baixa" | "media" | "alta";
export type StatusTicket = "aberto" | "em_andamento" | "resolvido" | "fechado";

export type Ticket = {
  id: string;
  assunto: string;
  mensagem: string;
  prioridade: Prioridade;
  status: StatusTicket;
  criado_em: string;
  atualizado_em: string;
};

export type RespostaTicket = {
  id: string;
  ticket_id: string;
  autor_user_id: string;
  eh_admin: boolean;
  texto: string;
  criado_em: string;
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
export const STATUS_TICKET_LABEL: Record<StatusTicket, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export async function abrirTicket(
  assunto: string,
  mensagem: string,
  prioridade: Prioridade = "media",
): Promise<Ticket> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      autor_user_id: userId,
      assunto: assunto.trim(),
      mensagem: mensagem.trim(),
      prioridade,
    })
    .select("id, assunto, mensagem, prioridade, status, criado_em, atualizado_em")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao abrir o chamado");
  return data;
}

/** Meus tickets (RLS filtra: vendedor/sdr só os próprios; admin/gerente veem a org toda). */
export async function listarMeusTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("id, assunto, mensagem, prioridade, status, criado_em, atualizado_em")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listarRespostas(ticketId: string): Promise<RespostaTicket[]> {
  const { data, error } = await supabase
    .from("ticket_respostas")
    .select("id, ticket_id, autor_user_id, eh_admin, texto, criado_em")
    .eq("ticket_id", ticketId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Resposta do CLIENTE (eh_admin sempre false aqui — o admin responde pela Edge admin-acoes). */
export async function responderTicket(ticketId: string, texto: string): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("ticket_respostas")
    .insert({ ticket_id: ticketId, autor_user_id: userId, eh_admin: false, texto: texto.trim() });
  if (error) throw error;
}
