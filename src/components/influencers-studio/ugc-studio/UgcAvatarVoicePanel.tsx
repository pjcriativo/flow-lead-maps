import React, { useState } from "react";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { UGC_AVATARS, type UgcAvatarItem } from "./ugc-data";

interface UgcAvatarVoicePanelProps {
  selectedAvatar: UgcAvatarItem;
  onSelectAvatar: (avatar: UgcAvatarItem) => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
}

export const UgcAvatarVoicePanel: React.FC<UgcAvatarVoicePanelProps> = ({
  selectedAvatar,
  onSelectAvatar,
  selectedLanguage,
  onSelectLanguage,
  selectedVoice,
  onSelectVoice,
}) => {
  const [activeTab, setActiveTab] = useState<"meus" | "biblioteca" | "favoritos">("biblioteca");
  const [isFavorite, setIsFavorite] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-orange-400">3 .</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Avatar e Voz
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          Escolha o avatar, a voz e o idioma para o seu vídeo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mt-3.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab("meus")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "meus"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Meus Avatares
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("biblioteca")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "biblioteca"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Biblioteca
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("favoritos")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "favoritos"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Favoritos
        </button>
      </div>

      <div className="space-y-3.5 mt-3.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {/* Featured Avatar Portrait Card */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3] shadow-md group">
          <img
            src={selectedAvatar.imageUrl}
            alt={selectedAvatar.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />

          {/* Vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

          {/* Top Right: Favorite button */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-slate-200 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorite ? "fill-rose-500 text-rose-500" : "text-white"
              }`}
            />
          </button>

          {/* Bottom Card Overlay: Name, badge, pills */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white drop-shadow">
                {selectedAvatar.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{selectedAvatar.badge}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {selectedAvatar.category}
              </span>
              <span className="text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {selectedAvatar.language}
              </span>
              <span className="text-[10px] text-slate-300 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {selectedAvatar.age}
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Mini Carousel */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const idx = UGC_AVATARS.findIndex((a) => a.id === selectedAvatar.id);
              const prev = (idx - 1 + UGC_AVATARS.length) % UGC_AVATARS.length;
              onSelectAvatar(UGC_AVATARS[prev]);
            }}
            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-4 gap-2 flex-1">
            {UGC_AVATARS.map((avatar) => {
              const isSelected = selectedAvatar.id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => onSelectAvatar(avatar)}
                  className={`group relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all ${
                    isSelected
                      ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                      : "border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200"
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const idx = UGC_AVATARS.findIndex((a) => a.id === selectedAvatar.id);
              const next = (idx + 1) % UGC_AVATARS.length;
              onSelectAvatar(UGC_AVATARS[next]);
            }}
            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Section: Voz e idioma */}
        <div>
          <label className="block text-xs font-semibold text-white mb-2">
            Voz e idioma
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Select 1: Idioma */}
            <div>
              <span className="block text-[10px] text-slate-400 mb-1">Idioma</span>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => onSelectLanguage(e.target.value)}
                  className="w-full appearance-none bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-white text-xs rounded-xl px-2.5 py-2 pr-6 cursor-pointer focus:outline-none focus:border-orange-500/60"
                >
                  <option value="pt-BR">🇧🇷 Português (BR)</option>
                  <option value="en-US">🇺🇸 Inglês (US)</option>
                  <option value="es-ES">🇪🇸 Espanhol (ES)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Select 2: Voz + Preview Button */}
            <div>
              <span className="block text-[10px] text-slate-400 mb-1">Voz</span>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <select
                    value={selectedVoice}
                    onChange={(e) => onSelectVoice(e.target.value)}
                    className="w-full appearance-none bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-white text-xs rounded-xl px-2.5 py-2 pr-6 cursor-pointer focus:outline-none focus:border-orange-500/60 truncate"
                  >
                    <option value="Adriana (Natural)">Adriana (Natural)</option>
                    <option value="Sofia (Comercial)">Sofia (Comercial)</option>
                    <option value="Isabella (Casual)">Isabella (Casual)</option>
                    <option value="Lucas (Especialista)">Lucas (Especialista)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={toggleAudio}
                  title="Ouvir amostra de voz"
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-3.5 h-3.5 text-orange-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UgcAvatarVoicePanel;
