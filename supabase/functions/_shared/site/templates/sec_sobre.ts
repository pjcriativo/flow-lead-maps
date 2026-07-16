// SEÇÃO SOBRE — 3 variantes ESTRUTURAIS (d.sobreVar). Usa d.fotoSobre (resolverFotoSet já a
// escolhe DIFERENTE do hero e, sem foto real boa, cai no banco curado do nicho). Os números e
// o selo de nota só aparecem com NOTA REAL (sem invenção). Clima entra por cssEscuro.
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { estrelas, fmtNota, fmtReviews, ctaHref } from "../comuns.ts";
import type { NichoCfg } from "./premium.ts";

type Bloco = { html: string; css: string; cssEscuro: string };
const rev = (i: number) => ` style="--d:${i * 90}ms"`;

// Números do "sobre" — só com nota REAL (senão vazio; nada inventado).
function nums(d: SiteData): string {
  if (d.rating == null) return "";
  const revs = fmtReviews(d.reviews);
  return (
    `<div class="num"><b>${fmtNota(d.rating)}</b><span>nota no Google</span></div>` +
    (revs ? `<div class="num"><b>${revs}</b><span>avaliações</span></div>` : "") +
    (d.rating >= 4.7 ? `<div class="num"><b>Top</b><span>referência local</span></div>` : "")
  );
}
function botao(d: SiteData): string {
  return `<a class="btn btn-p" style="margin-top:26px" href="${esc(ctaHref(d))}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>`;
}
function kicker(cfg: NichoCfg): string {
  return `<span class="kicker">${icone(cfg.sobreIcon)} ${esc(cfg.sobreKicker)}</span>`;
}

const BASE = `
.sb h2{color:var(--escura)}
.sb p.tx{color:#475569;font-size:1.06rem;margin-bottom:16px;line-height:1.7}
.sb .nums{display:flex;gap:16px;margin-top:26px;flex-wrap:wrap}
.sb .num{background:var(--clara);border-radius:14px;padding:16px 20px;min-width:96px}
.sb .num b{font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.5rem;color:var(--primaria);display:block;line-height:1}
.sb .num span{font-size:.8rem;color:#64748b}
.sb .foto{overflow:hidden;box-shadow:0 28px 56px -22px rgba(15,41,66,.36)}
.sb .foto img{width:100%;height:100%;object-fit:cover;display:block}`;
const BASE_ESC = `
.sb{background:var(--breu)}
.sb h2{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#fff}
.sb p.tx{color:var(--tx2)}
.sb .num{background:rgba(201,162,75,.06);border:1px solid rgba(201,162,75,.2)}
.sb .num b{font-family:'Playfair Display',serif;color:var(--ouro2)}.sb .num span{color:var(--mut)}
.sb .foto{border:1px solid rgba(201,162,75,.25);box-shadow:0 34px 66px -28px rgba(0,0,0,.75)}`;

/* --------- V0 — SPLIT foto emoldurada (esq) + texto (dir) + selo --------- */
const CSS_V0 = `
.sb0{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.sb0 .art{position:relative}
.sb0 .foto{border-radius:22px;aspect-ratio:5/4}
.sb0 .badge{position:absolute;right:-18px;bottom:-18px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:#fff;border-radius:18px;padding:18px 22px;box-shadow:0 20px 40px -14px color-mix(in srgb,var(--primaria) 60%,transparent);text-align:center}
.sb0 .badge b{font-family:'Plus Jakarta Sans';font-size:1.8rem;display:block;line-height:1}.sb0 .badge small{font-size:.74rem;opacity:.9}
.sb0 h2{font-size:clamp(1.7rem,3vw,2.4rem);margin-bottom:18px}
@media(max-width:820px){.sb0{grid-template-columns:1fr;gap:44px}}`;
const CSS_V0_ESC = `.sb0 .badge{color:#17130a;box-shadow:0 20px 40px -14px rgba(201,162,75,.5)}.sb0 .badge b{font-family:'Playfair Display',serif}`;
function v0(d: SiteData, cfg: NichoCfg): Bloco {
  const selo =
    d.rating != null
      ? `<div class="badge"><b>${fmtNota(d.rating)}</b><small>${fmtReviews(d.reviews) ? fmtReviews(d.reviews) + " avaliações" : "Google"}</small></div>`
      : "";
  const n = nums(d);
  return {
    html: `<section id="sobre" class="sb"><div class="wrap"><div class="sb0">
<div class="art reveal"><div class="foto"><img src="${esc(d.fotoSobre)}" alt="${esc(d.nome)}" loading="lazy"></div>${selo}</div>
<div class="reveal"${rev(1)}>${kicker(cfg)}<h2>${esc(d.nome)}</h2><p class="tx">${esc(d.sobre)}</p>${n ? `<div class="nums">${n}</div>` : ""}${botao(d)}</div>
</div></div></section>`,
    css: CSS_V0,
    cssEscuro: CSS_V0_ESC,
  };
}

/* -------- V1 — texto (esq) + RETRATO editorial alto (dir) -------- */
const CSS_V1 = `
.sb1{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
.sb1 h2{font-size:clamp(1.8rem,3.2vw,2.6rem);margin-bottom:20px}
.sb1 .nums{margin-top:30px}
.sb1 .art{position:relative}
.sb1 .foto{border-radius:24px;aspect-ratio:4/5;max-width:420px;margin-left:auto}
.sb1 .art::before{content:"";position:absolute;inset:22px -22px -22px 22px;border-radius:24px;background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 20%,#fff),color-mix(in srgb,var(--secundaria) 22%,#fff));z-index:0}
.sb1 .foto{position:relative;z-index:1;border:6px solid #fff}
@media(max-width:820px){.sb1{grid-template-columns:1fr;gap:44px}.sb1 .art{order:-1;max-width:400px}.sb1 .foto{margin:0 auto}.sb1 .art::before{inset:16px -14px -14px 16px}}`;
const CSS_V1_ESC = `.sb1 .art::before{background:linear-gradient(135deg,rgba(201,162,75,.3),rgba(201,162,75,.08))}.sb1 .foto{border:6px solid var(--breu2)}`;
function v1(d: SiteData, cfg: NichoCfg): Bloco {
  const n = nums(d);
  return {
    html: `<section id="sobre" class="sb"><div class="wrap"><div class="sb1">
<div class="reveal">${kicker(cfg)}<h2>${esc(d.nome)}</h2><p class="tx">${esc(d.sobre)}</p>${n ? `<div class="nums">${n}</div>` : ""}${botao(d)}</div>
<div class="art reveal"${rev(1)}><div class="foto"><img src="${esc(d.fotoSobre)}" alt="${esc(d.nome)}" loading="lazy"></div></div>
</div></div></section>`,
    css: CSS_V1,
    cssEscuro: CSS_V1_ESC,
  };
}

/* ---- V2 — spread editorial: texto centrado + faixa de foto larga ---- */
const CSS_V2 = `
.sb2 .intro{max-width:720px;margin:0 auto;text-align:center}
.sb2 .intro h2{font-size:clamp(1.8rem,3.4vw,2.7rem);margin:0 0 18px}
.sb2 .intro .tx{margin-bottom:0}
.sb2 .faixa{position:relative;margin-top:46px;border-radius:24px;overflow:hidden;aspect-ratio:21/8}
.sb2 .faixa img{width:100%;height:100%;object-fit:cover;display:block}
.sb2 .faixa .ov{position:absolute;inset:0;background:linear-gradient(0deg,color-mix(in srgb,var(--escura) 78%,transparent),transparent 60%)}
.sb2 .faixa .nums{position:absolute;left:26px;bottom:22px;margin:0}
.sb2 .faixa .num{background:rgba(255,255,255,.14);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.25)}
.sb2 .faixa .num b{color:#fff}.sb2 .faixa .num span{color:#e6eef5}
@media(max-width:640px){.sb2 .faixa{aspect-ratio:4/3}.sb2 .faixa .nums{left:16px;bottom:16px;gap:10px}}`;
const CSS_V2_ESC = `.sb2 .faixa{border:1px solid rgba(201,162,75,.25)}.sb2 .faixa .num{background:rgba(23,19,10,.5);border-color:rgba(201,162,75,.3)}.sb2 .faixa .num b{font-family:'Playfair Display',serif;color:var(--ouro2)}`;
function v2(d: SiteData, cfg: NichoCfg): Bloco {
  const n = nums(d);
  return {
    html: `<section id="sobre" class="sb sb2"><div class="wrap">
<div class="intro reveal">${kicker(cfg)}<h2>${esc(d.nome)}</h2><p class="tx">${esc(d.sobre)}</p>${botao(d)}</div>
<div class="faixa reveal"${rev(1)}><img src="${esc(d.fotoSobre)}" alt="${esc(d.nome)}" loading="lazy"><div class="ov"></div>${n ? `<div class="nums">${n}</div>` : ""}</div>
</div></section>`,
    css: CSS_V2,
    cssEscuro: CSS_V2_ESC,
  };
}

const V: Array<(d: SiteData, cfg: NichoCfg) => Bloco> = [v0, v1, v2];

/** Bloco SOBRE da variante escolhida (d.sobreVar). Vazio se não há texto "sobre". */
export function blocoSobre(d: SiteData, cfg: NichoCfg): Bloco {
  if (!d.sobre) return { html: "", css: "", cssEscuro: "" };
  const b = V[d.sobreVar](d, cfg);
  return { html: b.html, css: BASE + b.css, cssEscuro: BASE_ESC + b.cssEscuro };
}
