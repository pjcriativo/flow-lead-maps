import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, TrendingUp, Users, Zap, ShieldCheck } from "lucide-react";

export function HeroAgentes() {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-24 border-b border-white/[0.06]">
      {/* Luz e Glow de Fundo */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-7xl opacity-40 blur-[120px]"
        style={{
          background: "radial-gradient(ellipse at top, #ff6200 0%, #ff3b00 25%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* COLUNA ESQUERDA: Textos e Ações */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill de Categoria */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-6 shadow-[0_0_15px_rgba(255,98,0,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6200] animate-pulse" />
              CEO MESTRE & AGENTES DE IA
            </div>

            {/* Headline Principal com H1 Único */}
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.12]">
              Um CEO de IA <br />
              para coordenar <br />
              <span className="text-[#ff6200] drop-shadow-[0_0_25px_rgba(255,98,0,0.4)]">
                sua equipe.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-5 max-w-xl text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Estratégia, execução e mais vendas com uma equipe de agentes trabalhando para o seu negócio.
            </p>

            {/* Botões de Ação */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/pricing"
                preload="render"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6200] px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-[0_0_25px_rgba(255,98,0,0.45)] hover:bg-[#e05600] hover:shadow-[0_0_35px_rgba(255,98,0,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Ver planos <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#agentes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-sm px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white hover:border-white/25 transition-all"
              >
                <Play className="h-4 w-4 text-[#ff6200] fill-[#ff6200]/20" /> Conhecer os agentes
              </a>
            </div>

            {/* 3 Indicadores Inferiores */}
            <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-white/[0.08] w-full max-w-lg">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                <TrendingUp className="h-4 w-4 text-[#ff6200] shrink-0" />
                <span>Mais vendas</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                <Users className="h-4 w-4 text-[#ff6200] shrink-0" />
                <span>Equipe 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                <Zap className="h-4 w-4 text-[#ff6200] shrink-0" />
                <span>Resultados previsíveis</span>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Composição Cinematográfica do CEO */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            {/* Feixe e Glow Laranja de Fundo do CEO */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-60 blur-2xl"
              style={{
                background: "radial-gradient(circle at 60% 50%, rgba(255,98,0,0.35) 0%, rgba(255,59,0,0.1) 60%, transparent 100%)",
              }}
            />

            {/* Container da Imagem com Moldura Tecnológica */}
            <div className="relative rounded-2xl overflow-hidden border border-[#ff6200]/40 shadow-[0_0_40px_rgba(255,98,0,0.25)] bg-[#070c14]/90 max-w-md w-full">
              <img
                src="/images/agentes/ceo-hero.webp"
                alt="CEO Mestre - Estratégia e Coordenação com Inteligência Artificial"
                className="w-full h-auto object-cover object-top"
                width={395}
                height={300}
                loading="eager"
              />

              {/* Vinheta escura inferior e gradiente suave */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080e] via-transparent to-transparent opacity-80" />

              {/* Badge Flutuante do CEO Mestre */}
              <div className="absolute bottom-4 right-4 max-w-[210px] rounded-xl border border-[#ff6200]/40 bg-black/75 backdrop-blur-md p-3 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#ff6200] text-sm">👑</span>
                    <span className="text-xs font-bold text-white">CEO Mestre</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-emerald-400">Ativo</span>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-tight">
                  Estratégia que vira resultado comercial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

