// Suite: wiring da tela Inteligência
// Invariant: conclusão depende de snapshot real, CRM usa RPC idempotente e AISA mantém fallback social.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const screen = readFileSync(
  "src/components/instagram/competitors/CompetitorIntelligence.tsx",
  "utf8",
);
const edge = readFileSync("supabase/functions/instagram-discovery/index.ts", "utf8");
const hunter = readFileSync("src/components/instagram/hunter/InstagramClientHunter.tsx", "utf8");
const migration = readFileSync(
  "supabase/migrations/095_flow_business_operating_system.sql",
  "utf8",
);

for (const fake of [
  "DEFAULT_GROWTH_DATA",
  "DEFAULT_MONITORED_COMPETITORS",
  "DEFAULT_FEATURED_PROFILES",
  "12.4K",
  "340%",
  "3.5%",
]) {
  assert.equal(screen.includes(fake), false, `a tela não pode depender do demonstrativo ${fake}`);
}
assert.match(screen, /!result\.jobId \|\| !result\.snapshot/);
assert.match(screen, /Análise parcial/);
assert.match(screen, /periodDays: validated\.periodDays/);

for (const capability of [
  "instagram.getProfile",
  "instagram.getUserPosts",
  "instagram.getPostComments",
]) {
  assert.match(edge, new RegExp(`capability: "${capability.replace(".", "\\.")}"`));
}
assert.match(edge, /\?\?\s*\(await executarActor/);
assert.match(edge, /onlyPostsNewerThan: `\$\{input\.periodDays\} days`/);

assert.match(hunter, /addLeadToFlowBusiness\(opportunity\.lead_id\)/);
assert.match(hunter, /await updateOpportunityStatus\(opportunity\.id, "saved"\)/);
assert.match(migration, /where org_id = v_lead\.org_id and lead_id = v_lead\.id/);
assert.match(migration, /if v_card_id is not null then return v_card_id/);

console.log("OK: jobs verificáveis, AISA/fallback e CRM idempotente conectados.");
