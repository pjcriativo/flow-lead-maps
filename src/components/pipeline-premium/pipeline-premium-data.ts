import type { Lead, LeadStatus } from "@/lib/leads-api";
import type { Proposta } from "@/types";

export type PipelineStageKey =
  "novo" | "contato" | "qualificacao" | "proposta" | "negociacao" | "fechado";

export type OpportunityChannel = "maps" | "instagram" | "linkedin" | "manual";

export interface PipelineStageInfo {
  key: PipelineStageKey;
  title: string;
  count: number;
  totalValue: string;
  badgeColor: string;
}

export interface OpportunityItem {
  id: string;
  stage: PipelineStageKey;
  company: string;
  category: string;
  value: string;
  proposalValue: number | null;
  channel: OpportunityChannel;
  channelLabel: string;
  statusTag: string;
  statusValue: LeadStatus;
  score: number;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  website: string;
  description: string;
  responsible: string;
  assignedTo: string | null;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  createdAt: string;
  updatedAt: string;
  avatarType:
    | "tooth"
    | "auto"
    | "fitness"
    | "restaurant"
    | "beauty"
    | "leaf"
    | "tech"
    | "legal"
    | "architecture"
    | "education"
    | "supermarket"
    | "transport"
    | "consulting"
    | "construction"
    | "holding"
    | "agency"
    | "industry"
    | "mechanic";
  record: Lead;
}

export interface PipelineMetricItem {
  id: "leads" | "negociacao" | "propostas" | "vendas" | "valor";
  label: string;
  value: string;
  accent: "orange" | "purple" | "green" | "blue" | "amber";
  unavailable: boolean;
}

export const PIPELINE_STAGE_DEFINITIONS: ReadonlyArray<
  Pick<PipelineStageInfo, "key" | "title" | "badgeColor">
> = [
  {
    key: "novo",
    title: "Novo Lead",
    badgeColor: "border-slate-700/80 bg-slate-900/60 text-slate-300",
  },
  {
    key: "contato",
    title: "Em Contato",
    badgeColor: "border-purple-800/80 bg-purple-950/60 text-purple-300",
  },
  {
    key: "qualificacao",
    title: "Qualificação",
    badgeColor: "border-blue-800/80 bg-blue-950/60 text-blue-300",
  },
  {
    key: "proposta",
    title: "Proposta",
    badgeColor: "border-amber-800/80 bg-amber-950/60 text-amber-300",
  },
  {
    key: "negociacao",
    title: "Negociação",
    badgeColor: "border-orange-800/80 bg-orange-950/60 text-orange-300",
  },
  {
    key: "fechado",
    title: "Fechado",
    badgeColor: "border-emerald-800/80 bg-emerald-950/60 text-emerald-300",
  },
];

const STATUS_STAGE: Record<LeadStatus, PipelineStageKey> = {
  new: "novo",
  contacted: "contato",
  enriched: "qualificacao",
  nurture: "qualificacao",
  proposta_enviada: "proposta",
  responded: "negociacao",
  meeting: "negociacao",
  won: "fechado",
  lost: "fechado",
};

export const STAGE_TARGET_STATUS: Record<PipelineStageKey, LeadStatus> = {
  novo: "new",
  contato: "contacted",
  qualificacao: "enriched",
  proposta: "proposta_enviada",
  negociacao: "meeting",
  fechado: "won",
};

export function stageForStatus(status: LeadStatus): PipelineStageKey {
  return STATUS_STAGE[status];
}

export function parseLeadStatus(status: string): LeadStatus {
  switch (status) {
    case "new":
    case "enriched":
    case "contacted":
    case "proposta_enviada":
    case "responded":
    case "meeting":
    case "won":
    case "lost":
    case "nurture":
      return status;
    default:
      throw new Error(`Status comercial não suportado: ${status}`);
  }
}

export function statusLabel(status: LeadStatus): string {
  switch (status) {
    case "new":
      return "Novo";
    case "enriched":
      return "Qualificação";
    case "contacted":
      return "Em contato";
    case "proposta_enviada":
      return "Proposta enviada";
    case "responded":
      return "Respondeu";
    case "meeting":
      return "Reunião";
    case "won":
      return "Ganho";
    case "lost":
      return "Perdido";
    case "nurture":
      return "Nutrição";
  }
}

function sourceFor(lead: Lead): { channel: OpportunityChannel; label: string } {
  if (lead.origem_fonte === "instagram") return { channel: "instagram", label: "Instagram" };
  if (lead.origem_fonte === "linkedin") return { channel: "linkedin", label: "LinkedIn" };
  if (lead.origem_fonte === "google_maps" || lead.place_id) {
    return { channel: "maps", label: "Google Maps" };
  }
  return { channel: "manual", label: "Cadastro manual" };
}

function avatarFor(category: string | null): OpportunityItem["avatarType"] {
  const value = (category ?? "").toLocaleLowerCase("pt-BR");
  if (value.includes("odont")) return "tooth";
  if (value.includes("auto")) return "auto";
  if (value.includes("academ") || value.includes("fitness")) return "fitness";
  if (value.includes("restaurant") || value.includes("gastronom")) return "restaurant";
  if (value.includes("estét") || value.includes("beleza")) return "beauty";
  if (value.includes("saúde") || value.includes("clín")) return "leaf";
  if (value.includes("advoc") || value.includes("juríd")) return "legal";
  if (value.includes("arquit")) return "architecture";
  if (value.includes("educ") || value.includes("escola")) return "education";
  if (value.includes("mercado") || value.includes("supermerc")) return "supermarket";
  if (value.includes("transport")) return "transport";
  if (value.includes("consult")) return "consulting";
  if (value.includes("constr")) return "construction";
  if (value.includes("mecân")) return "mechanic";
  return "tech";
}

export function formatCurrency(value: number | null): string {
  if (value == null) return "Sem valor";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function latestProposalValues(proposals: readonly Proposta[]): Map<string, number | null> {
  const latest = new Map<string, { createdAt: number; value: number | null }>();
  for (const proposal of proposals) {
    const createdAt = new Date(proposal.criada_em).getTime();
    const current = latest.get(proposal.lead_id);
    if (!current || createdAt > current.createdAt) {
      latest.set(proposal.lead_id, { createdAt, value: proposal.valor });
    }
  }
  return new Map([...latest].map(([leadId, proposal]) => [leadId, proposal.value]));
}

export function proposalsForLeads(
  proposals: readonly Proposta[],
  leads: readonly Lead[],
): Proposta[] {
  const authorizedLeadIds = new Set(leads.map((lead) => lead.id));
  return proposals.filter((proposal) => authorizedLeadIds.has(proposal.lead_id));
}

export function moveLeadInCache(leads: readonly Lead[], id: string, status: LeadStatus): Lead[] {
  return leads.map((lead) => (lead.id === id ? { ...lead, status } : lead));
}

export function toOpportunity(
  lead: Lead,
  proposalValue: number | null,
  responsibleName: string,
  proposalDataAvailable = true,
): OpportunityItem {
  const source = sourceFor(lead);
  const status = parseLeadStatus(lead.status);
  return {
    id: lead.id,
    stage: stageForStatus(status),
    company: lead.business_name,
    category: lead.category ?? "Categoria não informada",
    value: proposalDataAvailable ? formatCurrency(proposalValue) : "Indisponível",
    proposalValue,
    channel: source.channel,
    channelLabel: source.label,
    statusTag: statusLabel(status),
    statusValue: status,
    score: lead.score,
    contactName: lead.owner_name ?? "",
    phone: lead.phone ?? "",
    whatsapp: lead.whatsapp ?? "",
    email: lead.email ?? "",
    address: lead.address ?? [lead.city, lead.state].filter(Boolean).join(" - "),
    website: lead.website ?? "",
    description: lead.notes ?? "",
    responsible: responsibleName,
    assignedTo: lead.assigned_to,
    instagramUrl: lead.instagram_url ?? "",
    facebookUrl: lead.facebook_url ?? "",
    linkedinUrl: lead.linkedin_url ?? "",
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    avatarType: avatarFor(lead.category),
    record: lead,
  };
}

export function buildPipelineStages(
  opportunities: readonly OpportunityItem[],
  proposalDataAvailable = true,
): PipelineStageInfo[] {
  return PIPELINE_STAGE_DEFINITIONS.map((definition) => {
    const stageItems = opportunities.filter((item) => item.stage === definition.key);
    const knownValues = stageItems
      .map((item) => item.proposalValue)
      .filter((value): value is number => value != null);
    return {
      ...definition,
      count: stageItems.length,
      totalValue: !proposalDataAvailable
        ? "Indisponível"
        : knownValues.length
          ? formatCurrency(knownValues.reduce((total, value) => total + value, 0))
          : "Sem valores",
    };
  });
}

export function buildPipelineMetrics(
  leads: readonly Lead[],
  proposals: readonly Proposta[],
  proposalDataAvailable = true,
): PipelineMetricItem[] {
  const proposalValues = latestProposalValues(proposals);
  const negotiationLeads = leads.filter(
    (lead) => lead.status === "responded" || lead.status === "meeting",
  );
  const negotiationValues = negotiationLeads
    .map((lead) => proposalValues.get(lead.id))
    .filter((value): value is number => value != null);
  const sentLeadIds = new Set(
    proposals
      .filter((proposal) => proposal.status === "enviada")
      .map((proposal) => proposal.lead_id),
  );
  return [
    metric("leads", "Leads no pipeline", leads.length.toLocaleString("pt-BR"), "orange"),
    metric(
      "negociacao",
      "Em negociação",
      negotiationLeads.length.toLocaleString("pt-BR"),
      "purple",
    ),
    metric(
      "propostas",
      "Propostas enviadas",
      proposalDataAvailable ? sentLeadIds.size.toLocaleString("pt-BR") : "—",
      "green",
      !proposalDataAvailable,
    ),
    metric(
      "vendas",
      "Vendas realizadas",
      leads.filter((lead) => lead.status === "won").length.toLocaleString("pt-BR"),
      "blue",
    ),
    metric(
      "valor",
      "Valor em negociação",
      proposalDataAvailable && negotiationValues.length
        ? formatCurrency(negotiationValues.reduce((total, value) => total + value, 0))
        : "—",
      "amber",
      !proposalDataAvailable,
    ),
  ];
}

function metric(
  id: PipelineMetricItem["id"],
  label: string,
  value: string,
  accent: PipelineMetricItem["accent"],
  unavailable = false,
): PipelineMetricItem {
  return { id, label, value, accent, unavailable };
}

export type PipelineFilters = {
  search: string;
  channel: "all" | OpportunityChannel;
  stage: "all" | PipelineStageKey;
  responsible: string;
  score: "all" | "high" | "medium" | "qualification";
  createdFrom: string;
  createdTo: string;
};

export function filterOpportunities(
  opportunities: readonly OpportunityItem[],
  filters: PipelineFilters,
): OpportunityItem[] {
  const search = filters.search.trim().toLocaleLowerCase("pt-BR");
  const from = filters.createdFrom ? new Date(`${filters.createdFrom}T00:00:00`).getTime() : null;
  const to = filters.createdTo ? new Date(`${filters.createdTo}T23:59:59.999`).getTime() : null;
  return opportunities.filter((item) => {
    if (
      search &&
      ![item.company, item.contactName, item.phone, item.email, item.website]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(search)
    )
      return false;
    if (filters.channel !== "all" && item.channel !== filters.channel) return false;
    if (filters.stage !== "all" && item.stage !== filters.stage) return false;
    if (filters.responsible === "none" && item.assignedTo != null) return false;
    if (
      filters.responsible !== "all" &&
      filters.responsible !== "none" &&
      item.assignedTo !== filters.responsible
    )
      return false;
    if (filters.score === "high" && item.score < 80) return false;
    if (filters.score === "medium" && (item.score < 70 || item.score >= 80)) return false;
    if (filters.score === "qualification" && item.score >= 70) return false;
    const createdAt = new Date(item.createdAt).getTime();
    if (from != null && createdAt < from) return false;
    if (to != null && createdAt > to) return false;
    return true;
  });
}
