import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ResultadosIndicadoresSection() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Esquerda: Headline e Botão */}
        <div className="lg:col-span-4 text-left">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
            RESULTADOS REAIS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Mais organização. <br />
            Mais{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff4500]">
              vendas.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Tenha controle total da sua operação comercial com dados em tempo real.
          </p>
          <div className="mt-8">
            <Link
              to="/pricing"
              preload="render"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6200] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] hover:bg-[#e05600] hover:shadow-[0_0_30px_rgba(255,98,0,0.5)] transition-all"
            >
              Ver planos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Direita: 3 Cards Gráficos */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Evolução de Vendas */}
          <div className="rounded-2xl border border-white/10 bg-[#090e17]/90 p-4 backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Evolução de Vendas</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center">
                <ArrowUpRight className="h-2.5 w-2.5" /> 37%
              </span>
            </div>
            <div className="mb-2">
              <span className="text-lg font-extrabold text-white">R$ 48.920</span>
            </div>

            {/* SVG Curva Laranja */}
            <div className="h-24 w-full">
              <svg viewBox="0 0 160 80" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sales-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6200" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FF6200" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M0 65 Q 40 55, 80 40 T 160 15 L 160 80 L 0 80 Z" fill="url(#sales-area-grad)" />
                <path d="M0 65 Q 40 55, 80 40 T 160 15" fill="none" stroke="#FF6200" strokeWidth="2.5" />
                <circle cx="80" cy="40" r="3" fill="#FFFFFF" stroke="#FF6200" strokeWidth="1.5" />
                <circle cx="160" cy="15" r="3.5" fill="#FFA040" stroke="#FFFFFF" strokeWidth="1" />
              </svg>
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5">
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
            </div>
          </div>

          {/* Card 2: Leads por Origem (Donut) */}
          <div className="rounded-2xl border border-white/10 bg-[#090e17]/90 p-4 backdrop-blur-md flex flex-col justify-between">
            <span className="text-xs font-bold text-white mb-2">Leads por Origem</span>
            <div className="relative h-24 w-24 mx-auto my-1 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#1f2937" strokeWidth="4" />
                {/* Google Maps (34%) */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#EA4335" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="0" />
                {/* Instagram (28%) */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#D6249F" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-30" />
                {/* LinkedIn (18%) */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#0A66C2" strokeWidth="4" strokeDasharray="16 84" strokeDashoffset="-55" />
                {/* WhatsApp (14%) */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#25D366" strokeWidth="4" strokeDasharray="12 88" strokeDashoffset="-71" />
                {/* Outros (6%) */}
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#ff6200" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-83" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-extrabold text-white">2.847</span>
                <span className="text-[7px] text-slate-400">Leads</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-300 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]" /> Maps 34%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#D6249F]" /> Insta 28%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#0A66C2]" /> LinkedIn 18%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" /> Whats 14%</span>
            </div>
          </div>

          {/* Card 3: Taxa de Conversão */}
          <div className="rounded-2xl border border-white/10 bg-[#090e17]/90 p-4 backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Taxa de Conversão</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center">
                <ArrowUpRight className="h-2.5 w-2.5" /> 62%
              </span>
            </div>
            <div className="mb-2">
              <span className="text-lg font-extrabold text-white">3.2%</span>
            </div>

            {/* Gráfico de Barras Ascendentes */}
            <div className="h-24 w-full flex items-end justify-between gap-1.5 pt-2">
              <div className="w-full bg-[#ff6200]/25 rounded-t h-[25%]" />
              <div className="w-full bg-[#ff6200]/35 rounded-t h-[35%]" />
              <div className="w-full bg-[#ff6200]/45 rounded-t h-[48%]" />
              <div className="w-full bg-[#ff6200]/60 rounded-t h-[65%]" />
              <div className="w-full bg-[#ff6200]/80 rounded-t h-[80%]" />
              <div className="w-full bg-[#ff6200] rounded-t h-[100%] shadow-[0_0_8px_#ff6200]" />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5">
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

