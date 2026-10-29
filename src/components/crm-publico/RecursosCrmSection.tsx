import {
  Users,
  BarChart3,
  FileCheck,
  FileText,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { WhatsAppIcon } from "../home-publica/HomeIcons";

export function RecursosCrmSection() {
  const recursos = [
    {
      id: "leads",
      title: "Gestão de Leads",
      desc: "Capture, organize e qualifique seus leads de todos os canais.",
      renderIcon: () => (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff6200]">
          <Users className="h-5 w-5" />
        </div>
      ),
      link: "#whatsapp-integrado",
    },
    {
      id: "pipeline",
      title: "Pipeline de Vendas",
      desc: "Acompanhe todo o processo comercial em um funil visual.",
      renderIcon: () => (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff6200]">
          <BarChart3 className="h-5 w-5" />
        </div>
      ),
      link: "/pricing",
    },
    {
      id: "whatsapp",
      title: "WhatsApp Integrado",
      desc: "Atenda, organize e converta leads direto do WhatsApp.",
      renderIcon: () => (
        <div className="h-11 w-11 rounded-2xl overflow-hidden shadow-sm">
          <WhatsAppIcon className="h-full w-full" />
        </div>
      ),
      link: "#whatsapp-integrado",
    },
    {
      id: "propostas",
      title: "Propostas Comerciais",
      desc: "Crie, envie e acompanhe propostas em minutos.",
      renderIcon: () => (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff6200]">
          <FileText className="h-5 w-5" />
        </div>
      ),
      link: "/pricing",
    },
    {
      id: "contratos",
      title: "Contratos Digitais",
      desc: "Formalize seus negócios com contratos digitais seguros.",
      renderIcon: () => (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
          <FileCheck className="h-5 w-5" />
        </div>
      ),
      link: "/pricing",
    },
    {
      id: "campanhas",
      title: "Campanhas",
      desc: "Crie e gerencie campanhas para gerar mais leads.",
      renderIcon: () => (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff6200]">
          <Rocket className="h-5 w-5" />
        </div>
      ),
      link: "/pricing",
    },
  ];

  return (
    <section id="recursos-crm" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      {/* Header com Título e Botão Lateral */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
            RECURSOS DO CRM
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Tudo que você precisa para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
              vender mais.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Ferramentas completas para gerenciar seus leads, oportunidades e clientes, com automação e inteligência artificial.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 hover:border-[#ff6200]/40 transition-all"
          >
            Ver todos os recursos <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Grade de 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recursos.map((r) => (
          <div
            key={r.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#090e17]/85 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#ff6200]/50 hover:bg-[#0c1320] hover:shadow-[0_0_25px_rgba(255,98,0,0.18)] hover:-translate-y-0.5"
          >
            <div>
              <div className="mb-4">
                {r.renderIcon()}
              </div>

              <h3 className="text-base font-bold text-white tracking-tight group-hover:text-[#ff7a00] transition-colors">
                {r.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                {r.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                Acessar recurso
              </span>
              <a
                href={r.link}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/10 text-white group-hover:bg-[#ff6200] group-hover:border-[#ff6200] transition-all"
                aria-label={`Ver ${r.title}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
