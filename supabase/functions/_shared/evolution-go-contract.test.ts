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

test("normalizes the lowercase payload documented by current Evolution GO", () => {
  assert.equal(
    normalizeEvolutionGoQr({ data: { qrcode: "2@ref,key,secret,adv", code: PNG_BASE64 } }),
    `data:image/png;base64,${PNG_BASE64}`,
  );
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

test("qrInstancia starts the instance before requesting its QR", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string;
    apiKey: string | null;
    body: string | null;
  }> = [];
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
      apiKey: new Headers(init?.headers).get("apikey"),
      body: typeof init?.body === "string" ? init.body : null,
    });
    if (String(input).endsWith("/instance/connect")) {
      return Response.json({ message: "success", data: {} });
    }
    return Response.json({ message: "success", data: { Qrcode: PNG_BASE64 } });
  };

  try {
    const { qrInstancia } = await import("./wa.ts");
    assert.equal(await qrInstancia("tenant-instance-token"), `data:image/png;base64,${PNG_BASE64}`);
    assert.deepEqual(requests, [
      {
        url: "https://evolution.invalid/instance/connect",
        method: "POST",
        apiKey: "tenant-instance-token",
        body: JSON.stringify({ subscribe: ["MESSAGE", "CONNECTION", "QRCODE"] }),
      },
      {
        url: "https://evolution.invalid/instance/qr",
        method: "GET",
        apiKey: "tenant-instance-token",
        body: null,
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

test("pairing preparation reuses the newest unpaired instance from the authorized organization", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const pending = {
    id: "pending-instance-id",
    org_id: "authorized-org-id",
    nome: "org-authorized-pending",
    numero: null,
    status: "aguardando",
    funcao: "disparo",
  };
  const queriedTables: string[] = [];
  const chain = (result: unknown) => {
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      in: () => query,
      order: () => query,
      limit: () => query,
      maybeSingle: async () => result,
    };
    return query;
  };
  const admin = {
    from: (table: string) => {
      queriedTables.push(table);
      return table === "wa_instancias"
        ? chain({ data: pending, error: null })
        : chain({ data: { token: "existing-instance-token" }, error: null });
    },
  };

  runtime.Deno = {
    env: {
      get: (name) =>
        name === "EVOLUTION_URL"
          ? "https://evolution.invalid"
          : name === "EVOLUTION_API_KEY"
            ? "global-key"
            : undefined,
    },
  };
  globalThis.fetch = async () =>
    Response.json({
      data: [{ name: pending.nome, token: "existing-instance-token" }],
    });

  try {
    const { obterOuCriarInstanciaParaPareamento } = await import("./wa.ts");
    const result = await obterOuCriarInstanciaParaPareamento(
      admin,
      { userId: "authorized-user-id", orgId: "authorized-org-id" },
      "disparo",
    );

    assert.deepEqual(result, {
      id: pending.id,
      orgId: pending.org_id,
      nome: pending.nome,
      token: "existing-instance-token",
      numero: null,
      status: "aguardando",
      funcao: "disparo",
    });
    assert.deepEqual(queriedTables, ["wa_instancias", "wa_instancia_tokens"]);
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

test("pairing preparation recreates a missing remote session in the same database row", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const pending = {
    id: "pending-instance-id",
    org_id: "authorized-org-id",
    nome: "org-authorized-pending",
    numero: null,
    status: "aguardando",
    funcao: "disparo",
  };
  const upserts: unknown[] = [];
  const updates: unknown[] = [];
  const queryFor = (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      in: () => query,
      order: () => query,
      limit: () => query,
      update: (value: unknown) => {
        updates.push(value);
        return query;
      },
      upsert: (value: unknown) => {
        upserts.push(value);
        return query;
      },
      maybeSingle: async () =>
        table === "wa_instancias"
          ? { data: pending, error: null }
          : { data: { token: "stale-instance-token" }, error: null },
    };
    return query;
  };
  const admin = { from: (table: string) => queryFor(table) };
  const requests: Array<{ url: string; method: string; body: string | null }> = [];

  runtime.Deno = {
    env: {
      get: (name) =>
        name === "EVOLUTION_URL"
          ? "https://evolution.invalid"
          : name === "EVOLUTION_API_KEY"
            ? "global-key"
            : undefined,
    },
  };
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : null,
    });
    if ((init?.method ?? "GET") === "GET") return Response.json({ data: [] });
    return Response.json({ data: { token: "fresh-instance-token" } });
  };

  try {
    const { obterOuCriarInstanciaParaPareamento } = await import("./wa.ts");
    const result = await obterOuCriarInstanciaParaPareamento(
      admin,
      { userId: "authorized-user-id", orgId: "authorized-org-id" },
      "disparo",
    );

    assert.equal(result?.id, pending.id);
    assert.equal(result?.token, "fresh-instance-token");
    assert.equal(result?.status, "desconectado");
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0], {
      url: "https://evolution.invalid/instance/all",
      method: "GET",
      body: null,
    });
    assert.equal(requests[1].url, "https://evolution.invalid/instance/create");
    assert.equal(requests[1].method, "POST");
    const createdBody = JSON.parse(requests[1].body ?? "{}");
    assert.equal(createdBody.name, pending.nome);
    assert.match(createdBody.token, /^[0-9a-f-]{36}$/);
    assert.equal(upserts.length, 1);
    assert.deepEqual(upserts[0], {
      instancia_id: pending.id,
      token: "fresh-instance-token",
      atualizado_em: upserts[0] && (upserts[0] as { atualizado_em: string }).atualizado_em,
    });
    assert.equal(updates.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

test("direct QR retry recreates an authorized instance whose remote session disappeared", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const instance = {
    id: "authorized-instance-id",
    org_id: "authorized-org-id",
    nome: "org-authorized-existing",
    numero: null,
    status: "desconectado",
    funcao: "disparo",
  };
  const upserts: unknown[] = [];
  const updates: unknown[] = [];
  const queryFor = (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      update: (value: unknown) => {
        updates.push(value);
        return query;
      },
      upsert: (value: unknown) => {
        upserts.push(value);
        return query;
      },
      maybeSingle: async () =>
        table === "wa_instancias"
          ? { data: instance, error: null }
          : { data: { token: "stale-instance-token" }, error: null },
    };
    return query;
  };
  const admin = { from: (table: string) => queryFor(table) };
  const requests: Array<{ url: string; method: string }> = [];

  runtime.Deno = {
    env: {
      get: (name) =>
        name === "EVOLUTION_URL"
          ? "https://evolution.invalid"
          : name === "EVOLUTION_API_KEY"
            ? "global-key"
            : undefined,
    },
  };
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method ?? "GET" });
    if ((init?.method ?? "GET") === "GET") return Response.json({ data: [] });
    return Response.json({ data: { token: "fresh-instance-token" } });
  };

  try {
    const { instanciaDaOrgComToken } = await import("./wa.ts");
    const result = await instanciaDaOrgComToken(
      admin,
      "authorized-org-id",
      "authorized-instance-id",
      true,
    );

    assert.equal(result?.id, instance.id);
    assert.equal(result?.token, "fresh-instance-token");
    assert.deepEqual(requests, [
      { url: "https://evolution.invalid/instance/all", method: "GET" },
      { url: "https://evolution.invalid/instance/create", method: "POST" },
    ]);
    assert.equal(upserts.length, 1);
    assert.equal(updates.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

test("pairInstancia starts the instance before requesting the eight-digit code", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string }> = [];
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method ?? "GET" });
    if (String(input).endsWith("/instance/connect")) {
      return Response.json({ message: "success", data: {} });
    }
    return Response.json({ message: "success", data: { PairingCode: "ABCD1234" } });
  };

  try {
    const { pairInstancia } = await import("./wa.ts");
    assert.equal(await pairInstancia("tenant-instance-token", "5511999999999"), "ABCD1234");
    assert.deepEqual(requests, [
      { url: "https://evolution.invalid/instance/connect", method: "POST" },
      { url: "https://evolution.invalid/instance/pair", method: "POST" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});
