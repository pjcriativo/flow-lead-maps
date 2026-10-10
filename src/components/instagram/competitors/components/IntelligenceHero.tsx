import { ArrowUpRight, ChevronRight, Crown, Instagram, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntelligenceHeroProps {
  onAnalyzeCompetitors?: () => void;
  onAnalyzeProfile?: () => void;
  onViewOpportunities?: () => void;
}

export function IntelligenceHero({
  onAnalyzeCompetitors,
  onAnalyzeProfile,
  onViewOpportunities,
}: IntelligenceHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-pink-100/70 bg-gradient-to-r from-[#FFF5F7] via-[#FAF5FF] to-[#FFF7ED] p-6 shadow-sm sm:p-7">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-pink-200/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-pink-300/20 via-purple-300/15 to-orange-300/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 right-1/3 h-64 w-64 rounded-full bg-purple-200/20 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Lado Esquerdo: Textos e Botões */}
        <div className="max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E1306C]">
            DADOS REAIS, DECISÕES INTELIGENTES
          </span>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[34px] lg:leading-[1.18]">
            Entenda o seu mercado
            <br className="hidden sm:inline" /> e encontre{" "}
            <span className="bg-gradient-to-r from-[#E1306C] via-[#833AB4] to-[#F77737] bg-clip-text text-transparent">
              vantagens reais.
            </span>
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Analise concorrentes, explore audiências, monitore tendências e identifique oportunidades com base em dados reais do Instagram.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              className="gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1D4ED8]"
              onClick={onAnalyzeCompetitors}
            >
              <Search className="size-3.5" />
              Analisar concorrentes
            </Button>

            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={onAnalyzeProfile}
            >
              Analisar perfil
              <ArrowUpRight className="size-3.5 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Centro: Ilustração Instagram com órbitas, avatares e cards flutuantes */}
        <div className="relative mx-auto flex h-60 w-full max-w-[340px] items-center justify-center sm:h-64 lg:mx-0">
          {/* Círculos concêntricos */}
          <div className="absolute size-56 rounded-full border border-pink-200/50" />
          <div className="absolute size-44 rounded-full border border-dashed border-purple-200/60" />
          <div className="absolute size-32 rounded-full border border-pink-200/40" />

          {/* Logo Central Instagram com brilho */}
          <div className="relative z-10 flex size-20 items-center justify-center rounded-[22px] bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white shadow-2xl shadow-[#E1306C]/35">
            <div className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/20 to-transparent" />
            <Instagram className="size-10 text-white" strokeWidth={1.8} />
          </div>

          {/* Avatar Flutuante Topo (Pizza / Gastronomia) */}
          <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
            <div className="size-11 overflow-hidden rounded-full border-2 border-white shadow-md shadow-pink-500/10">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop"
                alt="Concorrente gastronomia"
                className="size-full object-cover"
              />
            </div>
          </div>

          {/* Avatar Flutuante Direita (Mulher) */}
          <div className="absolute right-3 top-16 z-20">
            <div className="size-11 overflow-hidden rounded-full border-2 border-white shadow-md shadow-purple-500/10">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop"
                alt="Perfil analisado"
                className="size-full object-cover"
              />
            </div>
          </div>

          {/* Avatar Flutuante Embaixo (Homem) */}
          <div className="absolute -bottom-1 left-1/3 z-20">
            <div className="size-10 overflow-hidden rounded-full border-2 border-white shadow-md shadow-orange-500/10">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop"
                alt="Usuário similar"
                className="size-full object-cover"
              />
            </div>
          </div>

          {/* Card Flutuante 1: Crescimento +32% com mini curva */}
          <div className="absolute -left-4 top-2 z-20 rounded-xl border border-slate-100 bg-white/95 p-2.5 shadow-lg shadow-slate-200/60 backdrop-blur-sm sm:-left-8">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className="text-emerald-500">↗</span>
              <span>Crescimento</span>
            </div>
            <div className="text-xs font-bold text-slate-900">+32%</div>
            {/* Mini sparkline curve */}
            <svg className="mt-1 h-5 w-16" viewBox="0 0 64 20" fill="none">
              <path
                d="M2 16 C 14 18, 22 8, 34 12 C 46 16, 52 4, 62 6"
                stroke="url(#hero-trend-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="hero-trend-gradient" x1="0" y1="0" x2="64" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#833AB4" />
                  <stop offset="1" stopColor="#E1306C" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Card Flutuante 2: Audiência similar 48.2K perfis */}
          <div className="absolute -bottom-2 right-0 z-20 flex items-center gap-2 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-lg shadow-slate-200/60 backdrop-blur-sm sm:-right-4">
            <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white">
              <Instagram className="size-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Audiência similar</div>
              <div className="text-xs font-bold text-slate-900">48.2K perfis</div>
            </div>
          </div>

          {/* Card Flutuante 3: Mini gráfico de barras azuis no topo direito */}
          <div className="absolute right-0 top-6 z-20 flex items-end gap-1 rounded-lg border border-slate-100 bg-white/90 p-1.5 shadow-md backdrop-blur-sm">
            <div className="h-2 w-1 rounded-sm bg-blue-300" />
            <div className="h-3.5 w-1 rounded-sm bg-blue-400" />
            <div className="h-5 w-1 rounded-sm bg-[#2563EB]" />
            <div className="h-3 w-1 rounded-sm bg-blue-400" />
          </div>
        </div>

        {/* Lado Direito: Card Oportunidades hoje */}
        <div className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:w-72">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
              <Crown className="size-3.5 fill-amber-500 text-amber-500" />
              <span>OPORTUNIDADES HOJE</span>
            </div>
            <button
              type="button"
              onClick={onViewOpportunities}
              className="flex size-5 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Ver oportunidades"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              23
            </div>
            <p className="text-xs text-slate-500">perfis com potencial identificados</p>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#10B981]" />
                <span className="font-bold text-slate-900">12</span>
                <span className="text-slate-500">Audiência em comum</span>
              </div>
              <ChevronRight className="size-3 text-slate-300" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#8B5CF6]" />
                <span className="font-bold text-slate-900">7</span>
                <span className="text-slate-500">Nichos relacionados</span>
              </div>
              <ChevronRight className="size-3 text-slate-300" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#6366F1]" />
                <span className="font-bold text-slate-900">4</span>
                <span className="text-slate-500">Concorrentes em crescimento</span>
              </div>
              <ChevronRight className="size-3 text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
