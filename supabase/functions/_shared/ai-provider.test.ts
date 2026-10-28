// Suite: regras puras da Central de IA (provedor, allowlist de modelos, preço, fallback, segredos).
// Invariante: nenhum modelo é fixado no código; modelo sem preço/provedor/chave NUNCA roda; o fallback só
// entra com autorização, falha transitória e custo máximo não maior; segredos nunca saem em texto.
// Boundary IN: ai-provider.ts (sem I/O). Boundary OUT: chamadas reais à OpenAI (não há teste pago).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MODELOS_CLAUDE_PADRAO,
  classificarModelosOpenAI,
  decidirFallback,
  decidirProvedor,
  mascararChave,
  modeloOpenAICompativel,
  modeloParaPapel,
  modelosPermitidos,
  provedorDoModelo,
  redigirSegredos,
  tabelaDePrecos,
  validarFormatoChaveOpenAI,
  type ModeloIa,
  type ProviderId,
} from "./ai-provider.ts";
import { MODEL_PRICES } from "./agent-runtime.ts";

const m = (id: string, provider: ProviderId, over: Partial<ModeloIa> = {}): ModeloIa => ({
  id,
  provider,
  usdIn: 2,
  usdOut: 8,
  ativo: true,
  suportaFerramentas: true,
  ...over,
});
const set = <T>(...v: T[]) => new Set<T>(v);

test("chave OpenAI: aceita sk-/sk-proj-, recusa vazio, espaço e formato errado", () => {
  assert.equal(validarFormatoChaveOpenAI("sk-proj-" + "a".repeat(40)).ok, true);
  assert.equal(validarFormatoChaveOpenAI("  sk-" + "B".repeat(30) + "  ").ok, true); // trim
  assert.deepEqual(validarFormatoChaveOpenAI(""), { ok: false, motivo: "vazia" });
  assert.deepEqual(validarFormatoChaveOpenAI("sk-abc def ghi jkl mno pqr stu"), {
    ok: false,
    motivo: "espacos",
  });
  assert.deepEqual(validarFormatoChaveOpenAI("apify_api_xxxxxxxxxxxxxxxxxxxx"), {
    ok: false,
    motivo: "formato",
  });
  assert.deepEqual(validarFormatoChaveOpenAI("sk-curta"), { ok: false, motivo: "formato" });
});

test("proteção da chave: máscara mostra no máximo 4 caracteres; redação remove chaves de qualquer texto", () => {
  const chave = "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  assert.equal(mascararChave("6789"), "••••••••6789");
  assert.equal(mascararChave(null), null);
  assert.equal(mascararChave("sk-proj-ABCDEFGH6789"), "••••••••6789"); // nunca mais que 4
  const erro = `Incorrect API key provided: ${chave}. You can find your key at https://...`;
  const limpo = redigirSegredos(erro);
  assert.ok(!limpo.includes("ABCDEFGHIJKL"));
  assert.match(limpo, /\[segredo removido\]/);
  for (const s of [
    "Bearer abcdefghijklmnopqrstuvwxyz012345",
    "sbp_0123456789abcdef0123",
    "apify_api_ABCDEFGH1234",
    "eyJhbGciOiJIUzI1NiJ9.payload",
  ])
    assert.match(redigirSegredos(`falha ${s} fim`), /\[segredo removido\]/, s);
  assert.equal(redigirSegredos("x".repeat(1000)).length, 300);
});

test("allowlist: famílias de chat/raciocínio entram; embeddings, voz, imagem, moderação e busca ficam de fora", () => {
  const ids = [
    "gpt-futuro-9",
    "gpt-4.1-mini",
    "o7",
    "o4-mini",
    "chatgpt-4o-latest",
    "text-embedding-3-large",
    "tts-1-hd",
    "whisper-1",
    "gpt-4o-transcribe",
    "gpt-4o-audio-preview",
    "gpt-4o-realtime-preview",
    "gpt-image-1",
    "dall-e-3",
    "omni-moderation-latest",
    "gpt-4o-search-preview",
    "gpt-3.5-turbo-instruct",
    "davinci-002",
    "sora-2",
  ];
  const { compativeis, descartados } = classificarModelosOpenAI([...ids, "gpt-4.1-mini"]);
  assert.deepEqual(compativeis, [
    "chatgpt-4o-latest",
    "gpt-4.1-mini",
    "gpt-futuro-9",
    "o4-mini",
    "o7",
  ]);
  assert.equal(descartados.length, ids.length - 5);
  assert.ok(modeloOpenAICompativel("gpt-futuro-9"), "modelo novo entra sem mudar código");
});

test("nenhum modelo OpenAI fixado no código de produção (config vem do Super Admin)", () => {
  for (const arq of ["ai-provider.ts", "ai-openai.ts", "agent-edge-kit.ts"]) {
    const src = readFileSync(new URL(`./${arq}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /["'`]gpt-[0-9a-z.-]+["'`]/, `${arq} fixa um modelo gpt`);
    assert.doesNotMatch(src, /["'`]o[0-9](-[a-z]+)?["'`]/, `${arq} fixa um modelo o-series`);
  }
});

test("preço: só modelos ativos com os DOIS preços entram; sem preço é 'não precificado'", () => {
  const lista = [
    m("gpt-a", "openai"),
    m("gpt-b", "openai", { usdOut: null }),
    m("gpt-c", "openai", { ativo: false }),
  ];
  assert.deepEqual(tabelaDePrecos(lista), { "gpt-a": { in: 2, out: 8 } });
});

test("provedor do modelo: tabela da Central; sem linha, 'claude-' continua Anthropic; resto é desconhecido", () => {
  const lista = [m("gpt-a", "openai")];
  assert.equal(provedorDoModelo("gpt-a", lista), "openai");
  assert.equal(provedorDoModelo("claude-haiku-4-5", lista), "anthropic");
  assert.equal(provedorDoModelo("modelo-x", lista), null);
});

test("decidirProvedor: provedor ativo + chave no cofre + preço; qualquer falta bloqueia com motivo", () => {
  const lista = [m("gpt-a", "openai"), m("gpt-sem", "openai", { usdIn: null, usdOut: null })];
  const ok = decidirProvedor({
    modelo: "gpt-a",
    modelos: lista,
    provedoresAtivos: set<ProviderId>("openai"),
    chavesConfiguradas: set<ProviderId>("openai"),
  });
  assert.deepEqual(ok, { ok: true, provider: "openai", modelo: "gpt-a" });
  const base = {
    modelos: lista,
    provedoresAtivos: set<ProviderId>("openai"),
    chavesConfiguradas: set<ProviderId>("openai"),
  };
  assert.deepEqual(
    decidirProvedor({ ...base, modelo: "gpt-a", provedoresAtivos: set<ProviderId>("anthropic") }),
    { ok: false, reason: "provedor_desativado" },
  );
  assert.deepEqual(
    decidirProvedor({ ...base, modelo: "gpt-a", chavesConfiguradas: set<ProviderId>() }),
    { ok: false, reason: "provedor_sem_chave" },
  );
  assert.deepEqual(decidirProvedor({ ...base, modelo: "gpt-sem" }), {
    ok: false,
    reason: "modelo_nao_precificado",
  });
  assert.deepEqual(decidirProvedor({ ...base, modelo: "desconhecido" }), {
    ok: false,
    reason: "modelo_nao_configurado",
  });
});

test("compatibilidade: agente com Claude e Central ausente (sem linhas) continua rodando como antes", () => {
  const r = decidirProvedor({
    modelo: "claude-haiku-4-5",
    modelos: [],
    provedoresAtivos: set<ProviderId>("anthropic"),
    chavesConfiguradas: set<ProviderId>("anthropic"),
  });
  assert.deepEqual(r, { ok: true, provider: "anthropic", modelo: "claude-haiku-4-5" });
});

test("fallback: só autorizado, em falha transitória, com provedor/modelo prontos e outro provedor", () => {
  const lista = [m("gpt-a", "openai"), m("claude-haiku-4-5", "anthropic", { usdIn: 1, usdOut: 5 })];
  const comum = {
    cfg: { fallbackProvider: "anthropic" as ProviderId, fallbackModelo: "claude-haiku-4-5" },
    provedorAtual: "openai" as ProviderId,
    modelos: lista,
    provedoresAtivos: set<ProviderId>("openai", "anthropic"),
    chavesConfiguradas: set<ProviderId>("openai", "anthropic"),
    falhaTransitoria: true,
  };
  assert.deepEqual(decidirFallback(comum), {
    usar: true,
    provider: "anthropic",
    modelo: "claude-haiku-4-5",
  });
  assert.deepEqual(decidirFallback({ ...comum, falhaTransitoria: false }), { usar: false }); // erro permanente nunca troca
  assert.deepEqual(
    decidirFallback({ ...comum, cfg: { fallbackProvider: null, fallbackModelo: null } }),
    { usar: false },
  );
  assert.deepEqual(
    decidirFallback({ ...comum, cfg: { fallbackProvider: "openai", fallbackModelo: "gpt-a" } }),
    { usar: false },
  ); // mesmo provedor
  assert.deepEqual(decidirFallback({ ...comum, chavesConfiguradas: set<ProviderId>("openai") }), {
    usar: false,
  });
  assert.deepEqual(decidirFallback({ ...comum, provedoresAtivos: set<ProviderId>("openai") }), {
    usar: false,
  });
});

test("modelo por papel: papel → padrão global → nada; modelo fora dos permitidos é ignorado", () => {
  const cfg = {
    modeloCeo: "gpt-forte",
    modeloPadrao: "gpt-barato",
    modelosPorPapel: { sdr: "gpt-sdr" },
  };
  const permitidos = ["gpt-forte", "gpt-barato", "gpt-sdr"];
  assert.equal(modeloParaPapel("ceo", cfg, permitidos), "gpt-forte");
  assert.equal(modeloParaPapel("sdr", cfg, permitidos), "gpt-sdr");
  assert.equal(modeloParaPapel("vendedor", cfg, permitidos), "gpt-barato");
  assert.equal(modeloParaPapel("sdr", cfg, ["gpt-barato"]), "gpt-barato");
  assert.equal(
    modeloParaPapel("ceo", { ...cfg, modeloCeo: null, modeloPadrao: null }, permitidos),
    null,
  );
});

test("modelosPermitidos (TS) == regra do SQL: Claude padrão (salvo desativado) ∪ ativos+precificados de provedor ativo", () => {
  assert.deepEqual([...MODELOS_CLAUDE_PADRAO].sort(), Object.keys(MODEL_PRICES).sort());
  const lista = [
    m("gpt-a", "openai"),
    m("gpt-sem", "openai", { usdIn: null }),
    m("claude-opus-4-8", "anthropic", { ativo: false }),
  ];
  const so = modelosPermitidos(lista, set<ProviderId>("anthropic"));
  assert.ok(!so.includes("gpt-a"), "provedor desligado");
  assert.ok(!so.includes("claude-opus-4-8"), "Claude desativado na Central sai");
  assert.ok(so.includes("claude-haiku-4-5"));
  const com = modelosPermitidos(lista, set<ProviderId>("anthropic", "openai"));
  assert.ok(com.includes("gpt-a") && !com.includes("gpt-sem"));
  const sql = readFileSync(
    new URL("../../migrations/202610280001_ia_provedores_memoria_operacoes.sql", import.meta.url),
    "utf8",
  );
  assert.match(
    sql,
    /m\.ativo and p\.ativo and m\.usd_in_mtok is not null and m\.usd_out_mtok is not null/,
  );
  assert.match(
    sql,
    /not exists \(select 1 from public\.ia_modelos m where m\.id = s and not m\.ativo\)/,
  );
});
