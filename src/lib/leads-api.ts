// Cliente do front para a Fase 1: busca (streaming) + gestão de leads.
// A chave da Google Places NUNCA passa por aqui — fica no secret da Edge Function.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toGoogleMapsPublicErrorMessage, type CaptureFilter } from "@/lib/google-maps-capture";
import { getActiveOrganizationContext } from "@/lib/active-organization";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

export type LeadSortField = "score" | "created_at" | "updated_at" | "business_name";

export type LeadPageFilters = {
  search?: string;
  status?: string;
  source?: "google_maps" | "instagram" | "linkedin" | "manual";
  score?: "90+" | "80+" | "70-79" | "below-70";
  listId?: string;
  assignedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
};

export type LeadPageRequest = {
  page: number;
  pageSize: number;
  sortBy: LeadSortField;
  sortDirection: "asc" | "desc";
  filters: LeadPageFilters;
};

export type LeadPage = {
  leads: Lead[];
  total: number;
};

export type LeadMetrics = {
  total: number;
  contacted: number;
  opportunities: number;
  proposals: number;
  customers: number;
};

export type LeadWorkspaceContext = {
  userId: string;
  orgId: string;
  role: string;
  canDelete: boolean;
};

export type CreateLeadInput = Pick<
  LeadInsert,
  | "business_name"
  | "owner_name"
  | "phone"
  | "whatsapp"
  | "email"
  | "website"
  | "category"
  | "city"
  | "state"
  | "address"
  | "notes"
  | "list_id"
> & { initialStatus?: LeadStatus };

export type ScoreTier = "quente" | "morno" | "frio";

export type ScoreBreakdown = {
  score: number;
  tier: ScoreTier;
  is_gold: boolean;
  motivo: string;
  has_website: boolean;
  site_fora_do_ar?: boolean;
  bad_site: boolean;
  bad_site_reasons: string[];
  has_instagram: boolean;
  has_facebook: boolean;
  has_whatsapp: boolean;
  has_email: boolean;
  rating_bonus: number;
  notes: string[];
};

/** Fontes de busca plugáveis (o seletor da UI escolhe; o backend despacha). */
export type FonteBusca = "osm" | "geoapify" | "apify" | "places";

export const FONTE_LABELS: Record<FonteBusca, string> = {
  osm: "OpenStreetMap (grátis)",
  geoapify: "Geoapify (grátis)",
  apify: "Google Maps avançado",
  places: "Google Places (requer billing)",
};

/** Fontes desativadas no seletor (presentes, mas não selecionáveis). */
export const FONTES_DESATIVADAS: FonteBusca[] = ["places"];

export type SearchParams = {
  orgId: string;
  nicho: string;
  cidade: string;
  uf: string;
  limite: number;
  buscarEmails: boolean;
  filtrosCaptura: CaptureFilter[];
  fonte: FonteBusca;
  /** Busca por área no mapa (alternativa a cidade/UF). */
  lat?: number | null;
  lng?: number | null;
  raioKm?: number | null;
  /** true quando a área veio de um pino manual e deve prevalecer sobre cidade/UF. */
  usarAreaMapa?: boolean;
};

export type SearchEvent =
  | { type: "log"; message: string }
  | { type: "lead"; lead: Lead }
  | { type: "progress"; found: number; target: number }
  | { type: "done"; inserted: number; total: number; fonte?: FonteBusca }
  | { type: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Chama a Edge Function search-leads e consome o stream NDJSON,
 * despachando cada evento para `onEvent`. Retorna quando o stream fecha.
 */
export async function streamSearchLeads(
  params: SearchParams,
  onEvent: (ev: SearchEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Você precisa estar logado para buscar leads.");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/search-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      org_id: params.orgId,
      nicho: params.nicho,
      cidade: params.cidade,
      uf: params.uf,
      limite: params.limite,
      buscarEmails: params.buscarEmails,
      filtros_captura: params.filtrosCaptura,
      fonte: params.fonte,
      ...(params.lat != null && params.lng != null
        ? {
            lat: params.lat,
            lng: params.lng,
            raio_km: params.raioKm ?? 10,
            usar_area_mapa: params.usarAreaMapa === true,
          }
        : {}),
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    if (res.status === 401) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        await supabase.auth.signOut();
        window.location.reload();
        return;
      }
      throw new Error(
        "Sua sessão havia expirado e foi renovada. Por favor, clique em Buscar leads novamente.",
      );
    }

    let msg = `Falha na busca (HTTP ${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(toGoogleMapsPublicErrorMessage(msg));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        onEvent(JSON.parse(line) as SearchEvent);
      } catch {
        /* linha parcial/ruído — ignora */
      }
    }
  }
  const rest = buffer.trim();
  if (rest) {
    try {
      onEvent(JSON.parse(rest) as SearchEvent);
    } catch {
      /* ignora */
    }
  }
}

/** Enriquece um lead (visita o site: e-mail/WhatsApp + recalcula score). */
export async function enrichLead(leadId: string): Promise<Lead> {
  const { data, error } = await supabase.functions.invoke("enrich-lead", {
    body: { lead_id: leadId },
  });
  if (error) throw error;
  const d = data as { error?: string; lead?: Lead } | null;
  if (d?.error) throw new Error(d.error);
  return d?.lead as Lead;
}

/** Lista os leads do usuário, ordenados por score desc. */
export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function safePostgrestSearch(value: string): string {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lista operacional paginada. O escopo de organização e responsável é imposto pelas policies
 * de `leads`; os filtros abaixo apenas estreitam o conjunto que o usuário já pode visualizar.
 */
export async function fetchLeadsPage(request: LeadPageRequest): Promise<LeadPage> {
  const page = Math.max(1, Math.trunc(request.page));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(request.pageSize)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { filters } = request;

  let query = supabase.from("leads").select("*", { count: "exact" });
  const search = safePostgrestSearch(filters.search ?? "");
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      [
        `business_name.ilike.${pattern}`,
        `owner_name.ilike.${pattern}`,
        `phone.ilike.${pattern}`,
        `whatsapp.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `website.ilike.${pattern}`,
        `place_id.ilike.${pattern}`,
      ].join(","),
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.source === "google_maps") {
    query = query.or("origem_fonte.eq.google_maps,and(origem_fonte.is.null,place_id.not.is.null)");
  } else if (filters.source === "manual") {
    query = query.is("origem_fonte", null).is("place_id", null);
  } else if (filters.source) {
    query = query.eq("origem_fonte", filters.source);
  }
  if (filters.score === "90+") query = query.gte("score", 90);
  if (filters.score === "80+") query = query.gte("score", 80).lt("score", 90);
  if (filters.score === "70-79") query = query.gte("score", 70).lt("score", 80);
  if (filters.score === "below-70") query = query.lt("score", 70);
  if (filters.listId === "none") query = query.is("list_id", null);
  else if (filters.listId) query = query.eq("list_id", filters.listId);
  if (filters.assignedTo === "none") query = query.is("assigned_to", null);
  else if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters.createdTo) query = query.lte("created_at", filters.createdTo);
  if (filters.updatedFrom) query = query.gte("updated_at", filters.updatedFrom);
  if (filters.updatedTo) query = query.lte("updated_at", filters.updatedTo);

  const { data, error, count } = await query
    .order(request.sortBy, { ascending: request.sortDirection === "asc" })
    .order("id", { ascending: true })
    .range(from, to);
  if (error) throw error;
  return { leads: data ?? [], total: count ?? 0 };
}

export async function fetchAllLeadsForExport(
  filters: LeadPageFilters,
  sortBy: LeadSortField,
  sortDirection: "asc" | "desc",
): Promise<Lead[]> {
  const pageSize = 100;
  const first = await fetchLeadsPage({ page: 1, pageSize, sortBy, sortDirection, filters });
  const all = [...first.leads];
  const totalPages = Math.ceil(first.total / pageSize);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchLeadsPage({ page, pageSize, sortBy, sortDirection, filters });
    all.push(...next.leads);
  }
  return all;
}

async function countLeadsByStatuses(statuses?: readonly string[]): Promise<number> {
  let query = supabase.from("leads").select("id", { count: "exact", head: true });
  if (statuses?.length) query = query.in("status", [...statuses]);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/** KPIs calculados sobre todo o conjunto autorizado pela RLS, nunca sobre a página atual. */
export async function fetchLeadMetrics(): Promise<LeadMetrics> {
  const [total, contacted, opportunities, proposals, customers] = await Promise.all([
    countLeadsByStatuses(),
    countLeadsByStatuses(["contacted"]),
    countLeadsByStatuses(["responded", "meeting"]),
    countLeadsByStatuses(["proposta_enviada"]),
    countLeadsByStatuses(["won"]),
  ]);
  return { total, contacted, opportunities, proposals, customers };
}

export async function getLeadWorkspaceContext(): Promise<LeadWorkspaceContext> {
  const active = await getActiveOrganizationContext();
  return {
    userId: active.userId,
    orgId: active.orgId,
    role: active.role,
    canDelete: active.isSuperAdmin || active.role === "admin" || active.role === "gerente",
  };
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const context = await getLeadWorkspaceContext();
  const businessName = input.business_name.trim();
  if (!businessName) throw new Error("Informe o nome da empresa.");
  const phone = input.phone?.trim() || null;
  const whatsapp = input.whatsapp?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  const website = input.website?.trim() || null;
  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: context.userId,
      org_id: context.orgId,
      assigned_to: context.userId,
      business_name: businessName,
      owner_name: input.owner_name?.trim() || null,
      phone,
      whatsapp,
      email,
      website,
      category: input.category?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim().toUpperCase() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      list_id: input.list_id || null,
      status: input.initialStatus ?? "new",
      score: 0,
      sem_contato: !phone && !whatsapp && !email,
      has_phone: Boolean(phone || whatsapp),
      has_website: Boolean(website),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function fetchLeadsByIds(ids: string[]): Promise<Lead[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Atualiza o status (usado pelo Kanban ao arrastar). */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  expectedUpdatedAt?: string,
): Promise<Lead> {
  const now = new Date().toISOString();
  let query = supabase
    .from("leads")
    .update({
      status,
      updated_at: now,
      ...(status === "lost" || status === "nurture"
        ? {}
        : { motivo_perda: null, motivo_perda_nota: null, perda_em: null }),
    })
    .eq("id", id);
  if (expectedUpdatedAt) query = query.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select().maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      expectedUpdatedAt
        ? "Este lead foi atualizado em outra sessão. Recarregue o pipeline e tente novamente."
        : "O lead não foi encontrado ou você não tem permissão para atualizá-lo.",
    );
  }
  return data;
}

/** Edição genérica de campos do lead. */
export async function updateLead(
  id: string,
  patch: Database["public"]["Tables"]["leads"]["Update"],
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}

/** Ações em MASSA (seleção em Meus Leads). RLS garante que só toca os leads do dono. */
export async function deleteLeads(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("leads").delete().in("id", ids);
  if (error) throw error;
}

export async function updateLeadsStatus(ids: string[], status: string): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

// ===== Contato MANUAL (WhatsApp/telefone/e-mail/presencial) =====
export const CANAIS_CONTATO = [
  { valor: "whatsapp", label: "WhatsApp" },
  { valor: "telefone", label: "Telefone" },
  { valor: "email", label: "E-mail" },
  { valor: "presencial", label: "Presencial" },
  { valor: "outro", label: "Outro" },
] as const;
export type CanalContato = (typeof CANAIS_CONTATO)[number]["valor"];
export const CANAL_LABEL: Record<string, string> = Object.fromEntries(
  CANAIS_CONTATO.map((c) => [c.valor, c.label]),
);

export type Contato = {
  id: string;
  lead_id: string;
  canal: string;
  anotacao: string | null;
  contatado_em: string;
};

/**
 * Registra um contato MANUAL de forma ATÔMICA (RPC registrar_contato_manual): insere no
 * histórico (lead_contatos → linha do tempo) E atualiza o lead na MESMA transação — move para
 * "Contatado" sem regredir quem já está adiantado (proposta_enviada+) e, se reengajou um lead
 * de lost/nurture, LIMPA o motivo de perda (o painel não conta mais quem voltou ao funil).
 * NÃO cria proposta nem seta "proposta_enviada" — o follow-up automático (que exige proposta
 * enviada) NUNCA é disparado por um contato manual.
 */
export async function registrarContato(
  leadId: string,
  entrada: { canal: CanalContato; anotacao?: string; contatado_em?: string },
): Promise<{ novoStatus: LeadStatus; quando: string; perdaLimpa: boolean }> {
  const quando = entrada.contatado_em ?? new Date().toISOString();
  const { data, error } = await supabase.rpc("registrar_contato_manual", {
    p_lead_id: leadId,
    p_canal: entrada.canal,
    // `p_anotacao text` aceita NULL no Postgres (é o que gravamos quando não há anotação), mas o
    // gerador de tipos do Supabase marca TODO argumento de função como obrigatório e não-nulo.
    // Limitação do gerador, não do banco — o comportamento aqui continua exatamente o mesmo.
    p_anotacao: (entrada.anotacao ?? null) as unknown as string,
    p_contatado_em: quando,
  });
  if (error) throw error;
  const novoStatus = ((data as string) || "contacted") as LeadStatus;
  return {
    novoStatus,
    quando,
    perdaLimpa: novoStatus !== "lost" && novoStatus !== "nurture",
  };
}

/** Histórico de contatos manuais de um lead (mais recente primeiro). */
export async function listarContatos(leadId: string): Promise<Contato[]> {
  const { data, error } = await supabase
    .from("lead_contatos")
    .select("id, lead_id, canal, anotacao, contatado_em")
    .eq("lead_id", leadId)
    .order("contatado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ===== MOTIVO de perda/nutrição ESTRUTURADO (contável) =====
// Lista fixa: guardar o motivo como TEXTO exato desta lista o torna contável (ETAPA 3).
export const MOTIVOS_PERDA = [
  "Já tem site e está satisfeito",
  "Achou caro / sem orçamento",
  "Não é o momento",
  "Não respondeu",
  "Não é o decisor",
  "Já tem agência/fornecedor",
  "Outro",
] as const;
export type MotivoPerda = (typeof MOTIVOS_PERDA)[number];

/** Status "fora do funil" que pedem motivo estruturado. */
export const STATUS_PERDA: LeadStatus[] = ["lost", "nurture"];

/**
 * Move o lead para perdido/nutrição gravando o MOTIVO estruturado (contável) + anotação +
 * quando. Não cria proposta nem toca no follow-up. O motivo fica em leads (1 por lead =
 * estado atual), base do painel de aprendizado.
 */
export async function registrarPerda(
  leadId: string,
  entrada: { status: "lost" | "nurture"; motivo: MotivoPerda; anotacao?: string },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      status: entrada.status,
      motivo_perda: entrada.motivo,
      motivo_perda_nota: entrada.anotacao?.trim() || null,
      perda_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) throw error;
}

/**
 * Contagem por motivo de perda (painel de aprendizado). Conta SÓ quem está de fato fora do
 * funil (status lost/nurture) — se um lead foi reengajado, não conta mais, ainda que o campo
 * antigo persista. RLS já limita aos leads do dono.
 */
export async function contarMotivosPerda(): Promise<{ motivo: string; total: number }[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("motivo_perda")
    .in("status", STATUS_PERDA)
    .not("motivo_perda", "is", null);
  if (error) throw error;
  const cont = new Map<string, number>();
  for (const r of data ?? []) {
    const m = (r as { motivo_perda: string | null }).motivo_perda;
    if (m) cont.set(m, (cont.get(m) ?? 0) + 1);
  }
  return [...cont.entries()]
    .map(([motivo, total]) => ({ motivo, total }))
    .sort((a, b) => b.total - a.total);
}

export const LEAD_STATUSES = [
  "new",
  "enriched",
  "contacted",
  "proposta_enviada",
  "responded",
  "meeting",
  "won",
  "lost",
  "nurture",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
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
