const SEARCH_ROLES = new Set(["admin", "gerente", "vendedor", "sdr"]);

export function canSearchOrganization(input: {
  organizationExists: boolean;
  isSuperAdmin: boolean;
  membershipRole: string | null;
}): boolean {
  if (!input.organizationExists) return false;
  if (input.isSuperAdmin) return true;
  return input.membershipRole !== null && SEARCH_ROLES.has(input.membershipRole);
}
