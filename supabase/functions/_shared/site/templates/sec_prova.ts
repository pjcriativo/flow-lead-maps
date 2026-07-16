// SEÇÃO PROVA SOCIAL — 3 variantes ESTRUTURAIS (d.provaVar). Faixa escura (depoimento brilha no
// escuro) nos 2 climas; o clima escuro-premium acrescenta dourado/serif via cssEscuro.
//
// REGRA INVIOLÁVEL — sem dado, sem invenção:
//   - estrela/nota só quando há valor REAL (d.rating / review.rating). Nunca estrela vazia.
//   - número só real (avaliações). Nada inventado.
//   - sem depoimento E sem nota → a seção é OMITIDA (a barra de prova real, com categoria/nº
//     de serviços/cidade, já cobre — não se fabrica depoimento nem nota).
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { estrelas, fmtNota, fmtReviews } from "../comuns.ts";
import type { NichoCfg } from "./premium.ts";

type Bloco = { html: string; css: string; cssEscuro: string };
const rev = (i: number) => ` style="--d:${i * 90}ms"`;
const inicial = (n: string | null) => (n ? n.trim().charAt(0).toUpperCase() : "★");
const corta = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

function head(cfg: NichoCfg): string {
  return `<div class="sec-head reveal"><span class="kicker">${icone("message-circle")} ${esc(cfg.depoKicker)}</span><h2>${esc(cfg.depoTitulo)}</h2><p>${esc(cfg.depoSub)}</p></div>`;
}
// linha "★★★★★ 4,9 · N avaliações no Google" — SÓ quando há nota real.
function resumoNota(d: SiteData): string {
  if (d.rating == null) return "";
  const revs = fmtReviews(d.reviews);
  return `<div class="pv-resumo">${estrelas(d.rating, 18)}<b>${fmtNota(d.rating)}</b><span>${revs ? revs + " avaliações no Google" : "avaliação no Google"}</span></div>`;
}
function autor(r: SiteData["depoimentos"][number]): string {
  return `<div class="who">${r.photo ? `<img class="av" src="${esc(r.photo)}" alt="${esc(r.author ?? "")}" loading="lazy">` : `<span class="av">${esc(inicial(r.author))}</span>`}<div><b>${esc(r.author ?? "Cliente")}</b><span class="gsel">${icone("check-circle")} via Google${r.when ? " · " + esc(r.when) : ""}</span></div></div>`;
}

const BASE = `
.pv{background:var(--escura);color:#fff}
.pv .sec-head h2{color:#fff}.pv .sec-head p{color:#9fb3c8}.pv .kicker{background:rgba(255,255,255,.1);color:#ffd76a}
.pv .st svg,.pv-resumo svg{color:#ffc94d}
.pv .who{display:flex;align-items:center;gap:12px}
.pv .av{width:44px;height:44px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,var(--primaria),var(--secundaria));display:grid;place-items:center;color:#fff;font-weight:700;font-family:'Plus Jakarta Sans';flex:none}
.pv .who b{font-size:.95rem;color:#fff;display:block}.pv .who span{font-size:.78rem;color:#9fb3c8;display:flex;align-items:center;gap:5px}
.pv .who span svg{width:13px;height:13px;color:#42c98a}`;
const BASE_ESC = `
.pv{background:var(--breu)}
.pv .kicker{background:none;color:var(--ouro)}
.pv .st svg,.pv-resumo svg{color:var(--ouro2)}
.pv .av{background:linear-gradient(135deg,var(--ouro2),var(--ouro));color:#17130a}`;

/* --------- V0 — GRID DE CARTÕES (3 col; nota no cabeçalho) --------- */
const CSS_V0 = `
.pv0-resumo{display:flex;justify-content:center;margin:-24px auto 40px}
.pv-resumo{display:inline-flex;align-items:center;gap:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:11px 22px;border-radius:999px}
.pv-resumo b{font-size:1.25rem;font-family:'Plus Jakarta Sans'}.pv-resumo span{color:#9fb3c8;font-size:.9rem}
.pv0{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.pv0 .d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:26px;transition:transform .2s,background .2s}
.pv0 .d:hover{transform:translateY(-5px);background:rgba(255,255,255,.07)}
.pv0 .d .q{color:#e6eef5;font-size:.98rem;line-height:1.6;margin:12px 0 18px}
@media(max-width:900px){.pv0{grid-template-columns:1fr 1fr}}@media(max-width:560px){.pv0{grid-template-columns:1fr}}`;
const CSS_V0_ESC = `
.pv-resumo{background:rgba(201,162,75,.08);border-color:rgba(201,162,75,.25)}.pv-resumo b{font-family:'Playfair Display',serif;color:var(--ouro2)}
.pv0 .d{background:linear-gradient(160deg,var(--card1),var(--card2));border-color:rgba(201,162,75,.14)}
.pv0 .d:hover{border-color:rgba(201,162,75,.4)}`;
function v0(d: SiteData, cfg: NichoCfg): Bloco {
  const cards = d.depoimentos
    .slice(0, 6)
    .map(
      (r, i) =>
        `<div class="d reveal"${rev(i % 3)}>${r.rating != null ? `<div class="st">${estrelas(r.rating, 16)}</div>` : ""}<p class="q">"${esc(corta(r.text, 240))}"</p>${autor(r)}</div>`,
    )
    .join("");
  const resumo = resumoNota(d) ? `<div class="pv0-resumo">${resumoNota(d)}</div>` : "";
  return {
    html: `<section id="prova-social" class="pv"><div class="wrap">${head(cfg)}${resumo}<div class="pv0">${cards}</div></div></section>`,
    css: CSS_V0,
    cssEscuro: CSS_V0_ESC,
  };
}

/* ---- V1 — NOTA EM DESTAQUE (coluna) + FAIXA de depoimentos ---- */
const CSS_V1 = `
.pv1{display:grid;grid-template-columns:.85fr 1.15fr;gap:52px;align-items:start}
.pv1 .lado{position:sticky;top:100px}
.pv1 .big{font-family:'Plus Jakarta Sans';font-weight:800;font-size:clamp(3.4rem,7vw,5rem);line-height:1;color:#fff}
.pv1 .lado .st{margin:12px 0 8px}.pv1 .lado .cap{color:#9fb3c8;font-size:.98rem}
.pv1 .lado .barra{margin-top:26px;padding-top:22px;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:12px}
.pv1 .lado .barra .li{display:flex;align-items:center;gap:10px;color:#cdd9e5;font-size:.95rem}.pv1 .lado .barra .li svg{width:18px;height:18px;color:#42c98a}
.pv1 .col{display:flex;flex-direction:column;gap:16px}
.pv1 .d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-left:3px solid var(--primaria);border-radius:16px;padding:22px 26px;transition:transform .2s,background .2s}
.pv1 .d:hover{transform:translateX(5px);background:rgba(255,255,255,.07)}
.pv1 .d .q{color:#e6eef5;font-size:1rem;line-height:1.6;margin:10px 0 16px}
@media(max-width:820px){.pv1{grid-template-columns:1fr;gap:32px}.pv1 .lado{position:static}}`;
const CSS_V1_ESC = `
.pv1 .big{font-family:'Playfair Display',serif;color:var(--ouro2)}
.pv1 .d{background:linear-gradient(160deg,var(--card1),var(--card2));border-color:rgba(201,162,75,.14);border-left-color:var(--ouro)}
.pv1 .d:hover{border-color:rgba(201,162,75,.4);border-left-color:var(--ouro2)}
.pv1 .lado .barra{border-top-color:rgba(201,162,75,.18)}`;
function v1(d: SiteData, cfg: NichoCfg): Bloco {
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  // "lado" = nota REAL quando existe; senão elemento REAL (categoria/serviços/local).
  const lado =
    d.rating != null
      ? `<div class="big">${fmtNota(d.rating)}</div><div class="st">${estrelas(d.rating, 20)}</div><p class="cap">${fmtReviews(d.reviews) ? fmtReviews(d.reviews) + " avaliações reais no Google" : "avaliação no Google"}</p>`
      : `<div class="big">${esc(d.categoriaLabel)}</div><p class="cap">${d.servicos.length ? d.servicos.length + " " + esc(cfg.termoServicos) : "atendimento dedicado"}${local ? " · " + esc(local) : ""}</p>`;
  const barra = [
    `<div class="li">${icone("check-circle")} ${esc(d.categoriaLabel)}</div>`,
    local ? `<div class="li">${icone("map-pin")} ${esc(local)}</div>` : "",
    d.servicos.length
      ? `<div class="li">${icone("award")} ${d.servicos.length} ${esc(cfg.termoServicos)}</div>`
      : "",
  ].join("");
  const cards = d.depoimentos
    .slice(0, 4)
    .map(
      (r, i) =>
        `<div class="d reveal"${rev(i % 2)}>${r.rating != null ? `<div class="st">${estrelas(r.rating, 16)}</div>` : ""}<p class="q">"${esc(corta(r.text, 260))}"</p>${autor(r)}</div>`,
    )
    .join("");
  return {
    html: `<section id="prova-social" class="pv"><div class="wrap">${head(cfg)}<div class="pv1"><div class="lado reveal">${lado}<div class="barra">${barra}</div></div><div class="col">${cards}</div></div></div></section>`,
    css: CSS_V1,
    cssEscuro: CSS_V1_ESC,
  };
}

/* ------ V2 — CITAÇÃO EDITORIAL em destaque + apoio ------ */
const CSS_V2 = `
.pv2 .destaque{max-width:860px;margin:0 auto;text-align:center;position:relative;padding:0 20px}
.pv2 .destaque .mark{font-family:'Playfair Display',Georgia,serif;font-size:5rem;line-height:.7;color:color-mix(in srgb,var(--primaria) 60%,#fff);opacity:.55}
.pv2 .destaque .q{font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.4rem,2.8vw,2rem);line-height:1.5;color:#fff;margin:6px 0 22px}
.pv2 .destaque .st{display:flex;justify-content:center;margin-bottom:14px}
.pv2 .destaque .who{justify-content:center}
.pv2 .apoio{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:56px;padding-top:44px;border-top:1px solid rgba(255,255,255,.1)}
.pv2 .apoio .d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:22px}
.pv2 .apoio .d .q{color:#cdd9e5;font-size:.92rem;line-height:1.55;margin:8px 0 14px}
@media(max-width:820px){.pv2 .apoio{grid-template-columns:1fr}}`;
const CSS_V2_ESC = `
.pv2 .destaque .mark{color:var(--ouro);opacity:.6}
.pv2 .destaque .q{color:#f4ecdd}
.pv2 .apoio{border-top-color:rgba(201,162,75,.18)}
.pv2 .apoio .d{background:linear-gradient(160deg,var(--card1),var(--card2));border-color:rgba(201,162,75,.14)}`;
function v2(d: SiteData, cfg: NichoCfg): Bloco {
  const [main, ...resto] = d.depoimentos;
  const destaque = main
    ? `<div class="destaque reveal"><div class="mark">“</div>${main.rating != null ? `<div class="st">${estrelas(main.rating, 20)}</div>` : ""}<p class="q">${esc(corta(main.text, 320))}</p>${autor(main)}</div>`
    : "";
  const apoio = resto.slice(0, 3).length
    ? `<div class="apoio">${resto
        .slice(0, 3)
        .map(
          (r, i) =>
            `<div class="d reveal"${rev(i % 3)}>${r.rating != null ? `<div class="st">${estrelas(r.rating, 14)}</div>` : ""}<p class="q">"${esc(corta(r.text, 180))}"</p>${autor(r)}</div>`,
        )
        .join("")}</div>`
    : "";
  return {
    html: `<section id="prova-social" class="pv pv2"><div class="wrap">${head(cfg)}${destaque}${apoio}</div></section>`,
    css: CSS_V2,
    cssEscuro: CSS_V2_ESC,
  };
}

const V: Array<(d: SiteData, cfg: NichoCfg) => Bloco> = [v0, v1, v2];

/**
 * Bloco de PROVA SOCIAL da variante escolhida (d.provaVar).
 * - com depoimentos → renderiza a variante (nota real no cabeçalho quando existe).
 * - sem depoimento mas COM nota → cai na v1 (nota em destaque, sem cartões inventados).
 * - sem nota E sem depoimento → OMITE (a barra de prova real já cobre; nada fabricado).
 */
export function blocoProva(d: SiteData, cfg: NichoCfg): Bloco {
  let b: Bloco;
  if (!d.depoimentos.length) {
    if (d.rating == null) return { html: "", css: "", cssEscuro: "" };
    b = v1(d, cfg); // só a coluna da nota real (o .col fica vazio, sem inventar depoimento)
  } else {
    b = V[d.provaVar](d, cfg);
  }
  // Prepend o CSS BASE (compartilhado pelas 3 variantes) ao CSS da variante.
  return { html: b.html, css: BASE + b.css, cssEscuro: BASE_ESC + b.cssEscuro };
}
