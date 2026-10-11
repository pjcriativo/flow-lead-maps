import { resolverChave } from "../chaves.ts";

export interface AisaFeatureFlags {
  instagram: boolean;
  linkedin: boolean;
}

export interface AisaProviderAvailability {
  enabled: boolean;
  available: boolean;
  reason: "available" | "feature_disabled" | "missing_api_key" | "integration_not_implemented";
}

export interface AisaRuntimeConfig {
  apiKey: string | null;
  baseUrl: string;
  flags: AisaFeatureFlags;
  availability: {
    instagram: AisaProviderAvailability;
    linkedin: AisaProviderAvailability;
  };
}

type GetEnvironment = (name: string) => string | undefined;
const AISA_API_BASE_URL = "https://api.aisa.one/apis/v1";

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function readAisaFeatureFlags(getEnvironment: GetEnvironment): AisaFeatureFlags {
  return {
    instagram: isEnabled(getEnvironment("AISA_INSTAGRAM_ENABLED")),
    linkedin: isEnabled(getEnvironment("AISA_LINKEDIN_ENABLED")),
  };
}

export function resolveAisaAvailability(params: {
  flags: AisaFeatureFlags;
  apiKey: string | null;
}): AisaRuntimeConfig["availability"] {
  const instagramStatus = (enabled: boolean): AisaProviderAvailability => {
    if (!enabled) return { enabled: false, available: false, reason: "feature_disabled" };
    if (!params.apiKey) return { enabled: true, available: false, reason: "missing_api_key" };
    return { enabled: true, available: true, reason: "available" };
  };
  const linkedinStatus: AisaProviderAvailability = params.flags.linkedin
    ? { enabled: true, available: false, reason: "integration_not_implemented" }
    : { enabled: false, available: false, reason: "feature_disabled" };
  return { instagram: instagramStatus(params.flags.instagram), linkedin: linkedinStatus };
}

export async function loadAisaRuntimeConfig(
  admin: Parameters<typeof resolverChave>[0],
  getEnvironment: GetEnvironment = (name) => Deno.env.get(name),
): Promise<AisaRuntimeConfig> {
  const flags = readAisaFeatureFlags(getEnvironment);
  const resolved = await resolverChave(admin, "AISA_API_KEY");
  const apiKey = resolved?.trim() || null;
  const baseUrl = AISA_API_BASE_URL;
  return { apiKey, baseUrl, flags, availability: resolveAisaAvailability({ flags, apiKey }) };
}
