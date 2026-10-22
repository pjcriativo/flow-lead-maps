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

test("obtains the real contact avatar from the installed Evolution GO endpoint", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  let request: { url: string; apiKey: string | null; body: unknown } | null = null;
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  globalThis.fetch = async (input, init) => {
    request = {
      url: String(input),
      apiKey: new Headers(init?.headers).get("apikey"),
      body: JSON.parse(String(init?.body)),
    };
    return Response.json({
      message: "success",
      data: {
        URL: "https://pps.whatsapp.net/v/contact-photo.jpg",
        ID: "picture-42",
        Type: "image",
      },
    });
  };

  try {
    const { obterAvatarInstancia } = await import("./wa.ts");
    assert.deepEqual(await obterAvatarInstancia("tenant-instance-token", "5511999999999"), {
      url: "https://pps.whatsapp.net/v/contact-photo.jpg",
      id: "picture-42",
      found: true,
    });
    assert.deepEqual(request, {
      url: "https://evolution.invalid/user/avatar",
      apiKey: "tenant-instance-token",
      // JID canônico: número cru faria a Evolution montar "+55...@s.whatsapp.net" e o
      // WhatsApp nunca responder ("info query timed out").
      body: { number: "5511999999999@s.whatsapp.net", preview: true },
    });
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

test("canonical WhatsApp JID never carries the leading plus that breaks raw protocol queries", async () => {
  const { jidCanonicoWhatsapp } = await import("./wa.ts");
  assert.equal(jidCanonicoWhatsapp("554195404998"), "554195404998@s.whatsapp.net");
  assert.equal(jidCanonicoWhatsapp("+55 (41) 9540-4998"), "554195404998@s.whatsapp.net");
  assert.equal(jidCanonicoWhatsapp("+554195404998@s.whatsapp.net"), "554195404998@s.whatsapp.net");
  assert.equal(
    jidCanonicoWhatsapp("554195404998:12@s.whatsapp.net"),
    "554195404998@s.whatsapp.net",
  );
  assert.equal(jidCanonicoWhatsapp("123456789012345@lid"), "123456789012345@lid");
  assert.equal(jidCanonicoWhatsapp("   "), null);
});

test("a contact who hides the profile picture is a definitive 'no photo', not a provider failure", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  try {
    const { obterAvatarInstancia } = await import("./wa.ts");
    globalThis.fetch = async () =>
      Response.json(
        { error: "the user has hidden their profile picture from you" },
        { status: 500 },
      );
    assert.deepEqual(await obterAvatarInstancia("tenant-instance-token", "5511999999999"), {
      url: null,
      id: null,
      found: false,
    });
    // Texto real devolvido pela Evolution GO 0.7.2 em produção para contato sem foto.
    globalThis.fetch = async () =>
      Response.json(
        { error: "that user or group does not have a profile picture" },
        { status: 500 },
      );
    assert.deepEqual(await obterAvatarInstancia("tenant-instance-token", "5511999999999"), {
      url: null,
      id: null,
      found: false,
    });
    globalThis.fetch = async () =>
      Response.json({ error: "info query timed out" }, { status: 500 });
    await assert.rejects(obterAvatarInstancia("tenant-instance-token", "5511999999999"));
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

// Protocolo de pareamento (lido no fonte da Evolution GO 0.7.x): /instance/connect só agenda o
// StartClient em goroutine; /instance/qr e /instance/pair chamados antes de o cliente existir
// iniciam um SEGUNDO cliente (pool de Postgres duplicado → "too many clients already" → cliente
// morto → "no QR code available" para sempre). Invariantes abaixo: status → connect (só se
// preciso) → esperar Connected → só então QR/código; sessão morta é classificada como
// recuperável; sessão logada NUNCA é reiniciada.
const FAST_TIMING = { prazoSessaoMs: 40, prazoQrMs: 40, intervaloMs: 0 };

type EvolutionRequest = { url: string; method: string; apiKey: string | null; body: string | null };

function captureEvolution(
  responder: (url: string, request: EvolutionRequest) => Response,
): EvolutionRequest[] {
  const requests: EvolutionRequest[] = [];
  globalThis.fetch = async (input, init) => {
    const request: EvolutionRequest = {
      url: String(input),
      method: init?.method ?? "GET",
      apiKey: new Headers(init?.headers).get("apikey"),
      body: typeof init?.body === "string" ? init.body : null,
    };
    requests.push(request);
    return responder(request.url, request);
  };
  return requests;
}

function statusResponse(connected: boolean, loggedIn = false): Response {
  return Response.json({ message: "success", data: { Connected: connected, LoggedIn: loggedIn } });
}

function withEvolutionEnv() {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
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
  return () => {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  };
}

test("qrInstancia only requests the QR after the session reports Connected", async () => {
  const restore = withEvolutionEnv();
  let connectCalled = false;
  const requests = captureEvolution((url) => {
    if (url.endsWith("/instance/status")) return statusResponse(connectCalled);
    if (url.endsWith("/instance/connect")) {
      connectCalled = true;
      return Response.json({ message: "success", data: { jid: "", eventString: "MESSAGE" } });
    }
    if (url.endsWith("/instance/qr")) {
      return Response.json({ message: "success", data: { Qrcode: PNG_BASE64 } });
    }
    throw new Error(`unexpected request ${url}`);
  });

  try {
    const { qrInstancia } = await import("./wa.ts");
    assert.equal(
      await qrInstancia("tenant-instance-token", FAST_TIMING),
      `data:image/png;base64,${PNG_BASE64}`,
    );
    assert.deepEqual(requests, [
      {
        url: "https://evolution.invalid/instance/status",
        method: "GET",
        apiKey: "tenant-instance-token",
        body: null,
      },
      {
        url: "https://evolution.invalid/instance/connect",
        method: "POST",
        apiKey: "tenant-instance-token",
        body: JSON.stringify({ subscribe: ["MESSAGE", "READ_RECEIPT", "CONNECTION", "QRCODE"] }),
      },
      {
        url: "https://evolution.invalid/instance/status",
        method: "GET",
        apiKey: "tenant-instance-token",
        body: null,
      },
      {
        url: "https://evolution.invalid/instance/qr",
        method: "GET",
        apiKey: "tenant-instance-token",
        body: null,
      },
    ]);
  } finally {
    restore();
  }
});

test("qrInstancia reuses a live pairing session instead of starting a second client", async () => {
  const restore = withEvolutionEnv();
  const requests = captureEvolution((url) => {
    if (url.endsWith("/instance/status")) return statusResponse(true);
    if (url.endsWith("/instance/qr")) {
      return Response.json({ message: "success", data: { Qrcode: PNG_BASE64 } });
    }
    throw new Error(`unexpected request ${url}`);
  });

  try {
    const { qrInstancia } = await import("./wa.ts");
    assert.equal(
      await qrInstancia("tenant-instance-token", FAST_TIMING),
      `data:image/png;base64,${PNG_BASE64}`,
    );
    assert.deepEqual(
      requests.map((request) => request.url),
      ["https://evolution.invalid/instance/status", "https://evolution.invalid/instance/qr"],
    );
  } finally {
    restore();
  }
});

test("qrInstancia never touches /instance/qr while the session stays disconnected and flags it as recoverable", async () => {
  const restore = withEvolutionEnv();
  const requests = captureEvolution((url) => {
    if (url.endsWith("/instance/status")) return statusResponse(false);
    if (url.endsWith("/instance/connect")) {
      return Response.json({ message: "success", data: { jid: "", eventString: "MESSAGE" } });
    }
    throw new Error(`unexpected request ${url}`);
  });

  try {
    const { qrInstancia, EvolutionGoPairingError, pareamentoRecuperavel } = await import("./wa.ts");
    await assert.rejects(qrInstancia("tenant-instance-token", FAST_TIMING), (error: unknown) => {
      assert.ok(error instanceof EvolutionGoPairingError);
      assert.equal(error.code, "session_not_connected");
      assert.equal(error.status, 409);
      assert.equal(pareamentoRecuperavel(error), true);
      return true;
    });
    assert.equal(requests.filter((request) => request.url.endsWith("/instance/qr")).length, 0);
    assert.equal(requests.filter((request) => request.url.endsWith("/instance/connect")).length, 1);
  } finally {
    restore();
  }
});

test("qrInstancia refuses to restart a session that is already logged in", async () => {
  const restore = withEvolutionEnv();
  const requests = captureEvolution((url) => {
    if (url.endsWith("/instance/status")) return statusResponse(true, true);
    throw new Error(`unexpected request ${url}`);
  });

  try {
    const { qrInstancia, EvolutionGoPairingError, pareamentoRecuperavel } = await import("./wa.ts");
    await assert.rejects(qrInstancia("tenant-instance-token", FAST_TIMING), (error: unknown) => {
      assert.ok(error instanceof EvolutionGoPairingError);
      assert.equal(error.code, "already_logged_in");
      assert.equal(pareamentoRecuperavel(error), false);
      return true;
    });
    assert.deepEqual(
      requests.map((request) => request.url),
      ["https://evolution.invalid/instance/status"],
    );
  } finally {
    restore();
  }
});

test("obterOuCriarEObterQr recreates a dead remote session once and keeps the same local row", async () => {
  const restore = withEvolutionEnv();
  const pending = {
    id: "pending-instance-id",
    org_id: "authorized-org-id",
    nome: "org-authorized-pending",
    numero: null,
    status: "aguardando",
    funcao: "disparo",
  };
  const updates: Array<{ table: string; value: Record<string, unknown> }> = [];
  const upserts: Array<{ table: string; value: Record<string, unknown> }> = [];
  const queryFor = (table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      in: () => query,
      order: () => query,
      limit: () => query,
      update: (value: Record<string, unknown>) => {
        updates.push({ table, value });
        return query;
      },
      upsert: (value: Record<string, unknown>) => {
        upserts.push({ table, value });
        return query;
      },
      maybeSingle: async () =>
        table === "wa_instancia_tokens"
          ? { data: { token: "stale-instance-token" }, error: null }
          : { data: pending, error: null },
      then: (resolve: (value: unknown) => unknown) =>
        resolve(
          table === "wa_instancias"
            ? { data: [pending], error: null }
            : { data: null, error: null },
        ),
    };
    return query;
  };
  const admin = { from: (table: string) => queryFor(table) };

  const connectedTokens = new Set<string>();
  const requests = captureEvolution((url, request) => {
    if (url.endsWith("/instance/all")) {
      return Response.json({
        message: "success",
        data: [{ id: "remote-old", name: pending.nome, token: "stale-instance-token" }],
      });
    }
    if (url.includes("/instance/info/")) {
      return Response.json({ message: "success", data: { id: "remote-old", jid: null } });
    }
    if (url.includes("/instance/logs/")) return Response.json([]);
    if (url.endsWith("/instance/status")) {
      return statusResponse(connectedTokens.has(request.apiKey ?? ""));
    }
    if (url.endsWith("/instance/connect")) {
      // A sessão antiga é um cliente morto: nunca fica Connected. A recriada conecta normalmente.
      if (request.apiKey === "fresh-instance-token") connectedTokens.add(request.apiKey);
      return Response.json({ message: "success", data: { jid: "", eventString: "MESSAGE" } });
    }
    if (url.endsWith("/instance/delete/remote-old")) return Response.json({ message: "success" });
    if (url.endsWith("/instance/create")) {
      return Response.json({ message: "success", data: { token: "fresh-instance-token" } });
    }
    if (url.endsWith("/instance/qr")) {
      return Response.json({ message: "success", data: { Qrcode: PNG_BASE64 } });
    }
    throw new Error(`unexpected request ${url}`);
  });

  try {
    const { obterOuCriarEObterQr } = await import("./wa.ts");
    const result = await obterOuCriarEObterQr(
      admin,
      { userId: "authorized-user-id", orgId: "authorized-org-id" },
      "disparo",
      FAST_TIMING,
    );

    assert.equal(result.qr, `data:image/png;base64,${PNG_BASE64}`);
    assert.equal(result.instance.id, pending.id);
    assert.equal(result.instance.token, "fresh-instance-token");

    const deleteIndex = requests.findIndex((request) =>
      request.url.endsWith("/instance/delete/remote-old"),
    );
    const createIndex = requests.findIndex((request) => request.url.endsWith("/instance/create"));
    assert.ok(
      deleteIndex >= 0 && createIndex > deleteIndex,
      "recreates after deleting the dead session",
    );
    assert.equal(requests[deleteIndex].method, "DELETE");
    assert.equal(requests[deleteIndex].apiKey, "global-key");
    assert.equal(JSON.parse(requests[createIndex].body ?? "{}").name, pending.nome);
    // Um único connect por sessão: nunca empilha StartClient na mesma instância.
    assert.deepEqual(
      requests
        .filter((request) => request.url.endsWith("/instance/connect"))
        .map((request) => request.apiKey),
      ["stale-instance-token", "fresh-instance-token"],
    );
    // QR só foi pedido à sessão recriada, com o token novo.
    assert.deepEqual(
      requests.filter((request) => request.url.endsWith("/instance/qr")).map((r) => r.apiKey),
      ["fresh-instance-token"],
    );
    // Mesma linha local: token trocado, nada arquivado.
    assert.deepEqual(
      upserts.map((entry) => [entry.table, entry.value.instancia_id, entry.value.token]),
      [["wa_instancia_tokens", pending.id, "fresh-instance-token"]],
    );
    assert.equal(
      updates.some((entry) => "deleted_at" in entry.value),
      false,
    );
    assert.equal(
      updates.some(
        (entry) => entry.table === "wa_instancias" && entry.value.status === "aguardando",
      ),
      true,
    );
  } finally {
    restore();
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
      is: () => query,
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

test("pairInstancia requests the eight-digit code only after the session reports Connected", async () => {
  const restore = withEvolutionEnv();
  let connectCalled = false;
  const requests = captureEvolution((url) => {
    if (url.endsWith("/instance/status")) return statusResponse(connectCalled);
    if (url.endsWith("/instance/connect")) {
      connectCalled = true;
      return Response.json({ message: "success", data: { jid: "", eventString: "MESSAGE" } });
    }
    if (url.endsWith("/instance/pair")) {
      return Response.json({ message: "success", data: { PairingCode: "ABCD1234" } });
    }
    throw new Error(`unexpected request ${url}`);
  });

  try {
    const { pairInstancia } = await import("./wa.ts");
    assert.equal(
      await pairInstancia("tenant-instance-token", "5511999999999", FAST_TIMING),
      "ABCD1234",
    );
    assert.deepEqual(
      requests.map((request) => [request.method, request.url, request.apiKey]),
      [
        ["GET", "https://evolution.invalid/instance/status", "tenant-instance-token"],
        ["POST", "https://evolution.invalid/instance/connect", "tenant-instance-token"],
        ["GET", "https://evolution.invalid/instance/status", "tenant-instance-token"],
        ["POST", "https://evolution.invalid/instance/pair", "tenant-instance-token"],
      ],
    );
    assert.equal(JSON.parse(requests[3].body ?? "{}").phone, "5511999999999");
  } finally {
    restore();
  }
});

test("listing chips fetches instance info for disconnected sessions and reconciles stale local state", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const updates: Array<Record<string, unknown>> = [];
  const local = {
    id: "local-instance-id",
    nome: "org-authorized-connected",
    numero: null,
    status: "conectado",
    funcao: "disparo",
    ordem: 1,
    provider_status: "connected",
    operational_health: "healthy",
    last_health_check_at: "2026-10-20T12:00:00.000Z",
    last_provider_success_at: "2026-10-20T12:00:00.000Z",
    health_failure_count: 0,
    health_error_code: null,
  };

  const selectQuery = {
    select: () => selectQuery,
    eq: () => selectQuery,
    is: () => selectQuery,
    order: () => selectQuery,
    then: (resolve: (value: unknown) => unknown) => resolve({ data: [local], error: null }),
  };
  const updateQuery = {
    eq: () => updateQuery,
    then: (resolve: (value: unknown) => unknown) => resolve({ data: null, error: null }),
  };
  const admin = {
    from: () => ({
      ...selectQuery,
      update: (value: Record<string, unknown>) => {
        updates.push(value);
        return updateQuery;
      },
    }),
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
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith("/instance/all")) {
      return Response.json({
        message: "success",
        data: [
          {
            id: "remote-instance-id",
            name: local.nome,
            connected: false,
            jid: null,
          },
        ],
      });
    }
    return Response.json({
      message: "success",
      data: {
        id: "remote-instance-id",
        name: local.nome,
        jid: "5511987654321:4@s.whatsapp.net",
      },
    });
  };

  try {
    const { listarInstanciasDaOrg } = await import("./wa.ts");
    const result = await listarInstanciasDaOrg(admin, "authorized-org-id");

    assert.equal(result[0]?.numero, "5511987654321");
    assert.equal(result[0]?.status, "desconectado");
    assert.equal(result[0]?.provider_status, "disconnected");
    assert.equal(result[0]?.operational_health, "unavailable");
    assert.equal(updates.length, 1);
    assert.equal(updates[0]?.numero, "5511987654321");
    assert.equal(updates[0]?.status, "desconectado");
    assert.deepEqual(requests, [
      "https://evolution.invalid/instance/all",
      "https://evolution.invalid/instance/info/remote-instance-id",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});

test("session recovery fails fast instead of recreating when the Evolution GO database is exhausted", async () => {
  const restore = withEvolutionEnv();
  const requests = captureEvolution((url) => {
    if (url.endsWith("/instance/status")) return statusResponse(false);
    if (url.endsWith("/instance/connect")) {
      return Response.json({ message: "success", data: { jid: "", eventString: "MESSAGE" } });
    }
    if (url.endsWith("/instance/all")) {
      return Response.json({
        message: "success",
        data: [{ id: "remote-exhausted", name: "org-authorized-exhausted", connected: false }],
      });
    }
    if (url.includes("/instance/info/")) {
      return Response.json({ message: "success", data: { id: "remote-exhausted", jid: null } });
    }
    if (url.includes("/instance/logs/remote-exhausted")) {
      return Response.json([
        {
          level: "ERROR",
          message:
            "[x] Failed to create container: failed to upgrade database: pq: sorry, too many clients already",
        },
      ]);
    }
    throw new Error(`unexpected request ${url}`);
  });
  const admin = {
    from: () => {
      throw new Error("database must not be touched when the provider is exhausted");
    },
  };
  const instance = {
    id: "authorized-instance-id",
    orgId: "authorized-org-id",
    nome: "org-authorized-exhausted",
    token: "tenant-instance-token",
    numero: null,
    status: "desconectado",
  };

  try {
    const { comSessaoRecuperavel, qrInstancia, EvolutionGoPairingError } = await import("./wa.ts");
    await assert.rejects(
      comSessaoRecuperavel(admin, instance, (inst) => qrInstancia(inst.token, FAST_TIMING)),
      (error: unknown) => {
        assert.ok(error instanceof EvolutionGoPairingError);
        assert.equal(error.code, "provider_overloaded");
        assert.equal(error.status, 503);
        return true;
      },
    );
    assert.equal(
      requests.some(
        (request) =>
          request.url.endsWith("/instance/create") || request.url.includes("/instance/delete/"),
      ),
      false,
      "never recreates (and never opens another Postgres pool) on an exhausted provider",
    );
    assert.equal(requests.filter((r) => r.url.endsWith("/instance/connect")).length, 1);
  } finally {
    restore();
  }
});

function withWebhookEnv() {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const env: Record<string, string> = {
    EVOLUTION_URL: "https://evolution.invalid",
    EVOLUTION_API_KEY: "global-key",
    SUPABASE_URL: "https://project.invalid",
    WA_WEBHOOK_SECRET: "webhook-secret",
  };
  runtime.Deno = { env: { get: (name) => env[name] } };
  return () => {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  };
}

test("pairing connect carries the inbound webhook so Evolution GO does not erase it", async () => {
  const restore = withWebhookEnv();
  let connectCalled = false;
  const bodies: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/instance/status")) {
      return Response.json({ data: { Connected: connectCalled, LoggedIn: false } });
    }
    if (url.endsWith("/instance/connect")) {
      connectCalled = true;
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json({ message: "success", data: {} });
    }
    if (url.endsWith("/instance/qr")) {
      return Response.json({ message: "success", data: { Qrcode: PNG_BASE64 } });
    }
    throw new Error(`unexpected request ${url}`);
  };
  try {
    const { qrInstancia } = await import("./wa.ts");
    await qrInstancia("tenant-instance-token", {
      prazoSessaoMs: 40,
      prazoQrMs: 40,
      intervaloMs: 0,
    });
    assert.deepEqual(bodies, [
      {
        webhookUrl: "https://project.invalid/functions/v1/wa-webhook?k=webhook-secret",
        subscribe: ["MESSAGE", "READ_RECEIPT", "CONNECTION", "QRCODE"],
      },
    ]);
  } finally {
    restore();
  }
});

test("webhook reconciliation only touches connected instances that lost the webhook, and proves it", async () => {
  const restore = withWebhookEnv();
  const alvo = "https://project.invalid/functions/v1/wa-webhook?k=webhook-secret";
  const remotas = [
    {
      id: "r1",
      name: "chip-sem-webhook",
      token: "t1",
      connected: true,
      webhook: "",
      events: "MESSAGE",
    },
    {
      id: "r2",
      name: "chip-ok",
      token: "t2",
      connected: true,
      webhook: alvo,
      events: "MESSAGE,READ_RECEIPT,CONNECTION",
    },
    { id: "r3", name: "chip-desconectado", token: "t3", connected: false, webhook: "", events: "" },
    {
      id: "r4",
      name: "chip-de-outro-sistema",
      token: "t4",
      connected: true,
      webhook: "",
      events: "",
    },
  ];
  const connects: Array<{ apiKey: string | null; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const apiKey = new Headers(init?.headers).get("apikey");
    if (url.endsWith("/instance/all")) return Response.json({ message: "success", data: remotas });
    if (url.includes("/instance/info/")) return Response.json({ data: { jid: null } });
    if (url.endsWith("/instance/connect")) {
      connects.push({ apiKey, body: JSON.parse(String(init?.body)) });
      const remota = remotas.find((item) => item.token === apiKey);
      if (remota) {
        remota.webhook = alvo;
        remota.events = "MESSAGE,READ_RECEIPT,CONNECTION";
      }
      return Response.json({ message: "success", data: {} });
    }
    if (url.endsWith("/instance/status")) {
      return Response.json({ data: { Connected: true, LoggedIn: true } });
    }
    throw new Error(`unexpected request ${url}`);
  };
  const admin = {
    from: () => {
      const q = {
        select: () => q,
        is: () => q,
        then: (resolve: (value: unknown) => unknown) =>
          resolve({
            data: [
              { nome: "chip-sem-webhook" },
              { nome: "chip-ok" },
              { nome: "chip-desconectado" },
            ],
            error: null,
          }),
      };
      return q;
    },
  };
  try {
    const { reconciliarWebhooks } = await import("./wa.ts");
    const resultado = await reconciliarWebhooks(admin, { aplicar: true });
    assert.deepEqual(
      resultado.map((item) => [item.nome, item.situacao]),
      [
        ["chip-sem-webhook", "configurado"],
        ["chip-ok", "ja_configurado"],
        ["chip-desconectado", "ignorado"],
      ],
    );
    // Só o chip conectado e sem webhook recebeu /instance/connect, com o token dele, sem QRCODE.
    assert.deepEqual(connects, [
      {
        apiKey: "t1",
        body: {
          webhookUrl: alvo,
          subscribe: ["MESSAGE", "READ_RECEIPT", "CONNECTION"],
          immediate: false,
        },
      },
    ]);
  } finally {
    restore();
  }
});
