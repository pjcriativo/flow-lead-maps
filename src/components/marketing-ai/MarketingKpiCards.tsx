import {
  FileText,
  Landmark,
  Megaphone,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketingKpiItem } from "./marketing-data";

interface MarketingKpiCardsProps {
  kpis: MarketingKpiItem[];
}

const KPI_ICON_MAP: Record<string, LucideIcon> = {
  produtos: Package,
  campanhas: Megaphone,
  leads: Users,
  propostas: FileText,
  vendas: ShoppingCart,
  receita: Landmark,
};

const KPI_COLOR_MAP: Record<
  MarketingKpiItem["color"],
  {
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    barColor: string;
  }
> = {
  orange: {
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/25",
    iconColor: "text-orange-400",
    barColor: "bg-orange-500",
  },
  purple: {
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/25",
    iconColor: "text-purple-400",
    barColor: "bg-purple-500",
  },
  blue: {
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/25",
    iconColor: "text-blue-400",
    barColor: "bg-blue-500",
  },
  teal: {
    iconBg: "bg-teal-500/15",
    iconBorder: "border-teal-500/25",
    iconColor: "text-teal-400",
    barColor: "bg-teal-500",
  },
  amber: {
    iconBg: "bg-amber-500/15",
    iconBorder: "border-amber-500/25",
    iconColor: "text-amber-400",
    barColor: "bg-amber-500",
  },
  rose: {
    iconBg: "bg-rose-500/15",
    iconBorder: "border-rose-500/25",
    iconColor: "text-rose-400",
    barColor: "bg-rose-500",
  },
};

export function MarketingKpiCards({ kpis }: MarketingKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {kpis.map((kpi) => {
        const Icon = KPI_ICON_MAP[kpi.id] || Package;
        const colorConfig = KPI_COLOR_MAP[kpi.color];

        return (
          <div
            key={kpi.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-home-border/80 bg-[#121620]/90 p-3.5 transition-all duration-200 hover:border-home-border hover:shadow-lg hover:shadow-black/40"
          >
            {/* Top: Ícone e Título */}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-7.5 shrink-0 items-center justify-center rounded-lg border",
                  colorConfig.iconBg,
                  colorConfig.iconBorder,
                  colorConfig.iconColor,
                )}
              >
                <Icon className="size-3.5" />
              </div>
              <span className="text-[11px] font-medium text-home-muted truncate">
                {kpi.label}
              </span>
            </div>

            {/* Bottom: Valor + Porcentagem + Mini Gráfico Sparkline */}
            <div className="mt-3 flex items-end justify-between gap-2">
              <div>
                <div className="text-xl font-bold tracking-tight text-white leading-none">
                  {kpi.value}
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <TrendingUp className="size-3" />
                  <span>{kpi.change}</span>
                </div>
              </div>

              {/* Sparkline Bars */}
              <div className="flex items-end gap-1 h-8 pb-0.5">
                {kpi.bars.map((heightPercent, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${Math.max(15, heightPercent)}%` }}
                    className={cn(
                      "w-1 rounded-full transition-all duration-300 opacity-70 group-hover:opacity-100",
                      colorConfig.barColor,
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
