import { createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

function parseEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i))
      .filter(Boolean)
      .map((match) => {
        let value = match[2];
        if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
        return [match[1], value];
      }),
  );
}

function loadEnvironment() {
  return {
    ...parseEnv(new URL("../.env", import.meta.url)),
    ...parseEnv(new URL("../.env.local", import.meta.url)),
    ...parseEnv(new URL("../.env.instagram-worker.local", import.meta.url)),
    ...process.env,
  };
}

function decodeBase64Url(value) {
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64");
}

function decryptFernet(token, key) {
  const tokenBytes = decodeBase64Url(token);
  if (tokenBytes.length < 57 || tokenBytes[0] !== 0x80) throw new Error("invalid_fernet_token");
  const keyBytes = decodeBase64Url(key);
  if (keyBytes.length !== 32) throw new Error("invalid_fernet_key");
  const signed = tokenBytes.subarray(0, -32);
  const signature = tokenBytes.subarray(-32);
  const expected = createHmac("sha256", keyBytes.subarray(0, 16)).update(signed).digest();
  if (!timingSafeEqual(signature, expected)) throw new Error("fernet_signature_mismatch");
  const decipher = createDecipheriv("aes-128-cbc", keyBytes.subarray(16), tokenBytes.subarray(9, 25));
  return Buffer.concat([decipher.update(tokenBytes.subarray(25, -32)), decipher.final()]).toString("utf8");
}

async function main() {
  const [instanceId] = process.argv.slice(2);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(instanceId || "")) {
    throw new Error("usage: node scripts/inspect-instagram-challenge.mjs <instance-id>");
  }
  const environment = loadEnvironment();
  if (!environment.SUPABASE_URL || !environment.SUPABASE_SERVICE_ROLE_KEY || !environment.CONNECTOR_ENCRYPTION_KEY) {
    throw new Error("missing_local_connector_configuration");
  }
  const response = await fetch(
    `${environment.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/instagram_connector_sessions?select=encrypted_settings,last_error_code,updated_at&instance_id=eq.${instanceId}`,
    {
      headers: {
        apikey: environment.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${environment.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );
  if (!response.ok) throw new Error(`session_lookup_failed:${response.status}`);
  const [session] = await response.json();
  if (!session?.encrypted_settings) throw new Error("session_not_found");
  const stored = JSON.parse(decryptFernet(session.encrypted_settings, environment.CONNECTOR_ENCRYPTION_KEY));
  const pending = stored.pendingChallenge;
  const lastJson = pending?.lastJson;
  console.log(
    JSON.stringify(
      {
        sessionError: session.last_error_code ?? null,
        sessionUpdatedAt: session.updated_at ?? null,
        hasClientSettings: Boolean(stored.clientSettings),
        pendingChallenge: pending
          ? {
              mode: pending.mode ?? null,
              resume: pending.resume ?? null,
              lastJsonKeys: lastJson && typeof lastJson === "object" ? Object.keys(lastJson).sort() : [],
              hasBloksAction: Boolean(lastJson?.bloks_action),
              hasChallengeContext: Boolean(lastJson?.challenge_context),
              nestedChallenge: lastJson?.challenge && typeof lastJson.challenge === "object"
                ? {
                    apiPath: lastJson.challenge.api_path ?? null,
                    nativeFlow: lastJson.challenge.native_flow === true,
                    hasChallengeContext: Boolean(lastJson.challenge.challenge_context),
                  }
                : null,
            }
          : null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "challenge_inspection_failed");
  process.exitCode = 1;
});
