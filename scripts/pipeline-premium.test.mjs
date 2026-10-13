// Suite: Pipeline Premium
// Invariant: o funil deriva exclusivamente de leads/propostas reais e preserva o estado confirmado.
// Boundary IN: domínio do pipeline, integração React Query, DnD, detalhe e RLS.
// Boundary OUT: Supabase e navegador reais.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  STAGE_TARGET_STATUS,
  buildPipelineMetrics,
  buildPipelineStages,
  filterOpportunities,
  latestProposalValues,
  moveLeadInCache,
  parseLeadStatus,
  proposalsForLeads,
  stageForStatus,
  toOpportunity,
} from "../src/components/pipeline-premium/pipeline-premium-data.ts";

const read = (path) => readFileSync(path, "utf8");
const dashboardRoute = read("src/routes/_authenticated/dashboard.tsx");
const pipelineView = read("src/components/pipeline-premium/PipelinePremiumView.tsx");
const pipelineHook = read("src/components/pipeline-premium/usePipelinePremium.ts");
const pipelineBoard = read("src/components/pipeline-premium/PipelineBoard.tsx");
const pipelineColumn = read("src/components/pipeline-premium/PipelineColumn.tsx");
const opportunityCard = read("src/components/pipeline-premium/OpportunityCard.tsx");
const opportunityDetails = read("src/components/pipeline-premium/OpportunityDetailsPanel.tsx");
const leadsView = read("src/components/leads-premium/LeadsPremiumView.tsx");
const leadsApi = read("src/lib/leads-api.ts");
const rlsFunctions = read("supabase/migrations/042_orgs_memberships_estrutura.sql");
const rlsPolicies = read("supabase/migrations/043_rls_org_papel.sql");

const baseFilters = {
  search: "",
  channel: "all",
  stage: "all",
  responsible: "all",
  score: "all",
  createdFrom: "",
  createdTo: "",
};

function lead(overrides = {}) {
  return {
    id: "lead-1",
    business_name: "Empresa real",
    category: "Tecnologia",
    status: "new",
    score: 82,
    owner_name: null,
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    city: "Recife",
    state: "PE",
    website: null,
    notes: null,
    assigned_to: null,
    origem_fonte: null,
    place_id: null,
    instagram_url: null,
    facebook_url: null,
    linkedin_url: null,
    created_at: "2026-10-01T12:00:00.000Z",
    updated_at: "2026-10-02T12:00:00.000Z",
    ...overrides,
  };
}

function proposal(overrides = {}) {
  return {
    id: "proposal-1",
    lead_id: "lead-1",
    lead_nome: "Empresa real",
    lead_email: null,
    assunto: "Proposta",
    corpo: "Conteúdo real",
    valor: null,
    status: "rascunho",
    criada_em: "2026-10-01T12:00:00.000Z",
    aprovada_em: null,
    enviada_em: null,
    respondida_em: null,
    ...overrides,
  };
}

test("todos os status persistidos entram em uma das seis etapas aprovadas", () => {
  const expected = {
    new: "novo",
    contacted: "contato",
    enriched: "qualificacao",
    nurture: "qualificacao",
    proposta_enviada: "proposta",
    responded: "negociacao",
    meeting: "negociacao",
    won: "fechado",
    lost: "fechado",
  };

  for (const [status, stage] of Object.entries(expected)) {
    assert.equal(stageForStatus(parseLeadStatus(status)), stage);
  }
  assert.deepEqual(Object.keys(STAGE_TARGET_STATUS), [
    "novo",
    "contato",
    "qualificacao",
    "proposta",
    "negociacao",
    "fechado",
  ]);
  assert.throws(() => parseLeadStatus("inventado"), /não suportado/);
});

test("o adaptador mantém identidade e campos reais sem fabricar contato ou valor", () => {
  const opportunity = toOpportunity(lead(), null, "Sem responsável");
  assert.equal(opportunity.id, "lead-1");
  assert.equal(opportunity.company, "Empresa real");
  assert.equal(opportunity.value, "Sem valor");
  assert.equal(opportunity.contactName, "");
  assert.equal(opportunity.phone, "");
  assert.equal(opportunity.email, "");
  assert.equal(opportunity.address, "Recife - PE");
  assert.equal(opportunity.channel, "manual");
  assert.equal(opportunity.record.id, opportunity.id);
});

test("a proposta mais recente define o valor mesmo quando a entrada está fora de ordem", () => {
  const values = latestProposalValues([
    proposal({ id: "new", valor: 9000, criada_em: "2026-10-10T12:00:00.000Z" }),
    proposal({ id: "old", valor: 1000, criada_em: "2026-09-10T12:00:00.000Z" }),
  ]);
  assert.equal(values.get("lead-1"), 9000);
});

test("propostas fora do universo de leads autorizado não entram no pipeline", () => {
  const proposals = [
    proposal({ id: "visible", lead_id: "lead-1", valor: 500 }),
    proposal({ id: "hidden", lead_id: "lead-other", valor: 99_000 }),
  ];
  assert.deepEqual(
    proposalsForLeads(proposals, [lead()]).map((item) => item.id),
    ["visible"],
  );
});

test("contagens e valores do board são derivados das oportunidades recebidas", () => {
  const opportunities = [
    toOpportunity(lead({ id: "new", status: "new" }), null, "Sem responsável"),
    toOpportunity(lead({ id: "meeting", status: "meeting" }), 2500, "Ana"),
    toOpportunity(lead({ id: "won", status: "won" }), 7000, "Ana"),
  ];
  const stages = buildPipelineStages(opportunities);
  assert.equal(stages.find((stage) => stage.key === "novo")?.count, 1);
  assert.equal(stages.find((stage) => stage.key === "novo")?.totalValue, "Sem valores");
  assert.match(stages.find((stage) => stage.key === "negociacao")?.totalValue ?? "", /2\.500/);
  assert.equal(
    stages.reduce((total, stage) => total + stage.count, 0),
    opportunities.length,
  );
});

test("KPIs contam o universo autorizado, propostas enviadas distintas e valores conhecidos", () => {
  const leads = [
    lead({ id: "a", status: "responded" }),
    lead({ id: "b", status: "meeting" }),
    lead({ id: "c", status: "won" }),
  ];
  const proposals = [
    proposal({ id: "a1", lead_id: "a", status: "enviada", valor: 1000 }),
    proposal({
      id: "a2",
      lead_id: "a",
      status: "enviada",
      valor: 2000,
      criada_em: "2026-10-03T12:00:00.000Z",
    }),
    proposal({ id: "b1", lead_id: "b", status: "rascunho", valor: null }),
  ];
  const metrics = Object.fromEntries(
    buildPipelineMetrics(leads, proposals).map((item) => [item.id, item.value]),
  );
  assert.equal(metrics.leads, "3");
  assert.equal(metrics.negociacao, "2");
  assert.equal(metrics.propostas, "1");
  assert.equal(metrics.vendas, "1");
  assert.match(metrics.valor, /2\.000/);

  const unavailable = buildPipelineMetrics(leads, [], false);
  assert.equal(unavailable.find((item) => item.id === "propostas")?.value, "—");
  assert.equal(unavailable.find((item) => item.id === "propostas")?.unavailable, true);
  assert.equal(unavailable.find((item) => item.id === "leads")?.unavailable, false);
});

test("filtros combinam busca, etapa, origem, responsável, score e período reais", () => {
  const assigned = toOpportunity(
    lead({
      id: "assigned",
      business_name: "Clínica Aurora",
      status: "meeting",
      origem_fonte: "instagram",
      assigned_to: "member-1",
      created_at: "2026-10-05T12:00:00.000Z",
    }),
    3000,
    "Ana",
  );
  const unassigned = toOpportunity(lead({ id: "unassigned", score: 60 }), null, "Sem responsável");
  const items = [assigned, unassigned];

  assert.deepEqual(
    filterOpportunities(items, { ...baseFilters, search: "aurora" }).map((item) => item.id),
    ["assigned"],
  );
  assert.deepEqual(
    filterOpportunities(items, { ...baseFilters, stage: "negociacao" }).map((item) => item.id),
    ["assigned"],
  );
  assert.deepEqual(
    filterOpportunities(items, { ...baseFilters, channel: "instagram" }).map((item) => item.id),
    ["assigned"],
  );
  assert.deepEqual(
    filterOpportunities(items, { ...baseFilters, responsible: "member-1" }).map((item) => item.id),
    ["assigned"],
  );
  assert.deepEqual(
    filterOpportunities(items, { ...baseFilters, responsible: "none" }).map((item) => item.id),
    ["unassigned"],
  );
  assert.deepEqual(
    filterOpportunities(items, { ...baseFilters, score: "qualification" }).map((item) => item.id),
    ["unassigned"],
  );
  assert.deepEqual(
    filterOpportunities(items, {
      ...baseFilters,
      createdFrom: "2026-10-05",
      createdTo: "2026-10-05",
    }).map((item) => item.id),
    ["assigned"],
  );
});

test("a atualização otimista é imutável e o hook mantém snapshot, rollback e reconciliação", () => {
  const original = [lead({ id: "a", status: "new" }), lead({ id: "b", status: "contacted" })];
  const moved = moveLeadInCache(original, "a", "meeting");
  assert.equal(original[0].status, "new");
  assert.equal(moved[0].status, "meeting");
  assert.equal(moved[1], original[1]);

  assert.match(pipelineHook, /cancelQueries\(\{ queryKey: pipelineKeys\.leads\(\) \}\)/);
  assert.match(pipelineHook, /const previous = queryClient\.getQueryData/);
  assert.match(
    pipelineHook,
    /onError:[\s\S]*setQueryData\(pipelineKeys\.leads\(\), context\.previous\)/,
  );
  assert.match(
    pipelineHook,
    /onSettled:[\s\S]*invalidateQueries\(\{ queryKey: pipelineKeys\.leads\(\) \}\)/,
  );
  assert.match(leadsApi, /\.eq\("updated_at", expectedUpdatedAt\)/);
});

test("DnD entrega o lead e a etapa ao contrato persistente", () => {
  assert.match(opportunityCard, /draggable=\{draggable\}/);
  assert.match(pipelineBoard, /onMoveOpportunity\(opportunity, stage\)/);
  assert.match(pipelineColumn, /onDrop=\{\(event\) => \{[\s\S]*onDropOpportunity\(stage\.key\)/);
  assert.match(pipelineView, /pipeline\.moveMutation\.mutateAsync/);
});

test("detalhe consulta atividades e propostas reais e não contém timeline ou contato fictício", () => {
  assert.match(opportunityDetails, /carregarDetalheLead/);
  assert.match(opportunityDetails, /listarPropostasPorLead/);
  for (const tab of ["Visão geral", "Atividades", "Propostas", "Histórico"]) {
    assert.match(opportunityDetails, new RegExp(tab));
  }
  assert.doesNotMatch(
    opportunityDetails,
    /linkedin\.com\/company\/empresa|contato@empresa|Atividade recente/i,
  );
});

test("a rota usa a tela premium e os estados de carregamento, erro e vazio são explícitos", () => {
  assert.match(dashboardRoute, /section === "pipeline"/);
  assert.match(dashboardRoute, /<PipelinePremiumView/);
  assert.match(pipelineView, /Carregando pipeline/);
  assert.match(pipelineView, /Tentar novamente/);
  assert.match(pipelineView, /pipeline ainda não possui leads/);
  assert.match(pipelineView, /overflow|PipelineBoard/);
});

test("seleção, drawer, edição e integração com a Central usam o mesmo lead", () => {
  assert.match(
    pipelineView,
    /onSelectOpportunity=\{\(opportunity\) => setSelectedId\(opportunity\.id\)\}/,
  );
  assert.match(pipelineView, /selectedOpportunity[\s\S]*<OpportunityDetailsPanel/);
  assert.match(pipelineView, /<LeadFormDialog/);
  assert.match(pipelineView, /return updateLead\(editing\.id/);
  assert.match(pipelineView, /onOpenLead=\{onOpenLead\}/);
  assert.match(
    dashboardRoute,
    /onOpenLead=\{\(leadId\) => \{[\s\S]*setFocusedLeadId\(leadId\)[\s\S]*selectSection\("leads"\)/,
  );
  assert.match(dashboardRoute, /focusLeadId=\{focusedLeadId\}/);
  assert.match(leadsView, /fetchLeadById\(focusLeadId\)/);
  assert.match(leadsView, /setSelectedLead\(toLeadItem\(record\)\)/);
});

test("lead removido ou bloqueado por RLS encerra o foco com feedback sem fallback por nome", () => {
  assert.match(leadsView, /Não foi possível abrir este lead/);
  assert.match(leadsView, /onFocusHandled\?\.\(\)/);
  assert.doesNotMatch(leadsView, /focusLead(?:Name|Company)|business_name.*focusLead/);
});

test("Kanban e detalhes preservam navegação responsiva", () => {
  assert.match(pipelineBoard, /overflow-x-auto/);
  assert.match(pipelineColumn, /min-w-\[210px\]/);
  assert.match(pipelineView, /fixed inset-x-0 bottom-0/);
  assert.match(pipelineView, /max-h-\[85svh\]/);
  assert.match(pipelineView, /lg:sticky/);
});

test("o código de produção não contém o catálogo mock removido", () => {
  const production = [pipelineView, pipelineHook, opportunityDetails].join("\n");
  assert.doesNotMatch(production, /MOCK_OPPORTUNITIES|Clínica Odonto Prime|Auto Center Brasil/);
});

test("RLS do pipeline continua baseada em organização, papel e atribuição", () => {
  assert.match(rlsFunctions, /create or replace function pode_ver_lead/i);
  assert.match(rlsFunctions, /assigned_to/i);
  assert.match(rlsPolicies, /create policy leads_select on leads for select/i);
  assert.match(rlsPolicies, /pode_ver_lead\(org_id, assigned_to\)/i);
});
