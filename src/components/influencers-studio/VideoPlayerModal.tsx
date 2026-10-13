import React, { useState } from "react";
import { X, Play, Pause, Download, Share2, Eye, TrendingUp, CheckCircle2 } from "lucide-react";
import type { RecentVideoItem } from "./influencers-data";

interface VideoPlayerModalProps {
  video: RecentVideoItem | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-1 rounded-lg bg-black/50 backdrop-blur-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Display */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover opacity-80"
          />

          {/* Central Play/Pause button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.8)] hover:scale-105 transition-all pl-1"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-white" />
              ) : (
                <Play className="w-7 h-7 fill-white" />
              )}
            </button>
          </div>

          {/* Player bottom bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-300">
                00:14 / {video.duration}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Renderizado em 4K
              </span>
            </div>
          </div>
        </div>

        {/* Video Info & Analytics */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">{video.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Avatar: {video.avatarName || "Isabella"} • Gerado em {video.date}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar MP4
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini Performance Cards */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Visualizações</span>
              <span className="text-sm font-bold text-white">18.4K</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Engajamento</span>
              <span className="text-sm font-bold text-orange-400">8.2%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Conversões</span>
              <span className="text-sm font-bold text-emerald-400">142</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
