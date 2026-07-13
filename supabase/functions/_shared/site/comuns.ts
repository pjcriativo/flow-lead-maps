// Átomos compartilhados pelos 3 templates: formatação de nota, estrelas, botão
// flutuante de WhatsApp, <head> com fontes premium e variáveis de cor. Mantém a
// consistência visual (nível agência) e evita repetição.
import type { SiteData } from "./tipos.ts";
import { esc } from "./dados.ts";

export function fmtNota(rating: number | null): string {
  if (rating == null) return "";
  return rating.toFixed(1).replace(".", ",");
}

export function fmtReviews(reviews: number | null): string {
  if (!reviews) return "";
  return reviews.toLocaleString("pt-BR");
}

/** 5 estrelas preenchidas conforme a nota (meia-estrela via gradiente). */
export function estrelas(rating: number | null, tamanho = 20): string {
  const r = rating ?? 0;
  let out = "";
  for (let i = 1; i <= 5; i++) {
    const fill = r >= i ? 1 : r > i - 1 ? r - (i - 1) : 0;
    const id = `st${i}-${Math.round(fill * 100)}`;
    out += `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}"><stop offset="${fill * 100}%" stop-color="#f5b301"/><stop offset="${fill * 100}%" stop-color="#d7d7d7"/></linearGradient></defs><path fill="url(#${id})" d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3Z"/></svg>`;
  }
  return `<span class="estrelas" style="display:inline-flex;gap:2px;line-height:0">${out}</span>`;
}

/** CTA principal: WhatsApp > telefone > mapa > âncora de contato. Nunca vazio. */
export function ctaHref(d: SiteData): string {
  return d.whatsappUrl ?? d.telUrl ?? d.mapsUrl ?? "#contato";
}

/** Botão flutuante de WhatsApp (só aparece se houver WhatsApp real). */
export function waFloat(d: SiteData): string {
  if (!d.whatsappUrl) return "";
  return `<a class="wa-float" href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5 0-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.7 2.6 4.1 3.6 1.9.8 2.3.7 2.7.6.4 0 1.4-.5 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.2Z"/></svg>
<span>WhatsApp</span></a>`;
}

/** <head> premium: fontes Google, reset, variáveis de cor e o WhatsApp float CSS. */
export function head(d: SiteData, fonteExtraCss: string, css: string): string {
  const desc = esc(
    `${d.nome} — ${d.categoriaLabel}${d.cidade ? " em " + d.cidade : ""}. ${d.subheadline}`,
  ).slice(0, 180);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.nome)} — ${esc(d.categoriaLabel)}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${esc(d.nome)}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${esc(d.fotoHero)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{--primaria:${d.cores.primaria};--secundaria:${d.cores.secundaria};--escura:${d.cores.escura};--clara:${d.cores.clara};--contraste:${d.cores.contraste}}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1e293b;line-height:1.65;background:#fff;-webkit-font-smoothing:antialiased}
h1,h2,h3,.display{font-family:'Plus Jakarta Sans','Inter',sans-serif;line-height:1.15;letter-spacing:-.02em}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
.wrap{width:100%;max-width:1140px;margin:0 auto;padding:0 22px}
.wa-float{position:fixed;right:18px;bottom:18px;z-index:60;display:inline-flex;align-items:center;gap:9px;background:#25d366;color:#fff;font-weight:700;font-size:.95rem;padding:13px 20px;border-radius:999px;box-shadow:0 12px 30px rgba(37,211,102,.45);transition:transform .15s ease,box-shadow .15s ease;animation:waPulse 2.4s ease-in-out infinite}
.wa-float:hover{transform:translateY(-2px);box-shadow:0 16px 38px rgba(37,211,102,.55)}
@keyframes waPulse{0%,100%{box-shadow:0 12px 30px rgba(37,211,102,.45)}50%{box-shadow:0 12px 30px rgba(37,211,102,.45),0 0 0 12px rgba(37,211,102,.12)}}
/* reveal no scroll (respeita prefers-reduced-motion) */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0ms)}
.reveal.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}.wa-float{animation:none}}
${fonteExtraCss}
${css}
@media(max-width:640px){.wa-float span{display:none}.wa-float{padding:15px;border-radius:50%}}
</style>
</head>`;
}

/**
 * Script de animações (no fim do <body>): reveal no scroll via IntersectionObserver,
 * parallax sutil no hero (.parallax), e accordion do FAQ (.faq-item > button).
 * Sem dependências. Respeita prefers-reduced-motion.
 */
export function scriptAnim(): string {
  return `<script>(function(){
var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var els=[].slice.call(document.querySelectorAll('.reveal'));
if(rm||!('IntersectionObserver'in window)){els.forEach(function(e){e.classList.add('in')});}
else{var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}})},{threshold:.12,rootMargin:'0px 0px -8% 0px'});els.forEach(function(e){io.observe(e)});}
var px=document.querySelector('.parallax');
if(px&&!rm){window.addEventListener('scroll',function(){var y=window.pageYOffset;px.style.transform='translateY('+(y*.18)+'px)';},{passive:true});}
[].slice.call(document.querySelectorAll('.faq-item')).forEach(function(it){var b=it.querySelector('button');if(b){b.addEventListener('click',function(){var open=it.classList.contains('open');[].slice.call(document.querySelectorAll('.faq-item.open')).forEach(function(o){if(o!==it)o.classList.remove('open')});it.classList.toggle('open',!open);});}});
var yr=document.getElementById('__ano');if(yr){yr.textContent=new Date().getFullYear();}
})();</script>`;
}
