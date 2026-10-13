import React from "react";
import { UserPlus, Clapperboard, Sparkles, Rocket } from "lucide-react";

interface InfluencersBottomPromoCardsProps {
  onCriarAvatar: () => void;
  onAbrirVideoStudio: () => void;
}

export const InfluencersBottomPromoCards: React.FC<InfluencersBottomPromoCardsProps> = ({
  onCriarAvatar,
  onAbrirVideoStudio,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      {/* Left Promo Card: Avatar Personalizado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171324] via-[#121322] to-[#1C1226] border border-slate-800/80 p-5 shadow-xl flex items-center justify-between gap-4">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-xs">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Não encontrou o influencer ideal?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Crie um avatar personalizado para a sua marca.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onCriarAvatar}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Criar meu avatar
            </button>
          </div>
        </div>

        {/* Right Visual Floating Avatars */}
        <div className="relative z-10 shrink-0 flex items-center -space-x-3 pr-2">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
            alt="Avatar 1"
            className="w-12 h-12 rounded-full border-2 border-purple-500/80 object-cover shadow-lg"
          />
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
            alt="Avatar 2"
            className="w-14 h-14 rounded-full border-2 border-orange-500 object-cover shadow-2xl relative z-10"
          />
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80"
            alt="Avatar 3"
            className="w-12 h-12 rounded-full border-2 border-amber-500/80 object-cover shadow-lg"
          />
        </div>
      </div>

      {/* Right Promo Card: AI UGC Video Studio */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E1528] via-[#10192A] to-[#121B2F] border border-slate-800/80 p-5 shadow-xl flex items-center justify-between gap-4">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-xs">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Precisa de um vídeo específico?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Use o AI UGC Video Studio e gere vídeos profissionais.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onAbrirVideoStudio}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Abrir Video Studio
            </button>
          </div>
        </div>

        {/* Right Visual Floating Clapperboard and preview video */}
        <div className="relative z-10 shrink-0 flex items-center gap-2 pr-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md">
            <Clapperboard className="w-5 h-5 text-orange-400" />
          </div>
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80"
            alt="Preview Video"
            className="w-16 h-12 rounded-lg border border-slate-700 object-cover shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
