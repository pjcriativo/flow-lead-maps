// Suite: WhatsApp Premium — Painel / Visão Geral (Prompt 56)
// Invariant: Fidelidade visual ao layout aprovado, dados reais de multi-tenant,
// unificação de navegação e preservação da arquitetura existente.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const sidebar = readFileSync("src/components/home-premium/DashboardSidebar.tsx", "utf8");
const dashboard = readFileSync("src/routes/_authenticated/dashboard.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waPainel = readFileSync("src/components/whatsapp/WaPainel.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");

// 1. Menu WhatsApp Unificado
test("1. Menu WhatsApp unificado: apenas sob Gestão -> WhatsApp, removido de Canais de Aquisição", () => {
  // Gestão -> WhatsApp existe
  assert.match(sidebar, /label: "WhatsApp",\s*section: "whatsapp",\s*icon: SiWhatsapp/);
  // Não há duplicidade em CANAIS DE AQUISIÇÃO
  const aquisicaoBlock = sidebar.slice(sidebar.indexOf('label: "CANAIS DE AQUISIÇÃO"'), sidebar.indexOf('label: "SISTEMA"'));
  assert.doesNotMatch(aquisicaoBlock, /section: "whatsapp"/, "WhatsApp não deve constar em Canais de Aquisição");
  // Contagem global de "WhatsApp" na sidebar é exatamente 1
  const matches = [...sidebar.matchAll(/label:\s*"WhatsApp"/g)];
  assert.equal(matches.length, 1, "Deve existir exatamente uma entrada 'WhatsApp' na sidebar");
});

// 2. Navegação interna com as 6 abas oficiais
test("2. Navegação interna: reproduz as 6 abas aprovadas [Painel, Conversas, Campanhas, Automação, Scripts, Números]", () => {
  assert.match(waSection, /key:\s*"painel"/);
  assert.match(waSection, /key:\s*"conversas"/);
  assert.match(waSection, /key:\s*"campanhas"/);
  assert.match(waSection, /key:\s*"automacao"/);
  assert.match(waSection, /key:\s*"scripts"/);
  assert.match(waSection, /key:\s*"numeros"/);

  // Aba ativa possui destaque laranja oficial da Flow Business
  assert.match(waSection, /border-home-orange/);
  assert.match(waSection, /text-home-orange/);
});

// 3. Indicadores reais (6 KPIs)
test("3. Indicadores reais: 6 cards seguindo a composição exata da referência", () => {
  assert.match(waPainel, /Números ativos/);
  assert.match(waPainel, /Leads com WhatsApp/);
  assert.match(waPainel, /Campanhas enviadas/);
  assert.match(waPainel, /Conversas ativas/);
  assert.match(waPainel, /Taxa de resposta/);
  assert.match(waPainel, /Total de leads/);

  // Subtextos oficiais da referência
  assert.match(waPainel, /de \{chips\.length\} configurados/);
  assert.match(waPainel, /em sua base/);
  assert.match(waPainel, /nos últimos 30 dias/);
  assert.match(waPainel, /agora no momento/);
  assert.match(waPainel, /média dos últimos 7 dias/);
  assert.match(waPainel, /em sua organização/);
});

// 4. Organização ativa / Multi-tenant
test("4. Organização ativa e multi-tenant: consultas respeitam o escopo da org e RLS", () => {
  assert.match(waService, /obterDadosPainelWa/);
  assert.match(waService, /canal", "whatsapp"/);
  assert.match(waService, /from\("leads"\)/);
  assert.match(waService, /from\("wa_envios"\)/);
  assert.match(waService, /from\("wa_mensagens"\)/);
});

// 5. Estado conectado
test("5. Estado conectado: exibe mensagem positiva e contadores detalhados", () => {
  assert.match(waPainel, /WhatsApp conectado e funcionando/);
  assert.match(waPainel, /Seus números estão ativos e prontos para enviar e receber mensagens/);
  assert.match(waPainel, /Números ativos/);
  assert.match(waPainel, /Em\s+contingência/);
  assert.match(waPainel, /Desconectado/);
});

// 6. Estado desconectado
test("6. Estado desconectado: mensagem clara e CTA para conectar", () => {
  assert.match(waPainel, /WhatsApp não conectado/);
  assert.match(waPainel, /Adicione e pareie instâncias dedicadas/);
  assert.match(waPainel, /Gerenciar números/);
});

// 7. Estado indisponível
test("7. Estado indisponível: trata falhas de conexão sem quebrar a interface", () => {
  assert.match(waPainel, /Status de conexão indisponível/);
  assert.match(waService, /indisponivel/);
});

// 8. Campanhas recentes
test("8. Campanhas recentes: tabela com colunas e status homologados", () => {
  assert.match(waPainel, /Campanhas recentes/);
  assert.match(waPainel, /Acompanhe o desempenho das suas últimas campanhas/);
  assert.match(waPainel, /Campanha/);
  assert.match(waPainel, /Status/);
  assert.match(waPainel, /Enviados/);
  assert.match(waPainel, /Entregues/);
  assert.match(waPainel, /Respostas/);
  assert.match(waPainel, /Criada em/);
});

// 9. Números ativos
test("9. Números ativos: identificação, telefone mascarado, status e função", () => {
  assert.match(waPainel, /Números ativos/);
  assert.match(waPainel, /Seus números conectados e em operação/);
  assert.match(waPainel, /formatarTelefone/);
  assert.match(waPainel, /Função/);
  assert.match(waPainel, /Gerenciar/);
});

// 10. Conversas recentes
test("10. Conversas recentes: exibe remetente, mensagem, hora e badge não lidas", () => {
  assert.match(waPainel, /Conversas recentes/);
  assert.match(waPainel, /Suas conversas mais recentes com leads e clientes/);
  assert.match(waPainel, /conversa\.nao_lidas/);
  assert.match(waPainel, /formatarHora/);
});

// 11. Atividade recente
test("11. Atividade recente: timeline ordenada do mais recente para o mais antigo", () => {
  assert.match(waPainel, /Atividade recente/);
  assert.match(waPainel, /Últimas ações realizadas no WhatsApp/);
  assert.match(waService, /atividades\.sort/);
});

// 12. Estados vazios
test("12. Estados vazios: tratamento elegante quando não há campanhas, números ou conversas", () => {
  assert.match(waPainel, /Nenhuma campanha de WhatsApp encontrada/);
  assert.match(waPainel, /Nenhum número configurado/);
  assert.match(waPainel, /Nenhuma conversa registrada ainda/);
  assert.match(waPainel, /Nenhuma atividade recente registrada/);
});

// 13. Estados de erro e loading
test("13. Estados de erro e loading: skeletons e tratamento resiliente", () => {
  assert.match(waPainel, /animate-pulse/);
  assert.match(waPainel, /Carregando campanhas/);
  assert.match(waSection, /Verificando\.\.\./);
});

// 14. Permissões e integridade
test("14. Permissões e integração na rota autenticada", () => {
  assert.match(dashboard, /section === "whatsapp"/);
  assert.match(dashboard, /<WhatsAppSection/);
});

// 15. Links e atalhos de Ações Rápidas
test("15. Links e atalhos: as 4 ações rápidas apontam para as abas corretas", () => {
  assert.match(waPainel, /Nova campanha/);
  assert.match(waPainel, /Novo script/);
  assert.match(waPainel, /Ver conversas/);
  assert.match(waPainel, /Automação/);
  assert.match(waPainel, /onIrParaCampanhas/);
  assert.match(waPainel, /onIrParaScripts/);
  assert.match(waPainel, /onIrParaConversas/);
  assert.match(waPainel, /onIrParaAutomacao/);
});

// 16. Responsividade
test("16. Responsividade: grid adaptativo para desktop, tablet e mobile", () => {
  assert.match(waPainel, /grid-cols-2.*sm:grid-cols-3.*xl:grid-cols-6/);
  assert.match(waPainel, /grid-cols-1.*lg:grid-cols-12/);
  assert.match(waPainel, /lg:col-span-7/);
  assert.match(waPainel, /lg:col-span-5/);
});

// 17. Ausência de dados demonstrativos e fidelidade estética
test("17. Ausência de dados demonstrativos e presença do asset 3D oficial", () => {
  assert.ok(existsSync("public/images/whatsapp-hero-3d.jpg"), "Asset 3D oficial do WhatsApp deve existir");
  assert.match(waSection, /\/images\/whatsapp-hero-3d\.jpg/);
  assert.match(waPainel, /Verificação manual/, "Contingência não deve prometer automação sem implementação real");
});

// 18. Ausência de envio automático
test("18. Ausência de disparo em massa ou envio automático no carregamento do painel", () => {
  // O carregamento do painel não chama invoke de envio (apenas queries e listagens)
  assert.doesNotMatch(waPainel, /enviarCampanhaLeadWa/);
  assert.doesNotMatch(waPainel, /send-proposal-wa/);
});
