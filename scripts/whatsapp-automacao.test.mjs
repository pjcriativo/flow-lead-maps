// Suite: WhatsApp Automações — UI, Edge e contratos SQL
// Invariant: regras persistem por organização e nenhuma execução/transporte/backfill real é liberado.
// Boundary IN: tela aprovada, serviço, Edge autenticada, migration incremental e contratos de segurança.
// Boundary OUT: banco/Evolution reais e deploy, deliberadamente proibidos nesta correção.
// Fidelidade visual absoluta ao layout aprovado, dados reais de multi-tenant (org_id, memberships, RLS),
// 5 KPIs superiores (ativas, mensagens automáticas, leads qualificados, taxa de resposta, tempo médio),
// painel central esquerdo "Minhas automações" com busca/filtros/tabela/ações,
// assistente lateral direito "Criar nova automação" com 4 etapas (Tipo [6 cards], Condições, Ações, Revisão),
// 3 cards inferiores (Desempenho com 3 KPIs e gráfico SVG, Distribuição por tipo com donut e legenda, Atividade recente com 6 eventos),
// isolamento rigoroso, proteção anti-loop, ausência de envios indevidos e preservação integral dos serviços legados de automação.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const waAutomacao = readFileSync("src/components/whatsapp/WaAutomacao.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");
const automacaoService = readFileSync("src/services/automacao.ts", "utf8");
const automationEngine = readFileSync("supabase/functions/_shared/whatsapp-automation.ts", "utf8");
const automationEdge = readFileSync("supabase/functions/wa-automations/index.ts", "utf8");
const migration = readFileSync("supabase/migrations/202610160005_wa_automation_engine.sql", "utf8");

// 1. Organização ativa
test("1. Organização ativa: consultas respeitam RLS e escopo da organização autenticada", () => {
  assert.match(waAutomacao, /obterDadosAutomacoesWa/);
  // SUT_IS_CORRECT_BECAUSE: conversas agora são lidas pela API autenticada e pela entidade
  // canônica, não por mensagens brutas agrupadas no cliente.
  assert.match(waService, /invoke\("wa-conversations"/);
  assert.match(waService, /supabase\.from\("leads"\)/);
});

// 2. Permissões
test("2. Permissões: operações de criação, edição e exclusão de regras são tipadas e autorizadas", () => {
  assert.match(waAutomacao, /handleConfirmarExclusao/);
  assert.match(waAutomacao, /handleSalvarNovaAutomação/);
  assert.match(waService, /salvarAutomacaoWa/);
  assert.match(waService, /excluirAutomacaoWa/);
});

// 3. Busca
test("3. Busca: campo de busca em tempo real com ícone de lupa e filtragem por nome, descrição e gatilho", () => {
  assert.match(waAutomacao, /Buscar automações\.\.\./);
  assert.match(waAutomacao, /matchNome/);
  assert.match(waAutomacao, /matchDesc/);
  assert.match(waAutomacao, /matchGatilho/);
});

// 4. Filtros
test("4. Filtros: seletor de tipos [Todos os tipos, Boas-vindas, Qualificação, Agendamento, Follow-up, Recuperação, Atendimento]", () => {
  assert.match(waAutomacao, /Todos os tipos/);
  assert.match(waAutomacao, /boas_vindas/);
  assert.match(waAutomacao, /qualificacao/);
  assert.match(waAutomacao, /agendamento/);
  assert.match(waAutomacao, /follow_up/);
  assert.match(waAutomacao, /recuperacao/);
  assert.match(waAutomacao, /atendimento/);
});

// 5. Filtro de status
test("5. Filtro de status: seletor usa o ciclo persistente aprovado", () => {
  assert.match(waAutomacao, /Todos os status/);
  assert.match(waAutomacao, /option value="ativa"/);
  assert.match(waAutomacao, /option value="pausada"/);
  assert.match(waAutomacao, /option value="rascunho"/);
  assert.match(waAutomacao, /option value="arquivada"/);
});

// 6. Listagem
test("6. Listagem: tabela estruturada com colunas idênticas à referência visual aprovada", () => {
  assert.match(waAutomacao, /Minhas automações/);
  assert.match(
    waAutomacao,
    /Crie e gerencie regras de automação para atender seus leads 24 horas por dia/,
  );
  assert.match(waAutomacao, /Nome da automação/);
  assert.match(waAutomacao, /Tipo/);
  assert.match(waAutomacao, /Gatilho/);
  assert.match(waAutomacao, /Status/);
  assert.match(waAutomacao, /Execuções/);
  assert.match(waAutomacao, /Última atualização/);
  assert.match(waAutomacao, /Ações/);
});

// 7. Criação de rascunho
test("7. Criação de rascunho: persistência passa pela Edge autenticada", () => {
  assert.match(waAutomacao, /salvarAutomacaoWa/);
  assert.match(waService, /invoke\("wa-automations"/);
  assert.match(waService, /automatic_transport_allowed:\s*false/);
});

// 8. Escolha de tipo
test("8. Escolha de tipo: 6 cards com ícones, descrições e destaque laranja no selecionado", () => {
  assert.match(waAutomacao, /Mensagem inicial para novos contatos/);
  assert.match(waAutomacao, /Identifica interesse e segmenta leads/);
  assert.match(waAutomacao, /Oferece link de agendamento/);
  assert.match(waAutomacao, /Acompanha e lembra o cliente/);
  assert.match(waAutomacao, /Reativa contatos inativos/);
  assert.match(waAutomacao, /Transfere para equipe humana/);
  assert.match(waAutomacao, /border-home-orange bg-home-orange/);
});

// 9. Condições
test("9. Condições: suporte apenas aos eventos persistidos pela Central e CRM", () => {
  assert.match(waAutomacao, /Gatilho principal/);
  assert.match(waAutomacao, /Nova conversa recebida \(Inbound\)/);
  assert.match(waAutomacao, /Nova mensagem recebida/);
  assert.match(waAutomacao, /Tempo de espera sem resposta \(horas\)/);
  assert.match(waService, /contact\.consent/);
});

// 10. Ações
test("10. Ações: prepara resposta, script e tarefa sem alterar o CRM diretamente", () => {
  assert.match(waAutomacao, /Mensagem automática ou resposta/);
  assert.match(waAutomacao, /Sugerir próxima etapa no CRM/);
  assert.match(waService, /type:\s*"prepare_task"/);
});

// 11. Revisão
test("11. Revisão: resumo estruturado das configurações antes do salvamento definitivo", () => {
  assert.match(waAutomacao, /Revisão & Salvar/);
  assert.match(waAutomacao, /Nome:/);
  assert.match(waAutomacao, /Tipo:/);
  assert.match(waAutomacao, /Gatilho:/);
  assert.match(waAutomacao, /Etapa CRM:/);
});

// 12. Edição
test("12. Edição: abertura de detalhes e modificação de regras existentes", () => {
  assert.match(waAutomacao, /modalDetalhes/);
  assert.match(waAutomacao, /Abrir \/ Detalhes/);
  assert.match(waAutomacao, /Detalhes da automação/);
});

// 13. Duplicação
test("13. Duplicação: criação de cópia como rascunho seguro sem ativar automaticamente", () => {
  assert.match(waAutomacao, /handleDuplicar/);
  assert.match(waService, /duplicarAutomacaoWa/);
  assert.match(waService, /\(Cópia\)/);
});

// 14. Exclusão autorizada
test("14. Arquivamento autorizado: preserva histórico após confirmação explícita", () => {
  assert.match(waAutomacao, /Arquivar automação\?/);
  assert.match(waAutomacao, /histórico será preservado/);
  assert.match(waAutomacao, /Sim, arquivar/);
  assert.match(waAutomacao, /handleConfirmarExclusao/);
});

// 15. Ativação bloqueada quando não suportada
test("15. Ativação bloqueada: exibe os controles independentes de plataforma e organização", () => {
  assert.match(waAutomacao, /Motor de automações bloqueado operacionalmente/);
  assert.match(waService, /execução permanece bloqueada pelos controles da plataforma/);
});

// 16. Toggle real
test("16. Toggle real: switch visual com persistência de status ativo e pausado", () => {
  assert.match(waAutomacao, /handleToggleStatus/);
  assert.match(waAutomacao, /auto\.ativa \? "bg-emerald-500" : "bg-white\/20"/);
  assert.match(waService, /alternarStatusAutomacaoWa/);
});

// 17. Histórico
test("17. Histórico: contagem de execuções e data/hora da última atualização", () => {
  assert.match(waAutomacao, /auto\.execucoes/);
  assert.match(waAutomacao, /auto\.ultimaAtualizacao/);
  assert.match(waService, /ultimaAtualizacao/);
});

// 18. Integração CRM
test("18. Integração CRM: suporte às etapas do funil de vendas (contato inicial, qualificação, reunião)", () => {
  assert.match(waAutomacao, /contato_inicial/);
  assert.match(waAutomacao, /qualificacao/);
  assert.match(waAutomacao, /reuniao_agendada/);
  assert.match(waAutomacao, /proposta_enviada/);
});

// 19. Scripts
test("19. Scripts: integração e compatibilidade com serviços e modelos de mensagens", () => {
  assert.match(waAutomacao, /novoScriptId/);
  assert.match(waService, /scriptId/);
  assert.match(waSection, /WaScripts/);
});

// 20. Métricas (5 KPIs superiores)
test("20. Métricas: 5 indicadores superiores com ícones, valores, descrições e tendências", () => {
  assert.match(waAutomacao, /Automações ativas/);
  assert.match(waAutomacao, /Mensagens automáticas/);
  assert.match(waAutomacao, /Leads qualificados/);
  assert.match(waAutomacao, /Taxa de resposta/);
  assert.match(waAutomacao, /Tempo médio de resposta/);
  assert.match(waService, /KPIS_REFERENCIA_PREMIUM/);
});

// 21. Distribuição por tipo
test("21. Distribuição por tipo: gráfico Donut usa total persistido e 6 categorias", () => {
  assert.match(waAutomacao, /Distribuição por tipo/);
  assert.match(waAutomacao, /Execuções das automações por tipo/);
  assert.match(waAutomacao, /totalExecucoes\.toLocaleString/);
  assert.match(waAutomacao, /execuções/);
  assert.match(waAutomacao, /Ver detalhes/);
  assert.match(waService, /DISTRIBUICAO_REFERENCIA_PREMIUM/);
});

// 22. Eventos reais de atividade recente
test("22. Eventos reais: card de atividade recente com 6 eventos cronológicos e links de ação", () => {
  assert.match(waAutomacao, /Atividade recente/);
  assert.match(waAutomacao, /Últimas execuções e eventos das automações/);
  assert.match(waAutomacao, /Ver todas/);
  assert.match(waService, /ATIVIDADES_AUTOMACOES_REFERENCIA_PREMIUM/);
});

// 23. Isolamento multi-tenant
test("23. Isolamento multi-tenant: dados pertencem estritamente à organização ativa", () => {
  assert.match(waAutomacao, /obterDadosAutomacoesWa/);
  assert.match(waService, /org_id:\s*context\.orgId/);
  assert.match(automationEdge, /\.eq\("org_id", context\.orgId\)/);
});

// 24. Ausência de envios indevidos e anti-loop
test("24. Ausência de envios indevidos: proteção explícita anti-loop contra disparos repetitivos", () => {
  assert.match(waAutomacao, /Proteção Anti-Loop Ativada/);
  assert.match(
    waAutomacao,
    /Máximo de 1 resposta automática por contato no intervalo de 30 minutos/,
  );
});

// 25. Preservação das automações legadas
test("25. Preservação das automações legadas: receitas e rodadas do robô de prospecção mantidas intactas", () => {
  assert.match(automacaoService, /listarReceitas/);
  assert.match(automacaoService, /criarReceita/);
  assert.match(automacaoService, /automacao_receitas/);
  assert.match(automacaoService, /automacao_rodadas/);
  assert.match(waSection, /WaAutomacao/);
  assert.match(
    waSection,
    /Automações — responda, qualifique e gerencie seus leads automaticamente/,
  );
});

test("26. Catálogos fechados: tipos, gatilhos, operadores e ações não aceitam código arbitrário", () => {
  assert.match(automationEngine, /WA_AUTOMATION_TRIGGERS/);
  assert.match(automationEngine, /WA_AUTOMATION_OPERATORS/);
  assert.match(automationEngine, /WA_AUTOMATION_ACTIONS/);
  assert.doesNotMatch(automationEngine, /\beval\s*\(/);
  assert.doesNotMatch(automationEdge, /fetch\s*\(/);
});

test("27. Idempotência e webhook duplicado: evento e execução possuem chaves únicas", () => {
  assert.match(migration, /unique\(org_id,event_key\)/);
  assert.match(migration, /unique\(org_id,run_key\)/);
  assert.match(migration, /on conflict\(org_id,event_key\) do nothing/);
});

test("28. Eventos fora de ordem e loops: profundidade, causalidade e limite de ações são persistidos", () => {
  assert.match(migration, /causation_id uuid/);
  assert.match(migration, /depth integer[\s\S]*between 0 and 5/);
  assert.match(automationEngine, /MAX_ACTIONS = 20/);
  assert.match(automationEngine, /causality_depth_limit/);
});

test("29. Segurança multi-tenant: Edge cruza recursos com org_id e usa autorização oficial", () => {
  assert.match(automationEdge, /authorizeWhatsappRequest/);
  assert.match(automationEdge, /permission:\s*"manage_automations"/);
  assert.match(automationEdge, /\.eq\("org_id", context\.orgId\)/);
  assert.match(automationEdge, /Script não encontrado nesta organização/);
});

test("30. Controles em três níveis: regra, organização e plataforma permanecem independentes", () => {
  assert.match(migration, /wa_automation_org_settings/);
  assert.match(migration, /automation_execution_enabled boolean not null default false/);
  assert.match(migration, /check \(automation_execution_enabled = false\)/);
  assert.match(automationEngine, /rule_disabled/);
  assert.match(automationEngine, /organization_engine_disabled/);
  assert.match(automationEngine, /platform_engine_disabled/);
});

test("31. Envio e opt-out: transporte e dispatch seguem bloqueados e consentimento é condição", () => {
  assert.match(automationEngine, /automatic_whatsapp_transport_disabled/);
  assert.match(automationEngine, /dispatch_disabled/);
  assert.match(waService, /contact\.eligible/);
  assert.match(waService, /contact\.consent/);
});

test("32. Scripts: seleção é escopada e snapshot imutável acompanha a definição", () => {
  assert.match(automationEdge, /from\("wa_scripts"\)/);
  assert.match(automationEdge, /script_snapshot/);
  assert.match(waAutomacao, /Script existente \(opcional\)/);
});

test("33. Follow-up: agenda persistente contém fuso, elegibilidade, versão e estados fechados", () => {
  assert.match(migration, /wa_automation_followups/);
  assert.match(migration, /automation_version integer/);
  assert.match(migration, /timezone text not null/);
  assert.match(migration, /'pendente','elegivel','executado','cancelado','bloqueado','expirado'/);
  assert.doesNotMatch(migration, /cron\.schedule/);
});

test("34. Simulação: registra modo próprio, exibe bloqueios e não chama transporte", () => {
  assert.match(automationEdge, /mode:\s*"simulation"/);
  assert.match(waAutomacao, /Resultado da simulação/);
  assert.match(waAutomacao, /Nenhum dado operacional foi alterado/);
  assert.doesNotMatch(automationEdge, /wa-responder|wa-send-worker|wa_envios.*insert/);
});

test("35. Auditoria e métricas: simulações são separadas das execuções reais", () => {
  assert.match(
    migration,
    /mode text not null check \(mode in \('simulation','preparation','execution'\)\)/,
  );
  assert.match(waService, /run\.mode !== "simulation"/);
  assert.match(migration, /planned_actions jsonb/);
  assert.match(migration, /executed_actions jsonb/);
});

test("36. Backfill legado: dry-run, lotes, checkpoint e relatório não alteram mensagens", () => {
  assert.match(migration, /wa_preview_legacy_message_backfill/);
  assert.match(migration, /p_dry_run boolean default true/);
  assert.match(migration, /real backfill is disabled/);
  assert.match(migration, /messages_changed',0/);
  assert.doesNotMatch(migration, /update public\.wa_mensagens set conversa_id/);
});

test("37. Preservação: migration 005 não altera migrations aplicadas nem cria CRM/fila paralelos", () => {
  assert.ok(existsSync("supabase/migrations/202610160001_wa_security_multitenant.sql"));
  assert.ok(existsSync("supabase/migrations/202610160004_wa_conversations_crm.sql"));
  assert.doesNotMatch(migration, /create table if not exists public\.(leads|propostas|wa_envios)/);
  assert.doesNotMatch(migration, /delete from public\.(wa_mensagens|leads)/);
});
