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
  readonly status: 401 | 403 | 404 | 409 | 422;

  constructor(status: 401 | 403 | 404 | 409 | 422, message: string) {
    super(message);
    this.name = "WhatsappAuthorizationError";
    this.status = status;
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
  // As verificações são independentes: disparam juntas (antes eram 5 viagens em sequência) e as
  // recusas continuam avaliadas na MESMA ordem de antes (acesso, organização, vínculo, papel).
  const acessoPromise = acessoFerramentaLiberado(input.userClient, userId);

  const orgId = normalizeOrganizationId(input.requestedOrgId);
  if (!orgId) {
    if (!(await acessoPromise)) throw new WhatsappAuthorizationError(403, "Acesso não autorizado.");
    throw new WhatsappAuthorizationError(422, "Selecione uma organização ativa.");
  }

  const [acessoLiberado, { data: organization }, { data: profile }, { data: membership }, papeis] =
    await Promise.all([
      acessoPromise,
      input.admin.from("orgs").select("id").eq("id", orgId).maybeSingle(),
      input.admin.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
      input.admin
        .from("memberships")
        .select("papel")
        .eq("org_id", orgId)
        .eq("user_id", userId)
        .maybeSingle(),
      input.admin.from("org_papeis").select("papel,ativo").eq("org_id", orgId),
    ]);
  if (!acessoLiberado) {
    throw new WhatsappAuthorizationError(403, "Acesso não autorizado.");
  }
  if (!organization) {
    throw new WhatsappAuthorizationError(404, "Organização não encontrada.");
  }

  const isSuperAdmin = profile?.is_super_admin === true;
  let role = "super_admin";
  if (!isSuperAdmin) {
    if (!membership) {
      throw new WhatsappAuthorizationError(403, "Sem acesso à organização selecionada.");
    }
    const configuredRole = (papeis.data ?? []).find(
      (item: { papel: string; ativo: boolean | null }) => item.papel === membership.papel,
    );
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
