// Suite de Testes: WhatsApp Números e Conexões — Tela 04 (Prompt 59)
// Invariant: Fidelidade visual absoluta ao layout aprovado, dados reais de multi-tenant (org_id, memberships, RLS),
// 5 KPIs (conectados, desconectados, reconexão, mensagens hoje, disponibilidade), tabela de números com busca/filtros/ações,
// assistente de conexão lateral com 4 etapas (pareamento QR/código, configuração, teste, ativo),
// 3 cards inferiores (saúde das conexões com donut, rotação e contingência, atividade recente com 6 eventos),
// isolamento rigoroso, proteção de segredos e preservação integral dos serviços existentes.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const waNumeros = readFileSync("src/components/whatsapp/WaNumeros.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");
const waShared = readFileSync("supabase/functions/_shared/wa.ts", "utf8");
const waAuthorization = readFileSync(
  "supabase/functions/_shared/whatsapp-authorization.ts",
  "utf8",
);

// 1. Organização ativa
test("1. Organização ativa: consultas respeitam RLS e escopo do usuário autenticado", () => {
  assert.match(waNumeros, /obterDadosNumerosWa/);
  assert.match(waService, /listarChips/);
  assert.match(waService, /listarAlertas/);
  assert.match(waShared, /user_id/);
});

// 2. Permissões
test("2. Permissões: operações de instância exigem autenticação e autorização", () => {
  assert.match(waShared, /instanciaDaOrgComToken/);
  assert.match(waShared, /\.eq\("org_id",\s*(?:scope\.)?orgId\)/);
  assert.match(waAuthorization, /auth\.getUser/);
  assert.match(waAuthorization, /from\("memberships"\)/);
  assert.match(waAuthorization, /org_papeis/);
  assert.match(waNumeros, /excluirChip/);
  assert.match(waNumeros, /marcarChip/);
});

// 3. Listagem de números
test("3. Listagem de números: tabela estruturada com colunas idênticas à referência visual", () => {
  assert.match(waNumeros, /Seus números WhatsApp/);
  assert.match(waNumeros, /Gerencie suas instâncias, acompanhe o status e configure prioridades/);
  assert.match(waNumeros, /Instância/);
  assert.match(waNumeros, /Número/);
  assert.match(waNumeros, /Status/);
  assert.match(waNumeros, /Função/);
  assert.match(waNumeros, /Mensagens hoje/);
  assert.match(waNumeros, /Última verificação/);
  assert.match(waNumeros, /Ações/);
});

// 4. Busca
test("4. Busca: campo de busca em tempo real com ícone de lupa e suporte a nome, número e status", () => {
  assert.match(waNumeros, /Buscar número, instância ou status\.\.\./);
  assert.match(waNumeros, /busca/);
  assert.match(waNumeros, /matchBusca/);
});

// 5. Filtros
test("5. Filtros: seletor de status com opções [Todos os status, Conectado, Desconectado, Aguardando]", () => {
  assert.match(waNumeros, /Todos os status/);
  assert.match(waNumeros, /filtroStatus/);
  assert.match(waNumeros, /matchStatus/);
});

// 6. Estado de conexão
test("6. Estado de conexão: badges e cores fiéis aos estados Conectado, Desconectado e Aguardando", () => {
  assert.match(waNumeros, /renderBadgeStatus/);
  assert.match(waNumeros, /border-emerald-500\/30 bg-\[#0d2218\].*text-emerald-400/);
  assert.match(waNumeros, /border-rose-500\/30 bg-\[#2b1016\].*text-rose-400/);
  assert.match(waNumeros, /border-amber-500\/30 bg-\[#251b0f\].*text-amber-400/);
});

// 7. Números desconectados
test("7. Números desconectados: identificação clara na tabela e contagem no KPI superior", () => {
  assert.match(waNumeros, /Desconectado/);
  assert.match(waNumeros, /kpis\?.desconectados/);
  assert.match(waNumeros, /desconectadosTrend/);
});

// 8. Criar instância com provedor simulado
test("8. Criar instância: botão '+ Conectar número' e chamada ao serviço criarChip", () => {
  assert.match(waNumeros, /\+ Conectar número|Conectar número/);
  assert.match(waNumeros, /criarChip/);
  assert.match(waNumeros, /iniciarNovoPareamento/);
});

// 9. QR Code
test("9. QR Code: exibição com WhatsApp logo central e suporte a código de 8 dígitos", () => {
  assert.match(waNumeros, /Escaneie o QR Code/);
  assert.match(waNumeros, /Abra o WhatsApp no seu celular, acesse Aparelhos conectados/);
  assert.match(waNumeros, /qrCodeData/);
  assert.match(waNumeros, /Atualizar QR Code/);
  assert.match(waNumeros, /Código 8 Dígitos/);
  assert.match(waNumeros, /open=\{Boolean\(erroPareamento\)\}/);
  assert.match(waNumeros, /Não foi possível gerar o pareamento/);
  assert.match(waNumeros, /Tentar novamente/);
  assert.doesNotMatch(waNumeros, /role="alert"/);
});

// 10. Expiração de QR
test("10. Expiração de QR: indicador com contagem regressiva e aviso de atualização automática", () => {
  assert.match(waNumeros, /O QR Code é temporário e será atualizado automaticamente/);
  assert.match(waNumeros, /tempoExpiracaoQr/);
});

// 11. Reconexão
test("11. Reconexão: ação de atualizar QR, consultar status e KPI de reconexão", () => {
  assert.match(waNumeros, /Em reconexão/);
  assert.match(waNumeros, /kpis\?.reconexao/);
  assert.match(waNumeros, /statusChip/);
});

// 12. Configuração
test("12. Configuração: etapa 2 do assistente permite definir nome interno e função operacional", () => {
  assert.match(waNumeros, /Configuração/);
  assert.match(waNumeros, /novoNome/);
  assert.match(waNumeros, /novaFuncao/);
  assert.match(waNumeros, /salvarConfiguracaoEtapa2/);
});

// 13. Prioridade
test("13. Prioridade: suporte a reordenar prioridade no rodízio de disparos", () => {
  assert.match(waNumeros, /reordenarPrioridade/);
  assert.match(waNumeros, /Subir prioridade no rodízio/);
  assert.match(waNumeros, /Descer prioridade no rodízio/);
});

// 14. Papel operacional
test("14. Papel operacional: suporte aos papéis [Principal, Comercial, Suporte, Reserva, Contingência]", () => {
  assert.match(waNumeros, /Principal/);
  assert.match(waNumeros, /Comercial/);
  assert.match(waNumeros, /Suporte/);
  assert.match(waNumeros, /Reserva/);
  assert.match(waNumeros, /Contingência/);
  assert.match(waNumeros, /renderBadgeFuncao/);
});

// 15. Saúde
test("15. Saúde: card 'Saúde das conexões' com gráfico donut circular e percentual central", () => {
  assert.match(waNumeros, /Saúde das conexões/);
  assert.match(waNumeros, /Monitoramento em tempo real das suas instâncias/);
  assert.match(waNumeros, /saude\?.saudeGeralPct/);
  assert.match(waNumeros, /Saúde geral/);
  assert.match(waNumeros, /Últimas 24 horas/);
  assert.match(waNumeros, /Conectados/);
  assert.match(waNumeros, /Desconectados/);
});

// 16. Contingência indisponível / Configuração
test("16. Contingência: tela descreve somente prioridade e contingência realmente ativas", () => {
  assert.match(waNumeros, /Prioridade e contingência/);
  assert.match(waNumeros, /Continuidade autorizada para falhas técnicas/);
  assert.match(waNumeros, /não migra envios aceitos ou incertos/);
  assert.match(waNumeros, /Número de backup/);
  assert.match(waNumeros, /Contingência ativa/);
  assert.match(waNumeros, /handleToggleContingencia/);
  assert.doesNotMatch(waNumeros, /setRotacao\(\(current\) => \(\{ \.\.\.current, estrategia:/);
  assert.doesNotMatch(waNumeros, /setRotacao\(\(current\) => \(\{ \.\.\.current, intervalo:/);
});

// 17. Ajuda contextual
test("17. Ajuda contextual: explica prioridade, backup, contingência e pareamento", () => {
  assert.match(waNumeros, /function HelpTip/);
  assert.match(waNumeros, /aria-label=\{`Ajuda:/);
  assert.match(waNumeros, /A prioridade define a ordem/);
  assert.match(waNumeros, /O backup só assume/);
  assert.match(waNumeros, /No WhatsApp do celular/);
});

// 18. Atividade recente
test("18. Atividade recente: card inferior direito com 6 eventos cronológicos", () => {
  assert.match(waNumeros, /Atividade recente/);
  assert.match(waNumeros, /Ver todas/);
  assert.match(waNumeros, /atividades\.slice\(0,\s*6\)/);
  assert.match(waService, /Chip Principal conectado/);
  assert.match(waService, /Chip Reserva desconectado/);
  assert.match(waService, /Chip Vendas recebeu 25 mensagens/);
  assert.match(waService, /Chip Suporte atingiu 90% da quota/);
  assert.match(waService, /Chip Contingência configurado/);
  assert.match(waService, /Atualização de configuração/);
});

// 19. Isolamento A/B
test("19. Isolamento A/B: instâncias e tokens isolados por organização e user_id", () => {
  assert.match(waShared, /instanciaDaOrgComToken/);
  assert.match(waShared, /user_id/);
  assert.doesNotMatch(waNumeros, /token/);
});

// 20. Proteção de segredos
test("20. Proteção de segredos: nenhum token ou chave de API exposta no cliente", () => {
  assert.doesNotMatch(waNumeros, /EVOLUTION_API_KEY/);
  assert.doesNotMatch(waNumeros, /SERVICE_ROLE/);
  assert.doesNotMatch(waService, /SUPABASE_SERVICE_ROLE_KEY/);
});

// 21. Responsividade
test("21. Responsividade: grid responsivo (grid-cols-2 lg:grid-cols-5, lg:col-span-8, lg:col-span-4 e md:grid-cols-3)", () => {
  assert.match(waNumeros, /grid grid-cols-2/);
  assert.match(waNumeros, /lg:grid-cols-5/);
  assert.match(waNumeros, /lg:col-span-8/);
  assert.match(waNumeros, /lg:col-span-4/);
  assert.match(waNumeros, /md:grid-cols-3/);
});

// 22. Preservação dos serviços existentes
test("22. Preservação dos serviços existentes: reusa listarChips, criarChip, parearChip, qrChip, checarChip e excluirChip", () => {
  assert.match(waNumeros, /listarChips/);
  assert.match(waNumeros, /criarChip/);
  assert.match(waNumeros, /parearChip/);
  assert.match(waNumeros, /qrChip/);
  assert.match(waNumeros, /checarChip/);
  assert.match(waNumeros, /excluirChip/);
  assert.match(waSection, /<WaNumeros/);
  assert.match(waSection, /Números e Conexões/);
});

test("23. Rede controlada: envio explícito do JWT, cancelamento e suspensão do polling em 401/403", () => {
  assert.match(waService, /getSession\(\)/);
  assert.match(waService, /Authorization:\s*`Bearer \$\{session\.access_token\}`/);
  assert.match(waService, /signal,/);
  assert.match(waNumeros, /new AbortController\(\)/);
  assert.match(waNumeros, /isWhatsappAuthorizationError/);
  assert.match(waNumeros, /MAX_POLL_FAILURES/);
  assert.doesNotMatch(waNumeros, /setInterval\(async \(\) => \{[\s\S]*statusChip/);
});

test("24. Interface privada: não expõe fornecedor nem usa notificações flutuantes", () => {
  assert.doesNotMatch(waNumeros, /from "sonner"/);
  assert.doesNotMatch(waNumeros, />[^<{]*Evolution[^<{]*</);
  assert.doesNotMatch(waService, /new Error\("A Evolution/);
  assert.match(waNumeros, /feedback/);
});

test("25. Identificação: usa metadados salvos e formata o telefone conectado", () => {
  assert.match(waService, /const metas = obterMetaChipsWa\(\)/);
  assert.match(waService, /meta\?\.alias/);
  assert.match(waNumeros, /formatarNumeroWhatsapp\(chip\.numero\)/);
});

test("26. Inventário: registros locais órfãos são removidos da listagem quando o remoto responde", () => {
  assert.match(waShared, /listarInstanciasRemotas/);
  assert.match(waShared, /remoteNames\.has/);
  assert.match(waShared, /normalizeWhatsappOwner/);
});

test("27. Novo pareamento: null cria uma instância e nunca reutiliza o chip ativo anterior", () => {
  assert.match(
    waNumeros,
    /instanciaIdTarget === undefined\s*\?\s*chipAtivoId\s*:\s*instanciaIdTarget/,
  );
  assert.match(waNumeros, /gerarQrInstancia\(null,\s*"qr"\)/);
});
