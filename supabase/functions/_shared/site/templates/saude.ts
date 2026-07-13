// Template "saude" — dental / estética / clínica. Tons de confiança, hero com
// foto grande, prova social com nota, serviços com ícones, sobre, localização
// com mapa, CTA WhatsApp fixo. Design nível agência (sombras, gradientes suaves).
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { head, waFloat, estrelas, fmtNota, fmtReviews, ctaHref } from "../comuns.ts";

const CSS = `
header.top{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.86);backdrop-filter:blur(12px);border-bottom:1px solid #eef2f6}
.top .bar{display:flex;align-items:center;justify-content:space-between;height:70px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.22rem;color:var(--escura)}
.brand .dot{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));display:grid;place-items:center;color:#fff;font-size:1rem}
.top nav{display:flex;align-items:center;gap:26px}
.top nav a{font-size:.94rem;font-weight:500;color:#475569}
.top nav a:hover{color:var(--primaria)}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.96rem;padding:13px 24px;border-radius:12px;cursor:pointer;transition:transform .15s,box-shadow .15s,background .15s;border:0}
.btn-p{background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:var(--contraste);box-shadow:0 10px 26px -6px color-mix(in srgb,var(--primaria) 60%,transparent)}
.btn-p:hover{transform:translateY(-2px);box-shadow:0 16px 34px -6px color-mix(in srgb,var(--primaria) 65%,transparent)}
.btn-o{background:#fff;color:var(--escura);border:1.5px solid #e2e8f0}
.btn-o:hover{border-color:var(--primaria);color:var(--primaria)}
.hero{position:relative;background:radial-gradient(1200px 500px at 80% -10%,color-mix(in srgb,var(--primaria) 14%,#fff),#fff 60%)}
.hero .grid{display:grid;grid-template-columns:1.05fr .95fr;gap:52px;align-items:center;padding:76px 0 84px}
.kicker{display:inline-flex;align-items:center;gap:8px;font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--primaria);background:color-mix(in srgb,var(--primaria) 12%,#fff);padding:7px 14px;border-radius:999px}
.hero h1{font-size:clamp(2.1rem,4.6vw,3.5rem);font-weight:800;color:var(--escura);margin:20px 0 16px}
.hero p.sub{font-size:1.15rem;color:#475569;max-width:520px}
.hero .acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:30px}
.hero .rprova{display:flex;align-items:center;gap:12px;margin-top:26px;font-size:.95rem;color:#475569}
.hero .rprova b{color:var(--escura)}
.hero-art{position:relative}
.hero-art .foto{border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -18px rgba(15,41,66,.4);aspect-ratio:4/5;background:#e2e8f0}
.hero-art .foto img{width:100%;height:100%;object-fit:cover}
.nota-card{position:absolute;left:-24px;bottom:26px;background:#fff;border-radius:18px;padding:16px 20px;box-shadow:0 20px 40px -12px rgba(15,41,66,.28);display:flex;align-items:center;gap:14px}
.nota-card .n{font-family:'Plus Jakarta Sans';font-weight:800;font-size:2rem;color:var(--escura);line-height:1}
.nota-card small{color:#64748b;font-size:.8rem}
section{padding:80px 0}
.sec-head{text-align:center;max-width:640px;margin:0 auto 52px}
.sec-head .kicker{margin-bottom:14px}
.sec-head h2{font-size:clamp(1.7rem,3.2vw,2.4rem);font-weight:800;color:var(--escura)}
.sec-head p{color:#64748b;margin-top:12px;font-size:1.05rem}
.servicos{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card{background:#fff;border:1px solid #eef2f6;border-radius:20px;padding:30px 26px;transition:transform .18s,box-shadow .18s,border-color .18s}
.card:hover{transform:translateY(-6px);box-shadow:0 24px 48px -20px rgba(15,41,66,.3);border-color:color-mix(in srgb,var(--primaria) 30%,#eef2f6)}
.card .ic{width:52px;height:52px;border-radius:14px;background:color-mix(in srgb,var(--primaria) 12%,#fff);color:var(--primaria);display:grid;place-items:center;margin-bottom:18px}
.card .ic svg{width:26px;height:26px}
.card h3{font-size:1.16rem;color:var(--escura);margin-bottom:8px}
.card p{color:#64748b;font-size:.97rem}
.sobre{background:var(--clara)}
.sobre .grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center}
.sobre .foto{border-radius:22px;overflow:hidden;aspect-ratio:5/4;box-shadow:0 24px 50px -20px rgba(15,41,66,.3)}
.sobre .foto img{width:100%;height:100%;object-fit:cover}
.sobre h2{font-size:clamp(1.7rem,3vw,2.3rem);color:var(--escura);margin-bottom:18px}
.sobre p{color:#475569;font-size:1.05rem;margin-bottom:16px}
.stats{display:flex;gap:16px;margin-top:26px;flex-wrap:wrap}
.stat{background:#fff;border:1px solid #eef2f6;border-radius:16px;padding:16px 22px;text-align:center;flex:1;min-width:120px}
.stat b{display:block;font-family:'Plus Jakarta Sans';font-size:1.7rem;color:var(--primaria)}
.stat span{font-size:.82rem;color:#64748b}
.local .grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:stretch}
.local .info{display:flex;flex-direction:column;justify-content:center}
.local .linha{display:flex;gap:14px;align-items:flex-start;margin-bottom:20px}
.local .linha .ic{width:44px;height:44px;flex:0 0 44px;border-radius:12px;background:color-mix(in srgb,var(--primaria) 12%,#fff);color:var(--primaria);display:grid;place-items:center}
.local .linha .ic svg{width:22px;height:22px}
.local .mapa{border-radius:20px;overflow:hidden;min-height:340px;box-shadow:0 20px 44px -22px rgba(15,41,66,.3);border:1px solid #eef2f6}
.local .mapa iframe{width:100%;height:100%;min-height:340px;border:0;display:block}
.cta-band{background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:var(--contraste);text-align:center;border-radius:28px;padding:60px 30px;margin:0 auto;max-width:960px}
.cta-band h2{font-size:clamp(1.7rem,3.2vw,2.4rem);margin-bottom:14px}
.cta-band p{opacity:.92;max-width:520px;margin:0 auto 28px;font-size:1.08rem}
.cta-band .btn-white{background:#fff;color:var(--primaria);font-weight:700}
.cta-band .btn-white:hover{transform:translateY(-2px)}
footer{background:var(--escura);color:#cbd5e1;padding:48px 0 30px;text-align:center}
footer .fbrand{font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.3rem;color:#fff;margin-bottom:10px}
footer .fsoc{display:flex;gap:14px;justify-content:center;margin:16px 0}
footer .fsoc a{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.08);display:grid;place-items:center;color:#fff}
footer .fsoc a:hover{background:var(--primaria)}
footer small{color:#64748b;font-size:.82rem}
@media(max-width:860px){.hero .grid,.sobre .grid,.local .grid{grid-template-columns:1fr}.servicos{grid-template-columns:1fr 1fr}.top nav{display:none}.hero-art{order:-1}.nota-card{left:16px}}
@media(max-width:520px){.servicos{grid-template-columns:1fr}}
`;

export function templateSaude(d: SiteData): string {
  const nota = fmtNota(d.rating);
  const revs = fmtReviews(d.reviews);
  const cta = ctaHref(d);
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";

  const provaHero =
    d.rating != null
      ? `<div class="rprova">${estrelas(d.rating, 18)}<span><b>${nota}</b>${revs ? ` · ${revs} avaliações no Google` : " no Google"}</span></div>`
      : "";

  const notaCard =
    d.rating != null
      ? `<div class="nota-card"><div class="n">${nota}</div><div>${estrelas(d.rating, 15)}<small>${revs ? revs + " avaliações" : "Google"}</small></div></div>`
      : "";

  const servicos = d.servicos.length
    ? `<section id="servicos"><div class="wrap"><div class="sec-head"><span class="kicker">Nossos serviços</span><h2>Tratamentos com excelência</h2><p>Cuidado completo e personalizado para você e sua família.</p></div>
<div class="servicos">${d.servicos
        .map(
          (s) =>
            `<div class="card"><div class="ic">${icone(s.icone)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div>`,
        )
        .join("")}</div></div></section>`
    : "";

  const stats = [
    d.rating != null ? `<div class="stat"><b>${nota}</b><span>nota no Google</span></div>` : "",
    d.reviews ? `<div class="stat"><b>${revs}</b><span>avaliações</span></div>` : "",
    d.rating != null && d.rating >= 4.7
      ? `<div class="stat"><b>Top</b><span>referência local</span></div>`
      : "",
  ].join("");

  const sobre = d.sobre
    ? `<section id="sobre" class="sobre"><div class="wrap"><div class="grid">
<div class="foto"><img src="${esc(d.fotos[0] ?? d.fotoHero)}" alt="${esc(d.nome)}" loading="lazy"></div>
<div><span class="kicker">Sobre nós</span><h2>${esc(d.nome)}</h2><p>${esc(d.sobre)}</p>${stats ? `<div class="stats">${stats}</div>` : ""}</div>
</div></div></section>`
    : "";

  const local_sec =
    d.endereco || d.mapEmbedUrl
      ? `<section id="contato" class="local"><div class="wrap"><div class="sec-head"><span class="kicker">Onde estamos</span><h2>Venha nos visitar</h2></div>
<div class="grid"><div class="info">
${d.endereco ? `<div class="linha"><div class="ic">${icone("map-pin")}</div><div><strong>Endereço</strong><br>${esc(d.endereco)}${d.mapsUrl ? `<br><a href="${esc(d.mapsUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:600">Ver no Google Maps →</a>` : ""}</div></div>` : ""}
${d.telefone ? `<div class="linha"><div class="ic">${icone("phone")}</div><div><strong>Telefone</strong><br>${esc(d.telefone)}</div></div>` : ""}
${d.whatsappUrl ? `<div class="linha"><div class="ic">${icone("message-circle")}</div><div><strong>WhatsApp</strong><br><a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:600">Chamar agora →</a></div></div>` : ""}
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
<div class="brand"><span class="dot">${icone("tooth")}</span>${esc(d.nome)}</div>
<nav>${servicos ? '<a href="#servicos">Serviços</a>' : ""}${sobre ? '<a href="#sobre">Sobre</a>' : ""}<a href="#contato">Contato</a></nav>
<a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>
</div></header>

<section class="hero"><div class="wrap grid">
<div>
<span class="kicker">${icone("map-pin")} ${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</span>
<h1>${esc(d.headline)}</h1>
<p class="sub">${esc(d.subheadline)}</p>
<div class="acoes"><a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>${d.mapsUrl ? `<a class="btn btn-o" href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">${icone("map-pin")} Como chegar</a>` : ""}</div>
${provaHero}
</div>
<div class="hero-art"><div class="foto"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>${notaCard}</div>
</div></section>

${servicos}
${sobre}
${local_sec}

<section><div class="wrap"><div class="cta-band">
<h2>${esc(d.headline)}</h2>
<p>Agende agora pelo WhatsApp e cuide do seu sorriso com quem é referência${local ? " em " + esc(local) : ""}.</p>
<a class="btn btn-white" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>
</div></div></section>

<footer><div class="wrap">
<div class="fbrand">${esc(d.nome)}</div>
<div>${esc(d.categoriaLabel)}${d.endereco ? " · " + esc(d.endereco) : ""}</div>
${social ? `<div class="fsoc">${social}</div>` : ""}
<small>© ${esc(d.nome)}. Site desenvolvido com Flow Leads.</small>
</div></footer>
${waFloat(d)}
</body></html>`;
}
