// Suite: menu "⋮" das linhas da tela de Leads.
// Invariante: cada item do menu executa uma ação real sobre o lead da linha (nada decorativo) e a
// tabela não estoura a largura por causa de um nome longo (a barra de rolagem escondia as ações).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const menu = readFileSync("src/components/leads-premium/LeadActionsMenu.tsx", "utf8");
const row = readFileSync("src/components/leads-premium/LeadRow.tsx", "utf8");
const table = readFileSync("src/components/leads-premium/LeadsTable.tsx", "utf8");
const view = readFileSync("src/components/leads-premium/LeadsPremiumView.tsx", "utf8");
const dashboard = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");

const acoes = [...menu.matchAll(/\|\s*"([a-z-]+)"/g)]
  .map((m) => m[1])
  .filter((nome, i, todos) => todos.indexOf(nome) === i);

test("the menu declares every action and renders one item for each", () => {
  assert.deepEqual(acoes.sort(), [
    "assign",
    "copy-email",
    "copy-phone",
    "delete",
    "details",
    "edit",
    "export",
    "list",
    "pipeline",
  ]);
  for (const acao of acoes) {
    assert.ok(menu.includes(`onAction("${acao}", lead)`), `item ${acao}`);
  }
});

test("every menu action is handled by the Leads view (no decorative item)", () => {
  const tratamento = view.slice(view.indexOf("const handleRowAction"));
  for (const acao of acoes) {
    assert.match(tratamento, new RegExp(`case "${acao}"`), `acao ${acao} sem tratamento`);
  }
});

test("the row uses the real menu instead of a button that only reselects the lead", () => {
  assert.match(
    row,
    /<LeadActionsMenu lead=\{lead\} canDelete=\{canDelete\} onAction=\{onRowAction\} \/>/,
  );
  assert.doesNotMatch(row, /onQuickAction\?\.\("more"/);
  assert.doesNotMatch(table, /action === "more"/);
  assert.match(table, /onRowAction=\{onRowAction\}/);
  assert.match(view, /onRowAction=\{handleRowAction\}/);
});

test("per-row bulk actions target only that lead and deletion keeps its permission and confirmation", () => {
  const tratamento = view.slice(view.indexOf("const handleRowAction"));
  assert.match(tratamento, /case "assign":\s*setSelectedIds\(new Set\(\[lead\.id\]\)\)/);
  assert.match(tratamento, /case "list":\s*setSelectedIds\(new Set\(\[lead\.id\]\)\)/);
  assert.match(tratamento, /exportSelected\(\[lead\.id\]\)/);
  assert.match(tratamento, /if \(!leadsState\.context\?\.canDelete\) break;/);
  assert.match(tratamento, /window\.confirm\(/);
  assert.match(menu, /canDelete \? \(/);
});

test("the pipeline item navigates to the kanban section", () => {
  assert.match(view, /onOpenPipeline\?\.\(lead\.id\)/);
  assert.match(dashboard, /onOpenPipeline=\{\(\) => selectSection\("pipeline"\)\}/);
});

test("a long company name is truncated instead of widening the table", () => {
  assert.match(row, /<td className="max-w-\[17rem\] px-3 py-3" title=\{lead\.company\}>/);
  assert.match(row, /block truncate text-xs font-semibold/);
});
