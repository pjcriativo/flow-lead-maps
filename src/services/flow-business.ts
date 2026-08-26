import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { z } from "zod";

export type FlowBusinessStage =
  | "novo"
  | "analisando"
  | "aquecendo"
  | "pronto_abordar"
  | "abordado"
  | "respondeu"
  | "qualificado"
  | "proposta"
  | "cliente"
  | "perdido";

export type FlowBusinessAction =
  | "analyze"
  | "visit_profile"
  | "follow"
  | "like"
  | "comment"
  | "send_dm"
  | "follow_up"
  | "review"
  | "custom";

export type FlowBusinessPlan = {
  limits: {
    accounts: number | null;
    crmContacts: number | null;
    cadences: number | null;
    flows: number | null;
  };
  used: { accounts: number; crmContacts: number; cadences: number; flows: number };
  features: { officialAccounts: boolean; automations: boolean; teamAssignment: boolean };
};

export type FlowBusinessCard = {
  id: string;
  leadId: string;
  stage: FlowBusinessStage;
  temperature: "frio" | "morno" | "quente";
  tags: string[];
  summary: string | null;
  source: string | null;
  nextActionType: FlowBusinessAction | null;
  nextActionAt: string | null;
  updatedAt: string;
  businessName: string;
  category: string | null;
  city: string | null;
  state: string | null;
  score: number | null;
  instagramUrl: string | null;
  username: string | null;
  fullName: string | null;
  profilePictureUrl: string | null;
  followersCount: number | null;
};

export type FlowBusinessTask = {
  id: string;
  cardId: string;
  actionType: FlowBusinessAction;
  title: string;
  instructions: string | null;
  dueAt: string;
  status: "pending";
  outcome: string | null;
  businessName: string;
  instagramUrl: string | null;
  username: string | null;
};

export type FlowBusinessCadenceStep = {
  id: string;
  position: number;
  dayOffset: number;
  actionType: FlowBusinessAction;
  title: string;
  instructions: string | null;
  isManual: boolean;
};

export type FlowBusinessCadence = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  steps: FlowBusinessCadenceStep[];
};

export type FlowBusinessAccount = {
  id: string;
  name: string;
  username: string | null;
  provider: "meta_official" | "unipile" | "session_worker" | "evolution_legacy";
  status: string;
  accountType: string | null;
  profilePictureUrl: string | null;
  permissions: string[];
  connectedAt: string | null;
  lastWebhookAt: string | null;
  errorMessage: string | null;
};

export type FlowNodeSubtype =
  | "send_message"
  | "send_media"
  | "quick_replies"
  | "add_tag"
  | "remove_tag"
  | "move_crm"
  | "assign_user"
  | "create_task"
  | "notify_team"
  | "webhook"
  | "condition"
  | "wait";

export type FlowBusinessNode = {
  id?: string;
  nodeType: "action" | "condition" | "wait";
  subtype: FlowNodeSubtype;
  label: string;
  config: Record<string, Json | undefined>;
  positionX: number;
  positionY: number;
};

export type FlowBusinessFlow = {
  id: string;
  accountId: string | null;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, Json | undefined>;
  status: "draft" | "active" | "paused";
  version: number;
  publishedAt: string | null;
  updatedAt: string;
  nodes: Array<FlowBusinessNode & { id: string }>;
};

export type FlowBusinessWorkspace = {
  plan: FlowBusinessPlan;
  cards: FlowBusinessCard[];
  tasks: FlowBusinessTask[];
  cadences: FlowBusinessCadence[];
  accounts: FlowBusinessAccount[];
  flows: FlowBusinessFlow[];
};

export type FlowBusinessFlowDraft = {
  id?: string;
  name: string;
  description: string;
  accountId: string | null;
  triggerType: "comment_keyword";
  keyword: string;
  nodes: FlowBusinessNode[];
};

export type FlowBusinessAutomationAccount = {
  instanceId: string;
  enabled: boolean;
  lastPolledAt: string | null;
  lastSuccessAt: string | null;
  nextPollAt: string | null;
  consecutiveFailures: number;
  pausedReason: string | null;
};

export type FlowBusinessAutomationEvent = {
  id: string;
  username: string;
  commentText: string;
  matchedKeyword: string | null;
  status: "received" | "unmatched" | "queued" | "processed" | "failed" | "skipped";
  errorCode: string | null;
  createdAt: string;
};

export type FlowBusinessAutomationSnapshot = {
  limits: { monthly: number | null; daily: number | null; monitorMinutes: number };
  usage: { monthly: number; daily: number; queued: number };
  accounts: FlowBusinessAutomationAccount[];
  recentEvents: FlowBusinessAutomationEvent[];
};

const flowBusinessActionSchema = z.enum([
  "analyze",
  "visit_profile",
  "follow",
  "like",
  "comment",
  "send_dm",
  "follow_up",
  "review",
  "custom",
]);

const flowBusinessStageSchema = z.enum([
  "novo",
  "analisando",
  "aquecendo",
  "pronto_abordar",
  "abordado",
  "respondeu",
  "qualificado",
  "proposta",
  "cliente",
  "perdido",
]);

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ]),
);

const flowBusinessNodeSchema = z
  .object({
    id: z.string().uuid(),
    nodeType: z.enum(["action", "condition", "wait"]),
    subtype: z.enum([
      "send_message",
      "send_media",
      "quick_replies",
      "add_tag",
      "remove_tag",
      "move_crm",
      "assign_user",
      "create_task",
      "notify_team",
      "webhook",
      "condition",
      "wait",
    ]),
    label: z.string(),
    config: z.record(jsonSchema.optional()),
    positionX: z.number().int(),
    positionY: z.number().int(),
  })
  .strict();

const workspaceSchema: z.ZodType<FlowBusinessWorkspace> = z
  .object({
    plan: z
      .object({
        limits: z
          .object({
            accounts: z.number().int().nonnegative().nullable(),
            crmContacts: z.number().int().nonnegative().nullable(),
            cadences: z.number().int().nonnegative().nullable(),
            flows: z.number().int().nonnegative().nullable(),
          })
          .strict(),
        used: z
          .object({
            accounts: z.number().int().nonnegative(),
            crmContacts: z.number().int().nonnegative(),
            cadences: z.number().int().nonnegative(),
            flows: z.number().int().nonnegative(),
          })
          .strict(),
        features: z
          .object({
            officialAccounts: z.boolean(),
            automations: z.boolean(),
            teamAssignment: z.boolean(),
          })
          .strict(),
      })
      .strict(),
    cards: z.array(
      z
        .object({
          id: z.string().uuid(),
          leadId: z.string().uuid(),
          stage: flowBusinessStageSchema,
          temperature: z.enum(["frio", "morno", "quente"]),
          tags: z.array(z.string()),
          summary: z.string().nullable(),
          source: z.string().nullable(),
          nextActionType: flowBusinessActionSchema.nullable(),
          nextActionAt: z.string().nullable(),
          updatedAt: z.string(),
          businessName: z.string(),
          category: z.string().nullable(),
          city: z.string().nullable(),
          state: z.string().nullable(),
          score: z.number().nullable(),
          instagramUrl: z.string().nullable(),
          username: z.string().nullable(),
          fullName: z.string().nullable(),
          profilePictureUrl: z.string().nullable(),
          followersCount: z.number().nullable(),
        })
        .strict(),
    ),
    tasks: z.array(
      z
        .object({
          id: z.string().uuid(),
          cardId: z.string().uuid(),
          actionType: flowBusinessActionSchema,
          title: z.string(),
          instructions: z.string().nullable(),
          dueAt: z.string(),
          status: z.literal("pending"),
          outcome: z.string().nullable(),
          businessName: z.string(),
          instagramUrl: z.string().nullable(),
          username: z.string().nullable(),
        })
        .strict(),
    ),
    cadences: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          description: z.string().nullable(),
          isActive: z.boolean(),
          isSystem: z.boolean(),
          steps: z.array(
            z
              .object({
                id: z.string().uuid(),
                position: z.number().int().positive(),
                dayOffset: z.number().int().nonnegative(),
                actionType: flowBusinessActionSchema,
                title: z.string(),
                instructions: z.string().nullable(),
                isManual: z.boolean(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    accounts: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          username: z.string().nullable(),
          provider: z.enum(["meta_official", "unipile", "session_worker", "evolution_legacy"]),
          status: z.string(),
          accountType: z.string().nullable(),
          profilePictureUrl: z.string().nullable(),
          permissions: z.array(z.string()),
          connectedAt: z.string().nullable(),
          lastWebhookAt: z.string().nullable(),
          errorMessage: z.string().nullable(),
        })
        .strict(),
    ),
    flows: z.array(
      z
        .object({
          id: z.string().uuid(),
          accountId: z.string().uuid().nullable(),
          name: z.string(),
          description: z.string().nullable(),
          triggerType: z.string(),
          triggerConfig: z.record(jsonSchema.optional()),
          status: z.enum(["draft", "active", "paused"]),
          version: z.number().int().positive(),
          publishedAt: z.string().nullable(),
          updatedAt: z.string(),
          nodes: z.array(flowBusinessNodeSchema),
        })
        .strict(),
    ),
  })
  .strict();

const automationSnapshotSchema: z.ZodType<FlowBusinessAutomationSnapshot> = z
  .object({
    limits: z
      .object({
        monthly: z.number().int().nonnegative().nullable(),
        daily: z.number().int().nonnegative().nullable(),
        monitorMinutes: z.number().int().positive(),
      })
      .strict(),
    usage: z
      .object({
        monthly: z.number().int().nonnegative(),
        daily: z.number().int().nonnegative(),
        queued: z.number().int().nonnegative(),
      })
      .strict(),
    accounts: z.array(
      z
        .object({
          instanceId: z.string().uuid(),
          enabled: z.boolean(),
          lastPolledAt: z.string().nullable(),
          lastSuccessAt: z.string().nullable(),
          nextPollAt: z.string().nullable(),
          consecutiveFailures: z.number().int().nonnegative(),
          pausedReason: z.string().nullable(),
        })
        .strict(),
    ),
    recentEvents: z.array(
      z
        .object({
          id: z.string().uuid(),
          username: z.string(),
          commentText: z.string(),
          matchedKeyword: z.string().nullable(),
          status: z.enum(["received", "unmatched", "queued", "processed", "failed", "skipped"]),
          errorCode: z.string().nullable(),
          createdAt: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function workspaceFromJson(value: Json | null): FlowBusinessWorkspace {
  const parsed = workspaceSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw new Error(`Resposta inválida do Flow Business: ${parsed.error.issues[0]?.message}`);
}

function friendlyError(message: string): Error {
  if (message.includes("unauthorized"))
    return new Error("Sua sessão expirou. Entre novamente para continuar.");
  if (message.includes("invalid_message"))
    return new Error("Revise o texto da mensagem antes de enviar.");
  if (message.includes("conversation_not_found"))
    return new Error("Esta conversa não está mais disponível.");
  if (message.includes("UNIPILE") || message.includes("unipile"))
    return new Error("A conexão do Instagram ainda não foi ativada pelo administrador.");
  if (message.includes("instagram_connection_unavailable"))
    return new Error("A conexão do Instagram ainda não foi ativada pelo administrador.");
  if (message.includes("instagram_connection_failed"))
    return new Error("Não foi possível conectar a conta do Instagram. Tente novamente.");
  if (message.includes("invalid_credentials"))
    return new Error("Usuário ou senha inválidos. Revise os dados e tente novamente.");
  if (message.includes("challenge_required"))
    return new Error("Confirme a tentativa no aplicativo do Instagram e tente novamente.");
  if (message.includes("instagram_message_failed"))
    return new Error("Não foi possível enviar a mensagem. Tente novamente.");
  if (message.includes("alternative_account_required"))
    return new Error("Reconecte esta conta do Instagram antes de enviar mensagens.");
  if (message.includes("flow_business_limit"))
    return new Error("O limite deste recurso no seu plano foi atingido.");
  if (message.includes("official_account_required"))
    return new Error("Este recurso ainda não está disponível para a conta conectada.");
  if (message.includes("outbound_requires_customer_entry_point"))
    return new Error("Mensagens automáticas exigem que o contato tenha iniciado a interação.");
  if (message.includes("flow_not_available_on_plan"))
    return new Error("O Flow Builder não está disponível no seu plano atual.");
  if (message.includes("comment_keyword_required"))
    return new Error("Informe a palavra-chave que ativará o fluxo de comentários.");
  if (message.includes("comment_flow_allows_one_private_reply"))
    return new Error("Fluxos de comentário permitem uma única resposta privada inicial.");
  if (message.includes("flow_message_empty"))
    return new Error("Preencha o texto de todas as mensagens antes de publicar.");
  if (message.includes("connected_account_required"))
    return new Error("Conecte e selecione uma conta antes de publicar o fluxo.");
  if (message.includes("session_account_required"))
    return new Error("Selecione uma conta conectada nesta área para publicar o fluxo.");
  if (message.includes("active_comment_flow_required"))
    return new Error("Publique ao menos um fluxo de comentário antes de ativar o monitoramento.");
  if (message.includes("comment_trigger_required"))
    return new Error("Este monitor aceita apenas fluxos por palavra-chave em comentário.");
  if (message.includes("trigger_not_available"))
    return new Error("Este gatilho ainda não está disponível para a conta conectada.");
  if (message.includes("comment_flow_requires_one_message"))
    return new Error("O fluxo precisa ter exatamente uma mensagem privada.");
  if (message.includes("task_already_closed")) return new Error("Esta tarefa já foi concluída.");
  return new Error(message);
}

function raiseIfError(error: { message: string } | null) {
  if (error) throw friendlyError(error.message);
}

export async function loadFlowBusinessWorkspace(): Promise<FlowBusinessWorkspace> {
  const { data, error } = await supabase.rpc("flow_business_workspace_snapshot", {
    p_card_limit: 500,
  });
  raiseIfError(error);
  return workspaceFromJson(data);
}

export async function loadFlowBusinessAutomationSnapshot(): Promise<FlowBusinessAutomationSnapshot> {
  const { data, error } = await supabase.rpc("flow_business_automation_snapshot");
  raiseIfError(error);
  const parsed = automationSnapshotSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error(
    `Resposta inválida do monitor do Instagram: ${parsed.error.issues[0]?.message ?? "formato desconhecido"}`,
  );
}

export async function setFlowBusinessSessionAutomation(instanceId: string, enabled: boolean) {
  const { error } = await supabase.rpc("flow_business_set_session_automation", {
    p_instance_id: instanceId,
    p_enabled: enabled,
  });
  raiseIfError(error);
}

export async function addLeadToFlowBusiness(leadId: string): Promise<string> {
  const { data, error } = await supabase.rpc("flow_business_add_lead_to_crm", {
    p_lead_id: leadId,
  });
  raiseIfError(error);
  if (!data) throw new Error("Não foi possível adicionar o lead ao CRM.");
  return data;
}

export async function startFlowBusinessCadence(cardId: string, cadenceId: string) {
  const { error } = await supabase.rpc("flow_business_start_cadence", {
    p_card_id: cardId,
    p_cadence_id: cadenceId,
  });
  raiseIfError(error);
}

export async function completeFlowBusinessTask(taskId: string, outcome?: string) {
  const normalizedOutcome = outcome?.trim();
  const { error } = await supabase.rpc("flow_business_complete_task", {
    p_task_id: taskId,
    ...(normalizedOutcome ? { p_outcome: normalizedOutcome } : {}),
  });
  raiseIfError(error);
}

export async function moveFlowBusinessCard(
  cardId: string,
  stage: FlowBusinessStage,
  reason?: string,
) {
  const normalizedReason = reason?.trim();
  const { error } = await supabase.rpc("flow_business_move_card", {
    p_card_id: cardId,
    p_stage: stage,
    ...(normalizedReason ? { p_reason: normalizedReason } : {}),
  });
  raiseIfError(error);
}

export async function createFlowBusinessCadence(input: {
  name: string;
  description: string;
  steps: Array<{
    position: number;
    dayOffset: number;
    actionType: FlowBusinessAction;
    title: string;
    instructions: string;
  }>;
}) {
  const { data, error } = await supabase.rpc("flow_business_create_cadence", {
    p_name: input.name,
    p_description: input.description,
    p_steps: input.steps as Json,
  });
  raiseIfError(error);
  return data;
}

export async function saveFlowBusinessFlow(input: {
  id?: string;
  name: string;
  description: string;
  accountId: string | null;
  triggerType: string;
  triggerConfig: Record<string, Json | undefined>;
  nodes: FlowBusinessNode[];
}) {
  const { data, error } = await supabase.rpc("flow_business_save_flow_draft", {
    p_flow_id: input.id ?? "",
    p_name: input.name,
    p_description: input.description,
    p_account_id: input.accountId ?? "",
    p_trigger_type: input.triggerType,
    p_trigger_config: input.triggerConfig,
    p_nodes: input.nodes as Json,
  });
  raiseIfError(error);
  if (!data) throw new Error("Não foi possível salvar o fluxo.");
  return data;
}

export async function publishFlowBusinessFlow(flowId: string) {
  const { error } = await supabase.rpc("flow_business_publish_flow", { p_flow_id: flowId });
  raiseIfError(error);
}

export async function startAlternativeInstagramConnection(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("flow-business-unipile", {
    body: { action: "start" },
  });
  if (error) {
    const details =
      error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    throw friendlyError(details || error.message);
  }
  if (!isRecord(data) || typeof data.authorizationUrl !== "string")
    throw new Error("A conexão do Instagram ainda não foi configurada.");
  return data.authorizationUrl;
}

export async function connectInstagramSession(input: {
  username: string;
  password: string;
  verificationCode?: string;
}): Promise<{ connected: boolean; needsTwoFactor: boolean; needsApproval: boolean }> {
  const { data, error } = await supabase.functions.invoke("flow-business-session", {
    body: {
      action: "connect",
      username: input.username,
      password: input.password,
      verificationCode: input.verificationCode ?? "",
    },
  });
  if (error) {
    const details =
      error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    throw friendlyError(details || error.message);
  }
  if (!isRecord(data)) throw new Error("Resposta inválida ao conectar o Instagram.");
  return {
    connected: data.connected === true,
    needsTwoFactor: data.needsTwoFactor === true,
    needsApproval: data.needsApproval === true,
  };
}

export async function sendInstagramConversationMessage(input: {
  provider: FlowBusinessAccount["provider"];
  conversationId: string;
  text: string;
}): Promise<void> {
  const modernConnection = input.provider === "meta_official" || input.provider === "unipile";
  const functionName =
    input.provider === "meta_official"
      ? "flow-business-meta"
      : input.provider === "unipile"
        ? "flow-business-unipile"
        : "ig-send";
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: modernConnection
      ? { action: "send", conversationId: input.conversationId, text: input.text }
      : { conversaId: input.conversationId, text: input.text },
  });
  if (error) {
    const details =
      error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    throw friendlyError(details || error.message);
  }
  if (isRecord(data) && typeof data.error === "string") throw friendlyError(data.error);
}
