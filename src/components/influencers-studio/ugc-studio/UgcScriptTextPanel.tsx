import React, { useState } from "react";
import {
  Sparkles,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Star,
  GraduationCap,
  MessageSquareQuote,
  Building2,
  SlidersHorizontal,
} from "lucide-react";
import {
  UGC_OBJECTIVES,
  UGC_DURATIONS,
  type UgcObjectiveItem,
  type UgcDurationOption,
} from "./ugc-data";

interface UgcScriptTextPanelProps {
  selectedObjective: string;
  onSelectObjective: (objId: string) => void;
  scriptPoints: string;
  onScriptPointsChange: (text: string) => void;
  selectedDuration: string;
  onSelectDuration: (durId: string) => void;
  onGenerateScript: () => void;
  onPreviewScript: () => void;
}

export const UgcScriptTextPanel: React.FC<UgcScriptTextPanelProps> = ({
  selectedObjective,
  onSelectObjective,
  scriptPoints,
  onScriptPointsChange,
  selectedDuration,
  onSelectDuration,
  onGenerateScript,
  onPreviewScript,
}) => {
  const [scriptMode, setScriptMode] = useState<"ia" | "template" | "personalizado">("ia");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toneSetting, setToneSetting] = useState("descontraido");
  const [ctaType, setCtaType] = useState("clique_link");

  const getObjectiveIcon = (type: UgcObjectiveItem["iconType"]) => {
    switch (type) {
      case "anuncio":
        return <Tag className="w-3.5 h-3.5" />;
      case "review":
        return <Star className="w-3.5 h-3.5" />;
      case "tutorial":
        return <GraduationCap className="w-3.5 h-3.5" />;
      case "depoimento":
        return <MessageSquareQuote className="w-3.5 h-3.5" />;
      case "institucional":
        return <Building2 className="w-3.5 h-3.5" />;
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-orange-400">2 .</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Roteiro e Texto
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          Crie um roteiro envolvente com a ajuda da IA ou escreva o seu próprio.
        </p>
      </div>

      {/* Mode Buttons */}
      <div className="flex items-center gap-1.5 mt-3.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          type="button"
          onClick={() => setScriptMode("ia")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            scriptMode === "ia"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Gerar com IA
        </button>
        <button
          type="button"
          onClick={() => setScriptMode("template")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            scriptMode === "template"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Usar template
        </button>
        <button
          type="button"
          onClick={() => setScriptMode("personalizado")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            scriptMode === "personalizado"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Roteiro personalizado
        </button>
      </div>

      <div className="space-y-3.5 mt-3.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {/* Section: Objetivo do vídeo */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">
            Objetivo do vídeo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {UGC_OBJECTIVES.map((obj) => {
              const isSelected = selectedObjective === obj.id;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => onSelectObjective(obj.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/70 shadow-sm shadow-orange-500/10"
                      : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "border border-slate-700 text-slate-400"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : (
                      getObjectiveIcon(obj.iconType)
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">
                      {obj.title}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                      {obj.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Principais pontos para o roteiro */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-white">
              Principais pontos para o roteiro
            </label>
            <span className="text-[10px] text-slate-400">
              {scriptPoints.length}/500
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={500}
            value={scriptPoints}
            onChange={(e) => onScriptPointsChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-orange-500/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none leading-relaxed"
            placeholder="Destaque os benefícios, diferenciais e chamada para ação..."
          />
        </div>

        {/* Section: Duração do vídeo */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">
            Duração do vídeo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {UGC_DURATIONS.map((dur) => {
              const isSelected = selectedDuration === dur.id;
              return (
                <button
                  key={dur.id}
                  type="button"
                  onClick={() => onSelectDuration(dur.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/70 shadow-sm"
                      : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-orange-500 bg-orange-500"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1 h-1 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-orange-400" : "text-slate-300"
                      }`}
                    >
                      {dur.duration}
                    </span>
                  </div>
                  <span className="block text-[9px] text-slate-400 mt-1 truncate">
                    {dur.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible: Configurações avançadas */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5 text-orange-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-orange-400" />
            )}
            <span>Configurações avançadas</span>
          </button>

          {showAdvanced && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 animate-in fade-in">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tom da narrativa
                </label>
                <select
                  value={toneSetting}
                  onChange={(e) => setToneSetting(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="descontraido">Descontraído e Autêntico (UGC)</option>
                  <option value="profissional">Profissional e Corporativo</option>
                  <option value="vendedor">Agressivo em Vendas</option>
                  <option value="educativo">Educativo e Calmo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Gatilho de Chamada para Ação (CTA)
                </label>
                <select
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="clique_link">Clique no link na bio / descrição</option>
                  <option value="cupom">Use o cupom exclusivo de desconto</option>
                  <option value="garanta_vaga">Garanta sua vaga hoje</option>
                  <option value="saiba_mais">Saiba mais no site oficial</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 mt-3.5 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onGenerateScript}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gerar roteiro com IA</span>
        </button>

        <button
          type="button"
          onClick={onPreviewScript}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.99]"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Pré-visualizar roteiro</span>
        </button>
      </div>
    </div>
  );
};

export default UgcScriptTextPanel;
