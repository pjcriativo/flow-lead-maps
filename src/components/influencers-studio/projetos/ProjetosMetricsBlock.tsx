import React from "react";
import {
  Video,
  User,
  PlayCircle,
  Eye,
  AlertOctagon,
  HardDrive,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PROJETOS_KPIS, type ProjetoKpiItem } from "./projetos-data";

export const ProjetosMetricsBlock: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "video":
        return <Video className="w-4 h-4 text-rose-400" />;
      case "users":
        return <User className="w-4 h-4 text-purple-400" />;
      case "processing":
        return <PlayCircle className="w-4 h-4 text-sky-400" />;
      case "completed":
        return <Eye className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case "storage":
        return <HardDrive className="w-4 h-4 text-amber-400" />;
      default:
        return <Video className="w-4 h-4 text-orange-400" />;
    }
  };

  const getBarColorClass = (barColor: string) => {
    switch (barColor) {
      case "orange":
        return "bg-orange-500";
      case "purple":
        return "bg-purple-500";
      case "blue":
        return "bg-sky-500";
      case "emerald":
        return "bg-emerald-500";
      case "amber":
        return "bg-amber-500";
      case "rose":
        return "bg-rose-500";
      default:
        return "bg-orange-500";
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {PROJETOS_KPIS.map((kpi) => {
        const isUp = kpi.trend === "up";

        return (
          <div
            key={kpi.id}
            className="bg-[#101726]/80 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-md group"
          >
            {/* Top: Icon + Label */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${kpi.iconBg}`}
              >
                {getIcon(kpi.iconName)}
              </div>
              <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                {kpi.label}
              </span>
            </div>

            {/* Bottom: Big Value + Trend + Mini Sparkline Bars */}
            <div className="flex items-end justify-between gap-2 mt-1">
              <div>
                <div className="text-xl font-extrabold text-white tracking-tight">
                  {kpi.value}
                </div>
                <div
                  className={`flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${
                    isUp ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                  )}
                  <span>{kpi.change}</span>
                </div>
              </div>

              {/* Sparkline mini bars */}
              <div className="flex items-end gap-1 h-7 pb-0.5 shrink-0">
                {kpi.bars.map((heightPercent, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-xs transition-all ${getBarColorClass(
                      kpi.barColor
                    )}`}
                    style={{
                      height: `${Math.max(12, heightPercent * 0.26)}px`,
                      opacity: 0.4 + (idx / kpi.bars.length) * 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
