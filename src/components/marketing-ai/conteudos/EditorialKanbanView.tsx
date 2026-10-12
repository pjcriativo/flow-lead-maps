import type { ConteudoItem, StatusConteudo } from "./conteudos-data";
import { EditorialContentCard } from "./EditorialContentCard";

interface EditorialKanbanViewProps {
  contents: ConteudoItem[];
  onSelectContent: (item: ConteudoItem) => void;
}

const KANBAN_COLUMNS: { id: StatusConteudo; label: string; countColor: string }[] = [
  { id: "em_producao", label: "Em produção", countColor: "bg-cyan-500/20 text-cyan-400" },
  { id: "em_revisao", label: "Em revisão", countColor: "bg-amber-500/20 text-amber-400" },
  { id: "agendado", label: "Agendado", countColor: "bg-blue-500/20 text-blue-400" },
  { id: "publicado", label: "Publicado", countColor: "bg-emerald-500/20 text-emerald-400" },
];

export function EditorialKanbanView({
  contents,
  onSelectContent,
}: EditorialKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {KANBAN_COLUMNS.map((col) => {
        const colContents = contents.filter((c) => c.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col gap-2 rounded-xl border border-home-border/60 bg-[#0E131B]/80 p-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-home-border/40">
              <span className="text-xs font-bold text-white">
                {col.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.countColor}`}>
                {colContents.length}
              </span>
            </div>

            {/* Content Cards */}
            <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
              {colContents.map((item) => (
                <EditorialContentCard
                  key={item.id}
                  item={item}
                  onClick={onSelectContent}
                />
              ))}
              {colContents.length === 0 && (
                <div className="py-8 text-center text-[11px] text-home-muted/60 border border-dashed border-home-border/40 rounded-lg">
                  Nenhum item nesta coluna
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
