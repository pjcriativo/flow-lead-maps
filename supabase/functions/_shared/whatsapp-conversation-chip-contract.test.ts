// Suite: recebimento e atendimento pelo chip correto na Central de Conversas.
// Invariante: toda mensagem individual válida é gravada uma única vez no chip que a recebeu; a
// resposta sai sempre pelo chip da conversa; o número exibido é o do vínculo real.
// Boundary IN: contratos de código, migrations e interface. Boundary OUT: Evolution GO e
// PostgreSQL reais, provados por execução em produção (relatório da entrega).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const webhook = read("supabase/functions/wa-webhook/index.ts");
const responder = read("supabase/functions/wa-responder/index.ts");
const conversations = read("supabase/functions/wa-conversations/index.ts");
const worker = read("supabase/functions/wa-send-worker/index.ts");
const ui = read("src/components/whatsapp/WaConversas.tsx");
const fix = read("supabase/migrations/202610210007_wa_ingest_uuid_min_fix.sql");

test("regression: no WhatsApp migration aggregates a uuid with min/max (not available in Postgres 17)", () => {
  const arquivos = readdirSync("supabase/migrations").filter((nome) =>
    /^2026101|^2026102/.test(nome),
  );
  assert.ok(arquivos.length > 0);
  for (const arquivo of arquivos) {
    const sql = read(`supabase/migrations/${arquivo}`).replace(/--[^\n]*/g, "");
    // A correção 202610210007 e as migrations antigas que ela substitui só podem conter min() de
    // uuid no arquivo ORIGINAL; o arquivo de correção em si nunca.
    if (arquivo === "202610210007_wa_ingest_uuid_min_fix.sql") {
      assert.doesNotMatch(sql, /\b(min|max)\s*\(\s*(\w+\.)?(id|\w+_id)\s*\)/i, arquivo);
    }
  }
  assert.match(fix, /\(array_agg\(l\.id order by l\.id\)\)\[1\] into v_lead/);
  assert.match(fix, /\(array_agg\(id order by id\)\)\[1\],count\(\*\) into v_lead,v_matches/);
});

test("inbound persistence goes through the idempotent RPC and groups stay excluded", () => {
  assert.match(
    webhook,
    /rpc\(\s*"wa_ingest_inbound_message",\s*inboundIngestParams\(inst\.org_id, inst\.id, inbound\)/,
  );
  // Regressão: o webhook lia inbound.contact.remoteId, campo que não existe (TypeError -> 500).
  assert.doesNotMatch(webhook, /inbound\.contact\b/);
  assert.match(webhook, /\.eq\("nome", nomeInstancia\)/);
  assert.match(webhook, /ignored: "not-supported-inbound"/);
  assert.match(
    fix,
    /on conflict\(org_id,instancia_id,externo_id\) where externo_id is not null do nothing/,
  );
});

test("webhook turns any unexpected failure into an explicit retryable 503", () => {
  assert.match(webhook, /async function handleWebhook\(req: Request\)/);
  assert.match(webhook, /catch \(error\) \{[\s\S]*wa-webhook unexpected failure[\s\S]*503/);
  assert.match(webhook, /k !== Deno\.env\.get\("WA_WEBHOOK_SECRET"\)/);
});

test("manual replies use only the conversation's own instance, never the campaign rotation", () => {
  assert.match(responder, /\.eq\("id", conversation\.instancia_id\)/);
  assert.match(
    responder,
    /instanciaDaOrgComToken\(admin, context\.orgId, conversation\.instancia_id\)/,
  );
  assert.doesNotMatch(
    responder,
    /selecionarChipParaEnvio|escolherChipParaEnvio|proximaInstanciaDisparo|rotacionarDisparo|instanciaConversaDaOrg/,
  );
  assert.match(responder, /permission: "reply_conversations"/);
  assert.match(responder, /\.eq\("org_id", context\.orgId\)/);
  assert.match(responder, /wa_reserve_outbound_message/);
  assert.match(responder, /operation_id/);
});

test("an unavailable original chip is reported, never swapped silently", () => {
  assert.match(responder, /"chip_arquivado"/);
  assert.match(responder, /"saude_nao_confirmada"/);
  assert.match(
    responder,
    /checarSaudeChip\(admin, context\.orgId, conversation\.instancia_id, "manual"\)/,
  );
});

test("campaign rotation never rewrites the instance of an existing conversation", () => {
  assert.doesNotMatch(worker, /wa_conversas/);
  const reatribuicoes = [conversations, webhook, responder].filter((codigo) =>
    /from\("wa_conversas"\)\s*\.update\([^)]*instancia_id/.test(codigo),
  );
  assert.equal(reatribuicoes.length, 0);
});

test("the snapshot exposes the real conversation-to-instance link without any token", () => {
  const bloco = conversations.slice(conversations.indexOf("const instanceIds"));
  assert.match(bloco, /\.from\("wa_instancias"\)/);
  assert.match(bloco, /\.eq\("org_id", context\.orgId\)/);
  assert.match(bloco, /\.in\("id", instanceIds\)/);
  assert.match(bloco, /id,nome,numero,status,provider_status,operational_health,funcao,deleted_at/);
  assert.doesNotMatch(bloco.slice(0, bloco.indexOf("let lead = null")), /token/i);
  assert.match(bloco, /instances,/);
});

test("the screen shows the service number in the list, header and right panel", () => {
  assert.match(ui, /<ChipAtendimentoLinha chip=\{c\.chip\} \/>/);
  assert.match(ui, /<ChipAtendimentoCabecalho chip=\{contatoAtivo\.chip\} \/>/);
  assert.match(ui, /<ChipAtendimentoPainel chip=\{contatoAtivo\.chip\} \/>/);
  assert.match(ui, /Atendendo pelo número:/);
  assert.match(ui, /Número WhatsApp utilizado/);
  assert.match(ui, /chip: conversation\.instancia/);
  // Nunca usa o telefone do contato como número de atendimento.
  const componentes = ui.slice(
    ui.indexOf("function ChipAtendimentoLinha"),
    ui.indexOf("export interface ContatoConversa"),
  );
  assert.doesNotMatch(componentes, /\.numero\b(?!Formatado)/);
});

test("realtime listens to messages and conversations of the organization with a bounded fallback", () => {
  assert.match(ui, /table: "wa_mensagens"/);
  assert.match(ui, /table: "wa_conversas"/);
  assert.match(ui, /filter: `org_id=eq\.\$\{context\.orgId\}`/);
  assert.match(ui, /if \(cancelled \|\| authenticationSuspended \|\| inFlight\) return;/);
  assert.match(ui, /Math\.min\(FALLBACK_BASE_DELAY_MS \* 2 \*\* failures, 120_000\)/);
  assert.match(ui, /failures >= MAX_FALLBACK_FAILURES/);
});

test("continuing a conversation through another number is explicit, scoped and audited", () => {
  const migracao = read("supabase/migrations/202610220001_wa_change_conversation_instance.sql");
  // Só quando o número ORIGINAL não está mais disponível; nunca tira conversa de número ativo.
  assert.match(
    migracao,
    /raise exception 'original instance is still active' using errcode = '23514'/,
  );
  // Destino da mesma organização, ativo, conectado e pareado.
  assert.match(
    migracao,
    /i\.org_id = p_org and i\.deleted_at is null\s+and i\.status = 'conectado' and i\.numero is not null/,
  );
  // Mesmas regras de acesso das demais ações de conversa.
  assert.match(migracao, /membership not allowed/);
  assert.match(
    migracao,
    /v_role in \('vendedor', 'sdr'\) and v_conv\.assigned_to is distinct from p_actor/,
  );
  // Auditoria na linha do tempo e na instância de destino.
  assert.match(migracao, /'instance_changed'/);
  assert.match(migracao, /wa_record_instance_event\(/);
  // Nada é movido se o contato já tem conversa no destino.
  assert.match(migracao, /conversation already exists in target/);
  assert.match(
    migracao,
    /revoke all on function public\.wa_change_conversation_instance\(uuid, uuid, uuid, uuid\)\s+from public, anon, authenticated/,
  );
  assert.match(migracao, /to service_role/);
  // O histórico NÃO é reescrito: nenhuma atualização de wa_mensagens na função.
  assert.doesNotMatch(migracao.replace(/--[^\n]*/g, ""), /update public\.wa_mensagens/);
});

test("the change-number action is wired to the real function and lists only connected numbers", () => {
  assert.match(conversations, /"trocar_numero"/);
  assert.match(conversations, /rpc\("wa_change_conversation_instance"/);
  assert.match(conversations, /p_actor: context\.userId/);
  const ativos = conversations.slice(conversations.indexOf("const ativosResult"));
  assert.match(ativos, /\.eq\("org_id", context\.orgId\)/);
  assert.match(ativos, /\.eq\("status", "conectado"\)/);
  assert.match(ativos, /\.is\("deleted_at", null\)/);
  assert.doesNotMatch(ativos.slice(0, ativos.indexOf("let lead = null")), /token/i);
});

test("an archived-number conversation offers the number choice and blocks sending until chosen", () => {
  assert.match(ui, /contatoAtivo\.chip\?\.arquivada/);
  assert.match(ui, /Continuar por este número/);
  assert.match(ui, /trocarNumeroConversaWa\(contatoAtivo\.id, numeroEscolhido\)/);
  assert.match(
    ui,
    /if \(!contatoAtivo \|\| enviandoRef\.current \|\| contatoAtivo\.chip\?\.arquivada\) return;/,
  );
  assert.match(
    ui,
    /disabled=\{\s*enviando \|\| !textoMensagem\.trim\(\) \|\| Boolean\(contatoAtivo\.chip\?\.arquivada\)\s*\}/,
  );
  // A recusa do servidor também fala a língua do atendente, sem citar uma ação de administrador.
  assert.doesNotMatch(responder, /administrador/i);
  assert.match(responder, /Escolha por qual número continuar/);
});

test("creating a CRM lead from a conversation leads to the pipeline, not to the lead list", () => {
  assert.match(ui, /label: "Ver no pipeline"/);
  const destinos = [
    ...ui.matchAll(/dashboardUrlForSection\(\s*window\.location\.href,\s*"(\w+)"/g),
  ].map((m) => m[1]);
  assert.ok(destinos.includes("pipeline"));
  assert.ok(!destinos.includes("leads"), "nenhum atalho da conversa deve levar à lista de leads");
});
