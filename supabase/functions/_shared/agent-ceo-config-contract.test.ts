// Suite: contrato da configuração do CEO (migration 202610270002, serviço e fiação das Telas 02, 03 e 10).
// Invariante: criar/configurar/ativar o CEO só acontece por RPC de sessão humana, nas telas já existentes,
// sem escrita direta, sem nova tela e sem simular sucesso.
// Boundary IN: texto das migrations, do serviço e dos componentes.
// Boundary OUT: comportamento em Postgres (prova pglite fora do repo) e renderização no navegador.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { MODEL_PRICES } from "./agent-runtime.ts";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const m1 = read("../../migrations/202610270001_agent_foundation.sql");
const m2 = read("../../migrations/202610270002_agent_ceo_config.sql");
const svc = read("../../../src/services/agente-ceo-admin.ts");
const wizard = read("../../../src/components/agentes/CeoConfigWizard.tsx");
const ui = read("../../../src/components/agentes/CeoRealUi.tsx").replace(/\s+/g, " ");
const t02 = read("../../../src/components/agentes/EquipeAgentesView.tsx");
const t03 = read("../../../src/components/agentes/PerfilAgenteView.tsx");
const t10 = read("../../../src/components/agentes/CopilotoCeoView.tsx");
const montar = read("../../../src/components/agentes/MontarEquipeModal.tsx");
const shell = read("../../../src/components/agentes/AgentesAutomacoesView.tsx");
const sidebar = read("../../../src/components/agentes/AgentesSidebarNav.tsx");

test("002: RPCs de configuração exigem humano, security definer com search_path fixo", () => {
  for (const f of ["agent_configurar_ceo", "agent_definir_estado", "agent_consumo_org"]) {
    const corpo =
      m2.match(
        new RegExp(`create or replace function public\\.${f}\\([\\s\\S]*?\\n\\$\\$;`),
      )?.[0] ?? "";
    assert.ok(corpo, `${f} ausente`);
    assert.match(corpo, /agent_exigir_humano\(/, `${f} não exige humano`);
    assert.match(corpo, /security definer set search_path = public/, `${f} sem search_path`);
  }
});

test("002: grants só para authenticated; nada para anon/public/service_role", () => {
  assert.match(m2, /revoke all on function public\.agent_configurar_ceo[\s\S]*?from public, anon;/);
  assert.match(
    m2,
    /grant execute on function public\.agent_configurar_ceo[\s\S]*?to authenticated;/,
  );
  assert.doesNotMatch(m2, /to service_role/);
});

test("002: lista de modelos do SQL é a tabela de preços do runtime", () => {
  const lista = m2.match(/v_modelos constant text\[\] := array\[([^\]]*)\]/)?.[1] ?? "";
  const ids = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(ids, Object.keys(MODEL_PRICES).sort());
});

test("002: só ferramenta de leitura é concedível, ativar exige ferramenta+identidade+sem kill-switch", () => {
  assert.match(m2, /risco <> 'read' then raise exception 'ferramenta_acima_da_autonomia'/);
  for (const e of [
    "kill_switch_ligado",
    "ceo_sem_identidade",
    "ceo_sem_ferramenta",
    "ceo_ativo_exige_ferramenta",
  ]) {
    assert.match(m2, new RegExp(e));
  }
});

test("002: idempotente, aditiva e sem cron nem toque em tabelas de negócio", () => {
  assert.match(m2, /add column if not exists cargo text/);
  assert.doesNotMatch(m2, /cron\./);
  assert.doesNotMatch(
    m2,
    /(alter|insert into|update|delete from|drop) (table )?public\.(leads|propostas|campanhas|wa_|lead_|instagram_)/i,
  );
  assert.doesNotMatch(m2, /drop (table|column)/i);
  assert.doesNotMatch(m2, /teto_usd_(dia|mes) numeric/, "tetos absolutos continuam só na 001");
});

test("a 002 depende da 001 (mesma ordem de versão) e usa só objetos que a 001 cria", () => {
  assert.ok("202610270001" < "202610270002");
  for (const obj of ["agent_exigir_humano", "agent_permissions", "agent_tools", "agent_runs"]) {
    assert.match(m1, new RegExp(obj));
  }
});

test("serviço: só RPC e leitura; nenhuma escrita direta em tabela de agente", () => {
  assert.doesNotMatch(svc, /\.(insert|update|upsert|delete)\(/);
  const tabelas = [...svc.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1]).sort();
  assert.deepEqual([...new Set(tabelas)], ["agent_permissions", "agents"]);
  assert.doesNotMatch(svc, /service_role|SERVICE_ROLE/);
});

test("serviço: toda RPC chamada existe nas migrations de fundação/configuração", () => {
  const chamadas = [...svc.matchAll(/rpc(?:<[^>]*>)?\(\s*"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(chamadas.length >= 5);
  for (const nome of new Set(chamadas)) {
    assert.match(
      m1 + m2,
      new RegExp(`create or replace function public\\.${nome}\\(`),
      `${nome} não existe`,
    );
  }
  for (const esperado of [
    "agent_configurar_ceo",
    "agent_definir_estado",
    "agent_kill_switch",
    "agent_definir_limites",
    "agent_consumo_org",
  ]) {
    assert.ok(chamadas.includes(esperado), esperado);
  }
});

test("serviço: não existe nenhum caminho que conceda permissão ou decida aprovação pelo frontend", () => {
  for (const proibido of [
    "agent_conceder_permissao",
    "agent_decidir_aprovacao",
    "agent_enfileirar_tarefa",
    "agent_registrar_passo",
  ]) {
    assert.doesNotMatch(svc + wizard + ui, new RegExp(proibido));
  }
});

test("Tela 02: o botão existente abre o assistente; a faixa de estado real e o modal antigo coexistem", () => {
  assert.match(t02, /onClick=\{\(\) => setWizardCeoAberto\(true\)\}[\s\S]{0,200}from-orange-600/);
  assert.match(t02, /<span>Montar minha equipe com CEO de IA<\/span>/);
  assert.match(t02, /<CeoRealStatusCard/);
  assert.match(t02, /<CeoConfigWizard/);
  assert.match(t02, /<MontarEquipeModal/, "montagem completa preservada");
  assert.match(t02, /onAbrirMontagemCompleta/);
  assert.match(t02, /exemplos demonstrativos/);
});

test("montagem completa da equipe segue na interface, identificada como futura e sem simular ativação", () => {
  assert.match(montar, /Em breve · funcionalidade futura/);
  assert.match(montar, /nada é criado nem ativado/);
  assert.doesNotMatch(montar, /Ativar Operação da Equipe/);
});

test("assistente: 5 etapas, salvar e ativar pelo serviço, ativação bloqueada sem backend", () => {
  for (const e of [
    "Identidade",
    "Modelo de IA",
    "Ferramentas",
    "Autonomia e segurança",
    "Revisão e ativação",
  ]) {
    assert.match(wizard, new RegExp(`"${e}"`));
  }
  assert.match(wizard, /salvarConfigCeo\(/);
  assert.match(wizard, /definirEstadoCeo\(salvo\.id, "ativo"\)/);
  assert.match(wizard, /disabled=\{!servicoOk \|\| !formValido \|\| ocupado/);
  assert.match(wizard, /Salvar configuração/);
  assert.match(wizard, /Ativar CEO/);
  assert.doesNotMatch(wizard, /integrations\/supabase/, "assistente não fala direto com o banco");
});

test("Tela 03: painel real só para o CEO; selo de estado vem do backend; mocks identificados", () => {
  assert.match(t03, /papelReal && \(\s*<>\s*<CeoRealConfigPanel/);
  assert.match(t03, /<CeoEstadoPill estado=\{ceo\.estado\} \/>/);
  assert.match(t03, /useAgenteReal\(papelReal\)/);
  assert.match(ui, /demonstrativos e não vêm do backend/);
  assert.match(ui, /Em breve \(ainda não operacionais\)/);
  for (const futura of ["Treinamento e conhecimento", "Memória e RAG", "Voz"])
    assert.match(ui, new RegExp(futura));
});

test("Tela 10: banner de estado real, entrada bloqueada se a flag está ligada e o CEO não está ativo", () => {
  assert.match(t10, /<CeoCopilotoBanner/);
  assert.match(t10, /copilotoRealPronto\(CEO_IA_REAL_HABILITADO, ceoReal\.estado\)/);
  assert.match(t10, /disabled=\{bloqueadoPorEstado\}/);
  assert.match(t10, /ceoRespondendo \|\| bloqueadoPorEstado/);
  assert.doesNotMatch(
    t10,
    />\s*Online\s*<\/span>\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<p className="text-xs/,
    "CEO não é mais 'Online' fixo",
  );
});

test("CEO nunca aparece como 'Online' fixo nas Telas 03 e 10", () => {
  assert.doesNotMatch(t10, /animate-pulse" \/>\s*Online\s*<\/span>\s*\)?\}?\s*<\/div>/);
  assert.doesNotMatch(
    t10,
    /border-emerald-500\/30 bg-emerald-500\/10 px-2 py-0\.5 text-\[10px\] font-semibold text-emerald-400">\s*<span[^>]*\/>\s*Online/,
  );
  assert.match(t10, /<CeoEstadoPill estado=\{ceoReal\.estado\} \/>/);
  assert.match(t10, /Demonstração/);
  assert.match(t03, /papelReal \? \(\s*<CeoEstadoPill/);
});

test("nenhuma tela nova: 12 telas no submenu, nenhuma rota nova, navegação 02 → 03 → 10 intacta", () => {
  const ids =
    sidebar.match(/export type TelaAgentesId =([\s\S]*?);/)?.[1].match(/"[a-z_]+"/g) ?? [];
  assert.equal(ids.length, 12);
  const rotas = [
    ...readdirSync(new URL("../../../src/routes", import.meta.url)),
    ...readdirSync(new URL("../../../src/routes/_authenticated", import.meta.url)),
  ];
  assert.deepEqual(
    rotas.filter((r) => /ceo|agente|equipe|copiloto/i.test(r)),
    [],
    "nenhuma rota de agente/CEO",
  );
  assert.doesNotMatch(shell, /telaAtiva === "ceo_admin"|telaAtiva === "configuracao"/);
  assert.match(shell, /onVerPerfil=\{\(id\) => mudarTela\("perfil", id\)\}/);
  assert.match(shell, /<CopilotoCeoView/);
  assert.match(shell, /telaAtiva === "copiloto"/);
});

test("a flag do Copiloto real segue desligada por padrão e nada é habilitado em produção", () => {
  const flag = read("../../../src/services/agente-ceo.ts");
  assert.match(flag, /import\.meta\.env\.VITE_CEO_IA_REAL === "true"/);
  assert.doesNotMatch(read("../../../vercel.json"), /VITE_CEO_IA_REAL/);
  assert.doesNotMatch(
    read("../../config.toml"),
    /\[functions\.agent-ceo\][\s\S]{0,300}verify_jwt = false/,
  );
});
