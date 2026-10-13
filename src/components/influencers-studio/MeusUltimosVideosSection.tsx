import React, { useState } from "react";
import { ChevronRight, MoreHorizontal, Play } from "lucide-react";
import { RECENT_VIDEOS, type RecentVideoItem } from "./influencers-data";

interface MeusUltimosVideosSectionProps {
  onPlayVideo: (video: RecentVideoItem) => void;
  onViewAll?: () => void;
}

export const MeusUltimosVideosSection: React.FC<MeusUltimosVideosSectionProps> = ({
  onPlayVideo,
  onViewAll,
}) => {
  const [videos] = useState<RecentVideoItem[]>(RECENT_VIDEOS);

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Meus últimos vídeos
          </h3>
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
            aria-label="Avançar"
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of 6 Recent Video Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {videos.map((vid) => (
          <div
            key={vid.id}
            onClick={() => onPlayVideo(vid)}
            className="group rounded-xl overflow-hidden bg-[#0D131F] border border-slate-800/80 hover:border-slate-700 p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
          >
            {/* Thumbnail with duration badge and play icon on hover */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 mb-2">
              <img
                src={vid.thumbnailUrl}
                alt={vid.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Hover overlay with play button */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg pl-0.5">
                  <Play className="w-4 h-4 fill-white text-white" />
                </div>
              </div>

              {/* Duration badge bottom right */}
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/75 text-white backdrop-blur-xs">
                {vid.duration}
              </div>

              {/* Top-right menu */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayVideo(vid);
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/50 backdrop-blur-sm text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Video Info */}
            <div className="space-y-1 px-1 pb-1">
              <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                {vid.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-normal">
                {vid.date}
              </p>

              {/* Status Pill */}
              <div className="pt-1">
                {vid.status === "concluido" ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Concluído
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Em processamento
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
