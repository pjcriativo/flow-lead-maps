// Suite: ciclo completo de um turno do CEO de IA, com dublês em memória (sem rede, sem banco, sem IA paga).
// Invariante: o CEO só lê dados da organização autorizada, respeita permissão/kill-switch/teto e deixa rastro.
// Boundary IN: executarTurnoCeo + runtime + ferramenta, com um "mundo" de duas organizações.
// Boundary OUT: provedor Claude real, PostgreSQL/RLS e a Edge (cobertos no contrato e na prova pós-autorização).
import test from "node:test";
import assert from "node:assert/strict";
import {
  executarTurnoCeo,
  ModeloErro,
  type CeoDeps,
  type RespostaModelo,
  type TarefaRow,
  type TurnoCeoInput,
} from "./agent-ceo-turn.ts";
import type { AgentIdentity, AgentPermission, StepRecord, TaskStatus } from "./agent-runtime.ts";

const ORG_A = "00000000-0000-4000-8000-00000000000a";
const ORG_B = "00000000-0000-4000-8000-00000000000b";

type Lead = { org: string; status: string; score: number };
type World = {
  leads: Lead[];
  agents: Record<string, AgentIdentity>;
  perms: AgentPermission[];
  tasks: Map<string, TarefaRow & { key: string; status: TaskStatus }>;
  steps: StepRecord[];
  runs: { status: string; erro: string | null }[];
  gastoDia: number;
  chamadasModelo: number;
  chamadasFerramenta: { nome: string; org: string }[];
  roteiro: (() => RespostaModelo | Error)[];
  usoIa: number;
  onAntesDoModelo?: () => void;
};

function agente(org: string, over: Partial<AgentIdentity> = {}): AgentIdentity {
  return {
    id: `agent-${org.slice(-1)}`,
    orgId: org,
    papel: "ceo",
    modelo: "claude-haiku-4-5",
    autonomia: "somente_leitura",
    estado: "ativo",
    killSwitch: false,
    tetoUsdDia: 0.5,
    tetoUsdMes: 5,
    maxPassos: 4,
    maxTokensSaida: 800,
    ...over,
  };
}
function mundo(over: Partial<World> = {}): World {
  return {
    leads: [
      { org: ORG_A, status: "new", score: 90 },
      { org: ORG_A, status: "new", score: 40 },
      { org: ORG_A, status: "won", score: 85 },
      { org: ORG_B, status: "new", score: 99 },
      { org: ORG_B, status: "new", score: 99 },
      { org: ORG_B, status: "lost", score: 10 },
    ],
    agents: { [ORG_A]: agente(ORG_A), [ORG_B]: agente(ORG_B) },
    perms: [ORG_A, ORG_B].map((o) => ({
      agentId: `agent-${o.slice(-1)}`,
      orgId: o,
      toolNome: "consultar_resumo_comercial",
      ativo: true,
    })),
    tasks: new Map(),
    steps: [],
    runs: [],
    gastoDia: 0,
    chamadasModelo: 0,
    chamadasFerramenta: [],
    roteiro: [],
    usoIa: 0,
    ...over,
  };
}

// Simula a RPC agent_resumo_comercial: conta SOMENTE leads da organização pedida.
function rpcResumo(w: World, org: string) {
  const l = w.leads.filter((x) => x.org === org);
  const por: Record<string, number> = {};
  for (const x of l) por[x.status] = (por[x.status] ?? 0) + 1;
  return {
    org_id: org,
    gerado_em: "2026-10-27T12:00:00Z",
    total_leads: l.length,
    por_status: por,
    qualificados: { criterio: "score >= 70", total: l.filter((x) => x.score >= 70).length },
    oportunidades_disponiveis: {
      criterio: "score >= 70 e novo",
      total: l.filter((x) => x.score >= 70 && x.status === "new").length,
    },
    novos_ultimos_30_dias: l.length,
    ganhos: l.filter((x) => x.status === "won").length,
    perdidos: l.filter((x) => x.status === "lost").length,
  };
}

function deps(w: World): CeoDeps {
  return {
    carregarAgente: async (org) => {
      const agent = w.agents[org];
      return agent
        ? {
            agent,
            catalog: [{ nome: "consultar_resumo_comercial", risco: "read", ativo: true }],
            permissions: w.perms.filter((p) => p.orgId === org),
          }
        : null;
    },
    consumo: async () => ({ usdDia: w.gastoDia, usdMes: w.gastoDia }),
    enfileirar: async (i) => {
      const existente = [...w.tasks.values()].find((t) => t.key === i.idempotencyKey);
      if (existente) return existente;
      const t = {
        id: `task-${w.tasks.size + 1}`,
        key: i.idempotencyKey,
        status: "queued" as TaskStatus,
        attemptCount: 0,
        maxAttempts: 2,
        resultado: null,
      };
      w.tasks.set(t.id, t);
      return t;
    },
    reservar: async (id) => {
      const t = w.tasks.get(id)!;
      if (t.status !== "queued") return null;
      t.status = "processing";
      t.attemptCount += 1;
      return t;
    },
    iniciarRun: async () => (
      w.runs.push({ status: "running", erro: null }),
      `run-${w.runs.length}`
    ),
    registrarPasso: async (_r, s) => {
      w.steps.push(s);
      w.gastoDia += s.custoUsd;
    },
    finalizarRun: async (_r, status, erro) => {
      const r = w.runs[w.runs.length - 1];
      r.status = status;
      r.erro = erro;
    },
    concluirTarefa: async (i) => {
      const t = w.tasks.get(i.taskId)!;
      t.status = i.status;
      if (i.resultado) t.resultado = i.resultado as { resposta: string };
    },
    executarFerramenta: async (nome, ctx) => {
      w.chamadasFerramenta.push({ nome, org: ctx.orgId });
      return rpcResumo(w, ctx.orgId);
    },
    chamarModelo: async () => {
      w.onAntesDoModelo?.();
      w.chamadasModelo += 1;
      const proximo = w.roteiro.shift();
      if (!proximo) throw new Error("roteiro do modelo esgotado");
      const r = proximo();
      if (r instanceof Error) throw r;
      return r;
    },
    registrarUsoIa: async () => void (w.usoIa += 1),
    agora: () => new Date("2026-10-27T12:00:00Z"),
  };
}

const usaFerramenta = (): RespostaModelo => ({
  texto: "",
  toolUses: [{ id: "tu1", name: "consultar_resumo_comercial", input: {} }],
  tokensEntrada: 1000,
  tokensSaida: 50,
});
const responde = (t: string): RespostaModelo => ({
  texto: t,
  toolUses: [],
  tokensEntrada: 1500,
  tokensSaida: 120,
});
const entrada = (over: Partial<TurnoCeoInput> = {}): TurnoCeoInput => ({
  orgId: ORG_A,
  userId: "user-a",
  clientMessageId: "msg-1",
  mensagem: "CEO, como está nosso funil comercial?",
  workerId: "w1",
  ...over,
});

test("funil: consulta a ferramenta, usa só dados da organização A e registra passos e uso de IA", async () => {
  const w = mundo({
    roteiro: [usaFerramenta, () => responde("Você tem 3 leads, 2 qualificados.")],
  });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.resposta, "Você tem 3 leads, 2 qualificados.");
  assert.deepEqual(w.chamadasFerramenta, [{ nome: "consultar_resumo_comercial", org: ORG_A }]);
  assert.deepEqual(
    w.steps.map((s) => s.tipo),
    ["model", "tool_call", "tool_result", "model", "final"],
  );
  assert.deepEqual(
    w.steps.map((s) => s.seq),
    [1, 2, 3, 4, 5],
  );
  const resultado = w.steps.find((s) => s.tipo === "tool_result")!.saida as {
    totalLeads: number;
    orgId: string;
  };
  assert.equal(resultado.totalLeads, 3); // os 3 leads da org A; os da B nunca entram
  assert.equal(resultado.orgId, ORG_A);
  assert.equal(w.usoIa, 2);
  assert.equal(w.runs[0].status, "succeeded");
  assert.equal([...w.tasks.values()][0].status, "succeeded");
  assert.ok(r.custoUsd > 0 && r.custoUsd < 0.01);
});

test("isolamento: o mesmo pedido na organização B enxerga apenas os dados da B", async () => {
  const w = mundo({ roteiro: [usaFerramenta, () => responde("ok")] });
  await executarTurnoCeo(deps(w), entrada({ orgId: ORG_B, userId: "user-b" }));
  const resultado = w.steps.find((s) => s.tipo === "tool_result")!.saida as {
    totalLeads: number;
    orgId: string;
  };
  assert.equal(resultado.totalLeads, 3);
  assert.equal(resultado.orgId, ORG_B);
  assert.equal(w.chamadasFerramenta[0].org, ORG_B);
});

test("agente inexistente na organização: nenhum modelo é chamado", async () => {
  const w = mundo({ agents: {} });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.deepEqual(r, {
    ok: false,
    reason: "ceo_nao_configurado",
    detail: undefined,
    httpStatus: 409,
  });
  assert.equal(w.chamadasModelo, 0);
});

test("agente inativo ou pausado: bloqueado antes de criar tarefa", async () => {
  for (const estado of ["inativo", "pausado"] as const) {
    const w = mundo({ agents: { [ORG_A]: agente(ORG_A, { estado }) } });
    const r = await executarTurnoCeo(deps(w), entrada());
    assert.equal(r.ok, false);
    assert.equal(w.tasks.size, 0);
    assert.equal(w.chamadasModelo, 0);
  }
});

test("kill-switch ligado: nada executa e não há tarefa", async () => {
  const w = mundo({ agents: { [ORG_A]: agente(ORG_A, { killSwitch: true }) } });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(!r.ok && r.reason, "kill_switch");
  assert.equal(!r.ok && r.httpStatus, 423);
  assert.equal(w.chamadasModelo, 0);
});

test("kill-switch acionado NO MEIO da execução interrompe no passo seguinte e cancela a tarefa", async () => {
  const w = mundo({ roteiro: [usaFerramenta, () => responde("não deveria chegar aqui")] });
  w.onAntesDoModelo = () => {
    if (w.chamadasModelo === 0) w.agents[ORG_A] = agente(ORG_A, { killSwitch: true }); // humano liga durante o 1º passo
  };
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(!r.ok && r.reason, "kill_switch");
  assert.equal(w.chamadasModelo, 1);
  assert.equal(w.runs[0].status, "cancelled");
  assert.equal([...w.tasks.values()][0].status, "cancelled");
  assert.ok(w.steps.some((s) => s.tipo === "blocked"));
});

test("sem permissão concedida por humano: a ferramenta é negada e nenhum dado é lido", async () => {
  const w = mundo({
    perms: [],
    roteiro: [usaFerramenta, () => responde("Não tenho acesso aos dados.")],
  });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(r.ok, true);
  assert.equal(w.chamadasFerramenta.length, 0);
  const negado = w.steps.find((s) => s.tipo === "blocked")!;
  assert.equal(negado.erro, "permissao_ausente");
});

test("o modelo não consegue pedir ferramenta inexistente nem passar parâmetros (org/SQL)", async () => {
  const w = mundo({
    roteiro: [
      () => ({
        texto: "",
        toolUses: [
          { id: "a", name: "run_sql", input: { query: "select * from leads" } },
          { id: "b", name: "consultar_resumo_comercial", input: { org_id: ORG_B } },
        ],
        tokensEntrada: 100,
        tokensSaida: 10,
      }),
      () => responde("sem dados"),
    ],
  });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(r.ok, true);
  assert.equal(w.chamadasFerramenta.length, 0);
  assert.deepEqual(
    w.steps.filter((s) => s.tipo === "blocked").map((s) => s.erro),
    ["ferramenta_desconhecida", "parametros_invalidos"],
  );
});

test("teto diário estourado: bloqueia antes de chamar o modelo", async () => {
  const w = mundo({ gastoDia: 0.499, roteiro: [() => responde("não")] });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(!r.ok && r.reason, "teto_dia");
  assert.equal(!r.ok && r.httpStatus, 429);
  assert.equal(w.chamadasModelo, 0);
  assert.equal([...w.tasks.values()][0].status, "failed");
});

test("modelo sem preço conhecido é recusado (não há como respeitar o teto)", async () => {
  const w = mundo({ agents: { [ORG_A]: agente(ORG_A, { modelo: "modelo-caro-sem-tabela" }) } });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(!r.ok && r.reason, "modelo_nao_precificado");
  assert.equal(w.chamadasModelo, 0);
});

test("limite de passos: laço de ferramentas é cortado", async () => {
  const w = mundo({
    agents: { [ORG_A]: agente(ORG_A, { maxPassos: 2 }) },
    roteiro: [usaFerramenta, usaFerramenta, usaFerramenta],
  });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(!r.ok && r.reason, "limite_de_passos");
  assert.equal(w.chamadasModelo, 2);
});

test("idempotência: reenviar a mesma mensagem devolve a resposta salva sem nova chamada paga", async () => {
  const w = mundo({ roteiro: [usaFerramenta, () => responde("resposta única")] });
  const d = deps(w);
  const a = await executarTurnoCeo(d, entrada());
  const b = await executarTurnoCeo(d, entrada());
  assert.equal(a.ok && a.resposta, "resposta única");
  assert.equal(b.ok && b.resposta, "resposta única");
  assert.equal(b.ok && b.reutilizado, true);
  assert.equal(b.ok && b.custoUsd, 0);
  assert.equal(w.chamadasModelo, 2); // só as 2 chamadas do primeiro turno
  assert.equal(w.tasks.size, 1);
});

test("mensagem nova com outro id é outra tarefa; mensagem vazia ou gigante é recusada", async () => {
  const w = mundo({ roteiro: [() => responde("a"), () => responde("b")] });
  const d = deps(w);
  await executarTurnoCeo(d, entrada({ clientMessageId: "m1" }));
  await executarTurnoCeo(d, entrada({ clientMessageId: "m2" }));
  assert.equal(w.tasks.size, 2);
  assert.equal((await executarTurnoCeo(d, entrada({ mensagem: "   " }))).ok, false);
  assert.equal((await executarTurnoCeo(d, entrada({ mensagem: "x".repeat(2001) }))).ok, false);
  assert.equal((await executarTurnoCeo(d, entrada({ clientMessageId: "" }))).ok, false);
});

test("falha transitória do provedor (429): tarefa volta à fila com backoff e o erro fica registrado", async () => {
  const w = mundo({ roteiro: [() => new ModeloErro("limite", 429)] });
  const r = await executarTurnoCeo(deps(w), entrada());
  assert.equal(!r.ok && r.reason, "falha_modelo");
  assert.equal([...w.tasks.values()][0].status, "queued");
  assert.equal(w.runs[0].status, "failed");
  assert.equal(w.steps.at(-1)?.tipo, "error");
});

test("falha permanente (401) ou tentativas esgotadas: tarefa falha de vez", async () => {
  const perm = mundo({ roteiro: [() => new ModeloErro("chave", 401)] });
  await executarTurnoCeo(deps(perm), entrada());
  assert.equal([...perm.tasks.values()][0].status, "failed");

  const esgotada = mundo({ roteiro: [() => new ModeloErro("fora", 503)] });
  const d = deps(esgotada);
  const original = d.reservar;
  d.reservar = async (id, wk) => {
    const t = await original(id, wk);
    if (t) t.attemptCount = t.maxAttempts; // última tentativa
    return t;
  };
  await executarTurnoCeo(d, entrada());
  assert.equal([...esgotada.tasks.values()][0].status, "failed");
});

test("timeout (resultado incerto) não é repetido automaticamente", async () => {
  const w = mundo({ roteiro: [() => new ModeloErro("timeout", undefined, true)] });
  await executarTurnoCeo(deps(w), entrada());
  assert.equal([...w.tasks.values()][0].status, "failed");
});

test("falha da ferramenta vira indisponibilidade: o CEO responde sem inventar números", async () => {
  const w = mundo({
    roteiro: [usaFerramenta, () => responde("Consulta indisponível no momento.")],
  });
  const d = deps(w);
  d.executarFerramenta = async () => {
    throw new Error("rpc fora do ar");
  };
  const r = await executarTurnoCeo(d, entrada());
  assert.equal(r.ok, true);
  assert.equal(w.steps.find((s) => s.tipo === "blocked")?.erro, "erro_ferramenta");
});

test("payload de ferramenta de outra organização é descartado como indisponível", async () => {
  const w = mundo({ roteiro: [usaFerramenta, () => responde("sem dados")] });
  const d = deps(w);
  d.executarFerramenta = async () => rpcResumo(w, ORG_B); // RPC "vazou" dados da B para a sessão da A
  await executarTurnoCeo(d, entrada());
  const resultado = w.steps.find((s) => s.tipo === "tool_result")!.saida as {
    disponivel: boolean;
    motivo: string;
  };
  assert.deepEqual(resultado, { disponivel: false, motivo: "organizacao_divergente" });
});
