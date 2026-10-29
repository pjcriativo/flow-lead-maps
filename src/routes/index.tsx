import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { NavbarPublica } from "@/components/home-publica/NavbarPublica";
import { HeroVideoMockup } from "@/components/home-publica/HeroVideoMockup";
import { IndicadoresSection } from "@/components/home-publica/IndicadoresSection";
import { RecursosSection } from "@/components/home-publica/RecursosSection";
import { EcossistemaSection } from "@/components/home-publica/EcossistemaSection";
import { PlanosSection } from "@/components/home-publica/PlanosSection";
import { BannerCtaFinal } from "@/components/home-publica/BannerCtaFinal";
import { FooterPublico } from "@/components/home-publica/FooterPublico";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Flow Business — Mais Vendas para o seu Negócio com IA e Automação",
      },
      {
        name: "description",
        content:
          "Encontre leads, automatize a prospecção, gerencie campanhas e organize suas vendas em um só lugar com o ecossistema Flow Business.",
      },
      {
        property: "og:title",
        content: "Flow Business — Mais Vendas para o seu Negócio com IA e Automação",
      },
      {
        property: "og:description",
        content:
          "Encontre leads, automatize a prospecção, gerencie campanhas e organize suas vendas em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://flowleads.com.br" },
      { property: "og:image", content: "https://flowleads.com.br/og-image-flow-business.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br" }],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 selection:bg-[#ff6200]/30 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* 1. CABEÇALHO STICKY / PREMIUM */}
      <NavbarPublica />

      <main>
        {/* 2. HERO SECTION */}
        <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
          {/* Radial Ambient Glow Laranja Superior */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-full max-w-7xl bg-[radial-gradient(ellipse_at_top,_rgba(255,98,0,0.18)_0%,_rgba(255,70,0,0.06)_40%,_transparent_75%)] -z-10" />

          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            {/* Eyebrow */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#ff7a00] shadow-[0_0_15px_rgba(255,98,0,0.15)]">
              AUTOMAÇÃO COMERCIAL COM INTELIGÊNCIA ARTIFICIAL
            </div>

            {/* H1 Principal (Único na Página) */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">
              Mais vendas para o seu negócio{" "}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff851b] via-[#ff6200] to-[#ff4136]">
                com IA e automação.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl font-normal leading-relaxed text-slate-300">
              Encontre leads, automatize a prospecção, gerencie campanhas e organize suas vendas em
              um só lugar.
            </p>

            {/* Ações do Hero */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/pricing"
                preload="render"
                className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#ff6200] px-8 text-base font-bold text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] transition-all hover:bg-[#e05600] hover:shadow-[0_0_35px_rgba(255,98,0,0.6)] hover:scale-105 active:scale-95"
              >
                Ver planos <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="w-full sm:w-auto inline-flex h-13 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#ff6200]/40"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
                  <Play className="h-3 w-3 fill-white text-white translate-x-0.5" />
                </div>
                Ver demonstração
              </a>
            </div>
          </div>

          {/* Componente Visual do Hero (Mockup 3D + Player de Vídeo Acessível) */}
          <HeroVideoMockup />
        </section>

        {/* 3. FAIXA DE INDICADORES (4 CARDS) */}
        <IndicadoresSection />

        {/* 4. PRINCIPAIS RECURSOS (6 CARDS CLICÁVEIS) */}
        <RecursosSection />

        {/* 5. ECOSSISTEMA INTEGRADO (DIAGRAMA DE CONEXÕES & BENEFÍCIOS) */}
        <EcossistemaSection />

        {/* 6. PLANOS MENSAIS E ANUAIS */}
        <PlanosSection />

        {/* 7. CHAMADA FINAL (BANNER INFERIOR) */}
        <BannerCtaFinal />
      </main>

      {/* 8. RODAPÉ */}
      <FooterPublico />
    </div>
  );
}
