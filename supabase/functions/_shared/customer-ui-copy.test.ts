import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const instagramCustomerFiles = [
  "../../../src/components/instagram/accounts/FlowBusinessAccounts.tsx",
  "../../../src/components/instagram/dashboard/FlowBusinessToday.tsx",
  "../../../src/components/instagram/inbox/InstagramInbox.tsx",
  "../../../src/components/instagram/flows/FlowBusinessFlowBuilder.tsx",
  "../../../src/components/instagram/navigation/InstagramAppShell.tsx",
  "../../../src/components/instagram/navigation/instagram-navigation.ts",
  "../../../src/components/instagram/comments/CommentsHunter.tsx",
  "../../../src/components/instagram/content/ContentDiscoveryHunter.tsx",
  "../../../src/components/instagram/competitors/CompetitorIntelligence.tsx",
  "../../../src/components/instagram/dashboard/InstagramAnalyticsDashboard.tsx",
  "../../../src/components/instagram/hunter/InstagramClientHunter.tsx",
  "../../../src/components/leads/instagram/InstagramSearchPanel.tsx",
  "../../../src/components/leads/FonteProspeccao.tsx",
].map((relativePath) => new URL(relativePath, import.meta.url));

const operationalCustomerFiles = [
  "../../../src/components/automacao/AutomacaoSection.tsx",
  "../../../src/components/campanhas/CampanhasSection.tsx",
  "../../../src/components/leads/LeadsManager.tsx",
  "../../../src/lib/leads-api.ts",
].map((relativePath) => new URL(relativePath, import.meta.url));

test("a área do Instagram não expõe provedores nem integração oficial ao cliente", () => {
  const source = instagramCustomerFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  assert.doesNotMatch(
    source,
    /Meta oficial|API oficial|aprovação da Meta|permitida pela Meta|validada pela Meta|Unipile|Hosted Auth|Evolution API/,
  );
});

test("as telas operacionais do cliente não exibem custos internos de API", () => {
  const source = [...instagramCustomerFiles, ...operationalCustomerFiles]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  assert.doesNotMatch(
    source,
    /US\$|custo (?:máximo|real|Apify|por novo lead|zero)|custos e tendências|sem nova cobrança|nova cobrança|teto de gasto|gasto no mês|custa US\$|sem custo de IA|usa IA \(custo/i,
  );
});

test("falhas da conexão do Instagram não retornam códigos internos ao cliente", () => {
  const connectionFunction = readFileSync(
    new URL("../flow-business-unipile/index.ts", import.meta.url),
    "utf8",
  );
  const inbox = readFileSync(
    new URL("../../../src/components/instagram/inbox/InstagramInbox.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(connectionFunction, /json\(\{ error: "unipile/i);
  assert.match(connectionFunction, /instagram_connection_unavailable/);
  assert.match(connectionFunction, /instagram_message_failed/);
  assert.doesNotMatch(inbox, /if \(data\?\.error\)/);
});
