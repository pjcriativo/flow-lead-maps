const INSTAGRAM_ACCOUNT_MANAGER_ROLES = new Set(["admin", "gerente"]);

export function canManageInstagramAccounts(input: {
  role: unknown;
  isSuperAdmin: boolean;
}): boolean {
  return (
    input.isSuperAdmin ||
    (typeof input.role === "string" && INSTAGRAM_ACCOUNT_MANAGER_ROLES.has(input.role))
  );
}

export function assertCanManageInstagramAccounts(input: {
  role: unknown;
  isSuperAdmin: boolean;
}): void {
  if (!canManageInstagramAccounts(input)) throw new Error("forbidden");
}
