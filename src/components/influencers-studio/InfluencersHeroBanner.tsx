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
    <div className="relative overflow-hidden rounded-2xl bg-[#090D18] border border-slate-800/80 shadow-2xl min-h-[300px]">
      {/* 1. Seamless Background Banner across the ENTIRE card */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Full-width, full-height avatar influencer background */}
        <img
          src="/images/hero_influencer_banner.jpg"
          alt="Avatar Influencer Principal"
          className="w-full h-full object-cover object-[center_35%] scale-105"
        />

        {/* Left Dark Gradient Overlay: smooth fade allowing crisp readability of text */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-[65%] lg:w-[50%] bg-gradient-to-r from-[#070B14] via-[#070B14]/95 via-55% to-transparent z-10" />

        {/* Right Dark Gradient Overlay: smooth glass backdrop for features */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-[50%] lg:w-[42%] bg-gradient-to-l from-[#070B14]/90 via-[#070B14]/65 to-transparent z-10" />

        {/* Top and Bottom soft vignettes */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#070B14]/75 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#070B14]/85 to-transparent z-10" />

        {/* Subtle warm amber ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Center Floating Play Button (directly on the influencer) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <button
          type="button"
          onClick={onPlayDemo}
          aria-label="Ver demonstração do avatar"
          className="pointer-events-auto group w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 backdrop-blur-md border border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.45)] flex items-center justify-center hover:scale-110 hover:border-orange-400 hover:shadow-[0_0_35px_rgba(249,115,22,0.7)] transition-all duration-300 cursor-pointer pl-0.5"
        >
          <Play className="w-6 h-6 fill-orange-500 text-orange-500 group-hover:scale-105 transition-transform" />
        </button>
      </div>

      {/* 3. Foreground Content Layout */}
      <div className="relative z-20 p-6 sm:p-8 lg:p-9 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/25">
            Transforme ideias em vídeos incríveis
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-white leading-tight">
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

        {/* Center Spacer Column: keeps the center open for the background avatar and play button */}
        <div className="hidden lg:block lg:col-span-3 h-48 pointer-events-none" />

        {/* Right Column: 4 Features list floating over the banner */}
        <div className="lg:col-span-4 space-y-3">
          {HERO_FEATURES.map((feat) => (
            <div
              key={feat.id}
              className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-[#09101E]/75 backdrop-blur-md border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-md"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shrink-0">
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
