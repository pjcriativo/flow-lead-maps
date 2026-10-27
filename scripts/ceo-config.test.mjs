// Suite: configuração e estados operacionais do CEO de IA (Telas 02, 03 e 10).
// Invariante: a interface nunca mostra o CEO como ativo sem o backend confirmar, nem aceita valores
// acima dos tetos do banco; o que for impossível é recusado antes de chegar ao backend.
// Boundary IN: funções puras de src/lib/ceo-config.ts.
// Boundary OUT: RPCs/RLS (provadas em Postgres) e a renderização React (contrato estático).
import assert from "node:assert/strict";
import test from "node:test";
import {
  AVATARES_CEO,
  CONFIG_CEO_PADRAO,
  FERRAMENTA_RESUMO_COMERCIAL,
  MODELOS_CEO,
  MODELO_PADRAO_CEO,
  TETOS_CEO,
  copilotoRealPronto,
  derivarEstadoCeo,
  estimarCustoPerguntaUsd,
  infoEstado,
  permissoesEfetivas,
  traduzirErroCeo,
  validarConfigCeo,
} from "../src/lib/ceo-config.ts";
import { MODEL_PRICES, DEFAULT_CEO_MODEL } from "../supabase/functions/_shared/agent-runtime.ts";

const agente = (over = {}) => ({
  id: "a1",
  orgId: "o1",
  nome: "CEO de IA",
  cargo: "Diretor Comercial",
  departamento: "Comercial",
  descricao: null,
  especialidade: "Funil",
  avatarUrl: AVATARES_CEO[0],
  modelo: MODELO_PADRAO_CEO,
  estado: "ativo",
  killSwitch: false,
  tetoDiaUsd: 0.5,
  tetoMesUsd: 5,
  maxPassos: 4,
  ...over,
});
const carga = (a, over = {}) => ({
  agente: a,
  ferramentasConcedidas: [FERRAMENTA_RESUMO_COMERCIAL],
  gastoDiaUsd: 0,
  gastoMesUsd: 0,
  ...over,
});
const estado = (c, extra = {}) =>
  derivarEstadoCeo({ carregando: false, erroServico: false, carga: c, ...extra }).id;

test("padrões da fundação: Haiku, US$ 0,50/dia, US$ 5/mês, uma única ferramenta de leitura", () => {
  assert.equal(MODELO_PADRAO_CEO, "claude-haiku-4-5");
  assert.equal(MODELO_PADRAO_CEO, DEFAULT_CEO_MODEL);
  assert.equal(CONFIG_CEO_PADRAO.tetoDiaUsd, 0.5);
  assert.equal(CONFIG_CEO_PADRAO.tetoMesUsd, 5);
  assert.deepEqual(CONFIG_CEO_PADRAO.ferramentas, ["consultar_resumo_comercial"]);
  assert.deepEqual(validarConfigCeo(CONFIG_CEO_PADRAO), { ok: true, erros: {} });
});

test("a lista de modelos do frontend é exatamente a tabela de preços do runtime", () => {
  assert.deepEqual(MODELOS_CEO.map((m) => m.id).sort(), Object.keys(MODEL_PRICES).sort());
  for (const m of MODELOS_CEO) {
    assert.equal(m.usdEntrada, MODEL_PRICES[m.id].in);
    assert.equal(m.usdSaida, MODEL_PRICES[m.id].out);
  }
  assert.equal(MODELOS_CEO.filter((m) => m.padrao).length, 1);
});

test("limites: recusa acima dos tetos absolutos, zero, negativo, NaN e dia > mês", () => {
  const f = (o) => validarConfigCeo({ ...CONFIG_CEO_PADRAO, ...o });
  assert.ok(f({ tetoDiaUsd: TETOS_CEO.diaMaxUsd, tetoMesUsd: TETOS_CEO.mesMaxUsd }).ok);
  assert.ok(f({ tetoDiaUsd: 5.01, tetoMesUsd: 50 }).erros.tetoDiaUsd);
  assert.ok(f({ tetoMesUsd: 50.01 }).erros.tetoMesUsd);
  assert.ok(f({ tetoDiaUsd: 0 }).erros.tetoDiaUsd);
  assert.ok(f({ tetoDiaUsd: -1 }).erros.tetoDiaUsd);
  assert.ok(f({ tetoDiaUsd: Number.NaN }).erros.tetoDiaUsd);
  assert.ok(f({ tetoDiaUsd: 3, tetoMesUsd: 2 }).erros.tetoMesUsd);
});

test("validação: identidade, modelo fora da lista, avatar externo e ferramenta não disponível", () => {
  const f = (o) => validarConfigCeo({ ...CONFIG_CEO_PADRAO, ...o });
  assert.ok(f({ nome: "  " }).erros.nome);
  assert.ok(f({ nome: "x".repeat(81) }).erros.nome);
  assert.ok(f({ cargo: "" }).erros.cargo);
  assert.ok(f({ descricao: "x".repeat(501) }).erros.descricao);
  assert.ok(f({ modelo: "gpt-9" }).erros.modelo);
  assert.ok(f({ avatarUrl: "https://evil.example/a.png" }).erros.avatarUrl);
  assert.ok(f({ ferramentas: ["enviar_whatsapp"] }).erros.ferramentas);
  assert.ok(f({ ferramentas: [FERRAMENTA_RESUMO_COMERCIAL, "run_sql"] }).erros.ferramentas);
  assert.ok(f({ ferramentas: [] }).ok, "sem ferramenta é salvável (mas não ativável)");
});

test("estimativa de custo por pergunta: Haiku é o mais barato e modelo desconhecido é null", () => {
  const haiku = estimarCustoPerguntaUsd("claude-haiku-4-5");
  assert.ok(haiku > 0 && haiku < 0.01);
  assert.ok(estimarCustoPerguntaUsd("claude-opus-4-8") > haiku);
  assert.equal(estimarCustoPerguntaUsd("inexistente"), null);
});

test("estados: serviço indisponível e carregando vêm antes de qualquer outro", () => {
  assert.equal(
    derivarEstadoCeo({ carregando: true, erroServico: false, carga: null }).id,
    "carregando",
  );
  assert.equal(
    derivarEstadoCeo({ carregando: false, erroServico: true, carga: carga(agente()) }).id,
    "servico_indisponivel",
  );
  assert.equal(
    derivarEstadoCeo({ carregando: false, erroServico: false, carga: null }).id,
    "servico_indisponivel",
  );
});

test("estados: nunca configurado, configurado (pronto p/ ativar), inativo (incompleto), ativo, pausado", () => {
  assert.equal(
    estado({ agente: null, ferramentasConcedidas: [], gastoDiaUsd: 0, gastoMesUsd: 0 }),
    "nao_configurado",
  );
  assert.equal(estado(carga(agente({ estado: "inativo" }))), "configurado");
  assert.equal(
    estado(carga(agente({ estado: "inativo" }), { ferramentasConcedidas: [] })),
    "inativo",
  );
  assert.equal(estado(carga(agente({ estado: "inativo", cargo: null }))), "inativo");
  assert.equal(estado(carga(agente({ estado: "ativo" }))), "ativo");
  assert.equal(estado(carga(agente({ estado: "pausado" }))), "pausado");
});

test("estados: kill-switch bloqueia mesmo com agente ativo e vence os demais", () => {
  assert.equal(estado(carga(agente({ killSwitch: true }))), "bloqueado");
  assert.equal(estado(carga(agente({ killSwitch: true, modelo: "x" }))), "bloqueado");
});

test("estados: limite atingido (dia ou mês) só quando ativo", () => {
  assert.equal(estado(carga(agente(), { gastoDiaUsd: 0.5 })), "limite_atingido");
  assert.equal(estado(carga(agente(), { gastoMesUsd: 5 })), "limite_atingido");
  assert.equal(estado(carga(agente(), { gastoDiaUsd: 0.49 })), "ativo");
  assert.equal(estado(carga(agente({ estado: "pausado" }), { gastoDiaUsd: 9 })), "pausado");
});

test("estados: configuração incoerente vira erro de configuração (nunca 'ativo')", () => {
  assert.equal(estado(carga(agente({ modelo: "modelo-removido" }))), "erro_configuracao");
  assert.equal(estado(carga(agente({ tetoDiaUsd: 9 }))), "erro_configuracao");
  assert.equal(estado(carga(agente({ tetoDiaUsd: 3, tetoMesUsd: 2 }))), "erro_configuracao");
  assert.equal(
    estado(carga(agente({ estado: "ativo" }), { ferramentasConcedidas: [] })),
    "erro_configuracao",
  );
  assert.equal(estado(carga(agente({ estado: "ativo", cargo: null }))), "erro_configuracao");
});

test("Copiloto real só fica pronto com a flag LIGADA e o CEO ATIVO", () => {
  const ativo = infoEstado("ativo");
  assert.equal(copilotoRealPronto(true, ativo), true);
  assert.equal(copilotoRealPronto(false, ativo), false);
  for (const id of [
    "carregando",
    "servico_indisponivel",
    "nao_configurado",
    "erro_configuracao",
    "bloqueado",
    "limite_atingido",
    "pausado",
    "configurado",
    "inativo",
  ]) {
    assert.equal(copilotoRealPronto(true, infoEstado(id)), false, id);
  }
});

test("os 9 estados pedidos existem com rótulo e descrição", () => {
  for (const id of [
    "nao_configurado",
    "configurado",
    "inativo",
    "ativo",
    "pausado",
    "bloqueado",
    "limite_atingido",
    "erro_configuracao",
    "servico_indisponivel",
  ]) {
    const e = infoEstado(id);
    assert.ok(e.rotulo && e.descricao, id);
  }
});

test("erros do backend: tabela/função ausente = serviço indisponível (nunca sucesso simulado)", () => {
  assert.equal(
    traduzirErroCeo({
      code: "PGRST205",
      message: "Could not find the table 'public.agents' in the schema cache",
    }).indisponivel,
    true,
  );
  assert.equal(
    traduzirErroCeo({
      code: "PGRST202",
      message: "Could not find the function public.agent_consumo_org",
    }).indisponivel,
    true,
  );
  assert.equal(
    traduzirErroCeo({ code: "42P01", message: 'relation "agents" does not exist' }).indisponivel,
    true,
  );
  assert.equal(traduzirErroCeo({ message: "TypeError: Failed to fetch" }).indisponivel, true);
});

test("erros do backend: regras humanas viram mensagens claras e não indisponibilidade", () => {
  const casos = {
    governanca_exige_sessao_humana: /sessão humana/,
    sem_permissao_na_organizacao: /administradores e gerentes/,
    ceo_sem_ferramenta: /ferramenta/,
    kill_switch_ligado: /kill-switch/,
    limites_incoerentes: /incoerentes/,
    modelo_nao_permitido: /Modelo/,
  };
  for (const [codigo, re] of Object.entries(casos)) {
    const r = traduzirErroCeo({ message: codigo });
    assert.match(r.mensagem, re, codigo);
    assert.equal(r.indisponivel, false, codigo);
  }
  assert.match(
    traduzirErroCeo({ message: "violates check constraint agents_teto_usd_dia_check" }).mensagem,
    /limites/i,
  );
  assert.equal(traduzirErroCeo(undefined).mensagem, "Não foi possível concluir a operação.");
});

test("autonomia exibida: somente leitura, sem envio, sem prospecção, execução manual, kill-switch", () => {
  const mapa = Object.fromEntries(permissoesEfetivas().map((p) => [p.rotulo, p.valor]));
  assert.equal(mapa["Acesso aos dados"], "Somente leitura");
  assert.equal(mapa["Envio externo (WhatsApp/e-mail)"], "Nenhum");
  assert.equal(mapa["Prospecção automática"], "Nenhuma");
  assert.equal(mapa["Alteração de leads"], "Nenhuma");
  assert.match(mapa["Execução"], /Manual/);
  assert.match(mapa["Kill-switch"], /Disponível/);
  assert.equal(permissoesEfetivas().length, 8);
});
