// SEÇÃO CONTATO — 3 variantes ESTRUTURAIS (escolhidas por semente em d.contatoVar).
// Mantém o que funciona: WhatsApp real (wa.me), telefone (tel:), endereço + "Como chegar"
// (Google Maps) e o mapa embed (iframe sem API key). A estrutura é independente do nicho:
// usa as variáveis de tema e devolve `cssEscuro` que o premium.ts sobrepõe no clima
// escuro-premium. Nunca chama IA — lê só o SiteData. Sem dado → o item some (nada inventado).
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { ctaHref } from "../comuns.ts";
import type { NichoCfg } from "./premium.ts";

type Bloco = { html: string; css: string; cssEscuro: string };
const rev = (i: number) => ` style="--d:${i * 90}ms"`;

type Item = {
  ic: string;
  lb: string;
  vl: string;
  go: { href: string; t: string; ext: boolean } | null;
};

// Só itens com DADO REAL entram (endereço/telefone/WhatsApp). Nada é fabricado.
function itens(d: SiteData): Item[] {
  const out: Item[] = [];
  if (d.endereco)
    out.push({
      ic: "map-pin",
      lb: "Endereço",
      vl: d.endereco,
      go: d.mapsUrl ? { href: d.mapsUrl, t: "Como chegar →", ext: true } : null,
    });
  if (d.telefone)
    out.push({
      ic: "phone",
      lb: "Telefone",
      vl: d.telefone,
      go: d.telUrl ? { href: d.telUrl, t: "Ligar →", ext: false } : null,
    });
  if (d.whatsappUrl)
    out.push({
      ic: "message-circle",
      lb: "WhatsApp",
      vl: "Atendimento rápido",
      go: { href: d.whatsappUrl, t: "Chamar agora →", ext: true },
    });
  return out;
}
const goHtml = (g: Item["go"]) =>
  g
    ? `<a class="go" href="${esc(g.href)}"${g.ext ? ' target="_blank" rel="noopener"' : ""}>${g.t}</a>`
    : "";
const linhaHtml = (it: Item) =>
  `<div class="linha"><div class="ic">${icone(it.ic)}</div><div><div class="lb">${esc(it.lb)}</div><div class="vl">${esc(it.vl)}</div>${goHtml(it.go)}</div></div>`;

function botao(d: SiteData): string {
  return `<a class="btn btn-p" href="${esc(ctaHref(d))}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>`;
}
function head(cfg: NichoCfg): string {
  return `<div class="sec-head reveal"><span class="kicker">${icone("map-pin")} ${esc(cfg.localKicker)}</span><h2>${esc(cfg.localTitulo)}</h2></div>`;
}
function mapaFrame(d: SiteData): string {
  return d.mapEmbedUrl
    ? `<iframe src="${esc(d.mapEmbedUrl)}" loading="lazy" title="Mapa — ${esc(d.nome)}" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    : "";
}

const BASE = `
.ct h2{color:var(--escura)}
.ct .linha{display:flex;gap:14px;align-items:flex-start}
.ct .linha .ic{width:46px;height:46px;flex:0 0 46px;border-radius:12px;background:color-mix(in srgb,var(--primaria) 12%,#fff);color:var(--primaria);display:grid;place-items:center}
.ct .linha .ic svg{width:22px;height:22px}
.ct .linha .lb{font-size:.76rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700}
.ct .linha .vl{color:var(--escura);font-weight:600;font-size:1.02rem;margin-top:2px}
.ct .linha a.go{display:inline-block;margin-top:4px;color:var(--primaria);font-weight:700;font-size:.9rem;text-decoration:none}
.ct .linha a.go:hover{text-decoration:underline}
.ct .mapa{border-radius:20px;overflow:hidden;box-shadow:0 20px 44px -22px rgba(15,41,66,.3);border:1px solid #eef2f6}
.ct .mapa iframe{width:100%;height:100%;border:0;display:block;position:relative;z-index:1}
/* placeholder de mapa (grade + pin): aparece só até o iframe do Google carregar; site lento/lazy fica com aparência de mapa, nunca um vão branco */
.ct .mapa,.ct1 .banda:not(.semmapa){position:relative;background-color:#eaeef3;background-image:radial-gradient(circle at 50% 44%,rgba(79,70,229,.1),transparent 46%),repeating-linear-gradient(0deg,rgba(148,163,184,.28) 0 1px,transparent 1px 48px),repeating-linear-gradient(90deg,rgba(148,163,184,.28) 0 1px,transparent 1px 48px)}
.ct .mapa::after,.ct1 .banda:not(.semmapa)::after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.5;background:no-repeat center/54px url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='64'%20height='64'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23475569'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M20%2010c0%206-8%2012-8%2012s-8-6-8-12a8%208%200%200%201%2016%200Z'/%3E%3Ccircle%20cx='12'%20cy='10'%20r='3'/%3E%3C/svg%3E")}`;
const BASE_ESC = `
.ct{background:var(--breu)}
.ct h2{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#fff}
.ct .linha .ic{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.3);color:var(--ouro2)}
.ct .linha .lb{color:var(--mut)}
.ct .linha .vl{color:#fff}
.ct .linha a.go{color:var(--ouro2)}
.ct .mapa{border:1px solid rgba(201,162,75,.25);filter:saturate(.92) contrast(1.03)}
.ct .mapa,.ct1 .banda:not(.semmapa){background-color:#0e1e33;background-image:radial-gradient(circle at 50% 44%,rgba(201,162,75,.12),transparent 46%),repeating-linear-gradient(0deg,rgba(201,162,75,.14) 0 1px,transparent 1px 48px),repeating-linear-gradient(90deg,rgba(201,162,75,.14) 0 1px,transparent 1px 48px)}
.ct .mapa::after,.ct1 .banda:not(.semmapa)::after{opacity:.55;background:no-repeat center/54px url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='64'%20height='64'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23c9a24b'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M20%2010c0%206-8%2012-8%2012s-8-6-8-12a8%208%200%200%201%2016%200Z'/%3E%3Ccircle%20cx='12'%20cy='10'%20r='3'/%3E%3C/svg%3E")}`;

/* --------- V0 — SPLIT: painel de contato (esq) + mapa emoldurado (dir) --------- */
const CSS_V0 = `
.ct0{display:grid;grid-template-columns:1fr 1.08fr;gap:44px;align-items:stretch}
.ct0.solo{grid-template-columns:1fr;max-width:560px;margin:0 auto}
.ct0 .painel{background:#fff;border:1px solid #eef2f6;border-radius:22px;padding:38px 34px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 24px 50px -30px rgba(15,41,66,.25)}
.ct0 .painel .lines{display:flex;flex-direction:column;gap:20px;margin-bottom:28px}
.ct0 .painel .btn{align-self:flex-start}
.ct0 .mapa{min-height:430px}
.ct0 .mapa iframe{min-height:430px}
@media(max-width:860px){.ct0{grid-template-columns:1fr;gap:26px}.ct0 .mapa,.ct0 .mapa iframe{min-height:300px}}`;
const CSS_V0_ESC = `
.ct0 .painel{background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.18);box-shadow:0 34px 66px -34px rgba(0,0,0,.7)}`;
function v0(d: SiteData, cfg: NichoCfg): Bloco {
  const its = itens(d);
  const solo = !d.mapEmbedUrl;
  return {
    html: `<section id="contato" class="ct ct0-sec"><div class="wrap">${head(cfg)}
<div class="ct0${solo ? " solo" : ""}">
<div class="painel reveal"><div class="lines">${its.map(linhaHtml).join("")}</div>${botao(d)}</div>
${d.mapEmbedUrl ? `<div class="mapa reveal"${rev(1)}>${mapaFrame(d)}</div>` : ""}
</div></div></section>`,
    css: CSS_V0,
    cssEscuro: CSS_V0_ESC,
  };
}

/* --------- V1 — MAPA em faixa larga + CARTÃO de contato sobreposto --------- */
const CSS_V1 = `
.ct1 .banda{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:21/7;min-height:340px}
.ct1 .banda iframe{width:100%;height:100%;min-height:340px;border:0;display:block;position:relative;z-index:1}
.ct1 .banda.semmapa{background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 92%,#000),color-mix(in srgb,var(--secundaria) 80%,#000))}
.ct1 .cartao{position:relative;z-index:2;margin:-96px 0 0 44px;max-width:430px;background:#fff;border:1px solid #eef2f6;border-radius:22px;padding:34px 32px;box-shadow:0 34px 66px -30px rgba(15,41,66,.42)}
.ct1 .cartao h3{font-size:1.32rem;color:var(--escura);margin-bottom:22px}
.ct1 .cartao .lines{display:flex;flex-direction:column;gap:18px;margin-bottom:26px}
.ct1 .cartao .btn{width:100%;justify-content:center}
@media(max-width:860px){.ct1 .banda{aspect-ratio:16/10;min-height:250px}.ct1 .banda iframe{min-height:250px}.ct1 .cartao{margin:-72px auto 0;max-width:none}}`;
const CSS_V1_ESC = `
.ct1 .cartao{background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.22);box-shadow:0 40px 74px -32px rgba(0,0,0,.82)}
.ct1 .cartao h3{color:#fff;font-family:'Playfair Display',Georgia,serif;font-weight:700}
.ct1 .banda.semmapa{background:linear-gradient(135deg,#13233d,#0a1626)}`;
function v1(d: SiteData, cfg: NichoCfg): Bloco {
  const its = itens(d);
  return {
    html: `<section id="contato" class="ct ct1-sec"><div class="wrap">${head(cfg)}
<div class="ct1">
<div class="banda${d.mapEmbedUrl ? "" : " semmapa"} reveal">${mapaFrame(d)}</div>
<div class="cartao reveal"${rev(1)}><h3>${esc(d.nome)}</h3><div class="lines">${its.map(linhaHtml).join("")}</div>${botao(d)}</div>
</div></div></section>`,
    css: CSS_V1,
    cssEscuro: CSS_V1_ESC,
  };
}

/* --------- V2 — CENTRADO editorial: chips de contato + mapa em faixa --------- */
const CSS_V2 = `
.ct2 .sec-head{text-align:center;margin-left:auto;margin-right:auto}
.ct2 .chips{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:960px;margin:0 auto}
.ct2 .chips.c2{grid-template-columns:repeat(2,1fr);max-width:640px}
.ct2 .chips.c1{grid-template-columns:1fr;max-width:380px}
.ct2 .chip{background:#fff;border:1px solid #eef2f6;border-radius:18px;padding:30px 24px;text-align:center;transition:transform .2s,box-shadow .2s,border-color .2s}
.ct2 .chip:hover{transform:translateY(-6px);box-shadow:0 24px 48px -24px rgba(15,41,66,.3);border-color:color-mix(in srgb,var(--primaria) 34%,#eef2f6)}
.ct2 .chip .ic{width:54px;height:54px;border-radius:14px;margin:0 auto 16px;background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 16%,#fff),color-mix(in srgb,var(--secundaria) 14%,#fff));color:var(--primaria);display:grid;place-items:center}
.ct2 .chip .ic svg{width:26px;height:26px}
.ct2 .chip .lb{font-size:.76rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700}
.ct2 .chip .vl{color:var(--escura);font-weight:700;margin-top:6px;font-size:1.02rem}
.ct2 .chip a.go{display:inline-block;margin-top:8px;color:var(--primaria);font-weight:700;font-size:.9rem;text-decoration:none}
.ct2 .chip a.go:hover{text-decoration:underline}
.ct2 .acao{text-align:center;margin-top:34px}
.ct2 .mapa{margin-top:42px;aspect-ratio:21/7;min-height:300px}
.ct2 .mapa iframe{min-height:300px}
@media(max-width:760px){.ct2 .chips,.ct2 .chips.c2{grid-template-columns:1fr;max-width:420px}.ct2 .mapa{aspect-ratio:16/10}}`;
const CSS_V2_ESC = `
.ct2 .chip{background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.16)}
.ct2 .chip:hover{border-color:rgba(201,162,75,.5);box-shadow:0 30px 60px -30px rgba(0,0,0,.7)}
.ct2 .chip .ic{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.32);color:var(--ouro2)}
.ct2 .chip .lb{color:var(--mut)}
.ct2 .chip .vl{color:#fff}
.ct2 .chip a.go{color:var(--ouro2)}`;
function v2(d: SiteData, cfg: NichoCfg): Bloco {
  const its = itens(d);
  const cls = its.length >= 3 ? "" : its.length === 2 ? " c2" : " c1";
  const chip = (it: Item) =>
    `<div class="chip reveal"><div class="ic">${icone(it.ic)}</div><div class="lb">${esc(it.lb)}</div><div class="vl">${esc(it.vl)}</div>${goHtml(it.go)}</div>`;
  return {
    html: `<section id="contato" class="ct ct2-sec"><div class="wrap"><div class="ct2">${head(cfg)}
${its.length ? `<div class="chips${cls}">${its.map(chip).join("")}</div>` : ""}
<div class="acao reveal"${rev(1)}>${botao(d)}</div>
${d.mapEmbedUrl ? `<div class="mapa reveal"${rev(2)}>${mapaFrame(d)}</div>` : ""}
</div></div></section>`,
    css: CSS_V2,
    cssEscuro: CSS_V2_ESC,
  };
}

const V: Array<(d: SiteData, cfg: NichoCfg) => Bloco> = [v0, v1, v2];

/** Bloco de CONTATO da variante escolhida (d.contatoVar). Vazio se não há endereço nem mapa. */
export function blocoContato(d: SiteData, cfg: NichoCfg): Bloco {
  if (!d.endereco && !d.mapEmbedUrl) return { html: "", css: "", cssEscuro: "" };
  const b = V[d.contatoVar](d, cfg);
  return { html: b.html, css: BASE + b.css, cssEscuro: BASE_ESC + b.cssEscuro };
}
