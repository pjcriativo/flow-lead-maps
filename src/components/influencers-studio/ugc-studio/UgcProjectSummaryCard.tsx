import React from "react";
import { Clapperboard } from "lucide-react";

interface UgcProjectSummaryCardProps {
  productName: string;
  videoType: string;
  duration: string;
  avatarName: string;
  voiceName: string;
  format: string;
  onEdit?: () => void;
  onGerarVideo: () => void;
  isGenerating?: boolean;
}

export const UgcProjectSummaryCard: React.FC<UgcProjectSummaryCardProps> = ({
  productName,
  videoType,
  duration,
  avatarName,
  voiceName,
  format,
  onEdit,
  onGerarVideo,
  isGenerating = false,
}) => {
  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full shadow-lg">
      {/* Header: Resumo + Editar */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Resumo
          </h3>
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
          >
            Editar
          </button>
        </div>

        {/* Summary Table List */}
        <div className="space-y-2.5 mt-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Produto</span>
            <span className="font-semibold text-white truncate max-w-[150px] text-right">
              {productName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tipo de vídeo</span>
            <span className="font-semibold text-white">{videoType}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Duração</span>
            <span className="font-semibold text-white">{duration}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Avatar</span>
            <span className="font-semibold text-white">{avatarName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Voz</span>
            <span className="font-semibold text-white truncate max-w-[150px] text-right">
              {voiceName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Formato</span>
            <span className="font-semibold text-white">{format}</span>
          </div>
        </div>
      </div>

      {/* Big Action Button & Estimated Cost */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGerarVideo}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Clapperboard className="w-4 h-4" />
          <span>{isGenerating ? "Processando geração..." : "Gerar vídeo agora"}</span>
        </button>

        <p className="text-center text-[11px] text-slate-400">
          Custo estimado: <span className="text-orange-400 font-semibold">10 créditos</span>
        </p>
      </div>
    </div>
  );
};

export default UgcProjectSummaryCard;
