import { Eye, Globe, Link2, Mail, Send, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RECENT_ACTIVITIES, type ActivityItem } from "./resultados-campanha-data";

interface ResultadosActivityTimelineProps {
  activities?: ActivityItem[];
  className?: string;
}

export function ResultadosActivityTimeline({
  activities = RECENT_ACTIVITIES,
  className,
}: ResultadosActivityTimelineProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "enviada":
        return <Send className="size-3.5 text-orange-400" />;
      case "aberto":
        return <Eye className="size-3.5 text-emerald-400" />;
      case "clique":
        return <Link2 className="size-3.5 text-blue-400" />;
      case "interessado":
        return <Target className="size-3.5 text-amber-400" />;
      case "publicado":
        return <Globe className="size-3.5 text-cyan-400" />;
      default:
        return <Mail className="size-3.5 text-orange-400" />;
    }
  };

  const getIconContainerStyle = (type: ActivityItem["type"]) => {
    switch (type) {
      case "enviada":
        return "border-orange-500/20 bg-orange-500/10";
      case "aberto":
        return "border-emerald-500/20 bg-emerald-500/10";
      case "clique":
        return "border-blue-500/20 bg-blue-500/10";
      case "interessado":
        return "border-amber-500/20 bg-amber-500/10";
      case "publicado":
        return "border-cyan-500/20 bg-cyan-500/10";
      default:
        return "border-home-border bg-home-surface";
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between",
        className,
      )}
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-white tracking-tight">
          Últimas atividades
        </h2>
        <button
          type="button"
          onClick={() => toast.info("Histórico completo de eventos em breve")}
          className="text-xs text-home-muted hover:text-white transition-colors cursor-pointer"
        >
          Ver todos
        </button>
      </div>

      {/* Lista de Atividades */}
      <div className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg border shadow-sm",
                  getIconContainerStyle(act.type),
                )}
              >
                {getActivityIcon(act.type)}
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-white truncate">
                  {act.title}
                </div>
                <div className="text-[11px] text-home-muted truncate">
                  {act.leadName} • {act.city} - {act.uf}
                </div>
              </div>
            </div>

            <span className="text-[10px] text-home-muted shrink-0 tabular-nums">
              {act.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
