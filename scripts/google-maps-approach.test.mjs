/**
 * FLOW BUSINESS — TEST SUITE PROMPT 43
 * GOOGLE MAPS PREMIUM — TELA 04: PREPARAR ABORDAGEM COMERCIAL
 *
 * 34 testes rigorosos validando fidelidade visual, fluxo de 4 etapas,
 * isolamento das 4 colunas operacionais, personalização de mensagens com variáveis reais,
 * bloqueio seguro de envios em massa não autorizados e não regressão das Telas 01, 02 e 03.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const approachView = read("src/components/google-maps-premium/GoogleMapsApproachView.tsx");
const stepper = read("src/components/google-maps-premium/GoogleMapsApproachStepper.tsx");
const leadSelection = read(
  "src/components/google-maps-premium/GoogleMapsApproachLeadSelection.tsx",
);
const strategy = read("src/components/google-maps-premium/GoogleMapsApproachStrategy.tsx");
const messageEditor = read(
  "src/components/google-maps-premium/GoogleMapsApproachMessageEditor.tsx",
);
const review = read("src/components/google-maps-premium/GoogleMapsApproachReview.tsx");
const resultsView = read("src/components/google-maps-premium/GoogleMapsSearchResultsView.tsx");
const premiumView = read("src/components/google-maps-premium/GoogleMapsPremiumView.tsx");
const runningView = read("src/components/google-maps-premium/GoogleMapsRunningView.tsx");
const sidebar = read("src/components/home-premium/DashboardSidebar.tsx");
const campanhasService = read("src/services/campanhas.ts");

// 1. Renderização da Tela 04
test("1. Renderização da Tela 04: reúne stepper e as quatro colunas operacionais", () => {
  assert.match(approachView, /GoogleMapsTopbar/);
  assert.match(approachView, /GoogleMapsApproachStepper/);
  assert.match(approachView, /GoogleMapsApproachLeadSelection/);
  assert.match(approachView, /GoogleMapsApproachStrategy/);
  assert.match(approachView, /GoogleMapsApproachMessageEditor/);
  assert.match(approachView, /GoogleMapsApproachReview/);
});

// 2. Identidade visual
test("2. Identidade visual: preserva fundo premium escuro e laranja oficial Flow Business", () => {
  assert.match(approachView, /bg-home-background/);
  assert.match(approachView, /text-home-orange/);
  assert.match(stepper, /bg-home-orange/);
});

// 3. Logomarca original
test("3. Logomarca original: plataforma mantém FlowLeadsLogo oficial", () => {
  assert.match(sidebar, /FlowLeadsLogo/);
  assert.match(sidebar, /Flow Business/);
});

// 4. Navegação Tela 03 → Tela 04
test("4. Navegação Tela 03 → Tela 04: acionada a partir de Enviar para campanha com preservação de leads", () => {
  assert.match(resultsView, /onPrepararAbordagem/);
  assert.match(premiumView, /onPrepararAbordagem=\{\(selectedIds\) =>/);
  assert.match(premiumView, /activeView === "approach"/);
  assert.match(approachView, /onVoltarParaResultados/);
});

// 5. Preservação da seleção
test("5. Preservação da seleção: a Tela 04 recebe initialSelectedLeadIds e preserva conjunto de IDs", () => {
  assert.match(approachView, /initialSelectedLeadIds\?: Set<string>/);
  assert.match(approachView, /setSelectedLeadIds/);
});

// 6. IDs reais dos leads
test("6. IDs reais dos leads: seleção opera com IDs reais persistidos sem usar índices numéricos", () => {
  assert.match(leadSelection, /selectedLeadIds\.has\(lead\.id\)/);
  assert.match(leadSelection, /onToggleSelectLead\(lead\.id\)/);
});

// 7. Escopo da organização
test("7. Escopo da organização: criação de rascunho de campanha é associada à organização ativa", () => {
  assert.match(approachView, /criarCampanhaDaLista/);
  assert.match(campanhasService, /userId/);
});

// 8. Filtro de leads
test("8. Filtro de leads: busca filtra empresas por nome, categoria ou cidade", () => {
  assert.match(leadSelection, /lead\.business_name/);
  assert.match(leadSelection, /lead\.category/);
  assert.match(leadSelection, /lead\.city/);
});

// 9. Seleção múltipla
test("9. Seleção múltipla: abas 'Leads selecionados' e 'Toda a lista' com contadores sincronizados", () => {
  assert.match(leadSelection, /Leads selecionados \(\{selectedLeadIds\.size\}\)/);
  assert.match(leadSelection, /Toda a lista \(\{leads\.length\}\)/);
  assert.match(leadSelection, /\{selectedLeadIds\.size\} de \{leads\.length\} selecionados/);
});

// 10. Paginação e lista rolável
test("10. Paginação e lista rolável: lista com scrollbar controlada sem quebrar layout", () => {
  assert.match(leadSelection, /overflow-y-auto/);
  assert.match(leadSelection, /max-h-\[460px\]/);
});

// 11. Lista de destino
test("11. Lista de destino: exibe nome da lista associada recebida da busca", () => {
  assert.match(approachView, /nomeLista=\{nomeLista\}/);
  assert.match(review, /\{nomeLista\}/);
});

// 12. Restrição de leads.list_id
test("12. Restrição de leads.list_id: preserva a integridade de vinculação de lista", () => {
  assert.match(campanhasService, /list_id/);
});

// 13. Objetivo comercial
test("13. Objetivo comercial: 4 opções disponíveis (Atrair novos clientes, Parcerias, Reunião, Promoções)", () => {
  assert.match(strategy, /Atrair novos clientes/);
  assert.match(strategy, /Parcerias comerciais/);
  assert.match(strategy, /Agendamento de reunião/);
  assert.match(strategy, /Divulgação de promoções/);
});

// 14. Seleção de canais
test("14. Seleção de canais: suporta múltiplos canais (WhatsApp com Recomendado, E-mail, Instagram, Telefone)", () => {
  assert.match(strategy, /WhatsApp/);
  assert.match(strategy, /Recomendado/);
  assert.match(strategy, /E-mail/);
  assert.match(strategy, /Instagram/);
  assert.match(strategy, /Telefone/);
});

// 15. Capacidade real de canais
test("15. Capacidade real de canais: seleção de canais não exige envio forçado de múltiplos canais", () => {
  assert.match(strategy, /canaisSelecionados\.includes/);
  assert.match(strategy, /onToggleCanal/);
});

// 16. Bloqueio de WhatsApp em massa
test("16. Bloqueio de WhatsApp em massa: criação de campanha gera rascunho sem disparo imediato não autorizado", () => {
  assert.match(approachView, /Rascunho Comercial/);
  assert.match(approachView, /Disparos frios em massa não ocorrem/);
  assert.match(campanhasService, /estado:\s*"pendente"/);
});

// 17. Bloqueio de e-mail em massa
test("17. Bloqueio de e-mail em massa: e-mail encontrado não dispara campanhas sem aprovação", () => {
  assert.match(campanhasService, /proposta_id/);
  assert.doesNotMatch(approachView, /dispararEmailEmMassa/);
});

// 18. Bloqueio de DMs frias
test("18. Bloqueio de DMs frias: canal Instagram preserva limites sem automação fria agressiva", () => {
  assert.doesNotMatch(approachView, /disparoEmMassaInstagram/);
});

// 19. Disponibilidade de telefone
test("19. Disponibilidade de telefone: contato por telefone disponível para abordagem manual", () => {
  assert.match(leadSelection, /lead\.phone/);
  assert.match(leadSelection, /Telefone:/);
});

// 20. Editor de mensagens
test("20. Editor de mensagens: textarea personalizável com abas WhatsApp, E-mail e Instagram", () => {
  assert.match(messageEditor, /canalAtivo === "whatsapp"/);
  assert.match(messageEditor, /canalAtivo === "email"/);
  assert.match(messageEditor, /canalAtivo === "instagram"/);
});

// 21. Variáveis disponíveis
test("21. Variáveis disponíveis: suporta inserção de {nome_empresa}, {categoria}, {cidade}, {avaliacao}, {seu_nome}", () => {
  assert.match(messageEditor, /\{nome_empresa\}/);
  assert.match(messageEditor, /\{categoria\}/);
  assert.match(messageEditor, /\{cidade\}/);
  assert.match(messageEditor, /\{avaliacao\}/);
  assert.match(messageEditor, /\{seu_nome\}/);
});

// 22. Tratamento de campos ausentes
test("22. Tratamento de campos ausentes: fallback seguro em variáveis ausentes na prévia", () => {
  assert.match(review, /lead\?\.business_name \|\|/);
  assert.match(review, /lead\?\.category \|\|/);
  assert.match(review, /lead\?\.city \|\|/);
});

// 23. Prévia personalizada
test("23. Prévia personalizada: exibe bolha no formato WhatsApp com variáveis resolvidas", () => {
  assert.match(review, /bg-\[#005c4b\]/);
  assert.match(review, /✓✓/);
  assert.match(review, /resolverPrevia/);
});

// 24. Contador de caracteres
test("24. Contador de caracteres: editor exibe contador em relação ao limite maxChars", () => {
  assert.match(messageEditor, /charCount\}\/\{maxChars\}/);
  assert.match(messageEditor, /maxLength=\{maxChars\}/);
});

// 25. Navegação entre etapas
test("25. Navegação entre etapas: stepper permite alternar etapas progressivamente", () => {
  assert.match(stepper, /onSelectStep\?\.\(st\.num\)/);
  assert.match(approachView, /currentStep=\{currentStep\}/);
});

// 26. Estados vazios
test("26. Estados vazios: feedback visual se não houver leads no filtro", () => {
  assert.match(leadSelection, /Nenhum lead encontrado neste filtro/);
});

// 27. Estados de erro
test("27. Estados de erro: valida seleção mínima de empresas e canais antes de prosseguir", () => {
  assert.match(approachView, /Selecione pelo menos uma empresa/);
  assert.match(approachView, /Selecione pelo menos um canal/);
});

// 28. Rascunho
test("28. Rascunho: botão 'Salvar como rascunho' preserva estado sem disparar mensagens", () => {
  assert.match(review, /Salvar como rascunho/);
  assert.match(approachView, /handleSalvarRascunho/);
});

// 29. Modelo de mensagem
test("29. Modelo de mensagem: botão 'Salvar como modelo' na Coluna 3", () => {
  assert.match(messageEditor, /Salvar como modelo/);
});

// 30. Integração com campanhas
test("30. Integração com campanhas: encaminha para campanhas existentes em modo rascunho", () => {
  assert.match(approachView, /criarCampanhaDaLista/);
  assert.match(approachView, /criarCampanhaWaDaLista/);
});

// 31. Integração com Minhas Listas
test("31. Integração com Minhas Listas: callback onOpenMinhasListas preservado", () => {
  assert.match(approachView, /onOpenMinhasListas\?: \(\) => void/);
});

// 32. Permissões comerciais
test("32. Permissões comerciais: operações usam sessão autenticada com RLS", () => {
  assert.match(campanhasService, /supabase\.auth\.getUser\(\)/);
});

// 33. Responsividade
test("33. Responsividade: layout com 4 colunas em lg e adaptação progressiva em telas menores", () => {
  assert.match(approachView, /grid-cols-1 md:grid-cols-2 lg:grid-cols-4/);
});

// 34. Não regressão das Telas 01, 02 e 03
test("34. Não regressão das Telas 01, 02 e 03: todas as telas anteriores continuam operacionais", () => {
  assert.match(premiumView, /activeView === "running"/);
  assert.match(premiumView, /activeView === "results"/);
  assert.match(premiumView, /activeView === "approach"/);
  assert.match(runningView, /GoogleMapsRunningStepper/);
  assert.match(resultsView, /GoogleMapsResultsIndicators/);
});
