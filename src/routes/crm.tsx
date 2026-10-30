import { createFileRoute } from "@tanstack/react-router";
import { NavbarPublica } from "@/components/home-publica/NavbarPublica";
import { FooterPublico } from "@/components/home-publica/FooterPublico";
import { HeroCrm } from "@/components/crm-publico/HeroCrm";
import { RecursosCrmSection } from "@/components/crm-publico/RecursosCrmSection";
import { WhatsAppIntegradoSection } from "@/components/crm-publico/WhatsAppIntegradoSection";
import { ComoFuncionaCrmSection } from "@/components/crm-publico/ComoFuncionaCrmSection";
import { ResultadosIndicadoresSection } from "@/components/crm-publico/ResultadosIndicadoresSection";
import { CtaCrmSection } from "@/components/crm-publico/CtaCrmSection";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      {
        title: "CRM & Vendas — Organize suas Vendas e Aumente seus Resultados | Flow Business",
      },
      {
        name: "description",
        content:
          "Gerencie leads, acompanhe seu funil, automatize o atendimento e feche mais negócios em um só lugar com o CRM & Vendas do Flow Business.",
      },
      {
        property: "og:title",
        content: "CRM & Vendas — Flow Business",
      },
      {
        property: "og:description",
        content:
          "Gerencie leads, acompanhe seu funil, automatize o atendimento e feche mais negócios em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://flowleads.com.br/crm" },
      { property: "og:image", content: "https://flowleads.com.br/og-image-flow-business.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/crm" }],
  }),
  component: CrmPage,
});

function CrmPage() {
  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 selection:bg-[#ff6200]/30 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* 1. Cabeçalho Sticky Institucional */}
      <NavbarPublica />

      <main>
        {/* 2. Hero CRM & Vendas (com Painel Kanban Interativo) */}
        <HeroCrm />

        {/* 3. Recursos do CRM (6 Cards) */}
        <RecursosCrmSection />

        {/* 4. WhatsApp Integrado (Interface do WhatsApp Web com 3 Colunas) */}
        <WhatsAppIntegradoSection />

        {/* 5. Como Funciona (Do lead ao cliente em 4 etapas) */}
        <ComoFuncionaCrmSection />

        {/* 6. Resultados e Indicadores (3 Composições Gráficas) */}
        <ResultadosIndicadoresSection />

        {/* 7. CTA Final (Transforme oportunidades em resultados) */}
        <CtaCrmSection />
      </main>

      {/* 8. Rodapé Institucional */}
      <FooterPublico />
    </div>
  );
}

