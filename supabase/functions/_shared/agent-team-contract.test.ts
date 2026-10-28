// Suite: contrato da migration 202610270003 (equipe comercial) e paridade banco ↔ TypeScript.
// Invariante: hierarquia, papéis, ferramentas e tipos de tarefa têm UMA definição coerente nos dois lados;
// só humano cria/aprova agentes; as ferramentas são RPCs de runtime sem escrita comercial nem envio externo.
// Boundary IN: texto das migrations 001–003 e dos módulos TypeScript.
// Boundary OUT: comportamento em Postgres (prova pglite, 70 verificações, fora do repositório).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FERRAMENTAS_DO_PAPEL,
  MODEL_PRICES,
  PAPEIS_AGENTE,
  SUPERIOR_DO_PAPEL,
  TIPOS_DO_PAPEL,
} from "./agent-runtime.ts";
import { TOOL_REGISTRY, TIPOS_DELEGAVEIS, PAPEIS_SUBORDINADOS } from "./agent-tools.ts";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const sql003 = read("../../migrations/202610270003_agent_team.sql");
const sql004 = read("../../migrations/202610280001_ia_provedores_memoria_operacoes.sql");
const sql005 = read("../../migrations/202610280002_ceo_chat_conversas.sql");
const sql = sql003 + "\n" + sql004 + "\n" + sql005;
const base = read("../../migrations/202610270001_agent_foundation.sql");

const arrayDe = (texto: string): string[] => [...texto.matchAll(/'([^']+)'/g)].map((m) => m[1]);
// A definição EFETIVA é a última aplicada: a 004 (mais nova) sobrescreve a 003 quando redefine a função.
const funcao = (nome: string) => {
  const re = new RegExp(`create or replace function public\\.${nome}\\([\\s\\S]*?\\n\\$\\$;`);
  return sql005.match(re)?.[0] ?? sql004.match(re)?.[0] ?? sql003.match(re)?.[0] ?? "";
};

test("papéis: o CHECK do banco é exatamente a lista do TypeScript", () => {
  const check = sql.match(/agents_papel_check check \(\s*papel in \(([^)]*)\)/)?.[1] ?? "";
  assert.deepEqual(arrayDe(check).sort(), [...PAPEIS_AGENTE].sort());
});

test("ferramentas por papel: matriz do banco == matriz do TypeScript", () => {
  const corpo = funcao("agent_ferramentas_do_papel");
  for (const papel of PAPEIS_AGENTE) {
    const bloco = corpo.match(new RegExp(`when '${papel}' then array\\[([^\\]]*)\\]`))?.[1] ?? "";
    assert.deepEqual(arrayDe(bloco), [...FERRAMENTAS_DO_PAPEL[papel]], papel);
  }
});

test("tipos de tarefa por papel: matriz do banco == TypeScript, e o CHECK cobre todos", () => {
  const corpo = funcao("agent_tipos_do_papel");
  for (const papel of PAPEIS_AGENTE) {
    const bloco = corpo.match(new RegExp(`when '${papel}' then array\\[([^\\]]*)\\]`))?.[1] ?? "";
    assert.deepEqual(arrayDe(bloco), [...TIPOS_DO_PAPEL[papel]], papel);
  }
  const check = sql.match(/agent_tasks_tipo_check check \(tipo in \(([^)]*)\)/)?.[1] ?? "";
  const todos = [...new Set(Object.values(TIPOS_DO_PAPEL).flat())].sort();
  assert.deepEqual(arrayDe(check).sort(), todos);
  // delegável = tudo, menos a conversa do Copiloto
  assert.deepEqual(
    [...TIPOS_DELEGAVEIS].sort(),
    todos.filter((t) => t !== "copiloto_conversa"),
  );
});

test("hierarquia: SUPERIOR_DO_PAPEL bate com o gatilho; subordinados do TypeScript == papéis do banco", () => {
  assert.equal(SUPERIOR_DO_PAPEL.ceo, null);
  assert.equal(SUPERIOR_DO_PAPEL.gerente_comercial, "ceo");
  for (const p of PAPEIS_AGENTE.filter((x) => x !== "ceo" && x !== "gerente_comercial")) {
    assert.equal(SUPERIOR_DO_PAPEL[p], "gerente_comercial", p);
  }
  const gatilho = funcao("agent_hierarquia_guard");
  assert.match(gatilho, /gerente_comercial' and v_pai is distinct from 'ceo'/);
  assert.match(gatilho, /<> 'gerente_comercial' and v_pai is distinct from 'gerente_comercial'/);
  assert.match(gatilho, /hierarquia_imutavel/);
  assert.match(sql, /agents_hierarquia_check check \(\(papel = 'ceo'\) = \(reports_to is null\)\)/);
  const validos = sql.match(/v_papel not in \(([^)]*)\)/)?.[1] ?? "";
  assert.deepEqual(arrayDe(validos).sort(), [...PAPEIS_SUBORDINADOS].sort());
});

test("modelos permitidos no banco == tabela de preços do runtime (003 e 002)", () => {
  // base estática (Claude); a 004 soma os modelos ativos e precificados da Central de IA
  const lista = arrayDe(funcao("agent_modelos_permitidos"))
    .filter((m) => m.startsWith("claude-"))
    .sort();
  assert.deepEqual(lista, Object.keys(MODEL_PRICES).sort());
});

test("catálogo: toda ferramenta do registro existe no banco com o mesmo risco; nenhuma externa nem de gasto", () => {
  const seeds = new Map<string, string>();
  for (const m of (base + sql).matchAll(
    /\('([a-z_]+)',\s*(?:'[^']*'(?:\s*\|\|\s*'[^']*')*),\s*'(read|write_internal|external_send|spend)'\)/g,
  )) {
    seeds.set(m[1], m[2]);
  }
  for (const t of TOOL_REGISTRY) assert.equal(seeds.get(t.nome), t.risco, t.nome);
  assert.ok([...seeds.values()].every((r) => r === "read" || r === "write_internal"));
});

test("autonomia interna: só CEO e Gerente; concessão write_internal exige autonomia interna", () => {
  assert.match(
    sql,
    /agents_autonomia_papel_check check \(\s*autonomia = 'somente_leitura' or papel in \('ceo', 'gerente_comercial'\)\)/,
  );
  const conceder = funcao("agent_conceder_permissao");
  assert.match(conceder, /ferramenta_fora_do_papel/);
  assert.match(
    conceder,
    /v_risco = 'write_internal' then[\s\S]*autonomia <> 'interna_supervisionada'/,
  );
  assert.match(conceder, /elsif v_risco <> 'read'/);
  assert.match(funcao("agent_habilitar_delegacao"), /papel not in \('ceo', 'gerente_comercial'\)/);
});

test("só HUMANO cria/aprova agentes; o CEO apenas propõe", () => {
  for (const f of [
    "agent_criar_equipe",
    "agent_decidir_proposta_equipe",
    "agent_habilitar_delegacao",
    "agent_desabilitar_delegacao",
    "agent_conceder_permissao",
    "agent_definir_limites",
    "agent_definir_estado",
    "agent_configurar_ceo",
  ]) {
    assert.match(funcao(f), /agent_exigir_humano\(/, f);
  }
  const propor = funcao("agent_propor_equipe");
  assert.doesNotMatch(propor, /insert into public\.agents|agent_materializar_equipe/);
  assert.match(propor, /somente_ceo_propoe/);
  assert.match(propor, /proposta_pendente/);
  assert.match(funcao("agent_decidir_proposta_equipe"), /agent_materializar_equipe\(/);
  // o materializador nasce inativo e nunca é chamável por usuário nem runtime
  assert.doesNotMatch(funcao("agent_materializar_equipe"), /estado[^;]*'ativo'/);
  assert.match(
    sql,
    /revoke all on function[\s\S]*?agent_materializar_equipe\(uuid, jsonb, uuid\)[\s\S]*?from service_role;/,
  );
});

test("delegação: só subordinado direto, ativo, tipo do papel, com teto de fila e entrada limitada", () => {
  const d = funcao("agent_delegar_tarefa");
  for (const e of [
    "delegacao_nao_habilitada",
    "subordinado_inexistente",
    "subordinado_inativo",
    "tipo_nao_permitido",
    "entrada_grande",
    "fila_cheia",
    "permissao_ausente",
    "kill_switch",
  ]) {
    assert.match(d, new RegExp(e), e);
  }
  assert.match(d, /reports_to = p_de/);
  assert.match(d, /on conflict \(org_id, idempotency_key\) do nothing/);
  assert.match(funcao("agent_proximas_tarefas"), /t\.tipo <> 'copiloto_conversa'/);
});

test("ferramentas de leitura: derivam a org do agente, validam uso e não escrevem", () => {
  for (const f of [
    "agent_tool_resumo_comercial",
    "agent_tool_pipeline",
    "agent_tool_oportunidades",
    "agent_tool_lead",
    "agent_tool_execucoes_equipe",
  ]) {
    const corpo = funcao(f);
    assert.match(corpo, /agent_validar_uso\(p_agent, '(consultar_[a-z_]+)'\)/, f);
    assert.doesNotMatch(corpo, /\b(insert|update|delete|truncate)\b/i, f);
    // nunca o VALOR de telefone/e-mail/WhatsApp (só booleanos "is not null")
    assert.doesNotMatch(
      corpo,
      /\bl\.(phone|whatsapp|email)\b(?!\s+is\s+not\s+null)/,
      `${f} expõe dado de contato`,
    );
  }
  const uso = funcao("agent_validar_uso");
  for (const e of [
    "kill_switch",
    "agente_inativo",
    "ferramenta_fora_do_papel",
    "permissao_ausente",
  ])
    assert.match(uso, new RegExp(e));
});

test("003 não toca tabelas de negócio, não cria cron nem tool externa", () => {
  assert.doesNotMatch(
    sql,
    /\b(insert into|update|delete from|alter table|drop table)\s+public\.(leads|propostas|campanhas|lead_lists|lead_contatos|wa_[a-z_]+|sites_publicados|redes_buscas)\b/i,
  );
  assert.doesNotMatch(sql, /cron\./);
  assert.doesNotMatch(sql, /'external_send'\)|'spend'\)/);
});

test("grants: runtime só service_role; humano só authenticated; internas fechadas até para service_role", () => {
  assert.match(
    sql,
    /grant execute on function\s+public\.agent_propor_equipe[\s\S]*?agent_tool_execucoes_equipe\(uuid\)\s+to service_role;/,
  );
  assert.match(
    sql,
    /grant execute on function\s+public\.agent_conceder_permissao[\s\S]*?agent_decidir_proposta_equipe\(uuid, boolean, text\)\s+to authenticated;/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute[^;]*agent_(criar_equipe|decidir_proposta_equipe|habilitar_delegacao|configurar_ceo)[^;]*to service_role/,
  );
  assert.doesNotMatch(
    sql,
    /grant execute[^;]*agent_(materializar_equipe|validar_uso|tool_[a-z_]+|delegar_tarefa|propor_equipe)[^;]*to authenticated/,
  );
});
