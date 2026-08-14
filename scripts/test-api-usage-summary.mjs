import assert from "node:assert/strict";
import test from "node:test";

import { buildApiUsagePeriodSummary } from "../supabase/functions/_shared/api-usage-summary.ts";
import { planApifyRunLedgerSync } from "../supabase/functions/_shared/apify-run-ledger.ts";

// Suite: resumo de consumo de APIs por usuário
// Invariant: todo perfil aparece uma vez e os totais usam somente o livro-caixa do período.
// Boundary IN: agregação pura de perfis, vínculos, planos, consumo mensal e logs.
// Boundary OUT: PostgreSQL, Apify e renderização React.

const profiles = [
  {
    id: "u-admin",
    email: "admin@example.com",
    full_name: "Admin",
    is_super_admin: true,
    plan: null,
  },
  {
    id: "u-basic",
    email: "basic@example.com",
    full_name: null,
    is_super_admin: false,
    plan: "basico",
  },
  {
    id: "u-pro",
    email: "pro@example.com",
    full_name: "Cliente Pro",
    is_super_admin: false,
    plan: "pro",
  },
];

test("inclui todos os perfis e mantém zero para quem não consumiu", () => {
  const summary = buildApiUsagePeriodSummary({
    profiles,
    memberships: [
      { user_id: "u-admin", org_id: "o-admin", criada_em: "2026-08-01T00:00:00Z" },
      { user_id: "u-basic", org_id: "o-basic", criada_em: "2026-08-01T00:00:00Z" },
      { user_id: "u-pro", org_id: "o-pro", criada_em: "2026-08-01T00:00:00Z" },
    ],
    orgs: [
      { id: "o-admin", nome: "Admin", plano_id: null, dono_user_id: "u-admin" },
      { id: "o-basic", nome: "Conta Basic", plano_id: "p-basic", dono_user_id: "u-basic" },
      { id: "o-pro", nome: "Conta Pro", plano_id: "p-pro", dono_user_id: "u-pro" },
    ],
    plans: [
      { id: "p-basic", nome: "Básico", limite_leads: 1500 },
      { id: "p-pro", nome: "Pro", limite_leads: 5000 },
    ],
    orgConsumption: [
      { org_id: "o-basic", leads: 9 },
      { org_id: "o-pro", leads: 12 },
    ],
    logs: [
      {
        user_id: "u-admin",
        org_id: "o-admin",
        service: "apify_maps",
        action: "search_run_reconciled",
        quantity: 50,
        cost_usd: 4.6525,
        cost_brl: 26.054,
      },
    ],
  });

  assert.equal(summary.users.length, 3);
  assert.deepEqual(
    summary.users.map((user) => user.user_id),
    ["u-admin", "u-basic", "u-pro"],
  );
  assert.deepEqual(
    summary.users.slice(1).map((user) => ({
      id: user.user_id,
      requests: user.requests_count,
      cost: user.total_cost_usd,
    })),
    [
      { id: "u-basic", requests: 0, cost: 0 },
      { id: "u-pro", requests: 0, cost: 0 },
    ],
  );
  assert.equal(summary.totalCostUsd, 4.6525);
  assert.equal(summary.totalItemsCharged, 50);
});

test("ignora o lançamento Apify legado quando o run real já é a fonte de cobrança", () => {
  const summary = buildApiUsagePeriodSummary({
    profiles: [profiles[0]],
    memberships: [],
    orgs: [],
    plans: [],
    orgConsumption: [],
    logs: [
      {
        user_id: "u-admin",
        org_id: null,
        service: "apify_maps",
        action: "legacy_search_estimate_invalidated",
        quantity: 50,
        cost_usd: 0,
        cost_brl: 0,
      },
      {
        user_id: "u-admin",
        org_id: null,
        service: "apify_maps",
        action: "search_run_reconciled",
        quantity: 50,
        cost_usd: 2.82,
        cost_brl: 15.792,
      },
    ],
  });

  assert.equal(summary.totalRequests, 1);
  assert.equal(summary.totalItemsCharged, 50);
  assert.equal(summary.totalCostUsd, 2.82);
});

test("prefere a organização própria e soma apenas os logs atribuídos ao usuário", () => {
  const summary = buildApiUsagePeriodSummary({
    profiles: [profiles[1]],
    memberships: [
      { user_id: "u-basic", org_id: "o-team", criada_em: "2026-07-01T00:00:00Z" },
      { user_id: "u-basic", org_id: "o-basic", criada_em: "2026-08-01T00:00:00Z" },
    ],
    orgs: [
      { id: "o-team", nome: "Equipe", plano_id: "p-pro", dono_user_id: "someone-else" },
      { id: "o-basic", nome: "Conta Basic", plano_id: "p-basic", dono_user_id: "u-basic" },
    ],
    plans: [
      { id: "p-basic", nome: "Básico", limite_leads: 1500 },
      { id: "p-pro", nome: "Pro", limite_leads: 5000 },
    ],
    orgConsumption: [{ org_id: "o-basic", leads: 9 }],
    logs: [
      {
        user_id: null,
        org_id: null,
        service: "apify_maps",
        quantity: 2,
        cost_usd: 1.25,
        cost_brl: 7,
      },
    ],
  });

  assert.equal(summary.users[0].plan, "Básico");
  assert.equal(summary.users[0].leads_used, 9);
  assert.equal(summary.users[0].total_cost_usd, 0);
  assert.equal(summary.totalCostUsd, 1.25);
  assert.equal(summary.unattributedCostUsd, 1.25);
  assert.equal(summary.unattributedRequests, 1);
  assert.equal(summary.unattributedItems, 2);
});

test("liga reconciliação legada ao run real sem duplicar e mantém run desconhecido sem usuário", () => {
  const actions = planApifyRunLedgerSync(
    [
      {
        id: "ledger-manual",
        action: "account_reconciliation",
        external_id: "reconciliation:apify-account:2026-08-06",
        cost_usd: 2.82,
        created_at: "2026-08-06T12:43:16Z",
      },
    ],
    [
      {
        id: "run-known-cost",
        status: "SUCCEEDED",
        usageTotalUsd: 2.8204,
        startedAt: "2026-08-06T12:40:00Z",
        finishedAt: "2026-08-06T12:42:00Z",
        defaultDatasetId: "dataset-1",
        keyLabel: "principal",
      },
      {
        id: "run-without-user",
        status: "SUCCEEDED",
        usageTotalUsd: 1.8325,
        startedAt: "2026-08-06T14:00:00Z",
        finishedAt: "2026-08-06T14:02:00Z",
        defaultDatasetId: "dataset-2",
        keyLabel: "principal",
      },
    ],
  );

  assert.deepEqual(
    actions.map((action) => ({ kind: action.kind, run: action.run.id })),
    [
      { kind: "match_reconciliation", run: "run-known-cost" },
      { kind: "insert_unattributed", run: "run-without-user" },
    ],
  );
});

test("separa leads do período do uso mensal do plano", () => {
  const summary = buildApiUsagePeriodSummary({
    profiles: [profiles[1]],
    memberships: [{ user_id: "u-basic", org_id: "o-basic" }],
    orgs: [{ id: "o-basic", nome: "Conta Basic", plano_id: "p-basic", dono_user_id: "u-basic" }],
    plans: [{ id: "p-basic", nome: "Básico", limite_leads: 1500 }],
    orgConsumption: [{ org_id: "o-basic", leads: 0 }],
    userLeadCounts: [
      { user_id: "u-basic", leads_period: 343, leads_month: 0, apify_leads_period: 293 },
    ],
    logs: [],
  });

  assert.equal(summary.users[0].leads_generated_period, 343);
  assert.equal(summary.users[0].apify_leads_generated_period, 293);
  assert.equal(summary.users[0].leads_used, 0);
});

test("detalha por usuario o custo real de cada servico e a mensalidade do plano", () => {
  const summary = buildApiUsagePeriodSummary({
    profiles: [profiles[2]],
    memberships: [{ user_id: "u-pro", org_id: "o-pro" }],
    orgs: [{ id: "o-pro", nome: "Conta Pro", plano_id: "p-pro", dono_user_id: "u-pro" }],
    plans: [{ id: "p-pro", nome: "Pro", limite_leads: 5000, preco: 297 }],
    orgConsumption: [{ org_id: "o-pro", leads: 42 }],
    logs: [
      {
        user_id: "u-pro",
        org_id: "o-pro",
        service: "apify_maps",
        action: "search_run_reconciled",
        quantity: 50,
        cost_usd: 0.2,
        cost_brl: 1.12,
      },
      {
        user_id: "u-pro",
        org_id: "o-pro",
        service: "openai_enrichment",
        action: "enrich",
        quantity: 3,
        cost_usd: 0.03,
        cost_brl: 0.168,
      },
      {
        user_id: "u-pro",
        org_id: "o-pro",
        service: "whatsapp_evolution",
        action: "send",
        quantity: 2,
        cost_usd: 0,
        cost_brl: 0,
      },
    ],
  });

  assert.equal(summary.users[0].monthly_revenue_brl, 297);
  assert.deepEqual(summary.users[0].services, [
    {
      service: "apify_maps",
      requests_count: 1,
      quantity: 50,
      cost_usd: 0.2,
      cost_brl: 1.12,
    },
    {
      service: "openai_enrichment",
      requests_count: 1,
      quantity: 3,
      cost_usd: 0.03,
      cost_brl: 0.168,
    },
    {
      service: "whatsapp_evolution",
      requests_count: 1,
      quantity: 2,
      cost_usd: 0,
      cost_brl: 0,
    },
  ]);
});
