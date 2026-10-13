import React, { useState } from "react";
import {
  Play,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  FileText,
  ArrowRight,
} from "lucide-react";
import { SOFIA_VARIATIONS, type VariationGalleryItem } from "./criador-data";

interface AvatarPreviewPanelProps {
  currentImageUrl: string;
  avatarName: string;
  onVerEmMovimento: () => void;
  onSalvarRascunho: () => void;
  onContinuar: () => void;
}

const AI_TIPS = [
  "Seu avatar está ótimo! Você pode ajustar o estilo de roupa e o cenário para deixar ainda mais alinhado com a sua marca.",
  "Avatares com expressões naturais e tons quentes costumam gerar 28% mais retenção em anúncios UGC.",
  "Adicionar uma voz com sotaque regional pode aumentar a conexão com seu público-alvo.",
];

export const AvatarPreviewPanel: React.FC<AvatarPreviewPanelProps> = ({
  currentImageUrl,
  avatarName,
  onVerEmMovimento,
  onSalvarRascunho,
  onContinuar,
}) => {
  const [viewMode, setViewMode] = useState<"retrato" | "cena">("retrato");
  const [selectedVariation, setSelectedVariation] = useState<string>("var-1");
  const [activePreviewUrl, setActivePreviewUrl] = useState<string>(currentImageUrl);
  const [tipIndex, setTipIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync when currentImageUrl changes
  React.useEffect(() => {
    setActivePreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleSelectVariation = (item: VariationGalleryItem) => {
    setSelectedVariation(item.id);
    setActivePreviewUrl(item.imageUrl);
  };

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % AI_TIPS.length);
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Header: Title & Retrato/Cena toggle */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Prévia do Avatar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Veja como seu avatar ficará.
          </p>
        </div>

        {/* Retrato / Cena Toggle */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("retrato")}
            className={`py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === "retrato"
                ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Retrato
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cena")}
            className={`py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === "cena"
                ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cena
          </button>
        </div>
      </div>

      {/* Main Preview Portrait Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[3/4] sm:aspect-[4/5] shadow-inner group">
        <img
          src={activePreviewUrl}
          alt={avatarName}
          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
        />

        {/* Subtle vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {/* Floating pill: "Ver em movimento" */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
          <button
            type="button"
            onClick={onVerEmMovimento}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-black/70 hover:bg-black/90 text-white border border-white/20 hover:border-orange-500/50 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Ver em movimento</span>
          </button>
        </div>

        {/* Zoom / Fullscreen icon button */}
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          title="Ampliar prévia"
          className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white border border-white/15 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-10"
        >
          <Maximize2 className="w-4 h-4 text-slate-200" />
        </button>
      </div>

      {/* Variations Carousel (4 thumbnails + arrows) */}
      <div className="flex items-center gap-1.5 mt-3.5">
        <button
          type="button"
          onClick={() => {
            const idx = SOFIA_VARIATIONS.findIndex((v) => v.id === selectedVariation);
            const prevIdx = (idx - 1 + SOFIA_VARIATIONS.length) % SOFIA_VARIATIONS.length;
            handleSelectVariation(SOFIA_VARIATIONS[prevIdx]);
          }}
          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-4 gap-2 flex-1">
          {SOFIA_VARIATIONS.map((item) => {
            const isSelected = selectedVariation === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectVariation(item)}
                className={`group relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all ${
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                    : "border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100"
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200"
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            const idx = SOFIA_VARIATIONS.findIndex((v) => v.id === selectedVariation);
            const nextIdx = (idx + 1) % SOFIA_VARIATIONS.length;
            handleSelectVariation(SOFIA_VARIATIONS[nextIdx]);
          }}
          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* "Dicas da IA" Card */}
      <div className="bg-[#0E1626]/90 border border-slate-800 rounded-xl p-3 mt-3 flex items-start gap-3 shadow-sm">
        <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white tracking-wide">
            Dicas da IA
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            {AI_TIPS[tipIndex]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNextTip}
          title="Próxima dica"
          className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons: "Salvar como rascunho" & "Continuar para Voz e Idioma" */}
      <div className="flex items-center gap-3 mt-4 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onSalvarRascunho}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.99]"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Salvar como rascunho</span>
        </button>

        <button
          type="button"
          onClick={onContinuar}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-[0.99]"
        >
          <span>Continuar para Voz e Idioma</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <img
              src={activePreviewUrl}
              alt={avatarName}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 rounded-full text-xs text-white">
              Clique para fechar
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarPreviewPanel;
