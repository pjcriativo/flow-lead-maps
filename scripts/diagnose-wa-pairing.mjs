import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("Supabase credentials are required");

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: instances, error: instancesError } = await admin
  .from("wa_instancias")
  .select(
    "id,org_id,nome,numero,status,funcao,criada_em,atualizado_em,provider_status,operational_health,health_error_code",
  )
  .order("criada_em", { ascending: true });
if (instancesError) throw instancesError;

const { data: tokens, error: tokensError } = await admin
  .from("wa_instancia_tokens")
  .select("instancia_id");
if (tokensError) throw tokensError;

const { data: memberships, error: membershipsError } = await admin
  .from("memberships")
  .select("org_id,user_id,papel");
if (membershipsError) throw membershipsError;

const instancesWithToken = new Set((tokens ?? []).map((row) => row.instancia_id));
const orgLabels = new Map();
let nextOrg = 1;
const orgLabel = (orgId) => {
  if (!orgLabels.has(orgId)) orgLabels.set(orgId, `org-${nextOrg++}`);
  return orgLabels.get(orgId);
};

const rows = [];
for (const instance of instances ?? []) {
  const hasToken = instancesWithToken.has(instance.id);
  rows.push({
    org: orgLabel(instance.org_id),
    instance: instance.nome,
    localStatus: instance.status,
    hasNumber: Boolean(instance.numero),
    function: instance.funcao,
    hasToken,
    health: instance.operational_health,
    healthError: instance.health_error_code,
  });
}

const managersByOrg = new Map();
for (const membership of memberships ?? []) {
  const label = orgLabel(membership.org_id);
  const current = managersByOrg.get(label) ?? { total: 0, canManage: 0 };
  current.total += 1;
  if (["admin", "gerente"].includes(membership.papel)) current.canManage += 1;
  managersByOrg.set(label, current);
}

console.log(
  JSON.stringify(
    {
      totals: {
        organizationsWithInstances: new Set(rows.map((row) => row.org)).size,
        instances: rows.length,
        tokens: tokens?.length ?? 0,
        missingTokens: rows.filter((row) => !row.hasToken).length,
      },
      memberships: Object.fromEntries(managersByOrg),
      instances: rows,
    },
    null,
    2,
  ),
);
