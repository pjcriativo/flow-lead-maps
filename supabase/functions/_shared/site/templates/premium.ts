// Template PREMIUM genérico (nível agência), dirigido por config de nicho.
// O DESIGN é o mesmo do saúde; só a COPY de rótulos e os ícones mudam por nicho.
// PROVA SOCIAL 100% CONDICIONAL: sem nota/avaliações NÃO renderiza estrela nem
// número falso — troca por elementos reais (categoria, cidade, nº de áreas).
// Depoimentos/galeria/FAQ omitidos quando não há dado. É o MOTOR, não o caso.
import type { SiteData } from "../tipos.ts";
import { esc } from "../dados.ts";
import { icone } from "../icones.ts";
import { head, waFloat, estrelas, fmtNota, fmtReviews, ctaHref, scriptAnim } from "../comuns.ts";
import { heroBloco } from "./heros.ts";

export type NichoCfg = {
  /**
   * CLIMA visual do HERO. "escuro-premium" = fundo escuro dramático + dourado +
   * serif display + imagem editorial (advocacia/contador/consultoria). "claro" =
   * o hero limpo/claro atual (saúde/estética — têm padrão premium próprio, NÃO
   * aplicar o escuro aqui). Só o HERO muda por clima; o resto do template é igual.
   */
  clima: "escuro-premium" | "claro";
  brandIcon: string;
  navServicos: string;
  servKicker: string;
  servTitulo: string;
  servSub: string;
  difKicker: string;
  difTitulo: string;
  sobreIcon: string;
  sobreKicker: string;
  galKicker: string;
  galTitulo: string;
  depoKicker: string;
  depoTitulo: string;
  depoSub: string;
  faqKicker: string;
  faqTitulo: string;
  localKicker: string;
  localTitulo: string;
  /** rótulo plural dos serviços p/ a barra (ex.: "áreas de atuação"). */
  termoServicos: string;
  /** parágrafo do CTA final (recebe "em Cidade" ou ""). */
  ctaPar: (local: string) => string;
};

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
.btn-ghost{background:rgba(255,255,255,.14);color:#fff;border:1.5px solid rgba(255,255,255,.4)}
.btn-ghost:hover{background:rgba(255,255,255,.24)}
.btn-white{background:#fff;color:var(--primaria);border:0;font-weight:700}
.btn-white:hover{transform:translateY(-2px);background:#f8fafc}
.trust{background:var(--escura);color:#fff}
.trust .grid{display:grid;gap:10px;padding:30px 0}
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
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
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
.faq-item.open .ans{max-height:600px;padding:0 22px 22px}
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
@media(max-width:900px){.servicos,.servicos.s4,.servicos.s2,.depos{grid-template-columns:1fr 1fr}.dif .grid{grid-template-columns:1fr}.sobre .grid,.local .grid{grid-template-columns:1fr}.gal{grid-template-columns:repeat(2,1fr)}.trust .grid{grid-template-columns:1fr 1fr !important}.top nav{display:none}footer .fg{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.servicos,.servicos.s4,.servicos.s2,.depos{grid-template-columns:1fr}.gal a:first-child{grid-column:span 2}footer .fg{grid-template-columns:1fr}}
`;

// ===== TEMA ESCURO-PREMIUM (só clima "escuro-premium": advocacia/contador/etc.) =====
// Layer de TEMA por cima do CSS estrutural: recolore o corpo inteiro pro padrão
// agência (grafite dominante + dourado + serif Playfair nas seções), redesenha os
// cards (profundidade, borda dourada, número índice serifado 01-06 via counter),
// transforma "por que escolher" em bloco de autoridade, e adiciona acabamento
// editorial (fio ornamental + losango dourado sob cada título). NÃO muda o HTML
// (saúde/claro recebe só o CSS claro — sem regressão). Playfair já vem do hero.
// Redefinir as vars de paleta recolore gradientes de botão e links inline de graça.
const CSS_ESCURO = `
:root{--primaria:#c9a24b;--secundaria:#e6c87d;--escura:#0a1520;--clara:#0f2136;--contraste:#17130a;--ouro:#c9a24b;--ouro2:#e6c87d;--breu:#0a1520;--breu2:#0f2136;--card1:#101f33;--card2:#0b1626;--linha:rgba(201,162,75,.22);--tx:#f2f6fa;--tx2:#c4d3e1;--mut:#8ea3b8}
body{background:var(--breu);color:var(--tx2)}
::selection{background:rgba(201,162,75,.28);color:#fff}

/* header escuro translúcido + dourado */
header.top{background:rgba(10,21,32,.72);border-bottom:1px solid rgba(201,162,75,.16);transition:background .3s,box-shadow .3s,border-color .3s}
header.top.scrolled{background:rgba(7,15,24,.94);box-shadow:0 12px 34px -16px rgba(0,0,0,.72);border-bottom-color:rgba(201,162,75,.3)}
.top .bar{height:78px}
.brand{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#fff}
.brand .dot{background:linear-gradient(135deg,var(--ouro2),var(--ouro));color:#17130a;box-shadow:0 8px 20px -8px rgba(201,162,75,.6)}
.top nav a{color:var(--tx2)}
.top nav a:hover{color:var(--ouro2)}

/* botões: dourado sólido (texto escuro via --contraste) */
.btn-p{box-shadow:0 12px 28px -10px rgba(201,162,75,.5)}
.btn-p:hover{filter:brightness(1.06);box-shadow:0 18px 38px -10px rgba(201,162,75,.6)}
.btn-white{background:linear-gradient(135deg,var(--ouro2),var(--ouro));color:#17130a}
.btn-white:hover{background:linear-gradient(135deg,#f0d491,var(--ouro))}

/* faixa de prova: números serifados dourados + divisores finos */
.trust{background:var(--breu2);border-top:1px solid var(--linha);border-bottom:1px solid var(--linha)}
.trust .grid{padding:34px 0}
.trust .it{position:relative}
.trust .it+.it::before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);height:40px;width:1px;background:var(--linha)}
.trust .it b{font-family:'Playfair Display',serif;font-weight:700;font-size:2rem;color:var(--ouro2)}
.trust .it span{color:var(--mut);text-transform:uppercase;letter-spacing:.05em;font-size:.72rem}

/* base de seção: respiro maior + título serif + kicker dourado + ornamento */
section{padding:104px 0}
.sec-head{max-width:680px;margin:0 auto 60px}
.kicker{background:none;border:0;padding:0;color:var(--ouro);letter-spacing:.2em;font-size:.75rem;font-weight:700;margin-bottom:18px}
.kicker svg{width:15px;height:15px;color:var(--ouro)}
.sec-head h2{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#fff;font-size:clamp(2rem,3.6vw,2.9rem);position:relative;padding-bottom:26px}
.sec-head h2::after{content:"";position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:70px;height:1px;background:linear-gradient(90deg,transparent,var(--ouro),transparent)}
.sec-head h2::before{content:"";position:absolute;left:50%;bottom:-3px;transform:translateX(-50%) rotate(45deg);width:7px;height:7px;background:var(--ouro)}
.sec-head p{color:var(--tx2);font-size:1.08rem;margin-top:24px}

/* serviços/áreas: cards com profundidade, número índice 01-06 e ícone dourado */
.servicos{counter-reset:serv;gap:24px}
.card{position:relative;overflow:hidden;background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.16);border-radius:18px;padding:40px 30px 32px}
.card::before{counter-increment:serv;content:counter(serv,decimal-leading-zero);position:absolute;top:18px;right:24px;font-family:'Playfair Display',serif;font-weight:700;font-size:2.7rem;line-height:1;color:rgba(201,162,75,.22);transition:color .22s}
.card::after{content:"";position:absolute;left:0;top:0;height:3px;width:0;background:linear-gradient(90deg,var(--ouro2),var(--ouro));transition:width .35s ease}
.card:hover{transform:translateY(-7px);border-color:rgba(201,162,75,.5);box-shadow:0 34px 66px -30px rgba(0,0,0,.75)}
.card:hover::before{color:rgba(201,162,75,.42)}
.card:hover::after{width:100%}
.card .ic{width:54px;height:54px;border-radius:13px;background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.32);color:var(--ouro2);margin-bottom:22px}
.card h3{color:#fff;font-size:1.2rem;letter-spacing:-.01em}
.card p{color:var(--mut)}

/* por que escolher: bloco de autoridade (barra dourada + ícone dourado + profundidade) */
.dif{background:var(--breu2)}
.dif .grid{gap:22px}
.dif .row{background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.15);border-left:3px solid var(--ouro);border-radius:14px;padding:26px 28px}
.dif .row:hover{transform:translateX(5px);box-shadow:0 22px 46px -28px rgba(0,0,0,.7);border-color:rgba(201,162,75,.4);border-left-color:var(--ouro2)}
.dif .row .ic{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.3);color:var(--ouro2)}
.dif .row h3{color:#fff}
.dif .row p{color:var(--mut)}

/* sobre: spread editorial (foto emoldurada dourada + selo dourado + serif) */
.sobre{background:var(--breu)}
.sobre .grid{gap:60px}
.sobre .art .foto{border:1px solid rgba(201,162,75,.25);box-shadow:0 34px 66px -28px rgba(0,0,0,.75)}
.sobre .art .badge{color:#17130a;box-shadow:0 20px 40px -14px rgba(201,162,75,.5)}
.sobre .art .badge b{font-family:'Playfair Display',serif}
.sobre h2{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:#fff;font-size:clamp(1.9rem,3.2vw,2.6rem);position:relative;padding-bottom:20px;margin-bottom:22px}
.sobre h2::after{content:"";position:absolute;left:0;bottom:0;width:60px;height:1px;background:linear-gradient(90deg,var(--ouro),transparent)}
.sobre h2::before{content:"";position:absolute;left:0;bottom:-3px;transform:rotate(45deg);width:7px;height:7px;background:var(--ouro)}
.sobre p{color:var(--tx2)}
.sobre .nums{gap:16px;margin-top:30px}
.sobre .num{background:rgba(201,162,75,.06);border:1px solid rgba(201,162,75,.2)}
.sobre .num b{font-family:'Playfair Display',serif;color:var(--ouro2)}
.sobre .num span{color:var(--mut)}

/* galeria */
.galeria{background:var(--breu2)}
.gal a{border:1px solid rgba(201,162,75,.16);box-shadow:0 18px 36px -24px rgba(0,0,0,.7)}
.gal img{filter:saturate(.9)}

/* depoimentos: cartão escuro com aspas serifadas douradas */
.depo{background:var(--breu)}
.depo .sec-head h2{color:#fff}
.depo .sec-head p{color:var(--tx2)}
.depo .kicker{background:none;color:var(--ouro)}
.depos .d{position:relative;background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.16);border-radius:18px}
.depos .d::before{content:"\\201C";position:absolute;top:2px;right:22px;font-family:'Playfair Display',serif;font-size:4rem;line-height:1;color:rgba(201,162,75,.24)}
.depos .d:hover{background:linear-gradient(160deg,#12233a,#0d1a2c);border-color:rgba(201,162,75,.32)}
.depos .d .q{color:var(--tx)}
.depos .d .av{color:#17130a}
.depos .d .who b{color:#fff}
.depos .d .who span,.gsel{color:var(--mut)}

/* faq escuro */
.faq{background:var(--breu2)}
.faq-item{background:linear-gradient(160deg,var(--card1),var(--card2));border:1px solid rgba(201,162,75,.16)}
.faq-item.open{border-color:rgba(201,162,75,.4);box-shadow:0 20px 44px -26px rgba(0,0,0,.7)}
.faq-item button{color:#fff}
.faq-item .sig{color:var(--ouro2)}
.faq-item .ans{color:var(--tx2)}

/* contato: ícones dourados, mapa emoldurado, textos legíveis */
.local{background:var(--breu)}
.local .linha .ic{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.3);color:var(--ouro2)}
.local .info{color:var(--tx2)}
.local .info strong{color:#fff}
.local .mapa{border:1px solid rgba(201,162,75,.25);filter:saturate(.92) contrast(1.03)}

/* cta final: overlay escuro + título serif + ornamento */
.cta-final .ov{background:linear-gradient(135deg,rgba(9,18,28,.94),rgba(9,18,28,.82)),linear-gradient(0deg,var(--breu),transparent 62%)}
.cta-final .wrap{padding:108px 22px}
.cta-final h2{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:clamp(2rem,3.8vw,3rem);position:relative;padding-bottom:28px}
.cta-final h2::after{content:"";position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:70px;height:1px;background:linear-gradient(90deg,transparent,var(--ouro),transparent)}
.cta-final h2::before{content:"";position:absolute;left:50%;bottom:9px;transform:translateX(-50%) rotate(45deg);width:7px;height:7px;background:var(--ouro)}
.cta-final p{color:var(--tx2)}

/* footer: grafite mais profundo + dourado */
footer{background:#060e17;color:var(--tx2);border-top:1px solid var(--linha)}
footer .fbrand{font-family:'Playfair Display',serif;color:#fff}
footer h4{color:var(--ouro2)}
footer a{color:var(--tx2)}
footer a:hover{color:var(--ouro2)}
footer .fsoc a{background:rgba(201,162,75,.1);border:1px solid rgba(201,162,75,.24);color:var(--ouro2)}
footer .fsoc a:hover{background:var(--ouro);color:#17130a;border-color:var(--ouro)}
footer .fbot{color:var(--mut);border-top-color:rgba(255,255,255,.06)}

/* responsivo: faixa some divisores e VIRA 1 COLUNA no celular pequeno — o rótulo
   longo em serif 2rem estouraria a grade de 2 col a ~360px. Blindagem de quebra. */
.trust .it{min-width:0}
.trust .it b{overflow-wrap:anywhere}
@media(max-width:900px){.trust .it+.it::before{display:none}}
@media(max-width:560px){section{padding:78px 0}.trust .grid{grid-template-columns:1fr!important}.trust .it b{font-size:1.7rem}}
`;

export function templatePremium(d: SiteData, cfg: NichoCfg): string {
  const nota = fmtNota(d.rating);
  const revs = fmtReviews(d.reviews);
  const cta = ctaHref(d);
  const temNota = d.rating != null;
  const local = d.cidade ? `${d.cidade}${d.estado ? "/" + d.estado : ""}` : "";
  const rev = (i: number) => ` style="--d:${i * 90}ms"`;

  // HERO — bloco da biblioteca (variante escolhida por semente em d.heroVar).
  const hero = heroBloco(d, cfg);

  // BARRA DE PROVA SOCIAL — só itens REAIS (sem nota/estrela falsa).
  const trustItems: string[] = [];
  if (temNota)
    trustItems.push(
      `<div class="it reveal"><div class="st">${estrelas(d.rating, 16)}</div><b>${nota}</b><span>nota no Google</span></div>`,
    );
  if (d.reviews)
    trustItems.push(`<div class="it reveal"><b>${revs}</b><span>avaliações reais</span></div>`);
  trustItems.push(
    `<div class="it reveal"><b>${esc(d.categoriaLabel)}</b><span>especialidade</span></div>`,
  );
  if (local)
    trustItems.push(`<div class="it reveal"><b>${esc(local)}</b><span>atendimento</span></div>`);
  if (!temNota && d.servicos.length)
    trustItems.push(
      `<div class="it reveal"><b>${d.servicos.length}</b><span>${esc(cfg.termoServicos)}</span></div>`,
    );
  const trust = trustItems.length
    ? `<div class="trust"><div class="wrap"><div class="grid" style="grid-template-columns:repeat(${trustItems.length},1fr)">${trustItems.join("")}</div></div></div>`
    : "";

  const gClasse = d.servicos.length === 4 ? " s4" : d.servicos.length === 2 ? " s2" : "";
  const servicos = d.servicos.length
    ? `<section id="servicos"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone(cfg.brandIcon)} ${esc(cfg.servKicker)}</span><h2>${esc(cfg.servTitulo)}</h2><p>${esc(cfg.servSub)}</p></div>
<div class="servicos${gClasse}">${d.servicos.map((s, i) => `<div class="card reveal"${rev(i % 3)}><div class="ic">${icone(s.icone)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div>`).join("")}</div></div></section>`
    : "";

  const dif = d.diferenciais.length
    ? `<section class="dif"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("award")} ${esc(cfg.difKicker)}</span><h2>${esc(cfg.difTitulo)}</h2></div>
<div class="grid">${d.diferenciais.map((s, i) => `<div class="row reveal"${rev(i % 2)}><div class="ic">${icone(s.icone)}</div><div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></div></div>`).join("")}</div></div></section>`
    : "";

  // NÚMEROS do "sobre" — só quando há nota (senão omite; nada inventado).
  const nums = temNota
    ? [
        `<div class="num"><b>${nota}</b><span>nota no Google</span></div>`,
        d.reviews ? `<div class="num"><b>${revs}</b><span>avaliações</span></div>` : "",
        d.rating! >= 4.7 ? `<div class="num"><b>Top</b><span>referência local</span></div>` : "",
      ].join("")
    : "";

  const sobre = d.sobre
    ? `<section id="sobre" class="sobre"><div class="wrap"><div class="grid">
<div class="art reveal"><div class="foto"><img src="${esc(d.fotoSobre)}" alt="${esc(d.nome)}" loading="lazy"></div>${temNota ? `<div class="badge"><b>${nota}</b><small>${revs ? revs + " avaliações" : "Google"}</small></div>` : ""}</div>
<div class="reveal"${rev(1)}><span class="kicker">${icone(cfg.sobreIcon)} ${esc(cfg.sobreKicker)}</span><h2>${esc(d.nome)}</h2><p>${esc(d.sobre)}</p>${nums ? `<div class="nums">${nums}</div>` : ""}
<a class="btn btn-p" style="margin-top:26px" href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a></div>
</div></div></section>`
    : "";

  const galeria =
    d.fotos.length >= 3
      ? `<section class="galeria"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("camera")} ${esc(cfg.galKicker)}</span><h2>${esc(cfg.galTitulo)}</h2></div>
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
    ? `<section class="depo"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("message-circle")} ${esc(cfg.depoKicker)}</span><h2>${esc(cfg.depoTitulo)}</h2><p>${esc(cfg.depoSub)}</p></div>
<div class="depos">${d.depoimentos
        .slice(0, 6)
        .map(
          (r, i) =>
            `<div class="d reveal"${rev(i % 3)}>${r.rating != null ? estrelas(r.rating, 16) : ""}<p class="q">"${esc(r.text.length > 240 ? r.text.slice(0, 237) + "…" : r.text)}"</p><div class="who">${r.photo ? `<img class="av" src="${esc(r.photo)}" alt="${esc(r.author ?? "")}" loading="lazy">` : `<span class="av">${esc(inicial(r.author))}</span>`}<div><b>${esc(r.author ?? "Cliente")}</b><span class="gsel">${icone("check-circle")} via Google${r.when ? " · " + esc(r.when) : ""}</span></div></div></div>`,
        )
        .join("")}</div></div></section>`
    : "";

  const faq = d.faq.length
    ? `<section id="faq" class="faq"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("message-circle")} ${esc(cfg.faqKicker)}</span><h2>${esc(cfg.faqTitulo)}</h2></div>
<div class="reveal">${d.faq.map((f) => `<div class="faq-item"><button type="button">${esc(f.pergunta)}<span class="sig"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button><div class="ans"><p style="padding-top:2px">${esc(f.resposta)}</p></div></div>`).join("")}</div></div></section>`
    : "";

  const local_sec =
    d.endereco || d.mapEmbedUrl
      ? `<section id="contato" class="local"><div class="wrap"><div class="sec-head reveal"><span class="kicker">${icone("map-pin")} ${esc(cfg.localKicker)}</span><h2>${esc(cfg.localTitulo)}</h2></div>
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
    servicos ? `<a href="#servicos">${esc(cfg.navServicos)}</a>` : "",
    sobre ? '<a href="#sobre">Sobre</a>' : "",
    '<a href="#contato">Contato</a>',
  ].join("");

  // Corpo CLARO (saúde/estética) OU ESCURO-PREMIUM (profissional): o segundo
  // layeriza o tema escuro por cima da estrutura — saúde nunca é afetada.
  const bodyCss = cfg.clima === "escuro-premium" ? CSS + CSS_ESCURO : CSS;
  return `${head(d, "", bodyCss + hero.css)}
<body>
<header class="top"><div class="wrap bar">
<div class="brand"><span class="dot">${icone(cfg.brandIcon)}</span>${esc(d.nome)}</div>
<nav>${navLinks}</nav>
<a class="btn btn-p" href="${esc(cta)}" target="_blank" rel="noopener">${esc(d.cta)}</a>
</div></header>

${hero.html}

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
<p class="reveal"${rev(1)}>${esc(cfg.ctaPar(local ? " em " + local : ""))}</p>
<a class="btn btn-white reveal"${rev(2)} href="${esc(cta)}" target="_blank" rel="noopener">${icone("message-circle")} ${esc(d.cta)}</a>
</div></section>

<footer><div class="wrap">
<div class="fg">
<div><div class="fbrand">${esc(d.nome)}</div><p style="color:#9fb3c8;font-size:.92rem;max-width:280px">${esc(d.categoriaLabel)}${local ? " em " + esc(local) : ""}.${temNota ? ` Nota ${nota} no Google${revs ? " · " + revs + " avaliações" : ""}.` : ""}</p>${social ? `<div class="fsoc">${social}</div>` : ""}</div>
<div><h4>Navegação</h4>${servicos ? `<a href="#servicos">${esc(cfg.navServicos)}</a>` : ""}${sobre ? '<a href="#sobre">Sobre</a>' : ""}${faq ? '<a href="#faq">Dúvidas</a>' : ""}<a href="#contato">Contato</a></div>
<div><h4>Contato</h4>${d.telefone ? `<a href="${esc(d.telUrl ?? "#")}">${esc(d.telefone)}</a>` : ""}${d.whatsappUrl ? `<a href="${esc(d.whatsappUrl)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${d.mapsUrl ? `<a href="${esc(d.mapsUrl)}" target="_blank" rel="noopener">Como chegar</a>` : ""}</div>
</div>
<div class="fbot">© <span id="__ano">2026</span> ${esc(d.nome)}.${d.creditoRodape ? " " + esc(d.creditoRodape) : ""}</div>
</div></footer>
${waFloat(d)}
${scriptAnim()}
</body></html>`;
}
