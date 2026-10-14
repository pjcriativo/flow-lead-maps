import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SIGNATURE_DATA,
  OFFICIAL_CORPORATE_SIGNATURES,
  normalizeSignatureUrl,
  renderSignatureHtml,
} from "../src/components/campanhas-premium/templates/templates-data.ts";
import { resolveActiveMembership } from "../src/lib/active-organization-selection.ts";
import { loadStudioLists, mapStudioLists } from "../src/lib/campaign-studio-lists.ts";

test("assinatura escapa HTML fornecido em campos editáveis", () => {
  const template = OFFICIAL_CORPORATE_SIGNATURES[0].htmlTemplate;
  const rendered = renderSignatureHtml(template, {
    ...DEFAULT_SIGNATURE_DATA,
    nome: '<img src=x onerror="globalThis.pwned=true">',
    empresa: "</td><script>alert(1)</script><td>",
    site: 'empresa.example" onmouseover="alert(1)',
  });

  assert.doesNotMatch(rendered, /<(?:script|img)\b/i);
  assert.match(rendered, /&lt;img/);
  assert.match(rendered, /&lt;script&gt;/);
  assert.doesNotMatch(rendered, /href="https:\/\/empresa\.example" onmouseover=/i);
});

test("assinatura rejeita protocolos e URLs não HTTPS", () => {
  for (const dangerous of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "http://example.com",
  ]) {
    assert.equal(normalizeSignatureUrl(dangerous), "#");
  }
  assert.equal(
    normalizeSignatureUrl("https://empresa.example/perfil"),
    "https://empresa.example/perfil",
  );
});

test("seleção de organização exige escolha explícita quando há duas memberships", () => {
  const memberships = [
    { org_id: "org-a", papel: "admin" },
    { org_id: "org-b", papel: "membro" },
  ];

  assert.throws(() => resolveActiveMembership(memberships, null), /Selecione uma organização/);
  assert.equal(resolveActiveMembership(memberships, "org-a").org_id, "org-a");
  assert.equal(resolveActiveMembership(memberships, "org-b").org_id, "org-b");
  assert.throws(
    () => resolveActiveMembership(memberships, "org-inexistente"),
    /não está disponível/,
  );
});

test("mapeia listas e contagens reais de leads e e-mails", () => {
  const result = mapStudioLists(
    [
      {
        id: "lista-1",
        org_id: "org-a",
        name: "Clientes",
        niche: "Serviços",
        city: "Curitiba",
        uf: "PR",
      },
    ],
    [
      { list_id: "lista-1", email: "um@example.com", score_breakdown: { is_gold: true } },
      { list_id: "lista-1", email: null, score_breakdown: null },
      { list_id: "lista-1", email: "  ", score_breakdown: { is_gold: false } },
    ],
    "org-a",
  );

  assert.deepEqual(result, [
    {
      id: "lista-1",
      orgId: "org-a",
      nome: "Clientes",
      nicho: "Serviços",
      cidade: "Curitiba",
      uf: "PR",
      estado: "com_leads",
      totalLeads: 3,
      leadsQualificados: 1,
      leadsComEmail: 1,
    },
  ]);
});

test("lista vazia preserva zero comprovado", () => {
  const [lista] = mapStudioLists(
    [{ id: "lista-vazia", org_id: "org-a", name: "Vazia", niche: "Geral", city: "", uf: null }],
    [],
    "org-a",
  );

  assert.equal(lista.estado, "vazia");
  assert.equal(lista.totalLeads, 0);
  assert.equal(lista.leadsComEmail, 0);
});

test("rejeita lista pertencente a outra organização", () => {
  assert.throws(
    () =>
      mapStudioLists(
        [{ id: "lista-b", org_id: "org-b", name: "Privada", niche: "Geral", city: "", uf: null }],
        [],
        "org-a",
      ),
    /outra organização/,
  );
});

test("falha do repositório é propagada sem fallback fictício", async () => {
  const repository = {
    async listLists() {
      throw new Error("Supabase indisponível");
    },
    async listLeads() {
      return [];
    },
  };

  await assert.rejects(() => loadStudioLists(repository, "org-a"), /Supabase indisponível/);
});
