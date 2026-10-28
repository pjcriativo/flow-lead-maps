// Suite: contexto da operação e ações do chat do CEO + contrato da migration 005 e da Edge.
// Invariante: o que vai ao modelo é dado limitado e sem segredo; só ações de escrita INTERNA viram cartões;
// conversas são do usuário dono, na própria organização; nada é gravado sem redação de segredos.
// Boundary IN: ceo-chat.ts e texto da migration/Edge. Boundary OUT: Postgres (prova pglite de 123 verificações).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { montarContextoOperacao, resumirAcaoDaFerramenta } from "./ceo-chat.ts";
import { executarFerramentaAgente } from "./agent-tool-exec.ts";

const ler = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const sql = ler("../../migrations/202610280002_ceo_chat_conversas.sql");
const edge = ler("../agent-ceo/index.ts");
const funcao = (n: string) =>
  sql.match(new RegExp(`create or replace function public\\.${n}\\([\\s\\S]*?\\n\\$\\$;`))?.[0] ??
  "";

test("contexto da operação: dados marcados como não-instrução, com id para delegar, sem segredo e limitado", () => {
  const c = montarContextoOperacao({
    id: "11111111-1111-4111-8111-111111111111",
    nome: "Clínicas CWB",
    nicho: "Saúde",
    subnicho: "Odontologia",
    produto: "Automação",
    regiao: "Curitiba",
    publico_alvo: "Donos " + "x".repeat(600) + " sk-proj-ABCDEFGHIJKLMNOP1234",
    status: "ativa",
    orcamento_usd_mes: 8,
    papeis: ["sdr"],
    papeis_pendentes: ["vendedor"],
  });
  assert.match(c, /não são instruções/);
  assert.match(c, /operacao_id 11111111-1111-4111-8111-111111111111/);
  assert.match(c, /agentes ainda inexistentes: vendedor/);
  assert.ok(!c.includes("ABCDEFGHIJKL"));
  assert.ok(c.length < 1500);
});

test("ações: proposta de operação, proposta de equipe e tarefa viram cartões; consulta e memória não", () => {
  const plano = {
    nome: "Op",
    nicho: "N",
    produto: "P",
    publico_alvo: "A",
    regiao: "R",
    papeis: ["sdr"],
    orcamento_usd_mes: 5,
    estrategia: { icp: "x" },
  };
  assert.deepEqual(
    resumirAcaoDaFerramenta("propor_operacao", {
      proposta_criada: true,
      aprovacao_id: "ap1",
      plano,
    }),
    {
      tipo: "proposta_operacao",
      aprovacao_id: "ap1",
      plano: { ...plano, estrategia: { icp: "x" } },
    },
  );
  assert.deepEqual(
    resumirAcaoDaFerramenta("propor_estrutura_equipe", {
      proposta_criada: true,
      aprovacao_id: "ap2",
      papeis: ["sdr", "vendedor"],
    }),
    {
      tipo: "proposta_equipe",
      aprovacao_id: "ap2",
      papeis: ["sdr", "vendedor"],
    },
  );
  assert.deepEqual(
    resumirAcaoDaFerramenta("delegar_tarefa", {
      delegada: true,
      tarefa_id: "t1",
      destinatario: "sdr",
      tipo: "preparar_abordagem",
    }),
    {
      tipo: "tarefa",
      tarefa_id: "t1",
      destinatario: "sdr",
      tarefa_tipo: "preparar_abordagem",
    },
  );
  for (const nome of ["consultar_operacoes", "registrar_memoria", "consultar_pipeline"])
    assert.equal(resumirAcaoDaFerramenta(nome, { qualquer: 1 }), null);
  assert.equal(resumirAcaoDaFerramenta("propor_operacao", { proposta_criada: false }), null);
  assert.equal(resumirAcaoDaFerramenta("delegar_tarefa", null), null);
});

test("propor_operacao devolve o plano completo (alimenta o cartão do chat) via RPC de proposta", async () => {
  const chamadas: string[] = [];
  const r = (await executarFerramentaAgente(
    "propor_operacao",
    {
      orgId: "o",
      agentId: "a",
      taskId: null,
      hoje: "2026-10-28",
      chamarRpc: async (n) => (chamadas.push(n), "ap9"),
    },
    {
      nome: "Operação teste",
      nicho: "Saúde",
      produto: "Automação",
      publico_alvo: "Clínicas",
      regiao: "Curitiba",
      papeis: "sdr",
      orcamento_usd_mes: 5,
      icp: "Clínicas",
    },
  )) as { plano: { papeis: string[] } };
  assert.deepEqual(chamadas, ["agent_propor_operacao"]);
  assert.deepEqual(r.plano.papeis, ["gerente_comercial", "sdr"]);
  assert.ok(resumirAcaoDaFerramenta("propor_operacao", r));
});

test("migration 005: conversas do DONO — RLS por usuário, sem bypass de super admin, sem escrita direta", () => {
  for (const t of ["agent_conversas", "agent_conversa_mensagens"]) {
    assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`));
  }
  assert.match(
    sql,
    /revoke all on public\.agent_conversas, public\.agent_conversa_mensagens from anon, authenticated/,
  );
  assert.match(
    sql,
    /grant select on public\.agent_conversas, public\.agent_conversa_mensagens to authenticated/,
  );
  assert.doesNotMatch(sql, /create policy[^;]*for (insert|update|delete|all)/i);
  assert.match(
    sql,
    /using \(user_id = auth\.uid\(\) and \(public\.agent_membro_gestor\(org_id\) or public\.eh_super_admin\(\)\)\)/,
  );
  assert.match(sql, /c\.user_id = auth\.uid\(\)/);
  assert.doesNotMatch(sql, /cron\.schedule|drop table|truncate/i);
});

test("migration 005: runtime só service_role; dono só arquiva/vincula a PRÓPRIA conversa; segredos redigidos", () => {
  assert.match(
    sql,
    /revoke all on function\s+public\.agent_conversa_abrir[\s\S]*?from public, anon, authenticated;/,
  );
  assert.match(
    sql,
    /grant execute on function\s+public\.agent_conversa_abrir[\s\S]*?to service_role;/,
  );
  assert.match(funcao("agent_conversa_arquivar"), /user_id = auth\.uid\(\)/);
  assert.match(funcao("agent_conversa_definir_operacao"), /user_id = auth\.uid\(\)/);
  assert.match(funcao("agent_conversa_definir_operacao"), /operacao_fora_da_organizacao/);
  assert.match(funcao("agent_conversa_abrir"), /agent_chat_usuario_ok\(p_org, p_user\)/);
  assert.match(funcao("agent_conversa_abrir"), /papel = 'ceo'/);
  const reg = funcao("agent_conversa_registrar");
  assert.equal(
    (reg.match(/agent_chat_redigir\(/g) ?? []).length >= 3,
    true,
    "pergunta, resposta e título passam pela redação",
  );
  assert.match(funcao("agent_conversa_historico"), /user_id = p_user/);
  // ferramenta nova é de leitura e só lê a organização do agente
  assert.match(sql, /\('consultar_operacoes', '[^']*', 'read'\)/);
  const tool = funcao("agent_tool_operacoes");
  assert.match(tool, /agent_validar_uso\(p_agent, 'consultar_operacoes'\)/);
  assert.doesNotMatch(tool, /\b(phone|email|whatsapp)\b/i, "sem dado de contato de leads");
  assert.doesNotMatch(tool, /insert|update|delete/i);
});

test("Edge agent-ceo: conversa só do usuário autenticado; tolera migration ausente; contexto de operação por org", () => {
  assert.match(edge, /agent_conversa_abrir/);
  assert.match(edge, /p_user: userId/);
  assert.match(edge, /agent_conversa_abrir\|agent_conversa_historico\|PGRST202\|does not exist/);
  assert.match(edge, /\.eq\("org_id", orgId\)/);
  assert.match(edge, /historicoDb \?\? \(Array\.isArray\(body\.historico\)/);
  assert.match(edge, /agent_conversa_registrar/);
  assert.match(edge, /persistido/);
  assert.doesNotMatch(edge, /\.(update|delete|upsert)\(/);
  // o contexto extra é montado no servidor; o cliente não consegue injetar prompt de sistema
  assert.doesNotMatch(edge, /body\.(contexto|system|prompt)/);
});
