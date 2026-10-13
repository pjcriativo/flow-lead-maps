import {
  DIAS_SEMANA,
  TIMELINE_SLOTS,
  type PublicacaoItem,
} from "./calendario-data";
import { PublicacaoCard } from "./PublicacaoCard";
import { cn } from "@/lib/utils";

interface TimelineCalendarGridProps {
  publicacoes: PublicacaoItem[];
  onSelectPublicacao: (item: PublicacaoItem) => void;
}

export function TimelineCalendarGrid({
  publicacoes,
  onSelectPublicacao,
}: TimelineCalendarGridProps) {
  return (
    <div className="rounded-xl border border-home-border/60 bg-[#0A0D13]/70 p-3 overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Column Headers */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-2 pb-3 border-b border-home-border/50">
          {/* Empty header for time axis */}
          <div className="text-[10px] text-home-muted/50 font-mono flex items-center justify-center">
            GMT-3
          </div>

          {/* 7 Days */}
          {DIAS_SEMANA.map((day) => (
            <div
              key={day.dateStr}
              className="flex flex-col items-center justify-center py-1"
            >
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
          ))}
        </div>

        {/* Calendar Body with Time Axis on Left */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-2 pt-2">
          {/* Time axis column */}
          <div className="flex flex-col justify-between py-4 text-right pr-2 select-none">
            {TIMELINE_SLOTS.map((slot) => (
              <div
                key={slot}
                className="text-[11px] font-mono text-home-muted/70 h-[92px] flex items-start justify-end"
              >
                {slot}
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {DIAS_SEMANA.map((day, dayIndex) => {
            const dayPubs = publicacoes.filter((p) => p.dayIndex === dayIndex);

            return (
              <div
                key={day.dateStr}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-1 transition-colors min-h-[640px]",
                  day.isSelected
                    ? "bg-home-orange/[0.02] border border-home-orange/20"
                    : "bg-transparent",
                )}
              >
                {dayPubs.length > 0 ? (
                  dayPubs.map((item) => (
                    <PublicacaoCard
                      key={item.id}
                      item={item}
                      onClick={onSelectPublicacao}
                    />
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-home-border/30 p-4 text-center text-[10px] text-home-muted/50">
                    Sem agendamentos
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
