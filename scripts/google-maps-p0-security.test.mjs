/**
 * Suite: Google Maps P0 security invariants.
 * Invariant: untrusted provider data is rendered as text, tenant selection fails closed,
 * and database/client contracts do not expose privileged consumption data.
 * In boundary: pure security helpers and versioned source contracts.
 * Out boundary: browser Leaflet internals and applying PostgreSQL migrations.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createLeafletPopupContent,
  normalizeExternalHttpUrl,
} from "../src/lib/leaflet-safe-content.ts";
import { resolveActiveMembership } from "../src/lib/active-organization-selection.ts";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

class FakeElement {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.textContent = "";
  }
  appendChild(child) {
    this.children.push(child);
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

test("Leaflet content uses DOM text nodes and rejects executable URLs", () => {
  const source = read("src/lib/leaflet-safe-content.ts");
  assert.match(source, /textContent/);
  assert.match(source, /protocol !== "http:"/);
  assert.match(source, /protocol !== "https:"/);

  for (const file of [
    "src/components/google-maps-premium/GoogleMapsRunningMapPanel.tsx",
    "src/components/google-maps-premium/GoogleMapsSearchResultsView.tsx",
    "src/components/google-maps-premium/GoogleMapsHistoryMap.tsx",
  ]) {
    const component = read(file);
    assert.match(component, /createLeaflet(?:Popup|Text)Content/);
    assert.doesNotMatch(component, /bindPopup\(`|bindTooltip\(lead\.business_name/);
  }
});

test("malicious HTML remains inert text in popup content", () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: (tag) => new FakeElement(tag) };
  try {
    const popup = createLeafletPopupContent({
      businessName: '<img src=x onerror="alert(1)">',
      address: "<script>alert(2)</script>",
      phone: '\" onmouseover="alert(3)',
      website: "javascript:alert(4)",
    });
    assert.equal(popup.children[0].textContent, '<img src=x onerror="alert(1)">');
    assert.equal(popup.children[1].textContent, "<script>alert(2)</script>");
    assert.equal(popup.children[2].textContent, '\" onmouseover="alert(3)');
    assert.equal(
      popup.children.some((child) => child.tag === "a"),
      false,
    );
    assert.equal(normalizeExternalHttpUrl("data:text/html,<script>alert(1)</script>"), null);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("active organization never silently selects the first membership", () => {
  const source = read("src/lib/active-organization.ts");
  const resolver = read("src/lib/active-organization-selection.ts");
  assert.match(source, /memberships\?\.length === 1/);
  assert.match(resolver, /Selecione uma organiza/);
  assert.match(resolver, /memberships\.find/);
  assert.match(read("src/lib/leads-api.ts"), /org_id:\s*params\.orgId/);
  assert.match(read("supabase/functions/search-leads/index.ts"), /validateOrganizationAccess/);
});

test("multi-organization resolution fails closed and follows explicit switching", () => {
  const memberships = [
    { org_id: "org-a", papel: "admin" },
    { org_id: "org-b", papel: "vendedor" },
  ];
  assert.throws(() => resolveActiveMembership(memberships, null), /Selecione uma organização/);
  assert.equal(resolveActiveMembership(memberships, "org-a").org_id, "org-a");
  assert.equal(resolveActiveMembership(memberships, "org-b").org_id, "org-b");
  assert.throws(() => resolveActiveMembership(memberships, "org-c"), /não está disponível/);
});

test("migration revokes raw logs and changes leads list FK to RESTRICT", () => {
  const migration = read("supabase/migrations/110_google_maps_p0_security.sql");
  assert.match(
    migration,
    /REVOKE ALL ON TABLE public\.api_consumption_logs FROM anon, authenticated/i,
  );
  assert.match(migration, /google_maps_search_history/);
  assert.match(migration, /RETURNS TABLE/i);
  assert.match(migration, /ON DELETE RESTRICT/i);
  assert.doesNotMatch(
    migration,
    /GRANT SELECT ON TABLE public\.api_consumption_logs TO authenticated/i,
  );
});

test("all five maps preserve OpenStreetMap attribution", () => {
  const config = read("src/lib/map-config.ts");
  assert.match(config, /openstreetmap\.org\/copyright/);
  for (const file of [
    "GoogleMapsMapPanel.tsx",
    "GoogleMapsRunningMapPanel.tsx",
    "GoogleMapsSearchResultsView.tsx",
    "GoogleMapsCompanyDetails.tsx",
    "GoogleMapsHistoryMap.tsx",
  ]) {
    assert.doesNotMatch(
      read(`src/components/google-maps-premium/${file}`),
      /attributionControl:\s*false/,
    );
  }
});

test("history has no raw consumption table access or privileged identifiers", () => {
  const history = read("src/components/google-maps-premium/useGoogleMapsHistory.ts");
  const types = read("src/components/google-maps-premium/google-maps-history-types.ts");
  assert.doesNotMatch(history, /from\("api_consumption_logs"\)/);
  assert.match(history, /google_maps_search_history/);
  assert.doesNotMatch(types, /externalRunId|rawConfig/);
});
