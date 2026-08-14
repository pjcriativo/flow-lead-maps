#!/usr/bin/env node
// Suite: rodizio Apify pago em producao
// Invariant: ao retirar a primeira conta financeira, uma unica busca paga usa a proxima
// conta, grava um lead e seu custo, e o estado simulado e restaurado.
// Boundary IN: production edge, DB, Apify Actor, pool selection, ledger.
// Boundary OUT: automatic live 402 exhaustion (covered by scripts/test-apify-pool-rotation.mjs).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJECT_ROOT = process.cwd();
const require = createRequire(join(PROJECT_ROOT, "package.json"));
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const contents = readFileSync(join(PROJECT_ROOT, ".env"), "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    let value = match[2].trim();
    if (/^['"].*['"]$/.test(value)) value = value.slice(1, -1);
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

function required(name, value) {
  if (!value) throw new Error(`Falta ${name} no ambiente.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(message) {
  console.log(`OK  ${message}`);
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cacheKey({ nicho, cidade, uf }) {
  return [
    "apify-google-maps-v1",
    normalizeText(nicho),
    "cidade",
    normalizeText(cidade),
    normalizeText(uf),
  ].join("|");
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function databaseError(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
}

function parseNdjson(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`A Edge devolveu uma linha NDJSON invalida: ${line.slice(0, 160)}`);
      }
    });
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

loadEnv();

const SUPABASE_URL = required(
  "SUPABASE_URL/VITE_SUPABASE_URL",
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
);
const SERVICE_ROLE = required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
const ANON_KEY = required(
  "VITE_SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY",
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY,
);
const PROJECT_REF =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.SUPABASE_PROJECT_ID ??
  new URL(SUPABASE_URL).hostname.split(".")[0];
const MANAGEMENT_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const RUN_PAID = process.argv.includes("--run-paid");
const PAID_CONFIRMED = process.env.ALLOW_PAID_APIFY_TEST === "YES";
const OPTIONS = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, OPTIONS);

async function getSessionForExistingSuperAdmin() {
  const profiles = databaseError(
    await admin
      .from("profiles")
      .select("id,email,is_super_admin,acesso_liberado")
      .eq("is_super_admin", true)
      .order("created_at", { ascending: true }),
    "Falha ao localizar o super admin",
  );
  assert(profiles?.length, "Nenhum super admin existente foi encontrado.");
  const profile =
    profiles.find((row) => row.email?.toLowerCase() === "marcosg1.pereira@gmail.com") ??
    profiles[0];
  assert(profile.acesso_liberado, `O super admin ${profile.email} nao esta com acesso liberado.`);

  const existingUser = await admin.auth.admin.getUserById(profile.id);
  if (existingUser.error || !existingUser.data.user) {
    throw new Error(`O perfil ${profile.email} nao corresponde a um usuario Auth existente.`);
  }

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: profile.email });
  if (link.error || !link.data?.properties?.hashed_token) {
    throw new Error(`Falha ao gerar sessao temporaria: ${link.error?.message ?? "sem token"}`);
  }
  const anonymous = createClient(SUPABASE_URL, ANON_KEY, OPTIONS);
  const session = await anonymous.auth.verifyOtp({
    token_hash: link.data.properties.hashed_token,
    type: "magiclink",
  });
  if (session.error || !session.data.session?.access_token) {
    throw new Error(
      `Falha ao autenticar sessao temporaria: ${session.error?.message ?? "sem JWT"}`,
    );
  }

  const memberships = databaseError(
    await admin
      .from("memberships")
      .select("org_id")
      .eq("user_id", profile.id)
      .order("criada_em", { ascending: true })
      .limit(1),
    "Falha ao localizar a organizacao do super admin",
  );
  assert(memberships?.[0]?.org_id, `O super admin ${profile.email} nao possui organizacao.`);
  return {
    jwt: session.data.session.access_token,
    userId: profile.id,
    email: profile.email,
    orgId: memberships[0].org_id,
  };
}

async function adminAction(jwt, body) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-acoes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`admin-acoes respondeu HTTP ${response.status} com JSON invalido.`);
  }
  if (!response.ok || parsed.ok === false) {
    throw new Error(
      `admin-acoes/${body.acao} falhou: HTTP ${response.status} ${parsed.detalhe ?? parsed.reason ?? "erro desconhecido"}`,
    );
  }
  return parsed;
}

async function runSql(query) {
  assert(MANAGEMENT_TOKEN, "Falta SUPABASE_ACCESS_TOKEN, necessario para a limpeza atomica.");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Management API SQL falhou (HTTP ${response.status}): ${text.slice(0, 240)}`);
  }
  return text ? JSON.parse(text) : [];
}

async function chooseUnusedSearch(orgId) {
  const candidates = [
    { nicho: "floricultura", cidade: "Boa Vista", uf: "RR" },
    { nicho: "loja de instrumentos musicais", cidade: "Cascavel", uf: "PR" },
    { nicho: "locacao de guindaste", cidade: "Joinville", uf: "SC" },
    { nicho: "clinica de podologia", cidade: "Ponta Grossa", uf: "PR" },
  ];

  for (const candidate of candidates) {
    const queryKey = cacheKey(candidate);
    const cached = databaseError(
      await admin
        .from("apify_search_cache")
        .select("query_key")
        .eq("query_key", queryKey)
        .maybeSingle(),
      `Falha ao conferir o cache de ${candidate.cidade}`,
    );
    const leads = await admin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .ilike("city", candidate.cidade);
    if (leads.error) throw new Error(`Falha ao conferir leads existentes: ${leads.error.message}`);
    if (!cached && (leads.count ?? 0) === 0) return { ...candidate, queryKey };
  }
  throw new Error(
    "Nenhuma consulta candidata estava simultaneamente sem cache e sem leads na cidade.",
  );
}

async function latestTestLedger(userId, startedAt, search) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const rows = databaseError(
      await admin
        .from("api_consumption_logs")
        .select("id,external_id,quantity,cost_usd,cost_brl,metadata,created_at,org_id,user_id")
        .eq("service", "apify_maps")
        .eq("user_id", userId)
        .gte("created_at", startedAt)
        .order("created_at", { ascending: false })
        .limit(10),
      "Falha ao ler o livro-caixa Apify",
    );
    const matching = (rows ?? []).filter(
      (row) =>
        row.metadata?.nicho === search.nicho &&
        row.metadata?.cidade === search.cidade &&
        row.metadata?.fonte === "apify",
    );
    if (matching.length && matching.every((row) => row.metadata?.run_status !== "RUNNING")) {
      return matching;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return [];
}

async function restoreConsumption(orgId, month, inserted, beforeRow) {
  if (inserted <= 0) return;
  assert(/^[0-9a-f-]{36}$/i.test(orgId), "org_id invalido na limpeza de consumo.");
  assert(/^\d{4}-\d{2}$/.test(month), "mes_ref invalido na limpeza de consumo.");

  const currentRow = databaseError(
    await admin
      .from("consumo_org")
      .select("org_id,mes_ref,leads,sites,campanhas,mensagens")
      .eq("org_id", orgId)
      .eq("mes_ref", month)
      .maybeSingle(),
    "Falha ao conferir o consumo antes da limpeza",
  );
  const previousLeads = number(beforeRow?.leads);
  const currentLeads = number(currentRow?.leads);
  if (!currentRow || currentLeads - previousLeads < inserted) return;

  const org = sqlLiteral(orgId);
  const mes = sqlLiteral(month);
  const rows = await runSql(`
    update public.consumo_org
       set leads = greatest(0, leads - ${inserted}),
           atualizado_em = clock_timestamp()
     where org_id = ${org}::uuid
       and mes_ref = ${mes}
    returning org_id, mes_ref, leads, sites, campanhas, mensagens;
  `);
  assert(rows.length === 1, "A linha de consumo nao foi encontrada durante a restauracao.");

  if (
    !beforeRow &&
    rows[0].leads === 0 &&
    rows[0].sites === 0 &&
    rows[0].campanhas === 0 &&
    rows[0].mensagens === 0
  ) {
    await runSql(`
      delete from public.consumo_org
       where org_id = ${org}::uuid
         and mes_ref = ${mes}
         and leads = 0 and sites = 0 and campanhas = 0 and mensagens = 0;
    `);
  }
}

const session = await getSessionForExistingSuperAdmin();
pass(`sessao temporaria criada para super admin existente (${session.email})`);

const rawPoolSnapshot = databaseError(
  await admin
    .from("apify_chaves")
    .select("id,apelido,ordem,status,esgotada_em,atualizado_em,ultimo_uso")
    .order("ordem", { ascending: true }),
  "Falha ao fotografar o estado do pool",
);
const livePool = await adminAction(session.jwt, { acao: "apify_pool_listar" });
const ordered = [...(livePool.chaves ?? [])].sort((a, b) => number(a.ordem) - number(b.ordem));
const active = ordered.filter((key) => key.status === "ativa");
assert(active.length >= 2, "A prova exige pelo menos duas chaves ativas.");

const current = active[0];
assert(current.saude_live === "ok", `A chave corrente ${current.apelido} nao esta saudavel.`);
assert(current.conta_apify_id, `A chave corrente ${current.apelido} nao revelou a conta Apify.`);
assert(
  number(current.saldo_limite_usd) > 0.1,
  `A chave corrente ${current.apelido} nao tem saldo seguro.`,
);

const currentAccountKeys = active.filter(
  (key) => key.conta_apify_id && key.conta_apify_id === current.conta_apify_id,
);
const expectedNext = active.find(
  (key) => key.conta_apify_id && key.conta_apify_id !== current.conta_apify_id,
);
assert(expectedNext, "Nao ha uma segunda conta financeira ativa para assumir o rodizio.");
assert(
  expectedNext.saude_live === "ok",
  `A proxima chave ${expectedNext.apelido} nao esta saudavel.`,
);
assert(
  number(expectedNext.saldo_limite_usd) > 0.75,
  `A proxima chave ${expectedNext.apelido} nao tem saldo seguro.`,
);
pass(
  `pool live: corrente ${current.apelido} (uso US$ ${number(current.uso_mensal_usd).toFixed(4)} / limite US$ ${number(current.limite_duro_usd).toFixed(2)}; saldo US$ ${number(current.saldo_limite_usd).toFixed(4)}) -> proxima conta ${expectedNext.apelido} (uso US$ ${number(expectedNext.uso_mensal_usd).toFixed(4)} / limite US$ ${number(expectedNext.limite_duro_usd).toFixed(2)}; saldo US$ ${number(expectedNext.saldo_limite_usd).toFixed(4)})`,
);

const recentSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const recentRuns = databaseError(
  await admin
    .from("api_consumption_logs")
    .select("external_id,metadata,created_at")
    .eq("service", "apify_maps")
    .gte("created_at", recentSince),
  "Falha ao conferir runs recentes",
);
const running = (recentRuns ?? []).filter((row) =>
  ["READY", "RUNNING"].includes(String(row.metadata?.run_status ?? "")),
);
assert(
  running.length === 0,
  "Existe outro run Apify recente em andamento; a prova foi abortada sem custo.",
);
pass("nenhum outro run Apify recente esta em andamento");

const search = await chooseUnusedSearch(session.orgId);
pass(`consulta sem cache e sem leads na cidade: ${search.nicho} em ${search.cidade}/${search.uf}`);

if (!RUN_PAID) {
  console.log("INSPECAO CONCLUIDA: nenhum estado foi alterado e nenhuma busca paga foi executada.");
  console.log(
    "Para a prova paga: ALLOW_PAID_APIFY_TEST=YES node scripts/prova-rodizio-apify-paga.mjs --run-paid",
  );
  process.exit(0);
}
assert(PAID_CONFIRMED, "A prova paga exige ALLOW_PAID_APIFY_TEST=YES alem de --run-paid.");
assert(
  MANAGEMENT_TOKEN,
  "Falta SUPABASE_ACCESS_TOKEN; a prova nao inicia sem limpeza atomica disponivel.",
);

const currentSnapshots = currentAccountKeys.map((key) => {
  const row = rawPoolSnapshot.find((snapshot) => snapshot.id === key.id);
  assert(row, `Nao foi possivel fotografar ${key.apelido}.`);
  return row;
});
const aliases = currentSnapshots.map((row) => row.apelido);
const auditBeforeRows = databaseError(
  await admin
    .from("apify_chaves_auditoria")
    .select("id")
    .eq("acao", "esgotada_simulacao")
    .in("apelido", aliases),
  "Falha ao fotografar a auditoria do pool",
);
const auditBefore = new Set((auditBeforeRows ?? []).map((row) => row.id));
const month = new Date().toISOString().slice(0, 7);
const consumptionBefore = databaseError(
  await admin
    .from("consumo_org")
    .select("org_id,mes_ref,leads,sites,campanhas,mensagens,atualizado_em")
    .eq("org_id", session.orgId)
    .eq("mes_ref", month)
    .maybeSingle(),
  "Falha ao fotografar o consumo mensal",
);

let leadIds = [];
let leadPlaceIds = [];
let consumedLeads = 0;
let searchStartedAt = null;
let proof = null;
let primaryError = null;
const cleanupErrors = [];

try {
  for (const key of currentSnapshots) {
    const simulation = await adminAction(session.jwt, {
      acao: "apify_simular_esgotamento",
      id: key.id,
    });
    pass(
      `estado temporario: ${key.apelido} saiu do pool; proxima=${simulation.proxima ?? "nenhuma"}`,
    );
  }

  const simulatedPool = await adminAction(session.jwt, { acao: "apify_pool_listar" });
  const activeAfterSimulation = [...(simulatedPool.chaves ?? [])]
    .sort((a, b) => number(a.ordem) - number(b.ordem))
    .filter((key) => key.status === "ativa");
  const firstAfterSimulation = activeAfterSimulation[0];
  assert(
    firstAfterSimulation?.id === expectedNext.id,
    `Selecao apos a simulacao divergiu: esperado ${expectedNext.apelido}, recebido ${firstAfterSimulation?.apelido ?? "nenhum"}.`,
  );
  assert(
    activeAfterSimulation.length === 1,
    `A prova exige uma unica chave ativa durante o gasto; encontradas ${activeAfterSimulation.length}.`,
  );
  pass(`seletor do pool apontou ${expectedNext.apelido}`);

  searchStartedAt = new Date().toISOString();
  console.log("PAGO iniciando exatamente 1 item, sem enriquecimento e sem cache previo...");
  const response = await fetch(`${SUPABASE_URL}/functions/v1/search-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.jwt}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      nicho: search.nicho,
      cidade: search.cidade,
      uf: search.uf,
      limite: 1,
      fonte: "apify",
      buscarEmails: false,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const responseText = await response.text();
  const events = parseNdjson(responseText);
  assert(response.ok, `search-leads respondeu HTTP ${response.status}.`);
  const streamErrors = events.filter((event) => event.type === "error");
  assert(
    streamErrors.length === 0,
    `search-leads falhou: ${streamErrors[0]?.message ?? "erro no stream"}`,
  );
  const leadEvents = events.filter((event) => event.type === "lead" && event.lead?.id);
  const done = events.findLast((event) => event.type === "done");
  leadIds = [...new Set(leadEvents.map((event) => event.lead.id))];
  consumedLeads = number(done?.inserted);
  assert(done, "O stream terminou sem evento done.");
  assert(consumedLeads === 1, `A busca deveria inserir 1 lead, mas inseriu ${consumedLeads}.`);
  assert(leadIds.length === 1, `O stream deveria devolver 1 lead, mas devolveu ${leadIds.length}.`);
  assert(
    done.fonte === "apify",
    `A fonte final deveria ser apify, mas foi ${done.fonte ?? "desconhecida"}.`,
  );
  leadPlaceIds = [...new Set(leadEvents.map((event) => event.lead.place_id).filter(Boolean))];
  assert(leadPlaceIds.length === 1, "O lead devolvido nao possui um place_id unico.");

  const storedLeads = databaseError(
    await admin
      .from("leads")
      .select("id,user_id,org_id,place_id,business_name,city,state,created_at")
      .in("id", leadIds)
      .eq("org_id", session.orgId),
    "Falha ao verificar o lead gerado",
  );
  assert(storedLeads?.length === 1, "O lead devolvido no stream nao foi encontrado no banco.");
  assert(storedLeads[0].user_id === session.userId, "O lead foi atribuido ao usuario errado.");

  const ledgers = await latestTestLedger(session.userId, searchStartedAt, search);
  const runIds = new Set(ledgers.map((row) => row.external_id).filter(Boolean));
  assert(ledgers.length === 1, `Esperado 1 lancamento Apify, encontrados ${ledgers.length}.`);
  assert(runIds.size === 1, `Esperado 1 run Apify, encontrados ${runIds.size}.`);
  const ledger = ledgers[0];
  assert(
    ledger.metadata?.key_label === expectedNext.apelido,
    `O run usou ${ledger.metadata?.key_label ?? "chave desconhecida"}, nao ${expectedNext.apelido}.`,
  );
  assert(
    ledger.metadata?.run_status === "SUCCEEDED",
    `O run terminou ${ledger.metadata?.run_status ?? "sem status"}.`,
  );
  assert(number(ledger.quantity) === 1, `A Apify cobrou ${ledger.quantity} itens, nao 1.`);
  assert(number(ledger.cost_usd) > 0, "O livro-caixa nao registrou custo real positivo.");
  assert(
    number(ledger.cost_usd) <= 0.05,
    `Custo fora do teto de seguranca da prova: US$ ${ledger.cost_usd}.`,
  );

  const keyAfterRun = databaseError(
    await admin.from("apify_chaves").select("ultimo_uso").eq("id", expectedNext.id).single(),
    "Falha ao conferir o ultimo uso da chave",
  );
  const previousUse = rawPoolSnapshot.find((row) => row.id === expectedNext.id)?.ultimo_uso;
  assert(keyAfterRun.ultimo_uso, "A chave usada nao recebeu ultimo_uso.");
  assert(
    !previousUse || new Date(keyAfterRun.ultimo_uso).getTime() > new Date(previousUse).getTime(),
    "O ultimo_uso da chave seguinte nao avancou.",
  );

  const consumptionAfter = databaseError(
    await admin
      .from("consumo_org")
      .select("leads")
      .eq("org_id", session.orgId)
      .eq("mes_ref", month)
      .maybeSingle(),
    "Falha ao verificar o consumo apos a busca",
  );
  assert(
    number(consumptionAfter?.leads) === number(consumptionBefore?.leads) + 1,
    "O contador mensal nao aumentou exatamente 1 lead.",
  );

  proof = {
    key: ledger.metadata.key_label,
    runId: ledger.external_id,
    costUsd: number(ledger.cost_usd),
    quantity: number(ledger.quantity),
    leadName: storedLeads[0].business_name,
  };
  pass(
    `run real ${proof.runId}: ${proof.quantity} item, US$ ${proof.costUsd.toFixed(4)}, chave ${proof.key}`,
  );
  pass(`lead persistido e atribuido corretamente: ${proof.leadName}`);
} catch (error) {
  primaryError = error;
} finally {
  for (const snapshot of currentSnapshots) {
    try {
      const restored = databaseError(
        await admin
          .from("apify_chaves")
          .update({
            status: snapshot.status,
            esgotada_em: snapshot.esgotada_em,
            atualizado_em: snapshot.atualizado_em,
          })
          .eq("id", snapshot.id)
          .select("id,status,esgotada_em,atualizado_em")
          .single(),
        `Falha ao restaurar ${snapshot.apelido}`,
      );
      assert(
        restored.status === snapshot.status,
        `Status de ${snapshot.apelido} nao foi restaurado.`,
      );
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  try {
    const auditAfterRows = databaseError(
      await admin
        .from("apify_chaves_auditoria")
        .select("id")
        .eq("acao", "esgotada_simulacao")
        .in("apelido", aliases),
      "Falha ao localizar auditorias temporarias",
    );
    const temporaryAuditIds = (auditAfterRows ?? [])
      .map((row) => row.id)
      .filter((id) => !auditBefore.has(id));
    if (temporaryAuditIds.length) {
      databaseError(
        await admin.from("apify_chaves_auditoria").delete().in("id", temporaryAuditIds),
        "Falha ao remover auditorias temporarias",
      );
    }
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    if (leadIds.length) {
      databaseError(
        await admin.from("leads").delete().in("id", leadIds).eq("org_id", session.orgId),
        "Falha ao remover o lead da prova",
      );
    }
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    if (leadPlaceIds.length && searchStartedAt) {
      assert(/^[0-9a-f-]{36}$/i.test(session.orgId), "org_id invalido na limpeza do registro.");
      assert(Number.isFinite(new Date(searchStartedAt).getTime()), "Inicio da busca invalido.");
      const placeList = leadPlaceIds.map(sqlLiteral).join(",");
      const removedRegistry = await runSql(`
        delete from public.lead_seen_registry
         where org_id = ${sqlLiteral(session.orgId)}::uuid
           and place_id in (${placeList})
           and first_seen_at >= ${sqlLiteral(searchStartedAt)}::timestamptz
        returning place_id;
      `);
      assert(
        removedRegistry.length === leadPlaceIds.length,
        "O registro permanente do lead temporario nao foi removido exatamente.",
      );
    }
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    await restoreConsumption(session.orgId, month, consumedLeads, consumptionBefore);
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    databaseError(
      await admin.from("apify_search_cache").delete().eq("query_key", search.queryKey),
      "Falha ao remover o cache exclusivo da prova",
    );
  } catch (error) {
    cleanupErrors.push(error);
  }

  try {
    const restoredRows = databaseError(
      await admin
        .from("apify_chaves")
        .select("id,ordem,status,esgotada_em,atualizado_em")
        .in(
          "id",
          currentSnapshots.map((row) => row.id),
        ),
      "Falha ao conferir a restauracao do pool",
    );
    for (const snapshot of currentSnapshots) {
      const restored = restoredRows.find((row) => row.id === snapshot.id);
      assert(restored?.status === snapshot.status, `Estado final de ${snapshot.apelido} divergiu.`);
      assert(restored?.ordem === snapshot.ordem, `Ordem final de ${snapshot.apelido} divergiu.`);
      assert(
        restored?.esgotada_em === snapshot.esgotada_em,
        `esgotada_em de ${snapshot.apelido} divergiu.`,
      );
      assert(
        restored?.atualizado_em === snapshot.atualizado_em,
        `atualizado_em de ${snapshot.apelido} divergiu.`,
      );
    }

    const cached = databaseError(
      await admin
        .from("apify_search_cache")
        .select("query_key")
        .eq("query_key", search.queryKey)
        .maybeSingle(),
      "Falha ao conferir a limpeza do cache",
    );
    assert(!cached, "O cache temporario da prova ainda existe.");

    if (leadIds.length) {
      const remainingLeads = await admin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("id", leadIds);
      if (remainingLeads.error) throw remainingLeads.error;
      assert((remainingLeads.count ?? 0) === 0, "O lead temporario da prova ainda existe.");
    }

    if (leadPlaceIds.length) {
      const remainingRegistry = await admin
        .from("lead_seen_registry")
        .select("place_id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .in("place_id", leadPlaceIds);
      if (remainingRegistry.error) throw remainingRegistry.error;
      assert(
        (remainingRegistry.count ?? 0) === 0,
        "O registro permanente do lead temporario ainda existe.",
      );
    }
  } catch (error) {
    cleanupErrors.push(error);
  }
}

if (cleanupErrors.length) {
  const messages = cleanupErrors.map((error) =>
    error instanceof Error ? error.message : String(error),
  );
  throw new Error(`A limpeza da prova teve falhas: ${messages.join(" | ")}`);
}
pass("pool, cache, lead temporario, contador e auditoria simulada foram restaurados");

if (primaryError) throw primaryError;
assert(proof, "A prova terminou sem evidencia consolidada.");
console.log(
  `PROVA PAGA APROVADA: 1 run, 1 item, US$ ${proof.costUsd.toFixed(4)}, rodizio para ${proof.key}.`,
);
console.log("O lancamento real foi preservado em api_consumption_logs para auditoria.");
