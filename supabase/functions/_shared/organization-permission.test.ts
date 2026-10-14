// Suite: organization authorization for lead search.
// Invariant: only an authorized membership in the requested org, or super admin, may search.
// Boundary IN: role decision. Boundary OUT: database query/RLS, covered by the migration contract.
import test from "node:test";
import assert from "node:assert/strict";
import { canSearchOrganization } from "./organization-permission.ts";

test("permits supported roles only in an existing requested organization", () => {
  for (const membershipRole of ["admin", "gerente", "vendedor", "sdr"]) {
    assert.equal(
      canSearchOrganization({ organizationExists: true, isSuperAdmin: false, membershipRole }),
      true,
    );
  }
  for (const membershipRole of [null, "suporte", "super_admin", "unknown"]) {
    assert.equal(
      canSearchOrganization({ organizationExists: true, isSuperAdmin: false, membershipRole }),
      false,
    );
  }
});

test("preserves super-admin access but rejects nonexistent organizations", () => {
  assert.equal(
    canSearchOrganization({ organizationExists: true, isSuperAdmin: true, membershipRole: null }),
    true,
  );
  assert.equal(
    canSearchOrganization({ organizationExists: false, isSuperAdmin: true, membershipRole: null }),
    false,
  );
});
