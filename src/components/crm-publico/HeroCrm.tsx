import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Play,
  Kanban,
  Zap,
  TrendingUp,
  Search,
  Bell,
  ArrowUpRight,
  Briefcase,
  Users,
  Target,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { FlowLogoMark } from "../home-publica/HomeIcons";

export function HeroCrm() {
  return (
    <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
      {/* 1. Iluminação e Feixes de Laser Laranja de Fundo */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[700px] w-full max-w-7xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,98,0,0.22)_0%,_rgba(255,80,0,0.06)_40%,_transparent_70%)] blur-2xl" />
        <svg
          viewBox="0 0 1200 600"
          className="absolute inset-0 h-full w-full opacity-60"
          fill="none"
        >
          <path
            d="M550 40C720 55 920 130 1120 460"
            stroke="url(#crm-laser-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M480 80C680 95 870 190 1080 520"
            stroke="url(#crm-laser-2)"
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <defs>
            <linearGradient id="crm-laser-1" x1="550" y1="40" x2="1120" y2="460" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4500" stopOpacity="0" />
              <stop offset="30%" stopColor="#FF6200" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#FFA040" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="crm-laser-2" x1="480" y1="80" x2="1080" y2="520" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6200" stopOpacity="0" />
              <stop offset="50%" stopColor="#FF7A00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF6200" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* COLUNA ESQUERDA: Textos, Headline e Badges */}
          <div className="lg:col-span-5 text-left">
            {/* Eyebrow */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#ff7a00] shadow-[0_0_15px_rgba(255,98,0,0.15)]">
              CRM & VENDAS
            </div>

            {/* H1 Principal */}
            <h1 className="text-3xl sm:text-5xl md:text-[50px] font-extrabold tracking-tight text-white leading-[1.12]">
              Organize suas <br />
              vendas e aumente <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff851b] via-[#ff6200] to-[#ff4136]">
                seus resultados.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Gerencie leads, acompanhe seu funil, automatize o atendimento e feche mais negócios em um só lugar.
            </p>

            {/* Botões de Ação */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/pricing"
                preload="render"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#ff6200] px-7 text-base font-bold text-white shadow-[0_0_25px_rgba(255,98,0,0.4)] transition-all hover:bg-[#e05600] hover:shadow-[0_0_35px_rgba(255,98,0,0.6)] hover:scale-105 active:scale-95"
              >
                Ver planos <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#recursos-crm"
                className="inline-flex h-13 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#ff6200]/40"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
                  <Play className="h-3 w-3 fill-white text-white translate-x-0.5" />
                </div>
                Ver demonstração
              </a>
            </div>

            {/* 3 Badges Inferiores */}
            <div className="mt-10 flex flex-wrap items-center gap-5 pt-6 border-t border-white/[0.08] text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Kanban className="h-3 w-3" />
                </div>
                <span>Pipeline visual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Zap className="h-3 w-3" />
                </div>
                <span>Automação de vendas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <TrendingUp className="h-3 w-3" />
                </div>
                <span>Mais conversões</span>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Painel CRM & Pipeline Kanban */}
          <div className="lg:col-span-7 relative">
            <div className="relative z-10 rounded-2xl md:rounded-3xl border-2 border-[#ff6200]/60 bg-[#070b11] shadow-[0_0_50px_rgba(255,98,0,0.28)] overflow-hidden">
              {/* Header do Mockup */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0f18] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <FlowLogoMark className="h-5 w-5" />
                  <span className="font-bold text-white text-xs tracking-tight">Flow Business</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1 text-slate-400 text-[11px] w-48 sm:w-64">
                  <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Buscar leads, empresas, contatos...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-slate-400" />
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#ff6200] to-[#ffa040] flex items-center justify-center text-[10px] font-bold text-white">
                    FB
                  </div>
                </div>
              </div>

              {/* CRM Top Bar & Indicadores */}
              <div className="p-3 sm:p-4 border-b border-white/[0.06] bg-[#070c14]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">CRM & Vendas</h3>
                    <p className="text-[10px] text-slate-400">Acompanhe suas oportunidades em tempo real.</p>
                  </div>
                  <div className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    Últimos 30 dias ▾
                  </div>
                </div>

                {/* 4 Cards de Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl border border-white/[0.08] bg-[#0b1018] p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Leads</span>
                      <Users className="h-3 w-3 text-blue-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-white">2.847</span>
                      <span className="text-[9px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2 w-2" /> 23%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0b1018] p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Em negociação</span>
                      <Target className="h-3 w-3 text-purple-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-white">463</span>
                      <span className="text-[9px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2 w-2" /> 18%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0b1018] p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Propostas</span>
                      <FileCheck className="h-3 w-3 text-cyan-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-white">126</span>
                      <span className="text-[9px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2 w-2" /> 32%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#0b1018] p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Clientes</span>
                      <Briefcase className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-xs sm:text-sm font-extrabold text-white">52</span>
                      <span className="text-[9px] font-semibold text-emerald-400 flex items-center">
                        <ArrowUpRight className="h-2 w-2" /> 42%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIPELINE KANBAN (5 Colunas Comerciais) */}
              <div className="p-3 sm:p-4 bg-[#05080e] overflow-x-auto">
                <div className="grid grid-cols-5 gap-2 min-w-[550px]">
                  {/* Coluna 1: Novos Leads */}
                  <div className="rounded-xl bg-[#090e17] border border-white/[0.06] p-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-orange-500/30 mb-2">
                      <span className="text-[10px] font-bold text-orange-400">Novos Leads</span>
                      <span className="text-[9px] font-mono text-slate-400">1.248</span>
                    </div>
                    <div className="space-y-1.5 text-[9px]">
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Clínica Vida</p>
                        <p className="text-[8px] text-slate-400 truncate">Odontologia</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Bella Estética</p>
                        <p className="text-[8px] text-slate-400 truncate">Estética</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Tech Solutions</p>
                        <p className="text-[8px] text-slate-400 truncate">TI e Serviços</p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Em Contato */}
                  <div className="rounded-xl bg-[#090e17] border border-white/[0.06] p-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-500/30 mb-2">
                      <span className="text-[10px] font-bold text-blue-400">Em Contato</span>
                      <span className="text-[9px] font-mono text-slate-400">532</span>
                    </div>
                    <div className="space-y-1.5 text-[9px]">
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Studio Fitness</p>
                        <p className="text-[8px] text-slate-400 truncate">Academia</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Auto Center</p>
                        <p className="text-[8px] text-slate-400 truncate">Automotivo</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Agro Forte</p>
                        <p className="text-[8px] text-slate-400 truncate">Agronegócio</p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 3: Proposta Enviada */}
                  <div className="rounded-xl bg-[#090e17] border border-white/[0.06] p-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/30 mb-2">
                      <span className="text-[10px] font-bold text-purple-400">Proposta</span>
                      <span className="text-[9px] font-mono text-slate-400">463</span>
                    </div>
                    <div className="space-y-1.5 text-[9px]">
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Casa & Decor</p>
                        <p className="text-[8px] text-slate-400 truncate">Decoração</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Sabor & Arte</p>
                        <p className="text-[8px] text-slate-400 truncate">Restaurante</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Mundo Pet</p>
                        <p className="text-[8px] text-slate-400 truncate">Pet Shop</p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 4: Negociação */}
                  <div className="rounded-xl bg-[#090e17] border border-white/[0.06] p-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30 mb-2">
                      <span className="text-[10px] font-bold text-amber-400">Negociação</span>
                      <span className="text-[9px] font-mono text-slate-400">312</span>
                    </div>
                    <div className="space-y-1.5 text-[9px]">
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Clínica Prime</p>
                        <p className="text-[8px] text-slate-400 truncate">Saúde</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Construtora Alfa</p>
                        <p className="text-[8px] text-slate-400 truncate">Construção</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Escola Futuro</p>
                        <p className="text-[8px] text-slate-400 truncate">Educação</p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 5: Clientes */}
                  <div className="rounded-xl bg-[#090e17] border border-white/[0.06] p-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/30 mb-2">
                      <span className="text-[10px] font-bold text-emerald-400">Clientes</span>
                      <span className="text-[9px] font-mono text-slate-400">52</span>
                    </div>
                    <div className="space-y-1.5 text-[9px]">
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Digital MKT</p>
                        <p className="text-[8px] text-slate-400 truncate">Marketing</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Hotel Premium</p>
                        <p className="text-[8px] text-slate-400 truncate">Hotelaria</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <p className="font-bold text-white truncate">Supermercado+</p>
                        <p className="text-[8px] text-slate-400 truncate">Varejo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
