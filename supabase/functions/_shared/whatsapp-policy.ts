export type WhatsappPermission =
  | "view_dashboard"
  | "view_conversations"
  | "reply_conversations"
  | "manage_numbers"
  | "manage_campaigns"
  | "send_campaign"
  | "use_scripts"
  | "manage_scripts"
  | "manage_automations"
  | "view_reports";

const ADMINISTRATIVE_PERMISSIONS = new Set<WhatsappPermission>([
  "view_dashboard",
  "view_conversations",
  "reply_conversations",
  "manage_numbers",
  "manage_campaigns",
  "use_scripts",
  "manage_scripts",
  "manage_automations",
  "view_reports",
]);

const OPERATIONAL_PERMISSIONS = new Set<WhatsappPermission>([
  "view_dashboard",
  "view_conversations",
  "reply_conversations",
  "use_scripts",
  "view_reports",
]);

export function normalizeOrganizationId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

export function canUseWhatsapp(role: string | null, permission: WhatsappPermission): boolean {
  if (permission === "send_campaign") return false;
  if (role === "super_admin" || role === "admin" || role === "gerente") {
    return ADMINISTRATIVE_PERMISSIONS.has(permission);
  }
  if (role === "vendedor" || role === "sdr" || role === "suporte") {
    return OPERATIONAL_PERMISSIONS.has(permission);
  }
  return false;
}

export function isResourceInOrganization(
  resourceOrgId: string | null | undefined,
  authorizedOrgId: string,
): boolean {
  return typeof resourceOrgId === "string" && resourceOrgId === authorizedOrgId;
}

export function isAssignedConversationAllowed(input: {
  role: string;
  userId: string;
  assignedTo: string | null;
  leadId: string | null;
}): boolean {
  if (
    input.role === "super_admin" ||
    input.role === "admin" ||
    input.role === "gerente" ||
    input.role === "suporte"
  ) {
    return true;
  }
  if (input.role !== "vendedor" && input.role !== "sdr") return false;
  return Boolean(input.leadId && input.assignedTo === input.userId);
}
