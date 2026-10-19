export const WA_AUTOMATION_TYPES = [
  "boas_vindas",
  "qualificacao",
  "agendamento",
  "follow_up",
  "recuperacao",
  "atendimento",
] as const;

export const WA_AUTOMATION_STATUSES = ["rascunho", "ativa", "pausada", "arquivada"] as const;

export const WA_AUTOMATION_TRIGGERS = [
  "conversation_created",
  "message_received",
  "conversation_assigned",
  "conversation_status_changed",
  "tag_applied",
  "lead_linked",
  "crm_stage_changed",
  "follow_up_due",
] as const;

export const WA_AUTOMATION_FIELDS = [
  "conversation.origin",
  "conversation.instance_id",
  "conversation.tag_ids",
  "conversation.status",
  "conversation.assigned_to",
  "lead.stage",
  "lead.id",
  "event.elapsed_minutes",
  "event.local_hour",
  "contact.eligible",
  "contact.consent",
] as const;

export const WA_AUTOMATION_OPERATORS = [
  "eq",
  "neq",
  "contains",
  "not_contains",
  "is_set",
  "is_empty",
  "gt",
  "lt",
] as const;

export const WA_AUTOMATION_ACTIONS = [
  "apply_tag",
  "remove_tag",
  "create_note",
  "assign_agent",
  "prepare_task",
  "set_conversation_status",
  "record_activity",
  "prepare_script",
  "request_human",
  "prepare_reply",
  "prepare_follow_up",
  "queue_authorized_message",
] as const;

export type WaAutomationType = (typeof WA_AUTOMATION_TYPES)[number];
export type WaAutomationStatus = (typeof WA_AUTOMATION_STATUSES)[number];
export type WaAutomationTrigger = (typeof WA_AUTOMATION_TRIGGERS)[number];
export type WaAutomationField = (typeof WA_AUTOMATION_FIELDS)[number];
export type WaAutomationOperator = (typeof WA_AUTOMATION_OPERATORS)[number];
export type WaAutomationActionType = (typeof WA_AUTOMATION_ACTIONS)[number];

export type WaAutomationCondition = {
  field: WaAutomationField;
  operator: WaAutomationOperator;
  value?: unknown;
};

export type WaAutomationAction = {
  type: WaAutomationActionType;
  config: Record<string, unknown>;
};

export type WaAutomationDefinition = {
  id?: string;
  name: string;
  description: string;
  type: WaAutomationType;
  status: WaAutomationStatus;
  version: number;
  trigger: { type: WaAutomationTrigger; config: Record<string, unknown> };
  conditions: WaAutomationCondition[];
  actions: WaAutomationAction[];
  config: Record<string, unknown>;
};

export type WaAutomationEvent = {
  id: string;
  orgId: string;
  source: "webhook" | "conversation" | "crm" | "scheduler" | "simulation";
  resource: "conversation" | "message" | "lead" | "follow_up";
  type: WaAutomationTrigger;
  occurredAt: string;
  conversationId?: string;
  leadId?: string;
  causationId?: string;
  depth: number;
  payload: Record<string, unknown>;
};

export type WaAutomationControls = {
  ruleEnabled: boolean;
  organizationEnabled: boolean;
  platformEnabled: boolean;
  dispatchEnabled: boolean;
};

export type WaAutomationPlan = {
  eligible: boolean;
  conditionResults: Array<WaAutomationCondition & { matched: boolean; reason: string }>;
  plannedActions: Array<WaAutomationAction & { blocked: boolean; reason?: string }>;
  blockers: string[];
  missingVariables: string[];
};

const STRING_FIELDS = new Set<WaAutomationField>([
  "conversation.origin",
  "conversation.instance_id",
  "conversation.status",
  "conversation.assigned_to",
  "lead.stage",
  "lead.id",
]);
const ARRAY_FIELDS = new Set<WaAutomationField>(["conversation.tag_ids"]);
const NUMBER_FIELDS = new Set<WaAutomationField>(["event.elapsed_minutes", "event.local_hour"]);
const BOOLEAN_FIELDS = new Set<WaAutomationField>(["contact.eligible", "contact.consent"]);
const SEND_ACTIONS = new Set<WaAutomationActionType>([
  "prepare_reply",
  "prepare_follow_up",
  "queue_authorized_message",
]);
const MAX_DEPTH = 5;
const MAX_ACTIONS = 20;

function hasValue<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && list.includes(value);
}

function getPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function operatorAllowed(field: WaAutomationField, operator: WaAutomationOperator): boolean {
  if (operator === "is_set" || operator === "is_empty") return true;
  if (NUMBER_FIELDS.has(field))
    return operator === "eq" || operator === "neq" || operator === "gt" || operator === "lt";
  if (BOOLEAN_FIELDS.has(field)) return operator === "eq" || operator === "neq";
  if (ARRAY_FIELDS.has(field))
    return (
      operator === "contains" ||
      operator === "not_contains" ||
      operator === "eq" ||
      operator === "neq"
    );
  return STRING_FIELDS.has(field) && ["eq", "neq", "contains", "not_contains"].includes(operator);
}

export function validateAutomationDefinition(input: unknown): string[] {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return ["definition must be an object"];
  const value = input as Partial<WaAutomationDefinition>;
  const errors: string[] = [];
  if (
    typeof value.name !== "string" ||
    value.name.trim().length < 3 ||
    value.name.trim().length > 120
  )
    errors.push("name must contain 3 to 120 characters");
  if (typeof value.description !== "string" || value.description.length > 500)
    errors.push("description must contain at most 500 characters");
  if (!hasValue(WA_AUTOMATION_TYPES, value.type)) errors.push("unsupported automation type");
  if (!hasValue(WA_AUTOMATION_STATUSES, value.status)) errors.push("unsupported automation status");
  if (!Number.isInteger(value.version) || Number(value.version) < 1)
    errors.push("version must be a positive integer");
  if (!value.trigger || !hasValue(WA_AUTOMATION_TRIGGERS, value.trigger.type))
    errors.push("unsupported trigger");
  if (!Array.isArray(value.conditions) || value.conditions.length > 20)
    errors.push("conditions must be an array with at most 20 entries");
  else
    value.conditions.forEach((condition, index) => {
      if (!hasValue(WA_AUTOMATION_FIELDS, condition?.field))
        errors.push(`conditions[${index}] has an unsupported field`);
      if (!hasValue(WA_AUTOMATION_OPERATORS, condition?.operator))
        errors.push(`conditions[${index}] has an unsupported operator`);
      if (
        hasValue(WA_AUTOMATION_FIELDS, condition?.field) &&
        hasValue(WA_AUTOMATION_OPERATORS, condition?.operator) &&
        !operatorAllowed(condition.field, condition.operator)
      )
        errors.push(`conditions[${index}] has an operator incompatible with its field`);
    });
  if (
    !Array.isArray(value.actions) ||
    value.actions.length < 1 ||
    value.actions.length > MAX_ACTIONS
  )
    errors.push(`actions must contain 1 to ${MAX_ACTIONS} entries`);
  else
    value.actions.forEach((action, index) => {
      if (!hasValue(WA_AUTOMATION_ACTIONS, action?.type))
        errors.push(`actions[${index}] has an unsupported type`);
      if (!action?.config || typeof action.config !== "object" || Array.isArray(action.config))
        errors.push(`actions[${index}] config must be an object`);
    });
  if (!value.config || typeof value.config !== "object" || Array.isArray(value.config))
    errors.push("config must be an object");
  return errors;
}

export function validateAutomationEvent(input: WaAutomationEvent): string[] {
  const errors: string[] = [];
  if (!input.id?.trim()) errors.push("event id is required");
  if (!input.orgId?.trim()) errors.push("event organization is required");
  if (!hasValue(WA_AUTOMATION_TRIGGERS, input.type)) errors.push("unsupported event type");
  if (!Number.isInteger(input.depth) || input.depth < 0)
    errors.push("event depth must be a non-negative integer");
  if (Number.isNaN(Date.parse(input.occurredAt))) errors.push("event timestamp is invalid");
  return errors;
}

function compare(actual: unknown, condition: WaAutomationCondition): boolean {
  if (condition.operator === "is_set")
    return actual !== undefined && actual !== null && actual !== "";
  if (condition.operator === "is_empty")
    return actual === undefined || actual === null || actual === "";
  if (condition.operator === "eq") return actual === condition.value;
  if (condition.operator === "neq") return actual !== condition.value;
  if (condition.operator === "gt")
    return (
      typeof actual === "number" && typeof condition.value === "number" && actual > condition.value
    );
  if (condition.operator === "lt")
    return (
      typeof actual === "number" && typeof condition.value === "number" && actual < condition.value
    );
  const values = Array.isArray(actual)
    ? actual
    : typeof actual === "string"
      ? actual.toLocaleLowerCase("pt-BR")
      : null;
  const expected =
    typeof condition.value === "string"
      ? condition.value.toLocaleLowerCase("pt-BR")
      : condition.value;
  const contains = Array.isArray(values)
    ? values.includes(condition.value)
    : typeof values === "string" && typeof expected === "string" && values.includes(expected);
  return condition.operator === "contains" ? contains : !contains;
}

export function extractScriptVariables(template: string): string[] {
  const variables = [...template.matchAll(/\{([a-zA-Z][a-zA-Z0-9_.]{0,63})\}/g)]
    .filter((match) => {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      return template[start - 1] !== "$" && template[start - 1] !== "{" && template[end] !== "}";
    })
    .map((match) => match[1]);
  return [...new Set(variables)];
}

export function planAutomation(input: {
  definition: WaAutomationDefinition;
  event: WaAutomationEvent;
  controls: WaAutomationControls;
}): WaAutomationPlan {
  const blockers: string[] = [];
  const definitionErrors = validateAutomationDefinition(input.definition);
  const eventErrors = validateAutomationEvent(input.event);
  blockers.push(...definitionErrors, ...eventErrors);
  if (input.definition.trigger.type !== input.event.type) blockers.push("trigger_not_matched");
  if (input.event.depth >= MAX_DEPTH) blockers.push("causality_depth_limit");
  const resourceVersion = getPath(input.event.payload, "event.resource_version");
  const currentResourceVersion = getPath(input.event.payload, "event.current_resource_version");
  if (
    typeof resourceVersion === "number" &&
    typeof currentResourceVersion === "number" &&
    resourceVersion < currentResourceVersion
  )
    blockers.push("stale_event");
  if (!input.controls.ruleEnabled) blockers.push("rule_disabled");
  if (!input.controls.organizationEnabled) blockers.push("organization_engine_disabled");
  if (!input.controls.platformEnabled) blockers.push("platform_engine_disabled");

  const conditionResults = input.definition.conditions.map((condition) => {
    const matched = compare(getPath(input.event.payload, condition.field), condition);
    return { ...condition, matched, reason: matched ? "matched" : "condition_not_matched" };
  });
  if (conditionResults.some((condition) => !condition.matched))
    blockers.push("conditions_not_matched");

  const variables = (input.event.payload.variables ?? {}) as Record<string, unknown>;
  const missingVariables = new Set<string>();
  input.definition.actions.forEach((action) => {
    const script =
      typeof action.config.script_snapshot === "string" ? action.config.script_snapshot : "";
    extractScriptVariables(script).forEach((variable) => {
      if (
        variables[variable] === undefined ||
        variables[variable] === null ||
        variables[variable] === ""
      )
        missingVariables.add(variable);
    });
  });
  if (
    !input.controls.dispatchEnabled &&
    input.definition.actions.some((action) => action.type === "queue_authorized_message")
  )
    blockers.push("dispatch_disabled");
  if (missingVariables.size > 0) blockers.push("missing_script_variables");

  const plannedActions = input.definition.actions.map((action) => {
    if (SEND_ACTIONS.has(action.type))
      return { ...action, blocked: true, reason: "automatic_whatsapp_transport_disabled" };
    return {
      ...action,
      blocked: blockers.length > 0,
      reason: blockers.length > 0 ? "automation_execution_blocked" : undefined,
    };
  });

  return {
    eligible: blockers.length === 0 && plannedActions.every((action) => !action.blocked),
    conditionResults,
    plannedActions,
    blockers: [...new Set(blockers)],
    missingVariables: [...missingVariables],
  };
}

export function automationRunKey(automationId: string, version: number, eventId: string): string {
  return `${automationId}:${version}:${eventId}`;
}
