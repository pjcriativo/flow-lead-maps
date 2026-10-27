// Suite: fiação da equipe real nas telas existentes de Agentes & Automações e no serviço.
// Invariante: nenhuma tela nova; cada tela conectada mostra dados do runtime; toda escrita é RPC de
// governança (sessão humana); processar a fila é manual e confirmado; nada simula sucesso.
// Boundary IN: texto dos componentes, do serviço e das migrations.
// Boundary OUT: renderização no navegador e execução real das RPCs (prova em Postgres e produção).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const comp = (n: string) => read(`../../../src/components/agentes/${n}`);
const svc = read("../../../src/services/agente-equipe-admin.ts");
const norm = (t: string) => t.replace(/\s+/g, " ");
const ui = norm(comp("EquipeRealUi.tsx"));
const migracoes = [
  "202610270001_agent_foundation",
  "202610270002_agent_ceo_config",
  "202610270003_agent_team",
]
  .map((n) => read(`../../migrations/${n}.sql`))
  .join("\n");

const TELAS: [string, string, string][] = [
  ["Tela 02 Equipe", "EquipeAgentesView.tsx", "EquipeRealPanel"],
  ["Tela 07 Fluxos", "FluxosAutomacoesView.tsx", "FilaRealPanel"],
  ["Tela 08 Planejamento", "PlanejamentoSemanalMetasView.tsx", "PlanosRealPanel"],
  ["Tela 11 Aprovações", "AprovacoesHistoricoView.tsx", "AprovacoesRealPanel"],
  ["Tela 12 Relatórios", "RelatoriosResultadosView.tsx", "RelatorioRealPanel"],
];

for (const [nome, arquivo, painel] of TELAS) {
  test(`${nome}: painel real ${painel} montado com o hook de dados do backend`, () => {
    const s = comp(arquivo);
    assert.match(s, new RegExp(`import \\{ ${painel} \\} from "./EquipeRealUi"`));
    assert.match(s, /const equipeReal = useEquipeReal\(\)/);
    assert.match(s, new RegExp(`<${painel} eq=\\{equipeReal\\}`));
  });
}

test("Tela 02: o botão do assistente do CEO segue; a equipe real lista perfis com ids real:<papel>", () => {
  const s = comp("EquipeAgentesView.tsx");
  assert.match(s, /<span>Montar minha equipe com CEO de IA<\/span>/);
  assert.match(
    s,
    /<EquipeRealPanel eq=\{equipeReal\} onVerPerfil=\{\(id\) => onVerPerfil\?\.\(id\)\} \/>/,
  );
  assert.match(s, /<MontarEquipeModal/, "montagem completa (futura) preservada");
  assert.match(ui, /onVerPerfil\(`real:\$\{a\.papel\}`\)/);
});

test("Tela 03: perfil real por papel, com permissões do papel e wizard só para o CEO", () => {
  const s = norm(comp("PerfilAgenteView.tsx"));
  assert.match(s, /agenteId\.startsWith\("real:"\)/);
  assert.match(s, /useAgenteReal\(papelReal\)/);
  assert.match(s, /<PermissoesDoPapel agente=\{ceo\} papel=\{papelReal\} \/>/);
  assert.match(
    s,
    /onConfigurar=\{papelReal === "ceo" \? \(\) => setWizardCeoAberto\(true\) : undefined\}/,
  );
  assert.match(s, /\{papelReal \? \( <CeoEstadoPill/);
});

test("nenhuma tela nova: 12 telas no submenu e nenhuma rota de equipe", () => {
  const ids =
    read("../../../src/components/agentes/AgentesSidebarNav.tsx")
      .match(/export type TelaAgentesId =([\s\S]*?);/)?.[1]
      .match(/"[a-z_]+"/g) ?? [];
  assert.equal(ids.length, 12);
  const rotas = [
    ...readdirSync(new URL("../../../src/routes", import.meta.url)),
    ...readdirSync(new URL("../../../src/routes/_authenticated", import.meta.url)),
  ];
  assert.deepEqual(
    rotas.filter((r) => /equipe|agente|ceo|worker/i.test(r)),
    [],
  );
});

test("serviço: escritas SÓ por RPC de governança (existentes nas migrations); leitura só das tabelas de agentes", () => {
  assert.doesNotMatch(svc, /\.(insert|update|upsert|delete)\(/);
  assert.doesNotMatch(svc, /service_role|SERVICE_ROLE/);
  const tabelas = [...new Set([...svc.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1]))].sort();
  assert.deepEqual(tabelas, [
    "agent_approvals",
    "agent_permissions",
    "agent_runs",
    "agent_tasks",
    "agents",
  ]);
  const rpcs = [...new Set([...svc.matchAll(/rpc(?:<[^>]*>)?\(\s*"([a-z_]+)"/g)].map((m) => m[1]))];
  assert.ok(rpcs.length >= 8);
  for (const r of rpcs)
    assert.match(migracoes, new RegExp(`function public\\.${r}\\(`), `${r} não existe`);
});

test("a interface nunca chama RPC do runtime (fila, passos, ferramentas, delegação ou materialização)", () => {
  for (const proibida of [
    "agent_enfileirar_tarefa",
    "agent_reservar_tarefa",
    "agent_registrar_passo",
    "agent_delegar_tarefa",
    "agent_propor_equipe",
    "agent_materializar_equipe",
    "agent_tool_",
    "agent_concluir_tarefa",
    "agent_iniciar_run",
  ]) {
    assert.doesNotMatch(svc + ui, new RegExp(proibida), proibida);
  }
});

test("processar a fila é MANUAL: confirmação, botão desabilitado sem fila e Edge dedicada", () => {
  assert.match(svc, /functions\.invoke\("agent-worker"/);
  assert.match(ui, /window\.confirm\(\s*"Processar a fila agora\?/);
  assert.match(ui, /disabled=\{ocupado \|\| naFila === 0\}/);
  assert.match(ui, /processarFila\(e!\.orgId, 2\)/);
  assert.doesNotMatch(ui + svc, /setInterval|setTimeout\(\s*\(\)\s*=>\s*void processar|cron/i);
});

test("criar equipe pede confirmação e gera agentes INATIVOS; ativar/pausar usam a RPC de estado", () => {
  assert.match(ui, /window\.confirm\( ?`Criar \$\{faltam\.length\} agente\(s\) INATIVOS/);
  assert.match(ui, /definirEstadoCeo\(a\.id, "ativo"\)/);
  assert.match(ui, /definirEstadoCeo\(a\.id, "pausado"\)/);
  assert.match(svc, /rpc<number>\("agent_criar_equipe"/);
  assert.match(svc, /rpc<number>\("agent_decidir_proposta_equipe"/);
});

test("honestidade de UI: erro do backend aparece e nenhum dado é exibido; áreas demonstrativas são identificadas", () => {
  assert.match(ui, /Nenhum dado é exibido enquanto o backend não responder/);
  assert.doesNotMatch(ui, /Online|Math\.random|MOCK|_DATA/);
  for (const frase of ["demonstrativos", "demonstrativa"])
    assert.match(ui + comp("EquipeAgentesView.tsx"), new RegExp(frase));
  assert.match(ui, /Rascunho — requer revisão humana/);
});

test("permissões individuais: humano concede/revoga ferramentas do papel; delegação tem botão próprio", () => {
  assert.match(ui, /concederFerramenta\(a\.id, f\)/);
  assert.match(ui, /revogarFerramenta\(a\.id, f\)/);
  assert.match(ui, /desabilitarDelegacao\(a\.id\) : habilitarDelegacao\(a\.id\)/);
  assert.match(ui, /Somente você \(administrador logado\) concede ou revoga/);
});

test("retrocompatibilidade: as leituras funcionam antes da migration 003 (fallback de colunas)", () => {
  const ceoSvc = read("../../../src/services/agente-ceo-admin.ts");
  for (const s of [ceoSvc, svc]) {
    assert.match(s, /42703/);
    assert.match(s, /column \.\* does not exist/);
  }
  assert.match(ceoSvc, /COLUNAS_AGENTE_LEGADAS = COLUNAS_AGENTE\.replace\(", reports_to", ""\)/);
  assert.match(svc, /COLUNAS_AGENTE_LEGADAS/);
  // a leitura legada de tarefas não pede a coluna que só existe na 003
  assert.match(
    svc,
    /"id, agent_id, tipo, status, criado_em, concluido_em, ultimo_erro, resultado"/,
  );
});
