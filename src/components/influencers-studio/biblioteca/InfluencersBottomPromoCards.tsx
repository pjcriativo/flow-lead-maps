import React from "react";

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171324] via-[#121322] to-[#1C1226] border border-slate-800/80 p-5 sm:p-6 shadow-xl flex items-center justify-between min-h-[142px]">
        {/* Background artwork on the right */}
        <div className="absolute inset-y-0 right-0 w-3/5 pointer-events-none overflow-hidden">
          <img
            src="/images/promo_avatar_personalizado.jpg"
            alt="Criar Avatar Personalizado"
            className="w-full h-full object-cover object-right opacity-90 scale-105"
          />
          {/* Gradient overlay to blend into the left dark side */}
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#171324] via-[#171324]/90 to-transparent" />
        </div>

        {/* Content on the left */}
        <div className="relative z-10 space-y-2 max-w-[280px]">
          <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
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
      </div>

      {/* Right Promo Card: AI UGC Video Studio */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1322] via-[#0E1728] to-[#111B30] border border-slate-800/80 p-5 sm:p-6 shadow-xl flex items-center justify-between min-h-[142px]">
        {/* Background artwork on the right */}
        <div className="absolute inset-y-0 right-0 w-3/5 pointer-events-none overflow-hidden">
          <img
            src="/images/promo_ugc_video_studio.jpg"
            alt="AI UGC Video Studio"
            className="w-full h-full object-cover object-right opacity-90 scale-105"
          />
          {/* Gradient overlay to blend into the left dark side */}
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#0C1322] via-[#0C1322]/90 to-transparent" />
        </div>

        {/* Content on the left */}
        <div className="relative z-10 space-y-2 max-w-[280px]">
          <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
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
      </div>
    </div>
  );
};
