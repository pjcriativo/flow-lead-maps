export type OrganizationMembership = { org_id: string; papel: string };

export function resolveActiveMembership(
  memberships: readonly OrganizationMembership[],
  selectedOrgId: string | null,
): OrganizationMembership {
  if (!selectedOrgId && memberships.length === 1) return memberships[0];
  if (!selectedOrgId) throw new Error("Selecione uma organização ativa antes de continuar.");
  const membership = memberships.find((item) => item.org_id === selectedOrgId);
  if (!membership)
    throw new Error("A organização selecionada não está disponível para este usuário.");
  return membership;
}
