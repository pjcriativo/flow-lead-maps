import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Search, Plus, ChevronDown, MapPin } from "lucide-react";
import {
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  TikTokIcon,
  GoogleMapsIcon,
} from "@/components/home-publica/HomeIcons";

export function HeroProspeccao() {
  const perfisDemonstracao = [
    {
      nome: "Clínica Vida",
      user: "@clinicavida",
      seguidores: "28.4K",
      local: "São Paulo - SP",
      avatarBg: "bg-gradient-to-tr from-pink-500 to-amber-500",
      avatarLetra: "C",
    },
    {
      nome: "Studio Fitness",
      user: "@studiofitness",
      seguidores: "15.2K",
      local: "Curitiba - PR",
      avatarBg: "bg-gradient-to-tr from-blue-500 to-cyan-500",
      avatarLetra: "S",
    },
    {
      nome: "Casa & Decor",
      user: "@casaedecor",
      seguidores: "42.7K",
      local: "Rio de Janeiro - RJ",
      avatarBg: "bg-gradient-to-tr from-purple-500 to-pink-500",
      avatarLetra: "C",
    },
    {
      nome: "Sabor da Mesa",
      user: "@sabordamesa",
      seguidores: "37.1K",
      local: "Belo Horizonte - MG",
      avatarBg: "bg-gradient-to-tr from-amber-500 to-orange-500",
      avatarLetra: "S",
    },
    {
      nome: "Auto Center",
      user: "@autocenter",
      seguidores: "19.6K",
      local: "Porto Alegre - RS",
      avatarBg: "bg-gradient-to-tr from-emerald-500 to-teal-500",
      avatarLetra: "A",
    },
  ];

  const canaisInferiores = [
    {
      id: "instagram",
      nome: "Instagram",
      leads: "1.248 leads",
      icone: InstagramIcon,
      borda: "border-pink-500/30",
      glow: "hover:border-pink-500/60 hover:shadow-[0_0_15px_rgba(236,72,153,0.25)]",
    },
    {
      id: "linkedin",
      nome: "LinkedIn",
      leads: "932 leads",
      icone: LinkedInIcon,
      borda: "border-blue-500/30",
      glow: "hover:border-blue-500/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]",
    },
    {
      id: "youtube",
      nome: "YouTube",
      leads: "576 leads",
      icone: YouTubeIcon,
      borda: "border-red-500/30",
      glow: "hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]",
    },
    {
      id: "tiktok",
      nome: "TikTok",
      leads: "418 leads",
      icone: TikTokIcon,
      borda: "border-cyan-500/30",
      glow: "hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    },
    {
      id: "google-maps",
      nome: "Google Maps",
      leads: "2.143 leads",
      icone: GoogleMapsIcon,
      borda: "border-emerald-500/30",
      glow: "hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    },
  ];

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
          {/* COLUNA ESQUERDA: Textos & Botões */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            {/* Badge de Categoria */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6200]/30 bg-[#ff6200]/10 px-3.5 py-1 text-xs font-bold tracking-wider text-[#ff7a00] uppercase mb-6 shadow-[0_0_15px_rgba(255,98,0,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6200] animate-pulse" />
              PROSPECÇÃO MULTICANAL
            </div>

            {/* Headline Principal com H1 Único */}
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight text-white leading-[1.12]">
              Encontre clientes <br />
              em todos os canais <br />
              <span className="text-[#ff6200] drop-shadow-[0_0_25px_rgba(255,98,0,0.4)]">
                com IA.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-5 max-w-lg text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Use inteligência artificial para encontrar, qualificar e organizar leads no Instagram,
              LinkedIn, YouTube, TikTok e Google Maps.
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
                href="#canais"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-sm px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white hover:border-white/25 transition-all"
              >
                <Play className="h-4 w-4 text-[#ff6200] fill-[#ff6200]/20" /> Ver demonstração
              </a>
            </div>
          </div>

          {/* COLUNA DIREITA: Mockup da Interface Completa */}
          <div className="lg:col-span-7 relative">
            {/* Glow Laranja sob a interface */}
            <div
              className="absolute -inset-2 rounded-3xl opacity-50 blur-2xl pointer-events-none"
              style={{
                background: "radial-gradient(circle at center, rgba(255,98,0,0.3) 0%, transparent 70%)",
              }}
            />

            {/* Painel Principal do Dashboard Multicanal */}
            <div className="relative rounded-2xl border border-[#ff6200]/40 bg-[#070c14]/95 shadow-[0_0_35px_rgba(255,98,0,0.2)] overflow-hidden">
              {/* Barra Superior / Header do Mockup */}
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 bg-[#0a101d]">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ff6200] text-[11px] font-black text-white">
                    F
                  </div>
                  <span className="font-sans text-xs font-bold text-white tracking-tight">
                    Flow Business
                  </span>
                </div>

                {/* Input de Busca */}
                <div className="relative flex-1 max-w-xs mx-4">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value="Buscar leads, nicho, localização..."
                    className="w-full rounded-lg bg-black/40 border border-white/10 pl-8 pr-3 py-1 text-[11px] text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-400">Online</span>
                </div>
              </div>

              {/* Corpo do Painel: Menu Lateral + Lista de Leads */}
              <div className="grid grid-cols-12 divide-x divide-white/[0.06]">
                {/* Menu Lateral de Canais */}
                <div className="col-span-3 p-3 bg-[#05080e]/90 space-y-1.5 hidden sm:block">
                  <div className="flex items-center gap-2 rounded-lg bg-[#ff6200]/15 border border-[#ff6200]/30 px-2.5 py-1.5 text-[11px] font-bold text-[#ff7a00]">
                    <Search className="h-3.5 w-3.5 text-[#ff6200]" />
                    <span>Prospecção</span>
                  </div>

                  <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white">
                    <InstagramIcon className="h-3 w-3 text-pink-400" />
                    <span>Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-400 hover:text-white">
                    <LinkedInIcon className="h-3 w-3 text-blue-400" />
                    <span>LinkedIn</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-400 hover:text-white">
                    <YouTubeIcon className="h-3 w-3 text-red-400" />
                    <span>YouTube</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-400 hover:text-white">
                    <TikTokIcon className="h-3 w-3 text-cyan-400" />
                    <span>TikTok</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-400 hover:text-white">
                    <GoogleMapsIcon className="h-3 w-3 text-emerald-400" />
                    <span>Google Maps</span>
                  </div>
                </div>

                {/* Área Principal: Lista de Perfis / Leads */}
                <div className="col-span-12 sm:col-span-9 p-4 bg-[#070c14]">
                  {/* Topo da lista */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Instagram</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        1.248 leads
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border border-white/10 rounded-md px-2 py-0.5 bg-black/40">
                      <span>Últimos 30 dias</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </div>
                  </div>

                  {/* Lista de Leads Encontrados */}
                  <div className="space-y-2">
                    {perfisDemonstracao.map((lead, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 hover:border-[#ff6200]/30 transition-colors"
                      >
                        {/* Perfil */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${lead.avatarBg}`}
                          >
                            {lead.avatarLetra}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{lead.nome}</p>
                            <p className="text-[10px] text-slate-400 truncate">{lead.user}</p>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="hidden md:block text-center">
                          <p className="text-xs font-bold text-white">{lead.seguidores}</p>
                          <p className="text-[9px] text-slate-400">seguidores</p>
                        </div>

                        {/* Localização */}
                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-300">
                          <MapPin className="h-3 w-3 text-[#ff6200]" />
                          <span className="truncate max-w-[100px]">{lead.local}</span>
                        </div>

                        {/* Botão Adicionar */}
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded-md bg-[#ff6200]/20 hover:bg-[#ff6200] text-[#ff7a00] hover:text-white px-2 py-1 text-[10px] font-bold border border-[#ff6200]/40 transition-colors shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5 Cards Inferiores de Canais */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-[#0a101d] border-t border-white/[0.08]">
                {canaisInferiores.map((canal) => {
                  const Icone = canal.icone;
                  return (
                    <div
                      key={canal.id}
                      className={`flex flex-col items-center p-2 rounded-xl bg-black/40 border ${canal.borda} ${canal.glow} transition-all text-center`}
                    >
                      <Icone className="h-5 w-5 mb-1" />
                      <span className="text-[11px] font-bold text-white leading-tight">
                        {canal.nome}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{canal.leads}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
