import { Eye, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailTemplateItem } from "@/types/templates";
import { TemplateMiniature } from "./TemplateMiniature";

interface TemplateCardProps {
  template: EmailTemplateItem;
  isFavorito: boolean;
  onToggleFavorito: (id: string) => void;
  onPreview: (template: EmailTemplateItem) => void;
  onUseTemplate: (template: EmailTemplateItem) => void;
}

export function TemplateCard({
  template,
  isFavorito,
  onToggleFavorito,
  onPreview,
  onUseTemplate,
}: TemplateCardProps) {
  const getBadgeStyle = (variant: EmailTemplateItem["badgeVariant"]) => {
    switch (variant) {
      case "blue":
        return "bg-blue-950/70 text-blue-400 border-blue-800/50";
      case "amber":
        return "bg-amber-950/70 text-amber-400 border-amber-800/50";
      case "purple":
        return "bg-purple-950/70 text-purple-400 border-purple-800/50";
      case "teal":
        return "bg-teal-950/70 text-teal-400 border-teal-800/50";
      case "emerald":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/50";
      case "rose":
        return "bg-rose-950/70 text-rose-400 border-rose-800/50";
      case "zinc":
      default:
        return "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
    }
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#12141a] p-3 transition-all duration-200 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40">
      {/* Miniatura do E-mail */}
      <div
        className="relative mb-3 cursor-pointer overflow-hidden rounded-xl"
        onClick={() => onPreview(template)}
      >
        <TemplateMiniature templateId={template.id} />
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </div>

      {/* Conteúdo textual */}
      <div className="flex flex-1 flex-col">
        {/* Linha de título, badge e favorito */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[13.5px] font-bold text-white transition-colors group-hover:text-zinc-100">
              {template.nome}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                getBadgeStyle(template.badgeVariant),
              )}
            >
              {template.categoriaLabel}
            </span>
          </div>

          <button
            type="button"
            aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorito(template.id);
            }}
            className={cn(
              "shrink-0 p-1 text-zinc-500 transition-colors hover:text-amber-400",
              isFavorito && "text-amber-400",
            )}
          >
            <Star
              className={cn(
                "size-4",
                isFavorito ? "fill-amber-400 text-amber-400" : "text-zinc-500",
              )}
            />
          </button>
        </div>

        {/* Descrição curta */}
        <p className="mt-1.5 h-9 line-clamp-2 text-xs leading-relaxed text-zinc-400">
          {template.descricao}
        </p>

        {/* Botões de Ação */}
        <div className="mt-3.5 flex items-center gap-2 pt-1 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/50 py-2 px-3 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:text-white"
          >
            <Eye className="size-3.5" />
            <span>Prévia</span>
          </button>

          <button
            type="button"
            onClick={() => onUseTemplate(template)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#ff6200] py-2 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#e65800] active:scale-[0.98]"
          >
            <span>Usar template</span>
          </button>
        </div>
      </div>
    </div>
  );
}
