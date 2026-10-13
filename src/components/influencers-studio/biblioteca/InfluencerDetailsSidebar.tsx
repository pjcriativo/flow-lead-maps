import React, { useState } from "react";
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Globe,
  User,
  Calendar,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import type { InfluencerCatalogItem } from "./biblioteca-data";

interface InfluencerDetailsSidebarProps {
  influencer: InfluencerCatalogItem;
  onUseInfluencer: (influencer: InfluencerCatalogItem) => void;
  onVerPerfilCompleto: (influencer: InfluencerCatalogItem) => void;
  onPlaySampleVideo?: (title: string) => void;
}

export const InfluencerDetailsSidebar: React.FC<InfluencerDetailsSidebarProps> = ({
  influencer,
  onUseInfluencer,
  onVerPerfilCompleto,
  onPlaySampleVideo,
}) => {
  const [activeTab, setActiveTab] = useState<"estilo" | "uso" | "caracteristicas">("estilo");

  const sampleVideos = influencer.sampleVideos || [
    {
      title: "Review de Produto",
      duration: "00:32",
      thumbnailUrl: influencer.imageUrl,
    },
    {
      title: "Rotina de Beleza",
      duration: "00:28",
      thumbnailUrl: influencer.imageUrl,
    },
    {
      title: "Dicas de Skincare",
      duration: "00:45",
      thumbnailUrl: influencer.imageUrl,
    },
  ];

  return (
    <div className="bg-[#101726]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        {/* Large Portrait Image with Carousel Controls */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-lg">
          <img
            src={influencer.imageUrl}
            alt={influencer.name}
            className="w-full h-full object-cover object-[center_20%]"
          />

          {/* Top-Left Badge */}
          {influencer.badge && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
                <Crown className="w-2.5 h-2.5 fill-rose-300" />
                {influencer.badge.text}
              </span>
            </div>
          )}

          {/* Carousel Left & Right Arrow Buttons */}
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Center Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center shadow-lg pl-0.5">
              <Play className="w-5 h-5 fill-white" />
            </div>
          </div>
        </div>

        {/* Title, Status & Role */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">{influencer.name}</h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Disponível
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium">{influencer.role}</p>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {influencer.bio ||
              "Influencer virtual especialista em beleza, lifestyle e produtos do dia a dia. Ideal para UGC, reviews e demonstrações de produtos."}
          </p>
        </div>

        {/* Meta Chips: Language, Age, Gender */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium">
            <Globe className="w-3 h-3 text-slate-400" />
            {influencer.language}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            {influencer.ageRange} anos
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium">
            <User className="w-3 h-3 text-slate-400" />
            {influencer.gender || "Feminino"}
          </span>
        </div>

        {/* 3 Sub-tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("estilo")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
              activeTab === "estilo"
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Estilo de conteúdo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("uso")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
              activeTab === "uso"
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tipo de uso
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("caracteristicas")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer ${
              activeTab === "caracteristicas"
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Características
          </button>
        </div>

        {/* Section: Exemplos de vídeos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white tracking-wide">
              Exemplos de vídeos
            </h4>
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {sampleVideos.map((sample, idx) => (
              <div
                key={idx}
                onClick={() => onPlaySampleVideo?.(sample.title)}
                className="group cursor-pointer rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all p-1"
              >
                <div className="aspect-[4/5] rounded overflow-hidden relative mb-1 bg-slate-800">
                  <img
                    src={sample.thumbnailUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform"
                  />
                  {/* Duration badge */}
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-white">
                    {sample.duration}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-300 group-hover:text-orange-400 transition-colors line-clamp-1 text-center">
                  {sample.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => onUseInfluencer(influencer)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md transition-all active:scale-95 text-center cursor-pointer"
        >
          Usar este influencer
        </button>

        <button
          type="button"
          onClick={() => onVerPerfilCompleto(influencer)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors text-center cursor-pointer"
        >
          Ver perfil completo
        </button>
      </div>
    </div>
  );
};
