import { FileText, Globe, Link2, Mail, Send, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResultadosKpiItem } from "./resultados-campanha-data";

interface ResultadosKpiCardsProps {
  kpis: ResultadosKpiItem[];
  className?: string;
}

export function ResultadosKpiCards({ kpis, className }: ResultadosKpiCardsProps) {
  const getIcon = (id: string) => {
    switch (id) {
      case "leads":
        return <Users className="size-4 text-orange-400" />;
      case "sites":
        return <FileText className="size-4 text-blue-400" />;
      case "propostas":
        return <Send className="size-4 text-amber-400" />;
      case "abertura":
        return <Mail className="size-4 text-amber-400" />;
      case "cliques":
        return <Link2 className="size-4 text-amber-400" />;
      case "interessados":
        return <Target className="size-4 text-orange-400" />;
      default:
        return <Users className="size-4 text-orange-400" />;
    }
  };

  const getIconBg = (id: string) => {
    switch (id) {
      case "leads":
        return "bg-orange-500/10 border-orange-500/20";
      case "sites":
        return "bg-blue-500/10 border-blue-500/20";
      case "propostas":
        return "bg-amber-500/10 border-amber-500/20";
      case "abertura":
        return "bg-amber-500/10 border-amber-500/20";
      case "cliques":
        return "bg-amber-500/10 border-amber-500/20";
      case "interessados":
        return "bg-orange-500/10 border-orange-500/20";
      default:
        return "bg-orange-500/10 border-orange-500/20";
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6",
        className,
      )}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="flex flex-col justify-between rounded-2xl border border-home-border bg-home-surface/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface"
        >
          {/* Topo do Card: Ícone + Título */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl border",
                getIconBg(kpi.id),
              )}
            >
              {getIcon(kpi.id)}
            </div>
            <span className="text-xs font-semibold text-home-muted truncate">
              {kpi.label}
            </span>
          </div>

          {/* Valor Principal + Badge de Variação */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white tabular-nums">
              {kpi.value}
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {kpi.growth}
            </span>
          </div>

          {/* Subtítulo / Contexto */}
          <div className="mt-1 text-[11px] text-home-muted/80">
            {kpi.context}
          </div>
        </div>
      ))}
    </div>
  );
}
