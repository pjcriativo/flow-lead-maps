import { ArrowRight, CheckCircle2, Bot, Users } from "lucide-react";
import {
  GoogleMapsIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  TikTokIcon,
  BusinessB2BIcon,
} from "../home-publica/HomeIcons";

export function InteligenciaComercialSection() {
  return (
    <section id="inteligencia" className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
      <div className="relative rounded-3xl border border-white/[0.08] bg-[#070b12]/90 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
        {/* Glow Laranja Central */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(255,98,0,0.14)_0%,_transparent_70%)] blur-3xl -z-10" />

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#ff6200] mb-3">
            INTELIGÊNCIA COMERCIAL
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Da prospecção à estratégia comercial.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Conecte os canais, organize suas oportunidades e conte com o CEO Mestre para analisar e propor estratégias para o seu negócio.
          </p>
        </div>

        {/* FLUXO ARQUITETURAL EM 5 ETAPAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* ETAPA 1: Canais de Prospecção */}
          <div className="rounded-2xl border border-white/10 bg-[#0c121e] p-4 text-center h-full flex flex-col justify-between">
            <span className="text-xs font-bold text-white mb-3 block">Canais de Prospecção</span>
            <div className="grid grid-cols-3 gap-2 my-auto p-2 rounded-xl bg-black/40 border border-white/5">
              <div className="h-7 w-7 mx-auto"><GoogleMapsIcon className="h-full w-full" /></div>
              <div className="h-7 w-7 mx-auto"><InstagramIcon className="h-full w-full" /></div>
              <div className="h-7 w-7 mx-auto"><LinkedInIcon className="h-full w-full" /></div>
              <div className="h-7 w-7 mx-auto rounded-lg bg-[#FF0000] p-1 text-white"><YouTubeIcon className="h-full w-full" /></div>
              <div className="h-7 w-7 mx-auto"><TikTokIcon className="h-full w-full" /></div>
              <div className="h-7 w-7 mx-auto"><BusinessB2BIcon className="h-full w-full" /></div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">Extração Multicanal</span>
          </div>

          {/* ETAPA 2: Leads Qualificados */}
          <div className="rounded-2xl border border-white/10 bg-[#0c121e] p-4 text-center h-full flex flex-col justify-between">
            <span className="text-xs font-bold text-white mb-3 block">Leads Qualificados</span>
            <div className="space-y-1.5 my-auto text-[10px]">
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-slate-200 truncate">Oral Prime SP</span>
                </div>
                <span className="text-[#ff6200] font-mono text-[9px]">Score 94</span>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-slate-200 truncate">Sorriso Digital</span>
                </div>
                <span className="text-[#ff6200] font-mono text-[9px]">Score 88</span>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-slate-200 truncate">Dra. Amanda</span>
                </div>
                <span className="text-[#ff6200] font-mono text-[9px]">Score 91</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">Validação em Tempo Real</span>
          </div>

          {/* ETAPA 3: CRM Organização */}
          <div className="rounded-2xl border border-white/10 bg-[#0c121e] p-4 text-center h-full flex flex-col justify-between">
            <span className="text-xs font-bold text-white mb-3 block">CRM Organização</span>
            <div className="grid grid-cols-3 gap-1 my-auto p-1.5 rounded-xl bg-black/40 border border-white/5 h-24">
              <div className="rounded bg-white/5 p-1 flex flex-col gap-1">
                <div className="h-1.5 w-full bg-[#ff6200]/50 rounded" />
                <div className="h-4 rounded bg-white/10" />
                <div className="h-4 rounded bg-white/10" />
              </div>
              <div className="rounded bg-white/5 p-1 flex flex-col gap-1">
                <div className="h-1.5 w-full bg-blue-400/50 rounded" />
                <div className="h-6 rounded bg-white/10" />
              </div>
              <div className="rounded bg-white/5 p-1 flex flex-col gap-1">
                <div className="h-1.5 w-full bg-emerald-400/50 rounded" />
                <div className="h-5 rounded bg-white/10" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">Pipeline & Kanban</span>
          </div>

          {/* ETAPA 4: CEO Mestre Estratégia com IA (Destaque Principal) */}
          <div className="rounded-2xl border-2 border-[#ff6200]/70 bg-[#0f1728] p-4 text-center h-full flex flex-col justify-between shadow-[0_0_20px_rgba(255,98,0,0.25)] relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#ff6200] px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-md">
              IA Central
            </div>
            <span className="text-xs font-bold text-white mt-1 mb-2 block">CEO Mestre</span>
            {/* Foto Executiva / Avatar Ilustrativo de IA */}
            <div className="my-auto">
              <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-tr from-[#ff6200] via-slate-800 to-slate-950 p-1 border border-white/20 shadow-lg flex items-center justify-center overflow-hidden">
                <Bot className="h-8 w-8 text-[#ff7a00]" />
              </div>
              <p className="mt-2 text-[10px] font-semibold text-white">Estratégia com IA</p>
              <p className="text-[9px] text-slate-400">Análise de metas e rotas</p>
            </div>
            <span className="text-[10px] text-[#ff7a00] font-medium mt-1">Direcionamento 24/7</span>
          </div>

          {/* ETAPA 5: Equipe Comercial Execução */}
          <div className="rounded-2xl border border-white/10 bg-[#0c121e] p-4 text-center h-full flex flex-col justify-between">
            <span className="text-xs font-bold text-white mb-3 block">Equipe Comercial</span>
            <div className="space-y-1.5 my-auto text-[10px]">
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-[#ff6200]/30 text-white flex items-center justify-center text-[8px] font-bold">R</div>
                  <span className="text-slate-200">SDR Rodrigo</span>
                </div>
                <span className="text-emerald-400 text-[9px]">Ativo</span>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-blue-500/30 text-white flex items-center justify-center text-[8px] font-bold">C</div>
                  <span className="text-slate-200">Closer Marina</span>
                </div>
                <span className="text-emerald-400 text-[9px]">Ativo</span>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-purple-500/30 text-white flex items-center justify-center text-[8px] font-bold">A</div>
                  <span className="text-slate-200">Agente WhatsApp</span>
                </div>
                <span className="text-cyan-400 text-[9px]">IA 24/7</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">Execução & Conversão</span>
          </div>
        </div>
      </div>
    </section>
  );
}

