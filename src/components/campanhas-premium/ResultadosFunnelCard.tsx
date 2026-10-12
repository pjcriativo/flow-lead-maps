import { FileText, Link2, Mail, Send, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FUNNEL_STAGES, type FunnelStageItem } from "./resultados-campanha-data";

interface ResultadosFunnelCardProps {
  stages?: FunnelStageItem[];
  className?: string;
}

export function ResultadosFunnelCard({
  stages = FUNNEL_STAGES,
  className,
}: ResultadosFunnelCardProps) {
  const getStageIcon = (id: string) => {
    switch (id) {
      case "leads":
        return <Users className="size-3.5 text-orange-400" />;
      case "sites":
        return <FileText className="size-3.5 text-sky-400" />;
      case "enviadas":
        return <Send className="size-3.5 text-emerald-400" />;
      case "aberturas":
        return <Mail className="size-3.5 text-purple-400" />;
      case "cliques":
        return <Link2 className="size-3.5 text-rose-400" />;
      case "interessados":
        return <Target className="size-3.5 text-yellow-400" />;
      default:
        return <Users className="size-3.5 text-orange-400" />;
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
      <div className="mb-4">
        <h2 className="text-base font-bold text-white tracking-tight">
          Funil de conversão
        </h2>
        <p className="mt-0.5 text-xs text-home-muted">
          Acompanhe a jornada dos leads nesta campanha.
        </p>
      </div>

      {/* Lista dos 6 Estágios com Barras Proporcionais */}
      <div className="space-y-3.5">
        {stages.map((stage) => {
          // Converte percentual para largura CSS
          const widthStr = stage.percentage.replace(",", ".");
          return (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {getStageIcon(stage.id)}
                  </span>
                  <span className="font-bold text-white tabular-nums">
                    {stage.value}
                  </span>
                  <span className="text-home-muted truncate text-[11px]">
                    {stage.label}
                  </span>
                </div>
                <span className="font-bold text-white text-[11px] tabular-nums">
                  {stage.percentage}
                </span>
              </div>

              {/* Barra de Progresso Horizontal */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-home-background">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: widthStr,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
