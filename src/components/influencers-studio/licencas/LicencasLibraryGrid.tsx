import React from "react";
import {
  Star,
  Crown,
  MoreVertical,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { type InfluencerLicenciadoItem } from "./licencas-data";

interface LicencasLibraryGridProps {
  influencers: InfluencerLicenciadoItem[];
  selectedInfluencerId: string;
  onSelectInfluencer: (influencer: InfluencerLicenciadoItem) => void;
  onGerenciar: (influencer: InfluencerLicenciadoItem) => void;
  onOpenCardMenu: (influencer: InfluencerLicenciadoItem, e: React.MouseEvent) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
}

export const LicencasLibraryGrid: React.FC<LicencasLibraryGridProps> = ({
  influencers,
  selectedInfluencerId,
  onSelectInfluencer,
  onGerenciar,
  onOpenCardMenu,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const getBadgeType = (type: InfluencerLicenciadoItem["type"]) => {
    if (type === "meu_avatar") {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/25 border border-sky-400/50 text-sky-300 text-[10px] font-semibold backdrop-blur-xs shadow-md">
          <Star className="w-3 h-3 fill-sky-300 text-sky-300" />
          <span>Meu avatar</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/50 text-purple-300 text-[10px] font-semibold backdrop-blur-xs shadow-md">
        <Crown className="w-3 h-3 fill-purple-300 text-purple-300" />
        <span>Licenciado</span>
      </div>
    );
  };

  const getStatusBadge = (item: InfluencerLicenciadoItem) => {
    if (item.licenseStatusDays) {
      return (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>{item.licenseStatusDays}</span>
        </div>
      );
    }
    if (item.licenseStatus === "ativa") {
      return (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{item.licenseStatusLabel}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <span>{item.licenseStatusLabel}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 4 Columns x 2 Rows = 8 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {influencers.map((item) => {
          const isSelected = selectedInfluencerId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectInfluencer(item)}
              className={`group bg-[#101726]/85 rounded-xl border overflow-hidden flex flex-col justify-between transition-all cursor-pointer shadow-md ${
                isSelected
                  ? "border-orange-500 ring-1 ring-orange-500/50 shadow-[0_0_18px_rgba(249,115,22,0.22)]"
                  : "border-slate-800/80 hover:border-slate-700/90 hover:bg-[#121c2e]/90"
              }`}
            >
              {/* Photo Area */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Badge top-left */}
                <div className="absolute top-2.5 left-2.5">
                  {getBadgeType(item.type)}
                </div>

                {/* More options menu top-right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCardMenu(item, e);
                  }}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                  title="Mais opções"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-3 flex flex-col justify-between flex-1 gap-2.5">
                <div>
                  {/* Name */}
                  <h3
                    className={`text-sm font-bold truncate transition-colors ${
                      isSelected ? "text-orange-400" : "text-white group-hover:text-slate-100"
                    }`}
                  >
                    {item.name}
                  </h3>

                  {/* Niche */}
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.niche}
                  </p>

                  {/* Language and Age */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.language}</span>
                    </span>
                    <span>{item.ageRange}</span>
                  </div>
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-medium text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Status da licença */}
                <div className="pt-1">{getStatusBadge(item)}</div>

                {/* Button Gerenciar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGerenciar(item);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-orange-500/20 active:scale-98 cursor-pointer mt-0.5"
                >
                  Gerenciar
                </button>
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
            Exibindo 1-{influencers.length} de {totalItems} influencers
          </span>

          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="appearance-none bg-[#101726]/90 border border-slate-800/80 rounded-lg pl-2.5 pr-6 py-1 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden"
            >
              <option value={8}>8 por página</option>
              <option value={16}>16 por página</option>
              <option value={32}>32 por página</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
