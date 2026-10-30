import { createFileRoute } from "@tanstack/react-router";
import { NavbarPublica } from "@/components/home-publica/NavbarPublica";
import { FooterPublico } from "@/components/home-publica/FooterPublico";
import { HeroProspeccao } from "@/components/prospeccao-publica/HeroProspeccao";
import { PrincipaisCanaisSection } from "@/components/prospeccao-publica/PrincipaisCanaisSection";
import { FiltrosInteligentesSection } from "@/components/prospeccao-publica/FiltrosInteligentesSection";
import { ComoFuncionaSection } from "@/components/prospeccao-publica/ComoFuncionaSection";
import { ResultadosReaisSection } from "@/components/prospeccao-publica/ResultadosReaisSection";
import { CtaProspeccaoSection } from "@/components/prospeccao-publica/CtaProspeccaoSection";

export const Route = createFileRoute("/prospeccao")({
  head: () => ({
    meta: [
      {
        title: "Prospecção Multicanal — Encontre Clientes em Todos os Canais com IA | Flow Business",
      },
      {
        name: "description",
        content:
          "Encontre clientes em todos os canais com inteligência artificial. Prospecção automatizada no Instagram, LinkedIn, YouTube, TikTok e Google Maps integrada ao seu CRM.",
      },
      {
        name: "keywords",
        content:
          "prospecção multicanal, leads instagram, leads linkedin, leads google maps, prospecção b2b, flow business",
      },
      { property: "og:title", content: "Prospecção Multicanal | Flow Business" },
      {
        property: "og:description",
        content:
          "Use inteligência artificial para encontrar, qualificar e organizar leads no Instagram, LinkedIn, YouTube, TikTok e Google Maps.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://business.flowgenius.com.br/prospeccao" },
      { property: "og:image", content: "https://flowleads.com.br/og-image-flow-business.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://business.flowgenius.com.br/prospeccao" },
    ],
  }),
  component: ProspeccaoPublicaPage,
});

function ProspeccaoPublicaPage() {
  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 flex flex-col font-sans selection:bg-[#ff6200] selection:text-white">
      {/* CABEÇALHO GLOBAL */}
      <NavbarPublica />

      {/* CONTEÚDO DA PÁGINA DE PROSPECÇÃO MULTICANAL */}
      <main className="flex-1">
        {/* 1. Hero com Mockup da Interface e Cards de Canais */}
        <HeroProspeccao />

        {/* 2. Seção "Canais de prospecção" (5 Cards Completos) */}
        <PrincipaisCanaisSection />

        {/* 3. Seção "Filtros inteligentes" (Bullets + Formulário + Cards de Leads) */}
        <FiltrosInteligentesSection />

        {/* 4. Seção "Como funciona" (4 Etapas Sequenciais) */}
        <ComoFuncionaSection />

        {/* 5. Seção "Resultados reais" (3 Cards de Métricas e Gráficos) */}
        <ResultadosReaisSection />

        {/* 6. Bloco de CTA Final */}
        <CtaProspeccaoSection />
      </main>

      {/* RODAPÉ GLOBAL */}
      <FooterPublico />
    </div>
  );
}
