import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodayKpiCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  subtext?: string;
  trendText?: string;
  iconBgClass: string;
  iconColorClass: string;
  barColorClass: string;
  onClick?: () => void;
}

export function TodayKpiCard({
  icon: Icon,
  title,
  value,
  subtext,
  trendText,
  iconBgClass,
  iconColorClass,
  barColorClass,
  onClick,
}: TodayKpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        onClick && "cursor-pointer",
      )}
    >
      <div>
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              iconBgClass,
            )}
          >
            <Icon className={cn("size-5", iconColorClass)} />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-600">{title}</span>
            <ChevronRight className="size-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
        </div>
      </div>

      <div className="mt-4">
        {trendText ? (
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            {trendText}
          </p>
        ) : subtext ? (
          <p className="text-xs text-slate-400">{subtext}</p>
        ) : null}

        {/* Barra de destaque inferior */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={cn("h-full rounded-full transition-all duration-500", barColorClass)} />
        </div>
      </div>
    </button>
  );
}
