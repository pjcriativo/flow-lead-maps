import { supabase } from "@/integrations/supabase/client";
import { resolveActiveMembership } from "@/lib/active-organization-selection";

export type ActiveOrganizationContext = {
  userId: string;
  orgId: string;
  role: string;
  isSuperAdmin: boolean;
};

const storageKey = (userId: string) => `flow.activeOrganization.${userId}`;

export async function setActiveOrganizationId(orgId: string): Promise<void> {
  const context = await getActiveOrganizationContext(orgId);
  sessionStorage.setItem(storageKey(context.userId), context.orgId);
  window.dispatchEvent(
    new CustomEvent("flow:active-organization-changed", { detail: context.orgId }),
  );
}

export async function getActiveOrganizationContext(
  requestedOrgId?: string,
): Promise<ActiveOrganizationContext> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Usuário não autenticado.");

  const [{ data: memberships, error: membershipError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase.from("memberships").select("org_id, papel").eq("user_id", auth.user.id),
      supabase.from("profiles").select("is_super_admin").eq("id", auth.user.id).maybeSingle(),
    ]);
  if (membershipError) throw membershipError;
  if (profileError) throw profileError;

  const isSuperAdmin = profile?.is_super_admin === true;
  const storedOrgId =
    typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(storageKey(auth.user.id));
  const selectedOrgId = requestedOrgId ?? storedOrgId;

  if (!selectedOrgId && memberships?.length === 1) {
    const onlyMembership = resolveActiveMembership(memberships, null);
    return {
      userId: auth.user.id,
      orgId: onlyMembership.org_id,
      role: onlyMembership.papel,
      isSuperAdmin,
    };
  }
  if (!selectedOrgId) {
    throw new Error("Selecione uma organização ativa antes de continuar.");
  }

  const membership = memberships?.find((item) => item.org_id === selectedOrgId);
  if (membership) {
    return {
      userId: auth.user.id,
      orgId: membership.org_id,
      role: membership.papel,
      isSuperAdmin,
    };
  }
  if (isSuperAdmin) {
    const { data: organization, error } = await supabase
      .from("orgs")
      .select("id")
      .eq("id", selectedOrgId)
      .maybeSingle();
    if (error) throw error;
    if (organization) {
      return { userId: auth.user.id, orgId: organization.id, role: "super_admin", isSuperAdmin };
    }
  }
  throw new Error("A organização selecionada não está disponível para este usuário.");
}
