// Suite: execução de tarefas delegadas da equipe comercial (sem rede, sem banco, sem IA paga).
// Invariante: o agente só executa tipo de tarefa do seu papel, só usa ferramenta concedida por humano,
// respeita kill-switch/custo/passos e deixa o entregável como RASCUNHO com rastro completo.
// Boundary IN: executarTarefaAgente + execução/processamento de ferramentas com dublês.
// Boundary OUT: RPCs/RLS no Postgres (agent-team-contract.test.ts e prova SQL) e o provedor Claude.
import test from "node:test";
import assert from "node:assert/strict";
import {
  executarTarefaAgente,
  type RunnerDeps,
  type TarefaReservada,
} from "./agent-task-runner.ts";
import { ModeloErro, type RespostaModelo } from "./agent-ceo-turn.ts";
import {
  FERRAMENTAS_DO_PAPEL,
  PAPEIS_AGENTE,
  type AgentIdentity,
  type AgentPapel,
  type AgentPermission,
  type StepRecord,
  type ToolSpec,
} from "./agent-runtime.ts";
import { TOOL_REGISTRY } from "./agent-tools.ts";
import { executarFerramentaAgente, parsePapeis } from "./agent-tool-exec.ts";

const ORG_A = "00000000-0000-4000-8000-00000000000a";
const ORG_B = "00000000-0000-4000-8000-00000000000b";
const LEAD = "11111111-1111-4111-8111-111111111111";

const catalogo: ToolSpec[] = TOOL_REGISTRY.map((t) => ({
  nome: t.nome,
  risco: t.risco,
  ativo: true,
}));

function agente(papel: AgentPapel, org = ORG_A, over: Partial<AgentIdentity> = {}): AgentIdentity {
  const interna = papel === "ceo" || papel === "gerente_comercial";
  return {
    id: `ag-${papel}-${org.slice(-1)}`,
    orgId: org,
    papel,
    modelo: "claude-haiku-4-5",
    autonomia: interna ? "interna_supervisionada" : "somente_leitura",
    estado: "ativo",
    killSwitch: false,
    tetoUsdDia: 0.5,
    tetoUsdMes: 5,
    maxPassos: 4,
    maxTokensSaida: 800,
    ...over,
  };
}
const permissoes = (a: AgentIdentity): AgentPermission[] =>
  FERRAMENTAS_DO_PAPEL[a.papel]
    .filter(
      (t) =>
        TOOL_REGISTRY.find((d) => d.nome === t)!.risco === "read" ||
        a.autonomia === "interna_supervisionada",
    )
    .map((toolNome) => ({ agentId: a.id, orgId: a.orgId, toolNome, ativo: true }));

type World = {
  agentes: Record<string, AgentIdentity>;
  perms: Record<string, AgentPermission[]>;
  tarefa: TarefaReservada | null;
  steps: StepRecord[];
  runs: { status: string; erro: string | null }[];
  conclusao: {
    status: string;
    resultado?: unknown;
    erro?: string | null;
    reenfileirarEm?: Date;
  } | null;
  gasto: number;
  chamadasModelo: number;
  usoIa: number;
  ferramentas: { nome: string; orgId: string; agentId: string; params: Record<string, unknown> }[];
  roteiro: (() => RespostaModelo | Error)[];
  aoChamarModelo?: () => void;
};

function mundo(
  papel: AgentPapel,
  tipo: string,
  entrada: Record<string, unknown> = {},
  over: Partial<World> = {},
): World {
  const ags = Object.fromEntries(
    PAPEIS_AGENTE.map((p) => [`ag-${p}-${ORG_A.slice(-1)}`, agente(p)]),
  );
  const alvo = ags[`ag-${papel}-${ORG_A.slice(-1)}`];
  return {
    agentes: ags,
    perms: Object.fromEntries(Object.values(ags).map((a) => [a.id, permissoes(a)])),
    tarefa: {
      id: "t1",
      orgId: ORG_A,
      agentId: alvo.id,
      tipo,
      entrada,
      attemptCount: 1,
      maxAttempts: 2,
    },
    steps: [],
    runs: [],
    conclusao: null,
    gasto: 0,
    chamadasModelo: 0,
    usoIa: 0,
    ferramentas: [],
    roteiro: [],
    ...over,
  };
}

function deps(w: World): RunnerDeps {
  return {
    reservar: async () => w.tarefa,
    carregarAgente: async (id) => {
      const agent = w.agentes[id];
      return agent ? { agent, catalog: catalogo, permissions: w.perms[id] ?? [] } : null;
    },
    consumo: async () => ({ usdDia: w.gasto, usdMes: w.gasto }),
    iniciarRun: async () => (
      w.runs.push({ status: "running", erro: null }),
      `run-${w.runs.length}`
    ),
    registrarPasso: async (_r, s) => {
      w.steps.push(s);
      w.gasto += s.custoUsd;
    },
    finalizarRun: async (_r, status, erro) => {
      w.runs[w.runs.length - 1] = { status, erro };
    },
    concluirTarefa: async (i) => {
      w.conclusao = {
        status: i.status,
        resultado: i.resultado,
        erro: i.erro,
        reenfileirarEm: i.reenfileirarEm,
      };
    },
    executarFerramenta: async (nome, ctx) => {
      w.ferramentas.push({ nome, orgId: ctx.orgId, agentId: ctx.agentId, params: ctx.params });
      if (nome === "consultar_lead")
        return { org_id: ctx.orgId, lead_id: LEAD, negocio: "Clinica Alfa", tem_email: true };
      if (nome === "delegar_tarefa") return { id: "tarefa-filha", status: "queued" };
      return { org_id: ctx.orgId, itens: [] };
    },
    chamarModelo: async () => {
      w.aoChamarModelo?.();
      w.chamadasModelo += 1;
      const prox = w.roteiro.shift();
      if (!prox) throw new Error("roteiro esgotado");
      const r = prox();
      if (r instanceof Error) throw r;
      return r;
    },
    registrarUsoIa: async () => void (w.usoIa += 1),
    agora: () => new Date("2026-10-27T12:00:00Z"),
  };
}
const usa = (nome: string, input: unknown = {}, id = "tu1"): RespostaModelo => ({
  texto: "",
  toolUses: [{ id, name: nome, input }],
  tokensEntrada: 1200,
  tokensSaida: 60,
});
const texto = (t: string): RespostaModelo => ({
  texto: t,
  toolUses: [],
  tokensEntrada: 1500,
  tokensSaida: 200,
});
const entrada = { taskId: "t1", userId: "user-a", workerId: "w1" };

test("SDR prepara abordagem: consulta o lead, entrega RASCUNHO e registra tudo", async () => {
  const w = mundo(
    "sdr",
    "preparar_abordagem",
    { lead_id: LEAD },
    {
      roteiro: [
        () => usa("consultar_lead", { lead_id: LEAD }),
        () => texto("RASCUNHO — REQUER REVISÃO HUMANA: Olá…"),
      ],
    },
  );
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(r.ok, true);
  assert.deepEqual(
    w.ferramentas.map((f) => [f.nome, f.orgId, f.agentId]),
    [["consultar_lead", ORG_A, "ag-sdr-a"]],
  );
  assert.deepEqual(
    w.steps.map((s) => s.tipo),
    ["model", "tool_call", "tool_result", "model", "final"],
  );
  assert.equal(w.conclusao!.status, "succeeded");
  const res = w.conclusao!.resultado as {
    rascunho: boolean;
    papel: string;
    ferramentas: string[];
    custo_usd: number;
  };
  assert.equal(res.rascunho, true);
  assert.equal(res.papel, "sdr");
  assert.deepEqual(res.ferramentas, ["consultar_lead"]);
  assert.ok(res.custo_usd > 0 && res.custo_usd < 0.01);
  assert.equal(w.usoIa, 2);
  assert.equal(w.runs[0].status, "succeeded");
});

test("cada papel só executa os tipos de tarefa do seu papel", async () => {
  const w = mundo("sdr", "plano_seo");
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(!r.ok && r.reason, "tipo_nao_permitido");
  assert.equal(w.chamadasModelo, 0);
  assert.equal(w.conclusao!.status, "failed");
  const c = mundo("seo_geral", "copiloto_conversa");
  assert.equal((await executarTarefaAgente(deps(c), entrada)).ok, false);
  assert.equal(c.chamadasModelo, 0);
});

test("tarefa não reservada (lease/estado) não executa nada", async () => {
  const w = mundo("sdr", "preparar_abordagem", {}, { tarefa: null });
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(!r.ok && r.reason, "indisponivel");
  assert.equal(w.runs.length, 0);
  assert.equal(w.chamadasModelo, 0);
});

test("agente pausado ou inativo: bloqueado antes de chamar o modelo", async () => {
  for (const estado of ["pausado", "inativo"] as const) {
    const w = mundo("sdr", "preparar_abordagem");
    w.agentes["ag-sdr-a"] = agente("sdr", ORG_A, { estado });
    const r = await executarTarefaAgente(deps(w), entrada);
    assert.equal(r.ok, false);
    assert.equal(w.chamadasModelo, 0);
    assert.equal(w.conclusao!.status, "failed");
  }
});

test("agente de OUTRA organização não executa tarefa da A (isolamento)", async () => {
  const w = mundo("sdr", "preparar_abordagem");
  w.agentes["ag-sdr-a"] = agente("sdr", ORG_B);
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(!r.ok && r.reason, "organizacao_divergente");
  assert.equal(w.chamadasModelo, 0);
});

test("kill-switch acionado no meio da execução interrompe no passo seguinte e cancela", async () => {
  const w = mundo(
    "gerente_comercial",
    "supervisao_comercial",
    {},
    {
      roteiro: [() => usa("consultar_pipeline"), () => texto("não deveria chegar")],
    },
  );
  w.aoChamarModelo = () => {
    if (w.chamadasModelo === 0)
      w.agentes["ag-gerente_comercial-a"] = agente("gerente_comercial", ORG_A, {
        killSwitch: true,
      });
  };
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(!r.ok && r.reason, "kill_switch");
  assert.equal(w.chamadasModelo, 1);
  assert.equal(w.conclusao!.status, "cancelled");
  assert.equal(w.runs[0].status, "cancelled");
});

test("teto diário do agente: bloqueia antes de chamar o modelo", async () => {
  const w = mundo("vendedor", "preparar_proposta", {}, { gasto: 0.499 });
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(!r.ok && r.reason, "teto_dia");
  assert.equal(w.chamadasModelo, 0);
  assert.equal(w.conclusao!.status, "failed");
});

test("limite de passos corta laço de ferramentas", async () => {
  const w = mundo(
    "estrategista",
    "plano_estrategia",
    {},
    {
      roteiro: [
        () => usa("consultar_pipeline"),
        () => usa("consultar_pipeline"),
        () => usa("consultar_pipeline"),
      ],
    },
  );
  w.agentes["ag-estrategista-a"] = agente("estrategista", ORG_A, { maxPassos: 2 });
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(!r.ok && r.reason, "limite_de_passos");
  assert.equal(w.chamadasModelo, 2);
});

test("ferramenta fora do papel ou sem permissão humana é negada e nenhum dado é lido", async () => {
  const fora = mundo(
    "sdr",
    "preparar_abordagem",
    {},
    { roteiro: [() => usa("consultar_pipeline"), () => texto("sem dados")] },
  );
  assert.equal((await executarTarefaAgente(deps(fora), entrada)).ok, true);
  assert.equal(fora.ferramentas.length, 0);
  assert.equal(fora.steps.find((s) => s.tipo === "blocked")!.erro, "ferramenta_fora_do_papel");

  const semPerm = mundo(
    "sdr",
    "preparar_abordagem",
    {},
    { roteiro: [() => usa("consultar_lead", { lead_id: LEAD }), () => texto("ok")] },
  );
  semPerm.perms["ag-sdr-a"] = [];
  await executarTarefaAgente(deps(semPerm), entrada);
  assert.equal(semPerm.ferramentas.length, 0);
  assert.equal(semPerm.steps.find((s) => s.tipo === "blocked")!.erro, "permissao_ausente");
});

test("SDR não consegue delegar nem propor equipe (autonomia somente leitura)", async () => {
  const w = mundo(
    "sdr",
    "preparar_abordagem",
    {},
    {
      roteiro: [
        () =>
          usa(
            "delegar_tarefa",
            { papel: "vendedor", tipo: "preparar_proposta", instrucoes: "x" },
            "a",
          ),
        () => usa("propor_estrutura_equipe", { papeis: "sdr" }, "b"),
        () => texto("fim"),
      ],
    },
  );
  await executarTarefaAgente(deps(w), entrada);
  assert.equal(w.ferramentas.length, 0);
  assert.deepEqual(
    w.steps.filter((s) => s.tipo === "blocked").map((s) => s.erro),
    ["ferramenta_acima_da_autonomia", "ferramenta_acima_da_autonomia"],
  );
});

test("Gerente delega a especialista; o limite por execução é 5 delegações", async () => {
  const sete = Array.from({ length: 7 }, (_, i) => ({
    id: `d${i}`,
    name: "delegar_tarefa",
    input: { papel: "sdr", tipo: "preparar_abordagem", instrucoes: `lead ${i}`, lead_id: LEAD },
  }));
  const w = mundo(
    "gerente_comercial",
    "supervisao_comercial",
    {},
    {
      roteiro: [
        () => ({ texto: "", toolUses: sete, tokensEntrada: 800, tokensSaida: 100 }),
        () => texto("Deleguei."),
      ],
    },
  );
  const r = await executarTarefaAgente(deps(w), entrada);
  assert.equal(r.ok, true);
  assert.equal(w.ferramentas.filter((f) => f.nome === "delegar_tarefa").length, 5);
  assert.equal(w.steps.filter((s) => s.erro === "limite_de_delegacoes").length, 2);
});

test("payload de ferramenta de outra organização é descartado", async () => {
  const w = mundo(
    "vendedor",
    "preparar_proposta",
    { lead_id: LEAD },
    {
      roteiro: [() => usa("consultar_lead", { lead_id: LEAD }), () => texto("sem dados")],
    },
  );
  const d = deps(w);
  d.executarFerramenta = async () => ({ org_id: ORG_B, negocio: "Vazou" });
  await executarTarefaAgente(d, entrada);
  const saida = w.steps.find((s) => s.tipo === "tool_result")!.saida as {
    disponivel: boolean;
    motivo: string;
  };
  assert.deepEqual(saida, { disponivel: false, motivo: "organizacao_divergente" });
});

test("falha transitória (429) reenfileira; permanente (401) e timeout falham sem repetir", async () => {
  const t = mundo("seo_geral", "plano_seo", {}, { roteiro: [() => new ModeloErro("limite", 429)] });
  assert.equal((await executarTarefaAgente(deps(t), entrada)).ok, false);
  assert.equal(t.conclusao!.status, "queued");
  assert.ok(t.conclusao!.reenfileirarEm instanceof Date);
  const p = mundo("seo_geral", "plano_seo", {}, { roteiro: [() => new ModeloErro("chave", 401)] });
  await executarTarefaAgente(deps(p), entrada);
  assert.equal(p.conclusao!.status, "failed");
  const x = mundo(
    "seo_geral",
    "plano_seo",
    {},
    { roteiro: [() => new ModeloErro("timeout", undefined, true)] },
  );
  await executarTarefaAgente(deps(x), entrada);
  assert.equal(x.conclusao!.status, "failed");
  assert.equal(x.steps.at(-1)!.tipo, "error");
});

test("o texto entregue é limitado e vem marcado como rascunho", async () => {
  const w = mundo(
    "estrategista",
    "plano_estrategia",
    {},
    { roteiro: [() => texto("x".repeat(20000))] },
  );
  await executarTarefaAgente(deps(w), entrada);
  const res = w.conclusao!.resultado as { texto: string; rascunho: boolean };
  assert.equal(res.texto.length, 8000);
  assert.equal(res.rascunho, true);
});

// ── execução das ferramentas (tradução para RPC) ──
function ctx(
  chamadas: { nome: string; args: Record<string, unknown> }[],
  extra: Partial<Parameters<typeof executarFerramentaAgente>[1]> = {},
) {
  return {
    orgId: ORG_A,
    agentId: "ag-ceo-a",
    taskId: "t-pai",
    hoje: "2026-10-27",
    chamarRpc: async (nome: string, args: Record<string, unknown>) => {
      chamadas.push({ nome, args });
      return { id: "novo", status: "queued" };
    },
    ...extra,
  };
}

test("leituras chamam só a RPC fixa com o agente (nunca org, nunca SQL)", async () => {
  const c: { nome: string; args: Record<string, unknown> }[] = [];
  await executarFerramentaAgente("consultar_oportunidades", ctx(c), { limite: 7 });
  await executarFerramentaAgente("consultar_pipeline", ctx(c), {});
  await executarFerramentaAgente("consultar_lead", ctx(c), { lead_id: LEAD });
  assert.deepEqual(
    c.map((x) => x.nome),
    ["agent_tool_oportunidades", "agent_tool_pipeline", "agent_tool_lead"],
  );
  assert.deepEqual(c[0].args, { p_agent: "ag-ceo-a", p_limite: 7 });
  assert.ok(c.every((x) => !("p_org" in x.args)));
  await assert.rejects(
    () => executarFerramentaAgente("consultar_lead", ctx(c), { lead_id: "1; drop table leads" }),
    /lead_id_invalido/,
  );
  await assert.rejects(
    () => executarFerramentaAgente("run_sql", ctx(c), {}),
    /ferramenta_sem_executor/,
  );
});

test("delegação: chave idempotente estável (mesmo dia/instrução = mesma chave) e vínculo com a tarefa-mãe", async () => {
  const c: { nome: string; args: Record<string, unknown> }[] = [];
  const params = {
    papel: "gerente_comercial",
    tipo: "analise_comercial",
    instrucoes: "foco no funil",
  };
  await executarFerramentaAgente("delegar_tarefa", ctx(c), params);
  await executarFerramentaAgente("delegar_tarefa", ctx(c), params);
  await executarFerramentaAgente("delegar_tarefa", ctx(c), { ...params, instrucoes: "outra" });
  assert.equal(c[0].args.p_idempotency_key, c[1].args.p_idempotency_key);
  assert.notEqual(c[0].args.p_idempotency_key, c[2].args.p_idempotency_key);
  assert.equal(c[0].args.p_parent, "t-pai");
  assert.equal(c[0].args.p_org, ORG_A);
  assert.equal(c[0].args.p_de, "ag-ceo-a");
  await assert.rejects(
    () => executarFerramentaAgente("delegar_tarefa", ctx(c), { ...params, instrucoes: "  " }),
    /instrucoes_vazias/,
  );
});

test("proposta de equipe valida os papéis antes de chamar o banco", async () => {
  assert.deepEqual(parsePapeis("gerente_comercial, sdr  vendedor"), {
    ok: true,
    papeis: ["gerente_comercial", "sdr", "vendedor"],
  });
  assert.equal(parsePapeis("ceo").ok, false);
  assert.equal(parsePapeis("sdr,hacker").ok, false);
  assert.equal(parsePapeis("").ok, false);
  const c: { nome: string; args: Record<string, unknown> }[] = [];
  await executarFerramentaAgente("propor_estrutura_equipe", ctx(c), {
    papeis: "gerente_comercial,sdr",
  });
  assert.equal(c[0].nome, "agent_propor_equipe");
  assert.deepEqual(c[0].args.p_def, [{ papel: "gerente_comercial" }, { papel: "sdr" }]);
  await assert.rejects(
    () => executarFerramentaAgente("propor_estrutura_equipe", ctx(c), { papeis: "ceo" }),
    /papeis_invalidos/,
  );
});
