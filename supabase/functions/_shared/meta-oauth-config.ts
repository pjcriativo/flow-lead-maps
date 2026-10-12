export const META_OAUTH_REQUIRED_SECRETS = [
  "META_INSTAGRAM_APP_ID",
  "META_INSTAGRAM_APP_SECRET",
  "FLOW_BUSINESS_META_REDIRECT_URL",
  "FLOW_BUSINESS_TOKEN_KEY",
] as const;

export type MetaOAuthSecretName = (typeof META_OAUTH_REQUIRED_SECRETS)[number];

export function getMetaOAuthPrerequisiteStatus(readEnv: (name: string) => string | undefined) {
  const missing = META_OAUTH_REQUIRED_SECRETS.filter((name) => !readEnv(name)?.trim());
  return { configured: missing.length === 0, missing };
}

export function isMetaOAuthEnabled(config: unknown): boolean {
  return (
    typeof config === "object" &&
    config !== null &&
    "instagram_oauth_ativo" in config &&
    config.instagram_oauth_ativo === true
  );
}
