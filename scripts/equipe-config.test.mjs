// Suite: equipe comercial de IA no frontend (papéis, estados, relatórios e aprovações).
// Invariante: o que a interface mostra e valida espelha o runtime/banco, e nunca apresenta como
// operacional um agente inativo, sem ferramenta, com kill-switch ou acima do teto.
// Boundary IN: funções puras de src/lib/equipe-config.ts (e a paridade com o runtime).
// Boundary OUT: RPCs/RLS (provadas em Postgres) e a renderização React (contrato estático).
import assert from "node:assert/strict";
import test from "node:test";
import {
  META_PAPEL,
  PAPEIS,
  PAPEIS_SUBORDINADOS,
  ROTULO_FERRAMENTA,
  ROTULO_TIPO_TAREFA,
  derivarEstadoAgente,
  ehPapel,
  ehPropostaDeEquipe,
  equipePadrao,
  formatarDuracao,
  ordenarEquipe,
  papeisFaltantes,
  resumirPorAgente,
  rotuloStatusAprovacao,
} from "../src/lib/equipe-config.ts";
import {
  FERRAMENTAS_DO_PAPEL,
  PAPEIS_AGENTE,
  SUPERIOR_DO_PAPEL,
  TIPOS_DO_PAPEL,
} from "../supabase/functions/_shared/agent-runtime.ts";
import { TOOL_REGISTRY } from "../supabase/functions/_shared/agent-tools.ts";

const agente = (over = {}) => ({
  id: "a1",
  orgId: "o1",
  nome: "SDR",
  cargo: "Representante",
  departamento: "Pré-vendas",
  descricao: null,
  especialidade: "Qualificação",
  avatarUrl: null,
  modelo: "claude-haiku-4-5",
  estado: "ativo",
  killSwitch: false,
  tetoDiaUsd: 0.5,
  tetoMesUsd: 5,
  maxPassos: 4,
  papel: "sdr",
  autonomia: "somente_leitura",
  reportsTo: "g1",
  ...over,
});
const estado = (a, ferramentas = ["consultar_lead"], gasto = [0, 0]) =>
  derivarEstadoAgente({
    carregando: false,
    erroServico: false,
    carga: {
      agente: a,
      ferramentasConcedidas: ferramentas,
      gastoDiaUsd: gasto[0],
      gastoMesUsd: gasto[1],
    },
  }).id;

test("paridade com o runtime: papéis, ferramentas, tipos de tarefa e hierarquia", () => {
  assert.deepEqual([...PAPEIS], [...PAPEIS_AGENTE]);
  for (const p of PAPEIS) {
    assert.deepEqual(
      [...META_PAPEL[p].ferramentas],
      [...FERRAMENTAS_DO_PAPEL[p]],
      `ferramentas ${p}`,
    );
    assert.deepEqual([...META_PAPEL[p].tipos], [...TIPOS_DO_PAPEL[p]], `tipos ${p}`);
    assert.equal(META_PAPEL[p].superior, SUPERIOR_DO_PAPEL[p], `superior ${p}`);
  }
});

test("toda ferramenta tem rótulo e nenhuma é externa; só CEO e Gerente delegam", () => {
  for (const t of TOOL_REGISTRY) {
    assert.ok(ROTULO_FERRAMENTA[t.nome], `sem rótulo: ${t.nome}`);
    assert.ok(t.risco === "read" || t.risco === "write_internal");
  }
  assert.deepEqual(
    PAPEIS.filter((p) => META_PAPEL[p].podeDelegar),
    ["ceo", "gerente_comercial"],
  );
  for (const p of PAPEIS)
    for (const tipo of META_PAPEL[p].tipos) assert.ok(ROTULO_TIPO_TAREFA[tipo], tipo);
});

test("equipe padrão: 6 subordinados, gerente primeiro; faltantes e ordem de exibição", () => {
  assert.deepEqual(
    equipePadrao().map((x) => x.papel),
    [...PAPEIS_SUBORDINADOS],
  );
  assert.equal(equipePadrao()[0].papel, "gerente_comercial");
  assert.deepEqual(papeisFaltantes(["ceo", "gerente_comercial", "sdr"]), [
    "prospeccao",
    "vendedor",
    "estrategista",
    "seo_geral",
  ]);
  assert.deepEqual(papeisFaltantes(PAPEIS), []);
  const ordenado = ordenarEquipe([
    { papel: "sdr" },
    { papel: "ceo" },
    { papel: "seo_geral" },
    { papel: "gerente_comercial" },
  ]);
  assert.deepEqual(
    ordenado.map((a) => a.papel),
    ["ceo", "gerente_comercial", "sdr", "seo_geral"],
  );
  assert.equal(ehPapel("sdr"), true);
  assert.equal(ehPapel("hacker"), false);
});

test("estado do subordinado: configurado, ativo, pausado, bloqueado, limite e erro", () => {
  assert.equal(estado(agente({ estado: "inativo" })), "configurado");
  assert.equal(estado(agente({ estado: "inativo" }), []), "inativo");
  assert.equal(estado(agente()), "ativo");
  assert.equal(estado(agente({ estado: "pausado" })), "pausado");
  assert.equal(estado(agente({ killSwitch: true })), "bloqueado");
  assert.equal(estado(agente(), ["consultar_lead"], [0.5, 0]), "limite_atingido");
  assert.equal(estado(agente(), ["consultar_lead"], [0, 5]), "limite_atingido");
});

test("subordinado ATIVO sem ferramenta, sem identidade ou com modelo/limite inválido nunca aparece como ativo", () => {
  assert.equal(estado(agente(), []), "erro_configuracao");
  assert.equal(estado(agente({ cargo: null })), "erro_configuracao");
  assert.equal(estado(agente({ modelo: "gpt-9" })), "erro_configuracao");
  assert.equal(estado(agente({ tetoDiaUsd: 9 })), "erro_configuracao");
});

test("estado: serviço fora do ar ou carregando vem antes de qualquer outro", () => {
  assert.equal(
    derivarEstadoAgente({ carregando: true, erroServico: false, carga: null }).id,
    "carregando",
  );
  assert.equal(
    derivarEstadoAgente({ carregando: false, erroServico: true, carga: null }).id,
    "servico_indisponivel",
  );
  assert.equal(
    derivarEstadoAgente({
      carregando: false,
      erroServico: false,
      carga: { agente: null, ferramentasConcedidas: [], gastoDiaUsd: 0, gastoMesUsd: 0 },
    }).id,
    "nao_configurado",
  );
});

const agora = new Date("2026-10-27T12:00:00Z");
const run = (agentId, status, custoUsd, passos, inicio, fimSeg) => ({
  agentId,
  status,
  custoUsd,
  passos,
  iniciadoEm: inicio,
  finalizadoEm: fimSeg === null ? null : new Date(Date.parse(inicio) + fimSeg * 1000).toISOString(),
});

test("relatório: agrega execuções, falhas, custo, duração e fila por agente na janela de 30 dias", () => {
  const runs = [
    run("a", "succeeded", 0.004, 3, "2026-10-26T10:00:00Z", 10),
    run("a", "failed", 0.001, 1, "2026-10-26T11:00:00Z", 4),
    run("a", "succeeded", 9, 9, "2026-08-01T10:00:00Z", 10), // fora da janela
    run("b", "cancelled", 0, 1, "2026-10-27T09:00:00Z", null),
  ];
  const tarefas = [
    {
      id: "1",
      agentId: "a",
      tipo: "plano_seo",
      status: "queued",
      delegadoPor: null,
      criadoEm: "x",
      concluidoEm: null,
      ultimoErro: null,
      resultado: null,
    },
    {
      id: "2",
      agentId: "a",
      tipo: "plano_seo",
      status: "succeeded",
      delegadoPor: null,
      criadoEm: "x",
      concluidoEm: null,
      ultimoErro: null,
      resultado: null,
    },
    {
      id: "3",
      agentId: "b",
      tipo: "plano_seo",
      status: "processing",
      delegadoPor: null,
      criadoEm: "x",
      concluidoEm: null,
      ultimoErro: null,
      resultado: null,
    },
  ];
  const r = resumirPorAgente(runs, tarefas, ["a", "b", "c"], agora);
  const a = r.porAgente.find((x) => x.agentId === "a");
  assert.equal(a.execucoes, 2);
  assert.equal(a.concluidas, 1);
  assert.equal(a.falhas, 1);
  assert.ok(Math.abs(a.custoUsd - 0.005) < 1e-9);
  assert.equal(a.passos, 4);
  assert.equal(a.duracaoMediaS, 7);
  assert.equal(a.tarefasAbertas, 1);
  const b = r.porAgente.find((x) => x.agentId === "b");
  assert.equal(b.canceladas, 1);
  assert.equal(b.duracaoMediaS, null);
  assert.equal(b.tarefasAbertas, 1);
  const c = r.porAgente.find((x) => x.agentId === "c");
  assert.equal(c.execucoes, 0);
  assert.equal(c.custoUsd, 0);
  assert.equal(c.duracaoMediaS, null);
  assert.equal(r.total.execucoes, 3);
  assert.equal(r.total.tarefasAbertas, 2);
});

test("relatório sem execuções: zeros e duração indisponível (nunca inventada)", () => {
  const r = resumirPorAgente([], [], ["a"], agora);
  assert.equal(r.total.execucoes, 0);
  assert.equal(r.total.custoUsd, 0);
  assert.equal(r.total.duracaoMediaS, null);
  assert.equal(formatarDuracao(null), "—");
  assert.equal(formatarDuracao(7), "7,0 s");
  assert.equal(formatarDuracao(125), "2 min 5 s");
});

test("aprovações: só mudança de configuração com payload.equipe é proposta de equipe", () => {
  assert.equal(
    ehPropostaDeEquipe({ tipo: "mudanca_configuracao", payload: { equipe: [{ papel: "sdr" }] } }),
    true,
  );
  assert.equal(ehPropostaDeEquipe({ tipo: "mudanca_configuracao", payload: {} }), false);
  assert.equal(ehPropostaDeEquipe({ tipo: "acao_externa", payload: { equipe: [] } }), false);
  assert.equal(ehPropostaDeEquipe({ tipo: "gasto", payload: null }), false);
  assert.equal(rotuloStatusAprovacao("pending"), "Pendente");
  assert.equal(rotuloStatusAprovacao("approved"), "Aprovada");
  assert.equal(rotuloStatusAprovacao("rejected"), "Rejeitada");
});
