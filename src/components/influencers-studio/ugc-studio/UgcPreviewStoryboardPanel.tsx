import React, { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  Maximize2,
  Clock,
  Sparkles,
  FileText,
  Layers,
  Component,
} from "lucide-react";
import { UGC_SCENES, type UgcSceneItem } from "./ugc-data";

interface UgcPreviewStoryboardPanelProps {
  avatarImageUrl: string;
  avatarName: string;
  onPlayFullDemo?: () => void;
}

export const UgcPreviewStoryboardPanel: React.FC<UgcPreviewStoryboardPanelProps> = ({
  avatarImageUrl,
  avatarName,
  onPlayFullDemo,
}) => {
  const [activeTab, setActiveTab] = useState<"roteiro" | "cenas" | "elementos">("cenas");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>("scene-1");
  const [scenes, setScenes] = useState<UgcSceneItem[]>(UGC_SCENES);
  const [editingScene, setEditingScene] = useState<UgcSceneItem | null>(null);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (onPlayFullDemo) onPlayFullDemo();
  };

  const handleSceneClick = (scene: UgcSceneItem) => {
    setSelectedSceneId(scene.id);
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col shadow-lg">
      {/* Header: Title & Subtitle + Top-Right Storyboard Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-orange-400">5 .</span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Prévia e Geração
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Revise seu vídeo antes de gerar. Faça ajustes se necessário.
          </p>
        </div>

        {/* Tabs: Roteiro / Cenas / Elementos */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("roteiro")}
            className={`py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "roteiro"
                ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Roteiro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cenas")}
            className={`py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "cenas"
                ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cenas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("elementos")}
            className={`py-1 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "elementos"
                ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Elementos
          </button>
        </div>
      </div>

      {/* Main Grid: Left Video Player (approx 45%) & Right Storyboard Flow (approx 55%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 items-stretch">
        {/* Left Sub-Section: Video Player Container */}
        <div className="lg:col-span-5 flex items-stretch gap-2.5">
          {/* Main Video Box */}
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video lg:aspect-auto min-h-[220px] flex flex-col justify-between p-3 group shadow-inner">
            <img
              src={avatarImageUrl}
              alt={avatarName}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

            {/* Top Badge: Prévia em baixa resolução */}
            <div className="relative z-10 flex justify-end">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-slate-300 backdrop-blur-md">
                Prévia em baixa resolução
              </span>
            </div>

            {/* Big Center Play Button */}
            <div className="relative z-10 flex items-center justify-center my-auto">
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-orange-500/90 hover:bg-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Bottom Scrubber & Controls Bar */}
            <div className="relative z-10 space-y-1.5 pt-2">
              {/* Progress Scrubber */}
              <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden cursor-pointer">
                <div className="bg-orange-500 h-full w-[25%]" />
              </div>

              {/* Time & Audio / Fullscreen controls */}
              <div className="flex items-center justify-between text-[11px] text-white">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  </button>
                  <span className="font-mono text-[10px] text-slate-300">0:00 / 0:30</span>
                </div>

                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-300 hover:text-white cursor-pointer" />
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300 hover:text-white cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Vertical strip of 3 mini scene snapshots */}
          <div className="hidden sm:flex flex-col justify-between gap-1.5 w-14 shrink-0">
            {scenes.slice(0, 3).map((sc) => (
              <div
                key={sc.id}
                onClick={() => setSelectedSceneId(sc.id)}
                className={`relative flex-1 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                  selectedSceneId === sc.id
                    ? "border-orange-500 ring-1 ring-orange-500"
                    : "border-slate-800 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={sc.imageUrl} alt={sc.title} className="w-full h-full object-cover object-top" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sub-Section: Storyboard Scenes Flow */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          {activeTab === "cenas" && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 h-full">
              {scenes.map((scene) => {
                const isSelected = selectedSceneId === scene.id;

                return (
                  <div
                    key={scene.id}
                    onClick={() => handleSceneClick(scene)}
                    className={`rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/70 shadow-sm"
                        : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      {/* Top Time Range Badge */}
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">Cena {scene.sceneNumber}</span>
                        <span className="font-mono">{scene.timeRange}</span>
                      </div>

                      {/* Scene Snapshot Thumbnail */}
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-800 border border-slate-700/60 mb-2 relative">
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>

                      {/* Scene Title */}
                      <span className="block text-[11px] font-bold text-white truncate">
                        {scene.title}
                      </span>

                      {/* Scene Text preview */}
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-snug">
                        {scene.text}
                      </p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
                      <span>Take {scene.sceneNumber}</span>
                      <span className="text-orange-400 font-medium">Editar</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "roteiro" && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 h-full overflow-y-auto">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <span>Roteiro Consolidado da Produção</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                {scenes.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800/80">
                    <span className="font-bold text-orange-400 block text-[11px]">
                      [Cena {s.sceneNumber} • {s.timeRange}] {s.title}
                    </span>
                    <p className="mt-0.5 text-slate-300 text-xs">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "elementos" && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 h-full">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Component className="w-4 h-4 text-orange-400" />
                <span>Elementos Audiovisuais Sobrepostos</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Áudio de Fundo</span>
                  <span className="text-white font-medium">Lo-Fi Comercial Suave (Volume: 25%)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Tipografia de Legenda</span>
                  <span className="text-white font-medium">Inter SemiBold Amarelo/Branco</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Animação de CTA</span>
                  <span className="text-white font-medium">Pill Flutuante no final (5s)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Enquadramento</span>
                  <span className="text-white font-medium">Vertical 9:16 Dinâmico</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UgcPreviewStoryboardPanel;
