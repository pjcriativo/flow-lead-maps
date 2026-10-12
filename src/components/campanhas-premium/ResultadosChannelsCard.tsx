import { cn } from "@/lib/utils";
import { CHANNELS_DATA, type ChannelItem } from "./resultados-campanha-data";

interface ResultadosChannelsCardProps {
  channels?: ChannelItem[];
  totalEnvios?: number;
  className?: string;
}

export function ResultadosChannelsCard({
  channels = CHANNELS_DATA,
  totalEnvios = 145,
  className,
}: ResultadosChannelsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between",
        className,
      )}
    >
      {/* Título do Card */}
      <div className="mb-3">
        <h2 className="text-base font-bold text-white tracking-tight">
          Canais da campanha
        </h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut Chart SVG */}
        <div className="relative flex size-28 shrink-0 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            {/* Background Circle */}
            <circle
              cx="18"
              cy="18"
              r="14.5"
              fill="none"
              stroke="#27272A"
              strokeWidth="4"
            />
            {/* Active Segment (E-mail 100%) */}
            <circle
              cx="18"
              cy="18"
              r="14.5"
              fill="none"
              stroke="#F97316"
              strokeWidth="4"
              strokeDasharray="91 9"
              strokeDashoffset="0"
              strokeLinecap="round"
            />
          </svg>

          {/* Texto Central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-white tabular-nums leading-none">
              {totalEnvios}
            </span>
            <span className="mt-1 text-[9px] text-home-muted font-medium">
              Envios totais
            </span>
          </div>
        </div>

        {/* Lista de Canais */}
        <div className="flex-1 space-y-1.5 text-xs">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: ch.color }}
                />
                <span className="text-home-muted">{ch.label}</span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="font-semibold text-white">{ch.count}</span>
                <span className="w-8 text-right text-home-muted">
                  {ch.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
