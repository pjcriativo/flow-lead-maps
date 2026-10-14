import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { canSearchOrganization } from "./organization-permission.ts";

export async function validateOrganizationAccess(
  admin: SupabaseClient,
  userId: string,
  requestedOrgId: unknown,
): Promise<{ orgId: string; role: string } | null> {
  if (typeof requestedOrgId !== "string" || !requestedOrgId.trim()) return null;
  const orgId = requestedOrgId.trim();

  const [{ data: profile }, { data: organization }] = await Promise.all([
    admin.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
    admin.from("orgs").select("id").eq("id", orgId).maybeSingle(),
  ]);
  if (!organization) return null;
  if (profile?.is_super_admin === true) return { orgId, role: "super_admin" };

  const { data: membership } = await admin
    .from("memberships")
    .select("papel")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (
    !canSearchOrganization({
      organizationExists: true,
      isSuperAdmin: false,
      membershipRole: membership?.papel ?? null,
    })
  )
    return null;
  return { orgId, role: membership.papel };
}
