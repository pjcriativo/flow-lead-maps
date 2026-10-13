import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("a exclusão de listas bloqueia listas com leads e exige papel administrativo", () => {
  const service = read("src/lib/lists-api.ts");

  assert.match(service, /papel_do_usuario/);
  assert.match(service, /admin.*gerente|gerente.*admin/s);
  assert.match(service, /count:\s*["']exact["']/);
  assert.match(service, /Lista não pode ser excluída.*leads vinculados/s);
});

test("a exclusão não tenta apagar nem desvincular leads, propostas ou históricos", () => {
  const service = read("src/lib/lists-api.ts");
  const deleteBlock = service.slice(service.indexOf("export async function excluirLista"));

  assert.doesNotMatch(deleteBlock, /from\(["']leads["']\)\.delete/);
  assert.doesNotMatch(deleteBlock, /list_id:\s*null/);
  assert.match(deleteBlock, /from\(["']lead_lists["']\)\.delete/);
});

test("a criação automática rejeita lista vazia e verifica todos os vínculos persistidos", () => {
  const service = read("src/lib/lists-api.ts");
  const createBlock = service.slice(
    service.indexOf("export async function criarListaComLeads"),
    service.indexOf("export async function listarListas"),
  );

  assert.match(createBlock, /leadIds\.length === 0/);
  assert.match(createBlock, /new Set\(params\.leadIds\)/);
  assert.match(createBlock, /eq\(["']list_id["'],\s*lista\.id\)/);
  assert.match(createBlock, /vinculados.*uniqueLeadIds\.length/s);
});

test("a coleta só conclui depois da lista e distingue resultado parcial", () => {
  const view = read("src/components/leads/SearchSection.tsx");

  assert.doesNotMatch(view, /case ["']done["']:[\s\S]{0,220}setStatus\(`Concluído/);
  assert.match(view, /Finalizando lista/);
  assert.match(view, /Parcial/);
  assert.match(view, /Leads coletados sem lista/);
});
