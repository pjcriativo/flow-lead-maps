import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function BannerCtaFinal() {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#ff6200]/50 bg-[#070b12] p-8 sm:p-12 shadow-[0_0_40px_rgba(255,98,0,0.2)]">
        {/* Glow Laranja e Linhas Luminosas Abstratas */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-[#ff6200]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-[#ff4500]/15 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Pronto para escalar suas{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
                vendas com IA?
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Conheça os planos do Flow Business e escolha a solução ideal para sua operação.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <Link
              to="/pricing"
              preload="render"
              className="inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#ff6200] px-8 py-4 text-base font-bold text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] transition-all hover:bg-[#e05600] hover:shadow-[0_0_35px_rgba(255,98,0,0.6)] hover:scale-105 active:scale-95"
            >
              Ver planos <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

