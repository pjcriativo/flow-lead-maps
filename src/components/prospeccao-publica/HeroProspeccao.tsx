import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Play,
  Sparkles,
  Target,
  Layers,
  MapPin,
  Search,
  Bell,
  Plus,
  Building2,
  Users,
  Compass,
  CheckCircle2,
} from "lucide-react";
import {
  FlowLogoMark,
  GoogleMapsIcon,
  InstagramIcon,
  LinkedInIcon,
} from "../home-publica/HomeIcons";

export function HeroProspeccao() {
  return (
    <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
      {/* 1. Aura Luminosa Laranja e Feixes de Laser */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[700px] w-full max-w-7xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,98,0,0.25)_0%,_rgba(255,80,0,0.08)_40%,_transparent_70%)] blur-2xl" />
        {/* Feixes curvos de laser laranja */}
        <svg
          viewBox="0 0 1200 600"
          className="absolute inset-0 h-full w-full opacity-60"
          fill="none"
        >
          <path
            d="M600 50C750 60 950 140 1150 450"
            stroke="url(#prosp-laser-1)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M500 80C700 95 900 200 1100 520"
            stroke="url(#prosp-laser-2)"
            strokeWidth="1.8"
            strokeOpacity="0.7"
          />
          <defs>
            <linearGradient id="prosp-laser-1" x1="600" y1="50" x2="1150" y2="450" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4500" stopOpacity="0" />
              <stop offset="30%" stopColor="#FF6200" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#FFA040" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="prosp-laser-2" x1="500" y1="80" x2="1100" y2="520" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6200" stopOpacity="0" />
              <stop offset="50%" stopColor="#FF7A00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF6200" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* COLUNA ESQUERDA: Textos, Chamada e Badges */}
          <div className="lg:col-span-5 text-left">
            {/* Eyebrow */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#ff7a00] shadow-[0_0_15px_rgba(255,98,0,0.15)]">
              PROSPECÇÃO MULTICANAL
            </div>

            {/* H1 Principal */}
            <h1 className="text-3xl sm:text-5xl md:text-[52px] font-extrabold tracking-tight text-white leading-[1.12]">
              Encontre seus <br />
              próximos clientes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff851b] via-[#ff6200] to-[#ff4136]">
                nos canais certos.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Descubra empresas, identifique oportunidades e organize sua prospecção em um único lugar.
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
                href="#canais"
                className="inline-flex h-13 items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#ff6200]/40"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white">
                  <Play className="h-3 w-3 fill-white text-white translate-x-0.5" />
                </div>
                Conhecer os recursos
              </a>
            </div>

            {/* Três Indicadores / Badges Inferiores */}
            <div className="mt-10 flex flex-wrap items-center gap-5 pt-6 border-t border-white/[0.08] text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Sparkles className="h-3 w-3" />
                </div>
                <span>Mais oportunidades</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Target className="h-3 w-3" />
                </div>
                <span>Dados qualificados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6200]/20 text-[#ff6200]">
                  <Layers className="h-3 w-3" />
                </div>
                <span>Integração com CRM</span>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Composição Visual dos Painéis de Prospecção */}
          <div className="lg:col-span-7 relative">
            {/* PAINEL PRINCIPAL: Google Maps no Dashboard Flow Business */}
            <div className="relative z-10 rounded-2xl md:rounded-3xl border-2 border-[#ff6200]/60 bg-[#070b11] shadow-[0_0_50px_rgba(255,98,0,0.28)] overflow-hidden">
              {/* Header da Interface */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0a0f18] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <FlowLogoMark className="h-5 w-5" />
                  <span className="font-bold text-white text-xs tracking-tight">Flow Business</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1 text-slate-400 text-[11px] w-48 sm:w-64">
                  <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Buscar empresas, pessoas, nichos...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-slate-400" />
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#ff6200] to-[#ffa040] flex items-center justify-center text-[10px] font-bold text-white">
                    FB
                  </div>
                </div>
              </div>

              {/* Corpo da Interface */}
              <div className="flex h-[340px] sm:h-[380px]">
                {/* Mini Sidebar */}
                <div className="hidden sm:flex flex-col w-36 shrink-0 border-r border-white/[0.08] bg-[#060a12] p-2.5 text-[11px] space-y-1">
                  <div className="flex items-center gap-2 rounded-lg bg-[#ff6200]/15 border border-[#ff6200]/30 px-2 py-1.5 text-white font-semibold">
                    <Compass className="h-3.5 w-3.5 text-[#ff6200]" />
                    <span>Prospecção</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-400 hover:text-white">
                    <GoogleMapsIcon className="h-3.5 w-3.5" />
                    <span>Google Maps</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-400 hover:text-white">
                    <InstagramIcon className="h-3.5 w-3.5" />
                    <span>Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-400 hover:text-white">
                    <LinkedInIcon className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-400 hover:text-white">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Business B2B</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-400 hover:text-white">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Leads</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-slate-400 hover:text-white">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>Listas</span>
                  </div>
                </div>

                {/* Mapa Central + Lista Lateral de Resultados */}
                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
                  {/* Mapa Satélite com Pins */}
                  <div className="relative flex-1 bg-[#090e17] overflow-hidden p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2 rounded-lg bg-[#070b12]/90 border border-white/10 px-2.5 py-1 text-[11px] text-white w-fit shadow-md">
                      <GoogleMapsIcon className="h-4 w-4" />
                      <div>
                        <span className="font-bold">Google Maps</span>
                        <p className="text-[9px] text-slate-400">Empresas por localização</p>
                      </div>
                    </div>

                    {/* Fundo do Mapa com Grid & Pins Luminosos */}
                    <div className="relative my-auto h-40 sm:h-48 w-full rounded-xl bg-slate-950 border border-white/5 overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-80" />
                      {/* Badge Central do Nicho */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/85 border border-[#ff6200]/60 px-3 py-1 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(255,98,0,0.4)] whitespace-nowrap">
                        Clínicas odontológicas em São Paulo - SP
                      </div>
                      {/* Pins */}
                      <div className="absolute top-6 left-10 h-3.5 w-3.5 rounded-full bg-[#ff6200] ring-4 ring-[#ff6200]/30 shadow-[0_0_12px_#ff6200]" />
                      <div className="absolute bottom-6 left-16 h-3.5 w-3.5 rounded-full bg-[#ff6200] ring-4 ring-[#ff6200]/30 shadow-[0_0_12px_#ff6200]" />
                      <div className="absolute top-8 right-12 h-3.5 w-3.5 rounded-full bg-[#ff6200] ring-4 ring-[#ff6200]/30 shadow-[0_0_12px_#ff6200]" />
                      <div className="absolute bottom-8 right-16 h-3.5 w-3.5 rounded-full bg-[#ff6200] ring-4 ring-[#ff6200]/30 shadow-[0_0_12px_#ff6200]" />
                    </div>
                  </div>

                  {/* Lista de Resultados na Direita */}
                  <div className="w-full sm:w-56 border-t sm:border-t-0 sm:border-l border-white/[0.08] bg-[#070c14] p-2.5 flex flex-col justify-between text-[11px]">
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <div className="min-w-0 pr-1">
                          <p className="font-bold text-white truncate">Oral Prime</p>
                          <p className="text-[9px] text-slate-400 truncate">Clínica Odontológica · SP</p>
                        </div>
                        <button className="h-5 w-5 rounded bg-[#ff6200]/20 text-[#ff6200] flex items-center justify-center shrink-0">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <div className="min-w-0 pr-1">
                          <p className="font-bold text-white truncate">Sorriso & Vida</p>
                          <p className="text-[9px] text-slate-400 truncate">Clínica Odontológica · SP</p>
                        </div>
                        <button className="h-5 w-5 rounded bg-[#ff6200]/20 text-[#ff6200] flex items-center justify-center shrink-0">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <div className="min-w-0 pr-1">
                          <p className="font-bold text-white truncate">OdontoMais</p>
                          <p className="text-[9px] text-slate-400 truncate">Clínica Odontológica · SP</p>
                        </div>
                        <button className="h-5 w-5 rounded bg-[#ff6200]/20 text-[#ff6200] flex items-center justify-center shrink-0">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <div className="min-w-0 pr-1">
                          <p className="font-bold text-white truncate">Clínica Boa Saúde</p>
                          <p className="text-[9px] text-slate-400 truncate">Clínica Odontológica · SP</p>
                        </div>
                        <button className="h-5 w-5 rounded bg-[#ff6200]/20 text-[#ff6200] flex items-center justify-center shrink-0">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD FLUTUANTE 1: INSTAGRAM (Sobreposto em Primeiro Plano na Esquerda) */}
            <div className="hidden sm:block absolute -bottom-8 -left-6 z-20 w-64 rounded-2xl border border-white/15 bg-[#090e18]/95 p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2.5">
                <InstagramIcon className="h-5 w-5" />
                <div>
                  <p className="text-xs font-bold text-white">Instagram</p>
                  <p className="text-[9px] text-slate-400">Perfis e oportunidades</p>
                </div>
              </div>
              {/* Grid de 3 Fotos / Perfis */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-14 rounded-lg bg-slate-800 border border-white/10 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1 text-[8px] font-medium text-white truncate">Clínica</span>
                </div>
                <div className="h-14 rounded-lg bg-slate-800 border border-white/10 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1 text-[8px] font-medium text-white truncate">Consultório</span>
                </div>
                <div className="h-14 rounded-lg bg-slate-800 border border-white/10 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1 text-[8px] font-medium text-white truncate">Dra. Paula</span>
                </div>
              </div>
            </div>

            {/* CARD FLUTUANTE 2: LINKEDIN (Sobreposto em Primeiro Plano na Direita) */}
            <div className="hidden sm:block absolute -bottom-10 -right-4 z-20 w-64 rounded-2xl border border-white/15 bg-[#090e18]/95 p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2.5">
                <LinkedInIcon className="h-5 w-5" />
                <div>
                  <p className="text-xs font-bold text-white">LinkedIn</p>
                  <p className="text-[9px] text-slate-400">Empresas e profissionais</p>
                </div>
              </div>
              {/* Lista B2B */}
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-white font-medium truncate">OdontoCare Group</span>
                  <span className="text-[9px] text-[#ff6200] font-mono">+ Lead</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-white font-medium truncate">Orthos Pro Soluções</span>
                  <span className="text-[9px] text-[#ff6200] font-mono">+ Lead</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-white font-medium truncate">Sorriso Digital B2B</span>
                  <span className="text-[9px] text-[#ff6200] font-mono">+ Lead</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

