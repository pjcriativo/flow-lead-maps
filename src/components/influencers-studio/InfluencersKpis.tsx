import React from "react";
import {
  Video,
  Users,
  PlayCircle,
  Eye,
  Heart,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { INFLUENCERS_KPIS, type InfluencerKpiItem } from "./influencers-data";

export const InfluencersKpis: React.FC = () => {
  const getKpiIcon = (id: string) => {
    switch (id) {
      case "videos_gerados":
        return <Video className="w-4 h-4 text-rose-400" />;
      case "avatares_criados":
        return <Users className="w-4 h-4 text-purple-400" />;
      case "minutos_video":
        return <PlayCircle className="w-4 h-4 text-blue-400" />;
      case "visualizacoes":
        return <Eye className="w-4 h-4 text-emerald-400" />;
      case "taxa_engajamento":
        return <Heart className="w-4 h-4 text-orange-400" />;
      case "conversoes":
        return <ShoppingCart className="w-4 h-4 text-teal-400" />;
      default:
        return <Video className="w-4 h-4 text-orange-400" />;
    }
  };

  const getIconWrapper = (id: string) => {
    switch (id) {
      case "videos_gerados":
        return "bg-rose-500/15 border-rose-500/30";
      case "avatares_criados":
        return "bg-purple-500/15 border-purple-500/30";
      case "minutos_video":
        return "bg-blue-500/15 border-blue-500/30";
      case "visualizacoes":
        return "bg-emerald-500/15 border-emerald-500/30";
      case "taxa_engajamento":
        return "bg-orange-500/15 border-orange-500/30";
      case "conversoes":
        return "bg-teal-500/15 border-teal-500/30";
      default:
        return "bg-orange-500/15 border-orange-500/30";
    }
  };

  const getBarColorClass = (barColor: string) => {
    switch (barColor) {
      case "orange":
        return "bg-orange-500";
      case "purple":
        return "bg-purple-500";
      case "blue":
        return "bg-blue-500";
      case "emerald":
        return "bg-emerald-500";
      case "rose":
        return "bg-rose-500";
      case "amber":
        return "bg-amber-500";
      default:
        return "bg-orange-500";
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {INFLUENCERS_KPIS.map((kpi) => (
        <div
          key={kpi.id}
          className="bg-[#101726]/80 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-sm flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-md group"
        >
          {/* Top: Icon + Label */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getIconWrapper(
                kpi.id
              )}`}
            >
              {getKpiIcon(kpi.id)}
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
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>{kpi.change}</span>
              </div>
            </div>

            {/* Sparkline mini bars */}
            <div className="flex items-end gap-0.5 h-7 pb-0.5 shrink-0">
              {kpi.bars.map((heightPercent, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-xs transition-all ${getBarColorClass(
                    kpi.barColor
                  )}`}
                  style={{
                    height: `${Math.max(15, heightPercent * 0.28)}px`,
                    opacity: 0.35 + (idx / kpi.bars.length) * 0.65,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
