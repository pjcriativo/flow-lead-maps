import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { FEATURED_AVATARS, type FeaturedAvatarItem } from "./influencers-data";

interface AvataresDestaqueSectionProps {
  onSelectAvatar: (avatar: FeaturedAvatarItem) => void;
  onViewAll?: () => void;
}

export const AvataresDestaqueSection: React.FC<AvataresDestaqueSectionProps> = ({
  onSelectAvatar,
  onViewAll,
}) => {
  const [avatars] = useState<FeaturedAvatarItem[]>(FEATURED_AVATARS);
  const [selectedId, setSelectedId] = useState<string>("avatar-isabella");

  const getBadgeStyle = (badgeType: string) => {
    switch (badgeType) {
      case "featured":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "tech":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "lifestyle":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "business":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "beauty":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "corporate":
        return "bg-teal-500/15 text-teal-400 border-teal-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const handleCardClick = (avatar: FeaturedAvatarItem) => {
    setSelectedId(avatar.id);
    onSelectAvatar(avatar);
  };

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Avatares em destaque
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Escolha um avatar da nossa biblioteca ou crie o seu próprio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors mr-2 cursor-pointer"
          >
            Ver todos
          </button>
          <button
            type="button"
            aria-label="Anterior"
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of 6 Avatar Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {avatars.map((av) => {
          const isSelected = selectedId === av.id;

          return (
            <div
              key={av.id}
              onClick={() => handleCardClick(av)}
              className={`group relative rounded-xl overflow-hidden bg-[#0D131F] border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] ring-1 ring-orange-500/50"
                  : "border-slate-800/80 hover:border-slate-700 hover:shadow-lg"
              }`}
            >
              {/* Image Container with Play overlay & 3-dots */}
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-slate-900 mb-2">
                <img
                  src={av.imageUrl}
                  alt={av.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top-right menu button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAvatar(av);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {/* Bottom-right mini play button */}
                <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md pl-0.5 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                  <Play className="w-3 h-3 fill-white text-white" />
                </div>
              </div>

              {/* Avatar Info */}
              <div className="space-y-1.5 px-1 pb-1">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    {av.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-normal">
                    {av.role}
                  </p>
                </div>

                {/* Category Pill */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(
                      av.badgeType
                    )}`}
                  >
                    {av.badgeType === "featured" && (
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    )}
                    {av.categoryBadge}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
