// BATERIA DE TESTES do Flow Leads — roda de verdade, contra o ambiente REAL (edges em produção
// + banco). Não mocka nada que devia ser integração. Uso:  node scripts/bateria.mjs
//
// BLOCO 1 — lógica pura (rápido, sem rede): as regras que impedem mentira e gasto descontrolado.
// BLOCO 2 — edges reais (com o JWT do dono): os portões de disparo, exclusão de chip e automação.
// BLOCO 3 — integridade do banco: nada marcado como enviado sem envio, chip principal intacto.
//
// Sai com código 1 se qualquer caso falhar.
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
const { build } = require("esbuild");
const { createClient } = require("@supabase/supabase-js");

// ---------- env ----------
for (const l of readFileSync(join(PROJ, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}
const URL = process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DONO = "marcosg1.pereira@gmail.com";

// ---------- placar ----------
let pass = 0,
  fail = 0;
const falhas = [];
const T = (cond, nome, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${nome}`);
  } else {
    fail++;
    falhas.push(nome);
    console.log(`  \x1b[31m✗\x1b[0m ${nome}${extra ? ` → ${extra}` : ""}`);
  }
};
const bloco = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

// ---------- carrega as libs TS reais (bundle, sem mock) ----------
const stub = {
  name: "stub",
  setup(b) {
    b.onResolve({ filter: /^https?:\/\/|^npm:|^node:/ }, (a) => ({ path: a.path, namespace: "s" }));
    b.onLoad({ filter: /.*/, namespace: "s" }, () => ({
      contents: "export const createClient=()=>({});export default {};",
      loader: "js",
    }));
  },
};
async function carregarLibs() {
  const dir = mkdtempSync(join(tmpdir(), "bateria-"));
  const entry = join(dir, "entry.ts");
  writeFileSync(
    entry,
    `
    export { interpretarEnvio } from ${JSON.stringify(join(PROJ, "supabase/functions/_shared/wa.ts"))};
    export * from ${JSON.stringify(join(PROJ, "src/lib/automacao-teto.ts"))};
    export { extrairBairro } from ${JSON.stringify(join(PROJ, "src/lib/bairro.ts"))};
    export * from ${JSON.stringify(join(PROJ, "src/lib/wa-copy.ts"))};
    export * from ${JSON.stringify(join(PROJ, "src/lib/fontes-prospeccao.ts"))};
  `,
  );
  const out = join(dir, "libs.mjs");
  const res = await build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "neutral",
    write: false,
    plugins: [stub],
    logLevel: "silent",
  });
  writeFileSync(out, res.outputFiles[0].text, "utf8");
  return import(pathToFileURL(out).href);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function jwtDono() {
  const { data: lk } = await admin.auth.admin.generateLink({ type: "magiclink", email: DONO });
  const an = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: se } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  return { jwt: se.session.access_token, uid: lk.user.id };
}
const chamarEdge = (fn, body, jwt, extraHeaders = {}) =>
  fetch(`${URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: "Bearer " + jwt } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

// ============================ BLOCO 1 — LÓGICA PURA ============================
async function bloco1(L) {
  bloco("BLOCO 1 — lógica pura (as regras que impedem mentira e gasto descontrolado)");

  console.log(" · envio nunca cego (interpretarEnvio)");
  T(L.interpretarEnvio(true, 200, { data: { Id: "X" } }).ok === true, "200 limpo → enviado");
  T(
    L.interpretarEnvio(true, 200, { error: "the store doesn't contain a device JID" }).ok === false,
    "200 COM erro no corpo → NÃO enviado",
  );
  T(L.interpretarEnvio(true, 200, { success: false }).ok === false, "success:false → NÃO enviado");
  T(L.interpretarEnvio(true, 200, { status: "error" }).ok === false, "status:error → NÃO enviado");
  T(
    L.interpretarEnvio(true, 200, { raw: "not logged in" }).ok === false,
    "'not logged in' → NÃO enviado",
  );
  T(L.interpretarEnvio(false, 500, {}).ok === false, "HTTP 500 → NÃO enviado");
  T(L.interpretarEnvio(false, 401, {}).ok === false, "HTTP 401 → NÃO enviado");

  console.log(" · teto de gasto da automação (planejarRodada / estourou)");
  const base = {
    leads_por_rodada: 20,
    max_leads_rodada: 20,
    max_leads_mes: 200,
    max_usd_rodada: 5,
    max_usd_mes: 50,
    custo_lead_usd: 0.004,
    leads_mes: 0,
    gasto_mes_usd: 0,
  };
  T(L.planejarRodada(base).podeRodar === true, "receita nova pode rodar");
  T(
    L.planejarRodada({ ...base, leads_mes: 200 }).podeRodar === false,
    "teto MENSAL de leads bate → não roda",
  );
  T(
    L.planejarRodada({ ...base, gasto_mes_usd: 50 }).podeRodar === false,
    "teto MENSAL de US$ bate → não roda",
  );
  T(
    L.planejarRodada({ ...base, max_usd_rodada: 0.01 }).podeRodar === false,
    "teto/rodada não cobre 1 lead → não roda",
  );
  const plano = L.planejarRodada({ ...base, max_usd_rodada: 1 });
  T(
    plano.leadsPermitidos === Math.floor(1 / (0.004 + 0.08)),
    `US$1/rodada limita a ${plano.leadsPermitidos} leads (custo real por lead)`,
  );
  T(
    L.planejarRodada({ ...base, leads_mes: 195 }).leadsPermitidos === 5,
    "sobra do mês limita a rodada (5)",
  );
  T(L.estourou(5, 0, base) === true, "gasto da rodada == teto → estourou");
  T(L.estourou(1, 49.5, base) === true, "gasto do mês + rodada == teto → estourou");
  T(L.estourou(1, 0, base) === false, "dentro dos dois tetos → segue");
  T(
    L.precisaZerarMes("2026-06", new Date("2026-07-15T00:00:00Z")) === true,
    "mês virou → zera contadores",
  );
  T(
    L.precisaZerarMes("2026-07", new Date("2026-07-15T00:00:00Z")) === false,
    "mesmo mês → mantém contadores",
  );

  console.log(" · bairro extraído do endereço (nunca inventa)");
  T(
    L.extrairBairro("Rua Mateus Leme, 1481 - São Francisco, Curitiba - PR, 80510-192") ===
      "São Francisco",
    "endereço completo → bairro certo",
  );
  T(L.extrairBairro("Rua X - Centro") === "Centro", "formato curto → bairro certo");
  T(L.extrairBairro("") === null, "endereço vazio → null (não inventa)");
  T(L.extrairBairro(null) === null, "endereço nulo → null");
  T(L.extrairBairro("Rua Sem Bairro 123") === null, "sem separador → null");

  console.log(" · copy do WhatsApp (nunca inventa nota, reveza variações)");
  const comNota = { business_name: "X", rating: 4.8, review_count: 30 };
  const semNota = { business_name: "X", rating: null, review_count: 0 };
  T(L.temNotaValida(comNota) === true, "nota 4.8 com avaliações → válida");
  T(L.temNotaValida({ rating: 3.9, review_count: 10 }) === false, "nota abaixo do piso → inválida");
  T(L.temNotaValida({ rating: 4.9, review_count: 0 }) === false, "nota sem avaliação → inválida");
  T(
    L.variacaoElegivel("Vi que tem {{nota}} no Google", semNota) === false,
    "variação que cita nota NÃO vai pra quem não tem nota",
  );
  T(
    L.variacaoElegivel("Olá {{nome}}", semNota) === true,
    "variação sem nota vai pra qualquer lead",
  );
  const vars = [
    { id: "a", texto: "Oi {{nome}}", ativa: true },
    { id: "b", texto: "Olá {{nome}}", ativa: true },
    { id: "c", texto: "Ei {{nome}}", ativa: false },
  ];
  const eleg = L.variacoesElegiveis(vars, semNota);
  T(eleg.length === 2 && !eleg.find((v) => v.id === "c"), "variação desativada fica de fora");
  const primeira = L.escolherVariacao(eleg, "lead-1");
  const segunda = L.escolherVariacao(eleg, "lead-1", primeira.id);
  T(segunda.id !== primeira.id, "NUNCA repete a variação anterior (anti-bloqueio)");
  T(
    L.resolverVariaveis("Olá {{nome}}", { business_name: "Bar do Zé" }).includes("Bar do Zé"),
    "{{nome}} resolve pro nome do negócio",
  );
  T(
    !L.resolverVariaveis("Nota {{nota}}", semNota).includes("undefined"),
    "variável sem dado não vira 'undefined' no texto",
  );

  console.log(" · fontes de prospecção (Maps/Instagram/LinkedIn) — UI pronta, coleta honesta");
  T(L.FONTES.google_maps.estado === "ativa", "Google Maps é a única fonte ATIVA");
  T(
    L.FONTES.instagram.estado === "em_breve" && L.FONTES.linkedin.estado === "em_breve",
    "Instagram e LinkedIn marcados 'em breve' (não fingem que buscam)",
  );
  T(
    !!L.FONTES.instagram.aviso && !!L.FONTES.linkedin.aviso,
    "as duas fontes frágeis carregam aviso honesto sobre a coleta",
  );
  T(!L.fonteAtiva("instagram") && !L.fonteAtiva("linkedin"), "fonteAtiva() barra as duas");

  const ig = L.buscaInstagramPadrao();
  T(L.validarInstagram(ig).ok === false, "Instagram sem termo → inválido");
  T(L.validarInstagram({ ...ig, termo: "odonto" }).ok === true, "Instagram com hashtag → válido");
  T(
    L.validarInstagram({ ...ig, modo: "seguidores", termo: "@perfil ruim!" }).ok === false,
    "@ de concorrente inválido é recusado",
  );
  T(
    L.pedidoInstagram({ ...ig, termo: "#Odonto ", cidade: " Curitiba " }).termo === "Odonto",
    "pedido do Instagram limpa # e espaços",
  );

  const li = L.buscaLinkedInPadrao();
  T(L.validarLinkedIn(li).ok === false, "LinkedIn sem cargo → inválido");
  T(
    L.validarLinkedIn({ ...li, cargo: "Sócio" }).ok === false,
    "LinkedIn só com cargo ainda é amplo demais → inválido",
  );
  T(
    L.validarLinkedIn({ ...li, cargo: "Sócio", regiao: "Curitiba" }).ok === true,
    "LinkedIn com cargo + região → válido",
  );

  // MESMO PIPELINE: cada fonte vira uma linha da MESMA tabela `leads`.
  const leadIg = L.instagramParaLead({
    username: "@clinicax",
    nome: "Clínica X",
    linkBio: "https://linktr.ee/x",
    email: "c@x.com",
    categoria: "Odontologia",
  });
  T(leadIg.place_id === "ig:clinicax", "Instagram → place_id 'ig:<user>' (dedup do mesmo jeito)");
  T(
    leadIg.instagram_url === "https://instagram.com/clinicax" &&
      leadIg.business_name === "Clínica X",
    "Instagram → colunas existentes de leads (instagram_url/business_name)",
  );
  T(
    leadIg.email === "c@x.com" && leadIg.website === "https://linktr.ee/x",
    "e-mail e link da bio mapeados",
  );

  const leadLi = L.linkedinParaLead({
    slug: "joao-silva",
    nome: "João Silva",
    empresa: "Acme",
    setor: "Odontologia",
  });
  T(leadLi.place_id === "li:joao-silva", "LinkedIn → place_id 'li:<slug>'");
  T(
    leadLi.owner_name === "João Silva" && leadLi.business_name === "Acme",
    "LinkedIn → pessoa em owner_name, empresa em business_name",
  );
  T(leadIg.status === "new" && leadLi.status === "new", "ambos entram como 'new' no MESMO funil");
  T(
    L.CAMPOS_SEM_COLUNA.length === 2,
    "gaps declarados sem fingir (seguidores e cargo ainda precisam de coluna)",
  );
}

// ============================ BLOCO 2 — EDGES REAIS ============================
async function bloco2() {
  bloco("BLOCO 2 — edges REAIS em produção (portões de disparo, chip e automação)");
  const { jwt, uid } = await jwtDono();
  const limpar = [];

  console.log(" · autenticação obrigatória");
  let r = await chamarEdge("send-proposal-wa", {}, null);
  T(r.status === 401, "send-proposal-wa sem JWT → 401", String(r.status));
  r = await chamarEdge("wa-chips", { acao: "listar" }, null);
  T(r.status === 401, "wa-chips sem JWT → 401", String(r.status));

  console.log(" · portão do disparo (não envia e não marca sem chip usável)");
  const ins = async (t, row) => {
    const { data, error } = await admin.from(t).insert(row).select("id").single();
    if (error) throw new Error(`${t}: ${error.message}`);
    return data;
  };
  const lead = await ins("leads", {
    user_id: uid,
    business_name: "[BATERIA] lead",
    city: "Curitiba",
    whatsapp: "5541999990009",
    place_id: "bateria:" + Date.now(),
    status: "new",
  });
  limpar.push(() => admin.from("leads").delete().eq("id", lead.id));
  const rd = await ins("redesigns", { user_id: uid, lead_id: lead.id, status: "pronto" });
  limpar.push(() => admin.from("redesigns").delete().eq("id", rd.id));
  const site = await ins("sites_publicados", {
    user_id: uid,
    lead_id: lead.id,
    redesign_id: rd.id,
    slug: "bateria-" + Date.now(),
    url_publica: "https://exemplo.com/site/bateria",
    status: "publicado",
  });
  limpar.push(() => admin.from("sites_publicados").delete().eq("id", site.id));
  const prop = await ins("propostas", {
    user_id: uid,
    lead_id: lead.id,
    site_id: site.id,
    status: "aprovada",
    assunto: "[bateria]",
    corpo: "[bateria]",
  });
  limpar.push(() => admin.from("propostas").delete().eq("id", prop.id));
  const camp = await ins("campanhas", {
    user_id: uid,
    nome: "[BATERIA]",
    status: "ativa",
    canal: "whatsapp",
    wa_config: { variacoes: [{ id: "v1", texto: "Olá {{nome}} {{link}}", ativa: true }] },
  });
  limpar.push(() => admin.from("campanhas").delete().eq("id", camp.id));
  const cl = await ins("campanha_leads", {
    user_id: uid,
    campanha_id: camp.id,
    lead_id: lead.id,
    estado: "aprovado",
    proposta_id: prop.id,
  });
  limpar.push(() => admin.from("campanha_leads").delete().eq("id", cl.id));

  r = await chamarEdge("send-proposal-wa", { campanha_lead_id: cl.id }, jwt);
  T(
    r.body?.reason === "sem_chip",
    "sem chip de disparo → bloqueia (sem_chip)",
    JSON.stringify(r.body),
  );

  const fantasma = await ins("wa_instancias", {
    user_id: uid,
    nome: "[BATERIA] fantasma",
    funcao: "disparo",
    status: "conectado",
    numero: null,
    ordem: 80,
  });
  limpar.push(() => admin.from("wa_instancias").delete().eq("id", fantasma.id));
  r = await chamarEdge("send-proposal-wa", { campanha_lead_id: cl.id }, jwt);
  T(
    r.body?.reason === "sem_chip",
    "chip 'conectado' NUNCA pareado não conta → sem_chip",
    JSON.stringify(r.body),
  );
  await admin.from("wa_instancias").delete().eq("id", fantasma.id);

  const naoLogado = await ins("wa_instancias", {
    user_id: uid,
    nome: "[BATERIA] naologado",
    funcao: "disparo",
    status: "conectado",
    numero: "5541900001111",
    ordem: 81,
  });
  limpar.push(() => admin.from("wa_instancias").delete().eq("id", naoLogado.id));
  await admin
    .from("wa_instancia_tokens")
    .insert({ instancia_id: naoLogado.id, token: "bateria-token-" + Date.now() });
  r = await chamarEdge("send-proposal-wa", { campanha_lead_id: cl.id }, jwt);
  T(
    r.body?.reason === "chip_desconectado",
    "chip pareado mas NÃO logado → chip_desconectado",
    JSON.stringify(r.body),
  );

  const { count: env } = await admin
    .from("wa_envios")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", lead.id);
  const { data: ld } = await admin.from("leads").select("status").eq("id", lead.id).single();
  T((env ?? 0) === 0, "nenhum envio registrado nas tentativas bloqueadas");
  T(ld.status === "new", "lead NÃO foi marcado como enviado", ld.status);

  console.log(" · exclusão de chip (protege histórico e pareamento)");
  const simples = await ins("wa_instancias", {
    user_id: uid,
    nome: "[BATERIA] simples",
    funcao: "disparo",
    status: "desconectado",
    numero: null,
    ordem: 82,
  });
  r = await chamarEdge("wa-chips", { acao: "excluir", instancia_id: simples.id }, jwt);
  T(r.body?.ok === true, "chip sem histórico → exclui");
  const { data: sumiu } = await admin
    .from("wa_instancias")
    .select("id")
    .eq("id", simples.id)
    .maybeSingle();
  T(!sumiu, "chip realmente sumiu do banco");

  const comHist = await ins("wa_instancias", {
    user_id: uid,
    nome: "[BATERIA] comhist",
    funcao: "disparo",
    status: "desconectado",
    numero: null,
    ordem: 83,
  });
  limpar.push(() => admin.from("wa_instancias").delete().eq("id", comHist.id));
  const { data: envio } = await admin
    .from("wa_envios")
    .insert({ user_id: uid, lead_id: lead.id, instancia_id: comHist.id, mensagem: "x" })
    .select("id")
    .single();
  r = await chamarEdge("wa-chips", { acao: "excluir", instancia_id: comHist.id }, jwt);
  T(r.body?.motivo === "tem_historico", "chip COM histórico → recusa (preserva a prova)");
  const { count: aindaTem } = await admin
    .from("wa_envios")
    .select("id", { count: "exact", head: true })
    .eq("instancia_id", comHist.id);
  T((aindaTem ?? 0) === 1, "histórico de envios intacto após a recusa");
  if (envio) await admin.from("wa_envios").delete().eq("id", envio.id);

  const pareado = await ins("wa_instancias", {
    user_id: uid,
    nome: "[BATERIA] pareado",
    funcao: "disparo",
    status: "conectado",
    numero: "5541900002222",
    ordem: 84,
  });
  limpar.push(() => admin.from("wa_instancias").delete().eq("id", pareado.id));
  r = await chamarEdge("wa-chips", { acao: "excluir", instancia_id: pareado.id }, jwt);
  T(r.body?.motivo === "pareado_precisa_confirmar", "chip pareado → exige confirmação explícita");
  r = await chamarEdge(
    "wa-chips",
    { acao: "excluir", instancia_id: pareado.id, confirmar: true },
    jwt,
  );
  T(r.body?.ok === true, "com confirmação → exclui");

  r = await chamarEdge(
    "wa-chips",
    { acao: "excluir", instancia_id: "00000000-0000-0000-0000-000000000000" },
    jwt,
  );
  T(r.body?.motivo === "nao_encontrado", "id de outra org/forjado → negado (isolamento)");

  console.log(" · automação (cron protegido e teto respeitado)");
  r = await chamarEdge("automacao-rodar", {}, null);
  T(r.status === 401, "automacao-rodar sem credencial → 401");
  r = await chamarEdge("automacao-rodar", {}, null, { "x-cron-secret": "errado" });
  T(r.status === 401, "cron com segredo ERRADO → 401");

  for (const f of limpar.reverse()) {
    try {
      await f();
    } catch {
      /* já removido */
    }
  }
}

// ============================ BLOCO 3 — INTEGRIDADE ============================
async function bloco3() {
  bloco("BLOCO 3 — integridade do banco (o Kanban não pode mentir)");
  const { data: u } = await admin.auth.admin.listUsers();
  const dono = u.users.find((x) => x.email === DONO);

  const { count: envios } = await admin
    .from("wa_envios")
    .select("id", { count: "exact", head: true })
    .eq("user_id", dono.id);
  const { count: marcados } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", dono.id)
    .eq("status", "proposta_enviada");
  T(
    (marcados ?? 0) <= (envios ?? 0),
    `nenhum lead 'enviado' sem envio real (marcados=${marcados}, envios=${envios})`,
  );

  const { data: fl } = await admin
    .from("wa_instancias")
    .select("funcao, status, numero")
    .eq("nome", "flowleads")
    .maybeSingle();
  T(fl?.funcao === "conversa", "flowleads segue como CONVERSA (nunca dispara a frio)", fl?.funcao);
  T(!!fl?.numero, "flowleads segue pareado", String(fl?.numero));

  const { data: grupos } = await admin
    .from("wa_mensagens")
    .select("numero")
    .like("numero", "1203%")
    .limit(1);
  T((grupos ?? []).length === 0, "nenhuma mensagem de GRUPO guardada como conversa de lead");

  const { count: semContato } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", dono.id)
    .eq("sem_contato", true);
  const { count: total } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", dono.id);
  T((total ?? 0) > 0, `base de leads presente (${total} leads, ${semContato} sem contato)`);
}

// ============================ RUN ============================
const t0 = Date.now();
console.log("\x1b[1mBATERIA FLOW LEADS\x1b[0m — ambiente real (edges em produção + banco)\n");
try {
  const L = await carregarLibs();
  await bloco1(L);
  await bloco2();
  await bloco3();
} catch (e) {
  fail++;
  falhas.push("ERRO FATAL: " + e.message);
  console.error("\n\x1b[31mERRO FATAL\x1b[0m", e);
}
const seg = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n\x1b[1mRESULTADO\x1b[0m  ${pass} passaram · ${fail} falharam  (${seg}s)`);
if (fail) {
  console.log("\nFalhas:");
  for (const f of falhas) console.log("  - " + f);
}
process.exit(fail ? 1 : 0);
