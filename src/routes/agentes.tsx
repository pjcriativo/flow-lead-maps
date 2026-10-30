import { createFileRoute } from "@tanstack/react-router";
import { NavbarPublica } from "@/components/home-publica/NavbarPublica";
import { FooterPublico } from "@/components/home-publica/FooterPublico";
import { HeroAgentes } from "@/components/agentes-publico/HeroAgentes";
import { EquipeAgentesSection } from "@/components/agentes-publico/EquipeAgentesSection";
import { ComoFuncionaAgentesSection } from "@/components/agentes-publico/ComoFuncionaAgentesSection";
import { CtaAgentesSection } from "@/components/agentes-publico/CtaAgentesSection";

export const Route = createFileRoute("/agentes")({
  head: () => ({
    meta: [
      {
        title: "CEO Mestre & Agentes de IA — Flow Business",
      },
      {
        name: "description",
        content:
          "Conheça o CEO Mestre e a equipe de agentes de inteligência artificial trabalhando juntos para prospecção, qualificação, vendas e crescimento do seu negócio.",
      },
      {
        name: "keywords",
        content:
          "agentes de ia, ceo mestre, inteligencia artificial vendas, equipe comercial ia, sdr de ia, flow business",
      },
      { property: "og:title", content: "CEO Mestre & Agentes de IA | Flow Business" },
      {
        property: "og:description",
        content:
          "Estratégia, execução e mais vendas com uma equipe de agentes trabalhando para o seu negócio.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://business.flowgenius.com.br/agentes" },
      { property: "og:image", content: "https://flowleads.com.br/og-image-flow-business.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://business.flowgenius.com.br/agentes" },
    ],
  }),
  component: AgentesPublicoPage,
});

function AgentesPublicoPage() {
  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 flex flex-col font-sans selection:bg-[#ff6200] selection:text-white">
      {/* CABEÇALHO GLOBAL PÚBLICO */}
      <NavbarPublica />

      {/* CONTEÚDO PRINCIPAL DA PÁGINA 04 */}
      <main className="flex-1">
        <HeroAgentes />
        <EquipeAgentesSection />
        <ComoFuncionaAgentesSection />
        <CtaAgentesSection />
      </main>

      {/* RODAPÉ GLOBAL PÚBLICO */}
      <FooterPublico />
    </div>
  );
}
