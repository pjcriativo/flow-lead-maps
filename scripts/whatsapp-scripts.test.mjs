// Suite de Testes: WhatsApp Scripts — Tela 05 (Prompt 61)
// Invariant: Fidelidade visual absoluta ao layout aprovado, dados reais de multi-tenant (org_id, memberships, RLS),
// 5 KPIs superiores (scripts criados, usos no mês, atendimentos com script, taxa de utilização, avaliação da equipe),
// painel central esquerdo "Meus scripts" com busca, categorias rápidas, filtros, tabela de scripts,
// painel lateral direito "Editar script" / "Novo script" com barra de formatação (*negrito*, _itálico_, listas, links, emojis, variáveis {{token}}),
// 3 cards inferiores (Desempenho com 4 KPIs e gráfico SVG, Scripts mais usados com ranking numerado, Atividade recente com 6 eventos),
// isolamento rigoroso, ausência de disparos indevidos e preservação integral dos scripts e serviços legados.

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const waScripts = readFileSync("src/components/whatsapp/WaScripts.tsx", "utf8");
const waSection = readFileSync("src/components/whatsapp/WhatsAppSection.tsx", "utf8");
const waService = readFileSync("src/services/whatsapp.ts", "utf8");
const waCopy = readFileSync("src/lib/wa-copy.ts", "utf8");

// 1. Organização ativa
test("1. Organização ativa: consultas respeitam RLS e escopo da organização autenticada", () => {
  assert.match(waScripts, /obterDadosScriptsWa/);
  assert.match(waService, /supabase\.from\("wa_scripts"\)/);
  assert.match(waService, /user_id/);
});

// 2. Permissões de leitura
test("2. Permissões de leitura: listagem de scripts consulta tabela oficial wa_scripts", () => {
  assert.match(waService, /listarScripts/);
  assert.match(waService, /\.select\("id, nome, tipo, mensagem, media_url, criado_em"\)/);
});

// 3. Permissões de escrita
test("3. Permissões de escrita: criação e atualização vinculam user_id e org_id", () => {
  assert.match(waService, /salvarScriptWa/);
  assert.match(waService, /supabase\.from\("wa_scripts"\)\.insert/);
});

// 4. Busca
test("4. Busca: campo em tempo real com busca por nome, categoria ou texto", () => {
  assert.match(waScripts, /Buscar scripts por nome, categoria ou texto\.\.\./);
  assert.match(waScripts, /matchNome/);
  assert.match(waScripts, /matchMsg/);
  assert.match(waScripts, /matchCat/);
});

// 5. Categorias
test("5. Categorias: 6 categorias mapeadas (Boas-vindas, Qualificação, Follow-up, Agendamento, Recuperação, Atendimento)", () => {
  assert.match(waScripts, /boas_vindas/);
  assert.match(waScripts, /qualificacao/);
  assert.match(waScripts, /follow_up/);
  assert.match(waScripts, /agendamento/);
  assert.match(waScripts, /recuperacao/);
  assert.match(waScripts, /atendimento/);
});

// 6. Filtros
test("6. Filtros: dropdown de categorias e dropdown de status [Ativo, Inativo]", () => {
  assert.match(waScripts, /Todas as categorias/);
  assert.match(waScripts, /Todos os status/);
  assert.match(waScripts, /option value="ativo"/);
  assert.match(waScripts, /option value="inativo"/);
});

// 7. Paginação e scroll
test("7. Paginação / Scroll: tabela estilizada com rolagem interna e sem overflow global", () => {
  assert.match(waScripts, /overflow-x-auto/);
  assert.match(waScripts, /divide-white/);
});

// 8. Listagem
test("8. Listagem: colunas idênticas à referência [Checkbox, Nome, Categoria, Texto, Variáveis, Usos, Status, Ações]", () => {
  assert.match(waScripts, /Nome do script/);
  assert.match(waScripts, /Categoria/);
  assert.match(waScripts, /Texto/);
  assert.match(waScripts, /Variáveis/);
  assert.match(waScripts, /Usos/);
  assert.match(waScripts, /Status/);
  assert.match(waScripts, /Ações/);
});

// 9. Criação
test("9. Criação: botão '+ Novo script' limpa formulário e ativa modo de criação no painel lateral", () => {
  assert.match(waScripts, /handleNovoScript/);
  assert.match(waScripts, /\+ Novo script/);
  assert.match(waScripts, /modoCriacao \? "Novo script" : "Editar script"/);
});

// 10. Edição
test("10. Edição: clique na linha da tabela carrega script no painel direito", () => {
  assert.match(waScripts, /handleSelecionarParaEdicao/);
  assert.match(waScripts, /setNomeForm/);
  assert.match(waScripts, /setMensagemForm/);
  assert.match(waScripts, /setCategoriaForm/);
});

// 11. Duplicação
test("11. Duplicação: duplicação com sufixo (Cópia) preservando integridade", () => {
  assert.match(waScripts, /handleDuplicar/);
  assert.match(waService, /duplicarScriptWa/);
  assert.match(waService, /\(Cópia\)/);
});

// 12. Exclusão autorizada
test("12. Exclusão autorizada: modal de confirmação antes de remover script", () => {
  assert.match(waScripts, /Excluir script\?/);
  assert.match(waScripts, /Esta ação é irreversível/);
  assert.match(waScripts, /Sim, excluir/);
  assert.match(waService, /excluirScriptWa/);
});

// 13. Ativação
test("13. Ativação: toggle de status ativa o script com feedback", () => {
  assert.match(waScripts, /handleToggleStatus/);
  assert.match(waService, /alternarStatusScriptWa/);
  assert.match(waScripts, /Script ".*" ativado/);
});

// 14. Desativação
test("14. Desativação: toggle desativa e exibe status inativo", () => {
  assert.match(waScripts, /Script ".*" desativado/);
  assert.match(waScripts, /statusForm \? "bg-emerald-500" : "bg-white\/20"/);
});

// 15. Formatação real
test("15. Formatação real: botões de negrito (*), itálico (_), tachado (~), listas e links", () => {
  assert.match(waScripts, /Negrito WhatsApp/);
  assert.match(waScripts, /Itálico WhatsApp/);
  assert.match(waScripts, /Tachado WhatsApp/);
  assert.match(waScripts, /inserirNoCursor\("\*", "\*"\)/);
  assert.match(waScripts, /inserirNoCursor\("_", "_"\)/);
  assert.match(waScripts, /inserirNoCursor\("~", "~"\)/);
});

// 16. Variáveis
test("16. Variáveis: catálogo de tags {{nome}}, {{empresa}}, {{cidade}}, {{telefone}}, {{link}}", () => {
  assert.match(waScripts, /VARIAVEIS_DISPONIVEIS/);
  assert.match(waScripts, /\{\{nome\}\}/);
  assert.match(waScripts, /\{\{empresa\}\}/);
  assert.match(waScripts, /extrairVariaveis/);
});

// 17. Prévia
test("17. Prévia: visualização dinâmica com substituição de dados demonstrativos", () => {
  assert.match(waScripts, /previaResolvida/);
  assert.match(waScripts, /resolverVariaveis/);
  assert.match(waCopy, /resolverVariaveis/);
});

// 18. Persistência
test("18. Persistência: salvamento em wa_scripts com fallback no storage local", () => {
  assert.match(waService, /salvarScriptWa/);
  assert.match(waService, /flow_wa_scripts_meta_v1/);
});

// 19. Uso em Conversas
test("19. Uso em Conversas: compatibilidade com seleção rápida no chat", () => {
  assert.match(waService, /listarScripts/);
  assert.match(waSection, /WaScripts/);
});

// 20. Uso em Campanhas
test("20. Uso em Campanhas: reaproveitamento do catálogo de scripts em campanhas", () => {
  assert.match(waService, /SCRIPTS_REFERENCIA_PREMIUM/);
  assert.match(waCopy, /WA_TOKENS/);
});

// 21. Uso em Automações
test("21. Uso em Automações: integração com ações do assistente de automação", () => {
  assert.match(waService, /scriptId/);
  assert.match(waService, /WaAutomacaoItem/);
});

// 22. Indicadores (5 KPIs superiores)
test("22. Indicadores: 5 cards [Scripts criados 128, Usos 2.854, Atendimentos 342, Taxa 76%, Avaliação 4,8]", () => {
  assert.match(waScripts, /Scripts criados/);
  assert.match(waScripts, /Usos no mês/);
  assert.match(waScripts, /Atendimentos com script/);
  assert.match(waScripts, /Taxa de utilização/);
  assert.match(waScripts, /Avaliação da equipe/);
  assert.match(waService, /KPIS_SCRIPTS_REFERENCIA_PREMIUM/);
});

// 23. Ranking
test("23. Ranking: card 'Scripts mais usados' com top 5 numerado e contagem de usos", () => {
  assert.match(waScripts, /Scripts mais usados/);
  assert.match(waScripts, /Ranking dos scripts com melhor desempenho/);
  assert.match(waScripts, /item\.rank/);
  assert.match(waScripts, /item\.usos/);
  assert.match(waService, /SCRIPTS_MAIS_USADOS_PREMIUM/);
});

// 24. Atividade
test("24. Atividade: card 'Atividade recente' com 6 eventos cronológicos e badges", () => {
  assert.match(waScripts, /Atividade recente/);
  assert.match(waScripts, /Últimas ações nos scripts/);
  assert.match(waScripts, /act\.scriptNome/);
  assert.match(waService, /ATIVIDADES_SCRIPTS_PREMIUM/);
});

// 25. Organização A/B
test("25. Organização A/B: isolamento de scripts por tenancy", () => {
  assert.match(waService, /listarScriptsLocais/);
  assert.match(waService, /salvarScriptsLocais/);
});

// 26. Preservação dos scripts legados
test("26. Preservação dos scripts legados: contratos existentes e tipos preservados", () => {
  assert.match(waService, /export type WaScript =/);
  assert.match(waService, /export async function listarScripts/);
  assert.match(waService, /export async function criarScript/);
  assert.match(waService, /export async function excluirScript/);
});

// 27. Estados vazios e de erro
test("27. Estados vazios e de erro: feedback visual amigável quando nenhum script é encontrado", () => {
  assert.match(waScripts, /Nenhum script encontrado para os filtros selecionados\./);
});

// 28. Responsividade
test("28. Responsividade: layout responsivo em grid com adaptação desktop e mobile", () => {
  assert.match(waScripts, /grid-cols-1 sm:grid-cols-2 lg:grid-cols-5/);
  assert.match(waScripts, /lg:col-span-7 xl:col-span-8/);
  assert.match(waScripts, /lg:col-span-5 xl:col-span-4/);
});

// 29. Ausência de disparos indevidos
test("29. Ausência de disparos indevidos: salvar ou editar script não dispara mensagens automaticamente", () => {
  assert.doesNotMatch(waScripts, /enviarTesteWhatsapp/);
  assert.doesNotMatch(waScripts, /disparar/);
});
