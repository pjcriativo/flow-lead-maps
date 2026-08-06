// Suite: preços dos planos públicos
// Invariant: Básico, Pro e Agência exibem os mensais aprovados e o anual aplica exatamente 50%.
// Boundary IN: catálogo padrão e cálculo puro do desconto anual.
// Boundary OUT: renderização React, CMS e persistência no Supabase.
import assert from "node:assert/strict";
import {
  ANNUAL_DISCOUNT_PERCENT,
  DEFAULT_PRICING_PLANS,
  calcularPrecoAnual,
} from "../src/lib/pricing-plans.ts";

assert.equal(ANNUAL_DISCOUNT_PERCENT, 50);

const esperados = [
  { name: "Básico", monthly: 147, mensalEquivalente: 73.5, totalAnual: 882 },
  { name: "Pro", monthly: 297, mensalEquivalente: 148.5, totalAnual: 1782 },
  { name: "Agência", monthly: 897, mensalEquivalente: 448.5, totalAnual: 5382 },
];

assert.deepEqual(
  DEFAULT_PRICING_PLANS.map((plano) => {
    const anual = calcularPrecoAnual(plano.monthly);
    return { name: plano.name, monthly: plano.monthly, ...anual };
  }),
  esperados,
);

console.log("OK: preços mensais e anuais dos três planos conferem.");
