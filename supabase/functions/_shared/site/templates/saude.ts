// Template "saude" — dental / estética / clínica. NÍVEL AGÊNCIA: hero full-width
// com parallax, barra de prova social, serviços reais, diferenciais, sobre com
// foto diferente + números, galeria, DEPOIMENTOS REAIS do Google, FAQ, localização
// com mapa, CTA final e rodapé. Animações de reveal no scroll. Fotos distintas
// por seção. Copy vinda da IA (dados reais); depoimentos reais via Apify.
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { head, waFloat, estrelas, fmtNota, fmtReviews, ctaHref, scriptAnim } from "../comuns.ts";

const CSS = `
header.top{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid #eef2f6;transition:box-shadow .3s}
header.top.scrolled{box-shadow:0 6px 24px -12px rgba(15,41,66,.35)}
.top .bar{display:flex;align-items:center;justify-content:space-between;height:72px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.22rem;color:var(--escura)}
.brand .dot{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));display:grid;place-items:center;color:#fff}
.top nav{display:flex;align-items:center;gap:26px}
.top nav a{font-size:.93rem;font-weight:500;color:#475569}.top nav a:hover{color:var(--primaria)}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.96rem;padding:13px 24px;border-radius:12px;cursor:pointer;transition:transform .15s,box-shadow .15s,background .15s,filter .15s;border:0}
.btn svg{width:18px;height:18px}
.btn-p{background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:var(--contraste);box-shadow:0 10px 26px -6px color-mix(in srgb,var(--primaria) 60%,transparent)}
.btn-p:hover{transform:translateY(-2px);filter:brightness(1.05);box-shadow:0 16px 34px -6px color-mix(in srgb,var(--primaria) 65%,transparent)}
.btn-o{background:#fff;color:var(--escura);border:1.5px solid #e2e8f0}
.btn-o:hover{border-color:var(--primaria);color:var(--primaria)}
.btn-ghost{background:rgba(255,255,255,.14);color:#fff;border:1.5px solid rgba(255,255,255,.4)}
.btn-ghost:hover{background:rgba(255,255,255,.24)}
.btn-white{background:#fff;color:var(--primaria);border:0;font-weight:700}
.btn-white:hover{transform:translateY(-2px);background:#f8fafc}

/* HERO full-width com parallax */
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

/* barra de prova social */
.trust{background:var(--escura);color:#fff}
.trust .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:30px 0}
.trust .it{text-align:center;padding:10px}
.trust .it b{display:block;font-family:'Plus Jakarta Sans';font-size:1.9rem;color:#fff;line-height:1}
.trust .it .st{display:flex;justify-content:center;margin-bottom:4px}
.trust .it span{font-size:.84rem;color:#9fb3c8}

section{padding:88px 0}
.sec-head{text-align:center;max-width:660px;margin:0 auto 54px}
.kicker{display:inline-flex;align-items:center;gap:8px;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--primaria);background:color-mix(in srgb,var(--primaria) 12%,#fff);padding:7px 15px;border-radius:999px;margin-bottom:16px}
.sec-head h2{font-size:clamp(1.8rem,3.4vw,2.6rem);font-weight:800;color:var(--escura)}
.sec-head p{color:#64748b;margin-top:13px;font-size:1.06rem}

.servicos{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.servicos.s4{grid-template-columns:repeat(4,1fr)}
.servicos.s2{grid-template-columns:repeat(2,1fr);max-width:760px;margin:0 auto}
.card{background:#fff;border:1px solid #eef2f6;border-radius:20px;padding:32px 28px;transition:transform .2s,box-shadow .2s,border-color .2s}
.card:hover{transform:translateY(-7px);box-shadow:0 26px 50px -22px rgba(15,41,66,.32);border-color:color-mix(in srgb,var(--primaria) 34%,#eef2f6)}
.card .ic{width:56px;height:56px;border-radius:15px;background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 16%,#fff),color-mix(in srgb,var(--secundaria) 14%,#fff));color:var(--primaria);display:grid;place-items:center;margin-bottom:20px}
.card .ic svg{width:27px;height:27px}
.card h3{font-size:1.18rem;color:var(--escura);margin-bottom:9px}
.card p{color:#64748b;font-size:.97rem}

.dif{background:var(--clara)}
.dif .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.dif .row{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid #eef2f6;border-radius:16px;padding:22px 24px;transition:transform .2s,box-shadow .2s}
.dif .row:hover{transform:translateX(4px);box-shadow:0 16px 34px -22px rgba(15,41,66,.3)}
.dif .row .ic{width:46px;height:46px;flex:0 0 46px;border-radius:12px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:#fff;display:grid;place-items:center}
.dif .row .ic svg{width:23px;height:23px}
.dif .row h3{font-size:1.08rem;color:var(--escura);margin-bottom:4px}
.dif .row p{color:#64748b;font-size:.95rem}

.sobre .grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.sobre .art{position:relative}
.sobre .art .foto{border-radius:22px;overflow:hidden;aspect-ratio:5/4;box-shadow:0 28px 56px -22px rgba(15,41,66,.36)}
.sobre .art .foto img{width:100%;height:100%;object-fit:cover}
.sobre .art .badge{position:absolute;right:-18px;bottom:-18px;background:linear-gradient(135deg,var(--primaria),var(--secundaria));color:#fff;border-radius:18px;padding:18px 22px;box-shadow:0 20px 40px -14px color-mix(in srgb,var(--primaria) 60%,transparent);text-align:center}
.sobre .art .badge b{font-family:'Plus Jakarta Sans';font-size:1.8rem;display:block;line-height:1}
.sobre .art .badge small{font-size:.74rem;opacity:.9}
.sobre h2{font-size:clamp(1.7rem,3vw,2.4rem);color:var(--escura);margin-bottom:18px}
.sobre p{color:#475569;font-size:1.06rem;margin-bottom:16px}
.sobre .nums{display:flex;gap:16px;margin-top:26px;flex-wrap:wrap}
.sobre .num{background:var(--clara);border:1px solid #eef2f6;border-radius:16px;padding:16px 22px;text-align:center;flex:1;min-width:120px}
.sobre .num b{display:block;font-family:'Plus Jakarta Sans';font-size:1.7rem;color:var(--primaria)}
.sobre .num span{font-size:.8rem;color:#64748b}

.galeria{background:var(--clara)}
.gal{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.gal a{border-radius:16px;overflow:hidden;aspect-ratio:1;box-shadow:0 14px 30px -20px rgba(15,41,66,.4)}
.gal a:first-child{grid-column:span 2;grid-row:span 2;aspect-ratio:auto}
.gal img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.gal a:hover img{transform:scale(1.07)}

.depo{background:var(--escura);color:#fff}
.depo .sec-head h2{color:#fff}.depo .sec-head p{color:#9fb3c8}.depo .kicker{background:rgba(255,255,255,.1);color:#ffd76a}
.depos{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.depos .d{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:26px;transition:transform .2s,background .2s}
.depos .d:hover{transform:translateY(-5px);background:rgba(255,255,255,.07)}
.depos .d .q{color:#e6eef5;font-size:.98rem;line-height:1.6;margin:12px 0 18px}
.depos .d .who{display:flex;align-items:center;gap:12px}
.depos .d .av{width:44px;height:44px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,var(--primaria),var(--secundaria));display:grid;place-items:center;color:#fff;font-weight:700;font-family:'Plus Jakarta Sans'}
.depos .d .who b{font-size:.95rem;color:#fff;display:block}
.depos .d .who span{font-size:.78rem;color:#9fb3c8}
.gsel{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;color:#9fb3c8;margin-top:8px}

.faq .wrap{max-width:820px}
.faq-item{border:1px solid #e8edf2;border-radius:14px;margin-bottom:12px;overflow:hidden;background:#fff;transition:box-shadow .2s}
.faq-item.open{box-shadow:0 16px 34px -22px rgba(15,41,66,.3)}
.faq-item button{width:100%;text-align:left;background:0;border:0;padding:20px 22px;font-size:1.04rem;font-weight:600;color:var(--escura);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:inherit}
.faq-item .sig{flex:0 0 auto;transition:transform .25s;color:var(--primaria)}
.faq-item.open .sig{transform:rotate(45deg)}
.faq-item .ans{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;padding:0 22px;color:#64748b}
.faq-item.open .ans{max-height:320px;padding:0 22px 22px}

.local .grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:stretch}
.local .info{display:flex;flex-direction:column;justify-content:center}
.local .linha{display:flex;gap:14px;align-items:flex-start;margin-bottom:20px}
.local .linha .ic{width:46px;height:46px;flex:0 0 46px;border-radius:12px;background:color-mix(in srgb,var(--primaria) 12%,#fff);color:var(--primaria);display:grid;place-items:center}
.local .linha .ic svg{width:22px;height:22px}
.local .mapa{border-radius:20px;overflow:hidden;min-height:360px;box-shadow:0 20px 44px -22px rgba(15,41,66,.3);border:1px solid #eef2f6}
.local .mapa iframe{width:100%;height:100%;min-height:360px;border:0;display:block}

.cta-final{position:relative;overflow:hidden;color:#fff;text-align:center}
.cta-final .bg{position:absolute;inset:0;z-index:0}.cta-final .bg img{width:100%;height:100%;object-fit:cover}
.cta-final .ov{position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,color-mix(in srgb,var(--primaria) 92%,#000),color-mix(in srgb,var(--secundaria) 82%,#000))}
.cta-final .wrap{position:relative;z-index:2;padding:88px 22px}
.cta-final h2{font-size:clamp(1.9rem,3.6vw,2.7rem);margin-bottom:14px}
.cta-final p{opacity:.94;max-width:540px;margin:0 auto 30px;font-size:1.1rem}

footer{background:var(--escura);color:#cbd5e1;padding:52px 0 30px}
footer .fg{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:30px;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,.08)}
footer .fbrand{font-family:'Plus Jakarta Sans';font-weight:800;font-size:1.3rem;color:#fff;margin-bottom:10px}
footer h4{color:#fff;font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
footer a{color:#cbd5e1;display:block;margin-bottom:8px;font-size:.94rem}footer a:hover{color:#fff}
footer .fsoc{display:flex;gap:12px;margin-top:14px}
footer .fsoc a{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.08);display:grid;place-items:center;margin:0}
footer .fsoc a:hover{background:var(--primaria)}
footer .fbot{text-align:center;padding-top:22px;color:#7c93a8;font-size:.82rem}

@media(max-width:900px){.servicos,.depos{grid-template-columns:1fr 1fr}.dif .grid{grid-template-columns:1fr}.sobre .grid,.local .grid{grid-template-columns:1fr}.gal{grid-template-columns:repeat(2,1fr)}.trust .grid{grid-template-columns:1fr 1fr}.top nav{display:none}footer .fg{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.servicos,.depos{grid-template-columns:1fr}.gal a:first-child{grid-column:span 2}footer .fg{grid-template-columns:1fr}}
`;

export function templateSaude(d: SiteData): string {
  const nota = fmtNota(d.rating);
  const revs = fmtReviews(d.reviews);
  const cta = ctaHref(d);
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  const rev = (i: number) => ` style="--d:${i * 90}ms"`;

  const trust = `<div class="trust"><div class="wrap"><div class="grid">
${d.rating != null ? `<div class="it reveal"><div class="st">${estrelas(d.rating, 16)}</div><b>${nota}</b><span>nota no Google</span></div>` : ""}
${d.reviews ? `<div class="it reveal"${rev(1)}><b>${revs}</b><span>avaliações reais</span></div>` : ""}
<div class="it reveal"${rev(2)}><b>${esc(d.categoriaLabel)}</b><span>especialidade</span></div>
${local ? `<div class="it reveal"${rev(3)}><b>${esc(local)}</b><span>atendimento</span></div>` : ""}
</div></div></div>`;

  const gClasse = d.servicos.length === 4 ? " s4" : d.servicos.length === 2 ? " s2" : "";
  const servicos = d.servicos.length
    ? `<section id="servicos"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("tooth")} Nossos serviços</span><h2>Tratamentos com excelência</h2><p>Cuidado completo e personalizado para você e sua família.</p></div>
<div class="servicos${gClasse}">${d.servicos.map((s, i) => `<div class="card reveal"${rev(i % 3)}><div class="ic">${icone(s.icone)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div>`).join("")}</div></div></section>`
    : "";

  const dif = d.diferenciais.length
    ? `<section class="dif"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("award")} Por que escolher</span><h2>O cuidado que faz diferença</h2></div>
<div class="grid">${d.diferenciais.map((s, i) => `<div class="row reveal"${rev(i % 2)}><div class="ic">${icone(s.icone)}</div><div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div></div>`).join("")}</div></div></section>`
    : "";

  const nums = [
    d.rating != null ? `<div class="num"><b>${nota}</b><span>nota no Google</span></div>` : "",
    d.reviews ? `<div class="num"><b>${revs}</b><span>avaliações</span></div>` : "",
    d.rating != null && d.rating >= 4.7
      ? `<div class="num"><b>Top</b><span>referência local</span></div>`
      : "",
  ].join("");

  const sobre = d.sobre
    ? `<section id="sobre" class="sobre"><div class="wrap"><div class="grid">
<div class="art reveal"><div class="foto"><img src="${esc(d.fotoSobre)}" alt="${esc(d.nome)}" loading="lazy"></div>${d.rating != null ? `<div class="badge"><b>${nota}</b><small>${revs ? revs + " avaliações" : "Google"}</small></div>` : ""}</div>
<div class="reveal"${rev(1)}><span class="kicker">${icone("heart")} Sobre nós</span><h2>${esc(d.nome)}</h2><p>${esc(d.sobre)}</p>${nums ? `<div class="nums">${nums}</div>` : ""}
<a class="btn btn-p" style="margin-top:26px" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a></div>
</div></div></section>`
    : "";

  const galeria =
    d.fotos.length >= 3
      ? `<section class="galeria"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("camera")} Ambiente</span><h2>Conheça nosso espaço</h2></div>
<div class="gal reveal">${d.fotos
          .slice(0, 3)
          .map(
            (f) =>
              `<a href="${esc(f)}" target="_blank" rel="noopener"><img src="${esc(f)}" alt="${esc(d.nome)}" loading="lazy"></a>`,
          )
          .join("")}</div></div></section>`
      : "";

  const inicial = (n: string | null) => (n ? n.trim().charAt(0).toUpperCase() : "★");
  const depo = d.depoimentos.length
    ? `<section class="depo"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("message-circle")} Depoimentos reais</span><h2>O que dizem no Google</h2><p>Avaliações reais de quem já foi atendido.</p></div>
<div class="depos">${d.depoimentos
        .slice(0, 6)
        .map(
          (r, i) =>
            `<div class="d reveal"${rev(i % 3)}>${estrelas(r.rating ?? d.rating ?? 5, 16)}<p class="q">"${esc(r.text.length > 240 ? r.text.slice(0, 237) + "…" : r.text)}"</p><div class="who">${r.photo ? `<img class="av" src="${esc(r.photo)}" alt="${esc(r.author ?? "")}" loading="lazy">` : `<span class="av">${esc(inicial(r.author))}</span>`}<div><b>${esc(r.author ?? "Cliente")}</b><span class="gsel">${icone("check-circle")} via Google${r.when ? " · " + esc(r.when) : ""}</span></div></div></div>`,
        )
        .join("")}</div></div></section>`
    : "";

  const faq = d.faq.length
    ? `<section id="faq" class="faq"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("message-circle")} Dúvidas</span><h2>Perguntas frequentes</h2></div>
<div class="reveal">${d.faq.map((f) => `<div class="faq-item"><button type="button">${esc(f.pergunta)}<span class="sig"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button><div class="ans"><p style="padding-top:2px">${esc(f.resposta)}</p></div></div>`).join("")}</div></div></section>`
    : "";

  const local_sec =
    d.endereco || d.mapEmbedUrl
      ? `<section id="contato" class="local"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("map-pin")} Onde estamos</span><h2>Venha nos visitar</h2></div>
<div class="grid"><div class="info reveal">
${d.endereco ? `<div class="linha"><div class="ic">${icone("map-pin")}</div><div><strong>Endereço</strong><br>${esc(d.endereco)}${d.mapsUrl ? `<br><a href="${esc(d.mapsUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:600">Como chegar →</a>` : ""}</div></div>` : ""}
${d.telefone ? `<div class="linha"><div class="ic">${icone("phone")}</div><div><strong>Telefone</strong><br>${esc(d.telefone)}</div></div>` : ""}
${d.whatsappUrl ? `<div class="linha"><div class="ic">${icone("message-circle")}</div><div><strong>WhatsApp</strong><br><a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener" style="color:var(--primaria);font-weight:600">Chamar agora →</a></div></div>` : ""}
<a class="btn btn-p" style="margin-top:8px;align-self:flex-start" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>
</div>
${d.mapEmbedUrl ? `<div class="mapa reveal"${rev(1)}><iframe src="${esc(d.mapEmbedUrl)}" loading="lazy" title="Mapa" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ""}
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

  const navLinks = [
    servicos ? '<a href="#servicos">Serviços</a>' : "",
    sobre ? '<a href="#sobre">Sobre</a>' : "",
    depo ? '<a href="#contato">Contato</a>' : '<a href="#contato">Contato</a>',
  ].join("");

  return `${head(d, "", CSS)}
<body>
<header class="top"><div class="wrap bar">
<div class="brand"><span class="dot">${icone("tooth")}</span>${esc(d.nome)}</div>
<nav>${navLinks}</nav>
<a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>
</div></header>

<section class="hero">
<div class="parallax"><img src="${esc(d.fotoHero)}" alt="${esc(d.nome)}"></div>
<div class="ov"></div>
<div class="wrap">
<span class="selo reveal">${estrelas(d.rating ?? 5, 15)} <b>${nota || "5,0"}</b> · ${revs ? revs + " avaliações no Google" : "avaliação no Google"}</span>
<h1 class="reveal"${rev(1)}>${esc(d.headline)}</h1>
<p class="sub reveal"${rev(2)}>${esc(d.subheadline)}</p>
<div class="acoes reveal"${rev(3)}><a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>${d.mapsUrl ? `<a class="btn btn-ghost" href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">${icone("map-pin")} Como chegar</a>` : ""}</div>
<div class="mini reveal"${rev(4)}>${icone("check-circle")} ${esc(d.categoriaLabel)}${local ? " · " + esc(local) : ""}</div>
</div>
<div class="scroll"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></div>
</section>

${trust}
${servicos}
${dif}
${sobre}
${galeria}
${depo}
${faq}
${local_sec}

<section class="cta-final">
<div class="bg"><img src="${esc(d.fotoCta)}" alt=""></div><div class="ov"></div>
<div class="wrap">
<h2 class="reveal">${esc(d.headline)}</h2>
<p class="reveal"${rev(1)}>Agende agora pelo WhatsApp e cuide do seu sorriso com quem é referência${local ? " em " + esc(local) : ""}.</p>
<a class="btn btn-white reveal"${rev(2)} href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>
</div></section>

<footer><div class="wrap">
<div class="fg">
<div><div class="fbrand">${esc(d.nome)}</div><p style="color:#9fb3c8;font-size:.92rem;max-width:280px">${esc(d.categoriaLabel)}${local ? " em " + esc(local) : ""}. ${d.rating != null ? `Nota ${nota} no Google${revs ? " · " + revs + " avaliações" : ""}.` : ""}</p>${social ? `<div class="fsoc">${social}</div>` : ""}</div>
<div><h4>Navegação</h4>${servicos ? '<a href="#servicos">Serviços</a>' : ""}${sobre ? '<a href="#sobre">Sobre</a>' : ""}${faq ? '<a href="#faq">Dúvidas</a>' : ""}<a href="#contato">Contato</a></div>
<div><h4>Contato</h4>${d.telefone ? `<a href="${esc(d.telUrl ?? "#")}">${esc(d.telefone)}</a>` : ""}${d.whatsappUrl ? `<a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${d.mapsUrl ? `<a href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">Como chegar</a>` : ""}</div>
</div>
<div class="fbot">© <span id="__ano">2026</span> ${esc(d.nome)}. Site desenvolvido com Flow Leads.</div>
</div></footer>
${waFloat(d)}
${scriptAnim()}
</body></html>`;
}
