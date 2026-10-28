// Suite: lógica pura da Central de IA e do catálogo de modelos no frontend.
// Invariante: a interface nunca declara "erro de configuração" para um modelo legítimo do catálogo, nunca
// aceita preço/chave malformados, e não depende de backend para validar cedo. O backend segue autoridade.
// Boundary IN: src/lib/ia-config.ts, modelos-ia.ts, ceo-config.ts, equipe-config.ts (funções puras).
// Boundary OUT: Edge admin-acoes e RPCs (provadas em contrato e em Postgres).
import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import {
  MSG_CONFIGURAR_PROVEDOR,
  ROTULO_CONEXAO,
  alertaDeConsumo,
  formatarUsdCurto,
  ordenarModelos,
  percentualDoTeto,
  traduzirMotivoIa,
  validarChaveOpenAI,
  validarPrecos,
} from "../src/lib/ia-config.ts";
import { definirModelosExtras } from "../src/lib/modelos-ia.ts";
import {
  derivarEstadoCeo,
  estimarCustoPerguntaUsd,
  modelosConhecidos,
  validarConfigCeo,
  CONFIG_CEO_PADRAO,
} from "../src/lib/ceo-config.ts";
import { ehPropostaDeEquipe, ehPropostaDeOperacao } from "../src/lib/equipe-config.ts";

afterEach(() => definirModelosExtras([]));

test("chave da OpenAI: confere formato antes de enviar", () => {
  assert.deepEqual(validarChaveOpenAI("sk-proj-" + "a".repeat(40)), { ok: true });
  assert.equal(validarChaveOpenAI("").ok, false);
  assert.equal(validarChaveOpenAI("sk-aaaa bbbb cccc dddd eeee ffff").ok, false);
  assert.equal(validarChaveOpenAI("apify_api_1234567890123456").ok, false);
  assert.equal(validarChaveOpenAI("sk-curta").ok, false);
});

test("preços: aceita vírgula decimal, exige os dois e limita 0–1000", () => {
  assert.deepEqual(validarPrecos("2,5", "10"), { ok: true, usdIn: 2.5, usdOut: 10 });
  assert.equal(validarPrecos("", "10").ok, false);
  assert.equal(validarPrecos("-1", "10").ok, false);
  assert.equal(validarPrecos("1", "1001").ok, false);
  assert.equal(validarPrecos("abc", "1").ok, false);
});

test("motivos conhecidos viram texto em português; desconhecido nunca vaza o código bruto", () => {
  assert.match(traduzirMotivoIa("chave_invalida_ou_revogada"), /recusou a chave/);
  assert.match(traduzirMotivoIa("preco_obrigatorio_para_ativar"), /dois preços/);
  assert.equal(traduzirMotivoIa("algo_inesperado_xyz"), "Operação não concluída.");
  assert.equal(traduzirMotivoIa(undefined), "Operação não concluída.");
  assert.equal(
    MSG_CONFIGURAR_PROVEDOR,
    "Configure um provedor de IA no Super Admin para ativar o CEO.",
  );
  assert.equal(ROTULO_CONEXAO.ok.rotulo, "Conectado");
  assert.equal(ROTULO_CONEXAO.nao_configurado.tom, "neutro");
});

test("consumo: percentual com teto zero não divide por zero; alerta aos 80% e bloqueio aos 100%", () => {
  assert.equal(percentualDoTeto(1, 0), 0);
  assert.equal(percentualDoTeto(1, 4), 25);
  assert.equal(percentualDoTeto(9, 4), 100);
  assert.equal(alertaDeConsumo(2, 4), "ok");
  assert.equal(alertaDeConsumo(3.2, 4), "aviso");
  assert.equal(alertaDeConsumo(4, 4), "bloqueado");
  assert.equal(alertaDeConsumo(5, 0), "ok", "sem teto definido não inventa alerta");
  assert.equal(formatarUsdCurto(null), "—");
  assert.match(formatarUsdCurto(0.5), /US\$\s0,50/);
});

test("ordenação: agrupa por provedor, ativos primeiro", () => {
  const l = [
    { id: "b", provider: "openai", rotulo: null, usd_in_mtok: 1, usd_out_mtok: 1, ativo: false },
    { id: "a", provider: "openai", rotulo: null, usd_in_mtok: 1, usd_out_mtok: 1, ativo: true },
    { id: "c", provider: "anthropic", rotulo: null, usd_in_mtok: 1, usd_out_mtok: 1, ativo: true },
  ];
  assert.deepEqual(
    ordenarModelos(l).map((m) => m.id),
    ["c", "a", "b"],
  );
});

const agenteCeo = (modelo) => ({
  id: "a1",
  orgId: "o1",
  nome: "CEO",
  cargo: "Dir",
  departamento: "Com",
  descricao: null,
  especialidade: "x",
  avatarUrl: null,
  modelo,
  estado: "ativo",
  killSwitch: false,
  tetoDiaUsd: 0.5,
  tetoMesUsd: 5,
  maxPassos: 4,
  papel: "ceo",
  autonomia: "somente_leitura",
  reportsTo: null,
});
const estadoDe = (modelo) =>
  derivarEstadoCeo({
    carregando: false,
    erroServico: false,
    carga: {
      agente: agenteCeo(modelo),
      ferramentasConcedidas: ["consultar_resumo_comercial"],
      gastoDiaUsd: 0,
      gastoMesUsd: 0,
    },
  }).id;

test("catálogo: sem a Central só Claude vale (comportamento anterior preservado)", () => {
  assert.equal(estadoDe("claude-haiku-4-5"), "ativo");
  assert.equal(estadoDe("modelo-openai-novo"), "erro_configuracao");
  assert.equal(modelosConhecidos().length, 5);
  assert.equal(validarConfigCeo({ ...CONFIG_CEO_PADRAO, modelo: "modelo-openai-novo" }).ok, false);
});

test("catálogo: com a Central, o modelo da OpenAI vira válido, tem custo estimado e o CEO aparece ATIVO", () => {
  definirModelosExtras([
    { id: "modelo-openai-novo", provider: "openai", rotulo: "Novo", usdEntrada: 2, usdSaida: 8 },
  ]);
  assert.equal(estadoDe("modelo-openai-novo"), "ativo");
  assert.equal(validarConfigCeo({ ...CONFIG_CEO_PADRAO, modelo: "modelo-openai-novo" }).ok, true);
  assert.equal(estimarCustoPerguntaUsd("modelo-openai-novo"), (3000 * 2 + 600 * 8) / 1_000_000);
  assert.equal(modelosConhecidos().length, 6);
  // modelo de fora do catálogo continua inválido
  assert.equal(estadoDe("outro-modelo"), "erro_configuracao");
});

test("catálogo: um modelo extra não sobrescreve o preço estático de um Claude", () => {
  definirModelosExtras([
    { id: "claude-haiku-4-5", provider: "anthropic", rotulo: "x", usdEntrada: 99, usdSaida: 99 },
  ]);
  assert.equal(estimarCustoPerguntaUsd("claude-haiku-4-5"), (3000 * 1 + 600 * 5) / 1_000_000);
});

test("aprovações: proposta de operação é distinta da de equipe e de qualquer outra", () => {
  const op = { tipo: "mudanca_configuracao", payload: { operacao: { nome: "X" } } };
  assert.equal(ehPropostaDeOperacao(op), true);
  assert.equal(ehPropostaDeEquipe(op), false);
  assert.equal(
    ehPropostaDeOperacao({ tipo: "mudanca_configuracao", payload: { equipe: [{ papel: "sdr" }] } }),
    false,
  );
  assert.equal(
    ehPropostaDeOperacao({ tipo: "acao_externa", payload: { operacao: { nome: "X" } } }),
    false,
  );
  assert.equal(ehPropostaDeOperacao({ tipo: "mudanca_configuracao", payload: null }), false);
});
