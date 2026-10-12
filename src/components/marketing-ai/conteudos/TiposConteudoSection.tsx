import {
  Clock,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  Mail,
  Megaphone,
  Video,
} from "lucide-react";
import { TIPOS_CONTEUDO, type FormatoConteudo, type TipoConteudoItem } from "./conteudos-data";

interface TiposConteudoSectionProps {
  onSelectFormat: (format: FormatoConteudo) => void;
  onVerTodos?: () => void;
}

const FORMAT_ICONS: Record<string, typeof ImageIcon> = {
  Image: ImageIcon,
  Layers,
  Film,
  Video,
  Clock,
  FileText,
  Mail,
  Megaphone,
};

export function TiposConteudoSection({
  onSelectFormat,
  onVerTodos,
}: TiposConteudoSectionProps) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">
            Tipos de conteúdo
          </h2>
          <p className="text-[11px] text-home-muted mt-0.5">
            Modelos prontos para acelerar sua produção.
          </p>
        </div>
        <button
          type="button"
          onClick={onVerTodos}
          className="text-xs text-home-muted hover:text-white transition-colors cursor-pointer"
        >
          Ver todos os modelos
        </button>
      </div>

      {/* Grid of 8 format items */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {TIPOS_CONTEUDO.map((item: TipoConteudoItem) => {
          const Icon = FORMAT_ICONS[item.iconName] || ImageIcon;

          return (
            <div
              key={item.id}
              onClick={() => onSelectFormat(item.id)}
              className="group flex flex-col gap-2 rounded-xl border border-home-border/60 bg-[#0E131B]/90 p-2 transition-all duration-200 hover:border-home-orange/60 hover:shadow-md cursor-pointer"
            >
              {/* Thumbnail image */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40 border border-white/5">
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Bottom: Icon + Title */}
              <div className="flex items-center gap-1.5 px-0.5 min-w-0">
                <Icon className="size-3 text-home-orange shrink-0" />
                <span className="text-[11px] font-semibold text-white/90 group-hover:text-white truncate">
                  {item.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
