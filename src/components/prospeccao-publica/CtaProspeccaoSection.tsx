import { Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";

export function CtaProspeccaoSection() {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#ff6200]/50 bg-[#070b12] p-8 sm:p-12 shadow-[0_0_40px_rgba(255,98,0,0.22)]">
        {/* Glow Laranja e Reflexos de Fundo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#ff6200]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#ff4500]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="max-w-xl">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff7a00] mb-2">
              MAIS CLIENTES, MAIS RESULTADOS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Seu próximo cliente pode estar a uma busca de distância.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Conheça os planos do Flow Business e escolha os recursos para a sua operação.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to="/pricing"
              preload="render"
              className="inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#ff6200] px-7 text-base font-bold text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] transition-all hover:bg-[#e05600] hover:shadow-[0_0_35px_rgba(255,98,0,0.6)] hover:scale-105 active:scale-95"
            >
              Ver planos <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/crm"
              preload="render"
              className="inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#ff6200]/40"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white">
                <Play className="h-2.5 w-2.5 fill-white text-white translate-x-0.5" />
              </div>
              Conhecer o CRM
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

