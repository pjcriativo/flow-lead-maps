import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../../../src/components/admin/AdminUserOperations.tsx", import.meta.url),
  "utf8",
);

test("a tabela de usuários oferece exclusão individual segura", () => {
  assert.match(source, /deleteSingleUser/);
  assert.match(source, /aria-label={`Excluir conta de \$\{user\.email\}`}/);
});

test("a lista de usuários é paginada em vez de renderizar toda a base", () => {
  assert.match(source, /PAGE_SIZE_OPTIONS/);
  assert.match(source, /paginatedUsers\.map/);
  assert.match(source, /Página \{page\} de \{totalPages\}/);
});
