import React from "react";
import {
  Plus,
  Play,
  User,
  Languages,
  LayoutTemplate,
  MonitorPlay,
} from "lucide-react";
import { HERO_FEATURES } from "./influencers-data";

interface InfluencersHeroBannerProps {
  onCriarVideo: () => void;
  onVerComoFunciona: () => void;
  onPlayDemo: () => void;
}

export const InfluencersHeroBanner: React.FC<InfluencersHeroBannerProps> = ({
  onCriarVideo,
  onVerComoFunciona,
  onPlayDemo,
}) => {
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case "User":
        return <User className="w-4 h-4 text-slate-300" />;
      case "Languages":
        return <Languages className="w-4 h-4 text-slate-300" />;
      case "LayoutTemplate":
        return <LayoutTemplate className="w-4 h-4 text-slate-300" />;
      case "MonitorPlay":
        return <MonitorPlay className="w-4 h-4 text-slate-300" />;
      default:
        return <User className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121929] via-[#0E1524] to-[#151D2C] border border-slate-800/80 p-5 sm:p-7 shadow-2xl">
      {/* Background subtle radial glow */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left column: Copy & CTAs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20">
            Transforme ideias em vídeos incríveis
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Crie vídeos com avatares de IA{" "}
            <span className="text-orange-500">em poucos minutos</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
            Escolha um avatar, defina seu roteiro, personalize e gere vídeos
            profissionais para suas campanhas, anúncios e redes sociais.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onCriarVideo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar meu primeiro vídeo</span>
            </button>

            <button
              type="button"
              onClick={onVerComoFunciona}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-slate-300 text-slate-300" />
              <span>Ver como funciona</span>
            </button>
          </div>
        </div>

        {/* Center column: High quality avatar photo with play overlay */}
        <div className="lg:col-span-4 flex items-center justify-center">
          <div
            onClick={onPlayDemo}
            className="relative group cursor-pointer rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl max-w-[280px] w-full aspect-[4/5] bg-slate-900"
          >
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80"
              alt="Avatar principal do studio"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Glowing play button in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.7)] group-hover:scale-110 transition-all duration-300 pl-0.5">
                <Play className="w-5 h-5 fill-white text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: 4 Features list */}
        <div className="lg:col-span-3 space-y-3.5">
          {HERO_FEATURES.map((feat) => (
            <div
              key={feat.id}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                {getFeatureIcon(feat.iconName)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {feat.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  {feat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
