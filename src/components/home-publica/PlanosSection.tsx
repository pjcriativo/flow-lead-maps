import { Calendar, Crown, Check, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PlanosSection() {
  return (
    <section id="planos" className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
          PLANOS
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Escolha o plano ideal para o seu momento.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400">
          Recursos na medida certa para você crescer.
        </p>
      </div>

      {/* Grid de 2 Cards: Mensal e Anual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Card 1: Plano Mensal */}
        <div className="relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#090e17]/85 p-8 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-[#0c131f]">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff6200]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Plano Mensal</h3>
                <p className="text-xs text-slate-400">Flexibilidade para o seu negócio</p>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-slate-300 my-8">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Flexibilidade de contratação mês a mês</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Recursos e ferramentas conforme assinatura</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Limites operacionais definidos pelo plano escolhido</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Acesso completo ao ecossistema contratado</span>
              </li>
            </ul>
          </div>

          <Link
            to="/pricing"
            preload="render"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-[#ff6200]/50"
          >
            Ver planos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Card 2: Plano Anual (Destaque Premium com Borda Laranja e Badge) */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-[#ff6200]/70 bg-[#0c121e] p-8 shadow-[0_0_35px_rgba(255,98,0,0.18)] backdrop-blur-md transition-all duration-300 hover:border-[#ff6200] hover:shadow-[0_0_45px_rgba(255,98,0,0.3)]">
          {/* Badge Mais Escolhido */}
          <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-[#ff7a00] to-[#ff4500] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
            Mais escolhido
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6200] text-white shadow-[0_0_15px_rgba(255,98,0,0.4)]">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Plano Anual</h3>
                <p className="text-xs text-[#ff9940]">Condições comerciais exclusivas</p>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-slate-200 my-8">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Contratação anual com condições específicas</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Benefícios ampliados conforme o plano cadastrado</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Estabilidade e previsibilidade para a operação</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff6200] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>Prioridade de suporte e acompanhamento contínuo</span>
              </li>
            </ul>
          </div>

          <Link
            to="/pricing"
            preload="render"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff6200] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all hover:bg-[#e05600] hover:shadow-[0_0_30px_rgba(255,98,0,0.5)]"
          >
            Ver planos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

