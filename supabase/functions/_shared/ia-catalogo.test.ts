// Suite: catálogo dinâmico da OpenAI (Prompt 47) — classificação, sincronização, preços, capacidades,
// paginação da listagem e contratos da migration 202610290001 / Edge / tela.
// Invariante: o catálogo vem da API (nada fixo); sincronizar NUNCA toca preço, ativação nem classificação
// manual; modelo de imagem/áudio nunca entra na lista de conversa; preço é sempre por 1M de tokens.
// Boundary IN: funções puras + texto dos arquivos. Boundary OUT: a OpenAI real e o Postgres de produção
// (nenhuma chamada paga; a listagem usa fetch simulado).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CAPACIDADES,
  classificarModelo,
  custoTokensUsd,
  modeloElegivelParaCeo,
  modeloServeCapacidade,
  planejarSincronizacao,
  precoSuficienteParaAtivar,
  validarPrecosExtras,
} from "./ia-catalogo.ts";
import { modelosPermitidos, type ModeloIa } from "./ai-provider.ts";
import { listarModelosOpenAI, verificarAcessoModeloOpenAI, OPENAI_BASE } from "./ai-openai.ts";
import {
  contarPorCategoria,
  filtrarCatalogo,
  montarLinha,
  opcoesModeloCeo,
  paginar,
} from "../../../src/lib/ia-catalogo-view.ts";

const raiz = fileURLToPath(new URL("../../../", import.meta.url));
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");
const resp = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });

// ───────────────────────────── classificação ─────────────────────────────
test("classifica por categoria e permite um modelo em várias categorias", () => {
  const cat = (id: string) => classificarModelo(id).categorias;
  assert.deepEqual(cat("text-embedding-3-large"), ["embeddings"]);
  assert.deepEqual(cat("omni-moderation-latest"), ["moderacao"]);
  assert.deepEqual(cat("gpt-image-1"), ["imagem"]);
  assert.deepEqual(cat("dall-e-3"), ["imagem"]);
  assert.deepEqual(cat("whisper-1"), ["audio"]);
  assert.deepEqual(cat("gpt-4o-transcribe"), ["audio"]);
  assert.deepEqual(cat("gpt-4o-mini-tts"), ["voz"]);
  assert.deepEqual(cat("tts-1-hd"), ["voz"]);
  assert.deepEqual(cat("gpt-4o-realtime-preview"), ["realtime"]);
  assert.deepEqual(cat("gpt-4o-audio-preview"), ["audio", "voz"]);
  assert.deepEqual(cat("sora-2"), ["video"]);
  assert.deepEqual(cat("o3"), ["texto", "raciocinio", "visao"]);
  assert.deepEqual(cat("gpt-4o-mini"), ["texto", "visao"]);
  assert.deepEqual(cat("gpt-3.5-turbo"), ["texto"]);
  assert.ok(cat("gpt-4o-search-preview").includes("outros"));
  assert.ok(cat("gpt-4o-search-preview").includes("texto"));
});

test("séries futuras não ganham capacidades por suposição", () => {
  const c = classificarModelo("gpt-9-turbo-2031-04-01");
  assert.deepEqual(
    c.categorias,
    ["texto"],
    "sem visão/raciocínio inventados para série desconhecida",
  );
  assert.equal(c.snapshot, "2031-04-01");
  assert.equal(c.familia, "gpt-9");
  assert.equal(classificarModelo("modelo-misterioso").categorias[0], "outros");
  assert.equal(classificarModelo("modelo-misterioso").endpoint, "desconhecido");
});

test("snapshot e família: alias não tem data", () => {
  assert.equal(classificarModelo("gpt-4.1-2025-04-14").snapshot, "2025-04-14");
  assert.equal(classificarModelo("gpt-4-0613").snapshot, "0613");
  assert.equal(classificarModelo("gpt-4.1").snapshot, null);
  assert.equal(classificarModelo("gpt-image-1").familia, "gpt-image");
});

test("chatCeo: só texto com ferramentas na Responses API", () => {
  assert.equal(classificarModelo("gpt-4o").chatCeo, true);
  for (const id of [
    "gpt-image-1",
    "whisper-1",
    "gpt-4o-mini-tts",
    "gpt-4o-realtime-preview",
    "text-embedding-3-small",
    "omni-moderation-latest",
    "gpt-4o-audio-preview",
    "sora-2",
    "gpt-4o-search-preview",
  ]) {
    assert.equal(classificarModelo(id).chatCeo, false, id);
  }
});

// ───────────────────────────── sincronização ─────────────────────────────
const AGORA = "2026-10-29T12:00:00.000Z";

test("sincronização: novos entram desligados e sem preço; existentes só recebem metadados", () => {
  const plano = planejarSincronizacao({
    existentes: [
      { id: "gpt-keep", disponibilidade: "disponivel", classificacao_origem: "inferida" },
      { id: "gpt-manual", disponibilidade: "disponivel", classificacao_origem: "manual" },
      { id: "gpt-sumiu", disponibilidade: "disponivel" },
      { id: "gpt-volta", disponibilidade: "indisponivel" },
    ],
    api: [
      { id: "gpt-keep", criadoEm: 1700000000, dono: "system" },
      { id: "gpt-manual", criadoEm: null, dono: null },
      { id: "gpt-volta", criadoEm: null, dono: null },
      { id: "gpt-novo", criadoEm: 1800000000, dono: "openai" },
      { id: "gpt-novo", criadoEm: 1800000000, dono: "openai" },
      { id: "x", criadoEm: null, dono: null },
    ],
    agora: AGORA,
    emUso: new Set(["gpt-sumiu"]),
  });
  assert.deepEqual(
    plano.novos.map((n) => n.id),
    ["gpt-novo"],
    "duplicado e id curto demais são ignorados",
  );
  assert.equal(plano.novos[0].ativo, false);
  assert.equal("usd_in_mtok" in plano.novos[0], false, "novo não traz preço");
  assert.deepEqual(plano.indisponiveis, ["gpt-sumiu"]);
  assert.deepEqual(plano.indisponiveisEmUso, ["gpt-sumiu"]);
  assert.deepEqual(plano.reaparecidos, ["gpt-volta"]);
  for (const u of plano.atualizar) {
    for (const proibido of [
      "ativo",
      "usd_in_mtok",
      "usd_out_mtok",
      "rotulo",
      "precos_extra",
      "preco_origem",
    ])
      assert.equal(proibido in u.patch, false, `${u.id} não pode alterar ${proibido}`);
  }
  const manual = plano.atualizar.find((u) => u.id === "gpt-manual")!;
  assert.equal("categorias" in manual.patch, false, "classificação manual preservada");
  const keep = plano.atualizar.find((u) => u.id === "gpt-keep")!;
  assert.ok("categorias" in keep.patch, "inferida é refeita com a regra atual");
});

// ───────────────────────────── preços e unidades ─────────────────────────────
test("custo é calculado por 1M de tokens (nunca por 1K)", () => {
  assert.equal(custoTokensUsd(1_000_000, 0, { in: 2.5, out: 10 }), 2.5);
  assert.equal(custoTokensUsd(0, 500_000, { in: 2.5, out: 10 }), 5);
  assert.equal(custoTokensUsd(1000, 1000, { in: 2.5, out: 10 }), 0.0125);
  assert.equal(custoTokensUsd(-5, -5, { in: 2.5, out: 10 }), 0);
});

test("preços adicionais: unidade explícita, validação estrita, sem duplicata", () => {
  const ok = validarPrecosExtras([
    { item: "imagem_geracao", unidade: "imagem", usd: 0.04 },
    { item: "audio_entrada", unidade: "minuto", usd: "0.006", modo: "batch" },
  ]);
  assert.ok(ok.ok && ok.precos.length === 2 && ok.precos[0].modo === "padrao");
  const falha = (v: unknown) => {
    const r = validarPrecosExtras(v);
    return r.ok ? null : r.erro;
  };
  assert.equal(falha([{ item: "x", unidade: "imagem", usd: 1 }]), "preco_item_invalido");
  assert.equal(falha([{ item: "video", unidade: "hora", usd: 1 }]), "preco_unidade_invalida");
  assert.equal(falha([{ item: "video", unidade: "segundo", usd: -1 }]), "preco_invalido");
  assert.equal(falha([{ item: "video", unidade: "segundo", usd: null }]), "preco_invalido");
  assert.equal(falha([{ item: "video", unidade: "segundo", usd: 5000 }]), "preco_invalido");
  assert.equal(
    falha([
      { item: "video", unidade: "segundo", usd: 1 },
      { item: "video", unidade: "segundo", usd: 2 },
    ]),
    "preco_duplicado",
  );
  assert.equal(falha("lixo"), "precos_extra_invalido");
  assert.ok(validarPrecosExtras(null).ok);
});

test("habilitar exige preço na unidade que o endpoint cobra", () => {
  const extra = validarPrecosExtras([{ item: "imagem_geracao", unidade: "imagem", usd: 0.04 }]);
  assert.ok(extra.ok);
  assert.equal(
    precoSuficienteParaAtivar({
      chatCeo: true,
      usd_in_mtok: 1,
      usd_out_mtok: null,
      precosExtra: [],
    }),
    false,
  );
  assert.equal(
    precoSuficienteParaAtivar({ chatCeo: true, usd_in_mtok: 1, usd_out_mtok: 2, precosExtra: [] }),
    true,
  );
  assert.equal(
    precoSuficienteParaAtivar({
      chatCeo: false,
      usd_in_mtok: null,
      usd_out_mtok: null,
      precosExtra: [],
    }),
    false,
  );
  assert.equal(
    precoSuficienteParaAtivar({
      chatCeo: false,
      usd_in_mtok: null,
      usd_out_mtok: null,
      precosExtra: extra.ok ? extra.precos : [],
    }),
    true,
  );
});

// ───────────────────────────── conversa x outras modalidades ─────────────────────────────
const modelo = (id: string, extra: Partial<ModeloIa> = {}): ModeloIa => ({
  id,
  provider: "openai",
  usdIn: 1,
  usdOut: 2,
  ativo: true,
  suportaFerramentas: true,
  ...extra,
});

test("modelo de imagem/áudio habilitado e com preço por token NÃO entra na lista de conversa", () => {
  const lista = modelosPermitidos(
    [
      modelo("gpt-4o"),
      modelo("gpt-image-1"),
      modelo("whisper-1"),
      modelo("gpt-x", { chatCeo: false }),
      modelo("gpt-sumiu", { disponibilidade: "indisponivel" }),
    ],
    new Set(["openai"]),
  );
  assert.ok(lista.includes("gpt-4o"));
  for (const id of ["gpt-image-1", "whisper-1", "gpt-x", "gpt-sumiu"])
    assert.equal(lista.includes(id), false, id);
});

test("seletor do CEO: só texto compatível, habilitado, precificado e disponível", () => {
  const base = { provider: "openai", usd_in_mtok: 1, usd_out_mtok: 2, ativo: true };
  assert.equal(modeloElegivelParaCeo({ id: "gpt-4o", ...base }), true);
  assert.equal(modeloElegivelParaCeo({ id: "gpt-image-1", ...base }), false);
  assert.equal(modeloElegivelParaCeo({ id: "gpt-4o", ...base, ativo: false }), false);
  assert.equal(modeloElegivelParaCeo({ id: "gpt-4o", ...base, usd_out_mtok: null }), false);
  assert.equal(
    modeloElegivelParaCeo({ id: "gpt-4o", ...base, disponibilidade: "indisponivel" }),
    false,
  );
  assert.equal(modeloElegivelParaCeo({ id: "gpt-4o", ...base, chat_ceo: false }), false);
  assert.equal(
    modeloElegivelParaCeo({ id: "claude-haiku-4-5", ...base, provider: "anthropic" }),
    true,
  );
});

test("capacidades independentes aceitam só modelos da categoria certa", () => {
  assert.deepEqual(
    [...CAPACIDADES],
    ["economico", "analise_complexa", "visao", "imagem", "transcricao", "voz"],
  );
  const m = (id: string) => ({
    categorias: classificarModelo(id).categorias,
    chatCeo: classificarModelo(id).chatCeo,
    ativo: true,
  });
  assert.equal(modeloServeCapacidade("economico", m("gpt-4o-mini")), true);
  assert.equal(modeloServeCapacidade("analise_complexa", m("o3")), true);
  assert.equal(modeloServeCapacidade("analise_complexa", m("gpt-4o-mini")), false);
  assert.equal(modeloServeCapacidade("visao", m("gpt-4o")), true);
  assert.equal(modeloServeCapacidade("visao", m("gpt-3.5-turbo")), false);
  assert.equal(modeloServeCapacidade("imagem", m("gpt-image-1")), true);
  assert.equal(modeloServeCapacidade("imagem", m("gpt-4o")), false);
  assert.equal(modeloServeCapacidade("transcricao", m("whisper-1")), true);
  assert.equal(modeloServeCapacidade("transcricao", m("gpt-4o-mini-tts")), false);
  assert.equal(modeloServeCapacidade("voz", m("gpt-4o-mini-tts")), true);
  assert.equal(modeloServeCapacidade("voz", m("whisper-1")), false);
});

// ───────────────────────────── listagem e acesso (fetch simulado, sem custo) ─────────────────────────────
test("listagem segue a paginação anunciada pela API e para sem laço infinito", async () => {
  const urls: string[] = [];
  const fetcher = (async (u: string) => {
    urls.push(u);
    if (!u.includes("after="))
      return resp({
        data: [{ id: "a1", created: 10, owned_by: "openai" }, { id: "a2" }],
        has_more: true,
      });
    return resp({ data: [{ id: "b1" }, { id: "a2" }], has_more: false });
  }) as unknown as typeof fetch;
  const r = await listarModelosOpenAI("sk-x".padEnd(30, "x"), { fetcher });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.ids, ["a1", "a2", "b1"], "duplicado entre páginas descartado");
    assert.equal(r.paginas, 2);
    assert.equal(r.modelos[0].criadoEm, 10);
    assert.equal(r.modelos[0].dono, "openai");
  }
  assert.equal(urls[1], `${OPENAI_BASE}/models?after=a2`);

  let chamadas = 0;
  const preso = (async () => {
    chamadas += 1;
    return resp({ data: [{ id: "mesmo" }], has_more: true });
  }) as unknown as typeof fetch;
  const r2 = await listarModelosOpenAI("sk-x".padEnd(30, "x"), { fetcher: preso });
  assert.ok(r2.ok);
  assert.equal(chamadas, 2, "segunda página sem item novo encerra o laço");
});

test("acesso ao modelo: 200 = acessível; 404 = projeto sem acesso; 403 = chave sem permissão", async () => {
  const f = (status: number) => (async () => resp({}, status)) as unknown as typeof fetch;
  assert.deepEqual(await verificarAcessoModeloOpenAI("k", "gpt-4o", { fetcher: f(200) }), {
    ok: true,
  });
  assert.deepEqual(await verificarAcessoModeloOpenAI("k", "gpt-4o", { fetcher: f(404) }), {
    ok: false,
    status: 404,
    motivo: "modelo_inacessivel_ao_projeto",
  });
  const r403 = await verificarAcessoModeloOpenAI("k", "gpt-4o", { fetcher: f(403) });
  assert.ok(!r403.ok && r403.motivo === "chave_sem_permissao");
});

// ───────────────────────────── visão da tela ─────────────────────────────
const cru = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  provider: "openai" as const,
  rotulo: null,
  usd_in_mtok: null,
  usd_out_mtok: null,
  ativo: false,
  ...extra,
});

test("linha da tela: antes da migration usa classificação inferida; estados não confundem 'listado' com 'ativo'", () => {
  const l = montarLinha(cru("gpt-4o"));
  assert.equal(l.classificacao, "inferida");
  assert.ok(l.categorias.includes("visao"));
  assert.equal(l.estado, "sem_preco", "listado pela API e sem preço NÃO é ativo");
  assert.equal(
    montarLinha(cru("gpt-4o", { usd_in_mtok: 1, usd_out_mtok: 2 })).estado,
    "configurado",
  );
  assert.equal(
    montarLinha(cru("gpt-4o", { usd_in_mtok: 1, usd_out_mtok: 2, ativo: true })).estado,
    "habilitado",
  );
  assert.equal(
    montarLinha(
      cru("gpt-4o", { usd_in_mtok: 1, usd_out_mtok: 2, ativo: true, homologado_em: AGORA }),
    ).estado,
    "homologado",
  );
  assert.equal(
    montarLinha(cru("gpt-4o", { ativo: true, disponibilidade: "indisponivel" })).estado,
    "indisponivel",
  );
  assert.equal(montarLinha(cru("gpt-image-1", { categorias: ["imagem"] })).semPreco, true);
  assert.equal(
    montarLinha(
      cru("gpt-image-1", {
        precos_extra: [{ item: "imagem_geracao", unidade: "imagem", usd: 0.04, modo: "padrao" }],
      }),
    ).semPreco,
    false,
  );
});

test("busca, filtros por categoria/status, contagem e paginação", () => {
  const linhas = [
    montarLinha(cru("gpt-4o", { ativo: true, usd_in_mtok: 1, usd_out_mtok: 2 })),
    montarLinha(cru("gpt-image-1")),
    montarLinha(cru("whisper-1", { disponibilidade: "indisponivel" })),
    montarLinha(cru("o3", { primeiro_visto_em: new Date().toISOString() })),
  ];
  const f = (o: Partial<Parameters<typeof filtrarCatalogo>[1]>) =>
    filtrarCatalogo(linhas, { busca: "", categoria: "todas", status: "todos", ...o }).map(
      (l) => l.id,
    );
  assert.deepEqual(f({ busca: "IMAGE" }), ["gpt-image-1"]);
  assert.deepEqual(f({ categoria: "imagem" }), ["gpt-image-1"]);
  assert.deepEqual(f({ categoria: "raciocinio" }), ["o3"]);
  assert.deepEqual(f({ status: "habilitados" }), ["gpt-4o"]);
  assert.deepEqual(f({ status: "indisponiveis" }), ["whisper-1"]);
  assert.deepEqual(f({ status: "novos" }), ["o3"]);
  assert.deepEqual(f({ status: "sem_preco" }).sort(), ["gpt-image-1", "o3", "whisper-1"]);
  const n = contarPorCategoria(linhas);
  assert.equal(n.todas, 4);
  assert.equal(n.visao, 2);
  assert.deepEqual(
    opcoesModeloCeo(linhas).map((l) => l.id),
    ["gpt-4o"],
  );
  const itens = Array.from({ length: 53 }, (_, i) => i);
  assert.equal(paginar(itens, 1, 25).paginas, 3);
  assert.equal(paginar(itens, 3, 25).itens.length, 3);
  assert.equal(paginar(itens, 99, 25).pagina, 3, "página fora do intervalo é limitada");
});

// ───────────────────────────── contratos de arquivo ─────────────────────────────
const migration = ler("supabase/migrations/202610290001_ia_catalogo_openai.sql");
const edge = ler("supabase/functions/admin-acoes/index.ts");
const tela = ler("src/components/admin/AdminIaProvedores.tsx");

test("migration do catálogo: idempotente, incremental e sem chamar a OpenAI", () => {
  assert.match(migration, /NÃO APLICADA EM PRODUÇÃO/);
  for (const col of [
    "disponibilidade",
    "categorias",
    "endpoint",
    "classificacao_origem",
    "chat_ceo",
    "precos_extra",
    "preco_origem",
    "homologado_em",
    "contexto_tokens",
  ])
    assert.match(migration, new RegExp(`add column if not exists ${col}\\b`), col);
  assert.match(migration, /add column if not exists modelos_por_capacidade/);
  assert.match(migration, /add column if not exists catalogo_sincronizado_em/);
  assert.equal(/\bdrop\s+(table|column)\b/i.test(migration), false, "nada destrutivo");
  assert.equal(/\bdelete\s+from\b|\btruncate\b/i.test(migration), false);
  assert.match(migration, /m\.chat_ceo and m\.disponibilidade <> 'indisponivel'/);
});

test("Edge: sincronização completa não grava preço/ativação e é protegida pelo guard do Super Admin", () => {
  const bloco = edge.slice(
    edge.indexOf('acao === "ia_catalogo_sincronizar"'),
    edge.indexOf('acao === "ia_openai_revogar"'),
  );
  assert.ok(bloco.length > 500);
  assert.match(bloco, /listarModelosOpenAI/);
  assert.match(bloco, /lista_de_modelos_vazia/);
  assert.match(bloco, /migration_catalogo_pendente/);
  assert.equal(
    /usd_in_mtok|usd_out_mtok|precos_extra/.test(bloco),
    false,
    "sincronizar não toca preços",
  );
  assert.equal(
    /ativo\s*:/.test(bloco.replace(/conexao_[a-z_]*/g, "")),
    false,
    "sincronizar não altera ativação",
  );
  assert.equal(
    /\/chat\/completions|\/responses|\/images|\/audio/.test(bloco),
    false,
    "nenhuma inferência paga",
  );
  assert.match(edge, /confirmacao_preco_necessaria/);
  assert.match(edge, /modelos_por_capacidade/);
  assert.match(edge, /verificarAcessoModeloOpenAI/);
});

test("Tela: sem lista fixa de modelos nem preço por 1K; botão chama a sincronização real", () => {
  for (const fixo of [
    "MODELOS_OPENAI_DEFAULT",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
    "dall-e-3",
    "US$ 0,48",
    "/ 1K",
    "(1K)",
  ])
    assert.equal(tela.includes(fixo), false, `não pode existir: ${fixo}`);
  assert.match(tela, /sincronizarCatalogoOpenAI/);
  assert.match(tela, /Atualizar modelos/);
  assert.match(tela, /US\$\/1M tok/);
  assert.match(tela, /Preço não configurado/);
  assert.match(tela, /Última sincronização/);
});

test("Tela: fluxo chave → verificar → modelo → CEO não fica preso e não esconde a origem da chave", () => {
  assert.match(tela, /Salvar e verificar/);
  assert.match(
    tela,
    /Chave do ambiente do servidor/,
    "chave de ambiente não é exibida como se fosse do cofre",
  );
  assert.equal(
    tela.includes("••••••••••••••••••••••••••••••••••••••••"),
    false,
    "sem máscara falsa",
  );
  assert.match(
    tela,
    /migration_catalogo_pendente[\s\S]{0,200}testarOpenAI/,
    "sem a migration cai no catálogo atual",
  );
  assert.match(tela, /garantirProvedorAtivo/, "habilitar modelo ativa o provedor");
  assert.match(tela, /Nenhum modelo elegível ainda/, "seletor vazio explica o próximo passo");
});
