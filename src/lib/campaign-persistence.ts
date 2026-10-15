export type PersistenceRole = "super_admin" | "admin" | "gerente" | "vendedor" | "sdr" | "suporte";

export interface RecipientCandidate {
  id: string;
  orgId: string;
  listId: string;
  email: string | null;
  optOut: boolean;
  complaint?: boolean;
  blocked?: boolean;
  eligibilityConfirmed?: boolean;
}

export interface PersistedRecipientDecision {
  leadId: string;
  selected: boolean;
  normalizedEmail: string | null;
  eligibility:
    | "sem_email"
    | "nao_validado"
    | "elegivel_confirmado"
    | "bloqueado"
    | "descadastro"
    | "reclamacao";
  exclusionReason: string | null;
}

export function canManageCampaignPersistence(role: PersistenceRole): boolean {
  return role === "super_admin" || role === "admin" || role === "gerente";
}

export function deriveRecipientDecisions(params: {
  activeOrgId: string;
  listId: string;
  selectedLeadIds: readonly string[];
  candidates: readonly RecipientCandidate[];
}): PersistedRecipientDecision[] {
  const selected = new Set(params.selectedLeadIds);
  const knownIds = new Set(params.candidates.map((candidate) => candidate.id));
  for (const id of selected) {
    if (!knownIds.has(id)) throw new Error(`Lead selecionado não pertence à lista: ${id}`);
  }
  const seenEmails = new Set<string>();
  return params.candidates.map((candidate) => {
    if (candidate.orgId !== params.activeOrgId || candidate.listId !== params.listId) {
      throw new Error("Lead de outra organização ou lista.");
    }
    const normalizedEmail = candidate.email?.trim().toLowerCase() || null;
    let eligibility: PersistedRecipientDecision["eligibility"] = "nao_validado";
    let exclusionReason: string | null = "Elegibilidade não comprovada";
    if (!normalizedEmail) {
      eligibility = "sem_email";
      exclusionReason = "E-mail ausente";
    } else if (candidate.optOut) {
      eligibility = "descadastro";
      exclusionReason = "Lead descadastrado";
    } else if (candidate.complaint) {
      eligibility = "reclamacao";
      exclusionReason = "Reclamação registrada";
    } else if (candidate.blocked || seenEmails.has(normalizedEmail)) {
      eligibility = "bloqueado";
      exclusionReason = seenEmails.has(normalizedEmail)
        ? "E-mail duplicado na lista"
        : "E-mail bloqueado";
    } else if (candidate.eligibilityConfirmed) {
      eligibility = "elegivel_confirmado";
      exclusionReason = null;
    }
    if (normalizedEmail) seenEmails.add(normalizedEmail);
    return {
      leadId: candidate.id,
      selected: selected.has(candidate.id),
      normalizedEmail,
      eligibility,
      exclusionReason,
    };
  });
}

export function createCampaignSnapshot<T>(source: T): T {
  return structuredClone(source);
}

export function assertExpectedRevision(expected: number, persisted: number): void {
  if (expected !== persisted) throw new Error("Conflito de revisão: recarregue antes de salvar");
}

export function resolveTemplateCopyId(params: {
  global: boolean;
  sourceId: string;
  persistedCopyId?: string;
}): string {
  if (params.global && params.persistedCopyId === params.sourceId) {
    throw new Error("Template global não pode ser sobrescrito.");
  }
  return params.persistedCopyId ?? params.sourceId;
}
