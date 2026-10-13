import {
  ArrowUp,
  Building2,
  DollarSign,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { RESULTS_KPIS, type ResultsKpiItem } from "./resultados-data";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
  investimento_total: DollarSign,
  receita_atribuida: Building2,
  roi_geral: TrendingUp,
  leads_gerados: Users,
  custo_por_lead: Target,
  vendas_realizadas: ShoppingCart,
};

const KPI_ICON_COLORS = {
  orange: "bg-orange-500/10 border-orange-500/25 text-orange-400",
  purple: "bg-purple-500/10 border-purple-500/25 text-purple-400",
  emerald: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
  teal: "bg-teal-500/10 border-teal-500/25 text-teal-400",
  blue: "bg-blue-500/10 border-blue-500/25 text-blue-400",
  rose: "bg-rose-500/10 border-rose-500/25 text-rose-400",
  amber: "bg-amber-500/10 border-amber-500/25 text-amber-400",
};

const KPI_BAR_COLORS = {
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function MarketingResultsKpis() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {RESULTS_KPIS.map((item: ResultsKpiItem) => {
        const Icon = KPI_ICONS[item.id as keyof typeof KPI_ICONS] || DollarSign;
        const iconColor = KPI_ICON_COLORS[item.color];
        const barColor = KPI_BAR_COLORS[item.barColor];

        return (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between rounded-xl border border-home-border/60 bg-[#0E131B]/90 p-3.5 transition-all duration-200 hover:border-home-border hover:shadow-sm"
          >
            {/* Top row: Icon + Label */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                  iconColor,
                )}
              >
                <Icon className="size-3.5" />
              </div>
              <span className="text-[11px] font-medium text-home-muted truncate">
                {item.label}
              </span>
            </div>

            {/* Middle: Value */}
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-white">
                {item.value}
              </div>
            </div>

            {/* Bottom: Trend + Mini Sparkline */}
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <ArrowUp className="size-3 stroke-[2.5]" />
                <span>{item.change}</span>
              </div>

              {/* Sparkline ascending bars */}
              <div className="flex items-end gap-[3px] h-4">
                {item.bars.map((bar, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-[3px] rounded-t-sm transition-all opacity-85 group-hover:opacity-100",
                      barColor,
                    )}
                    style={{ height: `${Math.max(15, (bar / 100) * 16)}px` }}
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
