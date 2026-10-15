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
import { readFileSync } from "node:fs";
import {
  assertExpectedRevision,
  canManageCampaignPersistence,
  createCampaignSnapshot,
  deriveRecipientDecisions,
  resolveTemplateCopyId,
} from "../src/lib/campaign-persistence.ts";
import {
  PersistenceSchemaPendingError,
  throwPersistenceError,
} from "../src/lib/persistence-errors.ts";

const migration112 = readFileSync(
  new URL("../supabase/migrations/112_persistencia_biblioteca_estudio.sql", import.meta.url),
  "utf8",
);

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

test("template global é imutável e personalização exige ID de cópia", () => {
  assert.throws(
    () =>
      resolveTemplateCopyId({ global: true, sourceId: "global-1", persistedCopyId: "global-1" }),
    /não pode ser sobrescrito/,
  );
  assert.equal(
    resolveTemplateCopyId({ global: true, sourceId: "global-1", persistedCopyId: "copy-org-a" }),
    "copy-org-a",
  );
});

test("snapshot de campanha não muda quando a biblioteca é atualizada", () => {
  const template = {
    id: "global-1",
    version: "1.0",
    html: "<p>Original</p>",
    blocks: [{ text: "A" }],
  };
  const snapshot = createCampaignSnapshot(template);
  template.version = "2.0";
  template.html = "<p>Novo</p>";
  template.blocks[0].text = "B";
  assert.deepEqual(snapshot, {
    id: "global-1",
    version: "1.0",
    html: "<p>Original</p>",
    blocks: [{ text: "A" }],
  });
});

test("seleção parcial é preservada sem inventar elegibilidade", () => {
  const decisions = deriveRecipientDecisions({
    activeOrgId: "org-a",
    listId: "list-a",
    selectedLeadIds: ["lead-2"],
    candidates: [
      { id: "lead-1", orgId: "org-a", listId: "list-a", email: "one@example.com", optOut: false },
      { id: "lead-2", orgId: "org-a", listId: "list-a", email: "two@example.com", optOut: false },
    ],
  });
  assert.deepEqual(
    decisions.map((item) => item.selected),
    [false, true],
  );
  assert.deepEqual(
    decisions.map((item) => item.eligibility),
    ["nao_validado", "nao_validado"],
  );
});

test("destinatários distinguem ausência, descadastro, reclamação, bloqueio e confirmação", () => {
  const decisions = deriveRecipientDecisions({
    activeOrgId: "org-a",
    listId: "list-a",
    selectedLeadIds: [],
    candidates: [
      { id: "missing", orgId: "org-a", listId: "list-a", email: null, optOut: false },
      { id: "optout", orgId: "org-a", listId: "list-a", email: "out@example.com", optOut: true },
      {
        id: "complaint",
        orgId: "org-a",
        listId: "list-a",
        email: "complaint@example.com",
        optOut: false,
        complaint: true,
      },
      {
        id: "blocked",
        orgId: "org-a",
        listId: "list-a",
        email: "blocked@example.com",
        optOut: false,
        blocked: true,
      },
      {
        id: "eligible",
        orgId: "org-a",
        listId: "list-a",
        email: "ok@example.com",
        optOut: false,
        eligibilityConfirmed: true,
      },
    ],
  });
  assert.deepEqual(
    decisions.map((item) => item.eligibility),
    ["sem_email", "descadastro", "reclamacao", "bloqueado", "elegivel_confirmado"],
  );
});

test("endereços são normalizados e duplicatas são bloqueadas", () => {
  const decisions = deriveRecipientDecisions({
    activeOrgId: "org-a",
    listId: "list-a",
    selectedLeadIds: ["lead-1", "lead-2"],
    candidates: [
      {
        id: "lead-1",
        orgId: "org-a",
        listId: "list-a",
        email: " SAME@EXAMPLE.COM ",
        optOut: false,
      },
      { id: "lead-2", orgId: "org-a", listId: "list-a", email: "same@example.com", optOut: false },
    ],
  });
  assert.equal(decisions[0].normalizedEmail, "same@example.com");
  assert.equal(decisions[1].eligibility, "bloqueado");
  assert.match(decisions[1].exclusionReason, /duplicado/);
});

test("lead selecionado de outra lista ou organização é rejeitado", () => {
  assert.throws(
    () =>
      deriveRecipientDecisions({
        activeOrgId: "org-a",
        listId: "list-a",
        selectedLeadIds: ["foreign"],
        candidates: [
          {
            id: "foreign",
            orgId: "org-b",
            listId: "list-a",
            email: "x@example.com",
            optOut: false,
          },
        ],
      }),
    /outra organização/,
  );
  assert.throws(
    () =>
      deriveRecipientDecisions({
        activeOrgId: "org-a",
        listId: "list-a",
        selectedLeadIds: ["unknown"],
        candidates: [],
      }),
    /não pertence à lista/,
  );
});

test("papéis de escrita são restritos a super admin, admin e gerente", () => {
  assert.equal(canManageCampaignPersistence("super_admin"), true);
  assert.equal(canManageCampaignPersistence("admin"), true);
  assert.equal(canManageCampaignPersistence("gerente"), true);
  for (const role of ["vendedor", "sdr", "suporte"])
    assert.equal(canManageCampaignPersistence(role), false);
});

test("controle otimista rejeita edição concorrente", () => {
  assert.doesNotThrow(() => assertExpectedRevision(3, 3));
  assert.throws(() => assertExpectedRevision(2, 3), /Conflito de revisão/);
});

test("migration garante favorito por usuário e organização e assinatura padrão única", () => {
  assert.match(migration112, /idx_template_favoritos_usuario/);
  assert.match(migration112, /uq_assinatura_padrao_org[\s\S]*where is_padrao and not is_global/);
  assert.match(migration112, /pg_advisory_xact_lock/);
});

test("migration integra rascunho à campanha oficial, snapshots e reabertura por ID", () => {
  assert.match(migration112, /alter table public\.campanhas/);
  assert.doesNotMatch(migration112, /create table if not exists public\.campanhas\s*\(/);
  assert.match(migration112, /campanha_id uuid primary key references public\.campanhas/);
  assert.match(migration112, /template_html_snapshot text not null/);
  assert.match(migration112, /assinatura_html_snapshot text not null/);
});

test("migration cobre CRUD autorizado, auditoria e isolamento RLS", () => {
  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(migration112, new RegExp(`email_templates_${operation}`));
    assert.match(migration112, new RegExp(`assinaturas_${operation}`));
  }
  assert.match(migration112, /before update or delete/);
  assert.match(migration112, /pertence_a_org\(org_id\)/);
});

test("migration salva campanha e destinatários atomicamente com revisão condicional", () => {
  assert.match(migration112, /create or replace function public\.salvar_rascunho_estudio/);
  assert.match(
    migration112,
    /where id=p_campanha_id and org_id=p_org_id and canal='email' and revisao=p_revisao_esperada/,
  );
  assert.match(migration112, /raise exception 'Conflito de revisão/);
  assert.match(
    migration112,
    /delete from campanha_email_destinatarios where campanha_id=v_campanha/,
  );
});

test("migration não agenda, não envia e não chama Resend", () => {
  assert.doesNotMatch(migration112, /resend|pg_cron|net\.http|http_post/i);
  assert.doesNotMatch(migration112, /status\s*=\s*'ativa'/i);
});

test("migration usa uma fronteira de tag compativel com o regex do PostgreSQL", () => {
  assert.match(migration112, /\(\[\[:space:\]\/\>\]\)/);
  assert.doesNotMatch(migration112, /\(script\|iframe\|object\|embed\|form\|meta\|base\)\\b/);
});

test("RPC valida o contrato JSON, a revisao inicial e preserva o canal de e-mail", () => {
  assert.match(migration112, /coalesce\(jsonb_typeof\(p_draft\),'null'\)\s*<>\s*'object'/);
  assert.match(migration112, /p_revisao_esperada\s*<>\s*0/);
  assert.match(
    migration112,
    /where id=p_campanha_id and org_id=p_org_id and canal='email' and revisao=p_revisao_esperada/,
  );
  assert.match(
    migration112,
    /coalesce\(\(p_draft->'leadsIdsSelecionados'\) \? l\.id::text,false\)/,
  );
});

test("filhos de campanha possuem integridade composta de organizacao", () => {
  assert.match(migration112, /foreign key\(campanha_id,org_id\)/);
  assert.match(migration112, /references public\.campanhas\(id,org_id\)/);
  assert.match(migration112, /foreign key\(lead_id,org_id\)/);
  assert.match(migration112, /references public\.leads\(id,org_id\)/);
});

test("RLS restringe escrita de rascunhos oficiais por papel", () => {
  for (const operation of ["insert", "update", "delete"]) {
    assert.match(
      migration112,
      new RegExp(`campanhas_estudio_${operation}_restrito[\\s\\S]*as restrictive for ${operation}`),
    );
  }
});

test("troca de assinatura padrao remove a anterior antes de ativar a nova", () => {
  assert.match(
    migration112,
    /update assinaturas_corporativas set is_padrao=false[\s\S]*update assinaturas_corporativas set is_padrao=true/,
  );
  assert.doesNotMatch(migration112, /set is_padrao=\(id=p_assinatura_id\)/);
});

test("ativos privados nao podem trocar de identidade ou organizacao", () => {
  assert.match(migration112, /new\.id is distinct from old\.id/);
  assert.match(migration112, /new\.org_id is distinct from old\.org_id/);
  assert.match(migration112, /new\.created_by is distinct from old\.created_by/);
});

test("campanhas nao podem trocar de tenant ou canal por update direto", () => {
  assert.match(migration112, /create or replace function public\.proteger_identidade_campanha/);
  assert.match(migration112, /new\.org_id is distinct from old\.org_id/);
  assert.match(migration112, /new\.canal is distinct from old\.canal/);
  assert.match(migration112, /before update on public\.campanhas/);
});

test("schema pendente é distinguido de uma falha comum do Supabase", () => {
  assert.throws(
    () => throwPersistenceError({ code: "PGRST205", message: "table missing" }),
    PersistenceSchemaPendingError,
  );
  assert.throws(
    () => throwPersistenceError({ code: "XX000", message: "Supabase indisponível" }),
    /Supabase indisponível/,
  );
});
