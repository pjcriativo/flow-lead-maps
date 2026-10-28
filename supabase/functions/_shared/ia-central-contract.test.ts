// Suite: contrato de segurança da Central de IA, da memória e das operações (migration 202610280001).
// Invariante: segredo só no cofre; Central só para SUPER_ADMIN; memória/operações isoladas por organização;
// só humano aprova; runtime só executa RPC fixa; tudo novo nasce DESLIGADO e retrocompatível.
// Boundary IN: texto da migration, das Edges e do frontend. Boundary OUT: comportamento em Postgres
// (prova pglite de 85 verificações) e a OpenAI real (sem teste pago).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MSG_CONFIGURAR_PROVEDOR as MSG_BACKEND } from "./ai-provider.ts";
import { MSG_CONFIGURAR_PROVEDOR as MSG_UI } from "../../../src/lib/ia-config.ts";

const raiz = fileURLToPath(new URL("../../../", import.meta.url));
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const sql = ler("supabase/migrations/202610280001_ia_provedores_memoria_operacoes.sql");
const admin = ler("supabase/functions/admin-acoes/index.ts");
const kit = ler("supabase/functions/_shared/agent-edge-kit.ts");
const ceo = ler("supabase/functions/agent-ceo/index.ts");
const worker = ler("supabase/functions/agent-worker/index.ts");

const funcao = (nome: string) =>
  sql.match(
    new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`),
  )?.[0] ?? "";
const arquivos = (dir: string): string[] =>
  readdirSync(join(raiz, dir)).flatMap((n) => {
    const rel = `${dir}/${n}`;
    return statSync(join(raiz, rel)).isDirectory() ? arquivos(rel) : [rel];
  });

const IA_TABELAS = ["ia_config", "ia_provedores", "ia_modelos", "ia_eventos"];
const NOVAS = [
  ...IA_TABELAS,
  "agent_orcamento_org",
  "agent_memoria",
  "agent_operacoes",
  "agent_operacao_agentes",
];

test("toda tabela nova tem RLS ligado e nenhum privilégio para anon/authenticated além de leitura via policy", () => {
  for (const t of NOVAS) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${t} enable row level security`),
      `RLS ${t}`,
    );
  }
  assert.match(
    sql,
    /revoke all on public\.ia_config, public\.ia_provedores, public\.ia_modelos, public\.ia_eventos from anon, authenticated/,
  );
  assert.match(sql, /revoke all on public\.agent_orcamento_org from anon, authenticated/);
  assert.match(sql, /revoke all on public\.agent_memoria from anon, authenticated/);
  assert.match(
    sql,
    /revoke all on public\.agent_operacoes, public\.agent_operacao_agentes from anon, authenticated/,
  );
  // a Central de IA não tem NENHUMA policy: só service_role (Edge admin-acoes) lê e escreve
  for (const t of [...IA_TABELAS, "agent_orcamento_org"]) {
    assert.doesNotMatch(
      sql,
      new RegExp(`create policy \\w+ on public\\.${t}\\b`),
      `${t} sem policy`,
    );
  }
  // somente leitura para usuários nas tabelas de negócio do agente, e nunca escrita
  assert.doesNotMatch(sql, /create policy[^;]*for (insert|update|delete|all)/i);
});

test("memória e operações: leitura só por gestor DA organização (o super admin da plataforma não entra por RLS)", () => {
  const membro = funcao("agent_membro_gestor");
  assert.match(membro, /m\.user_id = auth\.uid\(\)/);
  assert.match(membro, /m\.papel::text in \('super_admin', 'admin', 'gerente'\)/);
  assert.doesNotMatch(membro, /eh_super_admin/);
  for (const t of ["agent_memoria", "agent_operacoes", "agent_operacao_agentes"]) {
    assert.match(
      sql,
      new RegExp(
        `create policy \\w+ on public\\.${t} for select to authenticated using \\(public\\.agent_membro_gestor\\(org_id\\)\\)`,
      ),
    );
  }
  // a visão do Super Admin é agregada: sem colunas de conteúdo
  const visao = funcao("ia_visao_orgs") + funcao("ia_consumo_resumo");
  assert.doesNotMatch(visao, /\bconteudo\b|\bresultado\b|\bentrada\b|agent_memoria/); // tokens_entrada é só contagem
});

test("só HUMANO decide: toda RPC de governança nova exige sessão humana; o CEO só propõe", () => {
  for (const f of [
    "agent_memoria_registrar_humano",
    "agent_memoria_arquivar",
    "agent_decidir_proposta_operacao",
    "agent_operacao_definir_estado",
    "agent_operacao_autorizar_agente",
    "agent_operacoes_desempenho",
  ]) {
    assert.match(funcao(f), /agent_exigir_humano\(/, f);
  }
  const propor = funcao("agent_propor_operacao");
  assert.match(propor, /v_de\.papel <> 'ceo'/);
  assert.match(propor, /tool_nome = 'propor_operacao' and ativo/);
  assert.match(propor, /insert into public\.agent_approvals/);
  assert.doesNotMatch(propor, /insert into public\.(agent_operacoes|agents|agent_permissions)/);
  // aprovar operação cria a operação e NUNCA agentes/permissões
  const decidir = funcao("agent_decidir_proposta_operacao");
  assert.match(decidir, /insert into public\.agent_operacoes/);
  assert.doesNotMatch(decidir, /insert into public\.(agents|agent_permissions)/);
  // a decisão genérica não "aprova" proposta de equipe/operação sem materializá-la
  assert.match(funcao("agent_decidir_aprovacao"), /aprovacao_exige_rpc_propria/);
});

test("agente: memória só categorias não reservadas; operação vinculada exige operação ativa e agente autorizado", () => {
  const reg = funcao("agent_registrar_memoria");
  assert.match(reg, /agent_validar_uso\(p_agent, 'registrar_memoria'\)/);
  assert.match(reg, /autonomia <> 'interna_supervisionada'/);
  assert.match(reg, /categoria_reservada_a_humanos/);
  assert.match(funcao("agent_tool_memoria"), /agent_validar_uso\(p_agent, 'consultar_memoria'\)/);
  const op = funcao("agent_delegar_tarefa_op");
  assert.match(op, /operacao_fora_da_organizacao/);
  assert.match(op, /v_op\.status <> 'ativa'/);
  assert.match(op, /agente_nao_autorizado_na_operacao/);
});

test("permissões de execução: runtime só para service_role; internos nem para service_role", () => {
  const blocoService =
    sql.match(
      /revoke all on function\s+public\.agent_orcamento_org_estado[\s\S]*?to service_role;/,
    )?.[0] ?? "";
  for (const f of [
    "agent_tool_memoria",
    "agent_registrar_memoria",
    "agent_propor_operacao",
    "agent_delegar_tarefa_op",
    "ia_visao_orgs",
    "ia_consumo_resumo",
    "agent_orcamento_org_estado",
  ]) {
    assert.match(blocoService, new RegExp(`public\\.${f}\\(`), f);
  }
  assert.doesNotMatch(blocoService, /to authenticated/);
  const internos =
    sql.match(
      /revoke all on function\s+public\.ia_modelo_do_papel[\s\S]*?from public, anon, authenticated, service_role;/,
    )?.[0] ?? "";
  for (const f of [
    "ia_modelo_do_papel",
    "agent_memoria_texto_ok",
    "agent_memoria_inserir",
    "agent_validar_def_operacao",
  ]) {
    assert.match(internos, new RegExp(`public\\.${f}\\(`), f);
  }
  assert.doesNotMatch(sql, /cron\.schedule/, "nenhum cron");
  assert.doesNotMatch(sql, /\b(drop table|truncate)\b/i);
  assert.doesNotMatch(
    sql,
    /alter table public\.(leads|propostas|campanhas|contratos|financeiro|wa_)/i,
  );
});

test("catálogo de ferramentas novas: nenhuma externa nem de gasto; 1 leitura + 2 coordenação interna", () => {
  const tools = [
    ...sql.matchAll(
      /\('(consultar_memoria|registrar_memoria|propor_operacao)',\s*'[^']*',\s*'(read|write_internal|external_send|spend)'\)/g,
    ),
  ];
  assert.deepEqual(
    tools.map((m) => [m[1], m[2]]),
    [
      ["consultar_memoria", "read"],
      ["registrar_memoria", "write_internal"],
      ["propor_operacao", "write_internal"],
    ],
  );
});

test("Edge admin-acoes: guarda de super admin vale ANTES de qualquer ação ia_*; chave validada antes de gravar", () => {
  const guarda = admin.indexOf(
    'perfil?.is_super_admin !== true) return json({ error: "Acesso negado" }, 403)',
  );
  const bloco = admin.indexOf('acao.startsWith("ia_")');
  assert.ok(guarda > 0 && bloco > guarda, "guarda vem antes da Central de IA");
  const conectar = admin.slice(
    admin.indexOf('acao === "ia_openai_conectar"'),
    admin.indexOf('acao === "ia_openai_testar"'),
  );
  assert.ok(
    conectar.indexOf("validarFormatoChaveOpenAI") < conectar.indexOf("listarModelosOpenAI"),
  );
  assert.ok(
    conectar.indexOf("listarModelosOpenAI") < conectar.indexOf("cifrar("),
    "só grava depois de a OpenAI validar",
  );
  assert.match(conectar, /config_chaves/);
  assert.match(conectar, /config_chaves_auditoria/);
});

test("Edge admin-acoes: a chave NUNCA volta ao navegador (nem cifrada), nem entra em log de evento", () => {
  const ia = admin.slice(
    admin.indexOf('acao.startsWith("ia_")'),
    admin.indexOf('return json({ ok: false, reason: "acao_desconhecida" })'),
  );
  // o valor cifrado só é ESCRITO (upsert) — nunca selecionado nem devolvido
  assert.doesNotMatch(ia, /select\([^)]*valor_cifrado/);
  assert.doesNotMatch(ia, /json\([^;]*valor_cifrado/);
  // statusChave consulta só ultimos4/atualizado_em
  assert.match(ia, /\.select\("ultimos4, atualizado_em"\)/);
  // o único campo "chave" devolvido é o ESTADO mascarado (configurada/origem/mascarada/atualizada_em)
  const campos = [...ia.matchAll(/\bchave:\s*([^,\n]+)/g)].map((m) => m[1].trim());
  assert.deepEqual(campos, ['p.provider === "openai" ? kO : kA']);
  const estado = ia.match(/const statusChave = async[\s\S]*?\n {6}\};/)?.[0] ?? "";
  assert.deepEqual(
    [...estado.matchAll(/^ {10}(\w+):/gm)].map((m) => m[1]),
    ["configurada", "origem", "mascarada", "atualizada_em"],
  );
  assert.doesNotMatch(ia, /\bvalor:/, "nenhuma resposta devolve valor de chave");
  // eventos passam por redigirSegredos
  assert.match(ia, /detalhe: redigirSegredos\(detalhe\)/);
  assert.match(ia, /listarModelosOpenAI\(chave\)/);
  // nenhuma ação desta seção chama endpoint pago
  assert.doesNotMatch(ia, /\/responses|chamarOpenAI|chat\/completions/);
});

test("Edges de agentes: roteiam por provedor via Central, mantêm o modo legado sem ela e preservam a Anthropic", () => {
  for (const e of [ceo, worker]) {
    assert.match(e, /carregarContextoIa\(admin\)/);
    assert.match(e, /criarChamadorModelo\(admin, ia,/);
    assert.match(e, /tabelaPrecos: ia\.tabela/);
    assert.match(e, /consumoOrg: criarConsumoOrg\(rpc\)/);
    assert.doesNotMatch(e, /OPENAI_API_KEY/, "a chave é resolvida só no kit, via cofre");
    assert.doesNotMatch(e, /\.(update|delete|upsert)\(/);
  }
  assert.match(kit, /export async function chamarAnthropic/, "integração Anthropic preservada");
  assert.match(kit, /if \(mod\.error \|\| prov\.error \|\| cfg\.error\)[\s\S]*?central: false/);
  assert.match(kit, /agent_orcamento_org_estado\|PGRST202\|does not exist/);
  assert.match(kit, /resolverChave\(admin, CHAVE_DO_PROVEDOR\[p\]\)/);
  assert.match(ceo, /MSG_CONFIGURAR_PROVEDOR/);
  // alerta: bloqueio por teto (agente ou organização) vira evento "limite_atingido" na Central
  for (const e of [ceo, worker]) {
    assert.match(e, /ehMotivoDeTeto\(/);
    assert.match(e, /tipo: "limite_atingido"/);
  }
  assert.match(kit, /\["teto_dia", "teto_mes", "teto_org_dia", "teto_org_mes"\]/);
});

test("frontend: nenhuma chave no código, nada de localStorage para IA, chave limpa após o envio", () => {
  const frontIa = [
    "src/components/admin/AdminIaProvedores.tsx",
    "src/services/ia-admin.ts",
    "src/services/ia-catalogo.ts",
    "src/lib/ia-config.ts",
    "src/lib/modelos-ia.ts",
    "src/components/agentes/useCatalogoIa.ts",
    "src/components/agentes/OperacoesRealUi.tsx",
    "src/services/agente-operacoes.ts",
  ];
  for (const f of frontIa) {
    const src = ler(f);
    assert.doesNotMatch(src, /\bsk-[A-Za-z0-9_-]{16,}/, `${f}: chave literal`);
    assert.doesNotMatch(
      src,
      /\b(localStorage|sessionStorage|indexedDB)\s*[.[]/,
      `${f}: armazenamento local`,
    );
    assert.doesNotMatch(
      src,
      /process\.env|import\.meta\.env\.[A-Z_]*(KEY|SECRET|TOKEN)/,
      `${f}: segredo em env`,
    );
  }
  const ui = ler("src/components/admin/AdminIaProvedores.tsx");
  assert.match(ui, /if \(limpar\) setChave\(""\)/);
  assert.match(ui, /type="password"/);
  assert.match(ui, /autoComplete="off"/);
  // nenhum arquivo do frontend referencia a chave por nome como valor
  for (const f of arquivos("src").filter((x) => /\.(ts|tsx)$/.test(x))) {
    assert.doesNotMatch(ler(f), /Deno\.env\.get\("OPENAI_API_KEY"\)/, f);
  }
});

test("tudo novo nasce DESLIGADO: flags exigem === 'true' e a navegação da Central só existe com a flag", () => {
  assert.match(ler("src/services/ia-catalogo.ts"), /VITE_IA_CENTRAL === "true"/);
  assert.match(ler("src/services/agente-operacoes.ts"), /VITE_CEO_MESTRE === "true"/);
  const painel = ler("src/components/admin/AdminPanel.tsx");
  assert.match(painel, /\.\.\.\(IA_CENTRAL_HABILITADA\s*\?/);
  assert.match(painel, /tela === "ia-provedores" && IA_CENTRAL_HABILITADA/);
  // a rota /admin só entra para profiles.is_super_admin (guarda existente) — e a Central vive dentro dela
  assert.match(ler("src/routes/_authenticated/admin.tsx"), /perfil\?\.is_super_admin !== true/);
});

test("retrocompatibilidade do frontend: recurso ausente no banco não quebra a tela nem mostra dado inventado", () => {
  const ops = ler("src/services/agente-operacoes.ts");
  assert.match(ops, /recursoAusente\(error\)\) return \{ disponivel: false \}/);
  assert.match(
    ler("src/services/ia-catalogo.ts"),
    /catch \{[\s\S]*?definirModelosExtras\(\[\]\)[\s\S]*?return CATALOGO_INDISPONIVEL/,
  );
  const painel = ler("src/components/agentes/OperacoesRealUi.tsx");
  assert.match(painel, /if \(!erro && dados && !dados\.disponivel\) return null/);
});

test("mensagem única: sem provedor configurado a Tela 02 mostra exatamente o aviso pedido", () => {
  assert.equal(MSG_BACKEND, "Configure um provedor de IA no Super Admin para ativar o CEO.");
  assert.equal(MSG_UI, MSG_BACKEND);
  assert.match(ler("src/components/agentes/CeoConfigWizard.tsx"), /\{MSG_CONFIGURAR_PROVEDOR\}/);
});

test("aprovação de operação é roteada para a RPC própria (nunca para a decisão genérica)", () => {
  const painel = ler("src/components/agentes/EquipeRealUi.tsx");
  const trecho = painel.replace(/\s+/g, " ");
  assert.match(
    trecho,
    /ehPropostaDeOperacao\(a\) \? decidirPropostaOperacao\(a\.id, aprovar\) : decidirAprovacao/,
  );
  assert.match(ler("src/services/agente-operacoes.ts"), /rpc\("agent_decidir_proposta_operacao"/);
});
