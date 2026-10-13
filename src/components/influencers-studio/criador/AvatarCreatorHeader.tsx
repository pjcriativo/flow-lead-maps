import React from "react";
import { UserCheck, Star, Sparkles } from "lucide-react";

interface AvatarCreatorHeaderProps {
  onVerExemplos?: () => void;
  onNavigateToBiblioteca?: () => void;
}

export const AvatarCreatorHeader: React.FC<AvatarCreatorHeaderProps> = ({
  onVerExemplos,
  onNavigateToBiblioteca,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-1">
      {/* Left: Breadcrumb, Title & Subtitle */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
          <span
            onClick={onNavigateToBiblioteca}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            AI Influencers Studio
          </span>
          <span className="text-slate-600">&gt;</span>
          <span className="text-orange-400 font-semibold">Criador de Avatares</span>
        </div>

        {/* Title row with orange avatar portrait icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Criador de Avatares
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Crie um influencer de IA exclusivo para sua marca. Personalize a aparência, voz, estilo e personalidade.
        </p>
      </div>

      {/* Right: Premium Banner with "Ver exemplos" Button */}
      <div className="w-full lg:w-auto bg-[#0E1626]/90 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              Avatares exclusivos para a sua marca
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Personagens únicos, treinados com a identidade do seu negócio.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onVerExemplos}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ver exemplos</span>
        </button>
      </div>
    </div>
  );
};

export default AvatarCreatorHeader;
