import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  GoogleMapsIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
  BotAiIcon,
  PropostasContratosIcon,
} from "./HomeIcons";

export function RecursosSection() {
  const recursos = [
    {
      id: "maps",
      title: "Google Maps",
      desc: "Encontre empresas e oportunidades por localização.",
      icon: GoogleMapsIcon,
      targetHref: "/prospeccao",
      category: "Prospecção Multicanal",
    },
    {
      id: "instagram",
      title: "Instagram",
      desc: "Descubra perfis e analise oportunidades comerciais.",
      icon: InstagramIcon,
      targetHref: "/prospeccao",
      category: "Prospecção Multicanal",
    },
    {
      id: "linkedin",
      title: "LinkedIn",
      desc: "Explore oportunidades B2B e organize sua prospecção.",
      icon: LinkedInIcon,
      targetHref: "/prospeccao",
      category: "Prospecção Multicanal",
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      desc: "Centralize conversas e processos de atendimento.",
      icon: WhatsAppIcon,
      targetHref: "/crm",
      category: "CRM & Vendas",
    },
    {
      id: "agentes",
      title: "Agentes de IA",
      desc: "Planeje operações e coordene tarefas com inteligência artificial.",
      icon: BotAiIcon,
      targetHref: "/prospeccao",
      category: "CEO & Agentes",
    },
    {
      id: "propostas",
      title: "Propostas e Contratos",
      desc: "Organize documentos e acompanhe negociações.",
      icon: PropostasContratosIcon,
      targetHref: "/crm",
      category: "CRM & Vendas",
    },
  ];

  return (
    <section id="recursos" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      {/* Header da Seção */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
          PRINCIPAIS RECURSOS
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Tudo que você precisa para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
            vender mais.
          </span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400">
          Ferramentas integradas para encontrar oportunidades e organizar sua operação comercial.
        </p>
      </div>

      {/* Grid de 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recursos.map((item) => (
          <Link
            key={item.id}
            to={item.targetHref}
            preload="render"
            className="group relative flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#090e17]/90 p-5 backdrop-blur-sm transition-all duration-300 hover:border-[#ff6200]/50 hover:bg-[#0d1421] hover:shadow-[0_0_25px_rgba(255,98,0,0.18)] hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4 min-w-0 pr-3">
              {/* Ícone com identidade visual oficial da marca */}
              <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                <item.icon className="h-full w-full" />
              </div>

              {/* Título & Descrição */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-[#ff7a00] transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </div>

            {/* Seta Chevron Right */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 group-hover:bg-[#ff6200] group-hover:text-white transition-all">
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

