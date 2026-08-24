export type InstagramPlanTier = "basico" | "pro" | "agencia";

export type InstagramPlanPolicy = {
  leads: number;
  audienceProfiles: number;
  competitors: number;
  hunts: number;
  overlaps: number;
  enrichments: number;
  brands: number;
  monthlyCostUsd: number;
  monitoring: "manual" | "weekly" | "daily";
};

export const INSTAGRAM_PLAN_POLICIES: Record<InstagramPlanTier, InstagramPlanPolicy> = {
  basico: {
    leads: 30,
    audienceProfiles: 100,
    competitors: 1,
    hunts: 3,
    overlaps: 0,
    enrichments: 10,
    brands: 1,
    monthlyCostUsd: 0.75,
    monitoring: "manual",
  },
  pro: {
    leads: 300,
    audienceProfiles: 2_000,
    competitors: 5,
    hunts: 20,
    overlaps: 3,
    enrichments: 300,
    brands: 1,
    monthlyCostUsd: 4,
    monitoring: "weekly",
  },
  agencia: {
    leads: 1_500,
    audienceProfiles: 10_000,
    competitors: 25,
    hunts: 100,
    overlaps: 20,
    enrichments: 2_000,
    brands: 10,
    monthlyCostUsd: 15,
    monitoring: "daily",
  },
};

export function normalizeInstagramPlanTier(value: string | null | undefined): InstagramPlanTier {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("agencia") || normalized.includes("enterprise")) return "agencia";
  if (normalized.includes("pro")) return "pro";
  return "basico";
}

export function normalizeInstagramUsername(value: string): string {
  let normalized = value.trim().toLowerCase();
  try {
    if (/^https?:\/\//.test(normalized)) {
      normalized = new URL(normalized).pathname;
    }
  } catch {
    // A validação final abaixo rejeita qualquer parte que não seja username.
  }
  return normalized
    .replace(/^\/+/, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
}

export type InstagramAudienceMember = {
  username: string;
  instagramUserId?: string | null;
  fullName?: string | null;
  biography?: string | null;
  followers?: number | null;
  professional?: boolean | null;
};

export type InstagramAudienceSource = {
  source: string;
  members: InstagramAudienceMember[];
};

export type CrossedInstagramMember = InstagramAudienceMember & {
  key: string;
  sources: string[];
};

export function crossInstagramAudiences(sources: InstagramAudienceSource[]): {
  all: CrossedInstagramMember[];
  overlap: CrossedInstagramMember[];
  exclusiveBySource: Record<string, CrossedInstagramMember[]>;
} {
  const indexed = new Map<string, CrossedInstagramMember>();
  for (const group of sources) {
    const source = normalizeInstagramUsername(group.source) || group.source.trim().toLowerCase();
    for (const member of group.members) {
      const username = normalizeInstagramUsername(member.username);
      if (!username) continue;
      const key = member.instagramUserId ? `id:${member.instagramUserId}` : `username:${username}`;
      const current = indexed.get(key);
      if (current) {
        if (!current.sources.includes(source)) current.sources.push(source);
        if (!current.fullName && member.fullName) current.fullName = member.fullName;
        if (!current.biography && member.biography) current.biography = member.biography;
        continue;
      }
      indexed.set(key, { ...member, username, key, sources: [source] });
    }
  }
  const all = [...indexed.values()].sort(
    (left, right) =>
      right.sources.length - left.sources.length || left.username.localeCompare(right.username),
  );
  const exclusiveBySource = Object.fromEntries(
    sources.map(({ source }) => [
      normalizeInstagramUsername(source) || source,
      [] as CrossedInstagramMember[],
    ]),
  );
  for (const member of all) {
    if (member.sources.length === 1) exclusiveBySource[member.sources[0]]?.push(member);
  }
  return { all, overlap: all.filter((member) => member.sources.length > 1), exclusiveBySource };
}

export type InstagramOpportunitySignals = {
  intentScore: number;
  sourceCount: number;
  evidenceCount: number;
  nicheMatch: boolean;
  locationMatch: boolean;
  professional: boolean;
  hasContact: boolean;
  followers: number;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function rankInstagramOpportunity(input: InstagramOpportunitySignals): {
  score: number;
  temperature: "quente" | "morno" | "frio";
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = clamp(input.intentScore) * 0.42;
  if (input.intentScore >= 75) reasons.push("sinal de intenção forte");
  if (input.sourceCount > 1) {
    score += Math.min(24, (input.sourceCount - 1) * 12);
    reasons.push(`aparece em ${input.sourceCount} audiências`);
  }
  if (input.evidenceCount > 1) {
    score += Math.min(12, (input.evidenceCount - 1) * 3);
    reasons.push(`${input.evidenceCount} evidências recentes`);
  }
  if (input.nicheMatch) {
    score += 9;
    reasons.push("perfil compatível com o nicho");
  }
  if (input.locationMatch) score += 5;
  if (input.professional) score += 5;
  if (input.hasContact) score += 5;
  if (input.followers >= 100 && input.followers <= 100_000) score += 4;
  const finalScore = Math.round(clamp(score));
  return {
    score: finalScore,
    temperature: finalScore >= 75 ? "quente" : finalScore >= 50 ? "morno" : "frio",
    reasons: reasons.slice(0, 5),
  };
}

function compactText(value: string | null | undefined, fallback: string): string {
  return String(value ?? fallback)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function buildContextualApproach(input: {
  firstName?: string | null;
  sourceName?: string | null;
  evidence?: string | null;
  offer?: string | null;
}): string {
  const name = compactText(input.firstName, "tudo bem").split(" ")[0];
  const source = compactText(input.sourceName, "um conteúdo do seu mercado");
  const evidence = compactText(input.evidence, "seu interesse nesse assunto");
  const offer = compactText(input.offer, "uma ideia prática para esse ponto");
  return `Oi, ${name}! Vi no perfil ${source} seu comentário sobre “${evidence}”. Trabalho com isso e pensei em ${offer}. Posso te explicar em 2 minutos, sem compromisso?`.slice(
    0,
    320,
  );
}
