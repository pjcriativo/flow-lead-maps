import { CircleDollarSign, DollarSign, Filter, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineMetricItem } from "./pipeline-premium-data";

const ACCENT_STYLES = {
  orange: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  amber: "bg-amber-600/10 text-amber-500 border-amber-600/20",
};

const ICONS = {
  leads: Filter,
  negociacao: Users,
  propostas: CircleDollarSign,
  vendas: TrendingUp,
  valor: DollarSign,
};

export function PipelineStatsCards({
  metrics,
  className,
}: {
  metrics: PipelineMetricItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {metrics.map((metric) => {
        const IconComponent = ICONS[metric.id];
        return (
          <div
            key={metric.id}
            title={metric.unavailable ? "Indicador indisponível no momento" : undefined}
            className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-home-border",
              "bg-home-surface/80 p-4 transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface",
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl border",
                  ACCENT_STYLES[metric.accent],
                )}
              >
                <IconComponent className="size-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              <div>
                <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {metric.value}
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs text-home-muted">{metric.label}</span>
                </div>
              </div>
              <span className="pb-1 text-[9px] text-home-muted/70">
                {metric.unavailable ? "Indisponível" : "Sem histórico"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
