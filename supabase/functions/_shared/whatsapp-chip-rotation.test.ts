// Suite: rodízio de chips de disparo do WhatsApp.
// Invariante: nenhum envio sai por chip sem saúde comprovada; um chip indisponível nunca trava a
// fila enquanto houver outro chip de disparo saudável; contingência humana tem precedência.
// Boundary IN: decisão pura de escolha. Boundary OUT: I/O do worker e da Evolution GO.
import test from "node:test";
import assert from "node:assert/strict";
import {
  chipsParaRevalidar,
  escolherChipParaEnvio,
  type ChipRotacao,
} from "./whatsapp-chip-rotation.ts";

const AGORA = Date.parse("2026-10-21T15:00:00.000Z");
const FRESCO = new Date(AGORA - 60_000).toISOString();
const VELHO = new Date(AGORA - 10 * 60_000).toISOString();
const RECENTE = new Date(AGORA - 30_000).toISOString();
const TETO = 40;

function chip(id: string, overrides: Partial<ChipRotacao> = {}): ChipRotacao {
  return {
    id,
    status: "conectado",
    funcao: "disparo",
    numero: "5541999990000",
    provider_status: "connected",
    operational_health: "healthy",
    last_provider_success_at: FRESCO,
    last_health_check_at: FRESCO,
    ordem: Number(id.replace(/\D/g, "")) || 0,
    enviosHoje: 0,
    ...overrides,
  };
}

test("keeps the lead on its original chip while that chip is healthy and under the daily cap", () => {
  const escolha = escolherChipParaEnvio({
    chipOriginalId: "chip-1",
    backupContingenciaId: null,
    chips: [chip("chip-1", { enviosHoje: 39 }), chip("chip-2")],
    teto: TETO,
    agora: AGORA,
  });
  assert.deepEqual(escolha, { chipId: "chip-1", motivo: "chip_original", trocou: false });
});

test("rotates to the least used healthy dispatch chip when the original chip drops", () => {
  const escolha = escolherChipParaEnvio({
    chipOriginalId: "chip-1",
    backupContingenciaId: null,
    chips: [
      chip("chip-1", { provider_status: "disconnected", operational_health: "unavailable" }),
      chip("chip-2", { enviosHoje: 12 }),
      chip("chip-3", { enviosHoje: 3 }),
    ],
    teto: TETO,
    agora: AGORA,
  });
  assert.deepEqual(escolha, { chipId: "chip-3", motivo: "rodizio", trocou: true });
});

test("rotates when the original chip reaches the daily cap instead of parking the delivery", () => {
  const escolha = escolherChipParaEnvio({
    chipOriginalId: "chip-1",
    backupContingenciaId: null,
    chips: [chip("chip-1", { enviosHoje: TETO }), chip("chip-2", { enviosHoje: 5 })],
    teto: TETO,
    agora: AGORA,
  });
  assert.deepEqual(escolha, { chipId: "chip-2", motivo: "rodizio", trocou: true });
});

test("never rotates into burned, unpaired, conversation-only or stale chips", () => {
  const escolha = escolherChipParaEnvio({
    chipOriginalId: "chip-1",
    backupContingenciaId: null,
    chips: [
      chip("chip-1", { status: "queimada" }),
      chip("chip-2", { numero: null }),
      chip("chip-3", { funcao: "conversa" }),
      chip("chip-4", { last_provider_success_at: VELHO }),
      chip("chip-5", { enviosHoje: TETO }),
    ],
    teto: TETO,
    agora: AGORA,
  });
  assert.equal(escolha.chipId, null);
  assert.equal(escolha.motivo, "sem_chip_disponivel");
  assert.deepEqual(escolha.chipId === null && escolha.bloqueios, {
    "chip-1": "status_nao_conectado",
    "chip-2": "sem_numero_pareado",
    "chip-3": "status_nao_conectado",
    "chip-4": "saude_desatualizada",
    "chip-5": "teto_diario",
  });
});

test("an authorized contingency sends through its backup even if the source still looks healthy", () => {
  const escolha = escolherChipParaEnvio({
    chipOriginalId: "chip-1",
    backupContingenciaId: "chip-9",
    // O backup pode ser um chip de conversa: a contingência é uma decisão humana explícita.
    chips: [chip("chip-1"), chip("chip-9", { funcao: "conversa" })],
    teto: TETO,
    agora: AGORA,
  });
  assert.deepEqual(escolha, { chipId: "chip-9", motivo: "contingencia", trocou: true });
});

test("when the contingency backup also fails, rotation skips the declared-out source chip", () => {
  const escolha = escolherChipParaEnvio({
    chipOriginalId: "chip-1",
    backupContingenciaId: "chip-9",
    chips: [chip("chip-1"), chip("chip-9", { status: "queimada" }), chip("chip-2")],
    teto: TETO,
    agora: AGORA,
  });
  assert.deepEqual(escolha, { chipId: "chip-2", motivo: "rodizio", trocou: true });
});

test("only connected chips with stale or bad health are revalidated, at most once per minute", () => {
  const ids = chipsParaRevalidar(
    [
      chip("chip-1"),
      chip("chip-2", { last_provider_success_at: VELHO, last_health_check_at: VELHO }),
      chip("chip-3", { operational_health: "unavailable", last_health_check_at: VELHO }),
      chip("chip-4", { last_provider_success_at: VELHO, last_health_check_at: RECENTE }),
      chip("chip-5", { status: "queimada", last_health_check_at: VELHO }),
      chip("chip-6", { numero: null, last_health_check_at: VELHO }),
      chip("chip-7", { status: "desconectado", last_health_check_at: VELHO }),
      chip("chip-8", { status: "desconectado", numero: null, last_health_check_at: VELHO }),
      chip("chip-9", { status: "aguardando", last_health_check_at: VELHO }),
    ],
    TETO,
    AGORA,
  );
  // chip-7: pareado e marcado desconectado — pode ter voltado sozinho.
  assert.deepEqual(ids, ["chip-2", "chip-3", "chip-7"]);
});

test("live selection honours an active contingency and revalidates a stale chip before using it", async () => {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get(name: string): string | undefined } };
  };
  const originalDeno = runtime.Deno;
  const originalFetch = globalThis.fetch;
  const agora = Date.now();
  const fresco = new Date(agora - 30_000).toISOString();
  const velho = new Date(agora - 10 * 60_000).toISOString();
  const linhas: Record<string, Record<string, unknown>> = {
    "chip-1": { ...chip("chip-1"), last_provider_success_at: fresco, last_health_check_at: fresco },
    "chip-9": {
      ...chip("chip-9", { funcao: "conversa" }),
      // Backup com saúde velha: só pode assumir depois de uma checagem ao vivo.
      last_provider_success_at: velho,
      last_health_check_at: velho,
    },
  };
  for (const row of Object.values(linhas)) delete row.enviosHoje;
  const rpcs: Array<{ name: string; args: Record<string, unknown> }> = [];
  const query = (table: string) => {
    let filtroId: string | null = null;
    const q = {
      select: () => q,
      eq: (column: string, value: unknown) => {
        if (column === "id" || column === "instancia_id") filtroId = String(value);
        return q;
      },
      is: () => q,
      in: () => q,
      gte: () => q,
      limit: () => q,
      maybeSingle: async () => {
        if (table === "wa_contingencias")
          return { data: { backup_instance_id: "chip-9" }, error: null };
        if (table === "wa_instancia_tokens")
          return { data: { token: `token-${filtroId}` }, error: null };
        return {
          data: filtroId ? { ...linhas[filtroId], org_id: "org-1", nome: filtroId } : null,
          error: null,
        };
      },
      then: (resolve: (value: unknown) => unknown) =>
        resolve(
          table === "wa_envios"
            ? { data: [], error: null }
            : { data: Object.values(linhas).map((row) => ({ ...row })), error: null },
        ),
    };
    return q;
  };
  const admin = {
    from: (table: string) => query(table),
    rpc: async (name: string, args: Record<string, unknown>) => {
      rpcs.push({ name, args });
      if (name === "wa_apply_instance_observation" && args.p_success) {
        const row = linhas[String(args.p_instance)];
        row.provider_status = args.p_provider_status;
        row.operational_health = args.p_operational_health;
        row.last_provider_success_at = args.p_observed_at;
        row.last_health_check_at = args.p_observed_at;
      }
      return { data: true, error: null };
    },
  };
  runtime.Deno = {
    env: { get: (name) => (name === "EVOLUTION_URL" ? "https://evolution.invalid" : undefined) },
  };
  const statusChamados: string[] = [];
  globalThis.fetch = async (input, init) => {
    statusChamados.push(`${String(input)}|${new Headers(init?.headers).get("apikey")}`);
    return Response.json({
      message: "success",
      data: { Connected: true, LoggedIn: true, Jid: "5541999990000:1@s.whatsapp.net" },
    });
  };

  try {
    const { selecionarChipParaEnvio } = await import("./wa.ts");
    const { escolha, revalidados } = await selecionarChipParaEnvio(admin, "org-1", "chip-1", agora);
    assert.deepEqual(revalidados, ["chip-9"]);
    assert.deepEqual(statusChamados, ["https://evolution.invalid/instance/status|token-chip-9"]);
    assert.equal(
      rpcs.find((call) => call.name === "wa_apply_instance_observation")?.args.p_source,
      "worker",
    );
    assert.deepEqual(escolha, { chipId: "chip-9", motivo: "contingencia", trocou: true });
  } finally {
    globalThis.fetch = originalFetch;
    runtime.Deno = originalDeno;
  }
});
