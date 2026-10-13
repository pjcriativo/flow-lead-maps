// Suite: Leads Premium
// Invariant: production renders only authorized Supabase data and never falls back to demo leads.
// Boundary IN: Premium UI, its query/service contracts, domain mapping and RLS policies.
// Boundary OUT: node:test regression and contract tests; live Supabase remains an integration concern.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  leadsToCsv,
  metricsFromCounts,
  toLeadItem,
  validateLeadForm,
} from "../src/components/leads-premium/leads-premium-data.ts";

const read = (path) => readFileSync(path, "utf8");
const dashboardRoute = read("src/routes/_authenticated/dashboard.tsx");
const leadsView = read("src/components/leads-premium/LeadsPremiumView.tsx");
const leadsHeader = read("src/components/leads-premium/LeadsHeader.tsx");
const leadsStats = read("src/components/leads-premium/LeadsStatsCards.tsx");
const leadsFilters = read("src/components/leads-premium/LeadsFiltersBar.tsx");
const leadsTable = read("src/components/leads-premium/LeadsTable.tsx");
const leadDetails = read("src/components/leads-premium/LeadDetailsPanel.tsx");
const leadsData = read("src/components/leads-premium/leads-premium-data.ts");
const leadsHook = read("src/components/leads-premium/useLeadsPremium.ts");
const leadsApi = read("src/lib/leads-api.ts");
const membershipMigration = read("supabase/migrations/042_orgs_memberships_estrutura.sql");
const rlsMigration = read("supabase/migrations/043_rls_org_papel.sql");
const sidebar = read("src/components/home-premium/DashboardSidebar.tsx");

const lead = (overrides = {}) => ({
  id: "lead-1",
  business_name: 'Empresa, "Real"',
  owner_name: null,
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  category: null,
  city: null,
  state: null,
  address: null,
  notes: null,
  score: 73,
  score_breakdown: null,
  status: "new",
  origem_fonte: null,
  origem_estrategia: null,
  assigned_to: null,
  list_id: null,
  org_id: "org-1",
  user_id: "user-1",
  instagram_url: null,
  facebook_url: null,
  linkedin_url: null,
  place_id: null,
  created_at: "2026-10-13T12:00:00.000Z",
  updated_at: "2026-10-13T12:00:00.000Z",
  ...overrides,
});

test("the authenticated route keeps the approved Premium composition", () => {
  assert.match(dashboardRoute, /section === "leads"/);
  assert.match(dashboardRoute, /<LeadsPremiumView/);
  assert.match(sidebar, /label: "Leads", section: "leads", icon: Share2/);
  for (const component of [
    "DashboardHeader",
    "LeadsHeader",
    "LeadsStatsCards",
    "LeadsFiltersBar",
    "LeadsTable",
    "LeadDetailsPanel",
  ])
    assert.match(leadsView, new RegExp(`<${component}`));
});

test("production source contains no demo lead collection or showcase companies", () => {
  for (const source of [leadsView, leadsData, leadsHook, leadsTable, leadDetails]) {
    assert.doesNotMatch(source, /MOCK_LEADS|Clínica Odonto Prime|Restaurante Sabor & Arte/);
  }
  assert.match(leadsView, /useLeadsPremium/);
  assert.match(leadsHook, /fetchLeadsPage/);
});

test("filters expose only backend-supported dimensions", () => {
  for (const label of [
    "Todos os canais",
    "Todos os status",
    "Todas as listas",
    "Todos os responsáveis",
    "Todos os scores",
    "Mais filtros",
  ])
    assert.match(leadsFilters, new RegExp(label));
  assert.doesNotMatch(leadsFilters, /Todas as tags/);
});

test("the list query owns server pagination, exact totals, filters and ordering", () => {
  assert.match(leadsApi, /count: "exact"/);
  assert.match(leadsApi, /\.range\(from, to\)/);
  assert.match(leadsApi, /\.order\(request\.sortBy/);
  assert.match(leadsApi, /filters\.search/);
  assert.match(leadsApi, /filters\.assignedTo/);
  assert.match(leadsApi, /filters\.listId/);
  assert.match(leadsHook, /placeholderData/);
});

test("RLS contract scopes visibility and mutations to organization membership", () => {
  assert.match(membershipMigration, /papel_do_usuario\(p_org\) in \('admin','gerente','suporte'\)/);
  assert.match(membershipMigration, /or p_assigned = auth\.uid\(\)/);
  assert.match(membershipMigration, /pertence_a_org\(p_org\)/);
  assert.match(rlsMigration, /pode_ver_lead\(org_id, assigned_to\)/);
  assert.match(rlsMigration, /for insert/i);
  assert.match(rlsMigration, /for update/i);
  assert.match(rlsMigration, /for delete/i);
  assert.match(rlsMigration, /pertence_a_org/);
  assert.doesNotMatch(leadsApi, /service[_-]?role/i);
});

test("lead reads and writes keep record IDs behind Supabase RLS", () => {
  assert.match(leadsApi, /from\("leads"\)\.select\("\*"\)\.eq\("id", id\)\.single\(\)/);
  assert.match(leadsApi, /\.update\(\{ \.\.\.patch, updated_at:/);
  assert.match(leadsApi, /\.eq\("id", id\)/);
  assert.match(leadsView, /authorizedLeads\.length !== ids\.length/);
});

test("mapping preserves real values and leaves absent contacts empty", () => {
  const item = toLeadItem(lead());
  assert.equal(item.company, 'Empresa, "Real"');
  assert.equal(item.channel, "manual");
  assert.equal(item.channelLabel, "Cadastro manual");
  assert.equal(item.contactName, "");
  assert.equal(item.phone, "");
  assert.equal(item.email, "");
  assert.deepEqual(item.tags, []);

  const maps = toLeadItem(lead({ place_id: "place-1" }));
  assert.equal(maps.channel, "maps");
  assert.equal(maps.channelLabel, "Google Maps");
});

test("form validation covers successful and invalid input paths", () => {
  assert.deepEqual(
    validateLeadForm({
      businessName: "Flow",
      email: "oi@flow.com",
      state: "SP",
      phone: "11999999999",
    }),
    {},
  );
  const errors = validateLeadForm({
    businessName: " ",
    email: "invalid",
    state: "S",
    phone: "123",
    whatsapp: "55",
  });
  assert.ok(errors.businessName);
  assert.ok(errors.email);
  assert.ok(errors.state);
  assert.ok(errors.phone);
  assert.ok(errors.whatsapp);
});

test("metrics and CSV are derived from records without invented trends", () => {
  const metrics = metricsFromCounts({
    total: 10,
    contacted: 4,
    opportunities: 3,
    proposals: 2,
    customers: 1,
  });
  assert.deepEqual(
    metrics.map((item) => item.value),
    ["10", "4", "3", "2", "1"],
  );
  assert.ok(metrics.every((item) => item.change === null && item.bars.length === 0));

  const csv = leadsToCsv([lead()]);
  assert.match(csv, /"Empresa, ""Real"""/);
  assert.match(csv, /"Cadastro manual"/);
  assert.doesNotMatch(csv, /undefined|null/);
});

test("loading, error, empty and operational detail states remain explicit", () => {
  assert.match(leadsTable, /Carregando leads/);
  assert.match(leadsTable, /\{error\}/);
  assert.match(leadsTable, /Tentar novamente/);
  assert.match(leadsTable, /Nenhum lead encontrado/);
  for (const title of ["Visão geral", "Contatos", "Histórico", "Anotações"]) {
    assert.match(leadDetails, new RegExp(title));
  }
});

test("approved controls and icon systems stay present", () => {
  for (const label of ["Importar", "Exportar", "Novo lead"])
    assert.match(leadsHeader, new RegExp(label));
  for (const metric of ["Total de leads", "Em contato", "Oportunidades", "Propostas", "Clientes"]) {
    assert.match(leadsData, new RegExp(metric));
  }
  for (const source of [leadsHeader, leadsStats, leadsFilters, leadsTable, leadDetails]) {
    assert.match(source, /from "lucide-react"/);
  }
  assert.match(leadDetails, /from "react-icons\/si"/);
});
