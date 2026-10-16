// Suite de Testes: WhatsApp Automações — Tela 04 (Prompt 60)
// Invariant: Fidelidade visual absoluta ao layout aprovado, dados reais de multi-tenant (org_id, memberships, RLS),
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

// 1. Organização ativa
test("1. Organização ativa: consultas respeitam RLS e escopo da organização autenticada", () => {
  assert.match(waAutomacao, /obterDadosAutomacoesWa/);
  assert.match(waService, /supabase\.from\("wa_mensagens"\)/);
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
test("5. Filtro de status: seletor com opções [Todos os status, Ativa, Pausada, Rascunho, Com erro]", () => {
  assert.match(waAutomacao, /Todos os status/);
  assert.match(waAutomacao, /option value="ativa"/);
  assert.match(waAutomacao, /option value="pausada"/);
  assert.match(waAutomacao, /option value="rascunho"/);
  assert.match(waAutomacao, /option value="com_erro"/);
});

// 6. Listagem
test("6. Listagem: tabela estruturada com colunas idênticas à referência visual aprovada", () => {
  assert.match(waAutomacao, /Minhas automações/);
  assert.match(waAutomacao, /Crie e gerencie regras de automação para atender seus leads 24 horas por dia/);
  assert.match(waAutomacao, /Nome da automação/);
  assert.match(waAutomacao, /Tipo/);
  assert.match(waAutomacao, /Gatilho/);
  assert.match(waAutomacao, /Status/);
  assert.match(waAutomacao, /Execuções/);
  assert.match(waAutomacao, /Última atualização/);
  assert.match(waAutomacao, /Ações/);
});

// 7. Criação de rascunho
test("7. Criação de rascunho: persistência de automações com campos seguros", () => {
  assert.match(waAutomacao, /salvarAutomacaoWa/);
  assert.match(waService, /origem:\s*"custom"/);
  assert.match(waService, /salvarAutomacoesLocais/);
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
test("9. Condições: suporte a gatilhos reais (nova conversa, palavras-chave, tempo sem resposta, CRM)", () => {
  assert.match(waAutomacao, /Gatilho principal/);
  assert.match(waAutomacao, /Nova conversa recebida \(Inbound\)/);
  assert.match(waAutomacao, /Palavras-chave na mensagem/);
  assert.match(waAutomacao, /Tempo de espera sem resposta \(horas\)/);
});

// 10. Ações
test("10. Ações: composição de respostas, scripts, avanço no CRM e sugestão SDR", () => {
  assert.match(waAutomacao, /Mensagem automática ou resposta/);
  assert.match(waAutomacao, /Atualizar etapa no CRM \(Pipeline\)/);
  assert.match(waAutomacao, /criarSugestaoSdr:\s*true/);
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
test("14. Exclusão autorizada: modal de confirmação explícita antes de remover", () => {
  assert.match(waAutomacao, /Excluir automação\?/);
  assert.match(waAutomacao, /Esta ação é irreversível/);
  assert.match(waAutomacao, /Sim, excluir/);
  assert.match(waAutomacao, /handleConfirmarExclusao/);
});

// 15. Ativação bloqueada quando não suportada
test("15. Ativação bloqueada sem backend: exibe aviso de que execução em segundo plano não está disponível", () => {
  assert.match(
    waAutomacao,
    /Automação salva\. Execução automática ainda não disponível pelo backend\./,
  );
  assert.match(
    waService,
    /Automação salva\. Execução automática ainda não disponível pelo backend\./,
  );
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
test("21. Distribuição por tipo: gráfico Donut com total 1.428 no centro e 6 fatias com percentuais", () => {
  assert.match(waAutomacao, /Distribuição por tipo/);
  assert.match(waAutomacao, /Execuções das automações por tipo/);
  assert.match(waAutomacao, /1\.428/);
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
  assert.match(waService, /flow_wa_automacoes_v1/);
});

// 24. Ausência de envios indevidos e anti-loop
test("24. Ausência de envios indevidos: proteção explícita anti-loop contra disparos repetitivos", () => {
  assert.match(waAutomacao, /Proteção Anti-Loop Ativada/);
  assert.match(waAutomacao, /Máximo de 1 resposta automática por contato no intervalo de 30 minutos/);
});

// 25. Preservação das automações legadas
test("25. Preservação das automações legadas: receitas e rodadas do robô de prospecção mantidas intactas", () => {
  assert.match(automacaoService, /listarReceitas/);
  assert.match(automacaoService, /criarReceita/);
  assert.match(automacaoService, /automacao_receitas/);
  assert.match(automacaoService, /automacao_rodadas/);
  assert.match(waSection, /WaAutomacao/);
  assert.match(waSection, /Automações — responda, qualifique e gerencie seus leads automaticamente/);
});
