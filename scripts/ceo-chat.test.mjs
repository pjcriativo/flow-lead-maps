// Suite: chat real com o CEO (Tela 10) — lógica pura e contrato da interface.
// Invariante: o chat nunca inventa resposta nem vira "demonstrativo" com o Copiloto real ligado; sem CEO ou
// provedor explica o motivo e mostra o caminho; o texto do CEO é renderizado como texto (sem HTML); o
// histórico só aparece com o backend publicado; os botões "Conversar com CEO" levam à Tela 10.
// Boundary IN: src/lib/ceo-chat.ts e texto dos componentes. Boundary OUT: render no navegador e a Edge.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ATALHOS_INICIAIS,
  LIMITE_MENSAGEM,
  agruparPorData,
  blocosDeTexto,
  bloqueioDoChat,
  grupoDaData,
  planoComoTexto,
  trechosDe,
} from "../src/lib/ceo-chat.ts";
import { MSG_CONFIGURAR_PROVEDOR } from "../src/lib/ia-config.ts";

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const plano = {
  nome: "Automação WhatsApp para clínicas",
  nicho: "Saúde",
  subnicho: "Odontologia",
  produto: "Automação de WhatsApp",
  publico_alvo: "Donos de clínicas",
  regiao: "Curitiba",
  papeis: ["Gerente Comercial", "SDR"],
  orcamento_usd_mes: 8,
  estrategia: { icp: "Clínicas com 3+ cadeiras", metas_leads: "200 leads" },
};

test("bloqueio: provedor sem conexão vem ANTES de qualquer estado e usa a mensagem exata pedida", () => {
  for (const estado of ["ativo", "nao_configurado", "inativo"]) {
    const b = bloqueioDoChat({ estado, provedorPronto: false });
    assert.equal(b.motivo, MSG_CONFIGURAR_PROVEDOR);
    assert.equal(b.acao, null);
  }
  assert.equal(
    MSG_CONFIGURAR_PROVEDOR,
    "Configure um provedor de IA no Super Admin para ativar o CEO.",
  );
});

test("bloqueio: cada estado do CEO tem motivo em português e o caminho direto; só 'ativo' libera o chat", () => {
  assert.equal(bloqueioDoChat({ estado: "ativo", provedorPronto: true }), null);
  const caminhos = {
    nao_configurado: "configurar_ceo",
    inativo: "configurar_ceo",
    configurado: "configurar_ceo",
    pausado: "configurar_ceo",
    bloqueado: "configurar_ceo",
    limite_atingido: "configurar_ceo",
    erro_configuracao: "configurar_ceo",
    servico_indisponivel: "tentar_novamente",
    carregando: null,
  };
  for (const [estado, acao] of Object.entries(caminhos)) {
    const b = bloqueioDoChat({ estado, provedorPronto: true });
    assert.ok(b, estado);
    assert.equal(b.acao, acao, estado);
    assert.ok(b.motivo.length > 10, estado);
    if (acao) assert.ok(b.rotuloAcao, estado);
  }
});

test("atalhos iniciais: 5 opções pedidas; as que precisam de dados só preenchem, as completas enviam", () => {
  assert.deepEqual(
    ATALHOS_INICIAIS.map((a) => a.rotulo),
    [
      "Criar estratégia de prospecção",
      "Montar equipe comercial",
      "Planejar a semana",
      "Consultar resultados",
      "Analisar o CRM",
    ],
  );
  const estrategia = ATALHOS_INICIAIS.find((a) => a.id === "estrategia");
  assert.equal(estrategia.enviarAgora, false);
  assert.match(estrategia.texto, /\[nicho\]/);
  for (const a of ATALHOS_INICIAIS.filter((x) => x.enviarAgora)) {
    assert.doesNotMatch(a.texto, /\[/, `${a.id} não pode enviar placeholder`);
    assert.ok(a.texto.length <= LIMITE_MENSAGEM);
  }
});

test("texto do CEO: títulos, listas, negrito e código viram blocos; HTML nunca é interpretado", () => {
  const b = blocosDeTexto(
    "## Plano\nIntro com **destaque**.\n\n- um\n- dois\n\n1. passo\n2) outro\n\n```\ncodigo\n```\n<script>alert(1)</script>",
  );
  assert.deepEqual(
    b.map((x) => x.tipo),
    ["titulo", "paragrafo", "lista", "lista", "codigo", "paragrafo"],
  );
  assert.deepEqual(b[1].trechos, [
    { texto: "Intro com ", negrito: false },
    { texto: "destaque", negrito: true },
    { texto: ".", negrito: false },
  ]);
  assert.equal(b[2].ordenada, false);
  assert.equal(b[3].ordenada, true);
  assert.equal(b[3].itens.length, 2);
  // o <script> permanece TEXTO dentro de um trecho (o React o escapa)
  assert.equal(b[5].trechos[0].texto, "<script>alert(1)</script>");
  assert.deepEqual(trechosDe("a **b** c"), [
    { texto: "a ", negrito: false },
    { texto: "b", negrito: true },
    { texto: " c", negrito: false },
  ]);
  assert.deepEqual(blocosDeTexto(""), []);
});

test("histórico: agrupa por data (hoje, ontem, 7 dias, anteriores) na ordem certa", () => {
  const agora = new Date("2026-10-28T15:00:00");
  assert.equal(grupoDaData("2026-10-28T01:00:00", agora), "Hoje");
  assert.equal(grupoDaData("2026-10-27T23:00:00", agora), "Ontem");
  assert.equal(grupoDaData("2026-10-23T10:00:00", agora), "Últimos 7 dias");
  assert.equal(grupoDaData("2026-09-01T10:00:00", agora), "Anteriores");
  const g = agruparPorData(
    [
      { atualizado_em: "2026-09-01T10:00:00" },
      { atualizado_em: "2026-10-28T09:00:00" },
      { atualizado_em: "2026-10-27T09:00:00" },
    ],
    agora,
  );
  assert.deepEqual(
    g.map((x) => x.grupo),
    ["Hoje", "Ontem", "Anteriores"],
  );
});

test("plano copiável: traz nicho, produto, região, agentes, orçamento e estratégia, sem campos vazios", () => {
  const t = planoComoTexto(plano);
  for (const trecho of [
    "Automação WhatsApp para clínicas",
    "Saúde / Odontologia",
    "Curitiba",
    "Gerente Comercial, SDR",
    "Orçamento mensal (US$): 8",
    "icp: Clínicas com 3+ cadeiras",
    "metas leads: 200 leads",
  ])
    assert.ok(t.includes(trecho), trecho);
  assert.doesNotMatch(planoComoTexto({ ...plano, subnicho: undefined }), /\/ undefined/);
});

// ───────────────────────────── contrato da interface ─────────────────────────────
test("Tela 10: com o Copiloto real ligado renderiza SÓ o chat real (sem respostas estáticas nem cards fictícios)", () => {
  const v = ler("src/components/agentes/CopilotoCeoView.tsx");
  assert.match(v, /if \(CEO_IA_REAL_HABILITADO\) \{\s*return \(\s*<CeoChatReal/);
  const chat = ler("src/components/agentes/CeoChatReal.tsx");
  assert.doesNotMatch(
    chat,
    /demonstra|MENSAGENS_CHAT_INICIAIS|CONVERSAS_RECENTES|PLANO_VENDAS|unsplash/i,
    "chat sem dados fictícios",
  );
  assert.match(chat, /perguntarAoCeo\(/);
});

test("chat: Enter envia, Shift+Enter quebra linha, campo sempre visível, erro com 'tentar de novo' idempotente", () => {
  const chat = ler("src/components/agentes/CeoChatReal.tsx");
  assert.match(chat, /e\.key === "Enter" && !e\.shiftKey/);
  assert.match(chat, /e\.preventDefault\(\);\s*void enviar\(texto\)/);
  assert.match(chat, /aria-label="Mensagem para o CEO"/);
  assert.match(chat, /aria-label="Enviar"/);
  assert.match(chat, /Tentar de novo/);
  // o reenvio reutiliza o MESMO clientMessageId (a Edge deduplica: sem custo duplicado)
  assert.match(chat, /reenvioClientId \?\? crypto\.randomUUID\(\)/);
  assert.match(chat, /role="status"/);
  assert.match(chat, /Nova conversa/);
  assert.match(chat, /navigator\.clipboard/);
  // só 'ativo' conversa; senão mostra motivo com caminho
  assert.match(chat, /const podeConversar = bloqueio === null/);
  assert.match(chat, /disabled=\{!podeConversar\}/);
  // layout: ocupa a tela toda e o compositor fica fora da área rolável
  assert.match(chat, /h-\[100dvh\]/);
  assert.match(chat, /flex min-h-0 flex-1/);
  assert.match(chat, /lg:hidden/); // histórico recolhível no celular
});

test("chat: ações do CEO com governança — aprovar usa as RPCs humanas; nada é executado/enviado pelo cartão", () => {
  const chat = ler("src/components/agentes/CeoChatReal.tsx");
  assert.match(chat, /decidirPropostaOperacao\(a\.aprovacao_id, aprovar\)/);
  assert.match(chat, /decidirPropostaEquipe\(a\.aprovacao_id, aprovar\)/);
  for (const rotulo of [
    "Plano de Operação Comercial",
    "Ajustar estratégia",
    "Aprovar plano",
    "Ver operação",
    "Consultar equipe",
  ])
    assert.ok(chat.includes(rotulo), rotulo);
  assert.match(
    chat,
    /Não cria agentes, não concede permissões e não executa nenhuma ação\s+externa/,
  );
  assert.doesNotMatch(chat, /conceder|habilitarDelegacao|processarFila|enviarMensagem/);
});

test("botões 'Conversar com CEO' (Telas 01, 02 e 03) abrem a Tela 10 com o contexto do CEO", () => {
  const host = ler("src/components/agentes/AgentesAutomacoesView.tsx");
  assert.match(
    host,
    /onClick=\{\(\) => mudarTela\("copiloto", "ceo"\)\}\s*className="flex h-10 items-center justify-center gap-1\.5 rounded-xl bg-\[#f95d14\]/,
  );
  assert.equal(
    (host.match(/onConversarCeo=\{\(\) => mudarTela\("copiloto", "ceo"\)\}/g) ?? []).length,
    2,
  );
  for (const f of ["PerfilAgenteView", "EquipeAgentesView"]) {
    const src = ler(`src/components/agentes/${f}.tsx`);
    assert.match(src, /onConversarCeo/);
    assert.match(src.replace(/\s+/g, " "), /<span>Conversar com CEO<\/span>/);
  }
});

test("persistência e retrocompatibilidade: histórico só com flag + backend; sem a migration segue só na sessão", () => {
  const svc = ler("src/services/agente-ceo.ts");
  assert.match(svc, /VITE_CEO_CHAT === "true"/);
  assert.match(svc, /\.\.\.\(input\.persistir \? \{ persistir: true \} : \{\}\)/);
  const conv = ler("src/services/agente-conversas.ts");
  assert.match(conv, /if \(!CEO_CHAT_PERSISTENTE_HABILITADO\) return \{ disponivel: false \}/);
  assert.match(conv, /recursoAusente\(error\)\) return \{ disponivel: false \}/);
  assert.match(conv, /\.eq\("org_id", orgId\)/);
  assert.doesNotMatch(conv + svc, /localStorage|sessionStorage/);
  const chat = ler("src/components/agentes/CeoChatReal.tsx");
  assert.match(chat, /histórico salvo ainda não está disponível/);
  assert.match(chat, /setHistoricoDisponivel\(false\)/);
});
