// Template "profissional" — advocacia, contabilidade, consultoria. Sóbrio,
// elegante, foco em autoridade e prova social. Títulos com serifa (Lora).
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { head, waFloat, estrelas, fmtNota, fmtReviews, ctaHref } from "../comuns.ts";

const FONTE = `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');
h1,h2,h3,.display{font-family:'Lora',Georgia,serif !important;letter-spacing:-.01em}`;

const CSS = `
header.top{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid #e8ebf0}
.top .bar{display:flex;align-items:center;justify-content:space-between;height:74px}
.brand{display:flex;align-items:center;gap:11px;font-family:'Lora',serif;font-weight:700;font-size:1.28rem;color:var(--escura)}
.brand .dot{width:36px;height:36px;border-radius:9px;background:var(--escura);display:grid;place-items:center;color:var(--secundaria)}
.top nav{display:flex;gap:28px}.top nav a{font-size:.93rem;color:#4b5563;font-weight:500}.top nav a:hover{color:var(--primaria)}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.95rem;padding:13px 26px;border-radius:8px;cursor:pointer;border:0;transition:transform .15s,background .15s}
.btn-p{background:var(--primaria);color:var(--contraste)}
.btn-p:hover{background:var(--escura)}
.btn-g{background:var(--secundaria);color:#1a1206}
.btn-o{background:transparent;color:var(--escura);border:1.5px solid #d5dae2}
.btn-o:hover{border-color:var(--primaria);color:var(--primaria)}
.hero{background:linear-gradient(180deg,var(--clara),#fff)}
.hero .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center;padding:84px 0 90px}
.hero .rule{width:54px;height:3px;background:var(--secundaria);margin-bottom:26px}
.hero h1{font-size:clamp(2.2rem,4.8vw,3.6rem);font-weight:700;color:var(--escura);margin-bottom:20px}
.hero p.sub{font-size:1.16rem;color:#4b5563;max-width:520px}
.hero .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.hero .rprova{display:flex;align-items:center;gap:12px;margin-top:28px;color:#4b5563;font-size:.96rem}
.hero .rprova b{color:var(--escura)}
.hero-art{position:relative}
.hero-art .foto{border-radius:6px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 30px 60px -22px rgba(15,26,43,.5);border:1px solid #e8ebf0}
.hero-art .foto img{width:100%;height:100%;object-fit:cover}
.hero-art .seal{position:absolute;left:-22px;bottom:28px;background:var(--escura);color:#fff;border-radius:10px;padding:18px 22px;box-shadow:0 20px 40px -14px rgba(15,26,43,.5)}
.hero-art .seal b{font-family:'Lora',serif;font-size:1.9rem;color:var(--secundaria);display:block;line-height:1}
.hero-art .seal small{font-size:.78rem;color:#cbd5e1}
section{padding:84px 0}
.sec-head{max-width:660px;margin:0 auto 54px;text-align:center}
.kicker{display:inline-block;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:var(--secundaria);margin-bottom:14px}
.sec-head h2{font-size:clamp(1.8rem,3.2vw,2.5rem);font-weight:700;color:var(--escura)}
.sec-head p{color:#64748b;margin-top:12px;font-size:1.05rem}
.servicos{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:#e8ebf0;border:1px solid #e8ebf0;border-radius:12px;overflow:hidden}
.card{background:#fff;padding:38px 30px;transition:background .2s}
.card:hover{background:var(--clara)}
.card .ic{width:50px;height:50px;border-radius:10px;background:var(--clara);color:var(--primaria);display:grid;place-items:center;margin-bottom:20px;border:1px solid #e2e8f0}
.card .ic svg{width:25px;height:25px}
.card h3{font-size:1.18rem;color:var(--escura);margin-bottom:10px}
.card p{color:#64748b;font-size:.97rem}
.sobre{background:var(--escura);color:#e2e8f0}
.sobre .grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.sobre .foto{border-radius:6px;overflow:hidden;aspect-ratio:5/4;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
.sobre .foto img{width:100%;height:100%;object-fit:cover}
.sobre .kicker{color:var(--secundaria)}
.sobre h2{color:#fff;font-size:clamp(1.7rem,3vw,2.3rem);margin-bottom:20px}
.sobre p{color:#cbd5e1;font-size:1.06rem;margin-bottom:16px}
.sobre .stats{display:flex;gap:30px;margin-top:28px;flex-wrap:wrap}
.sobre .stat b{font-family:'Lora',serif;font-size:2rem;color:var(--secundaria);display:block}
.sobre .stat span{font-size:.84rem;color:#94a3b8}
.local .grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:stretch}
.local .info{display:flex;flex-direction:column;justify-content:center}
.local .linha{display:flex;gap:14px;align-items:flex-start;margin-bottom:20px}
.local .linha .ic{width:44px;height:44px;flex:0 0 44px;border-radius:10px;background:var(--clara);color:var(--primaria);display:grid;place-items:center;border:1px solid #e2e8f0}
.local .linha .ic svg{width:21px;height:21px}
.local .mapa{border-radius:8px;overflow:hidden;min-height:340px;box-shadow:0 20px 44px -24px rgba(15,26,43,.4);border:1px solid #e8ebf0}
.local .mapa iframe{width:100%;height:100%;min-height:340px;border:0;display:block}
.cta-band{background:var(--escura);color:#fff;text-align:center;padding:76px 30px;position:relative}
.cta-band .rule{width:54px;height:3px;background:var(--secundaria);margin:0 auto 24px}
.cta-band h2{font-size:clamp(1.8rem,3.2vw,2.5rem);margin-bottom:14px;color:#fff}
.cta-band p{color:#cbd5e1;max-width:520px;margin:0 auto 30px;font-size:1.08rem}
footer{background:#0a1120;color:#94a3b8;padding:48px 0 30px;text-align:center}
footer .fbrand{font-family:'Lora',serif;font-weight:700;font-size:1.3rem;color:#fff;margin-bottom:10px}
footer .fsoc{display:flex;gap:12px;justify-content:center;margin:16px 0}
footer .fsoc a{width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,.07);display:grid;place-items:center;color:#fff}
footer .fsoc a:hover{background:var(--primaria)}
footer small{font-size:.82rem;color:#64748b}
@media(max-width:860px){.hero .grid,.sobre .grid,.local .grid{grid-template-columns:1fr}.servicos{grid-template-columns:1fr}.top nav{display:none}.hero-art{order:-1}}
`;

export function templateProfissional(d: SiteData): string {
  const nota = fmtNota(d.rating);
  const revs = fmtReviews(d.reviews);
  const cta = ctaHref(d);
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";

  const servicos = d.servicos.length
    ? `<section id="servicos"><div class="wrap"><div class="sec-head"><span class="kicker">Áreas de atuação</span><h2>Como podemos ajudar</h2><p>Soluções sob medida, com técnica e responsabilidade.</p></div>
<div class="servicos">${d.servicos.map((s) => `<div class="card"><div class="ic">${icone(s.icone)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div>`).join("")}</div></div></section>`
    : "";

  const stats = [
    d.rating != null ? `<div class="stat"><b>${nota}</b><span>nota no Google</span></div>` : "",
    d.reviews ? `<div class="stat"><b>${revs}</b><span>avaliações</span></div>` : "",
  ].join("");

  const sobre = d.sobre
    ? `<section id="sobre" class="sobre"><div class="wrap"><div class="grid">
<div><span class="kicker">Sobre</span><h2>${esc(d.nome)}</h2><p>${esc(d.sobre)}</p>${stats ? `<div class="stats">${stats}</div>` : ""}
<a class="btn btn-g" style="margin-top:26px" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a></div>
<div class="foto"><img src="${esc(d.fotos[0] ?? d.fotoHero)}" alt="${esc(d.nome)}" loading="lazy"></div>
</div></div></section>`
    : "";

  const local_sec =
    d.endereco || d.mapEmbedUrl
      ? `<section id="contato" class="local"><div class="wrap"><div class="sec-head"><span class="kicker">Contato</span><h2>Fale com nosso escritório</h2></div>
<div class="grid"><div class="info">
${d.endereco ? `<div class="linha"><div class="ic">${icone("map-pin")}</div><div><strong>Endereço</strong><br>${esc(d.endereco)}${d.mapsUrl ? `<br><a href="${esc(d.mapsUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:600">Ver no Google Maps →</a>` : ""}</div></div>` : ""}
${d.telefone ? `<div class="linha"><div class="ic">${icone("phone")}</div><div><strong>Telefone</strong><br>${esc(d.telefone)}</div></div>` : ""}
${d.whatsappUrl ? `<div class="linha"><div class="ic">${icone("message-circle")}</div><div><strong>WhatsApp</strong><br><a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:600">Chamar agora →</a></div></div>` : ""}
<a class="btn btn-p" style="margin-top:8px;align-self:flex-start" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>
</div>
${d.mapEmbedUrl ? `<div class="mapa"><iframe src="${esc(d.mapEmbedUrl)}" loading="lazy" title="Mapa" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ""}
</div></div></section>`
      : "";

  const social = [
    d.instagram
      ? `<a href="${esc(d.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icone("camera")}</a>`
      : "",
    d.facebook
      ? `<a href="${esc(d.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icone("users")}</a>`
      : "",
    d.whatsappUrl
      ? `<a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icone("message-circle")}</a>`
      : "",
  ].join("");

  return `${head(d, FONTE, CSS)}
<body>
<header class="top"><div class="wrap bar">
<div class="brand"><span class="dot">${icone("scale")}</span>${esc(d.nome)}</div>
<nav>${servicos ? '<a href="#servicos">Atuação</a>' : ""}${sobre ? '<a href="#sobre">Sobre</a>' : ""}<a href="#contato">Contato</a></nav>
<a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>
</div></header>

<section class="hero"><div class="wrap grid">
<div>
<div class="rule"></div>
<span class="kicker">${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</span>
<h1>${esc(d.headline)}</h1>
<p class="sub">${esc(d.subheadline)}</p>
<div class="acoes"><a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>${d.mapsUrl ? `<a class="btn btn-o" href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">Como chegar</a>` : ""}</div>
${d.rating != null ? `<div class="rprova">${estrelas(d.rating, 18)}<span><b>${nota}</b>${revs ? ` · ${revs} avaliações no Google` : " no Google"}</span></div>` : ""}
</div>
<div class="hero-art"><div class="foto"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>${d.rating != null ? `<div class="seal"><b>${nota}</b><small>${revs ? revs + " avaliações" : "Google"}</small></div>` : ""}</div>
</div></section>

${servicos}
${sobre}
${local_sec}

<section style="padding:0"><div class="cta-band">
<div class="rule"></div>
<h2>Vamos conversar sobre o seu caso</h2>
<p>Atendimento profissional e transparente${local ? " em " + esc(local) : ""}. Fale conosco agora.</p>
<a class="btn btn-g" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>
</div></section>

<footer><div class="wrap">
<div class="fbrand">${esc(d.nome)}</div>
<div>${esc(d.categoriaLabel)}${d.endereco ? " · " + esc(d.endereco) : ""}</div>
${social ? `<div class="fsoc">${social}</div>` : ""}
<small>© ${esc(d.nome)}. Site desenvolvido com Flow Leads.</small>
</div></footer>
${waFloat(d)}
</body></html>`;
}
