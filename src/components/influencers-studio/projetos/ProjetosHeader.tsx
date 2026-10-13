import React from "react";
import { FolderGit2, Star, Plus } from "lucide-react";

interface ProjetosHeaderProps {
  onNovoProjeto?: () => void;
  onNavigateToVisaoGeral?: () => void;
}

export const ProjetosHeader: React.FC<ProjetosHeaderProps> = ({
  onNovoProjeto,
  onNavigateToVisaoGeral,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-1">
      {/* Left: Breadcrumb, Title & Subtitle */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
          <span
            onClick={onNavigateToVisaoGeral}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            AI Influencers Studio
          </span>
          <span className="text-slate-600">&gt;</span>
          <span className="text-orange-400 font-semibold">Projetos e Biblioteca</span>
        </div>

        {/* Title row with orange folder icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Projetos e Biblioteca
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Gerencie todos os seus projetos, acompanhe as gerações e organize sua biblioteca de vídeos, imagens e roteiros.
        </p>
      </div>

      {/* Right: Premium Banner with "+ Novo projeto" Button */}
      <div className="w-full lg:w-auto bg-[#0E1626]/90 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              Seus vídeos organizados e prontos para usar
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Edite, baixe, compartilhe e publique nos seus canais.
            </p>
          </div>
        </div>

        <button
          onClick={onNovoProjeto}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-orange-500/20 active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Novo projeto</span>
        </button>
      </div>
    </div>
  );
};
