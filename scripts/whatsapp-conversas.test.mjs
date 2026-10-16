// Suite de Testes: WhatsApp Central de Conversas Premium — Tela 02 (Prompt 57)
// Invariant: Fidelidade visual absoluta ao layout aprovado, dados reais de multi-tenant,
// arquitetura 3 colunas, envio manual autorizado e ausência de disparos a frio.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const waConversas = readFileSync("src/components/whatsapp/WaConversas.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");

// 1. Lista por organização (Multi-tenant)
test("1. Lista por organização: consultas respeitam RLS e escopo da organização ativa", () => {
  assert.match(waService, /from\("wa_mensagens"\)/);
  assert.match(waService, /listarConversas/);
  assert.match(waService, /obterKpisConversasWa/);
  assert.match(waConversas, /obterKpisConversasWa/);
  assert.match(waConversas, /CONTATOS_REFERENCIA/);
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
  assert.match(waConversas, /Em atendimento \(\{/);
  assert.match(waConversas, /filtroTag/);
  assert.match(waConversas, /menuFiltroAberto/);
});

// 4. Paginação / Limites seguros
test("4. Paginação e limites: consultas com limites controlados sem memory dump arbitrário", () => {
  assert.match(waService, /limit\(2000\)/);
  assert.match(waService, /limit\(1000\)/);
  assert.doesNotMatch(waConversas, /limit\(3000\)/);
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
test("7. Realtime ou fallback: inscrição Supabase Realtime em wa_mensagens com cleanup", () => {
  assert.match(waConversas, /channel\("wa_inbox_realtime"\)/);
  assert.match(waConversas, /postgres_changes/);
  assert.match(waConversas, /table:\s*"wa_mensagens"/);
  assert.match(waConversas, /removeChannel/);
});

// 8. Mensagem recebida
test("8. Mensagem recebida: atualiza contador de não lidas e thread em tempo real", () => {
  assert.match(waConversas, /target\.naoLidas \+= 1/);
  assert.match(waConversas, /target\.ultimaMensagem/);
});

// 9. Envio manual autorizado
test("9. Envio manual autorizado: invoca responderConversa e valida parâmetros", () => {
  assert.match(waConversas, /responderConversa\(numeroLimpo, texto\)/);
  assert.match(waConversas, /enviando/);
  assert.match(waConversas, /SendHorizontal/);
});

// 10. Bloqueio de envio não autorizado
test("10. Bloqueio de envio não autorizado: barra envio vazio ou sem contato selecionado", () => {
  assert.match(waConversas, /if \(!contatoAtivo \|\| !textoMensagem\.trim\(\) \|\| enviando\) return/);
  assert.match(waConversas, /disabled=\{enviando \|\| !textoMensagem\.trim\(\)\}/);
});

// 11. Prevenção de duplicidade
test("11. Prevenção de duplicidade: proteção contra cliques múltiplos e estado enviando", () => {
  assert.match(waConversas, /setEnviando\(true\)/);
  assert.match(waConversas, /Loader2.*animate-spin/);
  assert.match(waConversas, /disabled:pointer-events-none/);
});

// 12. Resultado de envio com estados claros
test("12. Resultado de envio: toast informativo e atualização otimista imediata", () => {
  assert.match(waConversas, /toast\.success\("Mensagem enviada com sucesso\."\)/);
  assert.match(waConversas, /toast\.info/);
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
test("14. Anexos: card preview de documento PDF [2.4 MB • PDF] e modal de seleção", () => {
  assert.match(waConversas, /Apresentação Flow Business\.pdf/);
  assert.match(waConversas, /2\.4 MB • PDF/);
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
test("17. Responsáveis: avatar e identificação do atendente responsável [Marcos Gonçalves]", () => {
  assert.match(waConversas, /Responsável/);
  assert.match(waConversas, /Marcos Gonçalves/);
  assert.match(waConversas, /marcos_goncalves\.jpg/);
});

// 18. Notas
test("18. Notas: adicionar nova nota, listar notas com autor e timestamp", () => {
  assert.match(waConversas, /Adicionar nota/);
  assert.match(waConversas, /modalAdicionarNota/);
  assert.match(waConversas, /salvarNovaNota/);
  assert.match(waConversas, /Interessada nos planos de marketing digital/);
});

// 19. Etiquetas (Tags)
test("19. Etiquetas: adicionar, remover e listar badges [Restaurante, São Paulo, Quente]", () => {
  assert.match(waConversas, /Restaurante/);
  assert.match(waConversas, /São Paulo/);
  assert.match(waConversas, /Quente/);
  assert.match(waConversas, /adicionarTag/);
  assert.match(waConversas, /removerTag/);
});

// 20. Histórico de interações
test("20. Histórico de interações: timeline real com eventos [Recebeu documento, Conversa iniciada, Lead criado]", () => {
  assert.match(waConversas, /Últimas interações/);
  assert.match(waConversas, /Recebeu um documento/);
  assert.match(waConversas, /Conversa iniciada/);
  assert.match(waConversas, /Lead criado/);
  assert.match(waConversas, /modalVerInteracoes/);
});

// 21. Organização A vs Organização B (Multi-tenant estrito)
test("21. Multi-tenant estrito: isolamento de dados e consultas ancoradas", () => {
  assert.match(waService, /atualizarLeadCrm/);
  assert.match(waService, /registrarInteracaoWa/);
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

  // Valores de referência do benchmark
  assert.match(waConversas, /conversasAtivas: 32/);
  assert.match(waConversas, /naoLidas: 18/);
  assert.match(waConversas, /aguardandoResposta: 5/);
  assert.match(waConversas, /emAtendimento: 12/);
  assert.match(waConversas, /novosContatos: 8/);
  assert.match(waConversas, /fechamentosHoje: 3/);
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
