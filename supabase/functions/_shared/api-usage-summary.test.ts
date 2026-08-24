// Suite: atribuição do livro-caixa de APIs
// Invariant: cada custo com user_id aparece uma única vez no usuário correto e no total da plataforma.
// Boundary IN: agregador puro api-usage-summary
// Boundary OUT: persistência Supabase e UI administrativa
import assert from "node:assert/strict";
import test from "node:test";
import { buildApiUsagePeriodSummary } from "./api-usage-summary.ts";

const base = {
  profiles: [
    {
      id: "user-a",
      email: "a@empresa.com",
      full_name: "Usuário A",
      is_super_admin: false,
      plan: "pro",
    },
    {
      id: "user-b",
      email: "b@empresa.com",
      full_name: "Usuário B",
      is_super_admin: false,
      plan: "basico",
    },
  ],
  memberships: [
    { user_id: "user-a", org_id: "org-a" },
    { user_id: "user-b", org_id: "org-b" },
  ],
  orgs: [
    { id: "org-a", nome: "A", plano_id: "plan-pro", dono_user_id: "user-a" },
    { id: "org-b", nome: "B", plano_id: "plan-basic", dono_user_id: "user-b" },
  ],
  plans: [
    { id: "plan-pro", nome: "Pro", limite_leads: 1_000, preco: 199 },
    { id: "plan-basic", nome: "Básico", limite_leads: 100, preco: 99 },
  ],
  orgConsumption: [
    { org_id: "org-a", leads: 15 },
    { org_id: "org-b", leads: 2 },
  ],
};

test("atribui custo real do Instagram somente ao usuário que executou o job", () => {
  const summary = buildApiUsagePeriodSummary({
    ...base,
    logs: [
      {
        user_id: "user-a",
        org_id: "org-a",
        service: "apify_instagram",
        action: "comments_hunter",
        quantity: 1,
        cost_usd: 2,
        cost_brl: 11.2,
      },
    ],
  });

  assert.equal(summary.totalCostUsd, 2);
  assert.equal(summary.users.find((user) => user.user_id === "user-a")?.total_cost_usd, 2);
  assert.equal(summary.users.find((user) => user.user_id === "user-b")?.total_cost_usd, 0);
  assert.deepEqual(
    summary.services.map((service) => service.service),
    ["apify_instagram"],
  );
});

test("separa custo sem user_id sem atribuí-lo silenciosamente a uma conta", () => {
  const summary = buildApiUsagePeriodSummary({
    ...base,
    logs: [
      {
        user_id: null,
        org_id: "org-a",
        service: "openai_enrichment",
        quantity: 3,
        cost_usd: 0.45,
        cost_brl: 2.52,
      },
    ],
  });

  assert.equal(summary.totalCostUsd, 0.45);
  assert.equal(summary.unattributedCostUsd, 0.45);
  assert.equal(
    summary.users.reduce((total, user) => total + user.total_cost_usd, 0),
    0,
  );
});

test("não soma a estimativa legada invalidada como custo real", () => {
  const summary = buildApiUsagePeriodSummary({
    ...base,
    logs: [
      {
        user_id: "user-a",
        org_id: "org-a",
        service: "apify_maps",
        action: "legacy_search_estimate_invalidated",
        quantity: 2_000,
        cost_usd: 2,
        cost_brl: 11.2,
      },
    ],
  });

  assert.equal(summary.totalCostUsd, 0);
  assert.equal(summary.totalRequests, 0);
  assert.equal(summary.users.find((user) => user.user_id === "user-a")?.total_cost_usd, 0);
});
