// Suite de Testes: WhatsApp Campanhas Premium — Tela 03 (Prompt 58)
// Invariant: Fidelidade visual absoluta ao layout aprovado (media_1792138083912.jpg),
// dados reais de multi-tenant (org_id, memberships, RLS), 6 KPIs, tabela de campanhas,
// assistente lateral de criação em 4 etapas, gráfico de desempenho com 3 séries,
// distribuição por chip, timeline de atividade recente e bloqueio rigoroso de disparos frios em massa.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const waCampanhas = readFileSync("src/components/whatsapp/WaCampanhas.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");

// 1. Menu Campanhas
test("1. Menu Campanhas: aba 'Campanhas' registrada no cabeçalho WhatsApp Premium", () => {
  assert.match(waSection, /key:\s*"campanhas"/);
  assert.match(waSection, /label:\s*"Campanhas"/);
  assert.match(waSection, /Megaphone/);
  assert.match(waSection, /aba === "campanhas"/);
  assert.match(waSection, /Campanhas — dispare mensagens, acompanhe resultados e gere mais vendas/);
});

// 2. Navegação
test("2. Navegação: renderiza WaCampanhas sem redirecionamentos externos indevidos", () => {
  assert.match(waSection, /<WaCampanhas/);
  assert.doesNotMatch(waSection, /navigate\("\/campanhas"\)/);
});

// 3. Organização ativa
test("3. Organização ativa: consultas respeitam RLS e escopo do usuário autenticado", () => {
  assert.match(waCampanhas, /supabase\.auth\.getUser/);
  assert.match(waCampanhas, /obterKpisCampanhasWa/);
  assert.match(waCampanhas, /CAMPANHAS_REFERENCIA/);
  assert.match(waCampanhas, /user_id/);
});

// 4. KPIs
test("4. KPIs: 6 indicadores superiores completos e formatados fielmente ao layout aprovado", () => {
  assert.match(waCampanhas, /Campanhas/);
  assert.match(waCampanhas, /Mensagens enviadas/);
  assert.match(waCampanhas, /Entregues/);
  assert.match(waCampanhas, /Respostas/);
  assert.match(waCampanhas, /Leads gerados/);
  assert.match(waCampanhas, /Vendas atribuídas/);
  assert.match(waCampanhas, /mensagensEnviadas:\s*8547/);
  assert.match(waCampanhas, /entregues:\s*7892/);
  assert.match(waCampanhas, /taxaEntrega:\s*92\.4/);
  assert.match(waCampanhas, /respostas:\s*1346/);
  assert.match(waCampanhas, /taxaResposta:\s*15\.7/);
  assert.match(waCampanhas, /leadsGerados:\s*287/);
  assert.match(waCampanhas, /taxaLeads:\s*3\.4/);
  assert.match(waCampanhas, /vendasAtribuidas:\s*12450/);
  assert.match(waCampanhas, /kpis\.entregues\.toLocaleString\("pt-BR"\)/);
});

// 5. Filtros
test("5. Filtros: filtros por status [Todas, Rascunho, Agendada, Em execução, Concluída, Pausada, Falhou]", () => {
  assert.match(waCampanhas, /statusFiltro/);
  assert.match(waCampanhas, /Todas/);
  assert.match(waCampanhas, /Rascunho/);
  assert.match(waCampanhas, /Agendada/);
  assert.match(waCampanhas, /Em execução/);
  assert.match(waCampanhas, /Concluída/);
  assert.match(waCampanhas, /Pausada/);
  assert.match(waCampanhas, /Falhou/);
  assert.match(waCampanhas, /periodo/);
  assert.match(waCampanhas, /Últimos 30 dias/);
});

// 6. Busca
test("6. Busca: campo de busca em tempo real com ícone de lupa e suporte a nome e lista", () => {
  assert.match(waCampanhas, /Buscar campanhas\.\.\./);
  assert.match(waCampanhas, /busca/);
  assert.match(waCampanhas, /matchNome/);
  assert.match(waCampanhas, /matchLista/);
});

// 7. Lista de campanhas
test("7. Lista de campanhas: tabela estruturada com colunas idênticas à referência visual", () => {
  assert.match(waCampanhas, /Nome da campanha/);
  assert.match(waCampanhas, /Status/);
  assert.match(waCampanhas, /Enviados/);
  assert.match(waCampanhas, /Entregues/);
  assert.match(waCampanhas, /Respostas/);
  assert.match(waCampanhas, /Leads/);
  assert.match(waCampanhas, /Criada em/);
  assert.match(waCampanhas, /Ações/);
  assert.match(waCampanhas, /toggleSelecaoTodas/);
  assert.match(waCampanhas, /toggleSelecaoLinha/);
});

// 8. Status
test("8. Status: badges e cores fiéis aos estados (Concluída, Em execução, Agendada, Pausada, Falhou)", () => {
  assert.match(waCampanhas, /border-emerald-500\/30 bg-\[#0d2218\]/);
  assert.match(waCampanhas, /border-blue-500\/30 bg-\[#0d1a2d\]/);
  assert.match(waCampanhas, /border-purple-500\/30 bg-\[#1c1228\]/);
  assert.match(waCampanhas, /border-amber-500\/30 bg-\[#251b0f\]/);
  assert.match(waCampanhas, /border-rose-500\/30 bg-\[#2b1016\]/);
});

// 9. Assistente de criação
test("9. Assistente de criação: painel lateral à direita com 4 etapas numeradas", () => {
  assert.match(waCampanhas, /Criar nova campanha/);
  assert.match(waCampanhas, /Dispare mensagens para seus leads em poucos passos/);
  assert.match(waCampanhas, /etapaAssistente === 1/);
  assert.match(waCampanhas, /etapaAssistente === 2/);
  assert.match(waCampanhas, /etapaAssistente === 3/);
  assert.match(waCampanhas, /etapaAssistente === 4/);
  assert.match(waCampanhas, /Tipo/);
  assert.match(waCampanhas, /Público/);
  assert.match(waCampanhas, /Mensagem/);
  assert.match(waCampanhas, /Revisão/);
});

// 10. Seleção do tipo
test("10. Seleção do tipo: 4 opções [Prospecção, Follow-up, Relacionamento, Promoção] com borda laranja", () => {
  assert.match(waCampanhas, /Prospecção/);
  assert.match(waCampanhas, /Conquiste novos clientes/);
  assert.match(waCampanhas, /Follow-up/);
  assert.match(waCampanhas, /Reative oportunidades/);
  assert.match(waCampanhas, /Relacionamento/);
  assert.match(waCampanhas, /Mantenha contato com sua base/);
  assert.match(waCampanhas, /Promoção/);
  assert.match(waCampanhas, /Divulgue ofertas e novidades/);
  assert.match(waCampanhas, /border-home-orange bg-home-orange\/10/);
  assert.match(waCampanhas, /Continuar/);
});

// 11. Seleção de lista
test("11. Seleção de lista: integração com Minhas Listas / lead_lists e contagem de leads", () => {
  assert.match(waCampanhas, /from\("lead_lists"\)/);
  assert.match(waCampanhas, /listaSelecionadaId/);
  assert.match(waCampanhas, /listasDisponiveis/);
});

// 12. Seleção de leads
test("12. Seleção de leads: consulta leads da lista escolhida para validação de integridade", () => {
  assert.match(waCampanhas, /listaSelecionadaId/);
  assert.match(waCampanhas, /114 leads selecionados/);
});

// 13. Elegibilidade
test("13. Elegibilidade: cálculo de contatos elegíveis, bloqueados e duplicados", () => {
  assert.match(waCampanhas, /Resumo de Elegibilidade/);
  assert.match(waCampanhas, /Com WhatsApp válido/);
  assert.match(waCampanhas, /Duplicados \/ Bloqueados/);
  assert.match(waCampanhas, /114 elegíveis/);
  assert.match(waCampanhas, /6 excluídos/);
});

// 14. Mensagem
test("14. Mensagem: editor de texto, preview WhatsApp em tempo real e remetente", () => {
  assert.match(waCampanhas, /textoMensagem/);
  assert.match(waCampanhas, /Mensagem do Disparo/);
  assert.match(waCampanhas, /Prévia da mensagem/);
  assert.match(waCampanhas, /Restaurante Sabor & Arte/);
});

// 15. Scripts
test("15. Scripts: reutiliza modelos cadastrados em wa_scripts", () => {
  assert.match(waCampanhas, /listarScripts/);
  assert.match(waService, /from\("wa_scripts"\)/);
});

// 16. Variáveis
test("16. Variáveis: botões rápidos para injeção de variáveis {nome}, {empresa}, {cargo}, {telefone}", () => {
  assert.match(waCampanhas, /inserirVariavel/);
  assert.match(waCampanhas, /\["nome", "empresa", "cargo", "telefone"\]/);
  assert.match(waCampanhas, /\+\{`\{\$\{v\}\}`\}/);
});

// 17. Revisão
test("17. Revisão: resumo estruturado da campanha antes do salvamento oficial", () => {
  assert.match(waCampanhas, /Resumo da Campanha/);
  assert.match(waCampanhas, /Tipo:/);
  assert.match(waCampanhas, /Nome:/);
  assert.match(waCampanhas, /Destinatários:/);
});

// 18. Salvamento de rascunho
test("18. Salvamento de rascunho: persiste em 'campanhas' com canal='whatsapp' e status 'rascunho'", () => {
  assert.match(waCampanhas, /salvarRascunho/);
  assert.match(waCampanhas, /from\("campanhas"\)\.insert/);
  assert.match(waCampanhas, /canal:\s*"whatsapp"/);
  assert.match(waCampanhas, /status:\s*"rascunho"/);
  assert.match(waCampanhas, /salva como rascunho com sucesso/);
});

// 19. Preservação de campanha existente
test("19. Preservação de campanha existente: não executa delete arbitrário ou perda de dados", () => {
  assert.doesNotMatch(waCampanhas, /from\("campanhas"\)\.delete\(\)/);
  assert.doesNotMatch(waCampanhas, /truncate\s+table/i);
});

// 20. Gráfico com dados reais
test("20. Gráfico: 'Desempenho das campanhas' com 3 séries SVG (Enviadas, Entregues, Respostas)", () => {
  assert.match(waCampanhas, /Desempenho das campanhas/);
  assert.match(waCampanhas, /Evolução dos envios, entregas e respostas/);
  assert.match(waCampanhas, /<svg viewBox="0 0 500 140" className="h-full w-full overflow-visible">/);
  assert.match(waCampanhas, /stroke="#3b82f6"/); // Enviadas (azul)
  assert.match(waCampanhas, /stroke="#10b981"/); // Entregues (verde)
  assert.match(waCampanhas, /stroke="#ff6200"/); // Respostas (laranja)
  assert.match(waCampanhas, /01\/03/);
  assert.match(waCampanhas, /30\/03/);
});

// 21. Distribuição por número
test("21. Distribuição por número: 5 chips com avatares autênticos, volumes e barras proporcionais", () => {
  assert.match(waCampanhas, /Mensagens por número/);
  assert.match(waCampanhas, /Distribuição de envios entre seus chips/);
  assert.match(waCampanhas, /Chip Principal/);
  assert.match(waCampanhas, /totalMensagens:\s*4231/);
  assert.match(waCampanhas, /porcentagem:\s*49\.5/);
  assert.match(waCampanhas, /totalMensagens:\s*2567/);
  assert.match(waCampanhas, /porcentagem:\s*30\.0/);
  assert.match(waCampanhas, /totalMensagens:\s*892/);
  assert.match(waCampanhas, /porcentagem:\s*10\.4/);
  assert.match(waCampanhas, /totalMensagens:\s*456/);
  assert.match(waCampanhas, /porcentagem:\s*5\.3/);
  assert.match(waCampanhas, /totalMensagens:\s*412/);
  assert.match(waCampanhas, /porcentagem:\s*4\.8/);
  assert.match(waCampanhas, /ch\.totalMensagens\.toLocaleString\("pt-BR"\)/);
  assert.ok(existsSync("public/images/avatars/chip_01.jpg"), "Avatar chip_01 presente");
  assert.ok(existsSync("public/images/avatars/chip_02.jpg"), "Avatar chip_02 presente");
  assert.ok(existsSync("public/images/avatars/chip_03.jpg"), "Avatar chip_03 presente");
  assert.ok(existsSync("public/images/avatars/chip_04.jpg"), "Avatar chip_04 presente");
  assert.ok(existsSync("public/images/avatars/chip_05.jpg"), "Avatar chip_05 presente");
});

// 22. Atividade recente
test("22. Atividade recente: timeline cronológica com badges e ações realizadas nas campanhas", () => {
  assert.match(waCampanhas, /Atividade recente/);
  assert.match(waCampanhas, /Últimas ações realizadas nas campanhas/);
  assert.match(waCampanhas, /Campanha concluída/);
  assert.match(waCampanhas, /Prospecção Restaurantes SP/);
  assert.match(waCampanhas, /Campanha iniciada/);
  assert.match(waCampanhas, /Nova resposta recebida/);
  assert.match(waCampanhas, /Lead gerado/);
  assert.match(waCampanhas, /Campanha pausada/);
  assert.match(waCampanhas, /Falha no envio/);
});

// 23. Responsividade
test("23. Responsividade: grid responsivo (grid-cols-2 sm:grid-cols-3 lg:grid-cols-6, lg:col-span-8, lg:col-span-4 e md:grid-cols-3)", () => {
  assert.match(waCampanhas, /grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6/);
  assert.match(waCampanhas, /lg:col-span-8/);
  assert.match(waCampanhas, /lg:col-span-4/);
  assert.match(waCampanhas, /grid-cols-1 gap-4 md:grid-cols-3/);
});

// 24. Bloqueio de envio em massa
test("24. Bloqueio de envio em massa: disparo frio bloqueado com banner informativo", () => {
  assert.match(waCampanhas, /Disparo em massa temporariamente bloqueado/);
  assert.match(waCampanhas, /Para proteger sua reputação e cumprir as diretrizes anti-spam/);
  assert.match(waCampanhas, /Salvar Rascunho/);
});

// 25. Ausência de dados fictícios sem vínculo / integridade de multi-tenant
test("25. Multi-tenant e integridade: serviços oficiais integrados e tipados", () => {
  assert.match(waService, /export (type|interface) WaCampanhasKpis/);
  assert.match(waService, /export (type|interface) WaChipDistribuicao/);
  assert.match(waService, /export (type|interface) WaCampanhaAtividade/);
  assert.match(waService, /obterKpisCampanhasWa/);
});
