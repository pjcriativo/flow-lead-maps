import React from "react";
import {
  Play,
  MoreHorizontal,
  Globe,
  Sliders,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import type { InfluencerCatalogItem } from "./biblioteca-data";

interface InfluencerCardProps {
  influencer: InfluencerCatalogItem;
  isSelected?: boolean;
  onSelect: (influencer: InfluencerCatalogItem) => void;
  onUse: (influencer: InfluencerCatalogItem) => void;
  onPlayPreview?: (influencer: InfluencerCatalogItem) => void;
}

export const InfluencerCard: React.FC<InfluencerCardProps> = ({
  influencer,
  isSelected = false,
  onSelect,
  onUse,
  onPlayPreview,
}) => {
  const getBadgeIcon = (variant: string) => {
    switch (variant) {
      case "pink":
        return <Crown className="w-2.5 h-2.5 fill-pink-300 text-pink-300" />;
      case "emerald":
        return <Sparkles className="w-2.5 h-2.5 fill-emerald-300 text-emerald-300" />;
      case "purple":
        return <Zap className="w-2.5 h-2.5 fill-purple-300 text-purple-300" />;
      default:
        return null;
    }
  };

  const getBadgeClass = (variant: string) => {
    switch (variant) {
      case "pink":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "emerald":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "purple":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div
      onClick={() => onSelect(influencer)}
      className={`group rounded-2xl overflow-hidden bg-[#0D131F] border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl ${
        isSelected
          ? "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] ring-1 ring-orange-500/50"
          : "border-slate-800/80 hover:border-slate-700"
      }`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-900 mb-2.5">
        <img
          src={influencer.imageUrl}
          alt={influencer.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-Left Badge (if present) */}
        {influencer.badge && (
          <div className="absolute top-2 left-2 z-10">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border ${getBadgeClass(
                influencer.badge.variant
              )}`}
            >
              {getBadgeIcon(influencer.badge.variant)}
              {influencer.badge.text}
            </span>
          </div>
        )}

        {/* Top-Right Menu Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(influencer);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm text-slate-300 hover:text-white flex items-center justify-center transition-colors z-10"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Center Play Button Overlay */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPlayPreview?.(influencer);
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center shadow-lg group-hover:bg-orange-500 group-hover:border-orange-400 group-hover:scale-110 transition-all pl-0.5">
            <Play className="w-4 h-4 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* Influencer Meta & Information */}
      <div className="space-y-2 px-1 pb-1">
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
            {influencer.name}
          </h4>
          <p className="text-xs text-slate-400 font-medium truncate">
            {influencer.role}
          </p>
        </div>

        {/* Meta Chips Row 1: Language & Age */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
            <Globe className="w-2.5 h-2.5 text-slate-400" />
            {influencer.language}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300">
            {influencer.ageRange}
          </span>
        </div>

        {/* Meta Chips Row 2: Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {influencer.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900/60 border border-slate-800/80 text-slate-400"
            >
              • {tag}
            </span>
          ))}
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-1.5 pt-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUse(influencer);
            }}
            className="flex-1 py-2 px-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all active:scale-95 text-center cursor-pointer truncate"
          >
            Usar este influencer
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(influencer);
            }}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Ver detalhes"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
