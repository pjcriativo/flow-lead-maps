export class PersistenceSchemaPendingError extends Error {
  constructor() {
    super("A persistência ainda depende da migration 112 no Supabase.");
    this.name = "PersistenceSchemaPendingError";
  }
}

export function throwPersistenceError(error: { code?: string; message: string }): never {
  if (["42P01", "42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error.code ?? "")) {
    throw new PersistenceSchemaPendingError();
  }
  throw new Error(error.message);
}
