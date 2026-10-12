import {
  DollarSign,
  FileText,
  Globe,
  Megaphone,
  Monitor,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOP_METRICS, type MetricCardItem } from "./campanhas-premium-data";

const ACCENT_STYLES = {
  orange: {
    iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    barColor: "bg-amber-500",
    barGlow: "shadow-[0_0_10px_rgba(245,158,11,0.5)]",
  },
  purple: {
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    barColor: "bg-purple-500",
    barGlow: "shadow-[0_0_10px_rgba(168,85,247,0.5)]",
  },
  green: {
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barColor: "bg-emerald-500",
    barGlow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  },
  blue: {
    iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    barColor: "bg-blue-500",
    barGlow: "shadow-[0_0_10px_rgba(59,130,246,0.5)]",
  },
  amber: {
    iconBg: "bg-amber-600/10 text-amber-400 border-amber-600/20",
    barColor: "bg-amber-500",
    barGlow: "shadow-[0_0_10px_rgba(245,158,11,0.5)]",
  },
};

const ICONS = {
  ativas: Megaphone,
  leads: Users,
  sites: Monitor,
  propostas: FileText,
  receita: DollarSign,
};

interface CampanhasStatsCardsProps {
  metrics?: MetricCardItem[];
  className?: string;
}

export function CampanhasStatsCards({
  metrics = TOP_METRICS,
  className,
}: CampanhasStatsCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {metrics.map((metric) => {
        const IconComponent =
          ICONS[metric.id as keyof typeof ICONS] || Megaphone;
        const style = ACCENT_STYLES[metric.accent];

        return (
          <div
            key={metric.id}
            className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-home-border",
              "bg-home-surface/80 p-4 transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface",
              "shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
            )}
          >
            {/* Top row: Icon */}
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex size-9.5 items-center justify-center rounded-xl border",
                  style.iconBg,
                )}
              >
                <IconComponent className="size-4.5" />
              </div>
            </div>

            {/* Bottom info + mini vertical bar chart */}
            <div className="mt-4 flex items-end justify-between gap-2">
              <div>
                <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {metric.value}
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-xs text-home-muted">{metric.label}</span>
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400">
                    ↑ {metric.change}
                  </span>
                </div>
              </div>

              {/* Mini vertical bar chart */}
              <div
                aria-hidden="true"
                className="flex items-end gap-1 pb-1"
              >
                {metric.bars.map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${Math.max(6, Math.round(height * 0.22))}px` }}
                    className={cn(
                      "w-1 rounded-t-sm transition-all duration-300",
                      style.barColor,
                      i === metric.bars.length - 1 && style.barGlow,
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
