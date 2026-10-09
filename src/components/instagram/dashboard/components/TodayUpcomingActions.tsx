import { useMemo } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTaskTime, getTaskPriority } from "./TodayTaskRow";
import type { FlowBusinessCard, FlowBusinessTask } from "@/services/flow-business";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

interface TodayUpcomingActionsProps {
  tasks: FlowBusinessTask[];
  cards: FlowBusinessCard[];
  onNavigate: (view: InstagramView) => void;
}

export function TodayUpcomingActions({
  tasks,
  cards,
  onNavigate,
}: TodayUpcomingActionsProps) {
  const cardMap = useMemo(() => {
    const map = new Map<string, FlowBusinessCard>();
    for (const card of cards) {
      map.set(card.id, card);
    }
    return map;
  }, [cards]);

  const upcomingList = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 6);
  }, [tasks]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
            <CalendarDays className="size-4 sm:size-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Próximas ações
            </h3>
            <p className="text-[11px] text-slate-400">Sua agenda de hoje no Instagram.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("cadences")}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#2563EB] transition-colors"
        >
          <span>Ver agenda completa</span>
          <ArrowRight className="size-3 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2563EB]" />
        </button>
      </div>

      {/* Timeline Vertical */}
      {upcomingList.length > 0 ? (
        <div className="mt-5 space-y-4">
          {upcomingList.map((task, idx) => {
            const card = cardMap.get(task.cardId);
            const priority = getTaskPriority(task, card);
            const timeFormatted = formatTaskTime(task.dueAt);
            const cleanUsername = task.username?.replace(/^@/, "") || "";

            return (
              <div key={task.id} className="relative flex items-start gap-3">
                {/* Horário */}
                <span className="w-11 shrink-0 pt-0.5 text-right text-xs font-medium text-slate-400 tabular-nums">
                  {timeFormatted}
                </span>

                {/* Linha vertical + Ponto colorido */}
                <div className="relative flex flex-col items-center self-stretch">
                  <span
                    className={`size-2.5 rounded-full z-10 mt-1.5 ${
                      priority === "Alta"
                        ? "bg-rose-500 ring-4 ring-rose-100"
                        : priority === "Média"
                          ? "bg-amber-500 ring-4 ring-amber-100"
                          : "bg-emerald-500 ring-4 ring-emerald-100"
                    }`}
                  />
                  {idx !== upcomingList.length - 1 && (
                    <div className="w-[1.5px] flex-1 bg-slate-100 mt-1" />
                  )}
                </div>

                {/* Conteúdo da Ação */}
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-xs text-slate-800 leading-snug truncate">
                      {task.title}
                    </p>

                    {priority === "Alta" && (
                      <Badge
                        variant="outline"
                        className="border-rose-200 bg-rose-50 px-2 py-0 text-[10px] font-semibold text-rose-600 shrink-0"
                      >
                        Alta
                      </Badge>
                    )}
                    {priority === "Média" && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 px-2 py-0 text-[10px] font-semibold text-amber-600 shrink-0"
                      >
                        Média
                      </Badge>
                    )}
                    {priority === "Baixa" && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] font-semibold text-emerald-600 shrink-0"
                      >
                        Baixa
                      </Badge>
                    )}
                  </div>

                  <p className="truncate text-[11px] text-slate-400 mt-0.5">
                    {task.businessName}
                    {cleanUsername ? ` • @${cleanUsername}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          Nenhuma tarefa agendada para as próximas horas.
        </div>
      )}
    </div>
  );
}
