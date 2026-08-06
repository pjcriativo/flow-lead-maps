#!/usr/bin/env node
// Suite: carregamento do histórico permanente de leads
// Invariant: todas as páginas de place_ids são consideradas, inclusive acima de 1.000 registros.
// Boundary IN: paginação e normalização do histórico de deduplicação.
// Boundary OUT: PostgreSQL, RLS e inserção atômica (scripts/prova-dedupe-leads.sql).
import assert from "node:assert/strict";
import {
  collectAllSeenLeadIdentities,
  leadBusinessIdentity,
  normalizeLeadIdentityPart,
} from "../supabase/functions/_shared/lead-dedupe.ts";

const firstPage = Array.from({ length: 1_000 }, (_, index) => ({
  place_id: `place:${index}`,
  business_key: `empresa${index}|rua${index}`,
}));
const pages = [
  firstPage,
  [
    { place_id: "place:1000", business_key: "empresa1000|rua1000" },
    { place_id: "place:1001", business_key: "empresa1001|rua1001" },
  ],
];
const requestedRanges = [];

const seen = await collectAllSeenLeadIdentities(async (from, to) => {
  requestedRanges.push([from, to]);
  return pages[requestedRanges.length - 1] ?? [];
});

assert.equal(seen.placeIds.size, 1_002);
assert.equal(seen.businessKeys.size, 1_002);
assert.ok(seen.placeIds.has("place:0"));
assert.ok(seen.placeIds.has("place:1001"));
assert.ok(seen.businessKeys.has("empresa1001|rua1001"));
assert.deepEqual(requestedRanges, [
  [0, 999],
  [1000, 1999],
]);

assert.equal(normalizeLeadIdentityPart(" Clínica Veterinária! "), "clinicaveterinaria");
assert.equal(
  leadBusinessIdentity("Clínica Veterinária", "Rua das Flores, 10"),
  leadBusinessIdentity("CLINICA veterinaria", "RUA DAS FLORES 10"),
);

console.log("OK: deduplicação carrega todo o histórico da conta sem truncar em 1.000 leads.");
