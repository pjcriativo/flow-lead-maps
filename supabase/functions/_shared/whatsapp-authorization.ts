import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { acessoFerramentaLiberado } from "./acesso.ts";
import {
  canUseWhatsapp,
  normalizeOrganizationId,
  type WhatsappPermission,
} from "./whatsapp-policy.ts";

export type AuthorizedWhatsappContext = {
  userId: string;
  orgId: string;
  role: string;
  isSuperAdmin: boolean;
};

export class WhatsappAuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404 | 409 | 422,
    message: string,
  ) {
    super(message);
    this.name = "WhatsappAuthorizationError";
  }
}

export async function authorizeWhatsappRequest(input: {
  admin: SupabaseClient;
  userClient: SupabaseClient;
  requestedOrgId: unknown;
  permission: WhatsappPermission;
}): Promise<AuthorizedWhatsappContext> {
  const { data: userData, error: userError } = await input.userClient.auth.getUser();
  if (userError || !userData.user) {
    throw new WhatsappAuthorizationError(401, "Não autenticado.");
  }

  const userId = userData.user.id;
  if (!(await acessoFerramentaLiberado(input.userClient, userId))) {
    throw new WhatsappAuthorizationError(403, "Acesso não autorizado.");
  }

  const orgId = normalizeOrganizationId(input.requestedOrgId);
  if (!orgId) {
    throw new WhatsappAuthorizationError(422, "Selecione uma organização ativa.");
  }

  const [{ data: organization }, { data: profile }] = await Promise.all([
    input.admin.from("orgs").select("id").eq("id", orgId).maybeSingle(),
    input.admin.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
  ]);
  if (!organization) {
    throw new WhatsappAuthorizationError(404, "Organização não encontrada.");
  }

  const isSuperAdmin = profile?.is_super_admin === true;
  let role = "super_admin";
  if (!isSuperAdmin) {
    const { data: membership } = await input.admin
      .from("memberships")
      .select("papel")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) {
      throw new WhatsappAuthorizationError(403, "Sem acesso à organização selecionada.");
    }
    const { data: configuredRole } = await input.admin
      .from("org_papeis")
      .select("ativo")
      .eq("org_id", orgId)
      .eq("papel", membership.papel)
      .maybeSingle();
    if (configuredRole?.ativo === false) {
      throw new WhatsappAuthorizationError(403, "Papel desativado nesta organização.");
    }
    role = membership.papel;
  }

  if (!canUseWhatsapp(role, input.permission)) {
    throw new WhatsappAuthorizationError(403, "Sem permissão para esta operação.");
  }
  return { userId, orgId, role, isSuperAdmin };
}

export function whatsappAuthorizationFailure(error: unknown): { status: number; message: string } {
  if (error instanceof WhatsappAuthorizationError) {
    return { status: error.status, message: error.message };
  }
  console.error(
    "whatsapp authorization failed",
    error instanceof Error ? error.message : "unknown",
  );
  return { status: 403, message: "Operação não autorizada." };
}
