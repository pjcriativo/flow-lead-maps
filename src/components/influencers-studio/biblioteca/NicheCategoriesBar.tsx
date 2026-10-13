import React from "react";
import { Users2 } from "lucide-react";
import { NICHE_CATEGORIES, type NicheCategoryItem } from "./biblioteca-data";

interface NicheCategoriesBarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const NicheCategoriesBar: React.FC<NicheCategoriesBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
      {NICHE_CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex flex-col items-center justify-center min-w-[105px] sm:min-w-[110px] p-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-center shrink-0 ${
              isSelected
                ? "border-orange-500 bg-[#16121D] shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/50"
                : "border-slate-800/80 bg-[#0E1524]/80 hover:border-slate-700 hover:bg-slate-800/50"
            }`}
          >
            {/* Visual Icon / Thumbnail */}
            {cat.isAll ? (
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-1.5 shadow-inner">
                <Users2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700/60 mb-1.5 shrink-0 bg-slate-900">
                <img
                  src={cat.imageUrl}
                  alt={cat.label}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}

            {/* Label */}
            <span
              className={`text-xs font-bold leading-tight truncate w-full ${
                isSelected ? "text-white" : "text-slate-300"
              }`}
            >
              {cat.label}
            </span>

            {/* Count */}
            <span className="text-[10px] text-slate-400 mt-0.5 font-medium truncate w-full">
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
