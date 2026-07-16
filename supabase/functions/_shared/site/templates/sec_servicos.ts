// SEÇÃO SERVIÇOS — 3 variantes ESTRUTURAIS (escolhidas por semente em d.servVar). A estrutura
// é independente do nicho: usa as variáveis de tema (--primaria/--escura/--clara), e o módulo
// devolve `cssEscuro` que o premium.ts sobrepõe no clima escuro-premium (dourado/serif). Nunca
// chama IA — lê só o SiteData. Grade sempre 3/4/6 (nunca 5): a variante grid apara 5→4.
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import type { NichoCfg } from "./premium.ts";

type Bloco = { html: string; css: string; cssEscuro: string };
const rev = (i: number) => ` style="--d:${i * 90}ms"`;
const num2 = (i: number) => String(i + 1).padStart(2, "0");

function head(cfg: NichoCfg): string {
  return `<div class="sec-head reveal"><span class="kicker">${icone(cfg.brandIcon)} ${esc(cfg.servKicker)}</span><h2>${esc(cfg.servTitulo)}</h2><p>${esc(cfg.servSub)}</p></div>`;
}

/* ---------------- V0 — GRID EMOLDURADO (cards 3/4/6) ---------------- */
const CSS_V0 = `
.sv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.sv-grid.g4{grid-template-columns:repeat(4,1fr)}
.sv-grid.g2{grid-template-columns:repeat(2,1fr);max-width:760px;margin:0 auto}
.sv-grid .c{background:#fff;border:1px solid #eef2f6;border-radius:20px;padding:32px 28px;transition:transform .2s,box-shadow .2s,border-color .2s}
.sv-grid .c:hover{transform:translateY(-7px);box-shadow:0 26px 50px -22px rgba(15,41,66,.32);border-color:color-mix(in srgb,var(--primaria) 34%,#eef2f6)}
.sv-grid .c .ic{width:56px;height:56px;border-radius:15px;background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 16%,#fff),color-mix(in srgb,var(--secundaria) 14%,#fff));color:var(--primaria);display:grid;place-items:center;margin-bottom:20px}
.sv-grid .c .ic svg{width:27px;height:27px}
.sv-grid .c h3{font-size:1.18rem;color:var(--escura);margin-bottom:9px}
.sv-grid .c p{color:#64748b;font-size:.97rem}
@media(max-width:900px){.sv-grid,.sv-grid.g4,.sv-grid.g2{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.sv-grid,.sv-grid.g4,.sv-grid.g2{grid-template-columns:1fr}}`;
const CSS_V0_ESC = `
.sv-grid{counter-reset:serv;gap:24px}
.sv-grid .c{position:relative;overflow:hidden;background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.16);border-radius:18px;padding:40px 30px 32px}
.sv-grid .c::before{counter-increment:serv;content:counter(serv,decimal-leading-zero);position:absolute;top:18px;right:24px;font-family:'Playfair Display',serif;font-weight:700;font-size:2.7rem;line-height:1;color:rgba(201,162,75,.22);transition:color .22s}
.sv-grid .c::after{content:"";position:absolute;left:0;top:0;height:3px;width:0;background:linear-gradient(90deg,var(--ouro2),var(--ouro));transition:width .35s ease}
.sv-grid .c:hover{transform:translateY(-7px);border-color:rgba(201,162,75,.5);box-shadow:0 34px 66px -30px rgba(0,0,0,.75)}
.sv-grid .c:hover::before{color:rgba(201,162,75,.42)}.sv-grid .c:hover::after{width:100%}
.sv-grid .c .ic{width:54px;height:54px;border-radius:13px;background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.32);color:var(--ouro2);margin-bottom:22px}
.sv-grid .c h3{color:#fff;font-size:1.2rem;letter-spacing:-.01em}.sv-grid .c p{color:var(--mut)}`;

function v0(d: SiteData, cfg: NichoCfg): Bloco {
  // grade limpa: 5 vira 4 (nunca deixa buraco); 6 fica 6; 2 usa layout de 2.
  const svs = d.servicos.length === 5 ? d.servicos.slice(0, 4) : d.servicos;
  const g = svs.length === 4 ? " g4" : svs.length === 2 ? " g2" : svs.length >= 6 ? "" : "";
  const cards = svs
    .map(
      (s, i) =>
        `<div class="c reveal"${rev(i % 3)}><div class="ic">${icone(s.icone)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div>`,
    )
    .join("");
  return {
    html: `<section id="servicos"><div class="wrap">${head(cfg)}<div class="sv-grid${g}">${cards}</div></div></section>`,
    css: CSS_V0,
    cssEscuro: CSS_V0_ESC,
  };
}

/* ------------- V1 — TIMELINE NUMERADA VERTICAL (linha + nós) ------------- */
const CSS_V1 = `
.sv-tl{max-width:820px;margin:0 auto;position:relative}
.sv-tl::before{content:"";position:absolute;left:31px;top:20px;bottom:36px;width:2px;background:linear-gradient(180deg,color-mix(in srgb,var(--primaria) 55%,transparent) 0%,color-mix(in srgb,var(--primaria) 30%,transparent) 55%,transparent 100%)}
.sv-tl .step{position:relative;display:grid;grid-template-columns:64px 1fr;gap:22px;padding:14px 0 26px}
.sv-tl .step:last-child{padding-bottom:4px}
.sv-tl .n{position:relative;z-index:1;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.35rem;color:#fff;background:linear-gradient(135deg,var(--primaria),var(--secundaria));box-shadow:0 12px 26px -10px color-mix(in srgb,var(--primaria) 60%,transparent)}
.sv-tl .bd{background:#fff;border:1px solid #eef2f6;border-radius:16px;padding:22px 26px;transition:transform .2s,box-shadow .2s}
.sv-tl .bd:hover{transform:translateX(5px);box-shadow:0 18px 40px -24px rgba(15,41,66,.32)}
.sv-tl .bd .tt{display:flex;align-items:center;gap:11px;margin-bottom:6px}
.sv-tl .bd .ic{width:34px;height:34px;border-radius:9px;background:color-mix(in srgb,var(--primaria) 12%,#fff);color:var(--primaria);display:grid;place-items:center;flex:none}
.sv-tl .bd .ic svg{width:19px;height:19px}
.sv-tl .bd h3{font-size:1.14rem;color:var(--escura)}
.sv-tl .bd p{color:#64748b;font-size:.97rem}
@media(max-width:560px){.sv-tl::before{left:23px}.sv-tl .step{grid-template-columns:48px 1fr;gap:15px}.sv-tl .n{width:48px;height:48px;font-size:1.1rem}}`;
const CSS_V1_ESC = `
.sv-tl::before{background:linear-gradient(180deg,var(--ouro) 0%,rgba(201,162,75,.35) 55%,transparent 100%)}
.sv-tl .n{background:linear-gradient(135deg,var(--ouro2),var(--ouro));color:#17130a;font-family:'Playfair Display',serif;box-shadow:0 14px 30px -12px rgba(201,162,75,.5)}
.sv-tl .bd{background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.16);border-left:3px solid var(--ouro)}
.sv-tl .bd:hover{border-color:rgba(201,162,75,.4);box-shadow:0 22px 46px -28px rgba(0,0,0,.7)}
.sv-tl .bd .ic{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.3);color:var(--ouro2)}
.sv-tl .bd h3{color:#fff}.sv-tl .bd p{color:var(--mut)}`;

function v1(d: SiteData, cfg: NichoCfg): Bloco {
  const steps = d.servicos
    .map(
      (s, i) =>
        `<div class="step reveal"${rev(i % 3)}><div class="n">${num2(i)}</div><div class="bd"><div class="tt"><span class="ic">${icone(s.icone)}</span><h3>${esc(s.titulo)}</h3></div><p>${esc(s.descricao)}</p></div></div>`,
    )
    .join("");
  return {
    html: `<section id="servicos"><div class="wrap">${head(cfg)}<div class="sv-tl">${steps}</div></div></section>`,
    css: CSS_V1,
    cssEscuro: CSS_V1_ESC,
  };
}

/* ----------- V2 — ALTERNADO COM DIVISÓRIAS (linhas largas) ----------- */
const CSS_V2 = `
.sv-alt{max-width:940px;margin:0 auto}
.sv-alt .row{display:grid;grid-template-columns:1fr 1.4fr;gap:36px;align-items:center;padding:34px 0}
.sv-alt .row+.row{border-top:1px solid #eef2f6}
.sv-alt .row:nth-child(even) .side{order:2}
.sv-alt .side{display:flex;align-items:center;gap:18px}
.sv-alt .side .n{font-family:'Plus Jakarta Sans';font-weight:800;font-size:2.6rem;color:color-mix(in srgb,var(--primaria) 40%,#cbd5e1);line-height:1;flex:none}
.sv-alt .side .ic{width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:#fff;display:grid;place-items:center;flex:none}
.sv-alt .side .ic svg{width:28px;height:28px}
.sv-alt .side h3{font-size:1.34rem;color:var(--escura);line-height:1.2}
.sv-alt .row p{color:#64748b;font-size:1.03rem}
@media(max-width:720px){.sv-alt .row{grid-template-columns:1fr;gap:14px;padding:26px 0}.sv-alt .row:nth-child(even) .side{order:0}.sv-alt .side .n{font-size:2rem}}`;
const CSS_V2_ESC = `
.sv-alt .row+.row{border-top:1px solid rgba(201,162,75,.16)}
.sv-alt .side .n{font-family:'Playfair Display',serif;color:rgba(201,162,75,.5)}
.sv-alt .side .ic{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.32);color:var(--ouro2)}
.sv-alt .side h3{color:#fff;font-family:'Playfair Display',Georgia,serif;font-weight:700}
.sv-alt .row p{color:var(--tx2)}`;

function v2(d: SiteData, cfg: NichoCfg): Bloco {
  const rows = d.servicos
    .map(
      (s, i) =>
        `<div class="row reveal"${rev(i % 2)}><div class="side"><span class="n">${num2(i)}</span><span class="ic">${icone(s.icone)}</span><h3>${esc(s.titulo)}</h3></div><p>${esc(s.descricao)}</p></div>`,
    )
    .join("");
  return {
    html: `<section id="servicos"><div class="wrap">${head(cfg)}<div class="sv-alt">${rows}</div></div></section>`,
    css: CSS_V2,
    cssEscuro: CSS_V2_ESC,
  };
}

const V: Array<(d: SiteData, cfg: NichoCfg) => Bloco> = [v0, v1, v2];

/** Bloco de Serviços da variante escolhida (d.servVar). Vazio se não há serviços. */
export function blocoServicos(d: SiteData, cfg: NichoCfg): Bloco {
  if (!d.servicos.length) return { html: "", css: "", cssEscuro: "" };
  return V[d.servVar](d, cfg);
}
