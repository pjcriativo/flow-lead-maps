import { AisaClient, type AisaClientOptions } from "./client.ts";
import { loadAisaRuntimeConfig } from "./config.ts";
import { createAisaInstagramProvider } from "./instagram/index.ts";
import type { AisaLogger, AisaUsageTracker } from "./types.ts";

export async function createAisaInfrastructure(params: {
  admin: Parameters<typeof loadAisaRuntimeConfig>[0];
  usageTracker?: AisaUsageTracker;
  logger?: AisaLogger;
  clientOptions?: Omit<
    AisaClientOptions,
    "apiKey" | "enabled" | "baseUrl" | "usageTracker" | "logger"
  >;
}) {
  const config = await loadAisaRuntimeConfig(params.admin);
  const client = new AisaClient({
    ...params.clientOptions,
    apiKey: config.apiKey,
    enabled: config.availability.instagram.available,
    baseUrl: config.baseUrl,
    usageTracker: params.usageTracker,
    logger: params.logger,
  });
  return {
    status: config.availability,
    instagram: createAisaInstagramProvider(client),
    linkedin: null,
  };
}

export * from "./client.ts";
export * from "./config.ts";
export * from "./errors.ts";
export * from "./rate-limiter.ts";
export * from "./types.ts";
export * from "./usage-tracker.ts";
