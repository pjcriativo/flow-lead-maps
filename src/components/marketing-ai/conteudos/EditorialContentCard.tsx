import { MoreHorizontal } from "lucide-react";
import type { ConteudoItem } from "./conteudos-data";
import { PlatformIcon } from "./PlatformIcon";
import { cn } from "@/lib/utils";

interface EditorialContentCardProps {
  item: ConteudoItem;
  onClick: (item: ConteudoItem) => void;
}

export function EditorialContentCard({
  item,
  onClick,
}: EditorialContentCardProps) {
  const statusConfig = {
    publicado: {
      label: "Publicado",
      dot: "bg-emerald-400",
      pill: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    agendado: {
      label: "Agendado",
      dot: "bg-blue-400",
      pill: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    em_revisao: {
      label: "Em revisão",
      dot: "bg-amber-400",
      pill: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    em_producao: {
      label: "Em produção",
      dot: "bg-cyan-400",
      pill: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    },
    rascunho: {
      label: "Rascunho",
      dot: "bg-gray-400",
      pill: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
    },
    falha: {
      label: "Falha",
      dot: "bg-red-400",
      pill: "bg-red-500/10 text-red-400 border border-red-500/20",
    },
    cancelado: {
      label: "Cancelado",
      dot: "bg-zinc-500",
      pill: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    },
  }[item.status] || {
    label: item.status,
    dot: "bg-gray-400",
    pill: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  };

  return (
    <div
      onClick={() => onClick(item)}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-xl p-2 bg-[#0E131B]/95 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md",
        item.highlight
          ? "border border-home-orange/60 shadow-[0_0_12px_rgba(255,98,0,0.18)]"
          : "border border-home-border/60 hover:border-home-border/90",
      )}
    >
      {/* Top row: Time, Platform Icon, More Options */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-white/90 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
            {item.time}
          </span>
          <PlatformIcon platform={item.platform} size="sm" />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick(item);
          }}
          className="text-home-muted hover:text-white p-0.5 rounded transition-colors"
          title="Opções"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      {/* Thumbnail image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40 border border-white/5">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Title & Subtitle */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-white group-hover:text-home-orange transition-colors truncate">
          {item.formatLabel || item.title}
        </span>
        {item.subtitle && (
          <span className="text-[11px] text-home-muted truncate">
            {item.subtitle}
          </span>
        )}
      </div>

      {/* Bottom Status Badge */}
      <div className="mt-0.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium leading-none",
            statusConfig.pill,
          )}
        >
          <span className={cn("size-1.5 rounded-full shrink-0", statusConfig.dot)} />
          {statusConfig.label}
        </span>
      </div>
    </div>
  );
}
