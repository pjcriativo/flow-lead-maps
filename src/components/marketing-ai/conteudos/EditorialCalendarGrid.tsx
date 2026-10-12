import {
  CALENDAR_DAYS,
  type ConteudoItem,
} from "./conteudos-data";
import { EditorialContentCard } from "./EditorialContentCard";
import { cn } from "@/lib/utils";

interface EditorialCalendarGridProps {
  contents: ConteudoItem[];
  onSelectContent: (item: ConteudoItem) => void;
}

export function EditorialCalendarGrid({
  contents,
  onSelectContent,
}: EditorialCalendarGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {CALENDAR_DAYS.map((day, dayIndex) => {
        const dayContents = contents.filter((c) => c.dayIndex === dayIndex);

        return (
          <div
            key={day.dateStr}
            className={cn(
              "flex flex-col gap-2 rounded-xl p-1.5 transition-colors",
              day.isSelected
                ? "bg-home-orange/[0.03] border border-home-orange/20"
                : "bg-transparent",
            )}
          >
            {/* Column Header (Day of week & number) */}
            <div className="flex flex-col items-center justify-center py-1.5">
              <span
                className={cn(
                  "text-[11px] font-medium tracking-wide",
                  day.isSelected ? "text-home-orange font-bold" : "text-home-muted",
                )}
              >
                {day.dayOfWeek}
              </span>
              <div className="mt-0.5">
                {day.isSelected ? (
                  <div className="size-6 rounded-full bg-home-orange text-white flex items-center justify-center text-xs font-bold shadow-[0_0_12px_rgba(255,98,0,0.5)]">
                    {day.dayNumber}
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {day.dayNumber}
                  </span>
                )}
              </div>
            </div>

            {/* List of Content Cards for this day */}
            <div className="flex flex-col gap-2.5">
              {dayContents.length > 0 ? (
                dayContents.map((item) => (
                  <EditorialContentCard
                    key={item.id}
                    item={item}
                    onClick={onSelectContent}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-home-border/40 p-4 text-center text-[11px] text-home-muted/60">
                  Nenhum conteúdo
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
