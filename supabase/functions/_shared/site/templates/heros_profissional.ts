// HEROS PREMIUM do clima ESCURO ("profissional": advocacia/contador/consultoria).
// Padrão nível agência: FUNDO ESCURO dramático + DOURADO de destaque + TIPOGRAFIA
// SERIFADA DE DISPLAY (Playfair) grande + IMAGEM EDITORIAL integrada (do banco
// hero-premium/profissional/, escolhida por semente — nunca a foto candida do
// lead) + ornamentos finos + CTA dourado. NÃO usar em saúde/estética (clima claro).
//
// FAIXA DE AUTORIDADE: só NÚMEROS REAIS do pacote de dados (nota, nº avaliações,
// nº de áreas). Se não houver nenhum, a faixa é OMITIDA — nada inventado.
//
// Lê SOMENTE o SiteData (pacote de dados). Variante vem de d.heroVar (semente).
// Animações: reveal + parallax só na A (rAF/mobile-off no scriptAnim global).
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { estrelas, fmtNota, fmtReviews, ctaHref } from "../comuns.ts";
import type { NichoCfg } from "./premium.ts";

const rev = (i: number) => ` style="--d:${i * 90}ms"`;
const FONT =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap">';

// Paleta FIXA do clima escuro (independe das cores extraídas do lead — o padrão
// premium tem que ser consistente). Marinho/grafite profundo + dourado/âmbar.
const PREM = `
.hp{--breu:#0a1520;--breu2:#0f2033;--ouro:#c9a24b;--ouro2:#e6c87d;--claro2:#dfe7ef;--mut:#9db0c2;position:relative;overflow:hidden;color:#fff;background:var(--breu)}
.hp .selo-h{display:inline-flex;align-items:center;gap:10px;font-size:.78rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ouro2)}
.hp .selo-h .seal{width:40px;height:40px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--ouro) 70%,transparent);color:var(--ouro);display:grid;place-items:center}
.hp .selo-h .seal svg{width:20px;height:20px}
.hp h1{font-family:'Playfair Display',Georgia,serif;font-weight:800;letter-spacing:-.01em;line-height:1.06;color:#fff;margin:22px 0 0}
.hp h1 em{font-style:italic;color:var(--ouro2)}
.hp .orna{display:flex;align-items:center;gap:12px;margin:20px 0 4px;color:var(--ouro)}
.hp .orna .ln{height:1px;width:56px;background:linear-gradient(90deg,transparent,var(--ouro))}
.hp .orna .ln.r{background:linear-gradient(90deg,var(--ouro),transparent)}
.hp .orna .di{width:7px;height:7px;transform:rotate(45deg);background:var(--ouro)}
.hp p.sub{font-size:1.18rem;color:var(--claro2);margin-top:18px;max-width:540px}
.hp .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.hp .btnG{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:.98rem;padding:14px 28px;border-radius:10px;border:0;cursor:pointer;background:linear-gradient(135deg,var(--ouro2),var(--ouro));color:#1a1206;box-shadow:0 14px 30px -10px color-mix(in srgb,var(--ouro) 55%,transparent);transition:transform .15s,box-shadow .15s,filter .15s}
.hp .btnG:hover{transform:translateY(-2px);filter:brightness(1.05)}
.hp .btnG svg{width:18px;height:18px}
.hp .btnGh{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.98rem;padding:14px 26px;border-radius:10px;cursor:pointer;background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.32);transition:border-color .15s,background .15s}
.hp .btnGh:hover{border-color:var(--ouro);color:var(--ouro2)}
.hp .btnGh svg{width:18px;height:18px}
.hp .auth{display:flex;flex-wrap:wrap;gap:0}
.hp .auth .st{padding:0 26px;border-left:1px solid rgba(201,162,75,.28)}
.hp .auth .st:first-child{padding-left:0;border-left:0}
.hp .auth .st b{font-family:'Playfair Display',serif;font-size:2rem;color:var(--ouro2);display:block;line-height:1}
.hp .auth .st .rw{display:flex;align-items:center;gap:8px}
.hp .auth .st span{font-size:.8rem;color:var(--mut);letter-spacing:.04em}
`;

/** Faixa de autoridade — SÓ números reais do pacote. Vazio → caller omite. */
function authStats(d: SiteData): string[] {
  const st: string[] = [];
  if (d.rating != null)
    st.push(
      `<div class="st"><div class="rw">${estrelas(d.rating, 16)}<b>${fmtNota(d.rating)}</b></div><span>nota no Google</span></div>`,
    );
  if (d.reviews)
    st.push(`<div class="st"><b>${fmtReviews(d.reviews)}</b><span>avaliações reais</span></div>`);
  if (d.servicos.length)
    st.push(`<div class="st"><b>${d.servicos.length}</b><span>áreas de atuação</span></div>`);
  return st;
}
function authBand(d: SiteData, cls = ""): string {
  const st = authStats(d);
  return st.length ? `<div class="auth ${cls}">${st.join("")}</div>` : "";
}

function cabecalho(d: SiteData, cfg: NichoCfg, headlineCls = ""): string {
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  return `<div class="selo-h reveal"><span class="seal">${icone(cfg.brandIcon)}</span>${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</div>
<h1 class="${headlineCls} reveal"${rev(1)}>${esc(d.headline)}</h1>
<div class="orna reveal"${rev(2)}><span class="ln"></span><span class="di"></span><span class="ln r"></span></div>
<p class="sub reveal"${rev(2)}>${esc(d.subheadline)}</p>`;
}

function acoes(d: SiteData): string {
  const cta = ctaHref(d);
  return `<div class="acoes reveal"${rev(3)}><a class="btnG" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>${d.mapsUrl ? `<a class="btnGh" href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">${icone("map-pin")} Como chegar</a>` : ""}</div>`;
}

/* ------------------- PA — full-bleed editorial + parallax ------------------- */
const CSS_A = `
.hpA{min-height:min(94vh,860px);display:flex;align-items:center}
.hpA .parallax{position:absolute;inset:-12% 0;z-index:0;will-change:transform}
.hpA .parallax img{width:100%;height:118%;object-fit:cover;filter:saturate(.85)}
.hpA .ov{position:absolute;inset:0;z-index:1;background:linear-gradient(100deg,var(--breu) 30%,color-mix(in srgb,var(--breu) 62%,transparent) 62%,color-mix(in srgb,var(--breu) 30%,transparent)),linear-gradient(0deg,var(--breu),transparent 40%)}
.hpA .wrap{position:relative;z-index:2;padding:96px 22px}
.hpA .auth{margin-top:44px}
`;
function heroA(d: SiteData, cfg: NichoCfg): string {
  return `<section class="hp hpA">
<div class="parallax"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
<div class="ov"></div>
<div class="wrap">${cabecalho(d, cfg)}${acoes(d)}${authBand(d)}</div>
</section>`;
}

/* ----------------------- PB — split editorial lateral ----------------------- */
const CSS_B = `
.hpB{display:grid;grid-template-columns:1.05fr .95fr;min-height:min(90vh,820px)}
.hpB .lado{display:flex;flex-direction:column;justify-content:center;padding:90px 56px 90px calc((100vw - 1140px)/2 + 22px)}
.hpB .art{position:relative;overflow:hidden;border-left:3px solid var(--ouro)}
.hpB .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.85)}
.hpB .art::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--breu),transparent 30%),linear-gradient(0deg,color-mix(in srgb,var(--breu) 55%,transparent),transparent 45%)}
.hpB .auth{margin-top:40px}
@media(max-width:1180px){.hpB .lado{padding:90px 40px}}
@media(max-width:900px){.hpB{grid-template-columns:1fr}.hpB .lado{padding:72px 22px 56px;order:2}.hpB .art{order:1;min-height:280px;border-left:0;border-bottom:3px solid var(--ouro)}}
`;
function heroB(d: SiteData, cfg: NichoCfg): string {
  return `<section class="hp hpB">
<div class="lado">${cabecalho(d, cfg)}${acoes(d)}${authBand(d)}</div>
<div class="art"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
</section>`;
}

/* -------------------- PC — central com emblema + faixa foto -------------------- */
const CSS_C = `
.hpC{background:radial-gradient(900px 460px at 50% -6%,var(--breu2),var(--breu))}
.hpC .wrap{padding:92px 22px 0;text-align:center;max-width:900px;margin:0 auto}
.hpC .selo-h{justify-content:center}
.hpC .orna{justify-content:center}
.hpC h1{margin-left:auto;margin-right:auto;max-width:820px}
.hpC p.sub{margin-left:auto;margin-right:auto}
.hpC .acoes{justify-content:center}
.hpC .auth{justify-content:center;margin-top:40px}
.hpC .faixa{margin-top:60px;position:relative;height:340px;border-top:2px solid var(--ouro);overflow:hidden}
.hpC .faixa img{width:100%;height:100%;object-fit:cover;filter:saturate(.85)}
.hpC .faixa::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,transparent 40%,var(--breu))}
@media(max-width:640px){.hpC .faixa{height:220px}}
`;
function heroC(d: SiteData, cfg: NichoCfg): string {
  return `<section class="hp hpC">
<div class="wrap">${cabecalho(d, cfg)}${acoes(d)}${authBand(d)}</div>
<div class="faixa reveal"${rev(3)}><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
</section>`;
}

/* -------------------------------- dispatcher -------------------------------- */
const BLOCOS = {
  A: { render: heroA, css: CSS_A },
  B: { render: heroB, css: CSS_B },
  C: { render: heroC, css: CSS_C },
} as const;

/** Bloco de hero premium ESCURO da variante escolhida (+ fonte serif + CSS). */
export function heroBlocoProfissional(d: SiteData, cfg: NichoCfg): { html: string; css: string } {
  const b = BLOCOS[d.heroVar] ?? BLOCOS.A;
  return { html: FONT + b.render(d, cfg), css: PREM + b.css };
}
