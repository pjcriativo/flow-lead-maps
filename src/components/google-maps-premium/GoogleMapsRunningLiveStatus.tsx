import { Activity, CheckCircle2, CircleAlert } from "lucide-react";

interface GoogleMapsRunningLiveStatusProps {
  status: string;
  running: boolean;
  lastUpdate: string;
}

export function GoogleMapsRunningLiveStatus({
  status,
  running,
  lastUpdate,
}: GoogleMapsRunningLiveStatusProps) {
  const interrupted = /erro|falha|interromp|parcial/i.test(status);
  const title = running
    ? "Pesquisa em andamento"
    : interrupted
      ? "Pesquisa finalizada parcialmente"
      : "Pesquisa concluída";
  const description = running
    ? "A busca continua em segundo plano. Os resultados aparecem abaixo conforme são encontrados."
    : interrupted
      ? "Os resultados já encontrados foram preservados e continuam disponíveis."
      : "Os resultados estão prontos para análise.";
  const StatusIcon = running ? Activity : interrupted ? CircleAlert : CheckCircle2;

  return (
    <div className="flex h-full flex-col space-y-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-home-border/60 pb-3">
        <Activity className="size-4 text-home-orange" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Status em tempo real
        </h3>
      </div>

      <div className="flex flex-1 flex-col justify-center rounded-xl border border-home-border/70 bg-home-surface p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <StatusIcon className={running ? "size-4 animate-pulse" : "size-4"} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-[11px] leading-relaxed text-home-muted">{description}</p>
          </div>
        </div>

        <p className="mt-4 border-t border-home-border/60 pt-3 text-[10px] text-home-muted">
          Última atualização: {lastUpdate || "Agora"}
        </p>
      </div>
    </div>
  );
}
