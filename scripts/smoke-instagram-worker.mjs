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

const local = parseEnv(
  readFileSync(new URL("../.env.instagram-worker.local", import.meta.url), "utf8"),
);
const base = "https://flow-business-instagram-connector.vercel.app";
const health = await fetch(`${base}/v1/health`).then((response) => response.json());
assert.equal(health.status, "ok");

const body = "{}";
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = createHmac("sha256", local.CONNECTOR_SHARED_SECRET)
  .update(`${timestamp}.${body}`)
  .digest("hex");
const signed = await fetch(`${base}/v1/connect`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Flow-Timestamp": timestamp,
    "X-Flow-Signature": signature,
  },
  body,
});
assert.equal(signed.status, 422, "assinatura válida deve alcançar a validação do payload");

const gateway = await fetch(
  "https://lyitsavnqwtsoouhcjie.supabase.co/functions/v1/flow-business-session",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "connect" }),
  },
);
assert.equal(gateway.status, 401, "gateway deve rejeitar chamadas sem sessão do usuário");
console.log("OK: worker assinado, validação de payload e gateway autenticado verificados.");
