import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "")]),
  );
}

const instanceId = process.argv[2]?.trim().toLowerCase();
assert.match(
  instanceId ?? "",
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  "uso: node scripts/smoke-instagram-manual-verification.mjs <instance-id>",
);
const secrets = parseEnv(
  readFileSync(new URL("../.env.instagram-worker.local", import.meta.url), "utf8"),
);
const body = JSON.stringify({ requestId: "manual-verification-smoke", instanceId });
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = createHmac("sha256", secrets.CONNECTOR_SHARED_SECRET)
  .update(`${timestamp}.${body}`)
  .digest("hex");
const response = await fetch(
  "https://flow-business-instagram-connector.vercel.app/v1/manual-verification",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flow-Timestamp": timestamp,
      "X-Flow-Signature": signature,
    },
    body,
  },
);
const payload = await response.json();
assert.equal(response.status, 200);
assert.match(payload?.challengeUrl ?? "", /^https:\/\/www\.instagram\.com\/challenge\//);
console.log("OK: a validação manual está disponível sem login ou ação no Instagram.");
