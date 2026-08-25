import assert from "node:assert/strict";
import test from "node:test";
import { BRAND_NAME, BRAND_PRODUCT_DESCRIPTION } from "../../../src/lib/brand.ts";
import {
  dashboardSectionFromSearch,
  dashboardUrlForSection,
} from "../../../src/lib/dashboard-navigation.ts";

test("a marca global é Flow Business e não substitui o nome do módulo Instagram", () => {
  assert.equal(BRAND_NAME, "Flow Business");
  assert.match(BRAND_PRODUCT_DESCRIPTION, /prospecção/i);
});

test("abre e preserva o módulo Instagram pela URL do dashboard", () => {
  assert.equal(dashboardSectionFromSearch("?secao=instagram"), "instagram");
  assert.equal(dashboardSectionFromSearch("?secao=inexistente"), "buscar");
  assert.equal(
    dashboardUrlForSection("https://flowleads.com.br/dashboard?foo=bar", "instagram"),
    "/dashboard?foo=bar&secao=instagram",
  );
  assert.equal(
    dashboardUrlForSection("https://flowleads.com.br/dashboard?secao=instagram", "buscar"),
    "/dashboard?secao=buscar",
  );
});
