#!/usr/bin/env node
// Suite: paginação do consumo de APIs
// Invariant: todas as páginas são coletadas uma vez, mesmo acima de 1.000 registros.
// Boundary IN: paginação pura por offset, total opcional e deduplicação por ID.
// Boundary OUT: Supabase, Apify e integração da Edge admin-acoes.
import assert from "node:assert/strict";
import test from "node:test";

import { collectUniqueOffsetPages } from "../supabase/functions/_shared/offset-pagination.ts";

test("coleta mais de 1.000 registros quando o provedor não informa o total", async () => {
  const source = Array.from({ length: 2_007 }, (_, index) => ({ id: `log-${index}` }));
  const requests = [];

  const rows = await collectUniqueOffsetPages(
    async (offset, limit) => {
      requests.push([offset, limit]);
      return { items: source.slice(offset, offset + limit) };
    },
    (row) => row.id,
  );

  assert.equal(rows.length, 2_007);
  assert.equal(rows[0].id, "log-0");
  assert.equal(rows.at(-1)?.id, "log-2006");
  assert.deepEqual(requests, [
    [0, 1_000],
    [1_000, 1_000],
    [2_000, 1_000],
    [2_007, 1_000],
  ]);
});

test("usa o total informado para concluir a última página sem uma chamada extra", async () => {
  const source = Array.from({ length: 1_205 }, (_, index) => ({ id: `run-${index}` }));
  const offsets = [];

  const rows = await collectUniqueOffsetPages(
    async (offset, limit) => {
      offsets.push(offset);
      return {
        items: source.slice(offset, offset + limit),
        total: source.length,
      };
    },
    (row) => row.id,
  );

  assert.equal(rows.length, 1_205);
  assert.deepEqual(offsets, [0, 1_000]);
});

test("remove IDs repetidos entre páginas sem alterar a ordem da primeira ocorrência", async () => {
  const pages = new Map([
    [0, [{ id: "a" }, { id: "b" }]],
    [2, [{ id: "b" }, { id: "c" }]],
    [4, []],
  ]);

  const rows = await collectUniqueOffsetPages(
    async (offset) => ({ items: pages.get(offset) ?? [] }),
    (row) => row.id,
    2,
  );

  assert.deepEqual(
    rows.map((row) => row.id),
    ["a", "b", "c"],
  );
});

test("rejeita uma página vazia antes de alcançar o total anunciado", async () => {
  await assert.rejects(
    () =>
      collectUniqueOffsetPages(
        async (offset) => ({
          items: offset === 0 ? [{ id: "run-0" }] : [],
          total: 3,
        }),
        (row) => row.id,
        1,
      ),
    /página vazia.*offset 1.*total 3/i,
  );
});
