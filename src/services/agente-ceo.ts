// Serviço — Copiloto do CEO de IA (Tela 10). Fala com a Edge `agent-ceo` (leitura + coordenação interna:
// o CEO consulta dados reais, propõe planos e delega tarefas; nada é enviado a leads nem gasta dinheiro).
// O chat só conversa com o CEO real quando VITE_CEO_IA_REAL=true; a persistência de conversas só quando
// VITE_CEO_CHAT=true E a migration do chat estiver aplicada (a Edge devolve conversa_id=null se não estiver).
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationContext } from "@/lib/active-organization";

export const CEO_IA_REAL_HABILITADO = import.meta.env.VITE_CEO_IA_REAL === "true";
export const CEO_CHAT_PERSISTENTE_HABILITADO = import.meta.env.VITE_CEO_CHAT === "true";

export type TurnoHistorico = { role: "user" | "assistant"; content: string };

/** Ação gerada pelo CEO na resposta (proposta para aprovar ou tarefa criada). Espelha _shared/ceo-chat.ts. */
export type AcaoChat =
  | {
      tipo: "proposta_operacao";
      aprovacao_id: string;
      plano: {
        nome: string;
        nicho: string;
        subnicho?: string;
        produto: string;
        publico_alvo: string;
        regiao: string;
        papeis: string[];
        orcamento_usd_mes: number;
        estrategia: Record<string, string>;
      };
    }
  | { tipo: "proposta_equipe"; aprovacao_id: string; papeis: string[] }
  | { tipo: "tarefa"; tarefa_id: string | null; destinatario: string; tarefa_tipo: string };

export type RespostaCeo =
  | {
      ok: true;
      resposta: string;
      reutilizado: boolean;
      custoUsd: number;
      conversaId: string | null;
      persistido: boolean;
      ferramentas: string[];
      acoes: AcaoChat[];
    }
  | { ok: false; motivo: string; mensagem: string };

const MENSAGENS: Record<string, string> = {
  ceo_nao_configurado: "O CEO de IA ainda não foi configurado para esta organização.",
  agente_inativo: "O CEO de IA está inativo. Um administrador precisa ativá-lo.",
  agente_pausado: "O CEO de IA está pausado.",
  kill_switch: "O CEO de IA foi interrompido por um administrador (kill-switch).",
  teto_dia: "O limite diário de uso de IA do CEO foi atingido.",
  teto_mes: "O limite mensal de uso de IA do CEO foi atingido.",
  teto_org_dia: "O limite diário de IA da organização foi atingido.",
  teto_org_mes: "O limite mensal de IA da organização foi atingido.",
  em_andamento: "Esta mensagem já está sendo processada.",
  falha_modelo: "O provedor de IA não respondeu. Tente novamente em instantes.",
  modelo_nao_precificado: "O modelo do CEO ainda não tem preço definido no Super Admin.",
  mensagem_invalida: "Mensagem vazia ou longa demais (máximo 2000 caracteres).",
  conversa_invalida: "Esta conversa não pertence a você ou a esta organização.",
  erro_conversa: "Não foi possível abrir a conversa agora.",
};

export async function perguntarAoCeo(input: {
  mensagem: string;
  clientMessageId: string;
  historico?: TurnoHistorico[];
  /** Persistir a conversa no servidor (exige VITE_CEO_CHAT e a migration do chat). */
  persistir?: boolean;
  conversaId?: string | null;
  operacaoId?: string | null;
}): Promise<RespostaCeo> {
  const { orgId } = await getActiveOrganizationContext();
  const { data, error } = await supabase.functions.invoke("agent-ceo", {
    body: {
      org_id: orgId,
      mensagem: input.mensagem,
      client_message_id: input.clientMessageId,
      historico: input.historico ?? [],
      ...(input.persistir ? { persistir: true } : {}),
      ...(input.conversaId ? { conversa_id: input.conversaId } : {}),
      ...(input.operacaoId ? { operacao_id: input.operacaoId } : {}),
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
  const d = data as {
    ok?: boolean;
    resposta?: string;
    reutilizado?: boolean;
    custo_usd?: number;
    conversa_id?: string | null;
    persistido?: boolean;
    ferramentas?: string[];
    acoes?: AcaoChat[];
  };
  if (!d?.ok || typeof d.resposta !== "string") {
    return { ok: false, motivo: "resposta_invalida", mensagem: "Resposta inválida do CEO de IA." };
  }
  return {
    ok: true,
    resposta: d.resposta,
    reutilizado: d.reutilizado === true,
    custoUsd: d.custo_usd ?? 0,
    conversaId: d.conversa_id ?? null,
    persistido: d.persistido === true,
    ferramentas: Array.isArray(d.ferramentas) ? d.ferramentas : [],
    acoes: Array.isArray(d.acoes) ? d.acoes : [],
  };
}
