// Suite: ferramenta consultar_resumo_comercial (normalização do payload da RPC).
// Invariante: o modelo só recebe números reais da organização autorizada; o que faltar vira indisponibilidade.
// Boundary IN: normalizarResumoComercial e o registro de ferramentas.
// Boundary OUT: a RPC SQL em si (agent-foundation-contract.test.ts).
import test from "node:test";
import assert from "node:assert/strict";
import {
  anthropicToolSchemas,
  ETAPAS_PIPELINE,
  normalizarResumoComercial,
  TOOL_REGISTRY,
} from "./agent-tools.ts";

const ORG = "00000000-0000-4000-8000-00000000000a";
const bruto = (over: Record<string, unknown> = {}) => ({
  org_id: ORG,
  gerado_em: "2026-10-27T12:00:00Z",
  total_leads: 10,
  por_status: { new: 4, contacted: 3, won: 2, lost: 1 },
  qualificados: { criterio: "score >= 70", total: 6 },
  oportunidades_disponiveis: { criterio: "score >= 70 e novo", total: 2 },
  novos_ultimos_30_dias: 5,
  ganhos: 2,
  perdidos: 1,
  ...over,
});

test("resumo real: totais, funil completo (com zeros) e conversão calculada", () => {
  const r = normalizarResumoComercial(bruto(), ORG);
  assert.equal(r.disponivel, true);
  if (!r.disponivel) return;
  assert.equal(r.totalLeads, 10);
  assert.equal(r.etapasPipeline.length, ETAPAS_PIPELINE.length);
  assert.equal(r.etapasPipeline.find((e) => e.status === "responded")?.total, 0);
  assert.equal(r.etapasPipeline.find((e) => e.status === "new")?.total, 4);
  assert.equal(r.qualificados.total, 6);
  assert.equal(r.oportunidadesDisponiveis.total, 2);
  assert.equal(r.taxaConversao, 2 / 3);
  assert.deepEqual(r.indisponiveis, []);
});

test("sem leads: disponível com zeros e conversão indisponível (não 0%)", () => {
  const r = normalizarResumoComercial(
    bruto({ total_leads: 0, por_status: {}, ganhos: 0, perdidos: 0 }),
    ORG,
  );
  assert.equal(r.disponivel, true);
  if (r.disponivel) {
    assert.equal(r.totalLeads, 0);
    assert.equal(r.taxaConversao, null);
  }
});

test("payload vazio, nulo ou de tipo errado vira indisponibilidade", () => {
  for (const v of [null, undefined, "x", [], {}]) {
    assert.deepEqual(
      normalizarResumoComercial(v, ORG),
      v && typeof v === "object" && !Array.isArray(v)
        ? { disponivel: false, motivo: "organizacao_divergente" }
        : { disponivel: false, motivo: "resposta_vazia_ou_invalida" },
    );
  }
});

test("payload de OUTRA organização é recusado (isolamento na borda da ferramenta)", () => {
  const r = normalizarResumoComercial(
    bruto({ org_id: "00000000-0000-4000-8000-00000000000b" }),
    ORG,
  );
  assert.deepEqual(r, { disponivel: false, motivo: "organizacao_divergente" });
});

test("total de leads ausente ou negativo: indisponível", () => {
  assert.equal(normalizarResumoComercial(bruto({ total_leads: undefined }), ORG).disponivel, false);
  assert.equal(normalizarResumoComercial(bruto({ total_leads: -1 }), ORG).disponivel, false);
});

test("bloco malformado é listado como indisponível sem inventar valor", () => {
  const r = normalizarResumoComercial(bruto({ qualificados: "oi", ganhos: null }), ORG);
  assert.equal(r.disponivel, true);
  if (!r.disponivel) return;
  assert.deepEqual(r.indisponiveis.sort(), ["ganhos", "qualificados"]);
  assert.equal(r.qualificados.criterio, "indisponivel");
  assert.equal(r.taxaConversao, null);
});

test("contagens que chegam como texto numérico (bigint do Postgres) são aceitas", () => {
  const r = normalizarResumoComercial(bruto({ total_leads: "10", por_status: { new: "4" } }), ORG);
  assert.equal(r.disponivel && r.totalLeads, 10);
});

test("registro: 5 ferramentas de leitura e 2 de coordenação interna, nenhuma externa", () => {
  assert.equal(TOOL_REGISTRY.length, 7);
  const risco = (r: string) =>
    TOOL_REGISTRY.filter((t) => t.risco === r)
      .map((t) => t.nome)
      .sort();
  assert.deepEqual(risco("read"), [
    "consultar_execucoes_equipe",
    "consultar_lead",
    "consultar_oportunidades",
    "consultar_pipeline",
    "consultar_resumo_comercial",
  ]);
  assert.deepEqual(risco("write_internal"), ["delegar_tarefa", "propor_estrutura_equipe"]);
  assert.deepEqual(risco("external_send"), []);
  assert.deepEqual(risco("spend"), []);
});

test("o resumo comercial segue sem parâmetros e o modelo nunca informa a organização", () => {
  const resumo = TOOL_REGISTRY.find((t) => t.nome === "consultar_resumo_comercial")!;
  assert.deepEqual(resumo.params, {});
  const schemas = anthropicToolSchemas();
  assert.deepEqual(schemas.find((t) => t.name === "consultar_resumo_comercial")!.input_schema, {
    type: "object",
    properties: {},
    additionalProperties: false,
  });
  for (const t of TOOL_REGISTRY) {
    for (const proibido of ["org_id", "org", "sql", "tabela", "query", "agent_id"]) {
      assert.ok(!(proibido in t.params), `${t.nome} aceita ${proibido}`);
    }
  }
});

test("esquema da API: parâmetros obrigatórios, enum e limites chegam ao modelo", () => {
  const d = anthropicToolSchemas().find((t) => t.name === "delegar_tarefa")!;
  const schema = d.input_schema as {
    required: string[];
    properties: Record<string, { enum?: string[] }>;
  };
  assert.deepEqual(schema.required.sort(), ["instrucoes", "papel", "tipo"]);
  assert.ok(schema.properties.papel.enum!.includes("sdr"));
  assert.ok(!schema.properties.papel.enum!.includes("ceo"));
  assert.ok(!schema.properties.tipo.enum!.includes("copiloto_conversa"));
});
