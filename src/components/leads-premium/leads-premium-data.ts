import type { Lead, LeadMetrics } from "@/lib/leads-api";

export type LeadStatus =
  | "Novo"
  | "Enriquecido"
  | "Contatado"
  | "Proposta enviada"
  | "Respondeu"
  | "Reunião"
  | "Ganho"
  | "Perdido"
  | "Nutrição";

export type LeadChannel =
  "maps" | "instagram" | "linkedin" | "youtube" | "tiktok" | "whatsapp" | "manual";

export type LeadScoreClassification = "Alto potencial" | "Médio potencial" | "Em qualificação";

export interface LeadItem {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  channel: LeadChannel;
  channelLabel: string;
  city: string;
  state: string;
  address: string;
  score: number;
  status: LeadStatus;
  statusValue: string;
  date: string;
  time: string;
  category: string;
  website: string;
  description: string;
  classification: LeadScoreClassification;
  tags: string[];
  avatarType:
    | "tooth"
    | "restaurant"
    | "fitness"
    | "leaf"
    | "legal"
    | "architecture"
    | "tech"
    | "beauty"
    | "auto"
    | "hair";
  assignedTo: string | null;
  listId: string | null;
  orgId: string | null;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  createdAt: string;
  updatedAt: string;
  record: Lead;
}

export interface MetricCardItem {
  id: "total" | "contato" | "oportunidades" | "propostas" | "clientes";
  label: string;
  value: string;
  change: null;
  accent: "orange" | "purple" | "green" | "blue" | "amber";
  bars: number[];
}

const STATUS_LABELS: Record<string, LeadStatus> = {
  new: "Novo",
  enriched: "Enriquecido",
  contacted: "Contatado",
  proposta_enviada: "Proposta enviada",
  responded: "Respondeu",
  meeting: "Reunião",
  won: "Ganho",
  lost: "Perdido",
  nurture: "Nutrição",
};

function channelFor(lead: Lead): { channel: LeadChannel; label: string } {
  if (lead.origem_fonte === "instagram") return { channel: "instagram", label: "Instagram" };
  if (lead.origem_fonte === "linkedin") return { channel: "linkedin", label: "LinkedIn" };
  if (lead.origem_fonte === "google_maps" || lead.place_id) {
    return { channel: "maps", label: "Google Maps" };
  }
  return { channel: "manual", label: "Cadastro manual" };
}

function avatarFor(category: string | null): LeadItem["avatarType"] {
  const value = (category ?? "").toLocaleLowerCase("pt-BR");
  if (value.includes("odont")) return "tooth";
  if (value.includes("restaurant") || value.includes("gastronom")) return "restaurant";
  if (value.includes("academ") || value.includes("fitness")) return "fitness";
  if (value.includes("saúde") || value.includes("clin")) return "leaf";
  if (value.includes("advoc") || value.includes("juríd")) return "legal";
  if (value.includes("arquit")) return "architecture";
  if (value.includes("tecnolog") || value.includes("software")) return "tech";
  if (value.includes("estét")) return "beauty";
  if (value.includes("auto")) return "auto";
  if (value.includes("beleza") || value.includes("salão")) return "hair";
  return "tech";
}

export function classifyLeadScore(score: number): LeadScoreClassification {
  if (score >= 80) return "Alto potencial";
  if (score >= 70) return "Médio potencial";
  return "Em qualificação";
}

export function toLeadItem(lead: Lead): LeadItem {
  const channel = channelFor(lead);
  const createdAt = new Date(lead.created_at);
  const location = [lead.city, lead.state].filter(Boolean).join(" - ");
  return {
    id: lead.id,
    company: lead.business_name,
    contactName: lead.owner_name ?? "",
    phone: lead.phone ?? "",
    whatsapp: lead.whatsapp ?? "",
    email: lead.email ?? "",
    channel: channel.channel,
    channelLabel: channel.label,
    city: lead.city ?? "",
    state: lead.state ?? "",
    address: lead.address ?? location,
    score: lead.score,
    status: STATUS_LABELS[lead.status] ?? "Novo",
    statusValue: lead.status,
    date: Number.isNaN(createdAt.getTime()) ? "—" : createdAt.toLocaleDateString("pt-BR"),
    time: Number.isNaN(createdAt.getTime())
      ? ""
      : createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    category: lead.category ?? "",
    website: lead.website ?? "",
    description: lead.notes ?? "",
    classification: classifyLeadScore(lead.score),
    tags: [],
    avatarType: avatarFor(lead.category),
    assignedTo: lead.assigned_to,
    listId: lead.list_id,
    orgId: lead.org_id,
    instagramUrl: lead.instagram_url ?? "",
    facebookUrl: lead.facebook_url ?? "",
    linkedinUrl: lead.linkedin_url ?? "",
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
    record: lead,
  };
}

export function metricsFromCounts(metrics: LeadMetrics): MetricCardItem[] {
  return [
    {
      id: "total",
      label: "Total de leads",
      value: metrics.total.toLocaleString("pt-BR"),
      change: null,
      accent: "orange",
      bars: [],
    },
    {
      id: "contato",
      label: "Em contato",
      value: metrics.contacted.toLocaleString("pt-BR"),
      change: null,
      accent: "purple",
      bars: [],
    },
    {
      id: "oportunidades",
      label: "Oportunidades",
      value: metrics.opportunities.toLocaleString("pt-BR"),
      change: null,
      accent: "green",
      bars: [],
    },
    {
      id: "propostas",
      label: "Propostas",
      value: metrics.proposals.toLocaleString("pt-BR"),
      change: null,
      accent: "blue",
      bars: [],
    },
    {
      id: "clientes",
      label: "Clientes",
      value: metrics.customers.toLocaleString("pt-BR"),
      change: null,
      accent: "amber",
      bars: [],
    },
  ];
}

export function validateLeadForm(values: {
  businessName: string;
  email: string;
  state: string;
  phone?: string;
  whatsapp?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const validPhone = (value: string | undefined) => {
    const digits = value?.replace(/\D/g, "") ?? "";
    return !digits || (digits.length >= 8 && digits.length <= 15);
  };
  if (!values.businessName.trim()) errors.businessName = "Informe o nome da empresa.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }
  if (values.state.trim() && !/^[A-Za-z]{2}$/.test(values.state.trim())) {
    errors.state = "Use a sigla da UF com duas letras.";
  }
  if (!validPhone(values.phone)) errors.phone = "Informe um telefone válido.";
  if (!validPhone(values.whatsapp)) errors.whatsapp = "Informe um WhatsApp válido.";
  return errors;
}

export function leadsToCsv(leads: readonly Lead[]): string {
  const headers = [
    "Empresa",
    "Contato",
    "Categoria",
    "Cidade",
    "UF",
    "Telefone",
    "WhatsApp",
    "E-mail",
    "Site",
    "Score",
    "Status",
    "Origem",
    "Criado em",
  ];
  const rows = leads.map((lead) => [
    lead.business_name,
    lead.owner_name,
    lead.category,
    lead.city,
    lead.state,
    lead.phone,
    lead.whatsapp,
    lead.email,
    lead.website,
    lead.score,
    STATUS_LABELS[lead.status] ?? lead.status,
    channelFor(lead).label,
    lead.created_at,
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
