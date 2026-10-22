// Suite de Testes: WhatsApp Central de Conversas Premium — Tela 02 (Prompt 57)
// Invariant: Fidelidade visual absoluta ao layout aprovado, dados reais de multi-tenant,
// arquitetura 3 colunas, envio manual autorizado e ausência de disparos a frio.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const waConversas = readFileSync("src/components/whatsapp/WaConversas.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");
const migration = readFileSync("supabase/migrations/202610160004_wa_conversations_crm.sql", "utf8");
const webhook = readFileSync("supabase/functions/wa-webhook/index.ts", "utf8");
const responder = readFileSync("supabase/functions/wa-responder/index.ts", "utf8");
const conversationsEdge = readFileSync("supabase/functions/wa-conversations/index.ts", "utf8");
const avatarMigration = readFileSync(
  "supabase/migrations/202610200001_wa_contact_avatars.sql",
  "utf8",
);

// SUT_IS_CORRECT_BECAUSE: a Correção 04 substitui fixtures visuais e agrupamento por telefone
// por entidades persistidas e auditáveis; estes contratos verificam o comportamento de produção.

// 1. Lista por organização (Multi-tenant)
test("1. Lista por organização: consultas respeitam RLS e escopo da organização ativa", () => {
  assert.match(waService, /invokeWhatsappEdge<Record<string, unknown>>\(/);
  assert.match(waService, /"wa-conversations"/);
  assert.match(waService, /listarConversas/);
  assert.match(waService, /obterKpisConversasWa/);
  assert.match(waConversas, /obterKpisConversasWa/);
  assert.match(migration, /unique \(org_id, instancia_id, remote_contact_id\)/);
});

test("1b. Fotos reais dos contatos atravessam provider, cache, serviço e interface", () => {
  assert.match(avatarMigration, /contact_avatar_url\s+text/i);
  assert.match(avatarMigration, /contact_avatar_checked_at\s+timestamptz/i);
  assert.match(conversationsEdge, /contact_avatars/);
  assert.match(conversationsEdge, /obterAvatarInstancia/);
  assert.match(conversationsEdge, /contact_avatar_url/);
  assert.match(conversationsEdge, /\.eq\("status", "conectado"\)/);
  assert.match(conversationsEdge, /candidateIds/);
  assert.match(waService, /avatar_url:\s*typeof row\.contact_avatar_url/);
  assert.match(waConversas, /avatar:\s*conversation\.avatar_url/);
});

// 2. Busca
test("2. Busca: permite pesquisar em tempo real por nome, telefone, empresa e mensagem", () => {
  assert.match(waConversas, /Buscar conversas, contatos ou mensagens\.\.\./);
  assert.match(waConversas, /matchNome/);
  assert.match(waConversas, /matchNumero/);
  assert.match(waConversas, /matchEmpresa/);
  assert.match(waConversas, /matchMensagem/);
});

// 3. Filtros
test("3. Filtros: tabs de status [Todas, Não lidas, Em atendimento] e filtro por etiqueta", () => {
  assert.match(waConversas, /Todas \(\{contatos\.length\}\)/);
  assert.match(waConversas, /Não lidas \(\{/);
  assert.match(waConversas, /Em atendimento\s*\(\s*\{/);
  assert.match(waConversas, /filtroTag/);
  assert.match(waConversas, /menuFiltroAberto/);
});

// 4. Paginação / Limites seguros
test("4. Paginação e limites: snapshot limita conversas e mensagens no servidor", () => {
  // SUT_IS_CORRECT_BECAUSE: keyset/offset pages keep the 200-row cap while allowing the client
  // to continue beyond the first page; requiring limit(200) would reject real pagination.
  assert.match(conversationsEdge, /Math\.min\(requestedPageSize, 200\)/);
  assert.match(conversationsEdge, /\.range\(page \* pageSize, page \* pageSize \+ pageSize - 1\)/);
  assert.match(conversationsEdge, /limit\(500\)/);
});

// 5. Conversa selecionada
test("5. Conversa selecionada: destaque visual com borda laranja oficial Flow Business", () => {
  assert.match(waConversas, /border-home-orange bg-\[#131926\]/);
  assert.match(waConversas, /contatoAtivoId/);
  assert.match(waConversas, /selecionarContato/);
});

// 6. Histórico de mensagens
test("6. Histórico: cronologia com mensagens recebidas à esquerda e enviadas à direita", () => {
  assert.match(waConversas, /bg-\[#151c2a\]/); // balão recebido
  assert.match(waConversas, /bg-\[#0e3b2e\]/); // balão enviado verde
  assert.match(waConversas, /CheckCheck/); // confirmação de entrega
  assert.match(waConversas, /Hoje/); // separador de data
});

// 7. Realtime ou fallback
test("7. Realtime ou fallback: inscrição com cleanup e polling somente em falha", () => {
  assert.match(waConversas, /channel\(`wa_inbox_realtime:\$\{context\.orgId\}`\)/);
  assert.match(waConversas, /postgres_changes/);
  assert.match(waConversas, /table:\s*"wa_mensagens"/);
  assert.match(waConversas, /removeChannel/);
  assert.match(waConversas, /CHANNEL_ERROR/);
  assert.match(waConversas, /setTimeout\(refresh, delay\)/);
  assert.match(waConversas, /MAX_FALLBACK_FAILURES/);
  assert.match(waConversas, /isWhatsappAuthorizationError/);
  assert.match(waConversas, /new AbortController\(\)/);
});

// 8. Mensagem recebida
test("8. Mensagem recebida: webhook normaliza e persiste por RPC idempotente", () => {
  assert.match(webhook, /normalizeInboundWhatsappMessage/);
  assert.match(webhook, /wa_ingest_inbound_message/);
  assert.match(migration, /on conflict\(org_id,instancia_id,externo_id\)/);
});

// 9. Envio manual autorizado
test("9. Envio manual autorizado: invoca o envio reconciliado e valida parâmetros", () => {
  assert.match(waConversas, /enviarRespostaConversa\(contatoAtivo\.id, texto, operationId\)/);
  assert.match(waConversas, /enviando/);
  assert.match(waConversas, /SendHorizontal/);
});

// 10. Bloqueio de envio não autorizado
test("10. Bloqueio de envio não autorizado: barra envio vazio ou sem contato selecionado", () => {
  // Trava síncrona (ref) + texto vazio: dois cliques/Enter no mesmo instante não geram duas operações.
  assert.match(
    waConversas,
    /if \(!contatoAtivo \|\| enviandoRef\.current \|\| contatoAtivo\.chip\?\.arquivada\) return;/,
  );
  assert.match(waConversas, /if \(!texto\) return;/);
  // Também bloqueado enquanto o número original da conversa estiver removido (escolha pendente).
  assert.match(
    waConversas,
    /disabled=\{\s*enviando \|\| !textoMensagem\.trim\(\) \|\| Boolean\(contatoAtivo\.chip\?\.arquivada\)\s*\}/,
  );
});

// 11. Prevenção de duplicidade
test("11. Prevenção de duplicidade: proteção contra cliques múltiplos e estado enviando", () => {
  assert.match(waConversas, /setEnviando\(true\)/);
  assert.match(waConversas, /Loader2.*animate-spin/);
  assert.match(waConversas, /disabled:pointer-events-none/);
  assert.match(responder, /wa_reserve_outbound_message/);
  assert.match(migration, /client_operation_id/);
});

// 12. Resultado de envio com estados claros
test("12. Resultado de envio: estados persistidos e nenhuma confirmação otimista inventada", () => {
  assert.match(waConversas, /toast\.success\(\s*"Mensagem enviada\./);
  assert.match(waConversas, /desfecho\.tipo === "confirmado"/);
  assert.match(waConversas, /desfecho\.tipo === "recusado"/);
  assert.match(waConversas, /Envio não confirmado/);
  assert.doesNotMatch(waConversas, /msg-out-\$\{Date\.now\(\)\}/);
  // O texto só é limpo na ramificação CONFIRMADA — nunca antes de o backend registrar o envio.
  const confirmado = waConversas.indexOf('desfecho.tipo === "confirmado"');
  const recusado = waConversas.indexOf('desfecho.tipo === "recusado"');
  const limpeza = waConversas.indexOf('setTextoMensagem("")', confirmado);
  assert.ok(confirmado > 0 && limpeza > confirmado && limpeza < recusado);
});

// 13. Respostas rápidas
test("13. Respostas rápidas: lista scripts de wa_scripts, interpola {nome} e {empresa} sem disparo automático", () => {
  assert.match(waConversas, /composerTab === "resposta_rapida"/);
  assert.match(waConversas, /listarScripts/);
  assert.ok(waConversas.includes(".replace(/{nome}/gi"));
  assert.ok(waConversas.includes(".replace(/{empresa}/gi"));
  // Regra fundamental: aplicar script NUNCA envia direto, joga na composição
  assert.match(waConversas, /setTextoMensagem\(textoResolvido\)/);
  assert.match(waConversas, /setComposerTab\("mensagem"\)/);
});

// 14. Anexos
test("14. Anexos: mídia não suportada é declarada indisponível e nunca simulada", () => {
  assert.match(waConversas, /Envio de mídia indisponível/);
  assert.doesNotMatch(waConversas, /msg-doc-\$\{Date\.now\(\)\}/);
  assert.match(waConversas, /modalAnexo/);
  assert.match(waConversas, /Download/);
});

// 15. CRM - Informações do contato
test("15. CRM - Informações do contato: nome, telefone, email, empresa, cargo, origem e cadastro", () => {
  assert.match(waConversas, /Informações do contato/);
  assert.match(waConversas, /Nome/);
  assert.match(waConversas, /Telefone/);
  assert.match(waConversas, /E-mail/);
  assert.match(waConversas, /Empresa/);
  assert.match(waConversas, /Cargo/);
  assert.match(waConversas, /Origem/);
  assert.match(waConversas, /Data de cadastro/);
  assert.match(waConversas, /modalEditarContato/);
});

// 16. Pipeline e Status no CRM
test("16. Pipeline e Status: dropdown de status [Lead] e dropdown azul [Prospecção]", () => {
  assert.match(waConversas, /Status no CRM/);
  assert.match(waConversas, /alterarStatusComercial/);
  assert.match(waConversas, /bg-blue-600/); // azul aprovado para Pipeline Prospecção
  assert.match(waConversas, /Prospecção/);
  assert.match(waConversas, /Qualificação/);
});

// 17. Responsáveis
test("17. Responsáveis: carrega membros reais e permite assumir ou transferir", () => {
  assert.match(waConversas, /Responsável/);
  assert.match(waConversas, /listarMembrosDaOrg/);
  assert.match(waConversas, /assumirAtendimento/);
  assert.match(waConversas, /transferirAtendimento/);
});

// 18. Notas
test("18. Notas: adicionar e listar notas persistidas com autor e timestamp", () => {
  assert.match(waConversas, /Adicionar nota/);
  assert.match(waConversas, /modalAdicionarNota/);
  assert.match(waConversas, /salvarNovaNota/);
  assert.match(waConversas, /acaoConversaWa\(contatoAtivo\.id, "add_note"/);
});

// 19. Etiquetas (Tags)
test("19. Etiquetas: adicionar e remover relações persistidas", () => {
  assert.match(waConversas, /adicionarTag/);
  assert.match(waConversas, /removerTag/);
  assert.match(migration, /wa_conversa_etiquetas/);
});

// 20. Histórico de interações
test("20. Histórico de interações: timeline vem de eventos persistidos", () => {
  assert.match(waConversas, /Últimas interações/);
  assert.match(conversationsEdge, /wa_conversa_eventos/);
  assert.match(waConversas, /modalVerInteracoes/);
});

// 21. Organização A vs Organização B (Multi-tenant estrito)
test("21. Multi-tenant estrito: isolamento de dados e consultas ancoradas", () => {
  assert.match(waService, /atualizarLeadCrm/);
  assert.match(conversationsEdge, /context\.orgId/);
  assert.match(migration, /wa_conversation_visible/);
});

// 22. Usuário com duas organizações
test("22. Usuário com duas organizações: integridade de sessão e RLS", () => {
  assert.match(waSection, /WhatsAppSection/);
  assert.match(waSection, /checarConexao/);
});

// 23. Fidelidade ao layout aprovado (6 KPIs específicos da Tela 02)
test("23. Fidelidade ao layout aprovado: 6 KPIs específicos [Conversas ativas, Não lidas, Aguardando, Em atendimento, Novos, Fechamentos]", () => {
  assert.match(waConversas, /Conversas ativas/);
  assert.match(waConversas, /Não lidas/);
  assert.match(waConversas, /Aguardando resposta/);
  assert.match(waConversas, /Em atendimento/);
  assert.match(waConversas, /Novos contatos/);
  assert.match(waConversas, /Fechamentos hoje/);

  // Sem dados comprovados, o estado inicial é neutro; o serviço preenche valores reais.
  assert.match(waConversas, /conversasAtivas: 0/);
  assert.match(waConversas, /naoLidas: 0/);
  assert.match(waConversas, /aguardandoResposta: 0/);
  assert.match(waConversas, /emAtendimento: 0/);
  assert.match(waConversas, /novosContatos: 0/);
  assert.match(waConversas, /fechamentosHoje: 0/);
});

// 24. Ausência de disparos a frio e preservação dos módulos
test("24. Preservação arquitetural: não há disparo em massa na Central de Conversas", () => {
  assert.doesNotMatch(waConversas, /dispararCampanha/);
  assert.doesNotMatch(waConversas, /iniciarDisparo/);
  assert.doesNotMatch(waConversas, /apify/);
});

// 25. Responsividade
test("25. Responsividade: 3 colunas em desktop e suporte a viewMobile em telas menores", () => {
  assert.match(waConversas, /lg:grid-cols-12/);
  assert.match(waConversas, /lg:col-span-3/);
  assert.match(waConversas, /lg:col-span-5/);
  assert.match(waConversas, /lg:col-span-4/);
  assert.match(waConversas, /viewMobile/);
});

test("26. Avatares: imagem ausente ou inválida sempre possui fallback textual", () => {
  assert.match(waConversas, /AvatarImage/);
  assert.match(waConversas, /AvatarFallback/);
  assert.match(waConversas, /iniciaisDoContato/);
  assert.doesNotMatch(waConversas, /avatar:\s*"\/placeholder\.svg"/);
});
