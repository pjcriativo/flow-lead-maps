// Serviço — Copiloto do CEO de IA (Tela 10). Fala com a Edge `agent-ceo` (somente leitura).
// DESLIGADO por padrão: a Edge e a migration 202610270001 ainda NÃO foram publicadas. Enquanto
// VITE_CEO_IA_REAL não for "true", a tela mantém o comportamento demonstrativo e nada é chamado.
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationContext } from "@/lib/active-organization";

export const CEO_IA_REAL_HABILITADO = import.meta.env.VITE_CEO_IA_REAL === "true";

export type TurnoHistorico = { role: "user" | "assistant"; content: string };

export type RespostaCeo =
  | { ok: true; resposta: string; reutilizado: boolean; custoUsd: number }
  | { ok: false; motivo: string; mensagem: string };

const MENSAGENS: Record<string, string> = {
  ceo_nao_configurado: "O CEO de IA ainda não foi configurado para esta organização.",
  agente_inativo: "O CEO de IA está inativo. Um administrador precisa ativá-lo.",
  agente_pausado: "O CEO de IA está pausado.",
  kill_switch: "O CEO de IA foi interrompido por um administrador (kill-switch).",
  teto_dia: "O limite diário de uso de IA do CEO foi atingido.",
  teto_mes: "O limite mensal de uso de IA do CEO foi atingido.",
  em_andamento: "Esta mensagem já está sendo processada.",
  falha_modelo: "O provedor de IA não respondeu. Tente novamente em instantes.",
  mensagem_invalida: "Mensagem vazia ou longa demais (máximo 2000 caracteres).",
};

export async function perguntarAoCeo(input: {
  mensagem: string;
  clientMessageId: string;
  historico?: TurnoHistorico[];
}): Promise<RespostaCeo> {
  const { orgId } = await getActiveOrganizationContext();
  const { data, error } = await supabase.functions.invoke("agent-ceo", {
    body: {
      org_id: orgId,
      mensagem: input.mensagem,
      client_message_id: input.clientMessageId,
      historico: input.historico ?? [],
    },
  });
  if (error) {
    // Respostas não-2xx da Edge trazem {ok:false, reason} no corpo.
    const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null);
    const motivo = (corpo as { reason?: string } | null)?.reason ?? "erro";
    return {
      ok: false,
      motivo,
      mensagem: MENSAGENS[motivo] ?? "Não foi possível consultar o CEO de IA agora.",
    };
  }
  const d = data as { ok?: boolean; resposta?: string; reutilizado?: boolean; custo_usd?: number };
  if (!d?.ok || typeof d.resposta !== "string") {
    return { ok: false, motivo: "resposta_invalida", mensagem: "Resposta inválida do CEO de IA." };
  }
  return {
    ok: true,
    resposta: d.resposta,
    reutilizado: d.reutilizado === true,
    custoUsd: d.custo_usd ?? 0,
  };
}
