import { MoreHorizontal } from "lucide-react";
import { FILA_PUBLICACOES, type FilaPublicacaoItem } from "./calendario-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface FilaPublicacaoSectionProps {
  onSelectItem?: (item: FilaPublicacaoItem) => void;
  onVerTodos?: () => void;
}

export function FilaPublicacaoSection({
  onSelectItem,
  onVerTodos,
}: FilaPublicacaoSectionProps) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-bold text-white">
            Fila de publicação
          </h2>
          <span className="text-xs text-home-muted font-normal">
            (Próximos 5 conteúdos)
          </span>
        </div>
        <button
          type="button"
          onClick={onVerTodos}
          className="text-xs text-home-muted hover:text-white transition-colors cursor-pointer"
        >
          Ver todos
        </button>
      </div>

      {/* Grid of 5 compact items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {FILA_PUBLICACOES.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem?.(item)}
            className="group flex items-center gap-3 rounded-xl border border-home-border/60 bg-[#0E131B]/90 p-2.5 transition-all duration-200 hover:border-home-orange/60 hover:shadow-md cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="size-11 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-black/40">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-home-muted block">
                {item.horario}
              </span>
              <div className="text-xs font-bold text-white group-hover:text-home-orange transition-colors truncate">
                {item.title}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <PlatformIcon platform={item.platform} size="sm" />
                <span className="text-[10px] text-home-muted truncate">
                  {item.platformLabel}
                </span>
              </div>
            </div>

            {/* Menu */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem?.(item);
              }}
              className="text-home-muted hover:text-white p-1 rounded transition-colors"
              title="Opções"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
