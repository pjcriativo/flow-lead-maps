// Suite: Evolution GO QR response contract.
// Invariant: only a real provider PNG becomes a browser-safe QR image source.
// Boundary IN: provider payload parsing and Data URI normalization.
// Boundary OUT: Evolution GO transport and React rendering.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEvolutionGoQr } from "../../../src/lib/evolution-go-qr.ts";

const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

test("normalizes the installed Evolution GO data.Qrcode PNG base64 response", () => {
  assert.equal(
    normalizeEvolutionGoQr({ message: "success", data: { Qrcode: PNG_BASE64 } }),
    `data:image/png;base64,${PNG_BASE64}`,
  );
});

test("preserves an already normalized PNG Data URI", () => {
  const dataUri = `data:image/png;base64,${PNG_BASE64}`;
  assert.equal(normalizeEvolutionGoQr({ data: { Qrcode: dataUri } }), dataUri);
});

test("rejects textual pairing content and untrusted URLs as image sources", () => {
  assert.equal(normalizeEvolutionGoQr({ data: { Qrcode: "2@ref,key,secret,adv" } }), null);
  assert.equal(
    normalizeEvolutionGoQr({ data: { Qrcode: "https://attacker.invalid/qr.png" } }),
    null,
  );
});

test("does not mistake data.Code for the PNG returned by the installed API", () => {
  assert.equal(normalizeEvolutionGoQr({ data: { Code: "2@ref,key,secret,adv" } }), null);
});

test("qrInstancia requests the installed endpoint with the instance token and returns a Data URI", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  let request: { url: string; apiKey: string | null } | null = null;
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  globalThis.fetch = async (input, init) => {
    request = {
      url: String(input),
      apiKey: new Headers(init?.headers).get("apikey"),
    };
    return Response.json({ message: "success", data: { Qrcode: PNG_BASE64 } });
  };

  try {
    const { qrInstancia } = await import("./wa.ts");
    assert.equal(await qrInstancia("tenant-instance-token"), `data:image/png;base64,${PNG_BASE64}`);
    assert.deepEqual(request, {
      url: "https://evolution.invalid/instance/qr",
      apiKey: "tenant-instance-token",
    });
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});
