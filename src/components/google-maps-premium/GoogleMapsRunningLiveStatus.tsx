import { Activity, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleMapsRunningLiveStatusProps {
  status: string;
  logs: string[];
  running: boolean;
  lastUpdate: string;
}

export function GoogleMapsRunningLiveStatus({
  status,
  logs,
  running,
  lastUpdate,
}: GoogleMapsRunningLiveStatusProps) {
  // Categoriza a cor do marcador baseado no conteúdo do log
  const getLogDotColor = (msg: string) => {
    const l = msg.toLowerCase();
    if (
      l.includes("inédito") ||
      l.includes("encontrado") ||
      l.includes("concluíd") ||
      l.includes("vinculad")
    ) {
      return "bg-emerald-400";
    }
    if (
      l.includes("duplicat") ||
      l.includes("já pertenci") ||
      l.includes("já existe") ||
      l.includes("ignorado")
    ) {
      return "bg-amber-400";
    }
    if (l.includes("enriquec") || l.includes("site") || l.includes("e-mail") || l.includes("↳")) {
      return "bg-home-orange";
    }
    if (l.includes("erro") || l.includes("falha") || l.includes("✖")) {
      return "bg-red-400";
    }
    return "bg-blue-400";
  };

  return (
    <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 space-y-3.5 shadow-sm backdrop-blur-md flex flex-col h-full max-h-96">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-home-border/60 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-home-orange" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Status em tempo real
          </h3>
        </div>
      </div>

      {/* Badge de status ativo com última atualização */}
      <div className="rounded-xl border border-home-border/70 bg-[#101720] p-2.5 space-y-1 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              running ? "bg-emerald-400 animate-pulse" : "bg-home-muted",
            )}
          />
          <span className="text-xs font-bold text-white truncate">{status}</span>
        </div>
        <div className="text-[10px] text-home-muted pl-4">
          Última atualização: {lastUpdate || "Agora"}
        </div>
      </div>

      {/* Lista de eventos do stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs scrollbar-thin scrollbar-thumb-home-border">
        {logs.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-center text-[11px] text-home-muted">
            <Activity className="size-5 mb-1.5 text-home-muted/50 animate-pulse" />
            <span>Aguardando eventos da execução...</span>
          </div>
        ) : (
          logs.map((log, index) => {
            // Separa timestamp entre colchetes se existir, ex: "[10:42:15] ..."
            const match = log.match(/^\[(.*?)\]\s*(.*)$/);
            const time = match ? match[1] : "";
            const message = match ? match[2] : log;
            const dotColor = getLogDotColor(message);

            return (
              <div
                key={index}
                className="flex items-start gap-2 text-[11px] leading-snug animate-in fade-in-50 duration-200"
              >
                {time && (
                  <span className="text-[10px] text-home-muted/70 shrink-0 font-mono">
                    {time.slice(0, 5)}
                  </span>
                )}
                <span className={cn("size-1.5 rounded-full mt-1.5 shrink-0", dotColor)} />
                <span className="text-home-foreground/90 break-words">{message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
