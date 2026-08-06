import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

export const SEEN_PLACE_PAGE_SIZE = 1_000;

export type SeenPlacePageLoader = (from: number, to: number) => Promise<readonly unknown[]>;

export interface SeenLeadIdentities {
  placeIds: Set<string>;
  businessKeys: Set<string>;
}

function readStringField(row: unknown, field: string): string | null {
  if (row === null || typeof row !== "object") return null;
  const value = Reflect.get(row, field);
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function normalizeLeadIdentityPart(value: string): string {
  const accents = "áàâãäéèêëíìîïóòôõöúùûüç";
  const plain = "aaaaaeeeeiiiiooooouuuuc";
  const translations = new Map([...accents].map((char, index) => [char, plain[index]]));
  return [...value.trim().toLowerCase()]
    .map((char) => translations.get(char) ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "");
}

export function leadBusinessIdentity(
  name: string | null | undefined,
  address: string | null | undefined,
): string | null {
  if (!name || !address) return null;
  const normalizedName = normalizeLeadIdentityPart(name);
  const normalizedAddress = normalizeLeadIdentityPart(address);
  return normalizedName && normalizedAddress ? `${normalizedName}|${normalizedAddress}` : null;
}

export async function collectAllSeenLeadIdentities(
  loadPage: SeenPlacePageLoader,
): Promise<SeenLeadIdentities> {
  const seen: SeenLeadIdentities = { placeIds: new Set(), businessKeys: new Set() };
  for (let from = 0; ; from += SEEN_PLACE_PAGE_SIZE) {
    const rows = await loadPage(from, from + SEEN_PLACE_PAGE_SIZE - 1);
    for (const row of rows) {
      const placeId = readStringField(row, "place_id");
      const businessKey = readStringField(row, "business_key");
      if (placeId) seen.placeIds.add(placeId);
      if (businessKey) seen.businessKeys.add(businessKey);
    }
    if (rows.length < SEEN_PLACE_PAGE_SIZE) break;
  }
  return seen;
}

export async function loadSeenLeadIdentitiesForOrg(
  admin: SupabaseClient,
  orgId: string,
): Promise<SeenLeadIdentities> {
  return collectAllSeenLeadIdentities(async (from, to) => {
    const { data, error } = await admin
      .from("lead_seen_registry")
      .select("place_id,business_key")
      .eq("org_id", orgId)
      .order("place_id")
      .range(from, to);
    if (error) throw new Error(`Falha ao carregar o histórico de leads da conta: ${error.message}`);
    return Array.isArray(data) ? data : [];
  });
}
