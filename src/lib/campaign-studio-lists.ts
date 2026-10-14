export interface StudioListRow {
  id: string;
  org_id: string | null;
  name: string;
  niche: string;
  city: string;
  uf: string | null;
}

export interface StudioLeadRow {
  list_id: string | null;
  email: string | null;
  score_breakdown: unknown;
}

export interface SimpleStudioListItem {
  id: string;
  orgId: string;
  nome: string;
  nicho: string;
  cidade: string;
  uf: string;
  estado: "vazia" | "com_leads";
  totalLeads: number;
  leadsQualificados: number;
  leadsComEmail: number;
}

export interface StudioListRepository {
  listLists(orgId: string): Promise<StudioListRow[]>;
  listLeads(orgId: string, listIds: string[]): Promise<StudioLeadRow[]>;
}

function isGoldLead(scoreBreakdown: unknown): boolean {
  return (
    typeof scoreBreakdown === "object" &&
    scoreBreakdown !== null &&
    Reflect.get(scoreBreakdown, "is_gold") === true
  );
}

export function mapStudioLists(
  lists: StudioListRow[],
  leads: StudioLeadRow[],
  orgId: string,
): SimpleStudioListItem[] {
  return lists.map((list) => {
    if (list.org_id !== orgId) {
      throw new Error("A consulta retornou uma lista de outra organização.");
    }

    const listLeads = leads.filter((lead) => lead.list_id === list.id);
    return {
      id: list.id,
      orgId,
      nome: list.name,
      nicho: list.niche,
      cidade: list.city,
      uf: list.uf ?? "",
      estado: listLeads.length === 0 ? "vazia" : "com_leads",
      totalLeads: listLeads.length,
      leadsQualificados: listLeads.filter((lead) => isGoldLead(lead.score_breakdown)).length,
      leadsComEmail: listLeads.filter((lead) => Boolean(lead.email?.trim())).length,
    };
  });
}

export async function loadStudioLists(
  repository: StudioListRepository,
  orgId: string,
): Promise<SimpleStudioListItem[]> {
  const lists = await repository.listLists(orgId);
  if (lists.length === 0) return [];

  const leads = await repository.listLeads(
    orgId,
    lists.map((list) => list.id),
  );
  return mapStudioLists(lists, leads, orgId);
}
