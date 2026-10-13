import React from "react";
import { Users, Star, Plus } from "lucide-react";

interface InfluencersLibraryHeaderProps {
  onCriarAvatar: () => void;
}

export const InfluencersLibraryHeader: React.FC<InfluencersLibraryHeaderProps> = ({
  onCriarAvatar,
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
          <span className="text-orange-400 font-semibold">Biblioteca de Influencers</span>
        </div>

        {/* Title row with orange users/portrait icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Biblioteca de Influencers
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Escolha um influencer de IA para suas campanhas ou crie o seu próprio. Avatares realistas,
          prontos para gerar vídeos profissionais.
        </p>
      </div>

      {/* Right: Premium Banner with "Criar meu avatar" Button */}
      <div className="w-full lg:w-auto bg-[#0E1626]/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              Influencers que impulsionam suas vendas
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Avatares profissionais para qualquer nicho.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCriarAvatar}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar meu avatar</span>
        </button>
      </div>
    </div>
  );
};
