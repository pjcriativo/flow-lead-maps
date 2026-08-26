// Suite: apresentacao dos limites do Flow Business
// Invariant: limite nulo representa acesso ilimitado e nunca bloqueia o Super Admin.
// Boundary IN: funcoes puras usadas pela interface React.
// Boundary OUT: snapshot PostgreSQL, coberto por test-super-admin-unlimited-flow-business.sql.

import assert from "node:assert/strict";
import test from "node:test";
import {
  planFeatureAvailable,
  planLimitDetail,
  planLimitLabel,
  planLimitProgress,
  planLimitReached,
} from "../src/lib/flow-business-limits.ts";

test("limite nulo permanece ilimitado independentemente do consumo", () => {
  assert.equal(planLimitReached(1_000_000, null), false);
  assert.equal(planFeatureAvailable(null), true);
  assert.equal(planLimitLabel(7, null), "7 · Ilimitado");
  assert.equal(planLimitDetail(null), "Acesso ilimitado");
  assert.equal(planLimitProgress(7, null), 0);
});

test("limite numerico continua bloqueando planos comerciais", () => {
  assert.equal(planLimitReached(1, 1), true);
  assert.equal(planLimitReached(0, 1), false);
  assert.equal(planFeatureAvailable(0), false);
  assert.equal(planLimitProgress(1, 2), 50);
});
