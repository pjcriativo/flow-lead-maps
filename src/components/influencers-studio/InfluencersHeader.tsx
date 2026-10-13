import React from "react";
import { Video, Star, Plus } from "lucide-react";

interface InfluencersHeaderProps {
  onCriarVideo: () => void;
}

export const InfluencersHeader: React.FC<InfluencersHeaderProps> = ({
  onCriarVideo,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
      {/* Left: Breadcrumb, Title & Subtitle */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
          <span className="hover:text-slate-200 transition-colors cursor-pointer">
            AI Influencers Studio
          </span>
          <span className="text-slate-600">&gt;</span>
          <span className="text-orange-400 font-semibold">Visão Geral</span>
        </div>

        {/* Title row with orange camera/video icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            AI Influencers Studio
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Crie, personalize e produza vídeos profissionais com avatares de IA.
          Transforme seus produtos em conteúdos que vendem.
        </p>
      </div>

      {/* Right: Premium Banner with "Criar vídeo" Button */}
      <div className="w-full lg:w-auto bg-[#0E1626]/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              Avatares que geram resultados reais
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Crie vídeos profissionais em minutos com IA.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCriarVideo}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar vídeo</span>
        </button>
      </div>
    </div>
  );
};
