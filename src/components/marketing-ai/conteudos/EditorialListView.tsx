import { Eye, MoreHorizontal } from "lucide-react";
import type { ConteudoItem } from "./conteudos-data";
import { PlatformIcon } from "./PlatformIcon";
import { cn } from "@/lib/utils";

interface EditorialListViewProps {
  contents: ConteudoItem[];
  onSelectContent: (item: ConteudoItem) => void;
}

export function EditorialListView({
  contents,
  onSelectContent,
}: EditorialListViewProps) {
  return (
    <div className="rounded-xl border border-home-border/60 bg-[#0E131B]/90 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#141A23]/80 border-b border-home-border/60 text-home-muted uppercase text-[10px] font-semibold tracking-wider">
            <tr>
              <th className="py-3 px-4">Conteúdo</th>
              <th className="py-3 px-4">Canal</th>
              <th className="py-3 px-4">Formato</th>
              <th className="py-3 px-4">Data & Horário</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/40 text-home-muted">
            {contents.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectContent(item)}
                className="hover:bg-home-surface-strong/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="size-10 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-white group-hover:text-home-orange transition-colors truncate">
                        {item.formatLabel || item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-home-muted truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <PlatformIcon platform={item.platform} size="sm" />
                    <span className="capitalize text-white/90">
                      {item.platform}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-white/80">
                  {item.formatLabel}
                </td>
                <td className="py-3 px-4 font-mono text-[11px]">
                  {item.time} ({item.dateIso.slice(8, 10)}/08)
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                      item.status === "publicado" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                      item.status === "agendado" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                      item.status === "em_revisao" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                      item.status === "em_producao" && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                    )}
                  >
                    ● {item.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectContent(item);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-home-muted hover:text-white transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-home-muted hover:text-white transition-colors"
                      title="Mais opções"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
