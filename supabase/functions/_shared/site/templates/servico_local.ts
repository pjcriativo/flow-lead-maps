// Template "servico-local" — salão, barbearia, oficina, pet, etc. Visual
// vibrante, hero com foto, galeria, prova social (nota real) e agendamento.
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { head, waFloat, estrelas, fmtNota, fmtReviews, ctaHref } from "../comuns.ts";

const CSS = `
header.top{position:sticky;top:0;z-index:50;background:var(--escura);color:#fff}
.top .bar{display:flex;align-items:center;justify-content:space-between;height:68px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.2rem}
.brand .dot{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));display:grid;place-items:center;color:#fff}
.top nav{display:flex;gap:24px}.top nav a{font-size:.93rem;color:#cbd5e1}.top nav a:hover{color:#fff}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;padding:13px 24px;border-radius:999px;cursor:pointer;border:0;transition:transform .15s,box-shadow .15s}
.btn-p{background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:var(--contraste);box-shadow:0 10px 26px -6px color-mix(in srgb,var(--primaria) 55%,transparent)}
.btn-p:hover{transform:translateY(-2px)}
.btn-o{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.35)}
.btn-o:hover{border-color:#fff}
.hero{position:relative;min-height:88vh;display:flex;align-items:center;color:#fff;overflow:hidden}
.hero .bg{position:absolute;inset:0;z-index:0}
.hero .bg img{width:100%;height:100%;object-fit:cover}
.hero .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,color-mix(in srgb,var(--escura) 92%,transparent) 30%,color-mix(in srgb,var(--escura) 40%,transparent))}
.hero .wrap{position:relative;z-index:1;padding:80px 22px}
.hero .badge{display:inline-flex;align-items:center;gap:8px;background:color-mix(in srgb,var(--primaria) 90%,#000);color:#fff;font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;padding:8px 16px;border-radius:999px}
.hero h1{font-size:clamp(2.3rem,6vw,4.2rem);font-weight:800;margin:20px 0 16px;max-width:760px;text-shadow:0 2px 30px rgba(0,0,0,.3)}
.hero p.sub{font-size:1.2rem;max-width:540px;color:#e8eef5}
.hero .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.hero .rprova{display:inline-flex;align-items:center;gap:10px;margin-top:28px;background:rgba(255,255,255,.12);backdrop-filter:blur(6px);padding:12px 18px;border-radius:14px}
.hero .rprova b{font-family:'Plus Jakarta Sans';font-size:1.3rem}
section{padding:82px 0}
.sec-head{text-align:center;max-width:640px;margin:0 auto 50px}
.kicker{display:inline-block;font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--primaria);margin-bottom:12px}
.sec-head h2{font-size:clamp(1.8rem,3.4vw,2.6rem);font-weight:800;color:var(--escura)}
.sec-head p{color:#64748b;margin-top:12px;font-size:1.05rem}
.servicos{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card{background:#fff;border-radius:20px;padding:32px 26px;box-shadow:0 10px 30px -18px rgba(0,0,0,.25);border:1px solid #f1f5f9;transition:transform .18s,box-shadow .18s}
.card:hover{transform:translateY(-6px);box-shadow:0 26px 50px -22px color-mix(in srgb,var(--primaria) 55%,rgba(0,0,0,.4))}
.card .ic{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:#fff;display:grid;place-items:center;margin-bottom:18px}
.card .ic svg{width:28px;height:28px}
.card h3{font-size:1.18rem;color:var(--escura);margin-bottom:8px}
.card p{color:#64748b;font-size:.97rem}
.galeria{background:var(--clara)}
.gal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.gal-grid a{border-radius:16px;overflow:hidden;aspect-ratio:1;box-shadow:0 12px 28px -18px rgba(0,0,0,.4)}
.gal-grid img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.gal-grid a:hover img{transform:scale(1.08)}
.gal-grid a:first-child{grid-column:span 2;grid-row:span 2;aspect-ratio:auto}
.prova{background:var(--escura);color:#fff;text-align:center}
.prova .big{font-family:'Plus Jakarta Sans';font-weight:800;font-size:clamp(3rem,8vw,5rem);background:linear-gradient(135deg,var(--primaria),var(--secundaria));-webkit-background-clip:text;background-clip:text;color:transparent}
.prova p{color:#cbd5e1;font-size:1.1rem;margin-top:6px}
.local .grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:stretch}
.local .info{display:flex;flex-direction:column;justify-content:center}
.local .linha{display:flex;gap:14px;align-items:flex-start;margin-bottom:20px}
.local .linha .ic{width:46px;height:46px;flex:0 0 46px;border-radius:14px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:#fff;display:grid;place-items:center}
.local .linha .ic svg{width:22px;height:22px}
.local .mapa{border-radius:20px;overflow:hidden;min-height:340px;box-shadow:0 20px 44px -22px rgba(0,0,0,.35)}
.local .mapa iframe{width:100%;height:100%;min-height:340px;border:0;display:block}
footer{background:var(--escura);color:#cbd5e1;padding:48px 0 30px;text-align:center}
footer .fbrand{font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.3rem;color:#fff;margin-bottom:10px}
footer .fsoc{display:flex;gap:14px;justify-content:center;margin:16px 0}
footer .fsoc a{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.08);display:grid;place-items:center;color:#fff}
footer .fsoc a:hover{background:var(--primaria)}
footer small{color:#64748b;font-size:.82rem}
@media(max-width:860px){.servicos{grid-template-columns:1fr 1fr}.gal-grid{grid-template-columns:repeat(2,1fr)}.local .grid{grid-template-columns:1fr}.top nav{display:none}}
@media(max-width:520px){.servicos{grid-template-columns:1fr}.gal-grid a:first-child{grid-column:span 2}}
`;

export function templateServicoLocal(d: SiteData): string {
  const nota = fmtNota(d.rating);
  const revs = fmtReviews(d.reviews);
  const cta = ctaHref(d);
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";

  const servicos = d.servicos.length
    ? `<section id="servicos"><div class="wrap"><div class="sec-head"><span class="kicker">O que fazemos</span><h2>Nossos serviços</h2><p>Qualidade e atenção em cada detalhe.</p></div>
<div class="servicos">${d.servicos.map((s) => `<div class="card"><div class="ic">${icone(s.icone)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div>`).join("")}</div></div></section>`
    : "";

  const galeria =
    d.fotos.length >= 2
      ? `<section id="galeria" class="galeria"><div class="wrap"><div class="sec-head"><span class="kicker">Galeria</span><h2>Nosso trabalho</h2></div>
<div class="gal-grid">${d.fotos
          .slice(0, 5)
          .map(
            (f) =>
              `<a href="${esc(f)}" target="_blank" rel="noopener"><img src="${esc(f)}" alt="${esc(d.nome)}" loading="lazy"></a>`,
          )
          .join("")}</div></div></section>`
      : "";

  const prova =
    d.rating != null
      ? `<section class="prova"><div class="wrap"><div class="big">${nota} ★</div><div>${estrelas(d.rating, 24)}</div><p>${revs ? `${revs} avaliações` : "Avaliação"} no Google — a confiança de quem já é cliente.</p></div></section>`
      : "";

  const local_sec =
    d.endereco || d.mapEmbedUrl
      ? `<section id="contato" class="local"><div class="wrap"><div class="sec-head"><span class="kicker">Agende agora</span><h2>Venha nos visitar</h2></div>
<div class="grid"><div class="info">
${d.endereco ? `<div class="linha"><div class="ic">${icone("map-pin")}</div><div><strong>Endereço</strong><br>${esc(d.endereco)}${d.mapsUrl ? `<br><a href="${esc(d.mapsUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:700">Ver no mapa →</a>` : ""}</div></div>` : ""}
${d.telefone ? `<div class="linha"><div class="ic">${icone("phone")}</div><div><strong>Telefone</strong><br>${esc(d.telefone)}</div></div>` : ""}
${d.whatsappUrl ? `<div class="linha"><div class="ic">${icone("message-circle")}</div><div><strong>WhatsApp</strong><br><a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:700">Chamar agora →</a></div></div>` : ""}
<a class="btn btn-p" style="margin-top:8px;align-self:flex-start" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>
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

  return `${head(d, "", CSS)}
<body>
<header class="top"><div class="wrap bar">
<div class="brand"><span class="dot">${icone("sparkles")}</span>${esc(d.nome)}</div>
<nav>${servicos ? '<a href="#servicos">Serviços</a>' : ""}${galeria ? '<a href="#galeria">Galeria</a>' : ""}<a href="#contato">Contato</a></nav>
<a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>
</div></header>

<section class="hero">
<div class="bg"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
<div class="wrap">
<span class="badge">${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</span>
<h1>${esc(d.headline)}</h1>
<p class="sub">${esc(d.subheadline)}</p>
<div class="acoes"><a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>${d.mapsUrl ? `<a class="btn btn-o" href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">${icone("map-pin")} Como chegar</a>` : ""}</div>
${d.rating != null ? `<div class="rprova">${estrelas(d.rating, 20)}<b>${nota}</b><span>${revs ? revs + " avaliações" : "no Google"}</span></div>` : ""}
</div></section>

${servicos}
${galeria}
${prova}
${local_sec}

<footer><div class="wrap">
<div class="fbrand">${esc(d.nome)}</div>
<div>${esc(d.categoriaLabel)}${d.endereco ? " · " + esc(d.endereco) : ""}</div>
${social ? `<div class="fsoc">${social}</div>` : ""}
<small>© ${esc(d.nome)}.${d.creditoRodape ? " " + esc(d.creditoRodape) : ""}</small>
</div></footer>
${waFloat(d)}
</body></html>`;
}
