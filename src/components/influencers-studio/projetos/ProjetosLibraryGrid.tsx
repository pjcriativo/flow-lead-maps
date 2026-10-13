import React from "react";
import {
  Play,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { type ProjetoVideoItem } from "./projetos-data";

interface ProjetosLibraryGridProps {
  videos: ProjetoVideoItem[];
  selectedVideoId: string;
  onSelectVideo: (video: ProjetoVideoItem) => void;
  onPlayVideo: (video: ProjetoVideoItem) => void;
  onOpenCardMenu: (video: ProjetoVideoItem, e: React.MouseEvent) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
}

export const ProjetosLibraryGrid: React.FC<ProjetosLibraryGridProps> = ({
  videos,
  selectedVideoId,
  onSelectVideo,
  onPlayVideo,
  onOpenCardMenu,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const getStatusBadge = (status: ProjetoVideoItem["status"]) => {
    switch (status) {
      case "concluido":
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Concluído</span>
          </div>
        );
      case "em_processamento":
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Em processamento</span>
          </div>
        );
      case "falha":
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Falha</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 4 Columns x 3 Rows = 12 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {videos.map((item) => {
          const isSelected = selectedVideoId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectVideo(item)}
              className={`group bg-[#101726]/85 rounded-xl border overflow-hidden flex flex-col transition-all cursor-pointer shadow-md ${
                isSelected
                  ? "border-orange-500 ring-1 ring-orange-500/50 shadow-[0_0_18px_rgba(249,115,22,0.22)]"
                  : "border-slate-800/80 hover:border-slate-700/90 hover:bg-[#121c2e]/90"
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Duration Badge bottom-right */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-slate-200 border border-white/10">
                  {item.duration}
                </div>

                {/* Center Play Button Overlay */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayVideo(item);
                  }}
                  className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-black/50 hover:bg-orange-500/80 text-white hover:text-slate-950 flex items-center justify-center backdrop-blur-xs transition-all opacity-85 group-hover:opacity-100 group-hover:scale-110 border border-white/20 hover:border-orange-400 cursor-pointer shadow-lg"
                  title="Assistir vídeo"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                {/* Status + Options Menu */}
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(item.status)}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCardMenu(item, e);
                    }}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
                    title="Mais opções"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h3
                    className={`text-xs font-bold truncate transition-colors ${
                      isSelected ? "text-orange-400" : "text-white group-hover:text-slate-100"
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-medium text-slate-300">
                    {item.categoryTag}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/40 text-[10px] font-medium text-slate-400">
                    {item.channel}
                  </span>
                </div>

                {/* Creation Date */}
                <div className="text-[10px] text-slate-400 font-medium pt-0.5 border-t border-slate-800/40">
                  {item.createdDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
        {/* Left: Page buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="w-7 h-7 rounded-lg bg-[#101726]/80 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentPage === page
                  ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                  : "bg-[#101726]/80 border border-slate-800/80 text-slate-400 hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}

          <span className="px-1 text-slate-600">...</span>

          <button
            onClick={() => onPageChange(8)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentPage === 8
                ? "bg-orange-500 text-slate-950"
                : "bg-[#101726]/80 border border-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            8
          </button>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="w-7 h-7 rounded-lg bg-[#101726]/80 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Items indicator & Per page selector */}
        <div className="flex items-center gap-3">
          <span>
            Exibindo 1-{videos.length} de {totalItems} projetos
          </span>

          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="appearance-none bg-[#101726]/90 border border-slate-800/80 rounded-lg pl-2.5 pr-6 py-1 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden"
            >
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
              <option value={48}>48 por página</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
