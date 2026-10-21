// Executor de automações WhatsApp — partes PURAS (sem I/O), compartilhadas entre o runner e a
// simulação. O runner (wa-automation-runner) lê eventos capturados das conversas, monta o
// payload real com estes helpers, planeja com planAutomation e traduz cada ação para um
// comando sobre o CRM existente (wa_conversation_action) — nunca para envio de WhatsApp.
import type { WaAutomationAction, WaAutomationDefinition } from "./whatsapp-automation.ts";

export function definitionFromRow(row: Record<string, unknown>): WaAutomationDefinition {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    type: row.automation_type as WaAutomationDefinition["type"],
    status: row.status as WaAutomationDefinition["status"],
    version: Number(row.version),
    trigger: row.trigger as WaAutomationDefinition["trigger"],
    conditions: row.conditions as WaAutomationDefinition["conditions"],
    actions: row.actions as WaAutomationDefinition["actions"],
    config: row.config as Record<string, unknown>,
  };
}

export type ContextoConversa = {
  origin: string | null;
  instancia_id: string | null;
  status: string | null;
  assigned_to: string | null;
  contact_name: string | null;
  normalized_phone: string | null;
  tag_ids: string[];
};

export type ContextoLead = {
  id: string;
  status: string | null;
  business_name: string | null;
  whatsapp_opt_in: boolean | null;
  whatsapp_opt_in_at: string | null;
  whatsapp_opt_out: boolean | null;
};

function horaLocal(instante: Date, timezone: string): number {
  try {
    const hora = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: timezone,
    }).format(instante);
    return Number(hora);
  } catch {
    return instante.getUTCHours();
  }
}

/** Payload avaliado pelas condições (mesmos campos de WA_AUTOMATION_FIELDS). */
export function montarPayloadAutomacao(input: {
  conversa: ContextoConversa | null;
  lead: ContextoLead | null;
  ocorridoEm: string;
  agora?: Date;
  timezone?: string;
}): Record<string, unknown> {
  const agora = input.agora ?? new Date();
  const ocorrido = Date.parse(input.ocorridoEm);
  const consentimento = Boolean(
    input.lead?.whatsapp_opt_in && input.lead.whatsapp_opt_in_at && !input.lead.whatsapp_opt_out,
  );
  const primeiroNome =
    (input.conversa?.contact_name ?? input.lead?.business_name ?? "").trim().split(/\s+/)[0] ||
    null;
  return {
    conversation: input.conversa
      ? {
          origin: input.conversa.origin,
          instance_id: input.conversa.instancia_id,
          tag_ids: input.conversa.tag_ids,
          status: input.conversa.status,
          assigned_to: input.conversa.assigned_to,
        }
      : {},
    lead: input.lead ? { id: input.lead.id, stage: input.lead.status } : {},
    event: {
      elapsed_minutes: Number.isFinite(ocorrido)
        ? Math.max(0, Math.floor((agora.getTime() - ocorrido) / 60_000))
        : 0,
      local_hour: horaLocal(agora, input.timezone ?? "America/Sao_Paulo"),
    },
    contact: {
      consent: consentimento,
      eligible: consentimento && Boolean(input.conversa?.normalized_phone),
    },
    variables: {
      nome: primeiroNome,
      empresa: input.lead?.business_name ?? null,
      telefone: input.conversa?.normalized_phone ?? null,
    },
  };
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Substitui {variavel} pelos valores do payload (variáveis ausentes já bloqueiam no planner). */
export function renderizarScript(template: string, variaveis: Record<string, unknown>): string {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_.]{0,63})\}/g, (match, nome: string) => {
    const valor = variaveis[nome];
    return valor === undefined || valor === null || valor === "" ? match : String(valor);
  });
}

export type ComandoAutomacao =
  | { tipo: "conversa"; acao: string; valor: Record<string, unknown> }
  | { tipo: "atividade"; detalhes: Record<string, unknown> }
  | { tipo: "follow_up"; atrasoMinutos: number }
  | { tipo: "bloqueado"; motivo: string };

/**
 * Traduz uma ação planejada em comandos sobre o CRM existente. Nenhuma ação vira envio de
 * WhatsApp: as ações de "preparar" resposta/script/tarefa ficam registradas como nota interna
 * para o atendente revisar e enviar manualmente.
 */
export function comandosDaAcao(
  action: WaAutomationAction,
  variaveis: Record<string, unknown>,
): ComandoAutomacao[] {
  const config = action.config ?? {};
  const nota = (prefixo: string, corpo: string): ComandoAutomacao[] =>
    corpo
      ? [
          {
            tipo: "conversa",
            acao: "add_note",
            valor: { body: `[Automação] ${prefixo}: ${corpo}`.slice(0, 4000) },
          },
        ]
      : [{ tipo: "bloqueado", motivo: "conteudo_ausente" }];
  const conteudo = renderizarScript(
    texto(config.script_snapshot) ||
      texto(config.message) ||
      texto(config.text) ||
      texto(config.body),
    variaveis,
  );
  switch (action.type) {
    case "apply_tag": {
      const nome = texto(config.name) || texto(config.tag_name);
      if (!nome) return [{ tipo: "bloqueado", motivo: "etiqueta_ausente" }];
      const cor = texto(config.color);
      return [
        {
          tipo: "conversa",
          acao: "add_tag",
          valor: cor ? { name: nome, color: cor } : { name: nome },
        },
      ];
    }
    case "remove_tag": {
      const id = texto(config.tag_id);
      const nome = texto(config.name) || texto(config.tag_name);
      if (!id && !nome) return [{ tipo: "bloqueado", motivo: "etiqueta_ausente" }];
      return [
        { tipo: "conversa", acao: "remove_tag", valor: id ? { tag_id: id } : { name: nome } },
      ];
    }
    case "create_note":
      return nota("Nota", conteudo);
    case "assign_agent": {
      const usuario = texto(config.user_id);
      if (!usuario) return [{ tipo: "bloqueado", motivo: "responsavel_ausente" }];
      return [{ tipo: "conversa", acao: "transfer", valor: { user_id: usuario } }];
    }
    case "set_conversation_status": {
      const status = texto(config.status);
      if (!status) return [{ tipo: "bloqueado", motivo: "status_ausente" }];
      return [{ tipo: "conversa", acao: "set_status", valor: { status } }];
    }
    case "request_human":
      return [
        { tipo: "conversa", acao: "set_status", valor: { status: "waiting_agent" } },
        {
          tipo: "conversa",
          acao: "add_note",
          valor: {
            body: `[Automação] Atendimento humano solicitado.${conteudo ? ` ${conteudo}` : ""}`.slice(
              0,
              4000,
            ),
          },
        },
      ];
    case "record_activity":
      return [{ tipo: "atividade", detalhes: { descricao: conteudo || action.type } }];
    case "prepare_script":
      return nota("Script sugerido", conteudo);
    case "prepare_reply":
      return nota("Resposta sugerida (enviar manualmente)", conteudo);
    case "prepare_task":
      return nota("Tarefa", conteudo || texto(config.title));
    case "prepare_follow_up": {
      const atraso = Number(config.delay_minutes ?? config.delayMinutes ?? 1440);
      if (!Number.isFinite(atraso) || atraso < 1 || atraso > 60 * 24 * 60)
        return [{ tipo: "bloqueado", motivo: "atraso_invalido" }];
      return [{ tipo: "follow_up", atrasoMinutos: Math.round(atraso) }];
    }
    case "queue_authorized_message":
    default:
      return [{ tipo: "bloqueado", motivo: "automatic_whatsapp_transport_disabled" }];
  }
}
