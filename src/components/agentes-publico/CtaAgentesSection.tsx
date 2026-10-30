import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CtaAgentesSection() {
  return (
    <section className="relative py-16 sm:py-20 overflow-hidden bg-[#04060a]">
      {/* Luz e Feixe de Fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-[100px]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,98,0,0.3) 0%, rgba(255,59,0,0.08) 50%, transparent 80%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="relative rounded-3xl border border-[#ff6200]/40 bg-gradient-to-r from-[#0d121c]/90 via-[#070c14]/95 to-[#0d121c]/90 p-8 sm:p-12 lg:p-14 shadow-[0_0_50px_rgba(255,98,0,0.2)] overflow-hidden">
          {/* Efeito Glow Interno */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#ff6200]/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#ff3b00]/15 blur-3xl" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            {/* Texto do CTA */}
            <div className="max-w-2xl text-center lg:text-left">
              <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Sua próxima fase <br className="hidden sm:inline" />
                de{" "}
                <span className="text-[#ff6200] drop-shadow-[0_0_20px_rgba(255,98,0,0.4)]">
                  crescimento
                </span>{" "}
                começa aqui.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl">
                Conheça os planos do Flow Business e descubra como utilizar o CEO Mestre na sua operação.
              </p>
            </div>

            {/* Botão de Ação */}
            <div className="shrink-0">
              <Link
                to="/pricing"
                preload="render"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6200] px-7 py-4 text-base font-bold text-white shadow-[0_0_25px_rgba(255,98,0,0.45)] hover:bg-[#e05600] hover:shadow-[0_0_35px_rgba(255,98,0,0.6)] transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Ver planos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

