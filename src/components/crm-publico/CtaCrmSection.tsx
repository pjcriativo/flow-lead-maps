import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquare } from "lucide-react";
import { BRAND_CONTACT_EMAIL } from "@/lib/brand";

export function CtaCrmSection() {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#ff6200]/50 bg-[#070b12] p-8 sm:p-12 shadow-[0_0_40px_rgba(255,98,0,0.22)]">
        {/* Glow Laranja e Reflexos de Fundo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#ff6200]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#ff4500]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
          <div className="max-w-xl">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff7a00] mb-2">
              PRONTO PARA VENDER MAIS?
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Transforme oportunidades em resultados.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Conheça os planos do Flow Business e escolha a solução ideal para o seu negócio.
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
            <a
              href={`mailto:${BRAND_CONTACT_EMAIL}?subject=Contato%20Comercial%20-%20Flow%20Business`}
              className="inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#ff6200]/40"
            >
              <MessageSquare className="h-4 w-4 text-[#ff6200]" />
              Falar com especialista
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
