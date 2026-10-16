// Suite: WhatsApp organization authorization policy.
// Invariant: every WhatsApp operation requires an explicit authorized organization and role.
// Boundary IN: pure role, ownership, assignment, and request-context decisions.
// Boundary OUT: JWT/database lookup and Evolution I/O, covered by edge contract tests.
import test from "node:test";
import assert from "node:assert/strict";
import {
  canUseWhatsapp,
  isAssignedConversationAllowed,
  isResourceInOrganization,
  normalizeOrganizationId,
} from "./whatsapp-policy.ts";

test("requires an explicit organization id", () => {
  assert.equal(normalizeOrganizationId(undefined), null);
  assert.equal(normalizeOrganizationId("  "), null);
  assert.equal(normalizeOrganizationId("org-a"), "org-a");
});

test("super admin must still operate inside an explicitly selected organization", () => {
  assert.equal(canUseWhatsapp("super_admin", "manage_numbers"), true);
  assert.equal(normalizeOrganizationId(null), null);
});

test("admin and gerente can manage numbers", () => {
  for (const role of ["admin", "gerente"]) {
    assert.equal(canUseWhatsapp(role, "manage_numbers"), true);
  }
});

test("operational roles cannot manage numbers", () => {
  for (const role of ["vendedor", "sdr", "suporte", null, "unknown"]) {
    assert.equal(canUseWhatsapp(role, "manage_numbers"), false);
  }
});

test("admin and gerente can manage campaign drafts", () => {
  for (const role of ["admin", "gerente"]) {
    assert.equal(canUseWhatsapp(role, "manage_campaigns"), true);
  }
});

test("mass campaign sending is denied to every role until atomic reservation exists", () => {
  for (const role of ["super_admin", "admin", "gerente", "vendedor", "sdr", "suporte"]) {
    assert.equal(canUseWhatsapp(role, "send_campaign"), false);
  }
});

test("all supported organization roles can read conversations", () => {
  for (const role of ["admin", "gerente", "vendedor", "sdr", "suporte"]) {
    assert.equal(canUseWhatsapp(role, "view_conversations"), true);
  }
});

test("all supported organization roles can use scripts", () => {
  for (const role of ["admin", "gerente", "vendedor", "sdr", "suporte"]) {
    assert.equal(canUseWhatsapp(role, "use_scripts"), true);
  }
});

test("only administrative roles can edit scripts and automations", () => {
  for (const role of ["admin", "gerente", "super_admin"]) {
    assert.equal(canUseWhatsapp(role, "manage_scripts"), true);
    assert.equal(canUseWhatsapp(role, "manage_automations"), true);
  }
  for (const role of ["vendedor", "sdr", "suporte"]) {
    assert.equal(canUseWhatsapp(role, "manage_scripts"), false);
    assert.equal(canUseWhatsapp(role, "manage_automations"), false);
  }
});

test("a resource from another organization is never authorized", () => {
  assert.equal(isResourceInOrganization("org-a", "org-b"), false);
  assert.equal(isResourceInOrganization(null, "org-a"), false);
  assert.equal(isResourceInOrganization("org-a", "org-a"), true);
});

test("admin, gerente, and suporte may answer any persisted conversation in their organization", () => {
  for (const role of ["admin", "gerente", "suporte", "super_admin"]) {
    assert.equal(
      isAssignedConversationAllowed({
        role,
        userId: "user-a",
        assignedTo: "user-b",
        leadId: "lead-a",
      }),
      true,
    );
  }
});

test("vendedor and sdr may answer only conversations assigned to themselves", () => {
  for (const role of ["vendedor", "sdr"]) {
    assert.equal(
      isAssignedConversationAllowed({
        role,
        userId: "user-a",
        assignedTo: "user-a",
        leadId: "lead-a",
      }),
      true,
    );
    assert.equal(
      isAssignedConversationAllowed({
        role,
        userId: "user-a",
        assignedTo: "user-b",
        leadId: "lead-a",
      }),
      false,
    );
    assert.equal(
      isAssignedConversationAllowed({ role, userId: "user-a", assignedTo: null, leadId: null }),
      false,
    );
  }
});
