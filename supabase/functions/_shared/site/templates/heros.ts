// BIBLIOTECA DE VARIANTES DE HERO (composição por blocos). Cada variante é um
// bloco premium pré-desenhado que lê SOMENTE o SiteData (pacote de dados
// normalizado) — nunca chama IA/extração. A variante vem de d.heroVar (escolhida
// deterministicamente pela semente em variantes.ts). Todas respeitam:
// - "sem dado, sem invenção": sem nota → sem estrela/número (selo vira dado real)
// - imagens do Storage (d.fotoHero já re-hospedada)
// - animações padronizadas (reveal; parallax só no A — rAF/mobile-off no scriptAnim)
// - responsivas 360→1440
import type { SiteData, HeroId } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { estrelas, fmtNota, fmtReviews, ctaHref } from "../comuns.ts";
import type { NichoCfg } from "./premium.ts";

const rev = (i: number) => ` style="--d:${i * 90}ms"`;

/** Conteúdo do selo de prova: nota REAL quando existe; senão, dado real do lead. */
function seloConteudo(d: SiteData, cfg: NichoCfg): string {
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  if (d.rating != null) {
    const revs = fmtReviews(d.reviews);
    return `${estrelas(d.rating, 15)} <b>${fmtNota(d.rating)}</b> · ${revs ? revs + " avaliações no Google" : "avaliação no Google"}`;
  }
  return `${icone(cfg.brandIcon)} ${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}`;
}

function acoes(d: SiteData, ghostClass: string): string {
  const cta = ctaHref(d);
  return `<div class="acoes reveal"${rev(3)}><a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>${d.mapsUrl ? `<a class="btn ${ghostClass}" href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">${icone("map-pin")} Como chegar</a>` : ""}</div>`;
}

/* ------------------------- HERO A — full-bleed ------------------------- */
// Foto de fundo em tela cheia + overlay escuro + parallax (o hero "clássico").

const CSS_A = `
.hero{position:relative;min-height:min(94vh,880px);display:flex;align-items:center;overflow:hidden;color:#fff}
.hero .parallax{position:absolute;inset:-12% 0;z-index:0;will-change:transform}
.hero .parallax img{width:100%;height:118%;object-fit:cover}
.hero .ov{position:absolute;inset:0;z-index:1;background:linear-gradient(105deg,color-mix(in srgb,var(--escura) 88%,transparent) 32%,color-mix(in srgb,var(--escura) 30%,transparent))}
.hero .wrap{position:relative;z-index:2;padding:90px 22px}
.hero .selo{display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(6px);padding:9px 16px;border-radius:999px;font-size:.86rem;font-weight:600}
.hero .selo b{color:#ffd76a}
.hero h1{font-size:clamp(2.3rem,5.4vw,4rem);font-weight:800;margin:22px 0 18px;max-width:760px;text-shadow:0 2px 40px rgba(0,0,0,.25)}
.hero p.sub{font-size:1.22rem;max-width:540px;color:#eef4f8}
.hero .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.hero .mini{display:flex;align-items:center;gap:10px;margin-top:26px;font-size:.95rem;color:#dbe6ee}
.hero .scroll{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:2;color:rgba(255,255,255,.7);animation:bob 1.8s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}
`;

function heroA(d: SiteData, cfg: NichoCfg): string {
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  return `<section class="hero">
<div class="parallax"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
<div class="ov"></div>
<div class="wrap">
<span class="selo reveal">${seloConteudo(d, cfg)}</span>
<h1 class="reveal"${rev(1)}>${esc(d.headline)}</h1>
<p class="sub reveal"${rev(2)}>${esc(d.subheadline)}</p>
${acoes(d, "btn-ghost")}
<div class="mini reveal"${rev(4)}>${icone("check-circle")} ${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</div>
</div>
<div class="scroll"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></div>
</section>`;
}

/* ----------------------- HERO B — split lateral ------------------------ */
// Fundo claro, texto à esquerda, imagem em card com moldura à direita.

const CSS_B = `
.heroB{position:relative;overflow:hidden;background:linear-gradient(160deg,var(--clara) 0%,#fff 55%);padding:0}
.heroB::before{content:"";position:absolute;top:-220px;right:-220px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--primaria) 14%,transparent),transparent 68%)}
.heroB .grid{position:relative;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;padding:92px 22px 96px}
.heroB .selo{display:inline-flex;align-items:center;gap:9px;background:#fff;border:1.5px solid color-mix(in srgb,var(--primaria) 26%,#e6ecf2);color:var(--escura);padding:9px 16px;border-radius:999px;font-size:.86rem;font-weight:600;box-shadow:0 8px 22px -14px rgba(15,41,66,.35)}
.heroB .selo b{color:var(--primaria)}
.heroB h1{font-size:clamp(2.2rem,4.8vw,3.6rem);font-weight:800;color:var(--escura);margin:22px 0 18px}
.heroB p.sub{font-size:1.18rem;color:#475569;max-width:520px}
.heroB .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.heroB .mini{display:flex;align-items:center;gap:10px;margin-top:24px;font-size:.95rem;color:#64748b}
.heroB .art{position:relative}
.heroB .art .molde{position:absolute;inset:26px -26px -26px 26px;border-radius:26px;background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 22%,#fff),color-mix(in srgb,var(--secundaria) 26%,#fff));z-index:0}
.heroB .art .foto{position:relative;z-index:1;border-radius:24px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 34px 64px -24px rgba(15,41,66,.45);border:6px solid #fff}
.heroB .art .foto img{width:100%;height:100%;object-fit:cover}
.btn-o{background:#fff;color:var(--escura);border:1.5px solid #dbe3ea}
.btn-o:hover{border-color:var(--primaria);color:var(--primaria)}
@media(max-width:900px){.heroB .grid{grid-template-columns:1fr;gap:40px;padding:64px 22px 72px}.heroB .art{order:-1;max-width:420px}.heroB .art .molde{inset:18px -14px -14px 18px}}
`;

function heroB(d: SiteData, cfg: NichoCfg): string {
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  return `<section class="heroB">
<div class="wrap grid">
<div>
<span class="selo reveal">${seloConteudo(d, cfg)}</span>
<h1 class="reveal"${rev(1)}>${esc(d.headline)}</h1>
<p class="sub reveal"${rev(2)}>${esc(d.subheadline)}</p>
${acoes(d, "btn-o")}
<div class="mini reveal"${rev(4)}>${icone("check-circle")} ${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</div>
</div>
<div class="art reveal"${rev(2)}><div class="molde"></div><div class="foto"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div></div>
</div>
</section>`;
}

/* ------------------ HERO C — central + imagem em card ------------------ */
// Fundo escuro sóbrio, texto centralizado, imagem larga em card com borda.

const CSS_C = `
.heroC{position:relative;overflow:hidden;background:radial-gradient(900px 420px at 50% -8%,color-mix(in srgb,var(--primaria) 30%,var(--escura)),var(--escura));color:#fff;text-align:center;padding:0}
.heroC .wrap{padding:96px 22px 84px}
.heroC .selo{display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(6px);padding:9px 16px;border-radius:999px;font-size:.86rem;font-weight:600}
.heroC .selo b{color:#ffd76a}
.heroC h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:800;margin:24px auto 18px;max-width:820px}
.heroC p.sub{font-size:1.2rem;color:#dbe6ee;max-width:600px;margin:0 auto}
.heroC .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px;justify-content:center}
.heroC .mini{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:24px;font-size:.95rem;color:#9fb3c8}
.heroC .quadro{max-width:980px;margin:56px auto 0;border-radius:24px;overflow:hidden;aspect-ratio:16/7;border:1px solid rgba(255,255,255,.16);box-shadow:0 40px 90px -30px rgba(0,0,0,.6)}
.heroC .quadro img{width:100%;height:100%;object-fit:cover}
@media(max-width:640px){.heroC .wrap{padding:72px 22px 64px}.heroC .quadro{aspect-ratio:4/3;margin-top:40px}}
`;

function heroC(d: SiteData, cfg: NichoCfg): string {
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  return `<section class="heroC">
<div class="wrap">
<span class="selo reveal">${seloConteudo(d, cfg)}</span>
<h1 class="reveal"${rev(1)}>${esc(d.headline)}</h1>
<p class="sub reveal"${rev(2)}>${esc(d.subheadline)}</p>
${acoes(d, "btn-ghost")}
<div class="mini reveal"${rev(4)}>${icone("check-circle")} ${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</div>
<div class="quadro reveal"${rev(3)}><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
</div>
</section>`;
}

/* ------------------------------ dispatcher ------------------------------ */

const BLOCOS: Record<HeroId, { render: (d: SiteData, cfg: NichoCfg) => string; css: string }> = {
  A: { render: heroA, css: CSS_A },
  B: { render: heroB, css: CSS_B },
  C: { render: heroC, css: CSS_C },
};

/** Renderiza o bloco de hero da variante escolhida (html + css da variante). */
export function heroBloco(d: SiteData, cfg: NichoCfg): { html: string; css: string } {
  const b = BLOCOS[d.heroVar] ?? BLOCOS.A;
  return { html: b.render(d, cfg), css: b.css };
}
