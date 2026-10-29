import { createFileRoute } from "@tanstack/react-router";
import { NavbarPublica } from "@/components/home-publica/NavbarPublica";
import { FooterPublico } from "@/components/home-publica/FooterPublico";
import { HeroProspeccao } from "@/components/prospeccao-publica/HeroProspeccao";
import { PrincipaisCanaisSection } from "@/components/prospeccao-publica/PrincipaisCanaisSection";
import { CanaisComplementaresSection } from "@/components/prospeccao-publica/CanaisComplementaresSection";
import { ComoFuncionaSection } from "@/components/prospeccao-publica/ComoFuncionaSection";
import { InteligenciaComercialSection } from "@/components/prospeccao-publica/InteligenciaComercialSection";
import { CtaProspeccaoSection } from "@/components/prospeccao-publica/CtaProspeccaoSection";

export const Route = createFileRoute("/prospeccao")({
  head: () => ({
    meta: [
      {
        title: "Prospecção Multicanal — Flow Business",
      },
      {
        name: "description",
        content:
          "Encontre seus próximos clientes nos canais certos. Descubra empresas, identifique oportunidades e organize sua prospecção no Google Maps, Instagram, LinkedIn e mais.",
      },
      {
        property: "og:title",
        content: "Prospecção Multicanal — Flow Business",
      },
      {
        property: "og:description",
        content:
          "Encontre seus próximos clientes nos canais certos. Descubra empresas, identifique oportunidades e organize sua prospecção em um único lugar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://flowleads.com.br/prospeccao" },
      { property: "og:image", content: "https://flowleads.com.br/og-image-flow-business.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/prospeccao" }],
  }),
  component: ProspeccaoPage,
});

function ProspeccaoPage() {
  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 selection:bg-[#ff6200]/30 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* Cabeçalho Sticky Institucional */}
      <NavbarPublica />

      <main>
        {/* 1. Hero da Prospecção Multicanal */}
        <HeroProspeccao />

        {/* 2. Principais Canais (Google Maps, Instagram, LinkedIn) */}
        <PrincipaisCanaisSection />

        {/* 3. Canais Complementares (Business B2B, YouTube, TikTok) */}
        <CanaisComplementaresSection />

        {/* 4. Como Funciona (Da busca ao cliente, em 3 passos) */}
        <ComoFuncionaSection />

        {/* 5. Inteligência Comercial (Fluxo em 5 Etapas) */}
        <InteligenciaComercialSection />

        {/* 6. CTA Final (Seu próximo cliente pode estar a uma busca de distância) */}
        <CtaProspeccaoSection />
      </main>

      {/* Rodapé Institucional */}
      <FooterPublico />
    </div>
  );
}
