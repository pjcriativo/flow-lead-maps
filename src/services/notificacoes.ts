// Notificações in-app recebidas pelo usuário (avisos da plataforma). Leitura direta via
// RLS (notificacao_destinatarios.user_id = auth.uid()); marcar como lida é um update na
// própria linha — nada disso passa por cota/rampa de prospecção.
import { supabase } from "@/integrations/supabase/client";

export type MinhaNotificacao = {
  destinatario_id: string;
  titulo: string;
  mensagem: string;
  enviado_em: string;
  lida_em: string | null;
};

export async function listarMinhasNotificacoes(): Promise<MinhaNotificacao[]> {
  const { data, error } = await supabase
    .from("notificacao_destinatarios")
    .select("id, enviado_em, lida_em, notificacoes(titulo, mensagem)")
    .order("enviado_em", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    destinatario_id: d.id,
    titulo:
      (d.notificacoes as unknown as { titulo: string; mensagem: string } | null)?.titulo ?? "",
    mensagem:
      (d.notificacoes as unknown as { titulo: string; mensagem: string } | null)?.mensagem ?? "",
    enviado_em: d.enviado_em,
    lida_em: d.lida_em,
  }));
}

export async function marcarNotificacaoLida(destinatarioId: string): Promise<void> {
  const { error } = await supabase
    .from("notificacao_destinatarios")
    .update({ lida_em: new Date().toISOString() })
    .eq("id", destinatarioId);
  if (error) throw new Error(error.message);
}
