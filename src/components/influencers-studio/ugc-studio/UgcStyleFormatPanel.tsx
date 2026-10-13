import React, { useState } from "react";
import {
  Smartphone,
  Square,
  Monitor,
  Music,
  Subtitles,
  Image as ImageIcon,
  MousePointerClick,
} from "lucide-react";
import {
  UGC_VISUAL_STYLES,
  UGC_SCENARIOS,
} from "./ugc-data";

interface UgcStyleFormatPanelProps {
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
}

export const UgcStyleFormatPanel: React.FC<UgcStyleFormatPanelProps> = ({
  selectedFormat,
  onSelectFormat,
  selectedStyle,
  onSelectStyle,
  selectedScenario,
  onSelectScenario,
}) => {
  const [hasSubtitles, setHasSubtitles] = useState(true);
  const [hasBgm, setHasBgm] = useState(true);
  const [hasBrandElements, setHasBrandElements] = useState(false);
  const [hasAnimatedCta, setHasAnimatedCta] = useState(true);

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-orange-400">4 .</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Estilo e Formato
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          Defina o visual, formato e elementos do seu vídeo.
        </p>
      </div>

      <div className="space-y-3.5 mt-3.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {/* Section: Formato de vídeo */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">
            Formato de vídeo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: "vertical",
                title: "Vertical",
                ratio: "9:16",
                desc: "Reels, Stories",
                icon: Smartphone,
              },
              {
                id: "quadrado",
                title: "Quadrado",
                ratio: "1:1",
                desc: "Instagram",
                icon: Square,
              },
              {
                id: "horizontal",
                title: "Horizontal",
                ratio: "16:9",
                desc: "YouTube, Ads",
                icon: Monitor,
              },
            ].map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              const IconComponent = fmt.icon;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => onSelectFormat(fmt.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/70 shadow-sm shadow-orange-500/10"
                      : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <IconComponent
                    className={`w-4 h-4 mb-1 ${
                      isSelected ? "text-orange-400" : "text-slate-400"
                    }`}
                  />
                  <span className="block text-[11px] font-bold text-white">
                    {fmt.title}
                  </span>
                  <span className="block text-[9px] text-orange-400 font-semibold">
                    {fmt.ratio}
                  </span>
                  <span className="block text-[9px] text-slate-400 mt-0.5 truncate">
                    {fmt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Estilo visual */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">
            Estilo visual
          </label>
          <div className="grid grid-cols-4 gap-2">
            {UGC_VISUAL_STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onSelectStyle(style.id)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div
                    className={`w-full aspect-square rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                        : "border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={style.imageUrl}
                      alt={style.label}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <span
                    className={`block text-[10px] mt-1 truncate ${
                      isSelected ? "text-orange-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Cenário */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">
            Cenário
          </label>
          <div className="grid grid-cols-4 gap-2">
            {UGC_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onSelectScenario(sc.id)}
                  className="group flex flex-col items-center cursor-pointer"
                >
                  <div
                    className={`w-full aspect-square rounded-xl overflow-hidden border transition-all ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                        : "border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={sc.imageUrl}
                      alt={sc.label}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <span
                    className={`block text-[10px] mt-1 truncate ${
                      isSelected ? "text-orange-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {sc.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Toggles list */}
        <div className="space-y-2 pt-1">
          {/* Toggle 1: Legendas */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Subtitles className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-300 font-medium">
                Adicionar legendas automáticas
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasSubtitles(!hasSubtitles)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                hasSubtitles ? "bg-orange-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  hasSubtitles ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Música de fundo */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-300 font-medium">
                Incluir música de fundo
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasBgm(!hasBgm)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                hasBgm ? "bg-orange-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  hasBgm ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle 3: Elementos da marca */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-300 font-medium">
                Mostrar elementos da marca
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasBrandElements(!hasBrandElements)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                hasBrandElements ? "bg-orange-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  hasBrandElements ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle 4: CTA animado */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-300 font-medium">
                Adicionar CTA animado
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasAnimatedCta(!hasAnimatedCta)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                hasAnimatedCta ? "bg-orange-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  hasAnimatedCta ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UgcStyleFormatPanel;
